// 工具函数
import { synthesizeSpeech, TokenData } from '../services/api';

export { debounce, debouncedUpdate } from './debounce';
export { ApiError, createApiError, handleApiResponse, logError } from './errorHandler';
export { processStreamResponse, createGeminiStreamProcessor } from './streamUtils';

// 检查字符串是否包含汉字
export function containsKanji(text: string): boolean {
  const kanjiRegex = /[\u4E00-\u9FAF\u3400-\u4DBF]/;
  return kanjiRegex.test(text);
}

// 过滤掉标点符号和空格的Token
export function filterTokensForDisplay(tokens: TokenData[]): TokenData[] {
  return tokens.filter(token => {
    const word = token.word.trim();
    
    // Always keep layout tokens (line breaks and spaces)
    if (token.pos === '改行' || token.pos === '空格') {
      return true;
    }
    
    // Filter out punctuation and empty tokens
    return word !== '' && 
           word !== '，' && 
           word !== '。' && 
           word !== ',' && 
           word !== '.' && 
           word !== ' ' &&
           word !== '「' &&
           word !== '」' &&
           word !== '？' &&
           word !== '！' &&
           word !== '?' &&
           word !== '!' &&
           word !== '、';
  });
}

export interface FuriganaPart {
  base: string;
  ruby?: string;
}

// 智能解析单词和读音，生成用于Ruby标签渲染的结构
export function generateFuriganaParts(word: string, reading: string): FuriganaPart[] {
  // 如果没有读音，或者读���与单词相同，则直接返回原单词
  if (!reading || word === reading) {
    return [{ base: word }];
  }

  const KANJI_REGEX = /[\u4e00-\u9faf\u3005-\u3007]/;
  const KANA_REGEX = /[\u3041-\u3096\u30A1-\u30FA]/;

  const result: FuriganaPart[] = [];
  let wordIdx = 0;
  let readingIdx = 0;

  while (wordIdx < word.length) {
    const wordChar = word[wordIdx];

    // 如果是假名，则它是一个“锚点”，读音和写法应该一致
    if (KANA_REGEX.test(wordChar)) {
      result.push({ base: wordChar });
      wordIdx++;
      readingIdx++;
      continue;
    }

    // 如果是汉字
    if (KANJI_REGEX.test(wordChar)) {
      // 找到连续的汉字块
      let kanjiBlockEnd = wordIdx;
      while (
        kanjiBlockEnd + 1 < word.length &&
        KANJI_REGEX.test(word[kanjiBlockEnd + 1])
      ) {
        kanjiBlockEnd++;
      }
      const kanjiBlock = word.substring(wordIdx, kanjiBlockEnd + 1);

      // 找到这个汉字块后面的第一个假名块（作为下一个锚点）
      let nextKanaBlock = '';
      if (kanjiBlockEnd + 1 < word.length) {
        const nextKanaBlockStart = kanjiBlockEnd + 1;
        // 确保我们只匹配假名作为锚点
        if (KANA_REGEX.test(word[nextKanaBlockStart])) {
            let nextKanaBlockEnd = nextKanaBlockStart;
            while (
              nextKanaBlockEnd < word.length &&
              KANA_REGEX.test(word[nextKanaBlockEnd])
            ) {
              nextKanaBlockEnd++;
            }
            nextKanaBlock = word.substring(nextKanaBlockStart, nextKanaBlockEnd);
        }
      }

      // 根据下一个假名锚点在读音中的位置，来切分当前汉字块的读音
      let readingBlockEnd = reading.length;
      if (nextKanaBlock) {
        const nextKanaIdx = reading.indexOf(nextKanaBlock, readingIdx);
        if (nextKanaIdx !== -1) {
          readingBlockEnd = nextKanaIdx;
        }
      }

      const readingBlock = reading.substring(readingIdx, readingBlockEnd);
      result.push({ base: kanjiBlock, ruby: readingBlock });

      wordIdx = kanjiBlockEnd + 1;
      readingIdx = readingBlockEnd;
      continue;
    }
    
    // 如果不是汉字也不是假名（例如符号），直接添加
    result.push({ base: wordChar });
    wordIdx++;
    // 假设符号不影响读音指针
    if (reading[readingIdx] === wordChar) {
      readingIdx++;
    }
  }
  return result;
}


