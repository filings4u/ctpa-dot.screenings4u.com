(()=>{'use strict';
const base=window.CtpaNewEntrantAudits;if(!base)return;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=(q,root=document)=>root.querySelector(q), $$=(q,root=document)=>[...root.querySelectorAll(q)];
const aid=()=>new URLSearchParams(location.search).get('id');
const api=x=>window.Portal.invoke('ctpa-new-entrant-audits',x);
const href='https://ai.fmcsa.dot.gov/NewEntrant/Login.aspx';
const guide='https://ai.fmcsa.dot.gov/NewEntrant/SafetyAudits.aspx';
const templates={
drivers:{name:'Driver Roster',head:['First Name','Last Name','Hire Date','License State','License Class','CDL Expiration','Medical Qualification','Notes'],row:['','','','','','','','']},
vehicles:{name:'Vehicle & Trailer Inventory',head:['Unit ID','VIN','Plate','State','Year','Make','Model','Inspection Due','Maintenance Notes'],row:['','','','','','','','','']},
documents:{name:'Document Tracking',head:['FMCSA Section','Required Record','Owner','Record Date','Status','Uploaded File Name','Review Notes'],row:['','','','','','','']},
maintenance:{name:'Maintenance Register',head:['Vehicle Unit','Service Date','Mileage','Inspection or Repair','Performed By','Receipt or Work Order','Next Service'],row:['','','','','','','']},
training:{name:'Driver Training Log',head:['Driver','Training Topic','Date','Instructor','Document Reference','Next Review'],row:['','','','','','']}
};
function dl(name,text,type='text/csv;charset=utf-8'){const blob=new Blob([text],{type}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000)}
function csvLine(row){return row.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(',')}
function exportItems(d){
 const lines=[['Section','Item','Requirement','Status','FMCSA Citation','Reviewer Notes','Uploaded Documents']];
 for(const item of d.items||[]){const docs=(d.documents||[]).filter(x=>x.metadata?.audit_item_id===item.id).map(x=>x.file_name);
 lines.push([item.section_name,item.item_name,item.requirement_level,item.status,item.citation,item.notes,docs.join('; ')])}
 dl('workforce-audit-checklist-'+aid()+'.csv',lines.map(csvLine).join('\r\n'));
}
function field(name,label,value='',type='text',hint=''){
 return '<label class="nea-profile-field"><span>'+E(label)+'</span><input data-nea-profile="'+E(name)+'" type="'+E(type)+'" value="'+E(value)+'" autocomplete="off" placeholder="'+E(hint||label)+'"></label>';
}
function selectField(name,label,value,items){
 return '<label class="nea-profile-field"><span>'+E(label)+'</span><select data-nea-profile="'+E(name)+'"><option value="">Select…</option>'+items.map(([k,l])=>'<option value="'+E(k)+'" '+(k===value?'selected':'')+'>'+E(l)+'</option>').join('')+'</select></label>';
}
function profilePanel(d){
 const p=d.audit?.metadata?.profile||{};
 return '<section class="section panel nea-workflow-card" id="nea-carrier"><div class="panel-head"><div><span class="nea-eyebrow">STEP 01 · REQUIRED CARRIER DETAILS</span><h2>Carrier information & audit scope</h2><p>These details are saved securely with this audit file and used to prepare its documentation. Fields marked * are mandatory.</p></div><button class="btn secondary btn-sm" id="neaSaveProfile" type="button">Save carrier details</button></div>'+
 '<div class="nea-profile-grid">'+
 field('contact_name','Carrier contact name *',p.contact_name)+field('contact_email','Contact email *',p.contact_email,'email')+
 field('contact_phone','Contact telephone *',p.contact_phone,'tel')+field('mailing_address','Principal place of business *',p.mailing_address)+
 selectField('operation_type','Operation type *',p.operation_type,[['interstate','Interstate'],['intrastate','Intrastate'],['both','Interstate & Intrastate']])+
 selectField('audit_method','FMCSA audit method *',p.audit_method,[['offsite','Offsite audit / NEWS'],['onsite','Onsite safety audit'],['pending','Awaiting FMCSA instructions']])+
 field('driver_count','Number of drivers *',p.driver_count,'number')+field('vehicle_count','Number of vehicles *',p.vehicle_count,'number')+
 selectField('hazmat','Hazardous materials',p.hazmat,[['yes','Yes'],['no','No'],['unsure','Not sure']])+
 field('cargo_type','Cargo / passenger service',p.cargo_type)+
 field('auditor_name','FMCSA auditor contact',p.auditor_name)+field('auditor_email','FMCSA auditor email',p.auditor_email,'email')+
 '</div><div class="nea-save-message" id="neaProfileMsg" role="status"></div></section>';
}
function templatesPanel(){
 return '<section class="section panel nea-workflow-card" id="nea-resources"><div class="panel-head"><div><span class="nea-eyebrow">TEMPLATES & GUIDANCE</span><h2>Downloadable audit preparation templates</h2><p>Starter CSV worksheets for gathering records. These are preparation aids and are not official FMCSA forms.</p></div></div><div class="nea-resource-grid">'+
 Object.entries(templates).map(([id,v])=>'<button type="button" class="btn secondary nea-resource-btn" data-nea-template="'+E(id)+'"><span>↓</span> '+E(v.name)+'.csv</button>').join('')+
 '<button type="button" class="btn secondary nea-resource-btn" data-nea-export>↓ Export audit checklist (.csv)</button>'+
 '</div><div class="nea-authorization-panel"><div class="nea-authorization-title"><span class="nea-eyebrow">ELECTRONIC CUSTOMER CONSENT</span><h3>Send carrier authorization for signature</h3><p>Create a secure, expiring signing link to send to your carrier. Their signature, date, and time are recorded, and the signed record remains accessible in this audit file.</p></div><div class="nea-authorization-controls"><label><span>Carrier signer name (optional)</span><input type="text" id="neaAuthName" autocomplete="off" placeholder="Carrier representative"></label><label><span>Carrier signer email *</span><input type="email" id="neaAuthEmail" autocomplete="off" placeholder="name@carrier.com"></label><button type="button" class="btn primary" id="neaAuthCreate">Create signing link</button></div><p id="neaAuthMessage" role="status" class="nea-auth-message"></p><div id="neaAuthShare" class="nea-auth-share" hidden><label><span>Customer signing link</span><input id="neaAuthLink" type="text" readonly aria-label="Customer signing link"></label><div class="nea-auth-actions"><button type="button" id="neaAuthCopy" class="btn secondary">Copy signing link</button><a id="neaAuthEmailLink" class="btn secondary" href="#">Share by email</a></div></div><div class="nea-auth-history" id="neaAuthHistory"></div></div><p class="nea-note">Download and complete the CSV templates, then upload the relevant records to the checklist. Keep signed authorization records where FMCSA requires them.</p></section>';
}
function authPanel(d){
 const p=d.audit?.metadata?.profile||{},value=(k)=>p[k]||'';
 return '<section class="section panel nea-workflow-card" id="nea-submission"><div class="panel-head"><div><span class="nea-eyebrow">STEP 04 · FMCSA OFFSITE HANDOFF</span><h2>Submit to FMCSA when instructed</h2><p>FMCSA conducts the official audit. For an offsite audit, the carrier or a properly authorized representative uses FMCSA’s New Entrant Web System (NEWS) to submit requested documents.</p></div></div>'+
 '<div class="nea-info-callout"><strong>Do not share carrier passwords or login codes.</strong><p>The carrier should sign in to Login.gov directly. A C/TPA submitting on a carrier’s behalf must first obtain appropriate authority and permitted access. Record the authorization here—never store Login.gov usernames, passwords, MFA codes or recovery codes in Workforce.</p></div>'+
 '<div class="nea-profile-grid">'+
 selectField('authorization_method','Submission arrangement',value('authorization_method'),[['carrier','Carrier submits directly'],['delegated','C/TPA with authorized access'],['pending','Authorization pending']])+
 field('authorized_delegate_name','Authorized representative name',value('authorized_delegate_name'))+
 field('authorized_delegate_email','Representative contact email',value('authorized_delegate_email'),'email')+
 field('authorization_date','Authorization date',value('authorization_date'),'date')+
 field('submission_date','Official submission date',value('submission_date'),'date')+
 field('submission_reference','FMCSA NEWS confirmation / reference',value('submission_reference'))+
 field('submitted_by','Submitted by',value('submitted_by'))+
 field('submission_notes','Submission / auditor notes',value('submission_notes'))+
 '</div><div class="nea-actions-row"><button class="btn secondary" id="neaSaveSubmission" type="button">Save submission details</button><a href="'+href+'" target="_blank" rel="noopener noreferrer" class="btn primary nea-official-link">Open FMCSA NEWS ↗</a><a href="'+guide+'" target="_blank" rel="noopener noreferrer" class="btn secondary nea-official-link">FMCSA safety audit guidance ↗</a></div>'+
 '<p class="nea-note">Use NEWS only when FMCSA has selected the carrier for an offsite audit. Opening the link does not submit records. Once FMCSA confirms receipt, record the official reference above, save, and select “Record FMCSA Submission.”</p></section>';
}
function dashboard(d){
 const req=d.readiness||{},miss=[...(req.missing_profile||[]),...(req.missing_required||[]).map(x=>'Upload required: '+x)];
 const ready=req.ready===true;
 return '<section class="section panel nea-workflow-card" id="nea-readiness"><div class="panel-head"><div><span class="nea-eyebrow">AUDIT PREPARATION READINESS</span><h2>Required steps & documents</h2><p>Mandatory items must be completed; records marked “If Applicable” are optional when genuinely not relevant to the carrier.</p></div><span class="badge '+(ready?'good':'warn')+'">'+(ready?'Required steps complete':miss.length+' steps remaining')+'</span></div>'+
 '<div class="nea-check-stats"><div><strong>'+E(req.required_complete||0)+' / '+E(req.required_total||0)+'</strong><span>Required documents received</span></div><div><strong>'+E((req.missing_profile||[]).length)+'</strong><span>Carrier details missing</span></div><div><strong>'+E((d.documents||[]).length)+'</strong><span>Documents uploaded</span></div></div>'+
 '<div class="nea-required-list">'+(miss.length?miss.map(x=>'<span class="nea-required-missing">○ '+E(x)+'</span>').join(''):'<span class="nea-required-success">✓ All required information and supporting records are present.</span>')+'</div>'+
 '<div class="nea-actions-row"><a href="#nea-carrier" class="btn secondary">Carrier details</a><a href="#nea-checklist" class="btn secondary">Required documents</a><a href="#nea-submission" class="btn secondary">FMCSA submission</a></div></section>';
}
function docsPanel(d){
 const docs=d.documents||[];
 return '<section class="section panel nea-workflow-card" id="nea-documents"><div class="panel-head"><div><span class="nea-eyebrow">SECURE DOCUMENT LIBRARY</span><h2>Attached supporting records</h2><p>Every uploaded file is retained with its checklist item. You can attach several files to one item without replacing prior uploads.</p></div><button type="button" class="btn secondary" id="neaRefreshDocs">Refresh documents</button></div>'+
 '<div class="nea-doc-list">'+(docs.length?docs.map(x=>'<div class="nea-doc-row"><div><strong>'+E(x.file_name)+'</strong><small>Uploaded '+E(x.uploaded_at?new Date(x.uploaded_at).toLocaleDateString():'')+' · '+E(x.metadata?.item_code||'Audit record')+'</small></div><button class="btn secondary btn-sm" data-nea-doc="'+E(x.id)+'" type="button">View document</button></div>').join(''):'<p class="nea-note">No documents have been uploaded. Use the Upload Documents buttons below.</p>')+'</div></section>';
}
function enhance(html,d){
 if(!d?.audit)return html;
 const root=document.createElement('div');root.innerHTML=html;
 const panel=root.querySelector('.audit-summary-progress')?.closest('.section.panel');
 const quick=document.createElement('nav');quick.className='nea-quicknav';quick.setAttribute('aria-label','Audit workflow sections');quick.innerHTML='<a class="btn secondary" href="#nea-carrier">1. Carrier</a><a class="btn secondary" href="#nea-resources">2. Templates</a><a class="btn secondary" href="#nea-checklist">3. Checklist</a><a class="btn secondary" href="#nea-submission">4. FMCSA</a><a class="btn secondary" href="#nea-documents">Documents</a>';
 if(panel)panel.before(quick);
 const holder=document.createElement('div');holder.innerHTML=profilePanel(d)+dashboard(d)+templatesPanel();
 if(panel)panel.after(...[...holder.children]);
 const check=root.querySelector('.audit-checklist');
 if(check){check.id='nea-checklist';const after=document.createElement('div');after.innerHTML=docsPanel(d)+authPanel(d);check.after(...[...after.children]);}
 const required=new Set((d.items||[]).filter(x=>x.requirement_level==='required').map(x=>x.id));
 for(const card of root.querySelectorAll('.audit-item')){
   const item=(d.items||[]).find(x=>x.id===card.dataset.itemId);
   if(!item)continue;
   const area=card.querySelector('.audit-item-controls');
   const hint=document.createElement('p');hint.className='nea-audit-hint';hint.textContent=item.requirement_level==='required'?'Required: upload supporting documentation. Optional records cannot replace this requirement.':'If this record does not apply, select Not Applicable. Add a note explaining why.';
   area?.prepend(hint);
   const input=card.querySelector('[data-file]');if(input){input.multiple=true;input.setAttribute('aria-label','Upload multiple documents for '+item.item_name)}
   const label=card.querySelector('.audit-upload');if(label)label.firstChild.textContent='Upload Documents';
   for(const a of card.querySelectorAll('a.btn.link')){a.classList.remove('link');a.classList.add('secondary')}
   if(required.has(item.id)){const op=card.querySelector('[data-status] option[value="not_applicable"]');if(op)op.remove()}
   const explain=document.createElement('span');explain.className='nea-tooltip';explain.textContent='?';explain.title=item.description+' | '+(item.citation||'FMCSA safety audit records');explain.setAttribute('aria-label','Help for '+item.item_name);card.querySelector('.audit-item-title')?.append(explain);
   const docs=(d.documents||[]).filter(x=>x.metadata?.audit_item_id===item.id);
   if(docs.length){const list=document.createElement('div');list.className='nea-item-docs';list.innerHTML='<small>'+docs.length+' file(s) attached</small>'+docs.map(x=>'<button type="button" class="btn secondary btn-sm" data-nea-doc="'+E(x.id)+'">'+E(x.file_name)+'</button>').join('');area?.append(list)}
 }
 // No automatic FMCSA submission. These actions only record what the carrier reports.
 const submitted=root.querySelector('#markSubmitted');if(submitted){submitted.textContent='Record FMCSA Submission';submitted.disabled=d.readiness?.ready!==true;submitted.title=submitted.disabled?'Complete required steps before recording an official submission.':'Record a submission already completed through FMCSA NEWS.';}
 const completed=root.querySelector('#markCompleted');if(completed){completed.textContent='Mark Preparation Complete';completed.disabled=d.readiness?.ready!==true;completed.title='Confirms preparation within Workforce; does not certify passing the FMCSA audit.';}
 const pay=root.querySelector('#neaStaffRequest');if(pay){pay.disabled=d.readiness?.ready!==true;pay.title=pay.disabled?'Complete required carrier details and upload required records before payment.':''}
 const status=root.querySelector('.audit-staff-intake');if(pay&&status&&!d.readiness?.ready){const help=document.createElement('p');help.className='nea-gate-help';help.textContent='Payment unlocks after the required carrier details and supporting records are completed. Optional records stay optional.';status.append(help)}
 for(const section of root.querySelectorAll('.audit-section')){section.classList.add('nea-checklist-section');}
 const top=document.createElement('button');top.className='nea-back-top';top.type='button';top.id='neaBackTop';top.setAttribute('aria-label','Scroll to top');top.textContent='↑';
 root.append(top);
 return root.innerHTML;
}
async function saveProfile(){const fields={};for(const el of $$('[data-nea-profile]'))fields[el.dataset.neaProfile]=el.value.trim();const output=$('#neaProfileMsg');if(output)output.textContent='Saving…';try{await api({action:'update_audit',audit_id:aid(),profile:fields});if(output)output.textContent='Saved securely';await window.Portal.refresh()}catch(e){if(output)output.textContent=e.message||'Unable to save'}}
const authEndpoint="https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/ctpa-new-entrant-authorization";
async function authRequest(action,extra={}){
 const session=(await window.Portal.sb.auth.getSession()).data?.session;
 if(!session?.access_token)throw Error("Your session expired. Sign in again to continue.");
 const r=await fetch(authEndpoint,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+session.access_token},body:JSON.stringify({action,audit_id:aid(),...extra}),cache:"no-store"});
 const d=await r.json().catch(()=>({}));if(!r.ok||d.error)throw Error(d.error||"Unable to process authorization");return d;
}
function renderAuthHistory(list){
 const root=$("#neaAuthHistory");if(!root)return;
 root.innerHTML=list.length?'<h4>Authorization requests</h4>'+list.map(x=>'<div class="nea-auth-record"><div><strong>'+E(x.recipient_name||x.recipient_email)+'</strong><small>'+E(x.recipient_email)+' · '+E(x.status)+' · '+E(x.signed_at?new Date(x.signed_at).toLocaleString():'Expires '+new Date(x.expires_at).toLocaleDateString())+'</small></div><div class="nea-auth-record-actions">'+(x.status==='signed'?'<button type="button" class="btn secondary btn-sm" data-nea-auth-pdf="'+E(x.id)+'">Download</button>':'')+(x.status==='pending'?'<button type="button" class="btn secondary btn-sm" data-nea-auth-revoke="'+E(x.id)+'">Revoke link</button>':'')+'</div></div>').join(''):'<p class="nea-note">No authorization requests yet.</p>';
 root.querySelectorAll('[data-nea-auth-pdf]').forEach(b=>b.addEventListener('click',()=>printAuth(list.find(x=>x.id===b.dataset.neaAuthPdf))));
 root.querySelectorAll('[data-nea-auth-revoke]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await authRequest('revoke',{authorization_id:b.dataset.neaAuthRevoke});await loadAuthHistory()}catch(e){$("#neaAuthMessage").textContent=e.message||"Unable to revoke request"}finally{b.disabled=false}}));
}
async function loadAuthHistory(){
 try{const r=await authRequest("status");renderAuthHistory(r.authorizations||[])}catch(e){const msg=$("#neaAuthMessage");if(msg)msg.textContent=e.message||"Unable to load signing requests"}
}
async function printAuth(x){
 if(!x||x.status!=="signed")return;
 try{await window.CtpaAuthorizationPDF.download(x)}catch(e){const msg=$("#neaAuthMessage");if(msg)msg.textContent=e.message||"Unable to download the signed PDF"}
}

async function setupAuth(d){
 const email=$("#neaAuthEmail");if(!email)return;
 email.value=d.audit?.metadata?.profile?.contact_email||"";
 $("#neaAuthCreate")?.addEventListener("click",async()=>{
  const b=$("#neaAuthCreate"),msg=$("#neaAuthMessage");b.disabled=true;msg.textContent="Generating secure signing link…";
  try{
   const recipient_email=email.value.trim(),recipient_name=$("#neaAuthName").value.trim();
   if(!recipient_email)throw Error("Enter the carrier's signing email.");
   const r=await authRequest("create",{recipient_email,recipient_name});
   $("#neaAuthLink").value=r.signing_url;
   $("#neaAuthShare").hidden=false;
   $("#neaAuthEmailLink").href="mailto:"+encodeURIComponent(recipient_email)+"?subject="+encodeURIComponent("Carrier authorization for FMCSA New Entrant Safety Audit")+"&body="+encodeURIComponent("Please review and electronically sign or decline the limited authorization for "+r.authorization.carrier_legal_name+":\n\n"+r.signing_url+"\n\nThis secure signing link expires in 14 days. Do not share your government login credentials.");
   msg.textContent="Signing link created. Copy it or share it by email. No email has been sent automatically.";
   await loadAuthHistory();
  }catch(e){msg.textContent=e.message||"Unable to generate signing link"}finally{b.disabled=false}
 });
 $("#neaAuthCopy")?.addEventListener("click",async()=>{
  const value=$("#neaAuthLink").value;try{await navigator.clipboard.writeText(value);$("#neaAuthMessage").textContent="Signing link copied."}catch(e){$("#neaAuthLink").select();$("#neaAuthMessage").textContent="Copy the selected signing link manually."}
 });
 await loadAuthHistory();
}
async function showDoc(id){try{const response=await api({action:'document_url_by_id',audit_id:aid(),document_id:id});window.open(response.url,'_blank','noopener')}catch(e){await window.S4UDialog?.alert(e.message||'Unable to open document')}}
function bind(d){
 base.bind(d);if(!d?.audit)return;
 $('#neaSaveProfile')?.addEventListener('click',saveProfile);$('#neaSaveSubmission')?.addEventListener('click',saveProfile);
 $('#neaRefreshDocs')?.addEventListener('click',()=>window.Portal.refresh());
 setupAuth(d);
 $$('[data-nea-doc]').forEach(btn=>btn.addEventListener('click',()=>showDoc(btn.dataset.neaDoc)));
 $$('[data-nea-template]').forEach(btn=>btn.addEventListener('click',()=>{
  const kind=btn.dataset.neaTemplate;
  const t=templates[kind];if(t)dl('workforce-'+kind+'-template.csv',[t.head,t.row].map(csvLine).join('\r\n'));
 }));
 $('[data-nea-export]')?.addEventListener('click',()=>exportItems(d));
 // Existing listener handles the first file only; intercept to upload every selected file securely.
 $$('[data-file]').forEach(input=>input.addEventListener('change',async e=>{
  if(e.target.files?.length<2)return;
  e.stopImmediatePropagation();
  const files=[...e.target.files],card=e.target.closest('.audit-item'),msg=$('.audit-item-msg',card);
  for(let i=0;i<files.length;i++){const file=files[i];if(file.size>15*1024*1024){msg.textContent='File '+file.name+' exceeds 15 MB';continue}
   msg.textContent='Uploading '+(i+1)+' of '+files.length+'…';
   try{const prep=await api({action:'create_upload',audit_id:aid(),item_id:card.dataset.itemId,file_name:file.name});
    const out=await window.Portal.sb.storage.from(prep.bucket).uploadToSignedUrl(prep.path,prep.token,file,{contentType:file.type||'application/octet-stream'});if(out.error)throw out.error;
    await api({action:'attach_document',audit_id:aid(),item_id:card.dataset.itemId,storage_path:prep.path,file_name:file.name,mime_type:file.type||'application/octet-stream',size_bytes:file.size});
   }catch(err){msg.textContent=err.message||'Upload failed';return}
  }
  msg.textContent='Documents uploaded';await window.Portal.refresh();
 },true));
 $('#neaBackTop')?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
 const submit=$('#markSubmitted');if(submit){submit.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();const p=Object.fromEntries($$('[data-nea-profile]').map(x=>[x.dataset.neaProfile,x.value.trim()]));if(!p.submission_reference){await window.S4UDialog?.alert('Complete the official FMCSA NEWS submission and enter its confirmation/reference number before recording it in Workforce.');$('#nea-submission')?.scrollIntoView({behavior:'smooth'});return;}if(p.authorization_method==='pending'||!p.authorization_method){await window.S4UDialog?.alert('Record whether the carrier submitted directly or the C/TPA had authorized access first.');return}try{await api({action:'update_audit',audit_id:aid(),profile:p});await api({action:'update_audit',audit_id:aid(),status:'submitted'});await window.Portal.refresh()}catch(err){await window.S4UDialog?.alert(err.message||'Unable to record submission')}},true)}
}
window.CtpaNewEntrantAudits={render:d=>enhance(base.render(d),d),bind};
})();
