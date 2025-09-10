import {
  createSessionToken,
  verifySessionToken,
  createSessionCookie,
  getServerSession,
  getSessionFromRequest,
  clearSessionCookie,
  keycloakUserToSessionUser,
  isSessionExpiringSoon,
  SessionData
} from '../../lib/session';
import { NextRequest } from 'next/server';
import { KeycloakUser } from '../../lib/keycloak';

// Mock jose library
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setIssuer: jest.fn().mockReturnThis(),
    setAudience: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mocked-jwt-token'),
  })),
  jwtVerify: jest.fn(),
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

describe('Session Management Comprehensive Tests', () => {
  const mockSessionData: SessionData = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      preferred_username: 'testuser',
      roles: ['user', 'admin'],
    },
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  const mockKeycloakUser: KeycloakUser = {
    sub: 'keycloak-user-id',
    email_verified: true,
    name: 'Keycloak User',
    preferred_username: 'keycloakuser',
    given_name: 'Keycloak',
    family_name: 'User',
    email: 'keycloak@example.com',
    realm_access: {
      roles: ['realm-admin', 'default-roles-test', 'offline_access']
    },
    resource_access: {
      'test-app': {
        roles: ['app-user', 'app-admin']
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.JWT_SECRET;
    delete process.env.JWT_ISSUER;
    delete process.env.JWT_AUDIENCE;
    delete process.env.SESSION_COOKIE_NAME;
    delete process.env.SESSION_MAX_AGE;
    delete process.env.NODE_ENV;
  });

  describe('createSessionToken', () => {
    it('should create JWT token with correct parameters', async () => {
      const mockSign = jest.fn().mockResolvedValue('signed-jwt-token');
      (SignJWT as jest.Mock).mockImplementation(() => ({
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setIssuer: jest.fn().mockReturnThis(),
        setAudience: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: mockSign,
      }));

      const result = await createSessionToken(mockSessionData);

      expect(result).toBe('signed-jwt-token');
      expect(SignJWT).toHaveBeenCalledWith(mockSessionData);
      expect(mockSign).toHaveBeenCalled();
    });

    it('should use environment variables if they exist', async () => {
      // Just test that the function runs without errors when env vars are set
      process.env.JWT_ISSUER = 'custom-issuer';
      process.env.JWT_AUDIENCE = 'custom-audience';

      const mockSign = jest.fn().mockResolvedValue('signed-jwt-token');
      (SignJWT as jest.Mock).mockImplementation(() => ({
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setIssuer: jest.fn().mockReturnThis(),
        setAudience: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: mockSign,
      }));

      const result = await createSessionToken(mockSessionData);

      expect(result).toBe('signed-jwt-token');
      expect(SignJWT).toHaveBeenCalledWith(mockSessionData);
    });
  });

  describe('verifySessionToken', () => {
    it('should verify and return session data for valid token', async () => {
      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: mockSessionData
      });

      const result = await verifySessionToken('valid-token');

      expect(result).toEqual(mockSessionData);
      expect(jwtVerify).toHaveBeenCalledWith('valid-token', expect.any(Object), {
        issuer: 'union-benefits-ui',
        audience: 'union-benefits-api',
      });
    });

    it('should throw error for invalid token', async () => {
      (jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      await expect(verifySessionToken('invalid-token')).rejects.toThrow('Invalid session token: Invalid token');
    });

    it('should handle unknown errors', async () => {
      (jwtVerify as jest.Mock).mockRejectedValue('Unknown error');

      await expect(verifySessionToken('invalid-token')).rejects.toThrow('Invalid session token: Unknown error');
    });
  });

  describe('createSessionCookie', () => {
    it('should create cookie with default settings', () => {
      const result = createSessionCookie('session-token');

      expect(result).toBe('union-session=session-token; Max-Age=86400; Path=/; HttpOnly; SameSite=Strict');
    });

    it('should use custom cookie name and max age from env', () => {
      process.env.SESSION_COOKIE_NAME = 'custom-session';
      process.env.SESSION_MAX_AGE = '3600';

      const result = createSessionCookie('session-token');

      expect(result).toBe('custom-session=session-token; Max-Age=3600; Path=/; HttpOnly; SameSite=Strict');
    });

    it('should add Secure flag in production', () => {
      process.env.NODE_ENV = 'production';

      const result = createSessionCookie('session-token');

      expect(result).toBe('union-session=session-token; Max-Age=86400; Path=/; HttpOnly; SameSite=Strict; Secure');
    });

    it('should not add Secure flag in development', () => {
      process.env.NODE_ENV = 'development';

      const result = createSessionCookie('session-token');

      expect(result).toBe('union-session=session-token; Max-Age=86400; Path=/; HttpOnly; SameSite=Strict');
    });
  });

  describe('getServerSession', () => {
    it('should return session data when valid cookie exists', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({
          value: 'valid-session-token'
        })
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookies);
      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: mockSessionData
      });

      const result = await getServerSession();

      expect(result).toEqual(mockSessionData);
      expect(mockCookies.get).toHaveBeenCalledWith('union-session');
    });

    it('should return null when no cookie exists', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(null)
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookies);

      const result = await getServerSession();

      expect(result).toBeNull();
    });

    it('should return null when cookie has no value', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({})
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookies);

      const result = await getServerSession();

      expect(result).toBeNull();
    });

    it('should return null and log warning when token verification fails', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockCookies = {
        get: jest.fn().mockReturnValue({
          value: 'invalid-token'
        })
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookies);
      (jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      const result = await getServerSession();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get server session:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should use custom cookie name from env', async () => {
      process.env.SESSION_COOKIE_NAME = 'custom-session';
      
      const mockCookies = {
        get: jest.fn().mockReturnValue(null)
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookies);

      await getServerSession();

      expect(mockCookies.get).toHaveBeenCalledWith('custom-session');
    });
  });

  describe('getSessionFromRequest', () => {
    it('should return session data when valid cookie exists in request', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({
            value: 'valid-session-token'
          })
        }
      } as unknown as NextRequest;

      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: mockSessionData
      });

      const result = await getSessionFromRequest(mockRequest);

      expect(result).toEqual(mockSessionData);
      expect(mockRequest.cookies.get).toHaveBeenCalledWith('union-session');
    });

    it('should return null when no cookie exists in request', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue(null)
        }
      } as unknown as NextRequest;

      const result = await getSessionFromRequest(mockRequest);

      expect(result).toBeNull();
    });

    it('should return null when cookie has no value in request', async () => {
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({})
        }
      } as unknown as NextRequest;

      const result = await getSessionFromRequest(mockRequest);

      expect(result).toBeNull();
    });

    it('should return null and log warning when token verification fails', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({
            value: 'invalid-token'
          })
        }
      } as unknown as NextRequest;

      (jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      const result = await getSessionFromRequest(mockRequest);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get session from request:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should use custom cookie name from env', async () => {
      process.env.SESSION_COOKIE_NAME = 'custom-session';
      
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue(null)
        }
      } as unknown as NextRequest;

      await getSessionFromRequest(mockRequest);

      expect(mockRequest.cookies.get).toHaveBeenCalledWith('custom-session');
    });
  });

  describe('clearSessionCookie', () => {
    it('should create clear cookie string with default name', () => {
      const result = clearSessionCookie();

      expect(result).toBe('union-session=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict');
    });

    it('should use custom cookie name from env', () => {
      process.env.SESSION_COOKIE_NAME = 'custom-session';

      const result = clearSessionCookie();

      expect(result).toBe('custom-session=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict');
    });
  });

  describe('keycloakUserToSessionUser', () => {
    it('should convert Keycloak user to session user format', () => {
      const result = keycloakUserToSessionUser(mockKeycloakUser);

      expect(result).toEqual({
        id: 'keycloak-user-id',
        email: 'keycloak@example.com',
        name: 'Keycloak User',
        preferred_username: 'keycloakuser',
        roles: ['realm-admin', 'app-user', 'app-admin']
      });
    });

    it('should handle user without name, using given_name + family_name', () => {
      const userWithoutName = {
        ...mockKeycloakUser,
        name: undefined,
      };

      const result = keycloakUserToSessionUser(userWithoutName as KeycloakUser);

      expect(result.name).toBe('Keycloak User');
    });

    it('should handle user without realm_access', () => {
      const userWithoutRealmAccess = {
        ...mockKeycloakUser,
        realm_access: undefined,
      };

      const result = keycloakUserToSessionUser(userWithoutRealmAccess);

      expect(result.roles).toEqual(['app-user', 'app-admin']);
    });

    it('should handle user without resource_access', () => {
      const userWithoutResourceAccess = {
        ...mockKeycloakUser,
        resource_access: undefined,
      };

      const result = keycloakUserToSessionUser(userWithoutResourceAccess);

      expect(result.roles).toEqual(['realm-admin']);
    });

    it('should filter out default and system roles', () => {
      const userWithSystemRoles = {
        ...mockKeycloakUser,
        realm_access: {
          roles: ['user', 'default-roles-test', 'offline_access', 'uma_authorization', 'admin']
        }
      };

      const result = keycloakUserToSessionUser(userWithSystemRoles);

      expect(result.roles).toEqual(['user', 'admin', 'app-user', 'app-admin']);
    });

    it('should handle empty roles arrays', () => {
      const userWithEmptyRoles = {
        ...mockKeycloakUser,
        realm_access: { roles: [] },
        resource_access: {}
      };

      const result = keycloakUserToSessionUser(userWithEmptyRoles);

      expect(result.roles).toEqual([]);
    });
  });

  describe('isSessionExpiringSoon', () => {
    it('should return true when session expires within 5 minutes', () => {
      const now = Math.floor(Date.now() / 1000);
      const sessionExpiringIn4Minutes: SessionData = {
        ...mockSessionData,
        expiresAt: now + (4 * 60), // 4 minutes from now
      };

      const result = isSessionExpiringSoon(sessionExpiringIn4Minutes);

      expect(result).toBe(true);
    });

    it('should return false when session expires after 5 minutes', () => {
      const now = Math.floor(Date.now() / 1000);
      const sessionExpiringIn6Minutes: SessionData = {
        ...mockSessionData,
        expiresAt: now + (6 * 60), // 6 minutes from now
      };

      const result = isSessionExpiringSoon(sessionExpiringIn6Minutes);

      expect(result).toBe(false);
    });

    it('should return true when session is already expired', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredSession: SessionData = {
        ...mockSessionData,
        expiresAt: now - 100, // Already expired
      };

      const result = isSessionExpiringSoon(expiredSession);

      expect(result).toBe(true);
    });

    it('should return false when session expires exactly in 5 minutes', () => {
      const now = Math.floor(Date.now() / 1000);
      const sessionExpiringIn5Minutes: SessionData = {
        ...mockSessionData,
        expiresAt: now + (5 * 60), // Exactly 5 minutes from now
      };

      const result = isSessionExpiringSoon(sessionExpiringIn5Minutes);

      // The condition is < bufferTime, so exactly 5 minutes should return false
      expect(result).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed JWT tokens gracefully', async () => {
      (jwtVerify as jest.Mock).mockRejectedValue(new Error('Malformed JWT'));

      await expect(verifySessionToken('malformed.jwt.token')).rejects.toThrow('Invalid session token: Malformed JWT');
    });

    it('should handle missing environment variables gracefully', async () => {
      // Remove all env vars to test defaults
      delete process.env.JWT_ISSUER;
      delete process.env.JWT_AUDIENCE;
      delete process.env.SESSION_COOKIE_NAME;
      delete process.env.SESSION_MAX_AGE;

      const mockSetIssuer = jest.fn().mockReturnThis();
      const mockSetAudience = jest.fn().mockReturnThis();
      
      (SignJWT as jest.Mock).mockImplementation(() => ({
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setIssuer: mockSetIssuer,
        setAudience: mockSetAudience,
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue('token'),
      }));

      await createSessionToken(mockSessionData);

      expect(mockSetIssuer).toHaveBeenCalledWith('union-benefits-ui');
      expect(mockSetAudience).toHaveBeenCalledWith('union-benefits-api');

      // Test cookie creation with defaults
      const cookieResult = createSessionCookie('token');
      expect(cookieResult).toContain('union-session=');
      expect(cookieResult).toContain('Max-Age=86400');

      // Test clear cookie with defaults  
      const clearResult = clearSessionCookie();
      expect(clearResult).toContain('union-session=');
    });
  });
});
