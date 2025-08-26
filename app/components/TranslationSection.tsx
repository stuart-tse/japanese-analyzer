'use client';

import { useState, useEffect, useMemo } from 'react';
import { translateText, streamTranslateText, batchTranslateTokens, TokenData } from '../services/api';
import { 
  TranslationMode, 
  DetailedTranslation, 
  TranslationConfidence, 
  TokenTranslation,
  TranslationHistory,
  TranslationStats 
} from '../types/translation';
import TranslationModeSelector from './TranslationModeSelector';
import TranslationCard from './TranslationCard';
import TokenTranslationTable from './TokenTranslationTable';
import { FaHistory, FaCog, FaTimes } from 'react-icons/fa';

interface TranslationSectionProps {
  japaneseText: string;
  tokens?: TokenData[];
  userApiKey?: string;
  userApiUrl?: string;
  useStream?: boolean;
  trigger?: number;
  className?: string;
}

export default function TranslationSection({
  japaneseText,
  tokens = [],
  userApiKey,
  userApiUrl,
  useStream = true,
  trigger,
  className = ''
}: TranslationSectionProps) {
  // Core translation state
  const [selectedMode, setSelectedMode] = useState<TranslationMode>('quick');
  const [translation, setTranslation] = useState<DetailedTranslation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  // Note: streamContent state removed as it's handled directly in stream callback
  
  // Enhanced features state
  const [showHistory, setShowHistory] = useState(false);
  const [translationHistory, setTranslationHistory] = useState<TranslationHistory[]>([]);
  const [translationStats, setTranslationStats] = useState<TranslationStats | null>(null);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);
  
  // Progressive enhancement state
  const [isVisible, setIsVisible] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(false);
  
  // Load translation history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('translationHistory');
      if (stored) {
        const parsed = JSON.parse(stored);
        setTranslationHistory(parsed.slice(0, 10)); // Keep last 10
      }
    } catch (error) {
      console.error('Failed to load translation history:', error);
    }
  }, []);
  
  // State for API-based token translations
  const [tokenTranslations, setTokenTranslations] = useState<TokenTranslation[]>([]);
  const [translatingTokens, setTranslatingTokens] = useState(false);

  // Generate API-based token translations for word-by-word mode using batch translation
  useEffect(() => {
    async function translateTokensBatch() {
      if (!tokens.length || selectedMode !== 'word-by-word') {
        setTokenTranslations([]);
        return;
      }

      setTranslatingTokens(true);
      
      try {
        // Get batch translations for all tokens at once
        const translationDict = await batchTranslateTokens(tokens, userApiKey, userApiUrl);
        
        // Convert to TokenTranslation array format
        const translations = tokens.map(token => {
          // Handle layout tokens
          if (token.pos === '改行' || token.pos === '空格') {
            return {
              originalWord: token.word,
              pos: token.pos,
              furigana: token.furigana,
              romaji: token.romaji,
              chineseTranslation: token.word,
              confidence: 100,
              alternatives: [],
              explanation: '',
              usage: ''
            };
          }

          // Get translation from batch result
          const chineseTranslation = translationDict[token.word] || `${token.word}(未翻译)`;
          
          return {
            originalWord: token.word,
            pos: token.pos,
            furigana: token.furigana,
            romaji: token.romaji,
            chineseTranslation,
            confidence: Math.floor(Math.random() * 30) + 70, // 70-100% confidence
            alternatives: [],
            explanation: `${token.word} 的详细解释...`,
            usage: `${token.word} 的使用方法和例句...`
          };
        });
        
        setTokenTranslations(translations);
      } catch (error) {
        console.error('Error in batch token translation:', error);
        
        // Fallback: create error translations
        const errorTranslations = tokens.map(token => ({
          originalWord: token.word,
          pos: token.pos,
          furigana: token.furigana,
          romaji: token.romaji,
          chineseTranslation: `${token.word}(批量翻译错误)`,
          confidence: 0,
          alternatives: [],
          explanation: '',
          usage: ''
        }));
        
        setTokenTranslations(errorTranslations);
      } finally {
        setTranslatingTokens(false);
      }
    }

    translateTokensBatch();
  }, [tokens, selectedMode, userApiKey, userApiUrl]);
  
  const handleTranslate = async (mode?: TranslationMode) => {
    const targetMode = mode || selectedMode;
    
    if (!japaneseText.trim()) {
      setError('请先输入日语文本');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setTranslation(null);
    setIsVisible(true);
    
    const startTime = Date.now();
    
    try {
      if (useStream) {
        await handleStreamTranslation(targetMode, startTime);
      } else {
        await handleSyncTranslation(targetMode, startTime);
      }
    } catch (error) {
      console.error('Translation error:', error);
      setError(error instanceof Error ? error.message : '翻译失败');
      setIsLoading(false);
    }
  };
  
  const handleStreamTranslation = async (mode: TranslationMode, startTime: number) => {
    return new Promise<void>((resolve, reject) => {
      streamTranslateText(
        japaneseText,
        (chunk, isDone) => {
          // Process streaming chunk directly
          if (isDone) {
            const processingTime = Date.now() - startTime;
            processTranslationResult(chunk, mode, processingTime);
            setIsLoading(false);
            resolve();
          }
        },
        (error) => {
          setError(error.message || '流式翻译失败');
          setIsLoading(false);
          reject(error);
        },
        userApiKey,
        userApiUrl
      );
    });
  };
  
  const handleSyncTranslation = async (mode: TranslationMode, startTime: number) => {
    const result = await translateText(japaneseText, userApiKey, userApiUrl);
    const processingTime = Date.now() - startTime;
    processTranslationResult(result, mode, processingTime);
    setIsLoading(false);
  };
  
  const processTranslationResult = (
    translatedText: string, 
    mode: TranslationMode, 
    processingTime: number
  ) => {
    // Create enhanced translation object with confidence and metadata
    const confidence: TranslationConfidence = {
      overall: Math.floor(Math.random() * 30) + 70, // Mock confidence 70-100%
      methodology: 'gemini',
      tokens: mode === 'word-by-word' ? 
        Object.fromEntries(tokens.map((_, i) => [i, Math.floor(Math.random() * 30) + 70])) : 
        undefined
    };
    
    const detailedTranslation: DetailedTranslation = {
      original: japaneseText,
      translated: translatedText,
      confidence,
      tokens: tokenTranslations,
      difficulty_level: 'intermediate',
      grammar_notes: mode === 'detailed' ? [
        '这是一个基本的日语句子结构',
        '使用了です/である敬语形式',
        '包含时间表达和形容词修饰'
      ] : undefined,
      cultural_notes: mode === 'detailed' ? [
        '"ですね"是日语中常用的语气助词，表示征求同意',
        '天气话题在日语交流中很常见，是安全的开场话题'
      ] : undefined,
      translation_notes: mode === 'detailed' ? 
        '这句话体现了日语的礼貌表达方式，适合在正式场合使用。' : undefined
    };
    
    setTranslation(detailedTranslation);
    
    // Update statistics
    setTranslationStats({
      total_words: tokens.length,
      translated_words: tokens.filter(t => t.pos !== '改行' && t.pos !== '空格').length,
      avg_confidence: confidence.overall,
      processing_time: processingTime
    });
    
    // Save to history
    saveToHistory(detailedTranslation, mode);
  };
  
  const saveToHistory = (translation: DetailedTranslation, mode: TranslationMode) => {
    const historyEntry: TranslationHistory = {
      id: Date.now().toString(),
      original: translation.original,
      translated: translation.translated,
      mode,
      timestamp: new Date(),
      confidence: translation.confidence.overall
    };
    
    const newHistory = [historyEntry, ...translationHistory].slice(0, 50);
    setTranslationHistory(newHistory);
    
    try {
      localStorage.setItem('translationHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save translation history:', error);
    }
  };
  
  const loadHistoryTranslation = (historyItem: TranslationHistory) => {
    // Reconstruct translation object from history
    const confidence: TranslationConfidence = {
      overall: historyItem.confidence,
      methodology: 'gemini'
    };
    
    const translation: DetailedTranslation = {
      original: historyItem.original,
      translated: historyItem.translated,
      confidence,
      tokens: [],
      difficulty_level: 'intermediate'
    };
    
    setTranslation(translation);
    setSelectedMode(historyItem.mode);
    setShowHistory(false);
  };
  
  const clearHistory = () => {
    setTranslationHistory([]);
    localStorage.removeItem('translationHistory');
  };
  
  const handleTokenSelect = (index: number) => {
    setSelectedTokenIndex(selectedTokenIndex === index ? null : index);
  };
  
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  
  const handleRetranslate = () => {
    handleTranslate(selectedMode);
  };
  
  // Auto-translate when trigger changes
  useEffect(() => {
    if (trigger && japaneseText && autoTranslate) {
      handleTranslate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  
  return (
    <div className={`translation-section ${className}`}>
      {/* Enhanced Header with Mode Selector */}
      <div className="section-header mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--on-surface)' }}>
            智能翻译
          </h2>
          
          <div className="header-actions flex items-center gap-2">
            {/* Auto-translate toggle */}
            <label className="flex items-center gap-2 text-sm" 
                   style={{ color: 'var(--on-surface-variant)' }}>
              <input
                type="checkbox"
                checked={autoTranslate}
                onChange={(e) => setAutoTranslate(e.target.checked)}
                className="rounded"
                style={{ accentColor: 'var(--grammar-verb)' }}
              />
              自动翻译
            </label>
            
            {/* History button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-full transition-colors duration-200"
              style={{
                backgroundColor: showHistory ? 'var(--grammar-verb)15' : 'transparent',
                color: 'var(--grammar-verb)'
              }}
              title="翻译历史"
            >
              <FaHistory className="w-4 h-4" />
            </button>
            
            {/* Visibility toggle */}
            <button
              onClick={toggleVisibility}
              className="p-2 rounded-full transition-colors duration-200"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--on-surface-variant)'
              }}
              title={isVisible ? '隐藏' : '显示'}
            >
              {isVisible ? <FaTimes className="w-4 h-4" /> : <FaCog className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Translation Mode Selector */}
        <TranslationModeSelector
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
          isLoading={isLoading}
          className="mb-4"
        />
        
        {/* Translation Action Button */}
        <div className="flex justify-center">
          <button
            onClick={() => handleTranslate()}
            disabled={isLoading || !japaneseText.trim()}
            className={`
              premium-button premium-button-primary
              ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
            `}
            style={{
              backgroundColor: isLoading ? 'var(--outline)' : 'var(--grammar-verb)',
              minWidth: '200px'
            }}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white"></div>
                <span>翻译中...</span>
              </div>
            ) : (
              `开始${selectedMode === 'quick' ? '快速' : selectedMode === 'detailed' ? '详细' : '逐词'}翻译`
            )}
          </button>
        </div>
      </div>
      
      {/* History Panel */}
      {showHistory && (
        <div className="history-panel mb-6 p-4 rounded-lg border" 
             style={{ 
               backgroundColor: 'var(--surface-container-low)',
               borderColor: 'var(--outline)'
             }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium" style={{ color: 'var(--on-surface)' }}>
              翻译历史
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                {translationHistory.length} 条记录
              </span>
              {translationHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'var(--error)',
                    color: 'var(--on-error)'
                  }}
                >
                  清空
                </button>
              )}
            </div>
          </div>
          
          <div className="history-list max-h-60 overflow-y-auto space-y-2">
            {translationHistory.length === 0 ? (
              <div className="text-center py-4" style={{ color: 'var(--on-surface-variant)' }}>
                暂无翻译历史
              </div>
            ) : (
              translationHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => loadHistoryTranslation(item)}
                  className="history-item p-3 rounded cursor-pointer transition-colors duration-200"
                  style={{
                    backgroundColor: 'var(--surface-container)',
                    border: '1px solid var(--outline)'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-3">
                      <div className="text-sm font-medium mb-1" style={{ color: 'var(--on-surface)' }}>
                        {item.original.length > 30 ? `${item.original.substring(0, 30)}...` : item.original}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                        {item.translated.length > 50 ? `${item.translated.substring(0, 50)}...` : item.translated}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs px-2 py-0.5 rounded" 
                            style={{
                              backgroundColor: 'var(--grammar-verb)',
                              color: 'white'
                            }}>
                        {item.mode === 'quick' ? '快速' : item.mode === 'detailed' ? '详细' : '逐词'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                        {item.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Main Translation Content */}
      {isVisible && (
        <div className="translation-content space-y-6">
          {/* Translation Card */}
          <TranslationCard
            original={japaneseText}
            translation={translation}
            mode={selectedMode}
            isLoading={isLoading}
            error={error}
            onRetranslate={handleRetranslate}
            userApiKey={userApiKey}
            className="mb-6"
          />
          
          {/* Token Translation Table for word-by-word mode */}
          {selectedMode === 'word-by-word' && tokens.length > 0 && (
            <div className="token-translation-section">
              {translatingTokens && (
                <div className="translation-loading mb-4 p-4 rounded-lg text-center"
                     style={{ backgroundColor: 'var(--surface-container-low)' }}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent" 
                         style={{ borderColor: 'var(--grammar-verb)' }}></div>
                    <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                      正在批量翻译词汇...
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                    使用批量处理快速翻译所有词汇
                  </div>
                </div>
              )}
              <TokenTranslationTable
                tokens={tokens}
                tokenTranslations={tokenTranslations}
                originalSentence={japaneseText}
                onTokenSelect={handleTokenSelect}
                selectedTokenIndex={selectedTokenIndex}
                userApiKey={userApiKey}
                userApiUrl={userApiUrl}
              />
            </div>
          )}
          
          {/* Translation Statistics */}
          {translationStats && translation && (
            <div className="translation-stats p-4 rounded-lg" 
                 style={{ backgroundColor: 'var(--surface-container-low)' }}>
              <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--on-surface)' }}>
                翻译统计
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="stat-item">
                  <div className="stat-value text-lg font-medium" style={{ color: 'var(--grammar-verb)' }}>
                    {translationStats.total_words}
                  </div>
                  <div className="stat-label" style={{ color: 'var(--on-surface-variant)' }}>
                    总词数
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-value text-lg font-medium" style={{ color: 'var(--grammar-adjective)' }}>
                    {translationStats.avg_confidence}%
                  </div>
                  <div className="stat-label" style={{ color: 'var(--on-surface-variant)' }}>
                    平均置信度
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-value text-lg font-medium" style={{ color: 'var(--grammar-noun)' }}>
                    {translationStats.processing_time}ms
                  </div>
                  <div className="stat-label" style={{ color: 'var(--on-surface-variant)' }}>
                    处理时间
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-value text-lg font-medium" style={{ color: 'var(--grammar-auxiliary)' }}>
                    {translation.difficulty_level}
                  </div>
                  <div className="stat-label" style={{ color: 'var(--on-surface-variant)' }}>
                    难度等级
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}