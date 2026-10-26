import React, { useState } from 'react';
import LessonBuilder from './features/LessonBuilder.jsx';
import Flashcards from './features/Flashcards.jsx';
import PointAndSay from './features/PointAndSay.jsx';
import { sampleLesson } from './data/sampleLesson.js';

// Cozy Bear Cottage 小熊中文
// Bear team: Yukui McDonald (builder and teacher), Patrick McDonald,
// Vivian McDonald, Evelyn McDonald, Xiaoyue He, Zhang Shun.
// Visual design by Vivian McDonald (age 4) — palette and artwork are hers.
// Palette note (her direction, Oct 20, 2026): light blue, no orange.
const TABS = [
  { id: 'lesson', label: 'Lesson 备课' },
  { id: 'cards', label: 'Flashcards 闪卡' },
  { id: 'say', label: 'Point-and-Say 指着说' }
];

export default function App() {
  const [tab, setTab] = useState('lesson');
  return (
    <main>
      <div className="rainbow-stripe" aria-hidden />
      <header>
        <img src="/assets/bear-reading.jpg" alt="Cozy Bear, reading his book" className="mascot" />
        <h1>Cozy Bear Cottage</h1>
        <p className="tagline">小熊中文 · An AI co-teacher for weekend Chinese classes, ages 3–6</p>
        <p className="credit">Visual design by Vivian McDonald</p>
      </header>
      <nav>{TABS.map((t) => (
        <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
      ))}</nav>
      {tab === 'lesson' && <LessonBuilder />}
      {tab === 'cards' && <Flashcards words={sampleLesson.words} />}
      {tab === 'say' && <PointAndSay targetWords={sampleLesson.words} />}
      <footer>
        <p>Built with Muse Spark · Muse Image · SAM 3.1 (Meta Model API) · React + Vite (PWA) · Web Speech API</p>
      </footer>
    </main>
  );
}
