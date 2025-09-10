// Import setup first to ensure globals are available
import '../../../__tests__/setup/api-routes-setup.js';

// Mock external dependencies before importing routes
jest.mock('../../../lib/session', () => ({
  createSessionToken: jest.fn(),
  createSessionCookie: jest.fn(),
  keycloakUserToSessionUser: jest.fn(),
  getServerSession: jest.fn(),
  isSessionExpiringSoon: jest.fn(),
  clearSessionCookie: jest.fn(),
  getServerSession: jest.fn(),
  removeSession: jest.fn(),
  getSessionFromRequest: jest.fn(),
  verifySession: jest.fn(),
}));

jest.mock('../../../lib/keycloak', () => ({
  keycloakClient: {
    authenticateUser: jest.fn(),
    validateToken: jest.fn(),
    refreshToken: jest.fn(),
    logoutUser: jest.fn(),
    getUserInfo: jest.fn(),
  },
  KeycloakClient: jest.fn().mockImplementation(() => ({
    authenticateUser: jest.fn(),
    validateToken: jest.fn(),
    refreshToken: jest.fn(),
    logoutUser: jest.fn(),
    getUserInfo: jest.fn(),
  })),
}));

jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

// Now import the API routes and mocked functions
import { POST as LoginPOST } from '../../../app/api/auth/login/route';
import { POST as LogoutPOST } from '../../../app/api/auth/logout/route';
import { POST as RefreshPOST } from '../../../app/api/auth/refresh/route';
import { 
  createSessionToken, 
  createSessionCookie, 
  keycloakUserToSessionUser, 
  getServerSession,
  isSessionExpiringSoon,
  clearSessionCookie
} from '../../../lib/session';
import { keycloakClient } from '../../../lib/keycloak';

