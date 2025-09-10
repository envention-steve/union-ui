import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionAllowExpired, createSessionToken, createSessionCookie, keycloakUserToSessionUser } from '@/lib/session';
import { keycloakClient } from '@/lib/keycloak';

export async function POST(request: NextRequest) {
  console.log('[REFRESH_ENDPOINT] Token refresh request received');
  try {
    // Get current session (allow expired for refresh)
    const session = await getServerSessionAllowExpired();
    console.log(`[REFRESH_ENDPOINT] Session found: ${session ? 'YES' : 'NO'}`);
    console.log(`[REFRESH_ENDPOINT] Refresh token available: ${session?.refreshToken ? 'YES' : 'NO'}`);

    if (!session?.refreshToken) {
      console.log('[REFRESH_ENDPOINT] No refresh token available');
      return NextResponse.json(
        { error: 'No refresh token available' },
        { status: 401 }
      );
    }

    // Refresh token with Keycloak
    console.log('[REFRESH_ENDPOINT] Calling Keycloak refresh token');
    const tokenResponse = await keycloakClient.refreshToken(session.refreshToken);
    console.log('[REFRESH_ENDPOINT] Keycloak refresh successful');
    
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
      expiresAt,
      isExpiringSoon: (expiresAt - now) < 600, // Less than 10 minutes
      message: 'Token refreshed successfully',
    });

    // Set new session cookie
    response.headers.set('Set-Cookie', createSessionCookie(newSessionToken));
    console.log('[REFRESH_ENDPOINT] Token refresh completed successfully');

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
