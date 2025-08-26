'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSettings } from '../hooks/useSettings';
import { LearningMode } from '../components/LearningModeSelector';

interface SettingsContextType {
  userApiKey: string;
  userApiUrl: string;
  useStream: boolean;
  ttsProvider: 'edge' | 'gemini';
  learningMode: LearningMode;
  setUserApiKey: (key: string) => void;
  setUserApiUrl: (url: string) => void;
  setUseStream: (enabled: boolean) => void;
  setTtsProvider: (provider: 'edge' | 'gemini') => void;
  setLearningMode: (mode: LearningMode) => void;
  saveSettings: (apiKey: string, apiUrl: string, streamEnabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const settingsHook = useSettings();

  return (
    <SettingsContext.Provider value={settingsHook}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}