(()=>{"use strict";
const $=id=>document.getElementById(id),esc=x=>String(x??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\x27/g,"&#39;");
const money=v=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(v)||0);
let ctx=null,records=[],kind="bill",search="",status="all",serial=0;
async function call(action,more={}){
 const token=(await ctx.supabase.auth.getSession()).data?.session?.access_token;
 if(!token)throw Error("Sign-in required");
 const r=await fetch("https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-ctpa-finance-read",{method:"POST",cache:"no-store",headers:{"Authorization":"Bearer "+token,"apikey":"sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC","Content-Type":"application/json"},body:JSON.stringify({action,tenant_id:ctx.tenantId,operating_context:ctx.context,...more})});
 const result=await r.json().catch(()=>({}));if(!r.ok||result.error)throw Error(result.error||"Unable to retrieve financial records");return result;
}
function page(content){
 const name=kind==="bill"?"Workforce Billing":"Settlements";
 $("pageContent").innerHTML='<div class="wf-finance"><section class="wf-finance-hero"><div><small>WORKFORCE / FINANCE RECORDS</small><h2>'+name+'</h2><p>'+(kind==="bill"?"Review invoices Workforce has issued to your C/TPA. Download statements and pay open balances securely.":"Review settlement statements for services you performed for Workforce. View completed payouts and download your records.")+'</p></div><span>'+esc(ctx.context==="dot"?"DOT":"NON-DOT")+'</span></section>'+content+'</div>';
}
function render(){
 const found=records.filter(x=>(status==="all"||x.status===status)&&[kind==="bill"?x.invoice_number:x.settlement_number,kind==="bill"?x.title:x.payment_reference].join(" ").toLowerCase().includes(search.toLowerCase()));
 const sum=kind==="bill"?records.filter(r=>r.status==="open").reduce((v,r)=>v+Math.max(0,Number(r.total)-Number(r.amount_paid)),0):records.filter(r=>r.status==="paid").reduce((v,r)=>v+Number(r.net),0);
 const metrics=kind==="bill"?[["Total invoices",records.length],["Open",records.filter(r=>r.status==="open").length],["Paid",records.filter(r=>r.status==="paid").length],["Balance due",money(sum)]]:[["Settlements",records.length],["Paid",records.filter(r=>r.status==="paid").length],["Pending",records.filter(r=>r.status==="pending").length],["Paid to your C/TPA",money(sum)]];
 const columns=kind==="bill"?'<th>Invoice</th><th>Issued</th><th>Due</th><th>Amount</th><th>Balance due</th>':'<th>Settlement</th><th>Period</th><th>Paid on</th><th>Net payout</th>';
 const rows=found.map(r=>'<tr><td><strong>'+esc(kind==="bill"?r.invoice_number:r.settlement_number)+'</strong></td>'+(kind==="bill"?'<td>'+esc(String(r.issued_at||"").slice(0,10))+'</td><td>'+esc(String(r.due_at||"").slice(0,10))+'</td><td>'+money(r.total)+'</td><td>'+money(Math.max(0,Number(r.total)-Number(r.amount_paid)))+'</td>':'<td>'+esc(r.period_start)+' — '+esc(r.period_end)+'</td><td>'+esc(String(r.paid_at||"").slice(0,10)||"Pending")+'</td><td>'+money(r.net)+'</td>')+'<td><span class="wf-finance-status">'+esc(r.status)+'</span></td><td><div class="wf-finance-actions"><button class="btn secondary" data-wff-view="'+esc(r.id)+'">View</button><button class="btn secondary" data-wff-pdf="'+esc(r.id)+'">Download PDF</button>'+(kind==="bill"&&r.status==="open"&&Number(r.total)>Number(r.amount_paid)?'<button class="btn primary" data-wff-pay="'+esc(r.id)+'">Pay Invoice</button>':'')+'</div></td></tr>').join("");
 page('<section class="wf-finance-stats">'+metrics.map(m=>'<article><small>'+esc(m[0])+'</small><strong>'+esc(m[1])+'</strong></article>').join("")+'</section><section class="wf-finance-panel"><div class="wf-finance-controls"><input id="wffSearch" type="search" placeholder="Search '+(kind==="bill"?"invoice":"settlement")+' reference" value="'+esc(search)+'"><select id="wffFilter"><option value="all">All statuses</option>'+(kind==="bill"?'<option value="open">Open</option><option value="paid">Paid</option><option value="void">Voided</option>':'<option value="paid">Paid</option><option value="pending">Pending</option>')+'</select></div>'+(found.length?'<div class="wf-finance-table"><table><thead><tr>'+columns+'<th>Status</th><th>Actions</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<div class="wf-finance-empty"><strong>No '+(kind==="bill"?"Workforce invoices":"settlements")+' yet</strong><p>Records will appear here after Workforce Management publishes them for this C/TPA.</p></div>')+'</section><div id="wffDialog" class="wf-finance-overlay" hidden></div>');
 $("wffFilter").value=status;$("wffFilter").onchange=e=>{status=e.target.value;render()};
 $("wffSearch").oninput=e=>{search=e.target.value;const pos=e.target.selectionStart;render();$("wffSearch").focus();$("wffSearch").setSelectionRange(pos,pos)};
 $("pageContent").querySelectorAll("[data-wff-view]").forEach(b=>b.onclick=()=>void view(b.dataset.wffView));
 $("pageContent").querySelectorAll("[data-wff-pdf]").forEach(b=>b.onclick=()=>void pdf(b.dataset.wffPdf,b));
 $("pageContent").querySelectorAll("[data-wff-pay]").forEach(b=>b.onclick=()=>pay(b.dataset.wffPay));
}
function pay(id){
 if(kind!=="bill"||!records.some(r=>r.id===id&&r.status==="open"&&Number(r.total)>Number(r.amount_paid)))return;
 const q=new URLSearchParams({mode:"workforce_bill",invoice_id:id,tenant_id:ctx.tenantId,context:ctx.context});
 location.assign("/global-checkout.html?"+q.toString());
}
async function view(id){
 try{
  const d=await call(kind==="bill"?"bill_detail":"settlement_detail",{id}),r=d.record;
  const overlay=$("wffDialog");overlay.hidden=false;
  const details=kind==="bill"?[["Reference",r.invoice_number],["Bill to",r.recipient_name],["Issued",String(r.issued_at).slice(0,10)],["Due date",String(r.due_at).slice(0,10)],["Status",r.status],["Balance",money(Math.max(0,Number(r.total)-Number(r.amount_paid)))]]:[["Reference",r.settlement_number],["Period",r.period_start+" — "+r.period_end],["Status",r.status],["Paid date",String(r.paid_at||"Not paid").slice(0,10)],["Payment method",r.payment_method||"—"],["Payment reference",r.payment_reference||"—"]];
  const items=(r.items||[]).map(x=>'<div class="wf-finance-line"><span>'+esc(x.description||"Service")+'</span><strong>'+money(x.amount)+'</strong></div>').join("");
  overlay.innerHTML='<div class="wf-finance-dialog" role="dialog" aria-modal="true"><header><h3>'+(kind==="bill"?"Workforce Invoice":"Settlement Statement")+'</h3><button id="wffClose" aria-label="Close">×</button></header><div class="wf-finance-dialog-main"><div class="wf-finance-info">'+details.map(v=>'<div><small>'+esc(v[0])+'</small><strong>'+esc(v[1])+'</strong></div>').join("")+'</div><h4>Itemized services</h4>'+items+'<div class="wf-finance-total">Total: '+money(kind==="bill"?r.total:r.net)+'</div><div class="wf-finance-actions"><button class="btn secondary" id="wffDownload">Download PDF</button>'+(kind==="bill"&&r.status==="open"&&Number(r.total)>Number(r.amount_paid)?'<button class="btn primary" id="wffPay">Pay Invoice</button>':'')+'</div></div></div>';
  $("wffClose").onclick=()=>overlay.hidden=true;$("wffDownload").onclick=e=>void pdf(id,e.currentTarget);$("wffPay")?.addEventListener("click",()=>pay(id));
  overlay.onclick=e=>{if(e.target===overlay)overlay.hidden=true};
 }catch(e){alert("Unable to view document: "+e.message)}
}
async function pdf(id,button){
 if(button)button.disabled=true;
 try{const d=await call(kind==="bill"?"bill_pdf":"settlement_pdf",{id}),raw=atob(d.base64),buffer=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)buffer[i]=raw.charCodeAt(i);
 const url=URL.createObjectURL(new Blob([buffer],{type:"application/pdf"}));const a=document.createElement("a");a.href=url;a.download=d.filename||"workforce-statement.pdf";a.click();setTimeout(()=>URL.revokeObjectURL(url),1800)}
 catch(e){alert("PDF unavailable: "+e.message)}finally{if(button)button.disabled=false}
}
async function open(value,type){
 ctx=value;kind=type==="settlement"?"settlement":"bill";search="";status="all";const current=++serial;
 $("pageContent").innerHTML='<div class="wf-finance-loading">Loading '+(kind==="bill"?"Workforce Billing":"Settlements")+'…</div>';
 try{
  const d=await call(kind==="bill"?"list_bills":"list_settlements");
  if(current!==serial||!ctx.active())return;records=d.rows||[];render();
 }catch(e){if(current!==serial||!ctx.active())return;$("pageContent").innerHTML='<div class="wf-finance-error"><h2>Unable to load '+(kind==="bill"?"Workforce Billing":"Settlements")+'</h2><p>'+esc(e.message)+'</p><button class="btn secondary" id="wffRetry">Retry</button></div>';$("wffRetry").onclick=()=>void open(value,type)}
}
function exportCsv(){
 const keys=kind==="bill"?["invoice_number","issued_at","due_at","total","amount_paid","status"]:["settlement_number","period_start","period_end","net","paid_at","status"],rows=[keys,...records.map(r=>keys.map(k=>r[k]??""))];
 const csv=rows.map(row=>row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(",")).join("\r\n"),url=URL.createObjectURL(new Blob([csv],{type:"text/csv"})),a=document.createElement("a");a.href=url;a.download=kind==="bill"?"workforce-billing.csv":"workforce-settlements.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
window.WorkforceFinance=Object.freeze({open,exportCsv});
})();