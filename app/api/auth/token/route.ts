import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';

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

    // Return only the access token
    return NextResponse.json({
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
    });

  } catch (error) {
    console.error('Get access token error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get access token' },
      { status: 500 }
    );
  }
}
