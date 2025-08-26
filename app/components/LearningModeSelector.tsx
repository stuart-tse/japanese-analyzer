'use client';

export type LearningMode = 'beginner' | 'intermediate' | 'advanced';

interface LearningModeSelectorProps {
  selectedMode: LearningMode;
  onModeChange: (mode: LearningMode) => void;
}

export default function LearningModeSelector({ selectedMode, onModeChange }: LearningModeSelectorProps) {
  const modes = [
    { id: 'beginner' as LearningMode, label: '初心者', description: 'Basic analysis' },
    { id: 'intermediate' as LearningMode, label: '中级', description: 'Grammar focus' },
    { id: 'advanced' as LearningMode, label: '高级', description: 'Cultural context' }
  ];

  return (
    <div className="learning-mode-container mb-6">
      <h3 className="text-sm font-medium mb-3 transition-colors duration-200" style={{ color: 'var(--on-surface)' }}>
        Learning Mode
      </h3>
      <div className="mode-selector grid grid-cols-3 gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--surface-container-low)' }}>
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`
              mode-button flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
              ${selectedMode === mode.id 
                ? 'text-white shadow-sm' 
                : 'hover:shadow-sm'
              }
            `}
            style={{
              backgroundColor: selectedMode === mode.id 
                ? 'var(--grammar-verb)' 
                : 'transparent',
              color: selectedMode === mode.id 
                ? 'white' 
                : 'var(--on-surface-variant)',
            }}
          >
            <div className="text-center">
              <div className="font-medium">{mode.label}</div>
              <div className="text-xs opacity-80 mt-0.5">{mode.description}</div>
            </div>
          </button>
        ))}
      </div>
      
      {/* Difficulty indicator */}
      <div className="difficulty-indicator flex items-center gap-2 mt-3 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
        <span>Difficulty:</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-lg ${
                star <= (selectedMode === 'beginner' ? 2 : selectedMode === 'intermediate' ? 3 : 5)
                  ? 'text-red-500'
                  : 'text-gray-300'
              }`}
              style={{ color: star <= (selectedMode === 'beginner' ? 2 : selectedMode === 'intermediate' ? 3 : 5) ? 'var(--grammar-verb)' : 'var(--outline)' }}
            >
              ★
            </span>
          ))}
        </div>
        <span className="ml-2 capitalize">{selectedMode}</span>
      </div>
    </div>
  );
}