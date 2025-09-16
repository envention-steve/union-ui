import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render with default classes', () => {
      render(<Card data-testid="card" />);
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-card', 'text-card-foreground', 'flex', 'flex-col', 'gap-6', 'rounded-xl', 'border', 'py-6', 'shadow-sm');
    });
    it('should apply custom className', () => {
      const customClass = 'custom-card-class';
      render(<Card className={customClass} data-testid="card">Card Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass(customClass);
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Card Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render children correctly', () => {
      const childText = 'Card child content';
      render(<Card>{childText}</Card>);
      expect(screen.getByText(childText)).toBeInTheDocument();
    });
  });

  describe('CardHeader', () => {
    it('should render with default classes', () => {
      render(<CardHeader data-testid="card-header" />);
      
      const header = screen.getByTestId('card-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('@container/card-header', 'grid', 'auto-rows-min', 'grid-rows-[auto_auto]', 'items-start', 'gap-1.5', 'px-6');
    });
    it('should apply custom className', () => {
      const customClass = 'custom-header-class';
      render(<CardHeader className={customClass} data-testid="card-header">Header Content</CardHeader>);
      const header = screen.getByTestId('card-header');
      expect(header).toHaveClass(customClass);
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardHeader ref={ref}>Header Content</CardHeader>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardTitle', () => {
    it('should render with default classes', () => {
      render(<CardTitle data-testid="card-title">Test Title</CardTitle>);
      
      const title = screen.getByTestId('card-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('leading-none', 'font-semibold');
    });
    it('should apply custom className', () => {
      const customClass = 'custom-title-class';
      render(<CardTitle className={customClass} data-testid="card-title">Title Content</CardTitle>);
      const title = screen.getByTestId('card-title');
      expect(title).toHaveClass(customClass);
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardTitle ref={ref}>Title Content</CardTitle>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render as div by default', () => {
      render(<CardTitle>Title Content</CardTitle>);
      const title = screen.getByText('Title Content');
      expect(title.tagName).toBe('DIV');
    });
  });

  describe('CardDescription', () => {
    it('should render with default classes', () => {
      render(<CardDescription data-testid="card-description">Description Content</CardDescription>);
      const description = screen.getByTestId('card-description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('should apply custom className', () => {
      const customClass = 'custom-description-class';
      render(<CardDescription className={customClass} data-testid="card-description">Description Content</CardDescription>);
      const description = screen.getByTestId('card-description');
      expect(description).toHaveClass(customClass);
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardDescription ref={ref}>Description Content</CardDescription>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render as div by default', () => {
      render(<CardDescription>Description Content</CardDescription>);
      const description = screen.getByText('Description Content');
      expect(description.tagName).toBe('DIV');
    });
  });

  describe('CardContent', () => {
    it('should render with default classes', () => {
      render(<CardContent data-testid="card-content" />);
      
      const content = screen.getByTestId('card-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('px-6');
    });
    it('should apply custom className', () => {
      const customClass = 'custom-content-class';
      render(<CardContent className={customClass} data-testid="card-content">Content</CardContent>);
      const content = screen.getByTestId('card-content');
      expect(content).toHaveClass(customClass);
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardContent ref={ref}>Content</CardContent>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardFooter', () => {
    it('should render with default classes', () => {
      render(<CardFooter data-testid="card-footer" />);
      
      const footer = screen.getByTestId('card-footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex', 'items-center', 'px-6');
    });
    it('should apply custom className', () => {
      const customClass = 'custom-footer-class';
      render(<CardFooter className={customClass} data-testid="card-footer">Footer Content</CardFooter>);
      const footer = screen.getByTestId('card-footer');
      expect(footer).toHaveClass(customClass);
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardFooter ref={ref}>Footer Content</CardFooter>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Complete Card Structure', () => {
    it('should render a complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Test content paragraph</p>
          </CardContent>
          <CardFooter>
            <button>Action Button</button>
          </CardFooter>
        </Card>
      );

      const card = screen.getByTestId('complete-card');
      expect(card).toBeInTheDocument();

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Test content paragraph')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });

    it('should maintain proper hierarchy structure', () => {
      render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <CardTitle data-testid="title">Title</CardTitle>
            <CardDescription data-testid="description">Description</CardDescription>
          </CardHeader>
          <CardContent data-testid="content">Content</CardContent>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );

      const card = screen.getByTestId('card');
      const header = screen.getByTestId('header');
      const title = screen.getByTestId('title');
      const description = screen.getByTestId('description');
      const content = screen.getByTestId('content');
      const footer = screen.getByTestId('footer');

      expect(card).toContainElement(header);
      expect(card).toContainElement(content);
      expect(card).toContainElement(footer);
      expect(header).toContainElement(title);
      expect(header).toContainElement(description);
    });
  });

  describe('Accessibility', () => {
    it('should support ARIA attributes', () => {
      render(
        <Card aria-label="Test card" role="article" data-testid="card">
          <CardTitle aria-level="1">Accessible Title</CardTitle>
          <CardDescription aria-describedby="desc-id">Accessible Description</CardDescription>
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('aria-label', 'Test card');
      expect(card).toHaveAttribute('role', 'article');

      const description = screen.getByText('Accessible Description');
      expect(description).toHaveAttribute('aria-describedby', 'desc-id');
    });

    it('should be focusable when tabIndex is provided', () => {
      render(<Card tabIndex={0} data-testid="card">Focusable Card</Card>);
      const card = screen.getByTestId('card');
      
      card.focus();
      expect(document.activeElement).toBe(card);
    });
  });

  describe('Custom Props and Event Handlers', () => {
    it('should handle click events', () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick} data-testid="card">Clickable Card</Card>);
      
      const card = screen.getByTestId('card');
      card.click();
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should accept custom data attributes', () => {
      render(<Card data-custom="custom-value" data-testid="card">Card with data attributes</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('data-custom', 'custom-value');
    });

    it('should handle keyboard events', () => {
      const handleKeyDown = jest.fn();
      render(<Card onKeyDown={handleKeyDown} data-testid="card" tabIndex={0}>Card with keyboard handler</Card>);
      
      const card = screen.getByTestId('card');
      card.focus();
      
      // Use fireEvent for keyboard simulation
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });
  });
});