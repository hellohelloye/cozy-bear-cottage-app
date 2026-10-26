// Lesson themes grounded in the Chinese Playtime catalog
// (resources/chinese-playtime-dataset.pdf: 111 reels deduplicated into
// 66 themed lessons, Kristen Czyszek — Lulu the Panda & Lenny the Koala).
// Word sets below are transcribed from that catalog (zh + pinyin + en).
// This file is the offline source of truth: every theme demos fully
// without the Meta Model API, and online generation starts from here.

export const AGE_RANGES = [
  { id: '3-4', label: 'Ages 3–4', wordCount: 4 },
  { id: '5-6', label: 'Ages 5–6', wordCount: 6 },
  { id: '3-6', label: 'Ages 3–6 (mixed)', wordCount: 6 }
];

export const THEMES = [
  {
    id: 'colors',
    label: 'Colors 颜色',
    song: 'Seven colours to sing in Chinese (Chinese Playtime)',
    words: [
      { zh: '红色', pinyin: 'hóng sè', en: 'red', emoji: '🍎' },
      { zh: '蓝色', pinyin: 'lán sè', en: 'blue', emoji: '💙' },
      { zh: '黄色', pinyin: 'huáng sè', en: 'yellow', emoji: '🍌' },
      { zh: '绿色', pinyin: 'lǜ sè', en: 'green', emoji: '🍀' },
      { zh: '橙色', pinyin: 'chéng sè', en: 'orange', emoji: '🍊' },
      { zh: '紫色', pinyin: 'zǐ sè', en: 'purple', emoji: '🍇' },
      { zh: '粉红色', pinyin: 'fěn hóng sè', en: 'pink', emoji: '🌸' }
    ]
  },
  {
    id: 'greetings',
    label: 'Greetings 问候',
    song: 'Greetings in Mandarin — 你好吗 (Chinese Playtime)',
    words: [
      { zh: '你好', pinyin: 'nǐ hǎo', en: 'hello', emoji: '👋' },
      { zh: '你好吗', pinyin: 'nǐ hǎo ma', en: 'how are you?', emoji: '😊' },
      { zh: '我很好', pinyin: 'wǒ hěn hǎo', en: "I'm good", emoji: '👍' },
      { zh: '谢谢', pinyin: 'xiè xie', en: 'thank you', emoji: '🙏' },
      { zh: '老师', pinyin: 'lǎo shī', en: 'teacher', emoji: '🧑‍🏫' },
      { zh: '再见', pinyin: 'zài jiàn', en: 'goodbye', emoji: '👋' }
    ]
  },
  {
    id: 'numbers',
    label: 'Numbers 数字',
    song: 'Counting 1–10 with Lenny the Koala (Chinese Playtime)',
    words: [
      { zh: '一', pinyin: 'yī', en: 'one', emoji: '1️⃣' },
      { zh: '二', pinyin: 'èr', en: 'two', emoji: '2️⃣' },
      { zh: '三', pinyin: 'sān', en: 'three', emoji: '3️⃣' },
      { zh: '四', pinyin: 'sì', en: 'four', emoji: '4️⃣' },
      { zh: '五', pinyin: 'wǔ', en: 'five', emoji: '5️⃣' },
      { zh: '六', pinyin: 'liù', en: 'six', emoji: '6️⃣' },
      { zh: '七', pinyin: 'qī', en: 'seven', emoji: '7️⃣' },
      { zh: '八', pinyin: 'bā', en: 'eight', emoji: '8️⃣' },
      { zh: '九', pinyin: 'jiǔ', en: 'nine', emoji: '9️⃣' },
      { zh: '十', pinyin: 'shí', en: 'ten', emoji: '🔟' }
    ]
  },
  {
    id: 'animals',
    label: 'Animals 动物',
    song: 'Animals song — 我喜欢… (Chinese Playtime)',
    words: [
      { zh: '狗', pinyin: 'gǒu', en: 'dog', emoji: '🐶' },
      { zh: '猫', pinyin: 'māo', en: 'cat', emoji: '🐱' },
      { zh: '兔子', pinyin: 'tù zi', en: 'rabbit', emoji: '🐰' },
      { zh: '鸟', pinyin: 'niǎo', en: 'bird', emoji: '🐦' },
      { zh: '鱼', pinyin: 'yú', en: 'fish', emoji: '🐟' },
      { zh: '熊猫', pinyin: 'xióng māo', en: 'panda', emoji: '🐼' }
    ]
  },
  {
    id: 'family',
    label: 'Family 家人',
    song: 'Family members sing-along (Chinese Playtime)',
    words: [
      { zh: '妈妈', pinyin: 'mā ma', en: 'mum', emoji: '👩' },
      { zh: '爸爸', pinyin: 'bà ba', en: 'dad', emoji: '👨' },
      { zh: '哥哥', pinyin: 'gē ge', en: 'big brother', emoji: '👦' },
      { zh: '姐姐', pinyin: 'jiě jie', en: 'big sister', emoji: '👧' },
      { zh: '弟弟', pinyin: 'dì di', en: 'little brother', emoji: '🧒' },
      { zh: '妹妹', pinyin: 'mèi mei', en: 'little sister', emoji: '👧' },
      { zh: '宝宝', pinyin: 'bǎo bao', en: 'baby', emoji: '🍼' }
    ]
  },
  {
    id: 'food',
    label: 'Food & Fruit 食物',
    song: 'Fruits song — 苹果・香蕉・西瓜 (Chinese Playtime)',
    words: [
      { zh: '苹果', pinyin: 'píng guǒ', en: 'apple', emoji: '🍎' },
      { zh: '香蕉', pinyin: 'xiāng jiāo', en: 'banana', emoji: '🍌' },
      { zh: '橙子', pinyin: 'chéng zi', en: 'orange', emoji: '🍊' },
      { zh: '草莓', pinyin: 'cǎo méi', en: 'strawberry', emoji: '🍓' },
      { zh: '西瓜', pinyin: 'xī guā', en: 'watermelon', emoji: '🍉' },
      { zh: '葡萄', pinyin: 'pú tao', en: 'grapes', emoji: '🍇' }
    ]
  },
  {
    id: 'actions',
    label: 'Body & Actions 动作',
    song: 'Action words — 跳・跑・拍手 (Chinese Playtime)',
    words: [
      { zh: '跳', pinyin: 'tiào', en: 'jump', emoji: '🦘' },
      { zh: '跑', pinyin: 'pǎo', en: 'run', emoji: '🏃' },
      { zh: '走', pinyin: 'zǒu', en: 'walk', emoji: '🚶' },
      { zh: '坐', pinyin: 'zuò', en: 'sit', emoji: '🪑' },
      { zh: '站', pinyin: 'zhàn', en: 'stand', emoji: '🧍' },
      { zh: '拍手', pinyin: 'pāi shǒu', en: 'clap hands', emoji: '👏' }
    ]
  },
  {
    id: 'transport',
    label: 'Transport 交通',
    song: 'Transport sing-along — 我坐汽车 (Chinese Playtime)',
    words: [
      { zh: '汽车', pinyin: 'qì chē', en: 'car', emoji: '🚗' },
      { zh: '巴士', pinyin: 'bā shì', en: 'bus', emoji: '🚌' },
      { zh: '火车', pinyin: 'huǒ chē', en: 'train', emoji: '🚆' },
      { zh: '自行车', pinyin: 'zì xíng chē', en: 'bicycle', emoji: '🚲' },
      { zh: '船', pinyin: 'chuán', en: 'boat', emoji: '⛵' },
      { zh: '飞机', pinyin: 'fēi jī', en: 'airplane', emoji: '✈️' }
    ]
  },
  {
    id: 'feelings',
    label: 'Feelings 感受',
    song: 'Emotions & affirmations — 我很勇敢 (Chinese Playtime)',
    words: [
      { zh: '快乐', pinyin: 'kuài lè', en: 'happy', emoji: '😊' },
      { zh: '难过', pinyin: 'nán guò', en: 'sad', emoji: '😢' },
      { zh: '生气', pinyin: 'shēng qì', en: 'angry', emoji: '😠' },
      { zh: '害怕', pinyin: 'hài pà', en: 'scared', emoji: '😨' },
      { zh: '勇敢', pinyin: 'yǒng gǎn', en: 'brave', emoji: '🦁' },
      { zh: '开心', pinyin: 'kāi xīn', en: 'joyful', emoji: '😄' }
    ]
  },
  {
    id: 'daily-routine',
    label: 'My Day 我的一天',
    song: 'My Day 我的一天 — daily routine (Chinese Playtime)',
    words: [
      { zh: '起床', pinyin: 'qǐ chuáng', en: 'get up', emoji: '🌅' },
      { zh: '刷牙', pinyin: 'shuā yá', en: 'brush teeth', emoji: '🪥' },
      { zh: '洗脸', pinyin: 'xǐ liǎn', en: 'wash face', emoji: '💧' },
      { zh: '吃饭', pinyin: 'chī fàn', en: 'eat a meal', emoji: '🍚' },
      { zh: '上学', pinyin: 'shàng xué', en: 'go to school', emoji: '🎒' },
      { zh: '睡觉', pinyin: 'shuì jiào', en: 'go to sleep', emoji: '🌙' }
    ]
  },
  {
    id: 'weather-nature',
    label: 'Weather & Nature 天气',
    song: 'Weather & seasons with Lulu and Lenny (Chinese Playtime)',
    words: [
      { zh: '晴天', pinyin: 'qíng tiān', en: 'sunny', emoji: '☀️' },
      { zh: '下雨', pinyin: 'xià yǔ', en: 'rainy', emoji: '🌧️' },
      { zh: '下雪', pinyin: 'xià xuě', en: 'snowy', emoji: '❄️' },
      { zh: '太阳', pinyin: 'tài yáng', en: 'sun', emoji: '🌞' },
      { zh: '月亮', pinyin: 'yuè liang', en: 'moon', emoji: '🌙' },
      { zh: '树', pinyin: 'shù', en: 'tree', emoji: '🌳' }
    ]
  }
];

