import { useLocalStorageString, useLocalStorageBoolean } from './useLocalStorage';
import { DEFAULT_API_URL } from '../services/api';
import { LearningMode } from '../components/LearningModeSelector';

interface UseSettingsReturn {
  userApiKey: string;
  userApiUrl: string;
  useStream: boolean;
  ttsProvider: 'edge' | 'gemini';
  learningMode: LearningMode;
  setUserApiKey: (key: string) => void;
  setUserApiUrl: (url: string) => void;
  setUseStream: (enabled: boolean) => void;
  setTtsProvider: (provider: 'edge' | 'gemini') => void;
  setLearningMode: (mode: LearningMode) => void;
  saveSettings: (apiKey: string, apiUrl: string, streamEnabled: boolean) => void;
}

export function useSettings(): UseSettingsReturn {
  const [userApiKey, setUserApiKey] = useLocalStorageString('userApiKey', '');
  const [userApiUrl, setUserApiUrl] = useLocalStorageString('userApiUrl', DEFAULT_API_URL);
  const [useStream, setUseStream] = useLocalStorageBoolean('useStream', true);
  const [ttsProvider, setTtsProvider] = useLocalStorageString('ttsProvider', 'edge') as ['edge' | 'gemini', (provider: 'edge' | 'gemini') => void];
  const [learningMode, setLearningMode] = useLocalStorageString('learningMode', 'beginner') as [LearningMode, (mode: LearningMode) => void];

  const saveSettings = (apiKey: string, apiUrl: string, streamEnabled: boolean) => {
    setUserApiKey(apiKey);
    setUserApiUrl(apiUrl);
    setUseStream(streamEnabled);
  };

  return {
    userApiKey,
    userApiUrl,
    useStream,
    ttsProvider,
    learningMode,
    setUserApiKey,
    setUserApiUrl,
    setUseStream,
    setTtsProvider,
    setLearningMode,
    saveSettings,
  };
}