'use client';

import { useEffect, useState, useMemo } from 'react';
import { detectJapanese, getConfidenceLevel, type JapaneseDetectionResult } from '../utils/japaneseDetection';

interface JapaneseDetectorProps {
  text: string;
  onDetectionChange?: (result: JapaneseDetectionResult) => void;
  showIndicator?: boolean;
  showDetails?: boolean;
  className?: string;
  debounceMs?: number;
}

export default function JapaneseDetector({
  text,
  onDetectionChange,
  showIndicator = true,
  showDetails = false,
  className = '',
  debounceMs = 300
}: JapaneseDetectorProps) {
  const [debouncedText, setDebouncedText] = useState(text);

  // Debounce text input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [text, debounceMs]);

  // Perform detection
  const detectionResult = useMemo(() => {
    return detectJapanese(debouncedText);
  }, [debouncedText]);

  // Notify parent component of detection changes
  useEffect(() => {
    if (onDetectionChange) {
      onDetectionChange(detectionResult);
    }
  }, [detectionResult, onDetectionChange]);

  const confidenceLevel = getConfidenceLevel(detectionResult.confidence);

  // Get indicator color based on detection result
  const getIndicatorColor = () => {
    if (!debouncedText.trim()) return 'var(--on-surface-variant)';
    if (detectionResult.isJapanese) {
      switch (confidenceLevel) {
        case 'very-high': return '#22c55e'; // green-500
        case 'high': return '#84cc16'; // lime-500
        case 'medium': return '#eab308'; // yellow-500
        default: return '#f59e0b'; // amber-500
      }
    }
    return '#ef4444'; // red-500
  };

  // Get indicator icon
  const getIndicatorIcon = () => {
    if (!debouncedText.trim()) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }

    if (detectionResult.isJapanese) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
  };

  // Get status message
  const getStatusMessage = () => {
    if (!debouncedText.trim()) {
      return 'Enter text to detect Japanese';
    }

    if (detectionResult.isJapanese) {
      const scripts = [];
      if (detectionResult.detectedScripts.hiragana) scripts.push('Hiragana');
      if (detectionResult.detectedScripts.katakana) scripts.push('Katakana');
      if (detectionResult.detectedScripts.kanji) scripts.push('Kanji');
      
      return `Japanese detected (${Math.round(detectionResult.confidence * 100)}%) - ${scripts.join(', ')}`;
    }

    return 'Non-Japanese text detected';
  };

  if (!showIndicator && !showDetails) {
    return null;
  }

  return (
    <div className={`japanese-detector ${className}`}>
      {showIndicator && (
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors duration-200"
            style={{ 
              color: getIndicatorColor(),
              backgroundColor: `${getIndicatorColor()}20` // 20% opacity
            }}
          >
            {getIndicatorIcon()}
            <span>{debouncedText.trim() ? (detectionResult.isJapanese ? '日本語' : 'Non-JP') : 'Waiting'}</span>
            {debouncedText.trim() && detectionResult.isJapanese && (
              <span className="ml-1">({Math.round(detectionResult.confidence * 100)}%)</span>
            )}
          </div>
        </div>
      )}

      {showDetails && debouncedText.trim() && (
        <div className="detection-details p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--surface-container-low)' }}>
          <div className="flex items-start gap-2 mb-2">
            <div style={{ color: getIndicatorColor() }}>
              {getIndicatorIcon()}
            </div>
            <div className="flex-1">
              <div className="font-medium mb-1" style={{ color: 'var(--on-surface)' }}>
                {getStatusMessage()}
              </div>
              
              {/* Statistics */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-2" style={{ color: 'var(--on-surface-variant)' }}>
                <div>Characters: {detectionResult.statistics.totalChars}</div>
                <div>Japanese: {Math.round(detectionResult.statistics.japaneseRatio * 100)}%</div>
                {detectionResult.statistics.hiraganaCount > 0 && (
                  <div>Hiragana: {detectionResult.statistics.hiraganaCount}</div>
                )}
                {detectionResult.statistics.katakanaCount > 0 && (
                  <div>Katakana: {detectionResult.statistics.katakanaCount}</div>
                )}
                {detectionResult.statistics.kanjiCount > 0 && (
                  <div>Kanji: {detectionResult.statistics.kanjiCount}</div>
                )}
              </div>

              {/* Script indicators */}
              <div className="flex flex-wrap gap-1 mb-2">
                {Object.entries(detectionResult.detectedScripts).map(([script, detected]) => (
                  detected && (
                    <span
                      key={script}
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: 'var(--grammar-verb)',
                        color: 'white'
                      }}
                    >
                      {script.charAt(0).toUpperCase() + script.slice(1)}
                    </span>
                  )
                ))}
              </div>

              {/* Suggestions for non-Japanese text */}
              {!detectionResult.isJapanese && detectionResult.suggestions && (
                <div className="suggestions">
                  <div className="font-medium mb-1" style={{ color: 'var(--on-surface)' }}>
                    Suggestions:
                  </div>
                  <ul className="space-y-1">
                    {detectionResult.suggestions.map((suggestion, index) => (
                      <li 
                        key={index}
                        className="flex items-start gap-1 text-xs"
                        style={{ color: 'var(--on-surface-variant)' }}
                      >
                        <span>•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export detection hook for programmatic use
export function useJapaneseDetection(text: string, debounceMs = 300) {
  const [debouncedText, setDebouncedText] = useState(text);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [text, debounceMs]);

  return useMemo(() => detectJapanese(debouncedText), [debouncedText]);
}