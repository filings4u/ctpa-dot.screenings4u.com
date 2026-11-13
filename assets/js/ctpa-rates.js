(()=>{"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cash=v=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(v)||0);
let ctx=null,rates=[],search="",category="all",sequence=0;
const $=id=>document.getElementById(id);
async function api(){
 const session=(await ctx.supabase.auth.getSession()).data?.session;
 if(!session?.access_token)throw Error("Sign in required");
 const r=await fetch("https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-ctpa-rate-sheet",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json","Authorization":"Bearer "+session.access_token,"apikey":"sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC"},body:JSON.stringify({tenant_id:ctx.tenantId,operating_context:ctx.context})});
 const d=await r.json().catch(()=>({}));if(!r.ok||d.error)throw Error(d.error||"Unable to load prices");return d;
}
function render(){
 const categories=[...new Set(rates.map(r=>r.category))].sort();
 const matches=rates.filter(r=>(category==="all"||r.category===category)&&[r.name,r.code,r.category].join(" ").toLowerCase().includes(search.toLowerCase()));
 const custom=rates.filter(r=>r.price_source==="custom").length,priced=rates.filter(r=>r.price!==null).length;
 $("pageContent").innerHTML='<div class="rates-page"><section class="rates-hero"><div><small>WORKFORCE / CONTRACT PRICING</small><h2>Your C/TPA Price List</h2><p>View testing and occupational health rates assigned to your organization by Workforce Testing. Rates are managed by Workforce staff.</p></div><span>'+esc(ctx.context==="dot"?"DOT":"NON-DOT")+' PRICING</span></section><div class="rates-stats"><div><small>Available services</small><strong>'+rates.length+'</strong></div><div><small>Priced services</small><strong>'+priced+'</strong></div><div><small>Custom negotiated rates</small><strong>'+custom+'</strong></div></div><section class="rates-panel"><div class="rates-toolbar"><input id="ratesSearch" type="search" placeholder="Search testing and physical services" value="'+esc(search)+'"><select id="ratesCategory"><option value="all">All service categories</option>'+categories.map(c=>'<option value="'+esc(c)+'"'+(c===category?" selected":"")+'>'+esc(c)+'</option>').join("")+'</select></div>'+(matches.length?'<div class="rates-scroll"><table><thead><tr><th>Service</th><th>Category</th><th>Code</th><th>Assigned rate</th><th>Pricing source</th></tr></thead><tbody>'+matches.map(r=>'<tr><td><strong>'+esc(r.name)+'</strong><small>'+esc(r.description||"")+'</small></td><td>'+esc(r.category)+'</td><td>'+esc(r.code||"—")+'</td><td><strong>'+(r.price===null?"Contact Workforce":cash(r.price))+'</strong></td><td><span class="rates-status">'+(r.price_source==="custom"?"Contract rate":r.price_source==="unpriced"?"Awaiting rate":"Standard rate")+'</span></td></tr>').join("")+'</tbody></table></div>':'<div class="rates-empty">No matching services available.</div>')+'</section><p class="rates-disclaimer">Rates are specific to the selected C/TPA workspace. Staff pricing changes do not alter the public service catalog.</p></div>';
 $("ratesCategory").onchange=e=>{category=e.target.value;render()};
 $("ratesSearch").oninput=e=>{search=e.target.value;const pos=e.target.selectionStart;render();$("ratesSearch").focus();$("ratesSearch").setSelectionRange(pos,pos)};
}
async function open(value){
 ctx=value;const seq=++sequence;$("pageContent").innerHTML='<div class="rates-loading">Loading your assigned rate sheet…</div>';
 try{const d=await api();if(seq!==sequence||!ctx.active())return;rates=d.rates||[];render()}
 catch(e){if(seq!==sequence||!ctx.active())return;$("pageContent").innerHTML='<section class="rates-error"><h2>Price list unavailable</h2><p>'+esc(e.message)+'</p><button class="btn secondary" id="rateRetry">Retry</button></section>';$("rateRetry").onclick=()=>void open(value)}
}
function exportCsv(){
 const rows=[["Service","Category","Code","Assigned price","Price type"],...rates.map(r=>[r.name,r.category,r.code,r.price??"",r.price_source])];
 const csv=rows.map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\r\n"),url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
 const a=document.createElement("a");a.href=url;a.download="workforce-ctpa-price-list.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
window.WorkforceRateSheet=Object.freeze({open,exportCsv});
})();