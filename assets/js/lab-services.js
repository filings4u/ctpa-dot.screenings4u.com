(()=>{
'use strict';
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const tag=(s)=>String(s||"pending").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
const date=(s)=>s&&!Number.isNaN(Date.parse(s))?new Date(s).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):"—";
const track=(carrier,number)=>{
 const c=String(carrier||"").toLowerCase().replace(/[^a-z]/g,""),n=String(number||"").trim();
 if(!/^[a-zA-Z0-9]{6,80}$/.test(n))return null;
 const v=encodeURIComponent(n);
 if(c==="ups")return "https://www.ups.com/track?loc=en_US&tracknum="+v;
 if(c==="fedex"||c==="federalexpress")return "https://www.fedex.com/fedextrack/?trknbr="+v;
 if(c==="usps")return "https://tools.usps.com/go/TrackConfirmAction.action?tLabels="+v;
 return null;
};
const card=(label,value)=>'<div class="metric"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong></div>';
const sections=[
 {id:"overview",label:"Overview"},
 {id:"accounts",label:"Laboratory accounts"},
 {id:"clients",label:"Lab client directory"},
 {id:"orders",label:"Order a test"},
 {id:"tracking",label:"Testing & donor passes"},
 {id:"deliveries",label:"Result delivery"},
 {id:"supplies",label:"Supplies"},
 {id:"alerts",label:"Supply alerts"},
 {id:"documents",label:"Documents & CCFs"},
 {id:"billing",label:"Billing"},
 {id:"support",label:"Support"}
];
const tabLinks=()=>'<nav class="lab-section-nav" aria-label="Lab Account sections">'+sections.map(x=>'<button class="btn ghost lab-section-tab" type="button" data-lab-tab="'+esc(x.id)+'">'+esc(x.label)+'</button>').join('')+'</nav>';
const labForm=()=>'<section class="section" data-lab-panel="orders"><h2>Order a laboratory test</h2><p>Submit a request into Workforce Testing Management. Scheduling and donor-pass issuance follow staff review.</p><p id="lab-order-message" role="status" aria-live="polite"></p><form id="lab-order-form" class="panel"><div class="lab-migration-grid"><label>Test service <select name="service_id" required id="lab-order-service"><option value="">Loading available services…</option></select></label><label>First name <input name="first_name" maxlength="100" required></label><label>Last name <input name="last_name" maxlength="100" required></label><label>Donor email <input name="donor_email" type="email" required></label><label>Donor phone <input name="donor_phone" type="tel" maxlength="35"></label><label>Date of birth <input name="date_of_birth" type="date" required></label><label>State of residence <input name="state_of_residence" maxlength="2" pattern="[A-Za-z]{2}" placeholder="IL" required></label><label>Reason for testing <select name="reason_for_test" required><option value="">Choose reason</option><option value="PE">Pre-employment</option><option value="RN">Random</option><option value="PA">Post-accident</option><option value="RS">Reasonable suspicion</option><option value="RT">Return to duty</option><option value="FU">Follow-up</option><option value="NI">Other / not indicated</option></select></label><label id="lab-authority-wrap" hidden>DOT authority <select name="testing_authority"><option value="">Choose agency</option><option value="FMCSA">FMCSA</option><option value="FAA">FAA</option><option value="FRA">FRA</option><option value="FTA">FTA</option><option value="PHMSA">PHMSA</option><option value="USCG">USCG</option></select></label></div><label>Notes for Workforce Testing <textarea name="notes" maxlength="1000" rows="3"></textarea></label><div><button class="btn primary" type="submit" id="lab-order-submit">Submit testing request</button></div></form></section>';
const supplyForm=()=>'<section class="section" data-lab-panel="supplies"><h2>Request testing supplies</h2><p>Choose physical supply items and provide the shipping destination. Workforce Testing Management handles fulfillment and tracking.</p><p id="lab-supply-status" role="status" aria-live="polite"></p><form id="lab-supply-form" class="panel"><div id="lab-supply-catalog">Open the Supplies tab to load available items.</div><div class="lab-migration-grid"><label>Recipient <input name="recipient" required maxlength="180"></label><label>Street address <input name="line1" required maxlength="180"></label><label>Address line 2 <input name="line2" maxlength="180"></label><label>City <input name="city" required maxlength="180"></label><label>State <input name="state" required minlength="2" maxlength="2" pattern="[A-Za-z]{2}"></label><label>ZIP code <input name="postal_code" required pattern="[0-9]{5}(-[0-9]{4})?"></label></div><label>Special instructions <textarea name="notes" maxlength="1000" rows="3"></textarea></label><button class="btn primary" type="submit" id="lab-supply-submit">Request supplies</button></form></section>';
const specimenForm=(requests=[])=>{
 const eligible=requests.filter(r=>r.collected_at&&["collected","specimen_collected","collected_awaiting_shipment"].includes(String(r.status||"").toLowerCase()));
 return '<section class="section" data-lab-panel="tracking"><h2>Report collected specimens shipped</h2><p>Use this only after specimens have been collected and handed to the carrier. Workforce Testing verifies receipt and laboratory accession separately.</p>'+
 (eligible.length?'<form class="panel lab-specimen-form" id="lab-specimen-form"><label>Collected case<select name="case_id" required><option value="">Choose a collected case</option>'+eligible.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.case_number||r.id)+'</option>').join('')+'</select></label><label>Carrier<input name="carrier" required maxlength="100"></label><label>Tracking number<input name="tracking_number" required maxlength="180"></label><label>Tracking link (optional)<input name="tracking_url" type="url" maxlength="1000" placeholder="https://"></label><button class="btn primary" type="submit">Report specimen shipment</button><p id="lab-specimen-status" role="status" aria-live="polite"></p></form>':'<div class="panel">There are no collected laboratory cases ready for shipment reporting.</div>')+
 '</section>';
};
const deliveryRequestForm=()=>'<section class="section" data-lab-panel="deliveries"><h2>Request laboratory result delivery</h2><p>Choose a released laboratory case and an authorized recipient. Workforce reviews the request before any results are delivered.</p><form id="lab-delivery-form" class="panel"><div class="lab-migration-grid"><label>Released testing case<select name="case_id" id="lab-delivery-cases" required><option value="">Loading released cases…</option></select></label><label>Recipient name<input name="recipient_name" maxlength="150"></label><label>Recipient email<input name="recipient_email" type="email" maxlength="254" required></label></div><button type="submit" class="btn primary">Request result delivery</button><p id="lab-delivery-status" role="status" aria-live="polite"></p></form></section>';
const legacyRecordPanel=(section,label,description)=>
 '<section class="section" data-lab-panel="'+esc(section)+'"><h2>'+esc(label)+'</h2><p>'+esc(description)+'</p><div id="lab-records-'+esc(section)+'" class="lab-record-list" aria-live="polite">Loading existing Lab Account records…</div></section>';
