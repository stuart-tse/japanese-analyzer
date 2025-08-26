'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAnalysis } from '../hooks/useAnalysis';
import { AnalysisMode } from '../components/AnalysisViewport';

interface AnalysisContextType {
  analyzedTokens: import('../services/api').TokenData[];
  isAnalyzing: boolean;
  analysisError: string;
  currentSentence: string;
  streamContent: string;
  isJsonParseError: boolean;
  selectedTokenIndex: number | null;
  selectedToken: import('../services/api').TokenData | null;
  translationTrigger: number;
  showFurigana: boolean;
  analysisMode: AnalysisMode;
  handleAnalyze: (text: string, userApiKey?: string, userApiUrl?: string, useStream?: boolean) => Promise<void>;
  setSelectedTokenIndex: (index: number | null) => void;
  setSelectedToken: (token: import('../services/api').TokenData | null) => void;
  setShowFurigana: (show: boolean) => void;
  setAnalysisMode: (mode: AnalysisMode) => void;
  clearAnalysis: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

interface AnalysisProviderProps {
  children: ReactNode;
}

export function AnalysisProvider({ children }: AnalysisProviderProps) {
  const analysisHook = useAnalysis();
  const [analysisMode, setAnalysisMode] = React.useState<AnalysisMode>('tokens');

  const value: AnalysisContextType = {
    ...analysisHook,
    analysisMode,
    setAnalysisMode,
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysisContext(): AnalysisContextType {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysisContext must be used within an AnalysisProvider');
  }
  return context;
}