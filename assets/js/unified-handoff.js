(async()=>{
"use strict";
const SELECTOR="https://workforceapps.screenings4u.com/selector.html";
const SUPABASE_URL="https://elpbnytpciqnbexiaebp.supabase.co";
const KEY="sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC";
const code=new URLSearchParams(location.search).get("code")||"";
// Remove one-time handoff credentials from the browser address immediately.
history.replaceState(null,"","/auth-handoff.html");
if(!/^[0-9a-f]{64}$/i.test(code)){location.replace(SELECTOR);return}
const loadSupabase=()=>{
 if(window.supabase?.createClient)return Promise.resolve(window.supabase);
 return new Promise((resolve,reject)=>{
  const script=document.createElement("script");
  script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  script.async=true;
  script.onload=()=>window.supabase?.createClient?resolve(window.supabase):reject(new Error("Authentication library unavailable"));
  script.onerror=()=>reject(new Error("Authentication library unavailable"));
  document.head.appendChild(script);
 });
};
try{
 // Start independent network work in parallel rather than waiting for the
 // Supabase SDK download before redeeming the one-time selector code.
 const sdkPromise=loadSupabase();
 const redeemPromise=fetch(SUPABASE_URL+"/functions/v1/portal-session-handoff",{
  method:"POST",cache:"no-store",
  headers:{"Content-Type":"application/json",apikey:KEY},
  body:JSON.stringify({action:"redeem",code})
 }).then(async response=>{
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.token_hash)throw new Error(data.error||"Workforce handoff expired");
  if(!["ctpa_dot","ctpa_workforce"].includes(data.target_portal))throw new Error("Incorrect portal target");
  return data;
 });
 const [sdk,result]=await Promise.all([sdkPromise,redeemPromise]);
 const client=sdk.createClient(SUPABASE_URL,KEY,{
  auth:{storageKey:"s4u_ctpa_dot_auth",persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
 });
 const verified=await client.auth.verifyOtp({token_hash:result.token_hash,type:"magiclink"});
 if(verified.error||!verified.data?.session)throw verified.error||new Error("Sign-in verification failed");
 const next=new URL("/unified.html",location.origin);
 next.searchParams.set("page","dashboard");
 next.searchParams.set("context",result.target_surface==="workforce"||result.target_portal==="ctpa_workforce"?"nondot":"dot");
 location.replace(next.href);
}catch(error){
 console.error("Workforce C/TPA handoff failed",error);
 const failure=document.getElementById("handoffFailure");
 if(failure)failure.style.display="block";
 // Never expose credentials or a token hash on the error screen.
 setTimeout(()=>location.replace(SELECTOR),900);
}
})();