const scopedLink=(href,label,detail)=>'<a class="panel lab-feature-link" href="'+esc(href)+'"><strong>'+esc(label)+'</strong><small>'+esc(detail)+'</small></a>';
function render(d){
 if(d?.authorized!==true)return '<section class="panel"><h2>Lab Account access unavailable</h2><p>Your company must have an active purchased Lab Account add-on.</p></section>';
 const accounts=d.lab_accounts||[],intakes=d.setup_records||[],shipments=d.shipments||[],requests=d.testing_requests||[];
 const menu=tabLinks();
 return '<div class="lab-migration-hub">'+menu+
 '<section class="section" data-lab-panel="overview"><div class="panel-head"><div><h2>Laboratory Account</h2><p>Laboratory accounts and shipments belonging to this C/TPA organization. This view is read-only during the migration.</p></div></div>'+
 '<div class="metrics">'+card("Laboratory accounts",accounts.length)+card("Account setup records",intakes.length)+card("Supply shipments",shipments.length)+'</div></section>'+
 '<section class="section" data-lab-panel="overview"><h2>C/TPA tools already available in Workforce</h2><p>Use the existing modules instead of maintaining separate Lab Account copies.</p><div class="lab-reuse-grid">'+
 scopedLink('/employers.html','Client directory','Employer and client management')+
 scopedLink('/people.html','Drivers and donors','Employee and driver records')+
 scopedLink('/pools.html','Consortium and random pools','Pool setup, rosters and membership')+
 scopedLink('/selections.html','Random selections','Selection administration')+
 scopedLink('/testing.html','Testing operations','Existing C/TPA orders and testing workflows')+
 scopedLink('/results.html','Testing results','Existing authorized C/TPA results')+
 scopedLink('/reports.html','Reports and analytics','Existing C/TPA reporting')+
 scopedLink('/compliance.html','Compliance center','Existing compliance tools')+'</div></section>'+
 '<section class="section" data-lab-panel="accounts"><h2>Assigned laboratories</h2><p>The existing C/TPA laboratory-account page manages C/TPA assignments, avoiding a second laboratory configuration system.</p>'+scopedLink('/lab-accounts.html','View C/TPA laboratory assignments','Existing C/TPA laboratory account module')+
 (accounts.length?accounts.map(a=>'<div class="panel"><div class="panel-head"><h3>'+esc(a.lab_name||"Laboratory")+'</h3><span class="badge '+(a.status==="active"?"good":"warn")+'">'+esc(tag(a.status))+'</span></div><div class="lab-migration-grid">'+[['Primary',a.is_primary?'Yes':'No'],['DOT account',a.account_numbers?.dot],['NON-DOT account',a.account_numbers?.non_dot],['Hair',a.account_numbers?.hair],['Oral',a.account_numbers?.oral],...(a.account_numbers?.unclassified?[['Unclassified account · confirm with Workforce',a.account_numbers.unclassified]]:[])].map(([k,v])=>'<div><small>'+esc(k)+'</small><strong>'+esc(v||'Not configured')+'</strong></div>').join('')+'</div></div>').join(''):'<div class="panel">No laboratory numbers are assigned to this C/TPA yet.</div>')+'</section>'+
 '<section class="section" data-lab-panel="overview"><h2>Setup and activation</h2>'+
 (intakes.length?intakes.map(i=>'<div class="panel lab-migration-row"><div><strong>'+esc(i.order_number||"Lab Account setup")+'</strong><small>Requested '+date(i.created_at)+'</small></div><span class="badge">'+esc(tag(i.account_status||i.status))+'</span></div>').join(''):'<div class="panel">No verified legacy purchase has been linked to this organization yet.</div>')+'</section>'+
 '<section class="section" data-lab-panel="supplies"><h2>Physical supply shipment tracking</h2>'+
 (shipments.length?shipments.map(s=>{const href=track(s.carrier,s.tracking_number);return '<div class="panel lab-migration-row"><div><strong>'+esc(s.items_description||"Laboratory supplies")+'</strong><small>'+esc(s.carrier||"Carrier pending")+' · '+esc(s.tracking_number||"Tracking pending")+'</small><small>Created '+date(s.created_at)+'</small></div><div><span class="badge">'+esc(tag(s.status))+'</span>'+(href?'<a class="btn ghost" target="_blank" rel="noopener noreferrer" href="'+esc(href)+'">Track package</a>':'')+'</div></div>'}).join(''):'<div class="panel">Shipment tracking appears when Workforce management assigns supplies to a verified Lab Account purchase.</div>')+'</section>'+
 supplyForm()+
 '<section class="section" data-lab-panel="tracking"><h2>Issued laboratory donor passes</h2><p>Pass details appear only after issuance by Workforce Testing. Laboratory registration and collection appointments are not automatically created when a request is submitted.</p><div id="lab-issued-passes" aria-live="polite">Loading issued passes…</div><dialog id="lab-pass-modal" class="lab-document-dialog lab-pass-dialog"><div class="lab-document-dialog-bar"><h3 id="lab-pass-title">Issued donor pass</h3><button class="btn ghost" id="lab-pass-close" type="button">Close</button></div><div id="lab-pass-content" class="lab-pass-content"></div><div class="lab-pass-actions"><button class="btn primary" type="button" id="lab-pass-print">Print donor pass</button></div></dialog></section>'+
 '<section class="section" data-lab-panel="tracking"><h2>Lab Account testing requests</h2><p>Read-only request status for records linked to this C/TPA. Requests without verified company linkage stay in the original Lab Account portal until Workforce completes the account mapping.</p>'+
 (requests.length?requests.map(r=>'<div class="panel lab-migration-row"><div><strong>'+esc(r.case_number||"Testing request")+'</strong><small>'+esc(r.test_type||"Test type pending")+' · Submitted '+date(r.created_at)+'</small><small>Donor pass: '+esc(tag(r.donor_pass_status||"not_issued"))+(r.donor_pass_issued_at?' · Issued '+date(r.donor_pass_issued_at):'')+'</small></div><div class="lab-request-actions"><span class="badge">'+esc(tag(r.status))+'</span>'+(r.can_edit?'<button class="btn ghost" type="button" data-lab-edit-order="'+esc(r.id)+'">Edit request</button>':'')+'</div></div>').join(''):'<div class="panel">No testing requests are currently verified for this C/TPA. Existing orders remain available in the original Lab Account portal during migration.</div>')+'</section>'+
 '<dialog id="lab-order-edit-dialog" class="lab-document-dialog lab-edit-order-dialog"><div class="lab-document-dialog-bar"><h3>Edit laboratory testing request</h3><button type="button" class="btn ghost" id="lab-order-edit-close">Close</button></div><form id="lab-order-edit-form" class="panel"><p>Only requests awaiting scheduling can be edited. The test service and DOT authority cannot be changed here.</p><div class="lab-migration-grid"><label>First name<input name="first_name" required maxlength="100"></label><label>Last name<input name="last_name" required maxlength="100"></label><label>Donor email<input name="donor_email" type="email" required></label><label>Donor phone<input name="donor_phone" type="tel" maxlength="35"></label><label>Date of birth<input name="date_of_birth" type="date" required></label><label>State<input name="state_of_residence" pattern="[A-Za-z]{2}" maxlength="2" required></label><label>Reason for test<select name="reason_for_test" required><option value="PE">Pre-employment</option><option value="RN">Random</option><option value="PA">Post-accident</option><option value="RS">Reasonable suspicion</option><option value="RT">Return to duty</option><option value="FU">Follow-up</option><option value="NI">Other</option></select></label></div><label>Notes<textarea name="notes" rows="3" maxlength="1000"></textarea></label><p id="lab-edit-order-status" role="status" aria-live="polite"></p><button type="submit" class="btn primary">Save changes</button></form></dialog>'+
 labForm()+ 
 specimenForm(requests)+
 legacyRecordPanel('clients','Lab client directory','Previously saved Lab Account contacts. Use the existing C/TPA Employers module for current company management; these legacy contact records are retained separately until reconciled.')+
 deliveryRequestForm()+
 legacyRecordPanel('deliveries','Lab result delivery history','Previously requested result deliveries associated with your original Lab Account. Actual testing results remain in authorized Workforce Results workflows.')+
 legacyRecordPanel('alerts','Supply reorder alerts','Existing Lab Account supply alert records are preserved while laboratory supplies are consolidated.')+

 '<section class="section" data-lab-panel="documents"><h2>Lab Account documents and collection forms</h2><p>View Workforce-published laboratory account documents. Existing C/TPA and testing documents remain available in their original Workforce modules.</p><div id="lab-published-documents" class="lab-document-list" aria-live="polite">Loading published documents…</div><h3>Intake and historical Lab Account files</h3><p>Original setup forms, uploaded intake attachments, completed service documents, and laboratory account files.</p><div id="lab-historical-documents" class="lab-document-list" aria-live="polite">Open Documents to load previous records.</div><dialog id="lab-intake-dialog" class="lab-document-dialog lab-intake-dialog"><div class="lab-document-dialog-bar"><h3 id="lab-intake-title">Lab Account intake</h3><button class="btn ghost" id="lab-intake-close" type="button">Close</button></div><div class="lab-intake-body" id="lab-intake-fields"></div></dialog><h3>Released chain-of-custody forms (CCFs)</h3><p>Only released CCFs belonging to your laboratory testing cases are available here.</p><div id="lab-ccf-archive" class="lab-document-list" aria-live="polite">Open Documents to load your CCFs.</div><dialog id="lab-document-preview" class="lab-document-dialog"><div class="lab-document-dialog-bar"><h3 id="lab-document-title">Document preview</h3><button class="btn ghost" type="button" id="lab-document-close">Close</button></div><iframe title="Lab Account document preview" id="lab-document-frame"></iframe></dialog>'+scopedLink('/documents.html','C/TPA Documents','Existing company documents workspace')+scopedLink('/testing-documents.html','Testing documents','Existing C/TPA testing documentation')+'</section>'+
 '<section class="section" data-lab-panel="billing"><h2>Laboratory purchases and invoices</h2><p>View invoices and purchases linked to the verified Lab Account purchase. Your existing C/TPA billing remains separate.</p><h3>Lab Account purchase</h3><div id="lab-purchase-history" class="lab-document-list" aria-live="polite">Loading purchase history…</div><h3>Lab Account invoices</h3><div id="lab-invoice-list" class="lab-document-list" aria-live="polite">Loading laboratory invoices…</div><dialog id="lab-invoice-detail" class="lab-document-dialog lab-invoice-dialog"><div class="lab-document-dialog-bar"><h3 id="lab-invoice-heading">Invoice details</h3><button type="button" class="btn ghost" id="lab-invoice-close">Close</button></div><div class="lab-invoice-content" id="lab-invoice-content"></div></dialog>'+scopedLink('/billing.html','Workforce Billing','Existing C/TPA billing and invoices')+scopedLink('/order-history.html','Order history','Existing C/TPA purchase records')+'</section>'+
 '<section class="section" data-lab-panel="support"><h2>Lab Account support</h2><p>Contact Workforce support for test registration, collection instructions, or laboratory-account issues.</p>'+scopedLink('/support.html','Contact Support','Existing C/TPA support workflow')+'</section>'+
 '<section class="notice" data-lab-panel="overview"><strong>One Workforce C/TPA portal</strong><p>This Lab Account section uses existing C/TPA modules for shared services and the current Workforce testing backend for lab requests. Laboratory registration, donor-pass issuance, result release and shipment fulfillment remain controlled by Workforce Testing Management.</p></section></div>';
}
function bind(call,data={}){
 const root=document.querySelector('.lab-migration-hub');if(!root)return;
 const buttons=[...root.querySelectorAll('[data-lab-tab]')];
 function selectTab(value){
  const selected=sections.some(x=>x.id===value)?value:'overview';
  root.querySelectorAll('[data-lab-panel]').forEach(panel=>{panel.hidden=panel.dataset.labPanel!==selected;});
  buttons.forEach(button=>{const on=button.dataset.labTab===selected;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));});
  if(selected==='orders')loadServices();
  if(selected==='supplies')loadSupplies();
  if(selected==='documents'){loadDocuments();loadCcfArchive();loadHistoricalDocs();}
  if(selected==='tracking')loadPasses();
  if(['clients','alerts','deliveries'].includes(selected))loadLegacyRecords(selected);
  if(selected==='deliveries')loadReleasedCases();
  if(selected==='billing')loadLabBilling();
 }
 buttons.forEach(button=>button.addEventListener('click',()=>selectTab(button.dataset.labTab)));
 const form=root.querySelector('#lab-order-form'),select=root.querySelector('#lab-order-service'),message=root.querySelector('#lab-order-message');
 let catalog=[],loading=false;
 async function loadServices(){
  if(loading||catalog.length)return;
  loading=true;message.textContent='Loading current laboratory testing catalog…';
  try{
   const d=await call('catalog');catalog=d.services||[];
   select.innerHTML='<option value="">Choose a test</option>'+catalog.map(item=>'<option value="'+esc(item.id)+'">'+esc(item.name)+'</option>').join('');
   if(!catalog.length)message.textContent='No testing services are currently available for ordering.';
   else message.textContent='';
  }catch(error){message.textContent=error.message||'Unable to load the testing catalog.';select.innerHTML='<option value="">Catalog unavailable</option>'}
  finally{loading=false}
 }
 select.addEventListener('change',()=>{
  const item=catalog.find(x=>x.id===select.value);
  const wrap=root.querySelector('#lab-authority-wrap');
  const dot=String(item?.testing_scope||'').toLowerCase()==='dot';
  wrap.hidden=!dot;const authority=wrap.querySelector('select');authority.required=dot;
  if(!dot)authority.value='';
 });
 const editDialog=root.querySelector('#lab-order-edit-dialog');
 const editForm=root.querySelector('#lab-order-edit-form');
 const editNote=root.querySelector('#lab-edit-order-status');
 let editCaseId=null;
 root.querySelectorAll('[data-lab-edit-order]').forEach(button=>button.addEventListener('click',async()=>{
  if(button.disabled)return;
  button.disabled=true;
  try{
   const d=await call('order_details',{case_id:button.dataset.labEditOrder});
   if(d.order?.status!=='awaiting_schedule')throw Error('This request can no longer be edited.');
   editCaseId=d.order.id;
   const name=String(d.order.donor_name||'').trim().split(/\s+/);
   const vals={first_name:name.shift()||'',last_name:name.join(' '),donor_email:d.order.donor_email||'',
    donor_phone:d.order.donor_phone||'',date_of_birth:d.order.date_of_birth||'',
    state_of_residence:d.order.state_of_residence||'',reason_for_test:d.order.test_reason||'',
    notes:d.order.notes||''};
   for(const [key,value] of Object.entries(vals)){
    const field=editForm.elements.namedItem(key);if(field)field.value=value;
   }
   editNote.textContent='';editDialog.showModal();
  }catch(e){button.insertAdjacentHTML('afterend','<span role="alert">'+esc(e.message||'Unable to load this order')+'</span>')}
  finally{button.disabled=false}
 }));
 root.querySelector('#lab-order-edit-close').addEventListener('click',()=>editDialog.close());
 editForm.addEventListener('submit',async event=>{
  event.preventDefault();if(!editCaseId||!editForm.reportValidity())return;
  const save=editForm.querySelector('button[type="submit"]');if(save.disabled)return;
  save.disabled=true;editNote.textContent='Saving laboratory request changes…';
  try{
   const fields=Object.fromEntries(new FormData(editForm).entries());
   await call('update_order',{case_id:editCaseId,...fields});
   editNote.textContent='Changes saved.';
   editDialog.close();editCaseId=null;
  }catch(e){editNote.textContent=e.message||'Unable to save this request.'}
  finally{save.disabled=false}
 });
 const specimenFormEl=root.querySelector('#lab-specimen-form');
 if(specimenFormEl)specimenFormEl.addEventListener('submit',async event=>{
  event.preventDefault();if(!specimenFormEl.reportValidity())return;
  const action=specimenFormEl.querySelector('button[type="submit"]');
  if(action.disabled)return;
  const payload=Object.fromEntries(new FormData(specimenFormEl).entries());
  action.disabled=true;const status=specimenFormEl.querySelector('#lab-specimen-status');
  status.textContent='Reporting shipment to Workforce Testing…';
  try{
   const result=await call('report_specimen_shipped',payload);
   status.textContent='Shipment reported for '+(result.shipment?.case_number||'the selected case')+'. Laboratory receipt has not yet been confirmed.';
   specimenFormEl.reset();
  }catch(error){status.textContent=error.message||'Unable to report this specimen shipment.'}
  finally{action.disabled=false}
 });
 const billingPurchaseHost=root.querySelector('#lab-purchase-history');
 const billingInvoiceHost=root.querySelector('#lab-invoice-list');
 const billingModal=root.querySelector('#lab-invoice-detail');
 const formatMoney=(amount,currency='USD')=>{
  try{return new Intl.NumberFormat('en-US',{style:'currency',currency:currency||'USD'}).format(Number(amount||0))}
  catch{return String(amount??'0')}
 };
 let labBillingLoaded=false,billingLoading=false,labInvoiceRecords=[];
 async function loadLabBilling(){
  if(labBillingLoaded||billingLoading)return;
  billingLoading=true;
  try{
   const [purchases,records]=await Promise.all([call('lab_purchases'),call('lab_invoices')]);
   const orders=purchases.orders||[];
   billingPurchaseHost.innerHTML=orders.length?orders.map(o=>
    '<div class="panel lab-document-row"><div><strong>'+esc(o.order_number||'Lab Account purchase')+'</strong><small>'+date(o.created_at)+' · '+esc(tag(o.payment_status))+'</small>'+
    (o.items||[]).map(i=>'<small>'+esc(i.name)+' · '+esc(i.quantity)+' × '+formatMoney(i.unit_price,o.currency)+'</small>').join('')+'</div><strong>'+formatMoney(o.total,o.currency)+'</strong></div>'
   ).join(''):'<div class="panel">No purchases linked to the verified Lab Account grant were found.</div>';
   labInvoiceRecords=records.invoices||[];
   billingInvoiceHost.innerHTML=labInvoiceRecords.length?labInvoiceRecords.map(i=>
    '<div class="panel lab-document-row"><div><strong>'+esc(i.invoice_number||'Invoice')+'</strong><small>Issued '+date(i.issue_date)+' · '+esc(tag(i.status))+'</small><small>Balance '+formatMoney(i.amount_due,i.currency)+'</small></div><button class="btn ghost" type="button" data-lab-invoice="'+esc(i.id)+'">View invoice</button></div>'
   ).join(''):'<div class="panel">No issued invoices are linked to this Lab Account purchase.</div>';
   labBillingLoaded=true;
  }catch(error){
   const msg=esc(error.message||'Unable to retrieve Lab Account billing.');
   billingPurchaseHost.innerHTML='<p role="alert">'+msg+'</p>';
   billingInvoiceHost.innerHTML='<p role="alert">'+msg+'</p>';
  }finally{billingLoading=false}
 }
 billingInvoiceHost.addEventListener('click',async event=>{
  const button=event.target.closest('[data-lab-invoice]');
  if(!button||button.disabled||!labInvoiceRecords.some(x=>x.id===button.dataset.labInvoice))return;
  button.disabled=true;
  try{
   const d=await call('lab_invoice_detail',{invoice_id:button.dataset.labInvoice}),i=d.invoice||{};
   root.querySelector('#lab-invoice-heading').textContent=i.invoice_number||'Lab Account invoice';
   root.querySelector('#lab-invoice-content').innerHTML=
    '<dl class="lab-invoice-summary">'+[['Status',tag(i.status)],['Issued',date(i.issue_date)],['Due',date(i.due_date)],['Total',formatMoney(i.total,i.currency)],['Paid',formatMoney(i.amount_paid,i.currency)],['Balance',formatMoney(i.amount_due,i.currency)]]
    .map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>'+
    '<h4>Invoice line items</h4>'+(d.items||[]).map(item=>
      '<div class="lab-invoice-line"><span>'+esc(item.description||'Service')+' · '+esc(item.quantity)+'</span><strong>'+formatMoney(item.line_total,i.currency)+'</strong></div>'
    ).join('');
   if(!billingModal.open)billingModal.showModal();
  }catch(error){billingInvoiceHost.insertAdjacentHTML('afterbegin','<p role="alert" class="lab-doc-error">'+esc(error.message||'Invoice unavailable')+'</p>')}
  finally{button.disabled=false}
 });
 root.querySelector('#lab-invoice-close').addEventListener('click',()=>billingModal.close());
 const deliveryForm=root.querySelector('#lab-delivery-form');
 const deliverySelect=root.querySelector('#lab-delivery-cases');
 const deliveryStatus=root.querySelector('#lab-delivery-status');
 let releasedCases=null,releasedLoading=false;
 async function loadReleasedCases(){
  if(releasedLoading||releasedCases!==null)return;
  releasedLoading=true;
  try{
   const data=await call('released_cases');releasedCases=data.released_cases||[];
   deliverySelect.innerHTML='<option value="">Choose a released case</option>'+releasedCases.map(x=>
    '<option value="'+esc(x.id)+'">'+esc(x.case_number||x.id)+' · '+esc(x.test_type||'Test')+'</option>'
   ).join('');
   if(!releasedCases.length)deliveryStatus.textContent='No released cases are available for delivery requests.';
  }catch(e){deliveryStatus.textContent=e.message||'Unable to load released testing cases.'}
  finally{releasedLoading=false}
 }
 deliveryForm.addEventListener('submit',async event=>{
  event.preventDefault();if(!deliveryForm.reportValidity())return;
  const request=Object.fromEntries(new FormData(deliveryForm).entries());
  if(!releasedCases?.some(x=>x.id===request.case_id)){deliveryStatus.textContent='Select an available released case.';return}
  const button=deliveryForm.querySelector('button[type="submit"]');if(button.disabled)return;
  button.disabled=true;deliveryStatus.textContent='Submitting to Workforce for review…';
  try{
   const data=await call('request_result_delivery',request);
   deliveryStatus.textContent='Result delivery request '+String(data.delivery?.id||'submitted').slice(0,8)+' is pending Workforce review.';
   deliveryForm.reset();
   const entry={id:data.delivery.id,recipient_email:request.recipient_email,recipient_name:request.recipient_name,
    status:'pending_review',created_at:data.delivery.created_at};
   if(legacyCache.deliveries)legacyCache.deliveries.unshift(entry);
  }catch(e){deliveryStatus.textContent=e.message||'Unable to request result delivery.'}
  finally{button.disabled=false}
 });
 const legacyConfig={
  clients:{action:'legacy_clients',fields:[['Company','company_name'],['Contact','contact_name'],['Email','contact_email'],['Phone','phone'],['Program','program_type']]},
  alerts:{action:'legacy_supply_alerts',fields:[['Supply','supply_name'],['On hand','estimated_on_hand'],['Reorder threshold','reorder_threshold'],['Enabled','enabled']]},
  deliveries:{action:'legacy_deliveries',fields:[['Recipient','recipient_name'],['Email','recipient_email'],['Purpose','purpose'],['Status','status'],['Submitted','created_at']]}
 };
 const legacyCache={};
 async function loadLegacyRecords(section){
  if(legacyCache[section])return;
  const spec=legacyConfig[section],host=root.querySelector('#lab-records-'+section);
  if(!spec||!host)return;
  host.textContent='Loading saved Lab Account records…';
  try{
   const result=await call(spec.action),records=result.records||[];
   legacyCache[section]=records;
   host.innerHTML=records.length?records.map(record=>
    '<article class="panel lab-legacy-card"><div class="lab-migration-grid">'+spec.fields.map(([label,key])=>{
     const value=record[key]===true?'Yes':record[key]===false?'No':record[key];
     return '<div><small>'+esc(label)+'</small><strong>'+esc(value===null||value===undefined||value===''?'—':value)+'</strong></div>';
    }).join('')+'</div></article>'
   ).join(''):'<div class="panel">No saved records are associated with the verified original Lab Account purchaser.</div>';
  }catch(error){host.textContent=error.message||'Unable to load previous Lab Account records.'}
 }
 const passHost=root.querySelector('#lab-issued-passes'),passModal=root.querySelector('#lab-pass-modal');
 let passes=null;
 async function loadPasses(){
  if(passes!==null)return;
  passHost.textContent='Loading issued laboratory passes…';
  try{
   const result=await call('issued_passes');passes=result.passes||[];
   passHost.innerHTML=passes.length?passes.map(pass=>
    '<div class="panel lab-document-row"><div><strong>'+esc(pass.pass_number||'Issued donor pass')+'</strong><small>'+esc(pass.test_type||'Testing')+' · Issued '+date(pass.issued_at)+'</small><small>'+esc(pass.collection_site_name||'Collection site not assigned')+'</small></div><button class="btn ghost" type="button" data-lab-pass="'+esc(pass.id)+'">View / Print</button></div>'
   ).join(''):'<div class="panel">No issued laboratory donor passes are linked to this account.</div>';
  }catch(error){passHost.textContent=error.message||'Unable to load issued passes.'}
 }
 passHost.addEventListener('click',event=>{
  const button=event.target.closest('[data-lab-pass]');if(!button)return;
  const pass=passes?.find(x=>x.id===button.dataset.labPass);if(!pass)return;
  root.querySelector('#lab-pass-title').textContent=pass.pass_number||'Issued donor pass';
  const details=[
   ['Donor',pass.donor_name],['Test type',pass.test_type],
   ['Collection site',pass.collection_site_name],['Collection address',pass.collection_site_address],
   ['Collection deadline',pass.collection_deadline?date(pass.collection_deadline):'Not assigned'],
   ['Pass status',pass.status]
  ];
  root.querySelector('#lab-pass-content').innerHTML=details.map(([label,value])=>
   '<div><small>'+esc(label)+'</small><strong>'+esc(value||'Not provided')+'</strong></div>'
  ).join('');
  if(!passModal.open)passModal.showModal();
 });
 root.querySelector('#lab-pass-close').addEventListener('click',()=>passModal.close());
 root.querySelector('#lab-pass-print').addEventListener('click',()=>window.print());
 const documentsHost=root.querySelector('#lab-published-documents'),docModal=root.querySelector('#lab-document-preview');
 let documentRecords=null;
 async function loadDocuments(){
  if(documentRecords!==null)return;
  documentsHost.textContent='Loading published laboratory documents…';
  try{
   const result=await call('documents');documentRecords=result.documents||[];
   documentsHost.innerHTML=documentRecords.length?documentRecords.map(doc=>
    '<div class="panel lab-document-row"><div><strong>'+esc(doc.title||doc.original_filename||'Lab Account document')+'</strong><small>'+esc(doc.category||'Account document')+' · '+date(doc.created_at)+'</small><small>'+esc(doc.description||'')+'</small></div><div class="lab-document-actions"><button class="btn ghost" type="button" data-lab-doc-view="'+esc(doc.id)+'">View</button><button class="btn ghost" type="button" data-lab-doc-download="'+esc(doc.id)+'">Download</button></div></div>'
   ).join(''):'<div class="panel">No published Lab Account documents are assigned to this signed-in customer.</div>';
  }catch(error){documentsHost.textContent=error.message||'Unable to load laboratory documents.'}
 }
 root.querySelector('#lab-document-close').addEventListener('click',()=>{
  docModal.close();root.querySelector('#lab-document-frame').removeAttribute('src');
 });
 docModal.addEventListener('close',()=>root.querySelector('#lab-document-frame').removeAttribute('src'));
 documentsHost.addEventListener('click',async event=>{
  const button=event.target.closest('[data-lab-doc-view],[data-lab-doc-download]');
  if(!button||button.disabled)return;
  const id=button.dataset.labDocView||button.dataset.labDocDownload;
  if(!documentRecords?.some(x=>x.id===id))return;
  const download=Boolean(button.dataset.labDocDownload);
  button.disabled=true;
  try{
   const result=await call('document_url',{document_id:id,download});
   if(!/^https:\/\//i.test(result.url||''))throw Error('Document link unavailable');
   if(download)window.location.assign(result.url);
   else{
    root.querySelector('#lab-document-title').textContent=result.title||'Lab Account document';
    root.querySelector('#lab-document-frame').src=result.url;
    if(!docModal.open)docModal.showModal();
   }
   }catch(error){const message=String(error.message||error);documentsHost.insertAdjacentHTML('afterbegin','<p role="alert" class="lab-doc-error">'+esc(message)+'</p>')}
  finally{button.disabled=false}
 });
 const historicalHost=root.querySelector('#lab-historical-documents');
 const intakeModal=root.querySelector('#lab-intake-dialog');
 let historicalDocs=null;
 async function loadHistoricalDocs(){
  if(historicalDocs!==null)return;
  historicalHost.textContent='Loading previous Lab Account documents…';
  try{
   const response=await call('historical_documents');historicalDocs=response.documents||[];
   historicalHost.innerHTML=historicalDocs.length?historicalDocs.map(doc=>
    '<div class="panel lab-document-row"><div><strong>'+esc(doc.title||'Lab Account document')+'</strong><small>'+esc(tag(doc.source))+' · '+date(doc.created_at)+'</small><small>'+esc(doc.description||'')+'</small></div><div class="lab-document-actions">'+
    (doc.source==='intake'?'<button class="btn ghost" type="button" data-lab-intake="'+esc(doc.id)+'">View intake</button><button class="btn ghost" type="button" data-lab-intake-pdf="'+esc(doc.id)+'">Download PDF</button>':
    doc.downloadable?'<button class="btn ghost" type="button" data-lab-historical-view="'+esc(doc.id)+'">View</button><button class="btn ghost" type="button" data-lab-historical-download="'+esc(doc.id)+'">Download</button>':'')+
    '</div></div>'
   ).join(''):'<div class="panel">No historical Lab Account files were found for the verified purchaser.</div>';
  }catch(error){historicalHost.textContent=error.message||'Unable to load historical documents.'}
 }
 root.querySelector('#lab-intake-close').addEventListener('click',()=>intakeModal.close());
 historicalHost.addEventListener('click',async event=>{
  const button=event.target.closest('[data-lab-intake],[data-lab-intake-pdf],[data-lab-historical-view],[data-lab-historical-download]');
  if(!button||button.disabled)return;
  const id=button.dataset.labIntake||button.dataset.labIntakePdf||button.dataset.labHistoricalView||button.dataset.labHistoricalDownload;
  const doc=historicalDocs?.find(record=>record.id===id);if(!doc)return;
  button.disabled=true;
  try{
   if(doc.source==='intake'&&button.dataset.labIntakePdf){
    const response=await call('lab_intake_pdf',{document_id:id});
    if(!response.pdf_base64)throw Error('Intake PDF unavailable.');
    const bytes=Uint8Array.from(atob(response.pdf_base64),c=>c.charCodeAt(0));
    const blob=new Blob([bytes],{type:'application/pdf'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=response.filename||'Workforce-Lab-Account-Intake.pdf';
    document.body.append(link);link.click();link.remove();
    URL.revokeObjectURL(url);
   }else if(doc.source==='intake'){
    const response=await call('lab_intake_details',{document_id:id}),record=response.intake||{};
    root.querySelector('#lab-intake-title').textContent=record.title||'Lab Account intake';
    const safe=Object.entries(record.fields||{}).map(([key,value])=>
     '<div><dt>'+esc(key.replace(/[_-]/g,' '))+'</dt><dd>'+esc(typeof value==='object'?JSON.stringify(value):value)+'</dd></div>').join('');
    root.querySelector('#lab-intake-fields').innerHTML='<dl class="lab-intake-grid">'+safe+'</dl>';
    if(!intakeModal.open)intakeModal.showModal();
   }else{
    const download=Boolean(button.dataset.labHistoricalDownload);
    const response=await call('historical_document_url',{document_id:id,source:doc.source,download});
    if(!/^https:\/\//i.test(response.url||''))throw Error('Document link unavailable');
    if(download)window.location.assign(response.url);
    else{
     root.querySelector('#lab-document-title').textContent=response.title||'Lab Account document';
     root.querySelector('#lab-document-frame').src=response.url;
     if(!docModal.open)docModal.showModal();
    }
   }
  }catch(error){
   historicalHost.insertAdjacentHTML('afterbegin','<p role="alert" class="lab-doc-error">'+esc(error.message||'Document unavailable')+'</p>');
  }finally{button.disabled=false}
 });
 const ccfHost=root.querySelector('#lab-ccf-archive');
 let ccfDocs=null;
 async function loadCcfArchive(){
  if(ccfDocs!==null)return;
  ccfHost.textContent='Loading released laboratory CCFs…';
  try{
   const d=await call('ccf_archive');ccfDocs=d.documents||[];
   ccfHost.innerHTML=ccfDocs.length?ccfDocs.map(doc=>
    '<div class="panel lab-document-row"><div><strong>'+esc(doc.title||'Chain of custody form')+'</strong><small>Case '+esc(doc.case_number||'')+' · '+date(doc.created_at)+'</small></div><div class="lab-document-actions"><button type="button" class="btn ghost" data-lab-ccf-view="'+esc(doc.id)+'">View</button><button type="button" class="btn ghost" data-lab-ccf-download="'+esc(doc.id)+'">Download</button></div></div>'
   ).join(''):'<div class="panel">No released CCF documents are currently available for your Lab Account cases.</div>';
  }catch(e){ccfHost.textContent=e.message||'Unable to load released CCFs.'}
 }
 ccfHost.addEventListener('click',async event=>{
  const button=event.target.closest('[data-lab-ccf-view],[data-lab-ccf-download]');
  if(!button||button.disabled)return;
  const id=button.dataset.labCcfView||button.dataset.labCcfDownload;
  if(!ccfDocs?.some(doc=>doc.id===id))return;
  const download=Boolean(button.dataset.labCcfDownload);
  button.disabled=true;
  try{
   const d=await call('ccf_url',{document_id:id,download});
   if(!/^https:\/\//i.test(d.url||''))throw Error('Document link unavailable.');
   if(download)window.location.assign(d.url);
   else{
    root.querySelector('#lab-document-title').textContent=d.title||'Chain of custody form';
    root.querySelector('#lab-document-frame').src=d.url;
    if(!docModal.open)docModal.showModal();
   }
  }catch(e){ccfHost.insertAdjacentHTML('afterbegin','<p role="alert" class="lab-doc-error">'+esc(e.message||'Unable to open CCF')+'</p>')}
  finally{button.disabled=false}
 });
 const supplyFormEl=root.querySelector('#lab-supply-form'),supplyCatalog=root.querySelector('#lab-supply-catalog'),
  supplyStatus=root.querySelector('#lab-supply-status');
 let supplyItems=[],supplyLoading=false;
 async function loadSupplies(){
  if(supplyLoading||supplyItems.length)return;
  supplyLoading=true;supplyStatus.textContent='Loading available supply items…';
  try{
   const result=await call('supply_catalog');supplyItems=result.supplies||[];
   supplyCatalog.innerHTML=supplyItems.length?supplyItems.map(item=>'<label class="lab-supply-item"><span><strong>'+esc(item.name)+'</strong><small>'+esc(item.description||item.sku||'')+'</small></span><input type="number" min="0" max="1000" step="1" value="0" data-supply-item="'+esc(item.id)+'" aria-label="Quantity for '+esc(item.name)+'"></label>').join(''):'<p>No supply items are currently available.</p>';
   supplyStatus.textContent='';
  }catch(error){supplyStatus.textContent=error.message||'Unable to load supply items.'}
  finally{supplyLoading=false}
 }
 supplyFormEl.addEventListener('submit',async event=>{
  event.preventDefault();if(!supplyFormEl.reportValidity())return;
  const items=[...supplyCatalog.querySelectorAll('[data-supply-item]')].map(el=>({
   item_id:el.dataset.supplyItem,quantity:Number(el.value)
  })).filter(item=>item.quantity>0);
  if(!items.length){supplyStatus.textContent='Choose at least one item and quantity.';return}
  const button=root.querySelector('#lab-supply-submit');if(button.disabled)return;
  const raw=Object.fromEntries(new FormData(supplyFormEl).entries());
  const shipping_address=Object.fromEntries(['recipient','line1','line2','city','state','postal_code'].map(key=>[key,raw[key]||'']));
  button.disabled=true;supplyStatus.textContent='Submitting your supply request…';
  try{
   const result=await call('request_supplies',{lines:items,shipping_address,notes:raw.notes||''});
   supplyStatus.textContent='Supply request '+String(result.request?.id||'submitted').slice(0,8)+' was received by Workforce Testing.';
   supplyFormEl.reset();
  }catch(error){supplyStatus.textContent=error.message||'Unable to submit supplies.'}
  finally{button.disabled=false}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const button=root.querySelector('#lab-order-submit');if(button.disabled)return;
  button.disabled=true;message.textContent='Submitting your testing request…';
  const payload=Object.fromEntries(new FormData(form).entries());
  try{
   const d=await call('create_order',payload);
   message.textContent='Testing request '+(d.case?.case_number||'submitted')+' received. Scheduling and donor-pass issuance are pending Workforce review.';
   form.reset();select.dispatchEvent(new Event('change'));
  }catch(error){message.textContent=error.message||'Unable to submit testing request.'}
  finally{button.disabled=false}
 });
 selectTab(new URLSearchParams(location.search).get('lab')||'overview');
}
window.CtpaLabServices=Object.freeze({render,bind});
})();