describe('Auth API Routes Basic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should handle successful login', async () => {
      const mockKeycloakUser = {
        sub: '123',
        email: 'test@example.com',
        name: 'Test User',
        preferred_username: 'testuser',
        given_name: 'Test',
        family_name: 'User',
        email_verified: true,
        realm_access: {
          roles: ['user'],
        },
      };

      const mockTokenResponse = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        'not-before-policy': 0,
        session_state: 'session-state',
        scope: 'openid profile email',
        refresh_expires_in: 1800,
      };

      const mockSessionUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['user'],
      };

      // Mock the keycloak client methods
      (keycloakClient.authenticateUser as jest.Mock).mockResolvedValue(mockTokenResponse);
      (keycloakClient.validateToken as jest.Mock).mockResolvedValue(mockKeycloakUser);
      (keycloakUserToSessionUser as jest.Mock).mockReturnValue(mockSessionUser);
      (createSessionToken as jest.Mock).mockResolvedValue('session-token');
      (createSessionCookie as jest.Mock).mockReturnValue('session=session-token; Path=/; HttpOnly');

      // Create a proper request with JSON body
      const requestBody = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json',
        },
      });
      
      // Override the json method to return our mock data
      mockRequest.json = jest.fn().mockResolvedValue(requestBody);

      const response = await LoginPOST(mockRequest);
      
      // Verify the API calls were made correctly
      expect(response).toBeDefined();
      expect(keycloakClient.authenticateUser).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(keycloakClient.validateToken).toHaveBeenCalledWith('access-token');
      expect(keycloakUserToSessionUser).toHaveBeenCalledWith(mockKeycloakUser);
      expect(createSessionToken).toHaveBeenCalled();
      expect(createSessionCookie).toHaveBeenCalledWith('session-token');
    });

    it('should handle login failure with invalid credentials', async () => {
      (keycloakClient.authenticateUser as jest.Mock).mockRejectedValue(new Error('Authentication failed'));

      const requestBody = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      const mockRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      
      mockRequest.json = jest.fn().mockResolvedValue(requestBody);

      const response = await LoginPOST(mockRequest);
      
      expect(response).toBeDefined();
      expect(keycloakClient.authenticateUser).toHaveBeenCalledWith('test@example.com', 'wrong-password');
      // validateToken should not have been called due to the authentication error
      expect(keycloakClient.validateToken).not.toHaveBeenCalled();
      expect(createSessionToken).not.toHaveBeenCalled();
    });

    it('should handle missing credentials', async () => {
      const requestBody = {}; // Empty body

      const mockRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      
      mockRequest.json = jest.fn().mockResolvedValue(requestBody);

      const response = await LoginPOST(mockRequest);
      
      expect(response).toBeDefined();
      // Should not attempt to authenticate with missing credentials
      expect(keycloakClient.authenticateUser).not.toHaveBeenCalled();
      expect(createSessionToken).not.toHaveBeenCalled();
    });
  });

  // Basic test for one more route to verify our approach works
  describe('GET /api/auth/me', () => {
    it('should check for session', async () => {
      // Import the route handler
      const { GET: MeGET } = require('../../../app/api/auth/me/route');
      
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const mockRequest = new Request('http://localhost/api/auth/me', {
        method: 'GET',
      });

      const response = await MeGET(mockRequest);
      
      expect(response).toBeDefined();
      expect(getServerSession).toHaveBeenCalled(); // Called without arguments
    });

    it('should return user data when session exists', async () => {
      const { GET: MeGET } = require('../../../app/api/auth/me/route');
      
      const mockSession = {
        user: { id: '123', email: 'test@example.com', name: 'Test User' },
        accessToken: 'token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (isSessionExpiringSoon as jest.Mock).mockReturnValue(false);

      const mockRequest = new Request('http://localhost/api/auth/me', {
        method: 'GET',
      });

      const response = await MeGET(mockRequest);
      
      expect(response).toBeDefined();
      expect(getServerSession).toHaveBeenCalled();
      expect(isSessionExpiringSoon).toHaveBeenCalledWith(mockSession);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should handle successful logout with session', async () => {
      const mockSession = {
        user: { id: '123', email: 'test@example.com' },
        refreshToken: 'refresh-token',
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (keycloakClient.logoutUser as jest.Mock).mockResolvedValue(undefined);
      (clearSessionCookie as jest.Mock).mockReturnValue('session=; Path=/; HttpOnly; Max-Age=0');

      const mockRequest = new Request('http://localhost/api/auth/logout', {
        method: 'POST',
      });

      const response = await LogoutPOST(mockRequest);
      
      expect(response).toBeDefined();
      expect(getServerSession).toHaveBeenCalled();
      expect(keycloakClient.logoutUser).toHaveBeenCalledWith('refresh-token');
      expect(clearSessionCookie).toHaveBeenCalled();
    });

    it('should handle logout without session', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      (clearSessionCookie as jest.Mock).mockReturnValue('session=; Path=/; HttpOnly; Max-Age=0');

      const mockRequest = new Request('http://localhost/api/auth/logout', {
        method: 'POST',
      });

      const response = await LogoutPOST(mockRequest);
      
      expect(response).toBeDefined();
      expect(getServerSession).toHaveBeenCalled();
      expect(keycloakClient.logoutUser).not.toHaveBeenCalled();
      expect(clearSessionCookie).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should handle successful token refresh', async () => {
      const mockSession = {
        user: { id: '123', email: 'test@example.com', name: 'Test User' },
        refreshToken: 'refresh-token',
      };

      const mockNewTokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        'not-before-policy': 0,
        session_state: 'new-session-state',
        scope: 'openid profile email',
        refresh_expires_in: 1800,
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (keycloakClient.refreshToken as jest.Mock).mockResolvedValue(mockNewTokens);
      (createSessionToken as jest.Mock).mockResolvedValue('new-session-token');
      (createSessionCookie as jest.Mock).mockReturnValue('session=new-session-token; Path=/; HttpOnly');

      const mockRequest = new Request('http://localhost/api/auth/refresh', {
        method: 'POST',
      });

      const response = await RefreshPOST(mockRequest);
      
      expect(response).toBeDefined();
      expect(getServerSession).toHaveBeenCalled();
      expect(keycloakClient.refreshToken).toHaveBeenCalledWith('refresh-token');
      expect(createSessionToken).toHaveBeenCalled();
      expect(createSessionCookie).toHaveBeenCalledWith('new-session-token');
    });

    it('should handle refresh failure', async () => {
      const mockSession = {
        user: { id: '123' },
        refreshToken: 'invalid-refresh-token',
      };

      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (keycloakClient.refreshToken as jest.Mock).mockRejectedValue(new Error('Token refresh failed'));

      const mockRequest = new Request('http://localhost/api/auth/refresh', {
        method: 'POST',
      });

      const response = await RefreshPOST(mockRequest);
      
      expect(response).toBeDefined();
      expect(keycloakClient.refreshToken).toHaveBeenCalledWith('invalid-refresh-token');
      // Refresh route doesn't clear cookies on failure, just returns 401
    });

    it('should handle missing session', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const mockRequest = new Request('http://localhost/api/auth/refresh', {
        method: 'POST',
      });

      const response = await RefreshPOST(mockRequest);
      
      expect(response).toBeDefined();
      expect(getServerSession).toHaveBeenCalled();
      expect(keycloakClient.refreshToken).not.toHaveBeenCalled();
    });
  });
});
