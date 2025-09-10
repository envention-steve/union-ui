import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, isSessionExpiringSoon } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expiresAt <= now) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Return user data and session info
    return NextResponse.json({
      success: true,
      user: session.user,
      expiresAt: session.expiresAt,
      isExpiringSoon: isSessionExpiringSoon(session),
    });

  } catch (error) {
    console.error('Get user session error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get user session' },
      { status: 500 }
    );
  }
}
