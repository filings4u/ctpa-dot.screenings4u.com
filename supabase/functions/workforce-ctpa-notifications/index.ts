import {createClient} from "npm:@supabase/supabase-js@2";
const valid=x=>typeof x==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const cut=(x,n)=>String(x??"").trim().slice(0,n);
Deno.serve(async req=>{
 const h={"Access-Control-Allow-Origin":"https://ctpa.screenings4u.com","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
 const reply=(v,s=200)=>new Response(JSON.stringify(v),{headers:h,status:s});
 if(req.method==="OPTIONS")return new Response(null,{headers:h,status:204});
 if(req.method!=="POST")return reply({error:"POST required"},405);
 try{
 const url=Deno.env.get("SUPABASE_URL")||"",anon=Deno.env.get("SUPABASE_ANON_KEY")||"",service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!url||!anon||!service)return reply({error:"Notifications service unavailable"},503);
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,""),auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await auth.auth.getUser(token);
 if(error||!user?.id||!user.email_confirmed_at)return reply({error:"Sign in required"},401);
 const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}}),body=await req.json().catch(()=>({})),tenant=body.tenant_id,context=body.operating_context==="nondot"?"nondot":"dot",action=cut(body.action,25);
 if(!valid(tenant))return reply({error:"Choose a C/TPA organization"},400);
 const m=await db.from("workforce_unified_records").select("id").eq("tenant_id",tenant).eq("kind","membership").eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).maybeSingle();
 if(m.error)throw m.error;if(!m.data)return reply({error:"Organization access denied"},403);
 const base=()=>db.from("workforce_ctpa_platform_notices").select("id,title,body,category,reply_enabled,status,published_at,operating_context").eq("tenant_id",tenant).in("operating_context",[context,"shared"]).eq("status","published");
 if(action==="list"){
  const q=await base().order("published_at",{ascending:false}).limit(300);
  if(q.error)throw q.error;
  const notices=q.data||[],ids=notices.map(x=>x.id);
  let read=[];
  if(ids.length){const r=await db.from("workforce_ctpa_notice_reads").select("notice_id,read_at").eq("user_id",user.id).in("notice_id",ids);if(r.error)throw r.error;read=r.data||[]}
  const map=new Map(read.map(x=>[x.notice_id,x.read_at]));
  return reply({ok:true,notices:notices.map(n=>({...n,read_at:map.get(n.id)||null}))});
 }
 if(!valid(body.id))return reply({error:"Choose a notice"},400);
 const notice=await base().eq("id",body.id).maybeSingle();
 if(notice.error)throw notice.error;if(!notice.data)return reply({error:"Notice not found"},404);
 if(action==="detail")return reply({ok:true,notice:notice.data});
 if(action==="read"){
  const r=await db.from("workforce_ctpa_notice_reads").upsert({notice_id:body.id,user_id:user.id,read_at:new Date().toISOString()},{onConflict:"notice_id,user_id"});
  if(r.error)throw r.error;return reply({ok:true});
 }
 if(action==="reply"){
  if(!notice.data.reply_enabled)return reply({error:"This notice does not accept replies"},409);
  const message=cut(body.message,8000),subject=cut(body.subject,220)||"Re: "+notice.data.title;
  if(!message||message.length>8000)return reply({error:"Enter a message"},400);
  const saved=await db.from("workforce_ctpa_notice_support_replies").insert({tenant_id:tenant,notice_id:notice.data.id,user_id:user.id,subject,message,status:"open"}).select("id,submitted_at").single();
  if(saved.error)throw saved.error;
  return reply({ok:true,ticket_id:saved.data.id,submitted_at:saved.data.submitted_at});
 }
 return reply({error:"Unsupported notice action"},400);
 }catch(e){console.error("[CTPA notifications]",e);return reply({error:"Unable to process Workforce notice"},500)}
});