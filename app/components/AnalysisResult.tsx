'use client';

import { useState, useEffect, useCallback } from 'react';
import { containsKanji, getPosClass, posChineseMap, speakJapanese, generateFuriganaParts, getJapaneseTtsAudioUrl } from '../utils/helpers';
import { getWordDetails, streamWordDetails, TokenData, WordDetail } from '../services/api';
import { FaVolumeUp } from 'react-icons/fa';

interface AnalysisResultProps {
  tokens: TokenData[];
  originalSentence: string;
  userApiKey?: string;
  userApiUrl?: string;
  showFurigana: boolean;
  onShowFuriganaChange: (show: boolean) => void;
  useStream?: boolean; // 添加流式支持参数
}

export default function AnalysisResult({ 
  tokens, 
  originalSentence,
  userApiKey,
  userApiUrl,
  showFurigana,
  onShowFuriganaChange,
  useStream = true // 默认启用流式
}: AnalysisResultProps) {
  const [wordDetail, setWordDetail] = useState<WordDetail | null>(null);
  const [activeWordToken, setActiveWordToken] = useState<HTMLElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 流式相关状态
  const [streamContent, setStreamContent] = useState('');
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState('');

  // 检测设备是���为移动端
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // 初始检测
    checkIsMobile();
    
    // 窗口大小变化时重新检测
    window.addEventListener('resize', checkIsMobile);
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const handleWordClick = async (e: React.MouseEvent<HTMLSpanElement>, token: TokenData) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    
    // 如果点击的是当前活动词，切换关闭
    if (activeWordToken === target) {
      setActiveWordToken(null);
      setWordDetail(null);
      if (isMobile) {
        setIsModalOpen(false);
      }
      return;
    }

    // 设置新活动词
    if (activeWordToken) {
      activeWordToken.classList.remove('active-word');
    }
    target.classList.add('active-word');
    setActiveWordToken(target);
    
    // 如果是移动端，先打开模态窗口，显示加载动画
    if (isMobile) {
      setIsLoading(true);
      setIsModalOpen(true);
      // 然后获取词汇详情
      await fetchWordDetails(token.word, token.pos, originalSentence, token.furigana, token.romaji);
    } else {
      // PC端保持原来的逻辑
      await fetchWordDetails(token.word, token.pos, originalSentence, token.furigana, token.romaji);
    }
  };

  // 实时解析流式内容的部分字段
  const parseStreamContentRealtime = (content: string) => {
    const result = {
      originalWord: '',
      chineseTranslation: '',
      pos: '',
      furigana: '',
      romaji: '',
      dictionaryForm: '',
      explanation: '',
      rawContent: content // 保存原始内容用于调试
    };

    try {
      // 提取各个字段的实时内容
      const extractField = (fieldName: string): string => {
        const regex = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*(?:\\\\.[^"]*)*)"`, 'i');
        const match = content.match(regex);
        return match ? match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '';
      };

      // 提取部分完成的字段值
      result.originalWord = extractField('originalWord');
      result.chineseTranslation = extractField('chineseTranslation');
      result.pos = extractField('pos');
      result.furigana = extractField('furigana');
      result.romaji = extractField('romaji');
      result.dictionaryForm = extractField('dictionaryForm');
      result.explanation = extractField('explanation');

      // 如果explanation字段正在生成中但还没有结束引号，尝试提取部分内容
      if (!result.explanation && content.includes('"explanation"')) {
        const explanationMatch = content.match(/"explanation"\s*:\s*"([^"]*)$/);
        if (explanationMatch) {
          result.explanation = explanationMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') + '...';
        }
      }

      return result;
    } catch (e) {
      console.warn('实时解析出错:', e);
      return result;
    }
  };

  const fetchWordDetails = async (word: string, pos: string, sentence: string, furigana?: string, romaji?: string) => {
    // 重置状态
    setWordDetail(null);
    setStreamContent('');
    setStreamError('');
    
    if (useStream) {
      // 使用流式查询
      setIsStreamLoading(true);
      setIsLoading(false);
      
      streamWordDetails(
        word,
        pos,
        sentence,
        (chunk, isDone) => {
          setStreamContent(chunk);
          
          // 实时解析并更新显示
          const realtimeData = parseStreamContentRealtime(chunk);
          if (realtimeData.originalWord || realtimeData.chineseTranslation || realtimeData.explanation) {
            // 创建一个临时的 WordDetail 对象用于实时显示
            const tempWordDetail: WordDetail = {
              originalWord: realtimeData.originalWord || word,
              chineseTranslation: realtimeData.chineseTranslation || '加载中...',
              pos: realtimeData.pos || pos,
              furigana: realtimeData.furigana || furigana || '',
              romaji: realtimeData.romaji || romaji || '',
              dictionaryForm: realtimeData.dictionaryForm || '',
              explanation: realtimeData.explanation || '正在生成解释...'
            };
            setWordDetail(tempWordDetail);
          }
          
          if (isDone) {
            setIsStreamLoading(false);
            // 最终尝试完整解析
            try {
              let processedContent = chunk;
              
              // 如果内容包含markdown代码块，尝试提取
              const jsonMatch = chunk.match(/```json\n([\s\S]*?)(\n```|$)/);
              if (jsonMatch && jsonMatch[1]) {
                processedContent = jsonMatch[1].trim();
              } else {
                // 直接查找JSON对象
                const objectStart = processedContent.indexOf('{');
                const objectEnd = processedContent.lastIndexOf('}');
                
                if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
                  processedContent = processedContent.substring(objectStart, objectEnd + 1);
                }
              }
              
              const finalDetails = JSON.parse(processedContent) as WordDetail;
              if (finalDetails && typeof finalDetails === 'object' && 'originalWord' in finalDetails) {
                setWordDetail(finalDetails);
              }
            } catch (e) {
              // 最终解析失败，保持实时解析的结果
              console.warn('最终JSON解析失败，保持实时解析结果:', e);
            }
          }
        },
        (error) => {
          console.error('Stream word detail error:', error);
          setStreamError(error.message || '流式查询词汇详情出错');
          setIsStreamLoading(false);
          // 设置错误状态的词汇详情
          setWordDetail({ 
            originalWord: word, 
            pos: pos, 
            furigana: (furigana && furigana !== word && containsKanji(word)) ? furigana : '', 
            romaji: romaji || '', 
            dictionaryForm: '', 
            chineseTranslation: '错误', 
            explanation: `流式查询释义时发生错误: ${error.message || '未知错误'}。`
          });
        },
        furigana,
        romaji,
        userApiKey,
        userApiUrl
      );
    } else {
      // 使用传统查询
      setIsLoading(true);
      setIsStreamLoading(false);
      
      try {
        // 使用服务端API获取词汇详情，传递用户API设置
        const details = await getWordDetails(word, pos, sentence, furigana, romaji, userApiKey, userApiUrl);
        setWordDetail(details);
      } catch (error) {
        console.error('Error fetching word details:', error);
        setWordDetail({ 
          originalWord: word, 
          pos: pos, 
          furigana: (furigana && furigana !== word && containsKanji(word)) ? furigana : '', 
          romaji: romaji || '', 
          dictionaryForm: '', 
          chineseTranslation: '错误', 
          explanation: `查询释义时发生错误: ${error instanceof Error ? error.message : '未知错误'}。`
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCloseWordDetail = useCallback(() => {
    if (activeWordToken) {
      activeWordToken.classList.remove('active-word');
      setActiveWordToken(null);
    }
    setWordDetail(null);
    setIsModalOpen(false);
  }, [activeWordToken]);

  // 点击外部关闭详情
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeWordToken && 
        wordDetail && 
        !(activeWordToken.contains(event.target as Node)) && 
        !(document.getElementById('wordDetailInlineContainer')?.contains(event.target as Node)) &&
        !(document.getElementById('wordDetailModal')?.contains(event.target as Node)) &&
        !(event.target as Element)?.closest('.word-unit-wrapper')
      ) {
        handleCloseWordDetail();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeWordToken, wordDetail, handleCloseWordDetail]);

  // 朗读单词的函数
  const handleWordSpeak = async (word: string) => {
    try {
      // 词汇详解中统一使用 Edge TTS，音质更好
      const url = await getJapaneseTtsAudioUrl(word, undefined, 'edge', { gender: 'female' });
      const audio = new Audio(url);
      audio.play();
    } catch (error) {
      console.error('Edge TTS 朗读失败，回退到系统朗读:', error);
      // 如果 Edge TTS 失败，回退到系统 TTS
      speakJapanese(word);
    }
  };

  // 格式化解释文本，支持换行和高亮
  const formatExplanation = (text: string): { __html: string } | undefined => {
    if (!text) return undefined;
    
    const formattedText = text
      .replace(/\n/g, '<br />')
      .replace(/【([^】]+)】/g, '<strong class="text-indigo-600">$1</strong>')
      .replace(/「([^」]+)」/g, '<strong class="text-indigo-600">$1</strong>');

    return { __html: formattedText };
  };

  // 词语详情内容组件
  const WordDetailContent = () => {
    // 如果有流式错误，显示错误信息
    if (streamError) {
      return (
        <>
          <h3 className="text-xl font-semibold text-red-600 mb-3">词汇详解 (出错)</h3>
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 mb-4">
            <p className="text-sm text-red-700 dark:text-red-300">
              {streamError}
            </p>
          </div>
          {streamContent && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md overflow-auto max-h-96 text-xs font-mono whitespace-pre-wrap text-gray-800 dark:text-gray-200">
              {streamContent}
            </div>
          )}
        </>
      );
    }
    
    // 显示词汇详情（包括实时更新的内容）
    const titleSuffix = isStreamLoading ? ' (实时加载中...)' : '';
    
    return (
      <>
        <h3 className="text-xl font-semibold text-[#007AFF] mb-3">
          词汇详解{titleSuffix}
          {isStreamLoading && (
            <div className="inline-block ml-2">
              <div className="loading-spinner w-4 h-4"></div>
            </div>
          )}
        </h3>
        
        <p className="mb-1">
          <strong>原文:</strong> 
          <span className="font-mono text-lg text-gray-800">{wordDetail?.originalWord}</span> 
          <button 
            className="read-aloud-button" 
            title="朗读此词汇"
            onClick={() => handleWordSpeak(wordDetail?.originalWord || '')}
          >
            <FaVolumeUp />
          </button>
        </p>
        
        {wordDetail?.furigana && (
          <p className="mb-1">
            <strong>读音 (Furigana):</strong> 
            <span className="text-sm text-purple-700">{wordDetail.furigana}</span>
          </p>
        )}
        
        {wordDetail?.romaji && (
          <p className="mb-1">
            <strong>罗马音 (Romaji):</strong> 
            <span className="text-sm text-cyan-700">{wordDetail.romaji}</span>
          </p>
        )}
        
        {wordDetail?.dictionaryForm && wordDetail.dictionaryForm !== wordDetail.originalWord && (
          <p className="mb-2">
            <strong>辞书形:</strong> 
            <span className="text-md text-blue-700 font-medium">{wordDetail.dictionaryForm}</span>
          </p>
        )}
        
        <p className="mb-2">
          <strong>词性:</strong> 
          <span className={`detail-pos-tag ${getPosClass(wordDetail?.pos || '')}`}>
            {wordDetail?.pos} ({posChineseMap[wordDetail?.pos.split('-')[0] || ''] || posChineseMap['default']})
          </span>
        </p>
        
        <p className="mb-2">
          <strong>中文译文:</strong> 
          <span className={`text-lg font-medium ${wordDetail?.chineseTranslation === '加载中...' ? 'text-gray-500 animate-pulse' : 'text-green-700'}`}>
            {wordDetail?.chineseTranslation}
          </span>
        </p>
        
        <div className="mb-1"><strong>解释:</strong></div>
        <div className={`p-3 rounded-md text-base leading-relaxed ${
          wordDetail?.explanation === '正在生成解释...' 
            ? 'text-gray-600 bg-gray-100 animate-pulse' 
            : 'text-gray-700 bg-gray-50'
        }`}>
          {wordDetail?.explanation?.endsWith('...') ? (
            // 正在生成中的内容，显示原始文本
            <div className="whitespace-pre-wrap">{wordDetail.explanation}</div>
          ) : (
            // 完整内容，应用格式化
            <div dangerouslySetInnerHTML={formatExplanation(wordDetail?.explanation || '')} />
          )}
        </div>
      </>
    );
  };

  if (!tokens || tokens.length === 0) {
    return null;
  }

  return (
    <div className="premium-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-700">解析结果</h2>
        <div className="flex items-center">
          <label htmlFor="furiganaToggle" className="text-sm font-medium text-gray-700 mr-2">显示假名:</label>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="furiganaToggle"
              className="sr-only peer"
              checked={showFurigana}
              onChange={(e) => onShowFuriganaChange(e.target.checked)}
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
      <div id="analyzedSentenceOutput" className="text-gray-800 mb-2 p-3 bg-gray-50 rounded-lg min-h-[70px]">
        {tokens.map((token, index) => {
          if (token.pos === '改行') {
            return <br key={index} />;
          }
          
          return (
            <span key={index} className="word-unit-wrapper tooltip">
              <span 
                className={`word-token ${getPosClass(token.pos)}`}
                onClick={(e) => handleWordClick(e, token)}
              >
                {showFurigana && token.furigana && token.furigana !== token.word && containsKanji(token.word) && token.pos !== '記号'
                  ? generateFuriganaParts(token.word, token.furigana).map((part, i) =>
                      part.ruby ? (
                        <ruby key={i}>
                          {part.base}
                          <rt>{part.ruby}</rt>
                        </ruby>
                      ) : (
                        <span key={i}>{part.base}</span>
                      )
                    )
                  : token.word}
              </span>
              
              {token.romaji && token.pos !== '記号' && (
                <span className="romaji-text">{token.romaji}</span>
              )}
              
              <span className="tooltiptext">
                {posChineseMap[token.pos.split('-')[0]] || posChineseMap['default']}
              </span>
            </span>
          );
        })}
      </div>
      
      {/* 非移动端的内嵌详情展示 */}
      {!isMobile && (isLoading || isStreamLoading || wordDetail || streamError) && (
        <div id="wordDetailInlineContainer" style={{ display: 'block' }}>
          <button 
            className="detail-close-button" 
            title="关闭详情"
            onClick={handleCloseWordDetail}
          >
            &times;
          </button>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-5">
              <div className="loading-spinner"></div>
              <span className="ml-2 text-gray-600">正在查询释义...</span>
            </div>
          ) : (
            <WordDetailContent />
          )}
        </div>
      )}
      
      {/* 移动端的模态窗口详情展示 */}
      {isMobile && isModalOpen && (
        <div id="wordDetailModal" className="word-detail-modal" onClick={(e) => {
          if (e.target === e.currentTarget) handleCloseWordDetail();
        }}>
          <div className="word-detail-modal-content">
            <button 
              className="modal-close-button" 
              title="关闭详情"
              onClick={handleCloseWordDetail}
            >
              &times;
            </button>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-5">
                <div className="loading-spinner"></div>
                <span className="ml-2 text-gray-600">正在查询释义...</span>
              </div>
            ) : (
              <WordDetailContent />
            )}
          </div>
        </div>
      )}
      
      <p className="text-sm text-gray-500 italic mt-3">点击词汇查看详细释义。悬停词汇可查看词性。</p>
    </div>
  );
}