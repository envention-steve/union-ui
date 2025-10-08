import { NextRequest } from 'next/server';

// Mock jose library to avoid ES module issues
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setIssuer: jest.fn().mockReturnThis(),
    setAudience: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock.jwt.token'),
  })),
  jwtVerify: jest.fn().mockImplementation((token, _secret) => {
    if (token === 'invalid-token') {
      throw new Error('Invalid token');
    }
    return Promise.resolve({
      payload: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          preferred_username: 'testuser',
          roles: ['member', 'user'],
        },
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      },
    });
  }),
}));

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
} from '../../../lib/session';

// Mock dependencies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock console methods
import { cookies } from 'next/headers';

const mockCookies = cookies as jest.MockedFunction<typeof cookies>;

type CookieRecord = { value: string } | undefined;

type MockCookieStore = {
  get: jest.Mock<CookieRecord, [string]>;
};

const createMockCookieStore = (value?: string): MockCookieStore => ({
  get: jest.fn<CookieRecord, [string]>().mockReturnValue(
    value !== undefined ? { value } : undefined,
  ),
});

const resolveCookiesWith = (store: MockCookieStore) =>
  mockCookies.mockResolvedValue(
    store as unknown as ReturnType<typeof cookies>,
  );

type MockRequest = {
  cookies: {
    get: jest.Mock<CookieRecord, [string]>;
  };
} & Partial<NextRequest>;

const createMockRequest = (value?: string): NextRequest => ({
  cookies: {
    get: jest.fn<CookieRecord, [string]>().mockReturnValue(
      value !== undefined ? { value } : undefined,
    ),
  },
} as unknown as NextRequest);

const consoleSpy = {
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
};

// Mock environment variables
const originalEnv = process.env;

