(()=>{"use strict";
const $=id=>document.getElementById(id),safe=x=>String(x??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\x27/g,"&#39;");
const endpoint="https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-ctpa-private-chat",key="sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC";
let context,threads=[],recipients=[],selected=null,viewer="",search="",channel=null,serial=0,historyRequest=0;
async function api(action,extra={}){
 const token=(await context.supabase.auth.getSession()).data?.session?.access_token;
 if(!token)throw Error("Sign in required");
 const response=await fetch(endpoint,{method:"POST",cache:"no-store",headers:{"Authorization":"Bearer "+token,"apikey":key,"Content-Type":"application/json"},body:JSON.stringify({action,tenant_id:context.tenantId,operating_context:context.context,...extra})});
 const result=await response.json().catch(()=>({}));if(!response.ok||result.error)throw Error(result.error||"Private chat unavailable");return result;
}
function unsubscribe(){if(channel){context?.supabase?.removeChannel(channel);channel=null}}
function status(text){const p=$("ctpaChatStatus");if(p)p.textContent=text}
function shell(){
 $("pageContent").innerHTML='<div class="private-chat"><div class="private-chat-heading"><div><small>WORKFORCE C/TPA · PRIVATE COMMUNICATIONS</small><h2>Messages</h2><p>Chat directly with your associated employers and owner-operators.</p></div><button class="btn primary" id="privateChatNew">New Conversation</button></div><div class="private-chat-privacy" title="Messages are accessible to authorized conversation participants only. Workforce management staff cannot view messages from their management portal."><span class="chat-lock">♢</span><div><strong>Private conversations</strong><p>Only the C/TPA and authorized employer or owner-operator participants can view these chats. Workforce staff do not have a Messages viewing page or access through Workforce Management.</p></div><span class="chat-privacy-tooltip" title="Private between verified account participants; do not include sensitive test results or medical records.">ⓘ</span></div><div class="private-chat-workspace"><aside class="private-chat-inbox"><div class="private-chat-picker"><label for="ctpaChatRecipient">Employer or owner-operator</label><select id="ctpaChatRecipient"><option value="">Loading associated accounts…</option></select><button class="btn primary" type="button" id="ctpaChatStart">Start Chat</button></div><div class="private-chat-search"><input type="search" id="chatSearch" placeholder="Search conversations" aria-label="Search conversations"></div><div id="privateChatThreads" class="private-chat-threads"></div></aside><section class="private-chat-main" id="privateChatMain"><div class="chat-welcome"><strong>Choose a conversation</strong><p>Start a private chat with an employer or owner-operator from your account.</p></div></section></div><p id="ctpaChatStatus" role="status" class="private-chat-status"></p></div>';
 $("privateChatNew").onclick=()=>void compose();
 $("ctpaChatStart").onclick=()=>void startSelected();
 $("chatSearch").oninput=e=>{search=e.target.value;drawThreads()};
}
function drawThreads(){
 const root=$("privateChatThreads");if(!root)return;
 const matches=threads.filter(t=>[t.name,t.subject,t.last_message?.body].join(" ").toLowerCase().includes(search.toLowerCase()));
 root.innerHTML=matches.length?matches.map(t=>'<button class="private-chat-thread '+(selected===t.id?"selected":"")+'" type="button" data-chat-thread="'+safe(t.id)+'"><span class="chat-avatar">'+safe((t.name||"C").slice(0,1).toUpperCase())+'</span><span class="chat-thread-content"><strong>'+safe(t.name)+'</strong><small>'+safe(t.kind==="owner_operators"?"Owner-Operator":"Employer")+' · '+safe(t.context==="dot"?"DOT":"NON-DOT")+'</small><span>'+safe(t.last_message?.body?.slice(0,80)||"No messages yet")+'</span></span></button>').join(""):'<div class="chat-no-threads">No conversations found. Choose New Conversation to begin.</div>';
 root.querySelectorAll("[data-chat-thread]").forEach(b=>b.onclick=()=>void select(b.dataset.chatThread));
}
async function list(){const result=await api("list");threads=result.threads||[];viewer=result.user_id;drawThreads()}
async function select(id){
 selected=id;const tick=++historyRequest;drawThreads();unsubscribe();const t=threads.find(x=>x.id===id);if(!t)return;
 const panel=$("privateChatMain");panel.innerHTML='<div class="chat-room-head"><div><h3>'+safe(t.name)+'</h3><small>'+safe(t.kind==="owner_operators"?"Owner-Operator":"Employer")+' · '+safe(t.context.toUpperCase())+'</small></div><span title="Visible to conversation members only">Private chat</span></div><div class="chat-room-messages" id="chatRoomMessages" role="log" aria-label="Conversation messages"></div><form id="chatSendForm" class="chat-room-compose"><textarea name="message" rows="2" maxlength="4000" placeholder="Write a message…" aria-label="Write a message" required></textarea><button class="btn primary" id="chatSendButton" type="submit">Send</button></form>';
 const form=$("chatSendForm");
 form.onsubmit=async e=>{e.preventDefault();const field=form.elements.message,text=field.value.trim();if(!text)return;const button=$("chatSendButton");button.disabled=true;try{await api("send",{thread_id:id,message:text});field.value="";await messages(id)}catch(e){status(e.message)}finally{button.disabled=false}};
 try{await messages(id);if(tick!==historyRequest)return;await api("read",{thread_id:id}).catch(()=>{});subscribe(id)}
 catch(e){if(tick===historyRequest)status(e.message)}
}
async function messages(id){
 if(selected!==id)return;const result=await api("history",{thread_id:id});if(selected!==id)return;
 const box=$("chatRoomMessages");if(!box)return;const nearBottom=box.scrollHeight-box.scrollTop-box.clientHeight<120;
 box.innerHTML=(result.messages||[]).length?(result.messages||[]).map(m=>'<div class="chat-bubble '+(m.sender_user_id===viewer?"mine":"theirs")+'"><div>'+safe(m.body)+'</div><small>'+safe(new Date(m.created_at).toLocaleString())+'</small></div>').join(""):'<div class="chat-start">This conversation is ready. Send the first message.</div>';
 if(nearBottom)box.scrollTop=box.scrollHeight;
}
function subscribe(id){
 unsubscribe();
 try{
  channel=context.supabase.channel("ctpa-private-"+id).on("postgres_changes",{event:"INSERT",schema:"public",table:"workforce_ctpa_private_messages",filter:"thread_id=eq."+id},()=>{void messages(id);void list()}).subscribe();
 }catch(error){status("Live updates unavailable; reopen the conversation to refresh messages.")}
}
function populateRecipientPicker(){
 const el=$("ctpaChatRecipient");if(!el)return;
 const prior=el.value;
 el.innerHTML='<option value="">Select an employer or owner-operator</option>'+recipients.map(r=>'<option value="'+safe(r.id)+'"'+(!r.ready?' disabled':'')+'>'+safe(r.name)+' — '+safe(r.kind==="owner_operators"?"Owner-Operator":"Employer")+' ('+safe(r.operating_context==="nondot"?"NON-DOT":r.operating_context==="dot"?"DOT":"Shared")+')'+(r.ready?"":" — contact email required")+'</option>').join("");
 if(recipients.some(r=>r.id===prior))el.value=prior;
 el.disabled=false;
 const button=$("ctpaChatStart");if(button)button.disabled=!el.value;
 el.onchange=()=>{button.disabled=!el.value};
}
async function getRecipients(){
 const picker=$("ctpaChatRecipient"),start=$("ctpaChatStart");
 if(picker){picker.disabled=true;picker.innerHTML='<option value="">Loading associated accounts…</option>'}
 if(start)start.disabled=true;
 try{
  const result=await api("recipients");
  recipients=result.recipients||[];
  populateRecipientPicker();
  if(!recipients.length)status("No associated employers or owner-operators found. Add an account in People & Programs to start a chat.");
  return true;
 }catch(e){
  recipients=[];
  if(picker){picker.innerHTML='<option value="">Unable to load associated accounts</option>';picker.disabled=true}
  if(start)start.disabled=true;
  status("Could not load employers and owner-operators: "+e.message);
  return false;
 }
}
async function startSelected(){
 const id=$("ctpaChatRecipient")?.value;if(!id){status("Select an employer or owner-operator to begin.");return}
 const selectedRecipient=recipients.find(r=>r.id===id);if(!selectedRecipient?.ready){status("The selected account needs a contact email.");return}
 const button=$("ctpaChatStart");button.disabled=true;
 try{
  const match=threads.find(t=>t.recipient_record_id===id);
  const result=match?{id:match.id}:await api("start",{recipient_id:id});
  await list();await select(result.id);status("");
 }catch(e){status(e.message)}finally{button.disabled=false}
}
async function compose(){
 try{
  const data=await api("recipients");recipients=data.recipients||[];
  const overlay=document.createElement("div");overlay.className="private-chat-overlay";
  overlay.innerHTML='<div class="private-chat-modal" role="dialog" aria-modal="true"><div class="chat-modal-head"><h3>New Private Conversation</h3><button type="button" id="chatModalClose" aria-label="Close">×</button></div><form id="chatNewForm"><p>Select an associated employer or owner-operator. Their verified portal account will be able to reply.</p><label>Recipient<select name="recipient_id" required><option value="">Choose employer or owner-operator</option>'+recipients.map(r=>'<option value="'+safe(r.id)+'" '+(!r.ready?"disabled":"")+'>'+safe(r.name)+' — '+safe(r.kind==="owner_operators"?"Owner-Operator":"Employer")+' ('+safe(r.operating_context==="nondot"?"NON-DOT":r.operating_context==="dot"?"DOT":"Shared")+')'+(r.ready?"":" (email required)")+'</option>').join("")+'</select></label><label>Subject<input type="text" name="subject" maxlength="140" placeholder="General correspondence"></label><p id="chatNewStatus" role="status"></p><div class="chat-modal-actions"><button type="button" id="chatModalCancel" class="btn secondary">Cancel</button><button type="submit" class="btn primary" id="chatModalStart">Start Conversation</button></div></form></div>';
  const close=()=>overlay.remove();overlay.querySelector("#chatModalClose").onclick=overlay.querySelector("#chatModalCancel").onclick=close;document.body.append(overlay);
  overlay.querySelector("#chatNewForm").onsubmit=async e=>{e.preventDefault();const button=overlay.querySelector("#chatModalStart");button.disabled=true;try{const values=Object.fromEntries(new FormData(e.currentTarget));const result=await api("start",values);close();await list();await select(result.id)}catch(err){overlay.querySelector("#chatNewStatus").textContent=err.message;button.disabled=false}};
  overlay.querySelector("select").focus();
 }catch(e){status(e.message)}
}
async function open(value){
 unsubscribe();context=value;selected=null;search="";
 const tick=++serial;shell();status("Loading private conversations…");
 const results=await Promise.allSettled([list(),getRecipients()]);
 if(tick!==serial||!value.active())return;
 const [conversationResult,recipientResult]=results;
 if(conversationResult.status==="rejected")status("Could not load conversations: "+conversationResult.reason?.message);
 else if(recipientResult.status==="rejected")status("Could not load associated accounts: "+recipientResult.reason?.message);
 else if(recipientResult.value&&recipients.length)status("");
}
window.WorkforcePrivateChat=Object.freeze({open,refresh:()=>list()});
})();