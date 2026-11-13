import { createClient } from "npm:@supabase/supabase-js@2";
const allowedOrigin = "https://ctpa.screenings4u.com";
const ALLOWED = new Set([
 "employers","owner_operators","people","programs","pools","selections",
 "testing_orders","testing_documents","results","compliance","documents",
 "reports","occupational_health","notifications","messages","locations",
 "invoices","billing","subscriptions","orders","price_list","services",
 "integrations","audits","audit_history","lab_accounts","lab_clients",
 "lab_orders","lab_tracking","lab_results","lab_documents","lab_billing",
 "lab_supplies","lab_analytics","lab_delivery","lab_alerts","lab_benefits",
 "lab_consortiums","policies","enrollments","clearinghouse","return_to_duty",
 "staff","support","demo_sessions"
]);
const uuid=(v:unknown)=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const text=(v:unknown,max=160)=>String(v??"").trim().slice(0,max);
const payload=(x:unknown)=>x&&typeof x==="object"&&!Array.isArray(x)?x as Record<string,unknown>:null;
Deno.serve(async request=>{
 const origin=request.headers.get("origin")||"";
 const headers={
  "Access-Control-Allow-Origin":origin===allowedOrigin?origin:allowedOrigin,
  "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
  "Access-Control-Allow-Methods":"POST,OPTIONS",
  "Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"
 };
 const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(request.method!=="POST")return respond({error:"POST required"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")||"";
  const anon=Deno.env.get("SUPABASE_ANON_KEY")||"";
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!url||!anon||!service)return respond({error:"Unified application is not configured"},503);
  const token=(request.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!token)return respond({error:"Sign-in required"},401);
  const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await auth.auth.getUser(token);
  if(authError||!user?.id||!user.email_confirmed_at)return respond({error:"Verified account required"},401);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const body=payload(await request.json().catch(()=>null));
  if(!body)return respond({error:"Invalid request"},400);
  const action=text(body.action,30);
  const collection=db.from("workforce_unified_records");
  if(action==="bootstrap"){
   const members=await collection.select("tenant_id,data")
    .eq("kind","membership").eq("data->>user_id",user.id)
    .eq("data->>status","active").is("archived_at",null).limit(100);
   if(members.error)throw members.error;
   const tenantIds=[...new Set((members.data||[]).map((m:any)=>m.tenant_id))];
   if(!tenantIds.length)return respond({ok:true,workspaces:[]});
   const orgs=await db.from("workforce_unified_records").select("tenant_id,data")
    .eq("kind","organization").in("tenant_id",tenantIds).is("archived_at",null);
   if(orgs.error)throw orgs.error;
   const byTenant=new Map((orgs.data||[]).map((row:any)=>[row.tenant_id,row.data]));
   const workspaces=(members.data||[]).filter((m:any)=>byTenant.has(m.tenant_id))
    .map((m:any)=>({tenant_id:m.tenant_id,name:byTenant.get(m.tenant_id)?.name||"Organization",role:m.data.role||"viewer"}));
   return respond({ok:true,workspaces});
  }
  if(action==="create_workspace"){
   const name=text(body.name,120);
   if(name.length<2)return respond({error:"Enter an organization name"},400);
   const tenantId=crypto.randomUUID(),now=new Date().toISOString();
   const org={tenant_id:tenantId,kind:"organization",operating_context:"shared",data:{name,status:"active",created_at:now},created_by:user.id,updated_by:user.id};
   const owner={tenant_id:tenantId,kind:"membership",operating_context:"shared",data:{user_id:user.id,role:"owner",status:"active"},created_by:user.id,updated_by:user.id};
   const inserted=await collection.insert([org,owner]).select("id");
   if(inserted.error)throw inserted.error;
   return respond({ok:true,tenant_id:tenantId});
  }
  const tenantId=body.tenant_id;
  if(!uuid(tenantId))return respond({error:"Select an organization"},400);
  // Every request independently verifies membership in THIS new record store.
  // No legacy table, function, subscription or workspace is consulted.
  const member=await collection.select("id,data").eq("tenant_id",tenantId)
   .eq("kind","membership").eq("data->>user_id",user.id)
   .eq("data->>status","active").is("archived_at",null).maybeSingle();
  if(member.error)throw member.error;
  if(!member.data)return respond({error:"Organization access denied"},403);
  const role=text(member.data.data?.role,20);
  const canWrite=["owner","admin","editor"].includes(role);
  const context=body.operating_context==="nondot"?"nondot":"dot";
  if(action==="list"){
   const kind=text(body.kind,64);
   if(kind!=="all"&&!ALLOWED.has(kind))return respond({error:"Unknown application module"},400);
   let query=collection.select("id,kind,operating_context,data,created_at,updated_at")
    .eq("tenant_id",tenantId).is("archived_at",null)
    .in("operating_context",[context,"shared"])
    .order("updated_at",{ascending:false}).limit(1000);
   if(kind==="all")query=query.in("kind",[...ALLOWED]);
   else query=query.eq("kind",kind);
   const result=await query;
   if(result.error)throw result.error;
   return respond({ok:true,tenant_id:tenantId,operating_context:context,records:result.data||[],limit:1000});
  }
  if(!canWrite)return respond({error:"Your role is read only"},403);
  if(action==="save"){
   const kind=text(body.kind,64);
   if(!ALLOWED.has(kind))return respond({error:"Unknown application module"},400);
   const data=payload(body.data);
   if(!data||Object.keys(data).length>40||JSON.stringify(data).length>60000)
    return respond({error:"Invalid or oversized record"},400);
   const allowedContext=body.record_context==="shared"?"shared":context;
   if(allowedContext==="shared"&&role==="editor")return respond({error:"Shared records require an administrator"},403);
   // Never accept tenant, privilege, or actor fields from the record payload.
   const clean=Object.fromEntries(Object.entries(data).filter(([k,v])=>
    /^[a-z][a-z0-9_]{0,63}$/.test(k)&&
    !["tenant_id","user_id","role","permissions","created_by","updated_by","operating_context"].includes(k)&&
    (v===null||typeof v==="string"||typeof v==="number"||typeof v==="boolean")));
   if(!Object.keys(clean).length)return respond({error:"Nothing to save"},400);
   const id=body.id;
   if(id){
    if(!uuid(id))return respond({error:"Invalid record"},400);
    const existing=await collection.select("id,data,operating_context").eq("id",id)
     .eq("tenant_id",tenantId).eq("kind",kind).is("archived_at",null).maybeSingle();
    if(existing.error)throw existing.error;
    if(!existing.data||![context,"shared"].includes(existing.data.operating_context))
     return respond({error:"Record not found in this operating context"},404);
    if(existing.data.operating_context==="shared"&&role==="editor")
     return respond({error:"Shared records require an administrator"},403);
    const merged={...existing.data.data,...clean};
    const updated=await collection.update({data:merged,updated_at:new Date().toISOString(),updated_by:user.id})
     .eq("id",id).eq("tenant_id",tenantId).eq("kind",kind)
     .eq("operating_context",existing.data.operating_context).is("archived_at",null).select("id").single();
    if(updated.error)throw updated.error;
    return respond({ok:true,id:updated.data.id});
   }
   const inserted=await collection.insert({
    tenant_id:tenantId,kind,operating_context:allowedContext,data:clean,
    created_by:user.id,updated_by:user.id
   }).select("id").single();
   if(inserted.error)throw inserted.error;
   return respond({ok:true,id:inserted.data.id});
  }
  if(action==="archive"){
   if(!uuid(body.id)||!ALLOWED.has(text(body.kind,64)))return respond({error:"Invalid record"},400);
   const q=await collection.select("id,operating_context").eq("id",body.id).eq("tenant_id",tenantId)
    .eq("kind",body.kind).is("archived_at",null).maybeSingle();
   if(q.error)throw q.error;
   if(!q.data||![context,"shared"].includes(q.data.operating_context))
    return respond({error:"Record not found"},404);
   if(q.data.operating_context==="shared"&&role==="editor")
    return respond({error:"Shared records require an administrator"},403);
   const removed=await collection.update({archived_at:new Date().toISOString(),updated_by:user.id,updated_at:new Date().toISOString()})
    .eq("id",body.id).eq("tenant_id",tenantId).eq("kind",body.kind)
    .eq("operating_context",q.data.operating_context).is("archived_at",null).select("id").single();
   if(removed.error)throw removed.error;
   return respond({ok:true,id:removed.data.id});
  }
  return respond({error:"Unknown action"},400);
 }catch(error){
  console.error("workforce-unified-portal",error);
  return respond({error:"Unified portal request failed"},500);
 }
});