export function getTheme(themeId) {
  return THEMES.find((t) => t.id === themeId) || THEMES[0];
}

function wordCountFor(ageRange) {
  const found = AGE_RANGES.find((a) => a.id === ageRange);
  return found ? found.wordCount : 6;
}

/** Full 45-minute lesson built locally from the catalog. Mirrors the
 *  JSON shape Muse Spark is asked to return (see api/meta.js). */
export function buildFallbackLesson(themeId, ageRange = '3-6') {
  const theme = getTheme(themeId);
  const words = theme.words.slice(0, wordCountFor(ageRange));
  const first = words[0];
  const second = words[1] || words[0];
  return {
    theme: theme.label,
    themeId: theme.id,
    ageRange,
    minutes: 45,
    openingSong: `${theme.song} — sing together, point to each word card as it is named`,
    closingSong: '《再见歌》 — wave and sing 再见 to Cozy Bear',
    words,
    story: `小熊起床了 — Little Bear wakes up and goes looking for ${first.en}. Everywhere Bear looks, Bear finds ${first.zh} (${first.pinyin})! Then Bear finds ${second.zh} too, and says 你真棒 to everyone who helped.`,
    games: [
      `Word Hunt: children find or point to something for each word card (${words.map((w) => w.zh).join('、')}).`,
      'Point-and-Say: tap the word in a photo, hear it, repeat it, earn a star.'
    ],
    script: [
      { zh: '小朋友们好！', en: 'Hello, children!' },
      { zh: `今天我们学${theme.label}。`, en: `Today we learn: ${theme.label}.` },
      { zh: `这是什么？${first.zh}！说一说：${first.zh}。`, en: `What is this? ${first.en} (${first.pinyin})! Say it with me.` },
      { zh: '你真棒！', en: 'You did great!' },
      { zh: '再见！下星期见！', en: 'Goodbye! See you next week!' }
    ],
    source: 'catalog'
  };
}
