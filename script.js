/* ---------------- STATE ---------------- */
let lang = 'en'; // 'en' = English (default), 'mh' = Marshallese

const MH = {
  brandbarHint: "Kanne tab 1-5. Bōk e PDF eo am ilo tab eo eliktata. Resume in ej limit i yuk ñan 1 wōt peij.",
  expHint: "Likit jerbal ko ilo jabdew\u014dt laajrak - resume eo am enaj makke kwalok jerbal eo ekaal mokta ekkar ñan iio.",
  iosSaveTitle: "Your resume is ready!",
  privacyNote: "Disclaimer: Melele kein am rej walok \u014dt ilo browser in.",
  gptOpened: "ChatGPT opened in a new tab with your info already typed in \u2014 just tap Send there, then come back here.",
  gptCopiedFallback: "Your browser blocked the popup, so we copied your info instead \u2014 open chatgpt.com yourself and paste it into the message box.",
  gptCopyFailed: "Couldn't open ChatGPT or copy automatically. Open chatgpt.com yourself, then come back and try the button again.",
};
const EN = {
  brandbarHint: "Complete each tab in order. Your info will be turned into a one-page resume. Download your PDF in the final tab.\n",
  expHint: "Add up to 3 jobs in any order. Your resume will automatically list the most recent first.",
  iosSaveTitle: "Your resume is ready!",
  privacyNote: "Disclaimer: Your information is never saved, stored, or sent anywhere \u2014 everything stays in your browser and is only used to build this resume.",
  gptOpened: "ChatGPT opened in a new tab with your info already typed in \u2014 just tap Send there, then come back here.",
  gptCopiedFallback: "Your browser blocked the popup, so we copied your info instead \u2014 open chatgpt.com yourself and paste it into the message box.",
  gptCopyFailed: "Couldn't open ChatGPT or copy automatically. Open chatgpt.com yourself, then come back and try the button again.",
};
function mh(key){ return lang === 'mh' ? MH[key] : EN[key]; }
function pastePlaceholder(step){
  if(lang==='mh') return 'Copy ta eo ChatGPT ear lewaj \u00f1an yuk, paste ijin, innem jibidre button ne ej ba Step ' + step;
  return 'Copy what ChatGPT gave you, paste it here, then click the button below';
}


function toggleLang(){
  lang = lang === 'en' ? 'mh' : 'en';
  const btn = document.getElementById('lang-toggle');
  if(btn) btn.textContent = lang === 'mh' ? '\u{1f1fa}\u{1f1f8} English' : '\u{1f1f2}\u{1f1ed} Translate to Marshallese';
  // Update the three swappable strings without a full re-render
  const bh = document.getElementById('brandbar-hint');
  if(bh) bh.textContent = mh('brandbarHint');
  const pn = document.getElementById('privacy-note');
  if(pn) pn.textContent = mh('privacyNote');
  // Re-render the form so experience hint and hint divs pick up the new lang
  renderForm();
}

let data = {
  name:"", city:"", state:"", email:"", phone:"",
  statement:"", statementEdited:false,
  experiences:[ newExp() ],
  education:[ newEdu() ],
  languages:[""],
  certifications:[""],
  otherSkills:["",""]
};
let currentStep = "personal";
let skillsInputMode = ""; // "" | "gpt" | "manual" — how the user chose to fill in Other skills
let statementGptOpen = false; // whether the Professional Statement ChatGPT helper panel is open
let expandedJobs = new Set(); // indices of job cards currently expanded
let expandedEdus = new Set(); // indices of education cards currently expanded
let skillsDone = false; // whether the skills ChatGPT round-trip has completed at least once

function newExp(){
  return { id: Math.random().toString(36).slice(2), title:"", company:"", city:"", state:"", startMonth:"", startYear:"", endMonth:"", endYear:"", current:false, notes:"", bullets:[""], bulletMode:"" };
}
function newEdu(){
  return { id: Math.random().toString(36).slice(2), degreeType:"", program:"", school:"", city:"", state:"", startMonth:"", startYear:"", endMonth:"", endYear:"", current:false, gradYear:"", detail:"" };
}

/* ---------------- Degree levels, months, and years for dropdowns ---------------- */
const DEGREE_GROUPS = [
  { label: "High School or GED", options: [
      { value:"Some High School", level:0 },
      { value:"High School Diploma / GED", level:0 },
      { value:"Some College", level:0 },
  ]},
  { label: "Associate's Degrees", options: [
      { value:"Associate of Arts (AA)", level:0 },
      { value:"Associate of Science (AS)", level:0 },
      { value:"Associate of Applied Science (AAS)", level:0 },
  ]},
  { label: "Bachelor's Degrees", options: [
      { value:"Bachelor of Arts (BA)", level:1 },
      { value:"Bachelor of Science (BS)", level:1 },
      { value:"Bachelor of Fine Arts (BFA)", level:1 },
      { value:"Bachelor of Business Administration (BBA)", level:1 },
  ]},
  { label: "Master's Degrees", options: [
      { value:"Master of Arts (MA)", level:2 },
      { value:"Master of Science (MS)", level:2 },
      { value:"Master of Business Administration (MBA)", level:2 },
      { value:"Master of Education (MEd)", level:2 },
      { value:"Master of Fine Arts (MFA)", level:2 },
  ]},
  { label: "Doctoral & Professional Degrees", options: [
      { value:"Doctor of Philosophy (PhD)", level:3 },
      { value:"Doctor of Education (EdD)", level:3 },
      { value:"Juris Doctor (JD)", level:3 },
      { value:"Doctor of Medicine (MD)", level:3 },
  ]}
];
function allDegreeOptions(){ return DEGREE_GROUPS.flatMap(g=>g.options); }
function eduLevelFromType(degreeType){
  const found = allDegreeOptions().find(o=>o.value===degreeType);
  return found ? found.level : 0;
}
function degreeSelectHTML(i, selected){
  let html = `<select onchange="updEduDegreeType(${i},this.value)"><option value="">Select your degree level...</option>`;
  DEGREE_GROUPS.forEach(g=>{
    html += `<optgroup label="${esc(g.label)}">`;
    g.options.forEach(o=>{
      html += `<option value="${esc(o.value)}" ${selected===o.value ? "selected" : ""}>${esc(o.value)}</option>`;
    });
    html += `</optgroup>`;
  });
  html += `</select>`;
  return html;
}
const MONTH_LABELS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const US_STATES = [
  ["Marshall Islands","MH"],["Alabama","AL"],["Alaska","AK"],["Arizona","AZ"],["Arkansas","AR"],["California","CA"],
  ["Colorado","CO"],["Connecticut","CT"],["Delaware","DE"],["Florida","FL"],["Georgia","GA"],
  ["Hawaii","HI"],["Idaho","ID"],["Illinois","IL"],["Indiana","IN"],["Iowa","IA"],
  ["Kansas","KS"],["Kentucky","KY"],["Louisiana","LA"],["Maine","ME"],["Maryland","MD"],
  ["Massachusetts","MA"],["Michigan","MI"],["Minnesota","MN"],["Mississippi","MS"],["Missouri","MO"],
  ["Montana","MT"],["Nebraska","NE"],["Nevada","NV"],["New Hampshire","NH"],["New Jersey","NJ"],
  ["New Mexico","NM"],["New York","NY"],["North Carolina","NC"],["North Dakota","ND"],["Ohio","OH"],
  ["Oklahoma","OK"],["Oregon","OR"],["Pennsylvania","PA"],["Rhode Island","RI"],["South Carolina","SC"],
  ["South Dakota","SD"],["Tennessee","TN"],["Texas","TX"],["Utah","UT"],["Vermont","VT"],
  ["Virginia","VA"],["Washington","WA"],["West Virginia","WV"],["Wisconsin","WI"],["Wyoming","WY"],
  ["Northern Mariana Islands","MP"],
];
function stateOptionsHTML(selected){
  let html = `<option value="">State</option>`;
  US_STATES.forEach(([name,abbr])=>{
    html += `<option value="${abbr}" ${selected===abbr ? "selected" : ""}>${abbr} – ${name}</option>`;
  });
  html += `<option value="Other" ${selected==="Other" ? "selected" : ""}>Other / Outside U.S.</option>`;
  return html;
}

const CURRENT_YEAR = new Date().getFullYear();
// Actual dates (jobs, school attended) only ever land in the past or present — no future years.
const YEAR_OPTIONS = (()=>{ const arr=[]; for(let y=CURRENT_YEAR; y>=1980; y--) arr.push(y); return arr; })();
// Expected graduation year is the one date that's legitimately in the future, within a reasonable window.
const GRAD_YEAR_OPTIONS = (()=>{ const arr=[]; for(let y=CURRENT_YEAR+6; y>=CURRENT_YEAR; y--) arr.push(y); return arr; })();
function monthOptionsHTML(selected){
  let html = `<option value="">Month</option>`;
  MONTH_LABELS.forEach(m=>{ html += `<option value="${m}" ${selected===m ? "selected" : ""}>${m}</option>`; });
  return html;
}
function yearOptionsHTML(selected){
  let html = `<option value="">Year</option>`;
  YEAR_OPTIONS.forEach(y=>{ html += `<option value="${y}" ${String(selected)===String(y) ? "selected" : ""}>${y}</option>`; });
  return html;
}
function gradYearOptionsHTML(selected){
  let html = `<option value="">Year</option>`;
  GRAD_YEAR_OPTIONS.forEach(y=>{ html += `<option value="${y}" ${String(selected)===String(y) ? "selected" : ""}>${y}</option>`; });
  return html;
}
function formatDatePair(month, year){
  if(month && year) return `${month} ${year}`;
  return month || year || "";
}

