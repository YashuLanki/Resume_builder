# ChatGPT Flow Redesign, Banner Fix, Sheets Analytics — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the confusing ChatGPT copy/paste round-trip with a prefilled-URL flow plus visual guidance, keep the in-app-browser warning banner persistent, and move analytics to a free Google Sheets webhook.

**Architecture:** All frontend changes live in the existing `script.js` / `style.css` / `index.html` (no build step, vanilla JS, string-template rendering with inline event handlers). Analytics becomes a direct POST from the browser to a Google Apps Script web app bound to a Sheet; the `backend/` directory is left untouched and unused.

**Tech Stack:** Vanilla JS/HTML/CSS, Google Apps Script (analytics only).

## Global Constraints

- No build step, no npm packages, no framework — plain files loaded by the browser.
- App must stay free to operate: no paid APIs.
- All new user-facing strings go through the `EN`/`MH` objects and `mh(key)` lookup in `script.js`. For MH, use the English text as the value for now (existing precedent: `iosSaveTitle`); the owner will supply Marshallese translations later.
- Match existing code style: inline `onclick`/`oninput` handlers, `*HTML()` functions returning template strings, `esc()` for all interpolated user data, section comments like `/* ---------------- SECTION ---------------- */`.
- There is no test framework; every task ends with a concrete manual verification step in a browser (`npx serve .` from the repo root, open the printed URL).
- After all script.js changes are complete (Task 7), bump the cache-busting query in `index.html` from `script.js?v=12` to `script.js?v=13`.
- Work on the current branch `download-and-clarity-fixes`; commit after every task.

---

### Task 1: Shared "open ChatGPT prefilled" helper with clipboard fallback

**Files:**
- Modify: `script.js` (add helpers near the existing copy functions, ~line 574; replace `openAndCopyGpt`, `openAndCopySkillsGpt`, `openAndCopyStatementGpt` and delete `copyGptPrompt`, `copySkillsGptPrompt`, `copyStatementGptPrompt`)
- Modify: `script.js:4-17` (EN/MH string additions)

**Interfaces:**
- Produces: `openChatGptWithPrompt(prompt, statusElId)` — opens `https://chatgpt.com/?q=<encoded>`; on popup block falls back to clipboard copy; writes status text into the element with id `statusElId`. Also `copyTextToClipboard(text, onOk, onFail)`. Later tasks call `openChatGptWithPrompt` from the three panels.

- [ ] **Step 1: Add the new strings to `EN` and `MH`**

Add these keys to BOTH the `EN` and `MH` objects (same English values in both for now):

```js
  gptOpened: "ChatGPT opened in a new tab with your info already typed in — just tap Send there, then come back here.",
  gptCopiedFallback: "Your browser blocked the popup, so we copied your info instead — open chatgpt.com yourself and paste it into the message box.",
  gptCopyFailed: "Couldn't open ChatGPT or copy automatically. Open chatgpt.com yourself, then come back and try the button again.",
```

- [ ] **Step 2: Add the shared helpers**

Insert above the existing `/* ---- Bullet writing help ... ---- */` section:

```js
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
```

- [ ] **Step 3: Rewire the three open functions and delete the old copy functions**

Replace `openAndCopyGpt`, `copyGptPrompt` with:

```js
function openAndCopyGpt(i){
  openChatGptWithPrompt(buildGptPrompt(data.experiences[i]), `gpt-status-${i}`);
}
```

Replace `openAndCopySkillsGpt`, `copySkillsGptPrompt` with:

```js
function openAndCopySkillsGpt(){
  openChatGptWithPrompt(buildSkillsGptPrompt(), "skills-gpt-status");
}
```

Replace `openAndCopyStatementGpt`, `copyStatementGptPrompt` with:

```js
function openAndCopyStatementGpt(){
  openChatGptWithPrompt(buildStatementGptPrompt(data), "statement-gpt-status");
}
```

- [ ] **Step 4: Remove the hidden prompt textareas**

Delete the `<textarea id="gpt-prompt-${i}" ...>` line from `gptPanelHTML`, `<textarea id="skills-gpt-prompt" ...>` from `skillsGptPanelHTML`, and `<textarea id="statement-gpt-prompt" ...>` from `statementGptPanelHTML` — they existed only for the old select-and-copy trick.

