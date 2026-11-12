import { createClient } from "npm:@supabase/supabase-js@2";
import {PDFDocument,StandardFonts,rgb} from "npm:pdf-lib@1.17.1";
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
  if(!["access","overview","catalog","create_order","supply_catalog","request_supplies","documents","document_url","issued_passes","legacy_clients","legacy_supply_alerts","legacy_deliveries","report_specimen_shipped","order_details","update_order","ccf_archive","ccf_url","released_cases","request_result_delivery","lab_purchases","lab_invoices","lab_invoice_detail","historical_documents","historical_document_url","lab_intake_details","lab_intake_pdf","lab_client_save","lab_client_archive","supply_alert_save","supply_alert_delete","lab_analytics","lab_released_results","lab_consortiums","lab_consortium_members","lab_service_requests"].includes(action)||!uuid(ctpaId)||!uuid(subscriptionId))return out({error:"Invalid C/TPA workspace and subscription"},400);
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
  if(["historical_documents","historical_document_url","lab_intake_details","lab_intake_pdf"].includes(action)){
   // Historical files have user ownership rather than a company assignment;
   // never expose one purchaser's documents to all C/TPA members.
   if(!grant.data.source_order_id||grant.data.linked_customer_user_id!==user.id)
    return out({authorized:true,documents:[]});
   const types=["lab_account","lab_account_notice","lab_account_setup","lab_account_document",
    "lab_account_compliance","lab_account_guide","lab_account_howto"];
   if(action==="historical_documents"){
    const [docs,service,forms]=await Promise.all([
     db.from("documents").select("id,title,description,document_type,mime_type,created_at,storage_bucket,storage_path")
      .eq("owner_user_id",user.id).in("document_type",types)
      .is("archived_at",null).order("created_at",{ascending:false}).limit(250),
     db.from("lab_plan_service_requests").select("id,title,feature_code,document_name,document_bucket,document_path,fulfilled_at,created_at")
      .eq("customer_user_id",user.id).eq("status","completed")
      .not("document_path","is",null).limit(150),
     db.from("standalone_form_submissions").select("id,submission_number,form_title,status,created_at")
      .eq("customer_user_id",user.id)
      .in("form_key",["lab_account_intake","lab_account_intake_standalone"])
      .order("created_at",{ascending:false}).limit(150)
    ]);
    for(const res of [docs,service,forms])if(res.error)throw res.error;
    const formIds=(forms.data||[]).map((x:any)=>x.id);
    const attachments=formIds.length?await db.from("standalone_form_submission_files")
      .select("id,submission_id,original_file_name,mime_type,document_type,storage_bucket,storage_path,created_at")
      .in("submission_id",formIds).limit(250):{data:[],error:null};
    if(attachments.error)throw attachments.error;
    const result=[
     ...(docs.data||[]).map((d:any)=>({
      id:d.id,source:"account",title:d.title,description:d.description,
      mime_type:d.mime_type,created_at:d.created_at,
      downloadable:!!(d.storage_bucket&&d.storage_path)
     })),
     ...(service.data||[]).filter((d:any)=>
      d.document_bucket==="testing-private-documents"&&
      String(d.document_path||"").startsWith("lab-plan-services/"+user.id+"/"+d.id+"/"))
      .map((d:any)=>({id:d.id,source:"service",title:d.title||"Completed laboratory service",
       description:d.feature_code,mime_type:"application/pdf",
       created_at:d.fulfilled_at||d.created_at,downloadable:true})),
     ...(forms.data||[]).map((d:any)=>({id:d.id,source:"intake",title:d.form_title||"Lab Account Intake",
      description:d.submission_number,status:d.status,
      created_at:d.created_at,downloadable:false})),
     ...(attachments.data||[]).map((d:any)=>({id:d.id,source:"attachment",
      title:d.original_file_name||"Lab Account attachment",description:d.document_type,
      mime_type:d.mime_type,created_at:d.created_at,
      downloadable:!!(d.storage_bucket&&d.storage_path)}))
    ];
    return out({authorized:true,documents:result.sort((a:any,b:any)=>
     new Date(b.created_at).getTime()-new Date(a.created_at).getTime())});
   }
   const recordId=String(payload.document_id||"");
   if(!uuid(recordId))return out({error:"Valid document identifier required"},400);
   if(action==="lab_intake_details"||action==="lab_intake_pdf"){
    const form=await db.from("standalone_form_submissions")
     .select("id,submission_number,form_title,status,created_at,payload")
     .eq("id",recordId).eq("customer_user_id",user.id)
     .in("form_key",["lab_account_intake","lab_account_intake_standalone"]).maybeSingle();
    if(form.error)throw form.error;
    if(!form.data)return out({error:"Lab Account intake unavailable"},404);
    const raw=form.data.payload&&typeof form.data.payload==="object"&&!Array.isArray(form.data.payload)?
     form.data.payload:{};
    const detail=Object.fromEntries(Object.entries(raw).filter(([key])=>
     !/(captcha|turnstile|token|password|credential|secret|api[_-]?key|authorization|form_started_at)/i.test(key)
    ));
    if(action==="lab_intake_pdf"){
     const pdf=await PDFDocument.create();
     const font=await pdf.embedFont(StandardFonts.Helvetica);
     const strong=await pdf.embedFont(StandardFonts.HelveticaBold);
     pdf.setTitle("Workforce Lab Account Intake");
     pdf.setAuthor("Workforce");
     let page=pdf.addPage([612,792]),y=738;
     const fresh=()=>{page=pdf.addPage([612,792]);y=738};
     const draw=(value:unknown,size=10,bold=false)=>{
      const face=bold?strong:font;
      const raw=String(value??"").replace(/[^\x20-\x7E]/g," ").slice(0,12000);
      let line="";
      const write=(str:string)=>{
       if(y<65)fresh();
       page.drawText(str,{x:48,y,size,font:face,color:rgb(.02,.07,.18)});
       y-=size+7;
      };
      for(const word of raw.split(/\s+/)){
       if(!word)continue;
       const candidate=line?line+" "+word:word;
       if(face.widthOfTextAtSize(candidate,size)>510&&line){write(line);line=word}
       else line=candidate;
      }
      if(line)write(line);
     };
     draw("WORKFORCE | LAB ACCOUNT",12,true);y-=5;
     draw(form.data.form_title||"Lab Account Intake",18,true);y-=7;
     draw("Reference: "+String(form.data.submission_number||"Not assigned"));
     draw("Submitted: "+String(form.data.created_at||""));y-=15;
     for(const [key,value] of Object.entries(detail)){
      draw(String(key).replace(/[_-]/g," ").toUpperCase(),10,true);
      draw(typeof value==="string"?value:JSON.stringify(value),10);y-=7;
     }
     const bytes=await pdf.save(),parts:string[]=[];
     for(let i=0;i<bytes.length;i+=32768)
      parts.push(String.fromCharCode(...bytes.slice(i,i+32768)));
     return out({pdf_base64:btoa(parts.join("")),filename:"Workforce-Lab-Account-Intake.pdf",mime_type:"application/pdf"});
    }
    return out({authorized:true,intake:{
      id:form.data.id,title:form.data.form_title||"Lab Account Intake",
      reference:form.data.submission_number,status:form.data.status,
      created_at:form.data.created_at,fields:detail
    }});
   }
   const source=String(payload.source||"");
   let bucket="",filePath="",title="",mime="";
   if(source==="account"){
    const q=await db.from("documents").select("id,title,mime_type,storage_bucket,storage_path")
     .eq("id",recordId).eq("owner_user_id",user.id).in("document_type",types)
     .is("archived_at",null).maybeSingle();
    if(q.error)throw q.error;
    if(!q.data)return out({error:"Account document unavailable"},404);
    bucket=q.data.storage_bucket||"";filePath=q.data.storage_path||"";
    title=q.data.title||"Laboratory document";mime=q.data.mime_type||"";
   }else if(source==="service"){
    const q=await db.from("lab_plan_service_requests")
     .select("id,title,document_bucket,document_path,document_name")
     .eq("id",recordId).eq("customer_user_id",user.id).eq("status","completed").maybeSingle();
    if(q.error)throw q.error;
    if(!q.data||q.data.document_bucket!=="testing-private-documents"||
       !String(q.data.document_path||"").startsWith("lab-plan-services/"+user.id+"/"+recordId+"/"))
     return out({error:"Completed service document unavailable"},404);
    bucket=q.data.document_bucket;filePath=q.data.document_path;
    title=q.data.document_name||q.data.title||"Completed service";mime="application/pdf";
   }else if(source==="attachment"){
    const forms=await db.from("standalone_form_submissions").select("id")
     .eq("customer_user_id",user.id)
     .in("form_key",["lab_account_intake","lab_account_intake_standalone"])
     .limit(150);
    if(forms.error)throw forms.error;
    const ids=(forms.data||[]).map((x:any)=>x.id);
    if(!ids.length)return out({error:"Intake attachment unavailable"},404);
    const q=await db.from("standalone_form_submission_files")
     .select("id,original_file_name,mime_type,storage_bucket,storage_path")
     .eq("id",recordId).in("submission_id",ids).maybeSingle();
    if(q.error)throw q.error;
    if(!q.data)return out({error:"Intake attachment unavailable"},404);
    bucket=q.data.storage_bucket||"";filePath=q.data.storage_path||"";
    title=q.data.original_file_name||"Lab Account attachment";mime=q.data.mime_type||"";
   }else return out({error:"Unsupported document source"},400);
   if(!bucket||!filePath)return out({error:"Document file unavailable"},404);
   const filename=String(title).replace(/[^a-zA-Z0-9._ -]/g,"_").slice(0,160);
   const signed=await db.storage.from(bucket).createSignedUrl(filePath,120,{
    download:payload.download===true?filename:undefined
   });
   if(signed.error||!signed.data?.signedUrl)throw signed.error||Error("Document download unavailable");
   return out({url:signed.data.signedUrl,title,mime_type:mime,expires_in:120});
  }
  if(["lab_purchases","lab_invoices","lab_invoice_detail"].includes(action)){
   // These records are individually purchased or addressed; no billing data is
   // shared across C/TPA members or exposed by matching customer email.
   if(!grant.data.source_order_id||grant.data.linked_customer_user_id!==user.id)
    return out({authorized:true,orders:[],invoices:[]});
   if(action==="lab_purchases"){
    const purchase=await db.from("orders")
     .select("id,order_number,user_id,payment_status,status,total,currency,created_at,paid_at,order_items(quantity,unit_price,line_total,metadata,services(name,sku))")
     .eq("id",grant.data.source_order_id).maybeSingle();
    if(purchase.error)throw purchase.error;
    if(!purchase.data)return out({authorized:true,orders:[]});
    const items=(purchase.data.order_items||[]).map((x:any)=>({
     name:x.services?.name||x.metadata?.service_name||"Laboratory account service",
     sku:String(x.services?.sku||x.metadata?.service_sku||"").toLowerCase(),
     quantity:x.quantity,unit_price:x.unit_price,line_total:x.line_total
    }));
    const allowed=new Set(["lab-account","lab-account-random-consortium",
     "lab-account-random-consortium-docs","lab-account-workflow-test-1",
     "lab-upgrade-consortium","lab-upgrade-consortium-docs","lab-upgrade-docs"]);
    const selected=items.filter((x:any)=>allowed.has(x.sku));
    const intake=await db.from("lab_account_intakes").select("service_sku")
     .eq("order_id",purchase.data.id).eq("customer_user_id",user.id).limit(1);
    if(intake.error)throw intake.error;
    if(!selected.length&&items.length===1&&!items[0].sku&&
       intake.data?.length===1&&allowed.has(String(intake.data[0].service_sku).toLowerCase()))
     selected.push({...items[0],sku:intake.data[0].service_sku});
    if(!selected.length)return out({authorized:true,orders:[]});
    const subtotal=selected.reduce((sum:number,item:any)=>
     sum+Number(item.line_total??Number(item.unit_price||0)*Number(item.quantity||1)),0);
    return out({authorized:true,orders:[{
     id:purchase.data.id,order_number:purchase.data.order_number,
     payment_status:purchase.data.payment_status,status:purchase.data.status,
     created_at:purchase.data.created_at,paid_at:purchase.data.paid_at,
     total:subtotal,currency:purchase.data.currency,items:selected
    }]});
   }
   // Lab invoice listing is tied to the verified Lab Account purchase order,
   // not every invoice belonging to this user or company.
   const invoices=await db.from("invoices")
    .select("id,invoice_number,status,issue_date,due_date,total,amount_paid,amount_due,currency,notes,terms,sent_at,paid_at,order_id")
    .eq("order_id",grant.data.source_order_id).eq("customer_user_id",user.id)
    .neq("status","draft").not("sent_at","is",null)
    .order("issue_date",{ascending:false}).limit(100);
   if(invoices.error)throw invoices.error;
   if(action==="lab_invoices")return out({authorized:true,invoices:invoices.data||[]});
   if(!uuid(payload.invoice_id))return out({error:"Valid Lab Account invoice required"},400);
   const invoice=(invoices.data||[]).find((x:any)=>x.id===payload.invoice_id);
   if(!invoice)return out({error:"Invoice not linked to this Lab Account purchase"},404);
   const items=await db.from("invoice_items")
    .select("id,description,quantity,unit_price,discount_amount,tax_amount,line_total")
    .eq("invoice_id",invoice.id).order("created_at",{ascending:true});
   if(items.error)throw items.error;
   return out({authorized:true,invoice,items:items.data||[]});
  }
  if(action==="released_cases"||action==="request_result_delivery"){
   // The legacy Lab Account delivery request is a review queue, not an
   // automatic transmission of confidential laboratory results.
   if(action==="released_cases"){
    const rows=await db.from("testing_cases").select("id,case_number,released_at,test_type")
     .eq("customer_user_id",user.id)
     .contains("metadata",{source:"lab_account_portal",ctpa_id:ctpaId,organization_id:c.data.organization_id})
     .not("released_at","is",null).order("released_at",{ascending:false}).limit(200);
    if(rows.error)throw rows.error;
    return out({authorized:true,released_cases:rows.data||[]});
   }
   const caseId=String(payload.case_id||"");
   const recipient=String(payload.recipient_email||"").trim().toLowerCase();
   const recipientName=String(payload.recipient_name||"").trim();
   if(!uuid(caseId)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)||
      recipient.length>254||recipientName.length>150)
    return out({error:"Select a released case and enter a valid recipient"},400);
   const owned=await db.from("testing_cases").select("id")
    .eq("id",caseId).eq("customer_user_id",user.id)
    .contains("metadata",{source:"lab_account_portal",ctpa_id:ctpaId,organization_id:c.data.organization_id})
    .not("released_at","is",null).maybeSingle();
   if(owned.error)throw owned.error;
   if(!owned.data)return out({error:"Only your released laboratory cases may be requested for delivery"},403);
   const existing=await db.from("lab_portal_result_deliveries").select("id")
    .eq("customer_user_id",user.id).eq("testing_case_id",caseId)
    .eq("recipient_email",recipient).in("status",["pending_review","approved","delivered"])
    .limit(1);
   if(existing.error)throw existing.error;
   if(existing.data?.length)return out({error:"A delivery request already exists for this recipient"},409);
   const created=await db.from("lab_portal_result_deliveries").insert({
    customer_user_id:user.id,testing_case_id:caseId,
    recipient_email:recipient,recipient_name:recipientName,
    status:"pending_review"
   }).select("id,status,created_at").single();
   if(created.error)throw created.error;
   return out({ok:true,delivery:created.data,
    status_message:"Result delivery request submitted for Workforce review"});
  }
  if(action==="ccf_archive"||action==="ccf_url"){
   // Archive only customer-visible CCFs for released cases owned by the
   // requesting user and explicitly associated with this C/TPA company.
   const readable=(d:any)=>/\b(ccf|chain.of.custody|custody)\b/i.test(
      String(d.document_type||"")+" "+String(d.title||""))&&
      ["customer","public","customer_portal","released"].includes(String(d.visibility||"").toLowerCase());
   if(action==="ccf_archive"){
    const cases=await db.from("testing_cases").select("id,case_number")
     .eq("customer_user_id",user.id)
     .contains("metadata",{source:"lab_account_portal",ctpa_id:ctpaId,organization_id:c.data.organization_id})
     .not("released_at","is",null).order("created_at",{ascending:false}).limit(400);
    if(cases.error)throw cases.error;
    const ids=(cases.data||[]).map((r:any)=>r.id);
    if(!ids.length)return out({authorized:true,documents:[]});
    const docs=await db.from("testing_case_documents")
     .select("id,testing_case_id,title,document_type,visibility,created_at")
     .in("testing_case_id",ids).is("archived_at",null).limit(700);
    if(docs.error)throw docs.error;
    const names=new Map((cases.data||[]).map((r:any)=>[r.id,r.case_number]));
    return out({authorized:true,documents:(docs.data||[]).filter(readable)
     .map((d:any)=>({id:d.id,title:d.title,document_type:d.document_type,
       case_number:names.get(d.testing_case_id)||"",created_at:d.created_at}))});
   }
   if(!uuid(payload.document_id))return out({error:"Valid CCF document required"},400);
   const doc=await db.from("testing_case_documents")
    .select("id,testing_case_id,title,document_type,visibility,storage_bucket,storage_path")
    .eq("id",payload.document_id).is("archived_at",null).maybeSingle();
   if(doc.error)throw doc.error;
   if(!doc.data||!readable(doc.data))return out({error:"CCF not released for customer access"},403);
   const owned=await db.from("testing_cases").select("id")
    .eq("id",doc.data.testing_case_id).eq("customer_user_id",user.id)
    .contains("metadata",{source:"lab_account_portal",ctpa_id:ctpaId,organization_id:c.data.organization_id})
    .not("released_at","is",null).maybeSingle();
   if(owned.error)throw owned.error;
   if(!owned.data)return out({error:"CCF not available for this company and customer"},403);
   if(!["testing-private-documents","testing-documents","compliance-documents"].includes(doc.data.storage_bucket)||
      !doc.data.storage_path)return out({error:"CCF file unavailable"},404);
   const safeTitle=String(doc.data.title||"Workforce-CCF.pdf").replace(/[^a-zA-Z0-9._ -]/g,"_").slice(0,160);
   const signed=await db.storage.from(doc.data.storage_bucket).createSignedUrl(doc.data.storage_path,120,{
    download:payload.download===true?safeTitle:undefined
   });
   if(signed.error||!signed.data?.signedUrl)throw signed.error||Error("CCF link unavailable");
   return out({url:signed.data.signedUrl,title:doc.data.title,expires_in:120});
  }
  if(action==="order_details"||action==="update_order"){
   // Donor PII and order editing are restricted to the individual who created
   // this Lab Account case. Company membership alone never reveals donor data.
   const caseId=String(payload.case_id||"");
   if(!uuid(caseId))return out({error:"Valid laboratory case required"},400);
   const query=()=>db.from("testing_cases")
    .select("id,case_number,status,customer_user_id,donor_name,donor_email,donor_phone,test_reason,metadata,updated_at")
    .eq("id",caseId).eq("customer_user_id",user.id)
    .contains("metadata",{source:"lab_account_portal",ctpa_id:ctpaId,organization_id:c.data.organization_id});
   const old=await query().maybeSingle();
   if(old.error)throw old.error;
   if(!old.data)return out({error:"Laboratory case not found in your account"},404);
   if(action==="order_details")return out({authorized:true,order:{
    id:old.data.id,case_number:old.data.case_number,status:old.data.status,
    donor_name:old.data.donor_name,donor_email:old.data.donor_email,
    donor_phone:old.data.donor_phone,test_reason:old.data.test_reason,
    date_of_birth:old.data.metadata?.donor_date_of_birth||"",
    state_of_residence:old.data.metadata?.state_of_residence||"",
    notes:old.data.metadata?.request_notes||""
   }});
   if(old.data.status!=="awaiting_schedule")
    return out({error:"Only laboratory orders awaiting scheduling may be edited"},409);
   const first=String(payload.first_name||"").trim(),last=String(payload.last_name||"").trim();
   const email=String(payload.donor_email||"").trim(),phone=String(payload.donor_phone||"").trim();
   const reason=String(payload.reason_for_test||"").trim().toUpperCase();
   const notes=String(payload.notes||"").trim(),state=String(payload.state_of_residence||"").trim().toUpperCase();
   const dob=String(payload.date_of_birth||"").trim();
   if(!first||!last||first.length>100||last.length>100||
     !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||
     phone.length>35||notes.length>1000||!["PE","RN","PA","RS","RT","FU","NI"].includes(reason)||
     !/^[A-Z]{2}$/.test(state)||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dob)||
     Number.isNaN(Date.parse(dob))||new Date(dob)>new Date())
     return out({error:"Complete valid donor and testing information"},400);
   // Preserve all existing test service, agency, case identity and routing
   // metadata. Only fields editable in the legacy awaiting-schedule form change.
   const metadata={...(old.data.metadata||{}),donor_date_of_birth:dob,
     state_of_residence:state,request_notes:notes};
   const updated=await db.from("testing_cases").update({
    donor_name:first+" "+last,donor_email:email,donor_phone:phone||null,
    test_reason:reason,metadata,updated_at:new Date().toISOString()
   }).eq("id",caseId).eq("customer_user_id",user.id).eq("status","awaiting_schedule")
    .eq("updated_at",old.data.updated_at)
    .contains("metadata",{source:"lab_account_portal",ctpa_id:ctpaId,organization_id:c.data.organization_id})
    .select("id,case_number,status").maybeSingle();
   if(updated.error)throw updated.error;
   if(!updated.data)return out({error:"The laboratory order changed. Reload it before editing."},409);
   return out({ok:true,order:updated.data});
  }
  if(action==="report_specimen_shipped"){
   // Reuse the existing Workforce Testing specimen-shipment RPC after checking
   // that the specific case belongs to the signed-in user and selected company.
   const caseId=String(payload.case_id||"");
   const carrier=String(payload.carrier||"").trim(),tracking=String(payload.tracking_number||"").trim();
   const trackingUrl=String(payload.tracking_url||"").trim();
   if(!uuid(caseId)||carrier.length<2||carrier.length>100||tracking.length<4||tracking.length>180||
      trackingUrl.length>1000||(trackingUrl&&!/^https:\/\//i.test(trackingUrl)))
    return out({error:"Enter a valid collected case, carrier and shipment tracking"},400);
   if(!grant.data.source_order_id||!grant.data.linked_customer_user_id)
    return out({error:"A verified Lab Account purchase is required for shipping"},403);
   const [order,intake,lab]=await Promise.all([
    db.from("orders").select("payment_status").eq("id",grant.data.source_order_id).maybeSingle(),
    db.from("lab_account_intakes").select("id,status,account_status")
     .eq("order_id",grant.data.source_order_id).eq("customer_user_id",grant.data.linked_customer_user_id).limit(2),
    db.from("ctpa_lab_accounts").select("id").eq("ctpa_id",ctpaId).eq("status","active").limit(1)
   ]);
   if(order.error||intake.error||lab.error)throw order.error||intake.error||lab.error;
   if(order.data?.payment_status!=="paid"||intake.data?.length!==1||
      intake.data[0].status!=="completed"||intake.data[0].account_status!=="active"||!lab.data?.length)
    return out({error:"Lab Account purchase, setup and assigned laboratory must be active"},403);
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
  if(["lab_released_results","lab_consortiums","lab_consortium_members","lab_service_requests"].includes(action)){
   if(!grant.data.source_order_id||grant.data.linked_customer_user_id!==user.id)
    return out({authorized:true,results:[],programs:[],members:[],requests:[]});
   if(action==="lab_released_results"){
    // Never return result_payload, raw lab data, or unpublished MRO materials.
    const query=await db.from("testing_cases")
     .select("id,case_number,status,test_type,overall_result,created_at,collected_at,released_at")
     .eq("customer_user_id",user.id)
     .contains("metadata",{source:"lab_account_portal",ctpa_id:ctpaId,organization_id:c.data.organization_id})
     .not("released_at","is",null)
     .order("released_at",{ascending:false}).limit(250);
    if(query.error)throw query.error;
    return out({authorized:true,results:query.data||[]});
   }
   if(action==="lab_consortiums"){
    const [programs,members]=await Promise.all([
     db.from("lab_customer_consortiums")
      .select("id,name,program_type,dot_agency,status,selection_schedule,effective_date,created_at")
      .eq("owner_user_id",user.id).order("created_at",{ascending:false}).limit(150),
     db.from("lab_customer_consortium_members")
      .select("consortium_id,eligibility_status")
      .eq("owner_user_id",user.id).limit(5000)
    ]);
    if(programs.error||members.error)throw programs.error||members.error;
    return out({authorized:true,programs:(programs.data||[]).map((x:any)=>({
     ...x,member_count:(members.data||[]).filter((m:any)=>m.consortium_id===x.id).length,
     eligible_count:(members.data||[]).filter((m:any)=>m.consortium_id===x.id&&m.eligibility_status==="eligible").length
    }))});
   }
   if(action==="lab_consortium_members"){
    if(!uuid(payload.program_id))return out({error:"Valid Lab Account program required"},400);
    const program=await db.from("lab_customer_consortiums").select("id,name")
     .eq("id",payload.program_id).eq("owner_user_id",user.id).maybeSingle();
    if(program.error)throw program.error;
    if(!program.data)return out({error:"Consortium not found for this purchaser"},404);
    const members=await db.from("lab_customer_consortium_members")
     .select("id,first_name,last_name,employee_reference,eligibility_status,employment_status,dot_covered,joined_on")
     .eq("owner_user_id",user.id).eq("consortium_id",program.data.id)
     .order("created_at",{ascending:false}).limit(1000);
    if(members.error)throw members.error;
    return out({authorized:true,program:program.data,members:members.data||[]});
   }
   const services=await db.from("lab_plan_service_requests")
    .select("id,title,feature_code,request_type,status,created_at,updated_at,fulfilled_at")
    .eq("customer_user_id",user.id)
    .order("created_at",{ascending:false}).limit(250);
   if(services.error)throw services.error;
   return out({authorized:true,requests:services.data||[]});
  }
  if(["lab_client_save","lab_client_archive","supply_alert_save","supply_alert_delete","lab_analytics"].includes(action)){
   // These original Lab Account records are purchaser-owned, not shared
   // employer/consortium records. Preserve ownership until an explicit merge.
   if(!grant.data.source_order_id||grant.data.linked_customer_user_id!==user.id)
    return out({error:"Your verified Lab Account purchase is required"},403);
   if(action==="lab_client_save"){
    const company_name=String(payload.company_name||"").trim().slice(0,160);
    const contact_name=String(payload.contact_name||"").trim().slice(0,160);
    const contact_email=String(payload.contact_email||"").trim().toLowerCase();
    const phone=String(payload.phone||"").trim().slice(0,40);
    const notes=String(payload.notes||"").trim().slice(0,1500);
    const program_type=String(payload.program_type||"non_dot");
    if(company_name.length<2||!["dot","non_dot","both"].includes(program_type)||
       (contact_email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)))
     return out({error:"Enter a company name and valid contact information"},400);
    const fields={company_name,contact_name,contact_email:contact_email||null,
     phone:phone||null,program_type,notes,updated_at:new Date().toISOString()};
    let result:any;
    if(payload.id){
     if(!uuid(payload.id))return out({error:"Valid client ID required"},400);
     result=await db.from("lab_portal_clients").update(fields).eq("id",payload.id)
      .eq("customer_user_id",user.id).is("archived_at",null).select("id").maybeSingle();
    }else{
     result=await db.from("lab_portal_clients").insert({...fields,customer_user_id:user.id})
      .select("id").single();
    }
    if(result.error)throw result.error;
    if(!result.data)return out({error:"Lab Account client unavailable"},404);
    return out({ok:true,id:result.data.id});
   }
   if(action==="lab_client_archive"){
    if(!uuid(payload.id))return out({error:"Valid client ID required"},400);
    const q=await db.from("lab_portal_clients").update({archived_at:new Date().toISOString()})
     .eq("customer_user_id",user.id).eq("id",payload.id).is("archived_at",null)
     .select("id").maybeSingle();
    if(q.error)throw q.error;
    return q.data?out({ok:true}):out({error:"Lab client not found"},404);
   }
   if(action==="supply_alert_save"){
    const supply_name=String(payload.supply_name||"").trim().slice(0,160);
    const reorder_threshold=Number(payload.reorder_threshold);
    const estimated_on_hand=Number(payload.estimated_on_hand);
    const enabled=payload.enabled!==false;
    if(supply_name.length<2||!Number.isInteger(reorder_threshold)||reorder_threshold<1||
       reorder_threshold>100000||!Number.isInteger(estimated_on_hand)||
       estimated_on_hand<0||estimated_on_hand>1000000)
     return out({error:"Enter a valid supply name and inventory quantities"},400);
    const fields={customer_user_id:user.id,supply_name,reorder_threshold,
     estimated_on_hand,enabled,updated_at:new Date().toISOString()};
    // Reuse the existing unique purchaser/supply name constraint and alerts.
    const q=await db.from("lab_portal_supply_alerts").upsert(fields,{
     onConflict:"customer_user_id,supply_name"
    }).select("id").single();
    if(q.error)throw q.error;
    return out({ok:true,id:q.data.id,needs_reorder:enabled&&estimated_on_hand<=reorder_threshold});
   }
   if(action==="supply_alert_delete"){
    if(!uuid(payload.id))return out({error:"Valid supply alert ID required"},400);
    const q=await db.from("lab_portal_supply_alerts").delete().eq("id",payload.id)
     .eq("customer_user_id",user.id).select("id").maybeSingle();
    if(q.error)throw q.error;
    return q.data?out({ok:true}):out({error:"Supply alert unavailable"},404);
   }
   // Reuse original case metrics, but scope to the selected C/TPA rather
   // than mixing the customer's other Lab Account activity.
   const q=await db.from("testing_cases")
    .select("id,status,dot_test,created_at,collected_at,released_at")
    .contains("metadata",{source:"lab_account_portal",ctpa_id:ctpaId,organization_id:c.data.organization_id})
    .order("created_at",{ascending:false}).limit(1000);
   if(q.error)throw q.error;
   const cases=q.data||[],monthly=new Map<string,{month:string,orders:number,released:number}>();
   let released=0,dot=0,non_dot=0,turnaround=0,turnaroundN=0;
   const statuses:Record<string,number>={};
   for(const record of cases){
    const month=String(record.created_at||"").slice(0,7);
    if(!monthly.has(month))monthly.set(month,{month,orders:0,released:0});
    monthly.get(month)!.orders++;
    statuses[record.status||"unknown"]=(statuses[record.status||"unknown"]||0)+1;
    if(record.dot_test)dot++;else non_dot++;
    if(record.released_at){
     released++;monthly.get(month)!.released++;
     if(record.collected_at){
      const hours=(Date.parse(record.released_at)-Date.parse(record.collected_at))/3600000;
      if(hours>=0&&hours<8760){turnaround+=hours;turnaroundN++}
     }
    }
   }
   return out({authorized:true,metrics:{
    orders:cases.length,released,dot,non_dot,pending:cases.length-released,
    average_hours_to_release:turnaroundN?Math.round(turnaround/turnaroundN*10)/10:null
   },monthly:[...monthly.values()].sort((a,b)=>a.month.localeCompare(b.month)).slice(-12),
   statuses,limit_reached:cases.length===1000});
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
    .replace(/[^a-zA-Z0-9._ -]/g,"_").slice(0,180);
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
    .select("id,case_number,status,test_type,created_by,customer_user_id,created_at,scheduled_at,collected_at,completed_at,metadata")
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
    can_edit:x.status==="awaiting_schedule"&&x.customer_user_id===user.id,
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