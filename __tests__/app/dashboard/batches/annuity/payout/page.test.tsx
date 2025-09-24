import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'sonner';

// Mock the toast function
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
  },
}));

// Use doMock inside a beforeEach so we can control initialization order
let mockAnnuityPayoutForm: jest.Mock;
beforeEach(() => {
  jest.resetModules();
  mockAnnuityPayoutForm = jest.fn(({ onSubmit }: { onSubmit: (data: unknown) => void }) => (
    <div data-testid="annuity-payout-form">
      <button 
        onClick={() => onSubmit({ distributionAmount: 1000 })}
        data-testid="mock-submit-button"
      >
        Mock Submit
      </button>
    </div>
  ));

  jest.doMock('@/components/features/annuity/annuity-payout-form', () => ({
    AnnuityPayoutForm: mockAnnuityPayoutForm,
  }));
});

// Import the page after setting up mocks
import AnnuityPayoutPage from '@/app/dashboard/batches/annuity/payout/page';

describe('AnnuityPayoutPage', () => {
  it('renders the page title correctly', () => {
    render(<AnnuityPayoutPage />);
    
    expect(screen.getByRole('heading', { name: /annuity payout/i })).toBeInTheDocument();
  });

  it('renders the page description', () => {
    render(<AnnuityPayoutPage />);
    
    expect(screen.getByText('Process annuity payments for members and companies')).toBeInTheDocument();
  });

  it('renders the AnnuityPayoutForm component', () => {
    render(<AnnuityPayoutPage />);
    
    expect(screen.getByTestId('annuity-payout-form')).toBeInTheDocument();
  });

  it('handles form submission correctly', () => {
  // toast is imported
    
    render(<AnnuityPayoutPage />);
    
    const submitButton = screen.getByTestId('mock-submit-button');
    submitButton.click();
    
    expect(toast.success).toHaveBeenCalledWith(
      'Annuity payout submitted successfully!',
      expect.objectContaining({
        description: expect.stringContaining('$1,000.00'),
      })
    );
  });

  it('logs form data to console on submission', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<AnnuityPayoutPage />);
    
    const submitButton = screen.getByTestId('mock-submit-button');
    submitButton.click();
    
    expect(consoleSpy).toHaveBeenCalledWith('Submitting annuity payout:', { distributionAmount: 1000 });
    
    consoleSpy.mockRestore();
  });

  it('has proper page structure', () => {
    render(<AnnuityPayoutPage />);
    
    // Check that the page has the expected layout structure
    const pageContainer = screen.getByRole('heading', { name: /annuity payout/i }).closest('div');
    expect(pageContainer).toHaveClass('space-y-6');
  });

  it('formats currency correctly in toast message', () => {
  // toast is imported
    
    render(<AnnuityPayoutPage />);
    
    const submitButton = screen.getByTestId('mock-submit-button');
    submitButton.click();
    
    expect(toast.success).toHaveBeenCalledWith(
      'Annuity payout submitted successfully!',
      expect.objectContaining({
        description: 'Distribution amount: $1,000.00',
      })
    );
  });

  it('handles zero distribution amount', () => {
    // Update the mock to return 0
    jest.clearAllMocks();
    
  mockAnnuityPayoutForm.mockImplementation(({ onSubmit }: { onSubmit: (data: unknown) => void }) => (
      <div data-testid="annuity-payout-form">
        <button
          onClick={() => onSubmit({ distributionAmount: 0 })}
          data-testid="mock-submit-button-zero"
        >
          Mock Submit Zero
        </button>
      </div>
    ));
    
  // toast is imported
    
    render(<AnnuityPayoutPage />);
    
    const submitButton = screen.getByTestId('mock-submit-button-zero');
    submitButton.click();
    
    expect(toast.success).toHaveBeenCalledWith(
      'Annuity payout submitted successfully!',
      expect.objectContaining({
        description: 'Distribution amount: $0.00',
      })
    );
  });

  it('handles undefined distribution amount gracefully', () => {
    // Update the mock to return undefined distribution amount
    jest.clearAllMocks();
    
  mockAnnuityPayoutForm.mockImplementation(({ onSubmit }: { onSubmit: (data: unknown) => void }) => (
      <div data-testid="annuity-payout-form">
        <button 
          onClick={() => onSubmit({})}
          data-testid="mock-submit-button-undefined"
        >
          Mock Submit Undefined
        </button>
      </div>
    ));
    
  // toast is imported
    
    render(<AnnuityPayoutPage />);
    
    const submitButton = screen.getByTestId('mock-submit-button-undefined');
    submitButton.click();
    
    expect(toast.success).toHaveBeenCalledWith(
      'Annuity payout submitted successfully!',
      expect.objectContaining({
        description: 'Distribution amount: $0.00',
      })
    );
  });

  it('uses client directive', () => {
    // This test ensures the component is marked as a client component
    // by checking that it can render without server-side issues
    expect(() => render(<AnnuityPayoutPage />)).not.toThrow();
  });
});