export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function debouncedUpdate<T>(
  updateFn: (value: T, isComplete: boolean) => void,
  debounceTime: number = 16
) {
  let updateTimeout: NodeJS.Timeout | null = null;
  
  return (content: T, isComplete: boolean) => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    
    if (isComplete) {
      updateFn(content, true);
      return;
    }
    
    updateTimeout = setTimeout(() => {
      updateFn(content, false);
    }, debounceTime);
  };
}