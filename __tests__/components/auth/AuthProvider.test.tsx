import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { AuthProvider } from '@/components/auth-provider'
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
const mockCheckAuth = jest.fn()
const mockRefreshSession = jest.fn()

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

// Test component to render as children
const TestChild = () => <div data-testid="test-child">Test Content</div>

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    // Mock router
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    } as any)
    
    // Default auth store mock
    mockUseAuthStore.mockReturnValue({
      checkAuth: mockCheckAuth,
      refreshSession: mockRefreshSession,
      isAuthenticated: false,
      expiresAt: null,
      isExpiringSoon: false,
    } as any)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
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

    it('should call checkAuth on mount', () => {
      render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      expect(mockCheckAuth).toHaveBeenCalledTimes(1)
    })
  })

  describe('Session Refresh Management', () => {
    it('should set up auto-refresh when authenticated and expiring soon', () => {
      const currentTime = Math.floor(Date.now() / 1000)
      const expiresAt = currentTime + 300 // expires in 5 minutes
      
      mockUseAuthStore.mockReturnValue({
        checkAuth: mockCheckAuth,
        refreshSession: mockRefreshSession,
        isAuthenticated: true,
        expiresAt,
        isExpiringSoon: true,
      } as any)
      
      render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      // Should not call refreshSession immediately
      expect(mockRefreshSession).not.toHaveBeenCalled()
      
      // Fast-forward to 2 minutes before expiration
      act(() => {
        jest.advanceTimersByTime(180 * 1000) // 3 minutes (5 - 2)
      })
      
      expect(mockRefreshSession).toHaveBeenCalledTimes(1)
    })

    it('should not set up auto-refresh when not authenticated', () => {
      mockUseAuthStore.mockReturnValue({
        checkAuth: mockCheckAuth,
        refreshSession: mockRefreshSession,
        isAuthenticated: false,
        expiresAt: null,
        isExpiringSoon: false,
      } as any)
      
      render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(300 * 1000)
      })
      
      expect(mockRefreshSession).not.toHaveBeenCalled()
    })

    it('should not set up auto-refresh when not expiring soon', () => {
      mockUseAuthStore.mockReturnValue({
        checkAuth: mockCheckAuth,
        refreshSession: mockRefreshSession,
        isAuthenticated: true,
        expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        isExpiringSoon: false,
      } as any)
      
      render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      act(() => {
        jest.advanceTimersByTime(300 * 1000)
      })
      
      expect(mockRefreshSession).not.toHaveBeenCalled()
    })

    it('should redirect to login when auto-refresh fails', async () => {
      const currentTime = Math.floor(Date.now() / 1000)
      const expiresAt = currentTime + 300
      
      mockUseAuthStore.mockReturnValue({
        checkAuth: mockCheckAuth,
        refreshSession: mockRefreshSession,
        isAuthenticated: true,
        expiresAt,
        isExpiringSoon: true,
      } as any)
      
      mockRefreshSession.mockRejectedValueOnce(new Error('Refresh failed'))
      
      render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      // Fast-forward to trigger refresh
      await act(async () => {
        jest.advanceTimersByTime(180 * 1000)
      })
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?error=session-expired')
      })
    })

    it('should clear previous refresh timer when setting up a new one', () => {
      const currentTime = Math.floor(Date.now() / 1000)
      const expiresAt = currentTime + 300
      
      // Initial render with expiring session
      mockUseAuthStore.mockReturnValue({
        checkAuth: mockCheckAuth,
        refreshSession: mockRefreshSession,
        isAuthenticated: true,
        expiresAt,
        isExpiringSoon: true,
      } as any)
      
      const { rerender } = render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      // Update with new expiration time (should clear previous timer)
      mockUseAuthStore.mockReturnValue({
        checkAuth: mockCheckAuth,
        refreshSession: mockRefreshSession,
        isAuthenticated: true,
        expiresAt: currentTime + 600, // new expiration - 10 minutes
        isExpiringSoon: true,
      } as any)
      
      rerender(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      // Fast-forward past the original timer (180 seconds) - should not trigger
      act(() => {
        jest.advanceTimersByTime(180 * 1000)
      })
      
      // Should not have been called yet because the timer was cleared
      expect(mockRefreshSession).not.toHaveBeenCalled()
      
      // Fast-forward to the new timer (480 seconds total = 8 minutes for new 10-minute expiration)
      act(() => {
        jest.advanceTimersByTime(300 * 1000) // Additional 300 seconds (total 480)
      })
      
      // Now it should have been called once
      expect(mockRefreshSession).toHaveBeenCalledTimes(1)
    })
  })

  describe('Periodic Session Validation', () => {
    it('should set up periodic session check when authenticated', () => {
      mockUseAuthStore.mockReturnValue({
        checkAuth: mockCheckAuth,
        refreshSession: mockRefreshSession,
        isAuthenticated: true,
        expiresAt: null,
        isExpiringSoon: false,
      } as any)
      
      render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      // Initial checkAuth call on mount
      expect(mockCheckAuth).toHaveBeenCalledTimes(1)
      
      // Fast-forward 5 minutes
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000)
      })
      
      // Should have called checkAuth again
      expect(mockCheckAuth).toHaveBeenCalledTimes(2)
      
      // Fast-forward another 5 minutes
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000)
      })
      
      expect(mockCheckAuth).toHaveBeenCalledTimes(3)
    })

    it('should not set up periodic session check when not authenticated', () => {
      mockUseAuthStore.mockReturnValue({
        checkAuth: mockCheckAuth,
        refreshSession: mockRefreshSession,
        isAuthenticated: false,
        expiresAt: null,
        isExpiringSoon: false,
      } as any)
      
      render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      // Only the initial mount call
      expect(mockCheckAuth).toHaveBeenCalledTimes(1)
      
      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(10 * 60 * 1000) // 10 minutes
      })
      
      // Should still only be the initial call
      expect(mockCheckAuth).toHaveBeenCalledTimes(1)
    })

    it('should handle session check errors gracefully', async () => {
      mockUseAuthStore.mockReturnValue({
        checkAuth: mockCheckAuth,
        refreshSession: mockRefreshSession,
        isAuthenticated: true,
        expiresAt: null,
        isExpiringSoon: false,
      } as any)
      
      // Make checkAuth fail on subsequent calls
      mockCheckAuth
        .mockResolvedValueOnce(undefined) // Initial call succeeds
        .mockRejectedValueOnce(new Error('Check failed')) // Periodic call fails
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      // Fast-forward to trigger periodic check
      await act(async () => {
        jest.advanceTimersByTime(5 * 60 * 1000)
      })
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Session check failed:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Timer Management and Cleanup', () => {
    it('should clear refresh timer on unmount', () => {
      const currentTime = Math.floor(Date.now() / 1000)
      const expiresAt = currentTime + 300
      
      mockUseAuthStore.mockReturnValue({
        checkAuth: mockCheckAuth,
        refreshSession: mockRefreshSession,
        isAuthenticated: true,
        expiresAt,
        isExpiringSoon: true,
      } as any)
      
      const { unmount } = render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      // Unmount component
      unmount()
      
      // Fast-forward time - refresh should not be called
      act(() => {
        jest.advanceTimersByTime(300 * 1000)
      })
      
      expect(mockRefreshSession).not.toHaveBeenCalled()
    })

    it('should clear session check interval on unmount', () => {
      mockUseAuthStore.mockReturnValue({
        checkAuth: mockCheckAuth,
        refreshSession: mockRefreshSession,
        isAuthenticated: true,
        expiresAt: null,
        isExpiringSoon: false,
      } as any)
      
      const { unmount } = render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      // Initial call
      expect(mockCheckAuth).toHaveBeenCalledTimes(1)
      
      // Unmount
      unmount()
      
      // Fast-forward time - no additional calls should happen
      act(() => {
        jest.advanceTimersByTime(10 * 60 * 1000)
      })
      
      expect(mockCheckAuth).toHaveBeenCalledTimes(1)
    })

    it('should clear intervals when authentication state changes to false', () => {
      const { rerender } = render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      // Initially authenticated
      mockUseAuthStore.mockReturnValue({
        checkAuth: mockCheckAuth,
        refreshSession: mockRefreshSession,
        isAuthenticated: true,
        expiresAt: null,
        isExpiringSoon: false,
      } as any)
      
      rerender(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      // Change to not authenticated
      mockUseAuthStore.mockReturnValue({
        checkAuth: mockCheckAuth,
        refreshSession: mockRefreshSession,
        isAuthenticated: false,
        expiresAt: null,
        isExpiringSoon: false,
      } as any)
      
      rerender(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      const initialCallCount = mockCheckAuth.mock.calls.length
      
      // Fast-forward time - no periodic calls should happen
      act(() => {
        jest.advanceTimersByTime(10 * 60 * 1000)
      })
      
      expect(mockCheckAuth).toHaveBeenCalledTimes(initialCallCount)
    })
  })

  describe('Edge Cases', () => {
    it('should handle negative refresh timeout gracefully', () => {
      const currentTime = Math.floor(Date.now() / 1000)
      const expiresAt = currentTime - 100 // already expired
      
      mockUseAuthStore.mockReturnValue({
        checkAuth: mockCheckAuth,
        refreshSession: mockRefreshSession,
        isAuthenticated: true,
        expiresAt,
        isExpiringSoon: true,
      } as any)
      
      render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )
      
      // Should not crash and should not set up refresh timer
      expect(mockRefreshSession).not.toHaveBeenCalled()
      
      act(() => {
        jest.advanceTimersByTime(1000)
      })
      
      expect(mockRefreshSession).not.toHaveBeenCalled()
    })

    it('should handle missing expiresAt when expiring soon', () => {
      mockUseAuthStore.mockReturnValue({
        checkAuth: mockCheckAuth,
        refreshSession: mockRefreshSession,
        isAuthenticated: true,
        expiresAt: null, // missing expiration time
        isExpiringSoon: true,
      } as any)
      
      expect(() => {
        render(
          <AuthProvider>
            <TestChild />
          </AuthProvider>
        )
      }).not.toThrow()
      
      // Should not set up refresh timer
      act(() => {
        jest.advanceTimersByTime(300 * 1000)
      })
      
      expect(mockRefreshSession).not.toHaveBeenCalled()
    })
  })
})
