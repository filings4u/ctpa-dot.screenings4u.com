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
const companyAccountTypes=[["dot_employer","DOT Employer"],["owner_operator","Owner-Operator"],["nondot_employer","NON-DOT Employer"]];
const accountTypeLabel=(value)=>companyAccountTypes.find(([id])=>id===value)?.[1]||"DOT Employer";
const CONFIG={
 account:["Account","Your Workforce C/TPA company and signed-in account."],
 dashboard:["Dashboard","Single C/TPA operations dashboard across the selected records."],
 employers:["Employers","Manage employer organizations, contacts and identifiers.","legal_name|Legal name|text|required;dba_name|DBA / Trade name|text;dot_number|USDOT number|text;mc_number|MC number|text;ein|Tax ID / EIN|text;company_type|Company type|text;status|Status|select:active,pending,inactive;contact_name|Primary contact|text;contact_title|Contact title|text;contact_email|Contact email|email;phone|Phone|tel;secondary_phone|Secondary phone|tel;address_line1|Address line 1|text;address_line2|Address line 2|text;city|City|text;state|State|text;zip|ZIP / Postal code|text;country|Country|text;testing_program|Testing program|text;consortium_status|Consortium status|text;random_pool|Random pool|text;clearinghouse_status|Clearinghouse status|text;audit_status|New entrant audit status|text;occupational_health|Occupational health|select:enabled,disabled;billing_contact|Billing contact|text;billing_email|Billing email|email;billing_phone|Billing phone|tel;billing_address1|Billing address|text;billing_city|Billing city|text;billing_state|Billing state|text;billing_zip|Billing ZIP|text;billing_country|Billing country|text;payment_terms|Payment terms|text;mailing_address1|Mailing address|text;mailing_city|Mailing city|text;mailing_state|Mailing state|text;mailing_zip|Mailing ZIP|text;mailing_country|Mailing country|text;account_notes|Internal account notes|textarea"],
 owner_operators:["Owner-Operators","Manage owner-operator accounts and operating contacts.","legal_name|Legal name|text|required;dba_name|DBA / Trade name|text;dot_number|USDOT number|text;mc_number|MC number|text;ein|Tax ID / EIN|text;company_type|Company type|text;status|Status|select:active,pending,inactive;contact_name|Primary contact|text;contact_title|Contact title|text;email|Email|email;phone|Phone|tel;secondary_phone|Secondary phone|tel;address_line1|Address line 1|text;address_line2|Address line 2|text;city|City|text;state|State|text;zip|ZIP / Postal code|text;country|Country|text;testing_program|Testing program|text;consortium_status|Consortium status|text;random_pool|Random pool|text;clearinghouse_status|Clearinghouse status|text;audit_status|New entrant audit status|text;occupational_health|Occupational health|select:enabled,disabled;billing_contact|Billing contact|text;billing_email|Billing email|email;billing_phone|Billing phone|tel;billing_address1|Billing address|text;billing_city|Billing city|text;billing_state|Billing state|text;billing_zip|Billing ZIP|text;billing_country|Billing country|text;payment_terms|Payment terms|text;mailing_address1|Mailing address|text;mailing_city|Mailing city|text;mailing_state|Mailing state|text;mailing_zip|Mailing ZIP|text;mailing_country|Mailing country|text;account_notes|Internal account notes|textarea"],
 people:["People","Manage company-linked employees, contacts and staff.","first_name|First name|text|required;last_name|Last name|text|required;employee_number|Employee number|text;job_title|Position / Title|text;email|Email address|email;phone|Phone number|tel;status|Status|select:active,inactive;relationship|Person type|select:employee,contact,staff"],
 programs:["Programs","Manage regulatory testing programs, employers and enrollment.","name|Program name|text|required;program_type|Program type|select:DOT,NON-DOT;dot_agency|DOT agency|select:FMCSA,FAA,FRA,FTA,PHMSA,USCG;regulatory_authority|Regulatory authority|text;testing_panel|Testing panel|text;testing_method|Testing method|select:urine,oral fluid,blood,breath,hair;drug_random_rate|Annual random drug rate (%)|number;alcohol_random_rate|Annual random alcohol rate (%)|number;testing_frequency|Selection frequency|select:monthly,quarterly,semiannual,annual;effective_date|Effective date|date;status|Status|select:active,draft,inactive;regulatory_category|Regulatory category|text;notes|Program notes|textarea"],
 pools:["Pools","Manage random testing pools, eligibility and program assignments.","name|Pool name|text|required;pool_type|Pool type|select:consortium,employer;dot_agency|DOT agency|select:FMCSA,FAA,FRA,FTA,PHMSA,USCG;drug_testing_rate|Annual drug selection rate (%)|number;alcohol_testing_rate|Annual alcohol selection rate (%)|number;selection_schedule|Selection schedule|select:monthly,quarterly,semiannual,annual;effective_date|Effective date|date;status|Status|select:active,draft,inactive;notes|Internal notes|textarea"],
 selections:["Selections","Secure random selection records and results.","name|Selection reference|text|required;pool_name|Pool name|text;selection_date|Selection date|date;status|Status|select:locked,completed"],
 testing_orders:["Testing Orders","Submit testing requests to Workforce Testing Operations.","name|Reference|text|required;employee|Donor|text;employer|Company|text;test_type|Test type|text;status|Status|select:awaiting_schedule,scheduled,completed,cancelled"],
 testing_documents:["Testing Documents","Secure management of all drug and alcohol testing files.","title|Document title|text|required;document_type|Document category|text;order_reference|Testing order|text;status|Status|select:received,verified,archived"],
 results:["Results","Track confidential test result metadata.","name|Result reference|text|required;order_reference|Order reference|text;status|Status|select:pending,received,reviewed;reported_at|Date reported|date;notes|Notes|textarea"],
 occupational_health:["Occupational Health","Order DOT and NON-DOT physicals and track Testing Operations processing."],
 compliance:["Compliance","Record employer and employee compliance findings, outcomes, notes and follow-up actions.","name|Case title|text|required;scope|Record applies to|select:company,employee;category|Compliance category|select:review,finding,violation,corrective_action,audit,other;review_date|Review date|date;outcome|Compliance outcome|select:pending,compliant,non_compliant,needs_review,not_applicable;findings|Findings and results|textarea|required;notes|Internal notes|textarea;corrective_action|Corrective action / follow-up|textarea;due_date|Follow-up due date|date;priority|Priority|select:low,normal,high,urgent;status|Status|select:open,in_progress,resolved,closed"],
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
   modules.filter(id=>!(state.context==="nondot"&&id==="owner_operators")).map(id=>'<button type="button" class="nav-item nav-child'+(state.page===id?" active":"")+
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
 $("pageActions").innerHTML=state.page==="results"?'<button class="btn secondary" type="button" id="refreshPage">Refresh</button>':state.page==="account"?"":state.page==="dashboard"||state.page==="lab_analytics"
  ?'<button class="btn secondary" type="button" id="refreshPage">Refresh</button>'
  :'<button class="btn secondary" type="button" id="refreshPage">Refresh</button><button class="btn secondary" type="button" id="exportPage">Export CSV</button><button class="btn primary" type="button" id="newRecord">'+(state.page==="selections"?"Run Selection":state.page==="testing_orders"?"Order a Test":state.page==="testing_documents"?"Upload Document":state.page==="occupational_health"?"Order Physical":state.page==="compliance"?"Add Compliance Record":state.page==="audits"?"Start New Entrant Audit":"Add "+esc(title))+'</button>';
}
function switchPage(page,push=true){
 if(!CONFIG[page])page="dashboard";
 if(state.context==="nondot"&&page==="owner_operators")page="employers";
 state.page=page;state.search="";state.statusFilter="";state.pageIndex=0;state.companyFilter=null;state.companyDraft=null;state.management=null;state.pendingManagement=null;const seq=++state.sequence;
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
 const nextPage=next==="nondot"&&state.page==="owner_operators"?"employers":state.page;
 history.replaceState(null,"","/unified.html?page="+encodeURIComponent(nextPage)+"&context="+next);
 switchPage(nextPage,false);
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
 if(state.page==="selections"&&action==="edit")action="view";
 if(state.page==="testing_orders"&&action==="edit")action="view";
 if(state.page==="results"&&action==="edit")action="view";
 if(state.page==="occupational_health"&&action==="edit")action="view";
 if(state.page==="results"&&action==="new"){message("Official results are issued by Testing Operations.",true);return;}
 if(state.page==="testing_orders"&&action==="new")drugOrderId=crypto.randomUUID();
 if(state.page==="occupational_health"&&action==="new")physicalRequestId=crypto.randomUUID();
 const records=state.cache.get(cacheKey())?.records||[];
 const record=id?records.find(r=>r.id===id):null;
 if(action!=="new"&&!record){message("Record not available. Refresh the management page.",true);return}
 if(action==="new"&&!["owner","admin","editor"].includes(activeWorkspace()?.role||"")){message("Your account is read-only.",true);return}
 if(action==="edit"&&!["owner","admin","editor"].includes(activeWorkspace()?.role||"")){message("You cannot edit this record.",true);return}
 state.editing=record||null;
 state.management={action,id,section:state.page,context:state.context};
 if(push)history.pushState({management:true},"",managementUrl(action,id));
 renderManagementPage();
 if(action==="new"&&state.companyDraft?.page===state.page){
  const draft=state.companyDraft;
  const form=$("managementForm");
  if(form){
   const companyField=form.elements.namedItem("employer")||form.elements.namedItem("client");
   if(companyField)companyField.value=draft.companyName;
  }
 }
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
    (kind==="people"?"":'<button type="button" data-company-remove="'+esc(r.id)+'" data-related-kind="'+kind+'">Remove</button>')+
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
 const isLocation=kind==="locations";
 const locationGroups=[
  ["Location details",[["name","Location name","text",true]]],
  ["Address",[["address","Street address","text"],["city","City","text"],["state","State","text"],["zip","ZIP code","text"]]],
  ["Contact",[["phone","Phone number","tel"]]]
 ];
 const peopleGroups=[
  ["Personal information",[["first_name","First name","text",true],["last_name","Last name","text",true],["job_title","Position / Title","text"]]],
  ["Contact information",[["email","Email address","email"],["phone","Phone number","tel"]]]
 ];
 const sections=isLocation?locationGroups:peopleGroups;
 $("modalTitle").textContent=isLocation?"Add company location":asContact?"Add company contact":"Add company staff";
 $("modalDescription").innerHTML='<span class="modal-company-context"><span class="modal-company-icon" aria-hidden="true">▣</span><span><small>ADDING TO COMPANY</small><strong>'+esc(company.data.legal_name||"Company")+'</strong></span></span>';
 const field=([name,label,type,required])=>
  '<label class="company-modal-field'+(name==="address"?' span-all':'')+'"><span>'+esc(label)+(required?' <b aria-hidden="true">*</b>':'')+'</span>'+
  '<input name="'+name+'" type="'+type+'"'+(required?' required':'')+' maxlength="250" autocomplete="off"></label>';
 $("recordFields").innerHTML='<div class="company-modal-sections">'+sections.map(([title,items])=>
  '<section class="company-modal-section"><h3>'+esc(title)+'</h3>'+
  '<div class="company-modal-grid">'+items.map(field).join("")+'</div></section>').join("")+'</div>';
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
 $("saveRecord").textContent=isLocation?"Save location":asContact?"Save contact":"Save staff member";
 $("formMessage").textContent="";
 $("modal").hidden=false;document.body.classList.add("modal-open");
 $("recordFields").querySelector("input")?.focus({preventScroll:true});
}
function confirmCompanyRemove(kind,id){
 const company=currentCompany(),item=companyChildList(kind,company).find(r=>r.id===id);
 if(!item)return message("Linked record not found. Refresh the company.",true);
 companyAction={action:"remove",kind,id,companyId:company.id};
 $("modalTitle").textContent=kind==="people"?"Remove staff member":"Remove location";
 $("modalDescription").textContent=kind==="people"?"Remove this person from the company staff list without deleting their People profile.":"Archive this company location while retaining its historical record.";
 $("recordFields").innerHTML='<div class="company-remove-confirm"><div class="company-remove-symbol" aria-hidden="true">!</div><div><strong>'+esc(recordTitle(item))+'</strong><p>'+(kind==="people"?"The People profile will remain available.":"The location record will be archived, not permanently deleted.")+'</p></div></div>';
 $("recordForm").dataset.mode="company-related-remove";
 $("saveRecord").hidden=false;$("saveRecord").disabled=false;$("saveRecord").className="btn danger";
 $("saveRecord").textContent="Remove "+(kind==="people"?"staff":"location");$("formMessage").textContent="";
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
  }else if(op.kind==="people"){
   const person=companyChildList("people",company).find(r=>r.id===op.id);
   if(!person)throw Error("The linked People record could not be found.");
   throw Error("People must remain connected to a company. Reassign the person from their profile, or archive the profile.");
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
 const defaultType=isOwner?"owner_operator":current==="nondot"?"nondot_employer":"dot_employer";
 const classification=record?.data?.account_type||defaultType;
 const contextBlock=view?
  managementOverviewGroup("Account classification",[["Account type",accountTypeLabel(classification)],
   ["Workspace",classification==="nondot_employer"?"NON-DOT":"DOT"]]):
  record?
   '<section class="management-section"><header class="management-section-header"><h2>Account classification</h2></header>'+
   '<div class="manage-form-grid"><div class="company-account-type-readonly"><strong>'+esc(accountTypeLabel(classification))+
   '</strong><span>Workspace: '+(classification==="nondot_employer"?"NON-DOT":"DOT")+'</span></div></div></section>':
   '<section class="management-section company-account-selector"><header class="management-section-header"><h2>Account classification</h2></header>'+
   '<div class="manage-form-grid"><label class="manage-field manage-context"><span>Account type *</span>'+
   '<select name="account_type" id="companyAccountType" required>'+
    '<option value="" selected disabled>Select account type</option>'+
    companyAccountTypes.map(([value,name])=>'<option value="'+value+'">'+esc(name)+'</option>').join("")+
   '</select><small>DOT Employer and Owner-Operator accounts appear in DOT. NON-DOT Employer accounts appear in NON-DOT.</small>'+
   '</label></div></section>';
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
   '<form id="managementForm">'+(newRecord?contextBlock:"")+groups+contactProfile+(newRecord?"":contextBlock)+
   '<p class="manage-form-error" id="managementError" role="alert"></p>'+
   '<footer class="employer-workspace-footer">'+
   '<button type="button" class="btn secondary" data-back-list>Cancel</button>'+
   (record?'<button type="button" class="btn secondary" id="saveEmployerContinue">Save & continue</button>':"")+
   '<button type="submit" class="btn primary" id="managementSave">'+
   (record?"Save changes":"Create "+singular)+'</button></footer></form></div>'+side+'</div></div>';
 $("managementForm").querySelector("input,select,textarea")?.focus({preventScroll:true});
 if(record)void hydrateCompanyRelations();
}

const PERSON_GROUPS=[
 ["Personal information",["first_name","last_name","employee_number"]],
 ["Contact details",["email","phone"]],
 ["Work information",["relationship","job_title","status"]]
];
async function loadPersonCompanies(){
 const m=state.management,seq=state.sequence;
 if(state.page!=="people"||!m)return;
 const selector=$("personCompanySelect"),holder=$("personCompanyHelp");
 if(!selector)return;
 const currentId=m.id?(state.cache.get(cacheKey())?.records||[]).find(r=>r.id===m.id)?.data?.company_id||"":state.companyDraft?.companyId||"";
 const options=[];
 try{
  for(const kind of state.context==="dot"?["employers","owner_operators"]:["employers"]){
   const key=cacheKey(kind),cached=state.cache.get(key);
   let records=cached?.records||[];
   if(!cached||Date.now()-cached.time>30000){
    const result=await api("list",{tenant_id:state.tenantId,operating_context:state.context,kind});
    records=result.records||[];
    state.cache.set(key,{records,time:Date.now()});
   }
   options.push(...records.filter(r=>r.operating_context===state.context));
  }
  if(seq!==state.sequence||state.page!=="people"||state.management!==m)return;
  selector.innerHTML='<option value="">Select company (required)</option>'+options.map(r=>
   '<option value="'+esc(r.id)+'">'+esc(r.data?.legal_name||"Unnamed company")+
   (r.kind==="owner_operators"?" · Owner-Operator":"")+'</option>').join("");
  if(currentId&&options.some(r=>r.id===currentId))selector.value=currentId;
  else if(!currentId){
   const prior=m.id?(state.cache.get(cacheKey())?.records||[]).find(r=>r.id===m.id)?.data?.employer||"":state.companyDraft?.companyName||"";
   const match=options.find(r=>prior&&r.data?.legal_name?.toLowerCase()===prior.toLowerCase());
   if(match)selector.value=match.id;
  }
  selector.disabled=!options.length;
  const submit=$("managementSave");
  if(submit)submit.disabled=!options.length;
  if(holder)holder.textContent=options.length?"Company assignment is required. People are listed under their associated employer.":"Create an employer or owner-operator in this workspace before adding people.";
  const link=$("personCompanyProfile");
  if(link){link.hidden=!selector.value;link.dataset.companyId=selector.value}
  selector.addEventListener("change",()=>{
   const link=$("personCompanyProfile");
   if(link){link.hidden=!selector.value;link.dataset.companyId=selector.value}
  });
 }catch(error){
  selector.innerHTML='<option value="">Companies unavailable</option>';
  selector.disabled=true;
  const submit=$("managementSave");if(submit)submit.disabled=true;
  if(holder)holder.textContent="Could not load companies: "+error.message;
 }
}
async function openPersonCompanyProfile(companyId){
 if(!companyId)return;
 try{
  for(const kind of state.context==="dot"?["employers","owner_operators"]:["employers"]){
   const key=cacheKey(kind),cached=state.cache.get(key);
   let records=cached?.records||[];
   if(!cached||!records.some(r=>r.id===companyId)){
    const result=await api("list",{tenant_id:state.tenantId,operating_context:state.context,kind});
    records=result.records||[];
    state.cache.set(key,{records,time:Date.now()});
   }
   if(records.some(r=>r.id===companyId)){
    switchPage(kind);
    if(state.cache.get(cacheKey()))openManagement("view",companyId);
    else state.pendingManagement={action:"view",id:companyId,section:kind};
    return;
   }
  }
  message("The linked company is not available in this workspace.",true);
 }catch(error){message("Unable to open company: "+error.message,true)}
}
function renderPersonManagement(record,mode,canWrite){
 const view=mode==="view",data=record?.data||{},isNew=mode==="new";
 const name=[data.first_name,data.last_name].filter(Boolean).join(" ")||"New person";
 const heading='<div class="person-identity"><span class="person-identity-symbol">'+navIcon("people")+'</span>'+
  '<div><strong>'+esc(name)+'</strong><small>'+esc(data.employer||"Company required")+' · '+esc(statusLabel(data.relationship||"employee"))+'</small></div>'+
  (record?recordStatus(record):'<span class="mgmt-status pending">New person</span>')+'</div>';
 const fieldDefs=fields("people");
 let groups=PERSON_GROUPS.map(([title,names])=>{
  const selected=names.map(n=>fieldDefs.find(f=>f.name===n)).filter(Boolean);
  return view?managementOverviewGroup(title,selected.map(f=>[f.label,data[f.name]])):
   managementSection(title,selected,record);
 }).join("");
 const companyDisplay=esc(data.employer||"Company affiliation missing");
 if(view){
  const affiliation='<section class="profile-section person-affiliation-view"><div class="profile-section-heading"><h2>Company affiliation</h2></div>'+
   '<div class="person-company-summary"><span>'+companyDisplay+'</span>'+
   (data.company_id?'<button class="btn secondary" type="button" data-person-company="'+esc(data.company_id)+'">View company</button>':"")+'</div></section>';
  $("pageContent").innerHTML='<div class="person-management">'+heading+groups+affiliation+
   '<footer class="person-actions"><button class="btn secondary" type="button" data-back-list>Back to People</button>'+
   (canWrite?'<button class="btn primary" type="button" data-manage-edit="'+esc(record.id)+'">Edit person</button>':"")+'</footer></div>';
  return;
 }
 const companySection='<section class="management-section person-company-section">'+
  '<header class="management-section-header"><h2>Company affiliation</h2></header>'+
  '<div class="manage-form-grid"><label class="manage-field person-company-picker"><span>Company affiliation <span class="required-mark">*</span></span>'+
  '<select id="personCompanySelect" name="company_selection" required disabled><option value="">Loading companies…</option></select>'+
  '<small id="personCompanyHelp">Loading authorized companies from this workspace…</small></label>'+
  '<div class="person-company-action"><button type="button" id="personCompanyProfile" class="btn secondary" data-person-company="" hidden>View company profile</button></div>'+
  '</div></section>';
 $("pageContent").innerHTML='<div class="person-management">'+heading+
  '<form id="managementForm">'+companySection+groups+
  '<p class="manage-form-error" id="managementError" role="alert"></p>'+
  '<footer class="person-actions"><button class="btn secondary" type="button" data-back-list>Cancel</button>'+
  '<button class="btn primary" type="submit" id="managementSave">'+(isNew?"Create person":"Save changes")+'</button></footer></form></div>';
 $("managementForm").querySelector("input")?.focus({preventScroll:true});
 const typeInput=$("managementForm")?.elements.namedItem("relationship");
 if(typeInput&&!typeInput.value)typeInput.value="employee";
 const statusInput=$("managementForm")?.elements.namedItem("status");
 if(statusInput&&!statusInput.value)statusInput.value="active";
 const submit=$("managementSave");if(submit)submit.disabled=true;
 void loadPersonCompanies();
}

const PROGRAM_SECTIONS=[
 ["Program information",["name","status","effective_date"]],
 ["Regulatory configuration",["dot_agency","regulatory_authority","regulatory_category","testing_panel","testing_method"]],
 ["Random testing",["drug_random_rate","alcohol_random_rate","testing_frequency"]],
 ["Notes",["notes"]]
];
async function prepareProgramManagement(){
 const m=state.management,seq=state.sequence;
 if(state.page!=="programs"||!m)return;
 const agency=$("manage-dot_agency"),select=$("programCompany"),guide=$("programRegulatoryGuidance");
 if(!select)return;
 const current=(m.id?(state.cache.get(cacheKey())?.records||[]).find(r=>r.id===m.id)?.data:null)||{};
 const choices=[];
 try{
  for(const kind of state.context==="dot"?["employers","owner_operators"]:["employers"]){
   const key=cacheKey(kind),cached=state.cache.get(key);
   let records=cached?.records||[];
   if(!cached||Date.now()-cached.time>30000){
    const result=await api("list",{tenant_id:state.tenantId,operating_context:state.context,kind});
    records=result.records||[];state.cache.set(key,{records,time:Date.now()});
   }
   choices.push(...records.filter(r=>r.operating_context===state.context));
  }
  if(state.page!=="programs"||state.management!==m||seq!==state.sequence)return;
  select.innerHTML='<option value="">Unassigned</option>'+choices.map(r=>
   '<option value="'+esc(r.id)+'">'+esc(r.data?.legal_name||"Unnamed company")+
   (r.kind==="owner_operators"?" · Owner-Operator":"")+'</option>').join("");
  const existing=current.company_id||state.companyDraft?.companyId||"";
  const selected=choices.find(r=>r.id===existing)||
   choices.find(r=>String(r.data?.legal_name||"").toLowerCase()===
    String(current.employer||state.companyDraft?.companyName||"").toLowerCase());
  if(selected)select.value=selected.id;
  select.disabled=false;
  if(state.context!=="dot"){
   guide.textContent="NON-DOT testing requirements are set by the company. DOT regulatory random-testing rates do not apply automatically.";
   return;
  }
  const response=await api("program_rules",{tenant_id:state.tenantId,operating_context:state.context});
  if(state.page!=="programs"||state.management!==m||seq!==state.sequence)return;
  state.programRules=response.rules||[];
  const draw=()=>{
   const rule=state.programRules.find(x=>x.dot_agency===agency?.value);
   if(!rule){
    guide.textContent="Select the DOT agency to review its current regulatory rule, where available.";
    return;
   }
   guide.innerHTML='<strong>'+esc(rule.rule_name||"Regulatory rule")+'</strong> · '+esc(rule.effective_date||"")+
    ' · Drug '+esc(rule.drug_rate==null?"not specified":String(rule.drug_rate)+"%")+
    ' · Alcohol '+esc(rule.alcohol_rate==null?"not specified":String(rule.alcohol_rate)+"%")+
    '<button type="button" data-program-apply-rule="'+esc(rule.dot_agency)+'">Apply rates</button>';
  };
  agency?.addEventListener("change",draw);draw();
 }catch(error){
  if(select.disabled)select.innerHTML='<option value="">Company list unavailable</option>';
  guide.textContent="Reference unavailable: "+error.message;
 }
}

let programAction=null;
async function hydrateProgramEnrollments(){
 const m=state.management,seq=state.sequence;
 if(state.page!=="programs"||!m?.id)return;
 const holder=$("programEnrollments");if(!holder)return;
 try{
  const key=cacheKey("enrollments"),cached=state.cache.get(key);
  let records=cached?.records||[];
  if(!cached||Date.now()-cached.time>30000){
   const result=await api("list",{tenant_id:state.tenantId,operating_context:state.context,kind:"enrollments"});
   records=result.records||[];
   state.cache.set(key,{records,time:Date.now()});
  }
  if(seq!==state.sequence||state.management!==m)return;
  const prog=(state.cache.get(cacheKey())?.records||[]).find(r=>r.id===m.id);
  const enrollments=records.filter(r=>r.data?.program_id===m.id||
   (prog?.data?.name&&r.data?.program===prog.data.name));
  holder.innerHTML=enrollments.length?enrollments.map(r=>
   '<div class="program-enrollment-row"><span><strong>'+esc(r.data?.participant||r.data?.name||"Company")+'</strong>'+
   '<small>'+esc(r.data?.status||"active")+'</small></span>'+
   '<button type="button" data-program-unenroll="'+esc(r.id)+'">Remove</button></div>').join(""):
   '<p class="program-enrollment-empty">No companies enrolled yet.</p>';
  const count=$("programEnrollmentCount");if(count)count.textContent=String(enrollments.length);
 }catch(error){holder.textContent="Unable to load enrollments: "+error.message}
}
async function openProgramEnrollment(){
 const m=state.management,prog=(state.cache.get(cacheKey())?.records||[]).find(r=>r.id===m?.id);
 if(!prog)return;
 const companies=[];
 try{
  for(const kind of state.context==="dot"?["employers","owner_operators"]:["employers"]){
   const key=cacheKey(kind),cached=state.cache.get(key);
   let records=cached?.records||[];
   if(!cached||Date.now()-cached.time>30000){
    const res=await api("list",{tenant_id:state.tenantId,operating_context:state.context,kind});
    records=res.records||[];state.cache.set(key,{records,time:Date.now()});
   }
   companies.push(...records.filter(r=>r.operating_context===state.context));
  }
 }catch(error){message(error.message,true);return}
 programAction={action:"add",programId:prog.id};
 $("modalTitle").textContent="Enroll company in program";
 $("modalDescription").textContent=prog.data?.name||"Testing program";
 $("recordFields").innerHTML='<div class="company-modal-sections"><section class="company-modal-section"><h3>Program enrollment</h3>'+
  '<div class="company-modal-grid"><label class="company-modal-field span-all"><span>Company *</span>'+
  '<select name="company_id" required class="program-enrollment-select"><option value="">Select company</option>'+
  companies.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.data?.legal_name||"Company")+'</option>').join("")+
  '</select></label><label class="company-modal-field span-all"><span>Status</span>'+
  '<select name="status" class="program-enrollment-select"><option value="active">Active</option>'+
  '<option value="pending">Pending</option></select></label></div></section></div>';
 $("recordForm").dataset.mode="program-enroll-add";
 $("saveRecord").hidden=false;$("saveRecord").disabled=false;$("saveRecord").className="btn primary";
 $("saveRecord").textContent="Enroll company";$("formMessage").textContent="";
 $("modal").hidden=false;document.body.classList.add("modal-open");
 $("recordFields").querySelector("select")?.focus({preventScroll:true});
}
function removeProgramEnrollment(id){
 const m=state.management;
 const row=(state.cache.get(cacheKey("enrollments"))?.records||[]).find(r=>r.id===id);
 if(!m?.id||!row)return message("Enrollment unavailable. Refresh the program.",true);
 programAction={action:"remove",programId:m.id,id};
 $("modalTitle").textContent="Remove company enrollment";
 $("modalDescription").textContent="The enrollment will be archived; historical program records remain intact.";
 $("recordFields").innerHTML='<div class="company-remove-confirm"><strong>'+esc(row.data?.participant||row.data?.name||"Enrollment")+'</strong></div>';
 $("recordForm").dataset.mode="program-enroll-remove";
 $("saveRecord").hidden=false;$("saveRecord").disabled=false;$("saveRecord").className="btn danger";
 $("saveRecord").textContent="Remove enrollment";$("formMessage").textContent="";
 $("modal").hidden=false;document.body.classList.add("modal-open");
}
async function submitProgramEnrollment(){
 const op=programAction,button=$("saveRecord"),m=state.management;
 if(!op||!m?.id||op.programId!==m.id)return;
 button.disabled=true;
 try{
  if(op.action==="add"){
   const form=$("recordForm");if(!form.reportValidity()){button.disabled=false;return}
   const d=Object.fromEntries(new FormData(form).entries());
   const companies=[];
   for(const kind of state.context==="dot"?["employers","owner_operators"]:["employers"])
    companies.push(...(state.cache.get(cacheKey(kind))?.records||[]));
   const company=companies.find(r=>r.id===d.company_id);
   if(!company)throw Error("Choose a company in this workspace.");
   const current=(state.cache.get(cacheKey("enrollments"))?.records||[]);
   if(current.some(r=>r.data?.program_id===m.id&&r.data?.company_id===company.id))
    throw Error("This company is already enrolled in the program.");
   const program=(state.cache.get(cacheKey())?.records||[]).find(r=>r.id===m.id);
   await api("save",{tenant_id:state.tenantId,operating_context:state.context,
    kind:"enrollments",data:{name:(company.data?.legal_name||"Company")+" · "+(program?.data?.name||"Program"),
     company_id:company.id,program_id:m.id,participant:company.data?.legal_name||"",
     program:program?.data?.name||"",status:d.status||"active"}});
  }else{
   await api("archive",{tenant_id:state.tenantId,operating_context:state.context,
    kind:"enrollments",id:op.id});
  }
  state.cache.delete(cacheKey("enrollments"));closeModal();programAction=null;
  message(op.action==="add"?"Company enrolled in program.":"Enrollment removed.");
  void hydrateProgramEnrollments();
 }catch(error){$("formMessage").textContent=error.message;button.disabled=false}
}
async function refreshProgramLock(){
 const m=state.management,seq=state.sequence;
 if(state.page!=="programs"||!m?.id)return;
 const warning=$("programLockNotice"),editButton=$("programEditButton"),
   form=$("managementForm"),saveButton=$("managementSave");
 if(editButton)editButton.disabled=true;
 if(form){form.querySelectorAll("input,select,textarea").forEach(el=>el.disabled=true);
   if(saveButton)saveButton.disabled=true;}
 if(warning)warning.textContent="Checking employee enrollments…";
 try{
  const result=await api("program_lock_status",{tenant_id:state.tenantId,operating_context:state.context,program_id:m.id});
  if(state.management!==m||state.page!=="programs"||seq!==state.sequence)return;
  if(result.locked){
   if(m.action==="edit"){
    state.management={...m,action:"view"};
    history.replaceState({management:true},"",managementUrl("view",m.id));
    renderManagementPage();
    return;
   }
   if(warning)warning.innerHTML='<span class="program-lock-symbol" aria-hidden="true">🔒</span><span><strong>Program locked · '+
    result.employee_count+' enrolled '+(result.employee_count===1?"employee":"employees")+'</strong>'+
    '<small>Editing is unavailable until every employee is removed from the program’s linked pools.</small></span>';
   if(editButton)editButton.hidden=true;
  }else{
   if(warning)warning.innerHTML='<span class="program-lock-symbol" aria-hidden="true">✓</span><span><strong>Program editable</strong>'+
    '<small>No employees are currently enrolled in this program.</small></span>';
   if(editButton)editButton.disabled=false;
   if(form){form.querySelectorAll("input,select,textarea").forEach(el=>el.disabled=false);
    if(saveButton)saveButton.disabled=false;}
  }
 }catch(error){
  if(warning)warning.innerHTML='<span class="program-lock-symbol">!</span><span><strong>Lock verification unavailable</strong>'+
   '<small>'+esc(error.message)+'. Editing remains disabled until enrollment status can be verified.</small></span>';
 }
}
function renderProgramManagement(record,mode,canWrite){
 const view=mode==="view",d=record?.data||{},title=d.name||"New program";
 const head='<div class="program-head"><span class="program-head-icon">'+navIcon("programs")+'</span><div><strong>'+
  esc(title)+'</strong><small>'+esc(state.context==="dot"?"DOT testing program":"NON-DOT testing program")+'</small></div>'+
  (record?recordStatus(record):'<span class="mgmt-status pending">New program</span>')+'</div>';
 const defs=fields("programs");
 const sections=PROGRAM_SECTIONS.map(([name,names])=>{
  const chosen=names.map(n=>defs.find(f=>f.name===n)).filter(Boolean);
  return view?managementOverviewGroup(name,chosen.map(f=>[f.label,d[f.name]])):managementSection(name,chosen,record);
 }).join("");
 const related='<section class="program-related"><h2>Program management</h2><div class="program-related-links">'+
  [["pools","Manage pools"],["enrollments","Enrollments"],["selections","Random selections"],
   ["testing_orders","Testing orders"],["reports","Reports"]].map(([page,title])=>
   '<button type="button" data-program-related="'+page+'">'+navIcon(page)+'<span>'+esc(title)+'</span><span aria-hidden="true">›</span></button>').join("")+
  '</div></section>';
 const enrollmentPanel=record?'<section class="program-enrollments"><div class="program-enrollments-heading">'+
  '<h2>Enrolled companies <span id="programEnrollmentCount"></span></h2>'+
  (canWrite?'<button type="button" data-program-enroll-add>+ Enroll company</button>':"")+
  '</div><div id="programEnrollments" class="program-enrollment-list">Loading enrollments…</div></section>':"";
 const assigned=view?managementOverviewGroup("Assigned company",[["Company",d.employer||"Unassigned"]]):
  '<section class="management-section"><header class="management-section-header"><h2>Assigned company</h2></header>'+
  '<div class="manage-form-grid"><label class="manage-field"><span>Company</span><select name="company_selection" id="programCompany" disabled>'+
  '<option value="">Loading companies…</option></select><small>Only companies in this workspace can be assigned.</small></label></div></section>';
 if(view){
  $("pageContent").innerHTML='<div class="program-management">'+head+'<div class="program-management-grid">'+
   '<div class="program-primary"><div class="program-lock-notice" id="programLockNotice">Checking employee enrollments…</div>'+sections+assigned+enrollmentPanel+'</div>'+related+'</div>'+
   '<footer class="program-actions"><button type="button" class="btn secondary" data-back-list>Back to Programs</button>'+
   (canWrite?'<button id="programEditButton" class="btn primary" type="button" data-manage-edit="'+esc(record.id)+'" disabled>Edit program</button>':"")+'</footer></div>';
  if(record){void hydrateProgramEnrollments();void refreshProgramLock();}
  return;
 }
 $("pageContent").innerHTML='<div class="program-management">'+head+'<form id="managementForm"><div class="program-management-grid">'+
  '<div class="program-primary"><div class="program-lock-notice" id="programLockNotice">Checking employee enrollments…</div>'+sections+assigned+'</div>'+related+'</div>'+
  '<div class="program-rule-guidance" id="programRegulatoryGuidance">Loading regulatory references…</div>'+
  '<p class="manage-form-error" id="managementError" role="alert"></p>'+
  '<footer class="program-actions"><button type="button" class="btn secondary" data-back-list>Cancel</button>'+
  '<button type="submit" class="btn primary" id="managementSave">'+(record?"Save changes":"Create program")+'</button></footer></form></div>';
 const programType=state.context==="dot"?"DOT":"NON-DOT";
 const typeInput=document.createElement("input");typeInput.type="hidden";typeInput.name="program_type";typeInput.value=programType;
 $("managementForm").append(typeInput);
 if(state.context==="nondot"){
  const agency=$("manage-dot_agency");if(agency)agency.closest(".manage-field")?.remove();
 }
 $("managementForm").querySelector('input[name="name"]')?.focus({preventScroll:true});
 if(record){void hydrateProgramEnrollments();void refreshProgramLock();}
 void prepareProgramManagement();
}

