'use client';

import { useState } from 'react';
import { TokenData } from '../services/api';
import { TokenTranslation } from '../types/translation';
import { getWordDetails, WordDetail } from '../services/api';
import { FaInfoCircle, FaVolumeUp, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface TokenTranslationTableProps {
  tokens: TokenData[];
  tokenTranslations: TokenTranslation[];
  originalSentence: string;
  onTokenSelect?: (index: number, token: TokenData) => void;
  selectedTokenIndex?: number | null;
  userApiKey?: string;
  userApiUrl?: string;
  className?: string;
}

export default function TokenTranslationTable({
  tokens,
  tokenTranslations,
  originalSentence,
  onTokenSelect,
  selectedTokenIndex,
  userApiKey,
  userApiUrl,
  className = ''
}: TokenTranslationTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [loadingDetails, setLoadingDetails] = useState<Set<number>>(new Set());
  const [tokenDetails, setTokenDetails] = useState<Map<number, WordDetail>>(new Map());
  
  const toggleRowExpansion = async (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
      
      // Load detailed information if not already loaded
      if (!tokenDetails.has(index) && !loadingDetails.has(index)) {
        setLoadingDetails(prev => new Set(prev).add(index));
        
        try {
          const token = tokens[index];
          const details = await getWordDetails(
            token.word,
            token.pos,
            originalSentence,
            token.furigana,
            token.romaji,
            userApiKey,
            userApiUrl
          );
          
          setTokenDetails(prev => new Map(prev).set(index, details));
        } catch (error) {
          console.error('Failed to load token details:', error);
        } finally {
          setLoadingDetails(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
          });
        }
      }
    }
    
    setExpandedRows(newExpandedRows);
  };
  
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return 'var(--grammar-verb)';
    if (confidence >= 75) return 'var(--grammar-adjective)';
    if (confidence >= 60) return 'var(--grammar-auxiliary)';
    return 'var(--grammar-adverb)';
  };
  
  const getPosColor = (pos: string): string => {
    const posColorMap: { [key: string]: string } = {
      '名詞': 'var(--grammar-noun)',
      '动詞': 'var(--grammar-verb)',
      '形容詞': 'var(--grammar-adjective)',
      '副詞': 'var(--grammar-adverb)',
      '助詞': 'var(--grammar-particle)',
      '助动詞': 'var(--grammar-auxiliary)'
    };
    return posColorMap[pos] || 'var(--grammar-other)';
  };
  
  // Filter out layout tokens
  const contentTokens = tokens.filter((token) => {
    return token.pos !== '改行' && token.pos !== '空格';
  });
  
  // Filter content translations (removed unused variable)
  
  return (
    <div className={`token-translation-table ${className}`}>
      {/* Table Header */}
      <div className="table-header mb-4">
        <h4 className="text-lg font-medium mb-2" style={{ color: 'var(--on-surface)' }}>
          逐词翻译分析
        </h4>
        <div className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
          点击任意词汇查看详细解释和例句
        </div>
      </div>
      
      {/* Responsive Table */}
      <div className="table-container overflow-x-auto">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-container)' }}>
                <th className="text-left p-3 border-b text-sm font-medium" 
                    style={{ borderColor: 'var(--outline)', color: 'var(--on-surface)' }}>
                  日语原文
                </th>
                <th className="text-left p-3 border-b text-sm font-medium" 
                    style={{ borderColor: 'var(--outline)', color: 'var(--on-surface)' }}>
                  词性
                </th>
                <th className="text-left p-3 border-b text-sm font-medium" 
                    style={{ borderColor: 'var(--outline)', color: 'var(--on-surface)' }}>
                  中文翻译
                </th>
                <th className="text-left p-3 border-b text-sm font-medium" 
                    style={{ borderColor: 'var(--outline)', color: 'var(--on-surface)' }}>
                  精度
                </th>
                <th className="text-center p-3 border-b text-sm font-medium" 
                    style={{ borderColor: 'var(--outline)', color: 'var(--on-surface)' }}>
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {contentTokens.map((token, originalIndex) => {
                // Find the corresponding translation
                const translationIndex = tokens.findIndex(t => t === token);
                const translation = tokenTranslations[translationIndex];
                const isSelected = selectedTokenIndex === originalIndex;
                const isExpanded = expandedRows.has(originalIndex);
                const isLoading = loadingDetails.has(originalIndex);
                const details = tokenDetails.get(originalIndex);
                
                return (
                  <>
                    <tr 
                      key={originalIndex}
                      className={`
                        cursor-pointer transition-colors duration-200 border-b
                        ${isSelected ? 'bg-opacity-10' : 'hover:bg-opacity-5'}
                      `}
                      style={{
                        backgroundColor: isSelected ? `${getPosColor(token.pos)}20` : 'transparent',
                        borderColor: 'var(--outline)'
                      }}
                      onClick={() => onTokenSelect?.(originalIndex, token)}
                    >
                      {/* Japanese Text */}
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-base" style={{ color: 'var(--on-surface)' }}>
                            {token.word}
                          </span>
                          {token.furigana && (
                            <span className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>
                              {token.furigana}
                            </span>
                          )}
                          {token.romaji && (
                            <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                              {token.romaji}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Part of Speech */}
                      <td className="p-3">
                        <span 
                          className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: getPosColor(token.pos) }}
                        >
                          {token.pos}
                        </span>
                      </td>
                      
                      {/* Chinese Translation */}
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-sm" style={{ color: 'var(--on-surface)' }}>
                            {translation?.chineseTranslation || '未翻译'}
                          </span>
                          {translation?.alternatives && translation.alternatives.length > 0 && (
                            <div className="mt-1">
                              <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                                其他: {translation.alternatives.slice(0, 2).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Confidence */}
                      <td className="p-3">
                        {translation && (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-12 h-2 rounded-full overflow-hidden"
                              style={{ backgroundColor: 'var(--surface-container)' }}
                            >
                              <div 
                                className="h-full transition-all duration-300"
                                style={{
                                  width: `${translation.confidence}%`,
                                  backgroundColor: getConfidenceColor(translation.confidence)
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium" 
                                  style={{ color: getConfidenceColor(translation.confidence) }}>
                              {translation.confidence}%
                            </span>
                          </div>
                        )}
                      </td>
                      
                      {/* Actions */}
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(originalIndex);
                            }}
                            className="p-1 rounded transition-colors duration-200"
                            style={{ color: 'var(--on-surface-variant)' }}
                            title="查看详情"
                          >
                            {isExpanded ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add TTS functionality here
                            }}
                            className="p-1 rounded transition-colors duration-200"
                            style={{ color: 'var(--grammar-verb)' }}
                            title="发音"
                          >
                            <FaVolumeUp className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="p-0">
                          <div className="p-4 border-b" 
                               style={{ 
                                 backgroundColor: 'var(--surface-container-low)',
                                 borderColor: 'var(--outline)'
                               }}>
                            {isLoading ? (
                              <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent" 
                                     style={{ borderColor: 'var(--grammar-verb)' }}></div>
                                <span className="ml-2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                                  加载详情中...
                                </span>
                              </div>
                            ) : details ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h5 className="text-sm font-medium mb-2" style={{ color: 'var(--on-surface)' }}>
                                      详细解释
                                    </h5>
                                    <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                                      {details?.explanation || '加载中...'}
                                    </p>
                                  </div>
                                  {details.dictionaryForm && (
                                    <div>
                                      <h5 className="text-sm font-medium mb-2" style={{ color: 'var(--on-surface)' }}>
                                        原型
                                      </h5>
                                      <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                                        {details?.dictionaryForm || '无'}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                {translation?.usage && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-2" style={{ color: 'var(--on-surface)' }}>
                                      使用方法
                                    </h5>
                                    <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                                      {translation.usage}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                                  无法加载详情
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Card Layout */}
        <div className="md:hidden space-y-3">
          {contentTokens.map((token, originalIndex) => {
            const translationIndex = tokens.findIndex(t => t === token);
            const translation = tokenTranslations[translationIndex];
            const isSelected = selectedTokenIndex === originalIndex;
            const isExpanded = expandedRows.has(originalIndex);
            
            return (
              <div 
                key={originalIndex}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${isSelected ? 'border-opacity-50' : 'border-opacity-20'}
                `}
                style={{
                  backgroundColor: 'var(--surface-container)',
                  borderColor: getPosColor(token.pos)
                }}
                onClick={() => onTokenSelect?.(originalIndex, token)}
              >
                {/* Token Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-lg" style={{ color: 'var(--on-surface)' }}>
                      {token.word}
                    </div>
                    {token.furigana && (
                      <div className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                        {token.furigana}
                      </div>
                    )}
                    {token.romaji && (
                      <div className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                        {token.romaji}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: getPosColor(token.pos) }}
                    >
                      {token.pos}
                    </span>
                    
                    {translation && (
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-8 h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: 'var(--surface-container-low)' }}
                        >
                          <div 
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${translation.confidence}%`,
                              backgroundColor: getConfidenceColor(translation.confidence)
                            }}
                          />
                        </div>
                        <span className="text-xs" 
                              style={{ color: getConfidenceColor(translation.confidence) }}>
                          {translation.confidence}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Translation */}
                <div className="mb-3">
                  <div className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                    {translation?.chineseTranslation || '未翻译'}
                  </div>
                  {translation?.alternatives && translation.alternatives.length > 0 && (
                    <div className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>
                      其他: {translation.alternatives.slice(0, 2).join(', ')}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRowExpansion(originalIndex);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                    style={{ 
                      backgroundColor: 'var(--surface-container-low)',
                      color: 'var(--on-surface-variant)' 
                    }}
                  >
                    <FaInfoCircle className="w-3 h-3" />
                    {isExpanded ? '隐藏详情' : '查看详情'}
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add TTS functionality here
                    }}
                    className="p-1 rounded"
                    style={{ color: 'var(--grammar-verb)' }}
                    title="发音"
                  >
                    <FaVolumeUp className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t" 
                       style={{ borderColor: 'var(--outline)' }}>
                    {/* Similar to desktop expanded content */}
                    <div className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                      详细解释和例句将在这里显示...
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Empty State */}
      {contentTokens.length === 0 && (
        <div className="text-center py-8">
          <div className="text-lg mb-2" style={{ color: 'var(--on-surface-variant)' }}>
            暂无词汇数据
          </div>
          <div className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
            请先进行日语文本分析
          </div>
        </div>
      )}
    </div>
  );
}