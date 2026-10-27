// Serverless proxy for the Meta Model API (Vercel function format).
// Why: the browser must never hold META_API_KEY.
// Flow: browser -> POST /api/meta {kind, payload} -> this function -> Meta.
//
// kind "lesson"  -> Muse Spark  (POST /v1/chat/completions, muse-spark-1.3)
// kind "image"   -> Muse Image  (POST /v1/images/generations, muse-image-1.0)
// kind "segment" -> SAM 3.1     (POST /v1/responses, sam-3.1) + Spark naming
// Routes/models verified live Oct 27, 2026 against /v1/models; every route
// and model stays env-overridable (META_*_ROUTE / META_*_MODEL).

const BASE = (process.env.META_API_BASE_URL || 'https://api.meta.ai/v1').replace(/\/$/, '');
const KEY = process.env.META_API_KEY || '';

const ROUTES = {
  lesson: process.env.META_LESSON_ROUTE || '/chat/completions',
  image: process.env.META_IMAGE_ROUTE || '/images/generations',
  segment: process.env.META_SEGMENT_ROUTE || '/responses'
};
const MODELS = {
  spark: process.env.META_SPARK_MODEL || 'muse-spark-1.3',
  image: process.env.META_IMAGE_MODEL || 'muse-image-1.0',
  sam: process.env.META_SAM_MODEL || 'sam-3.1'
};
const TIMEOUT_MS = 60000; // Spark reasons before answering; 20s was too short

function isConfigured() { return Boolean(BASE && KEY); }

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

function parseJsonText(text) {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.replace(/```json|```/g, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
  }
  return null;
}

function chatContent(data) {
  return data?.choices?.[0]?.message?.content || '';
}

// --- Payload shaping ---

function lessonBody(payload) {
  return {
    model: MODELS.spark,
    max_tokens: 4000, // reasoning tokens count against this budget (verified)
    messages: [{
      role: 'user',
      content: [
        'You are Cozy Bear, a kind co-teacher for a weekend Chinese class, ages 3-6.',
        `Create a 45-minute lesson on the theme "${payload.theme}" for age range ${payload.ageRange || '3-6'}.`,
        'Return ONLY JSON with this shape:',
        '{"theme":string,"ageRange":string,"minutes":45,"openingSong":string,"closingSong":string,',
        '"words":[{"zh":string,"pinyin":string,"en":string,"emoji":string}],',
        '"story":string,"games":[string,string],"script":[{"zh":string,"en":string}]}',
        'Six simple spoken-Mandarin words with tone-mark pinyin. No markdown, no extra text.'
      ].join('\n')
    }]
  };
}

function imageBody(payload) {
  return { model: MODELS.image, prompt: payload.prompt, size: '1024x1024' };
}

function segmentBody(payload) {
  return {
    model: MODELS.sam,
    max_output_tokens: 1000,
    input: [{
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: `Segment the object at normalized point x=${payload.point.x.toFixed(3)}, y=${payload.point.y.toFixed(3)}. Return ONLY JSON {"box":{"x":0,"y":0,"width":0,"height":0},"label":"object name"} with box normalized 0..1.`
        },
        { type: 'input_image', image_url: payload.image }
      ]
    }]
  };
}

/** SAM 3.1 native output (video tracking):
 *  <Nf><id><|box;x1=..;y1=..;x2=..;y2=..;w=..;h=..|><|mask;x=..;y=..[;c=..];data=<H>,<W>,<enc><payload>|>
 *  Box coords are pixels on the w x h frame; mask data is H,W then payload. */
export function parseSamTokens(text) {
  if (!text || typeof text !== 'string') return [];
  const re = /<(\d+)f>(\d+)<\|box;x1=([\d.]+);y1=([\d.]+);x2=([\d.]+);y2=([\d.]+);w=([\d.]+);h=([\d.]+)\|>(?:<\|mask;x=([\d.]+);y=([\d.]+)(?:;c=([\d.]+))?;data=(\d+),(\d+),([^\|]*)\|>)?/g;
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const [, frame, id, x1, y1, x2, y2, w, h, mx, my, conf, mh, mw, payload] = m;
    const W = Number(w) || 1;
    const H = Number(h) || 1;
    out.push({
      frame: Number(frame),
      objectId: Number(id),
      box: {
        x: Number(x1) / W,
        y: Number(y1) / H,
        width: (Number(x2) - Number(x1)) / W,
        height: (Number(y2) - Number(y1)) / H
      },
      mask: payload !== undefined
        ? {
            x: Number(mx), y: Number(my),
            confidence: conf !== undefined ? Number(conf) : null,
            height: Number(mh), width: Number(mw),
            encoding: (payload || '').charAt(0) || null,
            data: payload || ''
          }
        : null
    });
  }
  return out.sort((a, b) => a.frame - b.frame);
}

function segmentVideoBody(payload) {
  return {
    model: MODELS.sam,
    max_output_tokens: 2000,
    input: [{
      role: 'user',
      content: [
        { type: 'input_text', text: payload.concept },
        { type: 'input_video', video_url: payload.video }
      ]
    }]
  };
}

