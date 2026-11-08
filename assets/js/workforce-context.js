(async()=>{'use strict';
const C=window.PORTAL_CONFIG;
const status=document.querySelector('#wfc-status'),features=document.querySelector('#wfc-features');
const title=document.querySelector('#wfc-title'),tier=document.querySelector('#wfc-tier'),count=document.querySelector('#wfc-count');
const tabDot=document.querySelector('#wfc-dot'),tabNon=document.querySelector('#wfc-nondot');
if(!C?.workforceUrl||!C?.workforceKey||!window.S4UGetSupabaseClient){status.textContent='Portal configuration unavailable.';status.className='error';return}
const sb=window.S4UGetSupabaseClient();
const ses=await sb.auth.getSession();
if(!ses.data.session){location.replace('https://workforceapps.screenings4u.com/');return}
let active='dot',generation=0;
const dotLinks={
 employer_management:'/employers.html',employee_management:'/people.html',programs:'/programs.html',consortium_pools:'/pools.html',
 random_selections:'/selections.html',testing_orders:'/testing.html',results_summary:'/results.html',compliance:'/compliance.html',
 documents:'/documents.html',standard_reports:'/reports.html',advanced_reports:'/reports.html',notifications:'/notifications.html',
 client_invoicing:'/employer-billing.html',billing_tools:'/billing.html',integrations:'/integrations.html',team_users:'/users-roles.html',
 locations:'/locations.html',audit_history:'/audit-history.html',branded_portals:'/branding.html',white_label:'/branding.html',
 policy_builder:'/compliance.html',clearinghouse_tools:'/compliance.html',results_sensitive:'/results.html'
};
function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n}
function message(t,err=false){status.textContent=t;status.classList.toggle('error',err)}
function setButtons(){tabDot.setAttribute('aria-pressed',String(active==='dot'));tabNon.setAttribute('aria-pressed',String(active==='nondot'));title.textContent=active==='dot'?'DOT features & tools':'NON-DOT features & tools'}
async function select(surface){
 active=surface;setButtons();features.replaceChildren();tier.textContent='Verifying subscription…';count.textContent='';message('Verifying your subscription and permissions…');
 const requestId=++generation;
 try{
  const {data:{session}}=await sb.auth.getSession();if(!session)throw Error('Session expired. Please sign in through Workforce.');
  const w=window.S4UCTPAWorkspace?.read?.();
  const r=await fetch(C.workforceUrl+'/functions/v1/workforce-ctpa-unified-entitlements',{
   method:'POST',headers:{'Content-Type':'application/json',apikey:C.workforceKey,Authorization:'Bearer '+session.access_token},
   body:JSON.stringify({surface,organization_id:w?.organization_id||undefined}),cache:'no-store'
  });
  const d=await r.json().catch(()=>({}));
  if(requestId!==generation)return;
  if(!r.ok)throw Error(d.error||'Unable to verify subscription.');
  if(!d.available){tier.textContent='No active access';message(d.reason||'No C/TPA subscription assigned to this organization.',true);return}
  tier.textContent=d.plan?.name||'C/TPA Subscription';
  const arr=Array.isArray(d.features)?d.features:[];
  count.textContent=arr.filter(x=>x.enabled).length+' of '+arr.length+' features active';
  message('Verified '+(surface==='dot'?'DOT':'NON-DOT')+' subscription access for your assigned organization.');
  let lastCategory='';
  for(const f of arr){
   if(f.category!==lastCategory){lastCategory=f.category;features.append(el('h3','wfc-group',lastCategory||'Other'))}
   const card=el('article','wfc-feature'+(f.enabled?'':' locked'));
   const name=el('h3','',f.name||f.code);
   const desc=el('p','',f.description||'');
   const badge=el('span','wfc-badge',f.enabled?'Included in your plan':'Not included');
   card.append(name,desc,badge);
   // DOT tools reuse currently secured existing pages. NON-DOT tools are not linked
   // until the corresponding backend route has been migrated into this hostname.
   if(surface==='dot'&&f.enabled&&dotLinks[f.code]){
    const link=el('a','wfc-link','Open tool');link.href=dotLinks[f.code];card.append(link)
   }
   features.append(card);
  }
 }catch(e){if(requestId!==generation)return;tier.textContent='Access unavailable';message(e?.message||'Subscription verification failed',true)}
}
tabDot.addEventListener('click',()=>select('dot'));
tabNon.addEventListener('click',()=>select('nondot'));
const q=new URLSearchParams(location.search).get('surface');
await select(q==='nondot'?'nondot':'dot');
})();