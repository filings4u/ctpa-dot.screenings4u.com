import {createClient} from "npm:@supabase/supabase-js@2";
const valid=(x:unknown)=>typeof x==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
Deno.serve(async req=>{
 const headers={"Access-Control-Allow-Origin":"https://ctpa.screenings4u.com","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
 const send=(v:unknown,s=200)=>new Response(JSON.stringify(v),{status:s,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return send({error:"POST required"},405);
 try{
 const url=Deno.env.get("SUPABASE_URL")||"",anon=Deno.env.get("SUPABASE_ANON_KEY")||"",service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!url||!anon||!service)return send({error:"Subscription service unavailable"},503);
 const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,""),auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await auth.auth.getUser(token);
 if(error||!user?.id||!user.email_confirmed_at)return send({error:"Sign in required"},401);
 const data=await req.json().catch(()=>({})),tenant=data.tenant_id,action=data.action;
 if(!valid(tenant))return send({error:"Select a C/TPA organization"},400);
 const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const m=await db.from("workforce_unified_records").select("data").eq("tenant_id",tenant).eq("kind","membership").eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).maybeSingle();
 if(m.error)throw m.error;if(!m.data)return send({error:"Organization access denied"},403);
 const owner=["owner","admin"].includes(String(m.data.data?.role||"").toLowerCase());
 const linked=await db.from("ctpa_combined_subscription_context").select("organization_id,dot_ctpa_id,nondot_ctpa_id,canonical_subscription_id,canonical_source,canonical_plan_name,canonical_status,operating_contexts").eq("organization_id",tenant).maybeSingle();
 if(linked.error)throw linked.error;
 const stripeKey=Deno.env.get("STRIPE_SECRET_KEY")||"";
 const stripe=async(path:string,body?:URLSearchParams)=>{
  if(!stripeKey)throw new Error("Stripe billing configuration unavailable");
  const res=await fetch("https://api.stripe.com/v1/"+path,{method:body?"POST":"GET",headers:{"Authorization":"Bearer "+stripeKey,...(body?{"Content-Type":"application/x-www-form-urlencoded","Idempotency-Key":"ctpa-subscription-"+path.slice(-70)}:{})},body:body?.toString()});
  const out=await res.json().catch(()=>({}));if(!res.ok)throw new Error(out.error?.message||"Stripe billing request failed");return out;
 };
 const sources:[string,string][]=[["subscriptions","dot_ctpa_id"],["workforce_subscriptions","nondot_ctpa_id"]];
 async function load(){
  if(!linked.data)return [];
  const combined:any[]=[];
  for(const [table,field] of sources){
   const ctpaId=(linked.data as any)[field];if(!valid(ctpaId))continue;
   const records=await db.from(table).select("id,tenant_id,ctpa_id,plan_id,status,start_date,renewal_date,billing_frequency,stripe_subscription_id,stripe_current_period_end,cancel_at_period_end,created_at").eq("ctpa_id",ctpaId).order("created_at",{ascending:false}).limit(50);
   if(records.error)throw records.error;
   for(const sub of records.data||[])combined.push({...sub,source:table});
  }
  const seen=new Map<string,any>();
  for(const rec of combined){const key=rec.stripe_subscription_id?"stripe:"+rec.stripe_subscription_id:"subscription:"+rec.source+":"+rec.id;if(!seen.has(key))seen.set(key,rec)}
  const planIds=[...new Set([...seen.values()].map(s=>s.plan_id).filter(valid))];
  let plans:any[]=[];if(planIds.length){const p=await db.from("plans").select("id,name,code,monthly_price,annual_price").in("id",planIds);if(p.error)throw p.error;plans=p.data||[]}
  const map=new Map(plans.map(x=>[x.id,x]));return [...seen.values()].map(s=>({...s,plan:map.get(s.plan_id)||null}));
 }
 if(action==="list"){
  const rows=await load();
  const pending=await db.from("workforce_ctpa_subscription_offboarding").select("subscription_id,subscription_source,access_ends_at,retention_ends_at,status").eq("organization_id",tenant).limit(50);
  if(pending.error)throw pending.error;
  const map=new Map((pending.data||[]).map(x=>[x.subscription_source+":"+x.subscription_id,x]));
  return send({ok:true,linked:!!linked.data,owner,subscriptions:rows.map(s=>{
   const offboarding=map.get(s.source+":"+s.id);
   return {id:s.id,source:s.source,plan_name:s.plan?.name||"Subscription",plan_code:s.plan?.code||"",status:s.status,billing_frequency:s.billing_frequency,monthly_price:s.plan?.monthly_price,annual_price:s.plan?.annual_price,renewal_date:s.renewal_date,current_period_end:s.stripe_current_period_end,has_stripe_subscription:!!s.stripe_subscription_id,cancel_at_period_end:!!s.cancel_at_period_end||!!offboarding,offboarding:offboarding||null,can_cancel:owner&&!!s.stripe_subscription_id&&!s.cancel_at_period_end&&["active","trial"].includes(s.status),can_pay:!!s.stripe_subscription_id&&["past_due","unpaid","incomplete"].includes(s.status)};
  }),note:linked.data?"Only Stripe-verified subscriptions can be canceled in the portal.":"No consolidated subscription mapping currently matches this workspace."});
 }
 if(action!=="cancel"&&action!=="pay")return send({error:"Unknown subscription action"},400);
 if(!owner)return send({error:"Only C/TPA owners or administrators can manage subscription billing"},403);
 if(!valid(data.id)||!["subscriptions","workforce_subscriptions"].includes(data.source))return send({error:"Select a valid subscription"},400);
 const rows=await load(),s=rows.find(x=>x.id===data.id&&x.source===data.source);
 if(!s)return send({error:"Subscription not found for this C/TPA"},404);
 if(!s.stripe_subscription_id)return send({error:"This subscription is not connected to Stripe billing. Contact support."},409);
 const remote=await stripe("subscriptions/"+encodeURIComponent(s.stripe_subscription_id));
 if(remote.id!==s.stripe_subscription_id)return send({error:"Stripe subscription mismatch"},409);
 if(action==="pay"){
  if(!["past_due","unpaid","incomplete"].includes(remote.status))return send({error:"There is no confirmed outstanding subscription invoice"},409);
  const invoiceId=typeof remote.latest_invoice==="string"?remote.latest_invoice:remote.latest_invoice?.id;
  if(!invoiceId)return send({error:"No Stripe invoice available. Contact support."},409);
  const invoice=await stripe("invoices/"+encodeURIComponent(invoiceId));
  if(invoice.subscription!==remote.id||!invoice.hosted_invoice_url||invoice.status!=="open")return send({error:"No payable Stripe invoice available. Contact support."},409);
  return send({ok:true,payment_url:invoice.hosted_invoice_url});
 }
 if(s.cancel_at_period_end||remote.cancel_at_period_end)return send({error:"Cancellation is already scheduled"},409);
 if(!["active","trialing"].includes(remote.status))return send({error:"This subscription is not eligible for end-of-period cancellation"},409);
 // Determine the actual Stripe period before scheduling or displaying retention deadlines.
 const period=Number(remote.current_period_end||0);
 if(!Number.isSafeInteger(period)||period*1000<=Date.now())return send({error:"Stripe has not confirmed a future paid-through date. Contact support."},409);
 const changed=await stripe("subscriptions/"+encodeURIComponent(remote.id),new URLSearchParams({cancel_at_period_end:"true"}));
 if(!changed.cancel_at_period_end)return send({error:"Stripe did not confirm scheduled cancellation"},502);
 const access=new Date(period*1000),retention=new Date(access.getTime()+60*86400000);
 const schedule=await db.from("workforce_ctpa_subscription_offboarding").upsert({organization_id:tenant,subscription_id:s.id,subscription_source:s.source,stripe_subscription_id:remote.id,access_ends_at:access.toISOString(),retention_ends_at:retention.toISOString(),requested_by:user.id,status:"scheduled"},{onConflict:"subscription_source,subscription_id"});
 const update=await db.from(s.source).update({cancel_at_period_end:true,stripe_current_period_end:access.toISOString(),updated_at:new Date().toISOString()}).eq("id",s.id).eq("ctpa_id",s.ctpa_id);
 if(schedule.error||update.error){console.error("Stripe canceled but local sync incomplete",{schedule:schedule.error,update:update.error});return send({ok:true,scheduled:true,needs_reconciliation:true,access_ends_at:access.toISOString(),retention_ends_at:retention.toISOString()})}
 return send({ok:true,scheduled:true,access_ends_at:access.toISOString(),retention_ends_at:retention.toISOString(),deletion_automated:false});
 }catch(err){console.error("workforce-ctpa-subscriptions",err);return send({error:"Unable to load or change subscription. Contact support if Stripe billing may have changed."},500)}
});