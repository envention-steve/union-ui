import { AuthTokenManager, authTokenManager } from '@/lib/auth-token-manager';
import { authApiClient } from '@/lib/api-client';

// Mock the api-client
jest.mock('@/lib/api-client', () => ({
  authApiClient: {
    auth: {
      me: jest.fn(),
      refreshToken: jest.fn(),
    }
  }
}));

// Mock fetch
global.fetch = jest.fn();

describe('AuthTokenManager', () => {
  let manager: AuthTokenManager;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    
    // Get a fresh instance for testing
    manager = AuthTokenManager.getInstance();
    
    // Clear any cached token
    manager.clearToken();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = AuthTokenManager.getInstance();
      const instance2 = AuthTokenManager.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(authTokenManager);
    });
  });

  describe('setToken and getCachedToken', () => {
    it('should set and get cached token', () => {
      const testToken = 'test-access-token';
      
      manager.setToken(testToken);
      expect(manager.getCachedToken()).toBe(testToken);
    });

    it('should handle null token', () => {
      manager.setToken(null);
      expect(manager.getCachedToken()).toBeNull();
    });
  });

  describe('clearToken', () => {
    it('should clear the cached token', () => {
      manager.setToken('test-token');
      expect(manager.getCachedToken()).toBe('test-token');
      
      manager.clearToken();
      expect(manager.getCachedToken()).toBeNull();
    });
  });

  describe('getCurrentToken', () => {
    it('should get token when auth.me() succeeds', async () => {
      // Mock successful auth.me response
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({
        success: true,
        user: { id: '1', email: 'test@example.com' }
      });

      // Mock successful token endpoint response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: 'test-access-token' })
      });

      const token = await manager.getCurrentToken();
      
      expect(token).toBe('test-access-token');
      expect(authApiClient.auth.me).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/token', {
        credentials: 'include'
      });
    });

    it('should return null when auth.me() fails', async () => {
      // Mock failed auth.me response
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Unauthorized'
      });

      const token = await manager.getCurrentToken();
      
      expect(token).toBeNull();
      expect(authApiClient.auth.me).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle auth.me() throwing an error', async () => {
      // Mock auth.me throwing an error
      (authApiClient.auth.me as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Mock console.warn to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const token = await manager.getCurrentToken();
      
      expect(token).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get current token:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('getTokenFromSession (private method tested through getCurrentToken)', () => {
    it('should handle successful token endpoint response', async () => {
      // Mock successful auth.me response
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({ success: true });

      // Mock successful token endpoint response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: 'session-token' })
      });

      const token = await manager.getCurrentToken();
      
      expect(token).toBe('session-token');
    });

    it('should handle token endpoint returning no accessToken', async () => {
      // Mock successful auth.me response
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({ success: true });

      // Mock token endpoint response without accessToken
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'No token available' })
      });

      const token = await manager.getCurrentToken();
      
      expect(token).toBeNull();
    });

    it('should handle non-ok response from token endpoint', async () => {
      // Mock successful auth.me response
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({ success: true });

      // Mock non-ok token endpoint response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401
      });

      const token = await manager.getCurrentToken();
      
      expect(token).toBeNull();
    });

    it('should handle fetch throwing an error', async () => {
      // Mock successful auth.me response
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({ success: true });

      // Mock fetch throwing an error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Mock console.warn to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const token = await manager.getCurrentToken();
      
      expect(token).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get token from session:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('refreshTokenIfNeeded', () => {
    it('should refresh token successfully and return new token', async () => {
      // Mock successful refresh response
      (authApiClient.auth.refreshToken as jest.Mock).mockResolvedValue({
        success: true,
        token: 'new-refresh-token'
      });

      // Mock successful auth.me response after refresh
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({ success: true });

      // Mock successful token endpoint response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: 'refreshed-token' })
      });

      const token = await manager.refreshTokenIfNeeded();
      
      expect(token).toBe('refreshed-token');
      expect(authApiClient.auth.refreshToken).toHaveBeenCalled();
    });

    it('should return null when refresh fails', async () => {
      // Mock failed refresh response
      (authApiClient.auth.refreshToken as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Refresh failed'
      });

      const token = await manager.refreshTokenIfNeeded();
      
      expect(token).toBeNull();
      expect(authApiClient.auth.refreshToken).toHaveBeenCalled();
    });

    it('should handle refresh throwing an error', async () => {
      // Mock refresh throwing an error
      (authApiClient.auth.refreshToken as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Mock console.warn to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const token = await manager.refreshTokenIfNeeded();
      
      expect(token).toBeNull();
      expect(manager.getCachedToken()).toBeNull(); // Should clear token on error
      expect(consoleSpy).toHaveBeenCalledWith('Token refresh failed:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should clear cached token on refresh error', async () => {
      // Set a cached token first
      manager.setToken('existing-token');
      expect(manager.getCachedToken()).toBe('existing-token');

      // Mock refresh throwing an error
      (authApiClient.auth.refreshToken as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Mock console.warn to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await manager.refreshTokenIfNeeded();
      
      expect(manager.getCachedToken()).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });

  describe('error handling edge cases', () => {
    it('should handle getCurrentToken with JSON parsing error', async () => {
      // Mock successful auth.me response
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({ success: true });

      // Mock token endpoint with invalid JSON
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      // Mock console.warn to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const token = await manager.getCurrentToken();
      
      expect(token).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get token from session:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle multiple concurrent getCurrentToken calls', async () => {
      // Mock successful responses
      (authApiClient.auth.me as jest.Mock).mockResolvedValue({ success: true });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: 'concurrent-token' })
      });

      // Make multiple concurrent calls
      const promises = [
        manager.getCurrentToken(),
        manager.getCurrentToken(),
        manager.getCurrentToken()
      ];

      const results = await Promise.all(promises);
      
      // All should return the same token
      expect(results).toEqual(['concurrent-token', 'concurrent-token', 'concurrent-token']);
      
      // API should be called multiple times (no caching at this level)
      expect(authApiClient.auth.me).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});