/* ---------------- STEP COMPLETION ---------------- */
const STEP_NUMERALS = { personal:"1", experience:"2", education:"3", skills:"4", statement:"5" };
function stepComplete(step){
  if(step==="personal") return !!(data.name && data.city && data.state && data.email && data.phone);
  if(step==="experience") return data.experiences.some(e=> e.title && e.company && e.bullets.some(b=>b.trim()));
  if(step==="education") return data.education.some(ed=> ed.degreeType && ed.school);
  if(step==="skills"){
    return skillsDone
      || data.languages.some(l=>l.trim())
      || data.certifications.some(c=>c.trim())
      || data.otherSkills.some(s=>s.trim());
  }
  if(step==="statement") return !!data.statementEdited;
  return false;
}
function updateStepChecks(){
  document.querySelectorAll(".step-btn").forEach(btn=>{
    const step = btn.dataset.step;
    const numEl = btn.querySelector(".num");
    if(!numEl) return;
    const done = stepComplete(step);
    numEl.textContent = done ? "✓" : STEP_NUMERALS[step];
    numEl.classList.toggle("num-done", done);
  });
}

/* ---------------- NAV ---------------- */
function goStep(step){
  if(currentStep==="skills" && step!=="skills") padSkillsToFive();
  currentStep = step;
  statementGptOpen = false;
  document.querySelectorAll(".step-btn").forEach(b=>{
    b.classList.toggle("active", b.dataset.step===step);
  });
  renderForm();
}

function setMobileView(which){
  document.getElementById("panel-form").classList.toggle("hidden-mobile", which!=="form");
  document.getElementById("panel-preview").classList.toggle("hidden-mobile", which!=="preview");
  document.getElementById("mt-edit").classList.toggle("active", which==="form");
  document.getElementById("mt-prev").classList.toggle("active", which==="preview");
}

/* ---------------- FORM RENDERING ---------------- */
const LOGO_HTML = '<div style="text-align:center;padding:18px 0 16px;opacity:0.9;"><img src="assets/logo.png" alt="Arizona Marshallese Community" style="width:72px;height:auto;display:inline-block;"></div>';

function renderForm(){
  const root = document.getElementById("form-scroll");
  if(currentStep==="personal") root.innerHTML = personalHTML();
  else if(currentStep==="experience") root.innerHTML = experienceHTML();
  else if(currentStep==="education") root.innerHTML = educationHTML();
  else if(currentStep==="skills") root.innerHTML = skillsHTML();
  else root.innerHTML = statementHTML();
  renderPreview();
}

function personalHTML(){
  return `
    <div class="field">
      <label>Full name</label>
      <input type="text" value="${esc(data.name)}" oninput="upd('name', this.value)" placeholder="FOR EXAMPLE: Jordan Avery Smith">
    </div>
    <div class="row2">
      <div class="field"><label>City</label>
        <input type="text" value="${esc(data.city)}" oninput="upd('city', this.value)" placeholder="FOR EXAMPLE: Phoenix">
      </div>
      <div class="field"><label>State</label>
        <select onchange="upd('state', this.value)">${stateOptionsHTML(data.state)}</select>
      </div>
    </div>
    <div class="field">
      <label>Email</label>
      <input type="email" value="${esc(data.email)}" oninput="upd('email', this.value)" placeholder="you@email.com">
    </div>
    <div class="field">
      <label>Phone</label>
      <input type="tel" value="${esc(data.phone)}" oninput="updPhone(this)" placeholder="(555)123-4567" maxlength="13">
      <p class="hint">Formats automatically as you type.</p>
    </div>
    
  `;
}

function experienceHTML(){
  const exps = data.experiences;
  let html = `<div style="margin-bottom:8px;"><strong style="font-size:13px;color:var(--navy);">Work experience</strong>
    <div class="hint" style="margin-top:2px;">${mh('expHint')}</div></div>`;
  exps.forEach((e,i)=>{
    const hasBullets = e.bullets.filter(b=>b.trim()).length > 0;
    const isOpen = expandedJobs.has(i) || !hasBullets;
    const summary = [e.title, e.company].filter(Boolean).join(" — ") || `Job ${i+1}`;
    html += `
    <div class="card">
      <div class="card-head" onclick="toggleJobCard(${i})">
        <div>
          <strong>${esc(summary)}</strong>
          ${hasBullets ? `<div style="font-size:11px;color:var(--ok);margin-top:2px;">✓ ${e.bullets.filter(b=>b.trim()).length} bullet points generated</div>` : ""}
        </div>
        <span class="chev ${isOpen ? "open" : ""}">▼</span>
      </div>
      <div class="card-body ${isOpen ? "expanded" : "collapsed"}">
        <div class="field"><label>Job title</label>
          <input type="text" value="${esc(e.title)}" oninput="updExp(${i},'title',this.value)" placeholder="FOR EXAMPLE: Data Analyst">
        </div>
        <div class="field"><label>Company</label>
          <input type="text" value="${esc(e.company)}" oninput="updExp(${i},'company',this.value)" placeholder="Company name">
        </div>
        <div class="row2">
          <div class="field"><label>City</label>
            <input type="text" value="${esc(e.city)}" oninput="updExp(${i},'city',this.value)" placeholder="FOR EXAMPLE: Phoenix">
          </div>
          <div class="field"><label>State</label>
            <select onchange="updExp(${i},'state',this.value)">${stateOptionsHTML(e.state)}</select>
          </div>
        </div>
        <div class="row2">
          <div class="field"><label>Start month</label>
            <select onchange="updExp(${i},'startMonth',this.value)">${monthOptionsHTML(e.startMonth)}</select>
          </div>
          <div class="field"><label>Start year</label>
            <select onchange="updExp(${i},'startYear',this.value)">${yearOptionsHTML(e.startYear)}</select>
          </div>
        </div>
        <div class="row2">
          <div class="field"><label>End month</label>
            <select onchange="updExp(${i},'endMonth',this.value)" ${e.current?'disabled':''}>${monthOptionsHTML(e.endMonth)}</select>
          </div>
          <div class="field"><label>End year</label>
            <select onchange="updExp(${i},'endYear',this.value)" ${e.current?'disabled':''}>${yearOptionsHTML(e.endYear)}</select>
          </div>
        </div>
        <label style="font-size:12px;display:flex;gap:6px;align-items:center;margin-bottom:10px;color:var(--navy);font-weight:600;">
          <input type="checkbox" ${e.current?'checked':''} onchange="toggleCurrent(${i}, this.checked)" style="width:auto;"> I currently work here
        </label>
        <div style="border-top:1px solid var(--line);margin:14px 0 12px;padding-top:14px;">
          <strong style="font-size:14px;color:var(--navy);display:block;margin-bottom:10px;">List and describe what you did for Job ${i+1}</strong>
        </div>
        ${!e.bulletMode ? `
        <div style="margin-top:6px;">
          <div style="display:flex;gap:8px;">
            <button class="gold-btn" style="flex:1;" onclick="setBulletMode(${i},'gpt')">Get help from ChatGPT</button>
            <button class="ghost-btn" style="flex:1;margin-top:0;" onclick="setBulletMode(${i},'manual')">I'll write them myself</button>
          </div>
        </div>
        ` : e.bulletMode==="gpt" ? `
        <label style="font-size:14px;font-weight:700;color:var(--navy);margin-top:4px;display:block;">Step 1: List out what you did</label>
        <textarea oninput="updExp(${i},'notes',this.value)" placeholder="FOR EXAMPLE: load bags, helped customers, drove forklift...">${esc(e.notes)}</textarea>
        ${gptPanelHTML(i)}
        ${hasBullets ? `
        <div style="margin-top:14px;padding:12px;background:#E1EFE5;border-radius:8px;">
          <strong style="font-size:14px;color:var(--ok);">✓ Done!</strong>
          <div style="font-size:12px;color:#333;margin-top:4px;">Add another job below, or tap <strong>Education</strong> tab to continue.</div>
        </div>
        <label style="font-size:12px;font-weight:600;color:var(--navy);margin-top:10px;display:block;">Your bullet points (tap to edit)</label>
        ${e.bullets.map((b,bi)=>`
          <div class="bullet-row">
            <textarea oninput="updBullet(${i},${bi},this.value)">${esc(b)}</textarea>
            <button class="icon-btn danger" onclick="removeBullet(${i},${bi})" title="Remove bullet">✕</button>
          </div>`).join("")}
        <button class="ghost-btn" style="font-weight:700;font-size:13px;" onclick="addBullet(${i})">+ Add bullet point</button>
        ` : ""}
        <button class="small-link" style="margin-top:12px;display:block;" onclick="setBulletMode(${i},'manual')">Prefer to just type your bullet points? Switch to manual entry</button>
        ` : `
        <label style="font-size:14px;font-weight:700;color:var(--navy);margin-top:4px;margin-bottom:8px;display:block;">Your bullet points</label>
        ${e.bullets.map((b,bi)=>`
          <div class="bullet-row">
            <textarea oninput="updBullet(${i},${bi},this.value)" placeholder="FOR EXAMPLE: Loaded and unloaded delivery trucks daily">${esc(b)}</textarea>
            <button class="icon-btn danger" onclick="removeBullet(${i},${bi})" title="Remove bullet">✕</button>
          </div>`).join("")}
        <button class="ghost-btn" style="font-weight:700;font-size:13px;" onclick="addBullet(${i})">+ Add bullet point</button>
        <button class="small-link" style="margin-top:12px;display:block;" onclick="setBulletMode(${i},'gpt')">Prefer ChatGPT's help instead? Switch</button>
        `}
        ${exps.length>1 ? `<button class="remove-exp" onclick="removeExp(${i})">Remove this job</button>` : ""}
      </div>
    </div>`;
  });
  if(exps.length < 3) {
    html += `<button class="ghost-btn" style="font-weight:700;font-size:13px;" onclick="addExp()">+ Add another job</button>`;
  }return html;}
