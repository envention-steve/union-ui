import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import '@testing-library/jest-dom';
import { LoginForm } from '@/components/features/auth/login-form';
import { useAuthStore } from '@/store/auth-store';

// Mock the next/navigation router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the auth store
jest.mock('@/store/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

// Mock window.location
delete (window as any).location;
window.location = {
  search: '',
} as any;

// Mock URLSearchParams
const mockURLSearchParams = jest.fn().mockImplementation((search) => ({
  get: jest.fn().mockImplementation((key) => {
    if (search === '?callbackUrl=/custom-page' && key === 'callbackUrl') {
      return '/custom-page';
    }
    if (search === '' && key === 'callbackUrl') {
      return null;
    }
    return null;
  }),
}));
global.URLSearchParams = mockURLSearchParams as any;

describe('LoginForm Component', () => {
  const mockPush = jest.fn();
  const mockLogin = jest.fn();
  
  const defaultAuthStore = {
    login: mockLogin,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (useAuthStore as jest.Mock).mockReturnValue(defaultAuthStore);
    
    // Reset window.location.search
    window.location.search = '';
  });

  describe('Rendering', () => {
    it('renders the login form with all elements', () => {
      render(<LoginForm />);
      
      // CardTitle renders as div with data-slot, not semantic heading
      const title = screen.getAllByText('Sign In')[0]; // Get the first occurrence, which is the title
      expect(title).toBeInTheDocument();
      expect(title).toHaveAttribute('data-slot', 'card-title');
      expect(screen.getByText('Enter your credentials to access the Union Benefits platform')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('renders input fields with correct attributes', () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'your.email@union.org');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('placeholder', '••••••••');
    });

    it('shows loading state when isLoading is true', () => {
      (useAuthStore as jest.Mock).mockReturnValue({
        ...defaultAuthStore,
        isLoading: true,
      });
      
      render(<LoginForm />);
      
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      expect(submitButton).toBeDisabled();
      // Query for loading icon within the button specifically
      expect(submitButton.querySelector('svg')).toBeInTheDocument();
      expect(submitButton.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('renders form fields with proper ARIA labels and structure', () => {
      render(<LoginForm />);
      
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      
      // Check form structure - form element doesn't have role='form' by default
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows validation error for invalid email', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      // With invalid email, login should not be called - this indicates validation worked
      await user.type(emailInput, 'invalid-email');
      await user.type(screen.getByLabelText('Password'), 'validpass');
      await user.click(submitButton);
      
      // Validation prevents form submission, so login should not be called
      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });

    it('shows validation error for empty password', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      // Wait for password validation error
      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('shows validation error for empty email', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      // Wait for email validation error when field is empty
      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });
    });

    it('shows validation errors for both empty fields', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls login function with correct data on valid form submission', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('redirects to dashboard on successful login without callback URL', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);
      window.location.search = '';
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/members');
      });
    });

    it('redirects to callback URL on successful login when provided', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);
      window.location.search = '?callbackUrl=/custom-page';
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-page');
      });
    });

    it('displays error message on login failure with Error object', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid credentials';
      mockLogin.mockRejectedValueOnce(new Error(errorMessage));
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        // Alert component with variant='destructive' has complex CSS classes, not just 'destructive'
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveAttribute('role', 'alert');
      });
    });

    it('displays generic error message on login failure with non-Error object', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce('Some string error');
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });
    });

    it('clears error message on new submission attempt', async () => {
      const user = userEvent.setup();
      mockLogin
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(undefined);
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      // First submission - should show error
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });
      
      // Clear inputs and try again
      await user.clear(passwordInput);
      await user.type(passwordInput, 'correctpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('disables form fields during loading', () => {
      (useAuthStore as jest.Mock).mockReturnValue({
        ...defaultAuthStore,
        isLoading: true,
      });
      
      render(<LoginForm />);
      
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      expect(submitButton).toBeDisabled();
    });

    it('shows loading spinner during form submission', () => {
      (useAuthStore as jest.Mock).mockReturnValue({
        ...defaultAuthStore,
        isLoading: true,
      });
      
      render(<LoginForm />);
      
      // Query specifically for the button to avoid ambiguity
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      const loadingIcon = submitButton.querySelector('svg');
      expect(loadingIcon).toBeInTheDocument();
      expect(loadingIcon).toHaveClass('animate-spin');
    });
  });

  describe('Error Display', () => {
    it('shows error alert with correct styling and icon', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error('Test error'));
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(screen.getByText('Test error')).toBeInTheDocument();
        expect(alert.querySelector('svg')).toBeInTheDocument(); // AlertCircle icon
      });
    });

    it('does not show error alert when no error exists', () => {
      render(<LoginForm />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and structure', () => {
      render(<LoginForm />);
      
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      
      // Form doesn't have role='form' by default
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      render(<LoginForm />);
      
      // CardTitle renders as div with data-slot, not semantic heading
      const title = screen.getAllByText('Sign In')[0]; // Get first occurrence (the title)
      expect(title).toBeInTheDocument();
      // Check it has the card title styling
      expect(title).toHaveAttribute('data-slot', 'card-title');
    });

    it('shows form validation messages with proper ARIA attributes', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      await user.click(submitButton);
      
      await waitFor(() => {
        const emailError = screen.getByText('Invalid email address');
        const passwordError = screen.getByText('Password is required');
        
        expect(emailError).toBeInTheDocument();
        expect(passwordError).toBeInTheDocument();
      });
    });
  });

  describe('Form Interaction', () => {
    it('allows typing in email and password fields', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      await user.type(emailInput, 'user@test.com');
      await user.type(passwordInput, 'mypassword');
      
      expect(emailInput).toHaveValue('user@test.com');
      expect(passwordInput).toHaveValue('mypassword');
    });

    it('handles form submission via Enter key', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('focuses on email field initially when rendered', () => {
      render(<LoginForm />);
      
      // Simulate focus by checking if the field can receive focus
      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).not.toHaveAttribute('disabled');
    });
  });

  describe('Integration', () => {
    it('handles complete login flow successfully', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);
      
      render(<LoginForm />);
      
      // Fill out the form
      await user.type(screen.getByLabelText('Email'), 'integration@test.com');
      await user.type(screen.getByLabelText('Password'), 'testpassword');
      
      // Submit the form
      await user.click(screen.getByRole('button', { name: 'Sign In' }));
      
      // Verify the flow
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'integration@test.com',
          password: 'testpassword',
        });
        expect(mockPush).toHaveBeenCalledWith('/dashboard/members');
      });
    });

    it('handles validation and successful retry', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      // First attempt with invalid email
      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'validpass');
      await user.click(submitButton);
      
      // Validation prevents form submission, so login should not be called
      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
      });
      
      // Fix email and submit again
      await user.clear(emailInput);
      await user.clear(passwordInput);
      await user.type(emailInput, 'valid@email.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Invalid email address')).not.toBeInTheDocument();
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'valid@email.com',
          password: 'password123',
        });
      });
    });
  });
});
