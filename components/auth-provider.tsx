'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, refreshSession, isAuthenticated, expiresAt, isExpiringSoon } = useAuthStore();
  const router = useRouter();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Set up automatic session refresh when expiring soon
  useEffect(() => {
    if (isAuthenticated && expiresAt) {
      if (refreshIntervalRef.current) {
        clearTimeout(refreshIntervalRef.current);
      }

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      
      // If token expires in less than 10 minutes, refresh now
      if (timeUntilExpiry <= 600) {
        refreshSession().catch(() => {
          router.push('/login?error=session-expired');
        });
      }
      // Otherwise, schedule refresh for 5 minutes before expiration
      else if (timeUntilExpiry > 600) {
        const timeUntilRefresh = (timeUntilExpiry - 300) * 1000; // 5 minutes before
        
        refreshIntervalRef.current = setTimeout(async () => {
          try {
            await refreshSession();
          } catch (error) {
            router.push('/login?error=session-expired');
          }
        }, timeUntilRefresh);
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearTimeout(refreshIntervalRef.current);
      }
    };
  }, [isAuthenticated, expiresAt, refreshSession, router]);

  // Set up periodic session validation (every 5 minutes)
  useEffect(() => {
    if (isAuthenticated) {
      const checkInterval = 5 * 60 * 1000; // 5 minutes
      
      sessionCheckRef.current = setInterval(async () => {
        try {
          await checkAuth();
        } catch (error) {
          console.error('Session check failed:', error);
        }
      }, checkInterval);
    }

    return () => {
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current);
      }
    };
  }, [isAuthenticated, checkAuth]);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearTimeout(refreshIntervalRef.current);
      }
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current);
      }
    };
  }, []);

  return <>{children}</>;
}
