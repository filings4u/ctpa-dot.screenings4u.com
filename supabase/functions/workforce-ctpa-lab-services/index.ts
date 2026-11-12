import { createClient } from "npm:@supabase/supabase-js@2";
const H={"Access-Control-Allow-Origin":"https://ctpa.screenings4u.com","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const out=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:H});
const uuid=(x:unknown)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(x||""));
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:H});
 if(req.method!=="POST")return out({error:"POST required"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")||"",anon=Deno.env.get("SUPABASE_ANON_KEY")||"",secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!url||!anon||!secret)return out({error:"Service not configured"},503);
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!token)return out({error:"Authentication required"},401);
  const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await auth.auth.getUser(token);
  if(authError||!user?.id||!user.email_confirmed_at)return out({error:"Verified sign-in required"},401);
  const payload=await req.json().catch(()=>({}));
  const action=String(payload.action||"access"),ctpaId=String(payload.ctpa_id||"");
  if(!["access","overview"].includes(action)||!uuid(ctpaId))return out({error:"Invalid request"},400);
  const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const c=await db.from("ctpas").select("id,organization_id,status").eq("id",ctpaId).maybeSingle();
  if(c.error)throw c.error;
  if(!c.data?.organization_id||c.data.status!=="active")return out({authorized:false,reason:"C/TPA workspace unavailable"},403);
  const member=await db.from("organization_memberships").select("id,status").eq("organization_id",c.data.organization_id).eq("user_id",user.id).eq("status","active").limit(1);
  if(member.error)throw member.error;
  if(!member.data?.length)return out({authorized:false,reason:"You are not a member of this C/TPA organization"},403);
  const grant=await db.from("workforce_lab_company_entitlements")
   .select("id,organization_id,ctpa_id,status,source_order_id,linked_customer_user_id,grant_source")
   .eq("organization_id",c.data.organization_id).eq("ctpa_id",ctpaId).eq("entitlement_code","lab_account").eq("status","active").limit(1).maybeSingle();
  if(grant.error)throw grant.error;
  if(!grant.data)return out({authorized:false,reason:"Lab Account add-on not enabled for this company"},403);
  if(action==="access")return out({authorized:true,features:{lab_account:true},organization_id:c.data.organization_id});
  const [labs,intake]=await Promise.all([
   db.from("ctpa_lab_accounts").select("id,lab_name,account_code,is_primary,status,config,updated_at").eq("ctpa_id",ctpaId).order("created_at",{ascending:true}).limit(40),
   grant.data.source_order_id&&grant.data.linked_customer_user_id
    ?db.from("lab_account_intakes").select("id,order_number,status,account_status,created_at,completed_at").eq("order_id",grant.data.source_order_id).eq("customer_user_id",grant.data.linked_customer_user_id).limit(20)
    :Promise.resolve({data:[],error:null})
  ]);
  if(labs.error||intake.error)throw labs.error||intake.error;
  const intakeIds=(intake.data||[]).map((x:any)=>x.id);
  const shipment=intakeIds.length
   ?await db.from("house_lab_supply_shipments").select("id,intake_id,carrier,tracking_number,status,items_description,created_at").in("intake_id",intakeIds).order("created_at",{ascending:false}).limit(100)
   :{data:[],error:null};
  if(shipment.error)throw shipment.error;
  return out({
   authorized:true,features:{lab_account:true},
   lab_accounts:(labs.data||[]).map((x:any)=>({
    id:x.id,lab_name:x.lab_name,account_code:x.account_code,is_primary:x.is_primary,status:x.status,
    account_numbers:{dot:String(x.config?.account_numbers?.dot||x.account_code||""),non_dot:String(x.config?.account_numbers?.non_dot||""),hair:String(x.config?.account_numbers?.hair||""),oral:String(x.config?.account_numbers?.oral||"")}
   })),
   setup_records:intake.data||[],shipments:shipment.data||[],
   note:"This migration view is read-only. Test orders, CCFs, results, and supply requests remain in their existing authorized workflows until integrated and tested."
  });
 }catch(e){console.error("workforce-ctpa-lab-services",e);return out({error:"Unable to load your Lab Account"},500)}
});