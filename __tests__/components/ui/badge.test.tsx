import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle } from 'lucide-react';

describe('Badge Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<Badge data-testid="badge">Default Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-slot', 'badge');
      expect(badge).toHaveTextContent('Default Badge');
    });

    it('should render as span by default', () => {
      render(<Badge>Default Badge</Badge>);
      
      const badge = screen.getByText('Default Badge');
      expect(badge.tagName).toBe('SPAN');
    });

    it('should apply custom className', () => {
      render(<Badge className="custom-class" data-testid="badge">Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('custom-class');
    });

    it('should spread additional props', () => {
      render(
        <Badge 
          data-testid="badge" 
          id="custom-badge"
          role="status"
          aria-label="Status badge"
        >
          Badge
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('id', 'custom-badge');
      expect(badge).toHaveAttribute('role', 'status');
      expect(badge).toHaveAttribute('aria-label', 'Status badge');
    });
  });

  describe('Variants', () => {
    it('should render with default variant', () => {
      render(<Badge data-testid="badge">Default</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-primary',
        'text-primary-foreground'
      );
    });

    it('should render with default variant explicitly', () => {
      render(<Badge variant="default" data-testid="badge">Default</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-primary',
        'text-primary-foreground'
      );
    });

    it('should render with secondary variant', () => {
      render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-secondary',
        'text-secondary-foreground'
      );
    });

    it('should render with destructive variant', () => {
      render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-destructive',
        'text-white'
      );
    });

    it('should render with outline variant', () => {
      render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('text-foreground');
      expect(badge).not.toHaveClass('border-transparent');
    });
  });

  describe('Base Classes', () => {
    it('should have correct base classes', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center',
        'rounded-md',
        'border',
        'px-2',
        'py-0.5',
        'text-xs',
        'font-medium',
        'w-fit',
        'whitespace-nowrap',
        'shrink-0'
      );
    });

    it('should have focus and transition classes', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass(
        'focus-visible:border-ring',
        'focus-visible:ring-ring/50',
        'focus-visible:ring-[3px]',
        'transition-[color,box-shadow]',
        'overflow-hidden'
      );
    });

    it('should have icon-related classes', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass(
        '[&>svg]:size-3',
        'gap-1',
        '[&>svg]:pointer-events-none'
      );
    });

    it('should have aria-invalid classes', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass(
        'aria-invalid:ring-destructive/20',
        'dark:aria-invalid:ring-destructive/40',
        'aria-invalid:border-destructive'
      );
    });
  });

  describe('asChild Prop', () => {
    it('should render as Slot when asChild is true', () => {
      render(
        <Badge asChild data-testid="badge-link">
          <a href="/test">Link Badge</a>
        </Badge>
      );
      
      const badge = screen.getByTestId('badge-link');
      expect(badge.tagName).toBe('A');
      expect(badge).toHaveAttribute('href', '/test');
      expect(badge).toHaveTextContent('Link Badge');
      expect(badge).toHaveAttribute('data-slot', 'badge');
    });

    it('should render as span when asChild is false', () => {
      render(<Badge asChild={false} data-testid="badge">Span Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge.tagName).toBe('SPAN');
      expect(badge).toHaveTextContent('Span Badge');
    });

    it('should preserve badge classes with asChild', () => {
      render(
        <Badge asChild variant="destructive" data-testid="badge-button">
          <button type="button">Button Badge</button>
        </Badge>
      );
      
      const badge = screen.getByTestId('badge-button');
      expect(badge.tagName).toBe('BUTTON');
      expect(badge).toHaveClass(
        'bg-destructive',
        'text-white',
        'inline-flex',
        'items-center'
      );
    });

    it('should work with different child elements', () => {
      render(
        <Badge asChild variant="secondary" data-testid="badge-div">
          <div role="status">Div Badge</div>
        </Badge>
      );
      
      const badge = screen.getByTestId('badge-div');
      expect(badge.tagName).toBe('DIV');
      expect(badge).toHaveAttribute('role', 'status');
      expect(badge).toHaveClass('bg-secondary');
    });
  });

  describe('Content and Icons', () => {
    it('should render text content', () => {
      render(<Badge data-testid="badge">Simple Text</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('Simple Text');
    });

    it('should render with icon', () => {
      render(
        <Badge data-testid="badge">
          <Star data-testid="star-icon" />
          Featured
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      const icon = screen.getByTestId('star-icon');
      
      expect(badge).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(badge).toHaveTextContent('Featured');
      expect(badge).toHaveClass('gap-1');
    });

    it('should render with multiple icons', () => {
      render(
        <Badge data-testid="badge">
          <CheckCircle data-testid="check-icon" />
          <Star data-testid="star-icon" />
          Premium
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      const checkIcon = screen.getByTestId('check-icon');
      const starIcon = screen.getByTestId('star-icon');
      
      expect(badge).toBeInTheDocument();
      expect(checkIcon).toBeInTheDocument();
      expect(starIcon).toBeInTheDocument();
      expect(badge).toHaveTextContent('Premium');
    });

    it('should render icon only', () => {
      render(
        <Badge data-testid="badge">
          <Star data-testid="star-icon" />
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      const icon = screen.getByTestId('star-icon');
      
      expect(badge).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(badge).not.toHaveTextContent('Featured');
    });

    it('should render with complex content', () => {
      render(
        <Badge data-testid="badge">
          <Star />
          <span>Premium</span>
          <span>User</span>
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      const icon = badge.querySelector('svg');
      const spans = badge.querySelectorAll('span');
      
      expect(badge).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(spans).toHaveLength(2);
      expect(spans[0]).toHaveTextContent('Premium');
      expect(spans[1]).toHaveTextContent('User');
    });
  });

  describe('Hover States', () => {
    it('should have hover styles for default variant in anchor', () => {
      render(
        <Badge asChild data-testid="badge-link">
          <a href="/test">Hoverable Badge</a>
        </Badge>
      );
      
      const badge = screen.getByTestId('badge-link');
      expect(badge).toHaveClass('[a&]:hover:bg-primary/90');
    });

    it('should have hover styles for secondary variant in anchor', () => {
      render(
        <Badge asChild variant="secondary" data-testid="badge-link">
          <a href="/test">Secondary Badge</a>
        </Badge>
      );
      
      const badge = screen.getByTestId('badge-link');
      expect(badge).toHaveClass('[a&]:hover:bg-secondary/90');
    });

    it('should have hover styles for destructive variant in anchor', () => {
      render(
        <Badge asChild variant="destructive" data-testid="badge-link">
          <a href="/test">Destructive Badge</a>
        </Badge>
      );
      
      const badge = screen.getByTestId('badge-link');
      expect(badge).toHaveClass('[a&]:hover:bg-destructive/90');
    });

    it('should have hover styles for outline variant in anchor', () => {
      render(
        <Badge asChild variant="outline" data-testid="badge-link">
          <a href="/test">Outline Badge</a>
        </Badge>
      );
      
      const badge = screen.getByTestId('badge-link');
      expect(badge).toHaveClass(
        '[a&]:hover:bg-accent',
        '[a&]:hover:text-accent-foreground'
      );
    });
  });

  describe('Focus States', () => {
    it('should have focus styles for destructive variant', () => {
      render(<Badge variant="destructive" data-testid="badge">Focus Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass(
        'focus-visible:ring-destructive/20',
        'dark:focus-visible:ring-destructive/40'
      );
    });

    it('should have general focus styles', () => {
      render(<Badge data-testid="badge">Focus Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass(
        'focus-visible:border-ring',
        'focus-visible:ring-ring/50',
        'focus-visible:ring-[3px]'
      );
    });
  });

  describe('Dark Mode Classes', () => {
    it('should have dark mode classes for destructive variant', () => {
      render(<Badge variant="destructive" data-testid="badge">Dark Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('dark:bg-destructive/60');
    });
  });

  describe('Real-world Usage Examples', () => {
    it('should render status badge', () => {
      render(
        <Badge variant="secondary" data-testid="status-badge">
          <CheckCircle />
          Active
        </Badge>
      );
      
      const badge = screen.getByTestId('status-badge');
      const icon = badge.querySelector('svg');
      
      expect(badge).toHaveClass('bg-secondary');
      expect(icon).toBeInTheDocument();
      expect(badge).toHaveTextContent('Active');
    });

    it('should render notification badge', () => {
      render(
        <Badge variant="destructive" data-testid="notification-badge">
          3
        </Badge>
      );
      
      const badge = screen.getByTestId('notification-badge');
      expect(badge).toHaveClass('bg-destructive', 'text-white');
      expect(badge).toHaveTextContent('3');
    });

    it('should render clickable badge', () => {
      const handleClick = jest.fn();
      
      render(
        <Badge asChild data-testid="clickable-badge">
          <button onClick={handleClick}>
            <Star />
            Favorite
          </button>
        </Badge>
      );
      
      const badge = screen.getByTestId('clickable-badge');
      expect(badge.tagName).toBe('BUTTON');
      expect(badge).toHaveClass('bg-primary');
      
      // Note: We're not simulating clicks in this test to keep it focused on rendering
    });

    it('should render link badge', () => {
      render(
        <Badge asChild variant="outline" data-testid="link-badge">
          <a href="/category/featured">
            <Star />
            Featured Items
          </a>
        </Badge>
      );
      
      const badge = screen.getByTestId('link-badge');
      expect(badge.tagName).toBe('A');
      expect(badge).toHaveAttribute('href', '/category/featured');
      expect(badge).toHaveClass('text-foreground');
      expect(badge).toHaveTextContent('Featured Items');
    });

    it('should render category badges', () => {
      const categories = ['React', 'TypeScript', 'Testing'];
      
      render(
        <div className="flex gap-2" data-testid="category-container">
          {categories.map((category, index) => (
            <Badge key={category} variant="secondary" data-testid={`category-badge-${index}`}>
              {category}
            </Badge>
          ))}
        </div>
      );
      
      const container = screen.getByTestId('category-container');
      const badges = screen.getAllByTestId(/^category-badge-/);
      
      expect(container).toBeInTheDocument();
      expect(badges).toHaveLength(3);
      expect(badges[0]).toHaveTextContent('React');
      expect(badges[1]).toHaveTextContent('TypeScript');
      expect(badges[2]).toHaveTextContent('Testing');
    });
  });

  describe('Accessibility', () => {
    it('should support role attribute', () => {
      render(<Badge role="status" data-testid="badge">Status</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('role', 'status');
    });

    it('should support aria-label', () => {
      render(
        <Badge aria-label="3 unread notifications" data-testid="badge">
          3
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('aria-label', '3 unread notifications');
    });

    it('should support aria-describedby', () => {
      render(
        <div>
          <Badge aria-describedby="badge-description" data-testid="badge">
            Premium
          </Badge>
          <div id="badge-description">This is a premium feature badge</div>
        </div>
      );
      
      const badge = screen.getByTestId('badge');
      const description = screen.getByText('This is a premium feature badge');
      
      expect(badge).toHaveAttribute('aria-describedby', 'badge-description');
      expect(description).toBeInTheDocument();
    });

    it('should support tabIndex for keyboard navigation', () => {
      render(<Badge tabIndex={0} data-testid="badge">Focusable Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('tabIndex', '0');
    });

    it('should work with screen reader text', () => {
      render(
        <Badge data-testid="badge">
          <span aria-hidden="true">🔥</span>
          <span className="sr-only">Hot item</span>
          Popular
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      const emoji = badge.querySelector('[aria-hidden="true"]');
      const srText = badge.querySelector('.sr-only');
      
      expect(badge).toBeInTheDocument();
      expect(emoji).toHaveTextContent('🔥');
      expect(srText).toHaveTextContent('Hot item');
      expect(badge).toHaveTextContent('Popular');
    });
  });
});