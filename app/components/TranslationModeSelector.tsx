'use client';

import { TranslationMode } from '../types/translation';
import { FaBolt, FaListUl, FaLayerGroup } from 'react-icons/fa';

interface TranslationModeSelectorProps {
  selectedMode: TranslationMode;
  onModeChange: (mode: TranslationMode) => void;
  isLoading?: boolean;
  className?: string;
}

const translationModes = [
  {
    id: 'quick' as TranslationMode,
    label: '快速翻译',
    description: 'Quick translation',
    icon: FaBolt,
    color: 'var(--grammar-verb)',
    features: ['Instant results', 'Basic accuracy']
  },
  {
    id: 'detailed' as TranslationMode,
    label: '详细翻译',
    description: 'Detailed analysis',
    icon: FaListUl,
    color: 'var(--grammar-adjective)',
    features: ['Grammar analysis', 'Context notes']
  },
  {
    id: 'word-by-word' as TranslationMode,
    label: '逐词翻译',
    description: 'Word-by-word breakdown',
    icon: FaLayerGroup,
    color: 'var(--grammar-noun)',
    features: ['Token analysis', 'Part-of-speech']
  }
];

export default function TranslationModeSelector({
  selectedMode,
  onModeChange,
  isLoading = false,
  className = ''
}: TranslationModeSelectorProps) {
  return (
    <div className={`translation-mode-selector ${className}`}>
      <div className="flex flex-col space-y-1 p-1 rounded-lg" 
           style={{ backgroundColor: 'var(--surface-container-low)' }}>
        {translationModes.map((mode) => {
          const IconComponent = mode.icon;
          const isSelected = selectedMode === mode.id;
          const isDisabled = isLoading;
          
          return (
            <button
              key={mode.id}
              onClick={() => !isDisabled && onModeChange(mode.id)}
              disabled={isDisabled}
              className={`
                relative flex items-center p-3 rounded-md transition-all duration-200
                ${isSelected 
                  ? 'shadow-sm transform' 
                  : 'hover:shadow-sm'
                }
                ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={{
                backgroundColor: isSelected ? mode.color : 'transparent',
                color: isSelected ? 'white' : 'var(--on-surface)',
                border: isSelected ? 'none' : '1px solid var(--outline)',
              }}
              role="tab"
              aria-selected={isSelected}
              aria-label={`Select ${mode.label} translation mode`}
            >
              {/* Mode Icon */}
              <div className="flex-shrink-0 mr-3">
                <IconComponent 
                  className="w-5 h-5" 
                  style={{ 
                    color: isSelected ? 'white' : mode.color,
                    opacity: isDisabled ? 0.6 : 1
                  }} 
                />
              </div>
              
              {/* Mode Info */}
              <div className="flex-1 text-left">
                <div className="font-medium text-sm mb-1">
                  {mode.label}
                </div>
                <div className="text-xs opacity-80">
                  {mode.description}
                </div>
                
                {/* Features list for non-selected modes */}
                {!isSelected && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {mode.features.map((feature, index) => (
                      <span 
                        key={index}
                        className="inline-block px-2 py-0.5 text-xs rounded-full"
                        style={{
                          backgroundColor: 'var(--surface-container)',
                          color: 'var(--on-surface-variant)',
                          border: '1px solid var(--outline)',
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Selection indicator */}
              {isSelected && (
                <div className="flex-shrink-0 ml-2">
                  <div className="w-2 h-2 rounded-full bg-white opacity-80"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Mode description for mobile */}
      <div className="mt-2 p-2 rounded text-xs" 
           style={{ 
             backgroundColor: 'var(--surface-container)', 
             color: 'var(--on-surface-variant)' 
           }}>
        <strong>Current Mode:</strong> {translationModes.find(m => m.id === selectedMode)?.description}
      </div>
    </div>
  );
}