function responsesText(data) {
  const out = data?.output || [];
  for (const item of out) {
    for (const part of item?.content || []) {
      if (typeof part?.text === 'string' && part.text.trim()) return part.text;
    }
  }
  return '';
}

/** Working tap-naming path (verified live): Spark vision sees the photo
 *  and the tap point, and names that object with a normalized box. */
async function nameWithSparkVision(payload) {
  const body = {
    model: MODELS.spark,
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `A child tapped the object at normalized point x=${payload.point.x.toFixed(3)}, y=${payload.point.y.toFixed(3)} in this photo. Name that ONE object for a Chinese beginner (age 3-6). Return ONLY JSON {"zh":"simplified characters","pinyin":"tone marks","en":"english","box":{"x":0,"y":0,"width":0,"height":0}} with box normalized 0..1 around the tapped object.`
        },
        { type: 'image_url', image_url: { url: payload.image } }
      ]
    }]
  };
  const r = await callUpstream(ROUTES.lesson, body);
  if (!r.ok) return null;
  return parseJsonText(chatContent(r.data));
}

async function nameWithSpark(label, payload) {
  const body = {
    model: MODELS.spark,
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: [
        'A child (age 3-6) tapped an object in a photo during Chinese class.',
        label ? `The object is: ${label}.` : `Tap point (normalized): x=${payload.point.x.toFixed(3)}, y=${payload.point.y.toFixed(3)}.`,
        'Name that one object for a beginner. Return ONLY JSON:',
        '{"zh":string (simplified characters),"pinyin":string (tone marks),"en":string}. No markdown.'
      ].join('\n')
    }]
  };
  const r = await callUpstream(ROUTES.lesson, body);
  if (!r.ok) return null;
  return parseJsonText(chatContent(r.data));
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
    if (payload.video) {
      if (!String(payload.concept || '').trim()) return 'segment with video requires payload.concept';
    } else {
      if (!String(payload.image || '').trim()) return 'segment requires payload.image (data URL)';
      if (!validPoint(payload.point)) return 'segment requires payload.point {x,y} each 0..1';
    }
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
    return res.status(503).json({ error: 'Meta Model API access not configured yet' });
  }

  try {
    if (kind === 'lesson') {
      const r = await callUpstream(ROUTES.lesson, lessonBody(payload));
      if (!r.ok) return res.status(r.status).json(r.data);
      const lesson = parseJsonText(chatContent(r.data));
      if (!lesson || !Array.isArray(lesson.words)) {
        return res.status(502).json({ error: 'Spark returned an unparseable lesson' });
      }
      return res.status(200).json(lesson);
    }
    if (kind === 'image') {
      const r = await callUpstream(ROUTES.image, imageBody(payload));
      if (!r.ok) return res.status(r.status).json(r.data);
      const first = r.data?.data?.[0] || {};
      if (first.url) return res.status(200).json({ url: first.url });
      if (first.b64_json) {
        const mime = first.b64_json.startsWith('UklGR') ? 'image/webp' : 'image/png';
        return res.status(200).json({ url: `data:${mime};base64,${first.b64_json}` });
      }
      return res.status(502).json({ error: 'Image model returned no image' });
    }
    // segment with a video clip: SAM 3.1 is a video tracker — concept text
    // in, per-frame <Nf> box/mask tokens out (verified live Oct 27, 2026).
    if (payload.video) {
      const seg = await callUpstream(ROUTES.segment, segmentVideoBody(payload));
      if (!seg.ok) return res.status(seg.status).json(seg.data);
      const objects = parseSamTokens(responsesText(seg.data));
      if (!objects.length) return res.status(200).json({});
      const first = objects[0];
      return res.status(200).json({
        label: payload.concept, frame: first.frame, objectId: first.objectId,
        box: first.box, mask: first.mask
      });
    }
    // segment: SAM 3.1 segments the tap; Spark names the result.
    const seg = await callUpstream(ROUTES.segment, segmentBody(payload));
    if (!seg.ok) return res.status(seg.status).json(seg.data);
    const segJson = parseJsonText(responsesText(seg.data));
    const segBox = segJson?.box || segJson?.bbox || null;
    const label = segJson?.label || segJson?.en || segJson?.zh || '';
    let named = segJson?.zh
      ? { zh: segJson.zh, pinyin: segJson.pinyin || '', en: segJson.en || label, box: segBox }
      : await nameWithSparkVision(payload);
    if ((!named || !named.zh) && label) named = await nameWithSpark(label, payload);
    if (!named || !named.zh) return res.status(200).json({});
    return res.status(200).json({
      zh: named.zh, pinyin: named.pinyin || '', en: named.en || label,
      mask: null, box: named.box || segBox
    });
  } catch (err) {
    const timedOut = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
    return res.status(502).json({
      error: timedOut ? 'Upstream Meta Model API call timed out' : 'Upstream Meta Model API call failed',
      detail: String(err).slice(0, 300)
    });
  }
}
