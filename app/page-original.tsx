'use client';

import { useState, useEffect } from 'react';
import InputPanel from './components/InputPanel';
import AnalysisViewport, { AnalysisMode } from './components/AnalysisViewport';
import WordDetailPanel from './components/WordDetailPanel';
import { LearningMode } from './components/LearningModeSelector';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
// import AIChat from './components/AIChat'; // Currently commented out
import ClientOnly from './components/ClientOnly';
import { analyzeSentence, TokenData, DEFAULT_API_URL, streamAnalyzeSentence } from './services/api';
import { FaExclamationTriangle, FaExclamationCircle } from 'react-icons/fa';

export default function Home() {
  const [currentSentence, setCurrentSentence] = useState('');
  const [analyzedTokens, setAnalyzedTokens] = useState<TokenData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [useStream, setUseStream] = useState<boolean>(true);
  const [streamContent, setStreamContent] = useState('');
  const [isJsonParseError, setIsJsonParseError] = useState(false);
  const [translationTrigger, setTranslationTrigger] = useState(0);
  const [showFurigana, setShowFurigana] = useState(true);
  
  // New layout state
  const [learningMode, setLearningMode] = useState<LearningMode>('beginner');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('tokens');
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  
  // Add hydration state to prevent SSR/client mismatch
  const [isHydrated, setIsHydrated] = useState(false);
  
  // API设置相关状态
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [userApiUrl, setUserApiUrl] = useState(DEFAULT_API_URL);
  const [ttsProvider, setTtsProvider] = useState<'edge' | 'gemini'>('edge');
  
  // 密码验证相关状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [authError, setAuthError] = useState('');

  // 检查是否需要密码验证
  useEffect(() => {
    const checkAuthRequirement = async () => {
      try {
        const response = await fetch('/api/auth');
        const data = await response.json();
        setRequiresAuth(data.requiresAuth);
        
        // 如果不需要验证，直接设置为已认证
        if (!data.requiresAuth) {
          setIsAuthenticated(true);
        } else {
          // 检查是否已经有有效的认证状态
          const authStatus = localStorage.getItem('isAuthenticated');
          if (authStatus === 'true') {
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('检查认证状态失败:', error);
        // 出错时默认不需要认证
        setRequiresAuth(false);
        setIsAuthenticated(true);
      }
    };
    
    checkAuthRequirement();
  }, []);

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // 从本地存储加载用户API设置
  useEffect(() => {
    if (!isHydrated) return; // Wait for hydration
    
    const storedApiKey = localStorage.getItem('userApiKey') || '';
    const storedApiUrl = localStorage.getItem('userApiUrl') || DEFAULT_API_URL;
    const storedUseStream = localStorage.getItem('useStream');
    const storedTtsProvider = localStorage.getItem('ttsProvider') as 'edge' | 'gemini' || 'edge';
    const storedLearningMode = localStorage.getItem('learningMode') as LearningMode || 'beginner';
    
    setUserApiKey(storedApiKey);
    setUserApiUrl(storedApiUrl);
    setTtsProvider(storedTtsProvider);
    setLearningMode(storedLearningMode);
    
    // 只有当明确设置了值时才更新，否则保持默认值
    if (storedUseStream !== null) {
      setUseStream(storedUseStream === 'true');
    }
  }, [isHydrated]);
  
  // 保存用户API设置
  const handleSaveSettings = (apiKey: string, apiUrl: string, streamEnabled: boolean) => {
    localStorage.setItem('userApiKey', apiKey);
    localStorage.setItem('userApiUrl', apiUrl);
    localStorage.setItem('useStream', streamEnabled.toString());
    
    setUserApiKey(apiKey);
    setUserApiUrl(apiUrl);
    setUseStream(streamEnabled);
  };

  const handleTtsProviderChange = (provider: 'edge' | 'gemini') => {
    setTtsProvider(provider);
    localStorage.setItem('ttsProvider', provider);
  };

  const handleLearningModeChange = (mode: LearningMode) => {
    setLearningMode(mode);
    if (isHydrated) {
      localStorage.setItem('learningMode', mode);
    }
  };

  const handleTokenSelect = (index: number, token: TokenData) => {
    setSelectedTokenIndex(index);
    setSelectedToken(token);
  };

  const handleCloseWordDetail = () => {
    setSelectedTokenIndex(null);
    setSelectedToken(null);
  };

  // 处理密码验证
  const handleLogin = async (password: string) => {
    try {
      setAuthError('');
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
      } else {
        setAuthError(data.message || '验证失败');
      }
    } catch (error) {
      console.error('验证过程中出错:', error);
      setAuthError('验证过程中发生错误，请重试');
    }
  };

  // 解析流式内容中的JSON数据
  const parseStreamContent = (content: string): TokenData[] => {
    try {
      // 如果内容为空，返回空数组
      if (!content || content.trim() === '') {
        return [];
      }
      
      // 尝试整理内容
      let processedContent = content;
      
      // 如果内容包含markdown代码块，尝试提取
      const jsonMatch = content.match(/```json\n([\s\S]*?)(\n```|$)/);
      if (jsonMatch && jsonMatch[1]) {
        processedContent = jsonMatch[1].trim();
        
        // Clean up any potential backticks or other problematic characters
        processedContent = processedContent.replace(/[`]/g, '').trim();
        
        // 检查是否是完整的JSON数组
        if (!processedContent.endsWith(']') && processedContent.startsWith('[')) {
          console.log("发现不完整的JSON块，尝试补全");
          // 尝试找到最后一个完整的对象结束位置
          const lastObjectEnd = processedContent.lastIndexOf('},');
          if (lastObjectEnd !== -1) {
            // 截取到最后一个完整对象
            processedContent = processedContent.substring(0, lastObjectEnd + 1) + ']';
          } else {
            // 找不到完整对象，可能只有部分第一个对象
            const firstObjectStart = processedContent.indexOf('{');
            if (firstObjectStart !== -1) {
              const partialObject = processedContent.substring(firstObjectStart);
              // 检查是否至少包含一个完整的字段
              if (partialObject.includes('":')) {
                return []; // 返回空数组，等待更多内容
              }
            }
            return []; // 返回空数组，等待更多内容
          }
        }
      } else {
        // Clean up any potential backticks or other problematic characters first
        processedContent = processedContent.replace(/[`]/g, '').trim();
        
        // If the content doesn't start with '[' or '{', try to find the JSON part
        if (!processedContent.startsWith('[') && !processedContent.startsWith('{')) {
          const jsonStart = processedContent.search(/[\[\{]/);
          if (jsonStart !== -1) {
            processedContent = processedContent.substring(jsonStart);
          }
        }
        
        // 直接查找JSON数组
        const arrayStart = processedContent.indexOf('[');
        const arrayEnd = processedContent.lastIndexOf(']');
        
        if (arrayStart !== -1 && arrayEnd === -1) {
          // 找到开始但没找到结束，是不完整的
          const lastObjectEnd = processedContent.lastIndexOf('},');
          if (lastObjectEnd !== -1 && lastObjectEnd > arrayStart) {
            // 有至少一个完整对象
            processedContent = processedContent.substring(arrayStart, lastObjectEnd + 1) + ']';
          } else {
            return []; // 没有完整对象，返回空等待更多内容
          }
        } else if (arrayStart !== -1 && arrayEnd !== -1) {
          // 提取数组部分
          processedContent = processedContent.substring(arrayStart, arrayEnd + 1);
        }
      }
      
      // 尝试解析处理后的内容
      try {
        const parsed = JSON.parse(processedContent) as TokenData[];
        // 验证数组中的对象是否有必要的字段
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validTokens = parsed.filter(item => 
            item && typeof item === 'object' && 'word' in item && 'pos' in item
          );
          if (validTokens.length > 0) {
            return validTokens;
          }
        }
        return [];
      } catch (e) {
        console.log("无法解析处理后的JSON:", processedContent);
        console.error(e);
        return [];
      }
    } catch (e) {
      console.error("解析JSON时出错:", e);
      console.debug("尝试解析的内容:", content);
      setIsJsonParseError(true);
      return [];
    }
  };

  // 监听流式内容变化，尝试解析TokenData
  useEffect(() => {
    if (streamContent && isAnalyzing) {
      const tokens = parseStreamContent(streamContent);
      if (tokens.length > 0) {
        setAnalyzedTokens(tokens);
        setIsJsonParseError(false);
      } else if (streamContent.includes('{') && streamContent.includes('"word":')) {
        // 有内容但解析失败，可能是不完整的JSON
        setIsJsonParseError(true);
      }
    }
  }, [streamContent, isAnalyzing]);


  const handleAnalyze = async (text: string) => {
    if (!text) return;

    setIsAnalyzing(true);
    setAnalysisError('');
    setCurrentSentence(text);
    setTranslationTrigger(Date.now());
    setStreamContent('');
    setAnalyzedTokens([]);
    setIsJsonParseError(false);
    setSelectedTokenIndex(null);
    setSelectedToken(null);
    
    try {
      if (useStream) {
        // 使用流式API进行分析
        streamAnalyzeSentence(
          text,
          (chunk, isDone) => {
            setStreamContent(chunk);
            if (isDone) {
              setIsAnalyzing(false);
              // 最终解析完整的内容
              const tokens = parseStreamContent(chunk);
              if (tokens.length > 0) {
                setAnalyzedTokens(tokens);
                setIsJsonParseError(false);
              } else if (chunk && chunk.includes('{') && chunk.includes('"word":')) {
                // 最终内容仍然解析失败
                setIsJsonParseError(true);
              }
            }
          },
          (error) => {
            console.error('Stream analysis error:', error);
            setAnalysisError(error.message || '流式解析错误');
            setIsAnalyzing(false);
          },
          userApiKey,
          userApiUrl
        );
      } else {
        // 使用传统API进行分析
        const tokens = await analyzeSentence(text, userApiKey, userApiUrl);
        // 保持所有tokens以保持布局
        const filteredTokens = tokens;
        setAnalyzedTokens(filteredTokens);
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError(error instanceof Error ? error.message : '未知错误');
      setAnalyzedTokens([]);
      setIsAnalyzing(false);
    }
  };

  // 如果需要认证但未认证，只显示登录界面
  if (requiresAuth && !isAuthenticated) {
    return (
      <>
        <div className="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-200" style={{ backgroundColor: 'var(--surface)' }}>
          <div className="text-center mb-8">
            <h1 className="md-typescale-display-medium transition-colors duration-200 mb-3" style={{ color: 'var(--on-surface)' }}>
              日本語<span style={{ color: 'var(--grammar-verb)' }}>文章解析器</span>
            </h1>
            <p className="md-typescale-title-medium transition-colors duration-200" style={{ color: 'var(--on-surface-variant)' }}>
              AI驱动・深入理解日语句子结构与词义
            </p>
          </div>
        </div>
        <LoginModal
          isOpen={true}
          onLogin={handleLogin}
          error={authError}
        />
      </>
    );
  }

  return (
    <>
      <div className="h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--surface)' }}>
        {/* 主要三面板布局 */}
        <ClientOnly 
          fallback={
            <div className="flex items-center justify-center h-screen">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: 'var(--grammar-verb)' }}></div>
                <span className="text-lg" style={{ color: 'var(--on-surface-variant)' }}>Loading interface...</span>
              </div>
            </div>
          }
        >
          <div className="main-layout grid grid-cols-1 lg:grid-cols-[330px_1fr_320px] h-screen gap-1" style={{ gridTemplateRows: '60px 1fr' }}>
            {/* Header Bar - spans all columns */}
            <div className="header-bar lg:col-span-3 flex items-center justify-between px-4 transition-colors duration-200" style={{ backgroundColor: 'var(--grammar-verb)' }}>
              <h1 className="text-white text-lg font-medium">
                Japanese Sentence Analyzer (日本語文章解析器)
              </h1>
              <div className="flex items-center gap-4 text-white text-sm">
                <button 
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="hover:bg-white/10 px-3 py-1 rounded transition-colors duration-200"
                >
                  Settings
                </button>
              </div>
            </div>

          {/* Left Panel - Input & Controls */}
          <div className="left-panel lg:block hidden border-r p-4 overflow-y-auto" style={{ backgroundColor: 'white', borderColor: 'var(--outline)' }}>
            <InputPanel
              onAnalyze={handleAnalyze}
              userApiKey={userApiKey}
              userApiUrl={userApiUrl}
              useStream={useStream}
              ttsProvider={ttsProvider}
              onTtsProviderChange={handleTtsProviderChange}
              isAnalyzing={isAnalyzing}
              learningMode={learningMode}
              onLearningModeChange={handleLearningModeChange}
            />
          </div>

          {/* Center Panel - Analysis Results */}
          <div className="center-panel p-4 overflow-y-auto" style={{ backgroundColor: 'white' }}>
            {/* Mobile input section - only shown on small screens */}
            <div className="lg:hidden mb-6">
              <InputPanel
                onAnalyze={handleAnalyze}
                userApiKey={userApiKey}
                userApiUrl={userApiUrl}
                useStream={useStream}
                ttsProvider={ttsProvider}
                onTtsProviderChange={handleTtsProviderChange}
                isAnalyzing={isAnalyzing}
                learningMode={learningMode}
                onLearningModeChange={handleLearningModeChange}
              />
            </div>

            {/* Loading state */}
            {isAnalyzing && (!analyzedTokens.length || !useStream) && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent" style={{ borderColor: 'var(--grammar-verb)' }}></div>
                  <span className="text-lg" style={{ color: 'var(--on-surface-variant)' }}>正在解析中，请稍候...</span>
                </div>
              </div>
            )}

            {/* Error states */}
            {isJsonParseError && streamContent && (
              <div className="mb-4 p-4 border-l-4 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)', borderColor: 'var(--grammar-verb)' }}>
                <div className="flex items-start gap-3">
                  <FaExclamationTriangle style={{ color: 'var(--grammar-verb)' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'var(--on-surface)' }}>
                      解析中，已经收到部分内容，但尚未形成完整的结果。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {analysisError && (
              <div className="mb-4 p-4 border-l-4 rounded-lg" style={{ backgroundColor: '#fef2f2', borderColor: 'var(--grammar-verb)' }}>
                <div className="flex items-start gap-3">
                  <FaExclamationCircle style={{ color: 'var(--grammar-verb)' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'var(--on-surface)' }}>
                      解析错误：{analysisError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis viewport - Always show to display welcome screen */}
            <AnalysisViewport
              tokens={analyzedTokens}
              originalSentence={currentSentence}
              selectedTokenIndex={selectedTokenIndex}
              onTokenSelect={handleTokenSelect}
              showFurigana={showFurigana}
              onShowFuriganaChange={setShowFurigana}
              analysisMode={analysisMode}
              onAnalysisModeChange={setAnalysisMode}
              learningMode={learningMode}
              userApiKey={userApiKey}
              userApiUrl={userApiUrl}
              useStream={useStream}
              translationTrigger={translationTrigger}
            />

            {/* Mobile word details - shown below analysis on small screens */}
            {selectedToken && (
              <div className="lg:hidden mt-6">
                <WordDetailPanel
                  selectedToken={selectedToken}
                  selectedTokenIndex={selectedTokenIndex}
                  onClose={handleCloseWordDetail}
                  userApiKey={userApiKey}
                  userApiUrl={userApiUrl}
                  useStream={useStream}
                  learningMode={learningMode}
                  ttsProvider={ttsProvider}
                  currentSentence={currentSentence}
                />
              </div>
            )}

          </div>

          {/* Right Panel - Word Details */}
          <div className="right-panel lg:block hidden border-l overflow-y-auto" style={{ backgroundColor: 'var(--surface-container-low)', borderColor: 'var(--outline)' }}>
            <WordDetailPanel
              selectedToken={selectedToken}
              selectedTokenIndex={selectedTokenIndex}
              onClose={handleCloseWordDetail}
              userApiKey={userApiKey}
              userApiUrl={userApiUrl}
              useStream={useStream}
              learningMode={learningMode}
              ttsProvider={ttsProvider}
              currentSentence={currentSentence}
            />
          </div>
        </div>
        </ClientOnly>

        
        {/* 设置模态框 */}
        <SettingsModal
          userApiKey={userApiKey}
          userApiUrl={userApiUrl}
          defaultApiUrl={DEFAULT_API_URL}
          useStream={useStream}
          onSaveSettings={handleSaveSettings}
          isModalOpen={isSettingsModalOpen}
          onModalClose={() => setIsSettingsModalOpen(!isSettingsModalOpen)}
        />
      </div>
      
      {/* AI聊天助手 - 移到主容器外面 */}
      {/*<AIChat */}
      {/*  userApiKey={userApiKey}*/}
      {/*  currentSentence={currentSentence}*/}
      {/*/>*/}
    </>
  );
}
