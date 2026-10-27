import React, { useEffect, useRef, useState } from 'react';
import { nameTappedObject, speakChinese } from '../lib/metaApi.js';

// Point-and-Say 指着说 — the centerpiece (Oct 30-Nov 1 build-plan step).
// Camera via getUserMedia, with photo upload as fallback. A tap sends the
// photo (as data) + point to SAM 3.1 through the proxy; Muse Spark names
// the object; Web Speech speaks it; a brave repeat earns a star
// (participation-scored, ages 3-6).

async function photoToDataUrl(src) {
  if (src.startsWith('data:')) return src;
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const STICKERS = [
  'rainbow-heart-mandala-2-cutout', 'rainbow-pony-cutout', 'baby-unicorn-cutout',
  'fairy-ballerina-cutout', 'rainbow-apple-cutout', 'cupcake-cherry-cutout',
  'watermelon-slice-happy-cutout', 'brachiosaurus-rainbow-cutout', 'dotted-flower-cutout',
  'sunflower-rainbow-cutout', 'purple-butterfly-cutout', 'rainbow-pinwheel-cutout'
];

export default function PointAndSay({ targetWords, themeLabel }) {
  const imgRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const objectUrlRef = useRef(null);
  const [photo, setPhoto] = useState('/assets/vivian-rainbow-apple.jpg');
  const [cameraOn, setCameraOn] = useState(false);
  const [tap, setTap] = useState(null); // {x, y} normalized 0..1
  const [result, setResult] = useState(null);
  const [found, setFound] = useState(null); // target word matched by a tap
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [stars, setStars] = useState(() => {
    try { return Number(window.localStorage.getItem('cozy-bear-stars')) || 0; } catch { return 0; }
  });

  useEffect(() => {
    try { window.localStorage.setItem('cozy-bear-stars', String(stars)); } catch { /* ignore */ }
  }, [stars]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const [sticker, setSticker] = useState(null);

  function earnStar() {
    setStars((s) => s + 1);
    setSticker(STICKERS[Math.floor(Math.random() * STICKERS.length)]);
  }

  function setUploadedPhoto(url) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = url.startsWith('blob:') ? url : null;
    setPhoto(url);
    setTap(null);
    setResult(null);
    setFound(null);
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    if (file) setUploadedPhoto(URL.createObjectURL(file));
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
      requestAnimationFrame(() => { if (videoRef.current) videoRef.current.srcObject = stream; });
    } catch {
      setResult({ zh: '', pinyin: '', en: 'Camera is off for now — upload a photo below and tap it instead!' });
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    stopCamera();
    setUploadedPhoto(canvas.toDataURL('image/jpeg', 0.85));
  }

  async function onTap(e) {
    const img = imgRef.current;
    if (!img || busy) return;
    const rect = img.getBoundingClientRect();
    const point = {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
    };
    setTap(point);
    setBusy(true);
    try {
      const imageDataUrl = await photoToDataUrl(photo);
      const named = await nameTappedObject(imageDataUrl, point);
      if (named && named.zh) {
        setResult(named);
        speakChinese(named.zh);
        const hit = targetWords.find((w) => named.zh.includes(w.zh) || w.zh.includes(named.zh));
        setFound(hit || null);
        earnStar();
      } else {
        setFound(null);
        setResult({ zh: '', pinyin: '', en: 'Point-and-Say wakes up when SAM 3.1 access arrives. Try a target word below meanwhile!' });
      }
    } catch {
      setFound(null);
      setResult({ zh: '', pinyin: '', en: 'That tap did not work — try another spot, or pick a target word below!' });
    } finally {
      setBusy(false);
    }
  }

  function sayIt(word) {
    setResult(word);
    setFound(null);
    speakChinese(word.zh);
  }

  function listenAndRepeat() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const word = result?.zh ? result : targetWords[0];
    if (!word) return;
    if (!Recognition) {
      // No recognizer (common on phones): trying out loud still earns the star.
      speakChinese(word.zh);
      earnStar();
      setHeard(`You said ${word.zh} out loud — star for trying!`);
      return;
    }
    const rec = new Recognition();
    rec.lang = 'zh-CN';
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (event) => {
      const said = event.results?.[0]?.[0]?.transcript || '';
      setHeard(said ? `Bear heard: ${said}` : '');
      earnStar(); // participation-scored: brave attempts earn the star
    };
    rec.onerror = () => { earnStar(); setHeard('Star for trying — say it once more with Bear!'); };
    rec.onend = () => setListening(false);
    try { rec.start(); } catch { setListening(false); }
  }

  const box = result?.box;
  return (
    <section>
      <h2>Point-and-Say 指着说</h2>
      <img src="/assets/cutouts/feature-point-say.png" alt="Cozy Bear point and say" className="feature-art" />
      <p>Tap anything in the picture and hear its Chinese name.{themeLabel ? ` This week: ${themeLabel}.` : ''}</p>

      {cameraOn ? (
        <div className="camera-box">
          <video ref={videoRef} autoPlay playsInline muted className="tap-photo" />
          <div className="camera-actions">
            <button onClick={capturePhoto}>Take the photo 拍照片</button>
            <button onClick={stopCamera}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="photo-wrap">
          <img ref={imgRef} src={photo} alt="Tap an object" className="tap-photo" onClick={onTap} />
          {tap && (
            <span
              className="tap-marker"
              style={{ left: `${tap.x * 100}%`, top: `${tap.y * 100}%` }}
              aria-hidden
            />
          )}
          {box && Number.isFinite(box.x) && (
            <span
              className="tap-box"
              style={{
                left: `${box.x * 100}%`, top: `${box.y * 100}%`,
                width: `${(box.width || 0.2) * 100}%`, height: `${(box.height || 0.2) * 100}%`
              }}
              aria-hidden
            />
          )}
        </div>
      )}
      {busy && <p className="hint">Bear is looking…</p>}

      <div className="camera-actions">
        {!cameraOn && <button onClick={startCamera}>Open camera 相机</button>}
        <label className="upload">Use your own photo <input type="file" accept="image/*" onChange={onFile} /></label>
      </div>

      {found && <p className="celebrate" role="status">🎉 You found {found.zh} — {found.en}! You found a word of the week!</p>}
      {sticker && <img src={`/assets/stickers/${sticker}.png`} alt="Your sticker reward from Vivian" className="sticker-reward" />}
      {result && (
        <p className="named">
          {result.zh} {result.pinyin} {result.en && `— ${result.en}`}
        </p>
      )}
      {result?.zh && (
        <div className="camera-actions">
          <button onClick={() => speakChinese(result.zh)}>Hear it again 再听一遍</button>
          <button onClick={listenAndRepeat} disabled={listening}>{listening ? 'Listening…' : 'Say it with Bear 跟我说'}</button>
        </div>
      )}
      {heard && <p className="hint">{heard}</p>}

      <div className="targets">
        {targetWords.map((w) => (
          <button key={w.zh} onClick={() => sayIt(w)}>
            {w.emoji} {w.zh}
          </button>
        ))}
      </div>
      <p>⭐ Stars for trying: {stars}</p>
    </section>
  );
}
