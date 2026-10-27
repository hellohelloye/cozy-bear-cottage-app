// Front-end client for the serverless proxy in /api/meta.js.
// Every function falls back gracefully so the demo never dead-ends:
// no API access yet -> catalog lesson / word emoji art / spoken word only.

import { sampleLesson } from '../data/sampleLesson.js';
import { buildFallbackLesson, getTheme } from '../data/themes.js';

async function callProxy(kind, payload) {
  const res = await fetch('/api/meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, payload })
  });
  if (!res.ok) throw new Error(`proxy ${kind} failed: ${res.status}`);
  return res.json();
}

function isWord(w) {
  return w && typeof w.zh === 'string' && w.zh.trim();
}

function normalizeLesson(data, themeId, ageRange) {
  if (!data || !Array.isArray(data.words) || !data.words.filter(isWord).length) return null;
  const fallback = buildFallbackLesson(themeId, ageRange);
  return {
    theme: data.theme || fallback.theme,
    themeId: data.themeId || themeId,
    ageRange: data.ageRange || ageRange,
    minutes: data.minutes || 45,
    openingSong: data.openingSong || fallback.openingSong,
    closingSong: data.closingSong || fallback.closingSong,
    words: data.words.filter(isWord),
    story: data.story || fallback.story,
    games: Array.isArray(data.games) && data.games.length ? data.games : fallback.games,
    script: Array.isArray(data.script) && data.script.length ? data.script : fallback.script,
    source: 'ai'
  };
}

/** Muse Spark: theme + age range -> lesson JSON (see sampleLesson shape).
 *  Accepts a catalog theme id ('colors') or a free-text theme label. */
export async function generateLesson(theme, ageRange = '3-6') {
  const known = getTheme(theme);
  const themeId = known.id === theme || known.label === theme ? known.id : 'colors';
  const themeLabel = known.label === theme || known.id === theme ? known.label : String(theme || known.label);
  try {
    const data = await callProxy('lesson', { theme: themeLabel, themeId, ageRange });
    return normalizeLesson(data, themeId, ageRange) || buildFallbackLesson(themeId, ageRange);
  } catch {
    // Offline / not configured: colors keeps the hand-built sample fidelity.
    if (themeId === 'colors' && (ageRange === '3-6' || !ageRange)) {
      return { ...sampleLesson, ageRange: ageRange || sampleLesson.ageRange };
    }
    return buildFallbackLesson(themeId, ageRange);
  }
}

/** Muse Image: one word -> illustration URL. Null = use the emoji fallback card. */
export async function generateFlashcardImage(word) {
  try {
    const data = await callProxy('image', {
      prompt: `Same little white bear teacher, soft watercolor, kind and simple, illustrating: ${word.zh} (${word.en}). Consistent style, no text.`
    });
    return data.url || data.imageUrl || null;
  } catch {
    return null;
  }
}

/** SAM 3.1 + Muse Spark: photo data URL + tap point -> { zh, pinyin, en, mask?, box? }. */
export async function nameTappedObject(imageDataUrl, point) {
  try {
    const data = await callProxy('segment', { image: imageDataUrl, point });
    if (!data || !data.zh) return null;
    return data;
  } catch {
    return null; // UI then invites a retry or a photo upload instead of camera tap
  }
}

/** SAM 3.1 video segmentation: clip + concept -> { box, mask, frame } for
 *  the first tracked object, or null. Box is normalized 0..1. */
export async function segmentConcept(videoDataUrl, concept) {
  try {
    const data = await callProxy('segment', { video: videoDataUrl, concept });
    if (!data || !data.box) return null;
    return data;
  } catch {
    return null;
  }
}

/** Browser speech: speak Chinese aloud (Web Speech API, zh-CN voice). */
export function speakChinese(text) {
  if (!('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'zh-CN';
  utter.rate = 0.85; // slower for ages 3-6
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}
