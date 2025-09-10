import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/store/auth-store'
import { authApiClient } from '@/lib/api-client'
import { testUsers } from '../utils/mocks/users'

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  authApiClient: {
    auth: {
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      me: jest.fn(),
    },
  },
}))

const mockAuthApiClient = authApiClient.auth as jest.Mocked<typeof authApiClient.auth>

// Mock user data for testing
const mockUser = {
  id: '34d060e6-3f3b-426a-94f1-4095086bfc69',
  email: 'test_user1@gmail.com',
  name: 'Test User',
  preferred_username: 'test_user1',
  roles: ['client_admin'],
}

const mockLoginResponse = {
  success: true,
  user: mockUser,
  message: 'Login successful',
}

describe('useAuthStore Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset the store state to initial values
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      expiresAt: null,
      isExpiringSoon: false,
    })
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore())
      
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.expiresAt).toBeNull()
      expect(result.current.isExpiringSoon).toBe(false)
    })
  })

  describe('Login - Success Cases', () => {
    it('should successfully login with valid credentials', async () => {
      mockAuthApiClient.login.mockResolvedValueOnce(mockLoginResponse)
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.login({
          email: testUsers.validUser.username,
          password: testUsers.validUser.password,
        })
      })
      
      expect(mockAuthApiClient.login).toHaveBeenCalledWith({
        email: testUsers.validUser.username,
        password: testUsers.validUser.password,
      })
      
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Login - Error Cases', () => {
    it('should handle login failure', async () => {
      const errorMessage = 'Invalid credentials'
      mockAuthApiClient.login.mockRejectedValueOnce(new Error(errorMessage))
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        try {
          await result.current.login({
            email: testUsers.invalidUser.username,
            password: testUsers.invalidUser.password,
          })
        } catch (error) {
          // Expected error
        }
      })
      
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(errorMessage)
      expect(result.current.expiresAt).toBeNull()
      expect(result.current.isExpiringSoon).toBe(false)
    })

    it('should handle non-success response', async () => {
      mockAuthApiClient.login.mockResolvedValueOnce({
        success: false,
        message: 'Login failed',
      })
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        try {
          await result.current.login({
            email: testUsers.validUser.username,
            password: testUsers.validUser.password,
          })
        } catch (error) {
          // Expected error
        }
      })
      
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Login failed')
    })
  })

  describe('Logout', () => {
    it('should successfully logout', async () => {
      // Setup: Login first
      mockAuthApiClient.login.mockResolvedValueOnce(mockLoginResponse)
      mockAuthApiClient.logout.mockResolvedValueOnce({ success: true })
      
      const { result } = renderHook(() => useAuthStore())
      
      // Login first
      await act(async () => {
        await result.current.login({
          email: testUsers.validUser.username,
          password: testUsers.validUser.password,
        })
      })
      
      expect(result.current.isAuthenticated).toBe(true)
      
      // Now logout
      await act(async () => {
        await result.current.logout()
      })
      
      expect(mockAuthApiClient.logout).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.expiresAt).toBeNull()
      expect(result.current.isExpiringSoon).toBe(false)
    })

    it('should clear state even if logout API call fails', async () => {
      // Setup: Login first  
      mockAuthApiClient.login.mockResolvedValueOnce(mockLoginResponse)
      mockAuthApiClient.logout.mockRejectedValueOnce(new Error('Network error'))
      
      const { result } = renderHook(() => useAuthStore())
      
      // Login first
      await act(async () => {
        await result.current.login({
          email: testUsers.validUser.username,
          password: testUsers.validUser.password,
        })
      })
      
      // Mock console.warn to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Logout should still clear state even if API fails
      await act(async () => {
        await result.current.logout()
      })
      
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.expiresAt).toBeNull()
      expect(result.current.isExpiringSoon).toBe(false)
      
      expect(consoleSpy).toHaveBeenCalledWith('Logout API call failed:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('State Setters', () => {
    it('should set user correctly', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.setUser(mockUser)
      })
      
      expect(result.current.user).toEqual(mockUser)
    })

    it('should set error correctly', () => {
      const { result } = renderHook(() => useAuthStore())
      const errorMessage = 'Test error'
      
      act(() => {
        result.current.setError(errorMessage)
      })
      
      expect(result.current.error).toBe(errorMessage)
    })

    it('should clear error', () => {
      const { result } = renderHook(() => useAuthStore())
      
      // Set error first
      act(() => {
        result.current.setError('Test error')
      })
      
      expect(result.current.error).toBe('Test error')
      
      // Clear error
      act(() => {
        result.current.clearError()
      })
      
      expect(result.current.error).toBeNull()
    })
  })

  describe('RefreshSession', () => {
    it('should successfully refresh session', async () => {
      const refreshResponse = {
        success: true,
        user: mockUser,
      }
      
      mockAuthApiClient.refreshToken.mockResolvedValueOnce(refreshResponse)
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.refreshSession()
      })
      
      expect(mockAuthApiClient.refreshToken).toHaveBeenCalled()
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it('should handle refresh failure by logging out', async () => {
      mockAuthApiClient.refreshToken.mockRejectedValueOnce(new Error('Token expired'))
      mockAuthApiClient.logout.mockResolvedValueOnce({ success: true })
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        try {
          await result.current.refreshSession()
        } catch (error) {
          // Expected error
        }
      })
      
      expect(mockAuthApiClient.refreshToken).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('CheckAuth', () => {
    it('should successfully validate existing session', async () => {
      const mockMeResponse = {
        success: true,
        user: mockUser,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        isExpiringSoon: false,
      }
      
      mockAuthApiClient.me.mockResolvedValueOnce(mockMeResponse)
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        await result.current.checkAuth()
      })
      
      expect(mockAuthApiClient.me).toHaveBeenCalled()
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.expiresAt).toBe(mockMeResponse.expiresAt)
      expect(result.current.isExpiringSoon).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should clear state when session is invalid', async () => {
      mockAuthApiClient.me.mockRejectedValueOnce(new Error('Session invalid'))
      
      const { result } = renderHook(() => useAuthStore())
      
      // Set some initial state to ensure it gets cleared
      act(() => {
        result.current.setUser(mockUser)
      })
      
      await act(async () => {
        await result.current.checkAuth()
      })
      
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.expiresAt).toBeNull()
      expect(result.current.isExpiringSoon).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Error Scenarios', () => {
    it('should handle network errors gracefully', async () => {
      mockAuthApiClient.login.mockRejectedValueOnce(new Error('Network error'))
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        try {
          await result.current.login({
            email: testUsers.validUser.username,
            password: testUsers.validUser.password,
          })
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }
      })
      
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Network error')
    })

    it('should handle non-Error exceptions', async () => {
      mockAuthApiClient.login.mockRejectedValueOnce('String error')
      
      const { result } = renderHook(() => useAuthStore())
      
      await act(async () => {
        try {
          await result.current.login({
            email: testUsers.validUser.username,
            password: testUsers.validUser.password,
          })
        } catch (error) {
          // Expected error
        }
      })
      
      expect(result.current.error).toBe('Login failed')
    })
  })
})
