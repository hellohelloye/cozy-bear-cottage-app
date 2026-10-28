import React, { useEffect, useState } from 'react';
import LessonBuilder from './features/LessonBuilder.jsx';
import Flashcards from './features/Flashcards.jsx';
import PointAndSay from './features/PointAndSay.jsx';
import KidsArtwork from './features/KidsArtwork.jsx';
import AboutUs from './features/AboutUs.jsx';
import { sampleLesson } from './data/sampleLesson.js';

// Cozy Bear Cottage 小熊中文
// Bear team: Yukui McDonald (builder and teacher), Patrick McDonald,
// Vivian McDonald, Evelyn McDonald, Xiaoyue He, Zhang Shun.
// Visual design by Vivian McDonald (age 4) — palette and artwork are hers.
// Palette note (her direction, Oct 20, 2026): light blue, no orange.
const TABS = [
  { id: 'lesson', label: 'Lesson 备课' },
  { id: 'cards', label: 'Flashcards 闪卡' },
  { id: 'say', label: 'Point-and-Say 指着说' },
  { id: 'art', label: "Kids' Artwork 孩子们的画" },
  { id: 'about', label: 'About 关于我们' }
];

const STORAGE_KEY = 'cozy-bear-lesson-v1';

function loadSavedLesson() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || !saved.lesson || !Array.isArray(saved.lesson.words) || !saved.lesson.words.length) return null;
    return saved;
  } catch {
    return null;
  }
}

export default function App() {
  const [tab, setTab] = useState('lesson');
  const [saved] = useState(loadSavedLesson);
  const [lesson, setLesson] = useState(() => saved?.lesson || sampleLesson);
  const [themeId, setThemeId] = useState(() => saved?.themeId || 'colors');
  const [ageRange, setAgeRange] = useState(() => saved?.ageRange || saved?.lesson?.ageRange || '3-6');

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ lesson, themeId, ageRange }));
    } catch { /* private mode / quota: lesson still works in memory */ }
  }, [lesson, themeId, ageRange]);

  return (
    <main>
      <div className="rainbow-stripe" aria-hidden />
      <header>
        <div className="hero-bears">
          <img src="/assets/stickers/rainbow-pony-cutout.png" alt="Vivian's rainbow pony" className="hero-bear" />
          <img src="/assets/cutouts/white-bear.png" alt="Cozy Bear" className="hero-bear" />
          <img src="/assets/stickers/fairy-ballerina-cutout.png" alt="Vivian's fairy ballerina" className="hero-bear" />
        </div>
        <h1>Cozy Bear Cottage</h1>
        <p className="tagline">小熊中文 · An AI co-teacher for weekend Chinese classes, ages 3–6</p>
        <p className="credit">Visual design by Vivian McDonald</p>
      </header>
      <nav>{TABS.map((t) => (
        <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
      ))}</nav>
      {tab === 'lesson' && (
        <LessonBuilder
          lesson={lesson}
          themeId={themeId}
          ageRange={ageRange}
          onThemeChange={setThemeId}
          onAgeChange={setAgeRange}
          onLesson={setLesson}
        />
      )}
      {tab === 'cards' && <Flashcards words={lesson.words} themeLabel={lesson.theme} />}
      {tab === 'say' && <PointAndSay targetWords={lesson.words} themeLabel={lesson.theme} />}
      {tab === 'art' && <KidsArtwork />}
      {tab === 'about' && <AboutUs />}
      <footer>
        <p>Built with Muse Spark · Muse Image · SAM 3.1 (Meta Model API) · React + Vite (PWA) · Web Speech API</p>
      </footer>
    </main>
  );
}
