import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/logout/route';
import { getServerSession, clearSessionCookie } from '@/lib/session';
import { keycloakClient } from '@/lib/keycloak';

// Mock the external dependencies
jest.mock('@/lib/session');
jest.mock('@/lib/keycloak');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockClearSessionCookie = clearSessionCookie as jest.MockedFunction<typeof clearSessionCookie>;
const mockKeycloakClient = keycloakClient as jest.Mocked<typeof keycloakClient>;

describe('/api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
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
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() / 1000 + 3600,
  };

  it('should successfully logout with session and Keycloak logout', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    mockKeycloakClient.logoutUser.mockResolvedValue(undefined);
    mockClearSessionCookie.mockReturnValue('sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/');

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Logout successful',
    });

    // Verify session cookie was cleared
    expect(response.headers.get('Set-Cookie')).toBe('sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/');

    // Verify all methods were called correctly
    expect(mockGetServerSession).toHaveBeenCalled();
    expect(mockKeycloakClient.logoutUser).toHaveBeenCalledWith('mock-refresh-token');
    expect(mockClearSessionCookie).toHaveBeenCalled();
  });

  it('should successfully logout without session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockClearSessionCookie.mockReturnValue('sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/');

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Logout successful',
    });

    // Verify session cookie was cleared
    expect(response.headers.get('Set-Cookie')).toBe('sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/');

    // Verify methods were called correctly
    expect(mockGetServerSession).toHaveBeenCalled();
    expect(mockKeycloakClient.logoutUser).not.toHaveBeenCalled();
    expect(mockClearSessionCookie).toHaveBeenCalled();
  });

  it('should successfully logout with session but no refresh token', async () => {
    const sessionWithoutRefreshToken = {
      ...mockSession,
      refreshToken: undefined,
    };
    mockGetServerSession.mockResolvedValue(sessionWithoutRefreshToken);
    mockClearSessionCookie.mockReturnValue('sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/');

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Logout successful',
    });

    // Verify Keycloak logout was not called since no refresh token
    expect(mockKeycloakClient.logoutUser).not.toHaveBeenCalled();
    expect(mockClearSessionCookie).toHaveBeenCalled();
  });

  it('should handle Keycloak logout failure gracefully', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const keycloakError = new Error('Keycloak logout failed');
    mockKeycloakClient.logoutUser.mockRejectedValue(keycloakError);
    mockClearSessionCookie.mockReturnValue('sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/');

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Logout successful',
    });

    // Verify warning was logged but logout still succeeded
    expect(console.warn).toHaveBeenCalledWith('Keycloak logout failed:', keycloakError);
    expect(mockClearSessionCookie).toHaveBeenCalled();
  });

  it('should handle session retrieval error and still clear cookie', async () => {
    const sessionError = new Error('Session retrieval failed');
    mockGetServerSession.mockRejectedValue(sessionError);
    mockClearSessionCookie.mockReturnValue('sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/');

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      error: 'Logout completed with errors',
    });

    // Verify error was logged and cookie was still cleared
    expect(console.error).toHaveBeenCalledWith('Logout error:', sessionError);
    expect(response.headers.get('Set-Cookie')).toBe('sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/');
    expect(mockClearSessionCookie).toHaveBeenCalled();
  });

  it('should handle session with null refresh token', async () => {
    const sessionWithNullRefreshToken = {
      ...mockSession,
      refreshToken: null,
    };
    mockGetServerSession.mockResolvedValue(sessionWithNullRefreshToken);
    mockClearSessionCookie.mockReturnValue('sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/');

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Logout successful',
    });

    // Verify Keycloak logout was not called
    expect(mockKeycloakClient.logoutUser).not.toHaveBeenCalled();
    expect(mockClearSessionCookie).toHaveBeenCalled();
  });

  it('should handle session with empty string refresh token', async () => {
    const sessionWithEmptyRefreshToken = {
      ...mockSession,
      refreshToken: '',
    };
    mockGetServerSession.mockResolvedValue(sessionWithEmptyRefreshToken);
    mockClearSessionCookie.mockReturnValue('sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/');

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Logout successful',
    });

    // Verify Keycloak logout was not called
    expect(mockKeycloakClient.logoutUser).not.toHaveBeenCalled();
    expect(mockClearSessionCookie).toHaveBeenCalled();
  });

  it('should handle multiple logout calls gracefully', async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockClearSessionCookie.mockReturnValue('sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/');

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    // Call logout multiple times
    const response1 = await POST(request);
    const response2 = await POST(request);

    const data1 = await response1.json();
    const data2 = await response2.json();

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(data1).toEqual({
      success: true,
      message: 'Logout successful',
    });
    expect(data2).toEqual({
      success: true,
      message: 'Logout successful',
    });

    // Verify methods were called for both requests
    expect(mockGetServerSession).toHaveBeenCalledTimes(2);
    expect(mockClearSessionCookie).toHaveBeenCalledTimes(2);
  });
});