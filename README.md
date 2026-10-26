# Cozy Bear Cottage 小熊中文 — web app skeleton

A mobile web app (PWA): it runs in the browser on a phone or tablet, no
app-store download. Teachers can open the same link on a laptop to print
flashcards and worksheets.

**Status (Oct 20, 2026):** skeleton prepared ahead of the hackathon.
The structure, the three features, the design, and the serverless API proxy
are in place. The only pieces that cannot be finished until selection are
the real Meta Model API routes — participants receive Muse Spark /
Muse Image / SAM 3.1 access (and $150 credits) when the hackathon opens
**Oct 26, 2026**. Those three routes are marked `TODO(Oct 26)` in exactly
one file: `api/meta.js`. Until then the app runs on a built-in sample
lesson so it is demoable offline.

## Run it

```bash
cd ~/workspace/meta-hackathon-2026/cozy-bear-cottage-app
npm install
cp .env.example .env.local   # fill in META_API_KEY / META_API_BASE_URL when issued
npm run dev                  # http://localhost:5173
```

## Deploy (for the Nov 4 submission link)

Push this folder to the project's GitHub repo, import it in Vercel (or
Netlify / Cloudflare Pages), set `META_API_KEY` and `META_API_BASE_URL`
as server-side environment variables, deploy. The `/api/meta` function
keeps the key off the browser. Submission needs the live public link,
the write-up, and the demo — all due **Nov 4, 2026, 9:00 PM ET**,
submitted by one designated submitter listing all team members.

## Layout

- `src/App.jsx` — shell: reading-bear mascot, Vivian's design credit, 3 tabs
- `src/features/LessonBuilder.jsx` — Muse Spark lesson plan + teaching script
- `src/features/Flashcards.jsx` — Muse Image cards + print-to-PDF pack
- `src/features/PointAndSay.jsx` — SAM 3.1 tap-to-name, Web Speech (zh-CN), stars
- `src/lib/metaApi.js` — all model calls via the proxy, with honest fallbacks
- `src/data/sampleLesson.js` — colors lesson (the real Oct 24 Saturday class theme)
- `api/meta.js` — serverless proxy; the one file to finish on Oct 26
- `src/styles.css` — Vivian's palette: light blue (no orange, per her direction);
  her artwork itself is never recolored
- `public/assets/` — bear-reading.jpg (mascot), bear-cutout.png, Vivian's rainbow apple

## Build plan mapping (from the project plan)

Oct 26–27 skeleton + Lesson Builder · Oct 28–29 Flashcards + print ·
Oct 30–Nov 1 Point-and-Say · Nov 2 test with a real Saturday lesson ·
Nov 3 polish + demo · Nov 4 submit before 9:00 PM ET.
This skeleton is the Oct 26–27 step, done early.
