'use client';

import { AnalysisMode } from './AnalysisViewport';

interface AnalysisModeOption {
  id: AnalysisMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface DesktopAnalysisTabsProps {
  analysisMode: AnalysisMode;
  onAnalysisModeChange: (mode: AnalysisMode) => void;
  analysisModes: AnalysisModeOption[];
}

export default function DesktopAnalysisTabs({
  analysisMode,
  onAnalysisModeChange,
  analysisModes
}: DesktopAnalysisTabsProps) {
  return (
    <div className="hidden xl:grid grid-cols-4 gap-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
      {analysisModes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onAnalysisModeChange(mode.id)}
          className={`
            desktop-analysis-tab group rounded-lg transition-all duration-300 ease-out shadow-md relative
            flex items-center justify-start p-4 text-sm font-medium
            ${analysisMode === mode.id 
              ? 'text-white shadow-xl' 
              : 'hover:shadow-xl hover:-translate-y-1'
            }
          `}
          style={{
            backgroundColor: analysisMode === mode.id 
              ? 'var(--grammar-verb)' 
              : 'var(--surface-container)',
            color: analysisMode === mode.id 
              ? 'white' 
              : 'var(--on-surface-variant)',
            minHeight: '80px',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: analysisMode === mode.id 
              ? 'var(--grammar-verb)' 
              : 'transparent',
            boxShadow: analysisMode === mode.id 
              ? '0 10px 25px rgba(196, 30, 58, 0.3), 0 4px 10px rgba(0, 0, 0, 0.1)' 
              : '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
            transform: analysisMode === mode.id ? 'scale(1.02)' : 'scale(1)'
          }}
        >
          <div className={`
            tab-icon transition-all duration-300 ease-out flex-shrink-0 mr-3
            ${analysisMode === mode.id ? 'transform scale-110' : 'group-hover:scale-110 group-hover:rotate-6'}
          `}>
            {mode.icon}
          </div>
          <div className="tab-content text-left">
            <div className="font-semibold transition-all duration-300 ease-out">{mode.label}</div>
            <div className="text-xs opacity-80 mt-1 transition-all duration-300 ease-out group-hover:opacity-100">{mode.description}</div>
          </div>
        </button>
      ))}
      
      <style jsx>{`
        @media (min-width: 1024px) and (max-width: 1399px) and (orientation: landscape) {
          .desktop-analysis-tab {
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            padding: 12px !important;
          }
          
          .tab-icon {
            margin-right: 0 !important;
            margin-bottom: 8px !important;
          }
          
          .tab-content {
            text-align: center !important;
          }
          
          .tab-content div:first-child {
            font-size: 12px !important;
          }
          
          .tab-content div:last-child {
            margin-top: 2px !important;
          }
        }
      `}</style>
    </div>
  );
}