# Cozy Bear Cottage 小熊中文 — Architecture

> AI co-teacher for parent-run weekend Chinese classes (ages 3–6).
> Live: https://cozybear-cottage.vercel.app · Repo: `hellohelloye/cozy-bear-cottage-app`
> Scope note: this terminal and doc cover only the **cozybear** Vercel team project.

## 1. System context

```mermaid
flowchart LR
  Teacher["Teacher / child<br/>(phone, tablet, laptop browser)"]
  CDN["Vercel CDN<br/>static PWA (dist/)"]
  Fn["Vercel Function<br/>POST /api/meta"]
  Meta["Meta Model API<br/>api.meta.ai/v1"]
  DS["Dataset PDFs<br/>resources/ (source only)"]

  Teacher -->|HTTPS, installable PWA| CDN
  Teacher -->|POST /api/meta {kind, payload}| Fn
  Fn -->|Bearer META_API_KEY, server-side only| Meta
  DS -.->|extracted once at build time| CDN
```

Design drivers: no app store (link sharing), no accounts/database in the MVP,
the API key must never reach the browser, and every AI feature must degrade
to a working offline path so a Saturday class never dead-ends.

## 2. Component map

| Layer | File(s) | Responsibility |
|---|---|---|
| App shell | [src/App.jsx](../src/App.jsx) | Header art (pony/bear/fairy), 4 tabs (Lesson / Flashcards / Point-and-Say / About), **shared lesson state** (`lesson`, `themeId`, `ageRange`) persisted to `localStorage` (`cozy-bear-lesson-v1`) |
| Entry | [src/main.jsx](../src/main.jsx), [index.html](../index.html) | React 18 root, StrictMode |
| Lesson Builder | [src/features/LessonBuilder.jsx](../src/features/LessonBuilder.jsx) | Theme + age pickers -> `generateLesson()` -> renders 45-min lesson; hosts the song player |
| Song player | [src/features/SongPlayer.jsx](../src/features/SongPlayer.jsx) | Per-category catalog video (official FB/IG embeds) + offline karaoke (speechSynthesis, line highlight) + paste-a-link embed (YouTube/MP4) |
| Flashcards | [src/features/Flashcards.jsx](../src/features/Flashcards.jsx) | Parallel image generation per word; print pack = flashcards + trace worksheet + coloring page (`@media print`) |
| Point-and-Say | [src/features/PointAndSay.jsx](../src/features/PointAndSay.jsx) | Camera (`getUserMedia`) / upload / bundled photo; tap -> normalized point -> segment naming -> speak + star + Vivian sticker reward (`cozy-bear-stars`) |
| About / Contact | [src/features/AboutUs.jsx](../src/features/AboutUs.jsx) | Static page (no API, works offline): project story, 3-feature summary, Saturday class poster (`/assets/class-poster.png`), team list, contact email/class/live-app/repo links |
| Client API | [src/lib/metaApi.js](../src/lib/metaApi.js) | All model calls via proxy; response validation/normalization; honest fallbacks |
| Catalog data | [src/data/themes.js](../src/data/themes.js) | 11 themes x word sets + songs (offline lesson factory `buildFallbackLesson`) |
| Video catalog | [src/data/catalogVideos.js](../src/data/catalogVideos.js) | 111 reel links extracted from the dataset PDF annotations, grouped by section |
| Sample lesson | [src/data/sampleLesson.js](../src/data/sampleLesson.js) | Hand-built colors lesson; highest-fidelity offline default |
| Serverless proxy | [api/meta.js](../api/meta.js) | Validates `{kind, payload}`, shapes upstream calls, chains SAM -> Spark naming, maps errors (400/405/502/503) |
| Assets | `public/assets/` | Web-sized copies (originals in `resources/`, never served): cutouts, 12 stickers, photos, Saturday class poster (`class-poster.png`, About page) |
| Styling | [src/styles.css](../src/styles.css) | Vivian's light-blue palette, fluid layout to 1600px, print pipeline |

## 3. Runtime flows

### 3.1 Lesson generation (Muse Spark)

