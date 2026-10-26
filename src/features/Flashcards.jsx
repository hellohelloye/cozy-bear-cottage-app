import React, { useEffect, useState } from 'react';
import { generateFlashcardImage, speakChinese } from '../lib/metaApi.js';

// Living Flashcards — Muse Image illustrations in one locked style,
// plus the print pipeline: the .print-sheet styles in styles.css turn this
// grid into clean printable flashcards / worksheets via browser print-to-PDF.
// Oct 28-29 build-plan step.
export default function Flashcards({ words }) {
  const [images, setImages] = useState({});

  useEffect(() => {
    let live = true;
    (async () => {
      const out = {};
      for (const w of words) out[w.zh] = await generateFlashcardImage(w);
      if (live) setImages(out);
    })();
    return () => { live = false; };
  }, [words]);

  return (
    <section>
      <h2>Living Flashcards 闪卡</h2>
      <button onClick={() => window.print()}>Print the pack (flashcards + worksheets)</button>
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
      <p className="hint">Tap a card to hear the word. Illustrations fill in once Muse Image access is live; until then the emoji cards keep the pack printable.</p>
    </section>
  );
}
