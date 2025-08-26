'use client';

import { useState, useCallback, useRef } from 'react';
import { FaMicrophone, FaCamera, FaKeyboard } from 'react-icons/fa';
import { extractTextFromImage } from '../services/api';
import LearningModeSelector, { LearningMode } from './LearningModeSelector';
import JapaneseDetector from './JapaneseDetector';
import VoiceInput from './VoiceInput';
import type { JapaneseDetectionResult } from '../utils/japaneseDetection';

interface InputPanelProps {
  onAnalyze: (text: string) => void;
  userApiKey?: string;
  userApiUrl?: string;
  useStream?: boolean;
  ttsProvider?: 'edge' | 'gemini';
  onTtsProviderChange?: (provider: 'edge' | 'gemini') => void;
  isAnalyzing: boolean;
  learningMode: LearningMode;
  onLearningModeChange: (mode: LearningMode) => void;
}

export default function InputPanel({
  onAnalyze,
  userApiKey,
  userApiUrl,
  useStream: _useStream, // eslint-disable-line @typescript-eslint/no-unused-vars
  ttsProvider: _ttsProvider, // eslint-disable-line @typescript-eslint/no-unused-vars
  onTtsProviderChange: _onTtsProviderChange, // eslint-disable-line @typescript-eslint/no-unused-vars
  isAnalyzing,
  learningMode,
  onLearningModeChange
}: InputPanelProps) {
  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'ocr' | 'voice'>('text');
  const [isExtracting, setIsExtracting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<JapaneseDetectionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = useCallback(() => {
    if (inputText.trim() && !isAnalyzing) {
      onAnalyze(inputText.trim());
    }
  }, [inputText, isAnalyzing, onAnalyze]);

  const handleDetectionChange = useCallback((result: JapaneseDetectionResult) => {
    setDetectionResult(result);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAnalyze();
    }
  }, [handleAnalyze]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;
      
      const text = await extractTextFromImage(base64Data, undefined, userApiKey, userApiUrl);
      setInputText(text);
      setInputMode('text'); // Switch to text mode after extraction
    } catch (error) {
      console.error('OCR error:', error);
      // Could add error handling UI here
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle voice input transcript
  const handleVoiceTranscript = useCallback((transcript: string) => {
    setInputText(transcript);
    // Keep the user on the voice tab after recording
    // They can manually switch to text tab if they want to edit the transcript
  }, []);

  const inputModes = [
    { id: 'text' as const, icon: FaKeyboard, label: 'Text' },
    { id: 'ocr' as const, icon: FaCamera, label: 'OCR' },
    { id: 'voice' as const, icon: FaMicrophone, label: 'Voice' }
  ];

  return (
    <div className="input-panel h-full flex flex-col">
      {/* Learning Mode Selector */}
      <LearningModeSelector 
        selectedMode={learningMode}
        onModeChange={onLearningModeChange}
      />

      {/* Input Mode Tabs */}
      <div className="input-tabs mb-4">
        <h3 className="text-sm font-medium mb-3 transition-colors duration-200" style={{ color: 'var(--on-surface)' }}>
          Input Method
        </h3>
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
          {inputModes.map((mode) => {
            const IconComponent = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setInputMode(mode.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                  ${inputMode === mode.id 
                    ? 'text-white shadow-sm' 
                    : 'hover:shadow-sm'
                  }
                `}
                style={{
                  backgroundColor: inputMode === mode.id 
                    ? 'var(--grammar-verb)' 
                    : 'transparent',
                  color: inputMode === mode.id 
                    ? 'white' 
                    : 'var(--on-surface-variant)',
                }}
              >
                <IconComponent className="text-sm" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Area */}
      <div className="input-section flex-1 flex flex-col">
        {inputMode === 'text' && (
          <div className="flex-1 flex flex-col">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter Japanese text to analyze...&#10;Example: 今日は良い天気ですね。"
              className="flex-1 w-full p-4 text-base resize-none rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: 'var(--surface-container)',
                borderColor: 'var(--outline)',
                color: 'var(--on-surface)'
              }}
              maxLength={500}
            />
            {/* Japanese Detection Indicator */}
            <div className="mt-2">
              <JapaneseDetector 
                text={inputText}
                onDetectionChange={handleDetectionChange}
                showIndicator={true}
                showDetails={false}
              />
            </div>
            
            <div className="input-controls flex justify-between items-center mt-2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
              <span suppressHydrationWarning>{inputText.length}/500 characters</span>
              <span>Ctrl+Enter to analyze</span>
            </div>
          </div>
        )}

        {inputMode === 'ocr' && (
          <div className="flex-1 flex flex-col">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <div 
              className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors duration-200 hover:bg-opacity-50"
              style={{ 
                borderColor: 'var(--outline)',
                backgroundColor: 'var(--surface-container-low)'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <FaCamera className="text-4xl mb-4" style={{ color: 'var(--on-surface-variant)' }} />
              <p className="text-center mb-2" style={{ color: 'var(--on-surface)' }}>
                {isExtracting ? 'Extracting text...' : 'Click to upload image'}
              </p>
              <p className="text-sm text-center" style={{ color: 'var(--on-surface-variant)' }}>
                JPG, PNG, or other image formats
              </p>
            </div>
            {inputText && (
              <div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="mt-4 w-full p-3 text-base resize-none rounded-lg border h-32 transition-colors duration-200"
                  style={{ 
                    backgroundColor: 'var(--surface-container)',
                    borderColor: 'var(--outline)',
                    color: 'var(--on-surface)'
                  }}
                  placeholder="Extracted text will appear here..."
                />
                {/* Japanese Detection for OCR extracted text */}
                <div className="mt-2">
                  <JapaneseDetector 
                    text={inputText}
                    onDetectionChange={handleDetectionChange}
                    showIndicator={true}
                    showDetails={true}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {inputMode === 'voice' && (
          <VoiceInput
            onTranscriptReady={handleVoiceTranscript}
            language="ja"
            continuous={false}
            disabled={isAnalyzing || isExtracting}
            className="flex-1"
          />
        )}
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={!inputText.trim() || isAnalyzing || isExtracting}
        className={`
          w-full py-4 px-6 rounded-lg font-medium text-base transition-all duration-200 mt-4
          ${(!inputText.trim() || isAnalyzing || isExtracting)
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:shadow-lg transform hover:-translate-y-0.5'
          }
          ${detectionResult && !detectionResult.isJapanese && inputText.trim() ? 'border-2' : ''}
        `}
        style={{
          backgroundColor: 'var(--grammar-verb)',
          color: 'white',
          ...(detectionResult && !detectionResult.isJapanese && inputText.trim() ? {
            borderColor: '#f59e0b',
            boxShadow: '0 0 0 2px rgba(245, 158, 11, 0.2)'
          } : {})
        }}
      >
        {isAnalyzing ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Analyzing...</span>
          </div>
        ) : isExtracting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Extracting...</span>
          </div>
        ) : (
          <>Analyze Sentence (分析)</>
        )}
      </button>

      {/* Usage Tips and Detection Warnings */}
      {detectionResult && !detectionResult.isJapanese && inputText.trim() ? (
        <div className="warning-tip mt-4 p-3 rounded-lg text-sm border-l-4" style={{ 
          backgroundColor: 'rgba(245, 158, 11, 0.1)', 
          borderColor: '#f59e0b' 
        }}>
          <div className="flex items-start gap-2">
            <span style={{ color: '#f59e0b' }}>⚠️</span>
            <div>
              <div className="font-medium mb-1" style={{ color: 'var(--on-surface)' }}>
                Non-Japanese Text Detected
              </div>
              <div style={{ color: 'var(--on-surface-variant)' }}>
                This analyzer is designed for Japanese text. Please enter text containing hiragana, katakana, or kanji characters for best results.
              </div>
              {detectionResult.suggestions && detectionResult.suggestions.length > 0 && (
                <div className="mt-2 text-xs">
                  <strong>Suggestions:</strong>
                  <ul className="mt-1 space-y-0.5">
                    {detectionResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-1">
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
      ) : (
        <div className="usage-tips mt-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--surface-container-low)' }}>
          <div className="flex items-start gap-2">
            <span style={{ color: 'var(--grammar-verb)' }}>💡</span>
            <div style={{ color: 'var(--on-surface-variant)' }}>
              <strong>Learning Tip:</strong> Start with simple sentences in {learningMode} mode for better understanding.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}