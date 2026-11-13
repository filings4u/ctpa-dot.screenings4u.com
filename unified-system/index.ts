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


  // Self-contained 2026 FMCSA New Entrant audit preparation reference.
  // These are independent portal definitions, not calls to legacy C/TPA audit APIs.
  const auditChecklist=[{"code":"driver_roster","section":"drivers","section_title":"Driver Qualification","title":"Driver roster","citation":"49 CFR 391","conditional":false,"description":"List of active drivers with dates of hire, license details, and other required identifying information."},{"code":"driver_application","section":"drivers","section_title":"Driver Qualification","title":"Driver application for employment","citation":"49 CFR 391.21","conditional":false,"description":"Completed application retained in the driver qualification file."},{"code":"driver_license","section":"drivers","section_title":"Driver Qualification","title":"Driver license / CDL and endorsements","citation":"49 CFR 383 / 391","conditional":false,"description":"Licensing and endorsements appropriate to the vehicles driven."},{"code":"initial_mvr","section":"drivers","section_title":"Driver Qualification","title":"Initial motor vehicle record","citation":"49 CFR 391.23","conditional":false,"description":"Initial driving record inquiries required during driver qualification."},{"code":"annual_mvr_review","section":"drivers","section_title":"Driver Qualification","title":"Annual MVR and driver review","citation":"49 CFR 391.25","conditional":false,"description":"Annual driving record review and retention as applicable."},{"code":"safety_history","section":"drivers","section_title":"Driver Qualification","title":"Prior-employer safety history","citation":"49 CFR 391.23","conditional":true,"description":"Prior employer safety-performance inquiries and documentation where required."},{"code":"road_test","section":"drivers","section_title":"Driver Qualification","title":"Road test or qualifying equivalent","citation":"49 CFR 391.31","conditional":true,"description":"Road test certificate or an eligible equivalent."},{"code":"medical","section":"drivers","section_title":"Driver Qualification","title":"Medical qualification","citation":"49 CFR 391","conditional":false,"description":"Current medical qualification documentation for applicable drivers."},{"code":"hos_rods","section":"hos","section_title":"Hours of Service","title":"RODS, ELD, or qualifying time records","citation":"49 CFR 395","conditional":false,"description":"Duty status, ELD records, or applicable short-haul time records."},{"code":"hos_support","section":"hos","section_title":"Hours of Service","title":"Hours-of-service supporting records","citation":"49 CFR 395","conditional":true,"description":"Supporting documentation for hours-of-service records."},{"code":"vehicle_list","section":"vehicles","section_title":"Vehicles and Maintenance","title":"Vehicle and trailer roster","citation":"49 CFR 396","conditional":false,"description":"List of vehicles and trailers, identification details, and unit numbers."},{"code":"annual_inspection","section":"vehicles","section_title":"Vehicles and Maintenance","title":"Annual or periodic inspection reports","citation":"49 CFR 396.17","conditional":false,"description":"Current periodic inspection documentation."},{"code":"maintenance_records","section":"vehicles","section_title":"Vehicles and Maintenance","title":"Inspection, repair, and maintenance records","citation":"49 CFR 396.3","conditional":false,"description":"Inspection, repair, and maintenance files showing systematic maintenance."},{"code":"inspector_qualifications","section":"vehicles","section_title":"Vehicles and Maintenance","title":"Inspector / brake inspector qualifications","citation":"49 CFR 396.19 / 396.25","conditional":true,"description":"Required inspector and brake-inspector qualification documents."},{"code":"insurance","section":"carrier","section_title":"Carrier and Program","title":"Proof of insurance / financial responsibility","citation":"49 CFR 387","conditional":false,"description":"Evidence of required financial responsibility."},{"code":"drug_alcohol_program","section":"drug_alcohol","section_title":"Drug and Alcohol","title":"DOT testing program / consortium enrollment","citation":"49 CFR 40 / 382","conditional":true,"description":"Applicable DOT drug and alcohol program or consortium participation."},{"code":"preemployment_test","section":"drug_alcohol","section_title":"Drug and Alcohol","title":"Pre-employment controlled-substance testing","citation":"49 CFR 382.301","conditional":true,"description":"Required pre-employment drug testing evidence."},{"code":"random_program","section":"drug_alcohol","section_title":"Drug and Alcohol","title":"Random testing and selection records","citation":"49 CFR 382.305","conditional":true,"description":"Random selection and testing records for covered workers."},{"code":"clearinghouse","section":"drug_alcohol","section_title":"Drug and Alcohol","title":"FMCSA Clearinghouse compliance","citation":"49 CFR 382 Subpart G","conditional":true,"description":"Applicable FMCSA Clearinghouse query records."},{"code":"other_testing","section":"drug_alcohol","section_title":"Drug and Alcohol","title":"Other required testing records","citation":"49 CFR 382","conditional":true,"description":"Records for post-accident, reasonable suspicion, RTD or follow-up testing where applicable."},{"code":"accident_register","section":"accidents","section_title":"Crash Records","title":"Accident register","citation":"49 CFR 390.15","conditional":true,"description":"Required accident register, or N/A where no qualifying crashes occurred."},{"code":"hazmat_shipping","section":"hazmat","section_title":"Hazardous Materials","title":"Hazardous materials shipping papers","citation":"49 CFR 172 / 177 / 397","conditional":true,"description":"Applicable regulated hazardous-materials shipping documentation."}];
  const auditRecord=async(id:unknown)=>{
   if(!uuid(id))return null;
   const q=await collection.select("id,data,tenant_id,operating_context,updated_at")
    .eq("id",id).eq("tenant_id",tenantId).eq("kind","audits")
    .eq("operating_context","dot").is("archived_at",null).maybeSingle();
   if(q.error)throw q.error;
   return q.data||null;
  };
  if(action==="audit_catalog"){
   return respond({ok:true,items:auditChecklist});
  }
  if(action==="audit_save"){
   if(context!=="dot")return respond({error:"FMCSA New Entrant audits belong to the DOT workspace"},403);
   if(!canWrite)return respond({error:"You cannot modify audits"},403);
   const companyId=text(body.company_id,50),id=body.id,company=await collection.select("id,data").eq("tenant_id",tenantId)
    .eq("id",companyId).in("kind",["employers","owner_operators"])
    .eq("operating_context","dot").is("archived_at",null).maybeSingle();
   if(company.error)throw company.error;
   if(!company.data)return respond({error:"Choose a DOT carrier or owner-operator company"},400);
   const name=text(body.name,180)||"New Entrant Audit - "+text(company.data.data?.legal_name,100);
   const due=text(body.due_date,10),notice=text(body.notice_date,10);
   if([due,notice].some(x=>x&&(!/^\d{4}-\d{2}-\d{2}$/.test(x)||!Number.isFinite(Date.parse(x+"T12:00:00Z")))))
    return respond({error:"Enter valid audit dates"},400);
   const status=text(body.status,20)||"draft";
   if(!["draft","in_progress","ready","submitted","completed"].includes(status))
    return respond({error:"Invalid audit status"},400);
   const current=id?await auditRecord(id):null;
   if(id&&!current)return respond({error:"Audit not found in this DOT workspace"},404);
   const old=current?.data||{};
   const data={...old,name,carrier:text(company.data.data?.legal_name,180),company_id:companyId,
    dot_number:text(company.data.data?.dot_number,30),due_date:due,
    notice_date:notice,status,notes:text(body.notes,5000),
    checklist:old.checklist||{},audit_source:"workforce_unified_native_v1"};
   // Remove obsolete cross-system lookup hints from unified audit records.
   delete data._legacy_id;delete data._legacy_table;
   const update=current?await collection.update({data,updated_by:user.id,updated_at:new Date().toISOString()})
     .eq("id",current.id).eq("tenant_id",tenantId).eq("kind","audits")
     .eq("operating_context","dot").select("id").single():
     await collection.insert({tenant_id:tenantId,kind:"audits",operating_context:"dot",
      data,created_by:user.id,updated_by:user.id}).select("id").single();
   if(update.error)throw update.error;
   return respond({ok:true,id:update.data.id});
  }
  if(action==="audit_item_update"){
   if(context!=="dot"||!canWrite)return respond({error:"Audit editing not permitted"},403);
   const audit=await auditRecord(body.audit_id);
   if(!audit)return respond({error:"Audit record not available"},404);
   const code=text(body.item_code,70),definition=auditChecklist.find((x:any)=>x.code===code);
   if(!definition)return respond({error:"Unknown audit requirement"},400);
   const status=text(body.status,30);
   if(!["missing","requested","received","reviewed","not_applicable"].includes(status))
    return respond({error:"Invalid checklist status"},400);
   if(status==="not_applicable"&&!definition.conditional)
    return respond({error:"This checklist item is required. It cannot be marked not applicable."},400);
   const old=audit.data||{},checklist={...(old.checklist||{})};
   checklist[code]={...(checklist[code]||{}),status,notes:text(body.notes,1600),
    reviewed_by:user.id,reviewed_at:new Date().toISOString()};
   const count=auditChecklist.filter((x:any)=>{
     const v=checklist[x.code];
     return v?.status==="reviewed"||(x.conditional&&v?.status==="not_applicable");
   }).length;
   const data={...old,checklist,readiness_percent:Math.round(100*count/auditChecklist.length)};
   delete data._legacy_id;delete data._legacy_table;
   const updated=await collection.update({data,updated_at:new Date().toISOString(),updated_by:user.id})
    .eq("id",audit.id).eq("tenant_id",tenantId).eq("kind","audits").eq("operating_context","dot")
    .select("id").single();
   if(updated.error)throw updated.error;
   return respond({ok:true,readiness_percent:data.readiness_percent});
  }
  if(action==="audit_document_upload"){
   if(context!=="dot"||!canWrite)return respond({error:"Audit upload not permitted"},403);
   const audit=await auditRecord(body.audit_id);
   if(!audit)return respond({error:"Audit not found"},404);
   const code=text(body.item_code,70),definition=auditChecklist.find((x:any)=>x.code===code);
   if(!definition)return respond({error:"Unknown audit checklist item"},400);
   const filename=text(body.filename,140),mime=text(body.mime_type,100),encoded=typeof body.base64==="string"?body.base64:"";
   if(!filename||!/^[a-z0-9][a-z0-9 ._()\-]{0,139}$/i.test(filename)||
    !["application/pdf","image/jpeg","image/png","image/webp"].includes(mime))
    return respond({error:"Upload a PDF or supported image"},400);
   if(!encoded||encoded.length>11200000||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))
    return respond({error:"File must be 8 MB or smaller"},413);
   let bytes:Uint8Array;
   try{bytes=Uint8Array.from(atob(encoded),v=>v.charCodeAt(0))}
   catch{return respond({error:"Invalid file contents"},400)}
   if(bytes.length>8*1024*1024)return respond({error:"File exceeds 8 MB"},413);
   const safe=filename.replace(/[^a-zA-Z0-9._-]/g,"_");
   const storagePath=tenantId+"/audits/"+audit.id+"/"+code+"/"+crypto.randomUUID()+"-"+safe;
   const file=await db.storage.from("workforce-documents").upload(storagePath,bytes,{contentType:mime,upsert:false});
   if(file.error)throw file.error;
   const old=audit.data||{},checklist={...(old.checklist||{})},prev=checklist[code]||{};
   const documents=[...(prev.documents||[]),{path:storagePath,name:filename,mime,uploaded_at:new Date().toISOString()}];
   checklist[code]={...prev,documents,status:prev.status==="reviewed"?"reviewed":"received"};
   const data={...old,checklist};
   delete data._legacy_id;delete data._legacy_table;
   const saved=await collection.update({data,updated_by:user.id,updated_at:new Date().toISOString()})
    .eq("id",audit.id).eq("tenant_id",tenantId).eq("kind","audits").eq("operating_context","dot")
    .select("id").single();
   if(saved.error){await db.storage.from("workforce-documents").remove([storagePath]);throw saved.error}
   return respond({ok:true,filename});
  }
  if(action==="audit_document_link"){
   if(context!=="dot")return respond({error:"Audit document is available only in DOT"},403);
   const audit=await auditRecord(body.audit_id);
   if(!audit)return respond({error:"Audit not available"},404);
   const code=text(body.item_code,70),index=Number(body.document_index);
   if(!Number.isSafeInteger(index)||index<0)return respond({error:"Invalid attachment"},400);
   const document=audit.data?.checklist?.[code]?.documents?.[index];
   if(!document?.path||!document.path.startsWith(tenantId+"/audits/"+audit.id+"/"+code+"/"))
    return respond({error:"Attachment not available"},404);
   const link=await db.storage.from("workforce-documents").createSignedUrl(document.path,60);
   if(link.error||!link.data?.signedUrl)return respond({error:"Attachment could not be opened"},404);
   return respond({ok:true,url:link.data.signedUrl,name:document.name,expires_in:60});
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

  const officialResult=async(recordId:unknown)=>{
   if(!uuid(recordId))return null;
   const unified=await collection.select("id,data,tenant_id,operating_context").eq("id",recordId)
    .eq("tenant_id",tenantId).eq("kind","results").in("operating_context",[context,"shared"])
    .is("archived_at",null).maybeSingle();
   if(unified.error)throw unified.error;
   // Live reports use the authoritative Testing Operations report ID until migrated.
   const reportId=unified.data?.data?._legacy_id||recordId;
   if(!uuid(reportId))return null;
   const report=await db.from("test_result_reports").select("*")
    .eq("id",reportId).maybeSingle();
   if(report.error)throw report.error;
   if(!report.data||!uuid(report.data.employer_id))return null;
   const employer=await collection.select("id,data").eq("tenant_id",tenantId)
    .eq("kind","employers").eq("operating_context",context)
    .eq("data->>_legacy_id",report.data.employer_id).is("archived_at",null).maybeSingle();
   if(employer.error)throw employer.error;
   if(!employer.data)return null;
   const employee=uuid(report.data.employee_id)?
    await db.from("employees").select("id,employer_id,first_name,last_name,date_of_birth")
     .eq("id",report.data.employee_id).eq("employer_id",report.data.employer_id).maybeSingle():{data:null,error:null};
   if(employee.error)throw employee.error;
   const ids=report.data.official_mro_document_id;
   let official:any=null;
   if(uuid(ids)){
    const document=await db.from("documents").select("id,title,storage_bucket,storage_path,mime_type,document_type")
     .eq("id",ids).eq("employer_id",report.data.employer_id).is("archived_at",null).maybeSingle();
    if(document.error)throw document.error;
    if(document.data)official=document.data;
    else{
     const caseDoc=await db.from("testing_case_documents").select("id,title,storage_bucket,storage_path,mime_type,document_type,testing_case_id")
      .eq("id",ids).is("archived_at",null).maybeSingle();
     if(caseDoc.error)throw caseDoc.error;
     if(caseDoc.data&&uuid(caseDoc.data.testing_case_id)){
      const owner=await db.from("testing_cases").select("id,metadata").eq("id",caseDoc.data.testing_case_id).maybeSingle();
      if(owner.error)throw owner.error;
      if(owner.data?.metadata?.tenant_id===report.data.tenant_id)official=caseDoc.data;
     }
    }
   }
   if(!official?.storage_path||!official?.storage_bucket||official.mime_type!=="application/pdf")official=null;
   const past=await db.from("test_result_deliveries").select("id,delivery_status,employer_email,delivered_at")
    .eq("test_result_report_id",report.data.id).eq("employer_id",report.data.employer_id)
    .order("created_at",{ascending:false}).limit(1);
   if(past.error)throw past.error;
   return {unified:unified.data||{id:report.data.id},report:report.data,employer:employer.data,employee:employee.data,
    document:official,delivery:past.data?.[0]||null};
  };
  if(action==="result_details"||action==="result_document_link"||action==="result_send_to_employer"){
   const r=await officialResult(body.id);
   if(!r)return respond({error:"Result unavailable for this C/TPA account"},404);
   const final= r.report.report_status==="final"&&!!r.report.finalized_at;
   const verified=final&&!!r.document;
   const contact=text(r.employer.data.contact_email||r.employer.data.primary_contact_email,200);
   const response={ok:true,id:r.unified.id,report_number:r.report.report_number,
    status:r.report.report_status,finalized_at:r.report.finalized_at,
    mro_name:r.report.mro_name||"",mro_verified_at:r.report.mro_verified_at||"",
    verified_result:String(r.report.verified_result||""),
    testing_order_id:r.report.testing_order_id||"",test_reason:r.report.test_reason||"",
    specimen_type:r.report.specimen_type||"",lab_name:r.report.laboratory_name||"",
    employer_name:r.employer.data.legal_name||"",recipient_email:contact,
    donor_name:r.employee?[r.employee.first_name,r.employee.last_name].filter(Boolean).join(" "):"",
    donor_birthdate:r.employee?.date_of_birth||"",document_ready:verified,
    document_name:r.document?.title||"Official MRO Result.pdf",
    sent_at:r.delivery?.delivery_status==="sent"?r.delivery.delivered_at:null,
    delivery_status:r.delivery?.delivery_status||"not_sent"};
   if(action==="result_details")return respond(response);
   if(!verified)return respond({error:"The finalized official MRO PDF is not available. Ask Testing Operations to attach it before delivery."},409);
   if(action==="result_document_link"){
    const signed=await db.storage.from(r.document.storage_bucket).createSignedUrl(r.document.storage_path,60);
    if(signed.error||!signed.data?.signedUrl)return respond({error:"Official document could not be opened"},404);
    return respond({ok:true,url:signed.data.signedUrl,filename:r.document.title||"Official MRO Result.pdf"});
   }
   if(!canWrite)return respond({error:"Only C/TPA staff with write access can send results"},403);
   if(!contact||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact))
    return respond({error:"Employer has no valid authorized contact email"},409);
   if(body.confirm_recipient!==contact)return respond({error:"Recipient confirmation does not match the employer contact"},400);
   if(!r.employee)return respond({error:"Verified donor relationship is required before sending"},409);
   const key=Deno.env.get("RESEND_API_KEY");
   if(!key)return respond({error:"Result delivery email service is not configured"},503);
   const file=await db.storage.from(r.document.storage_bucket).download(r.document.storage_path);
   if(file.error||!file.data)return respond({error:"Unable to retrieve official MRO document"},502);
   const bytes=new Uint8Array(await file.data.arrayBuffer());
   if(!bytes.length||bytes.length>10*1024*1024)return respond({error:"Official document size is unsupported"},413);
   let binary="";for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
   const encoded=btoa(binary);
   const escaped=(v:string)=>v.replace(/[&<>"']/g,(ch:string)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]||ch));
   const send=await fetch("https://api.resend.com/emails",{method:"POST",
    headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},
    body:JSON.stringify({from:Deno.env.get("SCREENINGS4U_FROM_EMAIL")||"Workforce <notifications@screenings4u.com>",
     to:[contact],subject:"Workforce | Official testing result "+text(r.report.report_number,50),
     html:'<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#01122f">'+
      '<div style="background:#01122f;padding:24px;color:white;font-weight:700;font-size:20px">Workforce | Official Result Delivery</div>'+
      '<div style="padding:28px 24px"><p>An official finalized testing result has been sent to the designated employer contact.</p>'+
      '<p>Report reference: <strong>'+escaped(text(r.report.report_number,70))+'</strong></p>'+
      '<p>Please review the attached official MRO document and handle it as confidential personnel information.</p>'+
      '<p style="color:#687a91">This message is intended for the authorized employer contact only.</p></div></div>',
     attachments:[{filename:"MRO-"+text(r.report.report_number,60).replace(/[^A-Za-z0-9_-]/g,"")+".pdf",content:encoded}]})});
   const sent=await send.json().catch(()=>({}));
   if(!send.ok)return respond({error:"Email provider rejected result delivery: "+text(sent.message,180)},502);
   const log=await db.from("test_result_deliveries").insert({
    tenant_id:r.report.tenant_id,employer_id:r.report.employer_id,
    test_result_report_id:r.report.id,testing_order_id:r.report.testing_order_id,
    delivered_by:user.id,delivered_at:new Date().toISOString(),delivery_status:"sent",
    employer_email:contact,metadata:{source:"workforce_unified_ctpa",provider_message_id:sent.id||null}
   }).select("id").single();
   if(log.error)return respond({ok:true,sent:true,warning:"Email sent, but delivery history could not be recorded."});
   return respond({ok:true,sent:true,delivery_id:log.data.id,recipient_email:contact});
  }

  // Physicals are submitted by the unified C/TPA tenant and processed in the
  // existing Occupational Health and Testing Operations queues.
  if(action==="occupational_health_submit"){
   if(!canWrite)return respond({error:"You cannot submit physical orders"},403);
   const requestId=body.request_id,companyId=body.company_id,personId=body.person_id;
   if(!uuid(requestId)||!uuid(companyId)||!uuid(personId))return respond({error:"Select an employer and employee"},400);
   const examType=text(body.exam_type,30);
   if(!["physical","recertification","return_to_duty","fit_for_duty","pre_employment"].includes(examType))
    return respond({error:"Select a valid physical examination"},400);
   const requestedDate=text(body.requested_date,10);
   if(requestedDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)||!Number.isFinite(Date.parse(requestedDate+"T12:00:00Z"))))
    return respond({error:"Invalid preferred appointment date"},400);
   const company=await collection.select("id,kind,operating_context,data").eq("tenant_id",tenantId)
    .eq("id",companyId).in("kind",context==="dot"?["employers","owner_operators"]:["employers"])
    .eq("operating_context",context).is("archived_at",null).maybeSingle();
   if(company.error)throw company.error;
   if(!company.data)return respond({error:"Choose an employer in the current workspace"},404);
   const person=await collection.select("id,data").eq("tenant_id",tenantId)
    .eq("id",personId).eq("kind","people").in("operating_context",[context,"shared"])
    .is("archived_at",null).maybeSingle();
   if(person.error)throw person.error;
   if(!person.data||person.data.data?.company_id!==companyId)
    return respond({error:"The employee must belong to the selected employer"},400);
   const donorName=[text(person.data.data?.first_name,80),text(person.data.data?.last_name,80)].filter(Boolean).join(" ");
   if(!donorName||!text(person.data.data?.first_name)||!text(person.data.data?.last_name))
    return respond({error:"Employee first and last names are required"},400);
   const companyName=text(company.data.data?.legal_name,180);
   if(!companyName)return respond({error:"Employer legal name is required"},400);
   const metadata={source:"workforce_ctpa_unified",unified_tenant_id:tenantId,
    operating_context:context,company_id:companyId,person_id:personId,
    request_id:requestId,requested_date:requestedDate,submission_channel:"ctpa_portal"};
   const previous=await db.from("occupational_health_orders").select("id,reference_number,testing_case_id,status")
    .contains("metadata",{source:"workforce_ctpa_unified",unified_tenant_id:tenantId,request_id:requestId})
    .is("archived_at",null).limit(1).maybeSingle();
   if(previous.error)throw previous.error;
   if(previous.data?.testing_case_id)return respond({ok:true,id:previous.data.id,
    reference_number:previous.data.reference_number,case_id:previous.data.testing_case_id,
    status:previous.data.status,already_submitted:true});
   const now=new Date().toISOString();
   let order=previous.data;
   if(!order){
    const saved=await db.from("occupational_health_orders").insert({
     source_type:"ctpa",recipient_portal:"ctpa",physical_type:context==="dot"?"DOT":"NON_DOT",
     exam_type:examType,donor_name:donorName,donor_email:text(person.data.data?.email,180)||null,
     donor_phone:text(person.data.data?.phone,60)||null,company_name:companyName,
     notes:text(body.notes,2000)||null,status:"draft",metadata,
     created_by:user.id,updated_by:user.id
    }).select("id,reference_number,testing_case_id,status").single();
    if(saved.error)throw saved.error;order=saved.data;
   }
   const caseId=crypto.randomUUID();
   const caseNo="TST-"+crypto.randomUUID().replaceAll("-","").slice(0,10).toUpperCase();
   const caseRow={
    id:caseId,case_number:caseNo,customer_name:companyName,
    customer_email:text(company.data.data?.contact_email||company.data.data?.email,180)||null,
    company_name:companyName,donor_name:donorName,
    donor_email:text(person.data.data?.email,180)||null,donor_phone:text(person.data.data?.phone,60)||null,
    dot_test:context==="dot",dot_agency:context==="dot"?text(company.data.data?.dot_agency||"FMCSA",20):null,
    test_reason:examType,test_type:context==="dot"?"DOT physical":"Non-DOT physical",
    panel_name:context==="dot"?"DOT Occupational Physical":"NON-DOT Occupational Physical",
    status:"awaiting_schedule",priority:"normal",notes:text(body.notes,2000)||null,
    created_by:user.id,metadata:{source_domain:"occupational_health",source_type:"ctpa",
     recipient_portal:"ctpa",occupational_health_order_id:order.id,
     unified_tenant_id:tenantId,company_id:companyId,person_id:personId,
     requested_date:requestedDate,operating_context:context,request_id:requestId}
   };
   const created=await db.from("testing_cases").insert(caseRow).select("id,case_number,status").single();
   if(created.error){
    if(!previous.data)await db.from("occupational_health_orders").delete().eq("id",order.id).eq("status","draft");
    throw created.error;
   }
   const updated=await db.from("occupational_health_orders").update({
    testing_case_id:caseId,status:"submitted",submitted_at:now,updated_by:user.id,updated_at:now
   }).eq("id",order.id).eq("status","draft").is("testing_case_id",null).select("id,reference_number,status").maybeSingle();
   if(updated.error||!updated.data){
    await db.from("testing_cases").delete().eq("id",caseId);
    if(updated.error)throw updated.error;
    return respond({error:"Physical already submitted. Reload the order list."},409);
   }
   return respond({ok:true,id:updated.data.id,reference_number:updated.data.reference_number,
    case_id:caseId,case_number:created.data.case_number,status:"submitted"});
  }

  if(action==="list"){
   const kind=text(body.kind,64);
   if(kind!=="all"&&!ALLOWED.has(kind))return respond({error:"Unknown application module"},400);

   if(kind==="occupational_health"){
    const physicals=await db.from("occupational_health_orders")
     .select("id,reference_number,physical_type,exam_type,donor_name,company_name,donor_email,donor_phone,notes,status,testing_case_id,donor_pass_id,metadata,created_at,updated_at")
     .contains("metadata",{source:"workforce_ctpa_unified",unified_tenant_id:tenantId,operating_context:context})
     .is("archived_at",null).order("created_at",{ascending:false}).limit(500);
    if(physicals.error)throw physicals.error;
    const ids=(physicals.data||[]).map((p:any)=>p.testing_case_id).filter(uuid);
    const cases=ids.length?await db.from("testing_cases")
     .select("id,case_number,status,scheduled_at,completed_at").in("id",ids):{data:[],error:null};
    if(cases.error)throw cases.error;
    const map=new Map((cases.data||[]).map((c:any)=>[c.id,c]));
    return respond({ok:true,tenant_id:tenantId,operating_context:context,records:
     (physicals.data||[]).map((p:any)=>{
      const c:any=map.get(p.testing_case_id);
      return {id:p.id,kind:"occupational_health",operating_context:context,
       created_at:p.created_at,updated_at:p.updated_at,
       data:{name:p.reference_number,reference:p.reference_number,
        physical_type:p.physical_type,exam_type:p.exam_type,
        employee_name:p.donor_name,employer:p.company_name,
        donor_email:p.donor_email,donor_phone:p.donor_phone,
        company_id:p.metadata?.company_id,person_id:p.metadata?.person_id,
        requested_date:p.metadata?.requested_date,notes:p.notes,
        status:c?.status||p.status,order_status:p.status,
        testing_case_id:p.testing_case_id,case_number:c?.case_number,
        scheduled_at:c?.scheduled_at,completed_at:c?.completed_at,donor_pass_ready:!!p.donor_pass_id}};
     }),limit:500});
   }

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
   if(kind==="results"){
    const employers=await collection.select("id,data").eq("tenant_id",tenantId)
     .eq("kind","employers").eq("operating_context",context).is("archived_at",null).limit(500);
    if(employers.error)throw employers.error;
    const legacy=(employers.data||[]).map((e:any)=>e.data?._legacy_id).filter(uuid);
    if(legacy.length){
     const reports=await db.from("test_result_reports").select(
      "id,employer_id,report_number,report_status,regulatory_mode,verified_result,finalized_at,created_at,updated_at,testing_order_id"
     ).in("employer_id",legacy).eq("regulatory_mode",context==="dot"?"DOT":"NON-DOT")
      .order("created_at",{ascending:false}).limit(250);
     if(reports.error)throw reports.error;
     const seen=new Set(records.map((r:any)=>r.data?._legacy_id||r.id));
     for(const report of reports.data||[]){
      if(seen.has(report.id))continue;
      records.push({id:report.id,kind:"results",tenant_id:tenantId,operating_context:context,
       created_at:report.created_at,updated_at:report.updated_at,
       data:{name:report.report_number||"Official result",status:report.report_status,
        reported_at:report.finalized_at||report.created_at,
        order_reference:report.testing_order_id||"",_legacy_id:report.id,
        _legacy_table:"test_result_reports"}});
     }
    }
   }
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
    kind==="testing_documents"?["title","document_type","order_reference","status","company_id","person_id","testing_order_id","description","document_date","visibility"]:
    ["title","account","status"];
   if(!input||typeof input.title!=="string"||input.title.trim().length<2)
    return respond({error:"Document title is required"},400);
   const clean=Object.fromEntries(Object.entries(input).filter(([k,v])=>
    formFields.includes(k)&&(typeof v==="string"||typeof v==="number"||typeof v==="boolean")));
   if(kind==="testing_documents"){
    const validTypes=["chain_of_custody","donor_pass","collection_form","lab_report","mro_report","test_result","consent_authorization","random_selection","program_policy","medical_document","invoice_receipt","correspondence","other"];
    if(!validTypes.includes(String(clean.document_type||"")))
     return respond({error:"Choose a valid testing document category"},400);
    clean.visibility="internal";
    if(clean.company_id){
     if(!uuid(clean.company_id))return respond({error:"Invalid company reference"},400);
     const company=await collection.select("id").eq("tenant_id",tenantId).eq("id",clean.company_id)
      .in("kind",context==="dot"?["employers","owner_operators"]:["employers"])
      .eq("operating_context",context).is("archived_at",null).maybeSingle();
     if(company.error)throw company.error;
     if(!company.data)return respond({error:"Company not found in this workspace"},400);
    }
    if(clean.person_id){
     if(!uuid(clean.person_id))return respond({error:"Invalid person reference"},400);
     const person=await collection.select("id,data").eq("tenant_id",tenantId).eq("kind","people")
      .eq("id",clean.person_id).in("operating_context",[context,"shared"])
      .is("archived_at",null).maybeSingle();
     if(person.error)throw person.error;
     if(!person.data||(clean.company_id&&person.data.data?.company_id!==clean.company_id))
      return respond({error:"Selected person is not linked to this company"},400);
    }
    if(clean.testing_order_id){
     if(!uuid(clean.testing_order_id))return respond({error:"Invalid testing order reference"},400);
     const order=await collection.select("id,data").eq("tenant_id",tenantId).eq("kind","testing_orders")
      .eq("id",clean.testing_order_id).eq("operating_context",context)
      .is("archived_at",null).maybeSingle();
     if(order.error)throw order.error;
     if(!order.data)return respond({error:"Testing order not found in this workspace"},400);
     if(clean.company_id&&order.data.data?.company_id!==clean.company_id)
      return respond({error:"Testing order does not belong to this company"},400);
     clean.order_reference=String(order.data.data?.name||"");
    }
   }
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
   if(kind==="results")return respond({error:"Results are issued and finalized by Testing Operations and cannot be edited here"},403);
   if(kind==="audits")return respond({error:"Use the native New Entrant Audit workflow"},403);
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
   if(kind==="testing_documents"){
    if(!body.id)return respond({error:"Upload a file to create a testing document"},400);
    const categories=["chain_of_custody","donor_pass","collection_form","lab_report","mro_report",
     "test_result","consent_authorization","random_selection","program_policy","medical_document",
     "invoice_receipt","correspondence","other"];
    if(!categories.includes(String(clean.document_type||"")))
     return respond({error:"Invalid testing document category"},400);
    clean.visibility="internal";
    if(clean.company_id){
     if(!uuid(clean.company_id))return respond({error:"Invalid company"},400);
     const company=await collection.select("id").eq("tenant_id",tenantId).eq("id",clean.company_id)
      .in("kind",context==="dot"?["employers","owner_operators"]:["employers"])
      .eq("operating_context",context).is("archived_at",null).maybeSingle();
     if(company.error)throw company.error;
     if(!company.data)return respond({error:"Company not available in this workspace"},400);
    }
    if(clean.person_id){
     if(!uuid(clean.person_id))return respond({error:"Invalid person"},400);
     const person=await collection.select("id,data").eq("tenant_id",tenantId).eq("id",clean.person_id)
      .eq("kind","people").in("operating_context",[context,"shared"])
      .is("archived_at",null).maybeSingle();
     if(person.error)throw person.error;
     if(!person.data||(clean.company_id&&person.data.data?.company_id!==clean.company_id))
      return respond({error:"Person must belong to the selected company"},400);
    }
    if(clean.testing_order_id){
     if(!uuid(clean.testing_order_id))return respond({error:"Invalid order"},400);
     const order=await collection.select("id,data").eq("tenant_id",tenantId).eq("id",clean.testing_order_id)
      .eq("kind","testing_orders").eq("operating_context",context)
      .is("archived_at",null).maybeSingle();
     if(order.error)throw order.error;
     if(!order.data||(clean.company_id&&order.data.data?.company_id!==clean.company_id))
      return respond({error:"Testing order is unavailable for the selected company"},400);
     clean.order_reference=String(order.data.data?.name||"");
    }else clean.order_reference="";
   }
   if(kind==="compliance"){
    if(body.record_context==="shared")return respond({error:"Compliance records must belong to a DOT or NON-DOT company"},400);
    if(!uuid(clean.company_id))return respond({error:"Select a company for this compliance record"},400);
    const company=await collection.select("id,data").eq("tenant_id",tenantId)
     .eq("id",clean.company_id).in("kind",context==="dot"?["employers","owner_operators"]:["employers"])
     .eq("operating_context",context).is("archived_at",null).maybeSingle();
    if(company.error)throw company.error;
    if(!company.data)return respond({error:"Company does not belong to the selected workspace"},400);
    const personId=text(clean.person_id,50);
    if(personId){
     if(!uuid(personId))return respond({error:"Invalid employee"},400);
     const person=await collection.select("id,data").eq("tenant_id",tenantId)
      .eq("id",personId).eq("kind","people").eq("operating_context",context)
      .is("archived_at",null).maybeSingle();
     if(person.error)throw person.error;
     if(!person.data||person.data.data?.company_id!==clean.company_id)
      return respond({error:"Employee must be associated with the selected company"},400);
     clean.employee_name=[text(person.data.data?.first_name,100),text(person.data.data?.last_name,100)].filter(Boolean).join(" ");
    }else{clean.person_id="";clean.employee_name=""}
    if(!text(clean.name,200))return respond({error:"Enter a compliance record title"},400);
    if(!["company","employee"].includes(String(clean.scope)))return respond({error:"Choose company or employee compliance"},400);
    if(clean.scope==="employee"&&!personId)return respond({error:"Select an employee for an employee compliance record"},400);
    if(!["review","finding","violation","corrective_action","audit","other"].includes(String(clean.category)))
     return respond({error:"Choose a valid compliance category"},400);
    if(!["compliant","non_compliant","needs_review","not_applicable","pending"].includes(String(clean.outcome)))
     return respond({error:"Choose a compliance outcome"},400);
    if(!["open","in_progress","resolved","closed"].includes(String(clean.status)))
     return respond({error:"Choose a valid case status"},400);
    if(!["low","normal","high","urgent"].includes(String(clean.priority)))
     return respond({error:"Choose a valid priority"},400);
    if(!text(clean.findings,6000))return respond({error:"Enter the compliance findings or results"},400);
    for(const dateField of ["review_date","due_date"]){
     if(clean[dateField]&&(!/^\d{4}-\d{2}-\d{2}$/.test(String(clean[dateField]))||
       !Number.isFinite(Date.parse(String(clean[dateField])+"T12:00:00Z"))))
      return respond({error:"Invalid "+dateField.replaceAll("_"," ")},400);
    }
    clean.employer=text(company.data.data?.legal_name,180);
    clean.company_id=company.data.id;
    allowedContext=context;
   }
   if(kind==="people"){
    // A person exists only in the context of an authorized employer or owner-operator.
    // Company ownership is checked for BOTH create and edit, not merely in the UI.
    if(body.record_context==="shared")return respond({error:"People must belong to a DOT or NON-DOT company, not a shared workspace"},400);
    if(!uuid(clean.company_id))return respond({error:"Choose the employer or owner-operator associated with this person"},400);
    const company=await collection.select("id,kind,operating_context,data")
     .eq("id",clean.company_id).eq("tenant_id",tenantId)
     .in("kind",context==="dot"?["employers","owner_operators"]:["employers"])
     .eq("operating_context",context).is("archived_at",null).maybeSingle();
    if(company.error)throw company.error;
    if(!company.data)return respond({error:"The selected company is not available in this workspace"},400);
    if(!text(clean.first_name,120)||!text(clean.last_name,120))
     return respond({error:"First and last names are required"},400);
    const type=text(clean.relationship,24);
    if(!["employee","contact","staff"].includes(type))
     return respond({error:"Select Employee, Company Contact or Staff"},400);
    if(clean.status&&!["active","inactive"].includes(String(clean.status)))
     return respond({error:"Invalid person status"},400);
    clean.employer=text(company.data.data?.legal_name,180);
    clean.company_id=company.data.id;
    clean.relationship=type;
    clean.status=clean.status||"active";
    allowedContext=context;
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
   if(body.kind==="results")return respond({error:"Official result records cannot be archived by the C/TPA"},403);
   if(body.kind==="audits")return respond({error:"Audit records must be retained for compliance history"},403);
   if(["employers","owner_operators"].includes(String(body.kind))){
    const people=await collection.select("id",{count:"exact",head:true})
     .eq("tenant_id",tenantId).eq("kind","people").eq("operating_context",context)
     .eq("data->>company_id",body.id).is("archived_at",null);
    if(people.error)throw people.error;
    if((people.count||0)>0)return respond({error:"Reassign or archive the linked people before archiving this company"},409);
   }
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
