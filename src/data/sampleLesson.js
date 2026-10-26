// Sample lesson used until Meta Model API access arrives (and as the
// offline fallback afterwards). Theme = colors, matching the real
// Saturday class lesson plan for Oct 24, 2026 and the Nov 2 build-plan test.
// Shape mirrors what the Lesson Builder asks Muse Spark to return.
export const sampleLesson = {
  theme: 'Colors 颜色',
  ageRange: '3-6',
  minutes: 45,
  openingSong: '《颜色歌》 — point to each color card as it is named',
  closingSong: '《再见歌》 — wave and sing 再见 to Cozy Bear',
  words: [
    { zh: '红色', pinyin: 'hóng sè', en: 'red', emoji: '🍎' },
    { zh: '蓝色', pinyin: 'lán sè', en: 'blue', emoji: '💙' },
    { zh: '黄色', pinyin: 'huáng sè', en: 'yellow', emoji: '🍌' },
    { zh: '绿色', pinyin: 'lǜ sè', en: 'green', emoji: '🍀' },
    { zh: '粉色', pinyin: 'fěn sè', en: 'pink', emoji: '🌸' },
    { zh: '紫色', pinyin: 'zǐ sè', en: 'purple', emoji: '🍇' }
  ],
  story: '小熊起床了 — Little Bear wakes up and finds a color on everything he touches.',
  games: [
    'Color Hunt: children find something in the room for each word card.',
    'Point-and-Say: tap the color in a photo, hear it, repeat it, earn a star.'
  ],
  script: [
    { zh: '小朋友们好！', en: 'Hello, children!' },
    { zh: '这是什么颜色？', en: 'What color is this?' },
    { zh: '红色！说一说：红色。', en: 'Red! Say it with me: hóng sè.' },
    { zh: '你真棒！', en: 'You did great!' }
  ]
};