```mermaid
sequenceDiagram
  participant U as Teacher
  participant LB as LessonBuilder
  participant P as /api/meta
  participant S as muse-spark-1.3
  U->>LB: pick theme + age, Build
  LB->>P: {kind:"lesson", payload:{theme, ageRange}}
  P->>S: POST /chat/completions (max_tokens 4000*)
  S-->>P: chat.completion (JSON text in message.content)
  P->>P: parseJsonText -> validate words[]
  P-->>LB: lesson JSON
  LB->>LB: onLesson() -> App state -> Flashcards + Point-and-Say re-render
  Note over P,S: *reasoning tokens consume the budget; small budgets return empty content
  Note over LB: On any failure: catalog fallback lesson (same JSON shape)
```

### 3.2 Flashcards (Muse Image)

Browser fans out one `POST {kind:"image"}` per word in parallel. Proxy calls
`POST /images/generations` (`muse-image-1.0`); upstream returns `b64_json`
(WebP) which the proxy re-serves as a `data:` URL. Null image -> emoji card.
Print stylesheet emits 3 sheets: cards, tracing, coloring.

### 3.3 Point-and-Say (SAM 3.1 + Spark vision)

Naming and outlining are separate paths (both verified live, Oct 27, 2026):

```mermaid
sequenceDiagram
  participant C as Child
  participant PS as PointAndSay
  participant P as /api/meta
  participant S as muse-spark-1.3 (vision)
  participant SAM as sam-3.1 (video)
  C->>PS: tap photo (point normalized 0..1, winter-puppy default)
  PS->>P: {kind:"segment", payload:{image: dataURL, point}}
  P->>S: chat/completions with photo + point
  S-->>P: {zh, pinyin, en, box} (coarse outline)
  P-->>PS: name + box -> highlight, speak, star, sticker
  PS->>PS: photo -> ~1s clip (canvas + MediaRecorder, best-effort)
  PS->>P: {kind:"segment", payload:{video: clip, concept: en}}
  P->>SAM: POST /responses, input_text(concept) + input_video
  SAM-->>P: "<Nf><id><|box;...|><|mask;...|>" per frame
  P->>P: parseSamTokens -> first frame, normalized box + mask geometry
  P-->>PS: {box, mask} -> tighter outline replaces vision box
```

Why two paths: SAM 3.1 on this API is a **video tracker**, not an image
segmenter — still-image calls return empty text, while a video + concept
prompt returns native tokens:
`<Nf><objectId><|box;x1;y1;x2;y2;w;h|><|mask;x;y[;c];data=<H>,<W>,<enc><payload>|>`
(box in frame pixels, normalized by `w/h` in `parseSamTokens`). Mask
payload decoding is retained raw; the UI currently renders the box.
If either path yields nothing, target-word practice keeps the game playable.

### 3.4 Songs

Selected category -> `catalogFor(themeId)` -> embedded player (Instagram
`/embed/`, Facebook `plugins/video.php`) with per-video chips; FB/IG login
walls fall back to open-externally. Karaoke mode needs no network:
`speechSynthesis` (zh-CN, slower at ages 3-4) walks generated lines with
highlight. Teacher-pasted YouTube/MP4 links embed via `youtube-nocookie`
and persist per category in `localStorage`.

### 3.5 About / Contact (static)

Fourth tab (`About 关于我们`, added Oct 28, 2026) renders
[src/features/AboutUs.jsx](../src/features/AboutUs.jsx) — fully static, no
`/api/meta` or network call beyond the bundled poster image
(`/assets/class-poster.png`, from `public/assets/`). Content: project
story (real Saturday class, Bear, Delaware), the 3-feature summary, team
list, Saturday class poster, and Contact links (email
`applebearscabinet26@gmail.com`, Saturdays 10:00–10:45 AM, live app, GitHub
repo). The app-shell edit was minimal (import + tab + render line); the
shared-lesson-state shell in `src/App.jsx` was not overwritten.

## 4. Contracts

`POST /api/meta` — request `{kind, payload}`, kinds and payloads:

