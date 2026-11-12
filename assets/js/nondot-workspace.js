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
 if(d?.ok!==true||d?.context!=='nondot'||d?.read_only!==true)return '<section class="panel"><h2>NON-DOT access unavailable</h2><p>This workspace requires an independently authorized NON-DOT subscription and feature entitlement.</p></section>';
 const section=sections.find(x=>x.id===d.section)||sections[1];
 const tabs='<nav class="nondot-module-nav" aria-label="NON-DOT modules">'+sections.map(x=>'<a href="/nondot-workspace.html?section='+x.id+'" class="'+(x.id===section.id?'active':'')+'"'+(x.id===section.id?' aria-current="page"':'')+'>'+esc(x.label)+'</a>').join('')+'</nav>';
 const body=drawData(section.id,d.data||{});
 return '<div class="nondot-workspace"><section class="panel"><div class="panel-head"><div><h2>NON-DOT Workforce</h2><p>Company-policy operations for your authorized C/TPA company. These records stay separate from DOT-regulated records.</p></div><span class="badge">Read-only migration view</span></div>'+tabs+'</section><section class="panel"><div class="panel-head"><div><h2>'+esc(section.label)+'</h2><p>'+esc(section.detail)+'</p></div></div>'+body+'</section><p class="nondot-privacy-note">This migration view does not create tests, run random selections, release results, or change employee records. Existing authorized NON-DOT tools remain available on the legacy portal until the replacement is tested.</p></div>';
}
window.CtpaNondotWorkspace=Object.freeze({render});
})();