function statementHTML(){
  return `
  <div style="margin-bottom:12px;">
    <strong style="font-size:13px;color:var(--navy);">Professional summary</strong>
    <div class="hint" style="margin-top:4px;line-height:1.6;">
      ${lang==='mh' ? `
        Section in ej ñan paragraph eo jinoin ilo resume in am. Loor e step kein jilu:<br>
        1. Jibidre <strong>Step 1</strong> – emoj an copy aolep information ko ñan kwe.<br>
        2. Etal ñan ChatGPT, jibed message box eo, im paste (emoj an makke copy, kajju paste wōt).<br>
        3. Copy ta eo ChatGPT ej lewaj likiti ilo box ne itulal, innem jibidre <strong>Step 2</strong>.
      ` : `
        This creates the introduction paragraph at the top of your resume. Here's what to do:
        <div style='margin-top:6px;padding-left:4px;'>
          <div style='margin-bottom:3px;'>1. Click <strong>Step 1</strong> — it already copied everything for you.</div>
          <div style='margin-bottom:3px;'>2. Go to ChatGPT, tap the message box, and paste (even if it seems like nothing was copied, just paste).</div>
          <div>3. Copy what ChatGPT gives back, paste it in the box below, then click <strong>Step 2</strong>.</div>
        </div>
      `}
    </div>
  </div>
  <div class="statement-box">
    ${statementGptPanelHTML()}
  </div>
  ${data.statementEdited ? `
  <div class="field" style="margin-top:16px;">
    <label>Want to tweak it? Edit your summary directly</label>
    <textarea style="min-height:90px;" oninput="onStatementEdit(this.value)">${esc(data.statement)}</textarea>
    <p class="hint">This box is what shows up on your resume — feel free to edit it any time.</p>
  </div>
  ` : ""}
  ${lang==='mh' ? `<div style="margin-top:16px;margin-bottom:10px;text-align:center;font-size:12.5px;color:var(--navy);font-weight:600;">Jibed button eo ilal ñan am maroñ in bōk resume eo am.</div>` : ''}
  <button class="gold-btn" id="download-btn" style="width:100%;margin-top:18px;font-size:16px;font-weight:800;padding:16px 0;letter-spacing:0.3px;" onclick="downloadPDF()">⬇ Download PDF</button>
  <div style="margin-top:16px;text-align:center;font-size:13px;color:var(--muted);line-height:1.6;">
    ${lang==='mh' ? 'Ne ewor jabdewot kajjitok ikkijien resume in am, joij im kebaak <a href="https://www.facebook.com/people/Arizona-Marshallese-Community/61567054813935/" target="_blank" rel="noopener noreferrer" style="color:var(--navy);font-weight:600;">Arizona Marshallese Community</a> ilo Facebook. Kommol Tata!' : 'Message <a href="https://www.facebook.com/people/Arizona-Marshallese-Community/61567054813935/" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color:var(--navy);font-weight:600;">Arizona Marshallese Community</a> on Facebook if you have any questions.<br>Kommol Tata!'}
  </div>
  `;
}

function educationHTML(){
  const edus = data.education;
  let html = `<div style="margin-bottom:8px;"><strong style="font-size:13px;color:var(--navy);">Education</strong>
    <div class="hint" style="margin-top:2px;">${lang==='mh' ? 'Section in enij walok elikin jerbal ko am ilo resume in. Jolok elañe kwojjab kōnan likiti.' : 'This section is optional. Delete all entries to remove it from your resume.'}</div></div>`;
  edus.forEach((ed,i)=>{
    const hasDegree = ed.degreeType || ed.school;
    const isOpen = expandedEdus.has(i) || !hasDegree;
    const summary = [ed.degreeType, ed.school].filter(Boolean).join(" — ") || `School ${i+1}`;
    html += `
    <div class="card">
      <div class="card-head" onclick="toggleEduCard(${i})">
        <strong>${esc(summary)}</strong>
        <span class="chev ${isOpen ? "open" : ""}">▼</span>
      </div>
      <div class="card-body ${isOpen ? "expanded" : "collapsed"}">
        <div class="field"><label>Degree level</label>
          ${degreeSelectHTML(i, ed.degreeType)}
        </div>
        <div class="field"><label>What was/is your degree or program in? (optional)</label>
          <input type="text" value="${esc(ed.program)}" oninput="updEdu(${i},'program',this.value)" placeholder="FOR EXAMPLE: Business Administration">
        </div>
        <div class="field"><label>School</label>
          <input type="text" value="${esc(ed.school)}" oninput="updEdu(${i},'school',this.value)" placeholder="School name">
        </div>
        <div class="row2">
          <div class="field"><label>City</label>
            <input type="text" value="${esc(ed.city)}" oninput="updEdu(${i},'city',this.value)" placeholder="FOR EXAMPLE: Phoenix">
          </div>
          <div class="field"><label>State</label>
            <select onchange="updEdu(${i},'state',this.value)">${stateOptionsHTML(ed.state)}</select>
          </div>
        </div>
        <div class="row2">
          <div class="field"><label>Start month</label>
            <select onchange="updEdu(${i},'startMonth',this.value)">${monthOptionsHTML(ed.startMonth)}</select>
          </div>
          <div class="field"><label>Start year</label>
            <select onchange="updEdu(${i},'startYear',this.value)">${yearOptionsHTML(ed.startYear)}</select>
          </div>
        </div>
        <div class="row2">
          <div class="field"><label>End month</label>
            <select onchange="updEdu(${i},'endMonth',this.value)" ${ed.current?'disabled':''}>${monthOptionsHTML(ed.endMonth)}</select>
          </div>
          <div class="field"><label>End year</label>
            <select onchange="updEdu(${i},'endYear',this.value)" ${ed.current?'disabled':''}>${yearOptionsHTML(ed.endYear)}</select>
          </div>
        </div>
        <label style="font-size:12px;display:flex;gap:6px;align-items:center;margin-bottom:10px;color:var(--navy);font-weight:600;">
          <input type="checkbox" ${ed.current?'checked':''} onchange="toggleEduCurrent(${i}, this.checked)" style="width:auto;"> Currently enrolled
        </label>
        ${ed.current ? `
        <div class="field">
          <label>Expected graduation year</label>
          <select onchange="updEdu(${i},'gradYear',this.value)">${gradYearOptionsHTML(ed.gradYear)}</select>
        </div>
        ` : ""}
        <div class="field">
          <label>Optional detail line</label>
          <input type="text" value="${esc(ed.detail)}" oninput="updEdu(${i},'detail',this.value)" placeholder="Relevant coursework, honors, GPA, etc.">
        </div>
        ${edus.length>1 ? `<button class="remove-exp" onclick="removeEdu(${i})">Remove this school</button>` : ""}
      </div>
    </div>`;
  });
  html += `<button class="ghost-btn" style="font-weight:700;font-size:13px;" onclick="addEdu()">+ Add another school</button>`;
  return html;
}

function updEdu(i,field,val){ data.education[i][field]=val; renderPreview(); }
function updEduDegreeType(i,val){ data.education[i].degreeType=val; expandedEdus.add(i); renderForm(); }
function toggleEduCard(i){
  if(expandedEdus.has(i)){ expandedEdus.delete(i); } else { expandedEdus.add(i); }
  renderForm();
}
function toggleEduCurrent(i,checked){ data.education[i].current=checked; renderForm(); }
function addEdu(){
  const newIdx = data.education.length;
  data.education.push(newEdu());
  expandedEdus.add(newIdx);
  renderForm();
}
function removeEdu(i){
  data.education.splice(i,1);
  const updated = new Set();
  expandedEdus.forEach(idx=>{ if(idx<i) updated.add(idx); else if(idx>i) updated.add(idx-1); });
  expandedEdus = updated;
  renderForm();
}