| kind | payload | success response (to browser) |
|---|---|---|
| `lesson` | `{theme, ageRange}` | lesson JSON: `{theme, ageRange, minutes, openingSong, closingSong, words[{zh,pinyin,en,emoji}], story, games[2], script[{zh,en}]}` |
| `image` | `{prompt}` | `{url}` (https or `data:image/*;base64,…`) |
| `segment` | `{image: dataURL, point:{x,y} 0..1}` | `{zh, pinyin, en, box?, mask?}` or `{}` (= no result, UI falls back) |
| `segment` (video) | `{video: dataURL, concept}` | `{label, frame, objectId, box, mask:{x,y,confidence,height,width,encoding,data}}` or `{}` |

Errors: `405` non-POST · `400` unknown kind / invalid payload ·
`503` key/base unset · `502` upstream failure/timeout (60s budget).
Env: `META_API_KEY` (secret), `META_API_BASE_URL` (default
`https://api.meta.ai/v1`), optional `META_*_ROUTE` / `META_*_MODEL`
overrides. Secrets live only in Vercel env; `.env.example` stays empty.

## 5. Deployment & operations

- **Build:** Vite 5 + `vite-plugin-pwa` (autoUpdate SW, precache ~6 entries);
  `npm run build` -> `dist/`. Fluid CSS, no backend state.
- **Hosting:** Vercel project `cozybear/cozybear-cottage` (renamed from
  `cozy-bear-cottage-app` Oct 28, 2026; production URL is now
  https://cozybear-cottage.vercel.app — the old
  `cozy-bear-cottage-app.vercel.app` domain remains assigned too, so
  previously shared links keep working);
  `vercel --prod` deploys the working tree; `main` on GitHub mirrors it
  (push verified by commit hash). Git auto-deploy via `vercel git connect`
  is optional and still pending the owner's GitHub login connection.
- **Local dev:** `vercel dev --listen 3000` (serves SPA + `/api/meta`);
  plain `npm run dev` works for UI-only work with fallbacks.
- **Data:** no database. Runtime state = React state + `localStorage`
  (lesson, stars, pasted song links). Content data ships as static JS.
- **Tests:** `npm test` — Node built-in runner, [tests/meta-proxy.test.mjs](../tests/meta-proxy.test.mjs)
  (5 tests, upstream stubbed): SAM-empty -> vision naming regression,
  SAM token parsing + video branch, point validation, lesson parsing.

## 6. Key decisions & trade-offs

1. **Proxy over direct calls** — key secrecy beats one less hop; also the
   single place to absorb Meta API shape changes (routes/models env-driven).
2. **Fallback-first** — catalog lessons, emoji cards, karaoke, and target-word
   practice keep every screen functional offline or pre-access. Cost: UI must
   never claim AI output it didn't get (fallbacks are labeled by behavior).
3. **Static catalog extraction** — dataset PDF links live in annotations, not
   text; extracted once into `catalogVideos.js` (111 videos) instead of
   parsing a 946 KB PDF in the browser.
4. **Web-sized asset copies** — 90 MB originals stay in `resources/`
   (uncommitted); ~6 MB resized copies serve from `public/assets/`.
5. **Participation-scored speech** — toddler voices make strict recognition
   unfair; stars reward trying (plan risk mitigation).

## 7. Known gaps / next steps

- Mask *rendering*: SAM mask payload is parsed (geometry + raw data) but
  not yet decoded to pixels — the UI draws the SAM box. Decode the `~`
  payload encoding to finish true outline rendering.
- Still-photo SAM path depends on browser `MediaRecorder` clip capture
  (best-effort); unsupported browsers keep the vision box.
- Real-browser QA (video embeds, camera, print) — pending owner pass.
- Key hygiene: rotate any key shared out-of-band; update Vercel secret.
- Submission track: Nov 2 Saturday-class test -> Nov 3 demo recording ->
  Nov 4, 9:00 PM ET submission (live link above).
- Stretch (plan cut-line): parent view (attendance, per-child word record).
