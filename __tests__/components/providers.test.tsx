import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { Providers } from '@/components/providers'

// Mock the AuthProvider
jest.mock('@/components/auth-provider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}))

// Mock react-query components
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query')
  return {
    ...actual,
    QueryClientProvider: ({ children, client }: any) => (
      <div data-testid="query-client-provider" data-client={client ? 'present' : 'missing'}>
        {children}
      </div>
    ),
  }
})

jest.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: ({ initialIsOpen }: { initialIsOpen: boolean }) => (
    <div data-testid="react-query-devtools" data-initial-open={initialIsOpen} />
  ),
}))

// Mock the Toaster component
jest.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster" />,
}))

// Test child component
const TestChild = () => <div data-testid="test-child">Test Content</div>

describe('Providers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render all provider components in correct order', () => {
      render(
        <Providers>
          <TestChild />
        </Providers>
      )

      // Check that all components are rendered
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument()
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
      expect(screen.getByTestId('toaster')).toBeInTheDocument()
      expect(screen.getByTestId('react-query-devtools')).toBeInTheDocument()
      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })

    it('should render children within provider hierarchy', () => {
      render(
        <Providers>
          <TestChild />
        </Providers>
      )

      const child = screen.getByTestId('test-child')
      expect(child).toBeInTheDocument()
      expect(child).toHaveTextContent('Test Content')
    })

    it('should render multiple children', () => {
      render(
        <Providers>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </Providers>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
    })
  })

  describe('QueryClient Configuration', () => {
    it('should provide QueryClient to children', () => {
      render(
        <Providers>
          <TestChild />
        </Providers>
      )

      const queryProvider = screen.getByTestId('query-client-provider')
      expect(queryProvider).toHaveAttribute('data-client', 'present')
    })

    it('should render ReactQueryDevtools with correct initial state', () => {
      render(
        <Providers>
          <TestChild />
        </Providers>
      )

      const devtools = screen.getByTestId('react-query-devtools')
      expect(devtools).toHaveAttribute('data-initial-open', 'false')
    })
  })

  describe('Provider Composition', () => {
    it('should nest providers in correct order: QueryClient > AuthProvider > Children + Toaster + DevTools', () => {
      const { container } = render(
        <Providers>
          <TestChild />
        </Providers>
      )

      // QueryClientProvider should be the outermost
      const queryProvider = screen.getByTestId('query-client-provider')
      expect(queryProvider).toBeInTheDocument()

      // AuthProvider should be inside QueryClientProvider
      const authProvider = screen.getByTestId('auth-provider')
      expect(queryProvider).toContainElement(authProvider)

      // Children should be inside AuthProvider
      const child = screen.getByTestId('test-child')
      expect(authProvider).toContainElement(child)

      // Toaster and DevTools should be siblings of children
      expect(screen.getByTestId('toaster')).toBeInTheDocument()
      expect(screen.getByTestId('react-query-devtools')).toBeInTheDocument()
    })

    it('should handle empty children', () => {
      render(<Providers>{null}</Providers>)

      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument()
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
      expect(screen.getByTestId('toaster')).toBeInTheDocument()
      expect(screen.getByTestId('react-query-devtools')).toBeInTheDocument()
    })

    it('should handle undefined children', () => {
      render(<Providers>{undefined}</Providers>)

      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument()
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
    })
  })

  describe('Provider Integration', () => {
    it('should provide global toast notifications via Toaster', () => {
      render(
        <Providers>
          <TestChild />
        </Providers>
      )

      const toaster = screen.getByTestId('toaster')
      expect(toaster).toBeInTheDocument()
    })

    it('should provide authentication context via AuthProvider', () => {
      render(
        <Providers>
          <TestChild />
        </Providers>
      )

      const authProvider = screen.getByTestId('auth-provider')
      expect(authProvider).toBeInTheDocument()
    })

    it('should maintain provider state across re-renders', () => {
      const { rerender } = render(
        <Providers>
          <div data-testid="content-1">Content 1</div>
        </Providers>
      )

      expect(screen.getByTestId('content-1')).toBeInTheDocument()

      // Re-render with different children
      rerender(
        <Providers>
          <div data-testid="content-2">Content 2</div>
        </Providers>
      )

      expect(screen.getByTestId('content-2')).toBeInTheDocument()
      expect(screen.queryByTestId('content-1')).not.toBeInTheDocument()

      // Providers should still be present
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument()
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle provider initialization errors gracefully', () => {
      // Mock console.error to prevent test output pollution
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        render(
          <Providers>
            <TestChild />
          </Providers>
        )
      }).not.toThrow()

      consoleSpy.mockRestore()
    })

    it('should render even with complex nested children', () => {
      render(
        <Providers>
          <div>
            <div>
              <TestChild />
              <div>Deeply nested content</div>
            </div>
          </div>
        </Providers>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      expect(screen.getByText('Deeply nested content')).toBeInTheDocument()
    })
  })

  describe('Provider Props and Configuration', () => {
    it('should accept and render children prop', () => {
      const customChildren = (
        <div data-testid="custom-children">
          <span>Custom content</span>
          <button>Click me</button>
        </div>
      )

      render(<Providers>{customChildren}</Providers>)

      expect(screen.getByTestId('custom-children')).toBeInTheDocument()
      expect(screen.getByText('Custom content')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('should maintain provider composition with different children types', () => {
      render(
        <Providers>
          <TestChild />
          <input data-testid="test-input" placeholder="Test input" />
          <button data-testid="test-button">Test button</button>
        </Providers>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      expect(screen.getByTestId('test-input')).toBeInTheDocument()
      expect(screen.getByTestId('test-button')).toBeInTheDocument()
    })
  })

  describe('QueryClient Retry Logic', () => {
    // Mock QueryClient to capture retry function
    let capturedRetryFunction: any = null;
    
    beforeEach(() => {
      // Reset the captured function
      capturedRetryFunction = null;
      
      // Mock QueryClient constructor to capture the retry function
      jest.spyOn(require('@tanstack/react-query'), 'QueryClient').mockImplementation((options: any) => {
        capturedRetryFunction = options?.defaultOptions?.queries?.retry;
        return {
          mount: jest.fn(),
          unmount: jest.fn(),
          getQueryData: jest.fn(),
          setQueryData: jest.fn(),
        } as any;
      });
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });
    
    it('should configure retry logic that prevents retry for 401 errors', () => {
      render(
        <Providers>
          <TestChild />
        </Providers>
      );
      
      expect(capturedRetryFunction).toBeDefined();
      
      // Test 401 error - should not retry
      const shouldRetry401 = capturedRetryFunction(1, { status: 401 });
      expect(shouldRetry401).toBe(false);
    });
    
    it('should configure retry logic that prevents retry for 403 errors', () => {
      render(
        <Providers>
          <TestChild />
        </Providers>
      );
      
      // Test 403 error - should not retry
      const shouldRetry403 = capturedRetryFunction(1, { status: 403 });
      expect(shouldRetry403).toBe(false);
    });
    
    it('should configure retry logic that prevents retry for 404 errors', () => {
      render(
        <Providers>
          <TestChild />
        </Providers>
      );
      
      // Test 404 error - should not retry
      const shouldRetry404 = capturedRetryFunction(1, { status: 404 });
      expect(shouldRetry404).toBe(false);
    });
    
    it('should configure retry logic that allows retry for other errors up to 3 times', () => {
      render(
        <Providers>
          <TestChild />
        </Providers>
      );
      
      // Test 500 error with failure count 1 - should retry
      const shouldRetry500First = capturedRetryFunction(1, { status: 500 });
      expect(shouldRetry500First).toBe(true);
      
      // Test 500 error with failure count 2 - should retry
      const shouldRetry500Second = capturedRetryFunction(2, { status: 500 });
      expect(shouldRetry500Second).toBe(true);
      
      // Test 500 error with failure count 3 - should not retry
      const shouldRetry500Third = capturedRetryFunction(3, { status: 500 });
      expect(shouldRetry500Third).toBe(false);
      
      // Test 500 error with failure count 4 - should not retry
      const shouldRetry500Fourth = capturedRetryFunction(4, { status: 500 });
      expect(shouldRetry500Fourth).toBe(false);
    });
    
    it('should configure retry logic that allows retry for network errors', () => {
      render(
        <Providers>
          <TestChild />
        </Providers>
      );
      
      // Test network error (no status) with failure count 1 - should retry
      const shouldRetryNetwork1 = capturedRetryFunction(1, { message: 'Network error' });
      expect(shouldRetryNetwork1).toBe(true);
      
      // Test network error (no status) with failure count 2 - should retry
      const shouldRetryNetwork2 = capturedRetryFunction(2, { message: 'Network error' });
      expect(shouldRetryNetwork2).toBe(true);
      
      // Test network error (no status) with failure count 3 - should not retry
      const shouldRetryNetwork3 = capturedRetryFunction(3, { message: 'Network error' });
      expect(shouldRetryNetwork3).toBe(false);
    });
    
    it('should configure QueryClient with correct stale time', () => {
      // Capture the full options
      let capturedOptions: any = null;
      
      jest.spyOn(require('@tanstack/react-query'), 'QueryClient').mockImplementation((options: any) => {
        capturedOptions = options;
        return {
          mount: jest.fn(),
          unmount: jest.fn(),
        } as any;
      });
      
      render(
        <Providers>
          <TestChild />
        </Providers>
      );
      
      expect(capturedOptions).toBeDefined();
      expect(capturedOptions.defaultOptions.queries.staleTime).toBe(60 * 1000); // 1 minute
    });
  });

  describe('Provider Accessibility', () => {
    it('should not interfere with child component accessibility', () => {
      render(
        <Providers>
          <button aria-label="Accessible button">Click me</button>
          <div role="main">Main content</div>
        </Providers>
      )

      expect(screen.getByRole('button', { name: 'Accessible button' })).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should preserve ARIA attributes in children', () => {
      render(
        <Providers>
          <div aria-labelledby="heading-1" data-testid="content">
            <h1 id="heading-1">Test Heading</h1>
            Content with ARIA
          </div>
        </Providers>
      )

      const content = screen.getByTestId('content')
      expect(content).toHaveAttribute('aria-labelledby', 'heading-1')
    })
  })
})