function skillsHTML(){
  return `
    <div class="field">
      <label>Add a Language</label>
      ${data.languages.map((l,i)=>`
        <div class="bullet-row">
          <input type="text" style="flex:1;" value="${esc(l)}" oninput="updLang(${i},this.value)" placeholder="FOR EXAMPLE: Marshallese, English, Spanish...">
          ${data.languages.length>1 ? `<button class="icon-btn danger" onclick="removeLang(${i})">✕</button>` : ""}
        </div>`).join("")}
      <button class="ghost-btn" style="font-weight:700;font-size:13px;" onclick="addLang()">+ Add a Language</button>
    </div>
    <div class="field">
      <label>Certifications (optional)</label>
      ${data.certifications.map((c,i)=>`
        <div class="bullet-row">
          <input type="text" style="flex:1;" value="${esc(c)}" oninput="updCert(${i},this.value)" placeholder="FOR EXAMPLE: Forklift, CPR, Food Handler's Card">
          ${data.certifications.length>1 ? `<button class="icon-btn danger" onclick="removeCert(${i})">✕</button>` : ""}
        </div>`).join("")}
      <button class="ghost-btn" style="font-weight:700;font-size:13px;" onclick="addCert()">+ Add certification</button>
    </div>
    <div style="border-top:1px solid var(--line);margin:14px 0 14px;padding-top:14px;">
      <strong style="font-size:14px;color:var(--navy);display:block;">List your general skills here</strong>
    </div>
    <div class="field" style="margin-top:6px;">
      ${!skillsInputMode ? `
      <div style="display:flex;gap:8px;">
        <button class="gold-btn" style="flex:1;" onclick="setSkillsMode('gpt')">Get help from ChatGPT</button>
        <button class="ghost-btn" style="flex:1;margin-top:0;" onclick="setSkillsMode('manual')">I'll write them myself</button>
      </div>
      ` : skillsInputMode==="gpt" ? `
      ${skillsGptPanelHTML()}
      ${skillsDone ? `
      <div style="margin-top:14px;padding:12px;background:#E1EFE5;border-radius:8px;">
        <strong style="font-size:14px;color:var(--ok);">✓ Done!</strong>
        <div style="font-size:12px;color:#333;margin-top:4px;">Tap <strong>Summary</strong> tab to continue.</div>
      </div>
      <label style="font-size:12px;font-weight:600;color:var(--navy);margin-top:10px;display:block;">Your skills (tap to edit)</label>
      ${data.otherSkills.map((s,i)=>`
        <div class="bullet-row">
          <input type="text" style="flex:1;" value="${esc(s)}" oninput="updSkill(${i},this.value)">
          <button class="icon-btn danger" onclick="removeSkill(${i})">✕</button>
        </div>`).join("")}
      <button class="ghost-btn" style="font-weight:700;font-size:13px;" onclick="addSkill()">+ Add skill</button>
      ` : ""}
      <button class="small-link" style="margin-top:12px;display:block;" onclick="setSkillsMode('manual')">Prefer to just type your skills? Switch to manual entry</button>
      ` : `
      ${data.otherSkills.map((s,i)=>`
        <div class="bullet-row">
          <input type="text" style="flex:1;" value="${esc(s)}" oninput="updSkill(${i},this.value)" placeholder="FOR EXAMPLE: customer service, teamwork, hard worker">
          ${data.otherSkills.length>1 ? `<button class="icon-btn danger" onclick="removeSkill(${i})">✕</button>` : ""}
        </div>`).join("")}
      <button class="ghost-btn" style="font-weight:700;font-size:13px;" onclick="addSkill()">+ Add skill</button>
      <p class="hint">${lang==='mh' ? 'Kajjojo lain ej erom bullet eo an make – kōmman bwe en pidodo, einwot &quot;good with customers&quot; or &quot;fast learner.&quot;' : 'Each line becomes its own bullet — keep each one simple, like &quot;good with customers&quot; or &quot;fast learner.&quot;'}</p>
      <button class="small-link" style="margin-top:12px;display:block;" onclick="setSkillsMode('gpt')">Prefer ChatGPT's help instead? Switch</button>
      `}
    </div>
  `;
}

/* ---------------- UPDATE HANDLERS ---------------- */
function upd(field,val){ data[field]=val; renderPreview(); }
function formatPhone(val){
  const digits = (val||"").replace(/\D/g,"").slice(0,10);
  if(digits.length > 6) return `(${digits.slice(0,3)})${digits.slice(3,6)}-${digits.slice(6,10)}`;
  if(digits.length > 3) return `(${digits.slice(0,3)})${digits.slice(3,6)}`;
  if(digits.length > 0) return `(${digits}`;
  return "";
}
function updPhone(el){
  const formatted = formatPhone(el.value);
  el.value = formatted;
  data.phone = formatted;
  renderPreview();
}
function updExp(i,field,val){ data.experiences[i][field]=val; if(currentStep==="experience" && !data.statementEdited) refreshStatementBoxOnly(); renderPreview(); }
function toggleCurrent(i,checked){ data.experiences[i].current=checked; renderForm(); }
function updBullet(i,bi,val){ data.experiences[i].bullets[bi]=val; if(!data.statementEdited) refreshStatementBoxOnly(); renderPreview(); }
function removeBullet(i,bi){ data.experiences[i].bullets.splice(bi,1); renderForm(); }
function addBullet(i){ data.experiences[i].bullets.push(""); renderForm(); }
function setBulletMode(i,mode){ data.experiences[i].bulletMode = mode; renderForm(); }

/* ---- Shared: open ChatGPT with the prompt pre-filled (clipboard fallback) ---- */
function openChatGptWithPrompt(prompt, statusElId){
  const status = document.getElementById(statusElId);
  const url = 'https://chatgpt.com/?q=' + encodeURIComponent(prompt);
  const win = window.open(url, '_blank');
  if(win){
    if(status) status.textContent = mh('gptOpened');
    return;
  }
  // Popup blocked (common in in-app browsers) — fall back to copying the prompt.
  copyTextToClipboard(prompt,
    ()=>{ if(status) status.textContent = mh('gptCopiedFallback'); },
    ()=>{ if(status) status.textContent = mh('gptCopyFailed'); }
  );
}
function copyTextToClipboard(text, onOk, onFail){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(onOk).catch(()=>{ legacyCopy(text, onOk, onFail); });
  } else {
    legacyCopy(text, onOk, onFail);
  }
}
function legacyCopy(text, onOk, onFail){
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try{ document.execCommand('copy'); onOk(); }catch(e){ onFail(); }
  document.body.removeChild(ta);
}

/* ---- Bullet writing help: simplified ChatGPT flow (one box, 5 bullets) ---- */
function buildGptPrompt(exp){
  const title = (exp.title||"").trim();
  const company = (exp.company||"").trim();
  const what = (exp.notes||"").trim();
  let p = "Rewrite the following work experience as exactly 3 professional, resume-ready bullet points. ";
  p += "Use strong action verbs, vary them across bullets, keep each one to a single line, and add a realistic number or result where it makes sense if necessary. ";
  p += "Return them as a plain list with no markdown formatting — no asterisks, bold, or italics, just plain text.\n\n";
  p += `Job title: ${title || "(not given)"}\n`;
  if(company) p += `Company: ${company}\n`;
  p += `What I actually did: ${what || "(describe what you did at this job)"}`;
  return p;
}
function gptPanelHTML(i){
  const exp = data.experiences[i];
  return `
  <div class="guided-panel" style="margin-top:12px;">
    <label style="font-size:14px;font-weight:700;color:var(--navy);display:block;margin-bottom:6px;">Step 2: Paste in ChatGPT</label>
    <div class="hint" id="gpt-status-${i}" style="margin-top:8px;margin-bottom:8px;font-size:12.5px;"></div>
    <button class="gold-btn" style="width:100%;" onclick="openAndCopyGpt(${i})">Step 2: Click here to paste in ChatGPT</button>
    <label style="font-size:14px;font-weight:700;color:var(--navy);display:block;margin-top:28px;margin-bottom:6px;">Step 3: Generate</label>
    <textarea id="gpt-paste-${i}" style="margin-bottom:10px;" placeholder="${pastePlaceholder(3)}"></textarea>
    <button class="gold-btn" style="width:100%;" onclick="insertGptBullets(${i})">Step 3: Click here to generate bullet points</button>
  </div>`;
}
function openAndCopyGpt(i){
  openChatGptWithPrompt(buildGptPrompt(data.experiences[i]), `gpt-status-${i}`);
}

/* ---- Skills writing help: free ChatGPT link ---- */
function buildSkillsGptPrompt(){
  const langs = (data.languages||[]).filter(l=>l.trim());
  const langStr = langs.join(", ");
  const certs = data.certifications.filter(c=>c.trim()).join(", ");
  const others = data.otherSkills.filter(s=>s.trim()).join(", ");
  let p = "Rewrite the following as a professional resume skills section. ";
  p += "Reply using exactly this structure and nothing else:\n\n";
  p += "Languages: <comma-separated languages, or None>\n";
  p += "Certifications: <comma-separated certifications, or None>\n";
  p += "Other skills:\n";
  p += "- <skill 1> | <skill 2> | <skill 3> | <skill 4> | <skill 5> | <additional skills if applicable>\n";
  p += "(Use a single bullet point. Separate each skill with a | character. Include at least 5 skills. If the user provides fewer than 5, infer additional relevant professional skills that most employer look for. Do not invent certifications, languages, or technical skills that are not supported by the provided information.)\n\n";
  p += `Languages: ${langStr || "(none provided)"}\n`;
  p += `Certifications: ${certs || "(none provided)"}\n`;
  p += `Other skills: ${others || "(none provided)"}`;
  return p;
}
function skillsGptPanelHTML(){
  return `
  <div class="guided-panel" style="margin-top:12px;">
    <label style="font-size:14px;font-weight:700;color:var(--navy);display:block;margin-bottom:6px;">Step 1: Paste in ChatGPT</label>
    <div class="hint" id="skills-gpt-status" style="margin-top:8px;margin-bottom:8px;font-size:12.5px;"></div>
    <button class="gold-btn" style="width:100%;" onclick="openAndCopySkillsGpt()">Step 1: Click here to paste ChatGPT</button>
    <label style="font-size:14px;font-weight:700;color:var(--navy);display:block;margin-top:28px;margin-bottom:6px;">Step 2: Generate</label>
    <textarea id="skills-gpt-paste" style="margin-bottom:6px;" placeholder="${pastePlaceholder(2)}"></textarea>
    <button class="gold-btn" style="width:100%;" onclick="insertGptSkills()">Step 2: Click here to update my skills</button>
  </div>`;
}
function openAndCopySkillsGpt(){
  openChatGptWithPrompt(buildSkillsGptPrompt(), "skills-gpt-status");
}


