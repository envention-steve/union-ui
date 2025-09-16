import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('should render input with default props', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('data-slot', 'input');
      expect(input.tagName).toBe('INPUT');
    });

    it('should apply default CSS classes', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'file:text-foreground',
        'placeholder:text-muted-foreground',
        'border-input',
        'flex',
        'h-9',
        'w-full',
        'rounded-md',
        'border',
        'bg-transparent',
        'px-3',
        'py-1'
      );
    });

    it('should apply focus and validation classes', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'focus-visible:border-ring',
        'focus-visible:ring-ring/50',
        'focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20',
        'aria-invalid:border-destructive'
      );
    });
  });

  describe('Input Types', () => {
    const inputTypes = [
      'text', 'email', 'password', 'number', 
      'tel', 'url', 'search', 'date', 'time'
    ];

    inputTypes.forEach(type => {
      it(`should render input with type="${type}"`, () => {
        render(<Input type={type as any} data-testid="input" />);
        const input = screen.getByTestId('input');
        expect(input).toHaveAttribute('type', type);
      });
    });

    it('should default to text type when no type is specified', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      // Default type for input is text (or no type attribute)
      const inputType = input.getAttribute('type');
      expect(inputType === 'text' || inputType === null).toBe(true);
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      const customClass = 'custom-input-class';
      render(<Input className={customClass} data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass(customClass);
      // Should still have default classes
      expect(input).toHaveClass('flex', 'h-9', 'w-full');
    });

    it('should handle placeholder prop', () => {
      const placeholder = 'Enter your text here';
      render(<Input placeholder={placeholder} data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('placeholder', placeholder);
    });

    it('should handle value prop', () => {
      const value = 'Test value';
      render(<Input value={value} data-testid="input" readOnly />);
      const input = screen.getByTestId('input') as HTMLInputElement;
      expect(input.value).toBe(value);
    });

    it('should handle defaultValue prop', () => {
      const defaultValue = 'Default test value';
      render(<Input defaultValue={defaultValue} data-testid="input" />);
      const input = screen.getByTestId('input') as HTMLInputElement;
      expect(input.value).toBe(defaultValue);
    });

    it('should handle disabled state', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:pointer-events-none', 'disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('should handle readOnly prop', () => {
      render(<Input readOnly data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('readOnly');
    });

    it('should handle required prop', () => {
      render(<Input required data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('required');
    });
  });

  describe('Event Handling', () => {
    it('should handle onChange events', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      await user.type(input, 'test');
      
      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(4); // One for each character
    });

    it('should handle onFocus events', () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      fireEvent.focus(input);
      
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should handle onBlur events', () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      fireEvent.focus(input);
      fireEvent.blur(input);
      
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle onKeyDown events', () => {
      const handleKeyDown = jest.fn();
      render(<Input onKeyDown={handleKeyDown} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }));
    });
  });

  describe('Accessibility', () => {
    it('should support ARIA attributes', () => {
      render(
        <Input
          aria-label="Custom label"
          aria-describedby="description-id"
          aria-required="true"
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-label', 'Custom label');
      expect(input).toHaveAttribute('aria-describedby', 'description-id');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should support aria-invalid attribute', () => {
      render(<Input aria-invalid="true" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveClass('aria-invalid:ring-destructive/20', 'aria-invalid:border-destructive');
    });

    it('should be focusable', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    it('should not be focusable when disabled', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      
      input.focus();
      expect(document.activeElement).not.toBe(input);
    });
  });

  describe('Form Integration', () => {
    it('should work with form submission', () => {
      const handleSubmit = jest.fn(e => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Input name="testInput" defaultValue="test value" data-testid="input" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const form = document.querySelector('form');
      const input = screen.getByTestId('input');
      const submitButton = screen.getByText('Submit');
      
      expect(input).toHaveAttribute('name', 'testInput');
      
      fireEvent.click(submitButton);
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should handle form validation', () => {
      render(
        <form>
          <Input required pattern="[0-9]+" data-testid="input" />
        </form>
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('pattern', '[0-9]+');
    });
  });

  describe('File Input Styling', () => {
    it('should apply file input specific classes', () => {
      render(<Input type="file" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'file:text-foreground',
        'file:inline-flex',
        'file:h-7',
        'file:border-0',
        'file:bg-transparent',
        'file:text-sm',
        'file:font-medium'
      );
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive text sizing classes', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('text-base', 'md:text-sm');
    });
  });

  describe('State Styling', () => {
    it('should have correct disabled styling classes', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'disabled:pointer-events-none',
        'disabled:cursor-not-allowed',
        'disabled:opacity-50'
      );
    });

    it('should have transition classes', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('transition-[color,box-shadow]');
    });
  });

  describe('Min/Max Attributes', () => {
    it('should handle min and max for number inputs', () => {
      render(<Input type="number" min="0" max="100" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });

    it('should handle step for number inputs', () => {
      render(<Input type="number" step="0.1" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('step', '0.1');
    });
  });

  describe('Custom Data Attributes', () => {
    it('should accept custom data attributes', () => {
      render(
        <Input 
          data-custom="custom-value"
          data-test-attribute="test-value"
          data-testid="input" 
        />
      );
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('data-custom', 'custom-value');
      expect(input).toHaveAttribute('data-test-attribute', 'test-value');
    });
  });

  describe('Ref Handling', () => {
    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} data-testid="input" />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current).toBe(screen.getByTestId('input'));
    });

    it('should allow ref to access input methods', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} defaultValue="test" data-testid="input" />);
      
      expect(ref.current?.value).toBe('test');
      if (ref.current) {
        ref.current.focus();
        expect(document.activeElement).toBe(ref.current);
      }
    });
  });
});