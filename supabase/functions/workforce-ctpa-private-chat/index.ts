import {createClient} from "npm:@supabase/supabase-js@2";
const uuid=x=>typeof x==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const trim=(x,n)=>String(x??"").trim().slice(0,n);
Deno.serve(async req=>{
 const origins=["https://ctpa.screenings4u.com","https://ctpa-employer-dot.screenings4u.com","https://employer-non-dot.screenings4u.com","https://owner-operator.screenings4u.com"];
 const origin=req.headers.get("origin")||"",headers={"Access-Control-Allow-Origin":origins.includes(origin)?origin:"https://ctpa.screenings4u.com","Vary":"Origin","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
 const send=(o,s=200)=>new Response(JSON.stringify(o),{headers,status:s});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});if(req.method!=="POST")return send({error:"POST required"},405);
 try{
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!anon||!secret)return send({error:"Private messaging is unavailable"},503);
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
 const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await auth.auth.getUser(token);
 if(error||!user?.id||!user.email_confirmed_at)return send({error:"Sign in required"},401);
 const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const body=await req.json().catch(()=>({})),action=trim(body.action,30);
 let tenant=body.tenant_id;
 const context=body.operating_context==="nondot"?"nondot":"dot";
 const external=body.portal_type==="employer"||body.portal_type==="owner_operator";
 const email=trim(user.email,240).toLowerCase();

 let authorized=false;
 if(!external){
  const membership=await db.from("workforce_unified_records").select("tenant_id").eq("kind","membership").eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).limit(30);
  if(membership.error)throw membership.error;
  const allowedTenants=[...new Set((membership.data||[]).map(row=>row.tenant_id))].filter(uuid);
  if(!uuid(tenant)){
   if(allowedTenants.length!==1)return send({error:"Choose the C/TPA organization for your conversation"},400);
   tenant=allowedTenants[0];
  }
  authorized=allowedTenants.includes(tenant);
  if(!authorized)return send({error:"You do not have access to this C/TPA's messages"},403);
 }else{
  const access=await db.from("workforce_portal_user_access").select("portal_code,organization_id").eq("user_id",user.id).eq("enabled",true).in("portal_code",body.portal_type==="owner_operator"?["owner_operator_workforce","owner_operator","ctpa_owner_operator_workforce"]:["employer_workforce","ctpa_employer_workforce","ctpa_employer_dot","employer_dot","employer_nondot"]).limit(50);
  if(access.error)throw access.error;
  if(!access.data?.length)return send({error:"Authorized employer or owner-operator account required"},403);
 }
 const t=db.from("workforce_ctpa_private_threads"),participants=db.from("workforce_ctpa_private_participants"),messages=db.from("workforce_ctpa_private_messages");
 const partnerName=x=>x?.data?.legal_name||x?.data?.name||"Employer or owner-operator";
 const partnerEmail=x=>trim(x?.data?.contact_email||x?.data?.email||x?.data?.billing_email,240).toLowerCase();
 async function verifiedPartner(rec,requestedTenant){
  if(!rec||rec.tenant_id!==requestedTenant||!["employers","owner_operators"].includes(rec.kind))return false;
  return partnerEmail(rec)===email;
 }
 async function customerRows(){
  const kinds=body.portal_type==="owner_operator"?["owner_operators"]:["employers"];
  const results=[];
  for(const kind of kinds){
   const r=await db.from("workforce_unified_records").select("id,tenant_id,kind,operating_context,data").eq("kind",kind).or(`data->>contact_email.eq.${email},data->>email.eq.${email},data->>billing_email.eq.${email}`).is("archived_at",null).limit(100);
   if(r.error)throw r.error;results.push(...(r.data||[]));
  }
  return results;
 }
 async function availableThreads(){
  if(!external){
   const r=await t.select("*").eq("tenant_id",tenant).order("last_message_at",{ascending:false}).limit(250);if(r.error)throw r.error;
   const validThreads=[];
   for(const th of r.data||[]){
    const p=await participants.select("id").eq("thread_id",th.id).eq("user_id",user.id).maybeSingle();
    if(p.error)throw p.error;
    if(p.data)validThreads.push(th);
    else{
     const ins=await participants.insert({thread_id:th.id,user_id:user.id,participant_role:"ctpa",linked_by:user.id});
     if(ins.error&&ins.error.code!=="23505")throw ins.error;validThreads.push(th);
    }
   }
   return validThreads;
  }
  const matches=await customerRows();
  if(!matches.length)return [];
  const all=[];
  for(const r of matches){
   const threads=await t.select("*").eq("tenant_id",r.tenant_id).eq("recipient_record_id",r.id).order("last_message_at",{ascending:false}).limit(30);
   if(threads.error)throw threads.error;
   for(const th of threads.data||[]){
    if(!await verifiedPartner(r,th.tenant_id))continue;
    const added=await participants.upsert({thread_id:th.id,user_id:user.id,participant_role:r.kind==="owner_operators"?"owner_operator":"employer",linked_by:user.id},{onConflict:"thread_id,user_id"});
    if(added.error)throw added.error;all.push(th);
   }
  }
  return all;
 }
 async function accessThread(id){
  if(!uuid(id))return null;
  const r=await t.select("*").eq("id",id).maybeSingle();if(r.error)throw r.error;
  if(!r.data)return null;
  const th=r.data;
  if(!external){
   if(th.tenant_id!==tenant)return null;
   const p=await participants.select("id").eq("thread_id",id).eq("user_id",user.id).maybeSingle();
   if(p.error)throw p.error;if(!p.data)return null;
   return th;
  }
  const rows=await customerRows();
  const match=rows.find(x=>x.id===th.recipient_record_id&&x.tenant_id===th.tenant_id);
  if(!match||!await verifiedPartner(match,th.tenant_id))return null;
  const p=await participants.upsert({thread_id:th.id,user_id:user.id,participant_role:match.kind==="owner_operators"?"owner_operator":"employer",linked_by:user.id},{onConflict:"thread_id,user_id"});
  if(p.error)throw p.error;return th;
 }
 if(action==="recipients"){
  if(external)return send({error:"Only a C/TPA can start a conversation"},403);
  const r=await db.from("workforce_unified_records").select("id,tenant_id,kind,operating_context,data").eq("tenant_id",tenant).in("kind",["employers","owner_operators"]).is("archived_at",null).limit(500);
  if(r.error)throw r.error;
  return send({ok:true,recipients:(r.data||[]).map(x=>({id:x.id,kind:x.kind,operating_context:x.operating_context,name:partnerName(x),ready:!!partnerEmail(x)})).sort((a,b)=>a.name.localeCompare(b.name))});
 }
 if(action==="list"){
  const rows=await availableThreads();
  const output=[];
  for(const th of rows){
   const recipient=await db.from("workforce_unified_records").select("data").eq("id",th.recipient_record_id).eq("tenant_id",th.tenant_id).maybeSingle();
   if(recipient.error)throw recipient.error;
   const last=await messages.select("body,created_at,sender_user_id").eq("thread_id",th.id).order("created_at",{ascending:false}).limit(1);
   if(last.error)throw last.error;
   output.push({id:th.id,tenant_id:th.tenant_id,subject:th.subject,context:th.operating_context,name:partnerName(recipient.data),kind:th.recipient_kind,last_message:last.data?.[0]||null,last_message_at:th.last_message_at});
  }
  return send({ok:true,threads:output,user_id:user.id});
 }
 if(action==="start"){
  if(external)return send({error:"Start conversations from your C/TPA portal"},403);
  if(!uuid(body.recipient_id))return send({error:"Select an employer or owner-operator"},400);
  const recipient=await db.from("workforce_unified_records").select("id,tenant_id,kind,operating_context,data").eq("id",body.recipient_id).eq("tenant_id",tenant).in("kind",["employers","owner_operators"]).is("archived_at",null).maybeSingle();
  if(recipient.error)throw recipient.error;if(!recipient.data)return send({error:"Recipient is not associated with your C/TPA workspace"},404);
  if(!partnerEmail(recipient.data))return send({error:"The recipient must have an account email before private messaging can begin"},409);
  const recipientContext=["dot","nondot"].includes(recipient.data.operating_context)?recipient.data.operating_context:context;
  const existing=await t.select("id").eq("tenant_id",tenant).eq("recipient_record_id",recipient.data.id).eq("operating_context",recipientContext).maybeSingle();
  if(existing.error)throw existing.error;
  let id=existing.data?.id;
  if(!id){
   const insert=await t.insert({tenant_id:tenant,recipient_record_id:recipient.data.id,recipient_kind:recipient.data.kind,operating_context:recipientContext,subject:trim(body.subject,140)||"Conversation",created_by:user.id}).select("id").single();
   if(insert.error){if(insert.error.code==="23505"){const conflict=await t.select("id").eq("tenant_id",tenant).eq("recipient_record_id",recipient.data.id).eq("operating_context",recipientContext).single();if(conflict.error)throw conflict.error;id=conflict.data.id;}else throw insert.error}
   else id=insert.data.id;
  }
  const link=await participants.upsert({thread_id:id,user_id:user.id,participant_role:"ctpa",linked_by:user.id},{onConflict:"thread_id,user_id"});
  if(link.error)throw link.error;
  return send({ok:true,id});
 }
 if(!["history","send","read"].includes(action))return send({error:"Unknown messaging operation"},400);
 const thread=await accessThread(body.thread_id);
 if(!thread)return send({error:"Conversation access denied"},403);
 if(action==="history"){
  const r=await messages.select("id,thread_id,sender_user_id,body,created_at").eq("thread_id",thread.id).order("created_at",{ascending:true}).limit(400);if(r.error)throw r.error;
  return send({ok:true,messages:r.data||[],user_id:user.id});
 }
 if(action==="read"){
  const r=await participants.update({read_at:new Date().toISOString()}).eq("thread_id",thread.id).eq("user_id",user.id);if(r.error)throw r.error;return send({ok:true});
 }
 const bodyText=trim(body.message,4000);if(!bodyText)return send({error:"Enter a message"},400);
 const saved=await messages.insert({thread_id:thread.id,sender_user_id:user.id,body:bodyText}).select("id,created_at").single();
 if(saved.error)throw saved.error;
 const updated=await t.update({last_message_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",thread.id);
 if(updated.error)throw updated.error;
 return send({ok:true,message:saved.data});
 }catch(e){console.error("[Private CTPA chat]",e);return send({error:"Private messaging request failed"},500)}
});