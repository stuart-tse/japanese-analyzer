// Theme and Color System Types for Japanese Analyzer

export type Theme = 'light' | 'dark' | 'system';

// Japanese Grammar Color Theme Interface
export interface JapaneseColorTheme {
  noun: string;        // 名詞 - Dark Charcoal #42433B (light) / Light Gray #E5E7EB (dark)
  verb: string;        // 動詞 - Primary Red #DF3307 (light) / Lighter Red #FF6B4A (dark)
  adjective: string;   // 形容詞 - Warm Brown #8F7E74 (light) / Lighter Brown #D4C4B0 (dark)
  particle: string;    // 助詞 - Warm Brown #8F7E74 (light) / Lighter Brown #D4C4B0 (dark)
  adverb: string;      // 副詞 - Cool Blue-Gray #9FAEB3 (light) / Lighter Blue-Gray #B0C4DE (dark)
  auxiliary: string;   // 助動詞 - Primary Red #DF3307 (light) / Lighter Red #FF6B4A (dark)
  other: string;       // その他 - Cool Blue-Gray #9FAEB3 (light) / Lighter Blue-Gray #B0C4DE (dark)
  background: string;  // 背景 - Light Beige #DAC8C0 (light) / Dark Purple #2B1D33 (dark)
}

// Color Palette Constants
export const JAPANESE_COLORS = {
  light: {
    primaryRed: '#DF3307',
    charcoalDark: '#42433B',
    brownWarm: '#8F7E74',
    beigeLight: '#DAC8C0',
    blueGrayCool: '#9FAEB3',
  },
  dark: {
    primaryRed: '#FF6B4A',
    charcoalDark: '#E5E7EB',
    brownWarm: '#D4C4B0',
    beigeLight: '#2B1D33',
    blueGrayCool: '#B0C4DE',
  },
} as const;

// Grammar POS to Color Mapping
export const POS_TO_COLOR_KEY: Record<string, keyof Omit<JapaneseColorTheme, 'background'>> = {
  '名詞': 'noun',
  '動詞': 'verb',
  '形容詞': 'adjective',
  '助詞': 'particle',
  '副詞': 'adverb',
  '助動詞': 'auxiliary',
  '接続詞': 'other',
  '感動詞': 'other',
  '連体詞': 'other',
  '代名詞': 'noun',
  '形状詞': 'adjective',
  '記号': 'other',
  '接頭辞': 'other',
  '接尾辞': 'other',
  'フィラー': 'other',
  'その他': 'other',
  'default': 'other'
};

// Utility function to get Japanese color theme
export function getJapaneseColorTheme(mode: 'light' | 'dark'): JapaneseColorTheme {
  const colors = JAPANESE_COLORS[mode];
  return {
    noun: colors.charcoalDark,
    verb: colors.primaryRed,
    adjective: colors.brownWarm,
    particle: colors.brownWarm,
    adverb: colors.blueGrayCool,
    auxiliary: colors.primaryRed,
    other: colors.blueGrayCool,
    background: colors.beigeLight,
  };
}

// CSS Custom Properties for theming
export const CSS_VARIABLES = {
  '--japanese-red-primary': 'var(--japanese-red-primary)',
  '--japanese-charcoal-dark': 'var(--japanese-charcoal-dark)',
  '--japanese-brown-warm': 'var(--japanese-brown-warm)',
  '--japanese-beige-light': 'var(--japanese-beige-light)',
  '--japanese-blue-gray-cool': 'var(--japanese-blue-gray-cool)',
  '--grammar-noun': 'var(--grammar-noun)',
  '--grammar-verb': 'var(--grammar-verb)',
  '--grammar-adjective': 'var(--grammar-adjective)',
  '--grammar-particle': 'var(--grammar-particle)',
  '--grammar-adverb': 'var(--grammar-adverb)',
  '--grammar-auxiliary': 'var(--grammar-auxiliary)',
  '--grammar-other': 'var(--grammar-other)',
  '--grammar-background': 'var(--grammar-background)',
} as const;