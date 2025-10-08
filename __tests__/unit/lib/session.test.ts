import {
  createSessionToken,
  verifySessionToken,
  createSessionCookie,
  clearSessionCookie,
  keycloakUserToSessionUser,
  isSessionExpiringSoon,
  getServerSession,
  getSessionFromRequest,
  getServerSessionAllowExpired,
} from '@/lib/session'
import { mockSessionData } from '../../utils/test-utils'
import { keycloakUserResponse } from '../../utils/mocks/users'
import * as jose from 'jose'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

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
  decodeJwt: jest.fn(),
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

const mockedJose = jest.mocked(jose, true)
const mockedCookies = jest.mocked(cookies)

type CookieRecord = { value: string } | undefined

type MockCookieStore = {
  get: jest.Mock<CookieRecord, [string]>
}

const createMockCookieStore = (value?: string): MockCookieStore => ({
  get: jest.fn<CookieRecord, [string]>().mockReturnValue(
    value !== undefined ? { value } : undefined,
  ),
})

const resolveCookiesWith = (store: MockCookieStore) =>
  mockedCookies.mockResolvedValue(
    store as unknown as ReturnType<typeof cookies>,
  )

type MockRequest = {
  cookies: {
    get: jest.Mock<CookieRecord, [string]>
  }
} & Partial<NextRequest>

const createMockRequest = (cookieValue?: string): NextRequest => ({
  cookies: {
    get: jest.fn<CookieRecord, [string]>().mockReturnValue(
      cookieValue !== undefined ? { value: cookieValue } : undefined,
    ),
  },
} as unknown as NextRequest)