/* ---- Strip markdown formatting ChatGPT sometimes adds (bold/italic/code) ---- */
function stripMarkdownLine(line){
  return line
    .replace(/\*\*(.*?)\*\*/g, "$1")   // **bold**
    .replace(/__(.*?)__/g, "$1")        // __bold__
    .replace(/\*([^*\n]+)\*/g, "$1")    // *italic* (after bullet marker already removed)
    .replace(/(?<![\w])_([^_\n]+)_(?![\w])/g, "$1") // _italic_
    .replace(/`([^`]+)`/g, "$1");       // `code`
}

/* ---- Turn ChatGPT's pasted answer into clean, separate bullet phrases ---- */
function splitGptLines(text){
  let lines = (text||"")
    .split(/\r?\n/)
    .map(l => l.trim().replace(/^[\-\*•]\s*/,"").replace(/^\d+[\.\)]\s*/,""))  // strip leading bullet/number marker first (ChatGPT sometimes indents it)
    .map(l => stripMarkdownLine(l).trim())                              // then strip any remaining markdown emphasis
    .filter(Boolean);
  // Fallback for ChatGPT answers that come back as one paragraph instead of separate lines
  if(lines.length <= 1 && lines[0]){
    const single = lines[0];
    let bySentence = single.split(/(?<=[.!?])\s+(?=[A-Z])/).map(s=>s.trim()).filter(Boolean);
    if(bySentence.length > 1) return bySentence;
    let byComma = single.split(/,\s*/).map(s=>s.trim()).filter(Boolean);
    if(byComma.length > 1) return byComma;
  }
  return lines;
}
/* ---- Strip redundant lead-in words ---- */
function cleanBilingualPhrase(v){  let p = (v||"").trim();
  p = p.replace(/^(bilingual\w*\s*(communication\s*)?(in\s*)?|fluent\s+in\s*|fluency\s+in\s*|proficient\s+in\s*|conversational\s+in\s*)/i, "").trim();
  p = p.replace(/\s*(bilingual\w*\s*communication\w*|bilingual\w*|communication\s+skills|fluency|fluent)\s*$/i, "").trim();
  return p || (v||"").trim();
}
function cleanCertPhrase(v){
  let p = (v||"").trim();
  p = p.replace(/^certifications?\s*[:\-]?\s*/i, "");
  p = p.replace(/\s*certifications?\s*$/i, "");
  p = p.trim();
  return p || (v||"").trim();
}

function insertGptSkills(){
  const ta = document.getElementById("skills-gpt-paste");
  const raw = ta ? ta.value : "";
  if(!raw.trim()){
    alert("Paste ChatGPT's answer into the box first, then click this button.");
    return;
  }

  let langVals = [];
  let certVals = [];
  const leftoverLines = [];

  raw.split(/\r?\n/).forEach(rawLine=>{
    const line = stripMarkdownLine(rawLine);
    const lMatch = line.match(/^\s*(languages?|bilingual\w*)\s*:\s*(.+)$/i);
    const cMatch = line.match(/^\s*certifications?\s*:\s*(.+)$/i);
    const headerMatch = line.match(/^\s*other skills?\s*:?\s*$/i);
    if(lMatch){
      const v = lMatch[2].trim();
      if(v && !/^none$/i.test(v)) langVals = v.split(",").map(s=>cleanBilingualPhrase(s.trim())).filter(Boolean);
      return;
    }
    if(cMatch){
      const v = cMatch[1].trim();
      if(v && !/^none$/i.test(v)) certVals = v.split(",").map(s=>cleanCertPhrase(s.trim())).filter(Boolean);
      return;
    }
    if(headerMatch) return;
    leftoverLines.push(line);
  });

  // The prompt asks ChatGPT to pipe-separate multiple skills within one bullet line
  // (e.g. "teamwork | fast learner"), so split those back out into separate skills.
  const phrases = splitGptLines(leftoverLines.join("\n")).flatMap(p=>p.split("|")).map(p=>p.trim()).filter(Boolean);
  const otherPhrases = [];
  phrases.forEach(phrase=>{
    if(!langVals.length && /bilingual|language/i.test(phrase)){
      langVals = [cleanBilingualPhrase(phrase)];
      return;
    }
    if(/certif/i.test(phrase)){
      certVals.push(cleanCertPhrase(phrase));
      return;
    }
    otherPhrases.push(phrase);
  });

  // Merge with what's already there instead of replacing it outright — otherwise anything
  // typed in manually after a previous ChatGPT round-trip (like a newly added certification)
  // gets silently wiped out if this response doesn't happen to mention it too.
  // Case-insensitive dedup: "teamwork" and "Teamwork" are treated as the same skill.
  const mergeUnique = (existing, incoming)=> {
    const seen = new Set();
    const result = [];
    [...existing.filter(v=>v.trim()), ...incoming].forEach(v => {
      const lower = v.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push(v);
      }
    });
    return result;
  };
  if(langVals.length) data.languages = mergeUnique(data.languages, langVals);
  if(certVals.length) data.certifications = mergeUnique(data.certifications, certVals);
  if(otherPhrases.length) data.otherSkills = mergeUnique(data.otherSkills, otherPhrases);

  skillsDone = true;
  padSkillsToFive();
  renderForm();
}

function setSkillsMode(mode){
  skillsInputMode = mode;
  renderForm();
}

// A resume skills line reads best with a handful of concrete skills — if the user (or ChatGPT)
// came up short, round it out with generic professional skills most employers look for.
const GENERIC_SKILLS = ["Teamwork","Communication","Time management","Reliability","Problem-solving","Adaptability","Work ethic","Customer service","Attention to detail","Dependability"];
function padSkillsToFive(){
  const existing = data.otherSkills.map(s=>s.trim()).filter(Boolean);
  if(!existing.length) return; // nothing entered at all — don't invent skills out of thin air
  const existingLower = existing.map(s=>s.toLowerCase());
  const pool = GENERIC_SKILLS.filter(g=>!existingLower.includes(g.toLowerCase()));
  while(existing.length < 5 && pool.length) existing.push(pool.shift());
  data.otherSkills = existing;
}

let doneBulletJobs = new Set(); // job indices where bullets have been generated and done banner shown

function toggleJobCard(i){
  if(expandedJobs.has(i)){ expandedJobs.delete(i); } else { expandedJobs.add(i); }
  renderForm();
}

function insertGptBullets(i){
  const ta = document.getElementById(`gpt-paste-${i}`);
  const lines = splitGptLines(ta ? ta.value : "");
  if(!lines.length){
    alert("Paste ChatGPT's bullets into the box first, then click this button.");
    return;
  }
  data.experiences[i].bullets = lines;
  expandedJobs.delete(i); // auto-collapse
  doneBulletJobs.add(i);  // show done banner
  if(!data.statementEdited) refreshStatementBoxOnly();
  renderForm();
}

function addExp(){
  if(data.experiences.length >= 3) return;
  const newIdx = data.experiences.length;
  data.experiences.push(newExp());
  expandedJobs.add(newIdx);
  renderForm();
}
function removeExp(i){
  data.experiences.splice(i,1);
  const updE = new Set();
  expandedJobs.forEach(idx=>{ if(idx<i) updE.add(idx); else if(idx>i) updE.add(idx-1); });
  expandedJobs = updE;
  const updD = new Set();
  doneBulletJobs.forEach(idx=>{ if(idx<i) updD.add(idx); else if(idx>i) updD.add(idx-1); });
  doneBulletJobs = updD;
  if(!data.statementEdited) refreshStatementBoxOnly();
  renderForm();
}
function onStatementEdit(val){ data.statement = val; data.statementEdited = true; renderPreview(); }
function regenStatement(){ data.statementEdited=false; data.statement=""; renderForm(); }
function refreshStatementBoxOnly(){
  // re-render just the textarea value without losing focus elsewhere isn't trivial in vanilla JS;
  // simplest reliable approach: full re-render of experience step (cursor will reset, which is fine for a short text field interaction pattern here)
}
function updLang(i,val){ data.languages[i]=val; renderPreview(); }
function addLang(){ data.languages.push(""); renderForm(); }
function removeLang(i){ data.languages.splice(i,1); renderForm(); }
function updCert(i,val){ data.certifications[i]=val; renderPreview(); }
function addCert(){ data.certifications.push(""); renderForm(); }
function removeCert(i){ data.certifications.splice(i,1); renderForm(); }
function updSkill(i,val){ data.otherSkills[i]=val; renderPreview(); }
function addSkill(){ data.otherSkills.push(""); renderForm(); }
function removeSkill(i){ data.otherSkills.splice(i,1); renderForm(); }

function esc(s){
  return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/* ---------------- STATEMENT GENERATOR ---------------- */
/* ---------------- EXPERIENCE ORDERING (most recent first, automatic) ---------------- */
function fieldDateScore(month, year){
  if(!year) return null;
  const mi = month ? MONTH_LABELS.indexOf(month) : -1;
  return parseInt(year)*12 + (mi>=0?mi:0);
}
function expSortScore(e){
  if(e.current) return Infinity; // current jobs are always most recent
  let score = fieldDateScore(e.endMonth, e.endYear);
  if(score===null) score = fieldDateScore(e.startMonth, e.startYear);
  return score===null ? -Infinity : score; // jobs with no date entered sink to the bottom
}
function sortedExperiences(d){
  const exps = d.experiences.filter(e=> e.title || e.company || e.bullets.some(b=>b.trim()));
  return exps.slice().sort((a,b)=> expSortScore(b) - expSortScore(a));
}

/* ---- Education level detection: only bachelor's degrees and above qualify for the statement ---- */
function eduDisplayDegree(ed){
  if(!ed.degreeType) return "";
  if(ed.program && ed.program.trim()){
    return `${ed.degreeType}, ${ed.program.trim()}`;
  }
  return ed.degreeType;
}
function bestQualifyingEducation(d){
  const edus = (d.education||[]).filter(e=>e.degreeType && e.degreeType.trim());
  let best = null, bestLevel = 0;
  edus.forEach(e=>{
    const lvl = eduLevelFromType(e.degreeType);
    if(lvl>=1 && lvl>=bestLevel){ bestLevel = lvl; best = e; }
  });
  return best;
}

/* ---- Professional statement: free ChatGPT helper ---- */
function toggleStatementGpt(){
  statementGptOpen = !statementGptOpen;
  renderForm();
}
function buildStatementGptPrompt(d){
  const exps = sortedExperiences(d);
  let p = "Write a professional resume summary statement, exactly 3 sentences. ";
  p += "Keep the total length short enough to fit on about 3 lines of a resume page — roughly 50-55 words total, so keep each sentence concise. ";
  p += "Use the standard implied-subject style of a resume summary — do NOT start sentences with \"The candidate\", \"I\", \"He\", \"She\", or any repeated subject. ";
  p += "Start sentences directly with a strong adjective, job title, or action, the way a polished resume bullet reads, and vary the sentence openers so they don't all sound the same. ";
  p += "Weave in the work experience, skills, and education below where relevant. ";
  p += "Return only the 3 sentences as plain text — no markdown, no headers, no bullet points.\n\n"
  p += "Work experience (most recent first):\n";
  if(exps.length){
    exps.forEach(e=>{
      const dates = [formatDatePair(e.startMonth,e.startYear), e.current ? "Present" : formatDatePair(e.endMonth,e.endYear)].filter(Boolean).join(" - ");
      const bullets = e.bullets.filter(b=>b.trim());
      p += `- ${e.title || "(role)"} at ${e.company || "(company)"} (${dates}): ${bullets.length ? bullets.join("; ") : "(no details given)"}\n`;
    });
  } else {
    p += "(none provided)\n";
  }
  const langs = (d.languages||[]).filter(l=>l.trim()).join(", ");
  const certs = d.certifications.filter(c=>c.trim()).join(", ");
  const others = d.otherSkills.filter(s=>s.trim()).join(", ");
  p += `\nSkills: ${others || "(none provided)"}\n`;
  if(langs) p += `Languages: ${langs}\n`;
  if(certs) p += `Certifications: ${certs}\n`;
  const edu = bestQualifyingEducation(d);
  if(edu){
    p += `\nEducation: ${eduDisplayDegree(edu)}${edu.school ? `, ${edu.school}` : ""} (mention this — it's bachelor's level or higher)\n`;
  } else {
    p += `\nEducation: not provided, or below bachelor's level — do not mention education in the statement.\n`;
  }
  return p;
}
function statementGptPanelHTML(){
  return `
  <div class="guided-panel">
    <label style="font-size:14px;font-weight:700;color:var(--navy);display:block;margin-top:6px;margin-bottom:8px;">Step 1: Paste in ChatGPT</label>
    <div class="hint" id="statement-gpt-status" style="margin-top:8px;margin-bottom:8px;font-size:12.5px;"></div>
    <button class="gold-btn" style="width:100%;" onclick="openAndCopyStatementGpt()">Step 1: Click here to paste in ChatGPT</button>
    <label style="font-size:14px;font-weight:700;color:var(--navy);display:block;margin-top:28px;margin-bottom:6px;">Step 2: Generate</label>
    <textarea id="statement-gpt-paste" placeholder="${pastePlaceholder(2)}"></textarea>
    <button class="gold-btn" style="width:100%;margin-top:6px;" onclick="insertGptStatement()">Step 2: Click here update Summary</button>
    ${data.statementEdited ? `
    <div style="margin-top:14px;padding:12px;background:#E1EFE5;border-radius:8px;text-align:center;">
      <strong style="font-size:14px;color:var(--ok);">✓ DONE!</strong>
      <div style="font-size:12px;color:var(--ok);margin-top:4px;">Tap <strong>Preview</strong> at the top to see your finished resume.</div>
    </div>
    ` : ""}
  </div>`;
}
function openAndCopyStatementGpt(){
  openChatGptWithPrompt(buildStatementGptPrompt(data), "statement-gpt-status");
}
function insertGptStatement(){
  const ta = document.getElementById("statement-gpt-paste");
  const raw = ta ? ta.value : "";
  if(!raw.trim()){
    alert("Paste ChatGPT's statement into the box first, then click this button.");
    return;
  }
  const cleaned = raw.split(/\r?\n/).map(l=>stripMarkdownLine(l).trim()).filter(Boolean).join(" ");
  data.statement = cleaned;
  data.statementEdited = true;
  statementGptOpen = false;
  renderForm();
}

