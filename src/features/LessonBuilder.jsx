import React, { useState } from 'react';
import { generateLesson } from '../lib/metaApi.js';
import { sampleLesson } from '../data/sampleLesson.js';

// Lesson Builder — Muse Spark end-to-end.
// Oct 26-27 build-plan step: wire the returned JSON into the class script view.
export default function LessonBuilder() {
  const [theme, setTheme] = useState('Colors 颜色');
  const [lesson, setLesson] = useState(sampleLesson);
  const [busy, setBusy] = useState(false);

  async function build() {
    setBusy(true);
    setLesson(await generateLesson(theme, '3-6'));
    setBusy(false);
  }

  return (
    <section>
      <h2>Lesson Builder 备课</h2>
      <label>
        Theme 主题
        <input value={theme} onChange={(e) => setTheme(e.target.value)} />
      </label>
      <button onClick={build} disabled={busy}>{busy ? 'Building…' : 'Build my 45-minute lesson'}</button>
      <h3>{lesson.theme} · ages {lesson.ageRange} · {lesson.minutes} min</h3>
      <p><strong>Opening song:</strong> {lesson.openingSong}</p>
      <p><strong>Story:</strong> {lesson.story}</p>
      <h4>Words of the week</h4>
      <ul>{lesson.words.map((w) => <li key={w.zh}>{w.emoji} {w.zh} · {w.pinyin} · {w.en}</li>)}</ul>
      <h4>Games</h4>
      <ul>{lesson.games.map((g) => <li key={g}>{g}</li>)}</ul>
      <h4>Teaching script (say it word for word)</h4>
      <ol>{lesson.script.map((line, i) => <li key={i}>{line.zh} <em>({line.en})</em></li>)}</ol>
    </section>
  );
}
