import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';

// Define protected and public routes
const protectedRoutes = ['/dashboard', '/profile', '/benefits', '/claims', '/admin'];
const publicRoutes = ['/', '/login', '/api/auth/login', '/api/auth/logout'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes to handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // If it's a protected route, check authentication
  if (isProtectedRoute) {
    const session = await getSessionFromRequest(request);

    // No session or expired session
    if (!session) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expiresAt <= now) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      url.searchParams.set('error', 'session-expired');
      return NextResponse.redirect(url);
    }

    // Session is valid, allow access
    return NextResponse.next();
  }

  // If user is authenticated and trying to access login page, redirect to dashboard
  if (pathname === '/login') {
    const session = await getSessionFromRequest(request);
    if (session && session.expiresAt > Math.floor(Date.now() / 1000)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // For all other routes (public or unmatched), allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
