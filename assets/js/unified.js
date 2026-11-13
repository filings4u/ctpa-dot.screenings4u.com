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
 ["Lab Account",["lab_accounts","lab_orders","lab_tracking","lab_results","lab_documents","lab_supplies","lab_analytics"]],
 ["Services & Billing",["orders","price_list","services","billing","invoices","subscriptions"]],
 ["Account & Support",["locations","messages","notifications","support","demo_sessions","staff","integrations","audit_history"]]
];
const SIDEBAR_TOP=[
 ["dashboard","Dashboard"]
];
const NAV_ICON_NAMES={"dashboard":"house","employers":"building","owner_operators":"truck","people":"users","programs":"clipboard","pools":"layers","selections":"shuffle","testing_orders":"flask","testing_documents":"file","results":"check","occupational_health":"heart","compliance":"shield","audits":"shield","clearinghouse":"database","return_to_duty":"route","policies":"book","enrollments":"users","documents":"file","reports":"chart","lab_accounts":"building","lab_orders":"clipboard","lab_tracking":"truck","lab_results":"check","lab_documents":"file","lab_supplies":"package","lab_analytics":"chart","orders":"bag","price_list":"card","services":"shield","billing":"card","invoices":"receipt","subscriptions":"calendar","locations":"pin","messages":"message","notifications":"bell","support":"support","demo_sessions":"calendar","staff":"users","integrations":"plug","audit_history":"history"};
const NAV_ICON_SHAPES={"building":"<rect x=\"4\" y=\"2\" width=\"16\" height=\"20\" rx=\"2\"/><path d=\"M9 22v-4h6v4M8 7h2m4 0h2M8 12h2m4 0h2\"/>","clipboard":"<rect x=\"5\" y=\"4\" width=\"14\" height=\"18\" rx=\"2\"/><rect x=\"9\" y=\"2\" width=\"6\" height=\"4\" rx=\"1\"/><path d=\"M9 12h6M9 16h6\"/>","truck":"<path d=\"M10 17h4V5H2v12h3M14 9h4l4 4v4h-3\"/><circle cx=\"7.5\" cy=\"17.5\" r=\"2.5\"/><circle cx=\"16.5\" cy=\"17.5\" r=\"2.5\"/>","check":"<rect x=\"5\" y=\"4\" width=\"14\" height=\"18\" rx=\"2\"/><rect x=\"9\" y=\"2\" width=\"6\" height=\"4\" rx=\"1\"/><path d=\"m9 14 2 2 4-4\"/>","file":"<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8\"/>","chart":"<path d=\"M4 20h4v-7H4zM10 20h4V4h-4zM16 20h4v-11h-4z\"/>","package":"<path d=\"m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10\"/>","house":"<path d=\"m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8\"/>","users":"<circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M2 21v-2a7 7 0 0 1 14 0v2M16 4a4 4 0 0 1 0 8M22 21v-2a5 5 0 0 0-4-5\"/>","layers":"<path d=\"m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5\"/>","shuffle":"<path d=\"m18 14 4 4-4 4M18 2l4 4-4 4M2 18h3c7 0 7-12 14-12h3M2 6h3c2 0 3 1 4 3M15 16c1 1 2 2 4 2h3\"/>","flask":"<path d=\"M9 3h6M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L14 9V3M7 16h10\"/>","shield":"<path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z\"/><path d=\"m9 12 2 2 4-4\"/>","heart":"<path d=\"M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8ZM3 12h5l2-3 3 6 2-3h6\"/>","route":"<circle cx=\"6\" cy=\"19\" r=\"2\"/><circle cx=\"18\" cy=\"5\" r=\"2\"/><path d=\"M8 19h6a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h6\"/>","database":"<ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\"/><path d=\"M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3\"/>","book":"<path d=\"M12 7c-3-2-6-2-10-1v14c4-1 7-1 10 1 3-2 6-2 10-1V6c-4-1-7-1-10 1ZM12 7v14\"/>","bag":"<path d=\"M4 8h16l-1 13H5zM9 9V6a3 3 0 0 1 6 0v3\"/>","card":"<rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\"/><path d=\"M2 10h20M6 16h4\"/>","receipt":"<path d=\"M4 2h16v20l-4-2-4 2-4-2-4 2zM8 7h8M8 11h8M8 15h5\"/>","calendar":"<rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M7 2v4M17 2v4M3 9h18M8 14h3m3 0h3M8 18h3\"/>","pin":"<path d=\"M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/>","message":"<path d=\"M3 4h18v13H8l-5 4zM7 9h10M7 13h7\"/>","bell":"<path d=\"M18 8a6 6 0 1 0-12 0c0 7-3 8-3 10h18c0-2-3-3-3-10M10 21h4\"/>","support":"<circle cx=\"12\" cy=\"12\" r=\"10\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"m5 5 4 4m6 6 4 4m0-14-4 4m-6 6-4 4\"/>","plug":"<path d=\"M8 2v6M16 2v6M7 8h10v4a5 5 0 0 1-10 0zM12 17v5\"/>","history":"<path d=\"M3 12a9 9 0 1 0 3-7M3 4v5h5M12 7v5l4 2\"/>"};
function navIcon(id){return '<svg class="nav-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false">'+NAV_ICON_SHAPES[NAV_ICON_NAMES[id]||"file"]+'</svg>'}
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
 employers:["Employers","Manage employer organizations, contacts and identifiers.","legal_name|Legal name|text|required;dba_name|DBA / Trade name|text;dot_number|USDOT number|text;mc_number|MC number|text;ein|Tax ID / EIN|text;company_type|Company type|text;status|Status|select:active,pending,inactive;contact_name|Primary contact|text;contact_title|Contact title|text;contact_email|Contact email|email;phone|Phone|tel;secondary_phone|Secondary phone|tel;address_line1|Address line 1|text;address_line2|Address line 2|text;city|City|text;state|State|text;zip|ZIP / Postal code|text;country|Country|text;testing_program|Testing program|text;consortium_status|Consortium status|text;random_pool|Random pool|text;clearinghouse_status|Clearinghouse status|text;audit_status|New entrant audit status|text;occupational_health|Occupational health|select:enabled,disabled;billing_contact|Billing contact|text;billing_email|Billing email|email;billing_phone|Billing phone|tel;billing_address1|Billing address|text;billing_city|Billing city|text;billing_state|Billing state|text;billing_zip|Billing ZIP|text;billing_country|Billing country|text;payment_terms|Payment terms|text;mailing_address1|Mailing address|text;mailing_city|Mailing city|text;mailing_state|Mailing state|text;mailing_zip|Mailing ZIP|text;mailing_country|Mailing country|text;account_notes|Internal account notes|textarea"],
 owner_operators:["Owner-Operators","Manage owner-operator accounts and operating contacts.","legal_name|Legal name|text|required;dba_name|DBA / Trade name|text;dot_number|USDOT number|text;mc_number|MC number|text;ein|Tax ID / EIN|text;company_type|Company type|text;status|Status|select:active,pending,inactive;contact_name|Primary contact|text;contact_title|Contact title|text;email|Email|email;phone|Phone|tel;secondary_phone|Secondary phone|tel;address_line1|Address line 1|text;address_line2|Address line 2|text;city|City|text;state|State|text;zip|ZIP / Postal code|text;country|Country|text;testing_program|Testing program|text;consortium_status|Consortium status|text;random_pool|Random pool|text;clearinghouse_status|Clearinghouse status|text;audit_status|New entrant audit status|text;occupational_health|Occupational health|select:enabled,disabled;billing_contact|Billing contact|text;billing_email|Billing email|email;billing_phone|Billing phone|tel;billing_address1|Billing address|text;billing_city|Billing city|text;billing_state|Billing state|text;billing_zip|Billing ZIP|text;billing_country|Billing country|text;payment_terms|Payment terms|text;mailing_address1|Mailing address|text;mailing_city|Mailing city|text;mailing_state|Mailing state|text;mailing_zip|Mailing ZIP|text;mailing_country|Mailing country|text;account_notes|Internal account notes|textarea"],
 people:["People","Maintain worker and employee records.","first_name|First name|text|required;last_name|Last name|text|required;employee_number|Employee number|text;employer|Employer|text;company_id|Company record ID|text;relationship|Relationship|select:staff,contact,worker;job_title|Job title|text;email|Email|email;phone|Phone|tel;status|Status|select:active,inactive"],
 programs:["Programs","Set up testing and compliance programs.","name|Program name|text|required;employer|Employer|text;program_type|Program type|text;effective_date|Effective date|date;status|Status|select:active,draft,inactive"],
 pools:["Pools","Manage consortium and employer selection pools.","name|Pool name|text|required;employer|Employer|text;program|Program|text;frequency|Selection frequency|select:monthly,quarterly,annual;status|Status|select:active,inactive"],
 selections:["Selections","Review and record randomized selection activity.","name|Selection reference|text|required;pool|Pool|text;selection_date|Selection date|date;status|Status|select:scheduled,selected,completed;notes|Notes|textarea"],
 testing_orders:["Testing Orders","Create and manage testing requests.","name|Order reference|text|required;employee_name|Employee / donor|text;employer|Employer|text;test_type|Test type|text;reason|Testing reason|text;status|Status|select:draft,ordered,scheduled,completed,cancelled"],
 testing_documents:["Testing Documents","Manage testing-related documents.","title|Document title|text|required;document_type|Document type|text;order_reference|Order reference|text;document_file|Upload document|file;status|Status|select:pending,complete"],
 results:["Results","Track confidential test result metadata.","name|Result reference|text|required;order_reference|Order reference|text;status|Status|select:pending,received,reviewed;reported_at|Date reported|date;notes|Notes|textarea"],
 occupational_health:["Occupational Health","Manage occupational health service requests.","name|Service reference|text|required;employee_name|Employee name|text;service|Service|text;appointment_date|Appointment date|date;status|Status|select:requested,scheduled,completed"],
 compliance:["Compliance","Manage compliance cases and required actions.","name|Case title|text|required;employer|Employer|text;due_date|Due date|date;priority|Priority|select:low,normal,high;status|Status|select:open,in_progress,complete"],
 audits:["New Entrant Audits","Manage audit preparation and document milestones.","name|Audit title|text|required;carrier|Carrier|text;dot_number|USDOT number|text;due_date|Due date|date;status|Status|select:draft,in_progress,submitted,complete"],
 clearinghouse:["Clearinghouse","Track Clearinghouse-related workflow tasks.","name|Task title|text|required;employer|Employer|text;reference|Reference|text;due_date|Due date|date;status|Status|select:open,in_progress,complete"],
 return_to_duty:["Return to Duty","Manage Return-to-Duty and follow-up tracking.","name|Case reference|text|required;agency|DOT agency|text;employee|Employee|text;status|Status|select:opened,in_progress,follow_up,complete;notes|Notes|textarea"],
 policies:["Policies","Manage compliance policy records.","name|Policy name|text|required;version|Version|text;effective_date|Effective date|date;status|Status|select:draft,active,archived"],
 enrollments:["Enrollments","Manage enrollment record status.","name|Enrollment name|text|required;participant|Participant|text;program|Program|text;status|Status|select:pending,active,complete"],
 documents:["Documents","Manage account and compliance documents.","title|Document title|text|required;document_type|Document type|text;document_file|Upload document|file;status|Status|select:requested,received,approved"],
 reports:["Reports","Maintain generated reporting records.","name|Report name|text|required;report_type|Report type|text;period|Reporting period|text;status|Status|select:draft,ready,archived"],
 lab_accounts:["Lab Accounts","Manage connected laboratory accounts and setup.","name|Company / Account name|text|required;account_number|Lab account number|text;provider|Laboratory|text;status|Status|select:pending,active,inactive;setup_status|Setup status|text;order_number|Order number|text"],
 lab_clients:["Laboratory Clients","Manage laboratory client accounts.","name|Client name|text|required;contact|Contact|text;email|Email|email;status|Status|select:active,inactive"],
 lab_orders:["Laboratory Orders","Manage laboratory order records.","name|Order reference|text|required;account|Lab account|text;donor|Donor|text;collection_date|Collection date|date;status|Status|select:requested,scheduled,collected,complete"],
 lab_tracking:["Laboratory Tracking","Track specimen and order movement.","name|Tracking reference|text|required;order_reference|Order reference|text;carrier|Carrier|text;tracking_number|Tracking number|text;status|Status|select:pending,in_transit,delivered"],
 lab_results:["Laboratory Results","Manage laboratory result records.","name|Lab result reference|text|required;order_reference|Order reference|text;status|Status|select:pending,reported,reviewed;reported_at|Reported at|date"],
 lab_documents:["Laboratory Documents","Manage laboratory documents.","title|Document title|text|required;account|Account|text;document_file|Upload document|file;status|Status|select:pending,received,complete"],
 lab_billing:["Laboratory Billing","Manage laboratory billing records.","name|Billing reference|text|required;account|Lab account|text;amount|Amount|number;due_date|Due date|date;status|Status|select:open,paid,void"],
 lab_supplies:["Laboratory Supplies","Manage laboratory supply requests.","name|Supply item|text|required;quantity|Quantity|number;account|Account|text;status|Status|select:requested,shipped,received"],
 lab_analytics:["Laboratory Analytics","Manage laboratory analytics reports.","name|Analysis name|text|required;period|Period|text;metric|Metric|text;value|Value|number"],
 lab_delivery:["Laboratory Delivery","Manage document and supply delivery records.","name|Delivery reference|text|required;recipient|Recipient|text;tracking_number|Tracking number|text;status|Status|select:pending,shipped,delivered"],
 lab_alerts:["Laboratory Alerts","Manage laboratory notifications and alerts.","name|Alert title|text|required;severity|Severity|select:info,warning,urgent;message|Message|textarea;status|Status|select:open,resolved"],
 lab_benefits:["Laboratory Benefits","Manage laboratory service benefit records.","name|Benefit name|text|required;description|Description|textarea;status|Status|select:active,inactive"],
 lab_consortiums:["Laboratory Consortiums","Manage consortium laboratory relationships.","name|Consortium name|text|required;account|Lab account|text;contact|Contact|text;status|Status|select:active,inactive"],
 locations:["Locations","Maintain collection and employer location records.","name|Location name|text|required;company_id|Company record ID|text;employer|Company|text;address|Street address|text;city|City|text;state|State|text;zip|Postal code|text;phone|Phone|tel"],
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
const state={supabase:null,workspaces:[],tenantId:null,context:"dot",page:"dashboard",cache:new Map(),sequence:0,editing:null,search:"",statusFilter:"",pageIndex:0,font:16,loading:false};
const $=id=>document.getElementById(id);
const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const label=id=>CONFIG[id]?.[0]||id.replaceAll("_"," ").replace(/\b\w/g,x=>x.toUpperCase());
const fields=id=>(CONFIG[id]?.[2]||"name|Name|text|required").split(";").map(x=>{const a=x.split("|");return {name:a[0],label:a[1]||a[0],type:a[2]||"text",required:a[3]==="required"}});
const recordTitle=r=>{
 const d=r?.data||{};
 return d.name||d.title||d.legal_name||[d.first_name,d.last_name].filter(Boolean).join(" ")||d.summary||d.file_name||d.invoice_number||d.order_reference||d.account_number||r?.id||"Record";
};
const DOCUMENT_PAGES=new Set(["documents","lab_documents","testing_documents"]);
const cacheKey=(p=state.page)=>state.tenantId+"|"+state.context+"|"+p;
let notificationTimer=null;
function message(text,isError=false){
 const n=$("notice");
 if(notificationTimer){clearTimeout(notificationTimer);notificationTimer=null}
 if(!text){n.hidden=true;n.textContent="";return}
 n.hidden=false;n.classList.toggle("notice-error",isError);
 n.classList.toggle("notice-success",!isError);
 n.innerHTML='<span class="notice-icon" aria-hidden="true">'+(isError?'!':'✓')+'</span><span>'+esc(text)+'</span><button type="button" class="notice-close" aria-label="Dismiss notification">×</button>';
 notificationTimer=setTimeout(()=>{n.hidden=true;n.textContent="";notificationTimer=null},isError?6500:3200);
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
const SIDEBAR_STATE_KEY="workforce_ctpa_sidebar_collapsed";
const isCompactViewport=()=>window.matchMedia("(max-width: 820px)").matches;
function updateSidebarToggle(){
 const sidebar=$("sidebar"),toggle=$("sidebarToggle"),glyph=$("sidebarToggleIcon");
 if(!sidebar||!toggle||!glyph)return;
 const mobile=isCompactViewport();
 const visible=mobile?sidebar.classList.contains("open"):!document.body.classList.contains("sidebar-collapsed");
 glyph.textContent=visible?"❮":"❯";
 toggle.setAttribute("aria-expanded",String(visible));
 toggle.setAttribute("aria-label",visible?"Hide sidebar":"Show sidebar");
 toggle.title=visible?"Hide sidebar":"Show sidebar";
}
function setSidebarVisible(visible){
 if(isCompactViewport()){
  $("sidebar").classList.toggle("open",visible);
 }else{
  document.body.classList.toggle("sidebar-collapsed",!visible);
  try{localStorage.setItem(SIDEBAR_STATE_KEY,visible?"visible":"collapsed")}catch(_){}
 }
 updateSidebarToggle();
}
function setupSidebarToggle(){
 try{document.body.classList.toggle("sidebar-collapsed",localStorage.getItem(SIDEBAR_STATE_KEY)==="collapsed")}catch(_){}
 $("sidebarToggle").addEventListener("click",()=>{
  const visible=isCompactViewport()?$("sidebar").classList.contains("open"):!document.body.classList.contains("sidebar-collapsed");
  setSidebarVisible(!visible);
 });
 $("menuToggle").addEventListener("click",()=>setSidebarVisible(!$("sidebar").classList.contains("open")));
 addEventListener("resize",updateSidebarToggle,{passive:true});
 updateSidebarToggle();
}
function renderNav(){
 const nav=$("sidebarNavigation");
 const top=SIDEBAR_TOP.map(([id,name])=>'<button type="button" class="nav-item nav-top-link'+
 (state.page===id?" active":"")+'" data-page="'+id+'" '+(state.page===id?'aria-current="page"':"")+
 '><span class="symbol" aria-hidden="true">'+navIcon(id)+'</span><span>'+esc(name)+'</span></button>').join("");
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
    '><span class="symbol" aria-hidden="true">'+navIcon(id)+'</span><span>'+esc(label(id))+'</span></button>').join("")+'</div></section>';
 }).join("");
 nav.innerHTML='<div class="nav-top-links">'+top+'</div>'+groups;
 document.querySelectorAll("[data-context]").forEach(btn=>{
  const active=btn.dataset.context===state.context;
  btn.classList.toggle("selected",active);
  btn.setAttribute("aria-pressed",String(active));
 });
 $("contextPill").textContent=state.context==="dot"?"DOT":"NON-DOT";
}
function updateBreadcrumbs(action=null){
 const name=label(state.page),group=navGroupForPage(state.page);
 const parts=[{name:"Dashboard",page:state.page==="dashboard"?null:"dashboard"}];
 if(state.page!=="dashboard"){
  if(group)parts.push({name:group,page:null});
  parts.push({name,page:action?state.page:null});
 }
 if(action)parts.push({name:(action==="new"?"Add ":action==="edit"?"Edit ":"View ")+name,page:null});
 $("pageBreadcrumbs").innerHTML=parts.map((item,i)=>
  (i?'<span class="crumb-separator" aria-hidden="true">/</span>':"")+
  (item.page?'<button type="button" data-page="'+esc(item.page)+'">'+esc(item.name)+'</button>':
   '<span'+(i===parts.length-1?' aria-current="page"':'')+'>'+esc(item.name)+'</span>')).join("");
}
function updateHeading(){
 const title=label(state.page);
 $("topTitle").textContent=title;$("pageTitle").textContent=title;
 updateBreadcrumbs();
 $("pageActions").innerHTML=state.page==="account"?"":state.page==="dashboard"||state.page==="lab_analytics"
  ?'<button class="btn secondary" type="button" id="refreshPage">Refresh</button>'
  :'<button class="btn secondary" type="button" id="refreshPage">Refresh</button><button class="btn secondary" type="button" id="exportPage">Export CSV</button><button class="btn primary" type="button" id="newRecord">Add '+esc(title)+'</button>';
}
function switchPage(page,push=true){
 if(!CONFIG[page])page="dashboard";
 state.page=page;state.search="";state.statusFilter="";state.pageIndex=0;state.management=null;state.pendingManagement=null;const seq=++state.sequence;
 if(push)history.pushState(null,"","/unified.html?page="+encodeURIComponent(page));
 if(isCompactViewport())$("sidebar").classList.remove("open");updateSidebarToggle();renderNav();updateHeading();message("");
 if(page==="account"){void renderAccount();return}
 if(page==="lab_analytics"){void renderLabAnalytics();return}
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
async function loadRecords(sequence=state.sequence,refresh=false,notify=false){
 if(state.page==="lab_analytics")return renderLabAnalytics(refresh);
 const kind=state.page==="dashboard"?"all":state.page,key=cacheKey(),tenant=state.tenantId,context=state.context;
 try{
  const result=await api("list",{tenant_id:tenant,operating_context:context,kind});
  state.cache.set(key,{records:result.records||[],time:Date.now()});
  if(sequence===state.sequence&&key===cacheKey()){
   if(state.pendingManagement?.section===state.page){
    const pending=state.pendingManagement;state.pendingManagement=null;
    openManagement(pending.action,pending.id,false);
   }else if(state.management){
    // Preserve unsaved inputs during background refresh.
    if(state.management.action==="view")renderManagementPage();
   }else showRecords(result.records||[]);
   if(notify&&!state.management)message("Records refreshed successfully.");
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
 $("pageContent").innerHTML='<section class="panel">'+
  '<div class="account-details"><div><small>Account</small><strong>'+esc(person)+'</strong></div>'+
  '<div><small>Email</small><strong>'+esc(email)+'</strong></div>'+
  '<div><small>C/TPA Company</small><strong>'+esc(w?.name||"Workforce C/TPA")+'</strong></div>'+
  '<div><small>Role</small><strong>'+esc(w?.role||"Member")+'</strong></div></div>'+
 '<div class="management-account-actions"><button type="button" class="btn primary" id="editProfile">Edit Profile</button>'+
 '<button type="button" class="btn secondary" data-goto="staff">Manage Staff</button>'+
 '<button type="button" class="btn secondary" data-goto="employers">Manage Employers</button></div></section>';
}
async function renderLabAnalytics(refresh=false){
 const key="lab-summary|"+state.tenantId+"|"+state.context,seq=state.sequence;
 let stored=state.cache.get(key);
 if(!stored||refresh||Date.now()-stored.time>30000){
  if(state.page==="lab_analytics")$("pageContent").innerHTML='<section class="panel"><div class="loading-line"><span class="spinner"></span>Loading laboratory records…</div></section>';
  try{
   const result=await api("lab_summary",{tenant_id:state.tenantId,operating_context:state.context});
   stored={counts:result.counts||[],time:Date.now()};state.cache.set(key,stored);
  }catch(error){
   if(state.page==="lab_analytics"&&seq===state.sequence)message(error.message,true);
   return;
  }
 }
 if(state.page!=="lab_analytics"||seq!==state.sequence)return;
 const counts=new Map(stored.counts.map(row=>[row.kind,Number(row.count)||0]));
 const pages=["lab_accounts","lab_orders","lab_tracking","lab_results","lab_documents","lab_supplies"];
 $("pageContent").innerHTML='<section class="panel"><div class="lab-summary-grid">'+pages.map(kind=>
  '<button type="button" class="lab-summary-card" data-goto="'+kind+'"><span>'+esc(label(kind))+'</span>'+
   '<strong>'+String(counts.get(kind)||0)+'</strong><small>Manage records</small></button>').join("")+'</div></section>';
}
function renderDashboard(records){
 const context=state.context==="dot"?"DOT":"NON-DOT";
 const company=activeWorkspace()?.name||"C/TPA";
 const byKind=new Map(),statusPending=/pending|awaiting|in.progress|requested|draft|overdue|review|unassigned|needs.action|unscheduled|incomplete/i;
 for(const r of records)byKind.set(r.kind,(byKind.get(r.kind)||0)+1);
 const allowedKinds=new Set(["employers","owner_operators","people","programs","pools","selections","testing_orders","testing_documents","results","documents","audits","lab_accounts","lab_orders","lab_tracking","lab_results","lab_documents","lab_supplies","invoices","billing"]);
 const recent=records.filter(r=>allowedKinds.has(r.kind)&&!r.archived_at)
  .sort((x,y)=>new Date(y.updated_at||y.created_at||0)-new Date(x.updated_at||x.created_at||0)).slice(0,6);
 const activeOrders=records.filter(r=>["testing_orders","lab_orders"].includes(r.kind));
 const followUp=activeOrders.filter(r=>statusPending.test(String(r.data?.status||""))).length;
 const outstanding=records.filter(r=>["invoices","billing"].includes(r.kind)&&/unpaid|open|overdue|past.due|pending/i.test(String(r.data?.status||""))).length;
 const metrics=[
  ["employers","Client employers","Registered organizations"],
  ["people","Workforce","People on record"],
  ["programs","Active programs","Program records"],
  ["testing_orders","Testing orders","Order records"]
 ];
 const metricHtml=metrics.map(([id,title,sub])=>
  '<button type="button" class="enterprise-kpi" data-goto="'+id+'">'+
   '<span class="enterprise-kpi-top"><span>'+esc(title)+'</span><span class="enterprise-kpi-icon">'+navIcon(id)+'</span></span>'+
   '<strong>'+String(byKind.get(id)||0)+'</strong>'+
   '<span class="enterprise-kpi-bottom">'+esc(sub)+'<span aria-hidden="true">↗</span></span></button>').join("");
 const actions=[
  ["employers","Add employer","building"],
  ["people","Add person","user"],
  ["testing_orders","Create testing order","flask"],
  ["documents","Add document","file"]
 ];
 const actionHtml=actions.map(([id,title])=>'<button type="button" class="enterprise-action" data-dashboard-create="'+id+'">'+
  '<span class="enterprise-action-icon">'+navIcon(id)+'</span><span>'+esc(title)+'</span><span class="enterprise-action-arrow" aria-hidden="true">↗</span></button>').join("");
 const now=new Date(),months=[];
 for(let offset=5;offset>=0;offset--){
  const d=new Date(now.getFullYear(),now.getMonth()-offset,1);
  const y=d.getFullYear(),m=d.getMonth();
  const total=records.filter(r=>{
   if(!allowedKinds.has(r.kind))return false;
   const value=new Date(r.created_at||r.updated_at||0);
   return !Number.isNaN(value.getTime())&&value.getFullYear()===y&&value.getMonth()===m;
  }).length;
  months.push({label:d.toLocaleDateString(undefined,{month:"short"}),count:total});
 }
 const max=Math.max(1,...months.map(v=>v.count));
 const plot=months.map(item=>
  '<div class="enterprise-chart-col" title="'+esc(item.label)+': '+item.count+' records">'+
  '<span class="enterprise-chart-amount">'+(item.count?item.count:"")+'</span>'+
  '<span class="enterprise-chart-track"><span class="enterprise-chart-bar" style="height:'+Math.max(item.count?7:0,Math.round(item.count/max*100))+'%"></span></span>'+
  '<span class="enterprise-chart-month">'+esc(item.label)+'</span></div>').join("");
 const activity=recent.map(r=>{
  const date=new Date(r.updated_at||r.created_at||0);
  const formatted=Number.isNaN(date.getTime())?"":date.toLocaleDateString(undefined,{month:"short",day:"numeric"});
  return '<button type="button" class="enterprise-activity-row" data-dashboard-record="'+esc(r.id)+'" data-dashboard-kind="'+esc(r.kind)+'">'+
   '<span class="enterprise-activity-symbol">'+navIcon(r.kind)+'</span>'+
   '<span class="enterprise-activity-info"><strong>'+esc(recordTitle(r))+'</strong><small>'+esc(label(r.kind))+'</small></span>'+
   '<span class="enterprise-activity-date">'+esc(formatted)+'</span></button>';
 }).join("");
 const attention=[
  {name:"Orders requiring follow-up",count:followUp,kind:"testing_orders",note:"Based on pending order statuses"},
  {name:"Outstanding billing records",count:outstanding,kind:"invoices",note:"Based on open invoice statuses"}
 ];
 const attentionHtml=attention.map(v=>'<button type="button" class="enterprise-attention-row" data-goto="'+v.kind+'">'+
  '<span class="enterprise-attention-dot '+(v.count?"has-items":"")+'"></span>'+
  '<span class="enterprise-attention-info"><strong>'+v.name+'</strong><small>'+v.note+'</small></span>'+
  '<span class="enterprise-attention-count">'+v.count+'</span></button>').join("");
 $("pageContent").innerHTML=
  '<div class="enterprise-dashboard">'+
   '<div class="enterprise-kpi-grid">'+metricHtml+'</div>'+
   '<div class="enterprise-dashboard-grid"><div class="enterprise-dashboard-main">'+
    '<section class="enterprise-work-panel"><div class="enterprise-panel-heading"><div><span class="enterprise-panel-overline">WORKFORCE ACTIVITY</span><h3>Record activity</h3></div><span class="enterprise-panel-meta">Last six calendar months</span></div>'+
    '<div class="enterprise-chart" role="img" aria-label="Record creation by month over the last six months">'+plot+'</div>'+
    '<div class="enterprise-chart-caption">Based on available record creation dates. Historical records are included when dates are available.</div></section>'+
    '<section class="enterprise-work-panel"><div class="enterprise-panel-heading"><div><span class="enterprise-panel-overline">GET THINGS DONE</span><h3>Quick actions</h3></div></div>'+
    '<div class="enterprise-actions-grid">'+actionHtml+'</div></section>'+
   '</div><div class="enterprise-dashboard-side">'+
    '<section class="enterprise-work-panel"><div class="enterprise-panel-heading"><div><span class="enterprise-panel-overline">WORK QUEUE</span><h3>Needs attention</h3></div></div>'+
    '<div class="enterprise-attention-list">'+attentionHtml+'</div></section>'+
    '<section class="enterprise-work-panel enterprise-activity-panel"><div class="enterprise-panel-heading"><div><span class="enterprise-panel-overline">LATEST UPDATES</span><h3>Recent activity</h3></div>'+
    '<button type="button" class="enterprise-text-link" data-goto="audit_history">Audit log ↗</button></div>'+
    '<div class="enterprise-activity-list">'+(activity||'<p class="enterprise-empty">No recent activity for this workspace.</p>')+'</div></section>'+
   '</div></div></div>';
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
 if(f.type==="file")control='<input id="manage-'+name+'" name="'+name+'" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx" aria-describedby="uploadHelp">';
 else if(f.type==="textarea")control='<textarea id="manage-'+name+'" name="'+name+'" rows="4"'+required+'>'+v+'</textarea>';
 else if(f.type.startsWith("select:")){
  const values=f.type.slice(7).split(",");
  const current=String(value??"");
  if(current&&!values.includes(current))values.unshift(current);
  control='<select id="manage-'+name+'" name="'+name+'"'+required+'>'+
  '<option value="">Choose an option</option>'+values.map(item=>'<option value="'+esc(item)+'"'+(current===item?' selected':'')+'>'+esc(item.replaceAll("_"," "))+'</option>').join("")+'</select>';
 }else control='<input id="manage-'+name+'" name="'+name+'" type="'+esc(f.type)+'" value="'+v+'"'+required+(f.type==="number"?' step="any"':"")+' maxlength="4000">';
 return '<label class="manage-field" for="manage-'+name+'"><span>'+esc(f.label)+(f.required?' <span class="required-mark">*</span>':'')+'</span>'+control+'</label>';
}
function singularLabel(page){
 const words=label(page);
 if(page==="people")return "Person";
 if(words.endsWith("ies"))return words.slice(0,-3)+"y";
 if(words.endsWith("s")&&!words.endsWith("ss"))return words.slice(0,-1);
 return words;
}
function managementSection(title,fieldsList,record){
 if(!fieldsList.length)return "";
 return '<section class="management-section"><header class="management-section-header"><h2>'+esc(title)+'</h2></header>'+
  '<div class="manage-form-grid">'+fieldsList.map(f=>managementField(f,record?.data?.[f.name]??"")).join("")+'</div></section>';
}
function managementOverviewGroup(title,entries){
 const populated=entries.filter(([,value])=>value!==undefined&&value!==null&&String(value).trim()!=="");
 if(!populated.length)return "";
 return '<section class="profile-section"><div class="profile-section-heading"><h2>'+esc(title)+'</h2></div>'+
  '<dl class="profile-fields">'+populated.map(([name,value])=>
  '<div class="profile-field"><dt>'+esc(name)+'</dt><dd>'+esc(value)+'</dd></div>').join("")+'</dl></section>';
}

const EMPLOYER_GROUPS=[
 ["Company information",["legal_name","dba_name","dot_number","mc_number","ein","company_type","status"]],
 ["Primary contact",["contact_name","contact_title","contact_email","phone","secondary_phone"]],
 ["Company address",["address_line1","address_line2","city","state","zip","country"]],
 ["Mailing address",["mailing_address1","mailing_city","mailing_state","mailing_zip","mailing_country"]],
 ["Billing details",["billing_contact","billing_email","billing_phone","billing_address1","billing_city","billing_state","billing_zip","billing_country","payment_terms"]],
 ["Compliance & programs",["testing_program","consortium_status","random_pool","clearinghouse_status","audit_status","occupational_health"]],
 ["Internal notes",["account_notes"]]
];
const OWNER_OPERATOR_GROUPS=[
 ["Company information",["legal_name","dba_name","dot_number","mc_number","ein","company_type","status"]],
 ["Primary contact",["contact_name","contact_title","email","phone","secondary_phone"]],
 ["Company address",["address_line1","address_line2","city","state","zip","country"]],
 ["Mailing address",["mailing_address1","mailing_city","mailing_state","mailing_zip","mailing_country"]],
 ["Billing details",["billing_contact","billing_email","billing_phone","billing_address1","billing_city","billing_state","billing_zip","billing_country","payment_terms"]],
 ["Compliance & programs",["testing_program","consortium_status","random_pool","clearinghouse_status","audit_status","occupational_health"]],
 ["Internal notes",["account_notes"]]
];
const EMPLOYER_RELATED=[
 ["people","People"],["programs","Programs"],["pools","Pools"],
 ["testing_orders","Testing orders"],["results","Results"],["documents","Documents"],
 ["invoices","Invoices"],["support","Support"]
];
const EMPLOYER_QUICK=[
 ["people","Add person"],["programs","Add program"],
 ["testing_orders","Create testing order"],["documents","Upload document"],
 ["invoices","Create invoice"],["audits","Start audit"]
];
function employerSummary(record,editing=false,kind="employers"){
 const isOwner=kind==="owner_operators";
 const d=record?.data||{},title=d.legal_name||(isOwner?"New owner-operator":"New employer");
 const detail=(label,value)=>'<div class="employer-summary-stat"><small>'+label+'</small><strong>'+esc(value||"Not provided")+'</strong></div>';
 return '<div class="employer-summary">'+
  '<div class="employer-summary-heading"><span class="employer-summary-icon">'+navIcon(kind)+'</span>'+
  '<div class="employer-summary-name"><strong>'+esc(title)+'</strong><span>'+(isOwner?"Owner-operator account management":"Company account management")+'</span></div>'+
  (record?recordStatus(record):'<span class="mgmt-status pending">New company</span>')+'</div>'+
  '<div class="employer-summary-info">'+
   detail("USDOT",d.dot_number)+detail("Primary contact",d.contact_name)+
   detail("Email",isOwner?d.email:d.contact_email)+detail("Phone",d.phone)+
  '</div></div>';
}

let companyAction=null;
function currentCompany(){
 const m=state.management;
 if(!m?.id||!["employers","owner_operators"].includes(state.page))return null;
 return (state.cache.get(cacheKey())?.records||[]).find(r=>r.id===m.id)||null;
}
function belongsToCompany(record,company){
 if(!record||!company)return false;
 const d=record.data||{},name=String(company.data?.legal_name||"").trim().toLowerCase();
 return d.company_id===company.id||
  (name&&String(d.employer||d.company||"").trim().toLowerCase()===name);
}
function companyChildList(kind,company){
 return (state.cache.get(cacheKey(kind))?.records||[]).filter(r=>belongsToCompany(r,company));
}
async function hydrateCompanyRelations(){
 const company=currentCompany(),context=state.context,seq=state.sequence;
 if(!company)return;
 try{
  const kinds=["people","locations","invoices"];
  const loaded=await Promise.all(kinds.map(async kind=>{
   const key=cacheKey(kind),stored=state.cache.get(key);
   if(stored&&Date.now()-stored.time<30000)return stored.records;
   const result=await api("list",{tenant_id:state.tenantId,operating_context:context,kind});
   state.cache.set(key,{records:result.records||[],time:Date.now()});
   return result.records||[];
  }));
  if(seq!==state.sequence||currentCompany()?.id!==company.id)return;
  const people=loaded[0].filter(r=>belongsToCompany(r,company));
  const locations=loaded[1].filter(r=>belongsToCompany(r,company));
  const invoices=loaded[2].filter(r=>belongsToCompany(r,company)||
   String(r.data?.client||"").trim().toLowerCase()===String(company.data?.legal_name||"").trim().toLowerCase());
  const contactEmail=String(company.data?.contact_email||company.data?.email||"").trim().toLowerCase();
  const contactName=String(company.data?.contact_name||"").trim().toLowerCase();
  const contact=people.find(p=>
   contactEmail&&String(p.data?.email||"").trim().toLowerCase()===contactEmail)||
   people.find(p=>contactName&&[p.data?.first_name,p.data?.last_name].filter(Boolean).join(" ").trim().toLowerCase()===contactName)||
   (company.data?.contact_person_id?loaded[0].find(p=>p.id===company.data.contact_person_id):null);
  const contactHolder=document.querySelector("[data-company-contact-profile]");
  if(contactHolder){
   contactHolder.disabled=false;
   contactHolder.dataset.personId=contact?.id||"";
   contactHolder.textContent=contact?"View contact profile":"Add contact to People";
  }
  const render=(kind,items)=>{
   const holder=document.querySelector('[data-company-rows="'+kind+'"]');
   if(!holder)return;
   holder.innerHTML=items.length?items.map(r=>{
    const name=kind==="locations"?(r.data?.name||"Location"):
     [r.data?.first_name,r.data?.last_name].filter(Boolean).join(" ")||r.data?.email||"Staff member";
    const subtitle=kind==="locations"?
      [r.data?.address,r.data?.city,r.data?.state].filter(Boolean).join(", "):
      [r.data?.job_title,r.data?.email].filter(Boolean).join(" · ");
    return '<div class="company-related-item"><div><strong>'+esc(name)+'</strong><small>'+esc(subtitle)+'</small></div>'+
    '<div class="company-related-actions">'+
    (kind==="people"?'<button type="button" data-company-person="'+esc(r.id)+'">Profile</button>':'')+
    '<button type="button" data-company-remove="'+esc(r.id)+'" data-related-kind="'+kind+'">Remove</button>'+
    '</div></div>';
   }).join(""):'<p class="company-related-empty">No '+(kind==="people"?"staff":"locations")+' linked yet.</p>';
  };
  render("people",people.filter(r=>r.data?.relationship==="staff"||r.data?.relationship==="contact"||r.data?.company_id===company.id));
  render("locations",locations);
  const billingHolder=document.querySelector("[data-company-invoices]");
  if(billingHolder)billingHolder.innerHTML=invoices.length?
   invoices.slice(0,5).map(r=>'<button type="button" class="company-invoice-row" data-company-invoice="'+esc(r.id)+'">'+
    '<span>'+esc(r.data?.name||r.data?.invoice_number||"Invoice")+'</span>'+
    '<strong>'+esc(r.data?.amount!==undefined?"$"+r.data.amount:String(r.data?.status||""))+'</strong></button>').join(""):
   '<p class="company-related-empty">No invoices linked to this company.</p>';
 }catch(error){
  for(const kind of ["people","locations"]){
   const holder=document.querySelector('[data-company-rows="'+kind+'"]');
   if(holder)holder.innerHTML='<p class="company-related-empty">Unable to load '+esc(kind)+': '+esc(error.message)+'</p>';
  }
 }
}
function companyRelatedPanel(kind,canWrite,hasRecord){
 const people=kind==="people",title=people?"Company staff":"Company locations";
 return '<section class="employer-side-panel company-related-panel">'+
  '<div class="company-related-heading"><h2>'+title+'</h2>'+
  (canWrite&&hasRecord?'<button type="button" data-company-add="'+kind+'">+ Add</button>':"")+'</div>'+
  '<div class="company-related-list" data-company-rows="'+kind+'">'+
  (hasRecord?'<p class="company-related-empty">Loading '+title.toLowerCase()+'…</p>':
   '<p class="company-related-empty">Save the company before adding '+(people?"staff.":"locations.")+'</p>')+
  '</div></section>';
}
function openCompanyAdd(kind,asContact=false){
 const company=currentCompany();
 if(!company||!["people","locations"].includes(kind))return;
 companyAction={action:"add",kind,companyId:company.id,asContact};
 const specs=kind==="locations"?
  [["name","Location name","text",true],["address","Street address","text"],["city","City","text"],["state","State","text"],["zip","ZIP","text"],["phone","Phone","tel"]]:
  [["first_name","First name","text",true],["last_name","Last name","text",true],["job_title","Title","text"],["email","Email","email"],["phone","Phone","tel"]];
 $("modalTitle").textContent=kind==="locations"?"Add company location":asContact?"Add company contact":"Add company staff";
 $("modalDescription").textContent=company.data.legal_name||"Company";
 $("recordFields").innerHTML='<div class="company-modal-grid">'+specs.map(([name,label,type,required])=>
  '<label><span>'+label+(required?" *":"")+'</span><input name="'+name+'" type="'+type+'"'+(required?" required":"")+' maxlength="250"></label>').join("")+'</div>';
 if(asContact){
  const d=company.data||{},names=String(d.contact_name||"").trim().split(/\s+/);
  const first=$("recordFields").querySelector('[name="first_name"]'),last=$("recordFields").querySelector('[name="last_name"]'),email=$("recordFields").querySelector('[name="email"]'),phone=$("recordFields").querySelector('[name="phone"]');
  if(first)first.value=names[0]||"";
  if(last)last.value=names.slice(1).join(" ");
  if(email)email.value=d.contact_email||d.email||"";
  if(phone)phone.value=d.phone||"";
 }
 $("recordForm").dataset.mode="company-related-add";
 $("saveRecord").hidden=false;$("saveRecord").disabled=false;$("saveRecord").className="btn primary";
 $("saveRecord").textContent="Add "+(kind==="locations"?"location":"staff member");
 $("formMessage").textContent="";
 $("modal").hidden=false;document.body.classList.add("modal-open");
 $("recordFields").querySelector("input")?.focus();
}
function confirmCompanyRemove(kind,id){
 const company=currentCompany(),item=companyChildList(kind,company).find(r=>r.id===id);
 if(!item)return message("Linked record not found. Refresh the company.",true);
 companyAction={action:"remove",kind,id,companyId:company.id};
 $("modalTitle").textContent=kind==="people"?"Remove staff member":"Remove location";
 $("modalDescription").textContent="This archives the linked record; it does not delete historical records.";
 $("recordFields").innerHTML='<div class="archive-summary"><strong>'+esc(recordTitle(item))+'</strong></div>';
 $("recordForm").dataset.mode="company-related-remove";
 $("saveRecord").hidden=false;$("saveRecord").disabled=false;$("saveRecord").className="btn danger";
 $("saveRecord").textContent="Confirm removal";$("formMessage").textContent="";
 $("modal").hidden=false;document.body.classList.add("modal-open");
}
async function submitCompanyAction(){
 const op=companyAction,button=$("saveRecord"),company=currentCompany();
 if(!op||!company||op.companyId!==company.id)return;
 button.disabled=true;
 try{
  if(op.action==="add"){
   const form=$("recordForm");if(!form.reportValidity()){button.disabled=false;return}
   const data=Object.fromEntries(new FormData(form).entries());
   data.company_id=company.id;
   data.employer=company.data.legal_name;
   if(op.kind==="people"){data.relationship=op.asContact?"contact":"staff";data.status="active"}
   await api("save",{tenant_id:state.tenantId,operating_context:state.context,
    kind:op.kind,record_context:company.operating_context,id:null,data});
  }else{
   await api("archive",{tenant_id:state.tenantId,operating_context:state.context,kind:op.kind,id:op.id});
  }
  state.cache.delete(cacheKey(op.kind));
  closeModal();companyAction=null;
  message(op.action==="add"?"Company record added.":"Company record removed.");
  await hydrateCompanyRelations();
 }catch(error){$("formMessage").textContent=error.message;button.disabled=false}
}
async function openCompanyPerson(id){
 const company=currentCompany();
 if(!company)return;
 const person=companyChildList("people",company).find(p=>p.id===id);
 if(!person)return message("People profile not available.",true);
 switchPage("people");
 if(state.cache.get(cacheKey()))openManagement("view",id);
 else state.pendingManagement={action:"view",id,section:"people"};
}
function renderEmployerManagement(record,mode,canWrite,kind="employers"){
 const view=mode==="view",newRecord=mode==="new",id=record?.id||"";
 const isOwner=kind==="owner_operators",plural=isOwner?"Owner-Operators":"Employers",singular=isOwner?"owner-operator":"employer";
 const d=record?.data||{};
 const list=fields(kind);
 const groups=(isOwner?OWNER_OPERATOR_GROUPS:EMPLOYER_GROUPS).map(([heading,names])=>{
  const selected=names.map(name=>list.find(f=>f.name===name)).filter(Boolean);
  if(view){
   return managementOverviewGroup(heading,selected.map(f=>[f.label,d[f.name]]));
  }
  return managementSection(heading,selected,record);
 }).join("");
 const current=record?.operating_context||state.context;
 const shared=!record&&["owner","admin"].includes(activeWorkspace()?.role||"");
 const contextBlock=view?
  managementOverviewGroup("Operating context",[["Workspace",current==="shared"?"DOT and NON-DOT":current.toUpperCase()]])
  :'<section class="management-section"><header class="management-section-header"><h2>Operating context</h2></header>'+
   '<div class="manage-form-grid"><label class="manage-field manage-context"><span>Record context</span><select name="record_context"'+(record?' disabled':'')+'>'+
   '<option value="'+esc(current)+'">'+esc(current.toUpperCase())+'</option>'+
   (shared?'<option value="shared">DOT and NON-DOT</option>':"")+'</select></label></div></section>';
 const rightLinks=EMPLOYER_RELATED.map(([page,name])=>
  '<button type="button" class="employer-side-link" data-employer-related="'+page+'"'+(record?'':' disabled')+'>'+
  '<span class="employer-side-icon">'+navIcon(page)+'</span><span>'+esc(name)+'</span><span aria-hidden="true">›</span></button>').join("");
 const shortcuts=EMPLOYER_QUICK.map(([page,name])=>
  '<button type="button" class="employer-side-link" data-employer-create="'+page+'"'+(record?'':' disabled')+'>'+
  '<span class="employer-side-icon">'+navIcon(page)+'</span><span>'+esc(name)+'</span><span aria-hidden="true">+</span></button>').join("");
 const contactProfile=record?'<div class="company-contact-action"><button type="button" class="btn secondary" data-company-contact-profile disabled>Finding contact profile…</button></div>':"";
 const side='<aside class="employer-management-side">'+
  companyRelatedPanel("locations",canWrite,Boolean(record))+
  companyRelatedPanel("people",canWrite,Boolean(record))+
  '<section class="employer-side-panel company-related-panel"><div class="company-related-heading"><h2>Billing & invoices</h2>'+
   (record?'<button type="button" data-employer-related="invoices">Manage</button>':"")+'</div>'+
   '<div class="company-related-list" data-company-invoices>'+
   (record?'<p class="company-related-empty">Loading billing records…</p>':'<p class="company-related-empty">Save the company to manage invoices.</p>')+
   '</div></section>'+
  '<section class="employer-side-panel"><h2>Related management</h2><div class="employer-side-links">'+rightLinks+'</div></section>'+
  '<section class="employer-side-panel"><h2>Quick actions</h2><div class="employer-side-links">'+shortcuts+'</div></section>'+
  (record?'<section class="employer-side-panel employer-record-facts"><h2>Account information</h2><dl><div><dt>Last updated</dt><dd>'+
   esc(new Date(record.updated_at).toLocaleDateString())+'</dd></div>'+
   '<div><dt>Operating context</dt><dd>'+esc(current==="shared"?"DOT and NON-DOT":current.toUpperCase())+'</dd></div></dl></section>':"")+
 '</aside>';
 if(view){
  $("pageContent").innerHTML='<div class="employer-workspace">'+employerSummary(record,false,kind)+
   '<div class="employer-management-grid"><div class="employer-management-main employer-profile-main">'+groups+contactProfile+contextBlock+
   '<div class="employer-workspace-footer"><button type="button" class="btn secondary" data-back-list>Back to '+esc(plural)+'</button>'+
   (canWrite?'<button type="button" class="btn primary" data-manage-edit="'+esc(id)+'">Edit company details</button>':'')+
   '</div></div>'+side+'</div></div>';
  if(record)void hydrateCompanyRelations();
  return;
 }
 $("pageContent").innerHTML='<div class="employer-workspace">'+employerSummary(record,true,kind)+
  '<div class="employer-management-grid"><div class="employer-management-main">'+
   '<form id="managementForm">'+groups+contactProfile+contextBlock+
   '<p class="manage-form-error" id="managementError" role="alert"></p>'+
   '<footer class="employer-workspace-footer">'+
   '<button type="button" class="btn secondary" data-back-list>Cancel</button>'+
   (record?'<button type="button" class="btn secondary" id="saveEmployerContinue">Save & continue</button>':"")+
   '<button type="submit" class="btn primary" id="managementSave">'+
   (record?"Save changes":"Create "+singular)+'</button></footer></form></div>'+side+'</div></div>';
 $("managementForm").querySelector("input,select,textarea")?.focus({preventScroll:true});
 if(record)void hydrateCompanyRelations();
}
function renderManagementPage(){
 const m=state.management;
 if(!m||m.section!==state.page)return;
 const record=m.id?(state.cache.get(cacheKey())?.records||[]).find(r=>r.id===m.id):null;
 if(m.action!=="new"&&!record){
  $("pageContent").innerHTML='<section class="directory-panel directory-empty"><h2>Record unavailable</h2><p>Reload the management list to review this record.</p><button type="button" class="btn primary" data-back-list>Return to management</button></section>';
  return;
 }
 const singular=singularLabel(state.page),isEmployer=["employers","owner_operators"].includes(state.page);
 const title=m.action==="new"?"Add "+singular:m.action==="edit"?"Edit "+singular:
  isEmployer?recordTitle(record):"View "+singular;
 $("pageTitle").textContent=title;$("topTitle").textContent=title;
 updateBreadcrumbs(m.action);
 $("pageActions").innerHTML='<button type="button" class="btn secondary" data-back-list>Back to '+esc(label(state.page))+'</button>';
 const canWrite=["owner","admin","editor"].includes(activeWorkspace()?.role||"");
 const context=record?.operating_context||state.context;
 if(isEmployer){
  renderEmployerManagement(record,m.action,canWrite,state.page);
  return;
 }
 if(m.action==="view"){
  const d=record.data||{};
  const sections=isEmployer?[
   managementOverviewGroup("Company information",[
    ["Legal name",d.legal_name],["USDOT number",d.dot_number],["Operating context",context==="shared"?"DOT and NON-DOT":context.toUpperCase()]
   ]),
   managementOverviewGroup("Primary contact",[
    ["Contact name",d.contact_name],["Email",d.contact_email],["Phone",d.phone]
   ])
  ]:[
   managementOverviewGroup("Record information",fields(state.page).filter(f=>f.type!=="file").map(f=>[f.label,d[f.name]])),
   managementOverviewGroup("Additional information",Object.entries(d).filter(([key,value])=>
    !key.startsWith("_")&&!["storage_bucket","storage_path","mime_type","size_bytes","file_url"].includes(key)&&
    !fields(state.page).some(f=>f.name===key)&&value!==undefined&&value!==null).map(([key,value])=>[key.replaceAll("_"," "),value]))
  ];
  $("pageContent").innerHTML=
   '<div class="management-profile"><div class="profile-identity"><span class="profile-identity-icon">'+navIcon(state.page)+'</span>'+
   '<div class="profile-identity-name"><strong>'+esc(recordTitle(record))+'</strong>'+
   '<span>'+esc(label(state.page))+' · '+esc(context==="shared"?"DOT and NON-DOT":context.toUpperCase())+'</span></div>'+
   recordStatus(record)+'</div>'+
   '<div class="profile-sections">'+sections.join("")+'</div>'+
   (DOCUMENT_PAGES.has(state.page)&&d.storage_path?'<div class="document-file-actions"><button type="button" class="btn secondary" data-preview-file="'+esc(record.id)+'">View File</button><button type="button" class="btn primary" data-open-file="'+esc(record.id)+'">Download File</button></div>':"")+
   '<div class="profile-toolbar"><span class="profile-updated">Updated '+esc(new Date(record.updated_at).toLocaleDateString())+'</span>'+
   '<div class="profile-buttons"><button type="button" class="btn secondary" data-back-list>Back to '+esc(label(state.page))+'</button>'+
   (canWrite?'<button type="button" class="btn primary" data-manage-edit="'+esc(record.id)+'">Edit '+esc(singular)+'</button>':'')+
   '</div></div></div>';
  return;
 }
 const list=fields(state.page);
 let body="";
 if(isEmployer){
  const pick=names=>list.filter(f=>names.includes(f.name));
  body=managementSection("Company information",pick(["legal_name","dot_number","status"]),record)+
    managementSection("Primary contact",pick(["contact_name","contact_email","phone"]),record);
 }else{
  body=managementSection("Record information",list,record);
 }
 const shared=!record&&["owner","admin"].includes(activeWorkspace()?.role||"");
 const contextPicker='<section class="management-section"><header class="management-section-header"><h2>Operating context</h2></header>'+
  '<div class="manage-form-grid"><label class="manage-field manage-context"><span>Record context</span>'+
  '<select name="record_context"'+(record?' disabled':'')+'><option value="'+esc(context)+'">'+esc(context.toUpperCase())+'</option>'+
  (shared?'<option value="shared">DOT and NON-DOT</option>':"")+'</select></label></div></section>';
 $("pageContent").innerHTML='<div class="management-editor"><form id="managementForm">'+body+contextPicker+
   (DOCUMENT_PAGES.has(state.page)?'<p class="upload-help" id="uploadHelp">PDF, image, text, or Word document. Maximum file size: 8 MB.</p>':"")+
   '<p class="manage-form-error" id="managementError" role="alert"></p>'+
   '<footer class="management-editor-actions"><button type="button" class="btn secondary" data-back-list>Cancel</button>'+
   '<button type="submit" class="btn primary" id="managementSave">'+(record?"Save changes":"Create "+esc(singular))+'</button></footer>'+
   '</form></div>';
 $("managementForm").querySelector("input,select,textarea")?.focus({preventScroll:true});
}
function leaveManagement(push=true){
 state.management=null;state.editing=null;
 if(push)history.pushState({},"","/unified.html?page="+encodeURIComponent(state.page));
 updateHeading();const stored=state.cache.get(cacheKey());
 if(stored)showRecords(stored.records);else void loadRecords();
 message("");
}
async function uploadManagementFile(file,documentData,recordContext,recordId){
 if(file.size>8*1024*1024)throw Error("The document must be 8 MB or smaller.");
 const allowed=["application/pdf","image/png","image/jpeg","image/webp","text/plain","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
 if(!allowed.includes(file.type))throw Error("Unsupported document type.");
 const dataUrl=await new Promise((resolve,reject)=>{
  const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error("Unable to read document."));reader.readAsDataURL(file);
 });
 return api("upload_file",{tenant_id:state.tenantId,kind:state.page,
  record_id:recordId,record_context:recordContext,document_data:documentData,
  filename:file.name,mime_type:file.type,base64:String(dataUrl).split(",")[1]||""});
}
async function openDocumentFile(id,mode="download"){
 const record=state.cache.get(cacheKey())?.records.find(r=>r.id===id);
 if(!record){message("Document unavailable. Refresh the list.",true);return}
 try{
  const result=await api("document_link",{tenant_id:state.tenantId,operating_context:state.context,kind:state.page,id});
  if(!result.url||!result.url.startsWith("https://"))throw Error("Document link unavailable.");
  const name=String(record.data?.file_name||record.data?.title||"Workforce document");
  if(mode==="preview"){
   $("modalTitle").textContent="Document Preview";
   $("modalDescription").textContent=name;
   const mime=record.data?.mime_type||"";
   const previewable=!mime||mime==="application/pdf"||mime.startsWith("image/")||mime==="text/plain";
   $("recordFields").innerHTML='<div class="document-preview">'+
     (previewable?'<iframe src="'+esc(result.url)+'" title="Document preview" loading="lazy" referrerpolicy="no-referrer"></iframe>':
      '<p>Preview is unavailable for this file type. Use Download File.</p>')+
     '<button type="button" class="btn primary" data-modal-download="'+esc(id)+'">Download File</button></div>';
   $("recordForm").dataset.mode="view";$("saveRecord").hidden=true;$("cancelModal").textContent="Close";
   $("formMessage").textContent="";$("modal").hidden=false;document.body.classList.add("modal-open");
   $("modalClose").focus();
   return;
  }
  const response=await fetch(result.url,{cache:"no-store"});
  if(!response.ok)throw Error("Unable to download this document.");
  const blob=await response.blob(),blobUrl=URL.createObjectURL(blob);
  const link=document.createElement("a");link.href=blobUrl;link.download=name;
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(blobUrl),30000);
 }catch(error){message(error.message,true)}
}
async function submitManagement(form,continueEditing=false){
 const m=state.management;
 if(!m||!form.reportValidity())return;
 const button=$("managementSave");button.disabled=true;
 const data=Object.fromEntries(new FormData(form).entries()),recordContext=data.record_context||state.context;
 delete data.record_context;
 const file=data.document_file;delete data.document_file;
 for(const f of fields(state.page))if(f.type==="number"&&data[f.name]!=="")data[f.name]=Number(data[f.name]);
 $("managementError").textContent="";
 try{
  let uploaded=false;
  if(DOCUMENT_PAGES.has(state.page)){
   if(file instanceof File&&file.size){
    await uploadManagementFile(file,data,recordContext,m.id||null);
    uploaded=true;
   }else if(!m.id)throw Error("Select a document file before saving.");
  }
  if(!uploaded)await api("save",{tenant_id:state.tenantId,operating_context:state.context,
   kind:state.page,record_context:recordContext,id:m.id||null,data});
  state.cache.delete(cacheKey());
  if(continueEditing&&m.id){
   message("Company details saved successfully.");
   void loadRecords(state.sequence,true);
  }else{
   leaveManagement();
   message(m.action==="new"?"Record created successfully.":"Record updated successfully.");
   void loadRecords();
  }
 }catch(error){$("managementError").textContent=error.message;button.disabled=false}
}
function statusLabel(value){
 return String(value||"Not set").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
}
function statusClass(value){
 const v=String(value||"").toLowerCase();
 if(["active","completed","complete","approved","paid","delivered","received"].includes(v))return "positive";
 if(["inactive","archived","cancelled","void","revoked","failed"].includes(v))return "muted";
 return "pending";
}
function recordStatus(record){
 const value=record.data?.status||record.data?.account_status||record.data?.setup_status||"";
 return '<span class="mgmt-status '+statusClass(value)+'"><span class="status-dot"></span>'+esc(statusLabel(value))+'</span>';
}
function showRecords(records){
 if(state.page==="dashboard"){renderDashboard(records);return}
 const count=records.length,query=state.search.trim().toLowerCase();
 const statuses=[...new Set(records.map(r=>String(r.data?.status||"").trim()).filter(Boolean))].sort();
 const visible=records.filter(r=>(!query||Object.values(r.data||{}).some(v=>String(v??"").toLowerCase().includes(query)))&&(!state.statusFilter||String(r.data?.status||"")===state.statusFilter));
 const pageSize=25,maxPage=Math.max(0,Math.ceil(visible.length/pageSize)-1);
 state.pageIndex=Math.min(Math.max(0,state.pageIndex||0),maxPage);
 const displayed=visible.slice(state.pageIndex*pageSize,(state.pageIndex+1)*pageSize);
 const canWrite=["owner","admin","editor"].includes(activeWorkspace()?.role||"");
 $("newRecord")?.toggleAttribute("disabled",!canWrite);
 const isEmployer=state.page==="employers";
 const second=isEmployer?"USDOT number":"Details";
 const third=isEmployer?"Primary contact":"Last updated";
 const columnFields=fields(state.page).filter(f=>!["file","textarea"].includes(f.type)&&!["name","title","legal_name","status"].includes(f.name)).slice(0,2);
 const directoryRows=displayed.map(r=>{
  const data=r.data||{},name=recordTitle(r);
  const dot=r.operating_context==="shared"?"Shared":r.operating_context==="dot"?"DOT":"NON-DOT";
  const secondary=isEmployer
   ?'<span class="directory-secondary">'+esc(data.contact_email||"No contact email")+'</span>'
   :'<span class="directory-secondary">'+esc(label(r.kind))+' · '+dot+'</span>';
  const middle=isEmployer?esc(data.dot_number||"—"):
   esc(columnFields.map(f=>data[f.name]).filter(v=>v!==null&&v!==undefined&&v!=="").join(" · ")||"—");
  const contact=isEmployer?'<span class="directory-contact">'+esc(data.contact_name||"Not assigned")+'</span>':esc(new Date(r.updated_at).toLocaleDateString());
  const open='<button type="button" class="directory-name" data-view="'+esc(r.id)+'" aria-label="View '+esc(name)+'">'+esc(name)+'</button>';
  const actions='<div class="directory-actions"><button type="button" class="btn secondary btn-sm" data-view="'+esc(r.id)+'">View</button>'+
   (DOCUMENT_PAGES.has(state.page)&&data.storage_path?'<button type="button" class="btn secondary btn-sm" data-open-file="'+esc(r.id)+'">Download</button>':"")+
   (canWrite?'<button type="button" class="btn secondary btn-sm" data-edit="'+esc(r.id)+'">Edit</button>'+
    '<button type="button" class="btn-archive" data-archive="'+esc(r.id)+'" aria-label="Archive '+esc(name)+'" title="Archive">Archive</button>':"")+'</div>';
  return '<div class="directory-row">'+
    '<div class="directory-identity"><span class="directory-icon">'+navIcon(state.page)+'</span>'+
    '<div class="directory-names">'+open+secondary+'</div></div>'+
    '<div class="directory-field"><small>'+esc(second)+'</small><strong>'+middle+'</strong></div>'+
    '<div class="directory-field"><small>'+esc(third)+'</small><strong>'+contact+'</strong></div>'+
    '<div class="directory-state">'+recordStatus(r)+'</div>'+actions+'</div>';
 }).join("");
 $("pageContent").innerHTML='<section class="directory-panel">'+
  '<div class="directory-toolbar"><div class="directory-search"><svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>'+
  '<input id="recordSearch" type="search" aria-label="Search '+esc(label(state.page))+'" placeholder="Search '+esc(label(state.page).toLowerCase())+'..." value="'+esc(state.search)+'"></div>'+
  (statuses.length?'<select id="statusFilter" aria-label="Filter by status"><option value="">All statuses</option>'+
   statuses.map(v=>'<option value="'+esc(v)+'"'+(state.statusFilter===v?' selected':'')+'>'+esc(statusLabel(v))+'</option>').join("")+'</select>':"")+
  '<span class="directory-total">'+visible.length+' '+(visible.length===1?'record':'records')+'</span></div>'+
  (visible.length?'<div class="directory-list"><div class="directory-head"><span>'+esc(isEmployer?"Company":label(state.page))+'</span><span>'+esc(second)+'</span><span>'+esc(third)+'</span><span>Status</span><span>Actions</span></div>'+directoryRows+'</div>':
  '<div class="directory-empty"><div class="directory-empty-icon">'+navIcon(state.page)+'</div><h2>'+esc(query||state.statusFilter?"No matching records":"No "+label(state.page).toLowerCase()+" yet")+'</h2>'+
  '<p>'+(query||state.statusFilter?"Adjust your search or status filter to see matching records.":"Get started by adding your first record.")+'</p>'+
  (canWrite&&!query&&!state.statusFilter?'<button class="btn primary" type="button" data-create="1">Add '+esc(label(state.page))+'</button>':"")+'</div>')+
  (visible.length>pageSize?'<div class="table-pagination"><button type="button" data-page-step="-1"'+(state.pageIndex===0?' disabled':'')+'>Previous</button>'+
   '<span>Page '+(state.pageIndex+1)+' of '+(maxPage+1)+'</span>'+
   '<button type="button" data-page-step="1"'+(state.pageIndex===maxPage?' disabled':'')+'>Next</button></div>':"")+'</section>';
}
function closeModal(){$("modal").hidden=true;document.body.classList.remove("modal-open");state.editing=null;$("recordForm").dataset.mode=""}
async function saveRecord(event){
 event.preventDefault();
 const mode=$("recordForm").dataset.mode;
 if(mode==="company-related-add"||mode==="company-related-remove"){await submitCompanyAction();return}
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
 $("pageBreadcrumbs").addEventListener("click",e=>{
  const page=e.target.closest("[data-page]")?.dataset.page;
  if(!page||!CONFIG[page])return;
  if(page===state.page&&state.management)leaveManagement();
  else switchPage(page);
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
 setupSidebarToggle();
 $("pageActions").addEventListener("click",e=>{
  if(e.target.closest("[data-back-list]")){leaveManagement();return}
  if(e.target.closest("#newRecord")){openManagement("new");return}
  if(e.target.closest("#refreshPage")){void (state.page==="lab_analytics"?renderLabAnalytics(true):loadRecords(state.sequence,true,true));return}
  if(e.target.closest("#exportPage")){exportRecords();return}
 });
 $("notice").addEventListener("click",e=>{if(e.target.closest(".notice-close"))message("")});
 $("pageContent").addEventListener("click",e=>{
  const target=e.target;
  const view=target.closest("[data-view]"),edit=target.closest("[data-edit]"),archive=target.closest("[data-archive]"),create=target.closest("[data-create]"),goto=target.closest("[data-goto]"),retry=target.closest("#retryLoad"),openFile=target.closest("[data-open-file]"),previewFile=target.closest("[data-preview-file]"),step=target.closest("[data-page-step]");
  const quick=target.closest("[data-dashboard-create]"),activity=target.closest("[data-dashboard-record]");
  if(quick){
   const destination=quick.dataset.dashboardCreate;
   if(CONFIG[destination]){
    switchPage(destination);
    if(state.cache.get(cacheKey()))openManagement("new");
    else state.pendingManagement={action:"new",id:null,section:destination};
   }
   return;
  }
  if(activity){
   const destination=activity.dataset.dashboardKind,id=activity.dataset.dashboardRecord;
   if(CONFIG[destination]&&id){
    switchPage(destination);
    if(state.cache.get(cacheKey()))openManagement("view",id);
    else state.pendingManagement={action:"view",id,section:destination};
   }
   return;
  }
  if(target.closest("[data-company-add]")){openCompanyAdd(target.closest("[data-company-add]").dataset.companyAdd);return}
  if(target.closest("[data-company-remove]")){
   const b=target.closest("[data-company-remove]");confirmCompanyRemove(b.dataset.relatedKind,b.dataset.companyRemove);return
  }
  if(target.closest("[data-company-person]")){void openCompanyPerson(target.closest("[data-company-person]").dataset.companyPerson);return}
  if(target.closest("[data-company-contact-profile]")){
   const id=target.closest("[data-company-contact-profile]").dataset.personId;
   if(id)void openCompanyPerson(id);else openCompanyAdd("people",true);
   return;
  }
  if(target.closest("[data-company-invoice]")){
   const id=target.closest("[data-company-invoice]").dataset.companyInvoice;
   switchPage("invoices");
   if(state.cache.get(cacheKey()))openManagement("view",id);
   else state.pendingManagement={action:"view",id,section:"invoices"};
   return;
  }
  const employerRelated=target.closest("[data-employer-related]");
  const employerCreate=target.closest("[data-employer-create]");
  if(employerRelated||employerCreate){
   const page=(employerRelated||employerCreate).dataset.employerRelated||(employerRelated||employerCreate).dataset.employerCreate;
   const company=state.editing?.data?.legal_name||"";
   if(!CONFIG[page])return;
   const creating=Boolean(employerCreate),filterable=["people","programs","pools","testing_orders"].includes(page);
   switchPage(page);
   if(creating){
    if(state.cache.get(cacheKey()))openManagement("new");
    else state.pendingManagement={action:"new",id:null,section:page};
   }else if(filterable&&company){
    state.search=company;state.pageIndex=0;
    const cached=state.cache.get(cacheKey());
    if(cached)showRecords(cached.records);
   }
   return;
  }
  if(target.closest("#saveEmployerContinue")){
   const form=target.closest("#managementForm");
   if(form)void submitManagement(form,true);
   return;
  }
  if(previewFile)void openDocumentFile(previewFile.dataset.previewFile,"preview");
  else if(openFile)void openDocumentFile(openFile.dataset.openFile);
  else if(view)openManagement("view",view.dataset.view);
  else if(edit)openManagement("edit",edit.dataset.edit);
  else if(archive)archiveRecord(archive.dataset.archive);
  else if(create)openManagement("new");
  else if(goto)switchPage(goto.dataset.goto);
  else if(retry)void loadRecords();
  else if(step){state.pageIndex+=Number(step.dataset.pageStep);showRecords(state.cache.get(cacheKey())?.records||[])}
  else if(target.closest("#editProfile"))void editProfile();
  else if(target.closest("[data-back-list]"))leaveManagement();
  else if(target.closest("[data-manage-edit]"))openManagement("edit",target.closest("[data-manage-edit]").dataset.manageEdit);
 });
 $("pageContent").addEventListener("change",e=>{
  if(e.target.id==="statusFilter"){
   state.statusFilter=e.target.value;state.pageIndex=0;
   showRecords(state.cache.get(cacheKey())?.records||[]);
  }
 });
 $("pageContent").addEventListener("input",e=>{
  if(e.target.id!=="recordSearch")return;
  const position=e.target.selectionStart;
  state.search=e.target.value;state.pageIndex=0;
  showRecords(state.cache.get(cacheKey())?.records||[]);
  const input=$("recordSearch");input.focus();input.setSelectionRange(position,position);
 });
 $("recordFields").addEventListener("click",e=>{const b=e.target.closest("[data-modal-download]");if(b)void openDocumentFile(b.dataset.modalDownload)});
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
 addEventListener("focus",()=>{if(!state.management&&!$("application").hidden&&state.cache.get(cacheKey())&&Date.now()-state.cache.get(cacheKey()).time>60000)void loadRecords(state.sequence,true)});
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