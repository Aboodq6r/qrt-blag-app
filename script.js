
const state = {
  lang: localStorage.getItem("qrt_lang") || "ar",
  user: JSON.parse(localStorage.getItem("qrt_user")) || null,
  location: JSON.parse(localStorage.getItem("qrt_location")) || null,
  reports: JSON.parse(localStorage.getItem("qrt_reports")) || [],
  teams: JSON.parse(localStorage.getItem("qrt_teams")) || [
    {id:1,name:"Alpha Rescue",leader:"Abdulla",phone:"55000000",vehicle:"Land Cruiser",area:"Sealine",status:"Available"},
    {id:2,name:"Bravo Rescue",leader:"Team Leader",phone:"55500000",vehicle:"Patrol",area:"Dukhan",status:"Available"}
  ],
  logs: JSON.parse(localStorage.getItem("qrt_logs")) || []
};

const T = {
 ar:{
  title:"Qatar Rescue Team", subtitle:"نظام البلاغات والإنقاذ الميداني", login:"تسجيل الدخول", reporter:"المبلّغ", team:"الفريق", admin:"الإدارة", logout:"تسجيل خروج",
  google:"المتابعة باستخدام Google", apple:"المتابعة باستخدام Apple", location:"تفعيل الموقع", enableLocation:"السماح بتحديد الموقع", report:"إرسال بلاغ",
  adminPanel:"لوحة الإدارة", teamPanel:"لوحة الفريق", reports:"البلاغات", logs:"السجلات", addTeam:"إضافة فريق", assign:"تعيين", openMap:"فتح الموقع", call:"اتصال",
  accept:"قبول", enroute:"في الطريق", close:"إنهاء", noReports:"لا توجد بلاغات حالياً", noLogs:"لا توجد سجلات حالياً"
 },
 en:{
  title:"Qatar Rescue Team", subtitle:"Field rescue reporting and dispatch system", login:"Login", reporter:"Reporter", team:"Team", admin:"Admin", logout:"Logout",
  google:"Continue with Google", apple:"Continue with Apple", location:"Enable Location", enableLocation:"Allow Location Access", report:"Submit Report",
  adminPanel:"Admin Panel", teamPanel:"Team Dashboard", reports:"Reports", logs:"Logs", addTeam:"Add Team", assign:"Assign", openMap:"Open Location", call:"Call",
  accept:"Accept", enroute:"En Route", close:"Close", noReports:"No reports yet", noLogs:"No logs yet"
 }
};

