(()=>{"use strict";
const endpoint="https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/ctpa-new-entrant-authorization";
const token=new URLSearchParams(location.search).get("token")||"";
const $=id=>document.getElementById(id);
let record=null;
const status=(message,error=false)=>{const el=$("authStatus");el.textContent=message;el.className="status"+(error?" error":"")};
const set=(id,value)=>{$(id).textContent=String(value??"—")};
async function api(action,extra={}){const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,token,...extra}),cache:"no-store"});const v=await r.json().catch(()=>({}));if(!r.ok||v.error)throw Error(v.error||"Request unsuccessful");return v}
async function printRecord(){
 if(!record||record.status!=="signed")return;
 const btn=$("printSigned");btn.disabled=true;
 try{await window.CtpaAuthorizationPDF.download(record)}catch(e){status(e.message||"Unable to download PDF",true)}finally{btn.disabled=false}
}

function showRecord(d){record=d;set("carrierName",d.carrier_legal_name);set("carrierDot",d.carrier_usdot||"Not provided");set("ctpaName",d.ctpa_legal_name);set("recipientName",(d.recipient_name?d.recipient_name+" · ":"")+d.recipient_email);set("scopeText",d.scope_text);set("authExpires","Expires "+new Date(d.expires_at).toLocaleDateString());$("authCard").hidden=d.status!=="pending";$("completedCard").hidden=d.status==="pending";if(d.status==="pending"){$("signerEmail").value=d.recipient_email;status("");return}set("completedTitle",d.status==="signed"?"Authorization signed":d.status==="declined"?"Authorization declined":"Authorization "+d.status);set("completedText",d.status==="signed"?"Your electronic signature was securely recorded. Select Download to save your signed authorization PDF.":"Your response has been recorded. Contact your C/TPA if you need to request a new authorization.");const items=[["Carrier",d.carrier_legal_name],["Signer",d.signer_name||"—"],["Recorded on",d.signed_at?new Date(d.signed_at).toLocaleString():"—"],["Status",d.status]];$("completedDetails").replaceChildren();items.forEach(([k,v])=>{const box=document.createElement("div"),small=document.createElement("small"),strong=document.createElement("strong");small.textContent=k;strong.textContent=v;box.append(small,strong);$("completedDetails").append(box)});$("printSigned").hidden=d.status!=="signed";status(d.status==="signed"?"Signed successfully. Your C/TPA can now view the recorded authorization.":"Your response was securely recorded.")}
async function submit(decision){const f=$("signForm");const signatureInput=$("signerSignature");signatureInput.required=decision==="signed";if(!f.reportValidity())return;const fd=new FormData(f);const signer_name=String(fd.get("signer_name")||"").trim(),signer_signature=String(fd.get("signer_signature")||"").trim();if(decision==="signed"&&signer_signature.toLowerCase()!==signer_name.toLowerCase()){status("Your typed signature must match your legal name.",true);return}const b=$("signButton"),d=$("declineButton");b.disabled=true;d.disabled=true;status("Recording your response securely…");try{const result=await api("sign",{decision,signer_name,signer_title:fd.get("signer_title"),signer_email:fd.get("signer_email"),signer_signature,signature_consent:$("signConsent").checked,capacity_confirmed:$("signAuthority").checked});showRecord(result.authorization)}catch(e){status(e.message||"Unable to record your response",true)}finally{b.disabled=false;d.disabled=false}}
$("signerSignature").addEventListener("input",e=>set("signaturePreview",e.target.value||"Signature preview"));
$("signForm").addEventListener("submit",e=>{e.preventDefault();submit("signed")});
$("declineButton").addEventListener("click",()=>submit("declined"));
$("printSigned").addEventListener("click",printRecord);
if(!/^[a-f0-9]{64}$/.test(token)){status("This link is missing or invalid. Ask your C/TPA for a new signing link.",true);return}
api("read").then(v=>showRecord(v.authorization)).catch(e=>status(e.message||"Unable to load this request",true));
})();