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
 {id:"orders",label:"Order a test"},
 {id:"tracking",label:"Testing & donor passes"},
 {id:"supplies",label:"Supplies"},
 {id:"documents",label:"Documents & CCFs"},
 {id:"billing",label:"Billing"},
 {id:"support",label:"Support"}
];
const tabLinks=()=>'<nav class="lab-section-nav" aria-label="Lab Account sections">'+sections.map(x=>'<button class="btn ghost lab-section-tab" type="button" data-lab-tab="'+esc(x.id)+'">'+esc(x.label)+'</button>').join('')+'</nav>';
const labForm=()=>'<section class="section" data-lab-panel="orders"><h2>Order a laboratory test</h2><p>Submit a request into Workforce Testing Management. Scheduling and donor-pass issuance follow staff review.</p><p id="lab-order-message" role="status" aria-live="polite"></p><form id="lab-order-form" class="panel"><div class="lab-migration-grid"><label>Test service <select name="service_id" required id="lab-order-service"><option value="">Loading available services…</option></select></label><label>First name <input name="first_name" maxlength="100" required></label><label>Last name <input name="last_name" maxlength="100" required></label><label>Donor email <input name="donor_email" type="email" required></label><label>Donor phone <input name="donor_phone" type="tel" maxlength="35"></label><label>Date of birth <input name="date_of_birth" type="date" required></label><label>State of residence <input name="state_of_residence" maxlength="2" pattern="[A-Za-z]{2}" placeholder="IL" required></label><label>Reason for testing <select name="reason_for_test" required><option value="">Choose reason</option><option value="PE">Pre-employment</option><option value="RN">Random</option><option value="PA">Post-accident</option><option value="RS">Reasonable suspicion</option><option value="RT">Return to duty</option><option value="FU">Follow-up</option><option value="NI">Other / not indicated</option></select></label><label id="lab-authority-wrap" hidden>DOT authority <select name="testing_authority"><option value="">Choose agency</option><option value="FMCSA">FMCSA</option><option value="FAA">FAA</option><option value="FRA">FRA</option><option value="FTA">FTA</option><option value="PHMSA">PHMSA</option><option value="USCG">USCG</option></select></label></div><label>Notes for Workforce Testing <textarea name="notes" maxlength="1000" rows="3"></textarea></label><div><button class="btn primary" type="submit" id="lab-order-submit">Submit testing request</button></div></form></section>';
const supplyForm=()=>'<section class="section" data-lab-panel="supplies"><h2>Request testing supplies</h2><p>Choose physical supply items and provide the shipping destination. Workforce Testing Management handles fulfillment and tracking.</p><p id="lab-supply-status" role="status" aria-live="polite"></p><form id="lab-supply-form" class="panel"><div id="lab-supply-catalog">Open the Supplies tab to load available items.</div><div class="lab-migration-grid"><label>Recipient <input name="recipient" required maxlength="180"></label><label>Street address <input name="line1" required maxlength="180"></label><label>Address line 2 <input name="line2" maxlength="180"></label><label>City <input name="city" required maxlength="180"></label><label>State <input name="state" required minlength="2" maxlength="2" pattern="[A-Za-z]{2}"></label><label>ZIP code <input name="postal_code" required pattern="[0-9]{5}(-[0-9]{4})?"></label></div><label>Special instructions <textarea name="notes" maxlength="1000" rows="3"></textarea></label><button class="btn primary" type="submit" id="lab-supply-submit">Request supplies</button></form></section>';
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
 '<section class="section" data-lab-panel="tracking"><h2>Lab Account testing requests</h2><p>Read-only request status for records linked to this C/TPA. Requests without verified company linkage stay in the original Lab Account portal until Workforce completes the account mapping.</p>'+
 (requests.length?requests.map(r=>'<div class="panel lab-migration-row"><div><strong>'+esc(r.case_number||"Testing request")+'</strong><small>'+esc(r.test_type||"Test type pending")+' · Submitted '+date(r.created_at)+'</small><small>Donor pass: '+esc(tag(r.donor_pass_status||"not_issued"))+(r.donor_pass_issued_at?' · Issued '+date(r.donor_pass_issued_at):'')+'</small></div><span class="badge">'+esc(tag(r.status))+'</span></div>').join(''):'<div class="panel">No testing requests are currently verified for this C/TPA. Existing orders remain available in the original Lab Account portal during migration.</div>')+'</section>'+
 labForm()+ 
 '<section class="section" data-lab-panel="documents"><h2>Lab Account documents and collection forms</h2><p>View Workforce-published laboratory account documents. Existing C/TPA and testing documents remain available in their original Workforce modules.</p><div id="lab-published-documents" class="lab-document-list" aria-live="polite">Loading published documents…</div><dialog id="lab-document-preview" class="lab-document-dialog"><div class="lab-document-dialog-bar"><h3 id="lab-document-title">Document preview</h3><button class="btn ghost" type="button" id="lab-document-close">Close</button></div><iframe title="Lab Account document preview" id="lab-document-frame"></iframe></dialog>'+scopedLink('/documents.html','C/TPA Documents','Existing company documents workspace')+scopedLink('/testing-documents.html','Testing documents','Existing C/TPA testing documentation')+'</section>'+
 '<section class="section" data-lab-panel="billing"><h2>Account billing</h2><p>Workforce C/TPA already has billing and order history. Laboratory-specific charges must remain identifiable separately from unrelated subscriptions.</p>'+scopedLink('/billing.html','Workforce Billing','Existing C/TPA billing and invoices')+scopedLink('/order-history.html','Order history','Existing C/TPA purchase records')+'</section>'+
 '<section class="section" data-lab-panel="support"><h2>Lab Account support</h2><p>Contact Workforce support for test registration, collection instructions, or laboratory-account issues.</p>'+scopedLink('/support.html','Contact Support','Existing C/TPA support workflow')+'</section>'+
 '<section class="notice" data-lab-panel="overview"><strong>Lab Account migration</strong><p>Original C/TPA testing, results, consortium, and billing features remain unchanged. Laboratory orders, donor passes, and customer documents will be added only after company entitlement and records mapping are verified.</p></section></div>';
}
function bind(call){
 const root=document.querySelector('.lab-migration-hub');if(!root)return;
 const buttons=[...root.querySelectorAll('[data-lab-tab]')];
 function selectTab(value){
  const selected=sections.some(x=>x.id===value)?value:'overview';
  root.querySelectorAll('[data-lab-panel]').forEach(panel=>{panel.hidden=panel.dataset.labPanel!==selected;});
  buttons.forEach(button=>{const on=button.dataset.labTab===selected;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));});
  if(selected==='orders')loadServices();
  if(selected==='supplies')loadSupplies();
  if(selected==='documents')loadDocuments();
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
  }catch(error){documentsHost.setAttribute('data-error',String(error.message||error))}
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