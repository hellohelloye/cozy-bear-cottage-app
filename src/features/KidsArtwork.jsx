import React, { useState } from 'react';

// Kids' Artwork 孩子们的画 — independent page (5th tab).
// Original artworks by Vivian McDonald, visual designer of Cozy Bear Cottage.
// These are also the pictures children explore in Point-and-Say.
// Upload section: other children can add their own artwork pictures.
// Uploads are previewed locally on this device only (object URLs) —
// there is no server storage behind this yet.
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

export default function KidsArtwork() {
  const [uploads, setUploads] = useState([]);

  function onUpload(e) {
    const files = Array.from(e.target.files || []);
    const added = files.map((file) => ({
      url: URL.createObjectURL(file),
      name: '',
      title: ''
    }));
    setUploads((prev) => [...added, ...prev]);
    e.target.value = '';
  }

  function updateUpload(index, field, value) {
    setUploads((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  return (
    <section>
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

      <h2>Our Little Artist 小画家</h2>
      <p>And here is the artist at work — Vivian drawing:</p>
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
            </figure>
          ))}
        </div>
      )}
      <p>
        <small>
          Uploaded pictures show on this device for now — ask your teacher to
          save your picture so everyone can see it in class.
        </small>
      </p>
    </section>
  );
}
