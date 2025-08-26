import { useState, useEffect } from 'react';

/**
 * Hook to check if component is hydrated (client-side)
 * Prevents hydration mismatches by ensuring consistent SSR/client behavior
 */
function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  return isHydrated;
}

/**
 * Hydration-safe localStorage hook for Next.js
 * Prevents hydration mismatches by ensuring consistent SSR/client behavior
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  serializer: {
    parse: (value: string) => T;
    stringify: (value: T) => string;
  } = {
    parse: JSON.parse,
    stringify: JSON.stringify,
  }
): [T, (value: T) => void] {
  const isHydrated = useIsHydrated();
  const [storedValue, setStoredValue] = useState<T>(defaultValue);

  // Sync with localStorage after hydration
  useEffect(() => {
    if (!isHydrated) return;
    
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        const parsedValue = serializer.parse(item);
        setStoredValue(parsedValue);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key, isHydrated, serializer]);

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (isHydrated) {
        localStorage.setItem(key, serializer.stringify(value));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

export function useLocalStorageBoolean(key: string, defaultValue: boolean) {
  return useLocalStorage(key, defaultValue, {
    parse: (value: string) => value === 'true',
    stringify: (value: boolean) => value.toString(),
  });
}

export function useLocalStorageString(key: string, defaultValue: string) {
  return useLocalStorage(key, defaultValue, {
    parse: (value: string) => value,
    stringify: (value: string) => value,
  });
}