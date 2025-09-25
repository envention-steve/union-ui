'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
// using native scrolling for the main content area so the page has a single scrollbar

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, checkAuthAndRefresh } = useAuthStore();
  const router = useRouter();
  const hasTriedRefresh = useRef(false);

  // Initial auth check on mount
  useEffect(() => {
    async function handleAuth() {
      console.log('[DASHBOARD_LAYOUT] Initial auth check...');
      try {
        const isAuth = await checkAuthAndRefresh();
        if (!isAuth) {
          console.log('[DASHBOARD_LAYOUT] Initial auth failed, redirecting to login');
          router.push('/login');
        } else {
          // Reset the refresh flag on successful auth
          hasTriedRefresh.current = false;
        }
      } catch (error) {
        console.error('[DASHBOARD_LAYOUT] Initial auth check error:', error);
        router.push('/login');
      }
    }

    handleAuth();
  }, [checkAuthAndRefresh, router]);

  // Last chance refresh when isAuthenticated becomes false
  useEffect(() => {
    async function handleAuthLoss() {
      // Only attempt refresh if:
      // 1. User is not authenticated
      // 2. Not currently loading
      // 3. Haven't already tried refreshing (prevent infinite loop)
      if (!isAuthenticated && !isLoading && !hasTriedRefresh.current) {
        console.log('[DASHBOARD_LAYOUT] Auth lost, attempting last chance refresh...');
        hasTriedRefresh.current = true;
        
        try {
          const isAuth = await checkAuthAndRefresh();
          if (isAuth) {
            console.log('[DASHBOARD_LAYOUT] Last chance refresh successful!');
            // Don't reset hasTriedRefresh here - let the initial auth effect handle it
          } else {
            console.log('[DASHBOARD_LAYOUT] Last chance refresh failed, redirecting to login');
            router.push('/login');
          }
        } catch (error) {
          console.error('[DASHBOARD_LAYOUT] Last chance refresh error:', error);
          router.push('/login');
        }
      }
    }

    handleAuthLoss();
  }, [isAuthenticated, isLoading, checkAuthAndRefresh, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-union-700"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    // keep the overall page from creating a second scrollbar — the <main>
    // area should be the single scrolling region. `overflow-hidden` on
    // the outer container prevents the body from also scrolling.
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto">
          <div className="h-full p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
