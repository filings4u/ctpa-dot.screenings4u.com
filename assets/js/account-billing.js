(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(v,c='USD')=>new Intl.NumberFormat('en-US',{style:'currency',currency:String(c||'USD').toUpperCase()}).format(Number(v||0));
const fmt=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d)};
const pretty=v=>String(v??'—').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
const badge=v=>`<span class="badge ${/paid/i.test(String(v))?'good':/past_due|void|uncollectible/i.test(String(v))?'bad':'warn'}">${esc(pretty(v))}</span>`;
let data=null,ctx=null;
function render(d,c){data=d;ctx=c;const s=d.summary||{};return `<div class="account-billing-shell"><div class="metrics billing-metrics"><div class="metric"><small>Account Invoices</small><strong>${Number(s.invoice_count||0)}</strong><span>Issued by Workforce</span></div><div class="metric"><small>Open</small><strong>${Number(s.open_count||0)}</strong><span>Open and past-due</span></div><div class="metric"><small>Outstanding</small><strong>${money(s.outstanding||0)}</strong><span>Current account balance</span></div><div class="metric"><small>Receipts</small><strong>${Number(s.receipt_count||0)}</strong><span>Completed payments</span></div></div><div class="notice account-billing-note"><strong>Workforce Account Billing</strong> shows invoices and receipts issued to your C/TPA account. Employer Billing is separate for invoices you send to clients.</div><div class="billing-toolbar"><div class="billing-search"><input id="accountBillingSearch" type="search" placeholder="Search invoice or receipt"><select id="accountBillingStatus"><option value="">All statuses</option><option value="open">Open</option><option value="past_due">Past Due</option><option value="paid">Paid</option><option value="void">Void</option></select></div></div><div class="panel"><div class="panel-head"><div><h2>Workforce Invoices</h2><p>View, pay, and download invoices issued to your C/TPA account.</p></div></div><div class="table-wrap"><table class="billing-table"><thead><tr><th>Invoice</th><th>Issued</th><th>Due</th><th>Total</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead><tbody id="accountInvoiceRows"></tbody></table></div></div><div class="panel" style="margin-top:18px"><div class="panel-head"><div><h2>Receipts</h2><p>Receipts for Workforce invoices, subscription renewals, and approved add-ons.</p></div></div><div class="table-wrap"><table class="billing-table"><thead><tr><th>Receipt</th><th>Paid</th><th>Type</th><th>Reference</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody id="accountReceiptRows"></tbody></table></div></div></div>`}
function invoiceRow(i){const canPay=!!i.can_pay&&Number(i.amount_due||0)>0&&['open','past_due'].includes(String(i.status||'').toLowerCase());return `<tr data-kind="invoice" data-id="${esc(i.id)}"><td><strong>${esc(i.invoice_number||'Invoice')}</strong><small>${esc(i.invoice_title||'')}</small></td><td>${fmt(i.issued_at||i.sent_at)}</td><td>${fmt(i.due_at)}</td><td>${money(i.total,i.currency)}</td><td>${money(i.amount_due,i.currency)}</td><td>${badge(i.status)}</td><td><div class="billing-row-actions"><button class="mini-btn" data-act="view">View</button>${canPay?'<button class="mini-btn primary" data-act="pay">Pay</button>':''}<button class="mini-btn" data-act="download">Download</button></div></td></tr>`}
function receiptRow(r){return `<tr data-kind="receipt" data-id="${esc(r.id)}"><td><strong>${esc(r.receipt_number||'Receipt')}</strong><small>${esc(pretty(r.source))}</small></td><td>${fmt(r.paid_at)}</td><td>${esc(pretty(r.purpose||r.source||'payment'))}</td><td>${esc(r.reference||r.invoice_id||'—')}</td><td>${money(r.amount,r.currency)}</td><td>${badge(r.status)}</td><td><div class="billing-row-actions"><button class="mini-btn" data-act="view">View</button><button class="mini-btn" data-act="download">Download</button></div></td></tr>`}
function apply(){const q=String($('#accountBillingSearch')?.value||'').trim().toLowerCase(),st=$('#accountBillingStatus')?.value||'';const inv=(data.invoices||[]).filter(i=>(!st||i.status===st)&&(!q||[i.invoice_number,i.invoice_title,i.recipient_email].some(v=>String(v||'').toLowerCase().includes(q))));const rec=(data.receipts||[]).filter(r=>(!st||r.status===st)&&(!q||[r.receipt_number,r.reference,r.purpose,r.source].some(v=>String(v||'').toLowerCase().includes(q))));$('#accountInvoiceRows').innerHTML=inv.map(invoiceRow).join('')||'<tr><td colspan="7"><div class="empty">No account invoices are available.</div></td></tr>';$('#accountReceiptRows').innerHTML=rec.map(receiptRow).join('')||'<tr><td colspan="7"><div class="empty">No payment receipts are available.</div></td></tr>';$$('[data-kind] [data-act]').forEach(b=>b.onclick=()=>act(b.closest('tr').dataset.kind,b.closest('tr').dataset.id,b.dataset.act))}
function invoiceCanPay(i){return !!i.can_pay&&Number(i.amount_due||0)>0&&['open','past_due'].includes(String(i.status||'').toLowerCase())}
function payInvoice(i){if(!invoiceCanPay(i)){window.S4UDialog?.alert?.('This invoice is not currently payable.');return}location.href='/global-checkout.html?mode=invoice&invoice_id='+encodeURIComponent(i.id)}
function invoiceModal(i){
 const bd=document.createElement('div');bd.className='modal-backdrop workforce-billing-backdrop';
 const items=i.invoice_items||[];
 bd.innerHTML=`<div class="modal workforce-invoice-modal" role="dialog" aria-modal="true" aria-label="Workforce invoice ${esc(i.invoice_number||'')}">
 <div class="workforce-invoice-header"><div class="workforce-invoice-brand"><img src="/images/logo2.png" alt="Workforce"><div><span class="workforce-doc-eyebrow">WORKFORCE ACCOUNT BILLING</span><h2>Invoice ${esc(i.invoice_number||'')}</h2><p>Account invoice · ${esc(pretty(i.status||'draft'))}</p></div></div><button class="workforce-modal-x" type="button" aria-label="Close invoice" data-close>×</button></div>
 <div class="workforce-invoice-content"><div class="workforce-invoice-summary">
 <div><small>INVOICE NUMBER</small><strong>${esc(i.invoice_number||'—')}</strong></div>
 <div><small>ISSUED</small><strong>${fmt(i.issued_at||i.sent_at)}</strong></div>
 <div><small>DUE DATE</small><strong>${fmt(i.due_at)}</strong></div>
 <div><small>STATUS</small>${badge(i.status)}</div></div>
 <div class="workforce-invoice-section-label">Invoice details</div>
 <div class="workforce-invoice-table-scroll"><table class="workforce-invoice-items"><thead><tr><th>DESCRIPTION</th><th>QTY</th><th>RATE</th><th>AMOUNT</th></tr></thead><tbody>${items.map(x=>`<tr><td>${esc(x.description||'Service')}</td><td>${esc(x.quantity??1)}</td><td>${money(x.unit_amount,i.currency)}</td><td>${money(x.amount,i.currency)}</td></tr>`).join('')||'<tr><td colspan="4">No line-item detail was supplied.</td></tr>'}</tbody></table></div>
 <div class="workforce-invoice-bottom"><div class="workforce-invoice-instructions"><strong>Issued by Workforce</strong><p>For account billing support, contact Workforce through your secure customer portal.</p>${i.notes?`<div><small>NOTES</small><p>${esc(i.notes)}</p></div>`:''}</div>
 <div class="workforce-invoice-totals"><div><span>Subtotal</span><strong>${money(i.subtotal,i.currency)}</strong></div><div><span>Tax</span><strong>${money(i.tax,i.currency)}</strong></div><div><span>Credits</span><strong>−${money(i.credits,i.currency)}</strong></div><div class="grand"><span>Invoice Total</span><strong>${money(i.total,i.currency)}</strong></div><div class="balance"><span>Balance Due</span><strong>${money(i.amount_due,i.currency)}</strong></div></div></div></div>
 <div class="workforce-invoice-actions"><button type="button" class="btn ghost" data-close>Close</button><button type="button" class="btn ghost" data-download>Download PDF</button>${invoiceCanPay(i)?'<button type="button" class="btn primary" data-pay>Pay Invoice →</button>':''}</div></div>`;
 document.body.appendChild(bd);
 const close=()=>{bd.remove();document.removeEventListener('keydown',onKey)};
 const onKey=e=>{if(e.key==='Escape')close()};
 document.addEventListener('keydown',onKey);
 bd.addEventListener('click',e=>{if(e.target===bd||e.target.closest('[data-close]'))close()});
 bd.querySelector('[data-download]').onclick=()=>invoicePdf(i);
 const pay=bd.querySelector('[data-pay]');if(pay)pay.onclick=()=>payInvoice(i);
 bd.querySelector('.workforce-modal-x')?.focus();
}
function receiptModal(r){const bd=document.createElement('div');bd.className='modal-backdrop';bd.innerHTML=`<div class="modal invoice-preview-modal"><div class="invoice-modal-head" style="background:#01122F;color:#fff"><div style="display:flex;align-items:center;gap:14px"><img src="/images/logo2.png" alt="Workforce" style="max-width:190px;height:auto"><div><h2 style="color:#fff;margin:0">${esc(r.receipt_number||'Receipt')}</h2><p style="color:#dbe8f5;margin:4px 0 0">Workforce payment receipt</p></div></div><button class="modal-x" data-close>×</button></div><div class="invoice-preview"><div class="invoice-preview-meta"><div><small>PAID</small><strong>${fmt(r.paid_at)}</strong></div><div><small>TYPE</small><strong>${esc(pretty(r.purpose||r.source))}</strong></div><div><small>STATUS</small><strong>${esc(pretty(r.status))}</strong></div></div><div class="invoice-preview-totals"><div><span>Reference</span><strong>${esc(r.reference||r.invoice_id||'—')}</strong></div><div class="grand"><span>Amount Paid</span><strong>${money(r.amount,r.currency)}</strong></div></div></div><div class="modal-actions"><button class="btn ghost" data-close>Close</button><button class="btn primary" data-download>Download</button></div></div>`;document.body.appendChild(bd);bd.onclick=e=>{if(e.target===bd||e.target.closest('[data-close]'))bd.remove()};bd.querySelector('[data-download]').onclick=()=>receiptPdf(r)}
async function invoiceLogo(doc){try{
 const response=await fetch('/images/logo2.png',{cache:'force-cache'});
 if(!response.ok)return false;
 const blob=await response.blob();
 const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob)});
 const info=doc.getImageProperties(data);
 const ratio=info.width/info.height;
 doc.addImage(data,'PNG',42,22,Math.min(145,45*ratio),Math.min(45,145/ratio),undefined,'FAST');
 return true;
}catch{return false}}
function newPdf(){if(!window.jspdf?.jsPDF){window.S4UDialog?.alert?.('PDF library is not available.');return null}return new window.jspdf.jsPDF({unit:'pt',format:'letter'})}
async function pdfHeader(doc,title,number){
 doc.setFillColor(1,18,47);doc.rect(0,0,612,106,'F');
 doc.setFillColor(253,193,2);doc.rect(0,103,612,3,'F');
 const logo=await invoiceLogo(doc);
 if(!logo){doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(21);doc.text('Workforce',42,54)}
 doc.setTextColor(253,193,2);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(title,568,48,{align:'right'});
 doc.setTextColor(255);doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(String(number||''),568,65,{align:'right'});
 doc.setTextColor(1,18,47);doc.setFont('helvetica','normal');
}
async function invoicePdf(i){
 const doc=newPdf();if(!doc)return;await pdfHeader(doc,'ACCOUNT INVOICE',i.invoice_number);
 const amt=v=>money(v,i.currency);
 doc.setFont('helvetica','bold');doc.setFontSize(22);doc.text('Invoice',42,146);
 doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(95,108,129);
 doc.text('Invoice number',42,167);doc.text('Issued',300,167);doc.text('Due date',430,167);
 doc.setTextColor(1,18,47);doc.setFont('helvetica','bold');doc.setFontSize(10);
 doc.text(String(i.invoice_number||'—'),42,184);doc.text(fmt(i.issued_at||i.sent_at),300,184);doc.text(fmt(i.due_at),430,184);
 doc.setTextColor(95,108,129);doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text('ISSUED BY',42,224);
 doc.text('STATUS',325,224);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(1,18,47);
 doc.text('Workforce',42,245);doc.text(pretty(i.status||'draft'),325,245);
 let y=290;
 const headers=()=>{doc.setFillColor(242,245,249);doc.rect(42,y-17,528,29,'F');doc.setFont('helvetica','bold');doc.setTextColor(1,18,47);doc.setFontSize(9);doc.text('DESCRIPTION',53,y);doc.text('QTY',380,y);doc.text('RATE',450,y);doc.text('AMOUNT',560,y,{align:'right'});y+=25};
 headers();doc.setFont('helvetica','normal');doc.setFontSize(10);
 for(const item of i.invoice_items||[]){
  const lines=doc.splitTextToSize(String(item.description||'Service'),305);
  const rowHeight=Math.max(26,lines.length*13+8);
  if(y+rowHeight>630){doc.addPage();y=70;headers()}
  doc.setTextColor(1,18,47);doc.text(lines,53,y);
  doc.text(String(item.quantity??1),380,y);doc.text(amt(item.unit_amount),450,y);doc.text(amt(item.amount),560,y,{align:'right'});
  y+=rowHeight;doc.setDrawColor(223,229,236);doc.line(42,y-9,570,y-9);
 }
 y=Math.max(385,y+16);
 const totals=[['Subtotal',i.subtotal],['Tax',i.tax],['Credits',-Number(i.credits||0)],['Invoice Total',i.total],['Balance Due',i.amount_due]];
 if(y+145>690){doc.addPage();y=85}
 for(const [label,value] of totals){
  const emphasis=label==='Invoice Total'||label==='Balance Due';
  if(emphasis){doc.setFillColor(label==='Balance Due'?253:246,label==='Balance Due'?193:248,label==='Balance Due'?2:251);doc.rect(345,y-13,225,22,'F')}
  doc.setFont('helvetica',emphasis?'bold':'normal');doc.setFontSize(emphasis?11:10);doc.setTextColor(1,18,47);
  doc.text(label,359,y);doc.text(amt(value),560,y,{align:'right'});y+=26;
 }
 if(i.notes){if(y>680){doc.addPage();y=75}doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('NOTES',42,y+18);doc.setFont('helvetica','normal');doc.text(doc.splitTextToSize(String(i.notes),500),42,y+35)}
 const pageCount=doc.getNumberOfPages();for(let p=1;p<=pageCount;p++){doc.setPage(p);doc.setDrawColor(212,211,212);doc.line(42,748,570,748);doc.setTextColor(96,108,128);doc.setFontSize(8);doc.text('Workforce by screenings4u · Account billing',42,765);doc.text('Page '+p+' of '+pageCount,570,765,{align:'right'})}
 doc.save(String(i.invoice_number||'workforce-invoice')+'.pdf');
}
async function receiptPdf(r){
 const doc=newPdf();if(!doc)return;await pdfHeader(doc,'PAYMENT RECEIPT',r.receipt_number);
 doc.setTextColor(1,18,47);doc.setFontSize(22);doc.setFont('helvetica','bold');doc.text('Payment Receipt',42,153);
 let y=205;for(const [label,value] of [['Receipt number',r.receipt_number||'—'],['Paid',fmt(r.paid_at)],['Type',pretty(r.purpose||r.source)],['Reference',r.reference||r.invoice_id||'—'],['Status',pretty(r.status)],['Amount Paid',money(r.amount,r.currency)]]){
 doc.setTextColor(96,108,128);doc.setFontSize(10);doc.setFont('helvetica','normal');doc.text(String(label),42,y);
 doc.setTextColor(1,18,47);doc.setFont('helvetica','bold');doc.text(String(value),225,y);y+=34;
 }
 doc.setDrawColor(212,211,212);doc.line(42,748,570,748);doc.setFont('helvetica','normal');doc.setTextColor(96,108,128);doc.setFontSize(8);doc.text('Workforce by screenings4u · Payment receipt',42,765);
 doc.save(String(r.receipt_number||'workforce-receipt')+'.pdf');
}
function act(kind,id,a){if(kind==='invoice'){const i=(data.invoices||[]).find(x=>x.id===id);if(!i)return;if(a==='view')return invoiceModal(i);if(a==='pay')return payInvoice(i);if(a==='download')return invoicePdf(i)}const r=(data.receipts||[]).find(x=>x.id===id);if(!r)return;if(a==='view')return receiptModal(r);if(a==='download')return receiptPdf(r)}
function bind(d,c){data=d;ctx=c;apply();$('#accountBillingSearch')?.addEventListener('input',apply);$('#accountBillingStatus')?.addEventListener('change',apply)}
window.AccountBilling={render,bind};
})();