// Translation-specific TypeScript interfaces

export type TranslationMode = 'quick' | 'detailed' | 'word-by-word';

export interface TranslationConfidence {
  overall: number; // 0-100
  tokens?: { [tokenIndex: number]: number };
  methodology: 'gemini' | 'rule-based' | 'hybrid';
}

export interface TokenTranslation {
  originalWord: string;
  pos: string;
  furigana?: string;
  romaji?: string;
  chineseTranslation: string;
  englishTranslation?: string;
  confidence: number;
  alternatives?: string[];
  explanation?: string;
  usage?: string;
}

export interface DetailedTranslation {
  original: string;
  translated: string;
  confidence: TranslationConfidence;
  tokens: TokenTranslation[];
  grammar_notes?: string[];
  cultural_notes?: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  translation_notes?: string;
}

export interface TranslationHistory {
  id: string;
  original: string;
  translated: string;
  mode: TranslationMode;
  timestamp: Date;
  confidence: number;
}

export interface TranslationStats {
  total_words: number;
  translated_words: number;
  avg_confidence: number;
  processing_time: number;
}

export interface TranslationQuality {
  accuracy: number; // 0-100
  fluency: number; // 0-100
  completeness: number; // 0-100
  cultural_appropriateness: number; // 0-100
  suggestions?: string[];
}

export interface TranslationContextualInfo {
  sentence_type: 'declarative' | 'interrogative' | 'imperative' | 'exclamatory';
  formality_level: 'casual' | 'polite' | 'formal' | 'honorific';
  tense: 'past' | 'present' | 'future' | 'progressive';
  mood: 'indicative' | 'subjunctive' | 'conditional';
  cultural_context?: string;
}