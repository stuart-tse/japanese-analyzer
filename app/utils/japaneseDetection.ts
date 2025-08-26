/**
 * Japanese text detection utilities
 */

export interface JapaneseDetectionResult {
  isJapanese: boolean;
  confidence: number;
  detectedScripts: {
    hiragana: boolean;
    katakana: boolean;
    kanji: boolean;
    romaji: boolean;
  };
  statistics: {
    hiraganaCount: number;
    katakanaCount: number;
    kanjiCount: number;
    romajiCount: number;
    totalChars: number;
    japaneseRatio: number;
  };
  suggestions?: string[];
}

// Unicode ranges for Japanese characters
const HIRAGANA_RANGE = /[\u3040-\u309F]/g;
const KATAKANA_RANGE = /[\u30A0-\u30FF]/g;
const KANJI_RANGE = /[\u4E00-\u9FAF]/g;
const ROMAJI_RANGE = /[a-zA-Z]/g;
const JAPANESE_PUNCTUATION = /[\u3000-\u303F]/g;

/**
 * Detects if text contains Japanese characters and provides detailed analysis
 */
export function detectJapanese(text: string): JapaneseDetectionResult {
  if (!text || typeof text !== 'string') {
    return {
      isJapanese: false,
      confidence: 0,
      detectedScripts: {
        hiragana: false,
        katakana: false,
        kanji: false,
        romaji: false,
      },
      statistics: {
        hiraganaCount: 0,
        katakanaCount: 0,
        kanjiCount: 0,
        romajiCount: 0,
        totalChars: 0,
        japaneseRatio: 0,
      }
    };
  }

  // Remove whitespace for analysis
  const cleanText = text.replace(/\s+/g, '');
  const totalChars = cleanText.length;

  if (totalChars === 0) {
    return {
      isJapanese: false,
      confidence: 0,
      detectedScripts: {
        hiragana: false,
        katakana: false,
        kanji: false,
        romaji: false,
      },
      statistics: {
        hiraganaCount: 0,
        katakanaCount: 0,
        kanjiCount: 0,
        romajiCount: 0,
        totalChars: 0,
        japaneseRatio: 0,
      }
    };
  }

  // Count different script types
  const hiraganaMatches = cleanText.match(HIRAGANA_RANGE) || [];
  const katakanaMatches = cleanText.match(KATAKANA_RANGE) || [];
  const kanjiMatches = cleanText.match(KANJI_RANGE) || [];
  const romajiMatches = cleanText.match(ROMAJI_RANGE) || [];
  const punctuationMatches = cleanText.match(JAPANESE_PUNCTUATION) || [];

  const hiraganaCount = hiraganaMatches.length;
  const katakanaCount = katakanaMatches.length;
  const kanjiCount = kanjiMatches.length;
  const romajiCount = romajiMatches.length;
  const punctuationCount = punctuationMatches.length;

  // Calculate Japanese character ratio
  const japaneseCharCount = hiraganaCount + katakanaCount + kanjiCount + punctuationCount;
  const japaneseRatio = japaneseCharCount / totalChars;

  // Determine presence of each script
  const detectedScripts = {
    hiragana: hiraganaCount > 0,
    katakana: katakanaCount > 0,
    kanji: kanjiCount > 0,
    romaji: romajiCount > 0,
  };

  // Calculate confidence based on various factors
  let confidence = 0;
  
  // Base confidence from Japanese character ratio
  confidence += japaneseRatio * 0.6;

  // Bonus for multiple script types (typical of Japanese)
  const scriptTypeCount = Object.values(detectedScripts).filter(Boolean).length;
  if (scriptTypeCount >= 2) {
    confidence += 0.2;
  }

  // Bonus for hiragana (most common in Japanese)
  if (detectedScripts.hiragana) {
    confidence += 0.15;
  }

  // Bonus for kanji
  if (detectedScripts.kanji) {
    confidence += 0.1;
  }

  // Penalty for high romaji ratio without Japanese characters
  if (romajiCount > japaneseCharCount && japaneseCharCount === 0) {
    confidence -= 0.3;
  }

  // Cap confidence at 1.0
  confidence = Math.min(confidence, 1.0);

  // Determine if text is Japanese
  const isJapanese = japaneseRatio > 0.1 || (japaneseCharCount > 0 && confidence > 0.3);

  // Generate suggestions for non-Japanese text
  let suggestions: string[] | undefined;
  if (!isJapanese && romajiCount > 0) {
    suggestions = [
      'Try entering text in Japanese characters (hiragana, katakana, or kanji)',
      'Use an IME (Input Method Editor) to type in Japanese',
      'Copy and paste Japanese text from a reliable source'
    ];
  }

  return {
    isJapanese,
    confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
    detectedScripts,
    statistics: {
      hiraganaCount,
      katakanaCount,
      kanjiCount,
      romajiCount,
      totalChars,
      japaneseRatio: Math.round(japaneseRatio * 100) / 100,
    },
    suggestions
  };
}

/**
 * Simple boolean check for Japanese text
 */
export function isJapanese(text: string): boolean {
  return detectJapanese(text).isJapanese;
}

/**
 * Get confidence level as a descriptive string
 */
export function getConfidenceLevel(confidence: number): 'low' | 'medium' | 'high' | 'very-high' {
  if (confidence < 0.3) return 'low';
  if (confidence < 0.6) return 'medium';
  if (confidence < 0.8) return 'high';
  return 'very-high';
}

/**
 * Common Japanese text patterns for validation
 */
export const COMMON_JAPANESE_PATTERNS = {
  // Common particles
  particles: /[はがをにでとからまでもへのや]/g,
  
  // Common verb endings
  verbEndings: /[るすくぐむぶぬつづふぷゆちじしりみびにきぎい]$/g,
  
  // Common adjective endings  
  adjectiveEndings: /[いしき]$/g,
  
  // Polite forms
  politeForms: /[ですますでしょうございます]/g,
};

/**
 * Analyze common Japanese patterns in text
 */
export function analyzeJapanesePatterns(text: string) {
  const patterns = COMMON_JAPANESE_PATTERNS;
  
  return {
    hasParticles: patterns.particles.test(text),
    hasVerbEndings: patterns.verbEndings.test(text),
    hasAdjectiveEndings: patterns.adjectiveEndings.test(text),
    hasPoliteForms: patterns.politeForms.test(text),
  };
}