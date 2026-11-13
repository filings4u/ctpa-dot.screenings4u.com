import {createClient} from "npm:@supabase/supabase-js@2";
const uid=(v:unknown)=>typeof v==="string"&&/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(v);
const txt=(v:unknown,n=180)=>String(v??"").trim().slice(0,n);
Deno.serve(async request=>{
 const h={"Access-Control-Allow-Origin":"https://ctpa.screenings4u.com","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
 const response=(x:unknown,s=200)=>new Response(JSON.stringify(x),{headers:h,status:s});
 if(request.method==="OPTIONS")return new Response(null,{headers:h,status:204});
 if(request.method!=="POST")return response({error:"POST required"},405);
 try{
 const url=Deno.env.get("SUPABASE_URL")||"",pub=Deno.env.get("SUPABASE_ANON_KEY")||"",secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!url||!pub||!secret)return response({error:"Locations service unavailable"},503);
 const auth=createClient(url,pub,{auth:{persistSession:false,autoRefreshToken:false}});
 const token=(request.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
 const {data:{user},error}=await auth.auth.getUser(token);
 if(error||!user?.id||!user.email_confirmed_at)return response({error:"Sign in required"},401);
 const body=await request.json().catch(()=>({})),tenant=body.tenant_id,action=txt(body.action,30);
 if(!uid(tenant))return response({error:"Select your C/TPA organization"},400);
 const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const member=await db.from("workforce_unified_records").select("data").eq("tenant_id",tenant).eq("kind","membership").eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).maybeSingle();
 if(member.error)throw member.error;
 if(!member.data)return response({error:"C/TPA organization access denied"},403);
 const write=["owner","admin","editor"].includes(txt(member.data.data?.role,30).toLowerCase());
 const table=db.from("workforce_ctpa_business_locations");
 const list=async()=>{const r=await table.select("id,name,business_name,address_line1,address_line2,city,state,postal_code,country,phone,email,location_type,is_primary,status,created_at,updated_at").eq("tenant_id",tenant).order("is_primary",{ascending:false}).order("created_at",{ascending:true}).limit(500);if(r.error)throw r.error;return r.data||[]};
 if(action==="list")return response({ok:true,locations:await list(),can_write:write,workforce_visible:true});
 if(!write)return response({error:"Only authorized C/TPA members can change locations"},403);
 if(action==="save"){
  const v=body.location||{};
  const name=txt(v.name,140),business_name=txt(v.business_name,180),address_line1=txt(v.address_line1,220),address_line2=txt(v.address_line2,160),city=txt(v.city,110),state=txt(v.state,80),postal_code=txt(v.postal_code,20),country=txt(v.country||"US",70),phone=txt(v.phone,50),email=txt(v.email,180),location_type=txt(v.location_type||"office",30);
  if(!name||!business_name||!address_line1||!city||!state||!postal_code)return response({error:"Location name, business name, street, city, state and postal code are required"},400);
  if(!["office","headquarters","collection_site","operations","other"].includes(location_type))return response({error:"Invalid location type"},400);
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return response({error:"Enter a valid business email"},400);
  const values={name,business_name,address_line1,address_line2,city,state,postal_code,country,phone,email,location_type,updated_by:user.id,updated_at:new Date().toISOString()};
  let id:string;
  if(v.id){
   if(!uid(v.id))return response({error:"Invalid location record"},400);
   const update=await table.update(values).eq("id",v.id).eq("tenant_id",tenant).select("id").maybeSingle();
   if(update.error)throw update.error;if(!update.data)return response({error:"Location not found"},404);id=update.data.id;
  }else{
   const present=await list();
   const create=await table.insert({...values,tenant_id:tenant,is_primary:present.length===0,created_by:user.id,status:"active"}).select("id").single();
   if(create.error)throw create.error;id=create.data.id;
  }
  if(v.is_primary===true){const p=await db.rpc("workforce_ctpa_location_change",{p_tenant:tenant,p_id:id,p_action:"primary"});if(p.error)throw p.error}
  return response({ok:true,id,locations:await list()});
 }
 if(action==="make_primary"||action==="delete"){
  if(!uid(body.id))return response({error:"Select a valid location"},400);
  const result=await db.rpc("workforce_ctpa_location_change",{p_tenant:tenant,p_id:body.id,p_action:action==="delete"?"delete":"primary"});
  if(result.error){if(/At least one C\/TPA location is required/i.test(result.error.message))return response({error:"A C/TPA must have at least one location. Add another location before deleting this one."},409);throw result.error}
  return response({ok:true,locations:await list()});
 }
 return response({error:"Unknown location action"},400);
 }catch(e){console.error("[Workforce CTPA locations]",e);return response({error:"Unable to manage C/TPA locations"},500)}
});