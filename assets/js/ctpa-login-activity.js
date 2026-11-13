/* Workforce C/TPA Login Activity — read-only, tenant-authorized activity events. */
(function(){
"use strict";
const PAGE_SIZE=50;
const root=()=>document.getElementById("pageContent");
const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=s=>s?new Intl.DateTimeFormat(undefined,{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(new Date(s)):"—";
const state={tenantId:null,supabase:null,active:null,search:"",kind:"all",event:"all",days:"30",page:0,rows:[],total:0,request:0};
const isActive=()=>state.active?.()===true;
function eventLabel(row){return row.event_type==="auth.logout"?"Signed out":"Signed in"}
function actorLabel(row){return row.actor_type==="ctpa_staff"?"C/TPA staff":row.actor_type==="customer"?"Employer / owner-operator account":"Account"}
function asCsv(rows){const cols=["occurred_at","actor_name","actor_email","actor_type","event_type","source_portal"];return [cols.join(","),...rows.map(r=>cols.map(k=>'"'+String(r[k]??"").replace(/"/g,'""')+'"').join(","))].join("\r\n")}
function draw(){
 if(!isActive())return;
 const el=root();if(!el)return;
 const total=state.total;
 el.innerHTML='<div class="login-activity">'+
 '<section class="la-heading"><div><span class="la-overline">ACCOUNT & SECURITY</span><h2>Login Activity</h2><p>Review recorded sign-ins and sign-outs for C/TPA staff and linked client accounts. Records cannot be edited or deleted.</p></div><div class="la-count"><strong>'+total.toLocaleString()+'</strong><span>Matching events</span></div></section>'+
 '<section class="la-filters" aria-label="Filter login activity"><label>Search name or email<input id="laSearch" type="search" maxlength="120" placeholder="Search users" value="'+escapeHTML(state.search)+'"></label>'+
 '<label>Account type<select id="laKind"><option value="all">All accounts</option><option value="ctpa_staff">C/TPA staff</option><option value="customer">Employer / owner-operator accounts</option></select></label>'+
 '<label>Activity<select id="laEvent"><option value="all">Sign-ins and sign-outs</option><option value="auth.login">Sign-ins</option><option value="auth.logout">Sign-outs</option></select></label>'+
 '<label>Period<select id="laDays"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="all">All available</option></select></label></section>'+
 '<section class="la-panel"><div class="la-panel-head"><div><h3>Recorded account activity</h3><p>Times are shown in your local time zone. Only confirmed events are listed; a missing sign-out does not mean a user is still online.</p></div></div>'+
 '<div class="la-table-wrap"><table class="la-table"><thead><tr><th>User</th><th>Account type</th><th>Activity</th><th>Date and time</th><th>Source</th></tr></thead><tbody>'+
 (state.rows.length?state.rows.map(r=>'<tr><td><strong>'+escapeHTML(r.actor_name||r.actor_email||"Unknown account")+'</strong><small>'+escapeHTML(r.actor_email||"")+'</small></td><td>'+escapeHTML(actorLabel(r))+'</td><td><span class="la-event '+(r.event_type==="auth.logout"?"out":"in")+'">'+escapeHTML(eventLabel(r))+'</span></td><td>'+escapeHTML(fmt(r.occurred_at))+'</td><td>'+escapeHTML(r.source_portal||"—")+'</td></tr>').join(""):'<tr><td colspan="5" class="la-empty">No recorded activity matches these filters.</td></tr>')+
 '</tbody></table></div><div class="la-footer"><span>Showing '+(total?state.page*PAGE_SIZE+1:0)+'–'+Math.min(total,(state.page+1)*PAGE_SIZE)+' of '+total.toLocaleString()+'</span><div><button type="button" id="laPrev" '+(state.page===0?"disabled":"")+'>Previous</button><button type="button" id="laNext" '+((state.page+1)*PAGE_SIZE>=total?"disabled":"")+'>Next</button></div></div></section>'+
 '<p class="la-footnote">Security activity is displayed only for the authorized C/TPA organization. Employer and owner-operator accounts are grouped when the source does not specify their individual relationship.</p></div>';
 [["laKind",state.kind],["laEvent",state.event],["laDays",state.days]].forEach(([id,v])=>{el.querySelector("#"+id).value=v});
 el.querySelector("#laSearch").addEventListener("change",e=>{state.search=e.target.value.trim();state.page=0;void load()});
 for(const [id,key] of [["laKind","kind"],["laEvent","event"],["laDays","days"]])el.querySelector("#"+id).addEventListener("change",e=>{state[key]=e.target.value;state.page=0;void load()});
 el.querySelector("#laPrev").addEventListener("click",()=>{if(state.page>0){state.page--;void load()}});
 el.querySelector("#laNext").addEventListener("click",()=>{if((state.page+1)*PAGE_SIZE<state.total){state.page++;void load()}});
}
function query(){
 let q=state.supabase.from("ctpa_activity_events").select("id,actor_name,actor_email,actor_type,event_type,occurred_at,source_portal",{count:"exact"})
 .eq("tenant_id",state.tenantId).in("event_type",["auth.login","auth.logout"]);
 if(state.kind!=="all")q=q.eq("actor_type",state.kind);
 if(state.event!=="all")q=q.eq("event_type",state.event);
 if(state.days!=="all")q=q.gte("occurred_at",new Date(Date.now()-Number(state.days)*86400000).toISOString());
 if(state.search){const s=state.search.replace(/[,().%*_\\]/g,"").trim();if(s)q=q.or("actor_name.ilike.%"+s+"%,actor_email.ilike.%"+s+"%")}
 return q.order("occurred_at",{ascending:false}).range(state.page*PAGE_SIZE,(state.page+1)*PAGE_SIZE-1)
}
async function load(){
 const rid=++state.request;
 if(!isActive())return;
 if(root())root().innerHTML='<div class="la-loading" role="status">Loading authorized login activity…</div>';
 try{
  const {data,error,count}=await query();
  if(error)throw error;
  if(rid!==state.request||!isActive())return;
  state.rows=data||[];state.total=count||0;draw();
 }catch(e){
  if(rid!==state.request||!isActive())return;
  root().innerHTML='<section class="la-error"><h2>Login activity unavailable</h2><p>'+escapeHTML(e.message||"Unable to retrieve account activity")+'</p><button type="button" id="laRetry">Try again</button></section>';
  root().querySelector("#laRetry").onclick=()=>void load();
 }
}
function open(options){
 state.request++;state.tenantId=options.tenantId;state.supabase=options.supabase;state.active=options.active;
 state.page=0;state.rows=[];state.search="";state.kind="all";state.event="all";state.days="30";void load()
}
function exportCsv(){
 if(!isActive())return;
 const blob=new Blob([asCsv(state.rows)],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="workforce-login-activity-page-"+(state.page+1)+".csv";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)
}
window.WorkforceLoginActivity={open,refresh:load,exportCsv};
})();
