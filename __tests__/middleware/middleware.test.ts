import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '@/middleware'
import { getSessionFromRequest } from '@/lib/session'

// Mock the session function
jest.mock('@/lib/session', () => ({
  getSessionFromRequest: jest.fn(),
}))

// Mock NextResponse methods
const mockRedirect = jest.fn()
const mockNext = jest.fn()

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    redirect: jest.fn().mockImplementation((...args) => {
      mockRedirect(...args)
      return 'redirect-response'
    }),
    next: jest.fn().mockImplementation((...args) => {
      mockNext(...args)
      return 'next-response'
    }),
  },
}))

const mockGetSessionFromRequest = getSessionFromRequest as jest.MockedFunction<typeof getSessionFromRequest>

// Helper function to create mock request
function createMockRequest(pathname: string, baseUrl = 'https://example.com') {
  return {
    nextUrl: {
      pathname,
    },
    url: baseUrl + pathname,
  } as NextRequest
}

// Helper function to create mock session
function createMockSession(expiresAt: number, isValid = true) {
  return isValid ? {
    user: { id: '1', email: 'test@example.com' },
    expiresAt,
    accessToken: 'mock-token',
  } : null
}

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset to current time for consistent testing
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000) // 2022-01-01T00:00:00.000Z
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('API Routes', () => {
    it('should allow all API routes to pass through', async () => {
      const request = createMockRequest('/api/auth/login')
      
      await middleware(request)
      
      expect(mockNext).toHaveBeenCalled()
      expect(mockRedirect).not.toHaveBeenCalled()
      expect(mockGetSessionFromRequest).not.toHaveBeenCalled()
    })

    it('should allow nested API routes', async () => {
      const request = createMockRequest('/api/users/profile')
      
      await middleware(request)
      
      expect(mockNext).toHaveBeenCalled()
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should allow API routes with query parameters', async () => {
      const request = createMockRequest('/api/data?limit=10')
      
      await middleware(request)
      
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('Public Routes', () => {
    const publicRoutes = ['/', '/login']

    publicRoutes.forEach(route => {
      it(`should allow access to public route: ${route}`, async () => {
        const request = createMockRequest(route)
        mockGetSessionFromRequest.mockResolvedValue(null)
        
        await middleware(request)
        
        expect(mockNext).toHaveBeenCalled()
        expect(mockRedirect).not.toHaveBeenCalled()
      })
    })

    it('should allow access to root route without authentication', async () => {
      const request = createMockRequest('/')
      mockGetSessionFromRequest.mockResolvedValue(null)
      
      await middleware(request)
      
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('Protected Routes', () => {
    const protectedRoutes = ['/dashboard', '/profile', '/benefits', '/claims', '/admin']

    protectedRoutes.forEach(route => {
      it(`should redirect unauthenticated users from ${route} to login`, async () => {
        const request = createMockRequest(route)
        mockGetSessionFromRequest.mockResolvedValue(null)
        
        await middleware(request)
        
        expect(mockGetSessionFromRequest).toHaveBeenCalledWith(request)
        expect(mockRedirect).toHaveBeenCalled()
        
        // Check redirect URL contains login and callback
        const redirectCall = mockRedirect.mock.calls[0][0]
        expect(redirectCall.toString()).toContain('/login')
        expect(redirectCall.toString()).toContain(`callbackUrl=${encodeURIComponent(route)}`)
      })
    })

    it('should allow authenticated users with valid sessions to access protected routes', async () => {
      const request = createMockRequest('/dashboard')
      const futureTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      const session = createMockSession(futureTime)
      
      mockGetSessionFromRequest.mockResolvedValue(session)
      
      await middleware(request)
      
      expect(mockNext).toHaveBeenCalled()
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should redirect users with expired sessions', async () => {
      const request = createMockRequest('/dashboard')
      const pastTime = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      const session = createMockSession(pastTime)
      
      mockGetSessionFromRequest.mockResolvedValue(session)
      
      await middleware(request)
      
      expect(mockRedirect).toHaveBeenCalled()
      
      const redirectCall = mockRedirect.mock.calls[0][0]
      expect(redirectCall.toString()).toContain('/login')
      expect(redirectCall.toString()).toContain('error=session-expired')
      expect(redirectCall.toString()).toContain('callbackUrl=%2Fdashboard')
    })

    it('should handle nested protected routes', async () => {
      const request = createMockRequest('/dashboard/settings/profile')
      mockGetSessionFromRequest.mockResolvedValue(null)
      
      await middleware(request)
      
      expect(mockRedirect).toHaveBeenCalled()
      
      const redirectCall = mockRedirect.mock.calls[0][0]
      expect(redirectCall.toString()).toContain('/login')
      expect(redirectCall.toString()).toContain('callbackUrl=%2Fdashboard%2Fsettings%2Fprofile')
    })

    it('should handle admin routes specifically', async () => {
      const request = createMockRequest('/admin/users')
      mockGetSessionFromRequest.mockResolvedValue(null)
      
      await middleware(request)
      
      expect(mockRedirect).toHaveBeenCalled()
      
      const redirectCall = mockRedirect.mock.calls[0][0]
      expect(redirectCall.toString()).toContain('/login')
      expect(redirectCall.toString()).toContain('callbackUrl=%2Fadmin%2Fusers')
    })
  })

  describe('Login Page Redirect Logic', () => {
    it('should redirect authenticated users from login page to dashboard', async () => {
      const request = createMockRequest('/login')
      const futureTime = Math.floor(Date.now() / 1000) + 3600
      const session = createMockSession(futureTime)
      
      mockGetSessionFromRequest.mockResolvedValue(session)
      
      await middleware(request)
      
      expect(mockRedirect).toHaveBeenCalled()
      
      const redirectCall = mockRedirect.mock.calls[0][0]
      expect(redirectCall.toString()).toContain('/dashboard')
    })

    it('should allow unauthenticated users to access login page', async () => {
      const request = createMockRequest('/login')
      mockGetSessionFromRequest.mockResolvedValue(null)
      
      await middleware(request)
      
      expect(mockNext).toHaveBeenCalled()
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should allow users with expired sessions to access login page', async () => {
      const request = createMockRequest('/login')
      const pastTime = Math.floor(Date.now() / 1000) - 3600
      const session = createMockSession(pastTime)
      
      mockGetSessionFromRequest.mockResolvedValue(session)
      
      await middleware(request)
      
      expect(mockNext).toHaveBeenCalled()
      expect(mockRedirect).not.toHaveBeenCalled()
    })
  })

  describe('Session Validation', () => {
    it('should check session expiration correctly', async () => {
      const request = createMockRequest('/dashboard')
      const currentTime = Math.floor(Date.now() / 1000)
      const session = createMockSession(currentTime - 1) // Expired by 1 second
      
      mockGetSessionFromRequest.mockResolvedValue(session)
      
      await middleware(request)
      
      expect(mockRedirect).toHaveBeenCalled()
      
      const redirectCall = mockRedirect.mock.calls[0][0]
      expect(redirectCall.toString()).toContain('error=session-expired')
    })

    it('should allow sessions that expire exactly at current time', async () => {
      const request = createMockRequest('/dashboard')
      const currentTime = Math.floor(Date.now() / 1000)
      const session = createMockSession(currentTime + 1) // Expires in 1 second
      
      mockGetSessionFromRequest.mockResolvedValue(session)
      
      await middleware(request)
      
      expect(mockNext).toHaveBeenCalled()
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should handle session validation errors', async () => {
      const request = createMockRequest('/dashboard')
      mockGetSessionFromRequest.mockRejectedValue(new Error('Session validation failed'))
      
      // Middleware should handle the error and redirect to login
      await expect(middleware(request)).resolves.not.toThrow()
      
      expect(mockRedirect).toHaveBeenCalled()
      
      const redirectCall = mockRedirect.mock.calls[0][0]
      expect(redirectCall.toString()).toContain('/login')
    })
  })

  describe('Route Matching Logic', () => {
    it('should match protected route prefixes correctly', async () => {
      const routes = [
        '/dashboard/nested/deep',
        '/benefits/health/details',
        '/admin/users/123/edit'
      ]

      for (const route of routes) {
        jest.clearAllMocks()
        const request = createMockRequest(route)
        mockGetSessionFromRequest.mockResolvedValue(null)
        
        await middleware(request)
        
        expect(mockRedirect).toHaveBeenCalled()
      }
    })

    it('should not match similar but non-protected routes', async () => {
      // These routes don't start with protected prefixes
      const routes = [
        '/public-dashboard',
        '/user-benefits',
        '/not-admin'
      ]

      for (const route of routes) {
        jest.clearAllMocks()
        const request = createMockRequest(route)
        
        await middleware(request)
        
        expect(mockNext).toHaveBeenCalled()
        expect(mockGetSessionFromRequest).not.toHaveBeenCalled()
      }
    })

    it('should handle edge case routes', async () => {
      const edgeCases = [
        '/random-page',
        '/contact',
        '/about'
      ]

      for (const route of edgeCases) {
        // Clear mocks for each iteration
        mockNext.mockClear()
        mockRedirect.mockClear()
        mockGetSessionFromRequest.mockClear()
        
        const request = createMockRequest(route)
        
        const result = await middleware(request)
        
        // These routes should pass through as they're not protected
        expect(mockNext).toHaveBeenCalled()
        expect(mockGetSessionFromRequest).not.toHaveBeenCalled()
        expect(mockRedirect).not.toHaveBeenCalled()
      }
    })
  })

  describe('URL Construction', () => {
    it('should construct correct login redirect URL with callback', async () => {
      const request = createMockRequest('/dashboard/settings', 'https://app.example.com')
      mockGetSessionFromRequest.mockResolvedValue(null)
      
      await middleware(request)
      
      expect(mockRedirect).toHaveBeenCalled()
      
      const redirectCall = mockRedirect.mock.calls[0][0]
      const url = new URL(redirectCall.toString())
      
      expect(url.pathname).toBe('/login')
      expect(url.searchParams.get('callbackUrl')).toBe('/dashboard/settings')
    })

    it('should construct correct expired session redirect URL', async () => {
      const request = createMockRequest('/admin/users', 'https://app.example.com')
      const pastTime = Math.floor(Date.now() / 1000) - 1000
      const session = createMockSession(pastTime)
      
      mockGetSessionFromRequest.mockResolvedValue(session)
      
      await middleware(request)
      
      const redirectCall = mockRedirect.mock.calls[0][0]
      const url = new URL(redirectCall.toString())
      
      expect(url.pathname).toBe('/login')
      expect(url.searchParams.get('callbackUrl')).toBe('/admin/users')
      expect(url.searchParams.get('error')).toBe('session-expired')
    })

    it('should construct correct dashboard redirect for authenticated users on login', async () => {
      const request = createMockRequest('/login', 'https://app.example.com')
      const futureTime = Math.floor(Date.now() / 1000) + 3600
      const session = createMockSession(futureTime)
      
      mockGetSessionFromRequest.mockResolvedValue(session)
      
      await middleware(request)
      
      const redirectCall = mockRedirect.mock.calls[0][0]
      const url = new URL(redirectCall.toString())
      
      expect(url.pathname).toBe('/dashboard')
    })
  })

  describe('Error Handling', () => {
    it('should handle session fetch errors by redirecting to login', async () => {
      const request = createMockRequest('/dashboard')
      mockGetSessionFromRequest.mockRejectedValue(new Error('Database connection failed'))
      
      await middleware(request)
      
      expect(mockRedirect).toHaveBeenCalled()
    })


    it('should handle null session gracefully', async () => {
      const request = createMockRequest('/dashboard')
      mockGetSessionFromRequest.mockResolvedValue(null)
      
      await middleware(request)
      
      expect(mockRedirect).toHaveBeenCalled()
    })

    it('should handle undefined session gracefully', async () => {
      const request = createMockRequest('/dashboard')
      mockGetSessionFromRequest.mockResolvedValue(undefined as any)
      
      await middleware(request)
      
      expect(mockRedirect).toHaveBeenCalled()
    })
  })

  describe('Performance Considerations', () => {
    it('should not call session validation for API routes', async () => {
      const request = createMockRequest('/api/data')
      
      await middleware(request)
      
      expect(mockGetSessionFromRequest).not.toHaveBeenCalled()
    })

    it('should not call session validation for public routes', async () => {
      const request = createMockRequest('/')
      
      await middleware(request)
      
      expect(mockGetSessionFromRequest).not.toHaveBeenCalled()
    })

    it('should only call session validation when necessary', async () => {
      // For protected routes
      const protectedRequest = createMockRequest('/dashboard')
      mockGetSessionFromRequest.mockResolvedValue(null)
      
      await middleware(protectedRequest)
      
      expect(mockGetSessionFromRequest).toHaveBeenCalledTimes(1)
      
      // For login page
      jest.clearAllMocks()
      const loginRequest = createMockRequest('/login')
      mockGetSessionFromRequest.mockResolvedValue(null)
      
      await middleware(loginRequest)
      
      expect(mockGetSessionFromRequest).toHaveBeenCalledTimes(1)
    })
  })
})
