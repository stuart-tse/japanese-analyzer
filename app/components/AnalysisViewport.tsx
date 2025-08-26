'use client';

import { useState, useEffect } from 'react';
import { TokenData, GrammarAnalysis, analyzeGrammar, streamGrammarAnalysis } from '../services/api';
import { getGrammarColorClass, getSelectedTokenTextColor, getColorVariant, containsKanji, filterTokensForDisplay } from '../utils/helpers';
import TranslationSection from './TranslationSection';

export type AnalysisMode = 'tokens' | 'grammar' | 'translation' | 'pronunciation';

interface AnalysisViewportProps {
  tokens: TokenData[];
  originalSentence: string;
  selectedTokenIndex: number | null;
  onTokenSelect: (index: number, token: TokenData) => void;
  showFurigana: boolean;
  onShowFuriganaChange: (show: boolean) => void;
  analysisMode: AnalysisMode;
  onAnalysisModeChange: (mode: AnalysisMode) => void;
  learningMode: 'beginner' | 'intermediate' | 'advanced';
  userApiKey?: string;
  userApiUrl?: string;
  useStream?: boolean;
  translationTrigger?: number;
}

export default function AnalysisViewport({
  tokens,
  originalSentence,
  selectedTokenIndex,
  onTokenSelect,
  showFurigana,
  onShowFuriganaChange,
  analysisMode,
  onAnalysisModeChange,
  learningMode,
  userApiKey,
  userApiUrl,
  useStream = true,
  translationTrigger
}: AnalysisViewportProps) {
  
  // AI-powered grammar analysis state
  const [grammarAnalysis, setGrammarAnalysis] = useState<GrammarAnalysis | null>(null);
  const [isLoadingGrammar, setIsLoadingGrammar] = useState(false);
  const [grammarError, setGrammarError] = useState<string>('');
  
  
  const analysisModes = [
    { 
      id: 'tokens' as AnalysisMode, 
      label: 'Tokens', 
      description: 'Word breakdown',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
    },
    { 
      id: 'grammar' as AnalysisMode, 
      label: 'Grammar', 
      description: 'Sentence structure',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    { 
      id: 'translation' as AnalysisMode, 
      label: 'Translation', 
      description: 'Chinese meaning',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      )
    },
    { 
      id: 'pronunciation' as AnalysisMode, 
      label: 'Pronunciation', 
      description: 'Phonetic guide',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )
    }
  ];

  // Manual grammar analysis trigger function
  const handleLoadGrammarAnalysis = () => {
    if (tokens.length === 0 || !originalSentence) return;
    
    setIsLoadingGrammar(true);
    setGrammarError('');
    
    if (useStream) {
      // Stream content handled directly in callback
      streamGrammarAnalysis(
        originalSentence,
        tokens.filter(token => token.pos !== '改行' && token.pos !== '空格'), // Filter layout tokens
        (chunk, isDone) => {
          // Process chunk directly without storing
          if (isDone) {
            try {
              // Extract JSON from potential markdown with more flexible matching
              let jsonContent = chunk;
              
              // Try to extract from markdown code block first
              const jsonMatch = chunk.match(/```json\n([\s\S]*?)\n```/);
              if (jsonMatch && jsonMatch[1]) {
                jsonContent = jsonMatch[1].trim();
              } else {
                // Try to find JSON object boundaries
                const startIndex = chunk.indexOf('{');
                const lastIndex = chunk.lastIndexOf('}');
                if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
                  jsonContent = chunk.substring(startIndex, lastIndex + 1);
                }
              }
              
              // Log the content we're trying to parse for debugging
              console.log('Attempting to parse grammar analysis JSON');
              
              const analysis = JSON.parse(jsonContent) as GrammarAnalysis;
              setGrammarAnalysis(analysis);
              setIsLoadingGrammar(false);
            } catch (error) {
              console.error('Failed to parse grammar analysis:', error);
              console.error('Raw response chunk available in streamContent');
              setGrammarError('语法分析结果解析失败');
              setIsLoadingGrammar(false);
            }
          }
        },
        (error) => {
          console.error('Grammar analysis error:', error);
          setGrammarError(error.message || '语法分析失败');
          setIsLoadingGrammar(false);
        },
        userApiKey,
        userApiUrl
      );
    } else {
      analyzeGrammar(
        originalSentence,
        tokens.filter(token => token.pos !== '改行' && token.pos !== '空格'), // Filter layout tokens
        userApiKey,
        userApiUrl
      )
        .then(analysis => {
          setGrammarAnalysis(analysis);
          setIsLoadingGrammar(false);
        })
        .catch(error => {
          console.error('Grammar analysis error:', error);
          setGrammarError(error.message || '语法分析失败');
          setIsLoadingGrammar(false);
        });
    }
  };
  
  // Reset grammar analysis when tokens change
  useEffect(() => {
    setGrammarAnalysis(null);
  }, [originalSentence]);
  

  const renderToken = (token: TokenData, index: number) => {
    // Handle layout tokens (line breaks and spaces) differently
    if (token.pos === '改行' && token.word === '\n') {
      return <div key={index} className="layout-token-linebreak"></div>;
    }
    
    if (token.pos === '空格' && token.word === ' ') {
      return <div key={index} className="layout-token-space"></div>;
    }
    
    const isSelected = selectedTokenIndex === index;
    const colorClass = getGrammarColorClass(token.pos);
    // Base color available via getGrammarColor if needed
    
    // Use enhanced color variants for better visual distinction
    const backgroundColor = isSelected 
      ? getColorVariant(token.pos, 'dark')
      : getColorVariant(token.pos, 'light');
    
    const borderColor = isSelected 
      ? getColorVariant(token.pos, 'dark')
      : getColorVariant(token.pos, 'medium');
    
    // Use optimal text color based on background
    const textColor = isSelected 
      ? getSelectedTokenTextColor(backgroundColor)
      : '#000000';
    
    // Secondary text color (furigana, romaji)
    const secondaryTextColor = isSelected 
      ? (getSelectedTokenTextColor(backgroundColor) === '#FFFFFF' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)')
      : '#666666';
    
    return (
      <div
        key={index}
        onClick={() => onTokenSelect(index, token)}
        className={`
          token inline-block m-1 p-3 rounded-lg cursor-pointer transition-all duration-200 border-2
          ${isSelected ? 'transform -translate-y-1 shadow-lg' : 'hover:transform hover:-translate-y-0.5 hover:shadow-md'}
          ${colorClass}
        `}
        style={{
          backgroundColor,
          borderColor,
          color: textColor,
          minHeight: '80px',
          minWidth: '60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: isSelected ? 'bold' : 'normal',
          boxShadow: isSelected ? '0 8px 16px rgba(0,0,0,0.2)' : undefined
        }}
      >
        {/* Furigana - Always reserve space */}
        <div className="furigana text-xs text-center leading-tight mb-1" style={{ height: '16px' }}>
          {showFurigana && token.furigana && containsKanji(token.word) ? (
            <span style={{ 
              color: secondaryTextColor,
              fontWeight: isSelected ? 'semibold' : 'normal'
            }}>
              {token.furigana}
            </span>
          ) : null}
        </div>
        
        {/* Main word */}
        <div 
          className="word text-base font-bold leading-tight text-center" 
          style={{ 
            minHeight: '20px',
            color: textColor,
            fontWeight: isSelected ? 'bold' : 'semibold',
            textShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.3)' : undefined
          }}
        >
          {token.word}
        </div>
        
        {/* Romaji - Always reserve space */}
        <div className="romaji text-xs text-center leading-tight mt-1" style={{ height: '16px' }}>
          {(learningMode === 'beginner' || analysisMode === 'pronunciation') && token.romaji ? (
            <span style={{ 
              color: secondaryTextColor,
              fontWeight: isSelected ? 'semibold' : 'normal'
            }}>
              {token.romaji}
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="analysis-viewport h-full flex flex-col">
      {/* Analysis Controls */}
      <div className="analysis-controls mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium transition-colors duration-200" style={{ color: 'var(--on-surface)' }}>
            Analysis View
          </h3>
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
            <input
              type="checkbox"
              checked={showFurigana}
              onChange={(e) => onShowFuriganaChange(e.target.checked)}
              className="rounded transition-colors duration-200"
              style={{ accentColor: 'var(--grammar-verb)' }}
            />
            Show Furigana
          </label>
        </div>
        
        {/* POS Color Legend */}
        <div className="pos-legend mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
          <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--on-surface)' }}>
            Part of Speech Colors
          </h4>
          <div className="flex flex-wrap justify-between gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#2D5A27' }}></div>
              <span style={{ color: 'var(--on-surface-variant)' }}>名詞 (Noun)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#C41E3A' }}></div>
              <span style={{ color: 'var(--on-surface-variant)' }}>動詞 (Verb)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#8B4513' }}></div>
              <span style={{ color: 'var(--on-surface-variant)' }}>形容詞 (Adj)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#DAA520' }}></div>
              <span style={{ color: 'var(--on-surface-variant)' }}>助詞 (Particle)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#4682B4' }}></div>
              <span style={{ color: 'var(--on-surface-variant)' }}>副詞 (Adverb)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#778899' }}></div>
              <span style={{ color: 'var(--on-surface-variant)' }}>その他 (Other)</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
          {analysisModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onAnalysisModeChange(mode.id)}
              className={`
                group flex items-center justify-start p-4 text-sm font-medium rounded-lg transition-all duration-300 ease-out
                shadow-md relative
                ${analysisMode === mode.id 
                  ? 'text-white shadow-xl' 
                  : 'hover:shadow-xl hover:-translate-y-1'
                }
              `}
              style={{
                backgroundColor: analysisMode === mode.id 
                  ? 'var(--grammar-verb)' 
                  : 'var(--surface-container)',
                color: analysisMode === mode.id 
                  ? 'white' 
                  : 'var(--on-surface-variant)',
                minHeight: '80px',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: analysisMode === mode.id 
                  ? 'var(--grammar-verb)' 
                  : 'transparent',
                boxShadow: analysisMode === mode.id 
                  ? '0 10px 25px rgba(196, 30, 58, 0.3), 0 4px 10px rgba(0, 0, 0, 0.1)' 
                  : '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
                transform: analysisMode === mode.id ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              <div className={`mr-3 flex-shrink-0 transition-all duration-300 ease-out ${
                analysisMode === mode.id ? 'transform scale-110' : 'group-hover:scale-110 group-hover:rotate-6'
              }`}>
                {mode.icon}
              </div>
              <div className="text-left">
                <div className="font-semibold transition-all duration-300 ease-out">{mode.label}</div>
                <div className="text-xs opacity-80 mt-1 transition-all duration-300 ease-out group-hover:opacity-100">{mode.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Analysis Area */}
      <div className="analysis-area flex-1 p-4 rounded-lg border" style={{ backgroundColor: 'var(--surface-container)', borderColor: 'var(--outline)' }}>
        {tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="mb-8">
              <div className="text-6xl mb-4" style={{ color: 'var(--grammar-verb)' }}>
                日本語
              </div>
              <div className="text-2xl font-medium mb-2" style={{ color: 'var(--on-surface)' }}>
                Japanese Sentence Analyzer
              </div>
              <div className="text-lg mb-6" style={{ color: 'var(--on-surface-variant)' }}>
                AI-powered Japanese text analysis for Chinese learners
              </div>
            </div>
            
            <div className="max-w-md space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: 'var(--grammar-verb)' }}>
                  1
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm" style={{ color: 'var(--on-surface)' }}>
                    Enter Japanese Text
                  </div>
                  <div className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                    Type, paste, or upload an image with Japanese text
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: 'var(--grammar-verb)' }}>
                  2
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm" style={{ color: 'var(--on-surface)' }}>
                    Choose Learning Level
                  </div>
                  <div className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                    Select beginner, intermediate, or advanced mode
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: 'var(--grammar-verb)' }}>
                  3
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm" style={{ color: 'var(--on-surface)' }}>
                    Analyze & Learn
                  </div>
                  <div className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                    View tokenized text, grammar, and detailed explanations
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 rounded-lg border-2 border-dashed" style={{ borderColor: 'var(--outline)', backgroundColor: 'var(--surface-container-low)' }}>
              <div className="text-sm font-medium mb-2" style={{ color: 'var(--on-surface)' }}>
                💡 Try this example:
              </div>
              <div className="text-lg font-japanese mb-1" style={{ color: 'var(--grammar-verb)' }}>
                今日は良い天気ですね。
              </div>
              <div className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                &quot;Today is nice weather, isn&apos;t it?&quot;
              </div>
            </div>
          </div>
        ) : (
          <div className="sentence-container">
            {/* Tokens Mode - Interactive token display */}
            {analysisMode === 'tokens' && (
              <div className="tokens-display mb-6" style={{ lineHeight: '1.2' }}>
                <div className="tokens-container" style={{ lineHeight: '1.2' }}>
                  {filterTokensForDisplay(tokens).map((token, index) => renderToken(token, index))}
                </div>
              </div>
            )}

            {/* Grammar Mode - AI-powered sentence structure analysis */}
            {analysisMode === 'grammar' && (
              <div className="grammar-mode">
                {/* Show sentence with grammar highlighting */}
                <div className="sentence-display mb-6" style={{ lineHeight: '1.2' }}>
                  <div className="tokens-container" style={{ lineHeight: '1.2' }}>
                    {filterTokensForDisplay(tokens).map((token, index) => renderToken(token, index))}
                  </div>
                </div>
                
                {/* Grammar Analysis Control Section */}
                <div className="grammar-analysis-control mb-6">
                  {!grammarAnalysis && !isLoadingGrammar && !grammarError && (
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <div className="text-lg font-medium mb-2" style={{ color: 'var(--on-surface)' }}>
                          AI Grammar Analysis
                        </div>
                        <div className="text-sm mb-4" style={{ color: 'var(--on-surface-variant)' }}>
                          Get detailed sentence structure analysis powered by AI
                        </div>
                      </div>
                      <button
                        onClick={handleLoadGrammarAnalysis}
                        disabled={tokens.length === 0 || !originalSentence}
                        className="
                          px-6 py-3 rounded-lg font-medium text-white transition-all duration-200
                          hover:shadow-lg hover:transform hover:-translate-y-0.5
                          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                          flex items-center gap-3 mx-auto
                        "
                        style={{ 
                          backgroundColor: 'var(--grammar-verb)',
                          boxShadow: '0 2px 8px rgba(196, 30, 58, 0.3)'
                        }}
                      >
                        <svg 
                          className="w-5 h-5" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                          />
                        </svg>
                        Analyze Grammar Structure
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Loading state */}
                {isLoadingGrammar && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative mb-4">
                      <div 
                        className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" 
                        style={{ 
                          borderColor: 'var(--grammar-verb)',
                          borderTopColor: 'transparent'
                        }}
                      ></div>
                      <div 
                        className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-t-4 animate-pulse"
                        style={{ 
                          borderTopColor: 'rgba(196, 30, 58, 0.3)'
                        }}
                      ></div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium mb-2" style={{ color: 'var(--on-surface)' }}>
                        Analyzing Grammar Structure
                      </div>
                      <div className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                        AI is processing your Japanese text...
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Error state */}
                {grammarError && (
                  <div className="mb-4 p-4 border-l-4 rounded-lg" style={{ backgroundColor: '#fef2f2', borderColor: 'var(--grammar-verb)' }}>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 mt-0.5" style={{ color: 'var(--grammar-verb)' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                          Grammar Analysis Error
                        </div>
                        <div className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
                          {grammarError}
                        </div>
                        <button
                          onClick={handleLoadGrammarAnalysis}
                          className="mt-2 px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                          style={{ 
                            backgroundColor: 'var(--grammar-verb)',
                            color: 'white'
                          }}
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* AI Grammar Analysis Results */}
                {grammarAnalysis && (
                  <div className="ai-grammar-analysis space-y-6">
                    <h4 className="text-lg font-medium mb-4" style={{ color: 'var(--on-surface)' }}>
                      AI-Powered Grammar Analysis
                    </h4>
                    
                    {/* Text Overview */}
                    {grammarAnalysis.text_overview && (
                      <div className="text-overview p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
                        <h5 className="text-md font-medium mb-3" style={{ color: 'var(--grammar-verb)' }}>
                          Text Overview
                        </h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium" style={{ color: 'var(--on-surface)' }}>Total Sentences: </span>
                            <span style={{ color: 'var(--on-surface-variant)' }}>{grammarAnalysis.text_overview.total_sentences}</span>
                          </div>
                          <div>
                            <span className="font-medium" style={{ color: 'var(--on-surface)' }}>Complexity: </span>
                            <span style={{ color: 'var(--on-surface-variant)' }}>{grammarAnalysis.text_overview.overall_complexity}</span>
                          </div>
                          <div>
                            <span className="font-medium" style={{ color: 'var(--on-surface)' }}>Text Type: </span>
                            <span style={{ color: 'var(--on-surface-variant)' }}>{grammarAnalysis.text_overview.text_type}</span>
                          </div>
                          <div>
                            <span className="font-medium" style={{ color: 'var(--on-surface)' }}>Politeness: </span>
                            <span style={{ color: 'var(--on-surface-variant)' }}>{grammarAnalysis.text_overview.overall_politeness_level}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Individual Sentence Analysis */}
                    {grammarAnalysis.sentences && grammarAnalysis.sentences.length > 0 && (
                      <div className="sentences-analysis space-y-8">
                        <h5 className="text-md font-medium" style={{ color: 'var(--grammar-verb)' }}>
                          Sentence-by-Sentence Analysis
                        </h5>
                        {grammarAnalysis.sentences.map((sentenceAnalysis, sentenceIndex) => (
                          <div key={sentenceIndex} className="sentence-block p-4 rounded-lg border" style={{ backgroundColor: 'var(--surface-container)', borderColor: 'var(--outline)' }}>
                            <div className="sentence-header mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 rounded text-sm font-medium" style={{ backgroundColor: 'var(--grammar-verb)', color: 'white' }}>
                                  Sentence {sentenceIndex + 1}
                                </span>
                                <span className="text-lg font-medium" style={{ color: 'var(--on-surface)' }}>
                                  {sentenceAnalysis.sentence_text}
                                </span>
                              </div>
                              {sentenceAnalysis.sentence_type && (
                                <div className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                                  {sentenceAnalysis.sentence_type.type} • {sentenceAnalysis.sentence_type.politeness_level} • {sentenceAnalysis.sentence_type.formality}
                                </div>
                              )}
                            </div>
                            
                            {/* Main Clause Structure for this sentence */}
                            <div className="main-clause-section mb-4">
                              <h6 className="text-sm font-medium mb-2" style={{ color: 'var(--grammar-verb)' }}>
                                Sentence Structure
                              </h6>
                              <div className="space-y-2">
                                {sentenceAnalysis.sentence_structure.main_clause.subject && (
                                  <div className="grammar-component p-2 rounded" style={{ backgroundColor: 'var(--surface-container-low)' }}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="px-1 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#2D5A27', color: 'white' }}>
                                        Subject
                                      </span>
                                      <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                                        {sentenceAnalysis.sentence_structure.main_clause.subject.tokens.map(t => t.word).join('')}
                                      </span>
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                                      {sentenceAnalysis.sentence_structure.main_clause.subject.description}
                                    </p>
                                  </div>
                                )}
                                
                                {sentenceAnalysis.sentence_structure.main_clause.predicate && (
                                  <div className="grammar-component p-2 rounded" style={{ backgroundColor: 'var(--surface-container-low)' }}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="px-1 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#C41E3A', color: 'white' }}>
                                        Predicate
                                      </span>
                                      <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                                        {sentenceAnalysis.sentence_structure.main_clause.predicate.tokens.map(t => t.word).join('')}
                                      </span>
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                                      {sentenceAnalysis.sentence_structure.main_clause.predicate.description}
                                    </p>
                                  </div>
                                )}
                                
                                {sentenceAnalysis.sentence_structure.main_clause.object && (
                                  <div className="grammar-component p-2 rounded" style={{ backgroundColor: 'var(--surface-container-low)' }}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="px-1 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#8B4513', color: 'white' }}>
                                        Object
                                      </span>
                                      <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                                        {sentenceAnalysis.sentence_structure.main_clause.object.tokens.map(t => t.word).join('')}
                                      </span>
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                                      {sentenceAnalysis.sentence_structure.main_clause.object.description}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Particles Analysis for this sentence */}
                            {sentenceAnalysis.sentence_structure.particles_analysis.length > 0 && (
                              <div className="particles-section mb-4">
                                <h6 className="text-sm font-medium mb-2" style={{ color: 'var(--grammar-verb)' }}>
                                  Particles
                                </h6>
                                <div className="space-y-1">
                                  {sentenceAnalysis.sentence_structure.particles_analysis.map((particle, pIndex) => (
                                    <div key={pIndex} className="particle-item flex items-center gap-2 p-2 rounded" style={{ backgroundColor: 'var(--surface-container-low)' }}>
                                      <span className="px-1 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#DAA520', color: 'white' }}>
                                        {particle.particle}
                                      </span>
                                      <div className="flex-1">
                                        <div className="text-xs font-medium" style={{ color: 'var(--on-surface)' }}>
                                          {particle.function}
                                        </div>
                                        <div className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                                          {particle.detailed_explanation}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Grammar Patterns for this sentence */}
                            {sentenceAnalysis.grammatical_patterns.length > 0 && (
                              <div className="patterns-section">
                                <h6 className="text-sm font-medium mb-2" style={{ color: 'var(--grammar-verb)' }}>
                                  Grammar Patterns
                                </h6>
                                <div className="space-y-1">
                                  {sentenceAnalysis.grammatical_patterns.map((pattern, pIndex) => (
                                    <div key={pIndex} className="pattern-item p-2 rounded" style={{ backgroundColor: 'var(--surface-container-low)' }}>
                                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--on-surface)' }}>
                                        {pattern.pattern}
                                      </div>
                                      <div className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                                        {pattern.explanation}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Cross-Sentence Analysis */}
                    {grammarAnalysis.cross_sentence_analysis && grammarAnalysis.text_overview && grammarAnalysis.text_overview.total_sentences > 1 && (
                      <div className="cross-sentence-section">
                        <h5 className="text-md font-medium mb-3" style={{ color: 'var(--grammar-verb)' }}>
                          Cross-Sentence Analysis
                        </h5>
                        <div className="space-y-3">
                          {grammarAnalysis.cross_sentence_analysis.topic_flow && (
                            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
                              <h6 className="text-sm font-medium mb-1" style={{ color: 'var(--on-surface)' }}>Topic Flow</h6>
                              <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                                {grammarAnalysis.cross_sentence_analysis.topic_flow}
                              </p>
                            </div>
                          )}
                          {grammarAnalysis.cross_sentence_analysis.coherence_analysis && (
                            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
                              <h6 className="text-sm font-medium mb-1" style={{ color: 'var(--on-surface)' }}>Coherence Analysis</h6>
                              <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                                {grammarAnalysis.cross_sentence_analysis.coherence_analysis}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Learning Notes */}
                    {grammarAnalysis.learning_notes && (
                      <div className="learning-notes-section">
                        <h5 className="text-md font-medium mb-3" style={{ color: 'var(--grammar-verb)' }}>
                          Learning Notes
                        </h5>
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
                          <div className="mb-3">
                            <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                              Difficulty Level: 
                            </span>
                            <span className="px-2 py-1 rounded text-xs font-medium ml-2" style={{ backgroundColor: 'var(--grammar-verb)', color: 'white' }}>
                              {grammarAnalysis.learning_notes.difficulty_level}
                            </span>
                          </div>
                          {grammarAnalysis.learning_notes.key_grammar_points.length > 0 && (
                            <div className="mb-3">
                              <div className="text-sm font-medium mb-1" style={{ color: 'var(--on-surface)' }}>
                                Key Grammar Points:
                              </div>
                              <ul className="list-disc list-inside text-sm space-y-1" style={{ color: 'var(--on-surface-variant)' }}>
                                {grammarAnalysis.learning_notes.key_grammar_points.map((point, index) => (
                                  <li key={index}>{point}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {grammarAnalysis.learning_notes.learning_tips && (
                            <div className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                              <strong>Learning Tips:</strong> {grammarAnalysis.learning_notes.learning_tips}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Translation Mode - Complete Translation Section */}
            {analysisMode === 'translation' && (
              <div className="translation-mode">
                <TranslationSection
                  japaneseText={originalSentence}
                  tokens={tokens}
                  userApiKey={userApiKey}
                  userApiUrl={userApiUrl}
                  useStream={useStream}
                  trigger={translationTrigger}
                  className="translation-viewport-section"
                />
              </div>
            )}

            {/* Pronunciation Mode - Detailed pronunciation guide */}
            {analysisMode === 'pronunciation' && (
              <div className="pronunciation-mode">
                <div className="text-center py-6 mb-6" style={{ backgroundColor: 'var(--surface-container-low)', borderRadius: '8px' }}>
                  <div className="text-2xl mb-2" style={{ color: 'var(--grammar-verb)' }}>
                    日本語を勉強します
                  </div>
                  <div className="text-lg mb-1" style={{ color: 'var(--on-surface-variant)' }}>
                    にほんごを べんきょうします
                  </div>
                  <div className="text-base" style={{ color: 'var(--on-surface-variant)' }}>
                    nihongo o benkyou shimasu
                  </div>
                </div>
                
                <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--on-surface)' }}>
                  Detailed Pronunciation Guide
                </h4>
                <div className="space-y-3">
                  {filterTokensForDisplay(tokens).map((token, index) => (
                    <div 
                      key={index}
                      className="pronunciation-item p-4 rounded-md border"
                      style={{ backgroundColor: 'var(--surface-container-low)', borderColor: 'var(--outline)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-medium" style={{ color: 'var(--on-surface)' }}>
                          {token.word}
                        </span>
                        <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--grammar-verb)', color: 'white' }}>
                          {token.pos}
                        </span>
                      </div>
                      {token.furigana && (
                        <div className="text-sm mb-1" style={{ color: 'var(--on-surface-variant)' }}>
                          <strong>Hiragana:</strong> {token.furigana}
                        </div>
                      )}
                      {token.romaji && (
                        <div className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                          <strong>Romaji:</strong> {token.romaji}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}