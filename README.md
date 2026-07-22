# Resume Builder

A free, bilingual (English/Marshallese) resume builder built for the Arizona Marshallese Community. Fill out a form, get optional AI-assisted writing help, and download a polished one-page PDF resume — no sign-up, no build step, all in the browser.

## Features

- **Step-by-step form** — personal info, experience, education, skills, and a professional statement, with a live preview panel updating as you type.
- **Bilingual UI** — toggle between English and Marshallese at any point.
- **ChatGPT-assisted writing** — generate prompts for job bullets, skills, and your statement, copy them to ChatGPT, and paste the response back in to auto-fill the resume.
- **Auto-generated statement fallback** — if you skip the AI step, a professional statement is synthesized automatically from your experience, skills, and education.
- **One-page guarantee** — the layout automatically trims the summary and skills sections (never your work history or education) to keep the resume to a single page.
- **One-click PDF export** — renders the resume to a print-ready, letter-size PDF entirely client-side.
- **In-app browser handling** — detects browsers like Facebook, Instagram, Snapchat, TikTok, and WhatsApp that block file downloads, and shows instructions instead of failing silently.
- **Start Over** — reset the form with a two-step confirmation to avoid accidental data loss.

## Tech stack

- Vanilla HTML/CSS/JS — no framework, no bundler, no build step.
- [html2canvas](https://html2canvas.hertzen.com/) + [jsPDF](https://github.com/parallax/jsPDF) (loaded via CDN) for client-side PDF generation.
- A minimal [Express](https://expressjs.com/) backend (`backend/`) for anonymous usage analytics, deployed separately to Vercel.

## Getting started

### Frontend

No install or build step required.

```bash
# Open directly in a browser
open index.html

# Or serve it locally
npx serve .
```

### Backend (analytics, optional)

```bash
cd backend
npm install
npm start
```

Runs on `PORT` (default `3000`). Exposes `POST /api/analytics` and `GET /health`. Deployed to Vercel via `backend/vercel.json`.

## Project structure

```
index.html      Static page shell: layout, panels, and modals
script.js       All app logic: state, rendering, form steps, PDF export, analytics
style.css       Styling
backend/        Express analytics server (deployed separately)
assets/         Static assets (e.g. logo)
docs/           Project docs
```

## Notes

- When editing `script.js`, bump the `?v=NN` cache-busting query string on the `<script>` tag in `index.html` so deployed clients pick up the change.
- The backend's CORS is restricted to the production frontend origin and `localhost:3000` — update it if the deployed frontend origin changes.
