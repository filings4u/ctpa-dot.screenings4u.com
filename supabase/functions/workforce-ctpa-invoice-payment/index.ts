import {createClient} from "npm:@supabase/supabase-js@2";
const valid=x=>typeof x==="string"&&/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(x);
Deno.serve(async req=>{
 const headers={"Access-Control-Allow-Origin":"https://ctpa.screenings4u.com","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
 const reply=(body,s=200)=>new Response(JSON.stringify(body),{status:s,headers});
 if(req.method==="OPTIONS")return new Response(null,{headers,status:204});if(req.method!=="POST")return reply({error:"POST required"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")||"",anon=Deno.env.get("SUPABASE_ANON_KEY")||"",service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"",stripeSecret=Deno.env.get("STRIPE_SECRET_KEY")||"",publishable=Deno.env.get("STRIPE_PUBLISHABLE_KEY")||"";
  if(!url||!anon||!service||!stripeSecret||!publishable)return reply({error:"Workforce payments are not configured"},503);
  const jwt=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,""),auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await auth.auth.getUser(jwt);
  if(error||!user?.id||!user.email_confirmed_at)return reply({error:"Sign in required"},401);
  const body=await req.json().catch(()=>({})),tenant=body.tenant_id,context=body.operating_context==="nondot"?"nondot":"dot";
  if(!valid(tenant)||!valid(body.invoice_id))return reply({error:"Select your Workforce invoice"},400);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const member=await db.from("workforce_unified_records").select("id").eq("tenant_id",tenant).eq("kind","membership").eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).maybeSingle();
  if(member.error)throw member.error;if(!member.data)return reply({error:"Workspace access denied"},403);
  const fetchInvoice=()=>db.from("workforce_ctpa_workforce_bills").select("*").eq("id",body.invoice_id).eq("tenant_id",tenant).eq("operating_context",context).maybeSingle();
  const result=await fetchInvoice();if(result.error)throw result.error;
  const i=result.data;if(!i||!["open","paid"].includes(i.status))return reply({error:"Invoice is not available"},404);
  const remaining=Math.round((Number(i.total)-Number(i.amount_paid))*100);
  const stripe=async(path,options={})=>{
   const res=await fetch("https://api.stripe.com/v1/"+path,{...options,headers:{"Authorization":"Bearer "+stripeSecret,...(options.headers||{})}});
   const data=await res.json().catch(()=>({}));if(!res.ok)throw Error(data.error?.message||"Unable to verify Stripe payment");return data;
  };
  const action=body.action;
  if(action==="get")return reply({ok:true,invoice:{id:i.id,invoice_number:i.invoice_number,title:i.title,amount_due:Math.max(0,remaining)/100,status:i.status,items:i.items,recipient_name:i.recipient_name,due_at:i.due_at,issued_at:i.issued_at}});
  if(action==="confirm"){
   if(!i.payment_intent_id)return reply({error:"Invoice payment has not been prepared"},409);
   const intent=await stripe("payment_intents/"+encodeURIComponent(i.payment_intent_id));
   if(intent.metadata?.invoice_id!==i.id||intent.metadata?.tenant_id!==tenant)return reply({error:"Payment verification mismatch"},409);
   if(intent.status!=="succeeded")return reply({ok:true,paid:false,payment_status:intent.status});
   if(intent.amount!==Math.round(Number(i.total)*100)||intent.currency!=="usd")return reply({error:"Payment amount mismatch"},409);
   const save=await db.from("workforce_ctpa_workforce_bills").update({status:"paid",amount_paid:i.total,paid_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",i.id).eq("tenant_id",tenant).eq("payment_intent_id",intent.id).eq("status","open");
   if(save.error)throw save.error;
   return reply({ok:true,paid:true});
  }
  if(action!=="prepare")return reply({error:"Invalid payment operation"},400);
  if(i.status!=="open"||remaining<=0)return reply({error:"Invoice has no payable balance"},409);
  if(i.currency!=="usd")return reply({error:"Only USD invoices are enabled"},409);
  if(remaining<50||remaining>99999999)return reply({error:"Invoice amount is outside supported Stripe limits"},409);
  if(i.payment_intent_id){
   const intent=await stripe("payment_intents/"+encodeURIComponent(i.payment_intent_id));
   if(intent.metadata?.invoice_id!==i.id||intent.metadata?.tenant_id!==tenant||intent.amount!==remaining||intent.currency!=="usd")return reply({error:"Invoice payment changed; contact Workforce"},409);
   if(intent.status==="succeeded")return reply({error:"Payment already received. Refresh invoice status."},409);
   if(!["canceled"].includes(intent.status))return reply({ok:true,client_secret:intent.client_secret,publishable_key:publishable,payment_id:intent.id});
  }
  const form=new URLSearchParams({amount:String(remaining),currency:"usd","automatic_payment_methods[enabled]":"true","metadata[invoice_id]":i.id,"metadata[tenant_id]":tenant,"metadata[context]":context,description:"Workforce Invoice "+i.invoice_number});
  const intent=await stripe("payment_intents",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","Idempotency-Key":"wf-ctpa-"+i.id+"-"+remaining},body:form.toString()});
  const saved=await db.from("workforce_ctpa_workforce_bills").update({payment_intent_id:intent.id,updated_at:new Date().toISOString()}).eq("id",i.id).eq("tenant_id",tenant).eq("status","open");
  if(saved.error)throw saved.error;
  return reply({ok:true,client_secret:intent.client_secret,publishable_key:publishable,payment_id:intent.id});
 }catch(error){console.error("ctpa-workforce-invoice-payment",error);return reply({error:"Unable to prepare or verify invoice payment"},500)}
});