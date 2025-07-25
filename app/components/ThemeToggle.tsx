'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, actualTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return '亮色模式';
      case 'dark': return '暗色模式';
      case 'system': return '跟随系统';
      default: return '跟随系统';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={`切换主题 - ${getThemeLabel()}`}
        className="material-icon-button material-ripple flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-white/90 dark:bg-gray-800/90 text-on-surface-variant dark:text-on-surface-variant-dark border border-outline dark:border-outline-dark rounded-full shadow-sm backdrop-blur-sm hover:bg-surface-variant hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-600/30 active:scale-95 transition-all duration-200 ease-out"
      >
        <i className={`fas ${actualTheme === 'dark' ? 'fa-moon' : 'fa-sun'} text-base sm:text-lg`}></i>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-surface dark:bg-surface-dark border border-outline dark:border-outline-dark rounded-xl shadow-lg py-1 z-10 backdrop-blur-sm">
          <button
            onClick={() => {
              setTheme('light');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-variant dark:hover:bg-surface-variant-dark focus:outline-none focus:bg-surface-variant focus:dark:bg-surface-variant-dark rounded-lg mx-1 transition-all duration-200 ${
              theme === 'light' 
                ? 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/20' 
                : 'text-on-surface dark:text-on-surface-dark'
            }`}
          >
            <i className="fas fa-sun text-base"></i>
            <span className="text-sm font-medium">亮色模式</span>
          </button>
          
          <button
            onClick={() => {
              setTheme('dark');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-variant dark:hover:bg-surface-variant-dark focus:outline-none focus:bg-surface-variant focus:dark:bg-surface-variant-dark rounded-lg mx-1 transition-all duration-200 ${
              theme === 'dark' 
                ? 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/20' 
                : 'text-on-surface dark:text-on-surface-dark'
            }`}
          >
            <i className="fas fa-moon text-base"></i>
            <span className="text-sm font-medium">暗色模式</span>
          </button>
          
          <button
            onClick={() => {
              setTheme('system');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-variant dark:hover:bg-surface-variant-dark focus:outline-none focus:bg-surface-variant focus:dark:bg-surface-variant-dark rounded-lg mx-1 transition-all duration-200 ${
              theme === 'system' 
                ? 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/20' 
                : 'text-on-surface dark:text-on-surface-dark'
            }`}
          >
            <i className="fas fa-desktop text-base"></i>
            <span className="text-sm font-medium">跟随系统</span>
          </button>
          
          {theme === 'system' && (
            <div className="px-4 py-2 text-xs text-on-surface-variant dark:text-on-surface-variant-dark border-t border-outline dark:border-outline-dark mt-1">
              当前: {actualTheme === 'dark' ? '暗色' : '亮色'}模式
            </div>
          )}
        </div>
      )}
    </div>
  );
} 