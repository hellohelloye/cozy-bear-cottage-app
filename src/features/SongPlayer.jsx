import React, { useEffect, useRef, useState } from 'react';
import { catalogFor } from '../data/catalogVideos.js';

// Sing-along player for the selected category (theme).
// Two ways to play the song:
//  1. Bear sings it now — karaoke lines built from this week's words,
//     spoken line-by-line (zh-CN) with the current line highlighted.
//  2. Embed a real video — paste a YouTube or MP4 link for this category
//     and it plays embedded here. Links are remembered per category.
// Original recordings: Chinese Playtime (Kristen Czyszek) — Facebook /
// Instagram reels do not allow direct embedding, so those open externally.

function songLines(words, themeLabel) {
  const lines = [{ zh: '小朋友们好！我们唱歌吧！', pinyin: '', en: `Hello! Let's sing — ${themeLabel}` }];
  for (const w of words) {
    lines.push({ zh: `${w.zh}，${w.zh}，这是什么？`, pinyin: w.pinyin, en: `${w.en}!` });
    lines.push({ zh: `${w.zh}！`, pinyin: w.pinyin, en: `Yes — ${w.en}!` });
  }
  lines.push({ zh: '你真棒！再见！', pinyin: '', en: 'Great singing! Goodbye!' });
  return lines;
}

/** Official embed endpoints for the catalog reels in the dataset PDF. */
export function catalogEmbedSrc(video) {
  if (!video) return null;
  if (video.platform === 'Instagram') {
    const base = video.url.endsWith('/') ? video.url : `${video.url}/`;
    return `${base}embed/`;
  }
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video.url)}&show_text=false`;
}

function embedFor(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/);
  if (yt) return { type: 'iframe', src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  if (/\.mp4($|\?)/i.test(url)) return { type: 'video', src: url };
  if (/facebook\.com|instagram\.com/.test(url)) return { type: 'external', src: url };
  return null;
}

export default function SongPlayer({ themeId, themeLabel, words, ageRange }) {
  const catalog = catalogFor(themeId);
  const [catalogIndex, setCatalogIndex] = useState(0);
  const lines = songLines(words, themeLabel);
  const [lineIndex, setLineIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState(() => {
    try { return window.localStorage.getItem(`cozy-bear-song-${themeId}`) || ''; } catch { return ''; }
  });
  const [draft, setDraft] = useState(videoUrl);
  const runRef = useRef(0);

  // Reload the remembered video when the category changes; stop singing.
  useEffect(() => {
    setCatalogIndex(0);
    stop();
    try {
      const saved = window.localStorage.getItem(`cozy-bear-song-${themeId}`) || '';
      setVideoUrl(saved);
      setDraft(saved);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeId]);

  useEffect(() => () => { runRef.current += 1; window.speechSynthesis?.cancel(); }, []);

  function stop() {
    runRef.current += 1;
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setLineIndex(-1);
  }

  function play() {
    if (!('speechSynthesis' in window)) return;
    stop();
    const run = runRef.current;
    setPlaying(true);
    const speakLine = (i) => {
      if (runRef.current !== run) return;
      if (i >= lines.length) { setPlaying(false); setLineIndex(-1); return; }
      setLineIndex(i);
      const utter = new SpeechSynthesisUtterance(lines[i].zh);
      utter.lang = 'zh-CN';
      utter.rate = ageRange === '3-4' ? 0.7 : 0.8; // slower for the youngest singers
      utter.onend = () => speakLine(i + 1);
      utter.onerror = () => speakLine(i + 1);
      window.speechSynthesis.speak(utter);
    };
    speakLine(0);
  }

  function saveVideo() {
    const url = draft.trim();
    setVideoUrl(url);
    try {
      if (url) window.localStorage.setItem(`cozy-bear-song-${themeId}`, url);
      else window.localStorage.removeItem(`cozy-bear-song-${themeId}`);
    } catch { /* ignore */ }
  }

  const embed = embedFor(videoUrl);

  return (
    <div className="song-player">
      <h4>Sing along 唱一唱 · {themeLabel}</h4>

      {catalog.length > 0 && (
        <div className="catalog-videos">
          <p className="hint">From the Chinese Playtime catalog in your dataset file — {catalog.length} video{catalog.length === 1 ? '' : 's'} for this category. Press play right here:</p>
          <div className="video-wrap">
            <iframe
              key={catalog[catalogIndex]?.url}
              src={catalogEmbedSrc(catalog[catalogIndex])}
              title={`${themeLabel} catalog song video`}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <div className="video-chips">
            {catalog.map((v, i) => (
              <button
                key={v.url}
                className={i === catalogIndex ? 'active' : ''}
                onClick={() => setCatalogIndex(i)}
                title={v.title || v.url}
              >
                {v.platform === 'Instagram' ? '📷' : '📘'} {v.platform} · p.{v.page}
              </button>
            ))}
          </div>
          <p className="hint">
            If a video will not load embedded (the platform sometimes requires login),{' '}
            <a href={catalog[catalogIndex]?.url} target="_blank" rel="noreferrer">open it on {catalog[catalogIndex]?.platform}</a>.
          </p>
        </div>
      )}

      {embed?.type === 'iframe' && (
        <div className="video-wrap">
          <iframe
            src={embed.src}
            title={`${themeLabel} song video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {embed?.type === 'video' && (
        <div className="video-wrap">
          <video src={embed.src} controls playsInline />
        </div>
      )}
      {embed?.type === 'external' && (
        <p className="hint">
          Facebook/Instagram reels can't play embedded here.{' '}
          <a href={embed.src} target="_blank" rel="noreferrer">Open this category's song video</a>{' '}
          — or paste a YouTube/MP4 link below to embed it.
        </p>
      )}

      <div className="song-lines" aria-live="polite">
        {lines.map((line, i) => (
          <p key={i} className={i === lineIndex ? 'song-line active' : 'song-line'}>
            {line.zh} {line.pinyin && <span>{line.pinyin} · </span>}<em>{line.en}</em>
          </p>
        ))}
      </div>
      <div className="camera-actions">
        {playing
          ? <button onClick={stop}>Stop 停</button>
          : <button onClick={play}>▶ Bear sings it 小熊唱</button>}
      </div>

      <label className="video-paste">
        Song video for this category (YouTube or MP4 link)
        <span className="video-paste-row">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            inputMode="url"
          />
          <button onClick={saveVideo}>Embed video</button>
        </span>
      </label>
      <p className="hint">
        Original songs: Chinese Playtime (Kristen Czyszek) —{' '}
        <a href="https://www.facebook.com/chineseplaytime" target="_blank" rel="noreferrer">Facebook</a> ·{' '}
        <a href="https://www.instagram.com/chinese_playtime/" target="_blank" rel="noreferrer">Instagram</a>.
        Find this category's reel there, or sing with Bear above — no video needed.
      </p>
    </div>
  );
}