// 获取词性对应的CSS类名
export function getPosClass(pos: string): string {
  const basePos = pos.split('-')[0];
  const knownPos = ["名詞", "動詞", "形容詞", "副詞", "助詞", "助動詞", "接続詞", "感動詞", "連体詞", "代名詞", "形状詞", "記号", "接頭辞", "接尾辞", "フィラー", "その他"];
  if (knownPos.includes(basePos)) {
    return `pos-${basePos}`;
  }
  return 'pos-default';
}

// 词性中日对照表
export const posChineseMap: Record<string, string> = {
  "名詞": "名词", "動詞": "动词", "形容詞": "形容词", "副詞": "副词",
  "助詞": "助词", "助動詞": "助动词", "接続詞": "接续词", "感動詞": "感动词",
  "連体詞": "连体词", "代名詞": "代名词", "形状詞": "形容动词", "記号": "符号",
  "接頭辞": "接头辞", "接尾辞": "接尾辞", "フィラー": "填充词", "その���": "其他",
  "default": "未知词性"
};

// 朗读日语文本
export function speakJapanese(text: string): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    const selectJapaneseVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // Filter for Japanese voices with comprehensive matching
      const japaneseVoices = voices.filter(voice => 
        voice.lang.startsWith('ja') || 
        voice.lang === 'ja-JP' ||
        voice.name.toLowerCase().includes('japanese') ||
        voice.name.toLowerCase().includes('japan') ||
        voice.name.toLowerCase().includes('kyoko') ||
        voice.name.toLowerCase().includes('otoya') ||
        voice.name.toLowerCase().includes('sayaka') ||
        voice.name.toLowerCase().includes('haruka') ||
        // Common Japanese voice names across different systems
        /^(Kyoko|Otoya|Sayaka|Haruka|Ichiro|Hattori)/i.test(voice.name)
      );
      
      if (japaneseVoices.length > 0) {
        // Prefer female voices, then any Japanese voice
        const preferredVoice = japaneseVoices.find(voice => 
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('kyoko') ||
          voice.name.toLowerCase().includes('sayaka') ||
          voice.name.toLowerCase().includes('haruka')
        ) || japaneseVoices[0];
        
        utterance.voice = preferredVoice;
        console.log('🇯🇵 Using Japanese voice:', preferredVoice.name, preferredVoice.lang);
      } else {
        console.warn('⚠️ No Japanese voices found. Available voices:', 
          voices.map(v => ({ name: v.name, lang: v.lang })).slice(0, 10) // Show first 10 to avoid console spam
        );
        console.warn('📢 Using default voice with ja-JP language setting');
      }
      
      window.speechSynthesis.speak(utterance);
    };
    
    // Voices might not be loaded immediately, so we need to handle both cases
    const voices = window.speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      // Voices are already loaded
      selectJapaneseVoiceAndSpeak();
    } else {
      // Voices are not loaded yet, wait for the voiceschanged event
      const handleVoicesChanged = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        selectJapaneseVoiceAndSpeak();
      };
      
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      // Fallback: if voices don't load within 2 seconds, proceed anyway
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        console.warn('🕐 Voices loading timeout, proceeding with default settings');
        selectJapaneseVoiceAndSpeak();
      }, 2000);
    }
  } else {
    console.warn('🚫 浏览器不支持语音朗读功能');
  }
}

