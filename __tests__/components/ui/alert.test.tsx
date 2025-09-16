import React from 'react';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

describe('Alert Components', () => {
  describe('Alert', () => {
    it('should render with default props', () => {
      render(<Alert data-testid="alert">Alert content</Alert>);
      
      const alert = screen.getByTestId('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('role', 'alert');
      expect(alert).toHaveAttribute('data-slot', 'alert');
      expect(alert).toHaveTextContent('Alert content');
    });

    it('should render with default variant classes', () => {
      render(<Alert data-testid="alert">Alert content</Alert>);
      
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('bg-card', 'text-card-foreground');
    });

    it('should render with destructive variant', () => {
      render(<Alert variant="destructive" data-testid="alert">Alert content</Alert>);
      
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('text-destructive', 'bg-card');
    });

    it('should apply custom className', () => {
      render(<Alert className="custom-class" data-testid="alert">Alert content</Alert>);
      
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('custom-class');
    });

    it('should have proper accessibility role', () => {
      render(<Alert>Alert content</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should render with icon and proper grid layout', () => {
      render(
        <Alert data-testid="alert">
          <AlertCircle />
          <AlertTitle>Error occurred</AlertTitle>
          <AlertDescription>Something went wrong</AlertDescription>
        </Alert>
      );
      
      const alert = screen.getByTestId('alert');
      const icon = alert.querySelector('svg');
      const title = screen.getByText('Error occurred');
      const description = screen.getByText('Something went wrong');
      
      expect(icon).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
      expect(alert).toHaveClass('has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr]');
    });

    it('should render without icon and proper grid layout', () => {
      render(
        <Alert data-testid="alert">
          <AlertTitle>No icon alert</AlertTitle>
          <AlertDescription>This alert has no icon</AlertDescription>
        </Alert>
      );
      
      const alert = screen.getByTestId('alert');
      const icon = alert.querySelector('svg');
      
      expect(icon).not.toBeInTheDocument();
      expect(alert).toHaveClass('grid-cols-[0_1fr]');
    });

    it('should spread additional props', () => {
      render(
        <Alert 
          data-testid="alert" 
          id="custom-alert" 
          aria-label="Custom alert"
        >
          Alert content
        </Alert>
      );
      
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('id', 'custom-alert');
      expect(alert).toHaveAttribute('aria-label', 'Custom alert');
    });
  });

  describe('AlertTitle', () => {
    it('should render with default props', () => {
      render(<AlertTitle data-testid="alert-title">Alert Title</AlertTitle>);
      
      const title = screen.getByTestId('alert-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveAttribute('data-slot', 'alert-title');
      expect(title).toHaveTextContent('Alert Title');
    });

    it('should have correct default classes', () => {
      render(<AlertTitle data-testid="alert-title">Alert Title</AlertTitle>);
      
      const title = screen.getByTestId('alert-title');
      expect(title).toHaveClass(
        'col-start-2',
        'line-clamp-1',
        'min-h-4',
        'font-medium',
        'tracking-tight'
      );
    });

    it('should apply custom className', () => {
      render(
        <AlertTitle className="custom-title" data-testid="alert-title">
          Alert Title
        </AlertTitle>
      );
      
      const title = screen.getByTestId('alert-title');
      expect(title).toHaveClass('custom-title');
    });

    it('should spread additional props', () => {
      render(
        <AlertTitle 
          data-testid="alert-title" 
          id="custom-title"
          role="heading"
        >
          Alert Title
        </AlertTitle>
      );
      
      const title = screen.getByTestId('alert-title');
      expect(title).toHaveAttribute('id', 'custom-title');
      expect(title).toHaveAttribute('role', 'heading');
    });

    it('should render as div by default', () => {
      render(<AlertTitle>Alert Title</AlertTitle>);
      
      const title = screen.getByText('Alert Title');
      expect(title.tagName).toBe('DIV');
    });
  });

  describe('AlertDescription', () => {
    it('should render with default props', () => {
      render(<AlertDescription data-testid="alert-desc">Alert description</AlertDescription>);
      
      const description = screen.getByTestId('alert-desc');
      expect(description).toBeInTheDocument();
      expect(description).toHaveAttribute('data-slot', 'alert-description');
      expect(description).toHaveTextContent('Alert description');
    });

    it('should have correct default classes', () => {
      render(<AlertDescription data-testid="alert-desc">Alert description</AlertDescription>);
      
      const description = screen.getByTestId('alert-desc');
      expect(description).toHaveClass(
        'text-muted-foreground',
        'col-start-2',
        'grid',
        'justify-items-start',
        'gap-1',
        'text-sm'
      );
    });

    it('should apply custom className', () => {
      render(
        <AlertDescription className="custom-desc" data-testid="alert-desc">
          Alert description
        </AlertDescription>
      );
      
      const description = screen.getByTestId('alert-desc');
      expect(description).toHaveClass('custom-desc');
    });

    it('should spread additional props', () => {
      render(
        <AlertDescription 
          data-testid="alert-desc" 
          id="custom-desc"
          role="status"
        >
          Alert description
        </AlertDescription>
      );
      
      const description = screen.getByTestId('alert-desc');
      expect(description).toHaveAttribute('id', 'custom-desc');
      expect(description).toHaveAttribute('role', 'status');
    });

    it('should render as div by default', () => {
      render(<AlertDescription>Alert description</AlertDescription>);
      
      const description = screen.getByText('Alert description');
      expect(description.tagName).toBe('DIV');
    });

    it('should render with complex content', () => {
      render(
        <AlertDescription data-testid="alert-desc">
          <p>This is a paragraph with <strong>bold text</strong>.</p>
          <p>This is another paragraph.</p>
        </AlertDescription>
      );
      
      const description = screen.getByTestId('alert-desc');
      const paragraph = description.querySelector('p');
      const boldText = description.querySelector('strong');
      
      expect(paragraph).toBeInTheDocument();
      expect(boldText).toBeInTheDocument();
      expect(boldText).toHaveTextContent('bold text');
    });
  });

  describe('Complete Alert Examples', () => {
    it('should render complete default alert', () => {
      render(
        <Alert data-testid="complete-alert">
          <CheckCircle data-testid="alert-icon" />
          <AlertTitle data-testid="alert-title">Success!</AlertTitle>
          <AlertDescription data-testid="alert-desc">
            Your changes have been saved successfully.
          </AlertDescription>
        </Alert>
      );
      
      const alert = screen.getByTestId('complete-alert');
      const icon = screen.getByTestId('alert-icon');
      const title = screen.getByTestId('alert-title');
      const description = screen.getByTestId('alert-desc');
      
      expect(alert).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(title).toHaveTextContent('Success!');
      expect(description).toHaveTextContent('Your changes have been saved successfully.');
      
      // Check layout classes
      expect(alert).toHaveClass('has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr]');
      expect(title).toHaveClass('col-start-2');
      expect(description).toHaveClass('col-start-2');
    });

    it('should render complete destructive alert', () => {
      render(
        <Alert variant="destructive" data-testid="destructive-alert">
          <AlertCircle data-testid="error-icon" />
          <AlertTitle data-testid="error-title">Error</AlertTitle>
          <AlertDescription data-testid="error-desc">
            There was an error processing your request. Please try again.
          </AlertDescription>
        </Alert>
      );
      
      const alert = screen.getByTestId('destructive-alert');
      const icon = screen.getByTestId('error-icon');
      const title = screen.getByTestId('error-title');
      const description = screen.getByTestId('error-desc');
      
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('text-destructive');
      expect(icon).toBeInTheDocument();
      expect(title).toHaveTextContent('Error');
      expect(description).toHaveTextContent('There was an error processing your request. Please try again.');
    });

    it('should render alert without icon', () => {
      render(
        <Alert data-testid="no-icon-alert">
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            This is an informational message without an icon.
          </AlertDescription>
        </Alert>
      );
      
      const alert = screen.getByTestId('no-icon-alert');
      const icon = alert.querySelector('svg');
      
      expect(alert).toBeInTheDocument();
      expect(icon).not.toBeInTheDocument();
      expect(alert).toHaveClass('grid-cols-[0_1fr]');
    });

    it('should render alert with only title', () => {
      render(
        <Alert data-testid="title-only-alert">
          <AlertTitle>Just a title</AlertTitle>
        </Alert>
      );
      
      const alert = screen.getByTestId('title-only-alert');
      const title = screen.getByText('Just a title');
      
      expect(alert).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('col-start-2');
    });

    it('should render alert with only description', () => {
      render(
        <Alert data-testid="desc-only-alert">
          <AlertDescription>Just a description without title</AlertDescription>
        </Alert>
      );
      
      const alert = screen.getByTestId('desc-only-alert');
      const description = screen.getByText('Just a description without title');
      
      expect(alert).toBeInTheDocument();
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('col-start-2');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role for alert', () => {
      render(<Alert>Important message</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should be accessible with screen readers', () => {
      render(
        <Alert>
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Accessible Alert</AlertTitle>
          <AlertDescription>
            This alert is properly structured for screen readers.
          </AlertDescription>
        </Alert>
      );
      
      const alert = screen.getByRole('alert');
      const title = screen.getByText('Accessible Alert');
      const description = screen.getByText('This alert is properly structured for screen readers.');
      
      expect(alert).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });

    it('should support custom aria attributes', () => {
      render(
        <Alert 
          aria-labelledby="alert-title" 
          aria-describedby="alert-desc"
          data-testid="aria-alert"
        >
          <AlertTitle id="alert-title">Custom ARIA</AlertTitle>
          <AlertDescription id="alert-desc">Custom ARIA description</AlertDescription>
        </Alert>
      );
      
      const alert = screen.getByTestId('aria-alert');
      expect(alert).toHaveAttribute('aria-labelledby', 'alert-title');
      expect(alert).toHaveAttribute('aria-describedby', 'alert-desc');
    });
  });
});