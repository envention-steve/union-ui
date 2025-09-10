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

  // If it's a protected route, check authentication
  if (isProtectedRoute) {
    try {
      const session = await getSessionFromRequest(request);

      // No valid session - redirect to login
      // Note: getSessionFromRequest returns null for expired tokens
      if (!session) {
        console.log(`[MIDDLEWARE] No valid session for ${pathname}, redirecting to login`);
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
      }

      // Session is valid, allow access
      console.log(`[MIDDLEWARE] Valid session found for ${pathname}`);
      return NextResponse.next();
    } catch (error) {
      console.warn(`[MIDDLEWARE] Session validation error for ${pathname}:`, error);
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  // If user is authenticated and trying to access login page, redirect to dashboard
  if (pathname === '/login') {
    try {
      const session = await getSessionFromRequest(request);
      if (session) {
        console.log('[MIDDLEWARE] User with valid session accessing login, redirecting to dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      // If session validation fails, allow access to login page
      console.log('[MIDDLEWARE] No valid session, allowing access to login page');
      return NextResponse.next();
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
