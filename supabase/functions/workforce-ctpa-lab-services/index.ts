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
  if(!["access","overview","catalog","create_order","supply_catalog","request_supplies","documents","document_url","issued_passes","legacy_clients","legacy_supply_alerts","legacy_deliveries","report_specimen_shipped"].includes(action)||!uuid(ctpaId)||!uuid(subscriptionId))return out({error:"Invalid C/TPA workspace and subscription"},400);
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
  if(action==="report_specimen_shipped"){
   // Reuse the existing Workforce Testing specimen-shipment RPC after checking
   // that the specific case belongs to the signed-in user and selected company.
   const caseId=String(payload.case_id||"");
   const carrier=String(payload.carrier||"").trim(),tracking=String(payload.tracking_number||"").trim();
   const trackingUrl=String(payload.tracking_url||"").trim();
   if(!uuid(caseId)||carrier.length<2||carrier.length>100||tracking.length<4||tracking.length>180||
      trackingUrl.length>1000||(trackingUrl&&!/^https:\/\//i.test(trackingUrl)))
    return out({error:"Enter a valid collected case, carrier and shipment tracking"},400);
   const match=await db.from("testing_cases").select("id,status")
    .eq("id",caseId).eq("customer_user_id",user.id)
    .contains("metadata",{source:"lab_account_portal",ctpa_id:ctpaId,organization_id:c.data.organization_id})
    .maybeSingle();
   if(match.error)throw match.error;
   if(!match.data)return out({error:"This testing case does not belong to your selected C/TPA"},404);
   const shipped=await db.rpc("s4u_report_house_lab_specimen_shipped",{
    p_case_id:caseId,p_user_id:user.id,p_carrier:carrier,
    p_tracking_number:tracking,p_tracking_url:trackingUrl
   });
   if(shipped.error)return out({error:shipped.error.message},409);
   const admin=Deno.env.get("SCREENINGS4U_ADMIN_EMAIL")||"",key=Deno.env.get("RESEND_API_KEY")||"";
   if(admin&&key){
    const clean=(v:string)=>v.replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]||x));
    const html='<div style="font-family:Arial,sans-serif;background:#f3f6fa;padding:25px;color:#01122f"><div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden"><div style="background:#01122f;padding:20px"><img src="https://workforce.screenings4u.com/images/logo2.png" width="210" alt="Workforce"></div><div style="padding:24px"><h2>Laboratory specimens shipped</h2><p>Verify delivery and laboratory accession in Workforce Testing Management.</p><p><strong>Case:</strong> '+clean(String(shipped.data?.case_number||""))+'</p><p><strong>Carrier:</strong> '+clean(carrier)+'</p><p><strong>Tracking:</strong> '+clean(tracking)+'</p></div></div></div>';
    try{
     const mail=await fetch("https://api.resend.com/emails",{
      method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},
      body:JSON.stringify({from:Deno.env.get("SCREENINGS4U_FROM_EMAIL")||"Workforce <notifications@screenings4u.com>",to:[admin],subject:"Workforce | Lab specimen shipped",html})
     });
     if(!mail.ok)console.error("Lab specimen shipment email",mail.status);
    }catch(error){console.error("Lab specimen shipment email",error)}
   }
   return out({ok:true,shipment:shipped.data,lab_receipt:"not_confirmed"});
  }
  if(["legacy_clients","legacy_supply_alerts","legacy_deliveries"].includes(action)){
   // Preserve previously created customer-scoped Lab Account records without
   // silently converting contacts into C/TPA employer or donor records.
   if(!grant.data.source_order_id||grant.data.linked_customer_user_id!==user.id)
    return out({authorized:true,records:[]});
   if(action==="legacy_clients"){
    const q=await db.from("lab_portal_clients")
     .select("id,company_name,contact_name,contact_email,phone,program_type,notes,created_at")
     .eq("customer_user_id",user.id).is("archived_at",null)
     .order("created_at",{ascending:false}).limit(200);
    if(q.error)throw q.error;
    return out({authorized:true,records:q.data||[]});
   }
   if(action==="legacy_supply_alerts"){
    const q=await db.from("lab_portal_supply_alerts")
     .select("id,supply_name,estimated_on_hand,reorder_threshold,enabled,last_alert_at,created_at")
     .eq("customer_user_id",user.id).order("created_at",{ascending:false}).limit(200);
    if(q.error)throw q.error;
    return out({authorized:true,records:q.data||[]});
   }
   const q=await db.from("lab_portal_result_deliveries")
    .select("id,testing_case_id,recipient_name,recipient_email,purpose,status,created_at,completed_at")
    .eq("customer_user_id",user.id).order("created_at",{ascending:false}).limit(200);
   if(q.error)throw q.error;
   return out({authorized:true,records:q.data||[]});
  }
  if(action==="issued_passes"){
   // Issued passes contain donor details: return only the signed-in user's
   // own cases within the explicitly selected, purchased C/TPA organization.
   if(!grant.data.source_order_id)
    return out({authorized:true,passes:[]});
   const cases=await db.from("testing_cases").select("id")
    .eq("customer_user_id",user.id)
    .contains("metadata",{source:"lab_account_portal",ctpa_id:ctpaId,organization_id:c.data.organization_id})
    .order("created_at",{ascending:false}).limit(250);
   if(cases.error)throw cases.error;
   const ids=(cases.data||[]).map((r:any)=>r.id);
   if(!ids.length)return out({authorized:true,passes:[]});
   const rows=await db.from("testing_donor_passes")
    .select("id,pass_number,status,testing_case_id,donor_name,test_type,collection_site_name,collection_site_address,collection_deadline,issued_at")
    .eq("customer_user_id",user.id).eq("status","issued")
    .in("testing_case_id",ids).order("issued_at",{ascending:false}).limit(250);
   if(rows.error)throw rows.error;
   return out({authorized:true,passes:rows.data||[]});
  }
  if(action==="documents"||action==="document_url"){
   // Legacy published Lab Account documents were assigned to a purchaser,
   // not a company. Keep that original privacy boundary until migrated.
   if(!grant.data.source_order_id||grant.data.linked_customer_user_id!==user.id)
    return action==="documents"?out({authorized:true,documents:[]}):out({error:"Document access requires the assigned purchaser"},403);
   if(action==="documents"){
    const docs=await db.from("lab_customer_published_documents")
     .select("id,title,description,category,original_filename,mime_type,created_at")
     .eq("customer_user_id",user.id).eq("is_published",true)
     .is("archived_at",null).order("created_at",{ascending:false}).limit(200);
    if(docs.error)throw docs.error;
    return out({authorized:true,documents:docs.data||[]});
   }
   if(!uuid(payload.document_id))return out({error:"Valid document required"},400);
   const row=await db.from("lab_customer_published_documents")
    .select("id,title,storage_bucket,storage_path,original_filename,mime_type")
    .eq("id",payload.document_id).eq("customer_user_id",user.id)
    .eq("is_published",true).is("archived_at",null).maybeSingle();
   if(row.error)throw row.error;
   if(!row.data?.storage_path||row.data.storage_bucket!=="testing-private-documents")
    return out({error:"Published document unavailable"},404);
   const safeName=String(row.data.original_filename||row.data.title||"Workforce-Lab-Document.pdf")
    .replace(/[\\/\\r\\n"<>]/g,"_").slice(0,180);
   const signed=await db.storage.from("testing-private-documents")
    .createSignedUrl(row.data.storage_path,120,{download:payload.download===true?safeName:undefined});
   if(signed.error||!signed.data?.signedUrl)throw signed.error||Error("Unable to issue secure document link");
   return out({url:signed.data.signedUrl,title:row.data.title,mime_type:row.data.mime_type});
  }
  if(["catalog","create_order","supply_catalog","request_supplies"].includes(action)){
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
   if(action==="supply_catalog"||action==="request_supplies"){
    const stock=await db.from("ic_portal_supply_items")
     .select("id,sku,name,description,unit").eq("active",true).order("name").limit(100);
    if(stock.error)throw stock.error;
    if(action==="supply_catalog")return out({authorized:true,supplies:stock.data||[]});
    const lines=Array.isArray(payload.lines)?payload.lines:[];
    if(!lines.length||lines.length>40)return out({error:"Choose the required supply quantities"},400);
    const selected=new Map<string,number>();
    for(const line of lines){
     const id=String(line?.item_id||""),quantity=Number(line?.quantity);
     if(!uuid(id)||!Number.isInteger(quantity)||quantity<1||quantity>1000||selected.has(id))
      return out({error:"Invalid supply selection or quantity"},400);
     selected.set(id,quantity);
    }
    const available=new Set((stock.data||[]).map((x:any)=>x.id));
    if([...selected.keys()].some(id=>!available.has(id)))
     return out({error:"One or more supply items are unavailable"},409);
    const address=payload.shipping_address&&typeof payload.shipping_address==="object"?payload.shipping_address:{};
    const fields=["recipient","line1","city","state","postal_code"];
    if(fields.some(k=>typeof address[k]!=="string"||!address[k].trim()||address[k].length>180))
     return out({error:"Complete the shipping address"},400);
    if(!/^[A-Za-z]{2}$/.test(address.state)||!/^[0-9]{5}(-[0-9]{4})?$/.test(address.postal_code))
     return out({error:"Enter a valid state and postal code"},400);
    const notes=String(payload.notes||"").trim();
    if(notes.length>1000||String(address.line2||"").length>180)return out({error:"Shipping details are too long"},400);
    const orderRow=await db.from("ic_portal_supply_orders").insert({
     contractor_user_id:user.id,status:"requested",notes,
     shipping_address:{
      recipient:address.recipient.trim(),line1:address.line1.trim(),
      line2:String(address.line2||"").trim(),city:address.city.trim(),
      state:address.state.toUpperCase(),postal_code:address.postal_code,
      source_portal:"lab_account",ctpa_id:ctpaId,organization_id:c.data.organization_id
     }
    }).select("id,status,created_at").single();
    if(orderRow.error)throw orderRow.error;
    const detail=await db.from("ic_portal_supply_order_lines").insert(
     [...selected].map(([item_id,quantity])=>({order_id:orderRow.data.id,item_id,quantity}))
    );
    if(detail.error){
     const removed=await db.from("ic_portal_supply_orders").delete()
      .eq("id",orderRow.data.id).eq("contractor_user_id",user.id).eq("status","requested");
     if(removed.error)console.error("Supply request rollback failed",removed.error);
     throw detail.error;
    }
    return out({ok:true,request:orderRow.data,status_message:"Supply request sent to Workforce testing operations for processing"});
   }
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
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||
      !/^[A-Z]{2}$/.test(state)||!["PE","RN","PA","RS","RT","FU","NI"].includes(reason)||
      !/^\d{4}-\d{2}-\d{2}$/.test(dob)||Number.isNaN(Date.parse(dob))||
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
    .contains("metadata",{source:"lab_account_portal",ctpa_id:ctpaId,organization_id:c.data.organization_id})
    .order("created_at",{ascending:false}).limit(100);
   if(cases.error)throw cases.error;
   const caseIds=(cases.data||[]).map((x:any)=>x.id);
   const passByCase=new Map<string,{status:string,issued_at:string|null}>();
   if(caseIds.length){
    // Pass status only. Never return pass numbers, donor names or pass URLs
    // through this migration inventory; the dedicated pass workflow owns them.
    const passes=await db.from("testing_donor_passes")
     .select("testing_case_id,status,issued_at,created_at")
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