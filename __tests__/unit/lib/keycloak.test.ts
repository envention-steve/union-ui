import { KeycloakClient } from '@/lib/keycloak'
import { testUsers } from '../../utils/mocks/users'
import { mockKeycloakTokenResponse, createMockToken } from '../../utils/mocks/tokens'

// Mock the jose library for JWT verification
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  createRemoteJWKSet: jest.fn(() => jest.fn()),
}))

// Helper to create mock response
const createMockResponse = (data: any, ok = true, status = 200) => ({
  ok,
  status,
  statusText: ok ? 'OK' : 'Error',
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
})

// Setup global fetch mock
Object.defineProperty(global, 'fetch', {
  writable: true,
  value: jest.fn(),
})

describe('KeycloakClient', () => {
  let keycloakClient: KeycloakClient

  beforeEach(() => {
    keycloakClient = new KeycloakClient({
      serverUrl: 'http://localhost:8080',
      realm: 'union',
      clientId: 'union-ui-client',
      clientSecret: 'test-client-secret',
    })

    // Clear all mocks
    jest.clearAllMocks()
    
    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('authenticateUser', () => {
    it('should successfully authenticate with valid credentials', async () => {
      // Mock successful authentication response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(mockKeycloakTokenResponse)
      )

      const result = await keycloakClient.authenticateUser(
        testUsers.validUser.username,
        testUsers.validUser.password
      )

      expect(result).toEqual(expect.objectContaining({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: 3600,
      }))
    })

    it('should throw error with invalid credentials', async () => {
      // Mock failed authentication response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ error: 'invalid_grant' }, false, 401)
      )

      await expect(
        keycloakClient.authenticateUser(
          testUsers.invalidUser.username,
          testUsers.invalidUser.password
        )
      ).rejects.toThrow('Authentication failed')
    })

    it('should throw error with invalid client credentials', async () => {
      // Mock failed authentication response for bad client secret
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ error: 'invalid_client' }, false, 401)
      )

      const clientWithBadSecret = new KeycloakClient({
        serverUrl: 'http://localhost:8080',
        realm: 'union',
        clientId: 'union-ui-client',
        clientSecret: 'wrong-secret',
      })

      await expect(
        clientWithBadSecret.authenticateUser(
          testUsers.validUser.username,
          testUsers.validUser.password
        )
      ).rejects.toThrow('Authentication failed')
    })

    it('should include correct request parameters', async () => {
      // Mock successful response for this test
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(mockKeycloakTokenResponse)
      )

      // Track fetch calls
      const fetchSpy = jest.spyOn(global, 'fetch')

      await keycloakClient.authenticateUser(
        testUsers.validUser.username,
        testUsers.validUser.password
      )

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:8080/realms/union/protocol/openid-connect/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      )

      const callArgs = fetchSpy.mock.calls[0]
      const requestBody = callArgs[1]?.body as string
      
      expect(requestBody).toContain('grant_type=password')
      expect(requestBody).toContain('client_id=union-ui-client')
      expect(requestBody).toContain('client_secret=test-client-secret')
      expect(requestBody).toContain(`username=${testUsers.validUser.username}`)
      expect(requestBody).toContain(`password=${testUsers.validUser.password}`)
      expect(requestBody).toContain('scope=openid+profile+email')
    })
  })

  describe('refreshToken', () => {
    it('should successfully refresh token with valid refresh token', async () => {
      // Mock successful refresh response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(mockKeycloakTokenResponse)
      )

      const result = await keycloakClient.refreshToken('valid-refresh-token')

      expect(result).toEqual(expect.objectContaining({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
        token_type: 'Bearer',
      }))
    })

    it('should throw error with invalid refresh token', async () => {
      // Mock failed refresh response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ error: 'invalid_grant' }, false, 400)
      )

      await expect(
        keycloakClient.refreshToken('invalid-refresh-token')
      ).rejects.toThrow('Token refresh failed')
    })
  })

  describe('validateToken', () => {
    const { jwtVerify } = require('jose')

    it('should successfully validate a valid token', async () => {
      const mockPayload = {
        sub: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        preferred_username: 'testuser',
        realm_access: { roles: ['client_admin'] },
        resource_access: { account: { roles: ['manage-account'] } },
      }

      jwtVerify.mockResolvedValueOnce({ payload: mockPayload })

      const result = await keycloakClient.validateToken('valid-token')

      expect(result).toEqual(mockPayload)
      expect(jwtVerify).toHaveBeenCalledWith(
        'valid-token',
        expect.any(Function),
        {
          issuer: 'http://localhost:8080/realms/union',
          audience: ['account', 'union-ui-client'],
        }
      )
    })

    it('should throw error for invalid token', async () => {
      jwtVerify.mockRejectedValueOnce(new Error('Invalid token'))

      await expect(
        keycloakClient.validateToken('invalid-token')
      ).rejects.toThrow('Token validation failed')
    })
  })

  describe('logoutUser', () => {
    it('should call logout endpoint successfully', async () => {
      // Mock successful logout response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({}, true, 204)
      )

      await expect(
        keycloakClient.logoutUser('refresh-token')
      ).resolves.not.toThrow()
    })

    it('should not throw error even if logout fails', async () => {
      // Mock a failing logout request
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(
        keycloakClient.logoutUser('refresh-token')
      ).resolves.not.toThrow()
    })
  })

  describe('getUserInfo', () => {
    it('should successfully get user info with valid token', async () => {
      const mockUserInfo = {
        sub: '34d060e6-3f3b-426a-94f1-4095086bfc69',
        email_verified: true,
        name: 'Test User',
        preferred_username: 'test_user1',
        given_name: 'Test',
        family_name: 'User',
        email: 'test_user1@gmail.com',
      }

      // Mock successful user info response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(mockUserInfo)
      )

      const result = await keycloakClient.getUserInfo('valid-access-token')

      expect(result).toEqual(mockUserInfo)
    })

    it('should throw error with invalid token', async () => {
      // Mock failed user info response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ error: 'invalid_token' }, false, 401)
      )

      await expect(
        keycloakClient.getUserInfo('invalid-token')
      ).rejects.toThrow('Failed to get user info')
    })
  })
})
