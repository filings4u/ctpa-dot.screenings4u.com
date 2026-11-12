import { createClient } from "npm:@supabase/supabase-js@2";
const H={"Access-Control-Allow-Origin":"https://ctpa.screenings4u.com","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const out=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:H});
const uuid=(x:unknown)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(x||""));
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:H});
 if(req.method!=="POST")return out({error:"POST required"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")||"",anon=Deno.env.get("SUPABASE_ANON_KEY")||"",secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!url||!anon||!secret)return out({error:"Service not configured"},503);
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!token)return out({error:"Authentication required"},401);
  const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await auth.auth.getUser(token);
  if(authError||!user?.id||!user.email_confirmed_at)return out({error:"Verified sign-in required"},401);
  const payload=await req.json().catch(()=>({}));
  const action=String(payload.action||"access"),ctpaId=String(payload.ctpa_id||""),subscriptionId=String(payload.subscription_id||"");
  if(!["access","overview","catalog","create_order"].includes(action)||!uuid(ctpaId)||!uuid(subscriptionId))return out({error:"Invalid C/TPA workspace and subscription"},400);
  const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  // Reuse the C/TPA's verified workspace boundary; organization membership alone is insufficient.
  const session=await db.rpc("ctpa_dot_session_context",{p_user_id:user.id,p_ctpa_id:ctpaId,p_subscription_id:subscriptionId});
  if(session.error)throw session.error;
  const ctx=session.data;
  const validPlan=["dot_ctpa_essential","dot_ctpa_professional","dot_ctpa_enterprise"].includes(String(ctx?.plan?.code||""));
  const subscriptionActive=["active","trial","trialing"].includes(String(ctx?.subscription?.status||""));
  if(!ctx?.ctpa||!ctx?.membership||ctx.subscription?.id!==subscriptionId||!validPlan||ctx.plan?.active===false||
     ctx.portal_access?.enabled!==true||(!ctx.unlimited_access&&!subscriptionActive))
    return out({authorized:false,reason:"C/TPA subscription or portal access is not active"},403);
  const c=await db.from("ctpas").select("id,organization_id,status").eq("id",ctpaId).maybeSingle();
  if(c.error)throw c.error;
  if(!c.data?.organization_id||c.data.status!=="active")return out({authorized:false,reason:"C/TPA workspace unavailable"},403);
  const member=await db.from("organization_memberships").select("id,status").eq("organization_id",c.data.organization_id).eq("user_id",user.id).eq("status","active").limit(1);
  if(member.error)throw member.error;
  if(!member.data?.length)return out({authorized:false,reason:"You are not a member of this C/TPA organization"},403);
  const grant=await db.from("workforce_lab_company_entitlements")
   .select("id,organization_id,ctpa_id,status,source_order_id,linked_customer_user_id,grant_source")
   .eq("organization_id",c.data.organization_id).eq("ctpa_id",ctpaId).eq("entitlement_code","lab_account").eq("status","active").limit(1).maybeSingle();
  if(grant.error)throw grant.error;
  if(!grant.data)return out({authorized:false,reason:"Lab Account add-on not enabled for this company"},403);
  if(action==="access")return out({authorized:true,features:{lab_account:true},organization_id:c.data.organization_id});
  if(action==="catalog"||action==="create_order"){
   if(!grant.data.source_order_id||!grant.data.linked_customer_user_id)
    return out({error:"A verified Lab Account purchase is required"},403);
   const [order,intake,assigned]=await Promise.all([
    db.from("orders").select("id,payment_status").eq("id",grant.data.source_order_id).maybeSingle(),
    db.from("lab_account_intakes").select("id,status,account_status,customer_user_id")
     .eq("order_id",grant.data.source_order_id).eq("customer_user_id",grant.data.linked_customer_user_id).limit(2),
    db.from("ctpa_lab_accounts").select("id,config,status")
     .eq("ctpa_id",ctpaId).eq("status","active").limit(40)
   ]);
   if(order.error||intake.error||assigned.error)throw order.error||intake.error||assigned.error;
   if(order.data?.payment_status!=="paid"||intake.data?.length!==1||
      intake.data[0].status!=="completed"||intake.data[0].account_status!=="active")
    return out({error:"Lab Account purchase and onboarding must be active"},403);
   if(!assigned.data?.length)return out({error:"No active laboratory account is assigned"},403);
   const allServices=await db.from("services")
    .select("id,name,sku,description,metadata").eq("active",true).order("name").limit(500);
   if(allServices.error)throw allServices.error;
   const catalog=(allServices.data||[]).filter((x:any)=>
    x.metadata?.public_site==="screenings4u"&&x.metadata?.public_catalog===true&&
    x.metadata?.testing_operation===true);
   if(action==="catalog")return out({authorized:true,services:catalog.map((x:any)=>({
    id:x.id,name:x.name,description:x.description,sku:x.sku,
    testing_scope:x.metadata?.testing_scope||null
   }))});
   // Preserve the original Lab Account case creation and management handoff.
   // Never issue passes or book collection appointments automatically here.
   const val=(x:unknown,max=200)=>String(x??"").trim().slice(0,max);
   const first=val(payload.first_name,101),last=val(payload.last_name,101),
    email=val(payload.donor_email,255),phone=val(payload.donor_phone,35),
    state=val(payload.state_of_residence,2).toUpperCase(),
    reason=val(payload.reason_for_test,3).toUpperCase(),
    agency=val(payload.testing_authority,12).toUpperCase(),
    dob=val(payload.date_of_birth,10),
    note=val(payload.notes,1000),
    serviceId=val(payload.service_id,40);
   if(!uuid(serviceId)||!first||!last||first.length>100||last.length>100||
      !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)||
      !/^[A-Z]{2}$/.test(state)||!["PE","RN","PA","RS","RT","FU","NI"].includes(reason)||
      !/^\\d{4}-\\d{2}-\\d{2}$/.test(dob)||Number.isNaN(Date.parse(dob))||
      new Date(dob)>new Date())return out({error:"Complete the required donor and test fields"},400);
   const service=catalog.find((x:any)=>x.id===serviceId);
   if(!service)return out({error:"Selected testing service is unavailable"},409);
   const scope=String(service.metadata?.testing_scope||"").toLowerCase();
   if(scope==="dot"&&!["FMCSA","FAA","FRA","FTA","PHMSA","USCG"].includes(agency))
    return out({error:"Select the required DOT authority"},400);
   const now=new Date().toISOString();
   const newCase=await db.from("testing_cases").insert({
    service_id:serviceId,customer_user_id:user.id,customer_email:user.email,
    donor_name:first+" "+last,donor_email:email,donor_phone:phone||null,
    dot_test:scope==="dot",dot_agency:scope==="dot"?agency:null,
    test_reason:reason,test_type:service.name,panel_name:service.name,
    priority:"normal",status:"awaiting_schedule",
    metadata:{source:"lab_account_portal",ctpa_id:ctpaId,organization_id:c.data.organization_id,
     request_status:"submitted_for_management_review",labcorp_eligible:service.metadata?.labcorp_fulfillment===true,
     registration_submitted:false,donor_date_of_birth:dob,state_of_residence:state,request_notes:note},
    created_by:user.id,created_at:now,updated_at:now
   }).select("id,case_number,status").single();
   if(newCase.error)throw newCase.error;
   const event=await db.from("testing_case_events").insert({
    id:crypto.randomUUID(),testing_case_id:newCase.data.id,
    event_type:"case_created",from_status:null,to_status:newCase.data.status,
    notes:"Workforce C/TPA Lab Account testing request submitted for management processing",
    metadata:{source:"lab_account_portal",ctpa_id:ctpaId,organization_id:c.data.organization_id},
    actor_user_id:user.id,created_at:now
   });
   if(event.error)console.error("Lab testing case event creation",event.error);
   return out({ok:true,case:newCase.data,donor_pass:"not_issued",
    labcorp_submission:"not_submitted",status_message:"Testing request submitted for Workforce management review"});
  }
  const [labs,intake]=await Promise.all([
   db.from("ctpa_lab_accounts").select("id,lab_name,account_code,is_primary,status,config,updated_at").eq("ctpa_id",ctpaId).order("created_at",{ascending:true}).limit(40),
   grant.data.source_order_id&&grant.data.linked_customer_user_id
    ?db.from("lab_account_intakes").select("id,order_number,status,account_status,created_at,completed_at").eq("order_id",grant.data.source_order_id).eq("customer_user_id",grant.data.linked_customer_user_id).limit(20)
    :Promise.resolve({data:[],error:null})
  ]);
  if(labs.error||intake.error)throw labs.error||intake.error;
  const intakeIds=(intake.data||[]).map((x:any)=>x.id);
  const shipment=intakeIds.length
   ?await db.from("house_lab_supply_shipments").select("id,intake_id,carrier,tracking_number,status,items_description,created_at").in("intake_id",intakeIds).order("created_at",{ascending:false}).limit(100)
   :{data:[],error:null};
  if(shipment.error)throw shipment.error;
  // Stage only a read-only inventory of requests generated in the existing
  // Lab Account portal by the verified purchaser linked to this company grant.
  // Require an explicit case-to-C/TPA link as well as purchaser identity.
  // Legacy records lacking metadata.ctpa_id are intentionally withheld until
  // reconciled by staff; purchaser identity alone is not company ownership.
  let testingRequests:any[]=[];
  if(grant.data.source_order_id&&grant.data.linked_customer_user_id&&intakeIds.length){
   const cases=await db.from("testing_cases")
    .select("id,case_number,status,test_type,created_at,scheduled_at,collected_at,completed_at,metadata")
    .eq("customer_user_id",grant.data.linked_customer_user_id)
    .contains("metadata",{source:"lab_account_portal",ctpa_id:ctpaId})
    .order("created_at",{ascending:false}).limit(100);
   if(cases.error)throw cases.error;
   const caseIds=(cases.data||[]).map((x:any)=>x.id);
   const passByCase=new Map<string,{status:string,issued_at:string|null}>();
   if(caseIds.length){
    // Pass status only. Never return pass numbers, donor names or pass URLs
    // through this migration inventory; the dedicated pass workflow owns them.
    const passes=await db.from("testing_donor_passes")
     .select("testing_case_id,status,issued_at,created_at")
     .eq("customer_user_id",grant.data.linked_customer_user_id)
     .in("testing_case_id",caseIds)
     .order("created_at",{ascending:false}).limit(250);
    if(passes.error)throw passes.error;
    for(const p of passes.data||[])if(!passByCase.has(p.testing_case_id))
     passByCase.set(p.testing_case_id,{status:String(p.status||"pending"),issued_at:p.issued_at||null});
   }
   testingRequests=(cases.data||[]).map((x:any)=>({
    id:x.id,case_number:x.case_number,status:x.status,test_type:x.test_type,
    created_at:x.created_at,scheduled_at:x.scheduled_at,
    collected_at:x.collected_at,completed_at:x.completed_at,
    donor_pass_status:passByCase.get(x.id)?.status||"not_issued",
    donor_pass_issued_at:passByCase.get(x.id)?.issued_at||null
   }));
  }
  return out({
   authorized:true,features:{lab_account:true},
   lab_accounts:(labs.data||[]).map((x:any)=>({
    id:x.id,lab_name:x.lab_name,account_code:x.account_code,is_primary:x.is_primary,status:x.status,
    account_numbers:(()=>{
     // A single-number lab assignment may be NON-DOT, hair, or oral.
     // Never relabel it as a DOT account merely because account_code exists.
     const config=x.config&&typeof x.config==="object"?x.config:{};
     const configured=config.account_numbers&&typeof config.account_numbers==="object"?config.account_numbers:{};
     const allowed=["dot","non_dot","hair","oral"];
     const numbers:Record<string,string>={dot:"",non_dot:"",hair:"",oral:"",unclassified:""};
     for(const key of allowed)numbers[key]=String(configured[key]||"");
     const accountType=String(config.account_type||"").toLowerCase();
     const single=String(x.account_code||"");
     if(single){
      if(allowed.includes(accountType)){
       if(!numbers[accountType])numbers[accountType]=single;
       else if(numbers[accountType]!==single)numbers.unclassified=single;
      }else if(!allowed.some(key=>numbers[key]===single)){
       // Unknown type, including legacy untyped records: do not infer DOT.
       numbers.unclassified=single;
      }
     }
     return numbers;
    })()
   })),
   setup_records:intake.data||[],shipments:shipment.data||[],testing_requests:testingRequests,
   testing_request_mapping:"explicit_ctpa_id_required",
   note:"This migration view is read-only. Test orders, CCFs, results, and supply requests remain in their existing authorized workflows until integrated and tested."
  });
 }catch(e){console.error("workforce-ctpa-lab-services",e);return out({error:"Unable to load your Lab Account"},500)}
});