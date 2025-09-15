import { useAuthStore } from '@/store/auth-store';
import { authApiClient } from '@/lib/api-client';
import { authTokenManager } from '@/lib/auth-token-manager';

// Mock dependencies
jest.mock('@/lib/api-client', () => ({
  authApiClient: {
    auth: {
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      me: jest.fn(),
    }
  }
}));

jest.mock('@/lib/auth-token-manager', () => ({
  authTokenManager: {
    setToken: jest.fn(),
    clearToken: jest.fn(),
  }
}));

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock console methods
const consoleMock = {
  warn: jest.spyOn(console, 'warn').mockImplementation(),
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
};

describe('Auth Store - Final Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    
    // Clear the store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      expiresAt: null,
      isExpiringSoon: false,
    });
  });

  afterAll(() => {
    consoleMock.warn.mockRestore();
    consoleMock.log.mockRestore();
    consoleMock.error.mockRestore();
  });

  describe('login token fetch error handling', () => {
    it('should handle token fetch failure after successful login', async () => {
      const store = useAuthStore.getState();
      
      (authApiClient.auth.login as jest.Mock).mockResolvedValue({
        success: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' }
      });

      // Mock fetch to fail when getting token
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await store.login({ email: 'test@example.com', password: 'password' });

      expect(consoleMock.warn).toHaveBeenCalledWith('Unable to set token after login');
      expect(authTokenManager.setToken).not.toHaveBeenCalled();
      
      // Should still succeed the login despite token fetch failure
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual({ id: '1', name: 'Test User', email: 'test@example.com' });
    });

    it('should handle token fetch returning non-ok response after login', async () => {
      const store = useAuthStore.getState();
      
      (authApiClient.auth.login as jest.Mock).mockResolvedValue({
        success: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' }
      });

      // Mock fetch to return non-ok response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401
      });

      await store.login({ email: 'test@example.com', password: 'password' });

      // When fetch returns non-ok response, it doesn't throw error, so no warning is logged
      // Just verify token is not set
      expect(authTokenManager.setToken).not.toHaveBeenCalled();
      
      // Should still succeed the login despite token fetch failure
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual({ id: '1', name: 'Test User', email: 'test@example.com' });
    });
  });

  describe('refreshSession token fetch error handling', () => {
    it('should handle token fetch failure after successful refresh', async () => {
      const store = useAuthStore.getState();
      
      (authApiClient.auth.refreshToken as jest.Mock).mockResolvedValue({
        success: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expiresAt: Date.now() + 3600000,
        isExpiringSoon: false
      });

      // Mock fetch to fail when getting token
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Token fetch failed'));

      await store.refreshSession();

      expect(consoleMock.warn).toHaveBeenCalledWith('Unable to set token after refresh');
      expect(authTokenManager.setToken).not.toHaveBeenCalled();
      
      // Should still succeed the refresh despite token fetch failure
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('checkAuth token fetch error handling', () => {
    it('should handle token fetch failure after successful auth check', async () => {
      const store = useAuthStore.getState();
      
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({
        success: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expiresAt: Date.now() + 3600000,
        isExpiringSoon: false
      });

      // Mock fetch to fail when getting token
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Token fetch failed'));

      await store.checkAuth();

      expect(consoleMock.warn).toHaveBeenCalledWith('Unable to set token during auth check');
      expect(authTokenManager.setToken).not.toHaveBeenCalled();
      
      // Should still succeed the auth check despite token fetch failure
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('checkAuthAndRefresh token fetch error handling', () => {
    it('should handle token fetch failure during checkAuthAndRefresh', async () => {
      const store = useAuthStore.getState();
      
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({
        success: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        isExpiringSoon: false
      });

      // Mock fetch to fail when getting token
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Token fetch failed'));

      const result = await store.checkAuthAndRefresh();

      expect(consoleMock.log).toHaveBeenCalledWith('[AUTH_STORE] checkAuthAndRefresh called');
      expect(consoleMock.log).toHaveBeenCalledWith('[AUTH_STORE] Valid session found');
      expect(consoleMock.warn).toHaveBeenCalledWith('Unable to set token during auth check');
      expect(result).toBe(true);
    });

    it('should handle expired token scenario', async () => {
      const store = useAuthStore.getState();
      
      // Mock auth.me to return expired token
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({
        success: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expiresAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
        isExpiringSoon: true
      });

      // Mock successful token fetch
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: 'test-token' })
      });

      // Mock successful refresh
      (authApiClient.auth.refreshToken as jest.Mock).mockResolvedValue({
        success: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        isExpiringSoon: false
      });

      const result = await store.checkAuthAndRefresh();

      expect(consoleMock.log).toHaveBeenCalledWith('[AUTH_STORE] Valid session found');
      expect(consoleMock.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[AUTH_STORE\] Token needs refresh - expired: true, expiring soon: true/)
      );
      expect(consoleMock.log).toHaveBeenCalledWith('[AUTH_STORE] Token refresh successful');
      expect(result).toBe(true);
    });

    it('should handle expiring soon token scenario', async () => {
      const store = useAuthStore.getState();
      
      // Mock auth.me to return token expiring soon
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({
        success: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expiresAt: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
        isExpiringSoon: true
      });

      // Mock successful token fetch
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: 'test-token' })
      });

      // Mock successful refresh
      (authApiClient.auth.refreshToken as jest.Mock).mockResolvedValue({
        success: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        isExpiringSoon: false
      });

      const result = await store.checkAuthAndRefresh();

      expect(consoleMock.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[AUTH_STORE\] Token needs refresh - expired: false, expiring soon: true/)
      );
      expect(result).toBe(true);
    });

    it('should handle expired token with failed refresh', async () => {
      const store = useAuthStore.getState();
      
      // Mock auth.me to return expired token
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({
        success: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expiresAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
        isExpiringSoon: true
      });

      // Mock successful token fetch
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: 'test-token' })
      });

      // Mock failed refresh
      (authApiClient.auth.refreshToken as jest.Mock).mockRejectedValue(new Error('Refresh failed'));

      const result = await store.checkAuthAndRefresh();

      expect(consoleMock.warn).toHaveBeenCalledWith('[AUTH_STORE] Token refresh failed:', expect.any(Error));
      expect(result).toBe(false); // Should return false for expired token with failed refresh
    });

    it('should handle expiring soon token with failed refresh', async () => {
      const store = useAuthStore.getState();
      
      // Mock auth.me to return token expiring soon (but not expired)
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({
        success: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expiresAt: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
        isExpiringSoon: true
      });

      // Mock successful token fetch
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: 'test-token' })
      });

      // Mock failed refresh
      (authApiClient.auth.refreshToken as jest.Mock).mockRejectedValue(new Error('Refresh failed'));

      const result = await store.checkAuthAndRefresh();

      expect(consoleMock.warn).toHaveBeenCalledWith('[AUTH_STORE] Token refresh failed:', expect.any(Error));
      expect(result).toBe(true); // Should return true for expiring soon (not expired) token even with failed refresh
    });

    it('should handle no valid session with successful refresh', async () => {
      const store = useAuthStore.getState();
      
      // Mock auth.me to fail
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Session invalid'
      });

      // Mock successful refresh
      (authApiClient.auth.refreshToken as jest.Mock).mockResolvedValue({
        success: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        isExpiringSoon: false
      });

      // Mock successful token fetch for refresh
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: 'refreshed-token' })
      });

      const result = await store.checkAuthAndRefresh();

      expect(consoleMock.log).toHaveBeenCalledWith('[AUTH_STORE] No valid session found, checking for expired session to refresh');
      expect(consoleMock.log).toHaveBeenCalledWith('[AUTH_STORE] Refresh successful for expired session');
      expect(result).toBe(true);
    });

    it('should handle no valid session with failed refresh', async () => {
      const store = useAuthStore.getState();
      
      // Mock auth.me to fail
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Session invalid'
      });

      // Mock failed refresh
      (authApiClient.auth.refreshToken as jest.Mock).mockRejectedValue(new Error('Refresh failed'));

      const result = await store.checkAuthAndRefresh();

      expect(consoleMock.log).toHaveBeenCalledWith('[AUTH_STORE] No valid session found, checking for expired session to refresh');
      expect(consoleMock.log).toHaveBeenCalledWith('[AUTH_STORE] Refresh failed for expired session:', expect.any(Error));
      expect(result).toBe(false);
      
      // Should clear auth state
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(authTokenManager.clearToken).toHaveBeenCalled();
    });

    it('should handle auth.me throwing error with successful last resort refresh', async () => {
      const store = useAuthStore.getState();
      
      // Mock auth.me to throw error
      (authApiClient.auth.me as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Mock successful refresh
      (authApiClient.auth.refreshToken as jest.Mock).mockResolvedValue({
        success: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        isExpiringSoon: false
      });

      // Mock successful token fetch for refresh
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: 'refreshed-token' })
      });

      const result = await store.checkAuthAndRefresh();

      expect(consoleMock.log).toHaveBeenCalledWith('[AUTH_STORE] checkAuthAndRefresh failed:', expect.any(Error));
      expect(consoleMock.log).toHaveBeenCalledWith('[AUTH_STORE] Last resort refresh successful');
      expect(result).toBe(true);
    });

    it('should handle auth.me throwing error with failed last resort refresh', async () => {
      const store = useAuthStore.getState();
      
      // Mock auth.me to throw error
      (authApiClient.auth.me as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Mock failed refresh
      (authApiClient.auth.refreshToken as jest.Mock).mockRejectedValue(new Error('Refresh failed'));

      const result = await store.checkAuthAndRefresh();

      expect(consoleMock.log).toHaveBeenCalledWith('[AUTH_STORE] checkAuthAndRefresh failed:', expect.any(Error));
      expect(consoleMock.log).toHaveBeenCalledWith('[AUTH_STORE] Last resort refresh failed:', expect.any(Error));
      expect(result).toBe(false);
      
      // Should clear auth state
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(authTokenManager.clearToken).toHaveBeenCalled();
    });
  });
});