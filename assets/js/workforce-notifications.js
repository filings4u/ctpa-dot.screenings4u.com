(()=>{"use strict";
const $=id=>document.getElementById(id),esc=x=>String(x??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\x27/g,"&#39;");
const endpoint="https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-ctpa-notifications",key="sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC";
let ctx,notices=[],search="",status="all",selected=null,seq=0;
async function api(action,rest={}){
 const token=(await ctx.supabase.auth.getSession()).data?.session?.access_token;if(!token)throw Error("Please sign in to view Workforce notifications");
 const resp=await fetch(endpoint,{method:"POST",cache:"no-store",headers:{"Authorization":"Bearer "+token,"apikey":key,"Content-Type":"application/json"},body:JSON.stringify({action,tenant_id:ctx.tenantId,operating_context:ctx.context,...rest})});
 const data=await resp.json().catch(()=>({}));if(!resp.ok||data.error)throw Error(data.error||"Notification service unavailable");return data;
}
function frame(body){
 $("pageContent").innerHTML='<div class="wf-notifications"><header class="wf-notice-hero"><div><small>WORKFORCE C/TPA · ACCOUNT UPDATES</small><h2>Notifications</h2><p>Official notices and account updates sent to your C/TPA from Workforce. Respond through Support when a reply is requested.</p></div><span>WORKFORCE NOTICES</span></header>'+body+'</div>';
}
function list(){
 selected=null;
 const visible=notices.filter(n=>(status==="all"||status==="unread"&&!n.read_at||status==="read"&&n.read_at)&&[n.title,n.body,n.category].join(" ").toLowerCase().includes(search.toLowerCase()));
 const unread=notices.filter(n=>!n.read_at).length;
 frame('<section class="wf-notice-stats"><article><small>All notifications</small><strong>'+notices.length+'</strong></article><article><small>Unread</small><strong>'+unread+'</strong></article><article><small>Reply available</small><strong>'+notices.filter(n=>n.reply_enabled).length+'</strong></article></section><section class="wf-notice-panel"><div class="wf-notice-toolbar"><input id="wfNoticeSearch" type="search" value="'+esc(search)+'" placeholder="Search notifications"><select id="wfNoticeFilter"><option value="all">All</option><option value="unread">Unread</option><option value="read">Read</option></select></div>'+(visible.length?'<div class="wf-notice-list">'+visible.map(n=>'<button type="button" class="wf-notice-row '+(!n.read_at?"unread":"")+'" data-notice-id="'+esc(n.id)+'"><span class="wf-notice-symbol">♧</span><span class="wf-notice-row-text"><span class="wf-notice-row-heading"><strong>'+esc(n.title)+'</strong><span class="wf-notice-category">'+esc(n.category)+'</span></span><span>'+esc(n.body.slice(0,160))+'</span><small>'+esc(new Date(n.published_at).toLocaleString())+(n.reply_enabled?" · Reply available":"")+'</small></span><span>View</span></button>').join("")+'</div>':'<div class="wf-notice-empty"><strong>No notifications found</strong><p>Official messages published by Workforce will appear here. You do not create notifications from this page.</p></div>')+'</section>');
 $("wfNoticeFilter").value=status;$("wfNoticeFilter").onchange=e=>{status=e.target.value;list()};
 $("wfNoticeSearch").oninput=e=>{search=e.target.value;const pos=e.target.selectionStart;list();$("wfNoticeSearch").focus();$("wfNoticeSearch").setSelectionRange(pos,pos)};
 $("pageContent").querySelectorAll("[data-notice-id]").forEach(b=>b.onclick=()=>void detail(b.dataset.noticeId));
}
async function detail(id){
 try{
  const d=await api("detail",{id}),n=d.notice;if(!n)return;
  selected=id;
  await api("read",{id});
  const local=notices.find(x=>x.id===id);if(local)local.read_at=new Date().toISOString();
  frame('<section class="wf-notice-panel wf-notice-detail"><button type="button" class="btn secondary" id="wfBackNotices">Back to Notifications</button><div class="wf-notice-detail-head"><span class="wf-notice-category">'+esc(n.category)+'</span><span>'+esc(new Date(n.published_at).toLocaleString())+'</span></div><h3>'+esc(n.title)+'</h3><div class="wf-notice-body">'+esc(n.body)+'</div><div class="wf-notice-detail-foot"><span>Sent by Workforce</span>'+(n.reply_enabled?'<button type="button" class="btn primary" id="wfNoticeReply">Reply Through Support</button>':'<span>Reply not required</span>')+'</div></section>');
  $("wfBackNotices").onclick=list;
  $("wfNoticeReply")?.addEventListener("click",()=>replyTo(n.id));
 }catch(e){frame('<section class="wf-notice-panel wf-notice-error"><h3>Unable to open notification</h3><p>'+esc(e.message)+'</p><button id="wfNoticeRetry" class="btn secondary">Back</button></section>');$("wfNoticeRetry").onclick=list}
}
function replyTo(id){
 const n=notices.find(n=>n.id===id);
 if(!n||!n.reply_enabled)return;
 sessionStorage.setItem("workforce_ctpa_notice_reply",id);
 const nav=document.querySelector('[data-page="support"]');
 if(nav)nav.click();else location.assign("/unified.html?page=support&reply_notice="+encodeURIComponent(id));
}
async function replyForm(value,id,onBack){
 ctx=value;frame('<section class="wf-notice-panel wf-notice-support"><h3>Reply to Workforce Notification</h3><p>Loading notice…</p></section>');
 try{
  const result=await api("detail",{id}),n=result.notice;if(!n?.reply_enabled)throw Error("This notification is not available for replies");
  frame('<section class="wf-notice-panel wf-notice-support"><div class="wf-notice-support-heading"><div><small>SUPPORT / NOTIFICATION REPLY</small><h3>Reply to Workforce</h3></div><button class="btn secondary" id="wfSupportBack" type="button">Back to Notifications</button></div><div class="wf-notice-original"><strong>Original notice: '+esc(n.title)+'</strong><p>'+esc(n.body)+'</p></div><form id="wfNoticeReplyForm"><label>Ticket subject<input name="subject" maxlength="220" required value="'+esc("Re: "+n.title)+'"></label><label>Your reply to Workforce<textarea name="message" maxlength="8000" rows="7" required placeholder="Type your response or question…"></textarea></label><div class="wf-notice-submit"><span id="wfNoticeReplyStatus" role="status"></span><button class="btn primary" type="submit" id="wfNoticeReplySubmit">Send Support Reply</button></div></form></section>');
  $("wfSupportBack").onclick=onBack;
  $("wfNoticeReplyForm").onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,button=$("wfNoticeReplySubmit");button.disabled=true;$("wfNoticeReplyStatus").textContent="Sending your reply…";
   try{
    const subject=f.elements.subject.value.trim(),message=f.elements.message.value.trim();
    const r=await api("reply",{id,subject,message});sessionStorage.removeItem("workforce_ctpa_notice_reply");
    frame('<section class="wf-notice-panel wf-notice-done"><h3>Reply sent to Workforce Support</h3><p>Your response has been saved as a support request linked to the original notification.</p><p>Reference: <strong>'+esc(r.ticket_id)+'</strong></p><button class="btn primary" id="wfReturnNotices">Return to Notifications</button></section>');
    $("wfReturnNotices").onclick=onBack;
   }catch(err){$("wfNoticeReplyStatus").textContent=err.message;button.disabled=false}
  };
 }catch(err){frame('<section class="wf-notice-panel wf-notice-error"><h3>Cannot prepare Support reply</h3><p>'+esc(err.message)+'</p><button class="btn secondary" id="wfSupportErrorBack">Back</button></section>');$("wfSupportErrorBack").onclick=onBack}
}
async function open(value){ctx=value;const ticket=++seq;search="";status="all";frame('<section class="wf-notice-panel wf-notice-loading">Loading notifications…</section>');
 try{const result=await api("list");if(ticket!==seq||!value.active())return;notices=result.notices||[];list()}catch(e){if(ticket!==seq||!value.active())return;frame('<section class="wf-notice-panel wf-notice-error"><h3>Notifications unavailable</h3><p>'+esc(e.message)+'</p><button class="btn secondary" id="wfNoticeRefresh">Retry</button></section>');$("wfNoticeRefresh").onclick=()=>void open(value)}
}
function exportCsv(){const cols=["title","category","body","published_at","read_at","reply_enabled"],rows=[cols,...notices.map(x=>cols.map(c=>x[c]??""))],content=rows.map(r=>r.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(",")).join("\r\n");const u=URL.createObjectURL(new Blob([content],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");a.href=u;a.download="workforce-notifications.csv";a.click();setTimeout(()=>URL.revokeObjectURL(u),1200)}
window.WorkforceNotices=Object.freeze({open,replyForm,exportCsv});
})();