(()=>{
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cash=v=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(v)||0);
let sessionData=null,records=[],stats={},filter="all",search="",selected=null,token=0;
const $=id=>document.getElementById(id);
async function call(action,more={}){
 const ctx=sessionData;
 const r=await ctx.supabase.auth.getSession(),session=r.data?.session;
 if(!session?.access_token)throw Error("Sign-in required");
 const resp=await fetch("https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-ctpa-order-history",{
 method:"POST",cache:"no-store",headers:{"Content-Type":"application/json","apikey":"sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC","Authorization":"Bearer "+session.access_token},
 body:JSON.stringify({action,tenant_id:ctx.tenantId,operating_context:ctx.context,...more})
 });
 const data=await resp.json().catch(()=>({}));
 if(!resp.ok||data.error)throw Error(data.error||"Order history unavailable");
 return data;
}
function render(){
 const root=$("pageContent");if(!root)return;
 const rows=records.filter(o=>(filter==="all"||(filter==="paid"?o.payment_status==="paid":filter==="testing"?o.type==="testing_request":o.type==="purchase"&&o.payment_status!=="paid"))&&[o.number,o.customer,o.description].join(" ").toLowerCase().includes(search.toLowerCase()));
 const values=[["All records",stats.orders||0],["Paid purchases",stats.paid||0],["Paid amount",cash(stats.spend)],["Testing requests",stats.testing_requests||0]];
 root.innerHTML='<div class="history-root"><div class="history-hero"><small>WORKFORCE / PURCHASE RECORDS</small><h2>Order History</h2><p>Purchases and testing requests recorded for your C/TPA organization. View details and download available documents.</p></div><div class="history-kpis">'+values.map(v=>'<div><small>'+esc(v[0])+'</small><strong>'+esc(v[1])+'</strong></div>').join("")+'</div><section class="history-panel"><div class="history-controls"><input type="search" id="historySearch" placeholder="Search order, employer, service" value="'+esc(search)+'"><select id="historyFilter"><option value="all">All records</option><option value="paid">Paid purchases</option><option value="unpaid">Unpaid purchases</option><option value="testing">Testing requests</option></select></div>'+(rows.length?'<div class="history-scroll"><table><thead><tr><th>Order</th><th>Date</th><th>Employer / Account</th><th>Service</th><th>Payment</th><th>Amount</th><th></th></tr></thead><tbody>'+rows.map(o=>'<tr><td><strong>'+esc(o.number)+'</strong><small>'+esc(o.type==="purchase"?"Purchase":"Testing request")+'</small></td><td>'+esc(o.date?new Date(o.date).toLocaleDateString():"—")+'</td><td>'+esc(o.customer)+'</td><td>'+esc(o.description)+'</td><td><span class="history-status">'+esc(o.type==="purchase"?o.payment_status:"Not applicable")+'</span></td><td>'+esc(o.total===null?"—":cash(o.total))+'</td><td><button class="btn secondary" type="button" data-history-view="'+esc(o.id)+'">View</button></td></tr>').join("")+'</tbody></table></div>':'<div class="history-empty"><strong>No orders found</strong><p>Purchases and requests will appear automatically. No manual order history entry is required.</p></div>')+'</section><div id="historyOverlay" class="history-overlay" hidden></div></div>';
 $("historyFilter").value=filter;
 $("historyFilter").onchange=e=>{filter=e.target.value;render()};
 $("historySearch").oninput=e=>{search=e.target.value;const pos=e.target.selectionStart;render();$("historySearch").focus();$("historySearch").setSelectionRange(pos,pos)};
 root.querySelectorAll("[data-history-view]").forEach(b=>b.onclick=()=>details(b.dataset.historyView));
}
function details(id){
 const o=records.find(x=>x.id===id);if(!o)return;selected=o;
 const overlay=$("historyOverlay");const lineItems=(o.items||[]).map(x=>'<div class="history-line"><span>'+esc(x.name)+' × '+x.quantity+'</span><strong>'+cash(x.line_total)+'</strong></div>').join("");
 const buttons=o.type==="testing_request"?'<button type="button" class="btn primary" data-history-doc="order_summary">Download Order Summary PDF</button>':(o.receipt_available?'<button type="button" class="btn primary" data-history-doc="receipt">Download Receipt PDF</button>':'')+'<button type="button" class="btn secondary" data-history-doc="purchase_order">Download Purchase Order PDF</button>';
 const fields=[["Order reference",o.number],["Employer",o.customer],["Date",o.date?new Date(o.date).toLocaleDateString():"—"],["Status",o.status],["Payment",o.type==="purchase"?o.payment_status:"Not applicable"],["Amount",o.total===null?"—":cash(o.total)]];
 overlay.hidden=false;overlay.innerHTML='<div class="history-dialog" role="dialog" aria-modal="true" aria-labelledby="historyDialogTitle"><header><h2 id="historyDialogTitle">Order details</h2><button type="button" id="historyClose" aria-label="Close">×</button></header><div class="history-dialog-body"><div class="history-info">'+fields.map(f=>'<div><small>'+esc(f[0])+'</small><strong>'+esc(f[1])+'</strong></div>').join("")+'</div><h3>Items and services</h3>'+(lineItems||'<p>'+esc(o.description||"No items")+'</p>')+'<div class="history-docs">'+buttons+'</div><p id="historyPdfStatus" role="status"></p></div></div>';
 $("historyClose").onclick=()=>{overlay.hidden=true;selected=null};
 overlay.onclick=e=>{if(e.target===overlay){overlay.hidden=true;selected=null}};
 overlay.querySelectorAll("[data-history-doc]").forEach(b=>b.onclick=()=>void downloadDoc(b));
}
async function downloadDoc(b){
 if(!selected)return;b.disabled=true;const status=$("historyPdfStatus");status.textContent="Preparing document…";
 try{
  const result=await call("document",{id:selected.id,kind:selected.type,document_type:b.dataset.historyDoc});
  const binary=atob(result.base64),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  const href=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"})),a=document.createElement("a");a.href=href;a.download=result.filename||"workforce-order.pdf";a.click();setTimeout(()=>URL.revokeObjectURL(href),1500);status.textContent="Document downloaded.";
 }catch(e){status.textContent=e.message||"Download failed"}finally{b.disabled=false}
}
async function open(ctx){
 sessionData=ctx;const request=++token;const container=$("pageContent");if(!container)return;
 container.innerHTML='<div class="history-loading">Loading orders from Workforce Testing…</div>';
 try{const data=await call("list");if(request!==token||!ctx.active())return;records=data.orders||[];stats=data.stats||{};render()}
 catch(e){if(request===token&&ctx.active())container.innerHTML='<div class="history-error"><h2>Unable to load order history</h2><p>'+esc(e.message)+'</p><button class="btn secondary" id="historyRetry">Try again</button></div>',$("historyRetry").onclick=()=>void open(ctx)}
}
function exportCsv(){
 const data=[["Order","Date","Employer","Service","Payment","Amount"],...records.map(o=>[o.number,o.date,o.customer,o.description,o.payment_status,o.total??""])];
 const csv=data.map(row=>row.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\r\n");
 const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");a.href=url;a.download="workforce-order-history.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
window.WorkforceOrderHistory=Object.freeze({open,exportCsv});
})();