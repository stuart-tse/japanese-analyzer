'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { AnalysisProvider } from './contexts/AnalysisContext';
import { SettingsProvider, useSettingsContext } from './contexts/SettingsContext';
import { AuthScreen, MainLayout } from './components/layout';
import SettingsModal from './components/SettingsModal';
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
    <SettingsModal
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
    <ClientOnly fallback={<div className="min-h-screen bg-surface flex items-center justify-center">Loading...</div>}>
      <AuthProvider>
        <SettingsProvider>
          <AnalysisProvider>
            <AppContent />
          </AnalysisProvider>
        </SettingsProvider>
      </AuthProvider>
    </ClientOnly>
  );
}