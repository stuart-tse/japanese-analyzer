'use client';

import { useState, useRef } from 'react';
import { TranslationMode, DetailedTranslation } from '../types/translation';
import ConfidenceIndicator from './ConfidenceIndicator';
import TranslationActions from './TranslationActions';
import { FaExpand, FaCompress, FaLanguage, FaArrowRight } from 'react-icons/fa';

interface TranslationCardProps {
  original: string;
  translation: DetailedTranslation | null;
  mode: TranslationMode;
  isLoading: boolean;
  error?: string;
  onRetranslate?: () => void;
  userApiKey?: string;
  className?: string;
}

export default function TranslationCard({
  original,
  translation,
  mode,
  isLoading,
  error,
  onRetranslate,
  userApiKey,
  className = ''
}: TranslationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const formatMode = (mode: TranslationMode): string => {
    switch (mode) {
      case 'quick': return '快速翻译';
      case 'detailed': return '详细翻译';
      case 'word-by-word': return '逐词翻译';
      default: return mode;
    }
  };
  
  const getCardBackgroundColor = () => {
    if (error) return 'var(--error-container)';
    if (isLoading) return 'var(--surface-container-low)';
    return 'var(--grammar-background)';
  };
  
  const getBorderColor = () => {
    if (error) return 'var(--error)';
    if (translation?.confidence.overall && translation.confidence.overall >= 85) {
      return 'var(--grammar-verb)';
    }
    return 'var(--outline)';
  };
  
  return (
    <div 
      ref={cardRef}
      className={`translation-card premium-card transition-all duration-300 ${isExpanded ? 'expanded' : ''} ${className}`}
      style={{
        backgroundColor: getCardBackgroundColor(),
        borderColor: getBorderColor(),
        borderWidth: '2px',
        borderStyle: 'solid'
      }}
    >
      {/* Card Header */}
      <div className="card-header flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="mode-indicator flex items-center gap-2">
            <FaLanguage 
              className="w-5 h-5" 
              style={{ color: 'var(--grammar-verb)' }} 
            />
            <span 
              className="text-sm font-medium px-2 py-1 rounded"
              style={{
                backgroundColor: 'var(--grammar-verb)',
                color: 'white'
              }}
            >
              {formatMode(mode)}
            </span>
          </div>
          
          {/* Translation status */}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" 
                   style={{ borderColor: 'var(--grammar-verb)' }}></div>
              <span>正在翻译...</span>
            </div>
          )}
          
          {error && (
            <div className="text-sm px-2 py-1 rounded" 
                 style={{ 
                   backgroundColor: 'var(--error)', 
                   color: 'var(--on-error)' 
                 }}>
              翻译失败
            </div>
          )}
        </div>
        
        <div className="card-actions flex items-center gap-2">
          {translation && (
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="p-2 rounded-full transition-colors duration-200 hover:bg-opacity-10"
              style={{ 
                backgroundColor: showMetrics ? 'var(--grammar-verb)15' : 'transparent',
                color: 'var(--grammar-verb)'
              }}
              title="显示/隐藏翻译指标"
            >
              <FaLanguage className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={toggleExpand}
            className="p-2 rounded-full transition-colors duration-200 hover:bg-opacity-10"
            style={{ 
              backgroundColor: 'transparent',
              color: 'var(--on-surface-variant)'
            }}
            title={isExpanded ? '收缩' : '展开'}
          >
            {isExpanded ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="error-message mb-4 p-3 rounded-lg" 
             style={{
               backgroundColor: 'var(--error-container)',
               borderLeft: '4px solid var(--error)'
             }}>
          <div className="text-sm" style={{ color: 'var(--on-error-container)' }}>
            {error}
          </div>
          {onRetranslate && (
            <button
              onClick={onRetranslate}
              className="mt-2 px-3 py-1 text-xs rounded"
              style={{
                backgroundColor: 'var(--error)',
                color: 'var(--on-error)'
              }}
            >
              重试翻译
            </button>
          )}
        </div>
      )}
      
      {/* Main Content - Dual Panel */}
      <div className="card-content">
        {/* Original and Translation Display */}
        <div className="translation-panels grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 items-start">
          {/* Original Text Panel */}
          <div className="original-panel flex flex-col h-full">
            <div className="panel-header flex items-center gap-2 mb-2">
              <h4 className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                原文
              </h4>
              <div className="language-tag px-2 py-0.5 text-xs rounded" 
                   style={{
                     backgroundColor: 'var(--grammar-noun)',
                     color: 'white'
                   }}>
                日本语
              </div>
            </div>
            <div 
              className="panel-content p-3 rounded-lg flex-1 overflow-auto"
              style={{
                backgroundColor: 'var(--surface-container)',
                border: '1px solid var(--outline)',
                fontSize: isExpanded ? '1.1rem' : '1rem',
                lineHeight: '1.6',
                minHeight: 'fit-content',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {original || (
                <span style={{ color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>
                  请输入日语文本...
                </span>
              )}
            </div>
          </div>
          
          {/* Translation Panel */}
          <div className="translation-panel flex flex-col h-full">
            <div className="panel-header flex items-center gap-2 mb-2">
              <h4 className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                译文
              </h4>
              <div className="language-tag px-2 py-0.5 text-xs rounded" 
                   style={{
                     backgroundColor: 'var(--grammar-adjective)',
                     color: 'white'
                   }}>
                中文
              </div>
              <FaArrowRight className="w-3 h-3" style={{ color: 'var(--on-surface-variant)' }} />
            </div>
            <div 
              className="panel-content p-3 rounded-lg flex-1 overflow-auto"
              style={{
                backgroundColor: 'var(--surface-container)',
                border: '1px solid var(--outline)',
                fontSize: isExpanded ? '1.1rem' : '1rem',
                lineHeight: '1.6',
                minHeight: 'fit-content',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full min-h-[100px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent mx-auto mb-2" 
                         style={{ borderColor: 'var(--grammar-verb)' }}></div>
                    <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                      AI 正在分析中...
                    </span>
                  </div>
                </div>
              ) : translation ? (
                <div className="translation-text">
                  {translation.translated}
                </div>
              ) : (
                <span style={{ color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>
                  翻译结果将显示在这里...
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Confidence and Quality Metrics */}
        {translation && showMetrics && (
          <div className="metrics-section mb-4">
            <ConfidenceIndicator
              confidence={translation.confidence}
              showDetails={isExpanded}
              className="mb-3"
            />
          </div>
        )}
        
        {/* Translation Actions */}
        {translation && (
          <TranslationActions
            originalText={original}
            translatedText={translation.translated}
            confidence={translation.confidence}
            userApiKey={userApiKey}
            isExpanded={isExpanded}
            className="mb-3"
          />
        )}
        
        {/* Additional Details for Expanded Mode */}
        {isExpanded && translation && (
          <div className="expanded-details space-y-4">
            {/* Translation Notes */}
            {translation.translation_notes && (
              <div className="translation-notes p-3 rounded-lg" 
                   style={{ backgroundColor: 'var(--surface-container-low)' }}>
                <h5 className="text-sm font-medium mb-2" style={{ color: 'var(--on-surface)' }}>
                  翻译说明
                </h5>
                <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  {translation.translation_notes}
                </p>
              </div>
            )}
            
            {/* Grammar Notes */}
            {translation.grammar_notes && translation.grammar_notes.length > 0 && (
              <div className="grammar-notes p-3 rounded-lg" 
                   style={{ backgroundColor: 'var(--surface-container-low)' }}>
                <h5 className="text-sm font-medium mb-2" style={{ color: 'var(--on-surface)' }}>
                  语法说明
                </h5>
                <ul className="space-y-1">
                  {translation.grammar_notes.map((note, index) => (
                    <li key={index} className="text-sm flex items-start gap-2" 
                        style={{ color: 'var(--on-surface-variant)' }}>
                      <span className="text-xs">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Cultural Notes */}
            {translation.cultural_notes && translation.cultural_notes.length > 0 && (
              <div className="cultural-notes p-3 rounded-lg" 
                   style={{ backgroundColor: 'var(--surface-container-low)' }}>
                <h5 className="text-sm font-medium mb-2" style={{ color: 'var(--on-surface)' }}>
                  文化背景
                </h5>
                <ul className="space-y-1">
                  {translation.cultural_notes.map((note, index) => (
                    <li key={index} className="text-sm flex items-start gap-2" 
                        style={{ color: 'var(--on-surface-variant)' }}>
                      <span className="text-xs">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}