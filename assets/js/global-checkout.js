(()=>{'use strict';
const C=window.PORTAL_CONFIG||{};let db=null,stripe=null,elements=null,paymentElement=null,payment=null,ctx=null;
const $=id=>document.getElementById(id),money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v||0)),fmt=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d)},esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
document.addEventListener('DOMContentLoaded',init);
async function init(){try{db=window.S4UGetSupabaseClient?window.S4UGetSupabaseClient():null;if(!db)throw Error('Supabase client not found.');const {data}=await db.auth.getSession();if(!data?.session?.user){location.replace('https://workforceapps.screenings4u.com/');return}const q=new URLSearchParams(location.search),mode=q.get('mode')||'renew';if(mode==='new_entrant')return initNewEntrant(q);if(mode==='invoice')return initInvoice(q);if(mode==='feature')return initFeature(q);if(mode==='order')return initOrder(q);if(mode==='supplies')return initSupplies(q);await initRenewal(q);}catch(e){msg(e.message||'Unable to initialize checkout.','error')}}
async function invoke(name,body={}){const {data:{session}}=await db.auth.getSession();if(!session)throw Error('Authentication required.');const r=await fetch(`${C.workforceUrl}/functions/v1/${name}`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`,'apikey':C.workforceKey},body:JSON.stringify(window.S4UCTPAPayload?window.S4UCTPAPayload(body):body)});const d=await r.json().catch(()=>({}));if(!r.ok||d.error)throw Error(d.error||`Request failed (${r.status}).`);return d}
async function initRenewal(q){ctx=await invoke('global-checkout-actions',{action:'context',subscription_id:q.get('subscription_id')||undefined,portal_code:C.portalCode});const s=ctx.subscription||{},p=ctx.plan||{},org=ctx.organization||ctx.ctpa||ctx.employer||{};$('pageTitle').textContent='Renew Subscription';$('pageText').textContent='Review the current subscription and complete the renewal securely.';$('summaryType').textContent='Subscription Renewal';$('summaryAccount').textContent=org.dba_name||org.legal_name||org.name||'Account';$('summaryRef').textContent=s.order_reference||String(s.id||'').slice(0,12)||'—';$('summaryTotal').textContent=money(ctx.base_amount);$('accountDetails').innerHTML=details([['Plan',p.name||p.code],['Status',s.status],['Billing',s.billing_frequency||p.billing_model?.frequency||'Monthly'],['Started',fmt(s.start_date)],['Current renewal',fmt(s.renewal_date||s.stripe_current_period_end)],['Account type',ctx.account_type]]);$('lineItems').innerHTML=`<div class="line"><div><strong>${esc(p.name||'DOT Subscription')}</strong><span>${esc(p.description||'Software subscription renewal')}</span></div><div class="amount">${money(ctx.base_amount)}</div></div>`;$('payButton').disabled=false;$('payButton').textContent=`Renew for ${money(ctx.base_amount)}`;$('payButton').onclick=prepareRenewal;}
async function prepareRenewal(){const b=$('payButton');b.disabled=true;try{msg('Preparing secure payment…','ok');const d=await invoke('global-checkout-actions',{action:'prepare_subscription_renewal',subscription_id:ctx.subscription.id,portal_code:C.portalCode});payment=d.payment;stripe=window.Stripe(d.publishable_key);elements=stripe.elements({clientSecret:d.client_secret});paymentElement=elements.create('payment',{layout:'tabs'});$('paymentHost').innerHTML='<div id="paymentElement"></div><button class="pay" id="submitPayment">Pay & Renew Subscription</button>';paymentElement.mount('#paymentElement');$('submitPayment').onclick=submitRenewal;b.style.display='none';msg('Secure payment is ready.','ok')}catch(e){b.disabled=false;msg(e.message||'Unable to prepare payment.','error')}}
async function submitRenewal(){const b=$('submitPayment');b.disabled=true;$('paymentError').textContent='';try{if(elements.submit){const s=await elements.submit();if(s?.error)throw s.error}const r=await stripe.confirmPayment({elements,redirect:'if_required',confirmParams:{return_url:location.href}});if(r.error)throw r.error;const d=await invoke('global-checkout-actions',{action:'confirm_subscription_renewal',subscription_id:ctx.subscription.id,payment_id:payment.id,portal_code:C.portalCode});$('paymentHost').innerHTML=`<div class="complete">Payment completed. Subscription renewed through ${esc(fmt(d.subscription?.renewal_date))}.</div>`;$('summaryRef').textContent=d.payment?.id?.slice(0,12)||$('summaryRef').textContent;msg('Subscription renewal completed successfully.','ok')}catch(e){$('paymentError').textContent=e.message||'Payment failed.';b.disabled=false}}
async function initInvoice(q){const id=q.get('invoice_id')||q.get('id'),token=q.get('token');if(!id)throw Error('Invoice id is required.');const d=token?await invoke('invoice-checkout-actions',{action:'get',id,token}):await invoke('global-checkout-actions',{action:'get_invoice',invoice_id:id,portal_code:C.portalCode});const i=d.invoice||{};const payable=Number(i.amount_due||0)>0&&['open','past_due'].includes(String(i.status||'').toLowerCase());$('pageTitle').textContent=`Pay Invoice ${i.invoice_number||''}`;$('pageText').textContent='Review and pay this Workforce invoice securely.';$('summaryType').textContent='Invoice';$('summaryAccount').textContent=i.customer_name||i.company_name||i.customer_email||'Customer';$('summaryRef').textContent=i.invoice_number||i.id?.slice(0,12)||'—';$('summaryTotal').textContent=money(i.amount_due);$('accountDetails').innerHTML=details([['Invoice',i.invoice_number],['Status',i.status],['Issued',fmt(i.issued_at||i.created_at)],['Due',fmt(i.due_at)],['Email',i.customer_email],['Currency',i.currency||'USD']]);$('lineItems').innerHTML=(i.items||[]).map(x=>`<div class="line"><div><strong>${esc(x.description||'Invoice item')}</strong><span>Qty ${esc(x.quantity||1)}</span></div><div class="amount">${money(Number(x.amount||x.unit_amount||0)*Number(x.quantity||1))}</div></div>`).join('')||`<div class="line"><div><strong>Invoice balance</strong></div><div class="amount">${money(i.amount_due)}</div></div>`;$('payButton').disabled=!payable;$('payButton').textContent=payable?`Pay ${money(i.amount_due)}`:'Invoice not payable';if(!payable)msg('This invoice is not currently eligible for payment.','error');$('payButton').onclick=async()=>{const p=token?await invoke('invoice-checkout-actions',{action:'create_payment',id,token}):await invoke('global-checkout-actions',{action:'prepare_invoice_payment',invoice_id:id,portal_code:C.portalCode});payment=p.payment||null;stripe=window.Stripe(p.publishableKey||p.publishable_key);elements=stripe.elements({clientSecret:p.clientSecret||p.client_secret});paymentElement=elements.create('payment',{layout:'tabs'});$('paymentHost').innerHTML='<div id="paymentElement"></div><button class="pay" id="submitPayment">Pay Invoice</button>';paymentElement.mount('#paymentElement');$('submitPayment').onclick=async()=>{const sb=$('submitPayment');sb.disabled=true;try{if(elements.submit){const s=await elements.submit();if(s?.error)throw s.error}const r=await stripe.confirmPayment({elements,redirect:'if_required',confirmParams:{return_url:location.href}});if(r.error)throw r.error;if(!token&&payment)await invoke('global-checkout-actions',{action:'confirm_invoice_payment',invoice_id:id,payment_id:payment.id,portal_code:C.portalCode});$('paymentHost').innerHTML='<div class="complete">Invoice payment completed successfully.</div>';msg('Invoice payment completed.','ok')}catch(e){$('paymentError').textContent=e.message||'Payment failed.';sb.disabled=false}};$('payButton').style.display='none'}}

async function initNewEntrant(q){
 const type=q.get('product')==='staff'?'staff':'addon';
 const ctpa=q.get('ctpa_id')||window.S4UCTPAWorkspace?.read?.()?.ctpa_id;
 const audit=q.get('audit_id')||null;
 if(!ctpa)throw Error('Return to the C/TPA dashboard and select an organization.');
 if(type==='staff'&&!audit)throw Error('An audit preparation file must be selected for staff assistance.');
 const action=type==='staff'?'start_staff':'start_addon';
 const verification=type==='staff'?'confirm_staff':'confirm_addon';
 const price=type==='staff'?375:250;
 const title=type==='staff'?'Staff-Assisted New Entrant Audit Preparation':'Unlimited New Entrant Audit Workspace';
 const request={ctpa_id:ctpa,...(audit?{audit_id:audit}:{})};
 const back='/new-entrant-audits.html'+(audit?'?id='+encodeURIComponent(audit):'');
 document.getElementById('checkoutBack').href=back;
 document.getElementById('checkoutBack').textContent='← Back to New Entrant Audits';
 $('pageTitle').textContent=title;
 $('pageText').textContent=type==='staff'?'Workforce prepares and reviews one saved carrier audit file. FMCSA conducts the official audit.':'One-time activation for unlimited self-service New Entrant Audit preparation files.';
 $('summaryType').textContent=type==='staff'?'Per-audit professional service':'One-time software add-on';
 $('summaryAccount').textContent='Workforce C/TPA';
 $('summaryRef').textContent=type==='staff'?audit.slice(0,8):'Unlimited license';
 $('summaryTotal').textContent=money(price);
 $('accountDetails').innerHTML=details([['Product',title],['Price',money(price)],['Payment','One time'],['Access',type==='staff'?'One staff-assisted audit':'Unlimited self-service files']]);
 $('lineItems').innerHTML='<div class="line"><div><strong>'+esc(title)+'</strong><span>One-time purchase · No recurring charge</span></div><div class="amount">'+money(price)+'</div></div>';
 const confirmed=q.get('payment_id');
 if(confirmed){
  const result=await invoke('workforce-new-entrant-payments',{action:verification,...request,payment_id:confirmed});
  if(!result.paid)throw Error('Payment has not yet been confirmed.');
  $('payButton').hidden=true;
  $('paymentHost').innerHTML='<div class="complete">'+(type==='staff'?'Your paid preparation request has been submitted to Workforce.':'Your unlimited audit workspace is now active.')+'</div><p><a class="back-to-audits" href="'+back+'">Return to New Entrant Audits →</a></p>';
  msg('Stripe payment verified.','ok');
  return;
 }
 const check=await invoke('workforce-new-entrant-payments',{action:'status',...request});
 if(type==='addon'&&check.unlimited_active){
  $('payButton').hidden=true;
  $('paymentHost').innerHTML='<div class="complete">This organization already owns unlimited self-service access.</div>';
  msg('Your workspace is active.','ok');return;
 }
 $('payButton').disabled=false;$('payButton').textContent='Continue to secure payment · '+money(price);
 $('payButton').onclick=async()=>{
  const button=$('payButton');button.disabled=true;
  try{
   msg('Preparing your secure one-time payment…','ok');
   const data=await invoke('workforce-new-entrant-payments',{action,...request});
   if(data.already_active){location.replace(back);return}
   if(data.already_submitted){msg('This audit has already been submitted.','ok');button.hidden=true;return}
   if(data.already_paid){
    location.replace('/global-checkout.html?'+new URLSearchParams({mode:'new_entrant',product:type,ctpa_id:ctpa,...(audit?{audit_id:audit}:{}),payment_id:data.payment_id}));
    return;
   }
   if(!data.client_secret||!data.publishable_key)throw Error('Secure payment initialization failed.');
   const stripe=window.Stripe(data.publishable_key);
   const elements=stripe.elements({clientSecret:data.client_secret,appearance:{theme:'stripe',variables:{colorPrimary:'#01122F',colorText:'#01122F',borderRadius:'9px'}}});
   const payment=elements.create('payment',{layout:'accordion'});
   $('paymentHost').innerHTML='<div id="newEntrantPaymentElement"></div><button class="pay" id="submitNewEntrantPayment" type="button">Pay '+money(price)+' securely</button>';
   payment.mount('#newEntrantPaymentElement');button.hidden=true;
   $('submitNewEntrantPayment').onclick=async()=>{
    const pay=$('submitNewEntrantPayment');pay.disabled=true;
    try{
     const submission=await elements.submit();
     if(submission.error)throw Error(submission.error.message);
     const qs=new URLSearchParams({mode:'new_entrant',product:type,ctpa_id:ctpa,...(audit?{audit_id:audit}:{}),payment_id:data.payment_id});
     const result=await stripe.confirmPayment({elements,confirmParams:{return_url:location.origin+'/global-checkout.html?'+qs.toString()},redirect:'if_required'});
     if(result.error)throw Error(result.error.message||'Payment was not completed.');
     const verified=await invoke('workforce-new-entrant-payments',{action:verification,...request,payment_id:data.payment_id});
     if(!verified.paid)throw Error('Payment has not yet been verified.');
     $('paymentHost').innerHTML='<div class="complete">'+(type==='staff'?'Payment confirmed. Your audit request is now with Workforce.':'Payment confirmed. Your audit workspace is active.')+'</div><p><a class="back-to-audits" href="'+back+'">Return to New Entrant Audits →</a></p>';
     msg('Payment verified successfully.','ok');
    }catch(err){$('paymentError').textContent=err.message||'Unable to complete payment';pay.disabled=false}
   };
   msg('Secure Stripe payment is ready.','ok');
  }catch(err){button.disabled=false;msg(err.message||'Unable to prepare payment','error')}
 };
}

async function initSupplies(q){
 const id=q.get("order_id"),tenant=q.get("tenant_id"),operating_context=q.get("context")==="nondot"?"nondot":"dot";
 if(!id||!/^[0-9a-f-]{36}$/i.test(id)||!tenant||!/^[0-9a-f-]{36}$/i.test(tenant))
  throw Error("Return to Supplies and create a valid checkout order.");
 const request={tenant_id:tenant,operating_context,order_id:id};
 const back="/unified.html?page=lab_supplies";
 $("checkoutBack").href=back;$("checkoutBack").textContent="Back to Supplies";
 const response=await invoke("workforce-unified-portal",{action:"supplies_get_order",...request});
 const o=response.order||{},lines=o.order_items||[];
 const paid=o.payment_status==="paid";
 $("pageTitle").textContent="Supply order checkout";
 $("pageText").textContent="Review collection supplies and pay upfront before your order is released for processing by Workforce Testing Operations.";
 $("summaryType").textContent="Laboratory supplies";
 $("summaryAccount").textContent=o.company_name||"C/TPA";
 $("summaryRef").textContent=o.order_number||"—";
 $("summaryTotal").textContent=money(o.total);
 $("accountDetails").innerHTML=details([["Order",o.order_number],["Recipient",o.company_name],["Status",o.status],
  ["Payment",o.payment_status],["Shipping address",[
   o.metadata?.shipping?.address_line1,o.metadata?.shipping?.city,o.metadata?.shipping?.state,o.metadata?.shipping?.postal_code].filter(Boolean).join(", ")]]);
 $("lineItems").innerHTML=lines.map(x=>'<div class="line"><div><strong>'+esc(x.metadata?.name||"Collection supply")+
  '</strong><span>Quantity '+esc(x.quantity||1)+'</span></div><div class="amount">'+money(Number(x.unit_price||0)*Number(x.quantity||1))+'</div></div>').join("");
 $("payButton").hidden=true;
 if(paid){
  $("paymentHost").innerHTML='<div class="complete">Payment verified. Your supplies order is ready for Workforce Testing Operations processing.</div>';
  msg("Order paid successfully.","ok");return;
 }
 // If Stripe redirected back after authentication, confirm using the backend's
 // independently verified payment-intent status, not URL query parameters.
 if(q.get("payment_intent")){
  try{
   const result=await invoke("workforce-unified-portal",{action:"supplies_confirm_payment",...request});
   if(result.paid){
    $("paymentHost").innerHTML='<div class="complete">Payment verified. Your order is queued for processing.</div>';
    msg("Payment completed successfully.","ok");return;
   }
  }catch(err){msg("The payment has not been verified yet. You can check your order status or retry payment.","error")}
 }
 const prepared=await invoke("workforce-unified-portal",{action:"supplies_prepare_payment",...request});
 if(prepared.paid){location.reload();return}
 stripe=window.Stripe(prepared.publishable_key);
 elements=stripe.elements({clientSecret:prepared.client_secret});
 paymentElement=elements.create("payment",{layout:"accordion"});
 $("paymentHost").innerHTML='<div id="supplyPaymentElement"></div><button type="button" id="supplyPay" class="pay">Pay '+money(o.total)+' now</button>';
 paymentElement.mount("#supplyPaymentElement");
 $("supplyPay").onclick=async()=>{
  const button=$("supplyPay");button.disabled=true;$("paymentError").textContent="";
  try{
   if(elements.submit){const result=await elements.submit();if(result?.error)throw result.error}
   const confirmation=await stripe.confirmPayment({elements,redirect:"if_required",confirmParams:{return_url:location.href}});
   if(confirmation.error)throw confirmation.error;
   const verified=await invoke("workforce-unified-portal",{action:"supplies_confirm_payment",...request});
   if(!verified.paid)throw Error("Payment has not yet been verified");
   $("paymentHost").innerHTML='<div class="complete">Payment verified. Your order has been submitted for processing.</div>'+
    '<p><a href="'+back+'">Return to Supplies</a></p>';
   msg("Payment confirmed by Stripe.","ok");
  }catch(err){$("paymentError").textContent=err.message||"Unable to complete payment.";button.disabled=false}
 };
 msg("Secure payment is ready.","ok");
}

async function initOrder(q){const id=q.get('order_id')||q.get('id');if(!id)throw Error('Order id is required.');const d=await invoke('ctpa-dot-store-order',{action:'get_order',order_id:id});ctx=d;const o=d.order||{},items=o.order_items||[];$('pageTitle').textContent=`Pay Order ${o.order_number||''}`;$('pageText').textContent='Review your Workforce order and complete payment securely.';$('summaryType').textContent='C/TPA Store Order';$('summaryAccount').textContent=o.company_name||d.organization?.dba_name||d.organization?.legal_name||'C/TPA Account';$('summaryRef').textContent=o.order_number||o.id?.slice(0,12)||'—';$('summaryTotal').textContent=money(o.total);$('accountDetails').innerHTML=details([['Order',o.order_number],['Status',o.status],['Payment',o.payment_status],['Contact',o.customer_email],['Company',o.company_name],['Tracking',o.tracking_number]]);$('lineItems').innerHTML=items.map(x=>`<div class="line"><div><strong>${esc(x.metadata?.name||'Order item')}</strong><span>Qty ${esc(x.quantity||1)}</span></div><div class="amount">${money(Number(x.unit_price||0)*Number(x.quantity||1))}</div></div>`).join('')||'<p class="muted">No order items found.</p>';if(o.payment_status==='paid'){$('paymentHost').innerHTML='<div class="complete">This order has already been paid.</div>';$('payButton').disabled=true;$('payButton').textContent='Paid';return}$('payButton').disabled=false;$('payButton').textContent=`Pay ${money(o.total)}`;$('payButton').onclick=prepareOrderPayment;}
async function prepareOrderPayment(){const b=$('payButton');b.disabled=true;try{msg('Preparing secure payment…','ok');const d=await invoke('ctpa-dot-store-order',{action:'prepare_payment',order_id:ctx.order.id});payment={id:d.payment_intent_id};stripe=window.Stripe(d.publishable_key);elements=stripe.elements({clientSecret:d.client_secret});paymentElement=elements.create('payment',{layout:'tabs'});$('paymentHost').innerHTML='<div id="paymentElement"></div><button class="pay" id="submitPayment">Pay Order</button>';paymentElement.mount('#paymentElement');$('submitPayment').onclick=submitOrderPayment;b.style.display='none';msg('Secure payment is ready.','ok')}catch(e){b.disabled=false;msg(e.message||'Unable to prepare payment.','error')}}
async function submitOrderPayment(){const b=$('submitPayment');b.disabled=true;$('paymentError').textContent='';try{if(elements.submit){const s=await elements.submit();if(s?.error)throw s.error}const r=await stripe.confirmPayment({elements,redirect:'if_required',confirmParams:{return_url:location.href}});if(r.error)throw r.error;const d=await invoke('ctpa-dot-store-order',{action:'confirm_payment',order_id:ctx.order.id});$('paymentHost').innerHTML='<div class="complete">Payment completed successfully. Your order is now being processed.</div>';$('summaryRef').textContent=d.order?.order_number||$('summaryRef').textContent;msg('Order payment completed.','ok')}catch(e){$('paymentError').textContent=e.message||'Payment failed.';b.disabled=false}}
async function initFeature(q){$('pageTitle').textContent='Approved Feature / Add-On';$('pageText').textContent='Approved feature charges are completed through this checkout.';$('summaryType').textContent='Feature Add-On';$('accountDetails').innerHTML=details([['Feature request',q.get('feature_request_id')||'—'],['Status','Awaiting approved pricing']]);$('lineItems').innerHTML='<p class="muted">Once Workforce approves the request and assigns its billing amount, the approved add-on will be payable here.</p>';$('payButton').disabled=true;$('payButton').textContent='Awaiting Approval / Pricing'}
function details(rows){return rows.map(([k,v])=>`<div class="detail"><small>${esc(k)}</small><strong>${esc(v||'—')}</strong></div>`).join('')}
function msg(t,type='ok'){const e=$('message');e.textContent=t;e.className=`message show ${type}`}
})();