function splitIntoSentences(text){
  if(!text) return [];
  const matches = text.match(/[^.!?]+[.!?]+(\s+|$)/g);
  return matches ? matches.map(s=>s.trim()).filter(Boolean) : [text.trim()];
}
function buildStatement(d, maxSentences){
  if(d.statementEdited){
    if(maxSentences){
      return splitIntoSentences(d.statement).slice(0,maxSentences).join(" ");
    }
    return d.statement;
  }
  const exps = sortedExperiences(d).filter(e=>e.title && e.title.trim());
  if(!exps.length) return "";
  const mostRecent = exps[0];

  const yearNums = [];
  exps.forEach(e=>{
    const sy = e.startYear ? parseInt(e.startYear) : null;
    const ey = e.current ? CURRENT_YEAR : (e.endYear ? parseInt(e.endYear) : null);
    if(sy) yearNums.push(sy);
    if(ey) yearNums.push(ey);
  });
  let years = null;
  if(yearNums.length>=2){
    years = Math.max(...yearNums) - Math.min(...yearNums);
    if(years<1) years = 1;
  }

  function trimSnippet(s){
    if(!s) return "";
    let words = s.trim().split(/\s+/).slice(0,14).join(" ").replace(/[.;]+$/,"");
    if(!words) return "";
    return words.charAt(0).toLowerCase()+words.slice(1);
  }

  // Sentence 1: overview across all roles
  let s1 = `${mostRecent.title}${years ? ` with ${years}+ year${years>1?'s':''} of experience` : ''}${exps.length>1 ? ` across ${exps.length} roles` : ''}.`;

  // Sentence 2: pull a snippet from up to three different jobs, most recent first, to summarize the full work history
  const snippets = exps.slice(0,3)
    .map(e => trimSnippet((e.bullets.find(b=>b.trim())||"")))
    .filter(Boolean);
  let s2 = "";
  if(snippets.length===1){
    s2 = `Demonstrated success ${snippets[0]}.`;
  } else if(snippets.length===2){
    s2 = `Demonstrated success ${snippets[0]} and ${snippets[1]}.`;
  } else if(snippets.length>=3){
    s2 = `Demonstrated success ${snippets[0]}, ${snippets[1]}, and ${snippets[2]}.`;
  }

  // Sentence 3: skills, certifications, and languages
  const skillsPool = (d.otherSkills||[]).map(s=>s.trim()).filter(Boolean);
  const topSkills = skillsPool.slice(0,5).join(", ");
  const certsPool = (d.certifications||[]).map(c=>c.trim()).filter(Boolean);
  const langsPool = (d.languages||[]).map(l=>l.trim()).filter(Boolean);
  const clauses = [];
  if(topSkills) clauses.push(`skilled in ${topSkills}`);
  if(certsPool.length) clauses.push(`certified in ${certsPool.join(", ")}`);
  if(langsPool.length) clauses.push(`fluent in ${langsPool.join(" and ")}`);
  let s3 = "";
  if(clauses.length===1) s3 = clauses[0];
  else if(clauses.length===2) s3 = `${clauses[0]} and ${clauses[1]}`;
  else if(clauses.length>=3) s3 = `${clauses.slice(0,-1).join(", ")}, and ${clauses[clauses.length-1]}`;
  if(s3) s3 = s3.charAt(0).toUpperCase() + s3.slice(1) + ".";

  // Sentence 4: qualifying education (bachelor's or higher only) plus a closing line
  const edu = bestQualifyingEducation(d);
  let s4 = "";
  if(edu){
    s4 = `Holds a ${eduDisplayDegree(edu)}${edu.school ? ` from ${edu.school}` : ""}, bringing a detail-oriented, results-driven approach to every project.`;
  } else {
    s4 = `Known for clear communication and a consistent record of turning analysis into action.`;
  }

  let sentences = [s1, s2, s3, s4].filter(Boolean);
  if(maxSentences) sentences = sentences.slice(0, maxSentences);
  return sentences.join(" ");
}

