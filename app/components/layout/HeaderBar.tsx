'use client';

import React from 'react';

interface HeaderBarProps {
  onSettingsClick: () => void;
}

export default function HeaderBar({ onSettingsClick }: HeaderBarProps) {
  return (
    <header className="header-bar lg:col-span-3 flex items-center justify-between px-4 transition-colors duration-200" style={{ backgroundColor: 'var(--grammar-verb)' }}>
      <h1 className="text-white text-lg font-medium">
        Japanese Sentence Analyzer (日本語文章解析器)
      </h1>
      <div className="flex items-center gap-4 text-white text-sm">
        <button 
          onClick={onSettingsClick}
          className="hover:bg-white/10 px-3 py-1 rounded transition-colors duration-200"
        >
          Settings
        </button>
      </div>
    </header>
  );
}