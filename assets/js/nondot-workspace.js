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
 const canCreate=managers&&employers.length>0&&['people','programs'].includes(section.id);
 const form=canCreate?'<section class="panel nondot-create"><div class="panel-head"><h2>'+esc(section.id==='people'?'Add NON-DOT Employee':'Create NON-DOT Program')+'</h2></div>'+
 '<form id="nondot-create-form"><label>Employer<select name="employer_id" required><option value="">Select an employer</option>'+employerOptions+'</select></label>'+
 (section.id==='people'?'<label>First name<input name="first_name" required maxlength="120" autocomplete="off"></label><label>Last name<input name="last_name" required maxlength="120" autocomplete="off"></label><label>Employee number (optional)<input name="employee_number" maxlength="40" autocomplete="off"></label>':'<label>Program name<input name="name" required maxlength="120" autocomplete="off"></label>')+
 '<p class="nondot-privacy-note">Only NON-DOT records for the selected employer will be created. Your subscription and role are checked again when you submit.</p><button type="submit" class="btn primary">Save '+esc(section.id==='people'?'employee':'program')+'</button><p id="nondot-create-status" aria-live="polite" role="status"></p></form></section>':'';

 return '<div class="nondot-workspace"><section class="panel"><div class="panel-head"><div><h2>NON-DOT Workforce</h2><p>Company-policy operations for your authorized C/TPA company. These records stay separate from DOT-regulated records.</p></div><span class="badge">Read-only migration view</span></div>'+tabs+'</section><section class="panel"><div class="panel-head"><div><h2>'+esc(section.label)+'</h2><p>'+esc(section.detail)+'</p></div></div>'+body+'</section>'+form+'<p class="nondot-privacy-note">This migration view does not create tests, run random selections, release results, or change employee records. Existing authorized NON-DOT tools remain available on the legacy portal until the replacement is tested.</p></div>';
}
function bind(data,submit){
 const form=document.querySelector('#nondot-create-form');
 if(!form||!submit||data?.can_manage!==true||data?.read_only!==false)return;
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  const fd=new FormData(form);
  const section=String(data.section);
  if(section!=='people'&&section!=='programs')return;
  const saveButton=form.querySelector('button[type="submit"]'),message=form.querySelector('#nondot-create-status');
  if(saveButton.disabled)return;
  const record={employer_id:String(fd.get('employer_id')||'')};
  if(section==='people'){
   record.first_name=String(fd.get('first_name')||'').trim();
   record.last_name=String(fd.get('last_name')||'').trim();
   record.employee_number=String(fd.get('employee_number')||'').trim();
  }else record.name=String(fd.get('name')||'').trim();
  saveButton.disabled=true;
  message.textContent='Saving your NON-DOT record…';
  try{
   await submit({section,action:section==='people'?'save_employee':'save_program',
    [section==='people'?'employee':'program']:record});
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