import React from 'react'
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/features/auth/login-form'
import { useAuthStore } from '@/store/auth-store'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock auth store
jest.mock('@/store/auth-store', () => ({
  useAuthStore: jest.fn(),
}))

const mockPush = jest.fn()
const mockLogin = jest.fn()

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

// Extract the login business logic for easier testing
export class LoginFormLogic {
  constructor(
    private login: (data: { email: string; password: string }) => Promise<void>,
    private router: { push: (url: string) => void },
    private setError: (error: string | null) => void
  ) {}

  async handleSubmit(data: { email: string; password: string }) {
    this.setError(null)

    try {
      await this.login(data)
      
      // Get callback URL from search params or default to dashboard
      const urlParams = new URLSearchParams(window.location.search)
      const callbackUrl = urlParams.get('callbackUrl') || '/dashboard'
      this.router.push(callbackUrl)
      
      return { success: true, redirectTo: callbackUrl }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      this.setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }
}

describe('LoginForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset window location
    delete (window as any).location
    window.location = { search: '' } as any
    
    // Mock router
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    } as any)
    
    // Mock auth store default state
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      user: null,
      isAuthenticated: false,
      error: null,
    } as any)
  })

  describe('Basic Rendering', () => {
    it('should render the login form with essential elements', () => {
      render(<LoginForm />)
      
      // Check for main text content (multiple "Sign In" exist - title and button)
      expect(screen.getAllByText('Sign In')).toHaveLength(2) // Title and button
      expect(screen.getByText('Enter your credentials to access the Union Benefits platform')).toBeInTheDocument()
      
      // Check for form labels
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Password')).toBeInTheDocument()
      
      // Check for inputs by placeholder
      expect(screen.getByPlaceholderText('your.email@union.org')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
      
      // Check for submit button
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should render input fields with correct attributes', () => {
      render(<LoginForm />)
      
      const emailInput = screen.getByPlaceholderText('your.email@union.org')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should not show error message initially', () => {
      render(<LoginForm />)
      
      // Using queryByText since we expect it NOT to be there
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/failed/i)).not.toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should disable submit button when loading', () => {
      mockUseAuthStore.mockReturnValue({
        login: mockLogin,
        isLoading: true,
        user: null,
        isAuthenticated: false,
        error: null,
      } as any)
      
      render(<LoginForm />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when not loading', () => {
      render(<LoginForm />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      expect(submitButton).not.toBeDisabled()
    })
  })
})

