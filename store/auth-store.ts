import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoginCredentials } from '@/types';
import { authApiClient } from '@/lib/api-client';

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
          const response = await authApiClient.auth.refreshToken();
          
          if (response.success) {
            set({
              user: response.user,
              isAuthenticated: true,
              error: null,
            });
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (error) {
          // Refresh failed, logout user
          get().logout();
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
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              expiresAt: response.expiresAt,
              isExpiringSoon: response.isExpiringSoon,
              error: null,
            });
            
            // Auto-refresh if expiring soon
            if (response.isExpiringSoon) {
              try {
                await get().refreshSession();
              } catch (error) {
                console.warn('Auto-refresh failed:', error);
              }
            }
          } else {
            throw new Error('Session invalid');
          }
        } catch (error) {
          // Session is invalid, clear auth state
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