const POOL_SECTIONS=[
 ["Pool information",["name","pool_type","status","effective_date"]],
 ["Random testing schedule",["dot_agency","drug_testing_rate","alcohol_testing_rate","selection_schedule"]],
 ["Internal notes",["notes"]]
];
async function poolReferenceRecords(kinds){
 const rows=await Promise.all(kinds.map(async kind=>{
  const key=cacheKey(kind),cached=state.cache.get(key);
  if(cached&&Date.now()-cached.time<30000)return [kind,cached.records];
  const result=await api("list",{tenant_id:state.tenantId,operating_context:state.context,kind});
  const records=result.records||[];
  state.cache.set(key,{records,time:Date.now()});
  return [kind,records];
 }));
 return Object.fromEntries(rows);
}
const poolMatches=(r,pool)=>r.data?.pool_id===pool.id||
 (pool.data?._legacy_id&&r.data?.pool===pool.data._legacy_id);
async function preparePoolManagement(){
 const m=state.management,seq=state.sequence;
 if(state.page!=="pools"||!m)return;
 const program=$("poolProgram"),company=$("poolCompany");
 if(!program||!company)return;
 const data=(m.id?(state.cache.get(cacheKey())?.records||[]).find(r=>r.id===m.id)?.data:null)||{};
 try{
  const kinds=state.context==="dot"?["programs","employers","owner_operators"]:["programs","employers"];
  const refs=await poolReferenceRecords(kinds);
  if(state.management!==m||seq!==state.sequence)return;
  const programs=refs.programs||[];
  const companies=[...(refs.employers||[]),...(refs.owner_operators||[])].filter(r=>r.operating_context===state.context);
  program.innerHTML='<option value="">Select program</option>'+programs.filter(r=>r.operating_context===state.context).map(r=>
   '<option value="'+esc(r.id)+'">'+esc(r.data?.name||"Program")+'</option>').join("");
  company.innerHTML='<option value="">All participating employers</option>'+companies.map(r=>
   '<option value="'+esc(r.id)+'">'+esc(r.data?.legal_name||"Company")+'</option>').join("");
  const matchProgram=programs.find(r=>r.id===data.program_id||
   r.data?._legacy_id===data._legacy_program_id||r.data?.name===data.program);
  const matchCompany=companies.find(r=>r.id===data.company_id||
   r.data?.legal_name===data.employer);
  if(matchProgram)program.value=matchProgram.id;
  if(matchCompany)company.value=matchCompany.id;
  if(!m.id||$("managementForm")?.dataset.poolUnlocked==="true"){program.disabled=false;company.disabled=false;}
  const updateAgency=()=>{
   const chosen=programs.find(r=>r.id===program.value);
   const agency=$("manage-dot_agency");
   if(chosen&&agency&&!agency.value)agency.value=chosen.data?.dot_agency||"";
  };
  program.addEventListener("change",updateAgency);
  if(state.context==="nondot"){$("manage-dot_agency")?.closest(".manage-field")?.remove()}
  updateAgency();
 }catch(error){
  const box=$("poolReferenceError");if(box)box.textContent="Could not load program and company options: "+error.message;
 }
}
async function hydratePoolRoster(){
 const m=state.management,seq=state.sequence;
 if(state.page!=="pools"||!m?.id)return;
 const pool=(state.cache.get(cacheKey())?.records||[]).find(r=>r.id===m.id);
 if(!pool)return;
 const roster=$("poolRoster"),selections=$("poolSelections");
 if(!roster)return;
 try{
  const refs=await poolReferenceRecords(["enrollments","people","selections"]);
  if(state.management!==m||seq!==state.sequence)return;
  const members=(refs.enrollments||[]).filter(r=>r.data?.membership_type==="pool"&&r.data?.pool_id===m.id);
  const people=refs.people||[];
  roster.innerHTML=members.length?members.map(r=>{
   const person=people.find(p=>p.id===r.data?.person_id);
   const name=person?[person.data?.first_name,person.data?.last_name].filter(Boolean).join(" "):
     r.data?.participant||"Member";
   return '<div class="pool-list-row"><span><strong>'+esc(name)+'</strong><small>'+esc(r.data?.eligibility_status||"eligible")+
    (r.data?.employer?" · "+esc(r.data.employer):"")+'</small></span>'+
    '<div><button type="button" data-pool-person="'+esc(r.data?.person_id||"")+'">Profile</button>'+
    '<button type="button" class="pool-remove" data-pool-remove="'+esc(r.id)+'">Remove</button></div></div>';
  }).join(""):'<p class="program-enrollment-empty">No members enrolled in this pool.</p>';
  if($("poolRosterCount"))$("poolRosterCount").textContent=String(members.length);
  const runs=(refs.selections||[]).filter(r=>poolMatches(r,pool));
  if(selections)selections.innerHTML=runs.length?runs.slice(0,5).map(r=>
   '<button type="button" class="pool-selection-item" data-pool-selection="'+esc(r.id)+'"><span>'+
   esc(r.data?.name||"Selection event")+'</span><small>'+esc(r.data?.status||"")+'</small></button>').join(""):
   '<p class="program-enrollment-empty">No selection events recorded for this pool.</p>';
  if($("poolSelectionCount"))$("poolSelectionCount").textContent=String(runs.length);
 }catch(error){roster.textContent="Unable to load pool records: "+error.message}
}
let poolAction=null;
async function openPoolAddMember(){
 const m=state.management,pool=(state.cache.get(cacheKey())?.records||[]).find(r=>r.id===m?.id);
 if(!pool)return;
 try{
  const refs=await poolReferenceRecords(["people","enrollments"]);
  const people=refs.people||[],current=(refs.enrollments||[]).filter(r=>r.data?.membership_type==="pool"&&r.data?.pool_id===pool.id);
  const candidates=people.filter(r=>!current.some(x=>x.data?.person_id===r.id));
  poolAction={mode:"add",poolId:pool.id};
  $("modalTitle").textContent="Add pool member";
  $("modalDescription").textContent=pool.data?.name||"Random testing pool";
  $("recordFields").innerHTML='<div class="company-modal-sections"><section class="company-modal-section"><h3>Member details</h3>'+
   '<div class="company-modal-grid"><label class="company-modal-field span-all"><span>Person *</span>'+
   '<select class="program-enrollment-select" name="person_id" required><option value="">Select person</option>'+
   candidates.map(r=>'<option value="'+esc(r.id)+'">'+esc([r.data?.first_name,r.data?.last_name].filter(Boolean).join(" ")||r.data?.email||"Person")+'</option>').join("")+
   '</select></label><label class="company-modal-field span-all"><span>Eligibility</span>'+
   '<select class="program-enrollment-select" name="eligibility_status"><option value="eligible">Eligible</option>'+
   '<option value="ineligible">Ineligible</option></select></label></div></section></div>';
  $("recordForm").dataset.mode="pool-add-member";$("saveRecord").hidden=false;$("saveRecord").disabled=false;
  $("saveRecord").className="btn primary";$("saveRecord").textContent="Add member";
  $("formMessage").textContent="";$("modal").hidden=false;document.body.classList.add("modal-open");
 }catch(error){message(error.message,true)}
}
function confirmPoolRemove(id){
 const m=state.management;
 const row=(state.cache.get(cacheKey("enrollments"))?.records||[]).find(r=>r.id===id&&r.data?.pool_id===m?.id);
 if(!row)return message("Pool membership not found.",true);
 poolAction={mode:"remove",poolId:m.id,id};
 $("modalTitle").textContent="Remove pool member";
 $("modalDescription").textContent="The membership will be archived. The person's profile is preserved.";
 $("recordFields").innerHTML='<div class="company-remove-confirm"><div><strong>'+esc(row.data?.participant||"Pool member")+'</strong>'+
  '<p>Removal will not delete the person or any historical selection events.</p></div></div>';
 $("recordForm").dataset.mode="pool-remove-member";$("saveRecord").hidden=false;$("saveRecord").disabled=false;
 $("saveRecord").className="btn danger";$("saveRecord").textContent="Remove member";
 $("formMessage").textContent="";$("modal").hidden=false;document.body.classList.add("modal-open");
}
async function savePoolMember(){
 const action=poolAction,m=state.management,button=$("saveRecord");
 if(!action||m?.id!==action.poolId)return;
 button.disabled=true;
 try{
  if(action.mode==="add"){
   if(!$("recordForm").reportValidity()){button.disabled=false;return}
   const fields=Object.fromEntries(new FormData($("recordForm")).entries());
   const person=(state.cache.get(cacheKey("people"))?.records||[]).find(r=>r.id===fields.person_id);
   if(!person)throw Error("Choose an available person.");
   await api("save",{tenant_id:state.tenantId,operating_context:state.context,kind:"enrollments",
    data:{membership_type:"pool",pool_id:action.poolId,person_id:person.id,
     participant:[person.data?.first_name,person.data?.last_name].filter(Boolean).join(" "),
     employer:person.data?.employer||"",eligibility_status:fields.eligibility_status,status:"active"}});
  }else{
   await api("archive",{tenant_id:state.tenantId,operating_context:state.context,kind:"enrollments",id:action.id});
  }
  state.cache.delete(cacheKey("enrollments"));closeModal();poolAction=null;
  message(action.mode==="add"?"Member added to pool.":"Member removed from pool.");
  void hydratePoolRoster();
  void refreshPoolLock();
 }catch(error){$("formMessage").textContent=error.message;button.disabled=false}
}
async function refreshPoolLock(){
 const m=state.management,seq=state.sequence;
 if(state.page!=="pools"||!m?.id)return;
 const warning=$("poolLockNotice"),editButton=$("poolEditButton"),
  form=$("managementForm"),saveButton=$("managementSave");
 if(editButton)editButton.disabled=true;
 if(form){form.querySelectorAll("input,select,textarea").forEach(el=>el.disabled=true);
  if(saveButton)saveButton.disabled=true;}
 if(warning)warning.textContent="Checking pool membership…";
 try{
  const result=await api("pool_lock_status",{tenant_id:state.tenantId,
   operating_context:state.context,pool_id:m.id});
  if(state.page!=="pools"||state.management!==m||seq!==state.sequence)return;
  if(result.locked){
   if(m.action==="edit"){
    state.management={...m,action:"view"};
    history.replaceState({management:true},"",managementUrl("view",m.id));
    renderManagementPage();return;
   }
   if(warning)warning.innerHTML='<span class="program-lock-symbol" aria-hidden="true">🔒</span>'+
    '<span><strong>Pool locked · '+result.employee_count+' enrolled '+
    (result.employee_count===1?"employee":"employees")+'</strong>'+
    '<small>Pool settings cannot be edited while employees are enrolled. Remove all members to unlock editing.</small></span>';
   if(editButton)editButton.hidden=true;
  }else{
   if(warning)warning.innerHTML='<span class="program-lock-symbol" aria-hidden="true">✓</span>'+
    '<span><strong>Pool editable</strong><small>No employees are currently enrolled in this pool.</small></span>';
   if(editButton)editButton.disabled=false;
   if(form){form.dataset.poolUnlocked="true";form.querySelectorAll("input,select,textarea").forEach(el=>el.disabled=false);
    if(saveButton)saveButton.disabled=false;}
  }
 }catch(error){
  if(warning)warning.innerHTML='<span class="program-lock-symbol" aria-hidden="true">!</span>'+
   '<span><strong>Lock verification unavailable</strong><small>'+
   esc(error.message)+'. Editing remains disabled until the pool membership can be verified.</small></span>';
 }
}
function renderPoolManagement(record,mode,canWrite){
 const view=mode==="view",data=record?.data||{},name=data.name||"New pool";
 const head='<div class="program-head"><span class="program-head-icon">'+navIcon("pools")+'</span>'+
  '<div><strong>'+esc(name)+'</strong><small>'+esc(state.context==="dot"?"DOT random testing pool":"NON-DOT random testing pool")+
  '</small></div>'+(record?recordStatus(record):'<span class="mgmt-status pending">New pool</span>')+'</div>';
 const definitions=fields("pools");
 const blocks=POOL_SECTIONS.map(([title,names])=>{
  const selected=names.map(n=>definitions.find(f=>f.name===n)).filter(Boolean);
  return view?managementOverviewGroup(title,selected.map(f=>[f.label,data[f.name]])):
   managementSection(title,selected,record);
 }).join("");
 const relation=view?
  managementOverviewGroup("Program and employer",[["Program",data.program||"Unassigned"],["Company",data.employer||"All participating employers"]]):
  '<section class="management-section"><header class="management-section-header"><h2>Program assignment</h2></header>'+
  '<div class="manage-form-grid"><label class="manage-field"><span>Linked program *</span>'+
  '<select id="poolProgram" name="program_selection" required disabled><option value="">Loading programs…</option></select>'+
  '</label><label class="manage-field"><span>Employer / Owner-Operator (optional)</span>'+
  '<select id="poolCompany" name="company_selection" disabled><option value="">Loading companies…</option></select></label></div></section>';
 const related='<section class="program-related"><h2>Pool management</h2><div class="program-related-links">'+
  [["selections","Selection events"],["programs","Testing programs"],["people","People"],["reports","Reports"]].map(([kind,title])=>
  '<button type="button" data-pool-nav="'+kind+'">'+navIcon(kind)+'<span>'+esc(title)+'</span><span aria-hidden="true">›</span></button>').join("")+
  '</div></section>';
 const roster=record?'<section class="program-enrollments"><div class="program-enrollments-heading">'+
  '<h2>Pool members <span id="poolRosterCount"></span></h2>'+
  (canWrite?'<button type="button" data-pool-add>+ Add member</button>':"")+'</div>'+
  '<div id="poolRoster" class="program-enrollment-list">Loading members…</div></section>'+
  '<section class="program-enrollments"><div class="program-enrollments-heading">'+
  '<h2>Selection history <span id="poolSelectionCount"></span></h2></div>'+
  '<div id="poolSelections" class="program-enrollment-list">Loading selections…</div></section>':"";
 const grid='<div class="program-management-grid"><div class="program-primary">'+(record?'<div class="program-lock-notice" id="poolLockNotice">Checking pool membership…</div>':'')+blocks+relation+roster+'</div>'+related+'</div>';
 if(view){
  $("pageContent").innerHTML='<div class="program-management">'+head+grid+
  '<footer class="program-actions"><button type="button" class="btn secondary" data-back-list>Back to Pools</button>'+
  (canWrite?'<button type="button" id="poolEditButton" class="btn primary" data-manage-edit="'+esc(record.id)+'" disabled>Edit pool</button>':"")+'</footer></div>';
  void hydratePoolRoster();void refreshPoolLock();return;
 }
 $("pageContent").innerHTML='<div class="program-management">'+head+'<form id="managementForm">'+grid+
  '<p id="poolReferenceError" class="manage-form-error"></p>'+
  '<p class="manage-form-error" id="managementError" role="alert"></p>'+
  '<footer class="program-actions"><button type="button" class="btn secondary" data-back-list>Cancel</button>'+
  '<button class="btn primary" type="submit" id="managementSave">'+(record?"Save changes":"Create pool")+'</button></footer></form></div>';
 if(record){void hydratePoolRoster();void refreshPoolLock();}
 void preparePoolManagement();
 $("managementForm").querySelector('input[name="name"]')?.focus({preventScroll:true});
}