describe('Session Enhanced Tests', () => {
  const mockSessionData: SessionData = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      preferred_username: 'testuser',
      roles: ['member', 'user'],
    },
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
    expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.warn.mockClear();
    
    // Reset environment variables
    process.env = { 
      ...originalEnv,
      JWT_SECRET: 'test-secret-key-that-is-long-enough-for-hs256',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
    consoleSpy.warn.mockRestore();
  });

  describe('getServerSession', () => {
    it('should return null when no session cookie exists', async () => {
      const mockCookieStore = createMockCookieStore();
      resolveCookiesWith(mockCookieStore);

      const result = await getServerSession();

      expect(result).toBeNull();
      expect(mockCookieStore.get).toHaveBeenCalledWith('union-session');
    });

    it('should return null when session cookie has no value', async () => {
      const mockCookieStore = createMockCookieStore('');
      resolveCookiesWith(mockCookieStore);

      const result = await getServerSession();

      expect(result).toBeNull();
    });

    it('should return session data for valid session token', async () => {
      const sessionToken = await createSessionToken(mockSessionData);
      const mockCookieStore = createMockCookieStore(sessionToken);
      resolveCookiesWith(mockCookieStore);

      const result = await getServerSession();

      expect(result).toEqual(mockSessionData);
    });

    it('should return null and log warning for invalid session token', async () => {
      const mockCookieStore = createMockCookieStore('invalid-token');
      resolveCookiesWith(mockCookieStore);

      const result = await getServerSession();

      expect(result).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Failed to get server session:',
        expect.any(Error)
      );
    });

    it('should use custom cookie name from environment', async () => {
      process.env.SESSION_COOKIE_NAME = 'custom-session';
      
      const mockCookieStore = createMockCookieStore();
      resolveCookiesWith(mockCookieStore);

      await getServerSession();

      expect(mockCookieStore.get).toHaveBeenCalledWith('custom-session');
    });

    it('should handle cookies() throwing an error', async () => {
      mockCookies.mockRejectedValue(new Error('Cookies unavailable'));

      const result = await getServerSession();

      expect(result).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Failed to get server session:',
        expect.any(Error)
      );
    });
  });

  describe('getSessionFromRequest', () => {
    it('should return null when no session cookie exists in request', async () => {
      const mockRequest = createMockRequest();

      const result = await getSessionFromRequest(mockRequest);

      expect(result).toBeNull();
      expect(mockRequest.cookies.get).toHaveBeenCalledWith('union-session');
    });

    it('should return null when session cookie has no value', async () => {
      const mockRequest = createMockRequest('');

      const result = await getSessionFromRequest(mockRequest);

      expect(result).toBeNull();
    });

    it('should return session data for valid session token', async () => {
      const sessionToken = await createSessionToken(mockSessionData);
      const mockRequest = createMockRequest(sessionToken);

      const result = await getSessionFromRequest(mockRequest);

      expect(result).toEqual(mockSessionData);
    });

    it('should return null and log warning for invalid session token', async () => {
      const mockRequest = createMockRequest('invalid-token');

      const result = await getSessionFromRequest(mockRequest);

      expect(result).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Failed to get session from request:',
        expect.any(Error)
      );
    });

    it('should use custom cookie name from environment', async () => {
      process.env.SESSION_COOKIE_NAME = 'custom-session';
      
      const mockRequest = createMockRequest();

      await getSessionFromRequest(mockRequest);

      expect(mockRequest.cookies.get).toHaveBeenCalledWith('custom-session');
    });
  });

  describe('createSessionCookie', () => {
    it('should create cookie with default settings', () => {
      const token = 'session-token-123';
      const result = createSessionCookie(token);

      expect(result).toBe('union-session=session-token-123; Max-Age=86400; Path=/; HttpOnly; SameSite=Strict');
    });

    it('should create cookie with custom cookie name', () => {
      process.env.SESSION_COOKIE_NAME = 'custom-session';
      
      const token = 'session-token-123';
      const result = createSessionCookie(token);

      expect(result).toContain('custom-session=session-token-123');
    });

    it('should create cookie with custom max age', () => {
      process.env.SESSION_MAX_AGE = '3600';
      
      const token = 'session-token-123';
      const result = createSessionCookie(token);

      expect(result).toContain('Max-Age=3600');
    });

    it('should include Secure flag in production', () => {
      process.env.NODE_ENV = 'production';
      
      const token = 'session-token-123';
      const result = createSessionCookie(token);

      expect(result).toContain('; Secure');
    });

    it('should not include Secure flag in development', () => {
      process.env.NODE_ENV = 'development';
      
      const token = 'session-token-123';
      const result = createSessionCookie(token);

      expect(result).not.toContain('; Secure');
    });
  });

  describe('clearSessionCookie', () => {
    it('should create clear cookie with default name', () => {
      const result = clearSessionCookie();

      expect(result).toBe('union-session=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict');
    });

    it('should create clear cookie with custom name', () => {
      process.env.SESSION_COOKIE_NAME = 'custom-session';
      
      const result = clearSessionCookie();

      expect(result).toBe('custom-session=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict');
    });
  });

  describe('keycloakUserToSessionUser', () => {
    it('should convert keycloak user with all fields', () => {
      const keycloakUser = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        preferred_username: 'testuser',
        given_name: 'Test',
        family_name: 'User',
        realm_access: {
          roles: ['realm-admin', 'realm-member', 'default-roles-realm'],
        },
        resource_access: {
          'client1': { roles: ['client1-admin', 'client1-user'] },
          'client2': { roles: ['client2-viewer', 'offline_access'] },
        },
      };

      const result = keycloakUserToSessionUser(keycloakUser);

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        preferred_username: 'testuser',
        roles: ['realm-admin', 'realm-member', 'client1-admin', 'client1-user', 'client2-viewer'],
      });
    });

    it('should handle keycloak user without name field', () => {
      const keycloakUser = {
        sub: 'user-123',
        email: 'test@example.com',
        preferred_username: 'testuser',
        given_name: 'Test',
        family_name: 'User',
        realm_access: { roles: ['member'] },
      };

      const result = keycloakUserToSessionUser(keycloakUser);

      expect(result.name).toBe('Test User');
    });

    it('should handle keycloak user without realm_access', () => {
      const keycloakUser = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        preferred_username: 'testuser',
        given_name: 'Test',
        family_name: 'User',
        resource_access: {
          'client1': { roles: ['client1-user'] },
        },
      };

      const result = keycloakUserToSessionUser(keycloakUser);

      expect(result.roles).toEqual(['client1-user']);
    });

    it('should handle keycloak user without resource_access', () => {
      const keycloakUser = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        preferred_username: 'testuser',
        given_name: 'Test',
        family_name: 'User',
        realm_access: {
          roles: ['member'],
        },
      };

      const result = keycloakUserToSessionUser(keycloakUser);

      expect(result.roles).toEqual(['member']);
    });

    it('should filter out default and system roles', () => {
      const keycloakUser = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        preferred_username: 'testuser',
        given_name: 'Test',
        family_name: 'User',
        realm_access: {
          roles: [
            'member',
            'default-roles-realm',
            'offline_access',
            'uma_authorization',
            'default-custom-role',
          ],
        },
      };

      const result = keycloakUserToSessionUser(keycloakUser);

      expect(result.roles).toEqual(['member']);
    });

    it('should handle empty roles arrays', () => {
      const keycloakUser = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        preferred_username: 'testuser',
        given_name: 'Test',
        family_name: 'User',
        realm_access: { roles: [] },
        resource_access: {},
      };

      const result = keycloakUserToSessionUser(keycloakUser);

      expect(result.roles).toEqual([]);
    });
  });

  describe('isSessionExpiringSoon', () => {
    it('should return false for session expiring in more than 5 minutes', () => {
      const session = {
        ...mockSessionData,
        expiresAt: Math.floor(Date.now() / 1000) + 600, // 10 minutes
      };

      const result = isSessionExpiringSoon(session);

      expect(result).toBe(false);
    });

    it('should return true for session expiring in less than 5 minutes', () => {
      const session = {
        ...mockSessionData,
        expiresAt: Math.floor(Date.now() / 1000) + 200, // 3 minutes 20 seconds
      };

      const result = isSessionExpiringSoon(session);

      expect(result).toBe(true);
    });

    it('should return true for session expiring exactly in 5 minutes', () => {
      const session = {
        ...mockSessionData,
        expiresAt: Math.floor(Date.now() / 1000) + 299, // slightly less than 5 minutes (4:59)
      };

      const result = isSessionExpiringSoon(session);

      expect(result).toBe(true);
    });

    it('should return true for already expired session', () => {
      const session = {
        ...mockSessionData,
        expiresAt: Math.floor(Date.now() / 1000) - 100, // 100 seconds ago
      };

      const result = isSessionExpiringSoon(session);

      expect(result).toBe(true);
    });
  });

  describe('Environment variable handling', () => {
    it('should use default JWT issuer when not set', async () => {
      delete process.env.JWT_ISSUER;
      
      const token = await createSessionToken(mockSessionData);
      const decoded = await verifySessionToken(token);

      expect(decoded).toEqual(mockSessionData);
    });

    it('should use default JWT audience when not set', async () => {
      delete process.env.JWT_AUDIENCE;
      
      const token = await createSessionToken(mockSessionData);
      const decoded = await verifySessionToken(token);

      expect(decoded).toEqual(mockSessionData);
    });

    it('should use custom JWT issuer and audience', async () => {
      process.env.JWT_ISSUER = 'custom-issuer';
      process.env.JWT_AUDIENCE = 'custom-audience';
      
      const token = await createSessionToken(mockSessionData);
      const decoded = await verifySessionToken(token);

      expect(decoded).toEqual(mockSessionData);
    });
  });

  describe('Integration tests', () => {
    it('should create, verify, and use session token in server context', async () => {
      const sessionToken = await createSessionToken(mockSessionData);
      
      // Mock cookies for getServerSession
      const mockCookieStore = createMockCookieStore(sessionToken);
      resolveCookiesWith(mockCookieStore);

      const serverSession = await getServerSession();
      
      expect(serverSession).toEqual(mockSessionData);
    });

    it('should create, verify, and use session token in request context', async () => {
      const sessionToken = await createSessionToken(mockSessionData);
      
      const mockRequest = createMockRequest(sessionToken);

      const requestSession = await getSessionFromRequest(mockRequest);
      
      expect(requestSession).toEqual(mockSessionData);
    });

    it('should handle complete cookie lifecycle', () => {
      const sessionToken = 'test-token';
      
      // Create cookie
      const setCookie = createSessionCookie(sessionToken);
      expect(setCookie).toContain(`union-session=${sessionToken}`);
      
      // Clear cookie
      const clearCookie = clearSessionCookie();
      expect(clearCookie).toContain('union-session=;');
      expect(clearCookie).toContain('Max-Age=0');
    });
  });
});
