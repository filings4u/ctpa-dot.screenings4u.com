(()=>{
'use strict';
const $=(selector,root=document)=>root.querySelector(selector);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty=v=>String(v??'—').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
const formatDate=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})};
const sections=[
 {id:'people',label:'Employees',detail:'NON-DOT employer clients and their employees'},
 {id:'programs',label:'Programs',detail:'Company-policy testing programs'},
 {id:'pools',label:'Random Pools',detail:'NON-DOT pool membership and eligibility'},
 {id:'testing',label:'Testing Orders',detail:'NON-DOT testing orders and statuses'},
 {id:'results',label:'Results',detail:'Restricted released result inventory'}
];
const statusTag=v=>'<span class="badge">'+esc(pretty(v||'pending'))+'</span>';
const recordsTable=(headers,rows)=>'<div class="table-wrap"><table><thead><tr>'+headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
const td=v=>'<td>'+esc(v)+'</td>';
const row=values=>'<tr>'+values.map(td).join('')+'</tr>';
function drawData(section,data){
 if(section==='people'){
  const employers=data.employers||[],employees=data.employees||[];
  const cards='<div class="metrics"><div class="metric"><small>Employers</small><strong>'+employers.length+'</strong></div><div class="metric"><small>Employees</small><strong>'+employees.length+'</strong></div></div>';
  return cards+recordsTable(['Employee','Employer','Status'],employees.slice(0,250).map(e=>row([[e.first_name,e.last_name].filter(Boolean).join(' ')||'—',(employers.find(x=>x.id===e.employer_id)||{}).legal_name||'—',pretty(e.employment_status||e.status)])))+
   (employees.length>250?'<p class="notice">Showing the first 250 employee records.</p>':'');
 }
 if(section==='programs'){
  const employers=data.employers||[],programs=data.programs||[];
  return recordsTable(['Program','Employer','Status'],programs.slice(0,250).map(p=>row([p.name||p.program_name,(employers.find(e=>e.id===p.employer_id)||{}).legal_name||'—',pretty(p.status)])))+
    (programs.length>250?'<p class="notice">Showing the first 250 programs.</p>':'');
 }
 if(section==='pools'){
  const pools=data.pools||[],members=data.memberships||[];
  return '<div class="metrics"><div class="metric"><small>Random pools</small><strong>'+pools.length+'</strong></div><div class="metric"><small>Membership records</small><strong>'+members.length+'</strong></div></div>'+
    recordsTable(['Pool','Status','Membership records'],pools.slice(0,250).map(p=>row([p.name||p.pool_name,pretty(p.status),members.filter(m=>m.pool_id===p.id).length])));
 }
 if(section==='testing'){
  const orders=data.orders||[],employers=data.employers||[];
  return '<p class="nondot-privacy-note">Order details and donor records remain protected by the existing testing workflow. This view shows status only.</p>'+
   recordsTable(['Order','Employer','Created','Status'],orders.slice(0,250).map(o=>row([o.order_number||'—',(employers.find(x=>x.id===o.employer_id)||{}).legal_name||'—',formatDate(o.created_at),pretty(o.status)])));
 }
 const reports=data.reports||[];
 return '<p class="nondot-privacy-note">Released and sensitive reports require explicit result permissions. Download and delivery operations remain with their secured original workflow.</p>'+
  recordsTable(['Report','Status','Updated'],reports.slice(0,250).map(r=>row([r.report_number||r.testing_order?.order_number||r.order_number||'—',pretty(r.status||r.result_status),formatDate(r.updated_at||r.released_at)])));
}
function render(d){
 if(d?.ok!==true||d?.context!=='nondot')return '<section class="panel"><h2>NON-DOT access unavailable</h2><p>This workspace requires an independently authorized NON-DOT subscription and feature entitlement.</p></section>';
 const section=sections.find(x=>x.id===d.section)||sections[1];
 const eligible=new Set(Array.isArray(d.available_sections)?d.available_sections:[]);
 const tabs='<nav class="nondot-module-nav" aria-label="NON-DOT modules">'+sections.filter(x=>eligible.has(x.id)).map(x=>'<a href="/nondot-workspace.html?section='+x.id+'" class="'+(x.id===section.id?'active':'')+'"'+(x.id===section.id?' aria-current="page"':'')+'>'+esc(x.label)+'</a>').join('')+'</nav>';
 const body=drawData(section.id,d.data||{});
 const managers=d.can_manage===true&&d.read_only===false;
 const employers=(d.data?.employers||[]).filter(x=>x&&x.id);
 const employerOptions=employers.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.legal_name||'Employer')+'</option>').join('');
 
 const managedEdit=managers&&['people','programs'].includes(section.id);
 const editItems=section.id==='people'?d.data?.employees||[]:d.data?.programs||[];
 const editForms=managedEdit&&editItems.length?'<section class="panel nondot-create"><div class="panel-head"><h2>Edit existing '+esc(section.label)+'</h2></div>'+
 editItems.slice(0,100).map(item=>{
  const id=esc(item.id),employerId=esc(item.employer_id);
  return '<details class="nondot-edit"><summary>'+esc(section.id==='people'?[item.first_name,item.last_name].filter(Boolean).join(' '):item.name||item.program_name)+'</summary>'+
   '<form class="nondot-edit-form" data-section="'+esc(section.id)+'">'+
   '<input type="hidden" name="record_id" value="'+id+'"><input type="hidden" name="employer_id" value="'+employerId+'">'+
   (section.id==='people'?'<label>First name<input name="first_name" required maxlength="120" value="'+esc(item.first_name)+'"></label><label>Last name<input name="last_name" required maxlength="120" value="'+esc(item.last_name)+'"></label>':
    '<label>Program name<input name="name" required maxlength="120" value="'+esc(item.name||item.program_name)+'"></label>')+
   '<button type="submit" class="btn primary">Save changes</button><p role="status" aria-live="polite"></p></form></details>';
 }).join('')+'</section>':'';


 const availablePools=(d.data?.pools||[]).filter(x=>x?.id&&x?.employer_id&&x.pool_type==='employer'&&x.status!=='archived');
 const poolWorkers=(d.data?.employees||[]).filter(x=>x?.id&&x?.employer_id);
 const activeMemberships=(d.data?.memberships||[]).filter(m=>m?.id&&m?.pool_id&&m?.employee_id);
 const poolMembersControl=managers&&section.id==='pools'&&availablePools.length&&poolWorkers.length?
 '<section class="panel nondot-create"><div class="panel-head"><h2>NON-DOT Pool Memberships</h2></div>'+
 '<form id="nondot-pool-member-form"><label>Employer pool<select name="pool_id" required><option value="">Select a pool</option>'+
 availablePools.map(p=>'<option value="'+esc(p.id)+'" data-employer-id="'+esc(p.employer_id)+'">'+esc(p.name||p.pool_name||'Pool')+'</option>').join('')+
 '</select></label><label>Employee<select name="employee_id" required><option value="">Select an employee</option>'+
 poolWorkers.map(e=>'<option value="'+esc(e.id)+'" data-employer-id="'+esc(e.employer_id)+'">'+esc([e.first_name,e.last_name].filter(Boolean).join(' ')||'Employee')+'</option>').join('')+
 '</select></label><button class="btn primary" type="submit">Add employee to pool</button><p role="status" aria-live="polite"></p></form>'+
 (activeMemberships.length?'<div class="nondot-memberships"><h3>Active memberships</h3>'+activeMemberships.slice(0,100).map(m=>{
 const pool=availablePools.find(p=>p.id===m.pool_id),employee=poolWorkers.find(e=>e.id===m.employee_id);
 if(!pool||!employee)return '';
 return '<div class="nondot-member-row"><span>'+esc([employee.first_name,employee.last_name].filter(Boolean).join(' '))+' · '+esc(pool.name||pool.pool_name||'Pool')+'</span><button type="button" class="btn ghost nondot-remove-member" data-pool-id="'+esc(pool.id)+'" data-employee-id="'+esc(employee.id)+'">Remove</button></div>';
 }).join('')+'</div>':'')+'</section>':'';

 const canCreate=managers&&employers.length>0&&['people','programs','pools','testing'].includes(section.id);
 const programs=(d.data?.programs||[]).filter(p=>p?.id&&p?.employer_id);
 const employees=(d.data?.employees||[]).filter(e=>e?.id&&e?.employer_id);
 const eligibleCreate=section.id==='testing'?programs.length>0&&employees.length>0:section.id!=='pools'||programs.length>0;
 const form=canCreate&&eligibleCreate?'<section class="panel nondot-create"><div class="panel-head"><h2>'+esc(section.id==='people'?'Add NON-DOT Employee':section.id==='pools'?'Create NON-DOT Random Pool':section.id==='testing'?'Create NON-DOT Testing Order':'Create NON-DOT Program')+'</h2></div>'+
 '<form id="nondot-create-form"><label>Employer<select name="employer_id" required><option value="">Select an employer</option>'+employerOptions+'</select></label>'+
 (section.id==='people'?'<label>First name<input name="first_name" required maxlength="120" autocomplete="off"></label><label>Last name<input name="last_name" required maxlength="120" autocomplete="off"></label><label>Employee number (optional)<input name="employee_number" maxlength="40" autocomplete="off"></label>' :section.id==='testing'?'<label>NON-DOT employee<select name="employee_id" required><option value="">Select an employee</option>'+employees.map(e=>'<option value="'+esc(e.id)+'" data-employer-id="'+esc(e.employer_id)+'">'+esc([e.first_name,e.last_name].filter(Boolean).join(' ')||'Employee')+'</option>').join('')+'</select></label><label>NON-DOT program<select name="program_id" required><option value="">Select a program</option>'+programs.map(p=>'<option value="'+esc(p.id)+'" data-employer-id="'+esc(p.employer_id)+'">'+esc(p.name||'Program')+'</option>').join('')+'</select></label><label>Testing type<select name="test_type" required><option value="drug">Drug test</option><option value="alcohol">Alcohol test</option></select></label>':section.id==='pools'?'<label>NON-DOT program<select name="program_id" required><option value="">Select a program</option>'+programs.map(p=>'<option value="'+esc(p.id)+'" data-employer-id="'+esc(p.employer_id)+'">'+esc(p.name||'Program')+'</option>').join('')+'</select></label><label>Pool name<input name="name" required maxlength="120" autocomplete="off"></label>':'<label>Program name<input name="name" required maxlength="120" autocomplete="off"></label>')+
 '<p class="nondot-privacy-note">Only NON-DOT records for the selected employer will be created. Your subscription and role are checked again when you submit.</p><button type="submit" class="btn primary">Save '+esc(section.id==='people'?'employee':section.id==='pools'?'draft pool':section.id==='testing'?'testing order':'program')+'</button><p id="nondot-create-status" aria-live="polite" role="status"></p></form></section>':'';

 return '<div class="nondot-workspace"><section class="panel"><div class="panel-head"><div><h2>NON-DOT Workforce</h2><p>Company-policy operations for your authorized C/TPA company. These records stay separate from DOT-regulated records.</p></div><span class="badge">'+(managers?'Authorized account manager':'Read-only migration view')+'</span></div>'+tabs+'</section><section class="panel"><div class="panel-head"><div><h2>'+esc(section.label)+'</h2><p>'+esc(section.detail)+'</p></div></div>'+body+'</section>'+form+editForms+poolMembersControl+'<p class="nondot-privacy-note">This staged workspace lets authorized primary account managers create employees, company-policy programs, draft pools and NON-DOT testing orders. Random selections, result delivery and editing existing records remain in their original authorized workflows.</p></div>';
}
function bind(data,submit){
 if(!submit||data?.can_manage!==true||data?.read_only!==false)return;
 for(const form of document.querySelectorAll('.nondot-edit-form')){
  form.addEventListener('submit',async event=>{
   event.preventDefault();
   const fd=new FormData(form),section=form.dataset.section,status=form.querySelector('[role="status"]');
   const button=form.querySelector('button[type="submit"]');
   if(button.disabled)return;
   const value={id:String(fd.get('record_id')||''),employer_id:String(fd.get('employer_id')||'')};
   if(section==='people'){value.first_name=String(fd.get('first_name')||'').trim();value.last_name=String(fd.get('last_name')||'').trim();}
   else value.name=String(fd.get('name')||'').trim();
   button.disabled=true;status.textContent='Saving changes…';
   try{await submit({section,action:section==='people'?'update_employee':'update_program',[section==='people'?'employee':'program']:value});location.reload();}
   catch(e){status.textContent=e?.message||'Update failed';button.disabled=false;}
  });
 }
 const memberForm=document.querySelector('#nondot-pool-member-form');
 if(memberForm){
  const pool=memberForm.querySelector('[name="pool_id"]'),employee=memberForm.querySelector('[name="employee_id"]'),status=memberForm.querySelector('[role="status"]');
  const match=()=>{const option=pool.selectedOptions[0],employer=option?.dataset.employerId||'';for(const o of employee.options){if(o.value)o.hidden=!employer||o.dataset.employerId!==employer;}if(employee.selectedOptions[0]?.hidden)employee.value='';};
  pool.addEventListener('change',match);match();
  memberForm.addEventListener('submit',async event=>{
   event.preventDefault();const button=memberForm.querySelector('button[type="submit"]');if(button.disabled)return;
   button.disabled=true;status.textContent='Adding pool membership…';
   try{await submit({section:'pools',action:'add_pool_member',membership:{pool_id:pool.value,employee_id:employee.value}});location.reload();}
   catch(error){status.textContent=error?.message||'Unable to add employee';button.disabled=false;}
  });
  for(const button of document.querySelectorAll('.nondot-remove-member')){
   button.addEventListener('click',async()=>{
    if(button.disabled)return;
    button.disabled=true;status.textContent='Removing pool membership…';
    try{await submit({section:'pools',action:'remove_pool_member',membership:{pool_id:button.dataset.poolId,employee_id:button.dataset.employeeId}});location.reload();}
    catch(error){status.textContent=error?.message||'Unable to remove membership';button.disabled=false;}
   });
  }
 }
 const form=document.querySelector('#nondot-create-form');
 if(!form)return;
 if(data.section==='pools'||data.section==='testing'){
  const employer=form.querySelector('[name="employer_id"]'),program=form.querySelector('[name="program_id"]'),employee=form.querySelector('[name="employee_id"]');
  const filter=()=>{const selected=employer.value;for(const input of [program,employee]){if(!input)continue;for(const o of input.options){if(!o.value)continue;o.hidden=o.dataset.employerId!==selected;}if(input.selectedOptions[0]?.hidden)input.value='';}};
  employer.addEventListener('change',filter);filter();
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  const fd=new FormData(form);
  const section=String(data.section);
  if(!['people','programs','pools','testing'].includes(section))return;
  const saveButton=form.querySelector('button[type="submit"]'),message=form.querySelector('#nondot-create-status');
  if(saveButton.disabled)return;
  const record={employer_id:String(fd.get('employer_id')||'')};
  if(section==='people'){
   record.first_name=String(fd.get('first_name')||'').trim();
   record.last_name=String(fd.get('last_name')||'').trim();
   record.employee_number=String(fd.get('employee_number')||'').trim();
  }else{
   record.name=String(fd.get('name')||'').trim();
   if(section==='pools'||section==='testing')record.program_id=String(fd.get('program_id')||'');
   if(section==='testing'){
    record.employee_id=String(fd.get('employee_id')||'');
    record.test_type=String(fd.get('test_type')||'');
   }
  }
  saveButton.disabled=true;
  message.textContent='Saving your NON-DOT record…';
  try{
   await submit({section,action:section==='people'?'save_employee':section==='pools'?'save_pool':section==='testing'?'create_test_order':'save_program',
    [section==='people'?'employee':section==='pools'?'pool':section==='testing'?'test':'program']:record});
   message.textContent='Saved. Refreshing your workspace…';
   location.reload();
  }catch(error){
   message.textContent=error?.message||'Unable to save this record.';
   saveButton.disabled=false;
  }
 });
}
window.CtpaNondotWorkspace=Object.freeze({render,bind});
})();