let selectionPreview=null,selectionRunRequest=null,selectionRequestSeq=0;
async function selectionPools(){
 const m=state.management,seq=state.sequence;
 try{
  const refs=await poolReferenceRecords(["pools"]);
  if(state.management!==m||seq!==state.sequence)return;
  const select=$("selectionPool");
  if(!select)return;
  const pools=(refs.pools||[]).filter(r=>r.operating_context===state.context&&r.data?.status==="active");
  select.innerHTML='<option value="">Choose an active pool</option>'+pools.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.data?.name||"Pool")+'</option>').join("");
  select.disabled=false;$("selectionHint").textContent=pools.length?"Choose a pool to review eligible members.":"No active pools. Create a pool and enroll members first.";
 }catch(e){$("selectionHint").textContent=e.message}
}
async function selectionPreviewPool(){
 const id=$("selectionPool")?.value,token=++selectionRequestSeq;
 selectionPreview=null;$("selectionReview").disabled=true;
 const el=$("selectionPopulation");el.textContent=id?"Loading eligible population…":"Choose a pool.";
 if(!id)return;
 try{
  const r=await api("selection_preview",{tenant_id:state.tenantId,operating_context:state.context,pool_id:id});
  if(token!==selectionRequestSeq||state.page!=="selections"||state.management?.action!=="new")return;
  selectionPreview=r;
  el.innerHTML='<div class="selection-stats"><div><small>Eligible members</small><strong>'+r.population+'</strong></div>'+
   '<div><small>Annual drug rate</small><strong>'+Number(r.rates?.drug||0)+'%</strong></div>'+
   '<div><small>Annual alcohol rate</small><strong>'+Number(r.rates?.alcohol||0)+'%</strong></div></div>'+
   '<p class="selection-hint">Counts for this draw must be reviewed against previous selections and annual testing requirements.</p>';
  $("selectionDrug").max=r.population;$("selectionAlcohol").max=r.population;
  $("selectionDrug").value=Math.min(r.population,Math.ceil(r.population*Number(r.rates?.drug||0)/100));
  $("selectionAlcohol").value=Math.min(r.population,Math.ceil(r.population*Number(r.rates?.alcohol||0)/100));
  $("selectionReview").disabled=!r.population;
 }catch(e){if(token===selectionRequestSeq)el.innerHTML='<p class="selection-error">'+esc(e.message)+'</p>'}
}
function selectionList(records){
 const q=state.search.toLowerCase(),status=state.statusFilter;
 const visible=records.filter(r=>[r.data?.name,r.data?.pool_name,r.data?.selection_date].some(x=>String(x||"").toLowerCase().includes(q))&&(!status||r.data?.status===status));
 const rows=visible.map(r=>{const d=r.data||{};
  return '<button type="button" class="selection-event" data-view="'+esc(r.id)+'">'+
   '<span class="selection-event-icon">'+navIcon("selections")+'</span>'+
   '<span class="selection-event-name"><strong>'+esc(d.pool_name||"Pool unavailable")+'</strong><small>'+
   esc(d.selection_date?new Date(d.selection_date).toLocaleDateString():"—")+' · '+esc(d.name||"Selection event")+'</small></span>'+
   '<span><small>Population</small><strong>'+esc(d.population_size??"—")+'</strong></span>'+
   '<span><small>Drug / Alcohol</small><strong>'+esc(d.drug_selection_count??"—")+' / '+esc(d.alcohol_selection_count??"—")+'</strong></span>'+
   '<span class="mgmt-status pending">'+esc(statusLabel(d.status))+'</span><span class="selection-link">View</span></button>';
 }).join("");
 $("pageContent").innerHTML='<div class="selection-workspace"><div class="selection-stats selection-overview">'+
  '<div><small>Selection events</small><strong>'+records.length+'</strong></div>'+
  '<div><small>Locked records</small><strong>'+records.filter(x=>x.data?.status==="locked").length+'</strong></div>'+
  '<div><small>Selected members</small><strong>'+records.reduce((n,x)=>n+(Array.isArray(x.data?.selection_members)?x.data.selection_members.length:0),0)+'</strong></div></div>'+
  '<section class="selection-history"><div class="directory-toolbar"><div class="directory-search">'+
  '<input id="recordSearch" type="search" aria-label="Search selections" placeholder="Search selections" value="'+esc(state.search)+'"></div>'+
  '<select id="statusFilter"><option value="">All statuses</option>'+
  ['locked','completed','scheduled'].map(st=>'<option value="'+st+'"'+(status===st?" selected":"")+'>'+esc(statusLabel(st))+'</option>').join("")+'</select>'+
  '<span class="directory-total">'+visible.length+' events</span></div>'+
  (rows||'<div class="directory-empty"><h2>No selection events</h2><p>Run a selection from an active pool.</p></div>')+'</section></div>';
}
function renderSelections(record){
 const d=record?.data||{};
 const head='<div class="program-head"><span class="program-head-icon">'+navIcon("selections")+'</span>'+
  '<div><strong>'+esc(record?d.pool_name||d.name||"Selection event":"Run random selection")+'</strong>'+
  '<small>'+esc(record?"Locked selection audit record":"Cryptographically randomized eligible pool members")+'</small></div>'+
  (record?'<span class="mgmt-status pending">'+esc(statusLabel(d.status))+'</span>':"")+'</div>';
 if(record){
  const selected=Array.isArray(d.selection_members)?d.selection_members:[];
  const details=managementOverviewGroup("Selection details",[
   ["Pool",d.pool_name||"Unavailable"],["Date",d.selection_date?new Date(d.selection_date).toLocaleString():"—"],
   ["Eligible population",d.population_size],["Drug selections",d.drug_selection_count],
   ["Alcohol selections",d.alcohol_selection_count],
   ["Annual drug rate",d.drug_required_rate==null?"—":d.drug_required_rate+"%"],
   ["Annual alcohol rate",d.alcohol_required_rate==null?"—":d.alcohol_required_rate+"%"],
   ["Randomization version",d.randomization_version],["Locked at",d.locked_at?new Date(d.locked_at).toLocaleString():"—"]]);
  $("pageContent").innerHTML='<div class="selection-workspace selection-detail">'+head+details+
   '<section class="selection-members"><h2>Selected members ('+selected.length+')</h2>'+
   (selected.map(m=>'<div class="selection-member"><div><strong>'+esc(m.name||"Member")+'</strong>'+
    '<small>'+esc(m.employer||"")+'</small></div><span>'+esc(statusLabel(m.test_type||"Selected"))+'</span>'+
    (m.person_id?'<button type="button" data-selection-person="'+esc(m.person_id)+'">View profile</button>':"")+'</div>').join("")||
    '<p class="selection-hint">No selected member details are recorded for this event.</p>')+'</section>'+
   '<footer class="program-actions"><button type="button" class="btn secondary" data-back-list>Back to Selections</button></footer></div>';
  return;
 }
 $("pageContent").innerHTML='<div class="selection-workspace">'+head+
  '<section class="selection-setup"><h2>Pool and eligible population</h2><label><span>Active pool *</span>'+
  '<select id="selectionPool" disabled><option value="">Loading pools…</option></select></label>'+
  '<p class="selection-hint" id="selectionHint">Loading active pools…</p><div id="selectionPopulation">Choose a pool.</div></section>'+
  '<section class="selection-setup"><h2>Selections for this draw</h2><div class="selection-counts">'+
  '<label><span>Drug selections</span><input type="number" min="0" step="1" id="selectionDrug" value="0"></label>'+
  '<label><span>Alcohol selections</span><input type="number" min="0" step="1" id="selectionAlcohol" value="0"></label></div>'+
  '<p class="selection-hint">Annual rate percentages are references. Review the draw counts and prior selections before running.</p></section>'+
  '<footer class="program-actions"><button type="button" class="btn secondary" data-back-list>Cancel</button>'+
  '<button type="button" class="btn primary" id="selectionReview" disabled>Review selection</button></footer></div>';
 void selectionPools();
}
function confirmSelection(){
 if(!selectionPreview)return;
 const drug=Number($("selectionDrug").value),alcohol=Number($("selectionAlcohol").value),population=selectionPreview.population;
 if(!Number.isInteger(drug)||!Number.isInteger(alcohol)||drug<0||alcohol<0||drug>population||alcohol>population||drug+alcohol===0){
  message("Enter valid selection counts within the eligible population.",true);return;
 }
 selectionRunRequest={pool_id:selectionPreview.pool_id,drug_count:drug,alcohol_count:alcohol,request_id:crypto.randomUUID()};
 $("modalTitle").textContent="Confirm random selection";
 $("modalDescription").textContent="This creates an immutable audit record.";
 $("recordFields").innerHTML='<div class="selection-confirm"><strong>'+esc(selectionPreview.pool_name)+'</strong>'+
  '<p>Eligible population: '+population+'</p><p>Drug: '+drug+' · Alcohol: '+alcohol+'</p>'+
  '<p>Once executed, selected members cannot be changed.</p></div>';
 $("recordForm").dataset.mode="selection-run";$("saveRecord").hidden=false;$("saveRecord").disabled=false;
 $("saveRecord").className="btn primary";$("saveRecord").textContent="Run secure selection";
 $("formMessage").textContent="";$("modal").hidden=false;document.body.classList.add("modal-open");
}
async function runSelection(){
 if(!selectionRunRequest||state.page!=="selections")return;
 const button=$("saveRecord");button.disabled=true;
 try{
  const result=await api("selection_run",{tenant_id:state.tenantId,operating_context:state.context,...selectionRunRequest});
  closeModal();selectionRunRequest=null;selectionPreview=null;
  state.cache.delete(cacheKey());
  await loadRecords(state.sequence,true);
  openManagement("view",result.id);
  message(result.reused?"Existing event opened.":"Selection completed and locked.");
 }catch(error){$("formMessage").textContent=error.message;button.disabled=false}
}

