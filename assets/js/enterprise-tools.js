(()=>{
'use strict';
const LABELS={catalog:'Enterprise Features',policy:'Policy Builder',enrollment:'Enrollment Documents',sites:'Collection Sites',clearinghouse:'Clearinghouse',rtd:'RTD & Follow-Up'};
const ESC=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=v=>String(v??'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const fmt=v=>v?new Date(v).toLocaleDateString():'—';
const activeTool=()=>{const t=new URLSearchParams(location.search).get('tool')||'catalog';return Object.hasOwn(LABELS,t)?t:'catalog'};
async function call(body={}){
 const w=window.S4UCTPAWorkspace?.read();
 const {data:{session},error}=await window.S4UGetSupabaseClient().auth.getSession();
 if(error||!session?.access_token||!w?.ctpa_id)throw Error('An authenticated C/TPA account is required.');
 const config=window.PORTAL_CONFIG;
 const res=await fetch(config.workforceUrl+'/functions/v1/workforce-ctpa-enterprise-tools',{
  method:'POST',cache:'no-store',
  headers:{'Content-Type':'application/json',apikey:config.workforceKey,Authorization:'Bearer '+session.access_token},
  body:JSON.stringify({ctpa_id:w.ctpa_id,surface:w.surface,...body})
 });
 const payload=await res.json().catch(()=>({}));
 if(!res.ok||payload.error)throw Error(payload.error||'Unable to load C/TPA Enterprise records.');
 return payload;
}
async function load(){return call({tool:activeTool(),action:'list'})}
const names=[['catalog','Feature','Category','Open'],['policy','Employer','Policy','Status','Version','Created'],['enrollment','Employer','Document','Type','Tracking','Issued'],['sites','Name','Address','Capabilities','Phone','Status'],['clearinghouse','Account','Setup','Queries','Violations','RTD'],['rtd','Employer','Employee','Source','Testing','Status']];
function rowsFor(tool,records,employers){
 if(tool==='catalog'){
  const links={employer_management:'employers.html',employee_management:'people.html',programs:'programs.html',
   consortium_pools:'pools.html',random_selections:'selections.html',testing_orders:'testing.html',
   results_summary:'results.html',results_sensitive:'results.html',compliance:'compliance.html',
   documents:'documents.html',standard_reports:'reports.html',advanced_reports:'reports.html',
   billing_tools:'billing.html',client_invoicing:'employer-billing.html',
   white_label:'branding.html',branded_portals:'branding.html',branded_documents:'documents.html',
   branded_email:'notifications.html',branded_popups:'notifications.html',
   notifications:'notifications.html',team_users:'users-roles.html',locations:'locations.html',
   employer_import:'employers.html',employer_settings:'employers.html',policy_builder:'enterprise-tools.html?tool=policy',
   enrollment_documents:'enterprise-tools.html?tool=enrollment',collection_sites:'enterprise-tools.html?tool=sites',
   clearinghouse_tools:'enterprise-tools.html?tool=clearinghouse',rtd_follow_up:'enterprise-tools.html?tool=rtd',
   customer_portal_delivery:'documents.html',integrations:'integrations.html',sso:'account-settings.html',
   audit_history:'audit-history.html',ders_supervisors:'users-roles.html'};
  return records.map(r=>'<tr><td><strong>'+ESC(r.name||r.code)+'</strong></td><td>'+ESC(text(r.category||'Enterprise'))+'</td><td><a class="btn ghost" href="/'+ESC(links[r.code]||'enterprise-tools.html')+'">Open feature</a></td></tr>').join('');
 }

 const employer=new Map((employers||[]).map(x=>[x.id,x.legal_name||'Employer']));
 return records.map(r=>{
  const cells=tool==='policy'?[employer.get(r.employer_id)||'—',r.title,r.status,r.version,fmt(r.created_at)]:
  tool==='enrollment'?[employer.get(r.employer_id)||'—',r.title,r.document_type,r.tracking_number,fmt(r.issued_at)]:
  tool==='sites'?[r.name,[r.address_line1,r.city,r.state,r.postal_code].filter(Boolean).join(', '),[r.dot_capable?'DOT':'',r.non_dot_capable?'NON-DOT':'',r.drug_testing?'Drug':'',r.alcohol_testing?'Alcohol':''].filter(Boolean).join(' · '),r.phone,r.status]:
  tool==='clearinghouse'?[r.clearinghouse_account_name,r.setup_status,r.query_management_enabled?'Enabled':'Disabled',r.violation_management_enabled?'Enabled':'Disabled',r.rtd_management_enabled?'Enabled':'Disabled']:
  [employer.get(r.employer_id)||'—',r.employee_id,r.source,[r.total_tests_required||0,'tests',r.total_plan_months||0,'months'].join(' '),r.status];
  return '<tr>'+cells.map(c=>'<td>'+ESC(c||'—')+'</td>').join('')+'</tr>';
 }).join('');
}
function render(d){
 if(!d||d.error)return '<section class="panel" role="alert"><h2>Unable to load Enterprise tools</h2><p>'+ESC(d?.error||'Please retry.')+'</p></section>';
 const selected=activeTool(),list=Array.isArray(d.records)?d.records:[],employers=Array.isArray(d.employers)?d.employers:[];
 const tabs='<nav aria-label="Enterprise tools" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">'+Object.entries(LABELS).map(([id,label])=>'<a class="btn '+(selected===id?'primary':'ghost')+'" href="/enterprise-tools.html?tool='+id+'" '+(selected===id?'aria-current="page"':'')+'>'+ESC(label)+'</a>').join('')+'</nav>';
 const headers=names.find(x=>x[0]===selected)?.slice(1)||[];
 const table='<div class="panel"><div class="panel-head"><div><h2>'+ESC(LABELS[selected])+'</h2><p>'+ESC(list.length)+' records in the selected operating context</p></div></div><div class="table-wrap"><table><thead><tr>'+headers.map(h=>'<th>'+ESC(h)+'</th>').join('')+'</tr></thead><tbody>'+rowsFor(selected,list,employers)+(list.length?'':'<tr><td colspan="'+headers.length+'">No records available for this context.</td></tr>')+'</tbody></table></div></div>';
 const employerOptions=employers.map(x=>'<option value="'+ESC(x.id)+'">'+ESC(x.legal_name||'Employer')+'</option>').join('');
 const form=selected==='policy'&&d.can_manage?'<section class="panel" style="margin-top:20px"><div class="panel-head"><div><h2>Create a policy draft</h2><p>Drafts are saved to this C/TPA account for review and approval.</p></div></div><form id="ctpa-policy-form"><div class="form-grid"><label>Employer<select name="employer_id" required><option value="">Choose employer</option>'+employerOptions+'</select></label><label>Policy title<input name="title" required maxlength="180" placeholder="Drug and alcohol testing policy"></label></div><label>Policy instructions<textarea name="instructions" required rows="6" minlength="20" maxlength="4000" placeholder="Enter scope, testing requirements, roles, procedures, and review requirements"></textarea></label><div style="display:flex;align-items:center;gap:12px;margin-top:12px"><button class="btn primary" type="submit">Save policy draft</button><span id="ctpa-policy-status" role="status" aria-live="polite"></span></div></form></section>':'';
 const enrollmentForm=selected==='enrollment'&&d.can_manage?'<section class="panel" style="margin-top:20px"><div class="panel-head"><div><h2>Issue an enrollment document</h2><p>Records are issued into the selected C/TPA account with a unique tracking number.</p></div></div><form id="ctpa-enrollment-form"><div class="form-grid"><label>Employer<select name="employer_id" required><option value="">Choose employer</option>'+employerOptions+'</select></label><label>Document type<select name="document_type" required><option value="enrollment_agreement">Enrollment agreement</option><option value="participation_certificate">Participation certificate</option><option value="program_enrollment">Program enrollment</option><option value="employer_authorization">Employer authorization</option></select></label></div><label>Document title<input name="title" maxlength="180" required placeholder="Enrollment confirmation"></label><div style="display:flex;align-items:center;gap:12px;margin-top:12px"><button type="submit" class="btn primary">Issue document record</button><span id="ctpa-enrollment-status" role="status" aria-live="polite"></span></div></form></section>':'';
 const clearinghouseForm=selected==='clearinghouse'&&d.can_manage&&d.surface==='dot'?'<section class="panel" style="margin-top:20px"><div class="panel-head"><div><h2>Clearinghouse account tracking</h2><p>Record registration and internal workflow status. This does not submit information to FMCSA.</p></div></div><form id="ctpa-clearinghouse-form"><div class="form-grid"><label>Account name<input name="account_name" required maxlength="180"></label><label>Registered email<input type="email" name="registered_email" maxlength="200"></label><label>Setup status<select name="setup_status"><option value="not_started">Not started</option><option value="assistance_requested">Assistance requested</option><option value="in_progress">In progress</option><option value="active">Active</option><option value="declined">Declined</option></select></label></div><div class="form-grid"><label><input type="checkbox" name="query_management_enabled"> Query management</label><label><input type="checkbox" name="violation_management_enabled"> Violation management</label><label><input type="checkbox" name="rtd_management_enabled"> RTD tracking</label></div><div style="display:flex;gap:12px;align-items:center;margin-top:12px"><button class="btn primary" type="submit">Save account tracking</button><span role="status" id="ctpa-clearinghouse-status"></span></div></form></section>':'';
 const workers=Array.isArray(d.employees)?d.employees:[];
 const workerOptions=workers.map(e=>'<option value="'+ESC(e.id)+'" data-employer="'+ESC(e.employer_id)+'">'+ESC([e.first_name,e.last_name].filter(Boolean).join(' ')||'Employee')+'</option>').join('');
 const rtdForm=selected==='rtd'&&d.can_manage?'<section class="panel" style="margin-top:20px"><div class="panel-head"><div><h2>Create a follow-up testing plan draft</h2><p>Enter the documented plan requirements. Drafts do not authorize return to safety-sensitive work.</p></div></div><form id="ctpa-rtd-form"><div class="form-grid"><label>Employer<select required name="employer_id"><option value="">Choose employer</option>'+employerOptions+'</select></label><label>Employee<select required name="employee_id"><option value="">Choose employee</option>'+workerOptions+'</select></label><label>Test type<select name="test_type"><option value="drug">Drug</option><option value="alcohol">Alcohol</option><option value="both">Drug and alcohol</option></select></label><label>First 12 months, number of tests<input type="number" name="first_12_month_test_count" min="6" max="60" value="6" required></label><label>Plan duration (months)<input type="number" name="total_plan_months" min="12" max="60" value="12" required></label></div><label>Documented instructions<textarea name="instructions" maxlength="1500" rows="4"></textarea></label><div style="display:flex;gap:12px;align-items:center;margin-top:12px"><button class="btn primary" type="submit">Save plan draft</button><span id="ctpa-rtd-status" role="status"></span></div></form></section>':'';
 const details=selected==='clearinghouse'?'<p class="notice">FMCSA Clearinghouse records and designations apply to the DOT operating context. No Clearinghouse action is submitted automatically.</p>':selected==='rtd'?'<p class="notice">Return-to-duty and follow-up testing plans are displayed for authorized managed employers. Sensitive records remain subject to additional permissions.</p>':'';
 return tabs+details+table+form+enrollmentForm+clearinghouseForm+rtdForm;
}
function bind(){
 const bindAction=(id,tool,action,fields)=>{
  const form=document.getElementById(id);if(!form)return;
  form.addEventListener('submit',async event=>{
   event.preventDefault();const submit=form.querySelector('button[type=submit]'),status=form.querySelector('[role=status]');submit.disabled=true;
   try{
    const fd=new FormData(form),payload={tool,action};
    for(const name of fields)payload[name]=String(fd.get(name)||'');
    if(tool==='clearinghouse')for(const name of ['query_management_enabled','violation_management_enabled','rtd_management_enabled'])payload[name]=fd.has(name);
    if(tool==='rtd')for(const name of ['first_12_month_test_count','total_plan_months'])payload[name]=Number(fd.get(name));
    await call(payload);if(status)status.textContent='Saved.';
    await window.Portal.refresh();
   }catch(error){if(status)status.textContent=error?.message||'Save failed';submit.disabled=false}
  });
 };
 bindAction('ctpa-clearinghouse-form','clearinghouse','save_clearinghouse',['account_name','registered_email','setup_status']);
 bindAction('ctpa-rtd-form','rtd','save_rtd',['employer_id','employee_id','test_type','first_12_month_test_count','total_plan_months','instructions']);
 const enrollment=document.getElementById('ctpa-enrollment-form');
 if(enrollment)enrollment.addEventListener('submit',async e=>{
  e.preventDefault();const button=enrollment.querySelector('[type=submit]'),status=document.getElementById('ctpa-enrollment-status');
  button.disabled=true;
  try{
   const fd=new FormData(enrollment);
   await call({action:'issue_enrollment',tool:'enrollment',employer_id:String(fd.get('employer_id')||''),title:String(fd.get('title')||''),document_type:String(fd.get('document_type')||'')});
   if(status)status.textContent='Enrollment record issued.';
   await window.Portal.refresh();
  }catch(error){if(status)status.textContent=error?.message||'Unable to issue enrollment.';button.disabled=false;}
 });
 const form=document.getElementById('ctpa-policy-form');if(!form)return;
 form.addEventListener('submit',async e=>{
  e.preventDefault();const button=form.querySelector('[type=submit]'),status=document.getElementById('ctpa-policy-status');button.disabled=true;
  try{
   const fd=new FormData(form);
   await call({action:'save_policy',tool:'policy',employer_id:String(fd.get('employer_id')||''),title:String(fd.get('title')||''),instructions:String(fd.get('instructions')||'')});
   if(status)status.textContent='Policy draft saved.';
   await window.Portal.refresh();
  }catch(error){if(status)status.textContent=error.message||'Unable to save draft.';button.disabled=false}
 });
}
window.CtpaEnterpriseTools=Object.freeze({load,render,bind});
})();
