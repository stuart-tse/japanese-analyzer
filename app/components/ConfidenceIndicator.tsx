'use client';

import { TranslationConfidence, TranslationQuality } from '../types/translation';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

interface ConfidenceIndicatorProps {
  confidence: TranslationConfidence;
  quality?: TranslationQuality;
  showDetails?: boolean;
  className?: string;
}

export default function ConfidenceIndicator({ 
  confidence, 
  quality,
  showDetails = false,
  className = '' 
}: ConfidenceIndicatorProps) {
  const getConfidenceColor = (score: number): string => {
    if (score >= 90) return 'var(--grammar-verb)';
    if (score >= 75) return 'var(--grammar-adjective)';
    if (score >= 60) return 'var(--grammar-auxiliary)';
    return 'var(--grammar-adverb)';
  };
  
  const getConfidenceIcon = (score: number) => {
    if (score >= 85) return FaCheckCircle;
    if (score >= 65) return FaInfoCircle;
    return FaExclamationTriangle;
  };
  
  const getConfidenceLabel = (score: number): string => {
    if (score >= 90) return '高精度';
    if (score >= 75) return '中等精度';
    if (score >= 60) return '较低精度';
    return '低精度';
  };
  
  const IconComponent = getConfidenceIcon(confidence.overall);
  const confidenceColor = getConfidenceColor(confidence.overall);
  
  return (
    <div className={`confidence-indicator ${className}`}>
      {/* Main confidence display */}
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ 
            backgroundColor: `${confidenceColor}15`,
            border: `1px solid ${confidenceColor}30`
          }}
        >
          <IconComponent 
            className="w-4 h-4" 
            style={{ color: confidenceColor }} 
          />
          <span 
            className="text-sm font-medium"
            style={{ color: confidenceColor }}
          >
            {confidence.overall}%
          </span>
          <span 
            className="text-xs"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            {getConfidenceLabel(confidence.overall)}
          </span>
        </div>
        
        {/* Methodology badge */}
        <div 
          className="px-2 py-1 rounded text-xs font-medium"
          style={{
            backgroundColor: 'var(--surface-container)',
            color: 'var(--on-surface-variant)',
            border: '1px solid var(--outline)'
          }}
        >
          {confidence.methodology === 'gemini' ? 'AI' : 
           confidence.methodology === 'rule-based' ? '规则' : '混合'}
        </div>
      </div>
      
      {/* Confidence progress bar */}
      <div className="w-full">
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--surface-container)' }}
        >
          <div 
            className="h-full transition-all duration-500 ease-out rounded-full"
            style={{
              width: `${confidence.overall}%`,
              backgroundColor: confidenceColor,
              boxShadow: `0 0 4px ${confidenceColor}40`
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
      
      {/* Detailed quality metrics */}
      {showDetails && quality && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
            翻译质量分析
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '准确性', value: quality.accuracy, key: 'accuracy' },
              { label: '流畅性', value: quality.fluency, key: 'fluency' },
              { label: '完整性', value: quality.completeness, key: 'completeness' },
              { label: '文化适应性', value: quality.cultural_appropriateness, key: 'cultural' }
            ].map(({ label, value, key }) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--on-surface-variant)' }}>{label}</span>
                  <span style={{ color: 'var(--on-surface)' }}>{value}%</span>
                </div>
                <div 
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--surface-container)' }}
                >
                  <div 
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${value}%`,
                      backgroundColor: getConfidenceColor(value)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Suggestions */}
          {quality.suggestions && quality.suggestions.length > 0 && (
            <div className="mt-3">
              <h5 className="text-xs font-medium mb-2" style={{ color: 'var(--on-surface)' }}>
                改进建议
              </h5>
              <ul className="space-y-1">
                {quality.suggestions.map((suggestion, index) => (
                  <li 
                    key={index}
                    className="text-xs flex items-start gap-2"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    <span className="text-xs">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}