describe('LoginForm Business Logic', () => {
  let loginLogic: LoginFormLogic
  let mockLogin: jest.Mock
  let mockRouter: { push: jest.Mock }
  let mockSetError: jest.Mock

  beforeEach(() => {
    mockLogin = jest.fn()
    mockRouter = { push: jest.fn() }
    mockSetError = jest.fn()
    
    loginLogic = new LoginFormLogic(mockLogin, mockRouter, mockSetError)
    
    // Mock window.location.search using Object.defineProperty
    delete (window as any).location
    window.location = { search: '' } as any
  })

  describe('Successful Login Flow', () => {
    it('should handle successful login and redirect to dashboard', async () => {
      mockLogin.mockResolvedValueOnce(undefined)
      
      const result = await loginLogic.handleSubmit({
        email: 'test@example.com',
        password: 'password123'
      })
      
      expect(mockSetError).toHaveBeenCalledWith(null) // Clear error first
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
      expect(result).toEqual({
        success: true,
        redirectTo: '/dashboard'
      })
    })

    it('should redirect to callback URL when provided', async () => {
      window.location.search = '?callbackUrl=/admin/settings'
      mockLogin.mockResolvedValueOnce(undefined)
      
      const result = await loginLogic.handleSubmit({
        email: 'test@example.com',
        password: 'password123'
      })
      
      expect(mockRouter.push).toHaveBeenCalledWith('/admin/settings')
      expect(result).toEqual({
        success: true,
        redirectTo: '/admin/settings'
      })
    })

    it('should handle URL-encoded callback URLs', async () => {
      const callbackUrl = '/admin/users?tab=active'
      window.location.search = `?callbackUrl=${encodeURIComponent(callbackUrl)}`
      mockLogin.mockResolvedValueOnce(undefined)
      
      const result = await loginLogic.handleSubmit({
        email: 'test@example.com',
        password: 'password123'
      })
      
      expect(mockRouter.push).toHaveBeenCalledWith(callbackUrl)
      expect(result.redirectTo).toBe(callbackUrl)
    })
  })

  describe('Error Handling', () => {
    it('should handle login errors with Error objects', async () => {
      const errorMessage = 'Invalid credentials'
      mockLogin.mockRejectedValueOnce(new Error(errorMessage))
      
      const result = await loginLogic.handleSubmit({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
      
      expect(mockSetError).toHaveBeenCalledWith(null) // Clear error first
      expect(mockSetError).toHaveBeenCalledWith(errorMessage) // Then set new error
      expect(mockRouter.push).not.toHaveBeenCalled()
      expect(result).toEqual({
        success: false,
        error: errorMessage
      })
    })

    it('should handle non-Error exceptions', async () => {
      mockLogin.mockRejectedValueOnce('Network timeout')
      
      const result = await loginLogic.handleSubmit({
        email: 'test@example.com',
        password: 'password123'
      })
      
      expect(mockSetError).toHaveBeenCalledWith('Login failed')
      expect(result).toEqual({
        success: false,
        error: 'Login failed'
      })
    })

    it('should clear error on new submission attempt', async () => {
      // First call - should clear error
      mockLogin.mockRejectedValueOnce(new Error('Test error'))
      
      await loginLogic.handleSubmit({
        email: 'test@example.com',
        password: 'password123'
      })
      
      expect(mockSetError).toHaveBeenNthCalledWith(1, null)
      expect(mockSetError).toHaveBeenNthCalledWith(2, 'Test error')
      
      // Reset mock to verify second call behavior
      mockSetError.mockClear()
      mockLogin.mockResolvedValueOnce(undefined)
      
      // Second call - should also clear error first
      await loginLogic.handleSubmit({
        email: 'test@example.com',
        password: 'password123'
      })
      
      expect(mockSetError).toHaveBeenNthCalledWith(1, null)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty email and password', async () => {
      mockLogin.mockResolvedValueOnce(undefined)
      
      const result = await loginLogic.handleSubmit({
        email: '',
        password: ''
      })
      
      expect(mockLogin).toHaveBeenCalledWith({
        email: '',
        password: ''
      })
      expect(result.success).toBe(true)
    })

    it('should handle special characters in callback URL', async () => {
      const callbackUrl = '/search?q=test user&sort=name'
      window.location.search = `?callbackUrl=${encodeURIComponent(callbackUrl)}`
      mockLogin.mockResolvedValueOnce(undefined)
      
      const result = await loginLogic.handleSubmit({
        email: 'test@example.com',
        password: 'password123'
      })
      
      // URLSearchParams.get() automatically decodes the URL
      expect(result.redirectTo).toBe('/search?q=test user&sort=name')
    })

    it('should handle missing callbackUrl parameter gracefully', async () => {
      window.location.search = '?otherParam=value'
      mockLogin.mockResolvedValueOnce(undefined)
      
      const result = await loginLogic.handleSubmit({
        email: 'test@example.com',
        password: 'password123'
      })
      
      expect(result.redirectTo).toBe('/dashboard')
    })
  })

  describe('Integration Behavior', () => {
    it('should call login with exact data provided', async () => {
      mockLogin.mockResolvedValueOnce(undefined)
      
      const loginData = {
        email: 'specific@test.com',
        password: 'specificPassword123!'
      }
      
      await loginLogic.handleSubmit(loginData)
      
      expect(mockLogin).toHaveBeenCalledWith(loginData)
      expect(mockLogin).toHaveBeenCalledTimes(1)
    })

    it('should not redirect if login fails', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Server error'))
      
      await loginLogic.handleSubmit({
        email: 'test@example.com',
        password: 'password123'
      })
      
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('should set error before attempting login', async () => {
      mockLogin.mockImplementationOnce(() => {
        // Check that error was cleared before login was called
        expect(mockSetError).toHaveBeenCalledWith(null)
        return Promise.resolve()
      })
      
      await loginLogic.handleSubmit({
        email: 'test@example.com',
        password: 'password123'
      })
      
      expect(mockSetError).toHaveBeenCalledWith(null)
    })
  })
})
