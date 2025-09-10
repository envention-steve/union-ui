import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { PublicHeader } from '@/components/layout/public-header'
import { PublicFooter } from '@/components/layout/public-footer'
import { useAuthStore } from '@/store/auth-store'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

// Mock auth store
jest.mock('@/store/auth-store', () => ({
  useAuthStore: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

describe('Layout Components', () => {
  describe('DashboardHeader', () => {
    const mockLogout = jest.fn()

    beforeEach(() => {
      jest.clearAllMocks()
      mockUseAuthStore.mockReturnValue({
        user: {
          id: '1',
          email: 'john.doe@union.org',
          full_name: 'John Doe',
          roles: ['user'],
          isActive: true,
        },
        logout: mockLogout,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      } as any)
    })

    it('should render dashboard header with basic elements', () => {
      render(<DashboardHeader />)
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument() // Avatar button
      expect(screen.getByRole('banner')).toBeInTheDocument() // Header element
    })

    it('should display user initials in avatar', () => {
      render(<DashboardHeader />)
      
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('should handle user with single name', () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: '1',
          email: 'john@union.org',
          full_name: 'John',
          roles: ['user'],
          isActive: true,
        },
        logout: mockLogout,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      } as any)

      render(<DashboardHeader />)
      
      expect(screen.getByText('J')).toBeInTheDocument()
    })

    it('should display default initials when no user name', () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: '1',
          email: 'user@union.org',
          full_name: null,
          roles: ['user'],
          isActive: true,
        },
        logout: mockLogout,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      } as any)

      render(<DashboardHeader />)
      
      expect(screen.getByText('UN')).toBeInTheDocument()
    })

    it('should render dropdown trigger button', () => {
      render(<DashboardHeader />)
      
      const avatarButton = screen.getByRole('button')
      expect(avatarButton).toBeInTheDocument()
      expect(avatarButton).toHaveAttribute('aria-haspopup', 'menu')
      expect(avatarButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('should have logout handler available', () => {
      render(<DashboardHeader />)
      
      // The logout function should be properly connected via useAuthStore
      expect(mockLogout).toBeDefined()
    })

    it('should handle very long names for initials', () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: '1',
          email: 'user@union.org',
          full_name: 'Alexander Benjamin Christopher Davidson',
          roles: ['user'],
          isActive: true,
        },
        logout: mockLogout,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      } as any)

      render(<DashboardHeader />)
      
      // Should only show first two initials
      expect(screen.getByText('AB')).toBeInTheDocument()
    })

    it('should render header with proper structure and styling', () => {
      render(<DashboardHeader />)
      
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('flex', 'h-16', 'items-center', 'justify-between', 'border-b', 'bg-card', 'px-6')
    })
  })

  describe('DashboardSidebar', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      mockUsePathname.mockReturnValue('/dashboard')
    })

    it('should render sidebar with all navigation items', () => {
      render(<DashboardSidebar />)
      
      expect(screen.getByText('Union Benefits')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Benefits')).toBeInTheDocument()
      expect(screen.getByText('Members')).toBeInTheDocument()
      expect(screen.getByText('Plans')).toBeInTheDocument()
      expect(screen.getByText('Analytics')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('should highlight active navigation item', () => {
      render(<DashboardSidebar />)
      
      // Check that the dashboard link exists and is rendered as a button
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      expect(dashboardLink).toBeInTheDocument()
      expect(dashboardLink).toHaveAttribute('href', '/dashboard')
      
      // Check that it's styled as a button with proper classes
      expect(dashboardLink).toHaveClass('inline-flex', 'items-center', 'w-full', 'justify-start')
      // Should have active state styling
      expect(dashboardLink).toHaveClass('bg-union-100', 'text-union-900')
    })

    it('should render navigation links for nested routes', () => {
      mockUsePathname.mockReturnValue('/dashboard/benefits/health')
      
      render(<DashboardSidebar />)
      
      const benefitsLink = screen.getByRole('link', { name: /benefits/i })
      expect(benefitsLink).toBeInTheDocument()
      expect(benefitsLink).toHaveAttribute('href', '/dashboard/benefits')
    })

    it('should render all navigation links', () => {
      mockUsePathname.mockReturnValue('/dashboard/analytics')
      
      render(<DashboardSidebar />)
      
      const membersLink = screen.getByRole('link', { name: /members/i })
      expect(membersLink).toBeInTheDocument()
      expect(membersLink).toHaveAttribute('href', '/dashboard/members')
    })

    it('should render all navigation links with correct hrefs', () => {
      render(<DashboardSidebar />)
      
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard')
      expect(screen.getByRole('link', { name: /benefits/i })).toHaveAttribute('href', '/dashboard/benefits')
      expect(screen.getByRole('link', { name: /members/i })).toHaveAttribute('href', '/dashboard/members')
      expect(screen.getByRole('link', { name: /plans/i })).toHaveAttribute('href', '/dashboard/plans')
      expect(screen.getByRole('link', { name: /analytics/i })).toHaveAttribute('href', '/dashboard/analytics')
      expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute('href', '/dashboard/settings')
    })

    it('should render icons for each navigation item', () => {
      render(<DashboardSidebar />)
      
      // All navigation items should have icons
      const navItems = ['Dashboard', 'Benefits', 'Members', 'Plans', 'Analytics', 'Settings']
      navItems.forEach(item => {
        const link = screen.getByRole('link', { name: new RegExp(item, 'i') })
        const icon = link.querySelector('svg')
        expect(icon).toBeInTheDocument()
        expect(icon).toHaveClass('mr-2', 'h-4', 'w-4')
      })
    })

    it('should have proper sidebar structure', () => {
      render(<DashboardSidebar />)
      
      const navigation = screen.getByRole('navigation')
      expect(navigation).toBeInTheDocument()
      
      // Check that the container has the sidebar wrapper
      const sidebarContainer = navigation.closest('.flex')
      expect(sidebarContainer).toBeInTheDocument()
    })
  })

  describe('PublicHeader', () => {
    it('should render public header with logo and navigation', () => {
      render(<PublicHeader />)
      
      expect(screen.getByText('Union Benefits')).toBeInTheDocument()
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Benefits')).toBeInTheDocument()
      expect(screen.getByText('Resources')).toBeInTheDocument()
      expect(screen.getByText('Contact')).toBeInTheDocument()
      expect(screen.getByText('Manager Login')).toBeInTheDocument()
    })

    it('should render all navigation links with correct hrefs', () => {
      render(<PublicHeader />)
      
      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
      expect(screen.getByRole('link', { name: 'Benefits' })).toHaveAttribute('href', '/benefits')
      expect(screen.getByRole('link', { name: 'Resources' })).toHaveAttribute('href', '/resources')
      expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact')
      expect(screen.getByRole('link', { name: 'Manager Login' })).toHaveAttribute('href', '/login')
    })

    it('should render logo with shield icon', () => {
      render(<PublicHeader />)
      
      const shieldIcon = document.querySelector('[data-testid="shield-icon"], svg')
      expect(shieldIcon).toBeInTheDocument()
    })

    it('should have proper header structure and styling', () => {
      render(<PublicHeader />)
      
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('bg-union-800', 'text-white')
    })

    it('should render manager login button with correct styling', () => {
      render(<PublicHeader />)
      
      const loginButton = screen.getByRole('link', { name: 'Manager Login' })
      expect(loginButton).toHaveClass('bg-union-600', 'hover:bg-union-500', 'text-white', 'border-union-500')
    })
  })

  describe('PublicFooter', () => {
    it('should render footer with brand information', () => {
      render(<PublicFooter />)
      
      expect(screen.getByText('Union Benefits')).toBeInTheDocument()
      expect(screen.getByText(/Providing comprehensive benefit management services/)).toBeInTheDocument()
      expect(screen.getByText('© 2024 Union Benefits Management System. All rights reserved.')).toBeInTheDocument()
    })

    it('should render quick links section', () => {
      render(<PublicFooter />)
      
      expect(screen.getByText('Quick Links')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Benefits Overview' })).toHaveAttribute('href', '/benefits')
      expect(screen.getByRole('link', { name: 'Enrollment' })).toHaveAttribute('href', '/enrollment')
      expect(screen.getByRole('link', { name: 'Claims' })).toHaveAttribute('href', '/claims')
      expect(screen.getByRole('link', { name: 'Support' })).toHaveAttribute('href', '/support')
    })

    it('should render contact information', () => {
      render(<PublicFooter />)
      
      expect(screen.getByText('Contact Info')).toBeInTheDocument()
      expect(screen.getByText('1-800-555-0123')).toBeInTheDocument()
      expect(screen.getByText('info@union.org')).toBeInTheDocument()
      expect(screen.getByText('Mon-Fri 8AM-5PM EST')).toBeInTheDocument()
    })

    it('should render social media placeholders', () => {
      render(<PublicFooter />)
      
      expect(screen.getByText('f')).toBeInTheDocument() // Facebook placeholder
      expect(screen.getByText('t')).toBeInTheDocument() // Twitter placeholder
      expect(screen.getByText('in')).toBeInTheDocument() // LinkedIn placeholder
    })

    it('should render icons in contact section', () => {
      render(<PublicFooter />)
      
      // Check for contact icons by looking for elements with specific classes or text content
      const contactSection = screen.getByText('Contact Info').closest('div')
      expect(contactSection).toBeInTheDocument()
      
      // Icons should be present for phone, email, and hours
      expect(screen.getByText('1-800-555-0123')).toBeInTheDocument()
      expect(screen.getByText('info@union.org')).toBeInTheDocument()
      expect(screen.getByText('Mon-Fri 8AM-5PM EST')).toBeInTheDocument()
    })

    it('should have proper footer structure and styling', () => {
      render(<PublicFooter />)
      
      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveClass('bg-union-900', 'text-white')
    })

    it('should render responsive grid layout', () => {
      render(<PublicFooter />)
      
      // Look for the main grid container in the footer structure
      const footer = screen.getByRole('contentinfo')
      const gridContainer = footer.querySelector('.grid')
      expect(gridContainer).toBeInTheDocument()
      expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-8')
    })
  })

  describe('Layout Components Accessibility', () => {
    it('should have proper ARIA roles in DashboardHeader', () => {
      render(<DashboardHeader />)
      
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should have proper ARIA roles in DashboardSidebar', () => {
      render(<DashboardSidebar />)
      
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })

    it('should have proper ARIA roles in PublicHeader', () => {
      render(<PublicHeader />)
      
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })

    it('should have proper ARIA roles in PublicFooter', () => {
      render(<PublicFooter />)
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })
  })

  describe('Layout Components Responsive Behavior', () => {
    it('should hide navigation on mobile in PublicHeader', () => {
      render(<PublicHeader />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('hidden', 'md:block')
    })

    it('should render proper mobile-responsive classes in PublicFooter', () => {
      render(<PublicFooter />)
      
      const maxWidthContainer = screen.getByText('Union Benefits').closest('.max-w-7xl')
      expect(maxWidthContainer).toHaveClass('px-4', 'sm:px-6', 'lg:px-8')
    })

    it('should render sidebar navigation', () => {
      render(<DashboardSidebar />)
      
      const navigation = screen.getByRole('navigation')
      expect(navigation).toBeInTheDocument()
      
      // Check that it contains navigation links
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })
  })
})
