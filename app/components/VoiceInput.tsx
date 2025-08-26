'use client';

import { useState, useCallback, useEffect } from 'react';
import { FaMicrophone } from 'react-icons/fa';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface VoiceInputProps {
  onTranscriptReady: (transcript: string) => void;
  language?: string;
  continuous?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function VoiceInput({
  onTranscriptReady,
  language = 'ja',
  continuous = false,
  disabled = false,
  className = ''
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  // Voice input handlers for hold-to-speak functionality
  const handleVoiceStart = useCallback(() => {
    if (!browserSupportsSpeechRecognition || !isMicrophoneAvailable || disabled) {
      return;
    }
    
    setIsRecording(true);
    resetTranscript();
    SpeechRecognition.startListening({
      language,
      continuous
    });
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable, disabled, language, continuous, resetTranscript]);

  const handleVoiceEnd = useCallback(() => {
    // Always stop listening and reset recording state when user releases button
    SpeechRecognition.stopListening();
    setIsRecording(false);
  }, []);

  // Update parent component when transcript changes
  useEffect(() => {
    if (transcript && transcript.trim() !== '' && !listening) {
      // Only update when listening has stopped (speech recognition finished)
      onTranscriptReady(transcript);
      setIsRecording(false);
    }
  }, [transcript, listening, onTranscriptReady]);

  // Render different states
  if (!browserSupportsSpeechRecognition) {
    return (
      <div className={`text-center flex flex-col items-center justify-center ${className}`}>
        <div className="flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 opacity-50"
             style={{ 
               borderColor: 'var(--outline)',
               backgroundColor: 'var(--surface-container)'
             }}>
          <FaMicrophone className="text-4xl mb-2" style={{ color: 'var(--on-surface-variant)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--on-surface-variant)' }}>
            Not supported
          </span>
        </div>
        <p className="text-center mt-4 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
          Your browser doesn't support speech recognition
        </p>
      </div>
    );
  }

  if (!isMicrophoneAvailable) {
    return (
      <div className={`text-center flex flex-col justify-center items-center ${className}`}>
        <div className="flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 opacity-50"
             style={{ 
               borderColor: 'var(--outline)',
               backgroundColor: 'var(--surface-container)'
             }}>
          <FaMicrophone className="text-4xl mb-2" style={{ color: 'var(--on-surface-variant)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--on-surface-variant)' }}>
            No access
          </span>
        </div>
        <p className="text-center mt-4 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
          Microphone access denied. Please allow microphone access.
        </p>
      </div>
    );
  }

  return (
    <div className={`text-center flex flex-col justify-center items-center ${className}`}>
      <button
        onMouseDown={handleVoiceStart}
        onMouseUp={handleVoiceEnd}
        onMouseLeave={handleVoiceEnd}
        onTouchStart={handleVoiceStart}
        onTouchEnd={handleVoiceEnd}
        disabled={disabled}
        className={`flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 transition-all duration-200 select-none ${
          isRecording || listening ? 'scale-110 shadow-lg animate-pulse' : 'hover:shadow-lg'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        style={{ 
          borderColor: isRecording || listening ? '#ef4444' : 'var(--grammar-verb)',
          backgroundColor: isRecording || listening ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface-container)'
        }}
      >
        <FaMicrophone 
          className={`text-4xl mb-2 transition-all duration-200 ${isRecording || listening ? 'text-red-500' : ''}`} 
          style={{ color: isRecording || listening ? '#ef4444' : 'var(--grammar-verb)' }} 
        />
        <span className="text-xs font-medium" style={{ 
          color: isRecording || listening ? '#ef4444' : 'var(--on-surface)' 
        }}>
          {isRecording || listening ? 'Listening...' : 'Hold to speak'}
        </span>
      </button>
      <p className="text-center mt-4 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
        {transcript && transcript.trim() !== '' ? (
          <span>Last recognized: "{transcript}"</span>
        ) : (
          `Hold the microphone button and speak in ${language === 'ja' ? 'Japanese' : 'your language'}`
        )}
      </p>
    </div>
  );
}