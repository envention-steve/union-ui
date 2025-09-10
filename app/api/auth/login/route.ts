import { NextRequest, NextResponse } from 'next/server';
import { keycloakClient } from '@/lib/keycloak';
import { createSessionToken, createSessionCookie, keycloakUserToSessionUser } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate with Keycloak
    const tokenResponse = await keycloakClient.authenticateUser(email, password);
    
    // Validate the access token and get user info
    const keycloakUser = await keycloakClient.validateToken(tokenResponse.access_token);
    
    // Convert to session user format
    const sessionUser = keycloakUserToSessionUser(keycloakUser);
    
    // Calculate expiration time (use token expiration or default to 24 hours)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + tokenResponse.expires_in;

    // Create session data
    const sessionData = {
      user: sessionUser,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt,
    };

    // Create session token
    const sessionToken = await createSessionToken(sessionData);

    // Create response
    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      message: 'Login successful',
    });

    // Set session cookie
    response.headers.set('Set-Cookie', createSessionCookie(sessionToken));

    return response;

  } catch (error) {
    console.error('Login error:', error);
    
    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    
    if (errorMessage.includes('Authentication failed')) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
