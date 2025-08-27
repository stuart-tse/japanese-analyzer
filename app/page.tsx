'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { AnalysisProvider } from './contexts/AnalysisContext';
import { SettingsProvider, useSettingsContext } from './contexts/SettingsContext';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthScreen, MainLayout } from './components/layout';
import EnhancedSettingsModal from './components/EnhancedSettingsModal';
import ClientOnly from './components/ClientOnly';
import { DEFAULT_API_URL } from './services/api';

function AppContent() {
  const { isAuthenticated, requiresAuth, authError, login } = useAuthContext();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  if (requiresAuth && !isAuthenticated) {
    return <AuthScreen onLogin={login} authError={authError} />;
  }

  return (
    <>
      <MainLayout onSettingsClick={() => setIsSettingsModalOpen(true)} />
      <SettingsModalContent 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
}

function SettingsModalContent({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { userApiKey, userApiUrl, useStream, saveSettings } = useSettingsContext();

  return (
    <EnhancedSettingsModal
      userApiKey={userApiKey}
      userApiUrl={userApiUrl}
      defaultApiUrl={DEFAULT_API_URL}
      useStream={useStream}
      onSaveSettings={saveSettings}
      isModalOpen={isOpen}
      onModalClose={onClose}
    />
  );
}

export default function Home() {
  return (
    <ClientOnly fallback={<div className="h-screen bg-surface flex items-center justify-center">Loading...</div>}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <SettingsProvider>
            <AnalysisProvider>
              <AppContent />
            </AnalysisProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ClientOnly>
  );
}