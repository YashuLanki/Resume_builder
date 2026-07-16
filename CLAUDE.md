# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, no-build resume builder for the Arizona Marshallese Community: a single HTML page with a form panel (left) and a live resume preview (right), client-rendered by one vanilla JS file. Users fill out a form, optionally get writing help by copy-pasting prompts into ChatGPT, and download a one-page PDF generated in the browser. A small Express backend (deployed separately on Vercel) records anonymous usage analytics.

## Running / testing

There is no build step, bundler, package manager, or test suite for the frontend — it's plain HTML/CSS/JS loaded directly in a browser.

- Frontend: open `index.html` directly, or serve the directory with any static server (e.g. `npx serve .`).
- Backend (`backend/`): `cd backend && npm install && npm start` — runs the Express analytics server on `PORT` (default 3000). Deployed to Vercel via `backend/vercel.json`.
- When editing `script.js`, bump the `?v=NN` cache-busting query string on the `<script>` tag in `index.html` (currently `script.js?v=12`) so deployed clients pick up the change.
- There are two remotes: `origin` (`YashuLanki/resume_builder`) and `azm` (`azmarshallese/resume_builder`, the org's fork/production repo). Confirm which remote a push/PR should target before assuming `origin`.

## Architecture

**`index.html`** — static shell only: the mobile edit/preview toggle, the two-panel layout (`#panel-form` / `#panel-preview`), and a handful of modals (iOS save instructions, in-app-browser warning, download result). All dynamic content is injected into `#form-scroll` and `#resume-page` by `script.js`. Loads `html2canvas` and `jsPDF` from cdnjs for PDF export.

**`script.js`** — everything else, organized as one file with clear section comments. Key pieces:

- **State**: a single global `data` object (name, contact info, `experiences[]`, `education[]`, languages/certifications/otherSkills) plus UI state like `currentStep`, `skillsInputMode`, `expandedJobs`/`expandedEdus`. There's no framework — every mutation is followed by an explicit `renderForm()` or `renderPreview()` call to re-render from state.
- **Multi-step form**: `personal` → `experience` → `education` → `skills` → `statement`, driven by `goStep()` / `currentStep`, each step rendered by its own `*HTML()` function (`personalHTML`, `experienceHTML`, etc.) that returns an HTML string assigned to `#form-scroll`.
- **Bilingual UI**: English/Marshallese strings live in the `EN`/`MH` objects, looked up via `mh(key)`; `toggleLang()` swaps `lang` and re-renders. New user-facing copy should go through this pattern rather than being hardcoded, or `toggleLang()` will get out of sync.
- **ChatGPT-assisted writing**: for job bullets, skills, and the professional statement, the app builds a prompt (`buildGptPrompt`, `buildSkillsGptPrompt`, `buildStatementGptPrompt`), copies it to the clipboard, opens chatgpt.com in a new tab, and lets the user paste the response back into a textarea. `insertGptBullets` / `insertGptSkills` / `insertGptStatement` then parse that free-text response (`splitGptLines`, `stripMarkdownLine`, label-matching regexes) back into structured data. This parsing is intentionally defensive since it's consuming unstructured LLM output pasted by hand.
- **Auto-generated statement fallback**: if the user never edits the summary (`data.statementEdited` is false), `buildStatement()` synthesizes a 4-sentence professional statement procedurally from experience/skills/education — this is what's shown in the live preview and PDF until the user runs the ChatGPT flow or edits it manually.
- **One-page-fit ladder**: `renderPreview()` renders the resume via `buildResumeHTML()` and measures overflow (`pageOverflows`) against a fixed 8.5x11in page. If it overflows, it steps down through a fallback ladder (full → 3-sentence summary → max-3 skills → no summary → no skills) via `checkFit()`, updating the `#fit-note` message. Work experience and education are never trimmed — only the summary and skills sections are candidates for shrinking/removal.
- **PDF export** (`downloadPDF`): snapshots `#resume-page` with `html2canvas`, scales the resulting image to fit a letter-size page, and embeds it in a `jsPDF` document. Handles in-app-browser detection (Facebook/Instagram/Snapchat/WhatsApp/TikTok/Messenger UAs block blob downloads) by showing warning banners/modals instead of relying on the automatic download succeeding silently.
- **Analytics** (`trackEvent`/`trackAppOpen`/`trackDownload`, bottom of the file): fires `fetch('/api/analytics', ...)` with a session ID persisted in `localStorage`, silently swallowing failures. This only resolves correctly when the frontend is served from the same origin as the Vercel backend (or otherwise proxied) — the endpoint is a relative path, not an absolute URL.

**`backend/server.js`** — minimal Express app with two routes: `POST /api/analytics` (appends events to per-event-type, per-date JSON files under `backend/data/`, which is gitignored) and `GET /health`. CORS is locked to `https://azmarshallese.github.io` and `http://localhost:3000` — update the `cors()` origin list if the frontend's deployed origin changes.

## Notes

- `azm-check/` at the repo root is an unrelated, untracked scratch clone (its own nested `.git`) — not part of this project's source tree.
- No linter or formatter is configured; match the existing code style (semicolon-terminated, minimal whitespace in nested ternaries/template strings, section-header comments like `/* ---------------- SECTION ---------------- */`).
