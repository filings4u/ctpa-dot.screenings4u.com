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
  // A program is read-only while any active person is enrolled directly or through its pools.
  // Counts are derived from current records, so removing the final membership unlocks it.
  const programEmployeeCount=async(programId:string)=>{
   const program=await collection.select("id,data").eq("id",programId)
    .eq("tenant_id",tenantId).eq("kind","programs").eq("operating_context",context)
    .is("archived_at",null).maybeSingle();
   if(program.error)throw program.error;
   if(!program.data)return null;
   const legacyId=program.data.data?._legacy_id||"";
   const pools=await collection.select("id,data").eq("tenant_id",tenantId).eq("kind","pools")
    .eq("operating_context",context).is("archived_at",null).limit(1000);
   if(pools.error)throw pools.error;
   const linked=(pools.data||[]).filter((p:any)=>
    p.data?.program_id===programId||(legacyId&&p.data?._legacy_program_id===legacyId));
   const poolIds=linked.map((p:any)=>p.id);
   const records=await collection.select("id,data").eq("tenant_id",tenantId)
    .eq("kind","enrollments").eq("operating_context",context)
    .is("archived_at",null).limit(1000);
   if(records.error)throw records.error;
   const personIds=new Set<string>();
   for(const enrollment of records.data||[]){
    const d=enrollment.data||{};
    if(!uuid(d.person_id)||d.status==="inactive"||d.status==="removed")continue;
    if(d.program_id===programId||
       (d.membership_type==="pool"&&poolIds.includes(d.pool_id))){
      personIds.add(d.person_id);
    }
   }
   return {program_id:programId,employee_count:personIds.size,locked:personIds.size>0};
  };
  const poolMemberCount=async(poolId:string)=>{
   const pool=await collection.select("id").eq("id",poolId).eq("tenant_id",tenantId)
    .eq("kind","pools").eq("operating_context",context).is("archived_at",null).maybeSingle();
   if(pool.error)throw pool.error;
   if(!pool.data)return null;
   const memberships=await collection.select("id,data").eq("tenant_id",tenantId)
    .eq("kind","enrollments").eq("operating_context",context)
    .eq("data->>membership_type","pool").eq("data->>pool_id",poolId)
    .is("archived_at",null).limit(1000);
   if(memberships.error)throw memberships.error;
   const people=new Set((memberships.data||[]).filter((r:any)=>
    uuid(r.data?.person_id)&&r.data?.status!=="inactive"&&r.data?.status!=="removed")
    .map((r:any)=>r.data.person_id));
   return {pool_id:poolId,employee_count:people.size,locked:people.size>0};
  };
  if(action==="pool_lock_status"){
   if(!uuid(body.pool_id))return respond({error:"Invalid pool"},400);
   const result=await poolMemberCount(body.pool_id);
   if(!result)return respond({error:"Pool not found in this workspace"},404);
   return respond({ok:true,...result});
  }
  if(action==="program_lock_status"){
   if(!uuid(body.program_id))return respond({error:"Invalid program"},400);
   const result=await programEmployeeCount(body.program_id);
   if(!result)return respond({error:"Program not found in this workspace"},404);
   return respond({ok:true,...result});
  }
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

  // Selection events use one immutable, server-authoritative record in the unified store.
  const selectionPool=async(poolId:unknown)=>{
   if(!uuid(poolId))return null;
   const result=await collection.select("id,data,operating_context").eq("id",poolId)
    .eq("tenant_id",tenantId).eq("kind","pools").eq("operating_context",context)
    .is("archived_at",null).maybeSingle();
   if(result.error)throw result.error;
   return result.data;
  };
  const selectionPopulation=async(poolId:string)=>{
   const memberships=await collection.select("id,data").eq("tenant_id",tenantId)
    .eq("kind","enrollments").eq("operating_context",context)
    .eq("data->>membership_type","pool").eq("data->>pool_id",poolId)
    .is("archived_at",null).limit(1000);
   if(memberships.error)throw memberships.error;
   const eligible=(memberships.data||[]).filter((m:any)=>
    m.data?.eligibility_status==="eligible"&&m.data?.status==="active"&&uuid(m.data?.person_id));
   if(!eligible.length)return [];
   const people=await collection.select("id,data").eq("tenant_id",tenantId)
    .eq("kind","people").in("operating_context",[context,"shared"])
    .in("id",[...new Set(eligible.map((m:any)=>m.data.person_id))])
    .is("archived_at",null).limit(1000);
   if(people.error)throw people.error;
   const lookup=new Map((people.data||[]).map((person:any)=>[person.id,person]));
   const unique=new Set<string>();
   return eligible.flatMap((membership:any)=>{
    const person:any=lookup.get(membership.data.person_id);
    if(!person||person.data?.status!=="active"||unique.has(person.id))return [];
    unique.add(person.id);
    return [{person_id:person.id,membership_id:membership.id,
     name:[person.data.first_name,person.data.last_name].filter(Boolean).join(" "),
     employer:person.data.employer||""}];
   });
  };
  if(action==="selection_preview"||action==="selection_run"){
   const pool=await selectionPool(body.pool_id);
   if(!pool)return respond({error:"Select an active pool in the current workspace"},404);
   if(pool.data?.status!=="active")return respond({error:"Pool must be active before selecting members"},400);
   const population=await selectionPopulation(pool.id);
   const size=population.length;
   const rates={drug:Number(pool.data?.drug_testing_rate||0),
    alcohol:Number(pool.data?.alcohol_testing_rate||0)};
   if(action==="selection_preview")return respond({ok:true,pool_id:pool.id,
    pool_name:pool.data?.name||"",population:size,rates,
    selection_schedule:pool.data?.selection_schedule||"",eligible_members:population.map(p=>({
     person_id:p.person_id,name:p.name,employer:p.employer}))});
   if(!canWrite)return respond({error:"Your role cannot run random selections"},403);
   const drug=Number(body.drug_count),alcohol=Number(body.alcohol_count);
   if(!Number.isInteger(drug)||!Number.isInteger(alcohol)||drug<0||alcohol<0||
     drug>size||alcohol>size||drug+alcohol===0)
    return respond({error:"Choose at least one selection; each test count must be within the eligible population"},400);
   if(!size)return respond({error:"No eligible people are enrolled in this pool"},400);
   const requestId=body.request_id;
   if(!uuid(requestId))return respond({error:"Invalid selection request identifier"},400);
   const prior=await collection.select("id").eq("tenant_id",tenantId).eq("kind","selections")
    .eq("data->>request_id",requestId).is("archived_at",null).limit(1);
   if(prior.error)throw prior.error;
   if(prior.data?.length)return respond({ok:true,id:prior.data[0].id,reused:true});
   // Uniform Fisher-Yates with rejection sampling, never Math.random.
   const uniform=(max:number)=>{
    const range=0x100000000,limit=Math.floor(range/max)*max;
    const bucket=new Uint32Array(1);let value=0;
    do{crypto.getRandomValues(bucket);value=bucket[0]}while(value>=limit);
    return value%max;
   };
   const shuffled=()=>{const result=[...population];
    for(let index=result.length-1;index>0;index--){
     const target=uniform(index+1);[result[index],result[target]]=[result[target],result[index]];
    }
    return result;
   };
   const drugPeople=shuffled().slice(0,drug);
   const alcoholPeople=shuffled().slice(0,alcohol);
   const selected=new Map<string,any>();
   for(const [people,type] of [[drugPeople,"drug"],[alcoholPeople,"alcohol"]] as const){
    for(const person of people){
     const entry=selected.get(person.person_id)||{...person,tests:[] as string[]};
     entry.tests.push(type);selected.set(person.person_id,entry);
    }
   }
   const now=new Date().toISOString(),eventData={
    name:"Random selection - "+new Date().toISOString().slice(0,10),pool_id:pool.id,
    pool_name:pool.data?.name||"",status:"locked",selection_type:"random",
    selection_date:now,locked_at:now,request_id:requestId,
    population_size:size,drug_selection_count:drug,alcohol_selection_count:alcohol,
    drug_required_rate:rates.drug,alcohol_required_rate:rates.alcohol,
    randomization_version:"crypto-fisher-yates-v1",
    selection_members:[...selected.values()].map((member:any,i:number)=>({
     person_id:member.person_id,membership_id:member.membership_id,
     name:member.name,employer:member.employer,ordinal:i+1,
     test_type:member.tests.join("_and_")})),
    population_snapshot:population.map(member=>({
     person_id:member.person_id,membership_id:member.membership_id})),
    audit:{algorithm:"crypto.getRandomValues with rejection sampling and Fisher-Yates",
     created_at:now,created_by:user.id,selection_schedule:pool.data?.selection_schedule||""}
   };
   const inserted=await collection.insert({tenant_id:tenantId,kind:"selections",
    operating_context:context,data:eventData,created_by:user.id,updated_by:user.id})
    .select("id").single();
   if(inserted.error)throw inserted.error;
   return respond({ok:true,id:inserted.data.id,selected:eventData.selection_members.length,
    population:size,status:"locked"});
  }

  if(action==="testing_order_submit"){
   if(!canWrite)return respond({error:"You cannot submit testing orders"},403);
   const existingId=body.request_id;
   if(!uuid(existingId))return respond({error:"Invalid submission identifier"},400);
   const companyId=body.company_id,personId=body.person_id;
   if(!uuid(companyId)||!uuid(personId))return respond({error:"Choose a company and donor"},400);
   const company=await collection.select("id,kind,operating_context,data").eq("tenant_id",tenantId)
    .eq("id",companyId).in("kind",context==="dot"?["employers","owner_operators"]:["employers"])
    .eq("operating_context",context).is("archived_at",null).maybeSingle();
   if(company.error)throw company.error;
   if(!company.data)return respond({error:"Company not available in this workspace"},404);
   const person=await collection.select("id,data").eq("tenant_id",tenantId)
    .eq("id",personId).eq("kind","people").in("operating_context",[context,"shared"])
    .is("archived_at",null).maybeSingle();
   if(person.error)throw person.error;
   if(!person.data||person.data.data?.company_id!==companyId)
    return respond({error:"Donor must be linked to the selected company"},400);
   const donorName=[person.data.data.first_name,person.data.data.last_name].filter(Boolean).join(" ");
   if(!donorName)return respond({error:"The selected donor needs a first and last name"},400);
   const testType=text(body.test_type,30),reason=text(body.reason,50),
    specimen=text(body.specimen_type,30),panel=text(body.panel_name,100),
    agency=text(body.dot_agency,15),priority=text(body.priority,15);
   if(!["drug","alcohol","drug_and_alcohol"].includes(testType)||
      !["pre_employment","random","reasonable_suspicion","post_accident","return_to_duty","follow_up","other"].includes(reason)||
      !["urine","oral_fluid","breath","saliva"].includes(specimen)||
      !["normal","urgent"].includes(priority))
     return respond({error:"Invalid testing order configuration"},400);
   if(context==="dot"&&!["FMCSA","FAA","FRA","FTA","PHMSA","USCG"].includes(agency))
     return respond({error:"Select a DOT agency"},400);
   if(!panel)return respond({error:"Select a testing panel"},400);
   const requestedDate=text(body.requested_date,10);
   if(requestedDate&&!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate))
    return respond({error:"Invalid requested date"},400);
   const existing=await collection.select("id,data").eq("tenant_id",tenantId)
    .eq("kind","testing_orders").eq("data->>request_id",existingId).is("archived_at",null).limit(1);
   if(existing.error)throw existing.error;
   if(existing.data?.length)return respond({ok:true,id:existing.data[0].id,
    case_id:existing.data[0].data?.testing_case_id,already_submitted:true});
   const companyName=text(company.data.data?.legal_name,180);
   const now=new Date().toISOString(),caseId=crypto.randomUUID();
   const caseNumber="TST-"+crypto.randomUUID().replaceAll("-","").slice(0,10).toUpperCase();
   const orderData={
    name:caseNumber,reference:caseNumber,request_id:existingId,
    testing_case_id:caseId,company_id:companyId,employer:companyName,person_id:personId,
    employee:donorName,donor_email:text(person.data.data.email,180),donor_phone:text(person.data.data.phone,60),
    test_type:testType,reason,testing_reason:reason,specimen_type:specimen,panel_name:panel,
    dot_agency:context==="dot"?agency:"",status:"awaiting_schedule",priority,
    requested_date:requestedDate,notes:text(body.notes,2000),operating_context:context,
    submitted_at:now,processing_portal:"testing-portal.screenings4u.com"
   };
   const result=await collection.insert({tenant_id:tenantId,kind:"testing_orders",operating_context:context,
    data:orderData,created_by:user.id,updated_by:user.id}).select("id").single();
   if(result.error)throw result.error;
   // Testing Cases is the authoritative case queue consumed by Testing Portal.
   const caseResult=await db.from("testing_cases").insert({
    id:caseId,case_number:caseNumber,customer_name:companyName,
    customer_email:text(company.data.data?.contact_email||company.data.data?.email,180)||null,
    company_name:companyName,donor_name:donorName,
    donor_email:orderData.donor_email||null,donor_phone:orderData.donor_phone||null,
    dot_test:context==="dot",dot_agency:context==="dot"?agency:null,
    test_reason:reason,test_type:testType,specimen_type:specimen,panel_name:panel,
    priority,status:"awaiting_schedule",notes:orderData.notes||null,created_by:user.id,
    metadata:{source:"workforce_ctpa_unified",tenant_id:tenantId,
      ctpa_order_id:result.data.id,request_id:existingId,company_id:companyId,person_id:personId,
      requested_date:requestedDate,operating_context:context,payment_status:"not_collected"}
   }).select("id,case_number,status").single();
   if(caseResult.error){
    await collection.delete().eq("id",result.data.id).eq("tenant_id",tenantId).eq("kind","testing_orders");
    throw caseResult.error;
   }
   return respond({ok:true,id:result.data.id,case_id:caseId,
    case_number:caseNumber,status:caseResult.data.status});
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
   // Reflect live Testing Portal processing status without duplicating its workflow state.
   const testing=records.filter((r:any)=>r.kind==="testing_orders"&&uuid(r.data?.testing_case_id));
   if(testing.length){
    const cases=await db.from("testing_cases").select("id,status,scheduled_at,completed_at,case_number")
     .in("id",[...new Set(testing.map((r:any)=>r.data.testing_case_id))]);
    if(cases.error)throw cases.error;
    const byId=new Map((cases.data||[]).map((r:any)=>[r.id,r]));
    for(const row of testing){
     const current:any=byId.get(row.data.testing_case_id);
     if(current)row.data={...row.data,status:current.status,
       name:current.case_number||row.data.name,
       scheduled_at:current.scheduled_at||"",completed_at:current.completed_at||""};
    }
   }
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
   if(kind==="selections")return respond({error:"Use the secure selection workflow; locked selections cannot be manually edited"},403);
   if(kind==="testing_orders")return respond({error:"Use the drug testing order submission workflow"},403);
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
   if(kind==="pools"&&uuid(body.id)){
    const status=await poolMemberCount(body.id);
    if(!status)return respond({error:"Pool not found in this workspace"},404);
    if(status.locked)return respond({error:"Pool settings are locked while "+status.employee_count+
     " employee(s) remain enrolled. Remove every employee from the pool before editing."},423);
   }
   if(kind==="programs"&&uuid(body.id)){
    const status=await programEmployeeCount(body.id);
    if(!status)return respond({error:"Program not found in this workspace"},404);
    if(status.locked)return respond({error:"Program is locked while "+status.employee_count+
      " employee(s) are enrolled. Remove every employee from the program's pools to edit it."},423);
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
   if(kind==="enrollments"&&clean.program_id&&clean.company_id){
    if(!uuid(clean.program_id)||!uuid(clean.company_id))
     return respond({error:"Invalid program or company reference"},400);
    const [program,company]=await Promise.all([
     collection.select("id,data").eq("id",clean.program_id).eq("tenant_id",tenantId)
      .eq("kind","programs").eq("operating_context",context).is("archived_at",null).maybeSingle(),
     collection.select("id,data").eq("id",clean.company_id).eq("tenant_id",tenantId)
      .in("kind",context==="dot"?["employers","owner_operators"]:["employers"])
      .eq("operating_context",context).is("archived_at",null).maybeSingle()
    ]);
    if(program.error)throw program.error;
    if(company.error)throw company.error;
    if(!program.data||!company.data)return respond({error:"Program or company is unavailable in this workspace"},400);
    clean.program=program.data.data?.name||"";
    clean.participant=company.data.data?.legal_name||"";
    if(!body.id){
     const duplicate=await collection.select("id",{count:"exact",head:true})
      .eq("tenant_id",tenantId).eq("kind","enrollments").eq("operating_context",context)
      .eq("data->>program_id",clean.program_id).eq("data->>company_id",clean.company_id)
      .is("archived_at",null);
     if(duplicate.error)throw duplicate.error;
     if((duplicate.count||0)>0)return respond({error:"This company is already enrolled in the program"},409);
    }
   }
   if(kind==="pools"){
    clean.program_type=context==="dot"?"DOT":"NON-DOT";
    if(context==="nondot")clean.dot_agency="";
    for(const key of ["drug_testing_rate","alcohol_testing_rate"]){
     if(clean[key]===""||clean[key]===null)continue;
     const rate=Number(clean[key]);
     if(!Number.isFinite(rate)||rate<0||rate>100)
      return respond({error:"Annual random selection rates must be between 0 and 100 percent"},400);
     clean[key]=rate;
    }
    if(!uuid(clean.program_id))return respond({error:"Select a program from this workspace"},400);
    const prog=await collection.select("id,data").eq("id",clean.program_id).eq("tenant_id",tenantId)
     .eq("kind","programs").eq("operating_context",context).is("archived_at",null).maybeSingle();
    if(prog.error)throw prog.error;
    if(!prog.data)return respond({error:"Selected program is not available"},400);
    clean.program=prog.data.data?.name||"";
    if(clean.company_id){
     if(!uuid(clean.company_id))return respond({error:"Invalid employer"},400);
     const company=await collection.select("id,data").eq("id",clean.company_id)
      .eq("tenant_id",tenantId).in("kind",context==="dot"?["employers","owner_operators"]:["employers"])
      .eq("operating_context",context).is("archived_at",null).maybeSingle();
     if(company.error)throw company.error;
     if(!company.data)return respond({error:"Employer does not belong to this workspace"},400);
     clean.employer=company.data.data?.legal_name||"";
    }else{clean.company_id="";clean.employer=""}
   }
   if(kind==="enrollments"&&clean.membership_type==="pool"){
    if(!uuid(clean.pool_id)||!uuid(clean.person_id))
     return respond({error:"Choose a valid pool and person"},400);
    const [pool,person]=await Promise.all([
     collection.select("id,data").eq("id",clean.pool_id).eq("tenant_id",tenantId)
      .eq("kind","pools").eq("operating_context",context).is("archived_at",null).maybeSingle(),
     collection.select("id,data").eq("id",clean.person_id).eq("tenant_id",tenantId)
      .eq("kind","people").in("operating_context",[context,"shared"]).is("archived_at",null).maybeSingle()
    ]);
    if(pool.error)throw pool.error;
    if(person.error)throw person.error;
    if(!pool.data||!person.data)return respond({error:"Pool or person is unavailable in this workspace"},400);
    if(clean.eligibility_status&&!["eligible","ineligible"].includes(clean.eligibility_status))
     return respond({error:"Invalid member eligibility"},400);
    clean.participant=[person.data.data?.first_name,person.data.data?.last_name].filter(Boolean).join(" ");
    clean.employer=person.data.data?.employer||"";
    if(!body.id){
     const duplicate=await collection.select("id",{count:"exact",head:true})
      .eq("tenant_id",tenantId).eq("kind","enrollments").eq("operating_context",context)
      .eq("data->>membership_type","pool").eq("data->>pool_id",clean.pool_id)
      .eq("data->>person_id",clean.person_id).is("archived_at",null);
     if(duplicate.error)throw duplicate.error;
     if((duplicate.count||0)>0)return respond({error:"This person already belongs to the pool"},409);
    }
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
   if(body.kind==="selections")return respond({error:"Selection audit records cannot be archived"},403);
   if(body.kind==="testing_orders")return respond({error:"Submitted testing orders must be managed by Testing Operations"},403);
   if(body.kind==="pools"){
    const status=await poolMemberCount(body.id);
    if(!status)return respond({error:"Pool not found in this workspace"},404);
    if(status.locked)return respond({error:"Cannot archive a pool with enrolled employees"},423);
   }
   if(body.kind==="programs"){
    const status=await programEmployeeCount(body.id);
    if(!status)return respond({error:"Program not found in this workspace"},404);
    if(status.locked)return respond({error:"Cannot archive a program while employees remain enrolled"},423);
   }
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
