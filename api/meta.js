// Serverless proxy for the Meta Model API (Vercel function format;
// Netlify/Cloudflare equivalents are the same handler shape).
//
// Why this exists: the browser must never hold META_API_KEY.
// Flow: browser -> POST /api/meta { kind, payload } -> this function
//       -> Meta Model API -> JSON back to the browser.
//
// kind: "lesson"  -> Muse Spark (lesson plan JSON)
//       "image"   -> Muse Image (one flashcard illustration)
//       "segment" -> SAM 3.1 (tap-point segmentation) + Muse Spark naming
//
// Endpoint paths are env-configurable because the exact Meta Model API
// routes are issued to accepted participants when the hackathon opens
// (Oct 26, 2026). Set META_API_BASE_URL + META_API_KEY, and override any
// route below via META_LESSON_ROUTE / META_IMAGE_ROUTE / META_SEGMENT_ROUTE
// without touching the front end.

const BASE = (process.env.META_API_BASE_URL || '').replace(/\/$/, '');
const KEY = process.env.META_API_KEY || '';

const ROUTES = {
  lesson: process.env.META_LESSON_ROUTE || '/TODO-muse-spark-text',
  image: process.env.META_IMAGE_ROUTE || '/TODO-muse-image',
  segment: process.env.META_SEGMENT_ROUTE || '/TODO-sam-3.1-segment'
};

const TIMEOUT_MS = 20000;

function isConfigured() {
  return Boolean(BASE && KEY && !Object.values(ROUTES).some((r) => r.includes('TODO')));
}

async function callUpstream(route, body) {
  const upstream = await fetch(`${BASE}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body || {}),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const data = await upstream.json().catch(() => ({}));
  return { status: upstream.status, ok: upstream.ok, data };
}

// --- Payload shaping: one place where each kind meets the upstream API ---

function lessonBody(payload) {
  return {
    prompt: [
      'You are Cozy Bear, a kind co-teacher for a weekend Chinese class, ages 3-6.',
      `Create a 45-minute lesson on the theme "${payload.theme}" for age range ${payload.ageRange || '3-6'}.`,
      'Return ONLY JSON with this shape:',
      '{"theme":string,"ageRange":string,"minutes":45,"openingSong":string,"closingSong":string,',
      '"words":[{"zh":string,"pinyin":string,"en":string,"emoji":string}],',
      '"story":string (3 short lines, bilingual-friendly),',
      '"games":[string,string],"script":[{"zh":string,"en":string}]}',
      'Words must be simple, spoken Mandarin with tone-mark pinyin. No markdown, no extra text.'
    ].join('\n'),
    theme: payload.theme,
    ageRange: payload.ageRange || '3-6'
  };
}

function imageBody(payload) {
  return { prompt: payload.prompt };
}

function segmentBody(payload) {
  return { image: payload.image, point: payload.point };
}

function namingBody(segmentData, payload) {
  const box = segmentData?.box || segmentData?.bbox || null;
  return {
    prompt: [
      'A child (age 3-6) tapped an object in a photo during Chinese class.',
      `Tap point (normalized): x=${payload.point.x.toFixed(3)}, y=${payload.point.y.toFixed(3)}.`,
      box ? `Segmented region box: ${JSON.stringify(box)}.` : 'Segmented region available.',
      'Name that one object for a beginner. Return ONLY JSON:',
      '{"zh":string (simplified characters),"pinyin":string (tone marks),"en":string}. No markdown.'
    ].join('\n'),
    segment: segmentData
  };
}

// --- Validation ---

function validPoint(p) {
  return p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
}

function validate(kind, payload) {
  if (!payload || typeof payload !== 'object') return 'payload object required';
  if (kind === 'lesson' && !String(payload.theme || '').trim()) return 'lesson requires payload.theme';
  if (kind === 'image' && !String(payload.prompt || '').trim()) return 'image requires payload.prompt';
  if (kind === 'segment') {
    if (!String(payload.image || '').trim()) return 'segment requires payload.image (data URL)';
    if (!validPoint(payload.point)) return 'segment requires payload.point {x,y} each 0..1';
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON body' }); }
  }
  const { kind, payload } = body;
  if (!ROUTES[kind]) return res.status(400).json({ error: `Unknown kind: ${kind}` });

  const invalid = validate(kind, payload);
  if (invalid) return res.status(400).json({ error: invalid });

  if (!isConfigured()) {
    // Deliberate, honest failure the UI can show: access has not been issued yet.
    return res.status(503).json({ error: 'Meta Model API access not configured yet' });
  }

  try {
    if (kind === 'lesson') {
      const r = await callUpstream(ROUTES.lesson, lessonBody(payload));
      return res.status(r.status).json(r.data);
    }
    if (kind === 'image') {
      const r = await callUpstream(ROUTES.image, imageBody(payload));
      return res.status(r.status).json(r.data);
    }
    // segment: SAM 3.1 segments the tap, then Muse Spark names the crop.
    const seg = await callUpstream(ROUTES.segment, segmentBody(payload));
    if (!seg.ok) return res.status(seg.status).json(seg.data);
    // Upstream already named it — pass straight through.
    if (seg.data && seg.data.zh) {
      return res.status(200).json({ ...seg.data, mask: seg.data.mask || null, box: seg.data.box || seg.data.bbox || null });
    }
    const named = await callUpstream(ROUTES.lesson, namingBody(seg.data, payload));
    if (!named.ok) return res.status(named.status).json(named.data);
    const name = named.data?.zh ? named.data : (named.data?.result || {});
    return res.status(200).json({
      zh: name.zh || '', pinyin: name.pinyin || '', en: name.en || '',
      mask: seg.data?.mask || null, box: seg.data?.box || seg.data?.bbox || null
    });
  } catch (err) {
    const timedOut = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
    return res.status(502).json({
      error: timedOut ? 'Upstream Meta Model API call timed out' : 'Upstream Meta Model API call failed',
      detail: String(err).slice(0, 300)
    });
  }
}
