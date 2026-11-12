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
const filterTrigger=document.querySelector('#wfc-filter-trigger');
const filterOptions=document.querySelector('#wfc-filter-options');
const filterValue=document.querySelector('#wfc-filter-value');
const filterButtons=[...document.querySelectorAll('.wfc-filter-option')];
const backToTop=document.querySelector('#wfc-back-to-top');
let filterMode='included';
function setFilterOpen(open){
 filterOptions.hidden=!open;
 filterTrigger.setAttribute('aria-expanded',String(open));
}
filterTrigger.addEventListener('click',()=>setFilterOpen(filterOptions.hidden));
filterButtons.forEach(button=>button.addEventListener('click',()=>{
 filterMode=button.dataset.filter;
 filterValue.textContent=button.querySelector('span').textContent;
 filterButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 setFilterOpen(false);filterTrigger.focus();paint();
}));
document.addEventListener('pointerdown',event=>{
 if(!event.target.closest('.wfc-filter-menu'))setFilterOpen(false);
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!filterOptions.hidden){setFilterOpen(false);filterTrigger.focus();}
 if(event.key==='ArrowDown'&&document.activeElement===filterTrigger){event.preventDefault();setFilterOpen(true);(filterButtons.find(b=>b.getAttribute('aria-pressed')==='true')||filterButtons[0]).focus();}
 if((event.key==='ArrowDown'||event.key==='ArrowUp')&&filterButtons.includes(document.activeElement)){
  event.preventDefault();const pos=filterButtons.indexOf(document.activeElement);filterButtons[(pos+(event.key==='ArrowDown'?1:-1)+filterButtons.length)%filterButtons.length].focus();
 }
});
function updateBackToTop(){backToTop.hidden=window.scrollY<320;}
window.addEventListener('scroll',updateBackToTop,{passive:true});
backToTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
updateBackToTop();
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
const nondotLinks={
 employee_management:'/nondot-workspace.html?section=people',
 programs:'/nondot-workspace.html?section=programs',
 consortium_pools:'/nondot-workspace.html?section=pools',
 testing_orders:'/nondot-workspace.html?section=testing',
 results_sensitive:'/nondot-workspace.html?section=results'
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
 const mode=filterMode;
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
   // DOT writes continue through the C/TPA backend. NON-DOT links open
   // read-only, independently authorized modules until their write APIs are migrated.
   const route=active==='dot'?dotLinks[f.code]:nondotLinks[f.code];
   if(f.enabled&&route){
    const action=el('a','wfc-link',active==='dot'?'Open tool':'View NON-DOT records');
    action.href=route;
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
  if(!workspace?.ctpa_id||!workspace?.subscription_id)throw Error('Select your authorized C/TPA subscription first.');
  // The combined API validates the exact selected C/TPA subscription, company membership,
  // and NON-DOT membership/revocation independently. Never infer access from tier names.
  const combinedResponse=await fetch(C.workforceUrl+'/functions/v1/workforce-ctpa-combined-access',{
   method:'POST',headers:{'Content-Type':'application/json',apikey:C.workforceKey,Authorization:'Bearer '+session.access_token},
   body:JSON.stringify({ctpa_id:workspace.ctpa_id,subscription_id:workspace.subscription_id}),cache:'no-store'
  });
  const combined=await combinedResponse.json().catch(()=>({}));
  if(requestId!==generation)return;
  if(!combinedResponse.ok||combined.authorized!==true)throw Error(combined.error||combined.reason||'Unable to verify combined C/TPA access.');
  const context=combined.operating_contexts?.[surface];
  if(!context?.available){
   accessible=false;
   tier.textContent=combined.plan?.name||'C/TPA Subscription';
   message('This operating context is not yet linked to an independently verified active subscription. Workforce management must complete the migration before it can be opened.',true);
   paint();return;
  }
  const validCodes=new Set(Array.isArray(context.feature_codes)?context.feature_codes:[]);
  const response=await fetch(C.workforceUrl+'/functions/v1/workforce-ctpa-unified-entitlements',{
   method:'POST',headers:{'Content-Type':'application/json',apikey:C.workforceKey,Authorization:'Bearer '+session.access_token},
   body:JSON.stringify({surface,organization_id:combined.ownership?.organization_id,ctpa_id:context.ctpa_id||undefined}),cache:'no-store'
  });
  const data=await response.json().catch(()=>({}));
  if(requestId!==generation)return;
  if(!response.ok||data.available!==true)throw Error(data.error||data.reason||'Could not load the operating context catalog.');
  accessible=true;
  // The catalog provides labels only. Its enabled flags never override the actual
  // verified surface grants returned from the combined access check.
  allFeatures=(Array.isArray(data.features)?data.features:[]).map(f=>({...f,enabled:validCodes.has(f.code)}));
  tier.textContent=combined.plan?.name||'C/TPA Subscription';
  available.textContent=String(allFeatures.filter(f=>f.enabled).length);
  unavailable.textContent=String(allFeatures.filter(f=>!f.enabled).length);
  message('Verified '+(active==='dot'?'DOT':'NON-DOT')+' access for your selected C/TPA organization. Other operating contexts remain isolated.');
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

await select(new URLSearchParams(location.search).get('surface')==='nondot'?'nondot':'dot');
})();