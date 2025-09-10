import { getServerSession, clearSessionCookie } from '@/lib/session'
import { keycloakClient } from '@/lib/keycloak'

// Mock dependencies
jest.mock('@/lib/session', () => ({
  getServerSession: jest.fn(),
  clearSessionCookie: jest.fn(),
}))

jest.mock('@/lib/keycloak', () => ({
  keycloakClient: {
    logoutUser: jest.fn(),
  },
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockClearSessionCookie = clearSessionCookie as jest.MockedFunction<typeof clearSessionCookie>
const mockKeycloakClient = keycloakClient as jest.Mocked<typeof keycloakClient>

// Logout business logic extracted for testing
class LogoutService {
  async logoutUser() {
    try {
      // Get current session
      const session = await getServerSession()

      // If we have a session with refresh token, logout from Keycloak
      if (session?.refreshToken) {
        try {
          await keycloakClient.logoutUser(session.refreshToken)
        } catch (error) {
          // Log but don't fail logout if Keycloak call fails
          console.warn('Keycloak logout failed:', error)
        }
      }

      // Clear session cookie
      const sessionCookie = clearSessionCookie()

      return {
        success: true,
        message: 'Logout successful',
        sessionCookie,
      }
    } catch (error) {
      console.error('Logout error:', error)
      
      // Still clear the cookie even if there's an error
      const sessionCookie = clearSessionCookie()
      
      return {
        error: 'Logout completed with errors',
        sessionCookie,
      }
    }
  }
}

describe('Logout Service', () => {
  let logoutService: LogoutService

  beforeEach(() => {
    logoutService = new LogoutService()
    jest.clearAllMocks()
    
    // Setup default mocks
    mockClearSessionCookie.mockReturnValue('union-session=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict')
  })

  describe('Successful logout flow', () => {
    it('should successfully logout with valid session', async () => {
      const mockSession = {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
          preferred_username: 'testuser',
          roles: ['client_admin'],
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      }
      
      mockGetServerSession.mockResolvedValueOnce(mockSession)
      mockKeycloakClient.logoutUser.mockResolvedValueOnce(undefined)

      const result = await logoutService.logoutUser()

      expect(result).toEqual({
        success: true,
        message: 'Logout successful',
        sessionCookie: expect.stringContaining('union-session='),
      })

      expect(mockGetServerSession).toHaveBeenCalled()
      expect(mockKeycloakClient.logoutUser).toHaveBeenCalledWith('mock-refresh-token')
      expect(mockClearSessionCookie).toHaveBeenCalled()
    })

    it('should logout successfully even without session', async () => {
      mockGetServerSession.mockResolvedValueOnce(null)

      const result = await logoutService.logoutUser()

      expect(result).toEqual({
        success: true,
        message: 'Logout successful',
        sessionCookie: expect.stringContaining('union-session='),
      })

      expect(mockGetServerSession).toHaveBeenCalled()
      expect(mockKeycloakClient.logoutUser).not.toHaveBeenCalled()
      expect(mockClearSessionCookie).toHaveBeenCalled()
    })

    it('should logout successfully even without refresh token', async () => {
      const mockSession = {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
          preferred_username: 'testuser',
          roles: ['client_admin'],
        },
        accessToken: 'mock-access-token',
        refreshToken: null, // No refresh token
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      }
      
      mockGetServerSession.mockResolvedValueOnce(mockSession)

      const result = await logoutService.logoutUser()

      expect(result).toEqual({
        success: true,
        message: 'Logout successful',
        sessionCookie: expect.stringContaining('union-session='),
      })

      expect(mockGetServerSession).toHaveBeenCalled()
      expect(mockKeycloakClient.logoutUser).not.toHaveBeenCalled()
      expect(mockClearSessionCookie).toHaveBeenCalled()
    })
  })

  describe('Keycloak logout failure handling', () => {
    it('should complete logout even if Keycloak logout fails', async () => {
      const mockSession = {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
          preferred_username: 'testuser',
          roles: ['client_admin'],
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      }
      
      mockGetServerSession.mockResolvedValueOnce(mockSession)
      mockKeycloakClient.logoutUser.mockRejectedValueOnce(new Error('Keycloak server error'))
      
      // Mock console.warn to check if it's called
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await logoutService.logoutUser()

      expect(result).toEqual({
        success: true,
        message: 'Logout successful',
        sessionCookie: expect.stringContaining('union-session='),
      })

      expect(mockGetServerSession).toHaveBeenCalled()
      expect(mockKeycloakClient.logoutUser).toHaveBeenCalledWith('mock-refresh-token')
      expect(mockClearSessionCookie).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('Keycloak logout failed:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should handle different types of Keycloak errors', async () => {
      const mockSession = {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
          preferred_username: 'testuser',
          roles: ['client_admin'],
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      }
      
      mockGetServerSession.mockResolvedValueOnce(mockSession)
      mockKeycloakClient.logoutUser.mockRejectedValueOnce('Network error')
      
      // Mock console.warn to check if it's called
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await logoutService.logoutUser()

      expect(result).toEqual({
        success: true,
        message: 'Logout successful',
        sessionCookie: expect.stringContaining('union-session='),
      })

      expect(consoleSpy).toHaveBeenCalledWith('Keycloak logout failed:', 'Network error')
      
      consoleSpy.mockRestore()
    })
  })

  describe('Session retrieval failure handling', () => {
    it('should handle session retrieval failure gracefully', async () => {
      mockGetServerSession.mockRejectedValueOnce(new Error('Session error'))
      
      // Mock console.error to check if it's called
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const result = await logoutService.logoutUser()

      expect(result).toEqual({
        error: 'Logout completed with errors',
        sessionCookie: expect.stringContaining('union-session='),
      })

      expect(mockGetServerSession).toHaveBeenCalled()
      expect(mockKeycloakClient.logoutUser).not.toHaveBeenCalled()
      expect(mockClearSessionCookie).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should handle cookie clearing failure', async () => {
      mockGetServerSession.mockResolvedValueOnce(null)
      mockClearSessionCookie.mockImplementationOnce(() => {
        throw new Error('Cookie error')
      })
      
      // Mock console.error to check if it's called
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const result = await logoutService.logoutUser()

      expect(result).toEqual({
        error: 'Logout completed with errors',
        sessionCookie: expect.stringContaining('union-session='),
      })

      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('Edge cases', () => {
    it('should handle session with undefined refreshToken', async () => {
      const mockSession = {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
          preferred_username: 'testuser',
          roles: ['client_admin'],
        },
        accessToken: 'mock-access-token',
        refreshToken: undefined, // Explicitly undefined
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      }
      
      mockGetServerSession.mockResolvedValueOnce(mockSession)

      const result = await logoutService.logoutUser()

      expect(result).toEqual({
        success: true,
        message: 'Logout successful',
        sessionCookie: expect.stringContaining('union-session='),
      })

      expect(mockKeycloakClient.logoutUser).not.toHaveBeenCalled()
    })

    it('should handle empty string refreshToken', async () => {
      const mockSession = {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
          preferred_username: 'testuser',
          roles: ['client_admin'],
        },
        accessToken: 'mock-access-token',
        refreshToken: '', // Empty string
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      }
      
      mockGetServerSession.mockResolvedValueOnce(mockSession)

      const result = await logoutService.logoutUser()

      expect(result).toEqual({
        success: true,
        message: 'Logout successful',
        sessionCookie: expect.stringContaining('union-session='),
      })

      expect(mockKeycloakClient.logoutUser).not.toHaveBeenCalled()
    })
  })

  describe('Cookie management', () => {
    it('should always clear session cookie regardless of success or failure', async () => {
      // Test successful case
      mockGetServerSession.mockResolvedValueOnce(null)
      await logoutService.logoutUser()
      expect(mockClearSessionCookie).toHaveBeenCalled()

      // Reset mock
      mockClearSessionCookie.mockClear()

      // Test failure case
      mockGetServerSession.mockRejectedValueOnce(new Error('Test error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      await logoutService.logoutUser()
      expect(mockClearSessionCookie).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should return cookie string in both success and error cases', async () => {
      // Success case
      mockGetServerSession.mockResolvedValueOnce(null)
      let result = await logoutService.logoutUser()
      expect(result.sessionCookie).toBeDefined()
      expect(typeof result.sessionCookie).toBe('string')

      // Error case
      mockGetServerSession.mockRejectedValueOnce(new Error('Test error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      result = await logoutService.logoutUser()
      expect(result.sessionCookie).toBeDefined()
      expect(typeof result.sessionCookie).toBe('string')
      
      consoleSpy.mockRestore()
    })
  })
})
