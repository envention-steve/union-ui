import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/refresh/route';
import { getServerSessionAllowExpired, createSessionToken, createSessionCookie, keycloakUserToSessionUser } from '@/lib/session';
import { keycloakClient } from '@/lib/keycloak';

// Mock the external dependencies
jest.mock('@/lib/session');
jest.mock('@/lib/keycloak');

const mockGetServerSessionAllowExpired = getServerSessionAllowExpired as jest.MockedFunction<typeof getServerSessionAllowExpired>;
const mockCreateSessionToken = createSessionToken as jest.MockedFunction<typeof createSessionToken>;
const mockCreateSessionCookie = createSessionCookie as jest.MockedFunction<typeof createSessionCookie>;
const mockKeycloakUserToSessionUser = keycloakUserToSessionUser as jest.MockedFunction<typeof keycloakUserToSessionUser>;
const mockKeycloakClient = keycloakClient as jest.Mocked<typeof keycloakClient>;

describe('/api/auth/refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'John Doe',
      roles: ['member'],
    },
    accessToken: 'old-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() / 1000 - 100, // Expired
  };

  const mockTokenResponse = {
    access_token: 'new-access-token',
    refresh_token: 'new-refresh-token',
    expires_in: 3600,
  };

  const mockKeycloakUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: ['member'],
  };

  const mockSessionUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'John Doe',
    roles: ['member'],
  };

  it('should successfully refresh token and return new session data', async () => {
    const mockNow = 1640000000;
    jest.spyOn(Date, 'now').mockReturnValue(mockNow * 1000);
    jest.spyOn(Math, 'floor').mockReturnValue(mockNow);

    mockGetServerSessionAllowExpired.mockResolvedValue(mockSession);
    mockKeycloakClient.refreshToken.mockResolvedValue(mockTokenResponse);
    mockKeycloakClient.validateToken.mockResolvedValue(mockKeycloakUser);
    mockKeycloakUserToSessionUser.mockReturnValue(mockSessionUser);
    mockCreateSessionToken.mockResolvedValue('new-session-token');
    mockCreateSessionCookie.mockReturnValue('sessionToken=new-session-token; HttpOnly; Path=/');

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      user: mockSessionUser,
      expiresAt: mockNow + 3600,
      isExpiringSoon: false,
      message: 'Token refreshed successfully',
    });

    // Verify session cookie was set
    expect(response.headers.get('Set-Cookie')).toBe('sessionToken=new-session-token; HttpOnly; Path=/');

    // Verify all methods were called correctly
    expect(mockGetServerSessionAllowExpired).toHaveBeenCalled();
    expect(mockKeycloakClient.refreshToken).toHaveBeenCalledWith('mock-refresh-token');
    expect(mockKeycloakClient.validateToken).toHaveBeenCalledWith('new-access-token');
    expect(mockKeycloakUserToSessionUser).toHaveBeenCalledWith(mockKeycloakUser);
    expect(mockCreateSessionToken).toHaveBeenCalledWith({
      user: mockSessionUser,
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresAt: mockNow + 3600,
    });
    expect(mockCreateSessionCookie).toHaveBeenCalledWith('new-session-token');

    // Verify console logs
    expect(console.log).toHaveBeenCalledWith('[REFRESH_ENDPOINT] Token refresh request received');
    expect(console.log).toHaveBeenCalledWith('[REFRESH_ENDPOINT] Session found: YES');
    expect(console.log).toHaveBeenCalledWith('[REFRESH_ENDPOINT] Refresh token available: YES');
    expect(console.log).toHaveBeenCalledWith('[REFRESH_ENDPOINT] Calling Keycloak refresh token');
    expect(console.log).toHaveBeenCalledWith('[REFRESH_ENDPOINT] Keycloak refresh successful');
    expect(console.log).toHaveBeenCalledWith('[REFRESH_ENDPOINT] Token refresh completed successfully');
  });

  it('should return 401 if no session is found', async () => {
    mockGetServerSessionAllowExpired.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      error: 'No refresh token available',
    });

    expect(console.log).toHaveBeenCalledWith('[REFRESH_ENDPOINT] Session found: NO');
    expect(console.log).toHaveBeenCalledWith('[REFRESH_ENDPOINT] Refresh token available: NO');
    expect(console.log).toHaveBeenCalledWith('[REFRESH_ENDPOINT] No refresh token available');

    // Ensure no Keycloak methods were called
    expect(mockKeycloakClient.refreshToken).not.toHaveBeenCalled();
  });

  it('should return 401 if session exists but no refresh token', async () => {
    const sessionWithoutRefreshToken = {
      ...mockSession,
      refreshToken: undefined,
    };
    mockGetServerSessionAllowExpired.mockResolvedValue(sessionWithoutRefreshToken);

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      error: 'No refresh token available',
    });

    expect(console.log).toHaveBeenCalledWith('[REFRESH_ENDPOINT] Session found: YES');
    expect(console.log).toHaveBeenCalledWith('[REFRESH_ENDPOINT] Refresh token available: NO');
    expect(console.log).toHaveBeenCalledWith('[REFRESH_ENDPOINT] No refresh token available');

    expect(mockKeycloakClient.refreshToken).not.toHaveBeenCalled();
  });

  it('should return 401 if refresh token is empty string', async () => {
    const sessionWithEmptyRefreshToken = {
      ...mockSession,
      refreshToken: '',
    };
    mockGetServerSessionAllowExpired.mockResolvedValue(sessionWithEmptyRefreshToken);

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      error: 'No refresh token available',
    });

    expect(mockKeycloakClient.refreshToken).not.toHaveBeenCalled();
  });

  it('should return 401 if Keycloak refresh fails', async () => {
    mockGetServerSessionAllowExpired.mockResolvedValue(mockSession);
    const refreshError = new Error('Refresh token expired');
    mockKeycloakClient.refreshToken.mockRejectedValue(refreshError);

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      error: 'Token refresh failed. Please login again.',
    });

    expect(console.error).toHaveBeenCalledWith('Token refresh error:', refreshError);
    expect(mockKeycloakClient.refreshToken).toHaveBeenCalledWith('mock-refresh-token');
  });

  it('should return 401 if token validation fails after refresh', async () => {
    mockGetServerSessionAllowExpired.mockResolvedValue(mockSession);
    mockKeycloakClient.refreshToken.mockResolvedValue(mockTokenResponse);
    const validationError = new Error('Token validation failed');
    mockKeycloakClient.validateToken.mockRejectedValue(validationError);

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      error: 'Token refresh failed. Please login again.',
    });

    expect(console.error).toHaveBeenCalledWith('Token refresh error:', validationError);
  });

  it('should return 401 if session token creation fails', async () => {
    mockGetServerSessionAllowExpired.mockResolvedValue(mockSession);
    mockKeycloakClient.refreshToken.mockResolvedValue(mockTokenResponse);
    mockKeycloakClient.validateToken.mockResolvedValue(mockKeycloakUser);
    mockKeycloakUserToSessionUser.mockReturnValue(mockSessionUser);
    
    const sessionError = new Error('Session token creation failed');
    mockCreateSessionToken.mockRejectedValue(sessionError);

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      error: 'Token refresh failed. Please login again.',
    });

    expect(console.error).toHaveBeenCalledWith('Token refresh error:', sessionError);
  });

  it('should correctly calculate isExpiringSoon for tokens expiring in less than 10 minutes', async () => {
    const mockNow = 1640000000;
    jest.spyOn(Date, 'now').mockReturnValue(mockNow * 1000);
    jest.spyOn(Math, 'floor').mockReturnValue(mockNow);

    // Token expires in 5 minutes (300 seconds)
    const shortExpiryTokenResponse = {
      ...mockTokenResponse,
      expires_in: 300,
    };

    mockGetServerSessionAllowExpired.mockResolvedValue(mockSession);
    mockKeycloakClient.refreshToken.mockResolvedValue(shortExpiryTokenResponse);
    mockKeycloakClient.validateToken.mockResolvedValue(mockKeycloakUser);
    mockKeycloakUserToSessionUser.mockReturnValue(mockSessionUser);
    mockCreateSessionToken.mockResolvedValue('new-session-token');
    mockCreateSessionCookie.mockReturnValue('sessionToken=new-session-token; HttpOnly; Path=/');

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isExpiringSoon).toBe(true); // Should be true since expires in 5 minutes
    expect(data.expiresAt).toBe(mockNow + 300);
  });

  it('should correctly calculate isExpiringSoon for tokens expiring in more than 10 minutes', async () => {
    const mockNow = 1640000000;
    jest.spyOn(Date, 'now').mockReturnValue(mockNow * 1000);
    jest.spyOn(Math, 'floor').mockReturnValue(mockNow);

    mockGetServerSessionAllowExpired.mockResolvedValue(mockSession);
    mockKeycloakClient.refreshToken.mockResolvedValue(mockTokenResponse); // 3600 seconds
    mockKeycloakClient.validateToken.mockResolvedValue(mockKeycloakUser);
    mockKeycloakUserToSessionUser.mockReturnValue(mockSessionUser);
    mockCreateSessionToken.mockResolvedValue('new-session-token');
    mockCreateSessionCookie.mockReturnValue('sessionToken=new-session-token; HttpOnly; Path=/');

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isExpiringSoon).toBe(false); // Should be false since expires in 1 hour
    expect(data.expiresAt).toBe(mockNow + 3600);
  });

  it('should handle session retrieval error', async () => {
    const sessionError = new Error('Session retrieval failed');
    mockGetServerSessionAllowExpired.mockRejectedValue(sessionError);

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      error: 'Token refresh failed. Please login again.',
    });

    expect(console.error).toHaveBeenCalledWith('Token refresh error:', sessionError);
  });
});