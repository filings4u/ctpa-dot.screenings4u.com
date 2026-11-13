import {createClient} from "npm:@supabase/supabase-js@2";
const uuid=v=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
Deno.serve(async req=>{
const headers={"Access-Control-Allow-Origin":"https://ctpa.screenings4u.com","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const response=(data,status=200)=>new Response(JSON.stringify(data),{headers,status});
if(req.method==="OPTIONS")return new Response(null,{headers,status:204});
if(req.method!=="POST")return response({error:"POST required"},405);
try{
const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_ANON_KEY"),secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if(!url||!key||!secret)return response({error:"Pricing service is not configured"},503);
const jwt=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
const auth=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:{user},error}=await auth.auth.getUser(jwt);
if(error||!user?.id||!user.email_confirmed_at)return response({error:"Sign in required"},401);
const body=await req.json().catch(()=>({})),tenant=body.tenant_id,context=body.operating_context==="nondot"?"nondot":"dot";
if(!uuid(tenant))return response({error:"Choose an organization"},400);
const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const member=await db.from("workforce_unified_records").select("id").eq("tenant_id",tenant).eq("kind","membership").eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).maybeSingle();
if(member.error)throw member.error;
if(!member.data)return response({error:"Organization access denied"},403);
const [catalog,overrides]=await Promise.all([
db.from("workforce_ctpa_rate_catalog").select("id,service_name,service_code,category,description,default_price,currency,status,updated_at").eq("operating_context",context).neq("status","inactive").order("category").order("service_name").limit(500),
db.from("workforce_ctpa_rate_overrides").select("rate_id,price,status,updated_at").eq("tenant_id",tenant).limit(500)
]);
if(catalog.error||overrides.error)throw catalog.error||overrides.error;
const map=new Map((overrides.data||[]).map(o=>[o.rate_id,o]));
const rates=(catalog.data||[]).flatMap(rate=>{
const custom=map.get(rate.id);if(custom?.status==="hidden")return [];
const override=custom?.status==="published"&&custom.price!==null;
const price=override?Number(custom.price):rate.status==="published"&&rate.default_price!==null?Number(rate.default_price):null;
return [{id:rate.id,name:rate.service_name,code:rate.service_code,category:rate.category,description:rate.description,price,currency:rate.currency,price_source:override?"custom":price!==null?"default":"unpriced",updated_at:override?custom.updated_at:rate.updated_at}];
});
return response({ok:true,context,rates,summary:{services:rates.length,priced:rates.filter(r=>r.price!==null).length,custom:rates.filter(r=>r.price_source==="custom").length}});
}catch(error){console.error("ctpa-rate-sheet",error);return response({error:"Unable to retrieve your rate sheet"},500)}
});