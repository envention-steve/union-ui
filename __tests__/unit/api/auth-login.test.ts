import { keycloakClient } from '@/lib/keycloak'
import { createSessionToken, createSessionCookie, keycloakUserToSessionUser } from '@/lib/session'
import { testUsers, keycloakUserResponse } from '../../utils/mocks/users'
import { mockKeycloakTokenResponse } from '../../utils/mocks/tokens'

// Mock the dependencies
jest.mock('@/lib/keycloak', () => ({
  keycloakClient: {
    authenticateUser: jest.fn(),
    validateToken: jest.fn(),
  },
}))

jest.mock('@/lib/session', () => ({
  createSessionToken: jest.fn(),
  createSessionCookie: jest.fn(),
  keycloakUserToSessionUser: jest.fn(),
}))

const mockKeycloakClient = keycloakClient as jest.Mocked<typeof keycloakClient>
const mockCreateSessionToken = createSessionToken as jest.MockedFunction<typeof createSessionToken>
const mockCreateSessionCookie = createSessionCookie as jest.MockedFunction<typeof createSessionCookie>
const mockKeycloakUserToSessionUser = keycloakUserToSessionUser as jest.MockedFunction<typeof keycloakUserToSessionUser>

// Login business logic extracted for testing
class LoginService {
  async authenticateUser(email: string, password: string) {
    if (!email || !password || !email.trim() || !password.trim()) {
      throw new Error('Email and password are required')
    }

    try {
      // Authenticate with Keycloak
      const tokenResponse = await keycloakClient.authenticateUser(email, password)
      
      // Validate the access token and get user info
      const keycloakUser = await keycloakClient.validateToken(tokenResponse.access_token)
      
      // Convert to session user format
      const sessionUser = keycloakUserToSessionUser(keycloakUser)
      
      // Calculate expiration time
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = now + tokenResponse.expires_in

      // Create session data
      const sessionData = {
        user: sessionUser,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt,
      }

      // Create session token
      const sessionToken = await createSessionToken(sessionData)
      
      // Create session cookie
      const sessionCookie = createSessionCookie(sessionToken)

      return {
        success: true,
        user: sessionUser,
        message: 'Login successful',
        sessionCookie,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      
      if (errorMessage.includes('Authentication failed')) {
        throw new Error('Invalid email or password')
      }
      
      throw new Error('Login failed. Please try again.')
    }
  }
}

describe('Login Service', () => {
  let loginService: LoginService

  beforeEach(() => {
    loginService = new LoginService()
    jest.clearAllMocks()
    
    // Setup default successful mocks
    mockKeycloakClient.authenticateUser.mockResolvedValue(mockKeycloakTokenResponse)
    mockKeycloakClient.validateToken.mockResolvedValue(keycloakUserResponse)
    mockKeycloakUserToSessionUser.mockReturnValue({
      id: keycloakUserResponse.sub,
      email: keycloakUserResponse.email,
      name: keycloakUserResponse.name,
      preferred_username: keycloakUserResponse.preferred_username,
      roles: ['client_admin'],
    })
    mockCreateSessionToken.mockResolvedValue('mock-session-token')
    mockCreateSessionCookie.mockReturnValue('union-session=mock-session-token; Max-Age=86400; Path=/; HttpOnly; SameSite=Strict')
  })

  describe('Successful authentication flow', () => {
    it('should successfully authenticate user with valid credentials', async () => {
      const result = await loginService.authenticateUser(
        testUsers.validUser.username,
        testUsers.validUser.password
      )

      expect(result).toEqual({
        success: true,
        user: {
          id: keycloakUserResponse.sub,
          email: keycloakUserResponse.email,
          name: keycloakUserResponse.name,
          preferred_username: keycloakUserResponse.preferred_username,
          roles: ['client_admin'],
        },
        message: 'Login successful',
        sessionCookie: expect.stringContaining('union-session='),
      })
    })

    it('should call Keycloak services in correct order', async () => {
      await loginService.authenticateUser(
        testUsers.validUser.username,
        testUsers.validUser.password
      )

      expect(mockKeycloakClient.authenticateUser).toHaveBeenCalledWith(
        testUsers.validUser.username,
        testUsers.validUser.password
      )
      expect(mockKeycloakClient.validateToken).toHaveBeenCalledWith(
        mockKeycloakTokenResponse.access_token
      )
      expect(mockKeycloakUserToSessionUser).toHaveBeenCalledWith(keycloakUserResponse)
    })

    it('should create session with correct data', async () => {
      const beforeTime = Math.floor(Date.now() / 1000)
      await loginService.authenticateUser(
        testUsers.validUser.username,
        testUsers.validUser.password
      )
      const afterTime = Math.floor(Date.now() / 1000)

      const sessionCall = mockCreateSessionToken.mock.calls[0][0]
      expect(sessionCall).toEqual({
        user: {
          id: keycloakUserResponse.sub,
          email: keycloakUserResponse.email,
          name: keycloakUserResponse.name,
          preferred_username: keycloakUserResponse.preferred_username,
          roles: ['client_admin'],
        },
        accessToken: mockKeycloakTokenResponse.access_token,
        refreshToken: mockKeycloakTokenResponse.refresh_token,
        expiresAt: expect.any(Number),
      })

      // Verify expiration calculation
      expect(sessionCall.expiresAt).toBeGreaterThanOrEqual(beforeTime + mockKeycloakTokenResponse.expires_in)
      expect(sessionCall.expiresAt).toBeLessThanOrEqual(afterTime + mockKeycloakTokenResponse.expires_in)
    })

    it('should create session cookie with session token', async () => {
      await loginService.authenticateUser(
        testUsers.validUser.username,
        testUsers.validUser.password
      )

      expect(mockCreateSessionCookie).toHaveBeenCalledWith('mock-session-token')
    })
  })

  describe('Input validation', () => {
    it('should throw error when email is missing', async () => {
      await expect(
        loginService.authenticateUser('', testUsers.validUser.password)
      ).rejects.toThrow('Email and password are required')

      expect(mockKeycloakClient.authenticateUser).not.toHaveBeenCalled()
    })

    it('should throw error when password is missing', async () => {
      await expect(
        loginService.authenticateUser(testUsers.validUser.username, '')
      ).rejects.toThrow('Email and password are required')

      expect(mockKeycloakClient.authenticateUser).not.toHaveBeenCalled()
    })

    it('should throw error when both email and password are missing', async () => {
      await expect(
        loginService.authenticateUser('', '')
      ).rejects.toThrow('Email and password are required')

      expect(mockKeycloakClient.authenticateUser).not.toHaveBeenCalled()
    })
  })

  describe('Authentication errors', () => {
    it('should throw user-friendly error for invalid credentials', async () => {
      mockKeycloakClient.authenticateUser.mockRejectedValueOnce(
        new Error('Authentication failed: 401 Unauthorized')
      )

      await expect(
        loginService.authenticateUser(
          testUsers.invalidUser.username,
          testUsers.invalidUser.password
        )
      ).rejects.toThrow('Invalid email or password')

      expect(mockKeycloakClient.authenticateUser).toHaveBeenCalledWith(
        testUsers.invalidUser.username,
        testUsers.invalidUser.password
      )
      expect(mockKeycloakClient.validateToken).not.toHaveBeenCalled()
    })

    it('should throw generic error for token validation failure', async () => {
      mockKeycloakClient.validateToken.mockRejectedValueOnce(
        new Error('Token validation failed')
      )

      await expect(
        loginService.authenticateUser(
          testUsers.validUser.username,
          testUsers.validUser.password
        )
      ).rejects.toThrow('Login failed. Please try again.')

      expect(mockKeycloakClient.authenticateUser).toHaveBeenCalled()
      expect(mockKeycloakClient.validateToken).toHaveBeenCalled()
    })

    it('should throw generic error for session creation failure', async () => {
      mockCreateSessionToken.mockRejectedValueOnce(
        new Error('Session token creation failed')
      )

      await expect(
        loginService.authenticateUser(
          testUsers.validUser.username,
          testUsers.validUser.password
        )
      ).rejects.toThrow('Login failed. Please try again.')
    })

    it('should handle generic errors gracefully', async () => {
      mockKeycloakClient.authenticateUser.mockRejectedValueOnce(
        new Error('Network error')
      )

      await expect(
        loginService.authenticateUser(
          testUsers.validUser.username,
          testUsers.validUser.password
        )
      ).rejects.toThrow('Login failed. Please try again.')
    })
  })

  describe('Edge cases', () => {
    it('should handle null/undefined values gracefully', async () => {
      await expect(
        loginService.authenticateUser(null as any, undefined as any)
      ).rejects.toThrow('Email and password are required')
    })

    it('should handle whitespace-only inputs', async () => {
      await expect(
        loginService.authenticateUser('   ', '   ')
      ).rejects.toThrow('Email and password are required')
    })

    it('should handle non-string error messages', async () => {
      mockKeycloakClient.authenticateUser.mockRejectedValueOnce(
        { code: 'NETWORK_ERROR', details: {} } // Non-Error object
      )

      await expect(
        loginService.authenticateUser(
          testUsers.validUser.username,
          testUsers.validUser.password
        )
      ).rejects.toThrow('Login failed. Please try again.')
    })
  })
})
