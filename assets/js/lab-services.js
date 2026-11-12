(()=>{
'use strict';
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const tag=(s)=>String(s||"pending").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
const date=(s)=>s&&!Number.isNaN(Date.parse(s))?new Date(s).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):"—";
const track=(carrier,number)=>{
 const c=String(carrier||"").toLowerCase().replace(/[^a-z]/g,""),n=String(number||"").trim();
 if(!/^[a-zA-Z0-9]{6,80}$/.test(n))return null;
 const v=encodeURIComponent(n);
 if(c==="ups")return "https://www.ups.com/track?loc=en_US&tracknum="+v;
 if(c==="fedex"||c==="federalexpress")return "https://www.fedex.com/fedextrack/?trknbr="+v;
 if(c==="usps")return "https://tools.usps.com/go/TrackConfirmAction.action?tLabels="+v;
 return null;
};
const card=(label,value)=>'<div class="metric"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong></div>';
function render(d){
 if(d?.authorized!==true)return '<section class="panel"><h2>Lab Account access unavailable</h2><p>Your company must have an active purchased Lab Account add-on.</p></section>';
 const accounts=d.lab_accounts||[],intakes=d.setup_records||[],shipments=d.shipments||[];
 return '<div class="lab-migration-hub">'+
 '<section class="section"><div class="panel-head"><div><h2>Laboratory Account</h2><p>Laboratory accounts and shipments belonging to this C/TPA organization. This view is read-only during the migration.</p></div></div>'+
 '<div class="metrics">'+card("Laboratory accounts",accounts.length)+card("Account setup records",intakes.length)+card("Supply shipments",shipments.length)+'</div></section>'+
 '<section class="section"><h2>Assigned laboratories</h2>'+
 (accounts.length?accounts.map(a=>'<div class="panel"><div class="panel-head"><h3>'+esc(a.lab_name||"Laboratory")+'</h3><span class="badge '+(a.status==="active"?"good":"warn")+'">'+esc(tag(a.status))+'</span></div><div class="lab-migration-grid">'+[['Primary',a.is_primary?'Yes':'No'],['DOT account',a.account_numbers?.dot],['NON-DOT account',a.account_numbers?.non_dot],['Hair',a.account_numbers?.hair],['Oral',a.account_numbers?.oral]].map(([k,v])=>'<div><small>'+esc(k)+'</small><strong>'+esc(v||'Not configured')+'</strong></div>').join('')+'</div></div>').join(''):'<div class="panel">No laboratory numbers are assigned to this C/TPA yet.</div>')+'</section>'+
 '<section class="section"><h2>Setup and activation</h2>'+
 (intakes.length?intakes.map(i=>'<div class="panel lab-migration-row"><div><strong>'+esc(i.order_number||"Lab Account setup")+'</strong><small>Requested '+date(i.created_at)+'</small></div><span class="badge">'+esc(tag(i.account_status||i.status))+'</span></div>').join(''):'<div class="panel">No verified legacy purchase has been linked to this organization yet.</div>')+'</section>'+
 '<section class="section"><h2>Physical supply shipment tracking</h2>'+
 (shipments.length?shipments.map(s=>{const href=track(s.carrier,s.tracking_number);return '<div class="panel lab-migration-row"><div><strong>'+esc(s.items_description||"Laboratory supplies")+'</strong><small>'+esc(s.carrier||"Carrier pending")+' · '+esc(s.tracking_number||"Tracking pending")+'</small><small>Created '+date(s.created_at)+'</small></div><div><span class="badge">'+esc(tag(s.status))+'</span>'+(href?'<a class="btn ghost" target="_blank" rel="noopener noreferrer" href="'+esc(href)+'">Track package</a>':'')+'</div></div>'}).join(''):'<div class="panel">Shipment tracking appears when Workforce management assigns supplies to a verified Lab Account purchase.</div>')+'</section>'+
 '<section class="notice"><strong>Migration in progress</strong><p>Original C/TPA testing, results, consortium, and billing features remain unchanged. Laboratory orders, donor passes, and customer documents will be added only after company entitlement and records mapping are verified.</p></section></div>';
}
window.CtpaLabServices=Object.freeze({render});
})();