let drugOrderId=null;
async function loadDrugOrderOptions(){
 const m=state.management,seq=state.sequence;
 const company=$("drugCompany"),person=$("drugPerson");
 if(!company||!person)return;
 try{
  const kinds=state.context==="dot"?["employers","owner_operators","people"]:["employers","people"];
  const refs=await poolReferenceRecords(kinds);
  if(seq!==state.sequence||state.management!==m)return;
  state.drugCompanies=[...(refs.employers||[]),...(refs.owner_operators||[])].filter(r=>r.operating_context===state.context&&r.data?.status==="active");
  state.drugPeople=refs.people||[];
  company.innerHTML='<option value="">Select company</option>'+state.drugCompanies.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.data?.legal_name||"Company")+'</option>').join("");
  company.disabled=false;
  if(state.companyDraft?.page==="testing_orders"&&state.drugCompanies.some(r=>r.id===state.companyDraft.companyId))
   company.value=state.companyDraft.companyId;
  refreshDrugDonors();
  $("drugOrderHint").textContent=state.drugCompanies.length?"Select a company and an active donor to place an order.":"No active companies are available in this workspace.";
 }catch(e){$("drugOrderHint").textContent=e.message}
}
function refreshDrugDonors(){
 const companyId=$("drugCompany")?.value,person=$("drugPerson");if(!person)return;
 const choices=(state.drugPeople||[]).filter(r=>r.data?.company_id===companyId&&r.data?.status==="active");
 person.innerHTML='<option value="">Select a donor</option>'+choices.map(r=>'<option value="'+esc(r.id)+'">'+
  esc([r.data?.first_name,r.data?.last_name].filter(Boolean).join(" ")||"Person")+'</option>').join("");
 person.disabled=!companyId;
 $("drugDonorHint").textContent=companyId?(choices.length?choices.length+" available donor(s)":"No active people are linked to this company. Add the donor on the People page."):"Select a company first.";
}
function renderDrugOrderList(records){
 const query=state.search.trim().toLowerCase(),status=state.statusFilter;
 const visible=records.filter(r=>(!query||[r.data?.name,r.data?.employer,r.data?.employee,r.data?.test_type].some(v=>String(v||"").toLowerCase().includes(query)))&&
  (!status||r.data?.status===status));
 const statuses=[...new Set(records.map(r=>String(r.data?.status||"")).filter(Boolean))].sort();
 const items=visible.map(r=>{
  const d=r.data||{},when=r.created_at?new Date(r.created_at).toLocaleDateString():"";
  return '<button type="button" class="drug-order-row" data-view="'+esc(r.id)+'">'+
   '<span class="drug-order-row-icon">'+navIcon("testing_orders")+'</span>'+
   '<span class="drug-order-row-title"><strong>'+esc(d.name||"Testing order")+'</strong>'+
   '<small>'+esc(d.employer||"Company")+" · "+esc(d.employee||"Donor")+'</small></span>'+
   '<span class="drug-order-row-test"><small>Test</small><strong>'+esc(String(d.test_type||"").replaceAll("_"," "))+'</strong></span>'+
   '<span class="drug-order-row-date"><small>Submitted</small><strong>'+esc(when)+'</strong></span>'+
   '<span class="mgmt-status '+(["completed","released"].includes(d.status)?"positive":"pending")+'">'+esc(statusLabel(d.status||"pending"))+'</span>'+
   '<span class="drug-order-row-arrow">View</span></button>';
 }).join("");
 $("pageContent").innerHTML='<div class="drug-order-directory"><div class="drug-order-stats">'+
  '<div><small>Testing orders</small><strong>'+records.length+'</strong></div>'+
  '<div><small>Awaiting scheduling</small><strong>'+records.filter(r=>r.data?.status==="awaiting_schedule").length+'</strong></div>'+
  '<div><small>Completed</small><strong>'+records.filter(r=>["completed","released"].includes(r.data?.status)).length+'</strong></div></div>'+
  '<section class="drug-order-list"><div class="directory-toolbar"><div class="directory-search">'+
  '<input id="recordSearch" type="search" placeholder="Search orders, companies, or donors" value="'+esc(state.search)+'"></div>'+
  '<select id="statusFilter"><option value="">All statuses</option>'+
  statuses.map(st=>'<option value="'+esc(st)+'"'+(status===st?" selected":"")+'>'+esc(statusLabel(st))+'</option>').join("")+'</select>'+
  '<span class="directory-total">'+visible.length+' orders</span></div>'+
  (items||'<div class="directory-empty"><h2>No testing orders</h2><p>Use Order a Test to submit a request to Testing Operations.</p></div>')+
  '</section></div>';
}
function renderDrugOrder(record){
 const d=record?.data||{};
 const header='<div class="program-head"><span class="program-head-icon">'+navIcon("testing_orders")+'</span><div><strong>'+
  esc(record?d.name||"Testing order":"Order a drug or alcohol test")+'</strong><small>'+
  esc(record?"Processing handled by Workforce Testing Operations":"Company and donor-linked testing request")+'</small></div>'+
  (record?recordStatus(record):"")+'</div>';
 if(record){
  $("pageContent").innerHTML='<div class="drug-order-workspace">'+header+
   managementOverviewGroup("Testing order",[
    ["Order number",d.name],["Company",d.employer],["Donor",d.employee],["Test type",d.test_type],
    ["Testing reason",d.reason],["Specimen",d.specimen_type],["Panel",d.panel_name],
    ["DOT agency",d.dot_agency],["Priority",d.priority],["Requested date",d.requested_date],
    ["Processing status",d.status],["Instructions",d.notes]])+
   (d.testing_case_id?'<div class="drug-order-handoff"><strong>Testing Operations</strong><span>Submitted to the Testing Portal for scheduling and processing. Status reflects the processing queue.</span></div>':"")+
   '<footer class="program-actions"><button type="button" class="btn secondary" data-back-list>Back to Testing Orders</button></footer></div>';
  return;
 }
 const choose=(id,values,placeholder)=>'<select id="'+id+'" required><option value="">'+placeholder+'</option>'+
  values.map(([v,label])=>'<option value="'+esc(v)+'">'+esc(label)+'</option>').join("")+'</select>';
 const input=(id,label,control)=>'<label class="drug-order-field"><span>'+label+'</span>'+control+'</label>';
 const section=(label,items)=>'<section class="drug-order-section"><h2>'+label+'</h2><div class="drug-order-grid">'+items+'</div></section>';
 const reasons=[["pre_employment","Pre-employment"],["random","Random"],["reasonable_suspicion","Reasonable suspicion"],
 ["post_accident","Post-accident"],["return_to_duty","Return-to-duty"],["follow_up","Follow-up"],["other","Other"]];
 const panels=state.context==="dot"?[["DOT 5 Panel","DOT 5 Panel"],["DOT Breath Alcohol","DOT Breath Alcohol"],["DOT Drug and Alcohol","DOT Drug and Alcohol"]]:
 [["5 Panel","5 Panel"],["10 Panel","10 Panel"],["12 Panel","12 Panel"],["14 Panel","14 Panel"],["Breath Alcohol","Breath Alcohol"]];
 const agency=state.context==="dot"?section("DOT requirements",input("agency","DOT agency *",
   choose("drugAgency",["FMCSA","FAA","FRA","FTA","PHMSA","USCG"].map(x=>[x,x]),"Select agency"))):"";
 $("pageContent").innerHTML='<div class="drug-order-workspace">'+header+'<form id="drugOrderForm">'+
  section("Company and donor",input("company","Company *",'<select id="drugCompany" required disabled><option>Loading companies…</option></select>')+
   input("person","Employee / donor *",'<select id="drugPerson" required disabled><option>Select company first</option></select>')+
   '<p id="drugDonorHint" class="drug-order-hint">Select company first.</p>')+
  section("Testing service",input("type","Test type *",choose("drugType",[["drug","Drug"],["alcohol","Alcohol"],["drug_and_alcohol","Drug and alcohol"]],"Select test type"))+
   input("reason","Reason for testing *",choose("drugReason",reasons,"Select reason"))+
   input("panel","Panel *",choose("drugPanel",panels,"Select panel"))+
   input("specimen","Collection method *",choose("drugSpecimen",[["urine","Urine"],["oral_fluid","Oral fluid"],["breath","Breath alcohol"],["saliva","Saliva"]],"Select method"))+
   input("priority","Priority *",choose("drugPriority",[["normal","Standard"],["urgent","Urgent"]],"Select priority"))+
   input("date","Requested collection date",'<input id="drugDate" type="date">'))+
  agency+section("Order instructions",'<label class="drug-order-field full"><span>Instructions for testing staff</span><textarea id="drugNotes" rows="4" maxlength="2000"></textarea></label>')+
  '<div class="drug-order-handoff"><strong>Processing handoff</strong><span>Submit to the Testing Portal as Awaiting Scheduling. This action does not collect payment or issue a donor pass.</span></div>'+
  '<p id="drugError" class="manage-form-error" role="alert"></p>'+
  '<footer class="program-actions"><button class="btn secondary" type="button" data-back-list>Cancel</button>'+
   '<button class="btn primary" type="submit" id="drugSubmit">Submit testing order</button></footer></form>'+
  '<p class="drug-order-hint" id="drugOrderHint">Loading company and donor records…</p></div>';
 drugOrderId=drugOrderId||crypto.randomUUID();void loadDrugOrderOptions();
}
async function submitDrugOrder(form){
 if(!form.reportValidity())return;
 const button=$("drugSubmit");button.disabled=true;$("drugError").textContent="";
 const payload={tenant_id:state.tenantId,operating_context:state.context,
  request_id:drugOrderId||crypto.randomUUID(),company_id:$("drugCompany").value,person_id:$("drugPerson").value,
  test_type:$("drugType").value,reason:$("drugReason").value,panel_name:$("drugPanel").value,
  specimen_type:$("drugSpecimen").value,dot_agency:$("drugAgency")?.value||"",
  priority:$("drugPriority").value,requested_date:$("drugDate").value,notes:$("drugNotes").value};
 try{
  const res=await api("testing_order_submit",payload);drugOrderId=null;state.cache.delete(cacheKey());
  await loadRecords(state.sequence,true);
  openManagement("view",res.id);
  message("Testing order "+res.case_number+" submitted for processing.");
 }catch(e){$("drugError").textContent=e.message;button.disabled=false}
}

