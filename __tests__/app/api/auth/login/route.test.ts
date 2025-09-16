import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';
import { keycloakClient } from '@/lib/keycloak';
import { createSessionToken, createSessionCookie, keycloakUserToSessionUser } from '@/lib/session';

// Mock the external dependencies
jest.mock('@/lib/keycloak');
jest.mock('@/lib/session');

const mockKeycloakClient = keycloakClient as jest.Mocked<typeof keycloakClient>;
const mockCreateSessionToken = createSessionToken as jest.MockedFunction<typeof createSessionToken>;
const mockCreateSessionCookie = createSessionCookie as jest.MockedFunction<typeof createSessionCookie>;
const mockKeycloakUserToSessionUser = keycloakUserToSessionUser as jest.MockedFunction<typeof keycloakUserToSessionUser>;

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockTokenResponse = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
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

  it('should successfully authenticate and return user data with session cookie', async () => {
    // Setup mocks
    mockKeycloakClient.authenticateUser.mockResolvedValue(mockTokenResponse);
    mockKeycloakClient.validateToken.mockResolvedValue(mockKeycloakUser);
    mockKeycloakUserToSessionUser.mockReturnValue(mockSessionUser);
    mockCreateSessionToken.mockResolvedValue('session-token');
    mockCreateSessionCookie.mockReturnValue('sessionToken=session-token; HttpOnly; Path=/');

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    
    // Mock the json method to return the parsed body
    jest.spyOn(request, 'json').mockResolvedValue({
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      user: mockSessionUser,
      message: 'Login successful',
    });

    // Verify session cookie was set
    expect(response.headers.get('Set-Cookie')).toBe('sessionToken=session-token; HttpOnly; Path=/');

    // Verify all methods were called correctly
    expect(mockKeycloakClient.authenticateUser).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(mockKeycloakClient.validateToken).toHaveBeenCalledWith('mock-access-token');
    expect(mockKeycloakUserToSessionUser).toHaveBeenCalledWith(mockKeycloakUser);
    expect(mockCreateSessionToken).toHaveBeenCalledWith({
      user: mockSessionUser,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: expect.any(Number),
    });
    expect(mockCreateSessionCookie).toHaveBeenCalledWith('session-token');
  });

  it('should return 400 if email is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: 'password123',
      }),
    });
    
    jest.spyOn(request, 'json').mockResolvedValue({
      password: 'password123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Email and password are required',
    });

    // Ensure no Keycloak methods were called
    expect(mockKeycloakClient.authenticateUser).not.toHaveBeenCalled();
  });

  it('should return 400 if password is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    });
    
    jest.spyOn(request, 'json').mockResolvedValue({
      email: 'test@example.com',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Email and password are required',
    });

    expect(mockKeycloakClient.authenticateUser).not.toHaveBeenCalled();
  });

  it('should return 400 if both email and password are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    
    jest.spyOn(request, 'json').mockResolvedValue({});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Email and password are required',
    });
  });

  it('should return 401 for authentication failure', async () => {
    const authError = new Error('Authentication failed');
    mockKeycloakClient.authenticateUser.mockRejectedValue(authError);

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword',
      }),
    });
    
    jest.spyOn(request, 'json').mockResolvedValue({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      error: 'Invalid email or password',
    });

    expect(console.error).toHaveBeenCalledWith('Login error:', authError);
  });

  it('should return 500 for token validation failure', async () => {
    mockKeycloakClient.authenticateUser.mockResolvedValue(mockTokenResponse);
    const validationError = new Error('Token validation failed');
    mockKeycloakClient.validateToken.mockRejectedValue(validationError);

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    
    jest.spyOn(request, 'json').mockResolvedValue({
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Login failed. Please try again.',
    });

    expect(console.error).toHaveBeenCalledWith('Login error:', validationError);
  });

  it('should return 500 for session token creation failure', async () => {
    mockKeycloakClient.authenticateUser.mockResolvedValue(mockTokenResponse);
    mockKeycloakClient.validateToken.mockResolvedValue(mockKeycloakUser);
    mockKeycloakUserToSessionUser.mockReturnValue(mockSessionUser);
    
    const sessionError = new Error('Session creation failed');
    mockCreateSessionToken.mockRejectedValue(sessionError);

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    
    jest.spyOn(request, 'json').mockResolvedValue({
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Login failed. Please try again.',
    });

    expect(console.error).toHaveBeenCalledWith('Login error:', sessionError);
  });

  it('should handle non-Error thrown objects', async () => {
    mockKeycloakClient.authenticateUser.mockRejectedValue('String error');

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    
    jest.spyOn(request, 'json').mockResolvedValue({
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Login failed. Please try again.',
    });
  });

  it('should handle invalid JSON body', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid-json',
    });
    
    jest.spyOn(request, 'json').mockRejectedValue(new Error('Invalid JSON'));

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Login failed. Please try again.',
    });
  });

  it('should calculate correct expiration time', async () => {
    const mockNow = 1640000000; // Fixed timestamp
    jest.spyOn(Date, 'now').mockReturnValue(mockNow * 1000);
    jest.spyOn(Math, 'floor').mockReturnValue(mockNow);

    mockKeycloakClient.authenticateUser.mockResolvedValue(mockTokenResponse);
    mockKeycloakClient.validateToken.mockResolvedValue(mockKeycloakUser);
    mockKeycloakUserToSessionUser.mockReturnValue(mockSessionUser);
    mockCreateSessionToken.mockResolvedValue('session-token');
    mockCreateSessionCookie.mockReturnValue('sessionToken=session-token; HttpOnly; Path=/');

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    
    jest.spyOn(request, 'json').mockResolvedValue({
      email: 'test@example.com',
      password: 'password123',
    });

    await POST(request);

    expect(mockCreateSessionToken).toHaveBeenCalledWith({
      user: mockSessionUser,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: mockNow + 3600, // now + expires_in
    });
  });
});