- [ ] **Step 5: Verify manually**

Run: `npx serve .` and open the URL in Chrome. In the Experience tab, choose "Get help from ChatGPT", type notes, and click the open button. Expected: a new tab opens at chatgpt.com with the full prompt already typed in the composer, and the status line in the app reads the `gptOpened` text. Then block popups for the site (Chrome site settings), click again: no tab opens, status shows the `gptCopiedFallback` text, and pasting anywhere yields the prompt.

- [ ] **Step 6: Commit**

```bash
git add script.js
git commit -m "Open ChatGPT with prompt pre-filled via ?q=, clipboard fallback"
```

---

### Task 2: Honest status text — remove the premature "Already copied" hint

**Files:**
- Modify: `script.js` — `gptPanelHTML` (~line 560), `skillsGptPanelHTML` (~line 617), `statementGptPanelHTML` (~line 918), and the `alreadyCopied` key in `EN`/`MH`

**Interfaces:**
- Consumes: status element ids `gpt-status-${i}`, `skills-gpt-status`, `statement-gpt-status` written by `openChatGptWithPrompt` (Task 1).

- [ ] **Step 1: Empty the status hints at render time**

In each of the three panel functions, change the status hint div so it renders empty (it gets filled only after the user clicks):

```js
<div class="hint" id="gpt-status-${i}" style="margin-top:8px;margin-bottom:8px;font-size:12.5px;"></div>
```

(same change for `skills-gpt-status` and `statement-gpt-status` — keep their existing ids and inline styles, just remove the `${mh('alreadyCopied')}` content).

- [ ] **Step 2: Delete the `alreadyCopied` key** from both `EN` and `MH`, and remove any remaining references (grep for `alreadyCopied` — there must be zero matches after this step).

- [ ] **Step 3: Verify manually**

Reload the app. In each of the three helpers (job bullets, skills, summary), confirm no "Already copied" text is visible before clicking, and the status line appears only after clicking the open button.

- [ ] **Step 4: Commit**

```bash
git add script.js
git commit -m "Show ChatGPT helper status only after the user acts"
```

---

### Task 3: Consistent Step 1/2/3 labels and typo fixes across all three panels

**Files:**
- Modify: `script.js` — `gptPanelHTML`, `experienceHTML` (bullets pre-step label), `skillsGptPanelHTML`, `statementGptPanelHTML`, `statementHTML` intro copy, `pastePlaceholder`

**Interfaces:**
- Produces: the uniform step pattern later tasks slot into — Step 1 = open ChatGPT, Step 2 = copy the answer (illustration added in Task 4), Step 3 = paste + generate.

- [ ] **Step 1: Relabel the bullets panel**

In `gptPanelHTML`, the notes textarea's label currently in `experienceHTML` reads "Step 1: List out what you did" — change it to an unnumbered lead-in:

```js
<label style="font-size:14px;font-weight:700;color:var(--navy);margin-top:4px;display:block;">First, list what you did at this job</label>
```

Then in `gptPanelHTML` set the labels/buttons to:

```js
<label ...>Step 1: Open ChatGPT</label>
...
<button class="gold-btn" style="width:100%;" onclick="openAndCopyGpt(${i})">Step 1: Open ChatGPT — your info goes with you</button>
<label ... style="...margin-top:28px;...">Step 3: Paste ChatGPT's answer here</label>
<textarea id="gpt-paste-${i}" ... placeholder="${pastePlaceholder(3)}"></textarea>
<button class="gold-btn" style="width:100%;" onclick="insertGptBullets(${i})">Step 3: Generate my bullet points</button>
```

(Step 2 markup is added by Task 4 between them.)

- [ ] **Step 2: Relabel the skills panel** in `skillsGptPanelHTML` the same way: button text `Step 1: Open ChatGPT — your info goes with you` (fixes the "paste ChatGPT" typo), paste label `Step 3: Paste ChatGPT's answer here` with `pastePlaceholder(3)`, generate button `Step 3: Update my skills`.

