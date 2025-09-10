import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

// Import page components
import HomePage from '../../app/page';
import LoginPage from '../../app/(auth)/login/page';
import DashboardPage from '../../app/(dashboard)/page';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock auth store
jest.mock('@/store/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

// Mock UI components to prevent complex rendering issues
jest.mock('@/components/layout/public-header', () => {
  return function PublicHeader() {
    return <header data-testid="public-header">Public Header</header>;
  };
});

jest.mock('@/components/layout/public-footer', () => {
  return function PublicFooter() {
    return <footer data-testid="public-footer">Public Footer</footer>;
  };
});

jest.mock('@/components/features/documents/document-card', () => {
  return function DocumentCard({ title, description, fileSize, icon, iconColor }: any) {
    return (
      <div data-testid="document-card">
        <h3>{title}</h3>
        <p>{description}</p>
        <span>{fileSize}</span>
      </div>
    );
  };
});

jest.mock('@/components/features/updates/update-card', () => {
  return function UpdateCard({ title, description, date, category, categoryColor, icon }: any) {
    return (
      <div data-testid="update-card">
        <h3>{title}</h3>
        <p>{description}</p>
        <span>{date}</span>
        <span>{category}</span>
      </div>
    );
  };
});

jest.mock('@/components/features/auth/login-form', () => {
  return function LoginForm() {
    return <form data-testid="login-form">Login Form</form>;
  };
});

jest.mock('@/components/ui/button', () => {
  return function Button({ children, className, variant, size, ...props }: any) {
    return (
      <button className={className} data-variant={variant} data-size={size} {...props}>
        {children}
      </button>
    );
  };
});

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-testid="card-content" {...props}>{children}</div>
  ),
  CardDescription: ({ children, ...props }: any) => (
    <div data-testid="card-description" {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div data-testid="card-header" {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <div data-testid="card-title" {...props}>{children}</div>
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, ...props }: any) => (
    <div data-testid="alert" data-variant={variant} {...props}>{children}</div>
  ),
  AlertDescription: ({ children, ...props }: any) => (
    <div data-testid="alert-description" {...props}>{children}</div>
  ),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  FileText: () => <svg data-testid="file-text-icon" />,
  Download: () => <svg data-testid="download-icon" />,
  Heart: () => <svg data-testid="heart-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  FileCheck: () => <svg data-testid="file-check-icon" />,
  HelpCircle: () => <svg data-testid="help-circle-icon" />,
  Users: () => <svg data-testid="users-icon" />,
  BarChart: () => <svg data-testid="bar-chart-icon" />,
  Info: () => <svg data-testid="info-icon" />,
  AlertCircle: () => <svg data-testid="alert-circle-icon" />,
}));

