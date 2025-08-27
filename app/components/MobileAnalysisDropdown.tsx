'use client';

import { useState, useRef, useEffect } from 'react';
import { AnalysisMode } from './AnalysisViewport';

interface AnalysisModeOption {
  id: AnalysisMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface MobileAnalysisDropdownProps {
  analysisMode: AnalysisMode;
  onAnalysisModeChange: (mode: AnalysisMode) => void;
  analysisModes: AnalysisModeOption[];
}

export default function MobileAnalysisDropdown({
  analysisMode,
  onAnalysisModeChange,
  analysisModes
}: MobileAnalysisDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentMode = analysisModes.find(mode => mode.id === analysisMode);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => (prev + 1) % analysisModes.length);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(analysisModes.length - 1);
        } else {
          setFocusedIndex(prev => prev === 0 ? analysisModes.length - 1 : prev - 1);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else if (focusedIndex >= 0) {
          onAnalysisModeChange(analysisModes[focusedIndex].id);
          setIsOpen(false);
          setFocusedIndex(-1);
          buttonRef.current?.focus();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
    }
  };

  const handleOptionClick = (mode: AnalysisMode) => {
    onAnalysisModeChange(mode);
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setFocusedIndex(isOpen ? -1 : 0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        className={`
          w-full flex items-center justify-between p-4 text-sm font-medium rounded-lg 
          transition-all duration-300 ease-out shadow-md focus:outline-none focus:ring-2 
          focus:ring-offset-2 cursor-pointer
          ${isOpen ? 'shadow-xl transform scale-[1.02]' : 'hover:shadow-lg hover:transform hover:scale-[1.01]'}
        `}
        style={{
          backgroundColor: 'var(--surface-container)',
          color: 'var(--on-surface)',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: isOpen ? 'var(--grammar-verb)' : 'var(--outline)',
          boxShadow: isOpen 
            ? '0 8px 24px rgba(196, 30, 58, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)' 
            : '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
          outlineColor: 'var(--grammar-verb)',
          minHeight: '64px'
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select analysis mode"
      >
        {/* Selected option content */}
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0" style={{ color: 'var(--grammar-verb)' }}>
            {currentMode?.icon}
          </div>
          <div className="text-left">
            <div className="font-semibold text-base">
              {currentMode?.label}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
              {currentMode?.description}
            </div>
          </div>
        </div>

        {/* Dropdown arrow */}
        <div className={`flex-shrink-0 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg 
            className="w-5 h-5" 
            style={{ color: 'var(--grammar-verb)' }} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute top-full left-0 right-0 mt-2 py-2 rounded-lg shadow-xl border
            animate-in fade-in slide-in-from-top-2 duration-200 z-50
          `}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: 'var(--outline)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 8px 32px rgba(196, 30, 58, 0.1)'
          }}
          role="listbox"
          aria-label="Analysis mode options"
        >
          {analysisModes.map((mode, index) => {
            const isSelected = mode.id === analysisMode;
            const isFocused = index === focusedIndex;
            
            return (
              <button
                key={mode.id}
                onClick={() => handleOptionClick(mode.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150
                  hover:transform hover:scale-[1.01] focus:outline-none
                  ${isFocused ? 'bg-opacity-20' : ''}
                `}
                style={{
                  backgroundColor: isSelected 
                    ? 'var(--grammar-verb)' 
                    : isFocused 
                      ? 'var(--surface-container-high)'
                      : 'transparent',
                  color: isSelected ? 'white' : 'var(--on-surface)',
                  minHeight: '56px'
                }}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
              >
                {/* Icon */}
                <div 
                  className={`flex-shrink-0 transition-all duration-200 ${
                    isSelected ? 'transform scale-110' : ''
                  }`}
                  style={{ 
                    color: isSelected ? 'white' : 'var(--grammar-verb)'
                  }}
                >
                  {mode.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className={`font-semibold text-sm ${isSelected ? 'text-white' : ''}`}>
                    {mode.label}
                  </div>
                  <div 
                    className="text-xs mt-0.5"
                    style={{ 
                      color: isSelected 
                        ? 'rgba(255, 255, 255, 0.8)' 
                        : 'var(--on-surface-variant)'
                    }}
                  >
                    {mode.description}
                  </div>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="flex-shrink-0 ml-2">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}