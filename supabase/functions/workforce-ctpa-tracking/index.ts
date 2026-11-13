import {createClient} from "npm:@supabase/supabase-js@2";
const ORIGIN="https://ctpa.screenings4u.com";
const uuid=(v:unknown)=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const safe=(v:unknown,n=200)=>String(v??"").trim().slice(0,n);
const esc=(v:unknown)=>safe(v,2000).replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]||x));
const carrierLink=(carrier:string,tracking:string)=>carrier==="UPS"?"https://www.ups.com/track?tracknum="+encodeURIComponent(tracking):carrier==="FEDEX"?"https://www.fedex.com/fedextrack/?trknbr="+encodeURIComponent(tracking):"https://tools.usps.com/go/TrackConfirmAction?tLabels="+encodeURIComponent(tracking);
Deno.serve(async req=>{
 const headers={"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"POST required"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")||"",anon=Deno.env.get("SUPABASE_ANON_KEY")||"",service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!url||!anon||!service)return reply({error:"Tracking service unavailable"},503);
  const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const jwt=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  const {data:{user},error}=await auth.auth.getUser(jwt);
  if(error||!user||!user.email_confirmed_at)return reply({error:"Sign in required"},401);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const body=await req.json().catch(()=>({}));
  const tenant=body.tenant_id,context=body.operating_context==="nondot"?"nondot":"dot",action=safe(body.action,24);
  if(!uuid(tenant))return reply({error:"Choose a C/TPA organization"},400);
  const membership=await db.from("workforce_unified_records").select("data").eq("tenant_id",tenant).eq("kind","membership").eq("data->>user_id",user.id).eq("data->>status","active").is("archived_at",null).maybeSingle();
  if(membership.error)throw membership.error;
  if(!membership.data)return reply({error:"Organization access denied"},403);
  const role=safe(membership.data.data?.role,30),canSend=["owner","admin","editor"].includes(role);
  if(action==="list"){
   const rows=await db.from("workforce_ctpa_shipments").select("id,employer_name,employer_email,order_reference,carrier,tracking_number,shipment_status,contents,shipped_at,expected_delivery_at,delivered_at,created_at,employer_notified_at,updated_at").eq("tenant_id",tenant).eq("operating_context",context).order("created_at",{ascending:false}).limit(250);
   if(rows.error)throw rows.error;
   return reply({ok:true,shipments:(rows.data||[]).map((s:any)=>({...s,tracking_url:carrierLink(s.carrier,s.tracking_number),can_send:canSend&&!!s.employer_email}))});
  }
  if(action!=="send_employer")return reply({error:"Unknown tracking action"},400);
  if(!canSend)return reply({error:"You cannot send employer notifications"},403);
  if(!uuid(body.shipment_id))return reply({error:"Select a shipment"},400);
  const res=await db.from("workforce_ctpa_shipments").select("*").eq("id",body.shipment_id).eq("tenant_id",tenant).eq("operating_context",context).maybeSingle();
  if(res.error)throw res.error;
  const ship=res.data;
  if(!ship)return reply({error:"Shipment not found"},404);
  if(!ship.employer_record_id||!ship.employer_email)return reply({error:"An assigned employer email is required"},409);
  const employer=await db.from("workforce_unified_records").select("id,data").eq("id",ship.employer_record_id).eq("tenant_id",tenant).in("kind",context==="dot"?["employers","owner_operators"]:["employers"]).eq("operating_context",context).is("archived_at",null).maybeSingle();
  if(employer.error)throw employer.error;
  if(!employer.data)return reply({error:"Employer association is no longer valid"},409);
  const listedEmails=[employer.data.data?.contact_email,employer.data.data?.email,employer.data.data?.billing_email].map((v:any)=>safe(v,180).toLowerCase()).filter(Boolean);
  if(!listedEmails.includes(ship.employer_email.toLowerCase()))return reply({error:"Employer email changed. Staff must update shipment recipient"},409);
  const key=Deno.env.get("RESEND_API_KEY")||"";
  if(!key)return reply({error:"Email delivery is not configured"},503);
  const trackingUrl=carrierLink(ship.carrier,ship.tracking_number);
  const html='<div style="background:#f3f6fa;padding:32px 12px;font-family:Arial,sans-serif;color:#01122F"><div style="max-width:620px;margin:auto;background:white;border-radius:14px;overflow:hidden;border:1px solid #d4d3d4"><div style="background:#01122F;padding:24px"><img alt="Workforce" width="185" style="max-width:100%;height:auto" src="https://ctpa.screenings4u.com/images/logo2.png"></div><div style="padding:28px"><h1 style="font-size:23px;margin:0 0 14px">Shipment tracking information</h1><p>Tracking information is available for '+esc(ship.employer_name)+'.</p><table style="width:100%;font-size:14px;line-height:2"><tr><td>Carrier</td><td><b>'+esc(ship.carrier)+'</b></td></tr><tr><td>Tracking number</td><td><b>'+esc(ship.tracking_number)+'</b></td></tr><tr><td>Status</td><td>'+esc(ship.shipment_status.replaceAll("_"," "))+'</td></tr><tr><td>Order reference</td><td>'+esc(ship.order_reference||"—")+'</td></tr></table><p style="margin:28px 0"><a href="'+trackingUrl+'" style="background:#FDC102;color:#01122F;padding:13px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Track Shipment</a></p><p style="font-size:13px;color:#53617a">Shipment updates are provided by the carrier. Contact your C/TPA if you have questions.</p></div><div style="border-top:1px solid #eee;padding:16px 28px;font-size:12px;color:#53617a">Workforce by screenings4u</div></div></div>';
  const sent=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from:Deno.env.get("WORKFORCE_FROM_EMAIL")||Deno.env.get("SCREENINGS4U_FROM_EMAIL")||"Workforce <notifications@screenings4u.com>",to:[ship.employer_email],subject:"Workforce shipment tracking — "+ship.employer_name,html})});
  const result=await sent.json().catch(()=>({}));
  if(!sent.ok||!result.id)return reply({error:"Employer email was not accepted for delivery"},502);
  const updated=await db.from("workforce_ctpa_shipments").update({employer_notified_at:new Date().toISOString(),employer_notified_by:user.id,email_provider_id:result.id}).eq("id",ship.id).eq("tenant_id",tenant);
  if(updated.error)throw updated.error;
  return reply({ok:true,sent_to:ship.employer_email,provider_message_id:result.id});
 }catch(err){console.error("ctpa-tracking",err);return reply({error:"Unable to process shipment tracking"},500)}
});