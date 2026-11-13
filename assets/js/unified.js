(()=>{
"use strict";
const BASE="https://elpbnytpciqnbexiaebp.supabase.co";
const KEY="sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC";
const ENDPOINT=BASE+"/functions/v1/workforce-unified-portal";
const SELECTOR_URL="https://workforceapps.screenings4u.com/selector.html";
const redirectToSelector=()=>location.replace(SELECTOR_URL);
const GROUPS=[
 ["People & Programs",["employers","owner_operators","people","programs","pools","selections"]],
 ["Testing & Compliance",["testing_orders","testing_documents","results","occupational_health","compliance","audits","clearinghouse","return_to_duty","policies","enrollments","documents","reports"]],
 ["Lab Account",["lab_accounts","lab_clients","lab_orders","lab_tracking","lab_results","lab_documents","lab_supplies","lab_delivery","lab_alerts","lab_analytics","lab_consortiums","lab_benefits","lab_billing"]],
 ["Services & Billing",["orders","price_list","services","billing","invoices","subscriptions"]],
 ["Account & Support",["locations","messages","notifications","support","demo_sessions","staff","integrations","audit_history"]]
];
const SIDEBAR_TOP=[
 ["dashboard","Dashboard","⌂"]
];
const NAV_STORAGE_KEY="workforce_ctpa_sidebar_open_groups";
const openNavGroups=new Set((()=>{
 try{const saved=JSON.parse(sessionStorage.getItem(NAV_STORAGE_KEY)||"[]");return Array.isArray(saved)?saved.filter(x=>GROUPS.some(group=>group[0]===x)):[]}
 catch{return []}
})());
function saveNavGroups(){try{sessionStorage.setItem(NAV_STORAGE_KEY,JSON.stringify([...openNavGroups]))}catch{}}
const navGroupForPage=id=>GROUPS.find(group=>group[1].includes(id))?.[0]||null;
const CONFIG={
 account:["Account","Your Workforce C/TPA company and signed-in account."],
 dashboard:["Dashboard","Single C/TPA operations dashboard across the selected records."],
 employers:["Employers","Manage employer organizations, contacts and identifiers.","legal_name|Legal name|text|required;dot_number|USDOT number|text;contact_name|Primary contact|text;contact_email|Contact email|email;phone|Phone|tel;status|Status|select:active,inactive"],
 owner_operators:["Owner-Operators","Manage owner-operator accounts and operating contacts.","legal_name|Legal name|text|required;dot_number|USDOT number|text;contact_name|Contact name|text;email|Email|email;phone|Phone|tel;status|Status|select:active,inactive"],
 people:["People","Maintain worker and employee records.","first_name|First name|text|required;last_name|Last name|text|required;employee_number|Employee number|text;employer|Employer|text;email|Email|email;status|Status|select:active,inactive"],
 programs:["Programs","Set up testing and compliance programs.","name|Program name|text|required;employer|Employer|text;program_type|Program type|text;effective_date|Effective date|date;status|Status|select:active,draft,inactive"],
 pools:["Pools","Manage consortium and employer selection pools.","name|Pool name|text|required;employer|Employer|text;program|Program|text;frequency|Selection frequency|select:monthly,quarterly,annual;status|Status|select:active,inactive"],
 selections:["Selections","Review and record randomized selection activity.","name|Selection reference|text|required;pool|Pool|text;selection_date|Selection date|date;status|Status|select:scheduled,selected,completed;notes|Notes|textarea"],
 testing_orders:["Testing Orders","Create and manage testing requests.","name|Order reference|text|required;employee_name|Employee / donor|text;employer|Employer|text;test_type|Test type|text;reason|Testing reason|text;status|Status|select:draft,ordered,scheduled,completed,cancelled"],
 testing_documents:["Testing Documents","Manage testing-related document records.","title|Document title|text|required;order_reference|Order reference|text;document_type|Document type|text;file_url|File URL|url;status|Status|select:pending,complete"],
 results:["Results","Track confidential test result metadata.","name|Result reference|text|required;order_reference|Order reference|text;status|Status|select:pending,received,reviewed;reported_at|Date reported|date;notes|Notes|textarea"],
 occupational_health:["Occupational Health","Manage occupational health service requests.","name|Service reference|text|required;employee_name|Employee name|text;service|Service|text;appointment_date|Appointment date|date;status|Status|select:requested,scheduled,completed"],
 compliance:["Compliance","Manage compliance cases and required actions.","name|Case title|text|required;employer|Employer|text;due_date|Due date|date;priority|Priority|select:low,normal,high;status|Status|select:open,in_progress,complete"],
 audits:["New Entrant Audits","Manage audit preparation and document milestones.","name|Audit title|text|required;carrier|Carrier|text;dot_number|USDOT number|text;due_date|Due date|date;status|Status|select:draft,in_progress,submitted,complete"],
 clearinghouse:["Clearinghouse","Track Clearinghouse-related workflow tasks.","name|Task title|text|required;employer|Employer|text;reference|Reference|text;due_date|Due date|date;status|Status|select:open,in_progress,complete"],
 return_to_duty:["Return to Duty","Manage Return-to-Duty and follow-up tracking.","name|Case reference|text|required;agency|DOT agency|text;employee|Employee|text;status|Status|select:opened,in_progress,follow_up,complete;notes|Notes|textarea"],
 policies:["Policies","Manage compliance policy records.","name|Policy name|text|required;version|Version|text;effective_date|Effective date|date;status|Status|select:draft,active,archived"],
 enrollments:["Enrollments","Manage enrollment record status.","name|Enrollment name|text|required;participant|Participant|text;program|Program|text;status|Status|select:pending,active,complete"],
 documents:["Documents","Manage account and compliance document records.","title|Document title|text|required;document_type|Document type|text;file_url|Document URL|url;status|Status|select:requested,received,approved"],
 reports:["Reports","Maintain generated reporting records.","name|Report name|text|required;report_type|Report type|text;period|Reporting period|text;status|Status|select:draft,ready,archived"],
 lab_accounts:["Lab Accounts","Manage connected laboratory account records.","name|Account name|text|required;account_number|Account number|text;provider|Provider|text;status|Status|select:active,inactive"],
 lab_clients:["Laboratory Clients","Manage laboratory client accounts.","name|Client name|text|required;contact|Contact|text;email|Email|email;status|Status|select:active,inactive"],
 lab_orders:["Laboratory Orders","Manage laboratory order records.","name|Order reference|text|required;account|Lab account|text;donor|Donor|text;collection_date|Collection date|date;status|Status|select:requested,scheduled,collected,complete"],
 lab_tracking:["Laboratory Tracking","Track specimen and order movement.","name|Tracking reference|text|required;order_reference|Order reference|text;carrier|Carrier|text;tracking_number|Tracking number|text;status|Status|select:pending,in_transit,delivered"],
 lab_results:["Laboratory Results","Manage laboratory result records.","name|Lab result reference|text|required;order_reference|Order reference|text;status|Status|select:pending,reported,reviewed;reported_at|Reported at|date"],
 lab_documents:["Laboratory Documents","Manage laboratory document records.","title|Document title|text|required;account|Account|text;file_url|Document URL|url;status|Status|select:pending,received,complete"],
 lab_billing:["Laboratory Billing","Manage laboratory billing records.","name|Billing reference|text|required;account|Lab account|text;amount|Amount|number;due_date|Due date|date;status|Status|select:open,paid,void"],
 lab_supplies:["Laboratory Supplies","Manage laboratory supply requests.","name|Supply item|text|required;quantity|Quantity|number;account|Account|text;status|Status|select:requested,shipped,received"],
 lab_analytics:["Laboratory Analytics","Manage laboratory analytics reports.","name|Analysis name|text|required;period|Period|text;metric|Metric|text;value|Value|number"],
 lab_delivery:["Laboratory Delivery","Manage document and supply delivery records.","name|Delivery reference|text|required;recipient|Recipient|text;tracking_number|Tracking number|text;status|Status|select:pending,shipped,delivered"],
 lab_alerts:["Laboratory Alerts","Manage laboratory notifications and alerts.","name|Alert title|text|required;severity|Severity|select:info,warning,urgent;message|Message|textarea;status|Status|select:open,resolved"],
 lab_benefits:["Laboratory Benefits","Manage laboratory service benefit records.","name|Benefit name|text|required;description|Description|textarea;status|Status|select:active,inactive"],
 lab_consortiums:["Laboratory Consortiums","Manage consortium laboratory relationships.","name|Consortium name|text|required;account|Lab account|text;contact|Contact|text;status|Status|select:active,inactive"],
 locations:["Locations","Maintain collection and employer location records.","name|Location name|text|required;address|Street address|text;city|City|text;state|State|text;zip|Postal code|text"],
 messages:["Messages","Manage organizational message records.","title|Subject|text|required;recipient|Recipient|text;message|Message|textarea;status|Status|select:draft,sent,read"],
 notifications:["Notifications","Manage account notification records.","title|Notification title|text|required;message|Message|textarea;status|Status|select:unread,read"],
 support:["Support","Manage support case records.","name|Ticket subject|text|required;priority|Priority|select:normal,high,urgent;description|Description|textarea;status|Status|select:open,pending,closed"],
 demo_sessions:["Demo Sessions","Manage demonstration session records.","name|Demo name|text|required;scheduled_at|Session date|date;attendee|Attendee|text;status|Status|select:scheduled,completed,cancelled"],
 orders:["Order History","Manage purchase and service order records.","name|Order reference|text|required;service|Service|text;amount|Amount|number;status|Status|select:pending,paid,cancelled"],
 price_list:["Price List","Manage price list entries.","name|Service name|text|required;sku|Service code|text;price|Price|number;status|Status|select:active,inactive"],
 services:["Services","Manage enabled service records.","name|Service name|text|required;description|Description|textarea;status|Status|select:active,inactive"],
 billing:["Billing","Manage organization billing records.","name|Billing reference|text|required;amount|Amount|number;due_date|Due date|date;status|Status|select:open,paid,void"],
 invoices:["Invoices","Manage employer invoice records.","name|Invoice number|text|required;client|Client|text;amount|Amount|number;due_date|Due date|date;status|Status|select:draft,sent,paid,void"],
 subscriptions:["Subscriptions","View and manage subscription records.","name|Subscription name|text|required;plan|Plan|text;renewal_date|Renewal date|date;status|Status|select:active,cancelled"],
 staff:["Staff Directory","Maintain staff directory records. Account invitations are separate from this directory.","name|Name|text|required;position|Position|text;email|Email|email;status|Status|select:active,inactive"],
 integrations:["Integrations","Maintain connection and integration records.","name|Integration name|text|required;provider|Provider|text;status|Status|select:inactive,active"],
 audit_history:["Audit History","Maintain operational audit entries.","name|Event title|text|required;resource|Resource|text;description|Description|textarea"],
};
const state={supabase:null,workspaces:[],tenantId:null,context:"dot",page:"dashboard",cache:new Map(),sequence:0,editing:null,search:"",font:16,loading:false};
const $=id=>document.getElementById(id);
const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const label=id=>CONFIG[id]?.[0]||id.replaceAll("_"," ").replace(/\b\w/g,x=>x.toUpperCase());
const fields=id=>(CONFIG[id]?.[2]||"name|Name|text|required").split(";").map(x=>{const a=x.split("|");return {name:a[0],label:a[1]||a[0],type:a[2]||"text",required:a[3]==="required"}});
const recordTitle=r=>{
 const d=r?.data||{};
 return d.name||d.title||d.legal_name||[d.first_name,d.last_name].filter(Boolean).join(" ")||d.account_number||r?.id||"Record";
};
const cacheKey=(p=state.page)=>state.tenantId+"|"+state.context+"|"+p;
function message(text,isError=false){
 const n=$("notice");if(!text){n.hidden=true;return}
 n.hidden=false;n.style.background=isError?"#fff0ed":"#fff9e6";
 n.style.borderColor=isError?"#edc4bf":"#e1d094";n.textContent=text;
}
async function api(action,body={}){
 const {data:{session},error}=await state.supabase.auth.getSession();
 if(error||!session?.access_token)throw Error("Please sign in.");
 const response=await fetch(ENDPOINT,{method:"POST",cache:"no-store",
  headers:{"Content-Type":"application/json","apikey":KEY,"Authorization":"Bearer "+session.access_token},
  body:JSON.stringify({action,...body})});
 const result=await response.json().catch(()=>({}));
 if(!response.ok||result.error)throw Error(result.error||"Request failed");
 return result;
}
function showView(id){for(const name of ["workspaceSetup","application"])$(name).hidden=name!==id;}
function activeWorkspace(){return state.workspaces.find(w=>w.tenant_id===state.tenantId)}
function renderNav(){
 const nav=$("sidebarNavigation");
 const top=SIDEBAR_TOP.map(([id,name,icon])=>'<button type="button" class="nav-item nav-top-link'+
 (state.page===id?" active":"")+'" data-page="'+id+'" '+(state.page===id?'aria-current="page"':"")+
 '><span class="symbol" aria-hidden="true">'+icon+'</span><span>'+esc(name)+'</span></button>').join("");
 const activeGroup=navGroupForPage(state.page);
 if(activeGroup)openNavGroups.add(activeGroup);
 const groups=GROUPS.map(([title,modules],index)=>{
  const expanded=openNavGroups.has(title);
  const hasActive=modules.includes(state.page);
  return '<section class="nav-group'+(expanded?" expanded":"")+'" data-group="'+esc(title)+'">'+
   '<button type="button" class="nav-group-toggle" data-nav-group="'+esc(title)+'" aria-controls="nav-group-'+index+
   '" aria-expanded="'+String(expanded)+'"><span>'+esc(title)+'</span><span class="group-indicator" aria-hidden="true">'+(expanded?"−":"+")+'</span></button>'+
   '<div class="nav-group-links" id="nav-group-'+index+'"'+(expanded?"":' hidden')+'>'+
   modules.map(id=>'<button type="button" class="nav-item nav-child'+(state.page===id?" active":"")+
    '" data-page="'+esc(id)+'"'+(state.page===id?' aria-current="page"':"")+
    '><span>'+esc(label(id))+'</span></button>').join("")+'</div></section>';
 }).join("");
 nav.innerHTML='<div class="nav-top-links">'+top+'</div>'+groups;
 document.querySelectorAll("[data-context]").forEach(btn=>{
  const active=btn.dataset.context===state.context;
  btn.classList.toggle("selected",active);
  btn.setAttribute("aria-pressed",String(active));
 });
 $("contextPill").textContent=state.context==="dot"?"DOT":"NON-DOT";
 $("contextEyebrow").textContent=state.context==="dot"?"DOT OPERATIONS":"NON-DOT OPERATIONS";
}
function updateHeading(){
 const title=label(state.page);
 $("topTitle").textContent=title;$("pageTitle").textContent=title;
 $("pageSummary").textContent=CONFIG[state.page]?.[1]||"Manage records in the unified system.";
 $("pageActions").innerHTML=state.page==="account"?"":state.page==="dashboard"
  ?'<button class="btn secondary" type="button" id="refreshPage">Refresh overview</button>'
  :'<button class="btn secondary" type="button" id="refreshPage">Refresh</button><button class="btn secondary" type="button" id="exportPage">Export CSV</button><button class="btn primary" type="button" id="newRecord">Add '+esc(title)+'</button>';
}
function switchPage(page,push=true){
 if(!CONFIG[page])page="dashboard";
 state.page=page;state.search="";state.management=null;state.pendingManagement=null;const seq=++state.sequence;
 if(push)history.pushState(null,"","/unified.html?page="+encodeURIComponent(page));
 $("sidebar").classList.remove("open");renderNav();updateHeading();message("");
 if(page==="account"){void renderAccount();return}
 const stored=state.cache.get(cacheKey());
 if(stored){showRecords(stored.records);if(Date.now()-stored.time>30000)void loadRecords(seq,true)}
 else {$("pageContent").innerHTML='<section class="panel"><div class="loading-line"><span class="spinner"></span>Loading authorized records…</div></section>';void loadRecords(seq,false)}
 $("main").scrollTo({top:0,behavior:"instant"});
}
function changeContext(next){
 if(!["dot","nondot"].includes(next)||next===state.context)return;
 state.context=next;sessionStorage.setItem("workforce_unified_context",next);
 switchPage(state.page,false);
}
async function loadRecords(sequence=state.sequence,refresh=false){
 const kind=state.page==="dashboard"?"all":state.page,key=cacheKey(),tenant=state.tenantId,context=state.context;
 try{
  const result=await api("list",{tenant_id:tenant,operating_context:context,kind});
  state.cache.set(key,{records:result.records||[],time:Date.now()});
  if(sequence===state.sequence&&key===cacheKey()){
   if(state.pendingManagement?.section===state.page){
    const pending=state.pendingManagement;state.pendingManagement=null;
    openManagement(pending.action,pending.id,false);
   }else if(state.management)renderManagementPage();else showRecords(result.records||[]);
   if(refresh&&!state.management)message("Records are up to date.");
  }
 }catch(error){if(sequence===state.sequence&&key===cacheKey()){
  const old=state.cache.get(key);
  if(!old)$("pageContent").innerHTML='<section class="panel"><h2>Unable to load records</h2><p>'+esc(error.message)+'</p><button class="btn secondary" type="button" id="retryLoad">Retry</button></section>';
  message(error.message,true);
 }}
}
async function renderAccount(){
 const {data:{user}}=await state.supabase.auth.getUser();
 if(state.page!=="account")return;
 const w=activeWorkspace();
 const email=user?.email||"";
 const person=[user?.user_metadata?.first_name,user?.user_metadata?.last_name].filter(Boolean).join(" ")||email;
 $("pageContent").innerHTML='<section class="panel"><h2>Account Information</h2>'+
  '<p>This is your authenticated Workforce account. Your C/TPA operates as one company; employer clients are managed under Employers.</p>'+
  '<div class="account-details"><div><small>Account</small><strong>'+esc(person)+'</strong></div>'+
  '<div><small>Email</small><strong>'+esc(email)+'</strong></div>'+
  '<div><small>C/TPA Company</small><strong>'+esc(w?.name||"Workforce C/TPA")+'</strong></div>'+
  '<div><small>Role</small><strong>'+esc(w?.role||"Member")+'</strong></div></div>'+
 '<div class="management-account-actions"><button type="button" class="btn primary" id="editProfile">Edit Profile</button>'+
 '<button type="button" class="btn secondary" data-goto="staff">Manage Staff</button>'+
 '<button type="button" class="btn secondary" data-goto="employers">Manage Employers</button></div></section>';
}
function renderDashboard(records){
 const byType=new Map();for(const r of records)byType.set(r.kind,(byType.get(r.kind)||0)+1);
 const metrics=[["employers","Employers"],["people","People"],["programs","Programs"],["testing_orders","Testing Orders"]];
 $("pageContent").innerHTML='<div class="metric-grid">'+metrics.map(([kind,txt])=>
  '<div class="metric"><small>'+txt+'</small><strong>'+String(byType.get(kind)||0)+'</strong><span>'+esc(state.context==="dot"?"DOT":"NON-DOT")+' records</span></div>').join("")+
  '</div><section class="panel"><div class="section-heading"><h2>Current organization activity</h2><span class="pill">'+esc(activeWorkspace()?.name||"Organization")+'</span></div>'+
  (records.length?'<p>'+records.length+' active records across '+byType.size+' modules in this operating context.</p>'+
  '<div class="table-scroll"><table class="data-table"><thead><tr><th>Module</th><th>Records</th><th></th></tr></thead><tbody>'+
  [...byType].sort((a,b)=>b[1]-a[1]).map(([kind,total])=>'<tr><td class="record-name">'+esc(label(kind))+'</td><td>'+total+'</td><td><button class="btn secondary" type="button" data-goto="'+esc(kind)+'">View</button></td></tr>').join("")+'</tbody></table></div>'
  :'<div class="empty"><h2>No records in this operating context</h2><p>This new system starts empty. Existing portal data has not been migrated.</p><button type="button" class="btn primary" data-goto="employers">Manage Employers</button></div>')+'</section>'+
 '<section class="panel"><h2>Management workspaces</h2><div class="management-shortcuts">'+
 [["employers","Employers"],["people","People"],["programs","Programs"],["testing_orders","Testing Orders"],["documents","Documents"],["invoices","Invoices"],["support","Support"]].map(([key,name])=>
 '<button type="button" class="management-shortcut" data-goto="'+key+'"><strong>'+name+'</strong><span>Open management page</span></button>').join("")+'</div></section>';
}

const MANAGEMENT_ACTIONS=new Set(["new","view","edit"]);
function managementUrl(action,id=null,section=state.page){
 const u=new URL("/unified.html",location.origin);
 u.searchParams.set("page",section);u.searchParams.set("manage",action);
 if(id)u.searchParams.set("record",id);
 return u.pathname+u.search;
}
function openManagement(action,id=null,push=true){
 if(!MANAGEMENT_ACTIONS.has(action)||!CONFIG[state.page]||["dashboard","account"].includes(state.page))return;
 const records=state.cache.get(cacheKey())?.records||[];
 const record=id?records.find(r=>r.id===id):null;
 if(action!=="new"&&!record){message("Record not available. Refresh the management page.",true);return}
 if(action==="new"&&!["owner","admin","editor"].includes(activeWorkspace()?.role||"")){message("Your account is read-only.",true);return}
 if(action==="edit"&&!["owner","admin","editor"].includes(activeWorkspace()?.role||"")){message("You cannot edit this record.",true);return}
 state.editing=record||null;
 state.management={action,id,section:state.page,context:state.context};
 if(push)history.pushState({management:true},"",managementUrl(action,id));
 renderManagementPage();
}
function managementField(f,value=""){
 const required=f.required?" required":"";
 let control="";
 const name=esc(f.name),v=esc(value);
 if(f.type==="textarea")control='<textarea id="manage-'+name+'" name="'+name+'" rows="4"'+required+'>'+v+'</textarea>';
 else if(f.type.startsWith("select:")){
  const values=f.type.slice(7).split(",");
  control='<select id="manage-'+name+'" name="'+name+'"'+required+'>'+
  '<option value="">Choose an option</option>'+values.map(item=>'<option value="'+esc(item)+'"'+(String(value)===item?' selected':'')+'>'+esc(item.replaceAll("_"," "))+'</option>').join("")+'</select>';
 }else control='<input id="manage-'+name+'" name="'+name+'" type="'+esc(f.type)+'" value="'+v+'"'+required+(f.type==="number"?' step="any"':"")+' maxlength="4000">';
 return '<label class="manage-field" for="manage-'+name+'"><span>'+esc(f.label)+(f.required?' <span class="required-mark">*</span>':'')+'</span>'+control+'</label>';
}
function renderManagementPage(){
 const m=state.management;
 if(!m||m.section!==state.page)return;
 const record=m.id?(state.cache.get(cacheKey())?.records||[]).find(r=>r.id===m.id):null;
 if(m.action!=="new"&&!record){
  $("pageContent").innerHTML='<section class="panel"><h2>Record unavailable</h2><p>Reload the management list to review this record.</p><button class="btn secondary" data-back-list type="button">Back to '+esc(label(state.page))+'</button></section>';
  return;
 }
 const title=m.action==="new"?"Add "+label(state.page):m.action==="edit"?"Edit "+label(state.page):"View "+label(state.page);
 $("pageTitle").textContent=title;$("topTitle").textContent=title;
 $("pageSummary").textContent=m.action==="view"?"Review the full record and its account information.":"Complete and manage the record for your C/TPA company.";
 $("pageActions").innerHTML='<button class="btn secondary" type="button" data-back-list>Back to '+esc(label(state.page))+'</button>';
 const overview='<div class="manage-breadcrumb"><button type="button" data-back-list>'+esc(label(state.page))+'</button><span>/</span><strong>'+esc(title)+'</strong></div>';
 const detail=record?'<div class="record-management-meta"><span>Record ID: '+esc(record.id)+'</span><span>Context: '+esc(record.operating_context.toUpperCase())+'</span><span>Updated: '+esc(new Date(record.updated_at).toLocaleString())+'</span></div>':'';
 if(m.action==="view"){
  const rows=Object.entries(record?.data||{});
  $("pageContent").innerHTML=overview+'<section class="panel manage-panel"><div class="manage-section-head"><h2>'+esc(recordTitle(record))+'</h2><span class="pill">'+esc(record.operating_context.toUpperCase())+'</span></div>'+
   '<dl class="manage-details">'+rows.map(([key,value])=>'<div><dt>'+esc(fields(state.page).find(f=>f.name===key)?.label||key.replaceAll("_"," "))+'</dt><dd>'+esc(value??"—")+'</dd></div>').join("")+'</dl>'+detail+
   '<div class="manage-actions"><button type="button" class="btn secondary" data-back-list>Back to List</button>'+
   (["owner","admin","editor"].includes(activeWorkspace()?.role||"")?'<button type="button" class="btn primary" data-manage-edit="'+esc(record.id)+'">Edit Record</button>':'')+'</div></section>';
  return;
 }
 const inputs=fields(state.page).map(f=>managementField(f,record?.data?.[f.name]??"")).join("");
 const shared=!record&&["owner","admin"].includes(activeWorkspace()?.role||"");
 const context=record?.operating_context||state.context;
 $("pageContent").innerHTML=overview+'<section class="panel manage-panel"><div class="manage-section-head"><div><h2>'+esc(title)+'</h2><p>Manage company records in one portal.</p></div><span class="pill">'+esc(state.context.toUpperCase())+'</span></div>'+
  '<form id="managementForm"><div class="manage-form-grid">'+inputs+'<label class="manage-field manage-context"><span>Record context</span><select name="record_context"'+(record?' disabled':'')+'>'+
  '<option value="'+esc(context)+'">'+esc(context.toUpperCase())+'</option>'+(shared?'<option value="shared">Shared: DOT and NON-DOT</option>':'')+'</select></label></div>'+
  detail+'<p class="manage-form-error" id="managementError" role="alert"></p><div class="manage-actions">'+
  '<button type="button" class="btn secondary" data-back-list>Cancel</button><button type="submit" class="btn primary" id="managementSave">'+
  (record?"Save Changes":"Create Record")+'</button></div></form></section>';
 $("managementForm").querySelector("input,select,textarea")?.focus({preventScroll:true});
}
function leaveManagement(push=true){
 state.management=null;state.editing=null;
 if(push)history.pushState({},"","/unified.html?page="+encodeURIComponent(state.page));
 updateHeading();const stored=state.cache.get(cacheKey());
 if(stored)showRecords(stored.records);else void loadRecords();
}
async function submitManagement(form){
 const m=state.management;
 if(!m||!form.reportValidity())return;
 const button=$("managementSave");button.disabled=true;
 const data=Object.fromEntries(new FormData(form).entries()),recordContext=data.record_context||state.context;
 delete data.record_context;
 for(const f of fields(state.page))if(f.type==="number"&&data[f.name]!=="")data[f.name]=Number(data[f.name]);
 $("managementError").textContent="";
 try{
  await api("save",{tenant_id:state.tenantId,operating_context:state.context,
   kind:state.page,record_context:recordContext,id:m.id||null,data});
  state.cache.delete(cacheKey());leaveManagement();
  message(m.action==="new"?"Record created successfully.":"Record updated successfully.");
  void loadRecords();
 }catch(error){$("managementError").textContent=error.message;button.disabled=false}
}
function showRecords(records){
 if(state.page==="dashboard"){renderDashboard(records);return}
 const count=records.length,query=state.search.trim().toLowerCase();
 const visible=query?records.filter(r=>Object.values(r.data||{}).some(v=>String(v??"").toLowerCase().includes(query))):records;
 const canWrite=["owner","admin","editor"].includes(activeWorkspace()?.role||"");
 $("newRecord")?.toggleAttribute("disabled",!canWrite);
 const columns=fields(state.page).slice(0,3);
 $("pageContent").innerHTML='<section class="panel"><div class="context-note">Operating context: <strong>'+
  esc(state.context==="dot"?"DOT":"NON-DOT")+'</strong>. Shared records appear in both views. All changes are stored within this organization only.</div>'+
  '<div class="toolbar"><input id="recordSearch" type="search" aria-label="Search records" placeholder="Search records" value="'+esc(state.search)+'"><span class="search-meta">'+count+' records</span></div>'+
  (visible.length?'<div class="table-scroll"><table class="data-table"><thead><tr><th>Record</th>'+
   columns.map(c=>'<th>'+esc(c.label)+'</th>').join("")+'<th>Updated</th><th>Actions</th></tr></thead><tbody>'+
   visible.map(r=>'<tr><td class="record-name">'+esc(recordTitle(r))+'<br><small>'+esc(r.operating_context==="shared"?"Shared":r.operating_context==="dot"?"DOT":"NON-DOT")+'</small></td>'+
    columns.map(c=>'<td>'+esc(r.data?.[c.name]??"—")+'</td>').join("")+
    '<td>'+esc(new Date(r.updated_at).toLocaleDateString())+'</td><td><div class="row-actions">'+
    '<button type="button" data-view="'+esc(r.id)+'">View</button>'+(canWrite?'<button type="button" data-edit="'+esc(r.id)+'">Edit</button><button type="button" data-archive="'+esc(r.id)+'">Archive</button>':"")+
    '</div></td></tr>').join("")+'</tbody></table></div>'
  :'<div class="empty"><h2>'+esc(query?"No matching records":"No "+label(state.page).toLowerCase()+" records")+'</h2><p>'+
    (query?"Try a different search.":"There are no records in this module for the selected operating context.")+
    '</p>'+(canWrite&&!query?'<button class="btn primary" type="button" data-create="1">Add record</button>':"")+'</div>')+'</section>';
}
function closeModal(){$("modal").hidden=true;document.body.classList.remove("modal-open");state.editing=null;$("recordForm").dataset.mode=""}
async function saveRecord(event){
 event.preventDefault();
 const mode=$("recordForm").dataset.mode;
 if(mode==="archive"){await performArchive();return}
 if(mode==="profile"){await saveProfile();return}
 if(mode==="view"){closeModal();return}
}
function archiveRecord(id){
 const record=state.cache.get(cacheKey())?.records.find(x=>x.id===id);
 if(!record){message("Record not found. Refresh the page.",true);return}
 state.editing=record;
 $("modalTitle").textContent="Archive "+label(state.page);
 $("modalDescription").textContent="Confirm this account management change.";
 $("recordFields").innerHTML='<div class="archive-summary"><strong>'+esc(recordTitle(record))+
 '</strong><p>Archiving removes this record from active management lists without affecting other records.</p></div>';
 $("recordForm").dataset.mode="archive";$("saveRecord").hidden=false;
 $("saveRecord").textContent="Archive Record";$("saveRecord").className="btn danger";
 $("cancelModal").textContent="Cancel";$("formMessage").textContent="";
 $("modal").hidden=false;document.body.classList.add("modal-open");
 $("modalClose").focus();
}
async function performArchive(){
 const button=$("saveRecord"),id=state.editing?.id;
 if(!id)return;button.disabled=true;
 try{
  await api("archive",{tenant_id:state.tenantId,operating_context:state.context,kind:state.page,id});
  closeModal();state.cache.delete(cacheKey());message("Record archived successfully.");void loadRecords();
 }catch(error){$("formMessage").textContent=error.message}
 finally{button.disabled=false}
}
async function editProfile(){
 const {data:{user},error}=await state.supabase.auth.getUser();
 if(error||!user){message("Unable to load your profile.",true);return}
 $("modalTitle").textContent="Manage Account";
 $("modalDescription").textContent="Update the name shown on your Workforce C/TPA account.";
 $("recordFields").innerHTML='<label>First name<input name="first_name" required maxlength="100" value="'+esc(user.user_metadata?.first_name||"")+'"></label>'+
  '<label>Last name<input name="last_name" required maxlength="100" value="'+esc(user.user_metadata?.last_name||"")+'"></label>'+
  '<label>Email<input type="email" disabled value="'+esc(user.email||"")+'"></label>';
 $("recordForm").dataset.mode="profile";
 $("saveRecord").className="btn primary";$("saveRecord").hidden=false;$("saveRecord").textContent="Save Profile";
 $("cancelModal").textContent="Cancel";$("formMessage").textContent="";
 $("modal").hidden=false;document.body.classList.add("modal-open");
 $("recordFields").querySelector("input")?.focus();
}
async function saveProfile(){
 const button=$("saveRecord");
 if(!$("recordForm").reportValidity())return;
 const form=new FormData($("recordForm"));
 button.disabled=true;$("formMessage").textContent="";
 try{
  const {error}=await state.supabase.auth.updateUser({data:{first_name:String(form.get("first_name")||"").trim(),last_name:String(form.get("last_name")||"").trim()}});
  if(error)throw error;
  closeModal();void renderAccount();void updateAccountMenu();message("Account profile saved.");
 }catch(error){$("formMessage").textContent=error.message}
 finally{button.disabled=false}
}
function exportRecords(){
 const rows=state.cache.get(cacheKey())?.records||[];
 if(!rows.length){message("There are no records to export.",true);return}
 const cols=["id","operating_context",...new Set(rows.flatMap(r=>Object.keys(r.data||{}))),"updated_at"];
 const csv=[cols,...rows.map(r=>cols.map(k=>k==="id"?r.id:k==="operating_context"?r.operating_context:k==="updated_at"?r.updated_at:r.data?.[k]??""))]
  .map(line=>line.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\r\n");
 const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob),link=document.createElement("a");
 link.href=url;link.download="workforce-"+state.page+"-"+state.context+".csv";
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function updateAccountMenu(){
 try{
  const {data:{user}}=await state.supabase.auth.getUser();
  if(!user)return;
  const name=[user.user_metadata?.first_name,user.user_metadata?.last_name].filter(Boolean).join(" ");
  $("accountDisplayName").textContent=name||"Workforce C/TPA";
  $("accountEmail").textContent=user.email||"";
 }catch(error){console.warn("Unable to display account profile",error)}
}
function startApp(){
 showView("application");
 void updateAccountMenu();
 const search=new URLSearchParams(location.search);
 const desired=search.get("page")||"dashboard";
 switchPage(CONFIG[desired]?desired:"dashboard",false);
 const action=search.get("manage"),id=search.get("record");
 if(MANAGEMENT_ACTIONS.has(action)){
  const apply=()=>{if(state.page===desired)openManagement(action,id,false)};
  const cached=state.cache.get(cacheKey());
  if(cached||action==="new")apply();else state.pendingManagement={action,id,section:state.page};
 }
}
async function initializeWorkspaces(){
 const r=await api("bootstrap");
 state.workspaces=r.workspaces||[];
 if(!state.workspaces.length){showView("workspaceSetup");return}
 state.tenantId=state.workspaces[0].tenant_id;
 startApp();
}
function bindEvents(){
 $("organizationForm").addEventListener("submit",async e=>{
  e.preventDefault();const b=e.currentTarget.querySelector("button");b.disabled=true;
  try{const name=String(new FormData(e.currentTarget).get("name")||"").trim();await api("create_workspace",{name});await initializeWorkspaces()}
  catch(error){$("setupMessage").textContent=error.message}finally{b.disabled=false}
 });
 $("sidebarNavigation").addEventListener("click",e=>{
  const groupButton=e.target.closest("[data-nav-group]");
  if(groupButton){
   const title=groupButton.dataset.navGroup;
   if(openNavGroups.has(title))openNavGroups.delete(title);else openNavGroups.add(title);
   saveNavGroups();
   const block=groupButton.closest(".nav-group"),expanded=openNavGroups.has(title);
   block.classList.toggle("expanded",expanded);
   groupButton.setAttribute("aria-expanded",String(expanded));
   groupButton.querySelector(".group-indicator").textContent=expanded?"−":"+";
   block.querySelector(".nav-group-links").hidden=!expanded;
   return;
  }
  const b=e.target.closest("[data-page]");if(b)switchPage(b.dataset.page);
 });
 document.querySelectorAll("[data-context]").forEach(b=>b.addEventListener("click",()=>changeContext(b.dataset.context)));
 const menu=$("accountMenu"),dropdown=$("accountDropdown"),trigger=$("accountTrigger");
 const closeAccountMenu=()=>{dropdown.hidden=true;trigger.setAttribute("aria-expanded","false")};
 trigger.addEventListener("click",()=>{dropdown.hidden=!dropdown.hidden;trigger.setAttribute("aria-expanded",String(!dropdown.hidden))});
 document.addEventListener("click",e=>{if(!menu.contains(e.target))closeAccountMenu()});
 dropdown.addEventListener("click",async e=>{
  const action=e.target.closest("[data-account-action]")?.dataset.accountAction;
  if(!action)return;
  closeAccountMenu();
  if(action==="account"){switchPage("account");return}
  if(action==="signout"){
   const signout=e.target.closest("button");signout.disabled=true;
   try{await state.supabase.auth.signOut({scope:"local"})}
   catch(error){console.warn("Unable to clear local session",error)}
   finally{state.cache.clear();state.workspaces=[];redirectToSelector()}
  }
 });
 $("menuToggle").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
 $("pageActions").addEventListener("click",e=>{if(e.target.closest("#newRecord"))openManagement("new");if(e.target.closest("#refreshPage"))void loadRecords(state.sequence,true);if(e.target.closest("#exportPage"))exportRecords()});
 $("pageContent").addEventListener("click",e=>{
  const target=e.target;
  const view=target.closest("[data-view]"),edit=target.closest("[data-edit]"),archive=target.closest("[data-archive]"),create=target.closest("[data-create]"),goto=target.closest("[data-goto]"),retry=target.closest("#retryLoad");
  if(view)openManagement("view",view.dataset.view);
  else if(edit)openManagement("edit",edit.dataset.edit);
  else if(archive)archiveRecord(archive.dataset.archive);
  else if(create)openManagement("new");
  else if(goto)switchPage(goto.dataset.goto);
  else if(retry)void loadRecords();
  else if(target.closest("#editProfile"))void editProfile();
  else if(target.closest("[data-back-list]"))leaveManagement();
  else if(target.closest("[data-manage-edit]"))openManagement("edit",target.closest("[data-manage-edit]").dataset.manageEdit);
 });
 $("pageContent").addEventListener("input",e=>{
  if(e.target.id!=="recordSearch")return;
  const position=e.target.selectionStart;
  state.search=e.target.value;
  showRecords(state.cache.get(cacheKey())?.records||[]);
  const input=$("recordSearch");input.focus();input.setSelectionRange(position,position);
 });
 $("recordForm").addEventListener("submit",saveRecord);
 $("pageContent").addEventListener("submit",e=>{if(e.target.id==="managementForm"){e.preventDefault();void submitManagement(e.target)}});
 for(const id of ["modalClose","cancelModal","modalDismiss"])$(id).addEventListener("click",closeModal);
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(!$("modal").hidden)closeModal();$("accountDropdown").hidden=true;$("accountTrigger").setAttribute("aria-expanded","false")}});
 const setFont=n=>{state.font=Math.max(13,Math.min(21,n));document.documentElement.style.fontSize=state.font+"px";localStorage.setItem("workforce_unified_font",String(state.font))};
 $("fontDown").addEventListener("click",()=>setFont(state.font-1));
 $("fontUp").addEventListener("click",()=>setFont(state.font+1));
 $("fontReset").addEventListener("click",()=>setFont(16));
 addEventListener("popstate",()=>{
  const params=new URLSearchParams(location.search),desired=params.get("page")||"dashboard";
  const action=params.get("manage"),id=params.get("record");
  if(desired!==state.page)switchPage(desired,false);
  if(MANAGEMENT_ACTIONS.has(action)){
   const cached=state.cache.get(cacheKey());
   if(cached||action==="new")openManagement(action,id,false);
   else state.pendingManagement={action,id,section:state.page};
  }else if(state.management)leaveManagement(false);
});
 addEventListener("focus",()=>{if(!$("application").hidden&&state.cache.get(cacheKey())&&Date.now()-state.cache.get(cacheKey()).time>60000)void loadRecords(state.sequence,true)});
}
async function init(){
 if(!window.supabase?.createClient){redirectToSelector();return}
 state.supabase=window.supabase.createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:"s4u_ctpa_dot_auth"}});
 state.font=Math.max(13,Math.min(21,Number(localStorage.getItem("workforce_unified_font")||16)));
 document.documentElement.style.fontSize=state.font+"px";
 const requestedContext=new URLSearchParams(location.search).get("context");
 state.context=requestedContext==="nondot"?"nondot":requestedContext==="dot"?"dot":
  sessionStorage.getItem("workforce_unified_context")==="nondot"?"nondot":"dot";
 sessionStorage.setItem("workforce_unified_context",state.context);
 bindEvents();
 try{
  const {data:{session}}=await state.supabase.auth.getSession();
  if(!session){redirectToSelector();return}
  await initializeWorkspaces();
 }catch(error){console.error("Unable to open the unified portal",error);redirectToSelector()}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();