- [ ] **Step 3: Relabel the statement panel** in `statementGptPanelHTML`: button `Step 1: Open ChatGPT — your info goes with you`, paste label `Step 3: Paste ChatGPT's answer here` with `pastePlaceholder(3)`, generate button `Step 3: Update my summary` (fixes "Click here update Summary").

- [ ] **Step 4: Update `pastePlaceholder` and the statement intro copy**

`pastePlaceholder` currently says "Copy what ChatGPT gave you, paste it here, then click the button below" — keep the English but make the step number match (`Step ${step}` already interpolated for MH; verify both languages read correctly for step 3). In `statementHTML`, update the 3-numbered intro instructions to match the new flow:

```
1. Click Step 1 — ChatGPT opens with your info already typed in. Tap Send there.
2. When ChatGPT answers, tap the copy icon under its reply.
3. Come back here, paste it in the box, then click Step 3.
```

Apply the equivalent edit to the Marshallese branch of that template (adjust the step wording; keep existing MH sentences where they still apply).

- [ ] **Step 5: Verify manually**

Walk all three helpers in the browser: every panel shows Step 1 (open) and Step 3 (paste/generate) with matching numbers on label, placeholder, and button; no "paste ChatGPT" / "update Summary" typos remain (grep `script.js` for `paste ChatGPT` and `here update` — zero matches).

- [ ] **Step 6: Commit**

```bash
git add script.js
git commit -m "Unify ChatGPT helper step labels and fix button typos"
```

---

### Task 4: "Copy ChatGPT's answer" illustration (Step 2)

**Files:**
- Modify: `script.js` — new `copyAnswerIllustrationHTML()` + insertion into the three panels; EN/MH strings
- Modify: `style.css` — new `.gci-*` rules at the end of the file

**Interfaces:**
- Consumes: `mh(key)` and `esc()`.
- Produces: `copyAnswerIllustrationHTML()` returning the Step 2 block, used identically in all three panels.

- [ ] **Step 1: Add strings** to both `EN` and `MH`:

```js
  copyAnswerTitle: "Step 2: Copy ChatGPT's answer",
  copyIconLabel: "Tap this copy icon under ChatGPT's reply",
  copyAnswerHint: "When ChatGPT answers, look under its reply for the copy icon, tap it, then come back to this page.",
```

- [ ] **Step 2: Add the component** near the other shared helpers in `script.js`:

```js
/* ---- Shared: Step 2 illustration showing where ChatGPT's copy icon is ---- */
function copyAnswerIllustrationHTML(){
  return `
  <label style="font-size:14px;font-weight:700;color:var(--navy);display:block;margin-top:28px;margin-bottom:6px;">${esc(mh('copyAnswerTitle'))}</label>
  <div class="gci">
    <div class="gci-bubble">
      <div class="gci-line"></div>
      <div class="gci-line short"></div>
      <div class="gci-line"></div>
      <div class="gci-actions">
        <span class="gci-copy-icon">⧉</span>
        <span class="gci-callout">← ${esc(mh('copyIconLabel'))}</span>
      </div>
    </div>
    <div class="hint" style="margin-top:8px;">${esc(mh('copyAnswerHint'))}</div>
  </div>`;
}
```

- [ ] **Step 3: Add the CSS** at the end of `style.css`:

```css
/* ---- ChatGPT copy-answer illustration ---- */
.gci-bubble{
  background:#fff;
  border:1px solid var(--line);
  border-radius:10px;
  padding:12px 14px 10px;
}
.gci-line{
  height:8px;
  border-radius:4px;
  background:var(--bg);
  margin-bottom:7px;
}
.gci-line.short{ width:62%; }
.gci-actions{
  display:flex;
  align-items:center;
  gap:8px;
  margin-top:10px;
}
.gci-copy-icon{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:26px;
  height:26px;
  border:2px solid var(--gold);
  border-radius:6px;
  color:var(--navy);
  font-size:14px;
  font-weight:700;
  background:var(--gold-light);
}
.gci-callout{
  font-size:12px;
  font-weight:700;
  color:var(--navy);
}
```

