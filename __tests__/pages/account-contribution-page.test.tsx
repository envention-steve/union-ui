import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor } from '../utils/test-utils';
import AccountContributionPage from '@/app/dashboard/batches/account-contribution/page';
import { backendApiClient } from '@/lib/api-client';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  backendApiClient: {
    accountContributions: {
      list: jest.fn(),
      create: jest.fn(), // Also mock create as it's used by the dialog
    },
  },
}));

// Mock the dialog component to avoid testing its implementation details here
jest.mock('@/components/features/batches/CreateBatchDialog', () => ({
  CreateBatchDialog: ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (isOpen: boolean) => void }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="create-batch-dialog">
        <h1>Create Contribution Batch</h1>
        <button onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    );
  },
}));

describe('AccountContributionPage', () => {
  beforeEach(() => {
    (backendApiClient.accountContributions.list as jest.Mock).mockResolvedValue({ 
      items: [], 
      total: 0 
    });
    jest.clearAllMocks();
  });

  it('renders the page and the "Create Batch" button', async () => {
    renderWithProviders(<AccountContributionPage />);
    await waitFor(() => {
        expect(screen.getByText('Account Contributions')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Create Batch/i })).toBeInTheDocument();
  });

  it('opens the CreateBatchDialog when the "Create Batch" button is clicked', async () => {
    renderWithProviders(<AccountContributionPage />);
    
    // Ensure the dialog is not visible initially
    expect(screen.queryByTestId('create-batch-dialog')).not.toBeInTheDocument();

    // Click the create button
    const createButton = screen.getByRole('button', { name: /Create Batch/i });
    fireEvent.click(createButton);

    // The dialog should now be visible
    await waitFor(() => {
        expect(screen.getByTestId('create-batch-dialog')).toBeInTheDocument();
    });
    expect(screen.getByText('Create Contribution Batch')).toBeInTheDocument();
  });

  it('closes the dialog when the cancel action is triggered from within the dialog', async () => {
    renderWithProviders(<AccountContributionPage />);

    // Open the dialog
    fireEvent.click(screen.getByRole('button', { name: /Create Batch/i }));
    await waitFor(() => {
        expect(screen.getByTestId('create-batch-dialog')).toBeInTheDocument();
    });

    // Simulate closing the dialog (e.g., by clicking a cancel button inside the mock)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // The dialog should be gone
    await waitFor(() => {
        expect(screen.queryByTestId('create-batch-dialog')).not.toBeInTheDocument();
    });
  });
});
