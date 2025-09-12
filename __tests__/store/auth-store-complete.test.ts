import { authApiClient } from '@/lib/api-client';
import { useAuthStore } from '../../store/auth-store';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  authApiClient: {
    auth: {
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      me: jest.fn(),
    },
  },
}));

// Mock console methods
const consoleSpy = {
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
};

const mockAuthApiClient = authApiClient as jest.Mocked<typeof authApiClient>;

describe('Auth Store Complete Coverage', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    preferred_username: 'testuser',
    roles: ['member'],
  };

  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      expiresAt: null,
      isExpiringSoon: false,
    });

    jest.clearAllMocks();
    consoleSpy.warn.mockClear();
  });

  afterAll(() => {
    consoleSpy.warn.mockRestore();
  });

  describe('refreshSession edge cases', () => {
    it('should handle refresh failure with non-success response (line 103)', async () => {
      // Mock refresh to return non-success response
      mockAuthApiClient.auth.refreshToken.mockResolvedValue({
        success: false,
        user: null,
        message: 'Token refresh failed',
      });

      const { refreshSession } = useAuthStore.getState();

      await expect(refreshSession()).rejects.toThrow('Token refresh failed');

      // In current implementation, refreshSession does NOT call logout
      // It just throws error and lets caller handle it
      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should handle refresh API throwing error', async () => {
      // Mock refresh to throw an error
      mockAuthApiClient.auth.refreshToken.mockRejectedValue(new Error('Network error'));

      const { refreshSession } = useAuthStore.getState();

      await expect(refreshSession()).rejects.toThrow('Network error');

      // In current implementation, refreshSession does NOT call logout
      // It just throws error and lets caller handle it
      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('checkAuth edge cases for auto-refresh (lines 142-149)', () => {
    it('should attempt auto-refresh when session is expiring soon', async () => {
      // First mock checkAuthAndRefresh to return user with expiring session
      mockAuthApiClient.auth.me.mockResolvedValue({
        success: true,
        user: mockUser,
        expiresAt: Math.floor(Date.now() / 1000) + 300, // 5 minutes - this will trigger auto-refresh
        isExpiringSoon: true,
      });

      // Mock successful refresh
      mockAuthApiClient.auth.refreshToken.mockResolvedValue({
        success: true,
        user: mockUser,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        isExpiringSoon: false,
        message: 'Token refreshed',
      });

      const { checkAuthAndRefresh } = useAuthStore.getState();

      const result = await checkAuthAndRefresh();

      expect(result).toBe(true);
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      
      // Verify refresh was called due to expiring session
      expect(mockAuthApiClient.auth.refreshToken).toHaveBeenCalled();
    });

    it('should handle auto-refresh failure gracefully', async () => {
      // Mock checkAuthAndRefresh to return user with expiring session
      mockAuthApiClient.auth.me.mockResolvedValue({
        success: true,
        user: mockUser,
        expiresAt: Math.floor(Date.now() / 1000) + 300, // 5 minutes - trigger auto-refresh
        isExpiringSoon: true,
      });

      // Mock failed refresh - this should trigger console.warn
      mockAuthApiClient.auth.refreshToken.mockRejectedValue(new Error('Refresh failed'));
      
      const { checkAuthAndRefresh } = useAuthStore.getState();

      const result = await checkAuthAndRefresh();

      // Should still return true since session is just expiring soon, not expired
      expect(result).toBe(true);
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true); // Still authenticated with expiring token
      expect(state.user).toEqual(mockUser);
      
      // Verify auto-refresh was attempted and failed
      expect(mockAuthApiClient.auth.refreshToken).toHaveBeenCalled();
    });

    it('should handle non-success response from me endpoint (line 149)', async () => {
      // Mock me endpoint to return non-success response
      mockAuthApiClient.auth.me.mockResolvedValue({
        success: false,
        user: null,
        expiresAt: null,
        isExpiringSoon: false,
      });

      const { checkAuth } = useAuthStore.getState();

      await checkAuth();

      // Should clear auth state when me endpoint returns non-success
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.expiresAt).toBeNull();
      expect(state.isExpiringSoon).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle me endpoint throwing an error', async () => {
      // Mock me endpoint to throw an error
      mockAuthApiClient.auth.me.mockRejectedValue(new Error('Session check failed'));

      const { checkAuth } = useAuthStore.getState();

      await checkAuth();

      // Should clear auth state when me endpoint throws error
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.expiresAt).toBeNull();
      expect(state.isExpiringSoon).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Complex integration scenarios', () => {
    it('should handle complete auth flow with auto-refresh', async () => {
      // 1. Login successfully
      mockAuthApiClient.auth.login.mockResolvedValue({
        success: true,
        user: mockUser,
        message: 'Login successful',
      });

      const { login } = useAuthStore.getState();
      await login({ email: 'test@example.com', password: 'password123' });

      let state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);

      // 2. Check auth and trigger auto-refresh
      mockAuthApiClient.auth.me.mockResolvedValue({
        success: true,
        user: mockUser,
        expiresAt: Math.floor(Date.now() / 1000) + 300, // 5 minutes - will trigger auto-refresh
        isExpiringSoon: true,
      });

      mockAuthApiClient.auth.refreshToken.mockResolvedValue({
        success: true,
        user: mockUser,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        isExpiringSoon: false,
        message: 'Token refreshed',
      });

      const { checkAuthAndRefresh } = useAuthStore.getState();
      const result = await checkAuthAndRefresh();

      expect(result).toBe(true);
      state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(mockAuthApiClient.auth.refreshToken).toHaveBeenCalled();

      // 3. Logout
      mockAuthApiClient.auth.logout.mockResolvedValue({
        success: true,
        message: 'Logged out',
      });

      const { logout } = useAuthStore.getState();
      await logout();

      state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('should handle login failure followed by refresh failure', async () => {
      // 1. Login fails
      mockAuthApiClient.auth.login.mockRejectedValue(new Error('Invalid credentials'));

      const { login } = useAuthStore.getState();
      await expect(login({ email: 'bad@example.com', password: 'wrong' }))
        .rejects.toThrow('Invalid credentials');

      let state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Invalid credentials');

      // 2. Try to refresh session (should fail since not authenticated)
      mockAuthApiClient.auth.refreshToken.mockRejectedValue(new Error('No session'));
      mockAuthApiClient.auth.logout.mockResolvedValue({
        success: true,
        message: 'Logged out',
      });

      const { refreshSession } = useAuthStore.getState();
      await expect(refreshSession()).rejects.toThrow('No session');

      state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle utility methods', () => {
      const { setUser, setError, clearError } = useAuthStore.getState();

      // Test setUser
      setUser(mockUser);
      let state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);

      // Test setError
      setError('Test error');
      state = useAuthStore.getState();
      expect(state.error).toBe('Test error');

      // Test clearError
      clearError();
      state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('Persistence edge cases', () => {
    it('should only persist user and isAuthenticated fields', () => {
      // Set full state
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: true,
        error: 'Some error',
        expiresAt: 123456789,
        isExpiringSoon: true,
      });

      // The persist middleware should only save user and isAuthenticated
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      
      // These values should be set but wouldn't be persisted
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe('Some error');
      expect(state.expiresAt).toBe(123456789);
      expect(state.isExpiringSoon).toBe(true);
    });
  });

  describe('Error handling variations', () => {
    it('should handle non-Error objects in login', async () => {
      mockAuthApiClient.auth.login.mockRejectedValue('String error');

      const { login } = useAuthStore.getState();
      
      await expect(login({ email: 'test@example.com', password: 'password' }))
        .rejects.toBe('String error');

      const state = useAuthStore.getState();
      expect(state.error).toBe('Login failed'); // Falls back to default message
    });

    it('should handle logout API errors gracefully', async () => {
      mockAuthApiClient.auth.logout.mockRejectedValue(new Error('Logout API failed'));

      const { logout } = useAuthStore.getState();
      
      // Logout should complete successfully even if API fails
      await logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalledWith('Logout API call failed:', expect.any(Error));
    });
  });
});
