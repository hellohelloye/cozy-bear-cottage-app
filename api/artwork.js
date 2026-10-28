// Serverless email endpoint for Kids' Artwork uploads (Vercel function).
// Why: the browser must never hold RESEND_API_KEY.
// Flow: browser -> POST /api/artwork {image, name, title} -> this function
// -> Resend (POST https://api.resend.com/emails) with the picture attached.
//
// Env (server-side only):
//   RESEND_API_KEY     (required secret)
//   ARTWORK_EMAIL_TO   (default applebearscabinet26@gmail.com)
//   ARTWORK_EMAIL_FROM (default "Cozy Bear Cottage <onboarding@resend.dev>";
//                       Resend's onboarding sender only delivers to the
//                       Resend account owner's address until a domain is
//                       verified in Resend)

const RESEND_URL = 'https://api.resend.com/emails';
const KEY = process.env.RESEND_API_KEY || '';
const TO = process.env.ARTWORK_EMAIL_TO || 'applebearscabinet26@gmail.com';
const FROM = process.env.ARTWORK_EMAIL_FROM || 'Cozy Bear Cottage <onboarding@resend.dev>';
const TIMEOUT_MS = 30000;
const MAX_BASE64_CHARS = 4 * 1024 * 1024; // ~3 MB image; Vercel body limit guard

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

function parseImage(image) {
  if (typeof image !== 'string') return null;
  const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/.exec(image.trim());
  if (!m) return null;
  const content = m[2].replace(/\s/g, '');
  if (!content || content.length > MAX_BASE64_CHARS) return null;
  return { mime: m[1], content, ext: MIME_EXT[m[1]] || 'jpg' };
}

function cleanText(value, fallback) {
  const text = String(value || '').replace(/[<>\r\n]+/g, ' ').trim().slice(0, 120);
  return text || fallback;
}

function artworkFilename(title, ext) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return `${slug || 'kids-artwork'}.${ext}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON body' }); }
  }

  const parsed = parseImage(body.image);
  if (!parsed) {
    return res.status(400).json({ error: 'A single image (jpeg/png/webp/gif data URL, up to ~3 MB) is required' });
  }
  if (!KEY) {
    return res.status(503).json({ error: 'Artwork email is not configured yet (RESEND_API_KEY missing)' });
  }

  const name = cleanText(body.name, 'A young artist');
  const title = cleanText(body.title, 'Untitled artwork');
  const subject = `Kids' Artwork: "${title}" by ${name}`;
  const text = [
    'A child uploaded artwork from Cozy Bear Cottage (Kids\' Artwork page).',
    '',
    `Picture title: ${title}`,
    `Artist name: ${name}`,
    '',
    'The picture is attached to this email.'
  ].join('\n');

  try {
    const upstream = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        from: FROM,
        to: TO,
        subject,
        text,
        attachments: [{ filename: artworkFilename(title, parsed.ext), content: parsed.content }]
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return res.status(502).json({ error: 'Email service rejected the send', detail: data });
    }
    return res.status(200).json({ id: data.id || null, to: TO });
  } catch (err) {
    const timedOut = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
    return res.status(502).json({
      error: timedOut ? 'Email service timed out' : 'Email service call failed',
      detail: String(err).slice(0, 300)
    });
  }
}
