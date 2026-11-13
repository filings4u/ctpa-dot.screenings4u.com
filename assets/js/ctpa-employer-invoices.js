(()=>{"use strict";
const $=id=>document.getElementById(id),esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;',"'" :"&#39;"}[c])),money=x=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(x)||0);
let ctx,records=[],people=[],logo=null,canWrite=false,mode="list",lines=[],query="",filter="all",serial=0,detailId=null;
const today=()=>new Date().toISOString().slice(0,10);
const plus30=()=>{const x=new Date();x.setDate(x.getDate()+30);return x.toISOString().slice(0,10)};
async function call(action,payload={}){
 const token=(await ctx.supabase.auth.getSession()).data?.session?.access_token;if(!token)throw Error("Sign in required");
 const r=await fetch("https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-ctpa-employer-invoicing",{method:"POST",cache:"no-store",headers:{"Authorization":"Bearer "+token,"apikey":"sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC","Content-Type":"application/json"},body:JSON.stringify({action,tenant_id:ctx.tenantId,operating_context:ctx.context,...payload})});
 const d=await r.json().catch(()=>({}));if(!r.ok||d.error)throw Error(d.error||"Employer Billing failed");return d;
}
function shell(content){$("pageContent").innerHTML='<div class="eb-root"><section class="eb-header"><div><small>WORKFORCE C/TPA / CLIENT INVOICING</small><h2>Employer Billing</h2><p>Issue your own invoices to associated employers and owner-operators, with itemized charges, discounts, taxes, and your company logo.</p></div><span>'+esc(ctx.context==="dot"?"DOT":"NON-DOT")+'</span></section>'+content+'</div>'}
function list(){
 mode="list";let found=records.filter(r=>(filter==="all"||r.status===filter)&&[r.invoice_number,r.recipient_name,r.recipient_email].join(" ").toLowerCase().includes(query.toLowerCase()));
 let stats=[["Invoices",records.length],["Draft",records.filter(r=>r.status==="draft").length],["Sent",records.filter(r=>r.status==="sent").length],["Sent invoice value",money(records.filter(r=>r.status==="sent").reduce((s,r)=>s+Number(r.total),0))]];
 shell('<div class="eb-stats">'+stats.map(x=>'<article><small>'+esc(x[0])+'</small><strong>'+esc(x[1])+'</strong></article>').join("")+'</div><section class="eb-panel"><div class="eb-toolbar"><input id="ebSearch" type="search" placeholder="Search invoice or employer" value="'+esc(query)+'"><select id="ebFilter"><option value="all">All statuses</option><option value="draft">Drafts</option><option value="sent">Sent</option><option value="void">Voided</option></select>'+(canWrite?'<button class="btn primary" id="ebNew">Create Invoice</button>':'')+'</div>'+(found.length?'<div class="eb-table"><table><thead><tr><th>Invoice</th><th>Employer</th><th>Issued</th><th>Due</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+found.map(r=>'<tr><td><strong>'+esc(r.invoice_number)+'</strong></td><td>'+esc(r.recipient_name)+'</td><td>'+esc(r.issue_date)+'</td><td>'+esc(r.due_date)+'</td><td>'+money(r.total)+'</td><td><span class="eb-badge">'+esc(r.status)+'</span></td><td class="eb-actions"><button data-eb-view="'+esc(r.id)+'">View</button><button data-eb-pdf="'+esc(r.id)+'">PDF</button>'+(canWrite&&r.status!=="void"?'<button data-eb-send="'+esc(r.id)+'">Send</button><button data-eb-void="'+esc(r.id)+'">Void</button>':'')+'</td></tr>').join("")+'</tbody></table></div>':'<div class="eb-empty"><strong>No invoices yet</strong><p>Prepare an invoice for an employer or owner-operator in this workspace.</p></div>')+'</section>');
 $("ebSearch").oninput=e=>{query=e.target.value;const pos=e.target.selectionStart;list();$("ebSearch").focus();$("ebSearch").setSelectionRange(pos,pos)};
 $("ebFilter").value=filter;$("ebFilter").onchange=e=>{filter=e.target.value;list()};
 $("ebNew")?.addEventListener("click",create);
 $("pageContent").querySelectorAll("[data-eb-view]").forEach(b=>b.onclick=()=>void view(b.dataset.ebView));
 $("pageContent").querySelectorAll("[data-eb-pdf]").forEach(b=>b.onclick=()=>void download(b.dataset.ebPdf,b));
 $("pageContent").querySelectorAll("[data-eb-send]").forEach(b=>b.onclick=()=>void send(b.dataset.ebSend,b));
 $("pageContent").querySelectorAll("[data-eb-void]").forEach(b=>b.onclick=()=>void cancel(b.dataset.ebVoid));
}
function collectLines(){
 const nodes=[...$("ebItems").querySelectorAll(".eb-line")];
 lines=nodes.map(el=>({description:el.querySelector(".eb-desc").value,quantity:Number(el.querySelector(".eb-qty").value),unit_price:Number(el.querySelector(".eb-unit").value),discount:Number(el.querySelector(".eb-discount").value)}));
}
function recalc(){
 if(!$("ebForm"))return;
 collectLines();let sub=lines.reduce((s,l)=>s+Math.max(0,Math.round(l.quantity*Math.round(l.unit_price*100)-Math.round(l.discount*100)))/100,0);
 const form=$("ebForm"),value=Number(form.elements.discount_value.value)||0,discount=Math.min(sub,form.elements.discount_type.value==="percent"?Math.round(sub*value)/100:value),tax=Math.round(Math.max(0,sub-discount)*(Number(form.elements.tax_rate.value)||0))/100;
 $("ebSub").textContent=money(sub);$("ebDisc").textContent="-"+money(discount);$("ebTax").textContent=money(tax);$("ebTotal").textContent=money(sub-discount+tax);
}
function drawLines(){
 $("ebItems").innerHTML=lines.map((l,i)=>'<div class="eb-line" data-idx="'+i+'"><label class="wide">Description<input class="eb-desc" required maxlength="250" placeholder="Drug test, specimen collection…" value="'+esc(l.description)+'"></label><label>Qty<input class="eb-qty" type="number" min="0.01" step="0.01" value="'+esc(l.quantity)+'"></label><label>Unit price ($)<input class="eb-unit" type="number" min="0" step="0.01" value="'+esc(l.unit_price)+'"></label><label>Discount ($)<input class="eb-discount" type="number" min="0" step="0.01" value="'+esc(l.discount)+'"></label><button class="eb-remove" type="button" data-remove="'+i+'">Remove</button></div>').join("");
 $("ebItems").querySelectorAll("input").forEach(input=>input.oninput=recalc);
 $("ebItems").querySelectorAll("[data-remove]").forEach(button=>button.onclick=()=>{collectLines();if(lines.length<2)return;lines.splice(Number(button.dataset.remove),1);drawLines()});
 recalc();
}
function create(){
 mode="create";lines=[{description:"",quantity:1,unit_price:0,discount:0}];
 const opts=people.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+' ('+(p.kind==="owner_operators"?"Owner-Operator":"Employer")+')</option>').join("");
 shell('<section class="eb-panel eb-editor"><header><h3>Create Enterprise Invoice</h3><button class="btn secondary" id="ebBack">Back to Employer Billing</button></header><form id="ebForm"><div class="eb-fields"><label class="wide">Employer / Owner-Operator<select name="recipient_id" required><option value="">Select recipient</option>'+opts+'</select></label><label>Title<input name="title" value="Employer Invoice" maxlength="140"></label><label>Purchase Order<input name="purchase_order" maxlength="100"></label><label>Issue date<input name="issue_date" type="date" value="'+today()+'" required></label><label>Due date<input name="due_date" type="date" value="'+plus30()+'" required></label><label class="wide">Payment terms<input name="payment_terms" maxlength="500" value="Net 30. Pay your C/TPA directly."></label></div><div class="eb-section"><h4>Line items</h4><button type="button" class="btn secondary" id="ebAdd">Add item</button></div><div id="ebItems"></div><div class="eb-bottom"><div><label>Notes to client<textarea name="notes" maxlength="1500" rows="5" placeholder="Payment instructions, address, service details…"></textarea></label><div class="eb-logo"><strong>Your Company Logo</strong><p>PNG or JPEG up to 1 MB. Included on PDF invoices.</p><input type="file" id="ebLogoFile" accept="image/png,image/jpeg"><button type="button" class="btn secondary" id="ebLogoSave">Upload Logo</button><div id="ebLogoPreview"></div></div></div><div class="eb-totals"><label>Discount type<select name="discount_type"><option value="amount">Fixed amount ($)</option><option value="percent">Percentage (%)</option></select></label><label>Discount value<input name="discount_value" type="number" min="0" step="0.01" value="0"></label><label>Tax rate (%)<input name="tax_rate" type="number" min="0" max="100" step="0.01" value="0"></label><div>Subtotal <strong id="ebSub">$0.00</strong></div><div>Discount <strong id="ebDisc">$0.00</strong></div><div>Tax <strong id="ebTax">$0.00</strong></div><div class="eb-grand">Total <strong id="ebTotal">$0.00</strong></div></div></div><footer><span id="ebMessage" role="status"></span><button type="submit" class="btn primary" id="ebCreate">Create Invoice</button></footer></form></section>');
 $("ebBack").onclick=list;$("ebAdd").onclick=()=>{collectLines();lines.push({description:"",quantity:1,unit_price:0,discount:0});drawLines()};
 $("ebLogoSave").onclick=()=>void upload();
 if(logo)$("ebLogoPreview").innerHTML='<img alt="Company invoice logo" src="data:'+logo.mime+';base64,'+logo.base64+'">';
 drawLines();const form=$("ebForm");
 for(const name of ["discount_type","discount_value","tax_rate"])form.elements[name].oninput=recalc;
 form.onsubmit=async e=>{e.preventDefault();collectLines();const button=$("ebCreate");button.disabled=true;$("ebMessage").textContent="Creating invoice…";
  try{const values=Object.fromEntries(new FormData(form));values.discount_value=Number(values.discount_value);values.tax_rate=Number(values.tax_rate);values.items=lines;
   const result=await call("create",values);await refresh();await view(result.id);
  }catch(error){$("ebMessage").textContent=error.message}finally{button.disabled=false}
 };
}
async function upload(){
 const file=$("ebLogoFile").files?.[0];if(!file||!["image/png","image/jpeg"].includes(file.type)||file.size>1048576){$("ebMessage").textContent="Choose a PNG or JPEG under 1 MB";return}
 const button=$("ebLogoSave");button.disabled=true;
 try{const base64=await new Promise((ok,bad)=>{const reader=new FileReader();reader.onload=()=>ok(String(reader.result).split(",")[1]);reader.onerror=bad;reader.readAsDataURL(file)});
 await call("save_logo",{mime:file.type,base64});logo={mime:file.type,base64};$("ebLogoPreview").innerHTML='<img alt="Company invoice logo" src="data:'+file.type+';base64,'+base64+'">';$("ebMessage").textContent="Company logo saved.";
 }catch(e){$("ebMessage").textContent=e.message}finally{button.disabled=false}
}
async function view(id){
 const result=await call("detail",{id}),r=result.invoice;mode="detail";
 shell('<section class="eb-panel eb-detail"><header><h3>'+esc(r.invoice_number)+'</h3><button class="btn secondary" id="ebBack">Back to Employer Billing</button></header><div class="eb-fields"><div><small>Employer</small><strong>'+esc(r.recipient_name)+'</strong></div><div><small>Email</small><strong>'+esc(r.recipient_email)+'</strong></div><div><small>Issued</small><strong>'+esc(r.issue_date)+'</strong></div><div><small>Due</small><strong>'+esc(r.due_date)+'</strong></div><div><small>Status</small><strong>'+esc(r.status.toUpperCase())+'</strong></div></div><div class="eb-table"><table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Line discount</th><th>Net</th></tr></thead><tbody>'+(r.items||[]).map(x=>'<tr><td>'+esc(x.description)+'</td><td>'+esc(x.quantity)+'</td><td>'+money(x.unit_price)+'</td><td>'+money(x.discount)+'</td><td>'+money(x.line_total)+'</td></tr>').join("")+'</tbody></table></div><div class="eb-detail-total">Subtotal: '+money(r.subtotal)+' · Discount: '+money(r.discount_amount)+' · Tax: '+money(r.tax_amount)+'<strong>Total: '+money(r.total)+'</strong></div><div class="eb-detail-buttons"><button class="btn secondary" id="ebPdf">Download PDF</button>'+(canWrite&&r.status!=="void"?'<button class="btn primary" id="ebSend">Send Invoice</button><button class="btn secondary" id="ebVoid">Void</button>':'')+'</div><p id="ebActionStatus" role="status"></p></section>');
 $("ebBack").onclick=list;$("ebPdf").onclick=e=>void download(id,e.currentTarget);$("ebSend")?.addEventListener("click",e=>void send(id,e.currentTarget));$("ebVoid")?.addEventListener("click",()=>void cancel(id));
}
async function download(id,button){
 if(button)button.disabled=true;
 try{const result=await call("pdf",{id}),raw=atob(result.base64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
 const url=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"})),a=document.createElement("a");a.href=url;a.download=result.filename||"invoice.pdf";a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
 }catch(e){window.alert("PDF download failed: "+e.message)}finally{if(button)button.disabled=false}
}
async function send(id,button){
 const row=records.find(x=>x.id===id);if(!confirm("Email invoice "+(row?.invoice_number||"")+" to "+(row?.recipient_email||"employer")+"?"))return;
 button.disabled=true;
 try{const result=await call("send",{id});await refresh();if(result.status_update_failed)alert("Email accepted, but invoice status could not be recorded. Please contact support before resending.");else alert("Invoice accepted for email delivery.");if(mode==="detail")await view(id);else list()}
 catch(e){alert("Invoice send failed: "+e.message)}finally{button.disabled=false}
}
async function cancel(id){
 const reason=prompt("Reason for voiding the invoice (required):");if(reason===null)return;if(!reason.trim()){alert("A void reason is required.");return}if(!confirm("Void invoice permanently?"))return;
 try{await call("void",{id,reason});await refresh();if(mode==="detail")await view(id);else list()}catch(e){alert("Could not void invoice: "+e.message)}
}
async function refresh(){const d=await call("bootstrap");records=d.invoices||[];people=d.recipients||[];logo=d.logo;canWrite=!!d.can_write}
async function open(value){ctx=value;const id=++serial;$("pageContent").innerHTML='<section class="eb-loading">Loading Employer Billing…</section>';
 try{await refresh();if(id!==serial||!value.active())return;list()}catch(e){if(id!==serial||!value.active())return;$("pageContent").innerHTML='<section class="eb-error"><h2>Employer Billing unavailable</h2><p>'+esc(e.message)+'</p><button class="btn secondary" id="ebRetry">Try again</button></section>';$("ebRetry").onclick=()=>void open(value)}
}
function exportCsv(){const all=[["Invoice","Recipient","Email","Issue date","Due date","Total","Status"],...records.map(r=>[r.invoice_number,r.recipient_name,r.recipient_email,r.issue_date,r.due_date,r.total,r.status])];const csv=all.map(a=>a.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\r\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"})),a=document.createElement("a");a.href=url;a.download="employer-billing.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1200)}
window.WorkforceEmployerInvoices=Object.freeze({open,exportCsv,create});
})();