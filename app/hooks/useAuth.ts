import { useState, useEffect } from 'react';
import { useLocalStorageBoolean } from './useLocalStorage';

interface UseAuthReturn {
  isAuthenticated: boolean;
  requiresAuth: boolean;
  authError: string;
  login: (password: string) => Promise<void>;
  setAuthError: (error: string) => void;
}

export function useAuth(): UseAuthReturn {
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useLocalStorageBoolean('isAuthenticated', false);

  useEffect(() => {
    const checkAuthRequirement = async () => {
      try {
        const response = await fetch('/api/auth');
        const data = await response.json();
        setRequiresAuth(data.requiresAuth);
        
        if (!data.requiresAuth) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('检查认证状态失败:', error);
        setRequiresAuth(false);
        setIsAuthenticated(true);
      }
    };
    
    checkAuthRequirement();
  }, [setIsAuthenticated]);

  const login = async (password: string) => {
    try {
      setAuthError('');
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
      } else {
        setAuthError(data.message || '验证失败');
      }
    } catch (error) {
      console.error('验证过程中出错:', error);
      setAuthError('验证过程中发生错误，请重试');
    }
  };

  return {
    isAuthenticated,
    requiresAuth,
    authError,
    login,
    setAuthError,
  };
}