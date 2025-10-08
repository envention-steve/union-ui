import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/layout';
import { useAuthStore } from '@/store/auth-store';

// Mock dependencies
jest.mock('@/store/auth-store');
jest.mock('@/components/layout/dashboard-header', () => ({
  DashboardHeader: () => <div data-testid="dashboard-header">Dashboard Header</div>
}));
jest.mock('@/components/layout/dashboard-sidebar', () => ({
  DashboardSidebar: () => <div data-testid="dashboard-sidebar">Dashboard Sidebar</div>
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseRouter = useRouter as jest.Mock;

describe('DashboardLayout', () => {
  const mockCheckAuthAndRefresh = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Reset useRouter mock with our test-specific implementation
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        checkAuthAndRefresh: mockCheckAuthAndRefresh,
      });

      const { container } = render(<DashboardLayout><div>Test Content</div></DashboardLayout>);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-header')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-sidebar')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });

    it('should show loading spinner with correct classes', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        checkAuthAndRefresh: mockCheckAuthAndRefresh,
      });

      const { container } = render(<DashboardLayout><div>Test Content</div></DashboardLayout>);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('rounded-full', 'h-32', 'w-32', 'border-b-2', 'border-union-700');
    });
  });

  describe('Unauthenticated State', () => {
    it('should render nothing when not authenticated and not loading', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        checkAuthAndRefresh: mockCheckAuthAndRefresh,
      });

      const { container } = render(<DashboardLayout><div>Test Content</div></DashboardLayout>);

      expect(container.firstChild).toBeNull();
    });

    it('should attempt initial auth check on mount', async () => {
      mockCheckAuthAndRefresh.mockResolvedValue(false);
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        checkAuthAndRefresh: mockCheckAuthAndRefresh,
      });

      await act(async () => {
        render(<DashboardLayout><div>Test Content</div></DashboardLayout>);
      });

      await waitFor(() => {
        expect(mockCheckAuthAndRefresh).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should handle auth check error', async () => {
      const authError = new Error('Auth check failed');
      mockCheckAuthAndRefresh.mockRejectedValue(authError);
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        checkAuthAndRefresh: mockCheckAuthAndRefresh,
      });

      await act(async () => {
        render(<DashboardLayout><div>Test Content</div></DashboardLayout>);
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('[DASHBOARD_LAYOUT] Initial auth check error:', authError);
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Authenticated State', () => {
    beforeEach(() => {
      mockCheckAuthAndRefresh.mockResolvedValue(true);
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        checkAuthAndRefresh: mockCheckAuthAndRefresh,
      });
    });

    it('should render dashboard layout when authenticated', async () => {
      await act(async () => {
        render(<DashboardLayout><div>Test Content</div></DashboardLayout>);
      });

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
        expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument();
        expect(screen.getByText('Test Content')).toBeInTheDocument();
      });
    });

    it('should render children inside the main content area with expected spacing', async () => {
      await act(async () => {
        render(
          <DashboardLayout>
            <div data-testid="child-content">Child Content</div>
          </DashboardLayout>
        );
      });

      await waitFor(() => {
        const mainElement = screen.getByRole('main');
        const contentWrapper = mainElement.querySelector('div.h-full.p-6');
        expect(mainElement).toBeInTheDocument();
        expect(contentWrapper).not.toBeNull();
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
      });
    });

    it('should have correct layout structure', async () => {
      await act(async () => {
        render(<DashboardLayout><div>Test Content</div></DashboardLayout>);
      });

      await waitFor(() => {
        const mainContainer = screen.getByTestId('dashboard-sidebar').parentElement;
        expect(mainContainer).toHaveClass('flex', 'h-screen');

        const contentContainer = screen.getByTestId('dashboard-header').parentElement;
        expect(contentContainer).toHaveClass('flex', 'flex-1', 'flex-col', 'overflow-hidden');

        const mainElement = screen.getByRole('main');
        expect(mainElement).toHaveClass('flex-1', 'overflow-auto');
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should redirect to login when auth is lost', async () => {
      // Start authenticated
      let authState = {
        isAuthenticated: true,
        isLoading: false,
        checkAuthAndRefresh: mockCheckAuthAndRefresh,
      };

      const { rerender } = render(
        <TestWrapper authState={authState}>
          <DashboardLayout><div>Test Content</div></DashboardLayout>
        </TestWrapper>
      );

      // Change to unauthenticated
      authState = {
        isAuthenticated: false,
        isLoading: false,
        checkAuthAndRefresh: mockCheckAuthAndRefresh,
      };

      mockCheckAuthAndRefresh.mockResolvedValue(false);

      await act(async () => {
        rerender(
          <TestWrapper authState={authState}>
            <DashboardLayout><div>Test Content</div></DashboardLayout>
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(mockCheckAuthAndRefresh).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should handle successful last chance refresh', async () => {
      let authState = {
        isAuthenticated: false,
        isLoading: false,
        checkAuthAndRefresh: mockCheckAuthAndRefresh,
      };

      mockCheckAuthAndRefresh.mockResolvedValue(true);

      const { rerender } = render(
        <TestWrapper authState={authState}>
          <DashboardLayout><div>Test Content</div></DashboardLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('[DASHBOARD_LAYOUT] Auth lost, attempting last chance refresh...');
      });

      // Update to authenticated after refresh
      authState = {
        isAuthenticated: true,
        isLoading: false,
        checkAuthAndRefresh: mockCheckAuthAndRefresh,
      };

      rerender(
        <TestWrapper authState={authState}>
          <DashboardLayout><div>Test Content</div></DashboardLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('[DASHBOARD_LAYOUT] Last chance refresh successful!');
      });
    });

    it('should handle last chance refresh error', async () => {
      const refreshError = new Error('Refresh failed');
      mockCheckAuthAndRefresh.mockRejectedValue(refreshError);

      const authState = {
        isAuthenticated: false,
        isLoading: false,
        checkAuthAndRefresh: mockCheckAuthAndRefresh,
      };

      await act(async () => {
        render(
          <TestWrapper authState={authState}>
            <DashboardLayout><div>Test Content</div></DashboardLayout>
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('[DASHBOARD_LAYOUT] Last chance refresh error:', refreshError);
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Console Logging', () => {
    it('should log initial auth check', async () => {
      mockCheckAuthAndRefresh.mockResolvedValue(true);
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        checkAuthAndRefresh: mockCheckAuthAndRefresh,
      });

      await act(async () => {
        render(<DashboardLayout><div>Test Content</div></DashboardLayout>);
      });

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('[DASHBOARD_LAYOUT] Initial auth check...');
      });
    });

    it('should log failed initial auth', async () => {
      mockCheckAuthAndRefresh.mockResolvedValue(false);
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        checkAuthAndRefresh: mockCheckAuthAndRefresh,
      });

      await act(async () => {
        render(<DashboardLayout><div>Test Content</div></DashboardLayout>);
      });

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('[DASHBOARD_LAYOUT] Initial auth failed, redirecting to login');
      });
    });
  });

  describe('Multiple Children', () => {
    it('should render multiple children correctly', async () => {
      mockCheckAuthAndRefresh.mockResolvedValue(true);
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        checkAuthAndRefresh: mockCheckAuthAndRefresh,
      });

      await act(async () => {
        render(
          <DashboardLayout>
            <div data-testid="child-1">Child 1</div>
            <div data-testid="child-2">Child 2</div>
            <div data-testid="child-3">Child 3</div>
          </DashboardLayout>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('child-1')).toBeInTheDocument();
        expect(screen.getByTestId('child-2')).toBeInTheDocument();
        expect(screen.getByTestId('child-3')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Prevention', () => {
    it('should prevent infinite refresh loops', async () => {
      const authState = {
        isAuthenticated: false,
        isLoading: false,
        checkAuthAndRefresh: mockCheckAuthAndRefresh,
      };

      mockCheckAuthAndRefresh.mockResolvedValue(false);

      const { rerender } = render(
        <TestWrapper authState={authState}>
          <DashboardLayout><div>Test Content</div></DashboardLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockCheckAuthAndRefresh).toHaveBeenCalledTimes(2); // Initial + last chance
      });

      // Force another render with same state
      rerender(
        <TestWrapper authState={authState}>
          <DashboardLayout><div>Test Content</div></DashboardLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        // Should not call again due to hasTriedRefresh flag
        expect(mockCheckAuthAndRefresh).toHaveBeenCalledTimes(2);
      });
    });
  });
});

// Helper component to control auth state for testing
const TestWrapper: React.FC<{ authState: any; children: React.ReactNode }> = ({ authState, children }) => {
  mockUseAuthStore.mockReturnValue(authState);
  return <>{children}</>;
};
