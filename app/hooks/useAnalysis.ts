import { useState, useEffect, useCallback } from 'react';
import { TokenData, streamAnalyzeSentence, analyzeSentence } from '../services/api';
import { useStreamParser } from './useStreamParser';

interface UseAnalysisReturn {
  analyzedTokens: TokenData[];
  isAnalyzing: boolean;
  analysisError: string;
  currentSentence: string;
  streamContent: string;
  isJsonParseError: boolean;
  selectedTokenIndex: number | null;
  selectedToken: TokenData | null;
  translationTrigger: number;
  showFurigana: boolean;
  handleAnalyze: (text: string, userApiKey?: string, userApiUrl?: string, useStream?: boolean) => Promise<void>;
  setSelectedTokenIndex: (index: number | null) => void;
  setSelectedToken: (token: TokenData | null) => void;
  setShowFurigana: (show: boolean) => void;
  clearAnalysis: () => void;
}

export function useAnalysis(): UseAnalysisReturn {
  const [analyzedTokens, setAnalyzedTokens] = useState<TokenData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [currentSentence, setCurrentSentence] = useState('');
  const [streamContent, setStreamContent] = useState('');
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [translationTrigger, setTranslationTrigger] = useState(0);
  const [showFurigana, setShowFurigana] = useState(true);
  
  const { isJsonParseError, parseStreamContent, clearParsedContent } = useStreamParser();

  useEffect(() => {
    if (streamContent && isAnalyzing) {
      const tokens = parseStreamContent(streamContent);
      if (tokens.length > 0) {
        setAnalyzedTokens(tokens);
      } else if (streamContent.includes('{') && streamContent.includes('"word":')) {
        // 有内容但解析失败，可能是不完整的JSON
      }
    }
  }, [streamContent, isAnalyzing, parseStreamContent]);

  const handleAnalyze = useCallback(async (
    text: string,
    userApiKey?: string,
    userApiUrl?: string,
    useStream: boolean = true
  ) => {
    if (!text) return;

    setIsAnalyzing(true);
    setAnalysisError('');
    setCurrentSentence(text);
    setTranslationTrigger(Date.now());
    setStreamContent('');
    setAnalyzedTokens([]);
    clearParsedContent();
    setSelectedTokenIndex(null);
    setSelectedToken(null);
    
    try {
      if (useStream) {
        streamAnalyzeSentence(
          text,
          (chunk, isDone) => {
            setStreamContent(chunk);
            if (isDone) {
              setIsAnalyzing(false);
              const tokens = parseStreamContent(chunk);
              if (tokens.length > 0) {
                setAnalyzedTokens(tokens);
              }
            }
          },
          (error) => {
            console.error('Stream analysis error:', error);
            setAnalysisError(error.message || '流式解析错误');
            setIsAnalyzing(false);
          },
          userApiKey,
          userApiUrl
        );
      } else {
        const tokens = await analyzeSentence(text, userApiKey, userApiUrl);
        setAnalyzedTokens(tokens);
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError(error instanceof Error ? error.message : '未知错误');
      setAnalyzedTokens([]);
      setIsAnalyzing(false);
    }
  }, [parseStreamContent, clearParsedContent]);

  const clearAnalysis = useCallback(() => {
    setAnalyzedTokens([]);
    setCurrentSentence('');
    setStreamContent('');
    setAnalysisError('');
    setSelectedTokenIndex(null);
    setSelectedToken(null);
    clearParsedContent();
  }, [clearParsedContent]);

  return {
    analyzedTokens,
    isAnalyzing,
    analysisError,
    currentSentence,
    streamContent,
    isJsonParseError,
    selectedTokenIndex,
    selectedToken,
    translationTrigger,
    showFurigana,
    handleAnalyze,
    setSelectedTokenIndex,
    setSelectedToken,
    setShowFurigana,
    clearAnalysis,
  };
}