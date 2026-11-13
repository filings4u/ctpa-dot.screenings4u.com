(()=>{"use strict";
const $=id=>document.getElementById(id),esc=x=>String(x??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\x27/g,"&#39;");
const fn="https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-ctpa-support-v2",noticeFn="https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-ctpa-notifications";
let ctx=null,tickets=[],selected=null,online=false,poll=null,sequence=0,search="",filter="all",draftNotice=null;
async function call(endpoint,action,extra={}){
 const token=(await ctx.supabase.auth.getSession()).data?.session?.access_token;
 if(!token)throw Error("Sign in required");
 const r=await fetch(endpoint,{method:"POST",cache:"no-store",headers:{"Authorization":"Bearer "+token,"apikey":"sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC","Content-Type":"application/json"},body:JSON.stringify({action,tenant_id:ctx.tenantId,operating_context:ctx.context,...extra})});
 const d=await r.json().catch(()=>({}));if(!r.ok||d.error)throw Error(d.error||"Support service unavailable");return d;
}
const api=(action,extra={})=>call(fn,action,extra);
function status(message){const target=$("ctpaSupportFeedback");if(target)target.textContent=message}
function stop(){if(poll){clearInterval(poll);poll=null}}
function shell(){
 $("pageContent").innerHTML='<div class="ctpa-support-v2"><header class="cs-hero"><div><small>WORKFORCE / CUSTOMER CARE</small><h2>Support Center</h2><p>Contact Workforce directly, follow your support requests and respond in the same conversation.</p></div><div id="ctpaSupportPresence" class="cs-presence offline"><span class="cs-light"></span><div><strong>Workforce Offline</strong><small>Submit a support ticket</small></div></div></header><div class="cs-summary"><div><small>Total tickets</small><strong id="csTotal">0</strong></div><div><small>Open requests</small><strong id="csOpen">0</strong></div><div><small>Awaiting your reply</small><strong id="csWaiting">0</strong></div></div><section class="cs-layout"><aside class="cs-sidebar"><div class="cs-sidebar-tools"><button class="btn primary" id="csNew" type="button">New Support Ticket</button><input id="csSearch" type="search" placeholder="Search tickets"><select id="csFilter"><option value="all">All tickets</option><option value="open">Open</option><option value="waiting_for_customer">Waiting for you</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div><div id="csTicketList" class="cs-ticket-list"></div></aside><main class="cs-content" id="csContent"><div class="cs-empty"><strong>Welcome to Workforce Support</strong><p>Choose a support request, or start a new conversation with our support team.</p></div></main></section><p id="ctpaSupportFeedback" role="status" class="cs-feedback"></p></div>';
 $("csNew").onclick=()=>compose();$("csSearch").oninput=e=>{search=e.target.value;drawTickets()};$("csFilter").onchange=e=>{filter=e.target.value;drawTickets()};
}
function renderPresence(){
 const box=$("ctpaSupportPresence");if(!box)return;
 box.className="cs-presence "+(online?"online":"offline");
 box.innerHTML='<span class="cs-light"></span><div><strong>'+ (online?"Workforce Online":"Workforce Offline")+'</strong><small>'+(online?"A staff member is active in Workforce Management":"Submit a ticket and we will respond")+'</small></div>';
}
function drawTickets(){
 const box=$("csTicketList");if(!box)return;
 const list=tickets.filter(t=>(filter==="all"||t.status===filter)&&[t.subject,t.category,t.priority].join(" ").toLowerCase().includes(search.toLowerCase()));
 $("csTotal").textContent=tickets.length;$("csOpen").textContent=tickets.filter(t=>!["resolved","closed"].includes(t.status)).length;$("csWaiting").textContent=tickets.filter(t=>t.status==="waiting_for_customer").length;
 box.innerHTML=list.length?list.map(t=>'<button class="cs-ticket '+(selected===t.id?"selected":"")+'" type="button" data-ticket="'+esc(t.id)+'"><span class="cs-ticket-line"><strong>'+esc(t.subject)+'</strong><span class="cs-ticket-status">'+esc(t.status.replaceAll("_"," "))+'</span></span><small>'+esc(t.category)+' · '+esc(t.priority)+' · '+esc(t.operating_context.toUpperCase())+'</small><small>'+esc(new Date(t.last_message_at).toLocaleString())+'</small></button>').join(""):'<div class="cs-no-tickets">No support tickets match this filter.</div>';
 box.querySelectorAll("[data-ticket]").forEach(b=>b.onclick=()=>void openTicket(b.dataset.ticket));
}
async function loadTickets(){
 const d=await api("list");tickets=d.tickets||[];online=!!d.online;renderPresence();drawTickets();
}
function compose(prefill=null){
 selected=null;drawTickets();
 const n=prefill||draftNotice;
 const source=n?.id||null;
 const message=n?"Regarding Workforce notification: "+n.title+"\n\nOriginal notice:\n"+n.body+"\n\nMy response:\n":"";
 $("csContent").innerHTML='<div class="cs-compose"><div class="cs-compose-head"><h3>'+(online?"Start a Support Conversation":"Create Support Ticket")+'</h3><p>'+(online?"Your message enters the Workforce support inbox for a live response.":"Our team is currently offline. Your ticket will be available when staff sign in.")+'</p></div>'+(n?'<div class="cs-notice-context"><strong>Replying to: '+esc(n.title)+'</strong><p>'+esc(n.body)+'</p></div>':'')+'<form id="csNewForm" class="cs-form"><label>Ticket subject<input name="subject" maxlength="220" required value="'+esc(n?"Re: "+n.title:"")+'" placeholder="What can we help with?"></label><div class="cs-form-row"><label>Category<select name="category"><option value="general">General assistance</option><option value="account">Account</option><option value="billing">Billing</option><option value="testing">Drug & alcohol testing</option><option value="compliance">Compliance</option><option value="technical">Technical support</option></select></label><label>Priority<select name="priority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label></div><label>Message<textarea name="message" required rows="9" maxlength="8000" placeholder="Explain how we can assist…">'+esc(message)+'</textarea></label><div class="cs-form-actions"><button class="btn secondary" id="csCancel" type="button">Cancel</button><button class="btn primary" id="csCreateSubmit" type="submit">'+(online?"Send Message":"Submit Ticket")+'</button></div></form></div>';
 $("csCancel").onclick=()=>{draftNotice=null;sessionStorage.removeItem("workforce_ctpa_notice_reply");$("csContent").innerHTML='<div class="cs-empty">Choose a ticket or create a new one.</div>'};
 $("csNewForm").onsubmit=async event=>{
  event.preventDefault();const f=event.currentTarget,subject=f.elements.subject.value.trim(),body=f.elements.message.value.trim();
  if(!subject||!body)return;
  if(n&&!body.split("My response:").slice(1).join("My response:").trim()){status("Enter your reply below the original notice.");return}
  const submit=$("csCreateSubmit");submit.disabled=true;status("Submitting your support request…");
  try{
   const d=await api("create",{subject,message:body,category:f.elements.category.value,priority:f.elements.priority.value,source_notice_id:source});
   draftNotice=null;sessionStorage.removeItem("workforce_ctpa_notice_reply");await loadTickets();await openTicket(d.id);status("Support request submitted. Reference: "+d.id);
  }catch(e){status(e.message)}finally{if(submit.isConnected)submit.disabled=false}
 };
}
async function loadDraftFromNotice(id){
 try{
  const n=await call(noticeFn,"detail",{id});if(!n.notice?.reply_enabled)throw Error("This notice is not open for replies");draftNotice=n.notice;compose(n.notice);
 }catch(e){status("Could not open notification reply: "+e.message);compose()}
}
async function openTicket(id){
 selected=id;drawTickets();const ticket=tickets.find(x=>x.id===id);if(!ticket)return;
 const panel=$("csContent");panel.innerHTML='<div class="cs-room-head"><div><small>WORKFORCE SUPPORT</small><h3>'+esc(ticket.subject)+'</h3><span>'+esc(ticket.status.replaceAll("_"," "))+' · '+esc(ticket.priority)+' priority</span></div><button class="btn secondary" id="csNewFromRoom">New Ticket</button></div><div class="cs-messages" id="csMessages" role="log" aria-label="Support conversation"></div><form class="cs-chat-form" id="csChatForm"><textarea name="message" rows="3" maxlength="8000" required placeholder="Reply to Workforce Support…" '+(ticket.status==="closed"?"disabled":"")+'></textarea><button type="submit" class="btn primary" id="csChatSend" '+(ticket.status==="closed"?"disabled":"")+'>Send Reply</button></form>';
 $("csNewFromRoom").onclick=()=>compose();
 $("csChatForm").onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,text=f.elements.message.value.trim();if(!text)return;const b=$("csChatSend");b.disabled=true;try{await api("send",{ticket_id:id,message:text});f.reset();await refreshHistory(id);await loadTickets();status("Your message was sent to Workforce Support.")}catch(error){status(error.message)}finally{b.disabled=false}};
 await refreshHistory(id);
}
async function refreshHistory(id){
 if(selected!==id)return;
 const d=await api("history",{ticket_id:id});if(selected!==id)return;online=d.online;renderPresence();
 const box=$("csMessages");if(!box)return;const atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<140;
 box.innerHTML=d.messages?.length?d.messages.map(m=>'<div class="cs-bubble '+(m.sender_type==="ctpa"?"customer":"workforce")+'"><strong>'+esc(m.sender_type==="ctpa"?"You":"Workforce Support")+'</strong><div>'+esc(m.body)+'</div><small>'+esc(new Date(m.created_at).toLocaleString())+'</small></div>').join(""):'<p class="cs-empty">No messages yet.</p>';
 if(atBottom)box.scrollTop=box.scrollHeight;
}
async function open(value,noticeId=null){
 stop();ctx=value;search="";filter="all";selected=null;const marker=++sequence;shell();status("Loading Support…");
 try{
  await loadTickets();if(marker!==sequence||!ctx.active())return;
  const pending=noticeId||sessionStorage.getItem("workforce_ctpa_notice_reply");
  if(pending)await loadDraftFromNotice(pending);else if(!tickets.length)compose();
  status("");
  poll=setInterval(async()=>{if(document.hidden||marker!==sequence||!ctx.active()){if(marker!==sequence||!ctx.active())stop();return}try{await loadTickets();if(selected)await refreshHistory(selected)}catch(e){status(e.message)}},9000);
 }catch(e){if(marker!==sequence||!ctx.active())return;status(e.message);$("csContent").innerHTML='<section class="cs-empty"><h3>Unable to load Support</h3><p>'+esc(e.message)+'</p><button class="btn secondary" id="csRetry">Try Again</button></section>';$("csRetry").onclick=()=>void open(value,noticeId)}
}
function exportCsv(){const cols=["id","subject","category","priority","status","operating_context","created_at","last_message_at"],data=[cols,...tickets.map(t=>cols.map(k=>t[k]??""))],csv=data.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\r\n");const blob=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));const a=document.createElement("a");a.href=blob;a.download="workforce-support-tickets.csv";a.click();setTimeout(()=>URL.revokeObjectURL(blob),1000)}
window.WorkforceSupportV2=Object.freeze({open,exportCsv,stop});
})();