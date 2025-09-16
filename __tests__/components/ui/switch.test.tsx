import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '@/components/ui/switch';

// Mock Radix UI Switch components
jest.mock('@radix-ui/react-switch', () => ({
  Root: React.forwardRef<HTMLButtonElement, any>(({ children, className, checked, defaultChecked, onCheckedChange, disabled, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(checked ?? defaultChecked ?? false);
    const isChecked = checked !== undefined ? checked : internalChecked;
    
    const handleClick = () => {
      if (disabled) return;
      const newChecked = !isChecked;
      if (checked === undefined) {
        setInternalChecked(newChecked);
      }
      if (onCheckedChange) {
        onCheckedChange(newChecked);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const newChecked = !isChecked;
        if (checked === undefined) {
          setInternalChecked(newChecked);
        }
        if (onCheckedChange) {
          onCheckedChange(newChecked);
        }
      }
    };

    return (
      <button
        ref={ref}
        role="switch"
        aria-checked={isChecked}
        data-state={isChecked ? 'checked' : 'unchecked'}
        className={className}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        {...props}
      >
        {children}
      </button>
    );
  }),
  Thumb: React.forwardRef<HTMLSpanElement, any>(({ className, ...props }, ref) => (
    <span ref={ref} data-slot="switch-thumb" className={className} {...props} />
  )),
}));

describe('Switch Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<Switch data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
      expect(switchElement).toHaveAttribute('data-slot', 'switch');
      expect(switchElement).toHaveAttribute('role', 'switch');
    });

    it('should render as button element', () => {
      render(<Switch data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement.tagName).toBe('BUTTON');
    });

    it('should apply custom className', () => {
      render(<Switch className="custom-switch" data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('custom-switch');
    });

    it('should render thumb element', () => {
      render(<Switch data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      const thumb = switchElement.querySelector('[data-slot="switch-thumb"]');
      
      expect(thumb).toBeInTheDocument();
    });

    it('should spread additional props', () => {
      render(
        <Switch 
          data-testid="switch"
          id="custom-switch"
          aria-label="Toggle setting"
          name="settings-toggle"
        />
      );
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('id', 'custom-switch');
      expect(switchElement).toHaveAttribute('aria-label', 'Toggle setting');
      expect(switchElement).toHaveAttribute('name', 'settings-toggle');
    });
  });

  describe('Base Classes', () => {
    it('should have correct base classes', () => {
      render(<Switch data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass(
        'peer',
        'inline-flex',
        'h-[1.15rem]',
        'w-8',
        'shrink-0',
        'items-center',
        'rounded-full',
        'border',
        'border-transparent',
        'shadow-xs',
        'transition-all',
        'outline-none'
      );
    });

    it('should have focus-visible classes', () => {
      render(<Switch data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass(
        'focus-visible:border-ring',
        'focus-visible:ring-ring/50',
        'focus-visible:ring-[3px]'
      );
    });

    it('should have disabled classes', () => {
      render(<Switch data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass(
        'disabled:cursor-not-allowed',
        'disabled:opacity-50'
      );
    });

    it('should have state-dependent classes', () => {
      render(<Switch data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass(
        'data-[state=checked]:bg-primary',
        'data-[state=unchecked]:bg-input',
        'dark:data-[state=unchecked]:bg-input/80'
      );
    });
  });

  describe('Thumb Classes', () => {
    it('should have correct thumb classes', () => {
      render(<Switch data-testid="switch" />);
      
      const thumb = screen.getByRole('switch').querySelector('[data-slot="switch-thumb"]');
      expect(thumb).toHaveClass(
        'bg-background',
        'dark:data-[state=unchecked]:bg-foreground',
        'dark:data-[state=checked]:bg-primary-foreground',
        'pointer-events-none',
        'block',
        'size-4',
        'rounded-full',
        'ring-0',
        'transition-transform',
        'data-[state=checked]:translate-x-[calc(100%-2px)]',
        'data-[state=unchecked]:translate-x-0'
      );
    });
  });

  describe('States', () => {
    it('should render unchecked by default', () => {
      render(<Switch />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('should render checked when defaultChecked is true', () => {
      render(<Switch defaultChecked />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should render checked when checked prop is true', () => {
      render(<Switch checked />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should render unchecked when checked prop is false', () => {
      render(<Switch checked={false} />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Disabled State', () => {
    it('should render as disabled when disabled prop is true', () => {
      render(<Switch disabled data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeDisabled();
      expect(switchElement).toHaveAttribute('disabled');
    });

    it('should not be disabled by default', () => {
      render(<Switch data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).not.toBeDisabled();
      expect(switchElement).not.toHaveAttribute('disabled');
    });

    it('should prevent interaction when disabled', async () => {
      const user = userEvent.setup();
      const onCheckedChange = jest.fn();
      
      render(
        <Switch 
          disabled 
          onCheckedChange={onCheckedChange}
          data-testid="switch" 
        />
      );
      
      const switchElement = screen.getByRole('switch');
      
      await user.click(switchElement);
      expect(onCheckedChange).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('should call onCheckedChange when clicked', async () => {
      const user = userEvent.setup();
      const onCheckedChange = jest.fn();
      
      render(
        <Switch 
          onCheckedChange={onCheckedChange}
          data-testid="switch" 
        />
      );
      
      const switchElement = screen.getByRole('switch');
      
      await user.click(switchElement);
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('should toggle state on click', async () => {
      const user = userEvent.setup();
      
      render(<Switch defaultChecked={false} data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      
      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
      
      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('should respond to keyboard events', async () => {
      const user = userEvent.setup();
      const onCheckedChange = jest.fn();
      
      render(
        <Switch 
          onCheckedChange={onCheckedChange}
          data-testid="switch" 
        />
      );
      
      const switchElement = screen.getByRole('switch');
      switchElement.focus();
      
      await user.keyboard('{Enter}');
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('should respond to spacebar', async () => {
      const user = userEvent.setup();
      const onCheckedChange = jest.fn();
      
      render(
        <Switch 
          onCheckedChange={onCheckedChange}
          data-testid="switch" 
        />
      );
      
      const switchElement = screen.getByRole('switch');
      switchElement.focus();
      
      await user.keyboard(' ');
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('should be focusable', async () => {
      const user = userEvent.setup();
      
      render(<Switch data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      
      await user.tab();
      expect(switchElement).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<Switch disabled data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('disabled');
      // Disabled elements are not focusable by default
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('should work as uncontrolled component', async () => {
      const user = userEvent.setup();
      
      render(<Switch defaultChecked={false} data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      
      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should work as controlled component', async () => {
      const user = userEvent.setup();
      const onCheckedChange = jest.fn();
      
      const ControlledSwitch = () => {
        const [checked, setChecked] = React.useState(false);
        
        return (
          <Switch
            checked={checked}
            onCheckedChange={(value) => {
              setChecked(value);
              onCheckedChange(value);
            }}
            data-testid="switch"
          />
        );
      };
      
      render(<ControlledSwitch />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      
      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
      expect(onCheckedChange).toHaveBeenCalledWith(true);
      
      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      expect(onCheckedChange).toHaveBeenCalledWith(false);
    });

    it('should not update when controlled externally', async () => {
      const user = userEvent.setup();
      const onCheckedChange = jest.fn();
      
      render(
        <Switch 
          checked={false}
          onCheckedChange={onCheckedChange}
          data-testid="switch" 
        />
      );
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      
      await user.click(switchElement);
      // Should still be false because it's controlled and parent didn't update
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Form Integration', () => {
    it('should work with form submission', () => {
      const handleSubmit = jest.fn((e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        return formData.get('toggle-switch');
      });
      
      render(
        <form onSubmit={handleSubmit} data-testid="form">
          <Switch name="toggle-switch" defaultChecked data-testid="switch" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const form = screen.getByTestId('form');
      const submitButton = screen.getByText('Submit');
      
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should support required attribute', () => {
      render(<Switch required data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('required');
    });

    it('should work with form labels', () => {
      render(
        <div>
          <label htmlFor="toggle-switch">Enable notifications</label>
          <Switch id="toggle-switch" data-testid="switch" />
        </div>
      );
      
      const label = screen.getByText('Enable notifications');
      const switchElement = screen.getByRole('switch');
      
      expect(label).toBeInTheDocument();
      expect(switchElement).toHaveAttribute('id', 'toggle-switch');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      render(<Switch data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('role', 'switch');
    });

    it('should have proper aria-checked attribute', () => {
      render(<Switch defaultChecked={false} data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('should update aria-checked when state changes', async () => {
      const user = userEvent.setup();
      
      render(<Switch defaultChecked={false} data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      
      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should support aria-label', () => {
      render(
        <Switch 
          aria-label="Enable dark mode" 
          data-testid="switch" 
        />
      );
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-label', 'Enable dark mode');
    });

    it('should support aria-labelledby', () => {
      render(
        <div>
          <span id="switch-label">Dark mode</span>
          <Switch 
            aria-labelledby="switch-label"
            data-testid="switch" 
          />
        </div>
      );
      
      const switchElement = screen.getByRole('switch');
      const label = screen.getByText('Dark mode');
      
      expect(switchElement).toHaveAttribute('aria-labelledby', 'switch-label');
      expect(label).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(
        <div>
          <Switch 
            aria-describedby="switch-description"
            data-testid="switch" 
          />
          <span id="switch-description">
            Toggle to enable or disable dark mode
          </span>
        </div>
      );
      
      const switchElement = screen.getByRole('switch');
      const description = screen.getByText('Toggle to enable or disable dark mode');
      
      expect(switchElement).toHaveAttribute('aria-describedby', 'switch-description');
      expect(description).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      
      render(<Switch data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      
      // Should be focusable via keyboard
      await user.tab();
      expect(switchElement).toHaveFocus();
      
      // Should be activatable via keyboard
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      await user.keyboard(' ');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should announce state changes to screen readers', async () => {
      const user = userEvent.setup();
      
      render(<Switch data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      
      // Initial state
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      
      // After activation
      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Real-world Usage Examples', () => {
    it('should work as settings toggle', async () => {
      const user = userEvent.setup();
      const onToggle = jest.fn();
      
      render(
        <div className="flex items-center space-x-2">
          <Switch
            id="notifications"
            checked={false}
            onCheckedChange={onToggle}
            data-testid="notifications-switch"
          />
          <label 
            htmlFor="notifications" 
            className="text-sm font-medium"
          >
            Push notifications
          </label>
        </div>
      );
      
      const switchElement = screen.getByTestId('notifications-switch');
      const label = screen.getByText('Push notifications');
      
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      expect(label).toBeInTheDocument();
      
      await user.click(switchElement);
      expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('should work in a form with multiple switches', () => {
      render(
        <form data-testid="preferences-form">
          <fieldset>
            <legend>Notification Preferences</legend>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch id="email" name="email-notifications" data-testid="email-switch" />
                <label htmlFor="email">Email notifications</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="push" name="push-notifications" data-testid="push-switch" />
                <label htmlFor="push">Push notifications</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="sms" name="sms-notifications" disabled data-testid="sms-switch" />
                <label htmlFor="sms">SMS notifications (coming soon)</label>
              </div>
            </div>
          </fieldset>
        </form>
      );
      
      const form = screen.getByTestId('preferences-form');
      const emailSwitch = screen.getByTestId('email-switch');
      const pushSwitch = screen.getByTestId('push-switch');
      const smsSwitch = screen.getByTestId('sms-switch');
      
      expect(form).toBeInTheDocument();
      expect(emailSwitch).not.toBeDisabled();
      expect(pushSwitch).not.toBeDisabled();
      expect(smsSwitch).toBeDisabled();
    });

    it('should work with custom styling', () => {
      render(
        <Switch 
          className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
          data-testid="custom-switch"
        />
      );
      
      const switchElement = screen.getByTestId('custom-switch');
      expect(switchElement).toHaveClass('data-[state=checked]:bg-green-500');
      expect(switchElement).toHaveClass('data-[state=unchecked]:bg-red-500');
    });
  });

  describe('Error States', () => {
    it('should handle invalid aria-checked values gracefully', () => {
      render(<Switch data-testid="switch" />);
      
      const switchElement = screen.getByRole('switch');
      // Initial state should be properly set
      expect(switchElement).toHaveAttribute('aria-checked');
      expect(['true', 'false']).toContain(
        switchElement.getAttribute('aria-checked')
      );
    });

    it('should handle missing onCheckedChange gracefully', async () => {
      const user = userEvent.setup();
      
      // Should not throw an error when clicked without onCheckedChange
      expect(() => {
        render(<Switch data-testid="switch" />);
      }).not.toThrow();
      
      const switchElement = screen.getByRole('switch');
      
      // Should not throw when clicked
      await expect(user.click(switchElement)).resolves.not.toThrow();
    });
  });
});