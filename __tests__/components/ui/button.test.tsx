import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, buttonVariants } from '@/components/ui/button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Button>Default Button</Button>);
      const button = screen.getByRole('button', { name: /default button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-slot', 'button');
    });

    it('should render button text correctly', () => {
      const buttonText = 'Click me';
      render(<Button>{buttonText}</Button>);
      expect(screen.getByText(buttonText)).toBeInTheDocument();
    });

    it('should have correct default classes', () => {
      render(<Button>Default Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });
  });

  describe('Variants', () => {
    it('should render default variant correctly', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should render destructive variant correctly', () => {
      render(<Button variant="destructive">Destructive</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive', 'text-white');
    });

    it('should render outline variant correctly', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'bg-background');
    });

    it('should render secondary variant correctly', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('should render ghost variant correctly', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
    });

    it('should render link variant correctly', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary', 'underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('should render default size correctly', () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'px-4', 'py-2');
    });

    it('should render small size correctly', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8', 'px-3');
    });

    it('should render large size correctly', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'px-6');
    });

    it('should render icon size correctly', () => {
      render(<Button size="icon">🔥</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-9');
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      const customClass = 'custom-button-class';
      render(<Button className={customClass}>Custom Class</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(customClass);
    });

    it('should be disabled when disabled prop is passed', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should apply custom type attribute', () => {
      render(<Button type="submit">Submit Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should handle onClick events', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('asChild prop', () => {
    it('should render as Slot when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveAttribute('data-slot', 'button');
    });

    it('should render as button when asChild is false', () => {
      render(<Button asChild={false}>Regular Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should render as button by default when asChild is not specified', () => {
      render(<Button>Default Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Variant and Size Combinations', () => {
    it('should handle multiple variant and size combinations', () => {
      const combinations = [
        { variant: 'default' as const, size: 'sm' as const },
        { variant: 'destructive' as const, size: 'lg' as const },
        { variant: 'outline' as const, size: 'icon' as const },
        { variant: 'secondary' as const, size: 'default' as const },
      ];

      combinations.forEach(({ variant, size }, index) => {
        const { unmount } = render(
          <Button variant={variant} size={size}>
            Button {index}
          </Button>
        );
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper focus behavior', () => {
      render(<Button>Focusable Button</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('should support aria attributes', () => {
      render(
        <Button aria-label="Custom aria label" aria-describedby="description">
          Button
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom aria label');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    it('should have proper disabled state styling', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });
  });

  describe('Icon Handling', () => {
    it('should handle SVG icons properly', () => {
      render(
        <Button>
          <svg data-testid="icon" width="16" height="16" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Button with Icon
        </Button>
      );
      
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('icon');
      
      expect(button).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(button).toContainElement(icon);
    });
  });
});

describe('buttonVariants', () => {
  it('should generate correct class combinations', () => {
    const defaultVariant = buttonVariants();
    expect(defaultVariant).toContain('bg-primary');
    expect(defaultVariant).toContain('h-9');
  });

  it('should handle different variant and size combinations', () => {
    const destructiveSmall = buttonVariants({ variant: 'destructive', size: 'sm' });
    expect(destructiveSmall).toContain('bg-destructive');
    expect(destructiveSmall).toContain('h-8');
  });

  it('should handle custom className', () => {
    const customButton = buttonVariants({ className: 'my-custom-class' });
    expect(customButton).toContain('my-custom-class');
  });

  it('should return string with all variant classes', () => {
    const outlineLarge = buttonVariants({ variant: 'outline', size: 'lg' });
    expect(typeof outlineLarge).toBe('string');
    expect(outlineLarge).toContain('border');
    expect(outlineLarge).toContain('h-10');
  });
});