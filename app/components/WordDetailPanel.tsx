'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FaVolumeUp, FaChevronDown, FaChevronRight, FaTimes } from 'react-icons/fa';
import { TokenData, WordDetail, getWordDetails, streamWordDetails } from '../services/api';
import { speakJapanese } from '../utils/helpers';
import { LearningMode } from './LearningModeSelector';


interface DisclosureSection {
  id: string;
  title: string;
  level: 'basic' | 'intermediate' | 'advanced';
  content: string | null;
  isOpen: boolean;
}

interface WordDetailPanelProps {
  selectedToken: TokenData | null;
  selectedTokenIndex: number | null;
  onClose: () => void;
  userApiKey?: string;
  userApiUrl?: string;
  useStream?: boolean;
  learningMode: LearningMode;
  ttsProvider?: 'edge' | 'gemini';
  currentSentence?: string;
}

export default function WordDetailPanel({
  selectedToken,
  selectedTokenIndex: _selectedTokenIndex, // eslint-disable-line @typescript-eslint/no-unused-vars
  onClose,
  userApiKey,
  userApiUrl,
  useStream = true,
  learningMode,
  ttsProvider: _ttsProvider = 'edge', // eslint-disable-line @typescript-eslint/no-unused-vars
  currentSentence = ''
}: WordDetailPanelProps) {
  const [wordDetail, setWordDetail] = useState<WordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamContent, setStreamContent] = useState(''); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [disclosureSections, setDisclosureSections] = useState<DisclosureSection[]>([]);
  const lastApiCallRef = useRef<string>('');

  // Initialize disclosure sections based on learning mode
  const initializeDisclosureSections = useCallback((learningMode: LearningMode): DisclosureSection[] => {
    const allSections: DisclosureSection[] = [
      {
        id: 'basic',
        title: 'Basic Explanation',
        level: 'basic',
        content: null,
        isOpen: true // Always open for basic info
      },
      {
        id: 'usage',
        title: 'Usage Examples',
        level: 'intermediate',
        content: null,
        isOpen: learningMode !== 'beginner'
      },
      {
        id: 'grammar',
        title: 'Grammar Details',
        level: 'intermediate',
        content: null,
        isOpen: learningMode === 'advanced'
      },
      {
        id: 'cultural',
        title: 'Cultural Context',
        level: 'intermediate', // Changed from 'advanced' to 'intermediate'
        content: null,
        isOpen: learningMode !== 'beginner' // Show for intermediate and advanced
      },
      {
        id: 'etymology',
        title: 'Etymology & History',
        level: 'advanced',
        content: null,
        isOpen: false // Collapsed by default
      }
    ];

    // Filter sections based on learning mode
    return allSections.filter(section => {
      if (learningMode === 'beginner') return section.level === 'basic';
      if (learningMode === 'intermediate') return section.level !== 'advanced';
      return true; // Advanced shows all
    });
  }, []);

  // Load word details when selected token changes
  useEffect(() => {
    
    if (!selectedToken) {
      console.log('🚫 No selectedToken, clearing data');
      setWordDetail(null);
      setStreamContent('');
      setDisclosureSections([]);
      lastApiCallRef.current = '';
      return;
    }

    // Create a unique identifier for this API call to prevent duplicates
    const apiCallId = `${selectedToken.word}-${selectedToken.pos}-${learningMode}-${userApiKey || 'default'}-${userApiUrl || 'default'}-${useStream}`;
    if (lastApiCallRef.current === apiCallId) {
      return;
    }
    lastApiCallRef.current = apiCallId;

    setIsLoading(true);
    setStreamContent('');
    setDisclosureSections(initializeDisclosureSections(learningMode));

    if (useStream) {
      streamWordDetails(
        selectedToken.word,
        selectedToken.pos,
        currentSentence, // sentence context from parent (accessed from closure)
        (chunk, isDone) => {
          setStreamContent(chunk);
          if (isDone) {
            setIsLoading(false);
            // Parse final content into word detail
            try {
              // Try to extract JSON from the chunk - it might contain extra text
              let jsonStr = chunk.trim();
              
              // If the response contains JSON within code blocks, extract it
              const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
              if (jsonMatch) {
                jsonStr = jsonMatch[1];
              }
              
              // If the response starts with some text before JSON, try to find JSON
              const jsonStart = jsonStr.indexOf('{');
              const jsonEnd = jsonStr.lastIndexOf('}');
              if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
              }
              
              const parsed = JSON.parse(jsonStr) as WordDetail;
              setWordDetail(parsed);
            } catch (error) {
              console.error('Failed to parse word detail:', error, 'Raw chunk:', chunk);
              // Set fallback data so the panel still shows something useful
              setWordDetail({
                originalWord: selectedToken.word,
                chineseTranslation: '解析中...',
                pos: selectedToken.pos,
                furigana: selectedToken.furigana,
                romaji: selectedToken.romaji,
                explanation: 'API响应解析失败，正在重试...'
              });
            }
          }
        },
        (error) => {
          console.error('Stream word detail error:', error);
          setIsLoading(false);
        },
        selectedToken.furigana,
        selectedToken.romaji,
        userApiKey,
        userApiUrl,
        learningMode
      );
    } else {
      getWordDetails(
        selectedToken.word, 
        selectedToken.pos, 
        currentSentence, // sentence context from parent (accessed from closure)
        selectedToken.furigana, 
        selectedToken.romaji,
        userApiKey, 
        userApiUrl,
        learningMode
      )
        .then(detail => {
          setWordDetail(detail);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Get word detail error:', error);
          setIsLoading(false);
          // Set fallback data
          setWordDetail({
            originalWord: selectedToken.word,
            chineseTranslation: '获取失败',
            pos: selectedToken.pos,
            furigana: selectedToken.furigana,
            romaji: selectedToken.romaji,
            explanation: '无法获取词汇详情，请检查网络连接。'
          });
        });
    }
  }, [selectedToken?.word, selectedToken?.pos, userApiKey, userApiUrl, useStream, learningMode]);

  const handleTTS = useCallback(async () => {
    if (!selectedToken) return;
    
    try {
      // Use simple speech synthesis for now
      speakJapanese(selectedToken.word);
    } catch (error) {
      console.error('TTS error:', error);
    }
  }, [selectedToken]);

  const toggleDisclosure = (sectionId: string) => {
    setDisclosureSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, isOpen: !section.isOpen }
          : section
      )
    );
  };

  const getLearningTip = (learningMode: LearningMode, token: TokenData, wordDetail: WordDetail | null, context: string): string => {
    const posType = token.pos;
    const word = token.word;
    const translation = wordDetail?.chineseTranslation || 'unknown meaning';
    
    const tips = {
      beginner: `"${word}" is a ${posType} meaning "${translation}". ${token.furigana ? `Pronunciation: ${token.furigana}. ` : ''}Focus on memorizing the meaning and basic pronunciation.`,
      intermediate: `This ${posType} "${word}" (${translation}) plays a specific role in the sentence structure. ${context ? `In "${context}", notice how it connects with other words.` : 'Pay attention to its grammatical function and particle usage.'}`,
      advanced: `Analyze "${word}" (${posType}) in depth. ${wordDetail?.dictionaryForm && wordDetail.dictionaryForm !== word ? `Dictionary form: ${wordDetail.dictionaryForm}. ` : ''}Consider its usage patterns, cultural nuances, and how it varies in different contexts.`
    };
    return tips[learningMode];
  };

  const getJLPTLevel = (word: string, wordDetail: WordDetail | null): string => {
    // Use actual JLPT level from wordDetail if available
    if (wordDetail?.jlptLevel) {
      return wordDetail.jlptLevel;
    }
    // If no data available, return 'N/A'
    return 'N/A';
  };

  const getFrequencyLevel = (word: string, wordDetail: WordDetail | null): string => {
    // Use actual frequency from wordDetail if available
    if (wordDetail?.frequency) {
      return wordDetail.frequency;
    }
    // Basic heuristic based on particle and common words
    const particles = ['は', 'が', 'を', 'に', 'で', 'と', 'から', 'まで', 'の'];
    const veryCommonWords = ['です', 'である', 'する', 'なる', '言う', '行く', '来る', '見る', '聞く'];
    
    if (particles.includes(word)) return 'Very High';
    if (veryCommonWords.includes(word)) return 'Very High';
    if (word.length === 1) return 'High';
    return 'Medium';
  };

  if (!selectedToken) {
    return (
      <div className="word-detail-panel h-full flex items-center justify-center text-center p-6">
        <div style={{ color: 'var(--on-surface-variant)' }}>
          <div className="text-lg mb-2">No word selected</div>
          <div className="text-sm">Click on a token to see detailed information</div>
        </div>
      </div>
    );
  }

  return (
    <div className="word-detail-panel h-full flex flex-col">
      {/* Header */}
      <div className="detail-header flex justify-between items-center p-4 border-b" style={{ borderColor: 'var(--outline)' }}>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--on-surface)' }}>
          Word Details
        </h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-opacity-10 transition-colors duration-200"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          <FaTimes />
        </button>
      </div>

      {/* Content */}
      <div className="detail-content flex-1 p-4 overflow-y-auto">
        {/* Main word info */}
        <div className="word-info mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--grammar-verb)' }}>
                {selectedToken.word}
                {selectedToken.furigana && selectedToken.word !== selectedToken.furigana && (
                  <span className="text-lg ml-2" style={{ color: 'var(--on-surface-variant)' }}>
                    ({selectedToken.furigana})
                  </span>
                )}
              </h2>
              {selectedToken.romaji && (
                <div className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  {selectedToken.romaji}
                </div>
              )}
            </div>
            <button
              onClick={handleTTS}
              className="p-3 rounded-full transition-all duration-200 hover:shadow-md"
              style={{ backgroundColor: 'var(--grammar-verb)', color: 'white' }}
            >
              <FaVolumeUp />
            </button>
          </div>

          {/* Quick facts */}
          <div className="quick-facts grid grid-cols-2 gap-3 mb-4">
            <div className="fact-item p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--on-surface-variant)' }}>
                Part of Speech
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                {selectedToken.pos}
              </div>
            </div>
            <div className="fact-item p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--on-surface-variant)' }}>
                JLPT Level
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                {getJLPTLevel(selectedToken.word, wordDetail)}
              </div>
            </div>
            <div className="fact-item p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--on-surface-variant)' }}>
                Frequency
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                {getFrequencyLevel(selectedToken.word, wordDetail)}
              </div>
            </div>
            <div className="fact-item p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--on-surface-variant)' }}>
                Chinese
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                {wordDetail?.chineseTranslation || 'Loading...'}
              </div>
            </div>
          </div>
        </div>

        {/* Progressive disclosure sections */}
        <div className="disclosure-sections space-y-3">
          {disclosureSections.map((section) => (
            <div 
              key={section.id}
              className="disclosure-section border rounded-lg overflow-hidden"
              style={{ borderColor: 'var(--outline)' }}
            >
              <button
                onClick={() => toggleDisclosure(section.id)}
                className="disclosure-header w-full flex justify-between items-center p-3 text-left transition-colors duration-200 hover:bg-opacity-50"
                style={{ backgroundColor: 'var(--surface-container-low)' }}
              >
                <span className="font-medium" style={{ color: 'var(--on-surface)' }}>
                  {section.title}
                </span>
                {section.isOpen ? (
                  <FaChevronDown style={{ color: 'var(--on-surface-variant)' }} />
                ) : (
                  <FaChevronRight style={{ color: 'var(--on-surface-variant)' }} />
                )}
              </button>
              
              {section.isOpen && (
                <div className="disclosure-content p-4 border-t" style={{ borderColor: 'var(--outline)' }}>
                  {isLoading && section.id === 'basic' ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: 'var(--grammar-verb)' }}></div>
                      <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                        Loading details...
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm" style={{ color: 'var(--on-surface)' }}>
                      {section.id === 'basic' && (
                        <div>
                          {wordDetail?.explanation ? (
                            <p className="mb-3">
                              {wordDetail.explanation}
                            </p>
                          ) : isLoading ? (
                            <p className="mb-3 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                              Loading detailed explanation...
                            </p>
                          ) : (
                            <p className="mb-3">
                              {selectedToken.word} 是 {selectedToken.pos}{wordDetail?.chineseTranslation ? ` 意思是 "${wordDetail.chineseTranslation}" in Chinese` : ''}.
                            </p>
                          )}
                          {wordDetail?.dictionaryForm && wordDetail.dictionaryForm !== selectedToken.word && (
                            <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                              Dictionary form: {wordDetail.dictionaryForm}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {section.id === 'usage' && (
                        <div>
                          {wordDetail?.usageExamples && wordDetail.usageExamples.length > 0 ? (
                            <div>
                              <p className="mb-2 font-medium">Usage examples:</p>
                              <ul className="space-y-2 text-sm">
                                {wordDetail.usageExamples.map((example, index) => (
                                  <li key={index}>• {example}</li>
                                ))}
                              </ul>
                            </div>
                          ) : isLoading ? (
                            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                              Loading usage examples...
                            </p>
                          ) : (
                            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                              Usage examples will appear here when available.
                            </p>
                          )}
                        </div>
                      )}
                      
                      {section.id === 'grammar' && (
                        <div>
                          {wordDetail?.grammarNotes ? (
                            <div className="text-sm">
                              {wordDetail.grammarNotes}
                            </div>
                          ) : (
                            <div>
                              <p className="mb-2">
                                <strong>Part of speech:</strong> {selectedToken.pos}
                              </p>
                              {currentSentence && (
                                <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                                  Used in context: "{currentSentence}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {section.id === 'cultural' && (
                        <div>
                          {wordDetail?.culturalNotes ? (
                            <div>
                              <p>{wordDetail.culturalNotes}</p>
                              {/* Debug info - remove in production */}
                              {process.env.NODE_ENV === 'development' && (
                                <p className="text-xs mt-2" style={{ color: 'var(--on-surface-variant)', opacity: 0.7 }}>
                                  [Debug: Cultural notes length: {wordDetail.culturalNotes.length}]
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                                Cultural context information will appear here when available.
                              </p>
                              {/* Debug info - remove in production */}
                              {process.env.NODE_ENV === 'development' && (
                                <p className="text-xs mt-2" style={{ color: 'var(--on-surface-variant)', opacity: 0.5 }}>
                                  [Debug: wordDetail exists: {wordDetail ? 'yes' : 'no'}, culturalNotes: {wordDetail?.culturalNotes ? 'exists' : 'null/undefined'}]
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {section.id === 'etymology' && (
                        <div>
                          {wordDetail?.etymology ? (
                            <p>{wordDetail.etymology}</p>
                          ) : (
                            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                              Etymology information will appear here when available.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Learning tip */}
        <div className="learning-tip mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
          <div className="flex items-start gap-2">
            <span style={{ color: 'var(--grammar-verb)' }}>💡</span>
            <div>
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--on-surface)' }}>
                Learning Tip ({learningMode})
              </div>
              <div className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                {getLearningTip(learningMode, selectedToken, wordDetail, currentSentence)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}