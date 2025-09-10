import { http, HttpResponse } from 'msw'
import { mockUser } from '../test-utils'

const API_BASE_URL = 'http://localhost:3000'

export const authHandlers = [
  // Login endpoint
  http.post(`${API_BASE_URL}/api/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    
    // Simulate successful login with test credentials
    if (body.email === 'test_user1' && body.password === 'envention') {
      return HttpResponse.json({
        success: true,
        user: mockUser,
        message: 'Login successful',
      }, {
        headers: {
          'Set-Cookie': 'union-session=mock-session-token; Path=/; HttpOnly; SameSite=Strict',
        },
      })
    }
    
    // Simulate login failure
    return HttpResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  }),

  // Logout endpoint
  http.post(`${API_BASE_URL}/api/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Logout successful',
    }, {
      headers: {
        'Set-Cookie': 'union-session=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict',
      },
    })
  }),

  // Current user endpoint
  http.get(`${API_BASE_URL}/api/auth/me`, ({ request }) => {
    const cookies = request.headers.get('Cookie') || ''
    
    if (cookies.includes('union-session=mock-session-token')) {
      return HttpResponse.json({
        success: true,
        user: mockUser,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        isExpiringSoon: false,
      })
    }
    
    return HttpResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }),

  // Token refresh endpoint
  http.post(`${API_BASE_URL}/api/auth/refresh`, ({ request }) => {
    const cookies = request.headers.get('Cookie') || ''
    
    if (cookies.includes('union-session=')) {
      return HttpResponse.json({
        success: true,
        user: mockUser,
        message: 'Token refreshed successfully',
      }, {
        headers: {
          'Set-Cookie': 'union-session=refreshed-session-token; Path=/; HttpOnly; SameSite=Strict',
        },
      })
    }
    
    return HttpResponse.json(
      { error: 'No refresh token available' },
      { status: 401 }
    )
  }),
]
