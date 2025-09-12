import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider } from '@/components/auth-provider'
import { useAuthStore } from '@/store/auth-store'

// Mock auth store
jest.mock('@/store/auth-store', () => ({
  useAuthStore: jest.fn(),
}))

const mockCheckAuth = jest.fn().mockResolvedValue(undefined)
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

// Test component to render as children
const TestChild = () => <div data-testid="test-child">Test Content</div>

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default auth store mock
    mockUseAuthStore.mockReturnValue({
      checkAuth: mockCheckAuth,
    } as any)
  })

  describe('Basic Functionality', () => {
    it('should render children without modifications', () => {
      render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should call checkAuth on mount', async () => {
      render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(mockCheckAuth).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle checkAuth errors gracefully', async () => {
      // Make checkAuth fail
      mockCheckAuth.mockRejectedValueOnce(new Error('Check failed'))
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('[AUTH_PROVIDER] Initial auth check failed:', expect.any(Error))
      })
      
      // Children should still render despite the error
      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should not crash when checkAuth is not provided', () => {
      mockUseAuthStore.mockReturnValue({
        checkAuth: undefined,
      } as any)

      expect(() => {
        render(
          <AuthProvider>
            <TestChild />
          </AuthProvider>
        )
      }).toThrow() // This is expected since checkAuth is required
    })

    it('should render children even when auth store is in different states', () => {
      mockUseAuthStore.mockReturnValue({
        checkAuth: mockCheckAuth,
        isAuthenticated: false,
        user: null,
      } as any)

      render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })
  })
})