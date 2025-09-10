'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth } = useAuthStore();

  // Check auth status on mount - that's it!
  // Layout components will handle refresh logic
  useEffect(() => {
    checkAuth().catch((error) => {
      console.warn('[AUTH_PROVIDER] Initial auth check failed:', error);
    });
  }, [checkAuth]);

  return <>{children}</>;
}