// 获取可用的日语语音列表
export function getAvailableJapaneseVoices(): SpeechSynthesisVoice[] {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const voices = window.speechSynthesis.getVoices();
    return voices.filter(voice => 
      voice.lang.startsWith('ja') || 
      voice.lang === 'ja-JP' ||
      voice.name.toLowerCase().includes('japanese') ||
      voice.name.toLowerCase().includes('japan') ||
      voice.name.toLowerCase().includes('kyoko') ||
      voice.name.toLowerCase().includes('otoya') ||
      voice.name.toLowerCase().includes('sayaka') ||
      voice.name.toLowerCase().includes('haruka') ||
      /^(Kyoko|Otoya|Sayaka|Haruka|Ichiro|Hattori)/i.test(voice.name)
    );
  }
  return [];
}

// 测试日语语音功能
export function testJapaneseVoice(): void {
  const testText = "こんにちは。これは日本語のテストです。";
  console.log('🧪 Testing Japanese voice with:', testText);
  
  // Show available Japanese voices
  const japaneseVoices = getAvailableJapaneseVoices();
  console.log('🎤 Available Japanese voices:', japaneseVoices.map(v => ({
    name: v.name,
    lang: v.lang,
    default: v.default,
    localService: v.localService
  })));
  
  speakJapanese(testText);
}

// 使用Edge/Gemini TTS朗读文本
export async function speakJapaneseWithTTS(
  text: string, 
  apiKey?: string, 
  provider: 'edge' | 'gemini' = 'edge',
  options: { gender?: 'male' | 'female'; voice?: string; rate?: number; pitch?: number } = {}
): Promise<void> {
  try {
    const url = await getJapaneseTtsAudioUrl(text, apiKey, provider, options);
    const audioElement = new Audio(url);
    audioElement.play();
  } catch (error) {
    console.warn(`${provider} TTS 播放失败`, error);
    // 回退到系统朗读（如果需要的话）
    speakJapanese(text);
  }
}

// 获取 TTS 音频 URL
export async function getJapaneseTtsAudioUrl(
  text: string, 
  apiKey?: string, 
  provider: 'edge' | 'gemini' = 'edge',
  options: { gender?: 'male' | 'female'; voice?: string; rate?: number; pitch?: number } = {}
): Promise<string> {
  const { audio, mimeType } = await synthesizeSpeech(text, provider, options, apiKey);
  return provider === 'edge' ? 
    createPlayableUrlFromAudio(audio, mimeType) : 
    createPlayableUrlFromPcm(audio, mimeType);
}

// 将 Base64 音频数据转换为可播放的 URL (Edge TTS用)
function createPlayableUrlFromAudio(base64: string, mimeType: string): string {
  const byteString = atob(base64);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  
  const blob = new Blob([arrayBuffer], { type: mimeType });
  return URL.createObjectURL(blob);
}

// 将 Base64 PCM 数据转换为可播放的 WAV URL (Gemini TTS用)
function createPlayableUrlFromPcm(base64: string, mimeType: string): string {
  const byteString = atob(base64);
  const pcmData = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    pcmData[i] = byteString.charCodeAt(i);
  }

  const match = /rate=(\d+)/.exec(mimeType);
  const sampleRate = match ? parseInt(match[1], 10) : 24000;
  const numChannels = 1;
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;

  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);

  function writeString(off: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(off + i, str.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, pcmData.length, true);

  for (let i = 0; i < pcmData.length; i++) {
    view.setUint8(44 + i, pcmData[i]);
  }

  const wavBlob = new Blob([view], { type: 'audio/wav' });
  return URL.createObjectURL(wavBlob);
}

// 默认API URL
const DEFAULT_API_URL = 
  process.env.API_URL || 
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// 保存API设置到localStorage
export function saveApiSettings(apiKey: string, apiUrl: string): void {
  if (typeof window !== 'undefined') {
    if (apiKey) {
      localStorage.setItem('userApiKey', apiKey);
    } else {
      localStorage.removeItem('userApiKey');
    }
    
    if (apiUrl && apiUrl !== DEFAULT_API_URL) {
      localStorage.setItem('userApiUrl', apiUrl);
    } else {
      localStorage.removeItem('userApiUrl');
    }
  }
}

