import {createClient} from "npm:@supabase/supabase-js@2";
const allowedOrigin="https://ctpa.screenings4u.com";
const uuid=(v:unknown)=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const text=(v:unknown,max=160)=>String(v??"").trim().slice(0,max);
const payload=(x:unknown)=>x&&typeof x==="object"&&!Array.isArray(x)?x as Record<string,unknown>:null;
Deno.serve(async request=>{
 const headers={"Access-Control-Allow-Origin":allowedOrigin,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
 const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(request.method!=="POST")return respond({error:"POST required"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")||"",anon=Deno.env.get("SUPABASE_ANON_KEY")||"",service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!url||!anon||!service)return respond({error:"Supplies service is not configured"},503);
  const token=(request.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!token)return respond({error:"Sign-in required"},401);
  const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await auth.auth.getUser(token);
  if(authError||!user?.id||!user.email_confirmed_at)return respond({error:"Verified account required"},401);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const body=payload(await request.json().catch(()=>null));
  if(!body)return respond({error:"Invalid request"},400);
  const action=text(body.action,40),tenantId=body.tenant_id;
  if(!uuid(tenantId))return respond({error:"Select an organization"},400);
  const collection=db.from("workforce_unified_records");
  const member=await collection.select("id,data").eq("tenant_id",tenantId).eq("kind","membership").eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).maybeSingle();
  if(member.error)throw member.error;
  if(!member.data)return respond({error:"Organization access denied"},403);
  const role=text(member.data.data?.role,20);
  const canWrite=["owner","admin","editor"].includes(role);
  const context=body.operating_context==="nondot"?"nondot":"dot";
  // Independent supply storefront. Prices come exclusively from active services/service_prices.
  // No fulfillment is authorized until Stripe independently reports succeeded payment.
  const supplyInventory=async()=>{
   const result=await db.from("services").select("id,name,slug,sku,description,metadata,active")
    .eq("active",true).eq("metadata->>admin_order_catalog","true")
    .eq("metadata->>physical_product","true").order("name").limit(100);
   if(result.error)throw result.error;
   const products=await Promise.all((result.data||[]).map(async(svc:any)=>{
    const now=new Date().toISOString();
    const price=await db.from("service_prices").select("amount,currency,id")
     .eq("service_id",svc.id).eq("active",true).lte("effective_from",now)
     .or("effective_to.is.null,effective_to.gt."+now)
     .order("effective_from",{ascending:false}).limit(1).maybeSingle();
    if(price.error)throw price.error;
    const amount=Number(price.data?.amount),available=!!price.data&&Number.isFinite(amount)&&amount>0&&amount<=100000;
    return {id:svc.id,name:text(svc.name,150),description:text(svc.description,800),
     slug:text(svc.slug,100),sku:text(svc.sku,100),category:text(svc.metadata?.catalog_group,80)||"Collection Supplies",
     unit_price:available?amount:null,currency:"USD",available,price_id:price.data?.id||null};
   }));
   return products;
  };
  const supplyOrder=async(id:unknown)=>{
   if(!uuid(id))return null;
   const order=await db.from("orders").select("*,order_items(*)").eq("id",id)
    .eq("user_id",user.id).eq("metadata->>tenant_id",tenantId)
    .eq("metadata->>portal_source","ctpa_unified_supplies").maybeSingle();
   if(order.error)throw order.error;
   return order.data||null;
  };
  if(action==="supplies_catalog"){
   const [catalog,orders]=await Promise.all([
    supplyInventory(),
    db.from("orders").select("id,order_number,total,status,payment_status,created_at,tracking_number,metadata")
     .eq("user_id",user.id).eq("metadata->>tenant_id",tenantId)
     .eq("metadata->>portal_source","ctpa_unified_supplies")
     .order("created_at",{ascending:false}).limit(75)
   ]);
   if(orders.error)throw orders.error;
   const companies=await collection.select("id,kind,data").eq("tenant_id",tenantId).in("kind",context==="dot"?["employers","owner_operators"]:["employers"]).eq("operating_context",context).is("archived_at",null).limit(1000);
   if(companies.error)throw companies.error;
   return respond({ok:true,products:catalog,orders:orders.data||[],companies:companies.data||[]});
  }
  if(action==="supplies_create_order"){
   if(!canWrite)return respond({error:"You cannot place supply orders"},403);
   const cart=Array.isArray(body.items)?body.items:[];
   if(!cart.length||cart.length>40)return respond({error:"Add at least one supply product"},400);
   const companyId=text(body.company_id,50),recipient=companyId?"employer":"ctpa";
   let company:any=null;
   if(companyId){
    if(!uuid(companyId))return respond({error:"Invalid recipient company"},400);
    const c=await collection.select("id,data").eq("tenant_id",tenantId).eq("id",companyId)
     .in("kind",context==="dot"?["employers","owner_operators"]:["employers"])
     .eq("operating_context",context).is("archived_at",null).maybeSingle();
    if(c.error)throw c.error;
    if(!c.data)return respond({error:"Recipient employer not found in this workspace"},403);
    company=c.data;
   }
   const addr=payload(body.shipping),contact=payload(body.contact);
   if(!addr||!contact)return respond({error:"Shipping and contact information required"},400);
   const ship={name:text(addr.name,140),address_line1:text(addr.address_line1,180),
    address_line2:text(addr.address_line2,120),city:text(addr.city,100),
    state:text(addr.state,35),postal_code:text(addr.postal_code,20),country:"US"};
   if(!ship.name||!ship.address_line1||!ship.city||!ship.state||!/^[0-9]{5}(-[0-9]{4})?$/.test(ship.postal_code))
    return respond({error:"Enter a complete US shipping address including ZIP code"},400);
   const email=text(contact.email,180).toLowerCase(),first=text(contact.first_name,80),last=text(contact.last_name,80),phone=text(contact.phone,35);
   if(!first||!last||!phone||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return respond({error:"First name, last name, phone and a valid email are required"},400);
   const catalog=await supplyInventory(),lookup=new Map(catalog.map(p=>[p.id,p]));
   const lines:any[]=[];
   const seen=new Set<string>();
   for(const raw of cart){
    const id=text(raw?.service_id,50),quantity=Number(raw?.quantity);
    if(!uuid(id)||seen.has(id)||!Number.isInteger(quantity)||quantity<1||quantity>100)
     return respond({error:"Invalid supply item or quantity"},400);
    seen.add(id);
    const product=lookup.get(id);
    if(!product||!product.available||product.unit_price===null)
     return respond({error:"A selected supply is not available for purchase"},409);
    lines.push({product,quantity,unit_price:Number(product.unit_price)});
   }
   const totalCents=lines.reduce((sum,l)=>sum+Math.round(l.unit_price*100)*l.quantity,0);
   if(totalCents<=0||totalCents>100000000)return respond({error:"Invalid order total"},400);
   const now=new Date().toISOString(),orderId=crypto.randomUUID();
   const orderNumber="WS-SUP-"+new Date().toISOString().slice(0,10).replaceAll("-","")+"-"+orderId.slice(0,8).toUpperCase();
   const data={
    id:orderId,order_number:orderNumber,user_id:user.id,customer_email:email,
    customer_first_name:first,customer_last_name:last,customer_phone:phone,
    subtotal:totalCents/100,tax:0,total:totalCents/100,currency:"usd",
    status:"pending",payment_status:"unpaid",source:"admin",
    fulfillment_type:"other",fulfillment_status:"pending",
    company_name:company?text(company.data?.legal_name,170):"C/TPA organization",
    notes:text(body.notes,1200),
    metadata:{portal_source:"ctpa_unified_supplies",tenant_id:tenantId,operating_context:context,
     recipient_type:recipient,recipient_company_id:company?.id||null,
     shipping:ship,fulfillment_authorized:false,payment_required:true,pricing_source:"services/service_prices"}
   };
   const order=await db.from("orders").insert(data).select("id,order_number,total,payment_status").single();
   if(order.error)throw order.error;
   const items=lines.map(l=>({order_id:orderId,service_id:l.product.id,quantity:l.quantity,
    unit_price:l.unit_price,line_total:l.unit_price*l.quantity,
    metadata:{name:l.product.name,slug:l.product.slug,sku:l.product.sku,
     price_id:l.product.price_id,store:"ctpa_supplies"}}));
   const saved=await db.from("order_items").insert(items);
   if(saved.error){
    await db.from("orders").delete().eq("id",orderId).eq("payment_status","unpaid");
    throw saved.error;
   }
   return respond({ok:true,order:order.data,checkout_url:"/global-checkout.html?mode=supplies&order_id="+orderId});
  }
  if(["supplies_get_order","supplies_prepare_payment","supplies_confirm_payment"].includes(action)){
   const order=await supplyOrder(body.order_id);
   if(!order)return respond({error:"Supply order not found"},404);
   if(action==="supplies_get_order")return respond({ok:true,order});
   if(!canWrite)return respond({error:"You cannot pay this supply order"},403);
   if(order.payment_status==="paid")return respond({ok:true,paid:true,order});
   if(action==="supplies_prepare_payment"){
    if(!["unpaid","pending"].includes(order.payment_status))
     return respond({error:"Order is not payable"},409);
    const secret=Deno.env.get("STRIPE_SECRET_KEY")||"",publishable=Deno.env.get("STRIPE_PUBLISHABLE_KEY")||"";
    if(!secret||!publishable)return respond({error:"Secure payment configuration unavailable"},503);
    const Stripe=(await import("npm:stripe@18.5.0")).default;
    const stripe=new Stripe(secret,{apiVersion:"2025-08-27.basil"});
    let intent:any=null;
    if(order.stripe_payment_intent_id){
     try{intent=await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)}catch{}
    }
    if(intent&&Math.round(order.total*100)!==intent.amount)
     return respond({error:"Order total changed; contact support"},409);
    if(!intent||intent.status==="canceled"){
     intent=await stripe.paymentIntents.create({
      amount:Math.round(Number(order.total)*100),currency:"usd",
      receipt_email:order.customer_email,automatic_payment_methods:{enabled:true},
      metadata:{order_id:order.id,tenant_id:tenantId,source:"ctpa_unified_supplies"},
      description:"Workforce supply order "+order.order_number
     },{idempotencyKey:"ctpa-supplies-"+order.id});
    }
    if(intent.status==="succeeded")return respond({error:"Payment is processing; refresh order status"},409);
    const saved=await db.from("orders").update({
      stripe_payment_intent_id:intent.id,payment_reference:intent.id,payment_provider:"stripe",
      payment_method:"stripe",updated_at:new Date().toISOString()
     }).eq("id",order.id).eq("payment_status","unpaid").select("id").maybeSingle();
    if(saved.error)throw saved.error;
    if(!saved.data)return respond({error:"Order was changed. Refresh its status"},409);
    return respond({ok:true,client_secret:intent.client_secret,publishable_key:publishable});
   }
   const secret=Deno.env.get("STRIPE_SECRET_KEY")||"";
   if(!secret||!order.stripe_payment_intent_id)return respond({error:"Payment verification unavailable"},409);
   const Stripe=(await import("npm:stripe@18.5.0")).default;
   const stripe=new Stripe(secret,{apiVersion:"2025-08-27.basil"});
   const intent=await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
   if(intent.status!=="succeeded"||intent.metadata?.order_id!==order.id||
      intent.metadata?.tenant_id!==tenantId||intent.currency!=="usd"||
      intent.amount!==Math.round(Number(order.total)*100))
    return respond({error:"Payment not yet verified with Stripe"},409);
   const updated=await db.from("orders").update({
    payment_status:"paid",status:"processing",paid_at:new Date().toISOString(),
    metadata:{...order.metadata,fulfillment_authorized:true,stripe_verified_at:new Date().toISOString()},
    updated_at:new Date().toISOString()
   }).eq("id",order.id).eq("payment_status","unpaid").select("id,order_number,payment_status").maybeSingle();
   if(updated.error)throw updated.error;
   if(!updated.data){
    const latest=await supplyOrder(order.id);
    return respond({ok:true,paid:latest?.payment_status==="paid",order:latest});
   }
   return respond({ok:true,paid:true,order:updated.data});
  }

  return respond({error:"Unknown supplies action"},400);
 }catch(error){console.error("workforce-ctpa-supplies",error);return respond({error:"Unable to process supplies request"},500)}
});