/* ---------------- RESUME PREVIEW ---------------- */
function buildResumeHTML(opts){
  opts = opts || {};
  const statementMode = opts.statementMode || "full"; // "full" | "3sentence" | "none"
  const skillsMode = opts.skillsMode || "full";        // "full" | "max3" | "none"

  const contactParts = [];
  if(data.city || data.state) contactParts.push([data.city,data.state].filter(Boolean).join(", "));
  if(data.email) contactParts.push(data.email);
  if(data.phone) contactParts.push(data.phone);

  let html = `<div class="rname">${esc(data.name).toUpperCase() || "YOUR NAME"}</div>`;
  html += `<div class="rcontact">${contactParts.length ? esc(contactParts.join("  |  ")) : '<span class="empty-note">city, state | email | phone</span>'}</div>`;

  // Professional statement — never touched below "full" except by statementMode (summary is the first thing trimmed, then removed)
  if(statementMode !== "none"){
    const statementText = statementMode === "3sentence"
      ? buildStatement(data, 3)
      : (data.statement || buildStatement(data));
    html += `<div class="rsection"><h3>Professional Statement</h3>
      <div class="rstatement">${statementText ? esc(statementText) : '<span class="empty-note">Add a job in the Experience tab to auto-generate this.</span>'}</div>
    </div>`;
  }

  // Experience — always shown in full, never trimmed or removed
  const exps = sortedExperiences(data);
  html += `<div class="rsection"><h3>Work Experience</h3>`;
  if(!exps.length){
    html += `<div class="empty-note" style="margin-top:6pt;">Your jobs will appear here.</div>`;
  } else {
    exps.forEach(e=>{
      const dates = [formatDatePair(e.startMonth,e.startYear), e.current ? "Present" : formatDatePair(e.endMonth,e.endYear)].filter(Boolean).join(" – ");
      const cityState = [e.city, e.state].filter(Boolean).join(", ");
      html += `<div class="rjob">
        <div class="rjob-top"><span>${esc(e.title)||"Job Title"}</span><span>${esc(dates)}</span></div>
        <div class="rjob-sub"><span>${esc(e.company)||""}${e.company && cityState ? " – ":""}${esc(cityState)}</span><span></span></div>
        <ul class="rbullets">
          ${e.bullets.filter(b=>b.trim()).map(b=>`<li>${esc(b)}</li>`).join("") || ""}
        </ul>
      </div>`;
    });
  }
  html += `</div>`;

  // Education — always shown in full, never trimmed or removed (omitted entirely only if the user left every entry blank)
  const edus = data.education.filter(ed=> ed.degreeType || ed.school || ed.detail);
  if(edus.length){
    html += `<div class="rsection"><h3>Education</h3>`;
    edus.forEach(ed=>{
      const dates = [formatDatePair(ed.startMonth,ed.startYear), ed.current ? `Anticipated ${ed.gradYear || ""}`.trim() : formatDatePair(ed.endMonth,ed.endYear)].filter(Boolean).join(" – ");
      const cityState = [ed.city, ed.state].filter(Boolean).join(", ");
      html += `<div class="rjob">
        <div class="rjob-top"><span>${esc(eduDisplayDegree(ed))||"Degree"}</span><span>${esc(dates)}</span></div>
        <div class="rjob-sub"><span>${esc(ed.school)||""}${ed.school && cityState ? " – ":""}${esc(cityState)}</span><span></span></div>
        ${ed.detail.trim() ? `<ul class="rbullets"><li>${esc(ed.detail.trim())}</li></ul>` : ""}
      </div>`;
    });
    html += `</div>`;
  }

  // Skills — trimmed to 3 lines, then removed entirely, as the second and fourth fallback steps
  if(skillsMode !== "none"){
    const skillLines = [];
    const langs = (data.languages||[]).filter(l=>l.trim());
    if(langs.length) skillLines.push(`Fluent in ${langs.join(", ")}.`);
    const certs = data.certifications.filter(c=>c.trim());
    if(certs.length) skillLines.push(`Certifications: ${certs.join(", ")}.`);
    const others = data.otherSkills.filter(s=>s.trim());
    if(others.length){
      const formatted = others.map(s=>{ const t = s.trim().replace(/[.!?;]+$/,""); return t.charAt(0).toUpperCase() + t.slice(1); });
      skillLines.push(formatted.join(" | "));
    }
    const shownLines = skillsMode === "max3" ? skillLines.slice(0,3) : skillLines;

    html += `<div class="rsection"><h3>Skills</h3>`;
    if(!shownLines.length){
      html += `<div class="empty-note" style="margin-top:6pt;">Add languages, certifications, or skills in the Skills tab.</div>`;
    } else {
      html += `<ul class="rskill-line">${shownLines.map(s=>`<li>${esc(s)}</li>`).join("")}</ul>`;
    }
    html += `</div>`;
  }

  return html;
}

function pageOverflows(page){
  const fullHeightPx = page.scrollHeight;
  const targetPx = 11 * 96; // 1056px = 11in at 96dpi
  return (fullHeightPx / targetPx) > 1.04;
}

function renderPreview(){
  const page = document.getElementById("resume-page");

  // Try the full version first, then step down through the fallback ladder in this exact order:
  // 1) full  2) summary -> 3 sentences  3) skills -> 3 bullets  4) summary removed  5) skills removed.
  // Work Experience and Education are never touched at any step.
  const ladder = [
    { statementMode:"full",      skillsMode:"full" },
    { statementMode:"3sentence", skillsMode:"full" },
    { statementMode:"3sentence", skillsMode:"max3" },
    { statementMode:"none",      skillsMode:"max3" },
    { statementMode:"none",      skillsMode:"none" }
  ];

  let chosen = ladder[0];
  for(let i=0;i<ladder.length;i++){
    page.innerHTML = buildResumeHTML(ladder[i]);
    chosen = ladder[i];
    if(!pageOverflows(page) || i===ladder.length-1) break;
  }

  checkFit(chosen);
  fitPageWrap();
  updateStepChecks();
}

function getCurrentScale(el){
  const tr = window.getComputedStyle(el).transform;
  if(!tr || tr === "none") return 1;
  const m = tr.match(/matrix\(([^,]+),/);
  return m ? parseFloat(m[1]) : 1;
}
function fitPageWrap(){
  const page = document.getElementById("resume-page");
  const wrap = page ? page.parentElement : null;
  if(!page || !wrap) return;
  const scale = getCurrentScale(page);
  wrap.style.height = (page.scrollHeight * scale) + "px";
}
window.addEventListener("resize", ()=>{ fitPageWrap(); });

function checkFit(chosen){
  // 11in at 96dpi = 1056px; we render unscaled internal content, compare scrollHeight to that.
  const page = document.getElementById("resume-page");
  const note = document.getElementById("fit-note");
  const fullHeightPx = page.scrollHeight; // includes padding
  const targetPx = 11 * 96; // 1056
  const ratio = fullHeightPx / targetPx;

  const trimLabel = (()=>{
    if(!chosen) return "";
    if(chosen.statementMode==="full" && chosen.skillsMode==="full") return "";
    if(chosen.statementMode==="3sentence" && chosen.skillsMode==="full") return " — summary trimmed to 3 sentences to fit";
    if(chosen.statementMode==="3sentence" && chosen.skillsMode==="max3") return " — summary trimmed, skills limited to 3 to fit";
    if(chosen.statementMode==="none" && chosen.skillsMode==="max3") return " — summary removed, skills limited to 3 to fit";
    if(chosen.statementMode==="none" && chosen.skillsMode==="none") return " — summary and skills removed to fit";
    return "";
  })();

  if(ratio > 1.04){
    note.textContent = "Runs past one page even with summary/skills removed — trim a work bullet" + trimLabel;
    note.className = "fit-note fit-over";
  } else if(ratio < 0.78 && !trimLabel){
    note.textContent = "Room to spare — add more bullets to fill the page";
    note.className = "fit-note fit-under";
  } else {
    note.textContent = "Fits one page ✓" + trimLabel;
    note.className = "fit-note fit-ok";
  }
}

/* ---------------- PDF DOWNLOAD ---------------- */
async function downloadPDF(){
  const btn = document.getElementById("download-btn");
  const original = btn.textContent;
  btn.textContent = "Preparing PDF…";
  btn.disabled = true;

  const previewPanel = document.getElementById("panel-preview");
  const wasHidden = previewPanel.classList.contains("hidden-mobile");
  if(wasHidden) previewPanel.classList.remove("hidden-mobile");

  try{
    const node = document.getElementById("resume-page");
    node.style.transform = "none";
    node.style.marginBottom = "0";
    await new Promise(r=>setTimeout(r,100));
    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false
    });
    node.style.transform = "";
    node.style.marginBottom = "";
    fitPageWrap();

    const DPI = 192;
    const canvasInW = canvas.width  / DPI;
    const canvasInH = canvas.height / DPI;
    const pageW = 8.5;
    const pageH = 11;

    const scale = Math.min(pageW / canvasInW, pageH / canvasInH);
    const finalW = Math.round(canvasInW * scale * 1000) / 1000;
    const finalH = Math.round(canvasInH * scale * 1000) / 1000;
    const xOff  = Math.round(((pageW - finalW) / 2) * 1000) / 1000;

    const imgData = canvas.toDataURL("image/jpeg", 0.97);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit:"in", format:"letter" });
    pdf.addImage(imgData, "JPEG", xOff, 0, finalW, finalH);
    const filename = (data.name.trim().replace(/\s+/g,"_") || "resume") + "_Resume.pdf";

    const blobUrl = URL.createObjectURL(pdf.output('blob'));
    const inApp = isInAppBrowser();

    const timeSpent = Math.round((Date.now() - appStartTime) / 1000);
    const currentStep = document.querySelector('.step-btn.active')?.getAttribute('data-step') || 'unknown';

    if(inApp){
      // In in-app browser: show failure modal
      showDownloadResult(false);
      trackDownload(false, timeSpent, currentStep);
    } else {
      // In external browser: show success modal
      showDownloadResult(true);
      // Attempt automatic download
      try{
        pdf.save(filename);
        trackDownload(true, timeSpent, currentStep);
      } catch(downloadErr){
        console.error("Automatic download failed:", downloadErr);
        trackDownload(false, timeSpent, currentStep);
      }
    }

  } catch(err){
    const timeSpent = Math.round((Date.now() - appStartTime) / 1000);
    const currentStep = document.querySelector('.step-btn.active')?.getAttribute('data-step') || 'unknown';
    trackDownload(false, timeSpent, currentStep);
    alert("Download hit a snag: " + err.message + "\n\nYou can also press Ctrl/Cmd+P and choose 'Save as PDF' as a backup.");
    console.error(err);
  } finally {
    if(wasHidden) previewPanel.classList.add("hidden-mobile");
    btn.textContent = original;
    btn.disabled = false;
  }
}

