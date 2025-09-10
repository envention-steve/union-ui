import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DocumentCard } from '@/components/features/documents/document-card'
import { UpdateCard } from '@/components/features/updates/update-card'
import { FileText, Bell, Users, Settings } from 'lucide-react'

describe('Feature Components', () => {
  describe('DocumentCard', () => {
    const defaultProps = {
      title: 'Benefits Handbook',
      description: 'Complete guide to your union benefits package',
      fileSize: '2.4 MB',
      icon: <FileText className="w-6 h-6 text-white" />,
      iconColor: 'bg-blue-600',
    }

    it('should render document card with all information', () => {
      render(<DocumentCard {...defaultProps} />)
      
      expect(screen.getByText('Benefits Handbook')).toBeInTheDocument()
      expect(screen.getByText('Complete guide to your union benefits package')).toBeInTheDocument()
      expect(screen.getByText('2.4 MB')).toBeInTheDocument()
      expect(screen.getByText('Download')).toBeInTheDocument()
    })

    it('should render with custom icon color', () => {
      render(<DocumentCard {...defaultProps} iconColor="bg-red-500" />)
      
      const iconContainer = screen.getByText('Benefits Handbook').parentElement?.previousElementSibling
      expect(iconContainer).toHaveClass('bg-red-500')
    })

    it('should render download button with correct styling', () => {
      render(<DocumentCard {...defaultProps} />)
      
      const downloadButton = screen.getByRole('button', { name: /download/i })
      expect(downloadButton).toBeInTheDocument()
      expect(downloadButton).toHaveClass('w-full', 'bg-union-600', 'hover:bg-union-500', 'text-white')
    })

    it('should handle click on download button', () => {
      const mockClick = jest.fn()
      
      render(
        <DocumentCard 
          {...defaultProps} 
        />
      )
      
      const downloadButton = screen.getByRole('button', { name: /download/i })
      fireEvent.click(downloadButton)
      
      // Button should be clickable (no errors thrown)
      expect(downloadButton).toBeInTheDocument()
    })

    it('should render with different file types and sizes', () => {
      const pdfProps = {
        ...defaultProps,
        title: 'Policy Document',
        description: 'Updated policy guidelines',
        fileSize: '856 KB',
      }
      
      render(<DocumentCard {...pdfProps} />)
      
      expect(screen.getByText('Policy Document')).toBeInTheDocument()
      expect(screen.getByText('Updated policy guidelines')).toBeInTheDocument()
      expect(screen.getByText('856 KB')).toBeInTheDocument()
    })

    it('should render with long titles and descriptions', () => {
      const longContentProps = {
        ...defaultProps,
        title: 'Very Long Document Title That Might Wrap Across Multiple Lines',
        description: 'This is a very long description that contains multiple sentences and detailed information about the document content and what users can expect to find when they download it.',
        fileSize: '15.7 MB',
      }
      
      render(<DocumentCard {...longContentProps} />)
      
      expect(screen.getByText(longContentProps.title)).toBeInTheDocument()
      expect(screen.getByText(longContentProps.description)).toBeInTheDocument()
    })

    it('should render with different icons', () => {
      const settingsIcon = <Settings className="w-6 h-6 text-white" />
      
      render(<DocumentCard {...defaultProps} icon={settingsIcon} />)
      
      // Icon should be rendered (we can't directly test the icon component, but we can verify the container)
      const iconContainer = screen.getByText('Benefits Handbook').parentElement?.previousElementSibling
      expect(iconContainer).toHaveClass('p-3', 'rounded-lg', 'bg-blue-600', 'flex-shrink-0')
    })

    it('should have proper card structure and styling', () => {
      const { container } = render(<DocumentCard {...defaultProps} />)
      
      const card = container.querySelector('[data-slot="card"]')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('bg-union-800', 'border-union-700', 'hover:bg-union-750', 'transition-colors')
    })

    it('should render download icon in button', () => {
      render(<DocumentCard {...defaultProps} />)
      
      const downloadButton = screen.getByRole('button', { name: /download/i })
      const svgElement = downloadButton.querySelector('svg')
      expect(svgElement).toBeInTheDocument()
    })

    it('should handle empty or minimal content', () => {
      const minimalProps = {
        title: 'Doc',
        description: 'File',
        fileSize: '1KB',
        icon: <FileText className="w-6 h-6 text-white" />,
        iconColor: 'bg-gray-500',
      }
      
      render(<DocumentCard {...minimalProps} />)
      
      expect(screen.getByText('Doc')).toBeInTheDocument()
      expect(screen.getByText('File')).toBeInTheDocument()
      expect(screen.getByText('1KB')).toBeInTheDocument()
    })
  })

  describe('UpdateCard', () => {
    const defaultProps = {
      title: 'New Benefits Added',
      description: 'We have added dental and vision coverage to your benefits package. These new benefits are available starting next month.',
      date: '2024-01-15',
      category: 'Benefits',
      categoryColor: 'bg-green-600',
      icon: <Bell className="w-5 h-5 text-union-400" />,
    }

    it('should render update card with all information', () => {
      render(<UpdateCard {...defaultProps} />)
      
      expect(screen.getByText('New Benefits Added')).toBeInTheDocument()
      expect(screen.getByText(/We have added dental and vision coverage/)).toBeInTheDocument()
      expect(screen.getByText('2024-01-15')).toBeInTheDocument()
      expect(screen.getByText('Benefits')).toBeInTheDocument()
    })

    it('should render with custom category color', () => {
      render(<UpdateCard {...defaultProps} categoryColor="bg-red-500" />)
      
      const badge = screen.getByText('Benefits')
      expect(badge).toHaveClass('bg-red-500')
    })

    it('should render with different categories', () => {
      const policyProps = {
        ...defaultProps,
        title: 'Policy Update',
        category: 'Policy',
        categoryColor: 'bg-yellow-600',
      }
      
      render(<UpdateCard {...policyProps} />)
      
      expect(screen.getByText('Policy')).toBeInTheDocument()
      const badge = screen.getByText('Policy')
      expect(badge).toHaveClass('bg-yellow-600')
    })

    it('should render with different icons', () => {
      const usersIcon = <Users className="w-5 h-5 text-union-400" />
      
      render(<UpdateCard {...defaultProps} icon={usersIcon} />)
      
      // Icon should be rendered in the icon container
      const iconContainer = screen.getByText('New Benefits Added').parentElement?.parentElement?.querySelector('.p-2')
      expect(iconContainer).toBeInTheDocument()
      expect(iconContainer).toHaveClass('p-2', 'rounded-lg', 'bg-union-700', 'flex-shrink-0')
    })

    it('should handle long descriptions', () => {
      const longDescriptionProps = {
        ...defaultProps,
        description: 'This is a very long update description that contains multiple sentences and detailed information about the changes being made to your benefits package. It includes information about eligibility requirements, enrollment periods, and contact information for questions. This description might wrap across multiple lines in the card layout.',
      }
      
      render(<UpdateCard {...longDescriptionProps} />)
      
      expect(screen.getByText(/This is a very long update description/)).toBeInTheDocument()
    })

    it('should render with different date formats', () => {
      const differentDateProps = {
        ...defaultProps,
        date: 'January 15, 2024',
      }
      
      render(<UpdateCard {...differentDateProps} />)
      
      expect(screen.getByText('January 15, 2024')).toBeInTheDocument()
    })

    it('should have proper card structure and styling', () => {
      const { container } = render(<UpdateCard {...defaultProps} />)
      
      const card = container.querySelector('[data-slot="card"]')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('bg-union-800', 'border-union-700', 'hover:bg-union-750', 'transition-colors')
    })

    it('should render badge with correct styling', () => {
      render(<UpdateCard {...defaultProps} />)
      
      const badge = screen.getByText('Benefits')
      expect(badge).toHaveClass('bg-green-600', 'text-white', 'text-xs')
    })

    it('should render title and date in header section', () => {
      render(<UpdateCard {...defaultProps} />)
      
      const title = screen.getByText('New Benefits Added')
      const date = screen.getByText('2024-01-15')
      
      expect(title).toBeInTheDocument()
      expect(date).toBeInTheDocument()
      
      // Title should have proper styling
      expect(title).toHaveClass('text-white', 'font-semibold')
      expect(date).toHaveClass('text-union-300', 'text-sm')
    })

    it('should handle minimal content', () => {
      const minimalProps = {
        title: 'Update',
        description: 'Changed',
        date: '2024-01-01',
        category: 'Info',
        categoryColor: 'bg-blue-500',
        icon: <Bell className="w-5 h-5 text-union-400" />,
      }
      
      render(<UpdateCard {...minimalProps} />)
      
      expect(screen.getByText('Update')).toBeInTheDocument()
      expect(screen.getByText('Changed')).toBeInTheDocument()
      expect(screen.getByText('2024-01-01')).toBeInTheDocument()
      expect(screen.getByText('Info')).toBeInTheDocument()
    })

    it('should render with urgent/priority categories', () => {
      const urgentProps = {
        ...defaultProps,
        title: 'Urgent: Action Required',
        category: 'Urgent',
        categoryColor: 'bg-red-600',
        description: 'Please complete your enrollment by the deadline.',
      }
      
      render(<UpdateCard {...urgentProps} />)
      
      expect(screen.getByText('Urgent: Action Required')).toBeInTheDocument()
      expect(screen.getByText('Urgent')).toBeInTheDocument()
      
      const badge = screen.getByText('Urgent')
      expect(badge).toHaveClass('bg-red-600')
    })
  })

  describe('Feature Card Interactions', () => {
    it('should support keyboard navigation on DocumentCard button', () => {
      render(
        <DocumentCard
          title="Test Document"
          description="Test description"
          fileSize="1MB"
          icon={<FileText className="w-6 h-6 text-white" />}
          iconColor="bg-blue-600"
        />
      )
      
      const button = screen.getByRole('button', { name: /download/i })
      
      // Button should be focusable
      button.focus()
      expect(document.activeElement).toBe(button)
    })

    it('should render cards with proper accessibility attributes', () => {
      render(
        <>
          <DocumentCard
            title="Accessible Document"
            description="Document description"
            fileSize="2MB"
            icon={<FileText className="w-6 h-6 text-white" />}
            iconColor="bg-blue-600"
          />
          <UpdateCard
            title="Accessible Update"
            description="Update description"
            date="2024-01-01"
            category="News"
            categoryColor="bg-blue-600"
            icon={<Bell className="w-5 h-5 text-union-400" />}
          />
        </>
      )
      
      // Cards should have proper button accessibility
      const downloadButton = screen.getByRole('button', { name: /download/i })
      expect(downloadButton).toBeInTheDocument()
      
      // Text content should be accessible
      expect(screen.getByText('Accessible Document')).toBeInTheDocument()
      expect(screen.getByText('Accessible Update')).toBeInTheDocument()
    })

    it('should handle hover states', () => {
      const { container } = render(
        <DocumentCard
          title="Hover Test"
          description="Test hover states"
          fileSize="1MB"
          icon={<FileText className="w-6 h-6 text-white" />}
          iconColor="bg-blue-600"
        />
      )
      
      const card = container.querySelector('[data-slot="card"]')
      expect(card).toHaveClass('hover:bg-union-750', 'transition-colors')
    })
  })

  describe('Feature Card Edge Cases', () => {
    it('should handle special characters in DocumentCard content', () => {
      render(
        <DocumentCard
          title="Special Chars: @#$%^&*()"
          description="Content with special characters: <>&'"
          fileSize="1.5 MB"
          icon={<FileText className="w-6 h-6 text-white" />}
          iconColor="bg-blue-600"
        />
      )
      
      expect(screen.getByText('Special Chars: @#$%^&*()')).toBeInTheDocument()
      expect(screen.getByText('Content with special characters: <>&\'')).toBeInTheDocument()
    })

    it('should handle special characters in UpdateCard content', () => {
      render(
        <UpdateCard
          title="Update with Special Chars: @#$%"
          description="Description with special chars: <>&'"
          date="2024-01-01"
          category="Special"
          categoryColor="bg-purple-600"
          icon={<Bell className="w-5 h-5 text-union-400" />}
        />
      )
      
      expect(screen.getByText('Update with Special Chars: @#$%')).toBeInTheDocument()
      expect(screen.getByText('Description with special chars: <>&\'')).toBeInTheDocument()
    })

    it('should handle very large file sizes in DocumentCard', () => {
      render(
        <DocumentCard
          title="Large File"
          description="Very large document"
          fileSize="999.9 GB"
          icon={<FileText className="w-6 h-6 text-white" />}
          iconColor="bg-blue-600"
        />
      )
      
      expect(screen.getByText('999.9 GB')).toBeInTheDocument()
    })

    it('should render consistently across different screen contexts', () => {
      const { rerender } = render(
        <DocumentCard
          title="Responsive Test"
          description="Test responsive behavior"
          fileSize="2MB"
          icon={<FileText className="w-6 h-6 text-white" />}
          iconColor="bg-blue-600"
        />
      )
      
      expect(screen.getByText('Responsive Test')).toBeInTheDocument()
      
      // Re-render with different props
      rerender(
        <UpdateCard
          title="Responsive Update"
          description="Test responsive update"
          date="2024-01-01"
          category="Test"
          categoryColor="bg-blue-600"
          icon={<Bell className="w-5 h-5 text-union-400" />}
        />
      )
      
      expect(screen.getByText('Responsive Update')).toBeInTheDocument()
    })
  })
})
