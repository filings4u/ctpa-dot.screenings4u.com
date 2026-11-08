(async()=>{'use strict';
const C=window.PORTAL_CONFIG;
const status=document.querySelector('#wfc-status');
const features=document.querySelector('#wfc-features');
const title=document.querySelector('#wfc-title');
const tier=document.querySelector('#wfc-tier');
const count=document.querySelector('#wfc-count');
const tabDot=document.querySelector('#wfc-dot');
const tabNon=document.querySelector('#wfc-nondot');
const search=document.querySelector('#wfc-search');
const filter=document.querySelector('#wfc-filter');
const available=document.querySelector('#wfc-available');
const unavailable=document.querySelector('#wfc-unavailable');
const current=document.querySelector('#wfc-current');
const empty=document.querySelector('#wfc-empty');
function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;}
function message(text,isError=false){status.textContent=text;status.classList.toggle('error',isError);}
const dotLinks={
 employer_management:'/employers.html',employee_management:'/people.html',programs:'/programs.html',
 consortium_pools:'/pools.html',random_selections:'/selections.html',testing_orders:'/testing.html',
 results_summary:'/results.html',compliance:'/compliance.html',documents:'/documents.html',
 standard_reports:'/reports.html',advanced_reports:'/reports.html',notifications:'/notifications.html',
 client_invoicing:'/employer-billing.html',billing_tools:'/billing.html',integrations:'/integrations.html',
 team_users:'/users-roles.html',locations:'/locations.html',audit_history:'/audit-history.html',
 branded_portals:'/branding.html',white_label:'/branding.html',policy_builder:'/compliance.html',
 clearinghouse_tools:'/compliance.html',results_sensitive:'/results.html',branded_email:'/branding.html',
 collection_sites:'/testing.html',enrollment_documents:'/documents.html'
};
if(!C?.workforceUrl||!C?.workforceKey||!window.S4UGetSupabaseClient){
 message('Portal configuration unavailable.',true);return;
}
const sb=window.S4UGetSupabaseClient();
const {data:initial,error:initialError}=await sb.auth.getSession();
if(initialError||!initial.session){location.replace('https://workforceapps.screenings4u.com/');return;}
let active='dot',generation=0,allFeatures=[],accessible=false;
function setButtons(){
 tabDot.setAttribute('aria-pressed',String(active==='dot'));
 tabNon.setAttribute('aria-pressed',String(active==='nondot'));
 title.textContent=active==='dot'?'DOT features & tools':'NON-DOT features & tools';
 current.textContent=active==='dot'?'DOT':'NON-DOT';
}
function paint(){
 features.replaceChildren();
 const query=search.value.trim().toLowerCase();
 const mode=filter.value;
 const matching=accessible?allFeatures.filter(f=>{
  const allowed=mode==='all'||(mode==='included'?f.enabled:!f.enabled);
  const text=[f.name,f.code,f.category,f.description].filter(Boolean).join(' ').toLowerCase();
  return allowed&&(!query||text.includes(query));
 }):[];
 const groups=new Map();
 for(const feature of matching){
  const category=String(feature.category||'Other');
  if(!groups.has(category))groups.set(category,[]);
  groups.get(category).push(feature);
 }
 for(const [category,items] of groups){
  const section=el('section','wfc-category');
  const head=el('div','wfc-category-heading');
  head.append(el('h3','wfc-category-title',category));
  head.append(el('span','wfc-category-count',items.length+' feature'+(items.length===1?'':'s')));
  section.append(head);
  const grid=el('div','wfc-category-grid');
  for(const f of items){
   const card=el('article','wfc-feature'+(f.enabled?'':' locked'));
   const top=el('div','wfc-feature-head');
   top.append(el('h3','',f.name||f.code));
   const badge=el('span','wfc-badge',f.enabled?'Included':'Not included');
   top.append(badge);
   card.append(top,el('p','',f.description||'Feature of the Workforce C/TPA plan.'));
   // Existing DOT routes are protected by their own verified server session.
   // NON-DOT actions are not offered until migrated into this hostname.
   if(active==='dot'&&f.enabled&&dotLinks[f.code]){
    const action=el('a','wfc-link','Open tool');
    action.href=dotLinks[f.code];
    card.append(action);
   }
   grid.append(card);
  }
  section.append(grid);features.append(section);
 }
 empty.hidden=matching.length!==0;
 count.textContent=matching.length+' shown';
}
async function select(surface){
 active=surface;setButtons();allFeatures=[];accessible=false;paint();
 tier.textContent='Verifying subscription…';
 available.textContent='—';unavailable.textContent='—';
 message('Checking your subscription and feature permissions…');
 const requestId=++generation;
 try{
  const {data:{session}}=await sb.auth.getSession();
  if(!session)throw Error('Session expired. Please sign in through Workforce.');
  const workspace=window.S4UCTPAWorkspace?.read?.();
  const response=await fetch(C.workforceUrl+'/functions/v1/workforce-ctpa-unified-entitlements',{
   method:'POST',headers:{'Content-Type':'application/json',apikey:C.workforceKey,Authorization:'Bearer '+session.access_token},
   body:JSON.stringify({surface,organization_id:workspace?.organization_id||undefined}),cache:'no-store'
  });
  const data=await response.json().catch(()=>({}));
  if(requestId!==generation)return;
  if(!response.ok)throw Error(data.error||'Unable to verify your subscription.');
  if(!data.available){
   tier.textContent='No active access';
   message(data.reason||'No active C/TPA subscription found.',true);
   paint();return;
  }
  accessible=true;
  allFeatures=Array.isArray(data.features)?data.features:[];
  tier.textContent=data.plan?.name||'C/TPA Subscription';
  available.textContent=String(allFeatures.filter(f=>f.enabled).length);
  unavailable.textContent=String(allFeatures.filter(f=>!f.enabled).length);
  message('Access verified for your '+(active==='dot'?'DOT':'NON-DOT')+' programs.');
  paint();
 }catch(error){
  if(requestId!==generation)return;
  accessible=false;allFeatures=[];tier.textContent='Access unavailable';
  message(error?.message||'Subscription verification failed.',true);paint();
 }
}
tabDot.addEventListener('click',()=>select('dot'));
tabNon.addEventListener('click',()=>select('nondot'));
search.addEventListener('input',paint);
filter.addEventListener('change',paint);
await select(new URLSearchParams(location.search).get('surface')==='nondot'?'nondot':'dot');
})();