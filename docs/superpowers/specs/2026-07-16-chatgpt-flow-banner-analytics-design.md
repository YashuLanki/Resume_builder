# Design: Easier ChatGPT flow, persistent in-app banner, Google Sheets analytics

**Date:** 2026-07-16
**Status:** Approved

## Goal

Make the resume builder easier for non-technical users. The top complaint is the
ChatGPT copy/paste round-trip: users don't know how to paste the prompt into
ChatGPT or how to copy its answer back. Secondary items: keep the in-app-browser
warning visible after dismissal, and fix analytics, which currently cannot work
on Vercel (deploy error + ephemeral filesystem).

Constraint: the app must stay free to operate — no paid AI API.

## 1. ChatGPT helper redesign (bullets, skills, summary — all three)

One consistent 3-step pattern across all three helpers.

### Step 1 — "Open ChatGPT — your info goes with you"

- Single gold button opens `https://chatgpt.com/?q=<encodeURIComponent(prompt)>`.
  The prompt arrives pre-typed in ChatGPT's composer; the user only taps Send.
  Eliminates both clipboard copy and paste-into-ChatGPT.
- **Fallback:** if `window.open` returns null (popup blocked, common in in-app
  browsers), fall back to the existing clipboard-copy behavior and show honest
  instructions: "We copied your info — open chatgpt.com and paste it."
- Remove the premature "Already copied ✓" hint. Status text appears only after
  the user acts and describes what actually happened.
- Prompt sizes after URL-encoding stay ~2–3k chars, well under URL limits.
- Keep/tighten the "return only plain text, no markdown" instructions in each
  prompt so ChatGPT's reply is clean to copy.

### Step 2 — "Copy ChatGPT's answer"

- Small in-app illustration built with HTML/CSS (no screenshot assets): a mock
  ChatGPT reply bubble with the copy icon (⧉) highlighted and an arrow/label.
- One instruction sentence: "Under ChatGPT's answer, tap the copy icon, then
  come back here."
- Both the illustration label and sentence go through the existing `EN`/`MH`
  string objects so the Marshallese toggle covers them.

### Step 3 — "Paste it here" + Generate

- Paste box and explicit Generate button stay (user preference).
- Add a `paste` event listener on the box that shows instant feedback:
  "Got it ✓ — now tap Generate."
- Existing defensive parsing (`splitGptLines`, `stripMarkdownLine`, label
  regexes, merge-dedup) is unchanged.

### Wording fixes

- Consistent Step 1/2/3 numbering across bullets, skills, and summary panels
  (today bullets use 1–3 while skills/summary use 1–2 with different meanings).
- Fix typos: "Click here to paste ChatGPT" → missing "in";
  "Click here update Summary" → missing "to".
- Button labels must describe the actual action performed.

## 2. Persistent in-app browser banner

`closeInappWarning()` already sets `#inapp-banner` visible after "Got it".
Verify and fix so the red banner reliably renders pinned at the top, under the
Edit/Preview mobile toggle, for the rest of the session. DOM order in
`index.html` currently places `#inapp-banner` after `.mobile-toggle`; adjust
positioning/ordering as needed. Small, contained fix.

## 3. Analytics: Google Sheets via Apps Script webhook

The current Vercel backend is broken twice over:

1. **Deploy error:** `backend/vercel.json` uses legacy `builds`/`routes` config
   and `server.js` calls `app.listen()`; Vercel serverless requires exporting
   the Express app instead.
2. **Fatal:** Vercel functions have an ephemeral filesystem —
   `fs.writeFileSync` to `backend/data/` silently loses all data.

**Decision:** drop the Vercel backend for analytics. The frontend POSTs events
directly to a free Google Apps Script web-app URL bound to a Google Sheet.

- Apps Script `doPost(e)` appends one row per event (timestamp, event name,
  sessionId, device, browser, language, plus event-specific fields).
- Deploy the script as a web app ("Anyone" access) — its URL replaces the
  relative `/api/analytics` fetch in `trackEvent()`. Use `mode: 'no-cors'` or
  a plain form-encoded POST to avoid CORS preflight issues with Apps Script.
- Analysis happens directly in the Sheet — no tooling, fits the non-technical
  goal.
- This sidesteps the azmarshallese/YashuLanki Vercel account tangle entirely.
  The `backend/` directory becomes unused; leave it in place but untouched
  (removal can be a separate cleanup later).

## 4. Out of scope

Resume preview, PDF export, one-page fit ladder, form steps, and the bilingual
toggle mechanism are unchanged.

## Error handling summary

- Popup blocked → clipboard fallback with honest instructions.
- Clipboard fails too → status text tells the user to open chatgpt.com and
  what to type/paste manually.
- Analytics POST failures remain silently swallowed (never block the user).

## Testing

Manual, no test framework exists:

- Desktop Chrome/Safari: ?q= prefill opens with prompt in composer.
- Mobile Safari/Chrome: same, plus paste-feedback listener.
- In-app browser (Facebook/Messenger): popup-block fallback path and
  persistent banner.
- Marshallese toggle: all new strings swap correctly.
- Google Sheet receives rows for `app_opened` and `download_attempted`.
