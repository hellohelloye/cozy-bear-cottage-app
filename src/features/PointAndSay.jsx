import React, { useRef, useState } from 'react';
import { nameTappedObject, speakChinese } from '../lib/metaApi.js';

// Point-and-Say 指着说 — the centerpiece (Oct 30-Nov 1 build-plan step).
// Camera via getUserMedia, or any photo upload. A tap sends the point to
// SAM 3.1 through the proxy; Muse Spark names the object; Web Speech
// speaks it; a brave repeat earns a star (participation-scored, ages 3-6).
export default function PointAndSay({ targetWords }) {
  const imgRef = useRef(null);
  const [photo, setPhoto] = useState('/assets/vivian-rainbow-apple.jpg');
  const [result, setResult] = useState(null);
  const [stars, setStars] = useState(0);

  function onFile(e) {
    const file = e.target.files?.[0];
    if (file) setPhoto(URL.createObjectURL(file));
  }

  async function onTap(e) {
    const rect = imgRef.current.getBoundingClientRect();
    const point = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };
    const named = await nameTappedObject(photo, point);
    if (named) {
      setResult(named);
      speakChinese(named.zh);
    } else {
      setResult({ zh: '', pinyin: '', en: 'Point-and-Say wakes up when SAM 3.1 access arrives (Oct 26). Try a target word below meanwhile!' });
    }
  }

  return (
    <section>
      <h2>Point-and-Say 指着说</h2>
      <p>Tap anything in the picture and hear its Chinese name.</p>
      <img ref={imgRef} src={photo} alt="Tap an object" className="tap-photo" onClick={onTap} />
      <label className="upload">Use your own photo <input type="file" accept="image/*" onChange={onFile} /></label>
      {result && <p className="named">{result.zh} {result.pinyin} {result.en && `— ${result.en}`}</p>}
      <div className="targets">
        {targetWords.map((w) => (
          <button key={w.zh} onClick={() => { setResult(w); speakChinese(w.zh); setStars((s) => s + 1); }}>
            {w.emoji} {w.zh}
          </button>
        ))}
      </div>
      <p>⭐ Stars for trying: {stars}</p>
    </section>
  );
}
