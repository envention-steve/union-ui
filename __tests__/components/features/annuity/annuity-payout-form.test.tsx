import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnuityPayoutForm } from '@/components/features/annuity/annuity-payout-form';
import '@testing-library/jest-dom';

// Mock the subcomponents
jest.mock('@/components/features/annuity/person-form', () => ({
  PersonForm: ({ form }: { form: any }) => (
    <div data-testid="person-form">Person Form Component</div>
  ),
}));

jest.mock('@/components/features/annuity/company-form', () => ({
  CompanyForm: ({ form }: { form: any }) => (
    <div data-testid="company-form">Company Form Component</div>
  ),
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...rest }: any) => (
    <input
      type="checkbox"
      data-testid="checkbox"
      checked={!!checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      {...rest}
    />
  ),
}));

jest.mock('@/components/ui/select', () => {
  const React = require('react');

  const Select = ({ children, onValueChange, value, defaultValue, ...rest }: any) => (
    <select
      value={value ?? defaultValue ?? ''}
      onChange={(event) => onValueChange?.(event.target.value)}
      {...rest}
    >
      {children}
    </select>
  );

  const SelectTrigger = ({ children }: any) => <>{children}</>;
  const SelectValue = ({ placeholder }: any) => <option value="">{placeholder}</option>;
  const SelectContent = ({ children }: any) => <>{children}</>;
  const SelectItem = ({ children, value }: any) => <option value={value}>{children}</option>;

  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
  };
});

jest.mock('@/components/features/annuity/payout-calculator', () => ({
  PayoutCalculator: ({ formData, federalTaxType }: { formData: any; federalTaxType: string }) => (
    <div data-testid="payout-calculator">
      Payout Calculator - Tax Type: {federalTaxType}
    </div>
  ),
}));