describe('Session Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createSessionToken', () => {
    it('should create a JWT token with correct structure', async () => {
      const result = await createSessionToken(mockSessionData)

      expect(result).toBe('mock-jwt-token')
      expect(mockedJose.SignJWT).toHaveBeenCalled()

      const signJWTInstance = mockedJose.SignJWT.mock.results[0].value
      expect(signJWTInstance.setProtectedHeader).toHaveBeenCalledWith({ alg: 'HS256' })
      expect(signJWTInstance.setIssuedAt).toHaveBeenCalled()
      expect(signJWTInstance.setIssuer).toHaveBeenCalledWith('union-benefits-ui')
      expect(signJWTInstance.setAudience).toHaveBeenCalledWith('union-benefits-api')
      expect(signJWTInstance.setExpirationTime).toHaveBeenCalledWith(mockSessionData.expiresAt)
    })
  })

  describe('verifySessionToken', () => {
    it('should successfully verify a valid token', async () => {
      mockedJose.jwtVerify.mockResolvedValueOnce({ payload: mockSessionData })

      const result = await verifySessionToken('valid-token')

      expect(result).toEqual(mockSessionData)
      expect(mockedJose.jwtVerify).toHaveBeenCalledWith(
        'valid-token',
        expect.any(Object), // The secret is a Uint8Array
        {
          issuer: 'union-benefits-ui',
          audience: 'union-benefits-api',
        }
      )
    })

    it('should throw error for invalid token', async () => {
      mockedJose.jwtVerify.mockRejectedValueOnce(new Error('Invalid signature'))

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
        name: undefined,
      } as typeof keycloakUserResponse

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

  describe('getServerSession', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should return session data when valid cookie exists', async () => {
      const mockCookieStore = createMockCookieStore('valid-session-token')
      resolveCookiesWith(mockCookieStore)
      mockedJose.jwtVerify.mockResolvedValueOnce({ payload: mockSessionData })

      const result = await getServerSession()

      expect(result).toEqual(mockSessionData)
      expect(mockCookieStore.get).toHaveBeenCalledWith('union-session')
    })

    it('should return null when no session cookie exists', async () => {
      const mockCookieStore = createMockCookieStore()
      resolveCookiesWith(mockCookieStore)

      const result = await getServerSession()

      expect(result).toBe(null)
    })

    it('should return null when session cookie has no value', async () => {
      const mockCookieStore = createMockCookieStore('')
      resolveCookiesWith(mockCookieStore)

      const result = await getServerSession()

      expect(result).toBe(null)
    })

    it('should return null and log warning when verification fails', async () => {
      const mockCookieStore = createMockCookieStore('invalid-token')
      resolveCookiesWith(mockCookieStore)
      mockedJose.jwtVerify.mockRejectedValueOnce(new Error('Verification failed'))

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await getServerSession()

      expect(result).toBe(null)
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get server session:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should use custom cookie name from environment', async () => {
      const originalCookieName = process.env.SESSION_COOKIE_NAME
      process.env.SESSION_COOKIE_NAME = 'custom-session'

      const mockCookieStore = createMockCookieStore('valid-session-token')
      resolveCookiesWith(mockCookieStore)
      mockedJose.jwtVerify.mockResolvedValueOnce({ payload: mockSessionData })

      await getServerSession()

      expect(mockCookieStore.get).toHaveBeenCalledWith('custom-session')
      
      process.env.SESSION_COOKIE_NAME = originalCookieName
    })
  })

  describe('getSessionFromRequest', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should return session data when valid cookie exists in request', async () => {
      const mockRequest = createMockRequest('valid-session-token')
      mockedJose.jwtVerify.mockResolvedValueOnce({ payload: mockSessionData })

      const result = await getSessionFromRequest(mockRequest)

      expect(result).toEqual(mockSessionData)
      expect(mockRequest.cookies.get).toHaveBeenCalledWith('union-session')
    })

    it('should return null when no session cookie exists in request', async () => {
      const mockRequest = createMockRequest()

      const result = await getSessionFromRequest(mockRequest)

      expect(result).toBe(null)
    })

    it('should return null when session cookie has no value in request', async () => {
      const mockRequest = createMockRequest('')

      const result = await getSessionFromRequest(mockRequest)

      expect(result).toBe(null)
    })

    it('should return null and log warning when verification fails', async () => {
      const mockRequest = createMockRequest('invalid-token')
      mockedJose.jwtVerify.mockRejectedValueOnce(new Error('Verification failed'))

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await getSessionFromRequest(mockRequest)

      expect(result).toBe(null)
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get session from request:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should use custom cookie name from environment', async () => {
      const originalCookieName = process.env.SESSION_COOKIE_NAME
      process.env.SESSION_COOKIE_NAME = 'custom-session'

      const mockRequest = createMockRequest('valid-session-token')
      mockedJose.jwtVerify.mockResolvedValueOnce({ payload: mockSessionData })

      await getSessionFromRequest(mockRequest)

      expect(mockRequest.cookies.get).toHaveBeenCalledWith('custom-session')
      
      process.env.SESSION_COOKIE_NAME = originalCookieName
    })
  })

  describe('getServerSessionAllowExpired', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should return expired session data when valid signature exists', async () => {
      const expiredSessionData = {
        ...mockSessionData,
        expiresAt: Math.floor(Date.now() / 1000) - 100 // Expired
      }
      
      const mockCookieStore = createMockCookieStore('expired-but-valid-token')
      resolveCookiesWith(mockCookieStore)

      mockedJose.decodeJwt.mockReturnValueOnce({
        exp: expiredSessionData.expiresAt,
      })
      mockedJose.jwtVerify.mockResolvedValueOnce({ payload: expiredSessionData })

      const result = await getServerSessionAllowExpired()

      expect(result).toEqual(expiredSessionData)
      expect(mockedJose.decodeJwt).toHaveBeenCalledWith('expired-but-valid-token')
      expect(mockedJose.jwtVerify).toHaveBeenCalledWith(
        'expired-but-valid-token',
        expect.any(Object), // secret
        {
          issuer: 'union-benefits-ui',
          audience: 'union-benefits-api',
          currentDate: expect.any(Date)
        }
      )
    })

    it('should return null when no session cookie exists', async () => {
      const mockCookieStore = createMockCookieStore()
      resolveCookiesWith(mockCookieStore)

      const result = await getServerSessionAllowExpired()

      expect(result).toBe(null)
    })

    it('should return null when session cookie has no value', async () => {
      const mockCookieStore = createMockCookieStore('')
      resolveCookiesWith(mockCookieStore)

      const result = await getServerSessionAllowExpired()

      expect(result).toBe(null)
    })

    it('should return null and log warning when verification fails', async () => {
      const mockCookieStore = createMockCookieStore('invalid-token')
      resolveCookiesWith(mockCookieStore)

      mockedJose.decodeJwt.mockReturnValueOnce({
        exp: Math.floor(Date.now() / 1000),
      })
      mockedJose.jwtVerify.mockRejectedValueOnce(new Error('Verification failed'))

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await getServerSessionAllowExpired()

      expect(result).toBe(null)
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get expired session:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should handle missing exp claim gracefully', async () => {
      const mockCookieStore = createMockCookieStore('token-without-exp')
      resolveCookiesWith(mockCookieStore)

      mockedJose.decodeJwt.mockReturnValueOnce({})
      mockedJose.jwtVerify.mockResolvedValueOnce({ payload: mockSessionData })

      const result = await getServerSessionAllowExpired()

      expect(result).toEqual(mockSessionData)
      expect(mockedJose.jwtVerify).toHaveBeenCalledWith(
        'token-without-exp',
        expect.any(Object),
        {
          issuer: 'union-benefits-ui',
          audience: 'union-benefits-api',
          currentDate: expect.any(Date)
        }
      )
    })

    it('should use custom cookie name from environment', async () => {
      const originalCookieName = process.env.SESSION_COOKIE_NAME
      process.env.SESSION_COOKIE_NAME = 'custom-session'

      const mockCookieStore = createMockCookieStore('expired-token')
      resolveCookiesWith(mockCookieStore)

      mockedJose.decodeJwt.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) })
      mockedJose.jwtVerify.mockResolvedValueOnce({ payload: mockSessionData })

      await getServerSessionAllowExpired()

      expect(mockCookieStore.get).toHaveBeenCalledWith('custom-session')
      
      process.env.SESSION_COOKIE_NAME = originalCookieName
    })
  })
})