- [ ] **Step 4: Insert `${copyAnswerIllustrationHTML()}` into all three panels** — in `gptPanelHTML`, `skillsGptPanelHTML`, and `statementGptPanelHTML`, directly between the Step 1 button and the Step 3 paste label. Remove the `margin-top:28px` from the Step 3 label in each panel (the illustration block now provides the spacing via its own label's `margin-top:28px`).

- [ ] **Step 5: Verify manually**

All three helpers show the mock reply bubble with a highlighted ⧉ icon and callout between Step 1 and Step 3, in both English and Marshallese toggle states, and it looks right at 375px width (Chrome device toolbar, iPhone SE).

- [ ] **Step 6: Commit**

```bash
git add script.js style.css
git commit -m "Add Step 2 illustration showing ChatGPT's copy icon"
```

---

### Task 5: Paste feedback on the answer boxes

**Files:**
- Modify: `script.js` — the three paste textareas + new `markPasted()` helper + EN/MH string

**Interfaces:**
- Consumes: the paste textareas from Task 3 (`gpt-paste-${i}`, `skills-gpt-paste`, `statement-gpt-paste`).
- Produces: `markPasted(feedbackId)` and dedicated feedback divs under each paste box — deliberately separate from the Task 1 status elements so paste feedback never overwrites the Step 1 status.

- [ ] **Step 1: Add string** to `EN` and `MH`:

```js
  pasteGotIt: "Got it ✓ — now tap the Step 3 button below.",
```

- [ ] **Step 2: Add helper + feedback elements**

Helper (near the other shared helpers):

```js
function markPasted(feedbackId){
  setTimeout(()=>{
    const el = document.getElementById(feedbackId);
    if(el) el.textContent = mh('pasteGotIt');
  }, 50);
}
```

In each panel, add `onpaste` to the paste textarea and a feedback div right after it. Bullets panel:

```js
<textarea id="gpt-paste-${i}" style="margin-bottom:4px;" placeholder="${pastePlaceholder(3)}" onpaste="markPasted('gpt-paste-fb-${i}')"></textarea>
<div class="hint" id="gpt-paste-fb-${i}" style="margin-bottom:10px;color:var(--ok);font-weight:600;"></div>
```

Skills panel: ids `skills-gpt-paste` / `skills-gpt-paste-fb`. Statement panel: ids `statement-gpt-paste` / `statement-gpt-paste-fb`. Same pattern.

- [ ] **Step 3: Verify manually**

Paste text into each of the three boxes: the green "Got it ✓" line appears under the box within a beat, and the Generate button still works.

- [ ] **Step 4: Commit**

```bash
git add script.js
git commit -m "Show instant feedback when ChatGPT's answer is pasted"
```

---

### Task 6: Persistent in-app browser banner under the Edit/Preview toggle

**Files:**
- Modify: `index.html:13-19` (banner placement/order relative to `.mobile-toggle`)
- Modify: `style.css` (sticky positioning rule)
- Modify: `script.js` — `closeInappWarning` (~line 1353) only if the banner text needs the same wording pass; behavior already shows the banner

**Interfaces:**
- Consumes: `getInAppBrowserName()` (existing).

- [ ] **Step 1: Make the banner sticky**

Add to `style.css`:

```css
#inapp-banner{
  position:sticky;
  top:0;
  z-index:60;
}
```

The `.mobile-toggle` bar renders above it in the DOM (index.html line 13 vs 19) — confirm `.mobile-toggle`'s own CSS; if `.mobile-toggle` is `position:sticky`/`fixed`, set the banner's `top` to the toggle's height instead of `0` so they don't overlap (check the computed height in DevTools and hardcode it, e.g. `top:44px`, with a comment).

- [ ] **Step 2: Verify manually**

In Chrome DevTools, override the user agent to a Facebook in-app string (Network conditions → user agent → custom: append `FBAN/FBIOS`). Reload: red modal appears; press "Got it": modal closes and the red banner shows under the Edit/Preview toggle; scroll the form — the banner stays pinned; switch Edit/Preview — banner persists.

- [ ] **Step 3: Commit**

```bash
git add index.html style.css script.js
git commit -m "Keep in-app browser warning banner pinned after dismissal"
```

---

### Task 7: Analytics via Google Apps Script → Google Sheet

**Files:**
- Create: `google-apps-script/analytics.gs` (checked into the repo as the source of truth; deployed manually by the owner)
- Create: `google-apps-script/README.md` (deploy instructions)
- Modify: `script.js` — `trackEvent` (~line 1439) and a new `ANALYTICS_URL` const
- Modify: `index.html:66` — bump to `script.js?v=13`

**Interfaces:**
- Produces: `ANALYTICS_URL` const (empty string disables sending); `trackEvent` POSTs the same payload shape as today.

- [ ] **Step 1: Write the Apps Script** at `google-apps-script/analytics.gs`:

```js
// Resume Builder analytics collector.
// Bind this script to a Google Sheet (Extensions -> Apps Script), then
// Deploy -> New deployment -> Web app -> Execute as: Me, Access: Anyone.
const SHEET_NAME = 'events';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['receivedAt', 'timestamp', 'event', 'sessionId', 'deviceType',
                       'browser', 'language', 'success', 'timeSpentSeconds', 'step', 'mode', 'userAgent']);
    }
    const d = JSON.parse(e.postData.contents);
    sheet.appendRow([new Date(), d.timestamp || '', d.event || '', d.sessionId || '',
                     d.deviceType || '', d.browser || '', d.language || '',
                     d.success === undefined ? '' : d.success, d.timeSpentSeconds || '',
                     d.step || '', d.mode || '', d.userAgent || '']);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

- [ ] **Step 2: Write `google-apps-script/README.md`**:

```markdown
# Analytics setup (Google Sheets, free)

1. Create a new Google Sheet (this becomes the analytics database).
2. Extensions -> Apps Script. Delete the default code, paste in `analytics.gs`, save.
3. Deploy -> New deployment -> type "Web app".
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the web app URL (ends in `/exec`).
5. In `script.js`, set `ANALYTICS_URL` to that URL.
6. Redeploy the site (bump the `script.js?v=` number in `index.html`).

Events land as rows in the `events` tab of the Sheet. To update the script
later, edit it in Apps Script and use Deploy -> Manage deployments -> Edit ->
new version (the URL stays the same).
```

- [ ] **Step 3: Update `trackEvent` in `script.js`**

Add above the `/* ---------------- ANALYTICS ---------------- */` block's `sessionId`:

```js
// Google Apps Script web-app URL (see google-apps-script/README.md).
// Leave empty to disable analytics.
const ANALYTICS_URL = "";
```

Replace the `fetch('/api/analytics', ...)` call inside `trackEvent` with:

```js
  if(ANALYTICS_URL){
    // text/plain + no-cors avoids a CORS preflight, which Apps Script can't answer.
    fetch(ANALYTICS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    }).catch(() => {}); // never block or bother the user over analytics
  }
