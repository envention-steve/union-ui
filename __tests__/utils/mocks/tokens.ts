import { KeycloakTokenResponse } from '@/lib/keycloak'

// Mock JWT tokens (these are not real tokens, just for testing structure)
export const mockJWTHeader = {
  alg: 'RS256',
  typ: 'JWT',
  kid: 'test-key-id',
}

export const mockJWTPayload = {
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  iat: Math.floor(Date.now() / 1000),
  jti: 'test-jwt-id',
  iss: 'http://localhost:8080/realms/union',
  aud: 'account',
  sub: '34d060e6-3f3b-426a-94f1-4095086bfc69',
  typ: 'Bearer',
  azp: 'union-ui-client',
  sid: 'test-session-id',
  acr: '1',
  'allowed-origins': ['*'],
  realm_access: {
    roles: ['default-roles-union', 'offline_access', 'uma_authorization', 'client_admin'],
  },
  resource_access: {
    account: {
      roles: ['manage-account', 'manage-account-links', 'view-profile'],
    },
  },
  scope: 'openid email profile',
  email_verified: true,
  name: 'Test User',
  preferred_username: 'test_user1',
  given_name: 'Test',
  family_name: 'User',
  email: 'test_user1@gmail.com',
}

export const mockExpiredJWTPayload = {
  ...mockJWTPayload,
  exp: Math.floor(Date.now() / 1000) - 1, // Already expired
}

// Mock base64 encoded parts (not real encoding, just for testing)
export const mockAccessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.test-signature'
export const mockRefreshToken = 'refresh-token-mock-value'
export const mockIdToken = 'id-token-mock-value'

export const mockKeycloakTokenResponse: KeycloakTokenResponse = {
  access_token: mockAccessToken,
  expires_in: 3600,
  refresh_expires_in: 1800,
  refresh_token: mockRefreshToken,
  token_type: 'Bearer',
  'not-before-policy': 0,
  session_state: 'test-session-state',
  scope: 'openid email profile',
}

export const mockKeycloakErrorResponse = {
  error: 'invalid_grant',
  error_description: 'Invalid user credentials',
}

// Mock JWKS (JSON Web Key Set) for token validation
export const mockJWKS = {
  keys: [
    {
      kty: 'RSA',
      use: 'sig',
      kid: 'test-key-id',
      x5t: 'test-thumbprint',
      n: 'test-modulus',
      e: 'AQAB',
      x5c: ['test-certificate'],
      alg: 'RS256',
    },
  ],
}

// Create a mock token with custom expiration
export const createMockToken = (expiresInSeconds: number = 3600): string => {
  const header = Buffer.from(JSON.stringify(mockJWTHeader)).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    ...mockJWTPayload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  })).toString('base64url')
  
  return `${header}.${payload}.mock-signature`
}

// Create an expired token
export const createExpiredToken = (): string => {
  return createMockToken(-1) // Expired 1 second ago
}
