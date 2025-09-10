import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoginCredentials } from '@/types';
import { authApiClient } from '@/lib/api-client';
import { authTokenManager } from '@/lib/auth-token-manager';

interface SessionUser {
  id: string;
  email: string;
  name: string;
  preferred_username: string;
  roles: string[];
}

interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  expiresAt: number | null;
  isExpiringSoon: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setUser: (user: SessionUser) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  checkAuthAndRefresh: () => Promise<boolean>; // Returns true if user is authenticated after refresh attempt
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      expiresAt: null,
      isExpiringSoon: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApiClient.auth.login(credentials);
          
          if (response.success) {
            // Update token manager by fetching token
            try {
              const tokenResp = await fetch('/api/auth/token', { credentials: 'include' });
              if (tokenResp.ok) {
                const data = await tokenResp.json();
                authTokenManager.setToken(data.accessToken);
              }
            } catch (e) {
              console.warn('Unable to set token after login');
            }

            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error('Login failed');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
            expiresAt: null,
            isExpiringSoon: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authApiClient.auth.logout();
        } catch (error) {
          // Ignore logout errors - we're logging out anyway
          console.warn('Logout API call failed:', error);
        }
        
        // Clear token manager
        authTokenManager.clearToken();

        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          expiresAt: null,
          isExpiringSoon: false,
        });
      },

      refreshSession: async () => {
        try {
          set({ isLoading: true });
          const response = await authApiClient.auth.refreshToken();
          
          if (response.success) {
            // Update token manager by fetching token
            try {
              const tokenResp = await fetch('/api/auth/token', { credentials: 'include' });
              if (tokenResp.ok) {
                const data = await tokenResp.json();
                authTokenManager.setToken(data.accessToken);
              }
            } catch (e) {
              console.warn('Unable to set token after refresh');
            }
            
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              expiresAt: response.expiresAt,
              isExpiringSoon: response.isExpiringSoon,
              error: null,
            });
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (error) {
          console.error('[AUTH_STORE] Token refresh failed:', error);
          set({ isLoading: false });
          
          // Don't automatically logout - let caller decide what to do
          throw error;
        }
      },

      setUser: (user: SessionUser) => {
        set({ user });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true });
          
          const response = await authApiClient.auth.me();
          
          if (response.success) {
            // Update token manager by fetching token
            try {
              const tokenResp = await fetch('/api/auth/token', { credentials: 'include' });
              if (tokenResp.ok) {
                const data = await tokenResp.json();
                authTokenManager.setToken(data.accessToken);
              }
            } catch (e) {
              console.warn('Unable to set token during auth check');
            }

            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              expiresAt: response.expiresAt,
              isExpiringSoon: response.isExpiringSoon,
              error: null,
            });
          } else {
            throw new Error('Session invalid');
          }
        } catch (error) {
          // Session is invalid, clear auth state
          // Clear token manager
          authTokenManager.clearToken();

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            expiresAt: null,
            isExpiringSoon: false,
            error: null,
          });
        }
      },

      checkAuthAndRefresh: async () => {
        console.log('[AUTH_STORE] checkAuthAndRefresh called');
        try {
          set({ isLoading: true });
          
          const response = await authApiClient.auth.me();
          
          if (response.success) {
            console.log('[AUTH_STORE] Valid session found');
            // Update token manager by fetching token
            try {
              const tokenResp = await fetch('/api/auth/token', { credentials: 'include' });
              if (tokenResp.ok) {
                const data = await tokenResp.json();
                authTokenManager.setToken(data.accessToken);
              }
            } catch (e) {
              console.warn('Unable to set token during auth check');
            }

            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              expiresAt: response.expiresAt,
              isExpiringSoon: response.isExpiringSoon,
              error: null,
            });
            
            // If token is expiring soon or expired, try to refresh
            const now = Math.floor(Date.now() / 1000);
            const isExpired = response.expiresAt <= now;
            const isExpiringSoon = response.expiresAt - now < 600; // 10 minutes
            
            if (isExpired || isExpiringSoon) {
              console.log(`[AUTH_STORE] Token needs refresh - expired: ${isExpired}, expiring soon: ${isExpiringSoon}`);
              try {
                await get().refreshSession();
                console.log('[AUTH_STORE] Token refresh successful');
                return true;
              } catch (error) {
                console.warn('[AUTH_STORE] Token refresh failed:', error);
                // If refresh failed and token is expired, return false
                if (isExpired) {
                  return false;
                }
                // If just expiring soon, still consider authenticated
                return true;
              }
            }
            
            return true;
          } else {
            console.log('[AUTH_STORE] No valid session found, checking for expired session to refresh');
            // Try to refresh with potentially expired session
            try {
              await get().refreshSession();
              console.log('[AUTH_STORE] Refresh successful for expired session');
              return true;
            } catch (error) {
              console.log('[AUTH_STORE] Refresh failed for expired session:', error);
              // Clear auth state
              authTokenManager.clearToken();
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                expiresAt: null,
                isExpiringSoon: false,
                error: null,
              });
              return false;
            }
          }
        } catch (error) {
          console.log('[AUTH_STORE] checkAuthAndRefresh failed:', error);
          // Try refresh as last resort
          try {
            await get().refreshSession();
            console.log('[AUTH_STORE] Last resort refresh successful');
            return true;
          } catch (refreshError) {
            console.log('[AUTH_STORE] Last resort refresh failed:', refreshError);
            // Clear auth state
            authTokenManager.clearToken();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              expiresAt: null,
              isExpiringSoon: false,
              error: null,
            });
            return false;
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
