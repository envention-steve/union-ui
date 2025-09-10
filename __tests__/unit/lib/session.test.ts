import { 
  createSessionToken, 
  verifySessionToken, 
  createSessionCookie, 
  clearSessionCookie,
  keycloakUserToSessionUser,
  isSessionExpiringSoon 
} from '@/lib/session'
import { mockSessionData } from '../../utils/test-utils'
import { keycloakUserResponse } from '../../utils/mocks/users'

// Mock jose library
jest.mock('jose', () => ({
  SignJWT: jest.fn(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setIssuer: jest.fn().mockReturnThis(),
    setAudience: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
  jwtVerify: jest.fn(),
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('Session Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createSessionToken', () => {
    it('should create a JWT token with correct structure', async () => {
      const { SignJWT } = require('jose')
      
      const result = await createSessionToken(mockSessionData)

      expect(result).toBe('mock-jwt-token')
      expect(SignJWT).toHaveBeenCalled()
      
      const signJWTInstance = SignJWT.mock.results[0].value
      expect(signJWTInstance.setProtectedHeader).toHaveBeenCalledWith({ alg: 'HS256' })
      expect(signJWTInstance.setIssuedAt).toHaveBeenCalled()
      expect(signJWTInstance.setIssuer).toHaveBeenCalledWith('union-benefits-ui')
      expect(signJWTInstance.setAudience).toHaveBeenCalledWith('union-benefits-api')
      expect(signJWTInstance.setExpirationTime).toHaveBeenCalledWith(mockSessionData.expiresAt)
    })
  })

  describe('verifySessionToken', () => {
    const { jwtVerify } = require('jose')

    it('should successfully verify a valid token', async () => {
      jwtVerify.mockResolvedValueOnce({ payload: mockSessionData })

      const result = await verifySessionToken('valid-token')

      expect(result).toEqual(mockSessionData)
      expect(jwtVerify).toHaveBeenCalledWith(
        'valid-token',
        expect.any(Object), // The secret is a Uint8Array
        {
          issuer: 'union-benefits-ui',
          audience: 'union-benefits-api',
        }
      )
    })

    it('should throw error for invalid token', async () => {
      jwtVerify.mockRejectedValueOnce(new Error('Invalid signature'))

      await expect(
        verifySessionToken('invalid-token')
      ).rejects.toThrow('Invalid session token')
    })
  })

  describe('createSessionCookie', () => {
    it('should create cookie with correct attributes', () => {
      const result = createSessionCookie('test-token')

      expect(result).toBe(
        'union-session=test-token; Max-Age=86400; Path=/; HttpOnly; SameSite=Strict'
      )
    })

    it('should include Secure attribute in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const result = createSessionCookie('test-token')

      expect(result).toContain('Secure')
      
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('clearSessionCookie', () => {
    it('should create cookie clearing directive', () => {
      const result = clearSessionCookie()

      expect(result).toBe(
        'union-session=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict'
      )
    })
  })

  describe('keycloakUserToSessionUser', () => {
    it('should convert Keycloak user to session user format', () => {
      const result = keycloakUserToSessionUser(keycloakUserResponse)

      expect(result).toEqual({
        id: keycloakUserResponse.sub,
        email: keycloakUserResponse.email,
        name: keycloakUserResponse.name,
        preferred_username: keycloakUserResponse.preferred_username,
        roles: ['client_admin', 'manage-account', 'manage-account-links', 'view-profile'],
      })
    })

    it('should filter out system roles', () => {
      const keycloakUserWithSystemRoles = {
        ...keycloakUserResponse,
        realm_access: {
          roles: ['default-roles-union', 'offline_access', 'uma_authorization', 'admin'],
        },
      }

      const result = keycloakUserToSessionUser(keycloakUserWithSystemRoles)

      expect(result.roles).toEqual(['admin', 'manage-account', 'manage-account-links', 'view-profile'])
    })

    it('should handle missing name by combining first and last name', () => {
      const keycloakUserWithoutName = {
        ...keycloakUserResponse,
        name: undefined as any,
      }

      const result = keycloakUserToSessionUser(keycloakUserWithoutName)

      expect(result.name).toBe('Test User')
    })
  })

  describe('isSessionExpiringSoon', () => {
    it('should return true for sessions expiring within 5 minutes', () => {
      const expiringSoonSession = {
        ...mockSessionData,
        expiresAt: Math.floor(Date.now() / 1000) + 200, // 3 minutes from now
      }

      const result = isSessionExpiringSoon(expiringSoonSession)

      expect(result).toBe(true)
    })

    it('should return false for sessions with more than 5 minutes remaining', () => {
      const validSession = {
        ...mockSessionData,
        expiresAt: Math.floor(Date.now() / 1000) + 600, // 10 minutes from now
      }

      const result = isSessionExpiringSoon(validSession)

      expect(result).toBe(false)
    })

    it('should return true for already expired sessions', () => {
      const expiredSession = {
        ...mockSessionData,
        expiresAt: Math.floor(Date.now() / 1000) - 100, // Already expired
      }

      const result = isSessionExpiringSoon(expiredSession)

      expect(result).toBe(true)
    })
  })
})
