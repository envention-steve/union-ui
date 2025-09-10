import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Skeleton } from '../../../components/ui/skeleton';
import { Switch } from '../../../components/ui/switch';
import { Textarea } from '../../../components/ui/textarea';

// Mock Radix UI Switch
jest.mock('@radix-ui/react-switch', () => ({
  Root: ({ children, className, onCheckedChange, checked, ...props }: any) => (
    <div 
      data-testid="switch-root" 
      className={className} 
      role="switch" 
      tabIndex={0}
      aria-checked={checked || false}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      {children}
    </div>
  ),
  Thumb: ({ className, ...domProps }: any) => (
    <div data-testid="switch-thumb" className={className} {...domProps} />
  ),
}));

describe('Missing UI Components', () => {
  describe('Skeleton', () => {
    it('should render with default classes', () => {
      render(<Skeleton data-testid="skeleton" />);
      
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('data-slot', 'skeleton');
      expect(skeleton).toHaveClass('bg-accent', 'animate-pulse', 'rounded-md');
    });

    it('should accept custom className', () => {
      render(<Skeleton data-testid="skeleton" className="custom-class h-20" />);
      
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('custom-class', 'h-20');
      expect(skeleton).toHaveClass('bg-accent', 'animate-pulse', 'rounded-md'); // default classes should still be present
    });

    it('should pass through other props', () => {
      render(<Skeleton data-testid="skeleton" aria-label="Loading content" />);
      
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should render as div element by default', () => {
      const { container } = render(<Skeleton />);
      
      const skeleton = container.firstChild;
      expect(skeleton?.nodeName).toBe('DIV');
    });
  });

  describe('Switch', () => {
    it('should render with default state', () => {
      render(<Switch data-testid="switch" />);
      
      const switchComponent = screen.getByTestId('switch');
      expect(switchComponent).toBeInTheDocument();
      expect(switchComponent).toHaveAttribute('role', 'switch');
      expect(switchComponent).toHaveAttribute('aria-checked', 'false');
    });

    it('should render with checked state', () => {
      render(<Switch data-testid="switch" checked />);
      
      const switchComponent = screen.getByTestId('switch');
      expect(switchComponent).toHaveAttribute('aria-checked', 'true');
    });

    it('should call onCheckedChange when clicked', () => {
      const mockOnChange = jest.fn();
      render(<Switch data-testid="switch" onCheckedChange={mockOnChange} />);
      
      const switchComponent = screen.getByTestId('switch');
      fireEvent.click(switchComponent);
      
      expect(mockOnChange).toHaveBeenCalledWith(true);
    });

    it('should toggle state correctly', () => {
      const mockOnChange = jest.fn();
      render(<Switch data-testid="switch" checked onCheckedChange={mockOnChange} />);
      
      const switchComponent = screen.getByTestId('switch');
      fireEvent.click(switchComponent);
      
      expect(mockOnChange).toHaveBeenCalledWith(false);
    });

    it('should render switch thumb', () => {
      render(<Switch data-testid="switch" />);
      
      const switchThumb = screen.getByTestId('switch-thumb');
      expect(switchThumb).toBeInTheDocument();
      expect(switchThumb).toHaveAttribute('data-slot', 'switch-thumb');
    });

    it('should accept custom className', () => {
      render(<Switch data-testid="switch" className="custom-switch" />);
      
      const switchComponent = screen.getByTestId('switch');
      expect(switchComponent).toHaveClass('custom-switch');
    });

    it('should be focusable', () => {
      render(<Switch data-testid="switch" />);
      
      const switchComponent = screen.getByTestId('switch');
      expect(switchComponent).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper data attributes', () => {
      render(<Switch />);
      
      const switchRoot = screen.getByTestId('switch-root');
      expect(switchRoot).toHaveAttribute('data-slot', 'switch');
    });
  });

  describe('Textarea', () => {
    it('should render with default classes and attributes', () => {
      render(<Textarea data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('data-slot', 'textarea');
      expect(textarea).toHaveClass(
        'border-input',
        'placeholder:text-muted-foreground',
        'focus-visible:border-ring',
        'focus-visible:ring-ring/50',
        'min-h-16',
        'w-full',
        'rounded-md',
        'border',
        'bg-transparent'
      );
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should accept custom className', () => {
      render(<Textarea data-testid="textarea" className="custom-textarea h-32" />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveClass('custom-textarea', 'h-32');
    });

    it('should accept and display placeholder', () => {
      render(<Textarea data-testid="textarea" placeholder="Enter your message here..." />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('placeholder', 'Enter your message here...');
    });

    it('should handle value changes', () => {
      const mockOnChange = jest.fn();
      render(<Textarea data-testid="textarea" onChange={mockOnChange} />);
      
      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Hello world' } });
      
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should support controlled value', () => {
      render(<Textarea data-testid="textarea" value="Controlled value" readOnly />);
      
      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Controlled value');
    });

    it('should support disabled state', () => {
      render(<Textarea data-testid="textarea" disabled />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toBeDisabled();
    });

    it('should support required attribute', () => {
      render(<Textarea data-testid="textarea" required />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toBeRequired();
    });

    it('should support aria attributes', () => {
      render(
        <Textarea 
          data-testid="textarea" 
          aria-label="Message input" 
          aria-describedby="message-help"
          aria-invalid={true}
        />
      );
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('aria-label', 'Message input');
      expect(textarea).toHaveAttribute('aria-describedby', 'message-help');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('should handle focus and blur events', () => {
      const mockOnFocus = jest.fn();
      const mockOnBlur = jest.fn();
      
      render(
        <Textarea 
          data-testid="textarea" 
          onFocus={mockOnFocus}
          onBlur={mockOnBlur}
        />
      );
      
      const textarea = screen.getByTestId('textarea');
      
      fireEvent.focus(textarea);
      expect(mockOnFocus).toHaveBeenCalled();
      
      fireEvent.blur(textarea);
      expect(mockOnBlur).toHaveBeenCalled();
    });

    it('should support rows and cols attributes', () => {
      render(<Textarea data-testid="textarea" rows={5} cols={50} />);
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('rows', '5');
      expect(textarea).toHaveAttribute('cols', '50');
    });
  });

  describe('Component Integration', () => {
    it('should render multiple components together', () => {
      render(
        <div>
          <Skeleton data-testid="loading-skeleton" className="mb-4 h-20" />
          <Switch data-testid="toggle-switch" />
          <Textarea data-testid="comment-textarea" placeholder="Add a comment..." />
        </div>
      );
      
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-switch')).toBeInTheDocument();
      expect(screen.getByTestId('comment-textarea')).toBeInTheDocument();
    });

    it('should handle component interactions', () => {
      const mockSwitchChange = jest.fn();
      const mockTextareaChange = jest.fn();
      
      render(
        <div>
          <Switch data-testid="toggle" onCheckedChange={mockSwitchChange} />
          <Textarea data-testid="input" onChange={mockTextareaChange} />
        </div>
      );
      
      // Test switch interaction
      fireEvent.click(screen.getByTestId('toggle'));
      expect(mockSwitchChange).toHaveBeenCalledWith(true);
      
      // Test textarea interaction
      fireEvent.change(screen.getByTestId('input'), { 
        target: { value: 'Test input' } 
      });
      expect(mockTextareaChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should provide proper accessibility for Switch', () => {
      render(
        <label>
          <span>Enable notifications</span>
          <Switch data-testid="switch" />
        </label>
      );
      
      const switchComponent = screen.getByTestId('switch');
      expect(switchComponent).toHaveAttribute('role', 'switch');
      expect(switchComponent).toHaveAttribute('tabIndex', '0');
    });

    it('should provide proper accessibility for Textarea', () => {
      render(
        <div>
          <label htmlFor="message">Message</label>
          <Textarea 
            id="message"
            data-testid="textarea" 
            aria-describedby="message-help"
          />
          <div id="message-help">Enter your message here</div>
        </div>
      );
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('id', 'message');
      expect(textarea).toHaveAttribute('aria-describedby', 'message-help');
      
      const label = screen.getByText('Message');
      expect(label).toHaveAttribute('for', 'message');
    });

    it('should support screen reader text with Skeleton', () => {
      render(
        <div>
          <Skeleton data-testid="skeleton" aria-label="Loading user profile" />
          <span className="sr-only">Content is loading, please wait</span>
        </div>
      );
      
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading user profile');
    });
  });
});