// 从localStorage获取API设置
export function getApiSettings(): { apiKey: string, apiUrl: string } {
  if (typeof window !== 'undefined') {
    // 尝试从localStorage读取
    const savedApiKey = localStorage.getItem('userApiKey') || '';
    const savedApiUrl = localStorage.getItem('userApiUrl') || DEFAULT_API_URL;
    
    // 尝试从环境变量读取默认值（如果本地没有值）
    const apiKey = savedApiKey || process.env.API_KEY || '';
    const apiUrl = savedApiUrl;
    
    return { apiKey, apiUrl };
  }
  return { 
    apiKey: process.env.API_KEY || '', 
    apiUrl: DEFAULT_API_URL 
  };
}

// Japanese Color Theme Interface
export interface JapaneseColorTheme {
  noun: string;
  verb: string;
  adjective: string;
  particle: string;
  adverb: string;
  auxiliary: string;
  other: string;
  background: string;
}

// Grammar color mapping using CSS custom properties
// These colors automatically adapt to the current theme (light/dark)
export const posColorMap: Record<string, string> = {
  "名詞": "var(--grammar-noun)",       // Theme-aware color for nouns
  "動詞": "var(--grammar-verb)",       // Theme-aware color for verbs
  "形容詞": "var(--grammar-adjective)", // Theme-aware color for adjectives
  "副詞": "var(--grammar-adverb)",     // Theme-aware color for adverbs
  "助詞": "var(--grammar-particle)",   // Theme-aware color for particles
  "助動詞": "var(--grammar-auxiliary)", // Theme-aware color for auxiliary verbs
  "接続詞": "var(--grammar-other)",    // Theme-aware color for conjunctions
  "感動詞": "var(--grammar-other)",    // Theme-aware color for interjections
  "連体詞": "var(--grammar-other)",    // Theme-aware color for attributive words
  "代名詞": "var(--grammar-noun)",     // Theme-aware color for pronouns (same as nouns)
  "形状詞": "var(--grammar-adjective)", // Theme-aware color for adjectival nouns (same as adjectives)
  "記号": "var(--grammar-other)",      // Theme-aware color for symbols
  "接頭辞": "var(--grammar-other)",    // Theme-aware color for prefixes
  "接尾辞": "var(--grammar-other)",    // Theme-aware color for suffixes
  "フィラー": "var(--grammar-other)",   // Theme-aware color for fillers
  "その他": "var(--grammar-other)",     // Theme-aware color for others
  "default": "var(--grammar-other)"    // Default theme-aware color
};

// Color contrast mappings for selected tokens using CSS custom properties
// Since we use CSS variables that adapt to themes, we use semantic contrast colors
export const selectedTokenTextColorMap: Record<string, string> = {
  "var(--grammar-noun)": "var(--on-surface)",
  "var(--grammar-verb)": "var(--on-surface)", 
  "var(--grammar-adjective)": "var(--on-surface)",
  "var(--grammar-particle)": "var(--on-surface)",
  "var(--grammar-adverb)": "var(--on-surface)",
  "var(--grammar-auxiliary)": "var(--on-surface)",
  "var(--grammar-other)": "var(--on-surface)",
  // Fallback for any other colors
  "default": "var(--on-surface)"
};

