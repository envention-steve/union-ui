import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { KeycloakUser } from './keycloak';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const issuer = process.env.JWT_ISSUER || 'union-benefits-ui';
const audience = process.env.JWT_AUDIENCE || 'union-benefits-api';

export interface SessionData {
  user: {
    id: string;
    email: string;
    name: string;
    preferred_username: string;
    roles: string[];
  };
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Create a signed JWT session token
 */
export async function createSessionToken(data: SessionData): Promise<string> {
  return await new SignJWT(data)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(data.expiresAt)
    .sign(secret);
}

/**
 * Verify and decode session token
 */
export async function verifySessionToken(token: string): Promise<SessionData> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer,
      audience,
    });

    return payload as SessionData;
  } catch (error) {
    throw new Error(`Invalid session token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create session cookie
 */
export function createSessionCookie(sessionToken: string): string {
  const cookieName = process.env.SESSION_COOKIE_NAME || 'union-session';
  const maxAge = parseInt(process.env.SESSION_MAX_AGE || '86400'); // 24 hours
  const secure = process.env.NODE_ENV === 'production';

  return `${cookieName}=${sessionToken}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`;
}

/**
 * Get session from cookies (server-side)
 */
export async function getServerSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const cookieName = process.env.SESSION_COOKIE_NAME || 'union-session';
    const sessionCookie = cookieStore.get(cookieName);

    if (!sessionCookie?.value) {
      return null;
    }
    return await verifySessionToken(sessionCookie.value);
  } catch (error) {
    console.warn('Failed to get server session:', error);
    return null;
  }
}

/**
 * Get session from request (middleware)
 */
export async function getSessionFromRequest(request: NextRequest): Promise<SessionData | null> {
  try {
    const cookieName = process.env.SESSION_COOKIE_NAME || 'union-session';
    const sessionCookie = request.cookies.get(cookieName);

    if (!sessionCookie?.value) {
      return null;
    }

    return await verifySessionToken(sessionCookie.value);
  } catch (error) {
    console.warn('Failed to get session from request:', error);
    return null;
  }
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(): string {
  const cookieName = process.env.SESSION_COOKIE_NAME || 'union-session';
  return `${cookieName}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict`;
}

/**
 * Convert Keycloak user to session user
 */
export function keycloakUserToSessionUser(keycloakUser: KeycloakUser): SessionData['user'] {
  const roles = [
    ...(keycloakUser.realm_access?.roles || []),
    ...Object.values(keycloakUser.resource_access || {}).flatMap(access => access.roles)
  ];

  return {
    id: keycloakUser.sub,
    email: keycloakUser.email,
    name: keycloakUser.name || `${keycloakUser.given_name} ${keycloakUser.family_name}`,
    preferred_username: keycloakUser.preferred_username,
    roles: roles.filter(role => !role.startsWith('default-') && role !== 'offline_access' && role !== 'uma_authorization'),
  };
}

/**
 * Check if session is expired or expires soon (within 5 minutes)
 */
export function isSessionExpiringSoon(session: SessionData): boolean {
  const now = Math.floor(Date.now() / 1000);
  const bufferTime = 5 * 60; // 5 minutes
  return session.expiresAt - now < bufferTime;
}
