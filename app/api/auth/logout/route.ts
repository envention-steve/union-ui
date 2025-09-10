import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, clearSessionCookie } from '@/lib/session';
import { keycloakClient } from '@/lib/keycloak';

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession();

    // If we have a session with refresh token, logout from Keycloak
    if (session?.refreshToken) {
      try {
        await keycloakClient.logoutUser(session.refreshToken);
      } catch (error) {
        // Log but don't fail logout if Keycloak call fails
        console.warn('Keycloak logout failed:', error);
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful',
    });

    // Clear session cookie
    response.headers.set('Set-Cookie', clearSessionCookie());

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear the cookie even if there's an error
    const response = NextResponse.json(
      { error: 'Logout completed with errors' },
      { status: 200 } // Still return success since we're clearing the session
    );

    response.headers.set('Set-Cookie', clearSessionCookie());
    return response;
  }
}