// Enhanced color variants for better visual distinction
export const posColorVariants: Record<string, { light: string; medium: string; dark: string }> = {
  "名詞": { light: "#90EE90", medium: "#228B22", dark: "#2D5A27" }, // Greens
  "動詞": { light: "#FFB6C1", medium: "#DC143C", dark: "#C41E3A" }, // Reds
  "形容詞": { light: "#DEB887", medium: "#A0522D", dark: "#8B4513" }, // Browns
  "副詞": { light: "#B0E0E6", medium: "#4682B4", dark: "#4682B4" }, // Blues
  "助詞": { light: "#F0E68C", medium: "#DAA520", dark: "#DAA520" }, // Golds
  "助動詞": { light: "#FFA07A", medium: "#DC143C", dark: "#DC143C" }, // Crimsons
  "接続詞": { light: "#DDA0DD", medium: "#6A5ACD", dark: "#6A5ACD" }, // Purples
  "感動詞": { light: "#FFE4E1", medium: "#FF6347", dark: "#FF6347" }, // Oranges
  "連体詞": { light: "#E6E6FA", medium: "#4169E1", dark: "#4169E1" }, // Blues
  "代名詞": { light: "#98FB98", medium: "#556B2F", dark: "#556B2F" }, // Olive Greens
  "形状詞": { light: "#F5DEB3", medium: "#A0522D", dark: "#A0522D" }, // Browns
  "記号": { light: "#D3D3D3", medium: "#708090", dark: "#708090" }, // Grays
  "接頭辞": { light: "#E0B4D6", medium: "#9370DB", dark: "#9370DB" }, // Purples
  "接尾辞": { light: "#AFEEEE", medium: "#20B2AA", dark: "#20B2AA" }, // Teals
  "フィラー": { light: "#F5DEB3", medium: "#CD853F", dark: "#CD853F" }, // Browns
  "その他": { light: "#D3D3D3", medium: "#778899", dark: "#778899" }, // Grays
};

// 获取词性对应的语法颜色类名 (使用新的颜色体系)
export function getGrammarColorClass(pos: string): string {
  const basePos = pos.split('-')[0];
  
  switch (basePos) {
    case '名詞':
    case '代名詞':
      return 'text-grammar-noun';
    case '動詞':
    case '助動詞':
      return 'text-grammar-verb';
    case '形容詞':
    case '形状詞':
      return 'text-grammar-adjective';
    case '助詞':
      return 'text-grammar-particle';
    case '副詞':
      return 'text-grammar-adverb';
    case '接続詞':
    case '感動詞':
    case '連体詞':
    case '記号':
    case '接頭辞':
    case '接尾辞':
    case 'フィラー':
    case 'その他':
    default:
      return 'text-grammar-other';
  }
}

// 获取词性对应的十六进制颜色值
export function getGrammarColor(pos: string): string {
  const basePos = pos.split('-')[0];
  return posColorMap[basePos] || posColorMap['default'];
}

// Get optimal text color for selected token based on background
export function getSelectedTokenTextColor(backgroundColor: string): string {
  // First try direct lookup for CSS custom properties
  if (selectedTokenTextColorMap[backgroundColor]) {
    return selectedTokenTextColorMap[backgroundColor];
  }
  
  // If it's a CSS custom property but not in our map, use default contrast
  if (backgroundColor.startsWith('var(--')) {
    return selectedTokenTextColorMap['default'];
  }
  
  // If it's a hex color, use the contrast calculation function
  return getContrastColor(backgroundColor);
}

// Get color variant for enhanced visual distinction
export function getColorVariant(pos: string, variant: 'light' | 'medium' | 'dark' = 'medium'): string {
  const basePos = pos.split('-')[0];
  const variants = posColorVariants[basePos] || posColorVariants['その他'];
  return variants[variant];
}

// Calculate color contrast for better accessibility
export function getContrastColor(hexColor: string): string {
  // Remove # if present
  const color = hexColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark colors, black for light colors
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// 获取当前的日语语法颜色主题 (Enhanced)
export function getCurrentJapaneseTheme(): JapaneseColorTheme {
  return {
    noun: '#2D5A27',       // Forest Green - 名詞
    verb: '#C41E3A',       // Ruby Red - 動詞
    adjective: '#8B4513',  // Saddle Brown - 形容詞
    particle: '#DAA520',   // Goldenrod - 助詞
    adverb: '#4682B4',     // Steel Blue - 副詞
    auxiliary: '#DC143C',  // Crimson - 助動詞
    other: '#778899',      // Light Slate Gray - その他
    background: '#DAC8C0', // Light Beige - 背景
  };
}