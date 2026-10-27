import React, { useState } from 'react';
import { generateLesson } from '../lib/metaApi.js';
import { AGE_RANGES, THEMES } from '../data/themes.js';
import SongPlayer from './SongPlayer.jsx';

// Lesson Builder — Muse Spark end-to-end.
// Theme + age come from the Chinese Playtime catalog (src/data/themes.js);
// the generated word set is shared with Flashcards and Point-and-Say via App.
export default function LessonBuilder({ lesson, themeId, ageRange, onThemeChange, onAgeChange, onLesson }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function build() {
    setBusy(true);
    setError('');
    try {
      onLesson(await generateLesson(themeId, ageRange));
    } catch {
      setError('Could not build that lesson. The saved lesson below still works — try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>Lesson Builder 备课</h2>
      <div className="picker-row">
        <label>
          Theme 主题
          <select value={themeId} onChange={(e) => onThemeChange(e.target.value)}>
            {THEMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
        <label>
          Age 年龄
          <select value={ageRange} onChange={(e) => onAgeChange(e.target.value)}>
            {AGE_RANGES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </label>
      </div>
      <button onClick={build} disabled={busy}>{busy ? 'Building…' : 'Build my 45-minute lesson'}</button>
      {error && <p className="error" role="alert">{error}</p>}
      <h3>{lesson.theme} · ages {lesson.ageRange} · {lesson.minutes} min</h3>
      <p><strong>Opening song:</strong> {lesson.openingSong}</p>
      {lesson.closingSong && <p><strong>Closing song:</strong> {lesson.closingSong}</p>}
      <p><strong>Story:</strong> {lesson.story}</p>
      <SongPlayer themeId={themeId} themeLabel={lesson.theme} words={lesson.words} ageRange={ageRange} />
      <h4>Words of the week</h4>
      <ul>{lesson.words.map((w) => <li key={w.zh}>{w.emoji} {w.zh} · {w.pinyin} · {w.en}</li>)}</ul>
      <h4>Games</h4>
      <ul>{lesson.games.map((g) => <li key={g}>{g}</li>)}</ul>
      <h4>Teaching script (say it word for word)</h4>
      <ol>{lesson.script.map((line, i) => <li key={i}>{line.zh} <em>({line.en})</em></li>)}</ol>
      <p className="hint">Words above flow into Flashcards and Point-and-Say. Songs and word sets are grounded in the Chinese Playtime catalog; with the Meta Model API live, Muse Spark writes a fresh lesson on the same shape.</p>
    </section>
  );
}
