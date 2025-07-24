'use client';

import ThemeToggle from './ThemeToggle';

interface TopToolbarProps {
  onSettingsClick?: () => void;
}

export default function TopToolbar({ onSettingsClick }: TopToolbarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-end items-center p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* GitHub 按钮 */}
        <a
          href="https://github.com/cokice/japanese-analyzer"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-white/90 dark:bg-gray-800/90 text-on-surface-variant dark:text-on-surface-variant-dark border border-outline dark:border-outline-dark rounded-full shadow-sm backdrop-blur-sm hover:bg-surface-variant hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-600/30 active:scale-95 transition-all duration-200 ease-out"
          title="GitHub 仓库"
        >
          <i className="fab fa-github text-base sm:text-lg"></i>
        </a>

        {/* 设置按钮 */}
        <button
          onClick={onSettingsClick}
          className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-white/90 dark:bg-gray-800/90 text-primary-600 dark:text-primary-400 border border-outline dark:border-outline-dark rounded-full shadow-sm backdrop-blur-sm hover:bg-surface-variant hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-600/30 active:scale-95 transition-all duration-200 ease-out"
          title="设置"
        >
          <i className="fas fa-cog text-base sm:text-lg"></i>
        </button>

        {/* 主题切换按钮 */}
        <div className="relative">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}