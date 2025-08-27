'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

// Japanese Color Theme Interface with improved dark theme palette
interface JapaneseColorTheme {
  noun: string;      // Sakura Cream (#E9D5CA) for dark theme
  verb: string;      // Bamboo Green (#9FD6A8) for dark theme
  adjective: string; // Indigo Sky (#A8C8E1) for dark theme
  particle: string;  // Sunset Peach (#F4C2A1) for dark theme
  adverb: string;    // Cedar Gold (#C5A572) for dark theme
  auxiliary: string; // Wisteria Purple (#D8A8D1) for dark theme
  other: string;     // Mist Gray (#9BB5C7) for dark theme
  background: string; // Charcoal Mist (#161B22) for dark theme
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

  // Get Japanese color theme based on CSS custom properties
  // This ensures colors are consistent with CSS and automatically switch with theme
  const japaneseColors: JapaneseColorTheme = {
    noun: 'var(--grammar-noun)',
    verb: 'var(--grammar-verb)',
    adjective: 'var(--grammar-adjective)',
    particle: 'var(--grammar-particle)',
    adverb: 'var(--grammar-adverb)',
    auxiliary: 'var(--grammar-auxiliary)',
    other: 'var(--grammar-other)',
    background: 'var(--grammar-background)',
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