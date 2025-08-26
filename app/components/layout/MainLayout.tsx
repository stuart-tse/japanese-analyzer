'use client';

import React from 'react';
import ClientOnly from '../ClientOnly';
import HeaderBar from './HeaderBar';
import { LoadingStates, ErrorStates } from './';
import InputPanel from '../InputPanel';
import AnalysisViewport from '../AnalysisViewport';
import WordDetailPanel from '../WordDetailPanel';
import { useAnalysisContext } from '../../contexts/AnalysisContext';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { LearningMode } from '../LearningModeSelector';
import { TokenData } from '../../services/api';

interface MainLayoutProps {
  onSettingsClick: () => void;
}

export default function MainLayout({ onSettingsClick }: MainLayoutProps) {
  const {
    analyzedTokens,
    isAnalyzing,
    analysisError,
    currentSentence,
    streamContent,
    isJsonParseError,
    selectedToken,
    selectedTokenIndex,
    translationTrigger,
    showFurigana,
    analysisMode,
    handleAnalyze,
    setShowFurigana,
    setAnalysisMode,
    setSelectedTokenIndex,
    setSelectedToken,
  } = useAnalysisContext();

  const {
    userApiKey,
    userApiUrl,
    useStream,
    ttsProvider,
    learningMode,
    setTtsProvider,
    setLearningMode,
  } = useSettingsContext();

  const handleTokenSelect = (index: number, token: TokenData) => {
    setSelectedTokenIndex(index);
    setSelectedToken(token);
  };

  const handleCloseWordDetail = () => {
    setSelectedTokenIndex(null);
    setSelectedToken(null);
  };

  const handleAnalyzeWrapper = (text: string) => {
    return handleAnalyze(text, userApiKey, userApiUrl, useStream);
  };

  const handleTtsProviderChange = (provider: 'edge' | 'gemini') => {
    setTtsProvider(provider);
  };

  const handleLearningModeChange = (mode: LearningMode) => {
    setLearningMode(mode);
  };

  return (
    <div className="h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--surface)' }}>
      <ClientOnly fallback={<LoadingStates.InterfaceLoader />}>
        <div className="main-layout grid grid-cols-1 lg:grid-cols-[330px_1fr_352px] h-screen gap-1" style={{ gridTemplateRows: '60px 1fr' }}>
          <HeaderBar onSettingsClick={onSettingsClick} />

          {/* Left Panel - Input & Controls */}
          <div className="left-panel lg:block hidden border-r p-4 overflow-y-auto" style={{ backgroundColor: 'white', borderColor: 'var(--outline)' }}>
            <InputPanel
              onAnalyze={handleAnalyzeWrapper}
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
          <main className="center-panel p-4 overflow-y-auto" style={{ backgroundColor: 'white' }}>
            {/* Mobile input section */}
            <div className="lg:hidden mb-6">
              <InputPanel
                onAnalyze={handleAnalyzeWrapper}
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
              <LoadingStates.LoadingSpinner />
            )}

            {/* Error states */}
            {isJsonParseError && streamContent && (
              <ErrorStates.StreamParsingWarning />
            )}

            {analysisError && (
              <ErrorStates.AnalysisErrorState error={`解析错误：${analysisError}`} />
            )}

            {/* Analysis viewport */}
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

            {/* Mobile word details */}
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
          </main>

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
    </div>
  );
}