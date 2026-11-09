(()=>{
"use strict";
const safeName=s=>String(s||"carrier").replace(/[^a-z0-9_-]+/gi,"-").replace(/^-+|-+$/g,"").slice(0,75);
async function logoData(){
 try{const img=new Image();img.crossOrigin="anonymous";img.src="/images/logo2.png";await img.decode();const c=document.createElement("canvas");c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext("2d").drawImage(img,0,0);return {data:c.toDataURL("image/png"),aspect:img.naturalWidth/img.naturalHeight}}catch{return null}
}
async function signatureData(name){
 if(document.fonts?.ready)await document.fonts.ready;
 const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");canvas.width=1300;canvas.height=210;
 ctx.clearRect(0,0,1300,210);ctx.fillStyle="#01122f";ctx.font='italic 78px "Segoe Script","Brush Script MT","Lucida Handwriting",cursive';ctx.textBaseline="middle";ctx.fillText(String(name||""),15,106,1240);
 return canvas.toDataURL("image/png");
}
async function download(row){
 if(!row||row.status!=="signed")throw Error("A signed authorization is required.");
 const JsPDF=window.jspdf?.jsPDF;if(!JsPDF)throw Error("PDF generator not loaded. Refresh and try again.");
 const pdf=new JsPDF({unit:"pt",format:"letter",compress:true});
 const W=612,P=45,R=W-P,MAX=740;let y=132;const logo=await logoData();
 function header(){pdf.setFillColor(1,18,47);pdf.rect(0,0,W,105,"F");pdf.setFillColor(253,193,2);pdf.rect(0,104,W,4,"F");
 if(logo){const width=Math.min(132,logo.aspect*42),height=width/logo.aspect;pdf.addImage(logo.data,"PNG",P,22,width,height)}
 else {pdf.setTextColor(255);pdf.setFont("helvetica","bold");pdf.setFontSize(18);pdf.text("WORKFORCE by screenings4u",P,52)}
 pdf.setTextColor(255);pdf.setFont("helvetica","normal");pdf.setFontSize(10);pdf.text("FMCSA NEW ENTRANT SAFETY AUDIT  |  LIMITED AUTHORIZATION",P,94);}
 function next(n){if(y+n>MAX){pdf.addPage();header();y=132}}
 function section(label,value){pdf.setFont("helvetica","normal");pdf.setFontSize(11);const lines=pdf.splitTextToSize(String(value??"Not provided"),W-2*P);next(43+lines.length*15);pdf.setTextColor(88,106,126);pdf.setFont("helvetica","bold");pdf.setFontSize(9);pdf.text(label.toUpperCase(),P,y);y+=18;pdf.setTextColor(1,18,47);pdf.setFont("helvetica","normal");pdf.setFontSize(11);pdf.text(lines,P,y);y+=lines.length*15+18}
 header();pdf.setTextColor(1,18,47);pdf.setFontSize(18);pdf.setFont("helvetica","bold");pdf.text("Signed Carrier Audit Authorization",P,y);y+=29;
 section("Carrier legal name",row.carrier_legal_name);section("USDOT number",row.carrier_usdot);
 section("Designated C/TPA",row.ctpa_legal_name);section("Authorized powers and limitations",row.scope_text);
 section("Signing official",String(row.signer_name||"")+"  |  "+String(row.signer_title||""));
 section("Signer email",row.signer_email);
 next(145);pdf.setFont("helvetica","bold");pdf.setFontSize(9);pdf.setTextColor(88,106,126);pdf.text("ELECTRONIC SIGNATURE",P,y);y+=7;
 pdf.addImage(await signatureData(row.signer_signature||row.signer_name),"PNG",P,y,425,69);y+=78;
 pdf.setDrawColor(180,197,211);pdf.line(P,y,R,y);y+=19;
 section("Signed timestamp (UTC)",row.signed_at?new Date(row.signed_at).toISOString():"Not signed");
 section("Electronic consent","Electronic signature consent: "+(row.signature_consent?"Yes":"No")+". Signer confirmed signing authority: "+(row.capacity_confirmed?"Yes":"No")+". Record version: "+(row.consent_version||"N/A")+".");
 next(65);pdf.setFont("helvetica","normal");pdf.setTextColor(103,119,138);pdf.setFontSize(9);
 pdf.text(pdf.splitTextToSize("This document grants only the stated limited audit-preparation authority. It does not grant access to Login.gov credentials, MFA codes, or unrelated government services. Agency-specific authorization requirements may apply.",W-2*P),P,y);
 const pages=pdf.internal.getNumberOfPages();for(let i=1;i<=pages;i++){pdf.setPage(i);pdf.setDrawColor(221,231,240);pdf.line(P,770,R,770);pdf.setFont("helvetica","normal");pdf.setFontSize(8);pdf.setTextColor(105,120,140);pdf.text("WORKFORCE by screenings4u  |  Signed electronic record",P,785);pdf.text(String(i)+" / "+String(pages),R,785,{align:"right"})}
 pdf.save("Workforce-Signed-Authorization-"+safeName(row.carrier_legal_name)+".pdf");
}
window.CtpaAuthorizationPDF={download};
})();