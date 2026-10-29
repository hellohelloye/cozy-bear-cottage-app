# Cozy Bear Cottage 小熊中文

**Live app:** https://cozybear-cottage.vercel.app
**Team:** Yukui McDonald (team lead), Patrick McDonald, Xiaoyue He, Shun Zhang
**Artwork:** Vivian McDonald (visual design) and Evelyn McDonald
**Contact:** applebearscabinet26@gmail.com
**Event:** Meta Global AI Developer Hackathon (Indie track) — submission due Nov 4, 2026, 9:00 PM ET

An AI co-teacher for weekend Chinese classes for children ages 3–6, grown out of
a real Saturday-morning class in Bear, Delaware. A teacher picks a theme; Cozy
Bear builds the lesson, makes the flashcards, and gives children pictures they
can tap to hear and repeat the Chinese words. The browser never holds the API
key — every model call goes through a serverless proxy — and every AI feature
has a working fallback, so the demo never dead-ends.

## The five tabs

1. **Lesson Builder 备课** — Muse Spark 1.3 generates a structured lesson
   (theme + age range in, strict lesson JSON out): words of the week, teaching
   script, songs and activities. A Sing-along player brings the Chinese
   Playtime song catalog into the lesson, with spoken karaoke.
2. **Living Flashcards 单词卡** — Muse Image 1.0 generates a card illustration
   for each word (Chinese / English), with an emoji fallback and a print pack
   for the classroom.
3. **Point-and-Say 指着说** — children tap objects in a picture and hear the
   Chinese name spoken aloud (Web Speech API, zh-CN), earning a star for each
   word. See the sequence diagram below for the full tap-to-name flow.
4. **About 关于我们** — what Cozy Bear is, the team, the Saturday class poster,
   and contact.
5. **Kids' Artwork 孩子们的画** — a gallery of Vivian's and Evelyn's original
   artworks (the same pictures children explore in Point-and-Say), photos of
   the young artists at work, and an upload section where other children can
   add their own artwork with a title and artist name; artwork can be emailed
   to the teacher through the app.

## Architecture

```mermaid
flowchart TB
    Teacher["Teacher / child<br/>Phone, tablet, or laptop"]

    subgraph Browser["Browser — React + Vite PWA"]
        Bundled["Bundled content<br/>Themes, sample lesson,<br/>video catalog and artwork"]
        Lesson["Lesson Builder<br/>Theme and age → lesson"]
        Song["Song Player<br/>Videos and spoken karaoke"]
        App["App.jsx<br/>Navigation and shared lesson state"]
        Kids["Kids' Artwork<br/>Gallery and upload"]
        About["About Us<br/>Story, team, contact"]
        Flash["Flashcards<br/>Images, tracing, coloring"]
        Point["Point-and-Say<br/>Camera / photo → tap → name"]
        Print["Browser print / PDF"]
        MetaApi["metaApi.js<br/>API calls, validation, fallbacks"]
        Storage["localStorage<br/>Lesson, stars, song time"]
        Camera["Camera, Canvas, MediaRecorder<br/>Photo capture and short clips"]
        Speech["Web Speech API<br/>Mandarin pronunciation"]
    end

    subgraph Vercel["Vercel — Serverless functions"]
        Secrets["Server environment secrets<br/>META_API_KEY · RESEND_API_KEY"]
        ArtworkFn["POST /api/artwork<br/>Validate image and metadata"]
        MetaFn["POST /api/meta<br/>Validate, dispatch,<br/>parse model responses"]
    end

    subgraph External["External services"]
        Resend["Resend email API"]
        Inbox["Teacher inbox"]
        Spark["Muse Spark 1.3<br/>Lesson generation and<br/>photo object naming"]
        Image["Muse Image 1.0<br/>Flashcard illustrations"]
        SAM["SAM 3.1<br/>Segmentation and video tracking"]
        Videos["Facebook / Instagram / YouTube<br/>and linked MP4 videos"]
    end

    Teacher --> App
    Bundled --> Lesson
    Bundled --> Song
    Bundled --> Kids
    Lesson -->|"Update shared lesson"| App
    App --> Lesson & Song & Kids & About & Flash & Point
    Lesson --> MetaApi
    Flash --> MetaApi
    Point --> MetaApi
    Flash --> Print
    MetaApi --> Storage
    Point --> Camera
    Point --> Speech
    MetaApi -->|"JSON requests and responses"| MetaFn
    Kids -->|"Resize photo, then send<br/>image + name + title"| ArtworkFn
    Secrets -.-> MetaFn
    Secrets -.-> ArtworkFn
    ArtworkFn -->|"Email with attachment"| Resend
    Resend --> Inbox
    MetaFn --> Spark & Image & SAM
    Song --> Videos
```

## Point-and-Say: tap-to-name sequence

```mermaid
sequenceDiagram
    actor Child
    participant Point as Point-and-Say
    participant API as /api/meta
    participant SAM as SAM 3.1
    participant Spark as Muse Spark

    Child->>Point: Tap photo
    Point->>API: Image data URL + normalized tap point
    API->>SAM: Still-image segmentation request
    SAM-->>API: Segmentation response
    alt Response includes a Chinese name
        API->>API: Use returned name and box
    else Naming needed
        API->>Spark: Photo + tap point for vision naming
        Spark-->>API: Chinese, pinyin, English, box
        opt Vision naming fails and SAM supplied a label
            API->>Spark: Name the supplied label
            Spark-->>API: Chinese, pinyin, English
        end
    end
    API-->>Point: Name and bounding box
    Point->>Point: Speak Chinese and award star
    opt Browser supports short-clip capture
        Point->>Point: Convert photo into a short video
        Point->>API: Video + recognized English concept
        API->>SAM: Track concept in video
        SAM-->>API: Per-frame box and mask tokens
        API-->>Point: Parsed box and raw mask data
        Point->>Point: Refine displayed bounding box
    end
```

**Implementation status (honest notes for reviewers):** the bundled sample
pack (26 pictures, 57 pre-mapped tap zones) serves Point-and-Say taps today,
so the feature works end-to-end in the live app; the SAM 3.1 segmentation
route in the proxy is the integration path for arbitrary uploaded photos and
video tracking, as diagrammed. Lesson generation, flashcard illustration,
and object naming run live against the Meta Model API through `/api/meta`,
each with a local fallback. Kids' artwork email runs through `/api/artwork`
and Resend to the teacher inbox (applebearscabinet26@gmail.com).

## Run it locally

```bash
npm install
cp .env.example .env.local   # META_API_KEY (server-side only); RESEND_API_KEY for artwork email
vercel dev                   # use vercel dev, not npm run dev, so /api functions run
```

Deploy: push to GitHub, import in Vercel, set the environment variables
(Production), deploy. The `/api/meta` and `/api/artwork` functions keep all
keys off the browser.

## Design

Vivian's artwork is the design language — her palette (light blue; no orange),
her cutouts as mascots, and the children's paintings as the Point-and-Say
world. Vivian and Evelyn are credited in the app shell and on the Kids'
Artwork page.

## Sister project

The same team also built **WalletShield** — an AI technology-control copilot
for digital currency wallets, from team lead Yukui McDonald's PhD research at
the University of Delaware: https://walletshield.yollin.me
