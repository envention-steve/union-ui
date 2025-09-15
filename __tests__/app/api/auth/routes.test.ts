/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as tokenHandler } from '@/app/api/auth/token/route';
import { GET as meHandler } from '@/app/api/auth/me/route';
import { getServerSession, isSessionExpiringSoon } from '@/lib/session';

// Mock the session utilities
jest.mock('@/lib/session', () => ({
  getServerSession: jest.fn(),
  isSessionExpiringSoon: jest.fn(),
}));

// Mock global Request if needed
if (typeof global.Request === 'undefined') {
  global.Request = class MockRequest {
    constructor(public url: string, public init: any = {}) {}
  } as any;
}

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockIsSessionExpiringSoon = isSessionExpiringSoon as jest.MockedFunction<typeof isSessionExpiringSoon>;

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('Auth API Routes', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new NextRequest('http://localhost:3000/api/auth/test', {
      method: 'GET',
    });
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('/api/auth/token/route', () => {
    describe('GET handler', () => {
      it('should return access token for valid session', async () => {
        const mockSession = {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        };

        mockGetServerSession.mockResolvedValue(mockSession);

        const response = await tokenHandler(mockRequest);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData).toEqual({
          accessToken: 'access-token-123',
          expiresAt: mockSession.expiresAt,
        });
      });

      it('should return 401 when no session exists', async () => {
        mockGetServerSession.mockResolvedValue(null);

        const response = await tokenHandler(mockRequest);
        const responseData = await response.json();

        expect(response.status).toBe(401);
        expect(responseData).toEqual({
          error: 'Not authenticated',
        });
      });

      it('should return 401 when session is expired', async () => {
        const expiredSession = {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
        };

        mockGetServerSession.mockResolvedValue(expiredSession);

        const response = await tokenHandler(mockRequest);
        const responseData = await response.json();

        expect(response.status).toBe(401);
        expect(responseData).toEqual({
          error: 'Session expired',
        });
      });

      it('should handle getServerSession throwing an error', async () => {
        mockGetServerSession.mockRejectedValue(new Error('Database error'));

        const response = await tokenHandler(mockRequest);
        const responseData = await response.json();

        expect(response.status).toBe(500);
        expect(responseData).toEqual({
          error: 'Failed to get access token',
        });
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Get access token error:',
          expect.any(Error)
        );
      });

      it('should handle session at exact expiration time', async () => {
        const exactExpirationSession = {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresAt: Math.floor(Date.now() / 1000), // Exactly now
        };

        mockGetServerSession.mockResolvedValue(exactExpirationSession);

        const response = await tokenHandler(mockRequest);
        const responseData = await response.json();

        expect(response.status).toBe(401);
        expect(responseData).toEqual({
          error: 'Session expired',
        });
      });

      it('should handle session about to expire but not yet expired', async () => {
        const almostExpiredSession = {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresAt: Math.floor(Date.now() / 1000) + 1, // 1 second from now
        };

        mockGetServerSession.mockResolvedValue(almostExpiredSession);

        const response = await tokenHandler(mockRequest);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData).toEqual({
          accessToken: 'access-token-123',
          expiresAt: almostExpiredSession.expiresAt,
        });
      });
    });
  });

  describe('/api/auth/me/route', () => {
    describe('GET handler', () => {
      it('should return user data for valid session', async () => {
        const mockSession = {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            preferred_username: 'testuser',
            roles: ['user'],
          },
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        };

        mockGetServerSession.mockResolvedValue(mockSession);
        mockIsSessionExpiringSoon.mockReturnValue(false);

        const response = await meHandler(mockRequest);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData).toEqual({
          success: true,
          user: mockSession.user,
          expiresAt: mockSession.expiresAt,
          isExpiringSoon: false,
        });
        expect(mockIsSessionExpiringSoon).toHaveBeenCalledWith(mockSession);
      });

      it('should return isExpiringSoon true when session is expiring soon', async () => {
        const mockSession = {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresAt: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
        };

        mockGetServerSession.mockResolvedValue(mockSession);
        mockIsSessionExpiringSoon.mockReturnValue(true);

        const response = await meHandler(mockRequest);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.isExpiringSoon).toBe(true);
        expect(mockIsSessionExpiringSoon).toHaveBeenCalledWith(mockSession);
      });

      it('should return 401 when no session exists', async () => {
        mockGetServerSession.mockResolvedValue(null);

        const response = await meHandler(mockRequest);
        const responseData = await response.json();

        expect(response.status).toBe(401);
        expect(responseData).toEqual({
          error: 'Not authenticated',
        });
        expect(mockIsSessionExpiringSoon).not.toHaveBeenCalled();
      });

      it('should return 401 when session is expired', async () => {
        const expiredSession = {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
        };

        mockGetServerSession.mockResolvedValue(expiredSession);

        const response = await meHandler(mockRequest);
        const responseData = await response.json();

        expect(response.status).toBe(401);
        expect(responseData).toEqual({
          error: 'Session expired',
        });
        expect(mockIsSessionExpiringSoon).not.toHaveBeenCalled();
      });

      it('should handle getServerSession throwing an error', async () => {
        mockGetServerSession.mockRejectedValue(new Error('Database connection failed'));

        const response = await meHandler(mockRequest);
        const responseData = await response.json();

        expect(response.status).toBe(500);
        expect(responseData).toEqual({
          error: 'Failed to get user session',
        });
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Get user session error:',
          expect.any(Error)
        );
        expect(mockIsSessionExpiringSoon).not.toHaveBeenCalled();
      });

      it('should handle isSessionExpiringSoon throwing an error gracefully', async () => {
        const mockSession = {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresAt: Math.floor(Date.now() / 1000) + 3600,
        };

        mockGetServerSession.mockResolvedValue(mockSession);
        mockIsSessionExpiringSoon.mockImplementation(() => {
          throw new Error('Calculation error');
        });

        const response = await meHandler(mockRequest);
        const responseData = await response.json();

        expect(response.status).toBe(500);
        expect(responseData).toEqual({
          error: 'Failed to get user session',
        });
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Get user session error:',
          expect.any(Error)
        );
      });

      it('should handle edge case where session expiration equals current time', async () => {
        const edgeCaseSession = {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresAt: Math.floor(Date.now() / 1000), // Exactly now
        };

        mockGetServerSession.mockResolvedValue(edgeCaseSession);

        const response = await meHandler(mockRequest);
        const responseData = await response.json();

        expect(response.status).toBe(401);
        expect(responseData).toEqual({
          error: 'Session expired',
        });
        expect(mockIsSessionExpiringSoon).not.toHaveBeenCalled();
      });

      it('should handle user object with minimal data', async () => {
        const minimalSession = {
          user: {
            id: 'user-123',
          },
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresAt: Math.floor(Date.now() / 1000) + 3600,
        };

        mockGetServerSession.mockResolvedValue(minimalSession);
        mockIsSessionExpiringSoon.mockReturnValue(false);

        const response = await meHandler(mockRequest);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData).toEqual({
          success: true,
          user: { id: 'user-123' },
          expiresAt: minimalSession.expiresAt,
          isExpiringSoon: false,
        });
      });

      it('should handle user object with all fields', async () => {
        const fullSession = {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            preferred_username: 'testuser',
            roles: ['admin', 'user'],
            groups: ['staff'],
            firstName: 'Test',
            lastName: 'User',
          },
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresAt: Math.floor(Date.now() / 1000) + 3600,
        };

        mockGetServerSession.mockResolvedValue(fullSession);
        mockIsSessionExpiringSoon.mockReturnValue(false);

        const response = await meHandler(mockRequest);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData).toEqual({
          success: true,
          user: fullSession.user,
          expiresAt: fullSession.expiresAt,
          isExpiringSoon: false,
        });
      });
    });
  });

  describe('Error handling consistency', () => {
    it('should handle null session consistently across both endpoints', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const tokenResponse = await tokenHandler(mockRequest);
      const tokenData = await tokenResponse.json();

      const meResponse = await meHandler(mockRequest);
      const meData = await meResponse.json();

      expect(tokenResponse.status).toBe(401);
      expect(meResponse.status).toBe(401);
      expect(tokenData.error).toBe('Not authenticated');
      expect(meData.error).toBe('Not authenticated');
    });

    it('should handle expired sessions consistently across both endpoints', async () => {
      const expiredSession = {
        user: { id: 'user-123' },
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Math.floor(Date.now() / 1000) - 1,
      };

      mockGetServerSession.mockResolvedValue(expiredSession);

      const tokenResponse = await tokenHandler(mockRequest);
      const tokenData = await tokenResponse.json();

      const meResponse = await meHandler(mockRequest);
      const meData = await meResponse.json();

      expect(tokenResponse.status).toBe(401);
      expect(meResponse.status).toBe(401);
      expect(tokenData.error).toBe('Session expired');
      expect(meData.error).toBe('Session expired');
    });
  });
});