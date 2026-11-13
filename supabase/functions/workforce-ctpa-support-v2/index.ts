import {createClient} from "npm:@supabase/supabase-js@2";
const id=x=>typeof x==="string"&&/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(x);
const str=(x,n=8000)=>String(x??"").trim().slice(0,n);
const escape=x=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
Deno.serve(async req=>{
const headers={"Access-Control-Allow-Origin":"https://ctpa.screenings4u.com","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Content-Type":"application/json","Cache-Control":"no-store"};
const respond=(data,s=200)=>new Response(JSON.stringify(data),{headers,status:s});
if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
if(req.method!=="POST")return respond({error:"Method not supported"},405);
try{
const url=Deno.env.get("SUPABASE_URL")||"",pub=Deno.env.get("SUPABASE_ANON_KEY")||"",secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
if(!url||!pub||!secret)return respond({error:"Support service unavailable"},503);
const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,""),client=createClient(url,pub,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:{user},error:authError}=await client.auth.getUser(token);
if(authError||!user?.id||!user.email_confirmed_at)return respond({error:"Sign in required"},401);
const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const body=await req.json().catch(()=>({})),action=str(body.action,30),tenant=body.tenant_id,context=body.operating_context==="nondot"?"nondot":"dot";
if(!id(tenant))return respond({error:"C/TPA organization is required"},400);
const member=await db.from("workforce_unified_records").select("id").eq("kind","membership").eq("tenant_id",tenant).eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).maybeSingle();
if(member.error)throw member.error;if(!member.data)return respond({error:"You are not authorized for this C/TPA account"},403);
const ticketTable=db.from("workforce_ctpa_support_tickets_v2"),messageTable=db.from("workforce_ctpa_support_messages_v2");
const online=async()=>{
const threshold=new Date(Date.now()-90000).toISOString();
const r=await db.from("workforce_admin_presence_v2").select("user_id").gte("heartbeat_at",threshold).limit(1);
if(r.error)throw r.error;return !!r.data?.length;
};
async function notify(eventId,subject,preview){
 const emailAddress=str(user.email,250).toLowerCase();
 const staff=await db.from("staff_profiles").select("user_id").eq("employment_status","active").limit(100);
 if(staff.error)throw staff.error;
 let sent=0;
 for(const p of staff.data||[]){
  const role=await db.from("staff_role_assignments").select("id").eq("user_id",p.user_id).eq("active",true).limit(1);
  const unit=await db.from("staff_business_access").select("id").eq("user_id",p.user_id).eq("active",true).in("business_unit_code",["workforce","dot"]).limit(1);
  if(role.error||unit.error)throw role.error||unit.error;
  if(!role.data?.length||!unit.data?.length)continue;
  const a=await db.auth.admin.getUserById(p.user_id);
  const target=str(a.data?.user?.email,240).toLowerCase();
  if(!target||target===emailAddress)continue;
  const dedupe="support:"+eventId+":staff:"+p.user_id;
  const record=await db.from("workforce_mail_delivery_v2").upsert({dedupe_key:dedupe,kind:"support",recipient:target,subject,status:"pending"},{onConflict:"dedupe_key",ignoreDuplicates:true}).select("id").maybeSingle();
  if(record.error)throw record.error;
  const emailKey=Deno.env.get("RESEND_API_KEY")||"",from=Deno.env.get("WORKFORCE_EMAIL_FROM")||"";
  if(!emailKey||!from)continue;
  if(!record.data)continue;
  try{
   const result=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+emailKey,"Content-Type":"application/json","Idempotency-Key":dedupe},body:JSON.stringify({from,to:[target],subject:"Workforce Support: "+subject,html:'<div style="background:#01122F;padding:20px;text-align:center;color:white;font-size:24px;font-weight:bold">Workforce</div><div style="padding:24px;font-family:Arial,sans-serif"><h2>New C/TPA support message</h2><p>'+escape(preview.slice(0,400))+'</p><p><a href="https://app.screenings4u.com/ctpa-support-management.html">View Support Inbox</a></p></div>'})});
   const resultBody=await result.json().catch(()=>({}));
   const update=await db.from("workforce_mail_delivery_v2").update({status:result.ok?"sent":"failed",attempt_count:1,provider_message_id:resultBody.id||null,last_error:result.ok?null:str(resultBody.message||"Provider rejected message",300),updated_at:new Date().toISOString()}).eq("id",record.data.id);
   if(update.error)console.error(update.error);
   if(result.ok)sent++;
  }catch(e){console.error("support email delivery",e)}
 }
 return sent;
}
if(action==="presence")return respond({ok:true,online:await online()});
if(action==="list"){
 const r=await ticketTable.select("id,subject,category,priority,status,operating_context,source_notice_id,created_at,updated_at,last_message_at").eq("tenant_id",tenant).order("last_message_at",{ascending:false}).limit(150);
 if(r.error)throw r.error;
 return respond({ok:true,tickets:r.data||[],online:await online()});
}
if(action==="create"){
 const subject=str(body.subject,220),message=str(body.message,8000),priority=["normal","high","urgent"].includes(body.priority)?body.priority:"normal",category=["general","billing","testing","account","technical","compliance"].includes(body.category)?body.category:"general";
 if(!subject||!message)return respond({error:"Enter a ticket subject and message"},400);
 let source_notice_id=null;
 if(body.source_notice_id){
  if(!id(body.source_notice_id))return respond({error:"Invalid source notification"},400);
  const n=await db.from("workforce_ctpa_platform_notices").select("id,reply_enabled").eq("id",body.source_notice_id).eq("tenant_id",tenant).eq("status","published").maybeSingle();
  if(n.error)throw n.error;if(!n.data?.reply_enabled)return respond({error:"This notice cannot receive replies"},403);source_notice_id=n.data.id;
 }
 const ticket=await ticketTable.insert({tenant_id:tenant,operating_context:context,subject,category,priority,created_by:user.id,source_notice_id}).select("id").single();
 if(ticket.error)throw ticket.error;
 const msg=await messageTable.insert({ticket_id:ticket.data.id,sender_id:user.id,sender_type:"ctpa",body:message}).select("id").single();
 if(msg.error)throw msg.error;
 const emails=await notify(msg.data.id,subject,message).catch(e=>{console.error("notify admin",e);return 0});
 return respond({ok:true,id:ticket.data.id,staff_emails_sent:emails});
}
if(!id(body.ticket_id))return respond({error:"Choose a support ticket"},400);
const t=await ticketTable.select("id,subject,status,operating_context,source_notice_id").eq("tenant_id",tenant).eq("id",body.ticket_id).maybeSingle();
if(t.error)throw t.error;if(!t.data)return respond({error:"Ticket not found"},404);
if(action==="history"){
 const r=await messageTable.select("id,body,sender_id,sender_type,created_at").eq("ticket_id",t.data.id).order("created_at",{ascending:true}).limit(350);
 if(r.error)throw r.error;return respond({ok:true,ticket:t.data,messages:r.data||[],online:await online()});
}
if(action==="send"){
 if(t.data.status==="closed")return respond({error:"Closed tickets cannot receive messages"},409);
 const message=str(body.message,8000);if(!message)return respond({error:"Enter a message"},400);
 const msg=await messageTable.insert({ticket_id:t.data.id,sender_id:user.id,sender_type:"ctpa",body:message}).select("id").single();
 if(msg.error)throw msg.error;
 const update=await ticketTable.update({last_message_at:new Date().toISOString(),updated_at:new Date().toISOString(),status:"open"}).eq("id",t.data.id);
 if(update.error)throw update.error;
 const emails=await notify(msg.data.id,t.data.subject,message).catch(e=>{console.error(e);return 0});
 return respond({ok:true,staff_emails_sent:emails});
}
return respond({error:"Unknown support operation"},400);
}catch(e){console.error("[Workforce CTPA Support]",e);return respond({error:"Unable to complete support request"},500)}
});