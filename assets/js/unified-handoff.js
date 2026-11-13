(async()=>{
"use strict";
const SELECTOR="https://workforceapps.screenings4u.com/selector.html";
const URL="https://elpbnytpciqnbexiaebp.supabase.co";
const KEY="sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC";
const status=document.getElementById("handoffStatus");
const setStatus=value=>{if(status)status.textContent=value};
const params=new URL(location.href).searchParams,code=params.get("code")||"";
history.replaceState(null,"","/auth-handoff.html");
try{
 if(!/^[0-9a-f]{64}$/i.test(code))throw new Error("The Workforce portal link is missing or expired.");
 if(!window.supabase?.createClient)throw new Error("Sign-in library unavailable.");
 // The central selector issues this short-lived, single-use authentication code.
 // No legacy C/TPA organization, workspace or subscription service is called.
 const response=await fetch(URL+"/functions/v1/portal-session-handoff",{
  method:"POST",cache:"no-store",
  headers:{"Content-Type":"application/json",apikey:KEY},
  body:JSON.stringify({action:"redeem",code})
 });
 const result=await response.json().catch(()=>({}));
 if(!response.ok||!result.token_hash)throw new Error(result.error||"Unable to complete Workforce sign-in.");
 const validTarget=["ctpa_dot","ctpa_workforce"].includes(result.target_portal);
 if(!validTarget)throw new Error("The selected portal is not Workforce C/TPA.");
 const client=window.supabase.createClient(URL,KEY,{
  auth:{storageKey:"s4u_ctpa_dot_auth",persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
 });
 setStatus("Confirming your existing Workforce account…");
 const verified=await client.auth.verifyOtp({token_hash:result.token_hash,type:"magiclink"});
 if(verified.error||!verified.data?.session)throw new Error("Workforce sign-in could not be verified.");
 const next=new URL("/unified.html?page=dashboard",location.origin);
 if(result.target_surface==="workforce")next.searchParams.set("context","nondot");
 else next.searchParams.set("context","dot");
 location.replace(next.href);
}catch(error){
 setStatus(error?.message||"Your portal session could not be transferred. Return to the Workforce selector.");
}
})();