```

- [ ] **Step 4: Bump the cache buster** in `index.html`: `script.js?v=12` → `script.js?v=13`.

- [ ] **Step 5: Verify manually**

Owner-side (requires the user's Google account, coordinate with them): follow the README, set `ANALYTICS_URL`, reload the app, and confirm an `app_opened` row appears in the Sheet, then download a PDF and confirm a `download_attempted` row. Code-side check that can be done immediately: with `ANALYTICS_URL = ""`, the console still logs `Analytics: {...}` payloads and the Network tab shows no analytics request.

- [ ] **Step 6: Commit**

```bash
git add google-apps-script/ script.js index.html
git commit -m "Send analytics to Google Sheets via Apps Script webhook"
```

---

### Task 8: Full manual regression pass

**Files:** none (verification only)

- [ ] **Step 1: Full walkthrough, desktop Chrome** — fill every tab, run all three ChatGPT helpers end-to-end against real chatgpt.com (?q= prefill arrives, Send works, copy icon exists where the illustration says, paste-back parses), download the PDF.
- [ ] **Step 2: Mobile emulation (375px)** — repeat the bullets helper; check the illustration, step labels, and paste feedback; toggle Marshallese and re-check all new strings render (English fallback expected).
- [ ] **Step 3: In-app browser UA override** — popup-block fallback status text appears; banner persists after "Got it".
- [ ] **Step 4: Grep hygiene** — `grep -n "alreadyCopied\|paste ChatGPT\|here update\|/api/analytics" script.js` returns nothing.
- [ ] **Step 5: Commit any fixes found**, then push the branch:

```bash
git push origin download-and-clarity-fixes
```
