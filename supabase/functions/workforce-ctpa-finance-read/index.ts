import {createClient} from "npm:@supabase/supabase-js@2";
import {PDFDocument,StandardFonts,rgb} from "npm:pdf-lib@1.17.1";
const valid=x=>typeof x==="string"&&/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(x);
const clean=(x,n=170)=>String(x??"").trim().slice(0,n);
const printable=(x,n=130)=>clean(x,n).replace(/[^\x20-\x7e]/g,"-");
const dollars=x=>"$"+Number(x||0).toFixed(2);
async function createPdf(record){
 const pdf=await PDFDocument.create(),regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const navy=rgb(1/255,18/255,47/255),gray=rgb(.4,.46,.55),gold=rgb(253/255,193/255,2/255);
 let page,y;const newPage=()=>{page=pdf.addPage([612,792]);page.drawRectangle({x:0,y:717,width:612,height:75,color:navy});page.drawText("WORKFORCE",{x:35,y:751,size:23,font:bold,color:rgb(1,1,1)});page.drawRectangle({x:35,y:733,width:112,height:4,color:gold});y=681;};
 const add=(label,value)=>{if(y<80)newPage();page.drawText(printable(label,26),{x:35,y,font:bold,size:10,color:gray});page.drawText(printable(value,75),{x:185,y,font:regular,size:10,color:navy});y-=25};
 newPage();page.drawText("WORKFORCE INVOICE",{x:35,y,size:19,font:bold,color:navy});y-=39;
 add("Invoice",record.invoice_number);add("Account",record.recipient_name);add("Issued",new Date(record.issued_at).toLocaleDateString("en-US",{timeZone:"UTC"}));add("Due",new Date(record.due_at).toLocaleDateString("en-US",{timeZone:"UTC"}));add("Status",record.status.toUpperCase());add("Paid",dollars(record.amount_paid));y-=15;
 page.drawText("ITEMIZED CHARGES",{x:35,y,size:12,font:bold,color:navy});y-=24;
 for(const item of record.items||[]){if(y<115)newPage();page.drawText(printable(item.description,68),{x:35,y,size:9,font:regular,color:navy});page.drawText(dollars(item.amount),{x:500,y,size:9,font:regular,color:navy});y-=22}
 y-=15;add("Subtotal",dollars(record.subtotal));add("Discount","-"+dollars(record.discount));add("Tax",dollars(record.tax));add("Total",dollars(record.total));add("Balance due",dollars(Math.max(0,Number(record.total)-Number(record.amount_paid))));
 if(record.notes){y-=10;for(const ln of String(record.notes).match(/.{1,90}/g)||[]){if(y<75)newPage();page.drawText(printable(ln,90),{x:35,y,size:9,font:regular,color:gray});y-=16}}
 for(const p of pdf.getPages())p.drawText("Workforce by screenings4u  |  Payment processed through secure Workforce checkout.",{x:35,y:35,font:regular,size:8,color:gray});
 const bytes=await pdf.save(),parts=[];for(let i=0;i<bytes.length;i+=8192)parts.push(String.fromCharCode(...bytes.subarray(i,i+8192)));return btoa(parts.join(""));
}
async function settlementPdf(record){
 const pdf=await PDFDocument.create(),reg=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold),p=pdf.addPage([612,792]),navy=rgb(.004,.071,.184);
 p.drawRectangle({x:0,y:716,width:612,height:76,color:navy});p.drawText("WORKFORCE",{x:35,y:750,size:23,font:bold,color:rgb(1,1,1)});
 let y=677;const line=(k,v)=>{p.drawText(printable(k),{x:35,y,size:10,font:bold,color:navy});p.drawText(printable(v,67),{x:202,y,size:10,font:reg,color:navy});y-=29};
 p.drawText("C/TPA SETTLEMENT STATEMENT",{x:35,y,size:17,font:bold,color:navy});y-=40;
 line("Settlement",record.settlement_number);line("Period",record.period_start+" to "+record.period_end);line("Status",record.status);line("Paid date",record.paid_at?record.paid_at.slice(0,10):"Not paid");line("Method",record.payment_method||"—");line("Reference",record.payment_reference||"—");
 y-=12;p.drawText("SERVICE DETAILS",{x:35,y,size:12,font:bold,color:navy});y-=27;
 for(const item of (record.items||[]).slice(0,16)){p.drawText(printable(item.description,68),{x:35,y,size:9,font:reg,color:navy});p.drawText(dollars(item.amount),{x:503,y,size:9,font:reg,color:navy});y-=24}
 y-=16;line("Gross",dollars(record.gross));line("Adjustments",dollars(record.adjustments));line("Net settlement",dollars(record.net));
 p.drawText("This statement reflects Workforce-reported settlement records.",{x:35,y:39,size:9,font:reg,color:navy});
 const bytes=await pdf.save(),parts=[];for(let i=0;i<bytes.length;i+=8192)parts.push(String.fromCharCode(...bytes.subarray(i,i+8192)));return btoa(parts.join(""));
}
Deno.serve(async req=>{
 const headers={"Access-Control-Allow-Origin":"https://ctpa.screenings4u.com","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
 const send=(x,s=200)=>new Response(JSON.stringify(x),{headers,status:s});
 if(req.method==="OPTIONS")return new Response(null,{headers,status:204});if(req.method!=="POST")return send({error:"POST required"},405);
 try{
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!secret)return send({error:"Billing service unavailable"},503);
 const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}}),jwt=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
 const {data:{user},error}=await auth.auth.getUser(jwt);if(error||!user?.id||!user.email_confirmed_at)return send({error:"Sign-in required"},401);
 const body=await req.json().catch(()=>({})),tenant=body.tenant_id,context=body.operating_context==="nondot"?"nondot":"dot",action=clean(body.action,25);
 if(!valid(tenant))return send({error:"Choose your C/TPA organization"},400);
 const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const member=await db.from("workforce_unified_records").select("id").eq("tenant_id",tenant).eq("kind","membership").eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).maybeSingle();
 if(member.error)throw member.error;if(!member.data)return send({error:"Workspace access denied"},403);
 const source=action.startsWith("settlement")?"workforce_ctpa_settlements":"workforce_ctpa_workforce_bills";
 const base=()=>db.from(source).select("*").eq("tenant_id",tenant).eq("operating_context",context);
 if(action==="list_bills"||action==="list_settlements"){
  const isSettlement=action==="list_settlements";
  const q=await db.from(isSettlement?"workforce_ctpa_settlements":"workforce_ctpa_workforce_bills").select(isSettlement?"id,settlement_number,period_start,period_end,issued_at,paid_at,status,gross,adjustments,net,payment_reference":"id,invoice_number,title,issued_at,due_at,recipient_name,total,amount_paid,status").eq("tenant_id",tenant).eq("operating_context",context).in("status",isSettlement?["pending","paid"]:["open","paid","void"]).order("issued_at",{ascending:false}).limit(500);
  if(q.error)throw q.error;
  return send({ok:true,rows:q.data||[]});
 }
 if(!["bill_detail","bill_pdf","settlement_detail","settlement_pdf"].includes(action)||!valid(body.id))return send({error:"Unknown billing operation"},400);
 const isSet=action.startsWith("settlement");
 const table=isSet?"workforce_ctpa_settlements":"workforce_ctpa_workforce_bills";
 const r=await db.from(table).select("*").eq("id",body.id).eq("tenant_id",tenant).eq("operating_context",context).in("status",isSet?["pending","paid"]:["open","paid","void"]).maybeSingle();
 if(r.error)throw r.error;if(!r.data)return send({error:"Record not found"},404);
 if(action.endsWith("detail"))return send({ok:true,record:r.data});
 const base64=isSet?await settlementPdf(r.data):await createPdf(r.data);
 return send({ok:true,base64,filename:(isSet?"settlement-":"workforce-invoice-")+(isSet?r.data.settlement_number:r.data.invoice_number).replace(/[^a-z0-9_-]/gi,"-")+".pdf"});
 }catch(error){console.error("workforce-ctpa-finance-read",error);return send({error:"Unable to load Workforce finance records"},500)}
});