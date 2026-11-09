(()=>{'use strict';
const endpoint='https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-new-entrant-payments';
const $=q=>document.querySelector(q);
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
let busy=false;
const current=()=>window.S4UCTPAWorkspace?.read?.()||{};
async function request(action,data={}){
 const session=(await window.Portal.sb.auth.getSession()).data?.session;
 if(!session?.access_token)throw Error('Your session expired. Sign in again to continue.');
 const ctpa_id=current().ctpa_id;
 if(!ctpa_id)throw Error('Please select your C/TPA workspace.');
 const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token,'apikey':window.PORTAL_CONFIG.workforceKey},body:JSON.stringify({action,ctpa_id,...data}),cache:'no-store'});
 const response=await res.json().catch(()=>({}));
 if(!res.ok||response.error)throw Error(response.error||'Secure payment could not be initialized.');
 return response;
}
function mountModal(product,auditId){
 const amount=product==='staff'?375:250;
 const title=product==='staff'?'Workforce Audit Preparation':'Unlimited New Entrant Audit Workspace';
 const overlay=document.createElement('div');overlay.className='nea-checkout-backdrop';overlay.id='neaPaymentOverlay';
 overlay.innerHTML='<section class="nea-checkout-modal" role="dialog" aria-modal="true" aria-label="Secure Workforce payment"><header class="nea-checkout-head"><div><small>WORKFORCE · SECURE PAYMENT</small><h2>'+title+'</h2><p>'+(product==='staff'?'If you want Workforce to complete an audit for you, a one-time fee of $375 will be required per audit. Your saved documents will be sent after payment.':'One-time $250 payment unlocks unlimited self-service New Entrant Audit files.')+'</p></div><button id="neaCheckoutClose" class="nea-checkout-close" type="button" aria-label="Close checkout">×</button></header><div class="nea-checkout-summary"><span>'+(product==='staff'?'One audit completed by Workforce':'Unlimited self-service access')+'</span><strong>'+money(amount)+'</strong></div><div class="nea-checkout-body"><div id="neaStripeElement"><p class="nea-checkout-loading">Loading secure Stripe payment…</p></div><p id="neaCheckoutMessage" class="nea-checkout-msg" role="status" aria-live="polite"></p><button type="button" class="btn primary nea-submit" id="neaConfirmPayment" disabled>Pay '+money(amount)+' securely</button><p class="nea-checkout-secure">Processed securely by Stripe. Workforce does not store your payment card details.</p></div></section>';
 document.body.appendChild(overlay);
 const close=()=>{if(overlay.isConnected)overlay.remove();document.removeEventListener('keydown',onKey);busy=false};
 const onKey=e=>{if(e.key==='Escape')close()};
 document.addEventListener('keydown',onKey);
 overlay.querySelector('#neaCheckoutClose').addEventListener('click',close);
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 const back=overlay.querySelector('#neaCheckoutClose');back.focus();
 return {overlay,close,amount,title,auditId,product};
}
async function success(view,result){
 const {overlay,product,close}=view;
 if(!overlay.isConnected)return;
 const message=product==='staff'?'Your $375 payment is confirmed. Workforce has received your audit-preparation request.':'Your $250 payment is confirmed. Unlimited audit preparation is now active.';
 overlay.querySelector('.nea-checkout-body').innerHTML='<div class="nea-checkout-success"><strong>Payment confirmed</strong><p>'+message+'</p><button type="button" class="btn primary" id="neaDone">Return to audit workspace</button></div>';
 overlay.querySelector('#neaDone').onclick=async()=>{close();await window.Portal.refresh()};
}
async function open(product,auditId){
 if(busy)return;
 if(product!=='addon'&&product!=='staff')return;
 if(product==='staff'&&!auditId){alert('Open an audit file first.');return}
 if(!window.Stripe){alert('Stripe failed to load. Refresh this page and try again.');return}
 busy=true;
 const view=mountModal(product,auditId);
 const {overlay}=view;
 const errors=message=>{const box=overlay.querySelector('#neaCheckoutMessage');if(box)box.textContent=message};
 try{
  const payload=auditId?{audit_id:auditId}:{};
  const start=await request(product==='staff'?'start_staff':'start_addon',payload);
  if(!overlay.isConnected)return;
  if(start.already_active||start.already_submitted){await success(view,start);return}
  if(start.already_paid){
   const verified=await request(product==='staff'?'confirm_staff':'confirm_addon',{...payload,payment_id:start.payment_id});
   await success(view,verified);return;
  }
  if(!start.publishable_key||!start.client_secret||!start.payment_id)throw Error('Payment provider did not return a secure checkout session.');
  const stripe=window.Stripe(start.publishable_key);
  const elements=stripe.elements({clientSecret:start.client_secret,appearance:{theme:'stripe',variables:{colorPrimary:'#01122F',colorText:'#01122F',colorBackground:'#fff',borderRadius:'9px',fontFamily:'Inter,Arial,sans-serif'}}});
  const payment=elements.create('payment',{layout:'accordion'});
  overlay.querySelector('#neaStripeElement').replaceChildren();
  const mount=document.createElement('div');overlay.querySelector('#neaStripeElement').append(mount);
  payment.mount(mount);
  const button=overlay.querySelector('#neaConfirmPayment');button.disabled=false;
  button.onclick=async()=>{
   if(button.disabled)return;
   button.disabled=true;
   errors('Verifying your payment…');
   try{
    const check=await elements.submit();if(check.error)throw Error(check.error.message);
    const back=new URL(location.href);
    back.searchParams.set('audit_payment',product);
    back.searchParams.set('payment_id',start.payment_id);
    if(auditId)back.searchParams.set('id',auditId);
    const response=await stripe.confirmPayment({elements,confirmParams:{return_url:back.href},redirect:'if_required'});
    if(response.error)throw Error(response.error.message||'Payment was not completed.');
    const verified=await request(product==='staff'?'confirm_staff':'confirm_addon',{...payload,payment_id:start.payment_id});
    if(!verified.paid)throw Error('Payment has not yet been confirmed.');
    await success(view,verified);
   }catch(error){errors(error.message||'Unable to complete payment.');button.disabled=false}
  };
  errors('');
 }catch(e){const holder=overlay.querySelector('#neaStripeElement');if(holder)holder.innerHTML='<p class="nea-checkout-error">Unable to load payment. Please verify your account and try again.</p>';errors(e.message||'Checkout unavailable');const pay=overlay.querySelector('#neaConfirmPayment');if(pay)pay.hidden=true}
}
async function resume(){
 const p=new URLSearchParams(location.search),product=p.get('audit_payment'),payment_id=p.get('payment_id');
 if(!['addon','staff'].includes(product)||!payment_id)return;
 if(busy)return;
 busy=true;
 const auditId=product==='staff'?p.get('id'):null;
 const view=mountModal(product,auditId);
 view.overlay.querySelector('#neaStripeElement').textContent='Verifying payment with Stripe…';
 try{
  const verified=await request(product==='staff'?'confirm_staff':'confirm_addon',{payment_id,...(auditId?{audit_id:auditId}:{})});
  if(!verified.paid)throw Error('The payment has not been verified.');
  const cleaned=new URL(location.href);cleaned.searchParams.delete('audit_payment');cleaned.searchParams.delete('payment_id');cleaned.searchParams.delete('payment_intent');cleaned.searchParams.delete('payment_intent_client_secret');cleaned.searchParams.delete('redirect_status');
  history.replaceState(history.state,'',cleaned.pathname+cleaned.search+cleaned.hash);
  await success(view,verified);
 }catch(e){view.overlay.querySelector('#neaStripeElement').innerHTML='<p class="nea-checkout-error">Your payment is being verified. If you were charged, do not pay again. Contact Workforce support with your payment reference.</p>';view.overlay.querySelector('#neaCheckoutMessage').textContent=e.message||'Unable to verify payment';view.overlay.querySelector('#neaConfirmPayment').hidden=true}
}
window.CtpaNewEntrantPayment={open,resume};
})();
