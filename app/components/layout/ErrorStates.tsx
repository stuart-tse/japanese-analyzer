'use client';

import React from 'react';
import { FaExclamationTriangle, FaExclamationCircle } from 'react-icons/fa';

interface ErrorStateProps {
  error: string;
  type?: 'warning' | 'error';
}

export function AnalysisErrorState({ error, type = 'error' }: ErrorStateProps) {
  const Icon = type === 'warning' ? FaExclamationTriangle : FaExclamationCircle;
  const bgColor = type === 'warning' ? 'var(--surface-container-low)' : '#fef2f2';
  const borderColor = 'var(--grammar-verb)';

  return (
    <div className="mb-4 p-4 border-l-4 rounded-lg" style={{ backgroundColor: bgColor, borderColor }}>
      <div className="flex items-start gap-3">
        <Icon style={{ color: 'var(--grammar-verb)' }} />
        <div>
          <p className="text-sm" style={{ color: 'var(--on-surface)' }}>
            {error}
          </p>
        </div>
      </div>
    </div>
  );
}

export function StreamParsingWarning() {
  return (
    <AnalysisErrorState 
      error="解析中，已经收到部分内容，但尚未形成完整的结果。"
      type="warning"
    />
  );
}