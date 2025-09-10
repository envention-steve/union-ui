import { http, HttpResponse } from 'msw'
import { 
  mockKeycloakTokenResponse, 
  mockKeycloakErrorResponse, 
  mockJWKS,
  createMockToken 
} from '../mocks/tokens'
import { testUsers } from '../mocks/users'

const KEYCLOAK_BASE_URL = 'http://localhost:8080'
const REALM = 'union'

export const keycloakHandlers = [
  // Token endpoint - handles login, refresh, etc.
  http.post(`${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/token`, async ({ request }) => {
    const formData = await request.formData()
    const grantType = formData.get('grant_type')
    const clientId = formData.get('client_id')
    const clientSecret = formData.get('client_secret')

    // Validate client credentials
    if (clientId !== 'union-ui-client' || clientSecret !== 'test-client-secret') {
      return HttpResponse.json(
        {
          error: 'invalid_client',
          error_description: 'Invalid client credentials',
        },
        { status: 401 }
      )
    }

    if (grantType === 'password') {
      // Password grant flow
      const username = formData.get('username') as string
      const password = formData.get('password') as string

      // Check against test users
      const validUser = Object.values(testUsers).find(
        user => user.username === username && user.password === password
      )

      if (!validUser) {
        return HttpResponse.json(mockKeycloakErrorResponse, { status: 401 })
      }

      // Return successful token response
      return HttpResponse.json({
        ...mockKeycloakTokenResponse,
        access_token: createMockToken(3600), // 1 hour
      })
    }

    if (grantType === 'refresh_token') {
      // Token refresh flow
      const refreshToken = formData.get('refresh_token')

      if (refreshToken === 'invalid-refresh-token') {
        return HttpResponse.json(
          {
            error: 'invalid_grant',
            error_description: 'Invalid refresh token',
          },
          { status: 401 }
        )
      }

      // Return new tokens
      return HttpResponse.json({
        ...mockKeycloakTokenResponse,
        access_token: createMockToken(3600), // New access token
        refresh_token: 'new-refresh-token-mock-value',
      })
    }

    return HttpResponse.json(
      {
        error: 'unsupported_grant_type',
        error_description: 'Grant type not supported',
      },
      { status: 400 }
    )
  }),

  // JWKS endpoint - provides public keys for token validation
  http.get(`${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/certs`, () => {
    return HttpResponse.json(mockJWKS)
  }),

  // OpenID Configuration endpoint
  http.get(`${KEYCLOAK_BASE_URL}/realms/${REALM}/.well-known/openid_configuration`, () => {
    return HttpResponse.json({
      issuer: `${KEYCLOAK_BASE_URL}/realms/${REALM}`,
      authorization_endpoint: `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/auth`,
      token_endpoint: `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/token`,
      userinfo_endpoint: `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/userinfo`,
      end_session_endpoint: `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/logout`,
      jwks_uri: `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/certs`,
      response_types_supported: ['code', 'token', 'id_token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
    })
  }),

  // User info endpoint
  http.get(`${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/userinfo`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'invalid_token' },
        { status: 401 }
      )
    }

    // Return mock user info
    return HttpResponse.json({
      sub: '34d060e6-3f3b-426a-94f1-4095086bfc69',
      email_verified: true,
      name: 'Test User',
      preferred_username: 'test_user1',
      given_name: 'Test',
      family_name: 'User',
      email: 'test_user1@gmail.com',
    })
  }),

  // Logout endpoint
  http.post(`${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/logout`, () => {
    return HttpResponse.json({}, { status: 204 })
  }),
]