// In-app browsers (Facebook, Instagram, Snapchat, WhatsApp, TikTok, Messenger)
// are known to block or silently fail blob/file downloads.
function getInAppBrowserName(){
  const ua = navigator.userAgent || "";
  if(/FBAN|FBAV/i.test(ua)) return "Facebook";
  if(/Instagram/i.test(ua)) return "Instagram";
  if(/Snapchat/i.test(ua)) return "Snapchat";
  if(/WhatsApp/i.test(ua)) return "WhatsApp";
  if(/TikTok/i.test(ua)) return "TikTok";
  if(/Messenger/i.test(ua)) return "Messenger";
  return null;
}

function isInAppBrowser(){
  return getInAppBrowserName() !== null;
}

function isExternalBrowser(){
  return !isInAppBrowser();
}

let lastSaveBlobUrl = null;
function showSaveInstructions(blobUrl, filename){
  if(lastSaveBlobUrl) URL.revokeObjectURL(lastSaveBlobUrl);
  lastSaveBlobUrl = blobUrl;

  document.getElementById("ios-save-title").textContent = mh('iosSaveTitle');

  const link = document.getElementById("ios-save-link");
  link.href = blobUrl;
  link.setAttribute("download", filename);

  const warning = document.getElementById("ios-save-inapp-warning");
  if(isInAppBrowser()){
    warning.style.display = "block";
    warning.innerHTML = `You're viewing this inside ${appName}, which can block downloads. Tap the <strong>••• or ⋮ menu</strong> at the top of the screen and choose <strong>Open External Browser</strong> (Safari or Chrome), then come back to this page and tap the button below again.`;
  } else {
    warning.style.display = "none";
  }

  document.getElementById("ios-save-overlay").style.display = "flex";
}
function closeSaveInstructions(){
  document.getElementById("ios-save-overlay").style.display = "none";
}

function showInappWarning(){
  const appName = getInAppBrowserName();
  if(!appName) return;
  const text = document.getElementById("inapp-warning-text");
  text.textContent = `You're using ${appName}. To download your resume, please tap the ••• menu and select "Open external browser"`;
  document.getElementById("inapp-warning-modal").style.display = "flex";
}

function closeInappWarning(){
  document.getElementById("inapp-warning-modal").style.display = "none";
  const appName = getInAppBrowserName();
  if(appName){
    const banner = document.getElementById("inapp-banner");
    banner.innerHTML = `WARNING: Download might not work in ${appName}. We recommend using Safari and Chrome instead. Tap ••• button and select <strong>Open External Browser</strong>.`;
    banner.style.display = "block";
  }
}

function showDownloadResult(success){
  const modal = document.getElementById("download-result-modal");
  const content = document.getElementById("download-result-content");

  if(success){
    content.innerHTML = `
      <p style="margin:0 0 14px;color:#16233D;font-size:15px;font-weight:700;">Downloaded successfully!</p>
      <p style="margin:0 0 12px;color:#16233D;font-size:13px;font-weight:600;">To find your Resume, go to:</p>
      <ul style="text-align:left;margin:0 0 16px;padding-left:20px;color:#16233D;font-size:13px;line-height:1.6;">
        <li><strong>Downloads</strong> or <strong>Files</strong> on your device</li>
        <li>Your browser's downloads</li>
      </ul>
      <button style="border:none;background:#B68D40;color:#fff;font-size:15px;font-weight:700;padding:12px 0;border-radius:8px;cursor:pointer;width:100%;" onclick="closeDownloadResult()">Got it</button>
    `;
  } else {
    content.innerHTML = `
      <p style="margin:0 0 14px;color:#8A2E1E;background:#FDECEA;border:1px solid #E8B4AB;padding:12px;border-radius:8px;font-size:13px;line-height:1.6;">If download didn't work, please tap the ••• menu → Select <strong>"Open External Browser"</strong></p>
      <p style="margin:0 0 12px;color:#16233D;font-size:13px;font-weight:600;">To find your Resume, go to:</p>
      <ul style="text-align:left;margin:0 0 16px;padding-left:20px;color:#16233D;font-size:13px;line-height:1.6;">
        <li><strong>Downloads</strong> or <strong>Files</strong> app</li>
        <li>Your browser's downloads</li>
      </ul>
      <button style="border:none;background:#8A2E1E;color:#fff;font-size:15px;font-weight:700;padding:12px 0;border-radius:8px;cursor:pointer;width:100%;" onclick="closeDownloadResult()">Got it</button>
    `;
  }
  modal.style.display = "flex";
}

function closeDownloadResult(){
  document.getElementById("download-result-modal").style.display = "none";
}

/* ---------------- ANALYTICS ---------------- */
const sessionId = (() => {
  let id = localStorage.getItem('resumeBuilderSessionId');
  if (!id) {
    id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('resumeBuilderSessionId', id);
  }
  return id;
})();

const appStartTime = Date.now();

function getMSTTime() {
  const now = new Date();
  const mstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Denver' }));
  const month = String(mstTime.getMonth() + 1).padStart(2, '0');
  const day = String(mstTime.getDate()).padStart(2, '0');
  const year = mstTime.getFullYear();
  const hours = mstTime.getHours() % 12 || 12;
  const minutes = String(mstTime.getMinutes()).padStart(2, '0');
  const ampm = mstTime.getHours() >= 12 ? 'PM' : 'AM';
  return {
    date: `${month}/${day}/${year}`,
    time: `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`
  };
}

function getBrowserType() {
  const ua = navigator.userAgent;
  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  if (ua.indexOf('Chrome') > -1) return 'Chrome';
  if (ua.indexOf('Safari') > -1) return 'Safari';
  if (ua.indexOf('Edge') > -1) return 'Edge';
  return 'Other';
}

function getDeviceType() {
  return window.innerWidth <= 860 ? 'mobile' : 'desktop';
}

function getCurrentLanguage() {
  return document.getElementById('lang-toggle')?.textContent.includes('English') ? 'Marshallese' : 'English';
}

function trackEvent(eventName, eventData = {}) {
  const mst = getMSTTime();
  const payload = {
    timestamp: mst.date + ' ' + mst.time,
    date: mst.date,
    time: mst.time,
    event: eventName,
    sessionId: sessionId,
    deviceType: getDeviceType(),
    browser: getBrowserType(),
    language: getCurrentLanguage(),
    ...eventData
  };

  // Log to console for debugging
  console.log('Analytics:', payload);

  // Send to backend (when available)
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {}); // silently fail if endpoint doesn't exist
}

function trackAppOpen() {
  trackEvent('app_opened', {
    userAgent: navigator.userAgent
  });
}

function trackDownload(success, timeSpentSeconds, currentStep) {
  trackEvent('download_attempted', {
    success: success,
    timeSpentSeconds: timeSpentSeconds,
    step: currentStep,
    mode: document.querySelector('.card-body.expanded') ? 'chatgpt' : 'manual'
  });
}

// Track app open on page load
trackAppOpen();

/* ---------------- INIT ---------------- */
expandedJobs.add(0); // start with job 0 open
renderForm();
setMobileView("form");
showInappWarning(); // warn if in in-app browser
