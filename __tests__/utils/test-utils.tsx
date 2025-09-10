import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Providers } from '@/components/providers'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  // Create a new QueryClient for each test to avoid state leakage
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests
        staleTime: Infinity, // Never mark queries as stale in tests
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override the default render method
export { customRender as render }

// Helper function to render with full app providers (including AuthProvider)
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Providers>{children}</Providers>
  )
  
  return render(ui, { wrapper: Wrapper, ...options })
}

// Mock user for testing
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  preferred_username: 'testuser',
  roles: ['client_admin'],
}

// Mock session data
export const mockSessionData = {
  user: mockUser,
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
}

// Helper to create expired session
export const mockExpiredSessionData = {
  ...mockSessionData,
  expiresAt: Math.floor(Date.now() / 1000) - 1, // Already expired
}
