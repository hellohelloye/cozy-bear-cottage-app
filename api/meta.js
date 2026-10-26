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
// Endpoint paths below are marked TODO on purpose: the exact Meta Model API
// routes are issued to accepted participants when the hackathon opens
// (Oct 26, 2026). Fill BASE + the three paths in one place, here, and the
// front end does not change.

const BASE = process.env.META_API_BASE_URL || '';
const KEY = process.env.META_API_KEY || '';

const ROUTES = {
  lesson: '/TODO-muse-spark-text',      // TODO(Oct 26): real Muse Spark route
  image: '/TODO-muse-image',            // TODO(Oct 26): real Muse Image route
  segment: '/TODO-sam-3.1-segment'      // TODO(Oct 26): real SAM 3.1 route
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!BASE || !KEY) {
    // Deliberate, honest failure the UI can show: access has not been issued yet.
    return res.status(503).json({ error: 'Meta Model API access not configured yet' });
  }
  const { kind, payload } = req.body || {};
  const route = ROUTES[kind];
  if (!route) return res.status(400).json({ error: `Unknown kind: ${kind}` });
  try {
    const upstream = await fetch(`${BASE}${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify(payload || {})
    });
    const data = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Upstream Meta Model API call failed', detail: String(err) });
  }
}