const TEST_DOC_CATEGORIES=[
 ["chain_of_custody","Chain of Custody (CCF)"],["donor_pass","Donor Pass"],
 ["collection_form","Collection / Specimen Form"],["lab_report","Laboratory Report"],
 ["mro_report","MRO Report"],["test_result","Test Result"],
 ["consent_authorization","Consent / Authorization"],["random_selection","Random Selection Record"],
 ["program_policy","Program / Policy Document"],["medical_document","Medical / Occupational Document"],
 ["invoice_receipt","Invoice / Receipt"],["correspondence","Correspondence"],["other","Other Testing Document"]
];
const testingDocCategory=k=>TEST_DOC_CATEGORIES.find(item=>item[0]===k)?.[1]||String(k||"Uncategorized").replaceAll("_"," ");
async function prepareTestingDocumentRelations(record){
 const m=state.management,seq=state.sequence,company=$("testingDocCompany"),person=$("testingDocPerson"),order=$("testingDocOrder");
 if(!company||!person||!order)return;
 try{
  const refs=await poolReferenceRecords(state.context==="dot"?
   ["employers","owner_operators","people","testing_orders"]:["employers","people","testing_orders"]);
  if(state.management!==m||state.page!=="testing_documents"||seq!==state.sequence)return;
  state.testingDocRefs=refs;
  const companies=[...(refs.employers||[]),...(refs.owner_operators||[])].filter(r=>r.operating_context===state.context);
  company.innerHTML='<option value="">No company association</option>'+companies.map(r=>
   '<option value="'+esc(r.id)+'">'+esc(r.data?.legal_name||"Company")+'</option>').join("");
  company.value=record?.data?.company_id||"";
  company.disabled=false;
  refreshTestingDocumentRelations(record?.data?.person_id||"",record?.data?.testing_order_id||"");
 }catch(e){const hint=$("testingDocRelationHint");if(hint)hint.textContent="Unable to load company, person, or order associations: "+e.message;}
}
function refreshTestingDocumentRelations(personId="",orderId=""){
 const companyId=$("testingDocCompany")?.value,refs=state.testingDocRefs||{},person=$("testingDocPerson"),order=$("testingDocOrder");
 if(!person||!order)return;
 const people=(refs.people||[]).filter(r=>!companyId||r.data?.company_id===companyId);
 person.innerHTML='<option value="">No person association</option>'+people.map(r=>
  '<option value="'+esc(r.id)+'">'+esc([r.data?.first_name,r.data?.last_name].filter(Boolean).join(" ")||"Person")+'</option>').join("");
 const orders=(refs.testing_orders||[]).filter(r=>!companyId||r.data?.company_id===companyId);
 order.innerHTML='<option value="">No testing order association</option>'+orders.map(r=>
  '<option value="'+esc(r.id)+'">'+esc(r.data?.name||"Testing order")+'</option>').join("");
 if(personId&&people.some(r=>r.id===personId))person.value=personId;
 if(orderId&&orders.some(r=>r.id===orderId))order.value=orderId;
 person.disabled=false;order.disabled=false;
}
function testingDocumentsList(records){
 const q=state.search.trim().toLowerCase(),category=state.statusFilter;
 const visible=records.filter(r=>(!q||[r.data?.title,r.data?.document_type,r.data?.file_name,r.data?.order_reference,r.data?.description].some(v=>
  String(v||"").toLowerCase().includes(q)))&&(!category||r.data?.document_type===category));
 const categories=[...new Set(records.map(r=>r.data?.document_type).filter(Boolean))];
 const rows=visible.map(r=>{
  const d=r.data||{},hasFile=!!d.storage_path,date=r.created_at?new Date(r.created_at).toLocaleDateString():"—";
  const name=d.title||d.file_name||"Testing document";
  return '<div class="testing-doc-row"><span class="testing-doc-icon">'+navIcon("testing_documents")+'</span>'+
   '<div class="testing-doc-name"><button type="button" data-view="'+esc(r.id)+'">'+esc(name)+'</button>'+
   '<small>'+esc(d.file_name||"Existing testing document")+'</small></div>'+
   '<span class="testing-doc-type">'+esc(testingDocCategory(d.document_type))+'</span>'+
   '<span class="testing-doc-context">'+esc(d.order_reference||date)+'</span>'+
   '<span class="mgmt-status '+(hasFile?"positive":"pending")+'">'+(hasFile?"Available":"No file")+'</span>'+
   '<div class="testing-doc-actions"><button type="button" class="btn secondary btn-sm" data-view="'+esc(r.id)+'">Details</button>'+
   (hasFile?'<button type="button" class="btn secondary btn-sm" data-preview-file="'+esc(r.id)+'">View</button>'+
   '<button type="button" class="btn secondary btn-sm" data-open-file="'+esc(r.id)+'">Download</button>':"")+'</div></div>';
 }).join("");
 $("pageContent").innerHTML='<div class="testing-doc-workspace"><div class="testing-doc-stats">'+
  '<div><small>Testing documents</small><strong>'+records.length+'</strong></div>'+
  '<div><small>Files available</small><strong>'+records.filter(r=>r.data?.storage_path).length+'</strong></div>'+
  '<div><small>Document categories</small><strong>'+categories.length+'</strong></div></div>'+
  '<section class="testing-doc-list"><div class="directory-toolbar">'+
  '<div class="directory-search"><input id="recordSearch" type="search" aria-label="Search testing documents" placeholder="Search documents or orders" value="'+esc(state.search)+'"></div>'+
  '<select id="statusFilter" aria-label="Filter by document category"><option value="">All document categories</option>'+
  TEST_DOC_CATEGORIES.filter(([value])=>categories.includes(value)).map(([value,name])=>
   '<option value="'+esc(value)+'"'+(category===value?" selected":"")+'>'+esc(name)+'</option>').join("")+'</select>'+
  '<span class="directory-total">'+visible.length+' documents</span></div>'+
  (rows||'<div class="directory-empty"><h2>No matching documents</h2><p>Upload a testing document to add it to your secure file library.</p></div>')+
  '</section></div>';
}
function renderTestingDocumentManagement(record,action){
 const d=record?.data||{},view=action==="view",file=!!d.storage_path;
 if(view){
  $("pageContent").innerHTML='<div class="testing-doc-workspace"><div class="testing-doc-profile">'+
   '<div class="testing-doc-profile-header"><span class="testing-doc-icon">'+navIcon("testing_documents")+'</span>'+
   '<div><strong>'+esc(d.title||"Testing document")+'</strong><small>'+esc(testingDocCategory(d.document_type))+'</small></div>'+
   '<span class="mgmt-status '+(file?"positive":"pending")+'">'+(file?"File available":"File unavailable")+'</span></div>'+
   managementOverviewGroup("Document information",[
    ["Document title",d.title],["Document category",testingDocCategory(d.document_type)],
    ["File name",d.file_name],["Document date",d.document_date],
    ["Order reference",d.order_reference],["Description",d.description],
    ["Status",d.status],["Uploaded",record.created_at?new Date(record.created_at).toLocaleDateString():"—"]])+
   '<div class="testing-doc-profile-actions">'+(file?
    '<button type="button" class="btn secondary" data-preview-file="'+esc(record.id)+'">View document</button>'+
    '<button type="button" class="btn primary" data-open-file="'+esc(record.id)+'">Download</button>':"")+
    (["owner","admin","editor"].includes(activeWorkspace()?.role||"")?'<button type="button" class="btn secondary" data-edit="'+esc(record.id)+'">Edit details</button>':"")+
    '<button type="button" class="btn secondary" data-back-list>Back to documents</button></div>'+
   '</div></div>';
  return;
 }
 const opts=(list,selected)=>'<option value="">Select document category</option>'+
  list.map(([value,label])=>'<option value="'+esc(value)+'"'+(selected===value?" selected":"")+'>'+esc(label)+'</option>').join("");
 $("pageContent").innerHTML='<div class="testing-doc-workspace"><form id="testingDocForm" class="testing-doc-form">'+
  '<section class="testing-doc-section"><h2>Document details</h2><div class="testing-doc-grid">'+
  '<label class="testing-doc-field"><span>Document title *</span><input name="title" required maxlength="180" value="'+esc(d.title||"")+'" placeholder="Enter document title"></label>'+
  '<label class="testing-doc-field"><span>Document category *</span><select name="document_type" required>'+opts(TEST_DOC_CATEGORIES,d.document_type)+'</select></label>'+
  '<label class="testing-doc-field"><span>Document date</span><input type="date" name="document_date" value="'+esc(d.document_date||"")+'"></label>'+
  '<label class="testing-doc-field"><span>Status</span><select name="status"><option value="received"'+(d.status==="received"?" selected":"")+'>Received</option>'+
  '<option value="verified"'+(d.status==="verified"?" selected":"")+'>Verified</option></select></label>'+
  '<label class="testing-doc-field full"><span>Description / notes</span><textarea name="description" rows="3" maxlength="2000" placeholder="Internal description">'+esc(d.description||"")+'</textarea></label></div></section>'+
  '<section class="testing-doc-section"><h2>Related testing records</h2><div class="testing-doc-grid">'+
  '<label class="testing-doc-field"><span>Company</span><select id="testingDocCompany" name="company_id" disabled><option value="">Loading companies…</option></select></label>'+
  '<label class="testing-doc-field"><span>Person / donor</span><select id="testingDocPerson" name="person_id" disabled><option value="">Loading people…</option></select></label>'+
  '<label class="testing-doc-field full"><span>Testing order</span><select id="testingDocOrder" name="testing_order_id" disabled><option value="">Loading orders…</option></select></label></div>'+
  '<p class="testing-doc-hint" id="testingDocRelationHint">Optional associations help organize documents by customer, donor, or order.</p></section>'+
  '<section class="testing-doc-section"><h2>'+ (record?"Replace document file":"Upload document")+'</h2>'+
  '<label class="testing-doc-dropzone" for="testingDocFile"><span class="testing-doc-upload-symbol">'+navIcon("testing_documents")+'</span>'+
  '<strong id="testingDocFileName">'+(record&&d.file_name?esc(d.file_name):"Choose a document to upload")+'</strong>'+
  '<small>PDF, JPG, PNG, WEBP, TXT, DOC, DOCX · Maximum 8 MB</small>'+
  '<input type="file" id="testingDocFile" name="document_file" accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.doc,.docx"'+(record?"":" required")+'></label>'+
  (record?'<p class="testing-doc-hint">Leave the file empty to update document details without replacing the existing file.</p>':"")+
  '</section><p id="testingDocError" class="manage-form-error" role="alert"></p>'+
  '<footer class="program-actions"><button type="button" class="btn secondary" data-back-list>Cancel</button>'+
  '<button type="submit" class="btn primary" id="testingDocSave">'+(record?"Save changes":"Upload document")+'</button></footer>'+
  '</form></div>';
 void prepareTestingDocumentRelations(record);
}
async function submitTestingDocument(form){
 if(!form.reportValidity())return;
 const m=state.management,btn=$("testingDocSave");btn.disabled=true;
 const d=Object.fromEntries(new FormData(form).entries()),file=d.document_file;delete d.document_file;
 d.visibility="internal";
 const refs=state.testingDocRefs||{},company=(refs.employers||[]).concat(refs.owner_operators||[]).find(r=>r.id===d.company_id);
 const order=(refs.testing_orders||[]).find(r=>r.id===d.testing_order_id);
 if(d.company_id&&!company){$("testingDocError").textContent="Company selection is unavailable.";btn.disabled=false;return}
 if(d.testing_order_id&&!order){$("testingDocError").textContent="Select a valid testing order.";btn.disabled=false;return}
 d.order_reference=order?.data?.name||"";
 try{
  if(file instanceof File&&file.size){
   await uploadManagementFile(file,d,state.context,m?.id||null);
  }else if(m?.id){
   await api("save",{tenant_id:state.tenantId,operating_context:state.context,kind:"testing_documents",id:m.id,
    record_context:state.context,data:d});
  }else throw Error("Choose a document file to upload.");
  state.cache.delete(cacheKey());leaveManagement();
  message(m?.id?"Testing document details updated.":"Testing document uploaded securely.");
  void loadRecords();
 }catch(e){$("testingDocError").textContent=e.message;btn.disabled=false}
}

function resultsManagementList(records){
 const search=state.search.trim().toLowerCase(),filter=state.statusFilter;
 const visible=records.filter(r=>(!search||[r.data?.name,r.data?.status,r.data?.notes].some(v=>String(v||"").toLowerCase().includes(search)))&&(!filter||r.data?.status===filter));
 const rows=visible.map(r=>'<button class="results-row" type="button" data-view="'+esc(r.id)+'">'+
  '<span class="results-row-icon">'+navIcon("results")+'</span><span class="results-row-name"><strong>'+
  esc(r.data?.name||"Result report")+'</strong><small>'+esc(r.data?.reported_at?new Date(r.data.reported_at).toLocaleDateString():"Date not provided")+
  '</small></span><span class="mgmt-status '+statusClass(r.data?.status)+'">'+esc(statusLabel(r.data?.status))+'</span>'+
  '<span class="results-row-view">View result</span></button>').join("");
 $("pageContent").innerHTML='<div class="results-workspace"><div class="results-intro">'+
  '<span class="results-intro-icon">'+navIcon("results")+'</span><div><strong>Official testing results</strong>'+
  '<p>Review finalized MRO reports received from Testing Operations, download authorized documents, and deliver them to the employer contact.</p></div></div>'+
  '<section class="results-list"><div class="directory-toolbar"><div class="directory-search">'+
  '<input id="recordSearch" type="search" value="'+esc(state.search)+'" placeholder="Search result references"></div>'+
  '<select id="statusFilter"><option value="">All statuses</option><option value="final"'+(filter==="final"?" selected":"")+'>Final</option>'+
  '<option value="pending"'+(filter==="pending"?" selected":"")+'>Pending</option></select>'+
  '<span class="directory-total">'+visible.length+' results</span></div>'+
  (rows||'<div class="directory-empty"><h2>No results available</h2><p>Official results will appear here after they are received from Testing Operations.</p></div>')+
  '</section></div>';
}
async function populateOfficialResult(id){
 const m=state.management,seq=state.sequence;
 try{
  const r=await api("result_details",{tenant_id:state.tenantId,operating_context:state.context,id});
  if(state.page!=="results"||state.management!==m||seq!==state.sequence)return;
  state.officialResult=r;
  const box=$("officialResultBody");if(!box)return;
  const row=(label,val)=>'<div class="official-result-field"><small>'+esc(label)+'</small><strong>'+esc(val||"Not provided")+'</strong></div>';
  const ready=r.document_ready;
  box.innerHTML='<div class="official-result-status '+(ready?"ready":"waiting")+'">'+
   '<span>'+ (ready?"✓":"!")+'</span><div><strong>'+(ready?"Official MRO document ready":"Official MRO document pending")+'</strong>'+
   '<small>'+(ready?"Verified finalized PDF available for authorized delivery.":"Testing Operations must attach the official finalized PDF before it can be downloaded or sent.")+'</small></div></div>'+
   '<section class="official-result-section"><h2>Donor and employer</h2><div class="official-result-grid">'+
   row("Donor",r.donor_name)+row("Date of birth",r.donor_birthdate)+
   row("Employer",r.employer_name)+row("Designated employer email",r.recipient_email)+'</div></section>'+
   '<section class="official-result-section"><h2>Official result</h2><div class="official-result-grid">'+
   row("Result number",r.report_number)+row("Status",statusLabel(r.status))+
   row("MRO verified result",statusLabel(r.verified_result))+row("Testing reason",statusLabel(r.test_reason))+
   row("Specimen",statusLabel(r.specimen_type))+row("Laboratory",r.lab_name)+
   row("MRO",r.mro_name)+row("Finalized",r.finalized_at?new Date(r.finalized_at).toLocaleString():"")+
   '</div></section>'+
   '<section class="official-result-section"><h2>Official MRO document</h2><div class="official-result-file">'+
   '<span class="results-row-icon">'+navIcon("testing_documents")+'</span><div><strong>'+esc(r.document_name)+'</strong>'+
   '<small>'+ (ready?"Official PDF · Confidential":"Official document not yet available")+'</small></div>'+
   '<button class="btn secondary" type="button" data-result-document="preview"'+(ready?"":" disabled")+'>View</button>'+
   '<button class="btn secondary" type="button" data-result-document="download"'+(ready?"":" disabled")+'>Download</button></div></section>'+
   '<section class="official-result-section"><h2>Employer delivery</h2>'+
   '<p class="official-result-description">Send the official MRO PDF directly to the designated employer contact. The report remains confidential; only authorized employer contact information is used.</p>'+
   row("Delivery status",r.sent_at?"Sent "+new Date(r.sent_at).toLocaleString():statusLabel(r.delivery_status))+
   '<div class="official-result-actions"><button class="btn primary" type="button" data-result-send'+
   (ready&&r.recipient_email&&r.donor_name?"":" disabled")+'>'+ (r.sent_at?"Send again to employer":"Send to employer")+'</button></div></section>';
 }catch(error){if(state.management===m&&$("officialResultBody"))
  $("officialResultBody").innerHTML='<div class="official-result-status waiting"><strong>'+esc(error.message)+'</strong></div>';}
}
function renderOfficialResult(record){
 state.officialResult=null;
 $("pageActions").innerHTML='<button type="button" class="btn secondary" data-back-list>Back to Results</button>';
 $("pageContent").innerHTML='<div class="results-workspace official-result-profile">'+
  '<div class="program-head"><span class="program-head-icon">'+navIcon("results")+'</span><div>'+
  '<strong>'+esc(record?.data?.name||"Official testing result")+'</strong>'+
  '<small>Confidential MRO result delivery</small></div>'+recordStatus(record)+'</div>'+
  '<div id="officialResultBody" class="official-result-body"><div class="loading-line"><span class="spinner"></span>Verifying official result and document…</div></div>'+
  '<footer class="program-actions"><button class="btn secondary" type="button" data-back-list>Back to Results</button></footer></div>';
 if(record)void populateOfficialResult(record.id);
}
async function officialResultFile(mode){
 const id=state.management?.id,r=state.officialResult;
 if(!id||!r?.document_ready)return;
 try{
  const link=await api("result_document_link",{tenant_id:state.tenantId,operating_context:state.context,id});
  if(mode==="preview"){
   $("modalTitle").textContent="Official MRO Document";
   $("modalDescription").textContent=r.report_number;
   $("recordFields").innerHTML='<div class="document-preview"><iframe src="'+esc(link.url)+'" title="Official MRO PDF" referrerpolicy="no-referrer"></iframe></div>';
   $("recordForm").dataset.mode="view";$("saveRecord").hidden=true;
   $("modal").hidden=false;document.body.classList.add("modal-open");
  }else{
   const response=await fetch(link.url,{cache:"no-store"});
   if(!response.ok)throw Error("Unable to download the official document.");
   const blob=await response.blob(),object=URL.createObjectURL(blob);
   const a=document.createElement("a");a.href=object;a.download=link.filename||"Official MRO Result.pdf";
   document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(object),30000);
  }
 }catch(error){message(error.message,true)}
}
function confirmOfficialResultSend(){
 const r=state.officialResult;
 if(!r?.document_ready||!r.recipient_email||!state.management?.id)return;
 $("modalTitle").textContent="Send official result to employer";
 $("modalDescription").textContent="Confirm the authorized employer contact before releasing confidential result information.";
 $("recordFields").innerHTML='<div class="official-result-confirm"><p>Report: <strong>'+esc(r.report_number)+'</strong></p>'+
  '<p>Employer: <strong>'+esc(r.employer_name)+'</strong></p>'+
  '<p>Recipient: <strong>'+esc(r.recipient_email)+'</strong></p>'+
  '<p>The finalized official PDF will be emailed to this employer contact. This action will be recorded in the result delivery history.</p></div>';
 $("recordForm").dataset.mode="send-official-result";
 $("saveRecord").hidden=false;$("saveRecord").disabled=false;
 $("saveRecord").className="btn primary";$("saveRecord").textContent="Confirm and send result";
 $("formMessage").textContent="";$("modal").hidden=false;document.body.classList.add("modal-open");
}
async function sendOfficialResult(){
 const id=state.management?.id,r=state.officialResult,button=$("saveRecord");
 if(!id||!r?.document_ready)return;
 button.disabled=true;
 try{
  const res=await api("result_send_to_employer",{tenant_id:state.tenantId,
   operating_context:state.context,id,confirm_recipient:r.recipient_email});
  closeModal();message(res.warning||"Official result sent to the employer contact.");
  if(state.management?.id===id)void populateOfficialResult(id);
 }catch(error){$("formMessage").textContent=error.message;button.disabled=false}
}

