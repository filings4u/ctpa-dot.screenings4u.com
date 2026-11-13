(()=>{"use strict";
const $=id=>document.getElementById(id),esc=x=>String(x??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\x27/g,"&#39;");
const endpoint="https://elpbnytpciqnbexiaebp.supabase.co/functions/v1/workforce-ctpa-demo-v2";
const key="sb_publishable_xVI6Mjkk1bNVMGHZCPuK6w_8FSHKdkC";
let ctx,month=new Date(),slots=[],requests=[],selectedDay="",selectedTime="",zone="America/Chicago",duration=60,view="book",sequence=0;
const dateString=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const readableTime=t=>{const [hour,min]=t.split(":").map(Number);return (hour%12||12)+":"+String(min).padStart(2,"0")+(hour>=12?" PM":" AM")};
const today=()=>new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"2-digit",day:"2-digit",timeZone:zone}).format(new Date());
async function api(action,extra={}){
 const token=(await ctx.supabase.auth.getSession()).data?.session?.access_token;if(!token)throw Error("Please sign in again.");
 const r=await fetch(endpoint,{method:"POST",cache:"no-store",headers:{"Authorization":"Bearer "+token,"apikey":key,"Content-Type":"application/json"},body:JSON.stringify({action,tenant_id:ctx.tenantId,...extra})});
 const j=await r.json().catch(()=>({}));if(!r.ok||j.error)throw Error(j.error||"Demo scheduling unavailable");return j;
}
function status(t){if($("demoStatus"))$("demoStatus").textContent=t}
function frame(){
 $("pageContent").innerHTML='<div class="demo-booking"><section class="demo-hero"><div><small>WORKFORCE C/TPA · PERSONALIZED TRAINING</small><h2>Request a Demo</h2><p>Choose a time offered by Workforce for a guided demonstration of your C/TPA tools. Your request will be reviewed and confirmed by our team.</p></div><span class="demo-duration">One-to-one Workforce session</span></section><div class="demo-tabs"><button id="demoTabBook" type="button" class="active">Book a Demo</button><button id="demoTabHistory" type="button">My Demo Requests</button></div><div id="demoBookArea"></div><p id="demoStatus" role="status" class="demo-status"></p></div>';
 $("demoTabBook").onclick=()=>{view="book";draw()};
 $("demoTabHistory").onclick=()=>{view="history";draw()};
}
function draw(){
 $("demoTabBook").classList.toggle("active",view==="book");$("demoTabHistory").classList.toggle("active",view==="history");
 if(view==="history"){history();return}
 const y=month.getFullYear(),m=month.getMonth(),firstDay=new Date(y,m,1).getDay(),total=new Date(y,m+1,0).getDate();
 const available=new Set(slots.map(x=>x.day));
 let days="";
 for(let i=0;i<firstDay;i++)days+='<span class="demo-day blank"></span>';
 for(let d=1;d<=total;d++){const date=dateString(new Date(y,m,d)),enabled=available.has(date);
  days+='<button type="button" class="demo-day '+(selectedDay===date?"chosen":"")+'" data-day="'+date+'" '+(!enabled?"disabled":"")+'>'+d+(enabled?'<span class="demo-dot"></span>':"")+'</button>';
 }
 const times=slots.filter(x=>x.day===selectedDay).map(x=>x.slot_time.slice(0,5));
 const timeArea=selectedDay?(times.length?'<div class="demo-time-grid">'+times.map(t=>'<button type="button" data-time="'+t+'" class="'+(selectedTime===t?"chosen":"")+'">'+readableTime(t)+'</button>').join("")+'</div>':'<p class="demo-hint">No times are available on this date.</p>'):'<p class="demo-hint">Select an available date on the calendar.</p>';
 $("demoBookArea").innerHTML='<div class="demo-grid"><section class="demo-panel"><div class="demo-panel-heading"><h3>Choose a Date</h3><small>Available Workforce appointment dates</small></div><div class="demo-month"><button type="button" id="demoPrev" aria-label="Previous month">‹</button><strong>'+new Intl.DateTimeFormat("en-US",{month:"long",year:"numeric"}).format(month)+'</strong><button type="button" id="demoNext" aria-label="Next month">›</button></div><div class="demo-calendar-head">'+["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=>'<span>'+x+'</span>').join("")+'</div><div class="demo-calendar-days">'+days+'</div><p class="demo-legend"><span class="demo-dot"></span> Available appointments</p></section><section class="demo-panel"><div class="demo-panel-heading"><h3>Select a Time</h3><small>'+esc(zone.replaceAll("_"," "))+' · '+duration+' minute session</small></div><h4>'+esc(selectedDay?new Date(selectedDay+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}):"Choose a date to see times")+'</h4>'+timeArea+'<div class="demo-selection">'+(selectedTime?'<strong>Selected: '+esc(selectedDay)+' · '+readableTime(selectedTime)+'</strong>':'Choose your preferred date and time.')+'</div></section></div><section class="demo-panel demo-request"><div class="demo-panel-heading"><h3>Request Details</h3><small>We will email you once your requested time is confirmed.</small></div><form id="demoBookingForm"><div class="demo-inputs"><label>First name<input name="first_name" required maxlength="100" autocomplete="given-name"></label><label>Last name<input name="last_name" required maxlength="100" autocomplete="family-name"></label><label>Phone number<input name="phone" maxlength="40" inputmode="tel" autocomplete="tel"></label><label>Demo topic<select name="topic" required><option value="C/TPA Platform Overview">C/TPA Platform Overview</option><option value="DOT and NON-DOT Programs">DOT and NON-DOT Programs</option><option value="Testing Orders and Results">Testing Orders and Results</option><option value="Employer Management">Employer Management</option><option value="Billing and Reporting">Billing and Reporting</option><option value="Other Workforce Feature">Other Workforce Feature</option></select></label><label class="wide">Questions or topics to cover<textarea name="notes" rows="3" maxlength="3000" placeholder="What would you like us to demonstrate?"></textarea></label></div><div class="demo-form-actions"><span>This is a request, not a confirmed appointment.</span><button type="submit" id="demoBookSubmit" class="btn primary" '+(!selectedDay||!selectedTime?"disabled":"")+'>Request Demo</button></div></form></section>';
 $("demoPrev").onclick=()=>void navigate(-1);$("demoNext").onclick=()=>void navigate(1);
 $("demoBookArea").querySelectorAll("[data-day]").forEach(btn=>btn.onclick=()=>{selectedDay=btn.dataset.day;selectedTime="";draw()});
 $("demoBookArea").querySelectorAll("[data-time]").forEach(btn=>btn.onclick=()=>{selectedTime=btn.dataset.time;draw()});
 $("demoBookingForm").onsubmit=async e=>{
  e.preventDefault();if(!selectedDay||!selectedTime){status("Select a date and time.");return}
  const submit=$("demoBookSubmit"),f=e.currentTarget,fields=Object.fromEntries(new FormData(f));submit.disabled=true;status("Submitting your demo request…");
  try{
   const result=await api("book",{...fields,day:selectedDay,time:selectedTime});
   status("Demo request submitted. Workforce will email you once it is confirmed. Reference: "+result.id);
   selectedDay="";selectedTime="";view="history";await loadHistory();draw();
  }catch(err){status(err.message);await loadCalendar().catch(()=>{})}finally{if(submit.isConnected)submit.disabled=false}
 };
}
function history(){
 $("demoBookArea").innerHTML='<section class="demo-panel demo-history"><div class="demo-panel-heading"><h3>My Demo Requests</h3><small>Review requests made by your C/TPA organization.</small></div>'+(requests.length?'<div class="demo-history-table"><table><thead><tr><th>Date and Time</th><th>Topic</th><th>Status</th><th>Meeting</th></tr></thead><tbody>'+requests.map(r=>'<tr><td><strong>'+esc(r.requested_date)+'</strong><small>'+readableTime(r.requested_time)+' · '+esc(r.timezone)+'</small></td><td>'+esc(r.demo_topic)+'</td><td><span class="demo-pill">'+esc(r.status)+'</span></td><td>'+(r.status==="confirmed"&&/^https:\/\//.test(r.meeting_url||"")?'<a href="'+esc(r.meeting_url)+'" target="_blank" rel="noopener noreferrer">Join Meeting</a>':'Pending details')+'</td></tr>').join("")+'</tbody></table></div>':'<div class="demo-empty"><strong>No demo requests yet</strong><p>Select Book a Demo to schedule your first demonstration.</p></div>')+'</section>';
}
async function loadHistory(){const x=await api("list");requests=x.requests||[]}
async function loadCalendar(){
 const start=dateString(new Date(month.getFullYear(),month.getMonth(),1)),end=dateString(new Date(month.getFullYear(),month.getMonth()+1,0));
 const x=await api("calendar",{start,end});zone=x.timezone||"America/Chicago";duration=x.duration_minutes||60;slots=x.slots||[];
 if(selectedDay&&!slots.some(s=>s.day===selectedDay)){selectedDay="";selectedTime=""}
 draw();
}
async function navigate(offset){
 month=new Date(month.getFullYear(),month.getMonth()+offset,1);
 const thisMonth=new Date(),max=new Date(thisMonth.getFullYear(),thisMonth.getMonth()+3,1),min=new Date(thisMonth.getFullYear(),thisMonth.getMonth(),1);
 if(month<min)month=min;if(month>max)month=max;
 selectedDay="";selectedTime="";
 status("Loading available appointments…");
 try{await loadCalendar();status("")}catch(e){status(e.message)}
}
async function open(value){
 ctx=value;const ticket=++sequence;month=new Date();month.setDate(1);view="book";selectedDay="";selectedTime="";
 frame();status("Loading Workforce calendar…");
 try{await Promise.all([loadHistory(),loadCalendar()]);if(ticket!==sequence||!ctx.active())return;status("")}catch(e){if(ticket!==sequence||!ctx.active())return;status(e.message)}
}
function exportCsv(){
 const rows=[["date","time","timezone","topic","status"],...requests.map(x=>[x.requested_date,x.requested_time,x.timezone,x.demo_topic,x.status])],csv=rows.map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\r\n");
 const u=URL.createObjectURL(new Blob([csv],{type:"text/csv"})),a=document.createElement("a");a.href=u;a.download="workforce-demo-requests.csv";a.click();setTimeout(()=>URL.revokeObjectURL(u),900)
}
window.WorkforceDemoV2=Object.freeze({open,exportCsv});
})();