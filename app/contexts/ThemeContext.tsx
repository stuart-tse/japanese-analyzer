'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

// Japanese Color Theme Interface
interface JapaneseColorTheme {
  noun: string;
  verb: string;
  adjective: string;
  particle: string;
  adverb: string;
  auxiliary: string;
  other: string;
  background: string;
}

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  japaneseColors: JapaneseColorTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // 从本地存储加载主题设置
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const updateActualTheme = () => {
      if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setActualTheme(isDark ? 'dark' : 'light');
      } else {
        setActualTheme(theme as 'light' | 'dark');
      }
    };

    updateActualTheme();

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        updateActualTheme();
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  useEffect(() => {
    // 应用主题到document
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(actualTheme);
  }, [actualTheme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Get Japanese color theme based on current theme
  const japaneseColors: JapaneseColorTheme = {
    noun: actualTheme === 'dark' ? '#E5E7EB' : '#42433B',        // Light gray for dark mode, dark charcoal for light
    verb: actualTheme === 'dark' ? '#FF6B4A' : '#DF3307',        // Lighter red for dark mode, primary red for light
    adjective: actualTheme === 'dark' ? '#D4C4B0' : '#8F7E74',   // Lighter brown for dark mode, warm brown for light
    particle: actualTheme === 'dark' ? '#D4C4B0' : '#8F7E74',    // Same as adjective
    adverb: actualTheme === 'dark' ? '#B0C4DE' : '#9FAEB3',      // Lighter blue-gray for dark mode
    auxiliary: actualTheme === 'dark' ? '#FF6B4A' : '#DF3307',   // Same as verb
    other: actualTheme === 'dark' ? '#B0C4DE' : '#9FAEB3',       // Same as adverb
    background: actualTheme === 'dark' ? '#2B1D33' : '#DAC8C0',  // Dark purple for dark mode, light beige for light
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme: handleSetTheme, japaneseColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme必须在ThemeProvider内部使用');
  }
  return context;
}

// Hook for getting Japanese grammar colors
export function useJapaneseColors(): JapaneseColorTheme {
  const { japaneseColors } = useTheme();
  return japaneseColors;
} 