let physicalRequestId=null;
function physicalOrderList(records){
 const q=state.search.trim().toLowerCase(),filter=state.statusFilter;
 const visible=records.filter(r=>{
  const d=r.data||{};
  return (!q||[d.reference,d.employee_name,d.employer,d.physical_type,d.case_number].some(v=>String(v||"").toLowerCase().includes(q)))&&
   (!filter||d.status===filter);
 });
 const statusOptions=[...new Set(records.map(r=>r.data?.status).filter(Boolean))].sort();
 const items=visible.map(r=>{
  const d=r.data||{};
  return '<button class="physical-list-row" type="button" data-view="'+esc(r.id)+'">'+
   '<span class="results-row-icon">'+navIcon("occupational_health")+'</span>'+
   '<span class="physical-list-primary"><strong>'+esc(d.reference||"Physical order")+'</strong><small>'+esc(d.employee_name||"Employee")+' · '+esc(d.employer||"Employer")+'</small></span>'+
   '<span class="physical-list-type">'+esc(d.physical_type==="DOT"?"DOT Physical":"NON-DOT Physical")+'</span>'+
   '<span class="mgmt-status '+statusClass(d.status)+'">'+esc(statusLabel(d.status))+'</span>'+
   '<span class="results-row-view">View order</span></button>';
 }).join("");
 $("pageContent").innerHTML='<div class="results-workspace physical-workspace">'+
  '<section class="results-intro"><span class="results-intro-icon">'+navIcon("occupational_health")+'</span><div>'+
  '<strong>Occupational physical orders</strong><p>Order DOT and NON-DOT physicals for employees. Submitted requests go directly to Workforce Testing Operations for scheduling and processing.</p></div></section>'+
  '<section class="results-list"><div class="directory-toolbar"><div class="directory-search"><input type="search" id="recordSearch" aria-label="Search physical orders" placeholder="Search orders, employees or employers" value="'+esc(state.search)+'"></div>'+
  '<select id="statusFilter" aria-label="Filter physical orders"><option value="">All statuses</option>'+
  statusOptions.map(v=>'<option value="'+esc(v)+'"'+(filter===v?' selected':'')+'>'+esc(statusLabel(v))+'</option>').join("")+
  '</select><span class="directory-total">'+visible.length+' orders</span></div>'+
  (items||'<div class="directory-empty"><div class="directory-empty-icon">'+navIcon("occupational_health")+'</div><h2>No physical orders yet</h2>'+
  '<p>Submit a physical request and track its status here as Testing Operations processes it.</p>'+
  (["owner","admin","editor"].includes(activeWorkspace()?.role||"")?'<button type="button" class="btn primary" data-create="1">Order a physical</button>':"")+'</div>')+
  '</section></div>';
}
function renderPhysicalOrder(record,mode){
 const d=record?.data||{};
 if(mode==="view"){
  const item=(label,value)=>'<div class="official-result-field"><small>'+esc(label)+'</small><strong>'+esc(value||"Not provided")+'</strong></div>';
  $("pageContent").innerHTML='<div class="results-workspace official-result-profile physical-workspace">'+
   '<div class="program-head"><span class="program-head-icon">'+navIcon("occupational_health")+'</span><div><strong>'+esc(d.reference||"Physical order")+'</strong>'+
   '<small>Workforce Testing Operations · '+esc(d.physical_type==="DOT"?"DOT":"NON-DOT")+'</small></div>'+recordStatus(record)+'</div>'+
   '<section class="official-result-section"><h2>Employee and employer</h2><div class="official-result-grid">'+
   item("Employee",d.employee_name)+item("Employer",d.employer)+item("Employee email",d.donor_email)+item("Employee phone",d.donor_phone)+'</div></section>'+
   '<section class="official-result-section"><h2>Physical request</h2><div class="official-result-grid">'+
   item("Physical",d.physical_type==="DOT"?"DOT Physical":"NON-DOT Physical")+item("Exam type",statusLabel(d.exam_type))+
   item("Preferred date",d.requested_date)+item("Processing status",statusLabel(d.status))+
   item("Testing case",d.case_number)+item("Scheduled appointment",d.scheduled_at?new Date(d.scheduled_at).toLocaleString():"Awaiting scheduling")+
   '</div></section><section class="official-result-section"><h2>Instructions</h2><p class="official-result-description">'+esc(d.notes||"No additional instructions.")+'</p></section>'+
   '<footer class="program-actions"><button class="btn secondary" type="button" data-back-list>Back to Occupational Health</button></footer></div>';
  return;
 }
 if(!physicalRequestId)physicalRequestId=crypto.randomUUID();
 const examOptions=[["physical","Standard physical"],["pre_employment","Pre-employment physical"],["recertification","Recertification"],["return_to_duty","Return-to-duty physical"],["fit_for_duty","Fitness-for-duty evaluation"]];
 const initial=state.context==="dot"?"DOT":"NON_DOT";
 $("pageContent").innerHTML='<div class="physical-workspace"><div class="physical-order-intro"><span class="program-head-icon">'+navIcon("occupational_health")+'</span>'+
  '<div><h2>Order an occupational physical</h2><p>Choose the employer and employee, then submit the request to Testing Operations.</p></div></div>'+
  '<form id="physicalOrderForm" class="management-editor">'+
  '<section class="management-section"><header class="management-section-header"><h2>Physical examination</h2></header>'+
  '<div class="physical-type-choice"><label><input type="radio" name="physical_type" value="DOT"'+(initial==="DOT"?" checked":"")+'> DOT Physical</label>'+
  '<label><input type="radio" name="physical_type" value="NON_DOT"'+(initial==="NON_DOT"?" checked":"")+'> NON-DOT Physical</label></div>'+
  '<p class="physical-helper">Choose DOT or NON-DOT. Selecting another type switches the matching workspace before you select an employer and employee.</p>'+
  '<div class="manage-form-grid"><label class="manage-field"><span>Examination type *</span><select name="exam_type" required>'+
  examOptions.map(([v,t])=>'<option value="'+esc(v)+'">'+esc(t)+'</option>').join("")+'</select></label>'+
  '<label class="manage-field"><span>Preferred appointment date</span><input name="requested_date" type="date"></label></div></section>'+
  '<section class="management-section"><header class="management-section-header"><h2>Employer and employee</h2></header>'+
  '<div class="manage-form-grid"><label class="manage-field"><span>Employer / Owner-Operator *</span><select name="company_id" id="physicalCompany" required disabled><option value="">Loading employers…</option></select></label>'+
  '<label class="manage-field"><span>Employee *</span><select name="person_id" id="physicalPerson" required disabled><option value="">Select employer first</option></select></label></div>'+
  '<p class="physical-helper">The employee must already be assigned to the selected employer in People.</p></section>'+
  '<section class="management-section"><header class="management-section-header"><h2>Additional information</h2></header>'+
  '<div class="manage-form-grid"><label class="manage-field physical-notes"><span>Scheduling instructions (optional)</span>'+
  '<textarea name="notes" rows="4" maxlength="2000" placeholder="Preferred location, availability, or information for Testing Operations"></textarea></label></div></section>'+
  '<p id="physicalOrderError" class="manage-form-error" role="alert"></p>'+
  '<footer class="management-editor-actions"><button type="button" class="btn secondary" data-back-list>Cancel</button>'+
  '<button type="submit" class="btn primary" id="physicalOrderSubmit" disabled>Submit physical order</button></footer></form></div>';
 void hydratePhysicalOrder();
}
async function hydratePhysicalOrder(){
 const m=state.management,context=state.context;
 try{
  const kinds=context==="dot"?["employers","owner_operators","people"]:["employers","people"];
  const res=await Promise.all(kinds.map(kind=>api("list",{tenant_id:state.tenantId,operating_context:context,kind})));
  if(state.management!==m||state.context!==context)return;
  const companies=kinds.flatMap((kind,i)=>kind==="people"?[]:res[i].records||[]);
  const people=res[kinds.indexOf("people")].records||[];
  const company=$("physicalCompany"),person=$("physicalPerson"),submit=$("physicalOrderSubmit");
  if(!company||!person)return;
  company.innerHTML='<option value="">Select employer</option>'+companies.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.data?.legal_name||"Employer")+'</option>').join("");
  company.disabled=false;
  const update=()=>{
   const candidates=people.filter(p=>p.data?.company_id===company.value&&p.data?.status!=="inactive");
   person.innerHTML='<option value="">Select employee</option>'+candidates.map(p=>'<option value="'+esc(p.id)+'">'+esc([p.data?.first_name,p.data?.last_name].filter(Boolean).join(" ")||"Employee")+'</option>').join("");
   person.disabled=!company.value;submit.disabled=!company.value||!person.value;
  };
  company.addEventListener("change",update);
  person.addEventListener("change",()=>{submit.disabled=!company.value||!person.value});
  update();
  if(!companies.length)$("physicalOrderError").textContent="Create an employer before ordering a physical.";
 }catch(error){if(state.management===m&&$("physicalOrderError"))$("physicalOrderError").textContent="Unable to load employers and employees: "+error.message}
}
async function submitPhysicalOrder(form){
 const button=$("physicalOrderSubmit"),errorBox=$("physicalOrderError");
 if(!form.reportValidity()||!button||button.disabled)return;
 const payload=Object.fromEntries(new FormData(form).entries());
 if(payload.physical_type!==(state.context==="dot"?"DOT":"NON_DOT")){
  errorBox.textContent="Switch to the matching DOT or NON-DOT workspace before ordering.";return;
 }
 button.disabled=true;errorBox.textContent="";
 try{
  const result=await api("occupational_health_submit",{tenant_id:state.tenantId,operating_context:state.context,
   request_id:physicalRequestId,company_id:payload.company_id,person_id:payload.person_id,
   exam_type:payload.exam_type,requested_date:payload.requested_date,notes:payload.notes});
  physicalRequestId=null;
  state.cache.delete(cacheKey());leaveManagement();
  message("Physical order "+(result.reference_number||"")+" submitted to Testing Operations.");
 }catch(error){errorBox.textContent=error.message;button.disabled=false}
}


const COMPLIANCE_SECTIONS=[
 ["Compliance record",["name","scope","category","review_date","outcome"]],
 ["Findings and follow-up",["findings","notes","corrective_action","due_date","priority","status"]]
];
function complianceDirectory(records){
 const search=state.search.trim().toLowerCase(),filter=state.statusFilter;
 const visible=records.filter(r=>{const d=r.data||{};return (!search||[d.name,d.employer,d.employee_name,d.findings,d.notes,d.category,d.outcome].some(v=>String(v||"").toLowerCase().includes(search)))&&(!filter||d.status===filter)});
 const entries=visible.map(r=>{const d=r.data||{};
 return '<button class="compliance-record-row" type="button" data-view="'+esc(r.id)+'">'+
 '<span class="results-row-icon">'+navIcon("compliance")+'</span>'+
 '<span class="compliance-record-title"><strong>'+esc(d.name||"Compliance record")+'</strong>'+
 '<small>'+esc(d.employer||"Company unavailable")+(d.employee_name?" · "+esc(d.employee_name):" · Company-wide")+'</small></span>'+
 '<span class="compliance-record-outcome">'+esc(statusLabel(d.outcome))+'</span>'+
 '<span class="mgmt-status '+statusClass(d.status)+'">'+esc(statusLabel(d.status))+'</span>'+
 '<span class="results-row-view">View record</span></button>';
 }).join("");
 const statuses=["open","in_progress","resolved","closed"];
 $("pageContent").innerHTML='<div class="results-workspace compliance-workspace">'+
 '<section class="results-intro"><span class="results-intro-icon">'+navIcon("compliance")+'</span><div>'+
 '<strong>Employer and employee compliance</strong><p>Record compliance findings, review outcomes, internal notes and corrective actions against the correct company and employee. These are C/TPA case notes, not official MRO results.</p></div></section>'+
 '<section class="results-list"><div class="directory-toolbar"><div class="directory-search">'+
 '<input id="recordSearch" aria-label="Search compliance records" type="search" value="'+esc(state.search)+'" placeholder="Search company, employee, findings or case"></div>'+
 '<select id="statusFilter" aria-label="Filter compliance status"><option value="">All statuses</option>'+
 statuses.map(v=>'<option value="'+v+'"'+(filter===v?" selected":"")+'>'+esc(statusLabel(v))+'</option>').join("")+'</select>'+
 '<span class="directory-total">'+visible.length+' records</span></div>'+
 (entries||'<div class="directory-empty"><div class="directory-empty-icon">'+navIcon("compliance")+'</div>'+
 '<h2>No compliance records yet</h2><p>Create a compliance record associated with an employer, and optionally an employee.</p>'+
 (["owner","admin","editor"].includes(activeWorkspace()?.role||"")?'<button type="button" class="btn primary" data-create="1">Add Compliance Record</button>':"")+'</div>')+
 '</section></div>';
}
function renderComplianceManagement(record,mode,canWrite){
 const d=record?.data||{},view=mode==="view";
 const name=d.name||"New compliance record";
 const header='<div class="program-head"><span class="program-head-icon">'+navIcon("compliance")+'</span><div><strong>'+esc(name)+'</strong>'+
 '<small>'+esc(d.employer||"Company association required")+(d.employee_name?" · "+esc(d.employee_name):"")+'</small></div>'+
 (record?recordStatus(record):'<span class="mgmt-status pending">New record</span>')+'</div>';
 if(view){
  const item=(label,value)=>'<div class="official-result-field"><small>'+esc(label)+'</small><strong>'+esc(value||"Not provided")+'</strong></div>';
  $("pageContent").innerHTML='<div class="results-workspace compliance-profile">'+header+
   '<section class="official-result-section"><h2>Employer and employee</h2><div class="official-result-grid">'+
   item("Company",d.employer)+item("Employee",d.employee_name||"Company-wide")+item("Record scope",statusLabel(d.scope))+'</div></section>'+
   '<section class="official-result-section"><h2>Compliance assessment</h2><div class="official-result-grid">'+
   item("Category",statusLabel(d.category))+item("Outcome",statusLabel(d.outcome))+item("Review date",d.review_date)+
   item("Priority",statusLabel(d.priority))+item("Case status",statusLabel(d.status))+item("Follow-up deadline",d.due_date)+'</div></section>'+
   '<section class="official-result-section"><h2>Findings and results</h2><p class="compliance-note">'+esc(d.findings||"Not provided")+'</p></section>'+
   '<section class="official-result-section"><h2>Internal case notes</h2><p class="compliance-note">'+esc(d.notes||"No notes recorded")+'</p></section>'+
   '<section class="official-result-section"><h2>Corrective actions and follow-up</h2><p class="compliance-note">'+esc(d.corrective_action||"No follow-up recorded")+'</p></section>'+
   '<footer class="program-actions"><button type="button" class="btn secondary" data-back-list>Back to Compliance</button>'+
   (canWrite?'<button type="button" class="btn primary" data-manage-edit="'+esc(record.id)+'">Edit Record</button>':"")+'</footer></div>';
  return;
 }
 const definitions=fields("compliance");
 const blocks=COMPLIANCE_SECTIONS.map(([title,names])=>managementSection(title,names.map(name=>definitions.find(f=>f.name===name)).filter(Boolean),record)).join("");
 const companySection='<section class="management-section compliance-association"><header class="management-section-header"><h2>Employer and employee</h2></header>'+
 '<div class="manage-form-grid"><label class="manage-field"><span>Associated company <span class="required-mark">*</span></span>'+
 '<select id="complianceCompany" name="company_selection" required disabled><option value="">Loading authorized companies…</option></select></label>'+
 '<label class="manage-field"><span>Associated employee</span>'+
 '<select id="compliancePerson" name="person_selection" disabled><option value="">Company-wide record</option></select></label></div>'+
 '<p class="compliance-helper">The employee list contains only people assigned to the selected company. Company-wide findings do not require an employee.</p></section>';
 $("pageContent").innerHTML='<div class="compliance-profile">'+header+
 '<form id="managementForm">'+companySection+blocks+
 '<p id="managementError" class="manage-form-error" role="alert"></p>'+
 '<footer class="management-editor-actions"><button type="button" class="btn secondary" data-back-list>Cancel</button>'+
 '<button type="submit" id="managementSave" class="btn primary" disabled>'+(record?"Save changes":"Create compliance record")+'</button></footer></form></div>';
 const sf=$("managementForm").elements.namedItem("status");if(sf&&!sf.value)sf.value="open";
 const pf=$("managementForm").elements.namedItem("priority");if(pf&&!pf.value)pf.value="normal";
 const of=$("managementForm").elements.namedItem("outcome");if(of&&!of.value)of.value="pending";
 const scope=$("managementForm").elements.namedItem("scope");if(scope&&!scope.value)scope.value="company";
 void hydrateComplianceCompanies(record);
}
async function hydrateComplianceCompanies(record){
 const m=state.management,seq=state.sequence,context=state.context;
 try{
  const kinds=context==="dot"?["employers","owner_operators","people"]:["employers","people"];
  const responses=await Promise.all(kinds.map(async kind=>{
   const key=cacheKey(kind),old=state.cache.get(key);
   if(old&&Date.now()-old.time<30000)return old.records;
   const result=await api("list",{tenant_id:state.tenantId,operating_context:context,kind});
   state.cache.set(key,{records:result.records||[],time:Date.now()});return result.records||[];
  }));
  if(state.management!==m||seq!==state.sequence||state.context!==context)return;
  const companies=kinds.flatMap((k,i)=>k==="people"?[]:responses[i]);
  const people=responses[kinds.indexOf("people")];
  const company=$("complianceCompany"),person=$("compliancePerson"),save=$("managementSave");
  if(!company||!person||!save)return;
  company.innerHTML='<option value="">Select employer or owner-operator</option>'+
   companies.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.data?.legal_name||"Company")+'</option>').join("");
  if(record?.data?.company_id&&companies.some(r=>r.id===record.data.company_id))company.value=record.data.company_id;
  company.disabled=!companies.length;
  const sync=()=>{
   const related=people.filter(p=>p.data?.company_id===company.value);
   const selected=person.value||record?.data?.person_id||"";
   person.innerHTML='<option value="">Company-wide record</option>'+
    related.map(p=>'<option value="'+esc(p.id)+'">'+esc([p.data?.first_name,p.data?.last_name].filter(Boolean).join(" ")||"Person")+'</option>').join("");
   if(selected&&related.some(p=>p.id===selected))person.value=selected;
   person.disabled=!company.value;
   save.disabled=!company.value;
   record=null;
  };
  company.addEventListener("change",sync);
  sync();
  const scope=$("managementForm")?.elements.namedItem("scope");
  const updateScope=()=>{
   const required=scope?.value==="employee";
   person.required=required;
   if(required)person.options[0].textContent="Select employee (required)";
   else person.options[0].textContent="Company-wide record";
  };
  if(scope){scope.addEventListener("change",updateScope);updateScope();}
  if(!companies.length)$("managementError").textContent="Add an employer before creating compliance records.";
 }catch(error){if(state.management===m&&$("managementError"))$("managementError").textContent="Unable to load company and employee options: "+error.message}
}


