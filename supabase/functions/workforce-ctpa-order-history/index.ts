import {createClient} from "npm:@supabase/supabase-js@2";
import {PDFDocument,StandardFonts,rgb} from "npm:pdf-lib@1.17.1";
const uuid=x=>typeof x==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const str=(x,n=180)=>String(x??"").trim().slice(0,n);
const money=n=>"$"+Number(n||0).toFixed(2);
const printable=x=>str(x,1000).replace(/[^\x20-\x7E]/g,"-");
Deno.serve(async request=>{
 const headers={"Access-Control-Allow-Origin":"https://ctpa.screenings4u.com","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
 const reply=(o,status=200)=>new Response(JSON.stringify(o),{status,headers});
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(request.method!=="POST")return reply({error:"POST required"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")||"",anon=Deno.env.get("SUPABASE_ANON_KEY")||"",service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!url||!anon||!service)return reply({error:"Order history service unavailable"},503);
  const token=(request.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await auth.auth.getUser(token);
  if(authError||!user?.id||!user.email_confirmed_at)return reply({error:"Sign in required"},401);
  const body=await request.json().catch(()=>({}));
  const tenant=body.tenant_id,context=body.operating_context==="nondot"?"nondot":"dot",action=str(body.action,35);
  if(!uuid(tenant))return reply({error:"Select a valid C/TPA organization"},400);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const membership=await db.from("workforce_unified_records").select("id").eq("tenant_id",tenant).eq("kind","membership").eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).maybeSingle();
  if(membership.error)throw membership.error;
  if(!membership.data)return reply({error:"Organization access denied"},403);
  const commercial=()=>db.from("orders").select("id,order_number,created_at,paid_at,payment_status,total,subtotal,tax,currency,company_name,customer_email,status,metadata,order_items(id,quantity,unit_price,line_total,metadata)").eq("metadata->>tenant_id",tenant).eq("metadata->>operating_context",context).eq("metadata->>portal_source","ctpa_unified_supplies");
  const requests=()=>db.from("workforce_unified_records").select("id,created_at,data").eq("tenant_id",tenant).eq("operating_context",context).eq("kind","testing_orders").is("archived_at",null);
  const shapeOrder=o=>({
   id:o.id,type:"purchase",number:o.order_number,date:o.created_at,paid_at:o.paid_at,
   payment_status:o.payment_status,status:String(o.status||"pending"),total:Number(o.total||0),
   subtotal:Number(o.subtotal||0),tax:Number(o.tax||0),currency:o.currency||"usd",
   customer:o.company_name||"C/TPA",email:o.customer_email||"",
   recipient:o.metadata?.shipping?.name||o.company_name||"",
   description:(o.order_items||[]).map(x=>x.metadata?.name||"Laboratory supply").join(", ").slice(0,240),
   items:(o.order_items||[]).map(x=>({name:str(x.metadata?.name||"Laboratory supply",180),quantity:Number(x.quantity||1),unit_price:Number(x.unit_price||0),line_total:Number(x.line_total||0)})),
   receipt_available:o.payment_status==="paid",purchase_order_available:true
  });
  const shapeRequest=r=>({
   id:r.id,type:"testing_request",number:str(r.data?.order_reference||r.data?.name||"Testing request",100),
   date:r.created_at,payment_status:"not_applicable",status:str(r.data?.status||"requested",70),
   total:null,customer:str(r.data?.employer||"C/TPA",160),description:str(r.data?.test_type||r.data?.reason||"Drug or alcohol testing",220),
   items:[],receipt_available:false,purchase_order_available:false
  });
  if(action==="list"){
   const [orders,testing]=await Promise.all([commercial().order("created_at",{ascending:false}).limit(250),requests().order("created_at",{ascending:false}).limit(250)]);
   if(orders.error||testing.error)throw orders.error||testing.error;
   const rows=[...(orders.data||[]).map(shapeOrder),...(testing.data||[]).filter(r=>!r.data?._legacy_id).map(shapeRequest)].sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
   return reply({ok:true,orders:rows.slice(0,350),stats:{orders:rows.length,paid:rows.filter(r=>r.type==="purchase"&&r.payment_status==="paid").length,spend:rows.filter(r=>r.type==="purchase"&&r.payment_status==="paid").reduce((n,r)=>n+Number(r.total||0),0),testing_requests:rows.filter(r=>r.type==="testing_request").length}});
  }
  if(!["detail","document"].includes(action)||!uuid(body.id))return reply({error:"Unknown order action"},400);
  const kind=body.kind==="testing_request"?"testing_request":"purchase";
  let record;
  if(kind==="purchase"){
   const found=await commercial().eq("id",body.id).maybeSingle();
   if(found.error)throw found.error;
   if(!found.data)return reply({error:"Order not found"},404);
   record=shapeOrder(found.data);
  }else{
   const found=await requests().eq("id",body.id).maybeSingle();
   if(found.error)throw found.error;
   if(!found.data||found.data.data?._legacy_id)return reply({error:"Testing request not found"},404);
   record=shapeRequest(found.data);
  }
  if(action==="detail")return reply({ok:true,order:record});
  const docType=body.document_type;
  if(!["receipt","purchase_order","order_summary"].includes(docType))return reply({error:"Invalid document type"},400);
  if(docType==="receipt"&&(!record.receipt_available||record.type!=="purchase"))return reply({error:"Receipt is available only for paid purchases"},409);
  if(docType==="purchase_order"&&record.type!=="purchase")return reply({error:"Purchase order not available for testing requests"},409);
  if(docType==="order_summary"&&record.type!=="testing_request")return reply({error:"Order summary is for testing requests"},409);
  const pdf=await PDFDocument.create(),page=pdf.addPage([612,792]),regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy=rgb(1/255,18/255,47/255),grey=rgb(.37,.43,.52),gold=rgb(253/255,193/255,2/255);
  page.drawRectangle({x:0,y:720,width:612,height:72,color:navy});
  page.drawText("WORKFORCE",{x:40,y:748,size:23,font:bold,color:rgb(1,1,1)});
  page.drawRectangle({x:40,y:738,width:100,height:3,color:gold});
  const heading=docType==="receipt"?"PAYMENT RECEIPT":docType==="purchase_order"?"PURCHASE ORDER":"TESTING ORDER SUMMARY";
  page.drawText(heading,{x:40,y:681,size:20,font:bold,color:navy});
  let y=644;
  const line=(key,val)=>{page.drawText(printable(key),{x:40,y,size:10,font:bold,color:grey});page.drawText(printable(val).slice(0,76),{x:175,y,size:10,font:regular,color:navy});y-=26};
  line("Order reference",record.number);line("Date",record.date?new Date(record.date).toLocaleDateString("en-US",{timeZone:"UTC"}):"—");
  line("Organization",record.customer);
  line("Status",record.status);
  if(record.type==="purchase"){line("Payment status",record.payment_status);line("Amount",money(record.total));line("Recipient",record.recipient);}
  else line("Service",record.description);
  y-=16;page.drawText("ORDER DETAILS",{x:40,y,size:13,font:bold,color:navy});y-=24;
  if(record.type==="purchase"){
   for(const item of record.items.slice(0,12)){page.drawText(printable(item.name).slice(0,52),{x:40,y,size:10,font:regular,color:navy});page.drawText(String(item.quantity),{x:395,y,size:10,font:regular,color:navy});page.drawText(money(item.line_total),{x:460,y,size:10,font:regular,color:navy});y-=23;}
   y-=12;page.drawText("Subtotal "+money(record.subtotal)+"    Tax "+money(record.tax)+"    Total "+money(record.total),{x:40,y,size:11,font:bold,color:navy});
  }else page.drawText(printable(record.description).slice(0,88),{x:40,y,size:10,font:regular,color:navy});
  page.drawText(docType==="receipt"?"Recorded payment confirmation; not a tax invoice.":docType==="purchase_order"?"This document is a purchase order record, not proof of payment.":"This testing request summary is not a payment receipt.",{x:40,y:57,size:9,font:regular,color:grey});
  page.drawText("Workforce by screenings4u",{x:40,y:38,size:9,font:regular,color:grey});
  const bytes=await pdf.save();const chunks=[];for(let i=0;i<bytes.length;i+=8192)chunks.push(String.fromCharCode(...bytes.subarray(i,i+8192)));
  return reply({ok:true,filename:"workforce-"+docType.replaceAll("_","-")+"-"+String(record.number).replace(/[^a-z0-9-]/gi,"-").slice(0,40)+".pdf",base64:btoa(chunks.join(""))});
 }catch(err){console.error("workforce-ctpa-order-history",err);return reply({error:"Unable to load C/TPA order history"},500)}
});