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
    try {
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
        // Token is expired, try to refresh it
        try {
          console.log('[MIDDLEWARE] Attempting token refresh for expired token');
          const refreshResponse = await fetch(new URL('/api/auth/refresh', request.url), {
            method: 'POST',
            headers: {
              'Cookie': request.headers.get('Cookie') || '',
            },
          });
          
          console.log(`[MIDDLEWARE] Refresh response status: ${refreshResponse.status}`);
          if (refreshResponse.ok) {
            console.log('[MIDDLEWARE] Token refresh successful');
            // Refresh successful, continue with the request
            const response = NextResponse.next();
            // Copy the new session cookie to the response
            const setCookie = refreshResponse.headers.get('Set-Cookie');
            if (setCookie) {
              response.headers.set('Set-Cookie', setCookie);
            }
            return response;
          } else {
            const errorText = await refreshResponse.text();
            console.log(`[MIDDLEWARE] Token refresh failed: ${errorText}`);
          }
        } catch (error) {
          console.error('[MIDDLEWARE] Token refresh error:', error);
        }
        
        // Refresh failed or token is truly expired
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', pathname);
        url.searchParams.set('error', 'session-expired');
        return NextResponse.redirect(url);
      }

      // Session is valid, allow access
      return NextResponse.next();
    } catch (error) {
      // If session validation fails, redirect to login
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  // If user is authenticated and trying to access login page, redirect to dashboard
  if (pathname === '/login') {
    try {
      const session = await getSessionFromRequest(request);
      if (session && session.expiresAt > Math.floor(Date.now() / 1000)) {
        return NextResponse.redirect(new URL('/dashboard/members', request.url));
      }
    } catch (error) {
      // If session validation fails, allow access to login page
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
