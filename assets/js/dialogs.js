(()=>{"use strict";
const ID="s4u-branded-dialog";
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const brandTitle=t=>/screenings\s*4\s*u|screenings4u|screenings4/i.test(String(t||""))?"Workforce":String(t||"Workforce");
function open({title="Workforce",message="",kind="alert",confirmText="Continue",cancelText="Cancel",label="",value="",danger=false}={}){
 const previous=document.getElementById(ID);if(previous)previous.remove();
 return new Promise(resolve=>{
  let completed=false;
  const overlay=document.createElement("div");overlay.id=ID;overlay.className="modal-backdrop wf-dialog-backdrop";
  const control=kind==="prompt"?`<label class="wf-dialog-field"><span>${esc(label||"Response")}</span><input data-s4u-dialog-input value="${esc(value)}" autocomplete="off"></label>`:"";
  overlay.innerHTML=`<section class="wf-dialog" role="${kind==="alert"?"alertdialog":"dialog"}" aria-modal="true" aria-labelledby="wf-dialog-title" aria-describedby="wf-dialog-message"><div class="wf-dialog-brand"><img src="/images/logo2.png" alt="Workforce" width="150" height="52"><span class="wf-dialog-brand-label">WORKFORCE</span></div><div class="wf-dialog-content"><h2 id="wf-dialog-title">${esc(brandTitle(title))}</h2><p id="wf-dialog-message">${esc(message)}</p>${control}</div><div class="wf-dialog-actions"><button data-wf-cancel type="button" class="wf-dialog-button wf-dialog-secondary">${esc(cancelText)}</button><button data-wf-confirm type="button" class="wf-dialog-button ${danger?"wf-dialog-danger":"wf-dialog-primary"}">${esc(kind==="alert"?"OK":confirmText)}</button></div></section>`;
  const dialog=overlay.querySelector(".wf-dialog");
  const cancel=overlay.querySelector("[data-wf-cancel]");
  if(kind==="alert")cancel.remove();
  const priorFocus=document.activeElement;
  const onKey=e=>{
   if(e.key==="Escape"){e.preventDefault();done(kind==="confirm"?false:null)}
   if(e.key==="Enter"&&kind==="prompt"){e.preventDefault();done(dialog.querySelector("[data-s4u-dialog-input]")?.value??"")}
   if(e.key==="Tab"){
    const buttons=[...dialog.querySelectorAll("input,button:not([disabled])")];
    const first=buttons[0],last=buttons.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
   }
  };
  function done(value){
   if(completed)return;
   completed=true;overlay.removeEventListener("keydown",onKey);overlay.remove();
   if(priorFocus?.isConnected)priorFocus.focus();
   resolve(value);
  }
  if(cancel)cancel.onclick=()=>done(kind==="confirm"?false:null);
  overlay.querySelector("[data-wf-confirm]").onclick=()=>done(kind==="prompt"?dialog.querySelector("[data-s4u-dialog-input]")?.value??"":true);
  overlay.onclick=e=>{if(e.target===overlay&&kind!=="alert")done(kind==="confirm"?false:null)};
  overlay.addEventListener("keydown",onKey);
  document.body.append(overlay);
  (kind==="prompt"?dialog.querySelector("[data-s4u-dialog-input]"):dialog.querySelector("[data-wf-confirm]"))?.focus();
 });
}
window.S4UDialog={
 alert:(message,opts={})=>open({...opts,kind:"alert",message,title:brandTitle(opts.title||"Workforce")}),
 confirm:(message,opts={})=>open({...opts,kind:"confirm",message,title:brandTitle(opts.title||"Confirm action"),confirmText:opts.confirmText||"Continue"}),
 prompt:(message,opts={})=>open({...opts,kind:"prompt",message,title:brandTitle(opts.title||"Information required"),confirmText:opts.confirmText||"Continue"})
};
window.alert=message=>{window.S4UDialog.alert(String(message??""),{title:"Workforce"})};
})();