(()=>{"use strict";
const $=id=>document.getElementById(id),money=x=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(x)||0);
let db=null,stripe=null,elements=null;
const base="https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-ctpa-invoice-payment";
async function api(action,ctx){
 const session=(await db.auth.getSession()).data?.session;if(!session?.access_token)throw Error("Sign in required");
 const r=await fetch(base,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+session.access_token,"apikey":"sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC"},body:JSON.stringify({action,tenant_id:ctx.tenant,operating_context:ctx.context,invoice_id:ctx.invoice})});
 const d=await r.json().catch(()=>({}));if(!r.ok||d.error)throw Error(d.error||"Invoice payment is unavailable");return d;
}
async function init(q){
 db=window.S4UGetSupabaseClient?window.S4UGetSupabaseClient():window.supabase?.createClient?.("https://elpbnytpciqnbexiaebp.supabase.co","sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC");
 if(!db)throw Error("Payment session not available");
 const ctx={tenant:q.get("tenant_id"),context:q.get("context")==="nondot"?"nondot":"dot",invoice:q.get("invoice_id")};
 if(!ctx.tenant||!ctx.invoice)throw Error("Open the invoice from Workforce Billing to complete payment.");
 const back="/unified.html?page=invoices&context="+ctx.context;
 $("checkoutBack").href=back;$("checkoutBack").textContent="Back to Workforce Billing";
 $("pageTitle").textContent="Pay Workforce Invoice";
 $("pageText").textContent="Review the actual invoice balance and pay securely through Stripe.";
 const inv=(await api("get",ctx)).invoice;
 $("summaryType").textContent="Workforce Invoice";$("summaryAccount").textContent=inv.recipient_name||"C/TPA";$("summaryRef").textContent=inv.invoice_number;$("summaryTotal").textContent=money(inv.amount_due);
 $("accountDetails").textContent="";
 for(const [label,value] of [["Invoice",inv.invoice_number],["Due date",String(inv.due_at||"").slice(0,10)],["Status",inv.status]]){const d=document.createElement("div");const b=document.createElement("strong");b.textContent=label+": ";d.append(b,document.createTextNode(value||"—"));$("accountDetails").append(d)}
 $("lineItems").textContent="";
 for(const item of inv.items||[]){const d=document.createElement("div");d.className="line";const a=document.createElement("span");a.textContent=item.description||"Invoice service";const amount=document.createElement("strong");amount.textContent=money(item.amount);d.append(a,amount);$("lineItems").append(d)}
 if(inv.status==="paid"||Number(inv.amount_due)<=0){
  $("payButton").hidden=true;$("paymentHost").textContent="This invoice is already paid.";return;
 }
 $("payButton").hidden=true;
 const p=await api("prepare",ctx),stripeKey=p.publishable_key;
 if(!stripeKey||!p.client_secret)throw Error("Secure payment could not be prepared");
 stripe=window.Stripe(stripeKey);elements=stripe.elements({clientSecret:p.client_secret});
 const host=$("paymentHost");host.innerHTML='<div id="workforceInvoicePaymentElement"></div><button class="pay" id="workforceInvoiceSubmit" type="button">Pay Invoice</button>';
 elements.create("payment",{layout:"accordion"}).mount("#workforceInvoicePaymentElement");
 $("workforceInvoiceSubmit").onclick=async()=>{
  const button=$("workforceInvoiceSubmit");button.disabled=true;$("paymentError").textContent="";
  try{
   if(elements.submit){const check=await elements.submit();if(check.error)throw check.error}
   const result=await stripe.confirmPayment({elements,confirmParams:{return_url:location.href},redirect:"if_required"});
   if(result.error)throw result.error;
   const confirmation=await api("confirm",ctx);
   if(!confirmation.paid)throw Error("Payment is processing. Refresh this page after Stripe confirms it.");
   host.textContent="Payment confirmed. Your Workforce invoice has been marked paid.";
   $("summaryTotal").textContent="$0.00";
  }catch(e){$("paymentError").textContent=e.message||"Payment not completed.";button.disabled=false}
 };
 // Reconcile a payment after redirect or interruption.
 const status=await api("confirm",ctx).catch(()=>null);
 if(status?.paid){host.textContent="Payment confirmed. Your Workforce invoice has been marked paid.";$("summaryTotal").textContent="$0.00"}
}
window.WorkforceBillCheckout=Object.freeze({init});
})();