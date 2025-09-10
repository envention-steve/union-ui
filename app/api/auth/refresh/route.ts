import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, createSessionToken, createSessionCookie, keycloakUserToSessionUser } from '@/lib/session';
import { keycloakClient } from '@/lib/keycloak';

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession();

    if (!session?.refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token available' },
        { status: 401 }
      );
    }

    // Refresh token with Keycloak
    const tokenResponse = await keycloakClient.refreshToken(session.refreshToken);
    
    // Validate the new access token and get updated user info
    const keycloakUser = await keycloakClient.validateToken(tokenResponse.access_token);
    
    // Convert to session user format
    const sessionUser = keycloakUserToSessionUser(keycloakUser);
    
    // Calculate new expiration time
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + tokenResponse.expires_in;

    // Create new session data
    const newSessionData = {
      user: sessionUser,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt,
    };

    // Create new session token
    const newSessionToken = await createSessionToken(newSessionData);

    // Create response
    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      message: 'Token refreshed successfully',
    });

    // Set new session cookie
    response.headers.set('Set-Cookie', createSessionCookie(newSessionToken));

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    
    // If refresh fails, the session is invalid
    return NextResponse.json(
      { error: 'Token refresh failed. Please login again.' },
      { status: 401 }
    );
  }
}
