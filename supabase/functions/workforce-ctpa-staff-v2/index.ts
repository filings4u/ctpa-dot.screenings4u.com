import {createClient} from "npm:@supabase/supabase-js@2";
const uuid=x=>typeof x==="string"&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(x);
const str=(x,n=200)=>String(x??"").trim().slice(0,n);
const roles=["owner","administrator","operations_manager","compliance_manager","program_manager","coordinator","collector","billing","support","staff","viewer"];
const types=["full_time","part_time","contract","temporary","intern"],statuses=["active","on_leave","inactive"];
Deno.serve(async req=>{
const headers={"Access-Control-Allow-Origin":"https://ctpa.screenings4u.com","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
if(req.method==="OPTIONS")return new Response(null,{headers,status:204});
if(req.method!=="POST")return respond({error:"Method not allowed"},405);
try{
const url=Deno.env.get("SUPABASE_URL")||"",pub=Deno.env.get("SUPABASE_ANON_KEY")||"",secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
if(!url||!pub||!secret)return respond({error:"Staff directory service is unavailable"},503);
const auth=createClient(url,pub,{auth:{persistSession:false,autoRefreshToken:false}});
const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
const {data:{user},error:authError}=await auth.auth.getUser(token);
if(authError||!user?.id||!user.email_confirmed_at)return respond({error:"Sign in to manage the staff directory"},401);
const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const body=await req.json().catch(()=>({})),tenant=body.tenant_id,action=str(body.action,30);
if(!uuid(tenant))return respond({error:"Choose a C/TPA organization"},400);
const memberships=await db.from("workforce_unified_records").select("data").eq("tenant_id",tenant).eq("kind","membership").eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).limit(10);
if(memberships.error)throw memberships.error;
if(!memberships.data?.length)return respond({error:"You do not have access to this C/TPA organization"},403);
const canManage=memberships.data.some(row=>["owner","admin","administrator","manager"].includes(String(row.data?.role||"").toLowerCase()));
const table=()=>db.from("workforce_ctpa_staff_directory_v2");
if(action==="list"){
 const r=await table().select("id,first_name,last_name,preferred_name,email,phone,mobile_phone,office_phone,extension,employee_number,department,position,job_title,role_code,supervisor_id,location_id,employment_type,status,start_date,work_timezone,work_schedule,notes,created_at,updated_at").eq("tenant_id",tenant).is("archived_at",null).order("last_name",{ascending:true}).limit(500);
 if(r.error)throw r.error;return respond({ok:true,people:r.data||[],can_manage:canManage});
}
if(!canManage)return respond({error:"Only C/TPA owners or administrators can manage the directory"},403);
if(action==="archive"){
 if(!uuid(body.id))return respond({error:"Choose a staff member"},400);
 const found=await table().select("id").eq("tenant_id",tenant).eq("id",body.id).is("archived_at",null).maybeSingle();
 if(found.error)throw found.error;if(!found.data)return respond({error:"Staff member not found"},404);
 const now=new Date().toISOString();
 const detach=await table().update({supervisor_id:null,updated_by:user.id,updated_at:now}).eq("tenant_id",tenant).eq("supervisor_id",body.id).is("archived_at",null);
 if(detach.error)throw detach.error;
 const r=await table().update({archived_at:now,updated_by:user.id,updated_at:now,status:"inactive"}).eq("tenant_id",tenant).eq("id",body.id).is("archived_at",null).select("id").maybeSingle();
 if(r.error)throw r.error;return respond({ok:true});
}
if(action!=="save")return respond({error:"Unknown staff directory action"},400);
const d=body.person||{};
const first=str(d.first_name,100),last=str(d.last_name,100),email=str(d.email,250).toLowerCase(),role=str(d.role_code,50)||"staff",employment=str(d.employment_type,30)||"full_time",status=str(d.status,30)||"active";
if(!first||!last||!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return respond({error:"A valid first name, last name, and email are required"},400);
if(!roles.includes(role)||!types.includes(employment)||!statuses.includes(status))return respond({error:"Choose a valid staff role, employment type and status"},400);
const schedule=d.work_schedule||{};
if(typeof schedule!=="object"||Array.isArray(schedule))return respond({error:"Invalid work schedule"},400);
const weekly={};
for(let i=0;i<7;i++){
 const val=schedule[String(i)]||null;
 if(val===null)continue;
 if(typeof val!=="object"||Array.isArray(val))return respond({error:"Invalid schedule day"},400);
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(val.start||"")||!/^([01]\d|2[0-3]):[0-5]\d$/.test(val.end||"")||val.end<=val.start)return respond({error:"Work schedule requires valid start and end times"},400);
 weekly[String(i)]={start:val.start,end:val.end};
}
const staffId=uuid(body.id)?body.id:null;
if(body.id&&!staffId)return respond({error:"Invalid staff identifier"},400);
const supervisor=uuid(d.supervisor_id)?d.supervisor_id:null;
if(d.supervisor_id&&!supervisor)return respond({error:"Invalid supervisor"},400);
if(supervisor===staffId&&staffId)return respond({error:"A staff member cannot supervise themselves"},400);
if(supervisor){
 const r=await table().select("id,supervisor_id").eq("tenant_id",tenant).eq("id",supervisor).is("archived_at",null).maybeSingle();
 if(r.error)throw r.error;if(!r.data)return respond({error:"Supervisor must belong to this C/TPA"},400);
 let ancestor=r.data,depth=0;
 while(ancestor?.supervisor_id&&staffId&&depth++<25){
  if(ancestor.supervisor_id===staffId)return respond({error:"Supervisor relationship would create a reporting cycle"},400);
  const a=await table().select("id,supervisor_id").eq("tenant_id",tenant).eq("id",ancestor.supervisor_id).is("archived_at",null).maybeSingle();
  if(a.error)throw a.error;ancestor=a.data;
 }
 if(depth>=25)return respond({error:"Supervisor hierarchy is too deep"},400);
}
const start=str(d.start_date,10);
if(start&&!/^\d{4}-\d{2}-\d{2}$/.test(start))return respond({error:"Invalid start date"},400);
const item={
 first_name:first,last_name:last,preferred_name:str(d.preferred_name,100),email,
 phone:str(d.phone,40),mobile_phone:str(d.mobile_phone,40),office_phone:str(d.office_phone,40),extension:str(d.extension,12),
 employee_number:str(d.employee_number,50),department:str(d.department,120),position:str(d.position,120),job_title:str(d.job_title,150),
 role_code:role,supervisor_id:supervisor,location_id:null,employment_type:employment,status,start_date:start||null,
 work_timezone:str(d.work_timezone,80)||"America/Chicago",work_schedule:weekly,notes:str(d.notes,2000),
 updated_by:user.id,updated_at:new Date().toISOString()
};
let result;
if(staffId){
 const old=await table().select("id").eq("tenant_id",tenant).eq("id",staffId).is("archived_at",null).maybeSingle();
 if(old.error)throw old.error;if(!old.data)return respond({error:"Staff member not found"},404);
 result=await table().update(item).eq("tenant_id",tenant).eq("id",staffId).is("archived_at",null).select("id").single();
}else result=await table().insert({...item,tenant_id:tenant,created_by:user.id}).select("id").single();
if(result.error){
 if(result.error.code==="23505")return respond({error:"This email is already listed in the C/TPA directory"},409);
 throw result.error;
}
return respond({ok:true,id:result.data.id});
}catch(e){console.error("[C/TPA staff directory]",e);return respond({error:"Unable to complete the staff directory operation"},500)}
});