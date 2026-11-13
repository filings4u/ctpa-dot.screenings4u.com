import {createClient} from "npm:@supabase/supabase-js@2";
const uuid=(v:unknown)=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const trim=(v:unknown,n=180)=>String(v??"").trim().slice(0,n);
Deno.serve(async req=>{
 const headers={"Access-Control-Allow-Origin":"https://ctpa.screenings4u.com","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{headers,status:204});
 if(req.method!=="POST")return reply({error:"POST required"},405);
 try{
 const url=Deno.env.get("SUPABASE_URL")||"",anon=Deno.env.get("SUPABASE_ANON_KEY")||"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!url||!anon||!key)return reply({error:"Provider rates are not configured"},503);
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
 const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await auth.auth.getUser(token);
 if(authError||!user?.id||!user.email_confirmed_at)return reply({error:"Sign in required"},401);
 const body=await req.json().catch(()=>({})),tenant=body.tenant_id,context=body.operating_context==="nondot"?"nondot":"dot";
 if(!uuid(tenant))return reply({error:"Select a C/TPA workspace"},400);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const membership=await db.from("workforce_unified_records").select("id").eq("tenant_id",tenant).eq("kind","membership").eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).maybeSingle();
 if(membership.error)throw membership.error;
 if(!membership.data)return reply({error:"Workspace access denied"},403);
 const [catalog,overrides]=await Promise.all([
 db.from("workforce_ctpa_provider_services").select("id,service_code,name,category,description,unit,operating_context,default_rate,status,updated_at").in("operating_context",[context,"both"]).eq("status","published").order("category").order("name").limit(1000),
 db.from("workforce_ctpa_provider_rates").select("service_id,rate,status,updated_at").eq("tenant_id",tenant).limit(1000)
 ]);
 if(catalog.error||overrides.error)throw catalog.error||overrides.error;
 const byId=new Map((overrides.data||[]).map((r:any)=>[r.service_id,r]));
 const services=(catalog.data||[]).flatMap((service:any)=>{
  const custom:any=byId.get(service.id);if(custom?.status==="hidden")return [];
  const overridden=custom?.status==="published"&&custom.rate!==null;
  const price=overridden?Number(custom.rate):service.default_rate!==null?Number(service.default_rate):null;
  return [{id:service.id,code:service.service_code,name:service.name,category:service.category,description:service.description,unit:service.unit,rate:price,currency:"USD",rate_source:overridden?"contract":price===null?"pending":"default",updated_at:overridden?custom.updated_at:service.updated_at}];
 });
 return reply({ok:true,services,summary:{total:services.length,priced:services.filter((x:any)=>x.rate!==null).length,custom:services.filter((x:any)=>x.rate_source==="contract").length}});
 }catch(err){console.error("workforce-ctpa-provider-services",err);return reply({error:"Unable to load provider compensation schedule"},500)}
});