function save(){localStorage.setItem("qrt_reports",JSON.stringify(state.reports));localStorage.setItem("qrt_teams",JSON.stringify(state.teams));localStorage.setItem("qrt_logs",JSON.stringify(state.logs));localStorage.setItem("qrt_location",JSON.stringify(state.location));}
function tr(k){return (T[state.lang]&&T[state.lang][k])||k}
function applyLang(){
 document.documentElement.lang=state.lang;
 document.body.dir=state.lang==="ar"?"rtl":"ltr";
 document.querySelectorAll("[data-t]").forEach(el=>el.textContent=tr(el.dataset.t));
}
function setLang(l){state.lang=l;localStorage.setItem("qrt_lang",l);applyLang();renderAll();}
function log(action,details){state.logs.unshift({time:new Date().toLocaleString(state.lang==="ar"?"ar-QA":"en-QA"),action,details});save();}
function mockLogin(provider,role){
 state.user={name:provider+" User",provider,role};
 localStorage.setItem("qrt_user",JSON.stringify(state.user));
 log("LOGIN",provider+" login as "+role);
 location.href="location.html";
}
function logout(){localStorage.removeItem("qrt_user");location.href="login.html";}
function requireLogin(){if(!state.user && !location.pathname.endsWith("login.html")) location.href="login.html";}
function enableLocation(){
 const el=document.getElementById("locationStatus");
 if(!navigator.geolocation){el.textContent="Location not supported";return;}
 el.textContent=state.lang==="ar"?"جاري تحديد الموقع...":"Getting location...";
 navigator.geolocation.getCurrentPosition(pos=>{
  state.location={lat:pos.coords.latitude,lng:pos.coords.longitude};
  save(); log("LOCATION_ENABLED",`${state.location.lat}, ${state.location.lng}`);
  el.textContent=state.lang==="ar"?"تم تفعيل الموقع بنجاح":"Location enabled successfully";
 },()=>{el.textContent=state.lang==="ar"?"تعذر تفعيل الموقع":"Could not enable location";},{enableHighAccuracy:true,timeout:12000,maximumAge:0});
}
function goReporter(){location.href="reporter.html"}
function submitReport(e){
 e.preventDefault();
 if(!state.location){alert(state.lang==="ar"?"فعّل الموقع أولاً":"Enable location first");return;}
 const r={id:Date.now(),name:val("name"),phone:val("phone"),type:val("type"),priority:val("priority"),people:val("people")||"N/A",vehicle:val("vehicle")||"N/A",details:val("details"),location:state.location,status:"New",assignedTo:"Unassigned",time:new Date().toLocaleString(state.lang==="ar"?"ar-QA":"en-QA")};
 state.reports.unshift(r); log("REPORT_CREATED",`${r.type} / ${r.phone}`); save(); alert(state.lang==="ar"?"تم إرسال البلاغ":"Report submitted"); location.href="team.html";
}
function val(id){return document.getElementById(id)?.value||""}
function updateReport(id,status){state.reports=state.reports.map(r=>r.id===id?{...r,status}:r); log("STATUS_UPDATED",`Report ${id}: ${status}`); save(); renderAll();}
function assignReport(id,teamId){const team=state.teams.find(t=>String(t.id)===String(teamId)); if(!team)return; state.reports=state.reports.map(r=>r.id===id?{...r,assignedTo:team.name,status:"Assigned"}:r); state.teams=state.teams.map(t=>t.id===team.id?{...t,status:"Busy"}:t); log("TEAM_ASSIGNED",`Report ${id} -> ${team.name}`); save(); renderAll();}
function openMap(lat,lng){window.open(`https://www.google.com/maps?q=${lat},${lng}`,"_blank")}
function callPhone(phone){location.href=`tel:${phone}`}
function addTeam(e){
 e.preventDefault();
 const t={id:Date.now(),name:val("teamName"),leader:val("leader"),phone:val("teamPhone"),vehicle:val("teamVehicle"),area:val("teamArea"),status:val("teamStatus")};
 state.teams.unshift(t); log("TEAM_CREATED",t.name); save(); e.target.reset(); renderAll();
}
function teamOptions(selected){return state.teams.map(t=>`<option value="${t.id}" ${selected===t.name?"selected":""}>${t.name} - ${t.area} - ${t.status}</option>`).join("")}
function renderReports(){
 const el=document.getElementById("reportsList"); if(!el)return;
 document.getElementById("totalCount").textContent=state.reports.length;
 document.getElementById("newCount").textContent=state.reports.filter(r=>r.status==="New").length;
 document.getElementById("assignedCount").textContent=state.reports.filter(r=>r.assignedTo!=="Unassigned").length;
 document.getElementById("closedCount").textContent=state.reports.filter(r=>r.status==="Closed").length;
 if(!state.reports.length){el.innerHTML=`<p class="note">${tr("noReports")}</p>`;return;}
 el.innerHTML=state.reports.map(r=>`
 <div class="item"><h3>${r.type}</h3><span class="pill priority">${r.priority}</span><span class="pill">${r.status}</span><span class="pill ok">${r.assignedTo}</span>
 <p><b>${state.lang==="ar"?"المبلّغ":"Reporter"}:</b> ${r.name}</p><p><b>${state.lang==="ar"?"الهاتف":"Phone"}:</b> ${r.phone}</p>
 <p><b>${state.lang==="ar"?"الأشخاص":"People"}:</b> ${r.people}</p><p><b>${state.lang==="ar"?"المركبة":"Vehicle"}:</b> ${r.vehicle}</p>
 <p><b>${state.lang==="ar"?"التفاصيل":"Details"}:</b> ${r.details}</p><p><b>${state.lang==="ar"?"الوقت":"Time"}:</b> ${r.time}</p>
 <label>${state.lang==="ar"?"تعيين الفريق":"Assign Team"}</label><select onchange="assignReport(${r.id},this.value)"><option value="">--</option>${teamOptions(r.assignedTo)}</select>
 <div class="actions"><button class="green" onclick="updateReport(${r.id},'Accepted')">${tr("accept")}</button><button class="blue" onclick="updateReport(${r.id},'En Route')">${tr("enroute")}</button><button class="primary" onclick="updateReport(${r.id},'Closed')">${tr("close")}</button><button class="gray" onclick="openMap(${r.location.lat},${r.location.lng})">${tr("openMap")}</button><button class="gray" onclick="callPhone('${r.phone}')">${tr("call")}</button></div>
 </div>`).join("");
}
function renderTeams(){
 const el=document.getElementById("teamsList"); if(!el)return;
 el.innerHTML=state.teams.map(t=>`<div class="item"><h3>${t.name}</h3><span class="pill">${t.status}</span><p><b>Leader:</b> ${t.leader}</p><p><b>Phone:</b> ${t.phone}</p><p><b>Vehicle:</b> ${t.vehicle}</p><p><b>Area:</b> ${t.area}</p></div>`).join("");
}
function renderLogs(){
 const el=document.getElementById("logsList"); if(!el)return;
 if(!state.logs.length){el.innerHTML=`<p class="note">${tr("noLogs")}</p>`;return;}
 el.innerHTML=state.logs.map(l=>`<div class="item"><h3>${l.action}</h3><p>${l.details}</p><p class="muted">${l.time}</p></div>`).join("");
}
function renderAll(){applyLang();renderReports();renderTeams();renderLogs();}
document.addEventListener("DOMContentLoaded",()=>{
 requireLogin(); applyLang();
 const rf=document.getElementById("reportForm"); if(rf)rf.addEventListener("submit",submitReport);
 const tf=document.getElementById("teamForm"); if(tf)tf.addEventListener("submit",addTeam);
 renderAll();
});
