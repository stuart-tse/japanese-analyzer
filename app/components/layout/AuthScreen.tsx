'use client';

import React from 'react';
import LoginModal from '../LoginModal';

interface AuthScreenProps {
  onLogin: (password: string) => Promise<void>;
  authError: string;
}

export default function AuthScreen({ onLogin, authError }: AuthScreenProps) {
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
        onLogin={onLogin}
        error={authError}
      />
    </>
  );
}