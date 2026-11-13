import {createClient} from "npm:@supabase/supabase-js@2";
const uuid=x=>typeof x==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const clean=(x,n=255)=>String(x??"").trim().slice(0,n);
const dateOK=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!isNaN(Date.parse(x+"T12:00:00Z"));
const html=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
Deno.serve(async req=>{
 const headers={"Access-Control-Allow-Origin":"https://ctpa.screenings4u.com","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Content-Type":"application/json","Cache-Control":"no-store"};
 const send=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return send({error:"Method not supported"},405);
 try{
 const url=Deno.env.get("SUPABASE_URL")||"",pub=Deno.env.get("SUPABASE_ANON_KEY")||"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!url||!pub||!key)return send({error:"Demo scheduling unavailable"},503);
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
 const auth=createClient(url,pub,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authErr}=await auth.auth.getUser(token);
 if(authErr||!user?.id||!user.email_confirmed_at)return send({error:"Sign in required"},401);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const b=await req.json().catch(()=>({})),action=clean(b.action,30);
 const tenant=b.tenant_id;
 const members=await db.from("workforce_unified_records").select("tenant_id").eq("kind","membership").eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).limit(30);
 if(members.error)throw members.error;
 const allowed=new Set((members.data||[]).map(x=>x.tenant_id));
 if(!uuid(tenant)||!allowed.has(tenant))return send({error:"Select an authorized C/TPA organization"},403);
 const [settings]=await Promise.all([db.from("ctpa_demo_schedule_settings").select("timezone,weekdays,start_time,end_time,slot_minutes,duration_minutes,active").eq("settings_key","global").maybeSingle()]);
 if(settings.error)throw settings.error;
 const cfg=settings.data;if(!cfg)return send({error:"Demo scheduling has not been configured"},503);
 const org=await db.from("workforce_unified_records").select("data").eq("tenant_id",tenant).eq("kind","organization").is("archived_at",null).maybeSingle();
 if(org.error)throw org.error;
 if(action==="calendar"){
  if(!dateOK(b.start)||!dateOK(b.end))return send({error:"Select a calendar month"},400);
  const span=(Date.parse(b.end+"T12:00:00Z")-Date.parse(b.start+"T12:00:00Z"))/86400000;
  if(span<0||span>45)return send({error:"Calendar range must be 46 days or fewer"},400);
  const r=await db.rpc("workforce_ctpa_demo_calendar_v2",{p_start:b.start,p_end:b.end});
  if(r.error)throw r.error;
  return send({ok:true,timezone:cfg.timezone,duration_minutes:cfg.duration_minutes,active:cfg.active,slots:r.data||[]});
 }
 if(action==="list"){
  const r=await db.from("ctpa_demo_requests").select("id,requested_date,requested_time,timezone,duration_minutes,demo_topic,customer_notes,status,meeting_url,meeting_provider,created_at").eq("tenant_id",tenant).order("created_at",{ascending:false}).limit(100);
  if(r.error)throw r.error;return send({ok:true,requests:r.data||[],timezone:cfg.timezone});
 }
 if(action!=="book")return send({error:"Unknown demo scheduling action"},400);
 const day=b.day,time=b.time;
 if(!dateOK(day)||!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time||""))return send({error:"Choose an available date and time"},400);
 const topic=clean(b.topic,180),notes=clean(b.notes,3000),first=clean(b.first_name,100),last=clean(b.last_name,100),phone=clean(b.phone,40);
 if(!first||!last||!topic)return send({error:"Enter your name and demo topic"},400);
 const userEmail=clean(user.email,240);
 const company=clean(org.data?.data?.legal_name||org.data?.data?.name||"C/TPA",240);
 const prior=await db.from("ctpa_demo_requests").select("id").eq("tenant_id",tenant).eq("requested_by",user.id).gte("created_at",new Date(Date.now()-86400000).toISOString()).limit(5);
 if(prior.error)throw prior.error;if((prior.data||[]).length>=5)return send({error:"Too many demo requests in 24 hours. Please contact Support."},429);
 const booked=await db.rpc("workforce_ctpa_demo_book_v2",{p_tenant:tenant,p_user:user.id,p_day:day,p_slot:time,p_first:first,p_last:last,p_email:userEmail,p_phone:phone,p_company:company,p_topic:topic,p_notes:notes});
 if(booked.error){if(booked.error.code==="P0001")return send({error:"This time is no longer available. Select another slot."},409);throw booked.error}
 const bookingId=booked.data;
 const staff=await db.from("staff_profiles").select("user_id").eq("employment_status","active").limit(100);
 if(staff.error)throw staff.error;
 const recipients=[{email:userEmail,type:"ctpa",link:"https://ctpa.screenings4u.com/unified.html?page=demo_sessions"}];
 for(const row of staff.data||[]){
  if(!uuid(row.user_id)||row.user_id===user.id)continue;
  const [role,access]=await Promise.all([
   db.from("staff_role_assignments").select("id").eq("user_id",row.user_id).eq("active",true).limit(1),
   db.from("staff_business_access").select("id,assigned_customers_only").eq("user_id",row.user_id).eq("active",true).in("business_unit_code",["workforce","dot"]).limit(1)
  ]);
  if(role.error||access.error)throw role.error||access.error;
  if(!role.data?.length||!access.data?.some(x=>!x.assigned_customers_only))continue;
  const detail=await db.auth.admin.getUserById(row.user_id);
  const addr=clean(detail.data?.user?.email,240).toLowerCase();
  if(addr&&addr!==userEmail.toLowerCase())recipients.push({email:addr,type:"staff",link:"https://app.screenings4u.com/ctpa-demo-management.html"});
 }
 const resend=Deno.env.get("RESEND_API_KEY")||"",sender=Deno.env.get("WORKFORCE_FROM_EMAIL")||Deno.env.get("SCREENINGS4U_FROM_EMAIL")||"Workforce <notifications@screenings4u.com>";
 let emailed=0;
 for(const r of new Map(recipients.map(x=>[x.email.toLowerCase(),x])).values()){
  const dedupe="ctpa-demo-v2:"+bookingId+":"+r.email.toLowerCase();
  const inserted=await db.from("workforce_mail_delivery_v2").upsert({dedupe_key:dedupe,kind:"demo_request",recipient:r.email,subject:"Workforce Demo Request",status:"pending"},{onConflict:"dedupe_key",ignoreDuplicates:true}).select("id").maybeSingle();
  if(inserted.error){console.error("email log",inserted.error);continue}
  if(!inserted.data||!resend)continue;
  try{
   const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+resend,"Content-Type":"application/json","Idempotency-Key":dedupe.slice(0,255)},body:JSON.stringify({from:sender,to:[r.email],subject:r.type==="ctpa"?"Workforce | Demo Request Received":"Workforce | New C/TPA Demo Request",html:'<div style="background:#01122F;padding:22px"><img src="https://ctpa.screenings4u.com/images/logo2.png" alt="Workforce" width="175"></div><div style="font:14px Arial;padding:25px;color:#01122F"><h2>'+(r.type==="ctpa"?"Demo request received":"New demo request")+'</h2><p>'+html(r.type==="ctpa"?"Your requested appointment is pending Workforce confirmation.":"A C/TPA has requested a demo.")+'</p><p><b>Date:</b> '+html(day)+'<br><b>Time:</b> '+html(time)+' ('+html(cfg.timezone)+')<br><b>Topic:</b> '+html(topic)+'</p><a href="'+r.link+'" style="display:inline-block;background:#FDC102;color:#01122F;padding:12px 18px;border-radius:7px;text-decoration:none;font-weight:bold">View Request</a></div>'})});
   const response=await res.json().catch(()=>({}));
   await db.from("workforce_mail_delivery_v2").update({status:res.ok?"sent":"failed",attempt_count:1,provider_message_id:response.id||null,last_error:res.ok?null:clean(response.message||"Email rejected",300),updated_at:new Date().toISOString()}).eq("id",inserted.data.id);
   if(res.ok)emailed++;
  }catch(err){console.error("demo email",err)}
 }
 return send({ok:true,id:bookingId,status:"requested",emails_sent:emailed,timezone:cfg.timezone});
 }catch(e){console.error("[C/TPA demo booking]",e);return send({error:"Demo scheduling request failed"},500)}
});