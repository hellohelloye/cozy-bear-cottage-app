// Front-end client for the serverless proxy in /api/meta.js.
// Every function falls back gracefully so the demo never dead-ends:
// no API access yet -> sample lesson / word emoji art / spoken word only.

import { sampleLesson } from '../data/sampleLesson.js';

async function callProxy(kind, payload) {
  const res = await fetch('/api/meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, payload })
  });
  if (!res.ok) throw new Error(`proxy ${kind} failed: ${res.status}`);
  return res.json();
}

/** Muse Spark: theme + age range -> lesson JSON (see sampleLesson shape). */
export async function generateLesson(theme, ageRange) {
  try {
    return await callProxy('lesson', { theme, ageRange });
  } catch {
    return { ...sampleLesson, theme: theme || sampleLesson.theme, ageRange: ageRange || sampleLesson.ageRange };
  }
}

/** Muse Image: one word -> illustration URL. Null = use the emoji fallback card. */
export async function generateFlashcardImage(word) {
  try {
    const data = await callProxy('image', {
      prompt: `Same little white bear teacher, soft watercolor, kind and simple, illustrating: ${word.zh} (${word.en}). Consistent style, no text.`
    });
    return data.url || null;
  } catch {
    return null;
  }
}

/** SAM 3.1 + Muse Spark: photo + tap point -> { zh, pinyin, en } for the object. */
export async function nameTappedObject(imageDataUrl, point) {
  try {
    return await callProxy('segment', { image: imageDataUrl, point });
  } catch {
    return null; // UI then invites a retry or a photo upload instead of camera tap
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
