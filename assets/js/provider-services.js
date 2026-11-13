(()=>{"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cash=v=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(v)||0);
let state=null,services=[],query="",category="all",request=0;
const $=id=>document.getElementById(id);
async function fetchRates(){
 const {data,error}=await state.supabase.functions.invoke("workforce-ctpa-provider-services",{body:{tenant_id:state.tenantId,operating_context:state.context}});
 if(error||data?.error)throw Error(data?.error||error.message||"Cannot load contracted rates");
 return data;
}
function render(){
 const categories=[...new Set(services.map(s=>s.category))].sort();
 const matched=services.filter(s=>(category==="all"||s.category===category)&&[s.name,s.category,s.code,s.description].join(" ").toLowerCase().includes(query.toLowerCase()));
 const priced=services.filter(s=>s.rate!==null).length,negotiated=services.filter(s=>s.rate_source==="contract").length;
 $("pageContent").innerHTML='<div class="provider-root"><section class="provider-intro"><div><small>WORKFORCE / SERVICE COMPENSATION</small><h2>Provider Services & Rates</h2><p>These are the rates Workforce has assigned to your C/TPA for services you perform on our behalf. This is not the price you pay for drug and alcohol testing.</p></div><span class="provider-context">'+(state.context==="dot"?"DOT":"NON-DOT")+' WORKSPACE</span></section><section class="provider-stats"><article><small>Available services</small><strong>'+services.length+'</strong></article><article><small>Assigned payout rates</small><strong>'+priced+'</strong></article><article><small>Individual contract rates</small><strong>'+negotiated+'</strong></article></section><section class="provider-panel"><div class="provider-controls"><input type="search" id="providerSearch" placeholder="Search mobile collection, blood draw, DNA…" value="'+esc(query)+'"><select id="providerCategory"><option value="all">All service categories</option>'+categories.map(c=>'<option value="'+esc(c)+'"'+(category===c?' selected':'')+'>'+esc(c)+'</option>').join("")+'</select></div>'+(matched.length?'<div class="provider-table-wrap"><table><thead><tr><th>Service</th><th>Category</th><th>Payment basis</th><th>Workforce pays C/TPA</th><th>Rate type</th></tr></thead><tbody>'+matched.map(s=>'<tr><td><strong>'+esc(s.name)+'</strong><small>'+esc(s.description)+'</small></td><td>'+esc(s.category)+'</td><td>'+esc(s.unit)+'</td><td><strong>'+(s.rate===null?"Rate pending":cash(s.rate))+'</strong></td><td><span class="provider-chip">'+(s.rate_source==="contract"?"Negotiated":s.rate_source==="default"?"Standard payout":"Pending")+'</span></td></tr>').join("")+'</tbody></table></div>':'<div class="provider-empty"><strong>No published services yet</strong><p>Workforce Management will publish approved service compensation rates for your C/TPA here.</p></div>')+'</section><p class="provider-note">Rates are managed by Workforce. Your service compensation may differ from customer testing prices, and published rates do not by themselves authorize an assignment or guarantee payment.</p></div>';
 $("providerSearch").oninput=e=>{query=e.target.value;const pos=e.target.selectionStart;render();$("providerSearch").focus();$("providerSearch").setSelectionRange(pos,pos)};
 $("providerCategory").onchange=e=>{category=e.target.value;render()};
}
async function open(ctx){
 state=ctx;const seq=++request;
 $("pageContent").innerHTML='<div class="provider-loading">Loading provider service rates…</div>';
 try{const data=await fetchRates();if(seq!==request||!ctx.active())return;services=data.services||[];render()}
 catch(err){if(seq!==request||!ctx.active())return;$("pageContent").innerHTML='<section class="provider-error"><h2>Provider rates unavailable</h2><p>'+esc(err.message)+'</p><button class="btn secondary" id="providerRetry">Retry</button></section>';$("providerRetry").onclick=()=>void open(ctx)}
}
function exportCsv(){
 const rows=[["Service","Category","Unit","Workforce payout","Rate source"],...services.map(s=>[s.name,s.category,s.unit,s.rate??"",s.rate_source])],csv=rows.map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\r\n");
 const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="workforce-ctpa-provider-services.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
window.WorkforceProviderServices=Object.freeze({open,exportCsv});
})();