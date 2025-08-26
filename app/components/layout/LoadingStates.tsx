'use client';

import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent" style={{ borderColor: 'var(--grammar-verb)' }}></div>
        <span className="text-lg" style={{ color: 'var(--on-surface-variant)' }}>正在解析中，请稍候...</span>
      </div>
    </div>
  );
}

export function InterfaceLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: 'var(--grammar-verb)' }}></div>
        <span className="text-lg" style={{ color: 'var(--on-surface-variant)' }}>Loading interface...</span>
      </div>
    </div>
  );
}