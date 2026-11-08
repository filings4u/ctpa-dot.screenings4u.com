(async()=>{'use strict';
const status=document.getElementById('handoffStatus');
const HOME='https://workforceapps.screenings4u.com/selector.html';
const C=window.PORTAL_CONFIG;
const setStatus=text=>{if(status)status.textContent=text};
const original=new URL(location.href);
const code=original.searchParams.get('code')||'';
// Remove the one-time code from history immediately; never put session tokens in a URL.
history.replaceState(null,'','/auth-handoff.html');
try{
 if(!C?.workforceUrl||!C?.workforceKey||!window.S4UGetSupabaseClient)throw Error('Workforce portal is not configured.');
 if(!/^[0-9a-f]{64}$/i.test(code))throw Error('This portal link is missing or expired. Return to Workforce to select your portal.');
 const response=await fetch(C.workforceUrl+'/functions/v1/portal-session-handoff',{
  method:'POST',
  headers:{'Content-Type':'application/json',apikey:C.workforceKey},
  body:JSON.stringify({action:'redeem',code}),
  cache:'no-store'
 });
 const data=await response.json().catch(()=>({}));
 if(!response.ok||!data.token_hash||data.target_surface!=='dot'||data.target_portal!=='ctpa_dot')
  throw Error(data.error||'This C/TPA portal transfer is not valid.');
 setStatus('Confirming your authorized Workforce session…');
 const sb=window.S4UGetSupabaseClient();
 const verify=await sb.auth.verifyOtp({token_hash:data.token_hash,type:'magiclink'});
 if(verify.error||!verify.data?.session)throw Error('Your secure sign-in could not be completed. Return to Workforce and select the portal again.');
 const session=verify.data.session;
 const url=new URL(String(data.next_path||'/workspace.html'),location.origin);
 if(url.origin!==location.origin||!['/workspace.html','/dashboard.html'].includes(url.pathname))
  throw Error('Unrecognized C/TPA workspace destination.');
 // Use only server-supplied workspace identifiers. Validate them AGAIN against the
 // C/TPA session service before entering the dashboard.
 const ctpa=url.searchParams.get('ctpa_id')||'';
 const sub=url.searchParams.get('subscription_id')||'';
 const membership=url.searchParams.get('membership_id')||'';
 const isUuid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
 if(ctpa&&sub&&isUuid(ctpa)&&isUuid(sub)){
  setStatus('Opening your assigned C/TPA workspace…');
  const r=await fetch(C.workforceUrl+'/functions/v1/ctpa-dot/session?forceFunctionRegion=ca-central-1',{
   method:'POST',
   headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token,apikey:C.workforceKey},
   body:JSON.stringify({ctpa_id:ctpa,subscription_id:sub}),
   cache:'no-store'
  });
  const d=await r.json().catch(()=>({}));
  if(d.checkout_required&&d.checkout_url){
   // This URL comes from the subscription service, not a user-supplied query parameter.
   const checkout=new URL(d.checkout_url,location.origin);
   if(checkout.protocol==='https:'&&checkout.hostname.endsWith('.screenings4u.com')){location.replace(checkout.href);return}
   throw Error('Subscription renewal required. Return to Workforce for assistance.');
  }
  if(!r.ok||!d.ok)throw Error(d.error||'This C/TPA subscription is not currently available.');
  const actualCtpa=d.ctpa?.id,actualSub=d.subscription?.id;
  if(String(actualCtpa)!==ctpa||String(actualSub)!==sub)throw Error('Your selected C/TPA subscription could not be verified.');
  const W=window.S4UCTPAWorkspace;
  if(!W)throw Error('C/TPA workspace configuration is unavailable.');
  const saved=W.set({
   user_id:session.user.id,
   ctpa_id:actualCtpa,
   subscription_id:actualSub,
   organization_id:d.organization?.id||null,
   membership_id:d.membership?.id||(isUuid(membership)?membership:null),
   plan_code:d.plan?.code||null,
   plan_name:d.plan?.name||null,
   organization_name:d.organization?.dba_name||d.organization?.legal_name||null
  });
  try{sessionStorage.setItem('s4u_ctpa_dot_verified_ctx_v2',JSON.stringify({
   saved_at:Date.now(),user_id:session.user.id,
   ctpa_id:saved.ctpa_id,subscription_id:saved.subscription_id,ctx:d
  }))}catch(_){}
  location.replace('/dashboard.html');return;
 }
 // For accounts without a selected subscription, the EXISTING authenticated
 // organization chooser resolves the correct membership (no password prompt).
 location.replace('/workspace.html');
}catch(e){
 setStatus(e instanceof Error?e.message:'Unable to open your assigned portal.');
 const action=document.querySelector('.login-card a');
 if(action){action.hidden=false;action.href=HOME;action.textContent='Return to Workforce portal selector'}
}
})();