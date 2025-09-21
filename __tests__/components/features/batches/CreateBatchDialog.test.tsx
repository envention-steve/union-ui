import React from 'react';
import { renderWithProviders, screen, waitFor } from '../../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { CreateBatchDialog } from '@/components/features/batches/CreateBatchDialog';
import { backendApiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/lib/api-client', () => ({
  backendApiClient: {
    accountContributions: {
      create: jest.fn(),
    },
  },
}));
jest.mock('sonner', () => ({
  toast: {
    promise: jest.fn(),
  },
}));
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the Toaster component to prevent environment-specific errors
jest.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster-mock" />,
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

const mockContributionTypes = [
  { value: 'SELF_PAY', label: 'Self Pay' },
  { value: 'HEALTH_FUND_BONUS', label: 'Health Fund Bonus' },
];

describe('CreateBatchDialog', () => {
  let props: any;
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    props = {
      isOpen: true,
      onOpenChange: jest.fn(),
      contributionTypes: mockContributionTypes,
    };
  });

  it('renders the dialog with all form fields', () => {
    renderWithProviders(<CreateBatchDialog {...props} />);
    expect(screen.getByText('Create Contribution Batch')).toBeInTheDocument();
    expect(screen.getByLabelText('Account Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Contribution Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
  });

  it('shows validation errors when submitting an empty form', async () => {
    renderWithProviders(<CreateBatchDialog {...props} />);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Account type is required.')).toBeInTheDocument();
    expect(await screen.findByText('Contribution type is required.')).toBeInTheDocument();
    expect(await screen.findByText('Start date is required.')).toBeInTheDocument();
    expect(await screen.findByText('End date is required.')).toBeInTheDocument();
  });

  it('calls the API and redirects on successful submission', async () => {
    const mockCreate = backendApiClient.accountContributions.create as jest.Mock;
    mockCreate.mockResolvedValue({ id: 'new-batch-123' });
    (toast.promise as jest.Mock).mockImplementation((promise, options) => {
      promise.then((result: any) => options.success(result));
      return promise;
    });

    renderWithProviders(<CreateBatchDialog {...props} />);

    // Fill out the form
    await user.click(screen.getByLabelText('Account Type'));
    await user.click(await screen.findByRole('option', { name: 'Health' }));

    await user.click(screen.getByLabelText('Contribution Type'));
    await user.click(await screen.findByRole('option', { name: 'Self Pay' }));

    await user.type(screen.getByLabelText('Start Date'), '2025-09-01');
    await user.type(screen.getByLabelText('End Date'), '2025-09-30');

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        account_type: 'HEALTH',
        contribution_type: 'SELF_PAY',
        start_date: '2025-09-01',
        end_date: '2025-09-30',
      }));
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/batches/account-contribution/new-batch-123/edit');
    });
  });

  it('displays an error toast on API failure', async () => {
    const errorMessage = 'Network Error';
    const mockCreate = backendApiClient.accountContributions.create as jest.Mock;
    mockCreate.mockRejectedValue(new Error(errorMessage));
    (toast.promise as jest.Mock).mockImplementation((promise, options) => {
      promise.catch((err: any) => options.error(err));
      return promise;
    });

    renderWithProviders(<CreateBatchDialog {...props} />);

    // Fill out the form with valid data
    await user.click(screen.getByLabelText('Account Type'));
    await user.click(await screen.findByRole('option', { name: 'Annuity' }));
    await user.click(screen.getByLabelText('Contribution Type'));
    await user.click(await screen.findByRole('option', { name: 'Health Fund Bonus' }));
    await user.type(screen.getByLabelText('Start Date'), '2025-10-01');
    await user.type(screen.getByLabelText('End Date'), '2025-10-31');

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(toast.promise).toHaveBeenCalled();
    });
  });
});
