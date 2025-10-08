/**
 * Integration test to verify that recipient sections are hidden when "Use Member Info" is checked
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnuityPayoutForm } from '@/components/features/annuity/annuity-payout-form';

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

describe('AnnuityPayoutForm - Use Member Info Behavior', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows recipient type and person form by default', async () => {
    await act(async () => {
      render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);
    });

    // Should show recipient type selection
    expect(screen.getByText('Recipient Type')).toBeInTheDocument();

    // Should show person form by default (since recipientType defaults to 'person')
    expect(screen.getByText('Person Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
  });

  it('hides recipient type and person form when "Use Member Info" is checked', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);
    });

    // Verify initial state - recipient sections should be visible
    expect(screen.getByText('Recipient Type')).toBeInTheDocument();
    expect(screen.getByText('Person Information')).toBeInTheDocument();

    // Check the "Use Member Info" checkbox
    const useMemberInfoCheckbox = screen.getByLabelText(/use member info/i);
    await user.click(useMemberInfoCheckbox);

    // Verify that recipient sections are now hidden
    expect(screen.queryByText('Recipient Type')).not.toBeInTheDocument();
    expect(screen.queryByText('Select recipient type')).not.toBeInTheDocument();
    expect(screen.queryByText('Person Information')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/last name/i)).not.toBeInTheDocument();
  });

  it('shows company form when recipient type is company and "Use Member Info" is unchecked', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);
    });

    // Change recipient type to company
    const recipientTypeSelect = screen.getByLabelText(/recipient type/i);
    await user.selectOptions(recipientTypeSelect, 'company');

    // Should now show company form
    await screen.findByText('Company Information');
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact name/i)).toBeInTheDocument();
  });

  it('hides company form when "Use Member Info" is checked', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);
    });

    // Change recipient type to company first
    const recipientTypeSelect = screen.getByLabelText(/recipient type/i);
    await user.selectOptions(recipientTypeSelect, 'company');

    // Verify company form is visible
    await screen.findByText('Company Information');

    // Check the "Use Member Info" checkbox
    const useMemberInfoCheckbox = screen.getByLabelText(/use member info/i);
    await user.click(useMemberInfoCheckbox);

    // Verify that company form is now hidden
    expect(screen.queryByText('Company Information')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/company name/i)).not.toBeInTheDocument();
  });

  it('re-shows recipient sections when "Use Member Info" is unchecked', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);
    });

    // Check "Use Member Info" to hide sections
    const useMemberInfoCheckbox = screen.getByLabelText(/use member info/i);
    await user.click(useMemberInfoCheckbox);

    // Verify sections are hidden
    expect(screen.queryByText('Recipient Type')).not.toBeInTheDocument();
    expect(screen.queryByText('Person Information')).not.toBeInTheDocument();

    // Uncheck "Use Member Info"
    await user.click(useMemberInfoCheckbox);

    // Verify sections are visible again
    await screen.findByText('Recipient Type');
    expect(screen.getByText('Person Information')).toBeInTheDocument();
  });

  it('always shows other form fields regardless of "Use Member Info" state', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<AnnuityPayoutForm onSubmit={mockOnSubmit} />);
    });

    // Verify core fields are visible initially
    expect(screen.getByLabelText(/account number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/annuity payout/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /allow overdraft/i })).toBeInTheDocument();

    // Check "Use Member Info"
    const useMemberInfoCheckbox = screen.getByLabelText(/use member info/i);
    await user.click(useMemberInfoCheckbox);

    // Verify core fields are still visible
    expect(screen.getByLabelText(/account number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/annuity payout/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /allow overdraft/i })).toBeInTheDocument();
  });
});
