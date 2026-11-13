import {createClient} from "npm:@supabase/supabase-js@2";
const uid=x=>typeof x==="string"&&/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(x);
const trim=(v,n=2000)=>String(v??"").trim().slice(0,n);
Deno.serve(async req=>{
 const headers={"Access-Control-Allow-Origin":"https://ctpa.screenings4u.com","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Content-Type":"application/json","Cache-Control":"no-store"};
 const send=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return send({error:"Method not allowed"},405);
 try {
 const url=Deno.env.get("SUPABASE_URL")||"",anon=Deno.env.get("SUPABASE_ANON_KEY")||"",service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!url||!anon||!service)return send({error:"Integration service unavailable"},503);
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,""),auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await auth.auth.getUser(token);
 if(authError||!user?.id||!user.email_confirmed_at)return send({error:"Sign in required"},401);
 const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}}),body=await req.json().catch(()=>({})),action=trim(body.action,25),tenant=body.tenant_id;
 if(!uid(tenant))return send({error:"Choose your C/TPA organization"},400);
 const membership=await db.from("workforce_unified_records").select("data").eq("tenant_id",tenant).eq("kind","membership").eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).limit(10);
 if(membership.error)throw membership.error;if(!membership.data?.length)return send({error:"C/TPA account access required"},403);
 const editor=membership.data.some(x=>["owner","admin","administrator","manager"].includes(trim(x.data?.role,30).toLowerCase()));
 const subs=await db.from("workforce_subscriptions").select("plan_id,status").eq("tenant_id",tenant).in("status",["active","trial"]).limit(30);
 if(subs.error)throw subs.error;const ids=[...new Set((subs.data||[]).map(x=>x.plan_id).filter(uid))];
 const plans=ids.length?await db.from("workforce_plans").select("id,feature_entitlements").in("id",ids):{data:[],error:null};
 if(plans.error)throw plans.error;
 const enterprise=(plans.data||[]).some(x=>x.feature_entitlements?.integrations===true);
 const catalog=await db.from("integration_catalog").select("id,code,name,category,provider,description,active,portal_visible,allowed_customer_types,product_surface,requires_admin_consent").eq("active",true).eq("portal_visible",true).contains("allowed_customer_types",["ctpa"]).order("sort_order",{ascending:true}).limit(140);
 if(catalog.error)throw catalog.error;
 const available=catalog.data||[],known=new Set(available.map(x=>x.id));
 if(action==="list"){
  const requests=await db.from("workforce_ctpa_integration_requests_v2").select("id,catalog_id,status,request_notes,admin_notes,created_at,updated_at,reviewed_at,connected_at").eq("tenant_id",tenant).order("created_at",{ascending:false}).limit(150);
  if(requests.error)throw requests.error;
  return send({ok:true,catalog:available,requests:requests.data||[],enterprise,can_request:enterprise&&editor});
 }
 if(action!=="request")return send({error:"Unknown action"},400);
 if(!enterprise)return send({error:"Enterprise integration access is required"},403);
 if(!editor)return send({error:"Only C/TPA account administrators can request integrations"},403);
 if(!uid(body.catalog_id)||!known.has(body.catalog_id))return send({error:"Choose an available integration"},400);
 const note=trim(body.notes,2000);
 const already=await db.from("workforce_ctpa_integration_requests_v2").select("id,status").eq("tenant_id",tenant).eq("catalog_id",body.catalog_id).maybeSingle();
 if(already.error)throw already.error;if(already.data)return send({error:"This integration already has a request. View its current status instead."},409);
 const result=await db.from("workforce_ctpa_integration_requests_v2").insert({tenant_id:tenant,catalog_id:body.catalog_id,requested_by:user.id,request_notes:note}).select("id").single();
 if(result.error){if(result.error.code==="23505")return send({error:"This integration was already requested"},409);throw result.error}
 const log=await db.from("workforce_ctpa_integration_activity_v2").insert({request_id:result.data.id,actor_id:user.id,next_status:"requested",note:"C/TPA requested setup"});
 if(log.error)console.error("Integration audit log",log.error);
 return send({ok:true,id:result.data.id,status:"requested"});
 }catch(e){console.error("[C/TPA integrations]",e);return send({error:"Unable to process integration request"},500)}
});