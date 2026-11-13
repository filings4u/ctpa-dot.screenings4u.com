(()=>{"use strict";
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\x27/g,"&#39;");
const money=x=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(x)||0);
const format=x=>x?new Date(x.length===10?x+"T12:00:00Z":x).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):"Not verified";
let ctx=null,rows=[],search="",filter="all",seq=0;
async function api(action,more={}){
 const token=(await ctx.supabase.auth.getSession()).data?.session?.access_token;
 if(!token)throw Error("Sign in required");
 const response=await fetch("https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-ctpa-subscriptions",{method:"POST",cache:"no-store",headers:{"Authorization":"Bearer "+token,"apikey":"sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC","Content-Type":"application/json"},body:JSON.stringify({action,tenant_id:ctx.tenantId,operating_context:ctx.context,...more})});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||data.error)throw Error(data.error||"Subscription request failed");
 return data;
}
function dialog(title,message,confirmAction){
 const overlay=document.createElement("div");overlay.className="ctpa-sub-overlay";
 overlay.innerHTML='<section class="ctpa-sub-dialog" role="dialog" aria-modal="true"><header><h3>'+esc(title)+'</h3><button class="ctpa-sub-close" aria-label="Close">×</button></header><div class="ctpa-sub-body"><p>'+esc(message)+'</p><p class="ctpa-sub-feedback" role="status"></p><div class="ctpa-sub-dialog-actions"><button class="btn secondary" id="ctpaSubBack">Close</button>'+(confirmAction?'<button class="btn primary" id="ctpaSubConfirm">Confirm Cancellation</button>':'')+'</div></div></section>';
 const current=document.activeElement,close=()=>{document.removeEventListener("keydown",escKey,true);overlay.remove();if(current?.isConnected)current.focus()};
 const escKey=e=>{if(e.key==="Escape"){e.preventDefault();close()}};
 overlay.querySelector(".ctpa-sub-close").onclick=close;overlay.querySelector("#ctpaSubBack").onclick=close;
 document.body.append(overlay);document.addEventListener("keydown",escKey,true);
 if(confirmAction){overlay.querySelector("#ctpaSubConfirm").onclick=async e=>{const btn=e.currentTarget;btn.disabled=true;overlay.querySelector(".ctpa-sub-feedback").textContent="Scheduling cancellation with Stripe…";try{const result=await confirmAction();if(!result.needs_reconciliation){close();return}overlay.querySelector(".ctpa-sub-feedback").textContent="Stripe accepted cancellation, but local data needs review. Contact Support before making another change."}catch(err){overlay.querySelector(".ctpa-sub-feedback").textContent=err.message||"Cancellation unavailable";btn.disabled=false}}}
 overlay.querySelector(".ctpa-sub-close").focus();
}
async function cancel(r){
 const end=format(r.current_period_end||r.renewal_date);
 dialog("Cancel "+r.plan_name,"You will retain access until the verified subscription period ends (currently displayed as "+end+"). After access ends, your C/TPA data and employer and owner-operator data will enter a 60-day retrieval period. Submit a Support ticket within that period to request your information by email. Permanent deletion will occur after the retention window only when the approved deletion process is operational and legal retention requirements permit it. This cancellation will be scheduled with Stripe only after you confirm.",async()=>{
  const result=await api("cancel",{id:r.id,source:r.source});await refresh();return result;
 });
}
async function pay(r){
 try{
  const result=await api("pay",{id:r.id,source:r.source});
  if(!/^https:\/\/invoice\.stripe\.com\//.test(result.payment_url||""))throw Error("Verified payment link unavailable");
  location.assign(result.payment_url);
 }catch(err){dialog("Payment unavailable",err.message+" Please open a Support ticket for assistance.")}
}
function render(){
 const found=rows.filter(r=>(filter==="all"||(filter==="canceling"?r.cancel_at_period_end:r.status===filter))&&[r.plan_name,r.plan_code,r.status].join(" ").toLowerCase().includes(search.toLowerCase()));
 const stats=[["Subscriptions",rows.length],["Active plans",rows.filter(r=>r.status==="active"&&!r.cancel_at_period_end).length],["Scheduled cancellations",rows.filter(r=>r.cancel_at_period_end).length],["Payment attention",rows.filter(r=>["past_due","unpaid","incomplete"].includes(r.status)).length]];
 $("pageContent").innerHTML='<div class="ctpa-subs-root"><section class="ctpa-subs-hero"><div><small>WORKFORCE / ACCOUNT PLANS</small><h2>Subscriptions</h2><p>Manage your subscribed Workforce plans, billing periods and payment status. Only verified Stripe subscriptions can be canceled from this page.</p></div></section><section class="ctpa-subs-metrics">'+stats.map(x=>'<article><small>'+esc(x[0])+'</small><strong>'+esc(x[1])+'</strong></article>').join("")+'</section><section class="ctpa-subs-panel"><div class="ctpa-subs-tools"><input type="search" id="ctpaSubsSearch" placeholder="Search subscription" value="'+esc(search)+'"><select id="ctpaSubsFilter"><option value="all">All subscriptions</option><option value="active">Active</option><option value="trial">Trial</option><option value="past_due">Past due</option><option value="canceling">Cancellation scheduled</option></select></div>'+(found.length?'<div class="ctpa-subs-grid">'+found.map(r=>{
  const period=r.offboarding?.access_ends_at||r.current_period_end||r.renewal_date;
  const price=r.billing_frequency==="annual"?r.annual_price:r.monthly_price;
  return '<article class="ctpa-sub-card"><div class="ctpa-sub-title"><h3>'+esc(r.plan_name)+'</h3><span class="ctpa-sub-status">'+esc(r.cancel_at_period_end?"Cancellation scheduled":r.status)+'</span></div><div class="ctpa-sub-details"><div><small>Listed plan rate</small><strong>'+esc(price==null?"Not available":money(price)+(r.billing_frequency==="annual"?"/year":"/month"))+'</strong></div><div><small>Renewal or access end</small><strong>'+esc(format(period))+'</strong></div><div><small>Billing frequency</small><strong>'+esc(r.billing_frequency||"Not specified")+'</strong></div><div><small>Payment connection</small><strong>'+esc(r.has_stripe_subscription?"Stripe connected":"Support required")+'</strong></div></div>'+(r.offboarding?'<p class="ctpa-sub-retention">Access ends '+esc(format(r.offboarding.access_ends_at))+'. Retention review: '+esc(format(r.offboarding.retention_ends_at))+'.</p>':'')+'<div class="ctpa-sub-actions"><button type="button" class="btn secondary" data-sub-details="'+esc(r.id)+'">View Details</button>'+(r.can_pay?'<button type="button" class="btn primary" data-sub-pay="'+esc(r.id)+'">Pay Subscription</button>':'')+(r.can_cancel?'<button type="button" class="btn secondary" data-sub-cancel="'+esc(r.id)+'">Cancel Subscription</button>':'')+(!r.has_stripe_subscription?'<span class="ctpa-sub-note">Contact Support to manage billing</span>':'')+'</div></article>';
 }).join("")+'</div>':'<div class="ctpa-subs-empty"><strong>No subscriptions to display</strong><p>If you purchased a plan but it is missing, contact Support to reconcile your account.</p></div>')+'</section><section class="ctpa-subs-help"><strong>Need your information after cancellation?</strong><p>Submit a support ticket within the 60-day retrieval period after access ends to request a copy of your C/TPA and customer records. Some records may be subject to longer legal retention.</p><button type="button" class="btn secondary" id="ctpaSubSupport">Open Support</button></section></div>';
 $("ctpaSubsFilter").value=filter;
 $("ctpaSubsFilter").onchange=e=>{filter=e.target.value;render()};
 $("ctpaSubsSearch").oninput=e=>{search=e.target.value;const at=e.target.selectionStart;render();$("ctpaSubsSearch").focus();$("ctpaSubsSearch").setSelectionRange(at,at)};
 $("pageContent").querySelectorAll("[data-sub-cancel]").forEach(b=>b.onclick=()=>{const r=rows.find(x=>x.id===b.dataset.subCancel);if(r)void cancel(r)});
 $("pageContent").querySelectorAll("[data-sub-pay]").forEach(b=>b.onclick=()=>{const r=rows.find(x=>x.id===b.dataset.subPay);if(r)void pay(r)});
 $("pageContent").querySelectorAll("[data-sub-details]").forEach(b=>b.onclick=()=>{const r=rows.find(x=>x.id===b.dataset.subDetails);if(r)dialog("Subscription details","Plan: "+r.plan_name+". Status: "+r.status+". Renewal: "+format(r.renewal_date)+". Verified period end: "+format(r.current_period_end)+". "+(r.cancel_at_period_end?"Cancellation scheduled.":""))});
 $("ctpaSubSupport").onclick=()=>{const link=document.querySelector('[data-page="support"]');if(link)link.click();else location.assign("/unified.html?page=support")};
}
async function refresh(){const data=await api("list");rows=data.subscriptions||[];render()}
async function open(value){ctx=value;const token=++seq;search="";filter="all";$("pageContent").innerHTML='<section class="ctpa-subs-loading">Loading Workforce subscriptions…</section>';
 try{const data=await api("list");if(token!==seq||!value.active())return;rows=data.subscriptions||[];render()}catch(e){if(token!==seq||!value.active())return;$("pageContent").innerHTML='<section class="ctpa-subs-error"><h2>Subscriptions unavailable</h2><p>'+esc(e.message)+'</p><button class="btn secondary" id="ctpaSubsRetry">Try again</button></section>';$("ctpaSubsRetry").onclick=()=>void open(value)}
}
function exportCsv(){const cols=["plan_name","status","billing_frequency","renewal_date","current_period_end","cancel_at_period_end"],data=[cols,...rows.map(r=>cols.map(k=>r[k]??""))],csv=data.map(x=>x.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\r\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"})),a=document.createElement("a");a.href=url;a.download="workforce-subscriptions.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1200)}
window.WorkforceSubscriptions=Object.freeze({open,exportCsv});
})();