let auditCatalog=null;
async function getAuditChecklist(){
 if(auditCatalog)return auditCatalog;
 const res=await api("audit_catalog",{tenant_id:state.tenantId,operating_context:"dot"});
 auditCatalog=res.items||[];
 return auditCatalog;
}
function auditList(records){
 const q=state.search.toLowerCase(),status=state.statusFilter;
 const visible=records.filter(r=>(!q||[r.data?.name,r.data?.carrier,r.data?.dot_number].some(v=>String(v||"").toLowerCase().includes(q)))&&(!status||r.data?.status===status));
 const rows=visible.map(r=>{
  const d=r.data||{},completed=Object.values(d.checklist||{}).filter(x=>x?.status==="reviewed"||x?.status==="not_applicable").length;
  return '<button type="button" class="audit-list-row" data-view="'+esc(r.id)+'"><span class="results-row-icon">'+navIcon("audits")+'</span>'+
   '<span class="audit-list-name"><strong>'+esc(d.name||"New Entrant Audit")+'</strong><small>'+esc(d.carrier||"Carrier not linked")+' · USDOT '+esc(d.dot_number||"Not provided")+'</small></span>'+
   '<span class="audit-list-progress">'+completed+'/22 items</span><span class="mgmt-status '+statusClass(d.status)+'">'+esc(statusLabel(d.status||"draft"))+'</span>'+
   '<span class="results-row-view">Open</span></button>';
 }).join("");
 $("pageContent").innerHTML='<div class="results-workspace audit-workspace"><section class="results-intro"><span class="results-intro-icon">'+navIcon("audits")+'</span><div>'+
  '<strong>FMCSA New Entrant Safety Audit preparation</strong><p>Prepare carrier records with an independent 22-item checklist, evidence uploads, review notes and progress tracking. FMCSA determines official audit outcomes.</p></div></section>'+
  '<section class="results-list"><div class="directory-toolbar"><div class="directory-search"><input id="recordSearch" aria-label="Search audits" type="search" placeholder="Search carrier or audit" value="'+esc(state.search)+'"></div>'+
  '<select id="statusFilter" aria-label="Filter audit status"><option value="">All statuses</option>'+
  ["draft","in_progress","ready","submitted","completed"].map(v=>'<option value="'+v+'"'+(status===v?" selected":"")+'>'+esc(statusLabel(v))+'</option>').join("")+'</select>'+
  '<span class="directory-total">'+visible.length+' audits</span></div>'+
  (rows||'<div class="directory-empty"><div class="directory-empty-icon">'+navIcon("audits")+'</div><h2>No New Entrant Audits</h2><p>Select a DOT carrier to prepare its safety audit.</p>'+
   (["owner","admin","editor"].includes(activeWorkspace()?.role||"")?'<button type="button" class="btn primary" data-create="1">Start New Entrant Audit</button>':"")+'</div>')+
  '</section></div>';
}
function renderAuditManagement(record,mode,canWrite){
 const data=record?.data||{},view=mode==="view",name=data.name||"New Entrant Audit";
 const header='<div class="program-head"><span class="program-head-icon">'+navIcon("audits")+'</span><div><strong>'+esc(name)+'</strong>'+
  '<small>'+esc(data.carrier||"DOT carrier not selected")+'</small></div>'+
  (record?recordStatus(record):'<span class="mgmt-status pending">New audit</span>')+'</div>';
 const editForm='<section class="management-section"><header class="management-section-header"><h2>Carrier and audit details</h2></header>'+
  '<div class="manage-form-grid"><label class="manage-field"><span>DOT carrier / owner-operator *</span><select id="auditCompany" name="company_id" required disabled><option value="">Loading carriers…</option></select></label>'+
  '<label class="manage-field"><span>Audit title</span><input name="name" maxlength="180" value="'+esc(data.name||"")+'" placeholder="New Entrant Audit"></label>'+
  '<label class="manage-field"><span>FMCSA notice date</span><input name="notice_date" type="date" value="'+esc(data.notice_date||"")+'"></label>'+
  '<label class="manage-field"><span>Audit due date</span><input name="due_date" type="date" value="'+esc(data.due_date||"")+'"></label>'+
  '<label class="manage-field"><span>Preparation status</span><select name="status">'+
  ["draft","in_progress","ready","submitted","completed"].map(v=>'<option value="'+v+'"'+(data.status===v?" selected":"")+'>'+esc(statusLabel(v))+'</option>').join("")+'</select></label>'+
  '<label class="manage-field audit-notes"><span>Internal preparation notes</span><textarea name="notes" rows="4" maxlength="5000">'+esc(data.notes||"")+'</textarea></label></div>'+
  '<p id="auditFormError" class="manage-form-error" role="alert"></p>'+
  '<footer class="management-editor-actions"><button type="button" class="btn secondary" data-back-list>Cancel</button>'+
  '<button type="submit" class="btn primary" id="auditSave" disabled>'+(record?"Save Audit Details":"Create Audit")+'</button></footer></section>';
 let html='<div class="audit-workspace audit-editor">'+header;
 if(!view){
  html+='<form id="auditForm">'+editForm+'</form></div>';
  $("pageContent").innerHTML=html;
  void hydrateAuditCarrier(record);
  return;
 }
 const percent=Number(data.readiness_percent)||0;
 html+='<div class="audit-summary-grid"><div><small>Carrier</small><strong>'+esc(data.carrier||"Unassigned")+'</strong></div>'+
  '<div><small>USDOT number</small><strong>'+esc(data.dot_number||"Not supplied")+'</strong></div>'+
  '<div><small>Due date</small><strong>'+esc(data.due_date||"Not set")+'</strong></div>'+
  '<div><small>Preparation</small><strong id="auditPercent">'+percent+'%</strong></div></div>'+
  '<div class="audit-progress"><div class="audit-progress-fill" id="auditProgressBar" style="width:'+percent+'%"></div></div>'+
  '<div class="audit-disclaimer">This is an internal audit-preparation workspace. Completing the checklist does not constitute FMCSA audit approval.</div>'+
  '<section class="audit-checklist-shell"><div class="audit-checklist-head"><div><h2>Audit preparation checklist</h2>'+
  '<p>Review each requirement, record evidence and notes, and mark the item status.</p></div>'+
  (canWrite?'<button type="button" class="btn secondary" data-manage-edit="'+esc(record.id)+'">Edit Audit Details</button>':"")+'</div>'+
  '<div id="auditChecklistContent" class="audit-checklist-content"><p class="audit-loading">Loading FMCSA checklist…</p></div></section>'+
  '<section class="official-result-section"><h2>Internal notes</h2><p class="compliance-note">'+esc(data.notes||"No preparation notes recorded.")+'</p></section>'+
  '<footer class="program-actions"><button type="button" class="btn secondary" data-back-list>Back to New Entrant Audits</button></footer></div>';
 $("pageContent").innerHTML=html;
 void renderAuditChecklistItems(record,canWrite);
}
async function hydrateAuditCarrier(record){
 const m=state.management,seq=state.sequence;
 try{
  const kinds=["employers","owner_operators"];
  const responses=await Promise.all(kinds.map(async kind=>{
   const key=cacheKey(kind),cached=state.cache.get(key);
   if(cached&&Date.now()-cached.time<30000)return cached.records;
   const r=await api("list",{tenant_id:state.tenantId,operating_context:"dot",kind});
   state.cache.set(key,{records:r.records||[],time:Date.now()});return r.records||[];
  }));
  if(m!==state.management||seq!==state.sequence)return;
  const select=$("auditCompany"),save=$("auditSave");if(!select||!save)return;
  const companies=responses.flat();
  select.innerHTML='<option value="">Select DOT carrier</option>'+
   companies.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.data?.legal_name||"Carrier")+'</option>').join("");
  if(record?.data?.company_id&&companies.some(c=>c.id===record.data.company_id))select.value=record.data.company_id;
  else if(record?.data?.carrier){
   const matched=companies.find(c=>c.data?.legal_name===record.data.carrier);
   if(matched)select.value=matched.id;
  }
  select.disabled=!companies.length;save.disabled=!companies.length;
  if(!companies.length)$("auditFormError").textContent="Create a DOT employer or owner-operator before starting an audit.";
 }catch(err){if(state.management===m&&$("auditFormError"))$("auditFormError").textContent=err.message}
}
async function saveAudit(form){
 const button=$("auditSave"),error=$("auditFormError");
 if(!form.reportValidity()||!button||button.disabled)return;
 button.disabled=true;error.textContent="";
 const d=Object.fromEntries(new FormData(form).entries());
 try{
  const r=await api("audit_save",{tenant_id:state.tenantId,operating_context:"dot",
   id:state.management?.id||null,company_id:d.company_id,name:d.name,notice_date:d.notice_date,
   due_date:d.due_date,status:d.status,notes:d.notes});
  state.cache.delete(cacheKey());
  state.management=null;
  void loadRecords();
  message("New Entrant Audit saved.");
 }catch(err){error.textContent=err.message;button.disabled=false}
}
async function renderAuditChecklistItems(record,canWrite){
 const m=state.management;
 try{
  const catalog=await getAuditChecklist();
  if(m!==state.management||!$("auditChecklistContent"))return;
  const groups=[...new Set(catalog.map(x=>x.section))];
  const statusOpts=["missing","requested","received","reviewed","not_applicable"];
  $("auditChecklistContent").innerHTML=groups.map(section=>{
   const rows=catalog.filter(x=>x.section===section);
   return '<section class="audit-checklist-group"><h3>'+esc(rows[0].section_title)+' <small>'+rows.length+' items</small></h3>'+
   rows.map(x=>{
    const entry=record.data?.checklist?.[x.code]||{},files=entry.documents||[];
    const current=entry.status||"missing";
    return '<article class="audit-checklist-item" data-audit-item="'+esc(x.code)+'">'+
     '<div class="audit-item-heading"><div><strong>'+esc(x.title)+'</strong>'+
     '<small>'+esc(x.citation)+(x.conditional?" · If applicable":" · Required")+'</small></div>'+
     '<span class="mgmt-status '+statusClass(current)+'">'+esc(statusLabel(current))+'</span></div>'+
     '<div class="audit-item-details"><label>Status <select data-audit-status="'+esc(x.code)+'"'+(!canWrite?" disabled":"")+'>'+
     statusOpts.filter(v=>v!=="not_applicable"||x.conditional).map(v=>
       '<option value="'+v+'"'+(current===v?" selected":"")+'>'+esc(statusLabel(v))+'</option>').join("")+
     '</select></label><label>Reviewer notes<textarea data-audit-notes="'+esc(x.code)+'" rows="2" maxlength="1600"'+(!canWrite?" disabled":"")+'>'+esc(entry.notes||"")+'</textarea></label></div>'+
     '<div class="audit-item-actions">'+(canWrite?'<button type="button" class="btn secondary" data-audit-item-save="'+esc(x.code)+'">Save Item</button>'+
     '<label class="audit-file-upload">Attach PDF or image<input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" data-audit-upload="'+esc(x.code)+'"></label>':"")+
     '</div><div class="audit-files">'+files.map((file,i)=>'<button type="button" class="btn secondary btn-sm" data-audit-download="'+esc(x.code)+'" data-audit-index="'+i+'">'+esc(file.name||"Evidence")+'</button>').join("")+
     '</div></article>';
   }).join("")+'</section>';
  }).join("");
 }catch(err){if(m===state.management&&$("auditChecklistContent"))$("auditChecklistContent").textContent="Unable to load the checklist: "+err.message}
}
async function saveAuditItem(code,button){
 const item=button.closest("[data-audit-item]");if(!item)return;
 const status=item.querySelector("[data-audit-status]")?.value;
 const notes=item.querySelector("[data-audit-notes]")?.value||"";
 button.disabled=true;
 try{
  const r=await api("audit_item_update",{tenant_id:state.tenantId,operating_context:"dot",
   audit_id:state.management?.id,item_code:code,status,notes});
  const cached=state.cache.get(cacheKey());
  const record=cached?.records.find(x=>x.id===state.management?.id);
  if(record){
   record.data.checklist=record.data.checklist||{};
   record.data.checklist[code]={...record.data.checklist[code],status,notes};
   record.data.readiness_percent=r.readiness_percent;
  }
  const badge=item.querySelector(".mgmt-status");if(badge){badge.className="mgmt-status "+statusClass(status);badge.textContent=statusLabel(status)}
  if($("auditPercent"))$("auditPercent").textContent=r.readiness_percent+"%";
  if($("auditProgressBar"))$("auditProgressBar").style.width=r.readiness_percent+"%";
  message("Checklist item saved.");
 }catch(err){message(err.message,true)}finally{button.disabled=false}
}
async function uploadAuditEvidence(input){
 const code=input.dataset.auditUpload,file=input.files?.[0];if(!file)return;
 if(file.size>8*1024*1024){message("Evidence must be 8 MB or less.",true);input.value="";return}
 if(!["application/pdf","image/png","image/jpeg","image/webp"].includes(file.type)){message("Choose a PDF or image.",true);input.value="";return}
 input.disabled=true;
 try{
  const encoded=await new Promise((resolve,reject)=>{
   const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]||"");
   reader.onerror=()=>reject(Error("Unable to read evidence file."));reader.readAsDataURL(file);
  });
  await api("audit_document_upload",{tenant_id:state.tenantId,operating_context:"dot",
   audit_id:state.management?.id,item_code:code,filename:file.name,mime_type:file.type,base64:encoded});
  state.cache.delete(cacheKey());
  const r=await api("list",{tenant_id:state.tenantId,operating_context:"dot",kind:"audits"});
  state.cache.set(cacheKey(),{records:r.records||[],time:Date.now()});
  const record=r.records?.find(x=>x.id===state.management?.id);
  if(record)void renderAuditChecklistItems(record,true);
  message("Evidence uploaded securely.");
 }catch(err){message(err.message,true)}finally{input.disabled=false;input.value=""}
}
async function downloadAuditEvidence(button){
 try{
  const r=await api("audit_document_link",{tenant_id:state.tenantId,operating_context:"dot",
   audit_id:state.management?.id,item_code:button.dataset.auditDownload,
   document_index:Number(button.dataset.auditIndex)});
  if(!r.url?.startsWith("https://"))throw Error("Attachment URL unavailable.");
  const blob=await fetch(r.url,{cache:"no-store"}).then(response=>{if(!response.ok)throw Error("Attachment download failed");return response.blob()});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=r.name||"audit-evidence";
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }catch(err){message(err.message,true)}
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
 const title=m.action==="new"?(state.page==="occupational_health"?"Order a Physical":"Add "+singular):m.action==="edit"?"Edit "+singular:
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
 if(state.page==="people"){
  renderPersonManagement(record,m.action,canWrite);
  return;
 }
 if(state.page==="compliance"){renderComplianceManagement(record,m.action,canWrite);return;}
 if(state.page==="audits"){renderAuditManagement(record,m.action,canWrite);return;}
 if(state.page==="programs"){
  renderProgramManagement(record,m.action,canWrite);
  return;
 }
 if(state.page==="pools"){
  renderPoolManagement(record,m.action,canWrite);
  return;
 }
 if(state.page==="selections"){renderSelections(record);return;}
 if(state.page==="testing_orders"){renderDrugOrder(record);return;}
 if(state.page==="testing_documents"){renderTestingDocumentManagement(record,m.action);return;}
 if(state.page==="results"){renderOfficialResult(record);return;}
 if(state.page==="occupational_health"){renderPhysicalOrder(record,m.action);return;}
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
 state.management=null;state.editing=null;state.companyDraft=null;
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
 if(state.companyDraft?.page===state.page&&m.action==="new"){
  data.company_id=state.companyDraft.companyId;
  if(Object.hasOwn(data,"employer"))data.employer=state.companyDraft.companyName;
  if(Object.hasOwn(data,"client"))data.client=state.companyDraft.companyName;
 }
 delete data.record_context;
 if(state.page==="pools"){
  const programSelection=form.querySelector("#poolProgram"),companySelection=form.querySelector("#poolCompany");
  if(!programSelection||programSelection.disabled||!companySelection||companySelection.disabled){
   $("managementError").textContent="Pool program and company choices have not loaded.";
   button.disabled=false;return;
  }
  const programId=data.program_selection,companyId=data.company_selection;
  delete data.program_selection;delete data.company_selection;
  const program=(state.cache.get(cacheKey("programs"))?.records||[]).find(r=>r.id===programId&&r.operating_context===state.context);
  const employers=[...(state.cache.get(cacheKey("employers"))?.records||[]),
   ...(state.cache.get(cacheKey("owner_operators"))?.records||[])];
  const company=companyId?employers.find(r=>r.id===companyId&&r.operating_context===state.context):null;
  if(!program||(companyId&&!company)){
   $("managementError").textContent="Choose a valid program and company in this workspace.";
   button.disabled=false;return;
  }
  data.program_id=program.id;
  data.program=program.data?.name||"";
  data.company_id=company?.id||"";
  data.employer=company?.data?.legal_name||"";
  data.program_type=state.context==="dot"?"DOT":"NON-DOT";
  if(state.context==="nondot")data.dot_agency="";
  if(!data.dot_agency&&state.context==="dot")data.dot_agency=program.data?.dot_agency||"";
  if(!data.status)data.status="active";
 }
 if(state.page==="programs"){
  const selector=form.querySelector("#programCompany");
  if(!selector||selector.disabled){
   $("managementError").textContent="Company options are still loading. Try again.";
   button.disabled=false;return;
  }
  const selected=data.company_selection||"";delete data.company_selection;
  const companies=[];
  for(const kind of state.context==="dot"?["employers","owner_operators"]:["employers"])
   companies.push(...(state.cache.get(cacheKey(kind))?.records||[]));
  const company=selected?companies.find(r=>r.id===selected&&r.operating_context===state.context):null;
  if(selected&&!company){
   $("managementError").textContent="Select a company from this workspace.";
   button.disabled=false;return;
  }
  data.company_id=company?.id||"";
  data.employer=company?.data?.legal_name||"";
  data.program_type=state.context==="dot"?"DOT":"NON-DOT";
  if(state.context==="nondot")data.dot_agency="";
  if(!data.status)data.status="active";
 }
 if(state.page==="compliance"){
  const companyId=data.company_selection||"",personId=data.person_selection||"";
  const companySelect=form.querySelector("#complianceCompany"),personSelect=form.querySelector("#compliancePerson");
  if(!companySelect||companySelect.disabled||!personSelect){
   $("managementError").textContent="Company options are not ready.";button.disabled=false;return;
  }
  const kinds=state.context==="dot"?["employers","owner_operators"]:["employers"];
  const companies=kinds.flatMap(kind=>state.cache.get(cacheKey(kind))?.records||[]);
  const company=companies.find(r=>r.id===companyId&&r.operating_context===state.context);
  const people=state.cache.get(cacheKey("people"))?.records||[];
  const person=personId?people.find(r=>r.id===personId&&r.data?.company_id===companyId):null;
  if(!company||(personId&&!person)){
   $("managementError").textContent="Choose a valid employer and employee association.";button.disabled=false;return;
  }
  if(data.scope==="employee"&&!person){
   $("managementError").textContent="Choose an employee for employee-specific compliance.";button.disabled=false;return;
  }
  delete data.company_selection;delete data.person_selection;
  data.company_id=company.id;data.employer=company.data?.legal_name||"";
  data.person_id=person?.id||"";data.employee_name=person?[person.data?.first_name,person.data?.last_name].filter(Boolean).join(" "):"";
 }
 if(state.page==="people"){
  const selected=data.company_selection||"";
  const companyControl=form.querySelector("#personCompanySelect");
  if(!companyControl||companyControl.disabled){
   $("managementError").textContent="Company choices have not loaded. Please retry.";
   button.disabled=false;return;
  }
  delete data.company_selection;
  const related=[];
  for(const kind of state.context==="dot"?["employers","owner_operators"]:["employers"]){
   related.push(...(state.cache.get(cacheKey(kind))?.records||[]));
  }
  const company=selected?related.find(r=>r.id===selected&&r.operating_context===state.context):null;
  if(!company){
   $("managementError").textContent="Select the company associated with this person.";
   button.disabled=false;return;
  }
  data.company_id=company.id;
  data.employer=company.data?.legal_name||"";
  if(!["employee","contact","staff"].includes(data.relationship)){
   $("managementError").textContent="Select Employee, Company Contact or Staff.";
   button.disabled=false;return;
  }
  if(!data.status)data.status="active";
 }
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
  let result=null;
  if(!uploaded)result=await api("save",{tenant_id:state.tenantId,operating_context:state.context,
   kind:state.page,record_context:recordContext,id:m.id||null,data});
  // Company classification is authoritative: route new accounts to their selected workspace.
  if(!m.id&&["employers","owner_operators"].includes(state.page)&&result){
   const nextContext=result.operating_context==="nondot"?"nondot":"dot";
   const nextKind=result.kind==="owner_operators"?"owner_operators":"employers";
   state.cache.clear();state.companyDraft=null;
   state.context=nextContext;sessionStorage.setItem("workforce_unified_context",nextContext);
   history.replaceState(null,"","/unified.html?page="+encodeURIComponent(nextKind)+"&context="+nextContext);
   switchPage(nextKind,false);
   message("Account created in the "+(nextContext==="dot"?"DOT":"NON-DOT")+" workspace.");
   return;
  }
  state.cache.delete(cacheKey());state.companyDraft=null;
  if(continueEditing&&m.id){
   button.disabled=false;
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
function peopleCompanyList(records){
 const q=state.search.trim().toLowerCase(),f=state.statusFilter;
 const visible=records.filter(r=>{const d=r.data||{};return (!q||[d.first_name,d.last_name,d.employer,d.job_title,d.relationship,d.email,d.employee_number].some(v=>String(v||"").toLowerCase().includes(q)))&&(!f||d.relationship===f)});
 const rows=visible.map(r=>{const d=r.data||{},name=[d.first_name,d.last_name].filter(Boolean).join(" ")||"Person";
 return '<button type="button" class="people-company-row" data-view="'+esc(r.id)+'"><span class="people-avatar">'+navIcon("people")+'</span>'+
 '<span class="people-primary"><strong>'+esc(name)+'</strong><small>'+esc(d.job_title||d.email||"No title")+'</small></span>'+
 '<span class="people-company-name"><small>Associated company</small><strong>'+esc(d.employer||"Company unavailable")+'</strong></span>'+
 '<span class="people-role">'+esc(statusLabel(d.relationship||"employee"))+'</span><span class="mgmt-status '+statusClass(d.status)+'">'+esc(statusLabel(d.status||"active"))+'</span>'+
 '<span class="results-row-view">View</span></button>'}).join("");
 $("pageContent").innerHTML='<div class="results-workspace people-company-workspace"><section class="results-intro"><span class="results-intro-icon">'+navIcon("people")+'</span><div><strong>People and company associations</strong>'+
 '<p>Employees, company contacts and staff are always assigned to an employer or owner-operator in this workspace.</p></div></section>'+
 '<section class="results-list"><div class="directory-toolbar"><div class="directory-search"><input id="recordSearch" type="search" aria-label="Search people and companies" placeholder="Search people, companies and positions" value="'+esc(state.search)+'"></div>'+
 '<select id="statusFilter" aria-label="Filter people by type"><option value="">All types</option>'+
 [["employee","Employees"],["contact","Contacts"],["staff","Staff"]].map(([v,t])=>'<option value="'+v+'"'+(f===v?" selected":"")+'>'+t+'</option>').join("")+'</select>'+
 '<span class="directory-total">'+visible.length+' people</span></div>'+
 (rows||'<div class="directory-empty"><div class="directory-empty-icon">'+navIcon("people")+'</div><h2>No people yet</h2><p>Add an employer first, then link employees, contacts, and staff to that company.</p>'+
 (["owner","admin","editor"].includes(activeWorkspace()?.role||"")?'<button class="btn primary" type="button" data-create="1">Add Person</button>':"")+'</div>')+
 '</section></div>';
}
function showRecords(records){
 if(state.page==="dashboard"){renderDashboard(records);return}
 if(state.page==="selections"){selectionList(records);return}
 if(state.page==="testing_orders"){renderDrugOrderList(records);return}
 if(state.page==="testing_documents"){testingDocumentsList(records);return}
 if(state.page==="results"){resultsManagementList(records);return}
 if(state.page==="people"){peopleCompanyList(records);return}
 if(state.page==="compliance"){complianceDirectory(records);return}
 if(state.page==="audits"){auditList(records);return}
 if(state.page==="occupational_health"){physicalOrderList(records);return}
 const count=records.length,query=state.search.trim().toLowerCase();
 const statuses=[...new Set(records.map(r=>String(r.data?.status||"").trim()).filter(Boolean))].sort();
 const visible=records.filter(r=>(!query||Object.values(r.data||{}).some(v=>String(v??"").toLowerCase().includes(query)))&&
 (!state.statusFilter||String(r.data?.status||"")===state.statusFilter)&&
 (!state.companyFilter||r.data?.company_id===state.companyFilter.companyId||
  ["employer","client","company"].some(k=>String(r.data?.[k]||"").trim().toLowerCase()===state.companyFilter.companyName.trim().toLowerCase())));
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
  (state.companyFilter?'<button type="button" class="company-filter-chip" data-clear-company-filter>Company: '+esc(state.companyFilter.companyName)+' ×</button>':"")+
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
 if(mode==="program-enroll-add"||mode==="program-enroll-remove"){await submitProgramEnrollment();return}
 if(mode==="pool-add-member"||mode==="pool-remove-member"){await savePoolMember();return}
 if(mode==="selection-run"){await runSelection();return}
 if(mode==="send-official-result"){await sendOfficialResult();return}
 if(mode==="archive"){await performArchive();return}
 if(mode==="profile"){await saveProfile();return}
 if(mode==="view"){closeModal();return}
}
function archiveRecord(id){
 if(state.page==="results"){message("Official results cannot be archived here.",true);return}
 if(state.page==="occupational_health"){message("Submitted physical requests are managed by Testing Operations.",true);return}
 if(state.page==="selections"){message("Locked selection records cannot be archived.",true);return}
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
  const auditSave=target.closest("[data-audit-item-save]"),auditDownload=target.closest("[data-audit-download]");
  if(auditSave){void saveAuditItem(auditSave.dataset.auditItemSave,auditSave);return}
  if(auditDownload){void downloadAuditEvidence(auditDownload);return}
  if(target.closest("[data-result-document]")){void officialResultFile(target.closest("[data-result-document]").dataset.resultDocument);return}
  if(target.closest("[data-result-send]")){confirmOfficialResultSend();return}
  if(target.closest("#selectionReview")){confirmSelection();return}
  if(target.closest("[data-selection-person]")){
   const id=target.closest("[data-selection-person]").dataset.selectionPerson;
   switchPage("people");
   if(state.cache.get(cacheKey()))openManagement("view",id);
   else state.pendingManagement={action:"view",id,section:"people"};
   return;
  }
  if(target.closest("[data-pool-add]")){void openPoolAddMember();return}
  if(target.closest("[data-pool-remove]")){confirmPoolRemove(target.closest("[data-pool-remove]").dataset.poolRemove);return}
  if(target.closest("[data-pool-person]")){
   const id=target.closest("[data-pool-person]").dataset.poolPerson;
   if(!id)return;
   switchPage("people");
   if(state.cache.get(cacheKey()))openManagement("view",id);
   else state.pendingManagement={action:"view",id,section:"people"};
   return;
  }
  if(target.closest("[data-pool-selection]")){
   const id=target.closest("[data-pool-selection]").dataset.poolSelection;
   switchPage("selections");
   if(state.cache.get(cacheKey()))openManagement("view",id);
   else state.pendingManagement={action:"view",id,section:"selections"};
   return;
  }
  if(target.closest("[data-pool-nav]")){
   const kind=target.closest("[data-pool-nav]").dataset.poolNav;
   if(CONFIG[kind])switchPage(kind);
   return;
  }
  if(target.closest("[data-program-enroll-add]")){void openProgramEnrollment();return}
  if(target.closest("[data-program-unenroll]")){removeProgramEnrollment(target.closest("[data-program-unenroll]").dataset.programUnenroll);return}
  if(target.closest("[data-program-related]")){
   const page=target.closest("[data-program-related]").dataset.programRelated;
   if(CONFIG[page])switchPage(page);
   return;
  }
  if(target.closest("[data-program-apply-rule]")){
   const agency=target.closest("[data-program-apply-rule]").dataset.programApplyRule;
   const rule=state.programRules?.find(r=>r.dot_agency===agency);
   if(rule){
    for(const [name,value] of [["drug_random_rate",rule.drug_rate],["alcohol_random_rate",rule.alcohol_rate]]){
     const field=document.getElementById("manage-"+name);
     if(field&&value!==null&&value!==undefined)field.value=String(value);
    }
    message("Regulatory reference rates applied. Review before saving.");
   }
   return;
  }
  if(target.closest("[data-clear-company-filter]")){state.companyFilter=null;showRecords(state.cache.get(cacheKey())?.records||[]);return}
  if(target.closest("[data-company-add]")){openCompanyAdd(target.closest("[data-company-add]").dataset.companyAdd);return}
  if(target.closest("[data-company-remove]")){
   const b=target.closest("[data-company-remove]");confirmCompanyRemove(b.dataset.relatedKind,b.dataset.companyRemove);return
  }
  if(target.closest("[data-company-person]")){void openCompanyPerson(target.closest("[data-company-person]").dataset.companyPerson);return}
  if(target.closest("[data-person-company]")){
   const companyId=target.closest("[data-person-company]").dataset.personCompany;
   void openPersonCompanyProfile(companyId);
   return;
  }
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
   const company=currentCompany();
   if(!CONFIG[page]||!company)return;
   const creating=Boolean(employerCreate);
   switchPage(page);
   if(creating){
    state.companyDraft={page,companyId:company.id,companyName:company.data?.legal_name||""};
    if(state.cache.get(cacheKey()))openManagement("new");
    else state.pendingManagement={action:"new",id:null,section:page};
   }else{
    state.companyFilter={companyId:company.id,companyName:company.data?.legal_name||""};
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
  if(e.target.matches("[data-audit-upload]")){void uploadAuditEvidence(e.target);return}
 if(e.target.id==="selectionPool"){void selectionPreviewPool();return}
  if(e.target.name==="physical_type"&&e.target.closest("#physicalOrderForm")){const next=e.target.value==="DOT"?"dot":"nondot";if(next!==state.context){changeContext(next);openManagement("new");}return}
 if(e.target.id==="drugCompany"){refreshDrugDonors();return}
  if(e.target.id==="testingDocCompany"){refreshTestingDocumentRelations();return}
  if(e.target.id==="testingDocFile"){$("testingDocFileName").textContent=e.target.files?.[0]?.name||"Choose a document to upload";return}
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
 $("pageContent").addEventListener("submit",e=>{if(e.target.id==="testingDocForm"){e.preventDefault();void submitTestingDocument(e.target);return}if(e.target.id==="drugOrderForm"){e.preventDefault();void submitDrugOrder(e.target);return}if(e.target.id==="physicalOrderForm"){e.preventDefault();void submitPhysicalOrder(e.target);return}if(e.target.id==="auditForm"){e.preventDefault();void saveAudit(e.target);return}if(e.target.id==="managementForm"){e.preventDefault();void submitManagement(e.target)}});
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