import React, { useEffect, useState } from 'react';
import { generateFlashcardImage, speakChinese } from '../lib/metaApi.js';

// Living Flashcards — Muse Image illustrations in one locked style,
// plus the print pipeline: flashcards, trace-the-character worksheets,
// and coloring pages via browser Print -> Save as PDF.
// Oct 28-29 build-plan step.
export default function Flashcards({ words, themeLabel }) {
  const [images, setImages] = useState({});

  useEffect(() => {
    let live = true;
    setImages({});
    (async () => {
      const entries = await Promise.all(
        words.map(async (w) => [w.zh, await generateFlashcardImage(w)])
      );
      if (live) setImages(Object.fromEntries(entries));
    })();
    return () => { live = false; };
  }, [words]);

  return (
    <section>
      <h2>Living Flashcards 闪卡</h2>
      {themeLabel && <p className="hint">This week: {themeLabel} — tap a card to hear the word.</p>}
      <button onClick={() => window.print()}>Print the pack (flashcards + worksheets)</button>

      <h3 className="pack-title">Flashcards</h3>
      <div className="card-grid print-sheet">
        {words.map((w) => (
          <button className="card" key={w.zh} onClick={() => speakChinese(w.zh)}>
            {images[w.zh]
              ? <img src={images[w.zh]} alt={w.en} />
              : <span className="card-emoji" aria-hidden>{w.emoji}</span>}
            <span className="card-zh">{w.zh}</span>
            <span>{w.pinyin} · {w.en}</span>
          </button>
        ))}
      </div>

      <h3 className="pack-title">Trace the character 描一描</h3>
      <div className="trace-grid print-sheet">
        {words.map((w) => (
          <div className="trace-card" key={`trace-${w.zh}`}>
            <span className="trace-model">{w.zh}</span>
            <span className="trace-guide" aria-hidden>{w.zh}</span>
            <span className="trace-empty" aria-hidden>{[...w.zh].map(() => '　').join('')}</span>
            <span className="trace-label">{w.pinyin} · {w.en}</span>
          </div>
        ))}
      </div>

      <h3 className="pack-title">Coloring page 涂颜色</h3>
      <div className="color-grid print-sheet">
        {words.map((w) => (
          <div className="color-card" key={`color-${w.zh}`}>
            <span className="color-emoji" aria-hidden>{w.emoji}</span>
            <span className="card-zh">{w.zh}</span>
            <span>{w.pinyin} · {w.en}</span>
          </div>
        ))}
      </div>

      <p className="hint">Print makes all three: cut-out flashcards, a tracing worksheet, and a coloring page. Illustrations fill in once Muse Image access is live; until then the emoji cards keep the pack printable.</p>
    </section>
  );
}
