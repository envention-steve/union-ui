import React from 'react';
import { fireEvent, renderWithProviders, screen, waitFor } from '../utils/test-utils';
import EmployerContributionPage from '@/app/dashboard/batches/employer-contribution/page';
import { backendApiClient } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  backendApiClient: {
    employerContributionBatches: {
      list: jest.fn(),
    },
  },
}));

jest.mock('@/components/features/batches/CreateEmployerContributionBatchDialog', () => ({
  CreateEmployerContributionBatchDialog: ({
    isOpen,
    onOpenChange,
  }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="create-employer-batch-dialog">
        <h1>Create Employer Batch</h1>
        <button type="button" onClick={() => onOpenChange(false)}>
          Cancel
        </button>
      </div>
    );
  },
}));

describe('EmployerContributionPage', () => {
  beforeEach(() => {
    (backendApiClient.employerContributionBatches.list as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
    });
    jest.clearAllMocks();
  });

  it('renders header and create button', async () => {
    renderWithProviders(<EmployerContributionPage />);
    await waitFor(() => {
      expect(screen.getByText('Employer Contributions')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Create Batch/i })).toBeInTheDocument();
  });

  it('opens the create dialog when clicking the button', async () => {
    renderWithProviders(<EmployerContributionPage />);

    fireEvent.click(screen.getByRole('button', { name: /Create Batch/i }));

    await waitFor(() => {
      expect(screen.getByTestId('create-employer-batch-dialog')).toBeInTheDocument();
    });
    expect(screen.getByText('Create Employer Batch')).toBeInTheDocument();
  });

  it('closes the create dialog from within the dialog', async () => {
    renderWithProviders(<EmployerContributionPage />);
    fireEvent.click(screen.getByRole('button', { name: /Create Batch/i }));

    await waitFor(() => {
      expect(screen.getByTestId('create-employer-batch-dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByTestId('create-employer-batch-dialog')).not.toBeInTheDocument();
    });
  });
});
