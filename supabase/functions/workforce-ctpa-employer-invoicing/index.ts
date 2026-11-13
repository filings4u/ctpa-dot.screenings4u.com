import {createClient} from "npm:@supabase/supabase-js@2";
import {PDFDocument,StandardFonts,rgb} from "npm:pdf-lib@1.17.1";
const validId=(x:unknown)=>typeof x==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const str=(x:unknown,max=200)=>String(x??"").trim().slice(0,max);
const cents=(v:unknown)=>Math.round(Number(v)*100);
const money=(c:number)=>"$"+(c/100).toFixed(2);
const html=(x:unknown)=>str(x,2500).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));
const pdfString=(x:unknown,max=160)=>str(x,max).replace(/[^\x20-\x7e]/g,"-");
const validDay=(x:unknown)=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+"T12:00:00Z"));
const logoBucket="workforce-ctpa-invoice-branding";
async function pdfFor(db:any,record:any){
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const navy=rgb(1/255,18/255,47/255),gold=rgb(253/255,193/255,2/255),slate=rgb(.38,.45,.55),white=rgb(1,1,1);
 let page:any,y=0;
 let logo:any=null;
 if(record.logo_path){
  const result=await db.storage.from(logoBucket).download(record.logo_path);
  if(!result.error&&result.data){try{const bytes=await result.data.arrayBuffer();logo=record.logo_path.endsWith(".png")?await pdf.embedPng(bytes):await pdf.embedJpg(bytes)}catch(e){console.warn("Invoice logo rejected",e)}}
 }
 const start=()=>{
  page=pdf.addPage([612,792]);page.drawRectangle({x:0,y:708,width:612,height:84,color:navy});
  if(logo){const scale=Math.min(140/logo.width,55/logo.height);page.drawImage(logo,{x:38,y:724,width:logo.width*scale,height:logo.height*scale})}
  else page.drawText("WORKFORCE C/TPA",{x:38,y:747,size:18,font:bold,color:white});
  page.drawRectangle({x:38,y:714,width:110,height:4,color:gold});y=686;
 };
 const next=(required=24)=>{if(y-required<66)start()};
 const line=(label:string,value:string)=>{next(22);page.drawText(pdfString(label,24),{x:38,y,size:10,font:bold,color:slate});page.drawText(pdfString(value,74),{x:190,y,size:10,font,color:navy});y-=22};
 start();
 page.drawText("EMPLOYER INVOICE",{x:38,y,size:20,font:bold,color:navy});y-=33;
 line("Invoice",record.invoice_number);
 line("Bill to",record.recipient_name);
 line("Email",record.recipient_email);
 line("Issued",record.issue_date);
 line("Due",record.due_date);
 line("Status",record.status.toUpperCase());
 if(record.purchase_order)line("PO reference",record.purchase_order);
 y-=15;next(45);
 page.drawText("ITEMIZED SERVICES",{x:38,y,size:12,font:bold,color:navy});y-=24;
 page.drawText("Description",{x:38,y,size:9,font:bold,color:slate});page.drawText("Qty",{x:360,y,size:9,font:bold,color:slate});page.drawText("Rate",{x:415,y,size:9,font:bold,color:slate});page.drawText("Net",{x:518,y,size:9,font:bold,color:slate});y-=18;
 for(const item of record.items||[]){
  next(43);
  page.drawText(pdfString(item.description,52),{x:38,y,size:9,font,color:navy});
  page.drawText(String(item.quantity),{x:360,y,size:9,font,color:navy});
  page.drawText(money(cents(item.unit_price)),{x:415,y,size:9,font,color:navy});
  page.drawText(money(cents(item.line_total)),{x:518,y,size:9,font,color:navy});y-=15;
  if(Number(item.discount)>0){page.drawText("Includes line discount "+money(cents(item.discount)),{x:40,y,size:8,font,color:slate});y-=15}
  y-=6;
 }
 next(150);y-=15;
 const right=(label:string,value:string,emph=false)=>{next(21);page.drawText(label,{x:355,y,size:10,font:emph?bold:font,color:emph?navy:slate});page.drawText(value,{x:500,y,size:10,font:emph?bold:font,color:navy});y-=22};
 right("Subtotal",money(cents(record.subtotal)));
 right("Invoice discount","-"+money(cents(record.discount_amount)));
 right("Tax ("+Number(record.tax_rate)+"%)",money(cents(record.tax_amount)));
 right("TOTAL DUE",money(cents(record.total)),true);
 y-=15;
 for(const [label,text] of [["Payment terms",record.payment_terms],["Notes",record.notes]]){
  if(!text)continue;next(50);page.drawText(label,{x:38,y,size:10,font:bold,color:navy});y-=18;
  for(const chunk of String(text).match(/.{1,90}/g)||[]){next(16);page.drawText(pdfString(chunk,90),{x:38,y,size:9,font,color:slate});y-=15}
 }
 if(record.status==="void"){next(55);page.drawText("VOID — NOT PAYABLE",{x:38,y,size:18,font:bold,color:rgb(.7,.17,.17)})}
 for(const p of pdf.getPages()){p.drawText("Issued by the C/TPA organization. Workforce does not collect payment for this invoice.",{x:38,y:39,size:8,font,color:slate})}
 const bytes=await pdf.save();const parts:string[]=[];for(let i=0;i<bytes.length;i+=8192)parts.push(String.fromCharCode(...bytes.subarray(i,i+8192)));return btoa(parts.join(""));
}
Deno.serve(async request=>{
 const h={"Access-Control-Allow-Origin":"https://ctpa.screenings4u.com","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Content-Type":"application/json","Cache-Control":"no-store"};
 const reply=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:h});
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:h});
 if(request.method!=="POST")return reply({error:"POST required"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")||"",anon=Deno.env.get("SUPABASE_ANON_KEY")||"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!url||!anon||!key)return reply({error:"Invoicing service unavailable"},503);
  const jwt=(request.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await auth.auth.getUser(jwt);
  if(authError||!user?.id||!user.email_confirmed_at)return reply({error:"Sign-in required"},401);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const body=await request.json().catch(()=>({})),action=str(body.action,40),tenant=body.tenant_id,context=body.operating_context==="nondot"?"nondot":"dot";
  if(!validId(tenant))return reply({error:"Choose C/TPA organization"},400);
  const membership=await db.from("workforce_unified_records").select("data").eq("tenant_id",tenant).eq("kind","membership").eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).maybeSingle();
  if(membership.error)throw membership.error;
  if(!membership.data)return reply({error:"C/TPA workspace access denied"},403);
  const role=str(membership.data.data?.role,40).toLowerCase(),write=["owner","admin","editor"].includes(role);
  const table=db.from("workforce_ctpa_employer_invoices");
  const appendEvent=async(id:string,type:string,details={})=>{const e=await db.from("workforce_ctpa_invoice_events").insert({invoice_id:id,tenant_id:tenant,event_type:type,actor_id:user.id,details});if(e.error)console.error("Invoice audit event failed",e.error)};
  const recipients=async()=>{
   const result=await db.from("workforce_unified_records").select("id,kind,data").eq("tenant_id",tenant).eq("operating_context",context).in("kind",context==="dot"?["employers","owner_operators"]:["employers"]).is("archived_at",null).limit(1000);
   if(result.error)throw result.error;
   return (result.data||[]).map((r:any)=>({id:r.id,kind:r.kind,name:str(r.data?.legal_name||r.data?.dba_name||r.data?.name,180),email:str(r.data?.contact_email||r.data?.email||r.data?.billing_email,180)})).filter((r:any)=>!!r.name);
  };
  if(action==="bootstrap"){
   const [people,branding,rows]=await Promise.all([recipients(),db.from("workforce_ctpa_invoice_branding").select("logo_path").eq("tenant_id",tenant).maybeSingle(),table.select("id,invoice_number,recipient_name,recipient_email,status,issue_date,due_date,total,currency,created_at,sent_at").eq("tenant_id",tenant).eq("operating_context",context).order("created_at",{ascending:false}).limit(500)]);
   if(branding.error||rows.error)throw branding.error||rows.error;
   const invoices=rows.data||[];
   let logoBase64:string|null=null,logoMime:string|null=null;
   if(branding.data?.logo_path){const result=await db.storage.from(logoBucket).download(branding.data.logo_path);if(!result.error&&result.data){const bytes=new Uint8Array(await result.data.arrayBuffer());const chunks:string[]=[];for(let i=0;i<bytes.length;i+=8192)chunks.push(String.fromCharCode(...bytes.subarray(i,i+8192)));logoBase64=btoa(chunks.join(""));logoMime=branding.data.logo_path.endsWith(".png")?"image/png":"image/jpeg"}}
   return reply({ok:true,can_write:write,recipients:people,invoices,logo:logoBase64?{base64:logoBase64,mime:logoMime}:null,stats:{total:invoices.length,draft:invoices.filter((x:any)=>x.status==="draft").length,sent:invoices.filter((x:any)=>x.status==="sent").length,void:invoices.filter((x:any)=>x.status==="void").length,open_amount:invoices.filter((x:any)=>x.status==="sent").reduce((v:number,x:any)=>v+Number(x.total||0),0)}});
  }
  if(action==="save_logo"){
   if(!write)return reply({error:"You cannot modify invoice branding"},403);
   const mime=str(body.mime,30),b64=str(body.base64,1500000);
   if(!["image/png","image/jpeg"].includes(mime)||!b64||b64.length>1500000)return reply({error:"Upload a PNG or JPEG under 1 MB"},400);
   let bytes:Uint8Array;try{bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0))}catch{return reply({error:"Invalid image encoding"},400)}
   const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71,jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
   if(bytes.length>1048576||bytes.length<50||(mime==="image/png"?!png:!jpg))return reply({error:"Image must be a valid PNG or JPEG under 1 MB"},400);
   const file=tenant+"/"+crypto.randomUUID()+(png?".png":".jpg");
   const upload=await db.storage.from(logoBucket).upload(file,bytes,{contentType:mime,upsert:false});
   if(upload.error)throw upload.error;
   const save=await db.from("workforce_ctpa_invoice_branding").upsert({tenant_id:tenant,logo_path:file,updated_by:user.id,updated_at:new Date().toISOString()},{onConflict:"tenant_id"});
   if(save.error)throw save.error;
   return reply({ok:true,path:file});
  }
  if(action==="create"){
   if(!write)return reply({error:"You cannot create invoices"},403);
   const person=(await recipients()).find((r:any)=>r.id===body.recipient_id);
   if(!person)return reply({error:"Select an associated employer or owner-operator"},403);
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email))return reply({error:"Recipient needs a valid email on their employer record"},400);
   const issue=str(body.issue_date,10),due=str(body.due_date,10);
   if(!validDay(issue)||!validDay(due)||due<issue)return reply({error:"Choose valid invoice issue and due dates"},400);
   if(!Array.isArray(body.items)||body.items.length<1||body.items.length>30)return reply({error:"Add 1 to 30 itemized services"},400);
   const items:any[]=[];let subtotalCents=0;
   for(const raw of body.items){
    const description=str(raw.description,250),qty=Number(raw.quantity),unit=Number(raw.unit_price),discount=Number(raw.discount||0);
    if(!description||!Number.isFinite(qty)||qty<=0||qty>100000||!Number.isFinite(unit)||unit<0||unit>1000000||!Number.isFinite(discount)||discount<0||discount>1000000)return reply({error:"Invalid invoice item"},400);
    if(Math.abs(unit*100-Math.round(unit*100))>1e-6||Math.abs(discount*100-Math.round(discount*100))>1e-6)return reply({error:"Amounts must have at most two decimal places"},400);
    const gross=Math.round(qty*cents(unit)),disc=cents(discount);
    if(disc>gross)return reply({error:"Item discount exceeds item amount"},400);
    const net=gross-disc;subtotalCents+=net;items.push({description,quantity:qty,unit_price:unit,discount,line_total:net/100});
   }
   const discountType=body.discount_type==="percent"?"percent":"amount",discountValue=Number(body.discount_value||0),taxRate=Number(body.tax_rate||0);
   if(!Number.isFinite(discountValue)||discountValue<0||discountValue>1000000||!Number.isFinite(taxRate)||taxRate<0||taxRate>100||discountType==="percent"&&discountValue>100)return reply({error:"Invalid discount or tax rate"},400);
   const discountCents=discountType==="percent"?Math.round(subtotalCents*discountValue/100):cents(discountValue);
   if(discountCents>subtotalCents)return reply({error:"Discount exceeds subtotal"},400);
   const taxable=subtotalCents-discountCents,taxCents=Math.round(taxable*taxRate/100),total=taxable+taxCents;
   const branding=await db.from("workforce_ctpa_invoice_branding").select("logo_path").eq("tenant_id",tenant).maybeSingle();
   if(branding.error)throw branding.error;
   const number="CTPA-"+new Date().toISOString().slice(0,10).replaceAll("-","")+"-"+crypto.randomUUID().slice(0,8).toUpperCase();
   const insert=await table.insert({tenant_id:tenant,operating_context:context,recipient_record_id:person.id,recipient_kind:person.kind,recipient_name:person.name,recipient_email:person.email,invoice_number:number,issue_date:issue,due_date:due,title:str(body.title,140)||"Employer Invoice",purchase_order:str(body.purchase_order,100),payment_terms:str(body.payment_terms,500),notes:str(body.notes,1500),items,discount_type:discountType,discount_value:discountValue,tax_rate:taxRate,subtotal:subtotalCents/100,discount_amount:discountCents/100,taxable_amount:taxable/100,tax_amount:taxCents/100,total:total/100,logo_path:branding.data?.logo_path||null,created_by:user.id}).select("id").single();
   if(insert.error)throw insert.error;
   await appendEvent(insert.data.id,"created");
   return reply({ok:true,id:insert.data.id,invoice_number:number});
  }
  if(!validId(body.id))return reply({error:"Select a valid invoice"},400);
  const found=await table.select("*").eq("id",body.id).eq("tenant_id",tenant).eq("operating_context",context).maybeSingle();
  if(found.error)throw found.error;
  if(!found.data)return reply({error:"Invoice not found"},404);
  const invoice=found.data;
  if(action==="detail")return reply({ok:true,invoice});
  if(action==="pdf"){
   const base64=await pdfFor(db,invoice);
   return reply({ok:true,base64,filename:invoice.invoice_number+".pdf"});
  }
  if(!write)return reply({error:"You cannot modify invoices"},403);
  if(action==="void"){
   if(invoice.status==="void")return reply({error:"Invoice already void"},409);
   const reason=str(body.reason,400);
   if(!reason)return reply({error:"Enter a void reason"},400);
   const updated=await table.update({status:"void",void_reason:reason,voided_at:new Date().toISOString(),voided_by:user.id,updated_by:user.id,updated_at:new Date().toISOString()}).eq("id",invoice.id).eq("tenant_id",tenant).in("status",["draft","sent"]).select("id").maybeSingle();
   if(updated.error)throw updated.error;if(!updated.data)return reply({error:"Invoice has changed; refresh"},409);
   await appendEvent(invoice.id,"voided",{reason});
   return reply({ok:true});
  }
  if(action==="send"){
   if(invoice.status==="void")return reply({error:"Voided invoices cannot be sent"},409);
   if(!["draft","sent"].includes(invoice.status))return reply({error:"Invoice cannot be sent in current state"},409);
   const person=(await recipients()).find((r:any)=>r.id===invoice.recipient_record_id);
   if(!person||person.email.toLowerCase()!==invoice.recipient_email.toLowerCase())return reply({error:"Employer email changed. Create a new invoice using the current contact"},409);
   const resendKey=Deno.env.get("RESEND_API_KEY")||"",from=Deno.env.get("WORKFORCE_FROM_EMAIL")||Deno.env.get("SCREENINGS4U_FROM_EMAIL")||"Workforce <notifications@screenings4u.com>";
   if(!resendKey)return reply({error:"Email provider not configured"},503);
   const attachment=await pdfFor(db,invoice);
   const subject="Invoice "+invoice.invoice_number+" from your C/TPA";
   const emailHtml='<div style="background:#f2f5f9;padding:30px;font-family:Arial;color:#01122F"><div style="max-width:620px;margin:auto;background:#fff;border-radius:12px;overflow:hidden"><header style="background:#01122F;padding:22px;color:#fff;font-weight:bold;font-size:20px">Employer Invoice</header><div style="padding:26px"><h2>Invoice '+html(invoice.invoice_number)+'</h2><p>Hello '+html(invoice.recipient_name)+',</p><p>Your C/TPA has issued an itemized invoice. A PDF is attached for your records.</p><p><strong>Amount due:</strong> '+html(money(cents(invoice.total)))+'</p><p><strong>Due:</strong> '+html(invoice.due_date)+'</p><p>For payment instructions, please contact your C/TPA directly.</p></div><footer style="padding:18px;background:#f8fafc;font-size:12px">Prepared in Workforce C/TPA</footer></div></div>';
   const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+resendKey,"Content-Type":"application/json"},body:JSON.stringify({from,to:[invoice.recipient_email],subject,html:emailHtml,attachments:[{filename:invoice.invoice_number+".pdf",content:attachment}]})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok||!result.id)return reply({error:"Email service did not accept the invoice"},502);
   const update=await table.update({status:"sent",sent_at:new Date().toISOString(),sent_by:user.id,provider_message_id:result.id,updated_by:user.id,updated_at:new Date().toISOString()}).eq("id",invoice.id).eq("tenant_id",tenant);
   if(update.error){console.error("Email sent but status update failed",update.error);return reply({ok:true,email_accepted:true,status_update_failed:true,message_id:result.id})}
   await appendEvent(invoice.id,"email_sent",{recipient:invoice.recipient_email,message_id:result.id});
   return reply({ok:true,email_accepted:true,message_id:result.id});
  }
  return reply({error:"Unknown invoice operation"},400);
 }catch(err){console.error("ctpa-employer-invoicing",err);return reply({error:"Unable to process employer invoice"},500)}
});