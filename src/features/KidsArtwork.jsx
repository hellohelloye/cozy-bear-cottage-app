import React, { useState } from 'react';

// Kids' Artwork 孩子们的画 — independent page (5th tab).
// Original artworks by Vivian McDonald, visual designer of Cozy Bear Cottage.
// These are also the pictures children explore in Point-and-Say.
// Upload section: other children can add their own artwork pictures.
// Each upload is previewed locally, then its "Email to teacher" button
// POSTs a downscaled copy to /api/artwork, which emails it (with the
// artist name + picture title) to the teacher via Resend. Nothing is
// sent until that button is pressed, and nothing is stored server-side.
const ARTWORKS = [
  { src: '/assets/point-say/rainbow-apple.jpg', zh: '彩虹苹果', en: 'Rainbow Apple' },
  { src: '/assets/point-say/watermelon-family.jpg', zh: '西瓜一家', en: 'Watermelon Family' },
  { src: '/assets/point-say/brachiosaurus-rainbow.jpg', zh: '彩虹恐龙', en: 'Rainbow Dinosaur' },
  { src: '/assets/point-say/dalmatian-dog.png', zh: '小狗', en: 'Dalmatian Dog' },
  { src: '/assets/point-say/cupcake-cherry.jpg', zh: '纸杯蛋糕', en: 'Cupcake' },
  { src: '/assets/point-say/butterfly-rainbow.jpg', zh: '蝴蝶', en: 'Butterfly' },
  { src: '/assets/kids-art/kids-artwork-1.png', zh: '作品一', en: 'Artwork 1' },
  { src: '/assets/kids-art/kids-artwork-2.png', zh: '作品二', en: 'Artwork 2' },
  { src: '/assets/kids-art/kids-artwork-3.png', zh: '作品三', en: 'Artwork 3' }
];

// Vivian at work — the little artist drawing (photos from the family pack).
const ARTIST_PHOTOS = [
  { src: '/assets/point-say/painting-easel-1.jpg', zh: '小画家在画画', en: 'Vivian drawing, 1' },
  { src: '/assets/point-say/painting-easel-2.jpg', zh: '小画家在画画', en: 'Vivian drawing, 2' }
];

// Downscale to <=1200px JPEG for email (keeps the POST under Vercel's
// body limit); falls back to the raw file if the browser cannot decode it.
async function fileToEmailImage(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    if (file.size > 3 * 1024 * 1024) return null;
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }
}

export default function KidsArtwork() {
  const [uploads, setUploads] = useState([]);

  async function onUpload(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    const added = await Promise.all(files.map(async (file) => ({
      url: URL.createObjectURL(file),
      dataUrl: await fileToEmailImage(file),
      name: '',
      title: '',
      sendState: 'idle',
      sendError: ''
    })));
    setUploads((prev) => [...added, ...prev]);
  }

  function updateUpload(index, field, value) {
    setUploads((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  async function sendUpload(index) {
    const item = uploads[index];
    if (!item || item.sendState === 'sending' || item.sendState === 'sent') return;
    if (!item.dataUrl) {
      updateUpload(index, 'sendError', 'That picture is too large to email — please pick a smaller photo.');
      setUploads((prev) => prev.map((it, i) => (i === index ? { ...it, sendState: 'error' } : it)));
      return;
    }
    setUploads((prev) => prev.map((it, i) => (i === index ? { ...it, sendState: 'sending', sendError: '' } : it)));
    try {
      const response = await fetch('/api/artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: item.dataUrl, name: item.name, title: item.title })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Send failed (${response.status})`);
      setUploads((prev) => prev.map((it, i) => (i === index ? { ...it, sendState: 'sent', sendError: '' } : it)));
    } catch (err) {
      setUploads((prev) => prev.map((it, i) => (
        i === index ? { ...it, sendState: 'error', sendError: String(err.message || err) } : it
      )));
    }
  }

  return (
    <section>
      <h2>Our Little Artist 小画家</h2>
      <p>Here is the artist at work — Vivian drawing:</p>
      <div
        className="artist-photos"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}
      >
        {ARTIST_PHOTOS.map((photo) => (
          <figure key={photo.src} style={{ margin: 0, width: '45%' }}>
            <img
              src={photo.src}
              alt={`${photo.en} — Vivian McDonald at work on her artwork`}
              style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
            />
            <figcaption>{photo.zh} · {photo.en}</figcaption>
          </figure>
        ))}
      </div>

      <h2>Kids' Artwork 孩子们的画</h2>
      <p>
        Cozy Bear Cottage looks the way it does because of its young visual
        designer. These are some of <strong>Vivian McDonald's</strong> original
        artworks — they are also the pictures children explore in Point-and-Say.
      </p>
      <div
        className="artwork-gallery"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}
      >
        {ARTWORKS.map((art) => (
          <figure key={art.src} style={{ margin: 0, width: '45%' }}>
            <img
              src={art.src}
              alt={`${art.en} — artwork by Vivian McDonald`}
              style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
            />
            <figcaption>{art.zh} · {art.en}</figcaption>
          </figure>
        ))}
      </div>
      <p>Artwork by Vivian McDonald, visual designer of Cozy Bear Cottage.</p>

      <h2>Upload Your Artwork 上传你的画</h2>
      <p>
        Did you draw a picture too? Add it to our gallery! Choose a photo of
        your artwork, then write your name and the name of your picture.
      </p>
      <p>
        <label className="upload">
          Choose artwork pictures 选择图片
          <input type="file" accept="image/*" multiple onChange={onUpload} />
        </label>
      </p>
      {uploads.length > 0 && (
        <div
          className="artwork-gallery uploads"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}
        >
          {uploads.map((item, i) => (
            <figure key={item.url} style={{ margin: 0, width: '45%' }}>
              <img
                src={item.url}
                alt={item.title || 'Uploaded artwork'}
                style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
              />
              <input
                type="text"
                placeholder="画的名字 Title of your picture"
                value={item.title}
                onChange={(e) => updateUpload(i, 'title', e.target.value)}
              />
              <input
                type="text"
                placeholder="小画家的名字 Artist name"
                value={item.name}
                onChange={(e) => updateUpload(i, 'name', e.target.value)}
              />
              {(item.title || item.name) && (
                <figcaption>
                  {item.title}
                  {item.name && ` — by ${item.name}`}
                </figcaption>
              )}
              <button
                type="button"
                onClick={() => sendUpload(i)}
                disabled={item.sendState === 'sending' || item.sendState === 'sent'}
              >
                {item.sendState === 'sent'
                  ? 'Sent to teacher ✓ 已发送'
                  : item.sendState === 'sending'
                    ? 'Sending… 发送中'
                    : 'Email to teacher 发送给老师'}
              </button>
              {item.sendState === 'error' && (
                <p className="error">Could not send: {item.sendError}</p>
              )}
            </figure>
          ))}
        </div>
      )}
      <p>
        <small>
          Press “Email to teacher” on your picture and it will be emailed to
          your teacher with your name and picture title. Until you press it,
          your picture stays only on this device.
        </small>
      </p>
    </section>
  );
}
