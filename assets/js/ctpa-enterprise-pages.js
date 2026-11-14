/* Workforce C/TPA Enterprise pages: Branding, Collection Sites, Employer CSV Review. */
(()=>{"use strict";
const API="https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-ctpa-business-management";
const KEY="sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC";
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pages={branding:{title:"C/TPA Branding",feature:"branding_suite",sub:"Customize your branded client portal experience."},collection_sites:{title:"Collection Sites",feature:"collection_sites",sub:"Maintain your C/TPA-owned collection addresses and operational contacts. These are not Workforce testing-order locations."}};
let ctx=null,serial=0,sites=[],brand=null,rows=[],fileName="",canEdit=false,screen="branding";
const active=()=>ctx?.active?.()===true;
async function api(action,feature,more={}){
 const {data:{session}}=await ctx.supabase.auth.getSession();if(!session?.access_token)throw Error("Please sign in again.");
 const response=await fetch(API,{method:"POST",cache:"no-store",headers:{"apikey":KEY,"Authorization":"Bearer "+session.access_token,"Content-Type":"application/json"},body:JSON.stringify({action,feature,tenant_id:ctx.tenantId,operating_context:ctx.context,...more})});
 const body=await response.json().catch(()=>({}));if(!response.ok||body.error)throw Error(body.error||"Unable to complete request");return body;
}
function warn(msg){const el=$("entNotice");if(el)el.textContent=msg}
function begin(title,subtitle){$("pageContent").innerHTML='<div class="ent-layout"><div class="ent-hero"><div><small>WORKFORCE C/TPA · ENTERPRISE</small><h2>'+esc(title)+'</h2><p>'+esc(subtitle)+'</p></div></div><p class="ent-notice" id="entNotice" role="status"></p><section class="ent-body" id="entBody"><p>Loading authorized account information…</p></section></div>'}
function err(e){$("entBody").innerHTML='<div class="ent-card"><h3>Unable to load this page</h3><p>'+esc(e.message)+'</p><button class="btn secondary" id="entRetry">Try again</button></div>';$("entRetry").onclick=()=>void open(ctx,screen)}
async function open(options,page){ctx=options;screen=page;const run=++serial;const p=pages[page];begin(p.title,p.sub);
 try{if(page==="branding"){const d=await api("branding_get",p.feature);if(run!==serial||!active())return;brand=d.branding||{};canEdit=!!d.can_edit;drawBrand()}
 else{const d=await api("sites_list",p.feature);if(run!==serial||!active())return;sites=d.sites||[];canEdit=!!d.can_edit;drawSites()}}
 catch(e){if(run===serial&&active())err(e)}
}
function drawBrand(){
 const d=brand||{};$("entBody").innerHTML='<div class="ent-columns"><form class="ent-card ent-form" id="entBrandForm"><h3>Brand identity</h3><p>Your branding will be published to linked client portals once their brand handoff is configured.</p>'+
 '<label>Company or portal display name<input name="portal_name" maxlength="90" required value="'+esc(d.portal_name||"")+'"></label>'+
 '<div class="ent-two"><label>Primary color<input name="primary_color" type="color" value="'+esc(/^#[0-9a-f]{6}$/i.test(d.primary_color||"")?d.primary_color:"#01122f")+'"></label><label>Accent color<input name="accent_color" type="color" value="'+esc(/^#[0-9a-f]{6}$/i.test(d.accent_color||"")?d.accent_color:"#fdc102")+'"></label></div>'+
 '<label>Company logo (PNG only)<input id="entLogoFile" type="file" accept=".png,image/png" '+(canEdit?"":"disabled")+'><small>PNG only. No fixed page-level size limit; your Supabase storage plan limit applies.</small></label>'+
 '<p id="entLogoStatus" class="ent-muted">'+(d.logo_path?"An existing logo is saved.":"No custom logo has been uploaded.")+'</p>'+
 '<h3>Client portal branding preferences</h3><p>Save which future customer portals should use your brand when those portals are connected.</p>'+
 '<div class="ent-brand-checks">'+
 '<label><input type="checkbox" name="show_on_employer_portal" '+(d.show_on_employer_portal!==false?"checked":"")+'>Employer portals</label>'+
 '<label><input type="checkbox" name="show_on_employee_portal" '+(d.show_on_employee_portal!==false?"checked":"")+'>Employer employee portals</label>'+
 '<label><input type="checkbox" name="show_on_owner_operator_portal" '+(d.show_on_owner_operator_portal!==false?"checked":"")+'>Owner-operator portals</label></div>'+
 '<h3>Branded email presentation</h3><p>These settings are saved for future email templates. They do not change the verified sender domain.</p>'+
 '<label><input type="checkbox" name="branded_email_enabled" '+(d.branded_email_enabled?"checked":"")+'>Use my branding in supported customer emails</label>'+
 '<label>Sender display name<input name="email_display_name" maxlength="90" value="'+esc(d.email_display_name||"")+'" placeholder="Your C/TPA company"></label>'+
 '<button class="btn primary" type="submit" '+(canEdit?"":"disabled")+'>Save branding</button></form>'+
 '<div class="ent-card ent-brand-preview-card"><h3>Live portal preview</h3><p>See how your colors and logo will look inside the C/TPA portal.</p>'+
 '<div class="ent-preview ent-portal-preview" id="entPreview"><aside class="ent-mini-sidebar">'+
 '<div class="ent-mini-logo-box" id="entMiniLogoBox"><strong id="entMiniLogoText">C/TPA</strong></div>'+
 '<div class="ent-mini-menu"><small>WORKSPACE</small><span>▦ &nbsp; Dashboard</span><span>♧ &nbsp; Employers</span><span>♙ &nbsp; Employees</span><span>▣ &nbsp; Testing Orders</span><span>▤ &nbsp; Results</span><small>ACCOUNT &amp; SUPPORT</small><span class="ent-mini-active">◈ &nbsp; Branding</span><span>⚙ &nbsp; Settings</span></div>'+
 '<div class="ent-mini-foot">● &nbsp; C/TPA Portal</div></aside>'+
 '<div class="ent-mini-main"><header class="ent-mini-header"><div><small>WORKFORCE C/TPA</small><strong id="entPreviewName">'+esc(d.portal_name||"Your C/TPA company")+'</strong></div><div class="ent-mini-header-actions"><span>'+esc(ctx?.context==="nondot"?"NON-DOT":"DOT")+'</span><span>Account ▾</span></div></header>'+
 '<div class="ent-mini-content"><div class="ent-mini-title"><strong>Dashboard</strong><small>Company activity overview</small></div><div class="ent-mini-kpis"><div><small>Employers</small><strong>24</strong></div><div><small>Employees</small><strong>189</strong></div><div><small>Orders</small><strong>42</strong></div></div>'+
 '<div class="ent-mini-panel"><strong>Recent activity</strong><p>Company records, orders, and updates</p><div class="ent-mini-rule"></div><div class="ent-mini-rule short"></div><span class="ent-mini-cta">View details</span></div></div></div></div>'+
 '<p class="ent-muted">This preview mirrors the unified portal layout. Employer, employee, and owner-operator portals will be connected when their new builds are ready.</p></div></div>';
 const f=$("entBrandForm");function preview(){const n=f.elements.portal_name.value,pc=f.elements.primary_color.value,ac=f.elements.accent_color.value;$("entPreviewName").textContent=n||"Your C/TPA company";$("entPreview").style.setProperty("--brand-primary",pc);$("entPreview").style.setProperty("--brand-accent",ac)};f.addEventListener("input",preview);preview();
 $("entLogoFile").addEventListener("change",e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(!/\.png$/i.test(file.name)||(file.type&&file.type!=="image/png")){warn("Please choose a PNG file.");e.target.value="";return}
  const temp=URL.createObjectURL(file),box=$("entMiniLogoBox");
  box.querySelector("img")?.remove();
  const image=document.createElement("img");image.className="ent-mini-logo";image.alt="Logo preview";image.src=temp;image.onload=()=>URL.revokeObjectURL(temp);
  $("entMiniLogoText").hidden=true;box.prepend(image);
  $("entLogoStatus").textContent=file.name+" · "+(file.size/1048576).toFixed(1)+" MB · ready to upload";
 });
 if(d.logo_path&&/^ctpa-branding\/[0-9a-f-]{36}\/[a-zA-Z0-9_.-]+$/.test(d.logo_path)){
  const image=document.createElement("img");image.className="ent-logo-preview";image.alt="C/TPA brand logo";
  image.src="https://elpbnytpciqnbexiaebp.supabase.co/storage/v1/object/public/workforce-branding/"+encodeURI(d.logo_path);
  $("entMiniLogoText").hidden=true;$("entMiniLogoBox").prepend(image);
 }
 f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('button[type="submit"]');b.disabled=true;warn("Saving branding…");try{const file=$("entLogoFile").files?.[0];let logo_path=d.logo_path||"";if(file){
  if(!/\.png$/i.test(file.name)||(file.type&&file.type!=="image/png"))throw Error("Please choose a PNG logo.");
  const signature=[137,80,78,71,13,10,26,10],header=new Uint8Array(await file.slice(0,8).arrayBuffer());
  if(signature.some((value,index)=>header[index]!==value))throw Error("The selected file is not a valid PNG.");
  warn("Uploading PNG logo to Supabase Storage…");
  const signed=await api("branding_upload","branding_suite",{file_name:file.name});
  if(file.size>6*1024*1024){
    if(!window.tus?.Upload)throw Error("The resumable upload component is unavailable. Please reload the page.");
    await new Promise((resolve,reject)=>{
      const upload=new window.tus.Upload(file,{
        endpoint:"https://elpbnytpciqnbexiaebp.storage.supabase.co/storage/v1/upload/resumable",
        headers:{"x-signature":signed.token,"apikey":"sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC"},
        retryDelays:[0,3000,5000,10000,20000],
        uploadDataDuringCreation:true,
        removeFingerprintOnSuccess:true,
        chunkSize:6*1024*1024,
        metadata:{bucketName:"workforce-branding",objectName:signed.path,contentType:"image/png",cacheControl:"3600"},
        onProgress:(bytes,total)=>warn("Uploading PNG logo: "+Math.round(bytes/total*100)+"%"),
        onError:reject,onSuccess:resolve
      });
      upload.start();
    });
  }else{
    const uploaded=await ctx.supabase.storage.from("workforce-branding").uploadToSignedUrl(signed.path,signed.token,file,{contentType:"image/png",cacheControl:"3600"});
    if(uploaded.error)throw uploaded.error;
  }
  logo_path=signed.path;
}
 const settings={portal_name:f.elements.portal_name.value,primary_color:f.elements.primary_color.value,accent_color:f.elements.accent_color.value,logo_path,
  show_on_employer_portal:f.elements.show_on_employer_portal.checked,
  show_on_employee_portal:f.elements.show_on_employee_portal.checked,
  show_on_owner_operator_portal:f.elements.show_on_owner_operator_portal.checked,
  branded_email_enabled:f.elements.branded_email_enabled.checked,
  email_display_name:f.elements.email_display_name.value};
 await api("branding_save","branding_suite",settings);brand=settings;warn("Brand settings saved.");drawBrand()}catch(ex){warn(ex.message)}finally{b.disabled=false}};
}
function drawSites(){
 $("entBody").innerHTML='<div class="ent-card"><div class="ent-card-header"><div><h3>C/TPA collection address directory</h3><p>'+sites.length+' site'+(sites.length===1?"":"s")+' in this C/TPA account</p></div><button class="btn primary" id="entSiteAdd" '+(canEdit?"":"disabled")+'>Add collection site</button></div>'+
 (sites.length?'<div class="ent-table-wrap"><table class="ent-table"><thead><tr><th>Collection site</th><th>Address</th><th>Coverage</th><th>Services</th><th>Status</th><th></th></tr></thead><tbody>'+sites.map(s=>'<tr><td><strong>'+esc(s.name)+'</strong><small>'+esc(s.contact_name||"")+'</small></td><td>'+esc([s.address_line1,s.city,s.state,s.postal_code].filter(Boolean).join(", "))+'</td><td>'+[s.dot_capable?"DOT":"",s.non_dot_capable?"NON-DOT":""].filter(Boolean).join(" / ")+'</td><td>'+[s.drug_testing?"Drug":"",s.alcohol_testing?"Alcohol":""].filter(Boolean).join(", ")+'</td><td>'+esc(s.status)+'</td><td><button class="btn secondary" data-site="'+esc(s.id)+'" '+(canEdit?"":"disabled")+'>Edit</button></td></tr>').join("")+'</tbody></table></div>':'<div class="ent-empty"><strong>No C/TPA collection addresses added yet</strong><p>Save a collection address for your C/TPA business. These addresses do not enter Workforce testing orders.</p></div>')+'</div>';
 $("entSiteAdd").onclick=()=>editSite(null);$("entBody").querySelectorAll("[data-site]").forEach(b=>b.onclick=()=>editSite(sites.find(s=>s.id===b.dataset.site)));
}
function editSite(site){
 const s=site||{};const fields=[["name","Site name",true],["address_line1","Street address",true],["address_line2","Suite / unit",false],["city","City",true],["state","State",true],["postal_code","ZIP code",true],["phone","Phone",false],["contact_name","Contact person",false],["contact_email","Contact email",false]];
 $("entBody").innerHTML='<form class="ent-card ent-form" id="entSiteForm"><div class="ent-card-header"><h3>'+(s.id?"Edit":"Add")+' collection site</h3><button type="button" class="btn secondary" id="entCancelSite">Back to sites</button></div><div class="ent-two">'+fields.map(([key,label,required])=>'<label>'+label+'<input name="'+key+'" '+(required?"required":"")+' maxlength="200" value="'+esc(s[key]||"")+'"></label>').join("")+'</div><div class="ent-checks">'+[["dot_capable","DOT"],["non_dot_capable","NON-DOT"],["drug_testing","Drug testing"],["alcohol_testing","Alcohol testing"],["urine","Urine collection"],["oral_fluid","Oral fluid collection"]].map(([key,label])=>'<label><input type="checkbox" name="'+key+'" '+(s[key]?"checked":"")+'>'+label+'</label>').join("")+'</div><label>Status<select name="status"><option value="active" '+(s.status!=="inactive"?"selected":"")+'>Active</option><option value="inactive" '+(s.status==="inactive"?"selected":"")+'>Inactive</option></select></label><button type="submit" class="btn primary">Save collection site</button></form>';
 $("entCancelSite").onclick=()=>drawSites();$("entSiteForm").onsubmit=async e=>{e.preventDefault();const form=e.currentTarget;const site={id:s.id||undefined};for(const [key] of fields)site[key]=form.elements[key].value.trim();for(const key of ["dot_capable","non_dot_capable","drug_testing","alcohol_testing","urine","oral_fluid"])site[key]=form.elements[key].checked;site.status=form.elements.status.value;const btn=form.querySelector('button[type="submit"]');btn.disabled=true;try{await api("sites_save","collection_sites",{site});warn("Collection site saved.");const d=await api("sites_list","collection_sites");sites=d.sites||[];drawSites()}catch(ex){warn(ex.message);btn.disabled=false}};
}
function parseCsv(text){
 const result=[];let row=[],value="",quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){value+='"';i++}else if(c==='"')quoted=false;else value+=c}else if(c==='"')quoted=true;else if(c===","){row.push(value);value=""}else if(c==="\n"){row.push(value.replace(/\r$/,""));result.push(row);row=[];value=""}else value+=c}
 if(quoted)throw Error("CSV contains an unfinished quoted cell.");if(row.length||value){row.push(value);result.push(row)}
 return result.filter(r=>r.some(c=>String(c).trim()));
}
const columns=[["legal_name","Legal name"],["dba_name","DBA"],["dot_number","USDOT"],["contact_name","Contact"],["contact_email","Email"],["phone","Phone"],["city","City"],["state","State"],["zip","ZIP"],["account_type","Account type"]];
const aliases={legal_name:["legal name","employer name","company","company name","name"],dba_name:["dba","dba name"],dot_number:["dot","usdot","usdot number","dot number"],contact_name:["contact","contact name","primary contact"],contact_email:["email","contact email","primary contact email"],phone:["phone","phone number"],city:["city"],state:["state"],zip:["zip","zip code","postal code"],account_type:["account type","type"]};
function drawImport(){
 begin("Import Employers","Upload a CSV, correct every row, then confirm which employers to create.");
 $("entBody").innerHTML='<div class="ent-card"><h3>1. Upload CSV</h3><p>Select an employer export with column headers. Existing employers will not be overwritten.</p><input id="entCsvFile" type="file" accept=".csv,text/csv"><p class="ent-muted">Up to 100 employers per import. A preview will appear before records are saved.</p><button class="btn secondary" id="entTemplate">Download CSV template</button></div><div id="entImportPreview"></div>';
 $("entCsvFile").onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>300000)throw Error("CSV must be under 300 KB.");const parsed=parseCsv(await file.text());if(parsed.length<2)throw Error("Include a header row and at least one employer.");if(parsed.length>101)throw Error("Maximum 100 employers per import.");const headers=parsed.shift().map(x=>x.trim().toLowerCase().replace(/[ _-]+/g," "));rows=parsed.map(values=>Object.fromEntries(columns.map(([key])=>{const col=headers.findIndex(h=>(aliases[key]||[]).includes(h));return [key,col>=0?String(values[col]||"").trim():""]})));for(const row of rows)if(!["dot_employer","nondot_employer"].includes(row.account_type))row.account_type=ctx.context==="nondot"?"nondot_employer":"dot_employer";fileName=file.name;showPreview()}catch(ex){warn(ex.message)}};
 $("entTemplate").onclick=()=>{const csv=columns.map(c=>c[0]).join(",")+"\r\n";download(csv,"employer-import-template.csv")};
}
function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function showPreview(){
 const dest=$("entImportPreview");if(!dest)return;
 dest.innerHTML='<section class="ent-card"><div class="ent-card-header"><div><h3>2. Review and correct employer records</h3><p>'+esc(fileName)+' · '+rows.length+' rows. Make changes before importing.</p></div><button class="btn primary" id="entCommit">Confirm and import '+rows.length+' employers</button></div><div class="ent-table-wrap"><table class="ent-table ent-edit-table"><thead><tr><th>Row</th>'+columns.map(x=>'<th>'+esc(x[1])+'</th>').join("")+'<th></th></tr></thead><tbody>'+rows.map((r,i)=>'<tr><td>'+(i+1)+'</td>'+columns.map(([key])=>'<td>'+(key==="account_type"?'<select data-row="'+i+'" data-col="'+key+'"><option value="dot_employer" '+(r[key]==="dot_employer"?"selected":"")+'>DOT Employer</option><option value="nondot_employer" '+(r[key]==="nondot_employer"?"selected":"")+'>NON-DOT Employer</option></select>':'<input data-row="'+i+'" data-col="'+key+'" maxlength="160" value="'+esc(r[key]||"")+'">')+'</td>').join("")+'<td><button type="button" class="btn secondary" data-remove="'+i+'">Remove</button></td></tr>').join("")+'</tbody></table></div><p class="ent-muted">Duplicate employer records are rejected; no partial import will be performed if validation fails.</p></section>';
 dest.querySelectorAll("[data-row]").forEach(el=>el.oninput=()=>{rows[Number(el.dataset.row)][el.dataset.col]=el.value});
 dest.querySelectorAll("[data-remove]").forEach(el=>el.onclick=()=>{rows.splice(Number(el.dataset.remove),1);showPreview()});
 $("entCommit").onclick=async()=>{const btn=$("entCommit");btn.disabled=true;warn("Validating and importing approved employers…");try{const d=await api("employer_import_commit","employer_import",{rows,file_name:fileName});warn(d.created+" employers created. Open Employers to view them.");rows=[];dest.innerHTML='<div class="ent-card"><h3>Import complete</h3><p>'+esc(d.created)+' employers were added to your C/TPA portal.</p><button class="btn secondary" id="entImportAgain">Upload another CSV</button></div>';$("entImportAgain").onclick=drawImport}catch(ex){warn(ex.message);btn.disabled=false}};
}
async function mountEmployerControls(options){
 const holder=document.getElementById("employerFeatureControls");if(!holder)return;
 const active=()=>options.active?.()===true&&holder.isConnected;
 const fields=[["client_portal","Client portal access"],["testing_order_requests","Employer test order requests"],["results_visibility","Results visibility"],["document_access","Documents"],["billing_visibility","Billing information"],["email_notifications","Email notifications"]];
 holder.innerHTML='<h2>Employer Portal Feature Controls</h2><p class="ent-muted">Configure what this employer may use in its future portal. These settings do not grant access until the new employer portal enforces them.</p><p role="status">Loading employer settings…</p>';
 ctx=options;
 try{
  const response=await api("employer_settings_list","employer_settings",{employer_id:options.employerId});
  if(!active())return;
  const values=Object.fromEntries((response.settings||[]).map(x=>[x.setting_key,x.enabled===true]));
  holder.innerHTML='<h2>Employer Portal Feature Controls</h2><p class="ent-muted">These options are saved for this employer only. Customer portals must enforce them during the new portal build.</p>'+
   '<form id="entEmployerSettingsForm"><div class="ent-employer-feature-grid">'+fields.map(([key,name])=>'<label><input type="checkbox" name="'+key+'" '+(values[key]?"checked":"")+' '+(response.can_edit?"":"disabled")+'>'+esc(name)+'</label>').join("")+'</div>'+
   '<button class="btn primary" type="submit" '+(response.can_edit?"":"disabled")+'>Save employer feature controls</button><p class="ent-muted" id="entEmployerSettingsMessage" role="status"></p></form>';
  holder.querySelector("form").onsubmit=async e=>{
   e.preventDefault();
   const form=e.currentTarget,button=form.querySelector('button[type="submit"]'),message=holder.querySelector("#entEmployerSettingsMessage");
   button.disabled=true;message.textContent="Saving employer configuration…";
   const settings=Object.fromEntries(fields.map(([key])=>[key,form.elements[key].checked]));
   try{await api("employer_settings_save","employer_settings",{employer_id:options.employerId,settings});if(active())message.textContent="Employer feature controls saved."}
   catch(error){if(active())message.textContent=error.message}
   finally{if(active())button.disabled=!response.can_edit}
  };
 }catch(error){if(active())holder.innerHTML='<h2>Employer Portal Feature Controls</h2><p class="ent-muted">'+esc(error.message)+'</p>'}
}
window.WorkforceEnterprisePages=Object.freeze({open,openImport:(options)=>{ctx=options;screen="employer_import";++serial;drawImport()},mountEmployerControls});
})();