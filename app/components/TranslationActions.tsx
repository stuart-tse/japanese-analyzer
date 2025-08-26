'use client';

import { useState } from 'react';
import { TranslationConfidence } from '../types/translation';
import { synthesizeSpeech } from '../services/api';
import { 
  FaCopy, 
  FaShare, 
  FaVolumeUp, 
  FaDownload, 
  FaBookmark, 
  FaCheck,
  FaSpinner
} from 'react-icons/fa';

interface TranslationActionsProps {
  originalText: string;
  translatedText: string;
  confidence: TranslationConfidence;
  userApiKey?: string;
  isExpanded?: boolean;
  className?: string;
}

export default function TranslationActions({
  originalText,
  translatedText,
  confidence,
  userApiKey,
  isExpanded = false,
  className = ''
}: TranslationActionsProps) {
  const [copiedItem, setCopiedItem] = useState<'original' | 'translation' | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [audioError, setAudioError] = useState<string>('');
  
  const copyToClipboard = async (text: string, type: 'original' | 'translation') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(type);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };
  
  const shareTranslation = async () => {
    const shareData = {
      title: '日语翻译结果',
      text: `原文: ${originalText}\n译文: ${translatedText}\n精度: ${confidence.overall}%`,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying to clipboard
        await copyToClipboard(shareData.text, 'translation');
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };
  
  const playTextToSpeech = async (text: string, isJapanese: boolean = true) => {
    if (isPlayingTTS) return;
    
    setIsPlayingTTS(true);
    setAudioError('');
    
    try {
      const { audio, mimeType } = await synthesizeSpeech(
        text,
        'edge', // Use Edge TTS for better Japanese support
        {
          gender: 'female',
          voice: isJapanese ? 'Kore' : 'XiaoxiaoNeural'
        },
        userApiKey
      );
      
      // Create audio element and play
      const audioElement = new Audio(`data:${mimeType};base64,${audio}`);
      
      audioElement.onended = () => setIsPlayingTTS(false);
      audioElement.onerror = () => {
        setAudioError('播放音频失败');
        setIsPlayingTTS(false);
      };
      
      await audioElement.play();
    } catch (error) {
      console.error('TTS error:', error);
      setAudioError('语音合成失败');
      setIsPlayingTTS(false);
    }
  };
  
  const downloadTranslation = () => {
    const content = `日语原文:\n${originalText}\n\n中文译文:\n${translatedText}\n\n翻译精度: ${confidence.overall}%\n翻译方法: ${confidence.methodology}\n生成时间: ${new Date().toLocaleString('zh-CN')}`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translation_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const saveToHistory = async () => {
    setIsSaving(true);
    
    try {
      const translationHistory = JSON.parse(localStorage.getItem('translationHistory') || '[]');
      const newEntry = {
        id: Date.now().toString(),
        original: originalText,
        translated: translatedText,
        confidence: confidence.overall,
        timestamp: new Date().toISOString(),
        methodology: confidence.methodology
      };
      
      translationHistory.unshift(newEntry);
      // Keep only the last 50 translations
      if (translationHistory.length > 50) {
        translationHistory.splice(50);
      }
      
      localStorage.setItem('translationHistory', JSON.stringify(translationHistory));
      
      setTimeout(() => setIsSaving(false), 1000);
    } catch (error) {
      console.error('Failed to save translation:', error);
      setIsSaving(false);
    }
  };
  
  const actionButtons = [
    {
      id: 'copy-original',
      icon: copiedItem === 'original' ? FaCheck : FaCopy,
      label: '复制原文',
      action: () => copyToClipboard(originalText, 'original'),
      color: copiedItem === 'original' ? 'var(--grammar-verb)' : 'var(--on-surface-variant)',
      disabled: !originalText
    },
    {
      id: 'copy-translation',
      icon: copiedItem === 'translation' ? FaCheck : FaCopy,
      label: '复制译文',
      action: () => copyToClipboard(translatedText, 'translation'),
      color: copiedItem === 'translation' ? 'var(--grammar-verb)' : 'var(--on-surface-variant)',
      disabled: !translatedText
    },
    {
      id: 'tts-original',
      icon: isPlayingTTS ? FaSpinner : FaVolumeUp,
      label: '播放原文',
      action: () => playTextToSpeech(originalText, true),
      color: 'var(--grammar-noun)',
      disabled: !originalText || isPlayingTTS,
      spin: isPlayingTTS
    },
    {
      id: 'tts-translation',
      icon: isPlayingTTS ? FaSpinner : FaVolumeUp,
      label: '播放译文',
      action: () => playTextToSpeech(translatedText, false),
      color: 'var(--grammar-adjective)',
      disabled: !translatedText || isPlayingTTS,
      spin: isPlayingTTS
    }
  ];
  
  const additionalActions = [
    {
      id: 'share',
      icon: FaShare,
      label: '分享翻译',
      action: shareTranslation,
      color: 'var(--grammar-auxiliary)',
      disabled: !translatedText
    },
    {
      id: 'download',
      icon: FaDownload,
      label: '下载翻译',
      action: downloadTranslation,
      color: 'var(--grammar-adverb)',
      disabled: !translatedText
    },
    {
      id: 'save',
      icon: isSaving ? FaSpinner : FaBookmark,
      label: '保存历史',
      action: saveToHistory,
      color: 'var(--grammar-particle)',
      disabled: !translatedText || isSaving,
      spin: isSaving
    }
  ];
  
  return (
    <div className={`translation-actions ${className}`}>
      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="flex flex-wrap gap-2 mb-3">
          {actionButtons.map((button) => {
            const IconComponent = button.icon;
            return (
              <button
                key={button.id}
                onClick={button.action}
                disabled={button.disabled}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200 border
                  ${button.disabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:shadow-sm active:scale-95'
                  }
                `}
                style={{
                  backgroundColor: 'var(--surface-container)',
                  borderColor: button.color,
                  color: button.color
                }}
                title={button.label}
              >
                <IconComponent 
                  className={`w-4 h-4 ${button.spin ? 'animate-spin' : ''}`} 
                />
                {isExpanded && (
                  <span>{button.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Additional Actions (shown when expanded) */}
      {isExpanded && (
        <div className="additional-actions">
          <div className="flex flex-wrap gap-2">
            {additionalActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.action}
                  disabled={action.disabled}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 border
                    ${action.disabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:shadow-sm active:scale-95'
                    }
                  `}
                  style={{
                    backgroundColor: `${action.color}15`,
                    borderColor: action.color,
                    color: action.color
                  }}
                  title={action.label}
                >
                  <IconComponent 
                    className={`w-4 h-4 ${action.spin ? 'animate-spin' : ''}`} 
                  />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Audio Error Display */}
      {audioError && (
        <div className="mt-2 p-2 rounded text-xs" 
             style={{
               backgroundColor: 'var(--error-container)',
               color: 'var(--on-error-container)'
             }}>
          {audioError}
        </div>
      )}
      
      {/* Success Feedback */}
      {(copiedItem || isSaving) && (
        <div className="mt-2 p-2 rounded text-xs" 
             style={{
               backgroundColor: 'var(--grammar-verb)15',
               color: 'var(--grammar-verb)'
             }}>
          {copiedItem ? '已复制到剪贴板' : '已保存到历史记录'}
        </div>
      )}
    </div>
  );
}