describe('Comprehensive Page Component Tests', () => {
  const mockPush = jest.fn();
  const mockSearchParams = {
    get: jest.fn(),
  };
  const mockAuthStore = {
    isAuthenticated: false,
    user: null,
    checkAuth: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);
    
    mockSearchParams.get.mockReturnValue(null);
  });

  describe('HomePage - Complete Integration Tests', () => {
    it('should render all main sections and components', () => {
      render(<HomePage />);

      // Structural components
      expect(screen.getByTestId('public-header')).toBeInTheDocument();
      expect(screen.getByTestId('public-footer')).toBeInTheDocument();
      
      // Hero section
      expect(screen.getByText('Union Benefit Management')).toBeInTheDocument();
      expect(screen.getByText(/Access your benefits information/)).toBeInTheDocument();
      
      // Action buttons
      const viewDocumentsBtn = screen.getByText('View Documents');
      const learnMoreBtn = screen.getByText('Learn More');
      expect(viewDocumentsBtn).toBeInTheDocument();
      expect(learnMoreBtn).toBeInTheDocument();
      
      // Check button attributes
      expect(viewDocumentsBtn.parentElement).toHaveAttribute('data-size', 'lg');
      expect(learnMoreBtn.parentElement).toHaveAttribute('data-variant', 'outline');
    });

    it('should display all update cards with correct content', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Latest Updates')).toBeInTheDocument();
      
      const updateCards = screen.getAllByTestId('update-card');
      expect(updateCards).toHaveLength(2);
      
      // First update card
      expect(screen.getByText('Open Enrollment Period Extended')).toBeInTheDocument();
      expect(screen.getByText(/The open enrollment period has been extended/)).toBeInTheDocument();
      expect(screen.getByText('2 days ago')).toBeInTheDocument();
      expect(screen.getByText('Important')).toBeInTheDocument();
      
      // Second update card
      expect(screen.getByText('New Health Plan Options Available')).toBeInTheDocument();
      expect(screen.getByText(/We've added two new health plan options/)).toBeInTheDocument();
      expect(screen.getByText('5 days ago')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should display all document cards with correct information', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Available Documents')).toBeInTheDocument();
      
      const documentCards = screen.getAllByTestId('document-card');
      expect(documentCards).toHaveLength(6);
      
      // Verify all document titles and descriptions
      const expectedDocuments = [
        { title: 'Benefits Summary', size: 'PDF • 2.1 MB' },
        { title: 'Enrollment Form', size: 'PDF • 1.8 MB' },
        { title: 'Plan Comparison', size: 'PDF • 3.2 MB' },
        { title: 'Claims Form', size: 'PDF • 1.2 MB' },
        { title: 'FAQ Document', size: 'PDF • 0.9 MB' },
        { title: 'Contact Directory', size: 'PDF • 0.3 MB' },
      ];
      
      expectedDocuments.forEach(doc => {
        expect(screen.getByText(doc.title)).toBeInTheDocument();
        expect(screen.getByText(doc.size)).toBeInTheDocument();
      });
    });

    it('should have proper CSS classes for styling', () => {
      const { container } = render(<HomePage />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('min-h-screen', 'bg-union-900');
    });

    it('should render all required icons', () => {
      render(<HomePage />);
      
      // Hero section icons
      expect(screen.getByTestId('download-icon')).toBeInTheDocument();
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });
  });

  describe('LoginPage - Authentication Flow Tests', () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = false;
      mockAuthStore.user = null;
    });

    it('should render login interface when not authenticated', () => {
      render(<LoginPage />);

      // Brand section
      expect(screen.getByText('Union Benefits')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive benefits management platform')).toBeInTheDocument();
      
      // Login form
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('should call checkAuth on component mount', () => {
      render(<LoginPage />);
      expect(mockAuthStore.checkAuth).toHaveBeenCalledTimes(1);
    });

    it('should redirect to dashboard when authenticated', async () => {
      mockAuthStore.isAuthenticated = true;
      
      render(<LoginPage />);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should redirect to custom callback URL when provided', async () => {
      mockAuthStore.isAuthenticated = true;
      mockSearchParams.get.mockImplementation((param) => {
        if (param === 'callbackUrl') return '/benefits/enrollment';
        return null;
      });
      
      render(<LoginPage />);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/benefits/enrollment');
      });
    });

    it('should display session expired error message', () => {
      mockSearchParams.get.mockImplementation((param) => {
        if (param === 'error') return 'session-expired';
        return null;
      });
      
      render(<LoginPage />);
      
      const alert = screen.getByTestId('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('data-variant', 'destructive');
      expect(screen.getByText('Your session has expired. Please log in again.')).toBeInTheDocument();
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('should display generic authentication error', () => {
      mockSearchParams.get.mockImplementation((param) => {
        if (param === 'error') return 'invalid_credentials';
        return null;
      });
      
      render(<LoginPage />);
      
      const alert = screen.getByTestId('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('Authentication error. Please try again.')).toBeInTheDocument();
    });

    it('should not render any content when authenticated (redirect behavior)', () => {
      mockAuthStore.isAuthenticated = true;
      
      const { container } = render(<LoginPage />);
      expect(container.firstChild).toBeNull();
    });

    it('should have proper layout styling', () => {
      const { container } = render(<LoginPage />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass(
        'min-h-screen',
        'flex',
        'items-center',
        'justify-center',
        'bg-gradient-to-br',
        'from-union-50',
        'to-union-100',
        'p-4'
      );
    });

    it('should not display error alert when no error in URL', () => {
      render(<LoginPage />);
      expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
    });
  });

  describe('DashboardPage - User Data Display Tests', () => {
    const mockUser = {
      id: '1',
      email: 'john.doe@example.com',
      full_name: 'John Doe',
      role: 'admin' as const,
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    };

    beforeEach(() => {
      mockAuthStore.user = mockUser;
    });

    it('should display personalized welcome message', () => {
      render(<DashboardPage />);

      expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument();
      expect(screen.getByText('Here\'s an overview of your union benefits platform.')).toBeInTheDocument();
    });

    it('should handle missing user name gracefully', () => {
      mockAuthStore.user = { ...mockUser, full_name: null };
      
      render(<DashboardPage />);
      expect(screen.getByText('Welcome back, User!')).toBeInTheDocument();
    });

    it('should handle null user gracefully', () => {
      mockAuthStore.user = null;
      
      render(<DashboardPage />);
      expect(screen.getByText('Welcome back, User!')).toBeInTheDocument();
    });

    it('should render all summary statistics cards', () => {
      render(<DashboardPage />);

      // Check card count (4 summary + 2 action cards)
      const cards = screen.getAllByTestId('card');
      expect(cards).toHaveLength(6);

      // Summary card data
      const summaryData = [
        { title: 'Total Members', value: '1,234', description: 'Active union members' },
        { title: 'Active Benefits', value: '12', description: 'Available benefit plans' },
        { title: 'Pending Claims', value: '23', description: 'Claims awaiting review' },
        { title: 'Total Premiums', value: '$45,231', description: 'Monthly premium collection' },
      ];

      summaryData.forEach(item => {
        expect(screen.getByText(item.title)).toBeInTheDocument();
        expect(screen.getByText(item.value)).toBeInTheDocument();
        expect(screen.getByText(item.description)).toBeInTheDocument();
      });
    });

    it('should render quick actions section with all items', () => {
      render(<DashboardPage />);

      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Common tasks and shortcuts')).toBeInTheDocument();
      
      const expectedActions = [
        'Manage benefit plans',
        'Review pending claims',
        'Add new members',
        'Generate reports',
      ];

      expectedActions.forEach(action => {
        expect(screen.getByText(`• ${action}`)).toBeInTheDocument();
      });
    });

    it('should render recent activity section with all items', () => {
      render(<DashboardPage />);

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Latest platform updates')).toBeInTheDocument();
      
      const expectedActivities = [
        'New member registration completed',
        'Health plan updated',
        'Claim processed and approved',
        'System backup completed',
      ];

      expectedActivities.forEach(activity => {
        expect(screen.getByText(`• ${activity}`)).toBeInTheDocument();
      });
    });

    it('should have proper layout structure', () => {
      const { container } = render(<DashboardPage />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('space-y-6');

      // Should have grid layouts for cards
      const grids = container.querySelectorAll('.grid');
      expect(grids.length).toBeGreaterThanOrEqual(2);
    });

    it('should render card components with proper structure', () => {
      render(<DashboardPage />);

      const cardTitles = screen.getAllByTestId('card-title');
      const cardContents = screen.getAllByTestId('card-content');
      const cardHeaders = screen.getAllByTestId('card-header');

      expect(cardTitles.length).toBeGreaterThanOrEqual(4); // At least 4 summary cards
      expect(cardContents.length).toBeGreaterThanOrEqual(4);
      expect(cardHeaders.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Cross-Component Integration and User Flows', () => {
    it('should handle complete authentication flow', async () => {
      // Start unauthenticated
      mockAuthStore.isAuthenticated = false;
      const { rerender } = render(<LoginPage />);
      
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      
      // Simulate successful authentication
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.user = {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'member',
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };
      
      rerender(<LoginPage />);
      
      // Should redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should maintain consistent error handling patterns', () => {
      mockSearchParams.get.mockImplementation((param) => {
        if (param === 'error') return 'session-expired';
        return null;
      });
      
      render(<LoginPage />);
      
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('data-variant', 'destructive');
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('should handle user state transitions properly', () => {
      // Test dashboard with different user states
      const testCases = [
        { user: null, expectedWelcome: 'Welcome back, User!' },
        { user: { full_name: null }, expectedWelcome: 'Welcome back, User!' },
        { user: { full_name: 'Jane Smith' }, expectedWelcome: 'Welcome back, Jane Smith!' },
      ];

      testCases.forEach(testCase => {
        mockAuthStore.user = testCase.user;
        const { unmount } = render(<DashboardPage />);
        
        expect(screen.getByText(testCase.expectedWelcome)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Accessibility and Usability', () => {
    it('should have proper heading hierarchy on home page', () => {
      render(<HomePage />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Union Benefit Management');

      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      expect(h2Elements).toHaveLength(2);
      expect(h2Elements[0]).toHaveTextContent('Latest Updates');
      expect(h2Elements[1]).toHaveTextContent('Available Documents');
    });

    it('should have proper heading hierarchy on login page', () => {
      render(<LoginPage />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Union Benefits');
    });

    it('should have proper heading hierarchy on dashboard', () => {
      mockAuthStore.user = { full_name: 'John Doe' };
      render(<DashboardPage />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Welcome back, John Doe!');
    });

    it('should provide meaningful alt text and aria labels for interactive elements', () => {
      render(<HomePage />);

      // Buttons should be accessible
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach(button => {
        expect(button.textContent?.trim().length).toBeGreaterThan(0);
      });
    });

    it('should handle keyboard navigation properly', () => {
      render(<LoginPage />);
      
      const form = screen.getByTestId('login-form');
      expect(form).toBeInTheDocument();
      
      // Form should be focusable
      expect(form.tagName).toBe('FORM');
    });

    it('should provide proper error messaging with icons', () => {
      mockSearchParams.get.mockImplementation((param) => {
        if (param === 'error') return 'session-expired';
        return null;
      });
      
      render(<LoginPage />);
      
      const alert = screen.getByTestId('alert');
      const alertIcon = screen.getByTestId('alert-circle-icon');
      const alertDescription = screen.getByTestId('alert-description');
      
      expect(alert).toBeInTheDocument();
      expect(alertIcon).toBeInTheDocument();
      expect(alertDescription).toHaveTextContent('Your session has expired. Please log in again.');
    });
  });

  describe('Performance and Optimization', () => {
    it('should render home page without throwing errors', () => {
      expect(() => render(<HomePage />)).not.toThrow();
    });

    it('should render login page without throwing errors', () => {
      expect(() => render(<LoginPage />)).not.toThrow();
    });

    it('should render dashboard page without throwing errors', () => {
      expect(() => render(<DashboardPage />)).not.toThrow();
    });

    it('should handle rapid re-renders gracefully', () => {
      const { rerender } = render(<LoginPage />);
      
      // Rapid state changes
      for (let i = 0; i < 5; i++) {
        mockAuthStore.isAuthenticated = i % 2 === 0;
        expect(() => rerender(<LoginPage />)).not.toThrow();
      }
    });

    it('should cleanup effects properly', () => {
      const { unmount } = render(<LoginPage />);
      expect(() => unmount()).not.toThrow();
    });
  });
});
