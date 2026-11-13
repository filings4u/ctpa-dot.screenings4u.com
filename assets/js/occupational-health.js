(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const pretty=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const fmt=v=>v?new Date(v).toLocaleDateString('en-US'):'—';
let pageData={};
const $=s=>document.querySelector(s);
function option(value,label,selected){return '<option value="'+esc(value)+'"'+(String(selected||'')===String(value)?' selected':'')+'>'+esc(label)+'</option>'}
function notify(message){if(window.S4UDialog?.alert)window.S4UDialog.alert(message);else alert(message)}
async function refresh(){if(window.Portal?.refresh)await window.Portal.refresh();}
function form(d,current){
 const employers=d.employers||[],employees=d.employees||[],record=current||{};
 const employerOptions=employers.map(x=>option(x.id,x.legal_name,x.id===record.employer_id?x.id:record.employer_id)).join('');
 const employeeOptions=employees.filter(x=>x.employer_id===(record.employer_id||employers[0]?.id)).map(x=>option(x.id,[x.first_name,x.last_name].filter(Boolean).join(' '),record.employee_id)).join('');
 return '<form id="occupational-form" class="panel section occupational-form-panel"><div class="panel-head"><div><h2>'+(record.id?'Edit Physical '+esc(record.reference_number):'Create Occupational Physical')+'</h2><p>Assign a DOT or non-DOT physical to a managed Employer employee. Drafts can be edited or deleted before submission.</p></div></div><div class="modal-grid occupational-form-grid">'+
 '<div class="field"><label>Employer</label><select name="employer_id" id="occupational-employer" required>'+employerOptions+'</select></div>'+
 '<div class="field"><label>Employee / Driver</label><select name="employee_id" id="occupational-employee" required>'+employeeOptions+'</select></div>'+
 '<div class="field"><label>Physical Type</label><select name="physical_type" required>'+option('DOT','DOT Physical',record.physical_type||'DOT')+option('NON_DOT','Non-DOT Physical',record.physical_type||'DOT')+'</select></div>'+
 '<div class="field"><label>Exam Type</label><select name="exam_type" required>'+[['physical','Standard Physical'],['recertification','Recertification'],['return_to_duty','Return to Duty'],['fit_for_duty','Fit for Duty'],['pre_employment','Pre-Employment']].map(x=>option(x[0],x[1],record.exam_type||'physical')).join('')+'</select></div>'+
 '<div class="field full"><label>Internal Notes</label><textarea name="notes" rows="3">'+esc(record.notes||'')+'</textarea></div>'+
 '<div class="field full"><div class="selection-row-actions occupational-actions"><button class="btn primary" type="submit">'+(record.id?'Save Changes':'Create Draft')+'</button><button type="button" class="btn secondary" id="occupational-reset">Clear Form</button></div><p id="occupational-form-error" role="alert" style="color:#a12626"></p></div></div></form>';
}
function render(d){
 pageData=d;const records=d.physicals||[];const drafts=records.filter(x=>x.status==='draft').length,pending=records.filter(x=>x.status==='submitted'||x.status==='in_progress').length,ready=records.filter(x=>!!x.donor_pass_id).length;
 const rows=records.map(x=>{
 const pass=x.donor_pass;
 const actions='<a class="mini-btn" href="#" data-view="'+esc(x.id)+'">View</a> '+(x.status==='draft'?'<button type="button" class="mini-btn" data-edit="'+esc(x.id)+'">Edit</button> <button type="button" class="mini-btn primary" data-submit="'+esc(x.id)+'">Send to Workforce</button> <button type="button" class="mini-btn danger" data-archive="'+esc(x.id)+'">Delete</button> ':'')+(pass?'<button type="button" class="mini-btn primary" data-pass="'+esc(x.id)+'">Donor Pass</button> ':'')+(pass&&x.status!=='delivered'?'<button type="button" class="mini-btn" data-deliver="'+esc(x.id)+'">Push to Employer</button> ':'');
 return '<tr data-occupational-row data-search="'+esc([x.reference_number,x.donor_name,x.company_name,x.physical_type,x.exam_type].join(' ').toLowerCase())+'"><td><strong>'+esc(x.reference_number)+'</strong><small>'+fmt(x.created_at)+'</small></td><td>'+esc(x.donor_name)+'</td><td>'+esc(x.company_name||x.employer?.legal_name||'')+'</td><td><strong>'+esc(x.physical_type==='NON_DOT'?'Non-DOT':'DOT')+'</strong><small>'+esc(pretty(x.exam_type))+'</small></td><td><span class="badge">'+esc(pretty(x.status))+'</span></td><td>'+esc(pass?.pass_number||'Not issued')+'</td><td>'+actions+'</td></tr>';
 }).join('');
 return '<div class="occupational-workspace">'+
 '<div class="metrics"><div class="metric"><small>Physical Orders</small><strong>'+records.length+'</strong><span>Total active</span></div><div class="metric"><small>Drafts</small><strong>'+drafts+'</strong><span>Ready to submit</span></div><div class="metric"><small>In Processing</small><strong>'+pending+'</strong><span>Testing Management</span></div><div class="metric"><small>Donor Passes</small><strong>'+ready+'</strong><span>Issued</span></div></div>'+
 (d.can_manage?form(d,null):'')+
 '<section class="panel section occupational-orders-panel"><div class="panel-head"><div><h2>Physical Orders</h2><p>View, update and submit physicals; download issued donor passes.</p></div><input id="occupational-search" type="search" placeholder="Search physicals"></div><div class="table-wrap occupational-table-wrap"><table><thead><tr><th>Order</th><th>Employee</th><th>Employer</th><th>Physical</th><th>Status</th><th>Pass</th><th>Actions</th></tr></thead><tbody>'+ (rows||'<tr><td colspan="7"><div class="empty">No physicals have been created yet.</div></td></tr>')+'</tbody></table></div></section>'+
 '<div id="occupational-detail"></div></div>';
}
function bindForm(d,record){
 const formEl=$('#occupational-form');if(!formEl)return;
 const employers=d.employers||[],employees=d.employees||[];
 const employer=$('#occupational-employer'),employee=$('#occupational-employee');
 const setEmployees=()=>{const chosen=employees.filter(x=>x.employer_id===employer.value);employee.innerHTML=chosen.map(x=>option(x.id,[x.first_name,x.last_name].filter(Boolean).join(' '),record?.employee_id)).join('');};
 employer.onchange=setEmployees;setEmployees();
 $('#occupational-reset').onclick=()=>refresh();
 formEl.onsubmit=async event=>{
  event.preventDefault();const button=formEl.querySelector('button[type=submit]'),error=$('#occupational-form-error');error.textContent='';
  const body=Object.fromEntries(new FormData(formEl).entries());if(!body.employee_id){error.textContent='Select an employee.';return;}
  button.disabled=true;
  try{await window.Portal.invoke('workforce-ctpa-occupational-health',{action:record?'update':'create',physical_id:record?.id,physical:body});await refresh()}
  catch(e){error.textContent=e.message||String(e);button.disabled=false}
 };
}
function showPass(r){
 const p=r.donor_pass;if(!p)return notify('Testing Management has not issued a donor pass for this physical.');
 const win=window.open('','_blank');
 if(!win)return notify('Allow popups to open the donor pass.');win.opener=null;
 const doc='<!doctype html><html><head><title>Workforce Donor Pass</title><style>body{font-family:Arial,sans-serif;color:#102f55;padding:35px;max-width:740px;margin:auto}h1{color:#ff6b00}table{width:100%;border-collapse:collapse}td{padding:12px;border-bottom:1px solid #ddd}.brand{background:#102f55;color:#fff;padding:22px;font-size:24px;font-weight:800}.note{margin-top:20px;padding:14px;background:#eef3f9}@media print{.print{display:none}}</style></head><body><div class="brand">Workforce | OCCUPATIONAL HEALTH</div><h1>Donor Pass</h1><table><tr><td>Pass Number</td><td>'+esc(p.pass_number)+'</td></tr><tr><td>Employee</td><td>'+esc(r.donor_name)+'</td></tr><tr><td>Employer</td><td>'+esc(r.company_name)+'</td></tr><tr><td>Physical</td><td>'+esc(r.physical_type==='NON_DOT'?'Non-DOT':'DOT')+' — '+esc(pretty(r.exam_type))+'</td></tr><tr><td>Collection Site</td><td>'+esc(p.collection_site_name||'To be assigned')+'</td></tr><tr><td>Address</td><td>'+esc(p.collection_site_address||'')+'</td></tr><tr><td>Confirmation</td><td>'+esc(p.confirmation_code||'')+'</td></tr></table><p class="note">'+esc(p.instructions||'Present this donor pass at the designated collection location.')+'</p><button class="print" onclick="window.print()">Print / Save as PDF</button></body></html>';
 win.document.open();win.document.write(doc);win.document.close();
}
function bind(d){
 bindForm(d,null);
 $('#occupational-search')?.addEventListener('input',event=>{const q=event.target.value.toLowerCase();document.querySelectorAll('[data-occupational-row]').forEach(el=>el.hidden=!el.dataset.search.includes(q))});
 const records=d.physicals||[],find=id=>records.find(x=>x.id===id);
 document.querySelectorAll('[data-view]').forEach(btn=>btn.onclick=event=>{event.preventDefault();const r=find(btn.dataset.view);if(!r)return;$('#occupational-detail').innerHTML='<section class="panel section"><div class="panel-head"><h2>'+esc(r.reference_number)+' — '+esc(r.donor_name)+'</h2></div><div style="padding:18px"><p><strong>Employer:</strong> '+esc(r.company_name)+'</p><p><strong>Physical:</strong> '+esc(r.physical_type)+' / '+esc(pretty(r.exam_type))+'</p><p><strong>Status:</strong> '+esc(pretty(r.status))+'</p><p><strong>Testing Management case:</strong> '+esc(r.testing_case_id||'Not submitted')+'</p><p><strong>Donor pass:</strong> '+esc(r.donor_pass?.pass_number||'Awaiting issuance')+'</p><p>'+esc(r.notes||'')+'</p></div></section>';$('#occupational-detail').scrollIntoView({behavior:'smooth'});});
 document.querySelectorAll('[data-edit]').forEach(btn=>btn.onclick=()=>{const r=find(btn.dataset.edit);if(!r)return;$('#occupational-form').outerHTML=form(d,r);bindForm(d,r);$('#occupational-form').scrollIntoView({behavior:'smooth'});});
 document.querySelectorAll('[data-submit]').forEach(btn=>btn.onclick=async()=>{if(!await window.S4UDialog.confirm('Submit this physical to Workforce Testing Management for donor-pass processing?'))return;btn.disabled=true;try{await window.Portal.invoke('workforce-ctpa-occupational-health',{action:'submit',physical_id:btn.dataset.submit});await refresh()}catch(e){notify(e.message||String(e));btn.disabled=false}});
 document.querySelectorAll('[data-archive]').forEach(btn=>btn.onclick=async()=>{if(!await window.S4UDialog.confirm('Delete this unsent physical draft?'))return;btn.disabled=true;try{await window.Portal.invoke('workforce-ctpa-occupational-health',{action:'archive',physical_id:btn.dataset.archive});await refresh()}catch(e){notify(e.message||String(e));btn.disabled=false}});
 document.querySelectorAll('[data-pass]').forEach(btn=>btn.onclick=()=>showPass(find(btn.dataset.pass)));
 document.querySelectorAll('[data-deliver]').forEach(btn=>btn.onclick=async()=>{if(!await window.S4UDialog.confirm('Mark the issued pass as ready for the Employer portal?'))return;btn.disabled=true;try{await window.Portal.invoke('workforce-ctpa-occupational-health',{action:'deliver_pass',physical_id:btn.dataset.deliver});await refresh()}catch(e){notify(e.message||String(e));btn.disabled=false}});
}
window.CtpaOccupationalHealth={render,bind};
})();