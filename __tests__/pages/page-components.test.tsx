import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import HomePage from '@/app/page'
import LoginPage from '@/app/(auth)/login/page'
import DashboardPage from '@/app/(dashboard)/page'
import { useAuthStore } from '@/store/auth-store'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock auth store
jest.mock('@/store/auth-store', () => ({
  useAuthStore: jest.fn(),
}))

// Mock components to avoid complex rendering
jest.mock('@/components/layout/public-header', () => ({
  PublicHeader: () => <div data-testid="public-header">Public Header</div>,
}))

jest.mock('@/components/layout/public-footer', () => ({
  PublicFooter: () => <div data-testid="public-footer">Public Footer</div>,
}))

jest.mock('@/components/features/documents/document-card', () => ({
  DocumentCard: ({ title, description }: any) => (
    <div data-testid="document-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}))

jest.mock('@/components/features/updates/update-card', () => ({
  UpdateCard: ({ title, description }: any) => (
    <div data-testid="update-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}))

jest.mock('@/components/features/auth/login-form', () => ({
  LoginForm: () => <div data-testid="login-form">Login Form</div>,
}))

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

describe('Page Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default router mock
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    } as any)
    
    // Default search params mock
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    } as any)
    
    // Default auth store mock
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      checkAuth: jest.fn(),
    } as any)
  })

  describe('HomePage', () => {
    it('should render homepage with all main sections', () => {
      render(<HomePage />)
      
      expect(screen.getByTestId('public-header')).toBeInTheDocument()
      expect(screen.getByTestId('public-footer')).toBeInTheDocument()
      
      // Hero section
      expect(screen.getByText('Union Benefit Management')).toBeInTheDocument()
      expect(screen.getByText(/Access your benefits information/)).toBeInTheDocument()
      expect(screen.getByText('View Documents')).toBeInTheDocument()
      expect(screen.getByText('Learn More')).toBeInTheDocument()
    })

    it('should render latest updates section', () => {
      render(<HomePage />)
      
      expect(screen.getByText('Latest Updates')).toBeInTheDocument()
      expect(screen.getByText(/Important messages and announcements/)).toBeInTheDocument()
      
      // Should have update cards
      const updateCards = screen.getAllByTestId('update-card')
      expect(updateCards).toHaveLength(2)
      
      expect(screen.getByText('Open Enrollment Period Extended')).toBeInTheDocument()
      expect(screen.getByText('New Health Plan Options Available')).toBeInTheDocument()
    })

    it('should render available documents section', () => {
      render(<HomePage />)
      
      expect(screen.getByText('Available Documents')).toBeInTheDocument()
      expect(screen.getByText(/Download important benefit documents/)).toBeInTheDocument()
      
      // Should have document cards
      const documentCards = screen.getAllByTestId('document-card')
      expect(documentCards).toHaveLength(6)
      
      expect(screen.getByText('Benefits Summary')).toBeInTheDocument()
      expect(screen.getByText('Enrollment Form')).toBeInTheDocument()
      expect(screen.getByText('Plan Comparison')).toBeInTheDocument()
      expect(screen.getByText('Claims Form')).toBeInTheDocument()
      expect(screen.getByText('FAQ Document')).toBeInTheDocument()
      expect(screen.getByText('Contact Directory')).toBeInTheDocument()
    })

    it('should have proper page structure and styling', () => {
      const { container } = render(<HomePage />)
      
      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass('min-h-screen', 'bg-union-900')
    })

    it('should render hero section with call-to-action buttons', () => {
      render(<HomePage />)
      
      const viewDocumentsButton = screen.getByRole('button', { name: /view documents/i })
      const learnMoreButton = screen.getByRole('button', { name: /learn more/i })
      
      expect(viewDocumentsButton).toBeInTheDocument()
      expect(learnMoreButton).toBeInTheDocument()
      
      expect(viewDocumentsButton).toHaveClass('bg-union-600', 'hover:bg-union-500')
      expect(learnMoreButton).toHaveClass('border-union-500', 'text-union-100')
    })

    it('should render responsive grid layouts', () => {
      render(<HomePage />)
      
      // Updates grid should be responsive
      const updatesSection = screen.getByText('Latest Updates').closest('section')
      const updatesGrid = updatesSection?.querySelector('.grid')
      expect(updatesGrid).toHaveClass('grid', 'gap-6', 'md:grid-cols-2')
      
      // Documents grid should be responsive
      const documentsSection = screen.getByText('Available Documents').closest('section')
      const documentsGrid = documentsSection?.querySelector('.grid')
      expect(documentsGrid).toHaveClass('grid', 'gap-6', 'md:grid-cols-2', 'lg:grid-cols-3')
    })
  })

  describe('LoginPage', () => {
    const mockCheckAuth = jest.fn()

    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        checkAuth: mockCheckAuth,
        user: null,
      } as any)
    })

    it('should render login page with form', () => {
      render(<LoginPage />)
      
      expect(screen.getByText('Union Benefits')).toBeInTheDocument()
      expect(screen.getByText('Comprehensive benefits management platform')).toBeInTheDocument()
      expect(screen.getByTestId('login-form')).toBeInTheDocument()
    })

    it('should call checkAuth on mount', () => {
      render(<LoginPage />)
      
      expect(mockCheckAuth).toHaveBeenCalledTimes(1)
    })

    it('should redirect authenticated user to dashboard', async () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        checkAuth: mockCheckAuth,
        user: { full_name: 'Test User' },
      } as any)
      
      render(<LoginPage />)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should redirect authenticated user to callback URL', async () => {
      const mockGet = jest.fn().mockReturnValue('/admin/settings')
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)
      
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        checkAuth: mockCheckAuth,
        user: { full_name: 'Test User' },
      } as any)
      
      render(<LoginPage />)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/settings')
      })
    })

    it('should display session expired error', () => {
      const mockGet = jest.fn().mockImplementation((key: string) => {
        if (key === 'error') return 'session-expired'
        return null
      })
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)
      
      render(<LoginPage />)
      
      expect(screen.getByText('Your session has expired. Please log in again.')).toBeInTheDocument()
    })

    it('should display generic authentication error', () => {
      const mockGet = jest.fn().mockImplementation((key: string) => {
        if (key === 'error') return 'auth-failed'
        return null
      })
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)
      
      render(<LoginPage />)
      
      expect(screen.getByText('Authentication error. Please try again.')).toBeInTheDocument()
    })

    it('should not render content when authenticated', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        checkAuth: mockCheckAuth,
        user: { full_name: 'Test User' },
      } as any)
      
      const { container } = render(<LoginPage />)
      
      expect(container.firstChild).toBeNull()
    })

    it('should have proper page styling', () => {
      const { container } = render(<LoginPage />)
      
      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass(
        'min-h-screen',
        'flex',
        'items-center',
        'justify-center',
        'bg-gradient-to-br',
        'from-union-50',
        'to-union-100'
      )
    })

    it('should render error alert with proper styling', () => {
      const mockGet = jest.fn().mockImplementation((key: string) => {
        if (key === 'error') return 'session-expired'
        return null
      })
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)
      
      render(<LoginPage />)
      
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveClass('mb-6')
    })
  })

  describe('DashboardPage', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        user: {
          full_name: 'John Doe',
          email: 'john.doe@union.org',
        },
        isAuthenticated: true,
      } as any)
    })

    it('should render dashboard with user greeting', () => {
      render(<DashboardPage />)
      
      expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument()
      expect(screen.getByText("Here's an overview of your union benefits platform.")).toBeInTheDocument()
    })

    it('should render fallback greeting for users without name', () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          email: 'user@union.org',
          full_name: null,
        },
        isAuthenticated: true,
      } as any)
      
      render(<DashboardPage />)
      
      expect(screen.getByText('Welcome back, User!')).toBeInTheDocument()
    })

    it('should render statistics cards', () => {
      render(<DashboardPage />)
      
      expect(screen.getByText('Total Members')).toBeInTheDocument()
      expect(screen.getByText('1,234')).toBeInTheDocument()
      expect(screen.getByText('Active union members')).toBeInTheDocument()
      
      expect(screen.getByText('Active Benefits')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('Available benefit plans')).toBeInTheDocument()
      
      expect(screen.getByText('Pending Claims')).toBeInTheDocument()
      expect(screen.getByText('23')).toBeInTheDocument()
      expect(screen.getByText('Claims awaiting review')).toBeInTheDocument()
      
      expect(screen.getByText('Total Premiums')).toBeInTheDocument()
      expect(screen.getByText('$45,231')).toBeInTheDocument()
      expect(screen.getByText('Monthly premium collection')).toBeInTheDocument()
    })

    it('should render quick actions card', () => {
      render(<DashboardPage />)
      
      expect(screen.getByText('Quick Actions')).toBeInTheDocument()
      expect(screen.getByText('Common tasks and shortcuts')).toBeInTheDocument()
      
      expect(screen.getByText('• Manage benefit plans')).toBeInTheDocument()
      expect(screen.getByText('• Review pending claims')).toBeInTheDocument()
      expect(screen.getByText('• Add new members')).toBeInTheDocument()
      expect(screen.getByText('• Generate reports')).toBeInTheDocument()
    })

    it('should render recent activity card', () => {
      render(<DashboardPage />)
      
      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
      expect(screen.getByText('Latest platform updates')).toBeInTheDocument()
      
      expect(screen.getByText('• New member registration completed')).toBeInTheDocument()
      expect(screen.getByText('• Health plan updated')).toBeInTheDocument()
      expect(screen.getByText('• Claim processed and approved')).toBeInTheDocument()
      expect(screen.getByText('• System backup completed')).toBeInTheDocument()
    })

    it('should have responsive grid layouts', () => {
      const { container } = render(<DashboardPage />)
      
      // Statistics cards grid
      const statsGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4')
      expect(statsGrid).toBeInTheDocument()
      
      // Action cards grid
      const actionGrid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2')
      expect(actionGrid).toBeInTheDocument()
    })

    it('should render all cards with proper structure', () => {
      render(<DashboardPage />)
      
      // Should have multiple cards
      const cards = screen.getAllByText(/Total Members|Active Benefits|Pending Claims|Total Premiums|Quick Actions|Recent Activity/)
      expect(cards.length).toBeGreaterThan(4)
    })

    it('should handle missing user data gracefully', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: true,
      } as any)
      
      render(<DashboardPage />)
      
      expect(screen.getByText('Welcome back, User!')).toBeInTheDocument()
    })
  })

  describe('Page Component Integration', () => {
    it('should render pages with consistent styling patterns', () => {
      const { container: homeContainer } = render(<HomePage />)
      const homeDiv = homeContainer.firstChild as HTMLElement
      expect(homeDiv).toHaveClass('min-h-screen')
      
      const { container: loginContainer } = render(<LoginPage />)
      const loginDiv = loginContainer.firstChild as HTMLElement
      expect(loginDiv).toHaveClass('min-h-screen')
      
      // Dashboard page doesn't set min-h-screen as it's wrapped in layout
      const { container: dashboardContainer } = render(<DashboardPage />)
      const dashboardDiv = dashboardContainer.firstChild as HTMLElement
      expect(dashboardDiv).toHaveClass('space-y-6')
    })

    it('should handle auth state correctly across pages', async () => {
      // Login page should redirect when authenticated
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        checkAuth: jest.fn(),
        user: { full_name: 'Test User' },
      } as any)
      
      render(<LoginPage />)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
      
      // Dashboard should render when authenticated
      render(<DashboardPage />)
      expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument()
    })

    it('should maintain consistent branding across pages', () => {
      // Homepage should have Union Benefits branding
      render(<HomePage />)
      expect(screen.getByText('Union Benefit Management')).toBeInTheDocument()
      
      // Login page should have Union Benefits branding
      render(<LoginPage />)
      expect(screen.getByText('Union Benefits')).toBeInTheDocument()
      
      // Dashboard should reference union benefits
      render(<DashboardPage />)
      expect(screen.getByText(/union benefits platform/)).toBeInTheDocument()
    })
  })

  describe('Page Accessibility', () => {
    it('should have proper heading hierarchy on HomePage', () => {
      render(<HomePage />)
      
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Union Benefit Management')
      
      const h2Elements = screen.getAllByRole('heading', { level: 2 })
      expect(h2Elements).toHaveLength(2) // Latest Updates and Available Documents
    })

    it('should have proper heading hierarchy on LoginPage', () => {
      render(<LoginPage />)
      
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Union Benefits')
    })

    it('should have proper heading hierarchy on DashboardPage', () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          full_name: 'John Doe',
          email: 'john.doe@union.org',
        },
        isAuthenticated: true,
      } as any)
      
      render(<DashboardPage />)
      
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Welcome back, John Doe!')
    })

    it('should render buttons with proper accessibility', () => {
      render(<HomePage />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })
  })
})
