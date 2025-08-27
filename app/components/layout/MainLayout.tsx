'use client';

import React, { useState } from 'react';
import ClientOnly from '../ClientOnly';
import ModernHeader from '../ModernHeader';
import MemberProfileModal from '../MemberProfileModal';
import LoginModal from '../LoginModal';
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
  // Modal states
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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

  // Modal handlers
  const handleMemberClick = () => {
    setIsMemberModalOpen(true);
  };

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const handleLogin = (email: string, password: string) => {
    // TODO: Implement actual login logic
    console.log('Login attempt:', { email, password });
    setIsLoginModalOpen(false);
  };

  const handleRegister = (name: string, email: string, password: string) => {
    // TODO: Implement actual registration logic
    console.log('Register attempt:', { name, email, password });
    setIsLoginModalOpen(false);
  };

  const handleSocialLogin = (provider: 'google' | 'github') => {
    // TODO: Implement social login
    console.log('Social login attempt:', provider);
    setIsLoginModalOpen(false);
  };

  return (
    <div className="h-screen transition-colors duration-200 flex flex-col" style={{ backgroundColor: 'var(--surface)' }}>
      <ClientOnly fallback={<LoadingStates.InterfaceLoader />}>
        {/* Modern Header */}
        <ModernHeader 
          onMemberClick={handleMemberClick}
          onLoginClick={handleLoginClick}
          onSettingsClick={onSettingsClick}
        />
        
        <div className="main-layout grid grid-cols-1 lg:grid-cols-[330px_1fr_352px] flex-1 gap-1 overflow-hidden">

          {/* Left Panel - Input & Controls */}
          <div className="left-panel lg:block hidden border-r p-4 overflow-y-auto" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--outline)' }}>
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
          <main className="center-panel p-4 overflow-y-auto" style={{ backgroundColor: 'var(--surface)' }}>
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

        {/* Modals */}
        <MemberProfileModal 
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
        />
        
        <LoginModal 
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onSocialLogin={handleSocialLogin}
        />
      </ClientOnly>
    </div>
  );
}