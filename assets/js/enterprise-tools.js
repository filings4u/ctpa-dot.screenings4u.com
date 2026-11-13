(()=>{
'use strict';
const LABELS={policy:'Policy Builder',enrollment:'Enrollment Documents',sites:'Collection Sites',clearinghouse:'Clearinghouse',rtd:'RTD & Follow-Up'};
const ESC=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=v=>String(v??'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const fmt=v=>v?new Date(v).toLocaleDateString():'—';
const activeTool=()=>{const t=new URLSearchParams(location.search).get('tool')||'policy';return Object.hasOwn(LABELS,t)?t:'policy'};
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
const names=[['policy','Employer','Policy','Status','Version','Created'],['enrollment','Employer','Document','Type','Tracking','Issued'],['sites','Name','Address','Capabilities','Phone','Status'],['clearinghouse','Account','Setup','Queries','Violations','RTD'],['rtd','Employer','Employee','Source','Testing','Status']];
function rowsFor(tool,records,employers){
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
 const details=selected==='clearinghouse'?'<p class="notice">FMCSA Clearinghouse records and designations apply to the DOT operating context. No Clearinghouse action is submitted automatically.</p>':selected==='rtd'?'<p class="notice">Return-to-duty and follow-up testing plans are displayed for authorized managed employers. Sensitive records remain subject to additional permissions.</p>':'';
 return tabs+details+table+form;
}
function bind(){
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
