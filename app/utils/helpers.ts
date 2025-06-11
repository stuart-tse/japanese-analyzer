// 工具函数
import { synthesizeSpeech } from '../services/api';

// 检查字符串是否包含汉字
export function containsKanji(text: string): boolean {
  const kanjiRegex = /[\u4E00-\u9FAF\u3400-\u4DBF]/;
  return kanjiRegex.test(text);
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
  "接頭辞": "接头辞", "接尾辞": "接尾辞", "フィラー": "填充词", "その他": "其他",
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
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn('浏览器不支持语音朗读功能');
  }
}

// 使用Gemini TTS朗读文本
export async function speakJapaneseWithTTS(text: string, apiKey?: string): Promise<void> {
  try {
    const { audio, mimeType } = await synthesizeSpeech(text, 'Kore', apiKey);

    const byteString = atob(audio);
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const audioElement = new Audio(url);
    audioElement.play();
  } catch (error) {
    console.warn('Gemini TTS 播放失败，尝试使用系统朗读', error);
    speakJapanese(text);
  }
}

// 默认API URL
const DEFAULT_API_URL = 
  process.env.API_URL || 
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// 保存API设置到localStorage
export function saveApiSettings(apiKey: string, apiUrl: string): void {
  if (typeof window !== 'undefined') {
    if (apiKey) {
      localStorage.setItem('userGeminiApiKey', apiKey);
    } else {
      localStorage.removeItem('userGeminiApiKey');
    }
    
    if (apiUrl && apiUrl !== DEFAULT_API_URL) {
      localStorage.setItem('userGeminiApiUrl', apiUrl);
    } else {
      localStorage.removeItem('userGeminiApiUrl');
    }
  }
}

// 从localStorage获取API设置
export function getApiSettings(): { apiKey: string, apiUrl: string } {
  if (typeof window !== 'undefined') {
    // 尝试从localStorage读取
    const savedApiKey = localStorage.getItem('userGeminiApiKey') || '';
    const savedApiUrl = localStorage.getItem('userGeminiApiUrl') || DEFAULT_API_URL;
    
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