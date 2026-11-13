import {createClient} from "npm:@supabase/supabase-js@2";
const uuid=(v:unknown)=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
Deno.serve(async req=>{
 const headers={"Access-Control-Allow-Origin":"https://ctpa.screenings4u.com","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
 const reply=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"POST required"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")||"",anon=Deno.env.get("SUPABASE_ANON_KEY")||"",secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!url||!anon||!secret)return reply({error:"Analytics not configured"},503);
  const jwt=(req.headers.get("authorization")||"").replace(/^Bearer\\s+/i,"");
  const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await auth.auth.getUser(jwt);
  if(error||!user?.id||!user.email_confirmed_at)return reply({error:"Sign in required"},401);
  const body=await req.json().catch(()=>({})),tenant=body.tenant_id,context=body.operating_context==="nondot"?"nondot":"dot";
  if(!uuid(tenant))return reply({error:"Select C/TPA workspace"},400);
  const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const member=await db.from("workforce_unified_records").select("id").eq("tenant_id",tenant).eq("kind","membership").eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).maybeSingle();
  if(member.error)throw member.error;
  if(!member.data)return reply({error:"Unauthorized workspace"},403);
  const months=Math.min(12,Math.max(3,Number.isInteger(body.months)?body.months:6));
  const start=new Date(),since=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()-(months-1),1)).toISOString();
  const [accounts,employers,orders,shipments]=await Promise.all([
   db.from("workforce_unified_records").select("id,created_at,data").eq("tenant_id",tenant).eq("operating_context",context).eq("kind","lab_accounts").is("archived_at",null).limit(5000),
   db.from("workforce_unified_records").select("id").eq("tenant_id",tenant).eq("operating_context",context).in("kind",context==="dot"?["employers","owner_operators"]:["employers"]).is("archived_at",null).limit(5000),
   db.from("orders").select("id,created_at,paid_at,total,payment_status,metadata").eq("metadata->>tenant_id",tenant).eq("metadata->>operating_context",context).eq("metadata->>portal_source","ctpa_unified_supplies").gte("created_at",since).limit(5000),
   db.from("workforce_ctpa_shipments").select("id,created_at,carrier,shipment_status,employer_name,employer_notified_at").eq("tenant_id",tenant).eq("operating_context",context).gte("created_at",since).limit(5000)
  ]);
  for(const result of [accounts,employers,orders,shipments])if(result.error)throw result.error;
  const shipmentRows=shipments.data||[],orderRows=orders.data||[],paid=orderRows.filter((o:any)=>o.payment_status==="paid");
  const buckets=Array.from({length:months},(_,i)=>{const d=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()-(months-1)+i,1));return {month:d.toISOString().slice(0,7),label:d.toLocaleDateString("en-US",{month:"short",year:"2-digit",timeZone:"UTC"}),supply_orders:0,paid_orders:0,revenue:0,shipments:0}});
  const byMonth=new Map(buckets.map((b:any)=>[b.month,b]));
  for(const o of orderRows){const b=byMonth.get(String(o.created_at).slice(0,7));if(b){b.supply_orders++;if(o.payment_status==="paid"){b.paid_orders++;b.revenue+=Number(o.total)||0}}}
  for(const s of shipmentRows){const b=byMonth.get(String(s.created_at).slice(0,7));if(b)b.shipments++}
  const carriers={USPS:0,FEDEX:0,UPS:0};const statuses:Record<string,number>={};
  for(const s of shipmentRows){if(s.carrier in carriers)(carriers as any)[s.carrier]++;statuses[s.shipment_status]=(statuses[s.shipment_status]||0)+1}
  const recent=shipmentRows.slice().sort((a:any,b:any)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,8).map((s:any)=>({id:s.id,employer_name:s.employer_name,carrier:s.carrier,status:s.shipment_status,created_at:s.created_at,notified:!!s.employer_notified_at}));
  return reply({ok:true,period_months:months,context,counts:{lab_accounts:(accounts.data||[]).length,employers:(employers.data||[]).length,orders:orderRows.length,paid_orders:paid.length,revenue:paid.reduce((sum:number,o:any)=>sum+Number(o.total||0),0),shipments:shipmentRows.length,delivered:shipmentRows.filter((s:any)=>s.shipment_status==="delivered").length,in_transit:shipmentRows.filter((s:any)=>["shipped","in_transit","out_for_delivery"].includes(s.shipment_status)).length,employer_notifications:shipmentRows.filter((s:any)=>!!s.employer_notified_at).length},monthly:buckets,carriers,statuses,recent_shipments:recent});
 }catch(e){console.error("workforce-ctpa-lab-analytics",e);return reply({error:"Unable to load lab analytics"},500)}
});