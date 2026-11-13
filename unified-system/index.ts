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
const uuid=(v:unknown)=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
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
    .map((m:any)=>({tenant_id:m.tenant_id,name:byTenant.get(m.tenant_id)?.name||"C/TPA company",role:m.data.role||"viewer"}));
   if(workspaces.length>1)return respond({error:"This sign-in is linked to multiple C/TPA companies. Contact Workforce support to resolve duplicate company memberships."},409);
   return respond({ok:true,workspaces});
  }
  if(action==="create_workspace"){
   const existing=await collection.select("tenant_id").eq("kind","membership")
    .eq("data->>user_id",user.id).eq("data->>status","active")
    .is("archived_at",null).limit(1);
   if(existing.error)throw existing.error;
   if(existing.data?.length)return respond({error:"A C/TPA company is already linked to this account"},409);
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
  const companyKind=(kind:string)=>kind==="employers"||kind==="owner_operators";
  if(action==="program_rules"){
   const result=await db.from("regulatory_rules")
    .select("dot_agency,rule_name,effective_date,end_date,drug_rate,alcohol_rate,version")
    .eq("program_type","DOT").eq("status","active")
    .lte("effective_date",new Date().toISOString().slice(0,10))
    .order("effective_date",{ascending:false}).order("version",{ascending:false}).limit(60);
   if(result.error)throw result.error;
   const selected=new Map<string,unknown>();
   for(const row of result.data||[]){
    if(row.end_date&&row.end_date<new Date().toISOString().slice(0,10))continue;
    if(!selected.has(row.dot_agency))selected.set(row.dot_agency,row);
   }
   return respond({ok:true,rules:[...selected.values()]});
  }
  if(action==="list"){
   const kind=text(body.kind,64);
   if(kind!=="all"&&!ALLOWED.has(kind))return respond({error:"Unknown application module"},400);
   if(kind==="owner_operators"&&context==="nondot")
    return respond({ok:true,tenant_id:tenantId,operating_context:context,records:[],limit:1000});
   let query=collection.select("id,kind,operating_context,data,created_at,updated_at")
    .eq("tenant_id",tenantId).is("archived_at",null)
    .in("operating_context",[context,"shared"])
    .order("updated_at",{ascending:false}).limit(1000);
   if(kind==="all")query=query.in("kind",[...ALLOWED]);
   else query=query.eq("kind",kind);
   const result=await query;
   if(result.error)throw result.error;
   // Employers and owner-operators are exclusively DOT or NON-DOT, never shared.
   // Shared records for other modules retain their existing behavior.
   const records=(result.data||[]).filter((r:any)=>!companyKind(r.kind)||r.operating_context===context);
   return respond({ok:true,tenant_id:tenantId,operating_context:context,records,limit:1000});
  }
  if(action==="lab_summary"){
   const types=["lab_accounts","lab_orders","lab_tracking","lab_results","lab_documents","lab_supplies","lab_analytics"];
   const counts=await Promise.all(types.map(async kind=>{
    const q=await collection.select("id",{count:"exact",head:true})
     .eq("tenant_id",tenantId).eq("kind",kind)
     .in("operating_context",[context,"shared"]).is("archived_at",null);
    if(q.error)throw q.error;
    return {kind,count:q.count||0};
   }));
   return respond({ok:true,counts});
  }
  const documentKinds=new Set(["documents","testing_documents","lab_documents"]);
  if(action==="document_link"){
   const kind=text(body.kind,64);
   if(!documentKinds.has(kind)||!uuid(body.id))return respond({error:"Invalid document"},400);
   const found=await collection.select("id,data").eq("id",body.id).eq("tenant_id",tenantId)
    .eq("kind",kind).in("operating_context",[context,"shared"]).is("archived_at",null).maybeSingle();
   if(found.error)throw found.error;
   if(!found.data)return respond({error:"Document not found"},404);
   const bucket=text(found.data.data?.storage_bucket,100),path=text(found.data.data?.storage_path,1000);
   const legacy=typeof found.data.data?._legacy_table==="string"&&
    typeof found.data.data?._legacy_id==="string";
   const legacyAllowed=["dot-documents","general-documents","business-documents","compliance-documents","testing-documents","testing-private-documents","workforce-private","workforce-employer-documents","workforce-documents"].includes(bucket);
   const portalAllowed=bucket==="workforce-documents"&&path.startsWith(tenantId+"/"+kind+"/");
   if(!path||!(legacy?legacyAllowed:portalAllowed))
    return respond({error:"This document has no authorized downloadable file"},404);
   const signed=await db.storage.from(bucket).createSignedUrl(path,60);
   if(signed.error||!signed.data?.signedUrl)return respond({error:"Document file could not be opened"},404);
   return respond({ok:true,url:signed.data.signedUrl,expires_in:60});
  }
  if(action==="upload_file"){
   if(!canWrite)return respond({error:"Your role is read only"},403);
   const kind=text(body.kind,64),filename=text(body.filename,150),mimetype=text(body.mime_type,90);
   const base64=typeof body.base64==="string"?body.base64:"";
   if(!documentKinds.has(kind)||!filename||!/^[a-z0-9][a-z0-9 ._()\-]{0,149}$/i.test(filename))
    return respond({error:"Invalid document details"},400);
   if(!["application/pdf","image/png","image/jpeg","image/webp","text/plain","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(mimetype))
    return respond({error:"Unsupported document type"},400);
   if(!base64||base64.length>11200000||!/^[A-Za-z0-9+/]+={0,2}$/.test(base64))
    return respond({error:"Document must be 8 MB or smaller"},413);
   const input=payload(body.document_data);
   const formFields=kind==="documents"?["title","document_type","status"]:
    kind==="testing_documents"?["title","document_type","order_reference","status"]:
    ["title","account","status"];
   if(!input||typeof input.title!=="string"||input.title.trim().length<2)
    return respond({error:"Document title is required"},400);
   const clean=Object.fromEntries(Object.entries(input).filter(([k,v])=>
    formFields.includes(k)&&(typeof v==="string"||typeof v==="number"||typeof v==="boolean")));
   const requestedContext=body.record_context==="shared"?"shared":context;
   if(requestedContext==="shared"&&role==="editor")return respond({error:"Shared documents require an administrator"},403);
   let existing:null|{id:string,data:Record<string,unknown>,operating_context:string}=null;
   if(body.record_id){
    if(!uuid(body.record_id))return respond({error:"Invalid document record"},400);
    const found=await collection.select("id,data,operating_context").eq("id",body.record_id)
     .eq("tenant_id",tenantId).eq("kind",kind)
     .in("operating_context",[context,"shared"]).is("archived_at",null).maybeSingle();
    if(found.error)throw found.error;
    if(!found.data)return respond({error:"Document record not found"},404);
    if(found.data.operating_context==="shared"&&role==="editor")
     return respond({error:"Shared documents require an administrator"},403);
    existing=found.data as typeof existing;
   }
   let bytes:Uint8Array;
   try{const binary=atob(base64);bytes=Uint8Array.from(binary,c=>c.charCodeAt(0))}
   catch{return respond({error:"Invalid file encoding"},400)}
   if(bytes.byteLength>8*1024*1024)return respond({error:"Document must be 8 MB or smaller"},413);
   const safeName=filename.replace(/[^a-zA-Z0-9._-]+/g,"_");
   const path=tenantId+"/"+kind+"/"+crypto.randomUUID()+"/"+safeName;
   const upload=await db.storage.from("workforce-documents").upload(path,bytes,{contentType:mimetype,upsert:false});
   if(upload.error)throw upload.error;
   const fileMeta={storage_bucket:"workforce-documents",storage_path:path,
    file_name:filename,mime_type:mimetype,size_bytes:bytes.byteLength};
   const data={...(existing?.data||{}),...clean,...fileMeta};
   const saved=existing?
    await collection.update({data,updated_by:user.id,updated_at:new Date().toISOString()})
     .eq("id",existing.id).eq("tenant_id",tenantId).eq("kind",kind)
     .eq("operating_context",existing.operating_context).is("archived_at",null).select("id").single():
    await collection.insert({tenant_id:tenantId,kind,operating_context:requestedContext,data,
     created_by:user.id,updated_by:user.id}).select("id").single();
   if(saved.error||!saved.data){
    await db.storage.from("workforce-documents").remove([path]);
    throw saved.error||new Error("Unable to save document record");
   }
   return respond({ok:true,id:saved.data.id,file_name:filename});
  }
  if(!canWrite)return respond({error:"Your role is read only"},403);
  if(action==="save"){
   const kind=text(body.kind,64);
   if(!ALLOWED.has(kind))return respond({error:"Unknown application module"},400);
   if(kind==="owner_operators"&&context==="nondot")
    return respond({error:"Owner-Operators belong to the DOT workspace"},403);
   const data=payload(body.data);
   if(!data||Object.keys(data).length>40||JSON.stringify(data).length>60000)
    return respond({error:"Invalid or oversized record"},400);
   let allowedContext=body.record_context==="shared"?"shared":context;
   if(companyKind(kind))allowedContext=context;
   if(allowedContext==="shared"&&role==="editor")return respond({error:"Shared records require an administrator"},403);
   // Never accept tenant, privilege, or actor fields from the record payload.
   const clean=Object.fromEntries(Object.entries(data).filter(([k,v])=>
    /^[a-z][a-z0-9_]{0,63}$/.test(k)&&
    !["tenant_id","user_id","role","permissions","created_by","updated_by","operating_context","storage_bucket","storage_path","file_name","mime_type","size_bytes"].includes(k)&&
    (v===null||typeof v==="string"||typeof v==="number"||typeof v==="boolean")));
   if(!Object.keys(clean).length)return respond({error:"Nothing to save"},400);
   if(kind==="people"&&typeof clean.company_id==="string"&&clean.company_id){
    if(!uuid(clean.company_id))return respond({error:"Invalid company association"},400);
    const linked=await collection.select("id,kind,operating_context,data")
     .eq("id",clean.company_id).eq("tenant_id",tenantId)
     .in("kind",context==="dot"?["employers","owner_operators"]:["employers"])
     .eq("operating_context",context).is("archived_at",null).maybeSingle();
    if(linked.error)throw linked.error;
    if(!linked.data)return respond({error:"This company is not available in your current workspace"},400);
    clean.employer=linked.data.data?.legal_name||"";
    clean.relationship=clean.relationship==="contact"?"contact":"staff";
   }
   if(kind==="programs"){
    // Program context is server-owned; a client cannot move DOT programs to NON-DOT.
    clean.program_type=context==="dot"?"DOT":"NON-DOT";
    if(context==="nondot")clean.dot_agency="";
    for(const field of ["drug_random_rate","alcohol_random_rate"]){
     if(clean[field]===""||clean[field]===null)continue;
     const value=Number(clean[field]);
     if(!Number.isFinite(value)||value<0||value>100)
      return respond({error:"Random testing rates must be between 0 and 100 percent"},400);
     clean[field]=value;
    }
    if(clean.company_id){
     if(!uuid(clean.company_id))return respond({error:"Invalid company association"},400);
     const company=await collection.select("id,data").eq("id",clean.company_id)
      .eq("tenant_id",tenantId).in("kind",context==="dot"?["employers","owner_operators"]:["employers"])
      .eq("operating_context",context).is("archived_at",null).maybeSingle();
     if(company.error)throw company.error;
     if(!company.data)return respond({error:"Company is unavailable in this program workspace"},400);
     clean.employer=company.data.data?.legal_name||"";
    }else{clean.company_id="";clean.employer=""}
   }
   const id=body.id;
   // New company account classification determines both its module and workspace.
   // This is enforced server-side, regardless of the selected frontend tab.
   const choice=typeof clean.account_type==="string"?clean.account_type:"";
   if(!id&&companyKind(kind)&&!["dot_employer","owner_operator","nondot_employer"].includes(choice))
    return respond({error:"Choose DOT Employer, Owner-Operator, or NON-DOT Employer"},400);
   if(id&&companyKind(kind)&&choice&&
     (kind==="owner_operators"&&choice!=="owner_operator"||
      kind==="employers"&&!["dot_employer","nondot_employer"].includes(choice)))
    return respond({error:"Account classification does not match its management module"},400);
   if(id){
    if(!uuid(id))return respond({error:"Invalid record"},400);
    const existing=await collection.select("id,data,operating_context").eq("id",id)
     .eq("tenant_id",tenantId).eq("kind",kind).is("archived_at",null).maybeSingle();
    if(existing.error)throw existing.error;
    if(!existing.data||!(companyKind(kind)?
       existing.data.operating_context===context:
       [context,"shared"].includes(existing.data.operating_context)))
     return respond({error:"Record not found in this operating context"},404);
    if(existing.data.operating_context==="shared"&&role==="editor")
     return respond({error:"Shared records require an administrator"},403);
    const merged={...existing.data.data,...clean};
    if(companyKind(kind))merged.account_type=kind==="owner_operators"?"owner_operator":
      context==="nondot"?"nondot_employer":"dot_employer";
    const updated=await collection.update({data:merged,updated_at:new Date().toISOString(),updated_by:user.id})
     .eq("id",id).eq("tenant_id",tenantId).eq("kind",kind)
     .eq("operating_context",existing.data.operating_context).is("archived_at",null).select("id").single();
    if(updated.error)throw updated.error;
    return respond({ok:true,id:updated.data.id});
   }
   const actualKind=companyKind(kind)&&choice==="owner_operator"?"owner_operators":
     companyKind(kind)?"employers":kind;
   if(companyKind(kind))allowedContext=choice==="nondot_employer"?"nondot":"dot";
   const inserted=await collection.insert({
    tenant_id:tenantId,kind:actualKind,operating_context:allowedContext,data:clean,
    created_by:user.id,updated_by:user.id
   }).select("id").single();
   if(inserted.error)throw inserted.error;
   return respond({ok:true,id:inserted.data.id,kind:actualKind,operating_context:allowedContext});
  }
  if(action==="archive"){
   if(!uuid(body.id)||!ALLOWED.has(text(body.kind,64)))return respond({error:"Invalid record"},400);
   if(body.kind==="owner_operators"&&context==="nondot")
    return respond({error:"Owner-Operators belong to the DOT workspace"},403);
   const q=await collection.select("id,operating_context").eq("id",body.id).eq("tenant_id",tenantId)
    .eq("kind",body.kind).is("archived_at",null).maybeSingle();
   if(q.error)throw q.error;
   if(!q.data||!(companyKind(text(body.kind,64))?
      q.data.operating_context===context:[context,"shared"].includes(q.data.operating_context)))
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