describe('AnnuityPayoutForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields correctly', () => {
    render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);

    // Check main fields via accessible queries
    expect(screen.getByLabelText(/account number/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /annuity fee/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /federal tax rate/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /federal tax rate/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /federal tax amount/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /federal tax amount/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/1099 code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/check number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/check date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/annuity payout/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/posted date/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /allow overdraft/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /use member info/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/recipient type/i)).toBeInTheDocument();
  });

  it('displays PersonForm by default', () => {
    render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByTestId('person-form')).toBeInTheDocument();
    expect(screen.queryByTestId('company-form')).not.toBeInTheDocument();
  });

  it('switches to CompanyForm when recipient type is changed', async () => {
    const user = userEvent.setup();
    render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);

    // Find and click the recipient type dropdown
    const recipientTypeSelect = screen.getByLabelText(/recipient type/i);
    await user.selectOptions(recipientTypeSelect, 'company');

    await waitFor(() => {
      expect(screen.getByTestId('company-form')).toBeInTheDocument();
      expect(screen.queryByTestId('person-form')).not.toBeInTheDocument();
    });
  });

  it('handles federal tax type switching correctly', async () => {
    const user = userEvent.setup();
    render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);

    const federalTaxRateRadio = screen.getByRole('radio', { name: /federal tax rate/i });
    const federalTaxAmountRadio = screen.getByRole('radio', { name: /federal tax amount/i });

    const federalTaxRateInput = screen.getByRole('spinbutton', { name: /federal tax rate/i });
    const federalTaxAmountInput = screen.getByRole('spinbutton', { name: /federal tax amount/i });

    // Initially, rate should be selected and amount disabled
    expect(federalTaxRateRadio).toBeChecked();
    expect(federalTaxAmountRadio).not.toBeChecked();
    expect(federalTaxRateInput).toBeEnabled();
    expect(federalTaxAmountInput).toBeDisabled();

    // Switch to amount
    await user.click(federalTaxAmountRadio);

    expect(federalTaxAmountRadio).toBeChecked();
    expect(federalTaxRateRadio).not.toBeChecked();
    expect(federalTaxAmountInput).toBeEnabled();
    expect(federalTaxRateInput).toBeDisabled();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /Submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/account number is required/i)).toBeInTheDocument();
      expect(screen.getByText(/annuity payout is required/i)).toBeInTheDocument();
      expect(screen.getByText(/either federal tax rate or amount is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);

    // Fill required fields
    const accountNumberInput = screen.getByLabelText(/account number/i);
    const federalTaxRateInput = screen.getByRole('spinbutton', { name: /federal tax rate/i });
    const annuityPayoutInput = screen.getByLabelText(/annuity payout/i);

    await user.type(accountNumberInput, '123456');
    await user.type(federalTaxRateInput, '10');
    await user.type(annuityPayoutInput, '1000');

    const submitButton = screen.getByRole('button', { name: /Submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          accountNumber: '123456',
          federalTaxRate: '10',
          annuityPayout: '1000',
          checkDate: '2025-09-18T00:00:00.000Z',
          postedDate: '2025-09-18T00:00:00.000Z',
          recipientType: 'person',
        })
      );
    });
  });

  it('handles checkbox interactions correctly', async () => {
    const user = userEvent.setup();
    render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);

    const annuityFeeCheckbox = screen.getByRole('checkbox', { name: /annuity fee/i });
    const allowOverdraftCheckbox = screen.getByRole('checkbox', { name: /allow overdraft/i });
    const useMemberInfoCheckbox = screen.getByRole('checkbox', { name: /use member info/i });

    // Initially unchecked
    expect(annuityFeeCheckbox).not.toBeChecked();
    expect(allowOverdraftCheckbox).not.toBeChecked();
    expect(useMemberInfoCheckbox).not.toBeChecked();

    // Check all boxes
    await user.click(annuityFeeCheckbox);
    await user.click(allowOverdraftCheckbox);
    await user.click(useMemberInfoCheckbox);

    expect(annuityFeeCheckbox).toBeChecked();
    expect(allowOverdraftCheckbox).toBeChecked();
    expect(useMemberInfoCheckbox).toBeChecked();
  });

  it('validates federal tax requirement', async () => {
    const user = userEvent.setup();
    render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);

    // Fill other required fields but not federal tax
    await user.type(screen.getByLabelText(/account number/i), '123456');
    await user.type(screen.getByLabelText(/annuity payout/i), '1000');

    const submitButton = screen.getByRole('button', { name: /Submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/either federal tax rate or amount is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('renders payout calculator with correct props', () => {
    render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);
    
    const calculator = screen.getByTestId('payout-calculator');
    expect(calculator).toBeInTheDocument();
    expect(calculator).toHaveTextContent('Tax Type: rate');
  });

  it('applies custom className', () => {
    const customClass = 'custom-test-class';
    render(<AnnuityPayoutForm onSubmit={mockOnSubmit} className={customClass} />);
    
    const formContainer = document.querySelector('.custom-test-class');
    expect(formContainer).toBeInTheDocument();
  });

  it('handles numeric input validation', async () => {
    const user = userEvent.setup();
    render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);

    const federalTaxRateInput = screen.getByRole('spinbutton', { name: /federal tax rate/i });
    const annuityPayoutInput = screen.getByLabelText(/annuity payout/i);

    // Test negative values are handled
    await user.type(federalTaxRateInput, '-5');
    await user.type(annuityPayoutInput, '-100');

    // Values should be constrained by HTML input attributes
    expect(federalTaxRateInput).toHaveAttribute('min', '0');
    expect(annuityPayoutInput).toHaveAttribute('min', '0');
  });

  it('has proper accessibility attributes', () => {
    render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);

    // Check form labels are properly associated
    const accountNumberInput = screen.getByLabelText(/account number/i);
    const federalTaxRateInput = screen.getByRole('spinbutton', { name: /federal tax rate/i });

    expect(accountNumberInput).toHaveAttribute('placeholder', 'Enter account number');
    expect(federalTaxRateInput).toHaveAttribute('type', 'number');
  });
});
