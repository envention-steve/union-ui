/**
 * Integration test for the Annuity Payout tab in the Member detail page
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the AnnuityPayoutForm component
jest.mock('@/components/features/annuity/annuity-payout-form', () => ({
  AnnuityPayoutForm: ({ onSubmit, className }: { onSubmit: () => void; className?: string }) => (
    <div data-testid="annuity-payout-form" className={className}>
      <h2>Annuity Payout Form</h2>
      <button onClick={() => onSubmit()}>Submit Form</button>
    </div>
  ),
}));

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => 'view'),
  }),
}));

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  backendApiClient: {
    members: {
      getDetails: jest.fn(() => 
        Promise.resolve({
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          unique_id: 'JD001',
          fund_balances: {
            health_account_id: 1,
            annuity_account_id: 2,
            health_balance: 5000.00,
            annuity_balance: 10000.00,
            last_updated: '2025-01-18T00:00:00.000Z',
          },
          addresses: [],
          phone_numbers: [],
          email_addresses: [],
          distribution_class_coverages: [],
          member_status_coverages: [],
          life_insurance_coverages: [],
          dependent_coverages: [],
          employer_coverages: [],
          insurance_plan_coverages: [],
          member_notes: [],
        })
      ),
    },
    distributionClasses: {
      list: jest.fn(() => Promise.resolve([])),
    },
    memberStatuses: {
      list: jest.fn(() => Promise.resolve([])),
    },
    insurancePlans: {
      list: jest.fn(() => Promise.resolve({ items: [] })),
    },
    claimTypes: {
      list: jest.fn(() => Promise.resolve([])),
    },
    ledgerEntries: {
      getTypes: jest.fn(() => Promise.resolve([])),
    },
  },
}));

// Import the component after mocking
import MemberDetailPage from '@/app/dashboard/members/[id]/page';

describe('Member Detail Page - Annuity Payout Tab Integration', () => {
  const mockParams = Promise.resolve({ id: '1' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the annuity payout tab in the navigation', async () => {
    await act(async () => {
      render(<MemberDetailPage params={mockParams} />);
    });

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Member Management')).toBeInTheDocument();
    });

    // Check that the Annuity Payout tab is present
    expect(screen.getByText('Annuity Payout')).toBeInTheDocument();
  });

  it('displays annuity payout form when tab is clicked', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<MemberDetailPage params={mockParams} />);
    });

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Member Management')).toBeInTheDocument();
    });

    // Click the Annuity Payout tab
    const annuityPayoutTab = screen.getByText('Annuity Payout');
    await user.click(annuityPayoutTab);

    // Verify that the form is displayed
    await waitFor(() => {
      expect(screen.getByTestId('annuity-payout-form')).toBeInTheDocument();
    });

    expect(screen.getByText('Annuity Payout Form')).toBeInTheDocument();
  });

  it('displays annuity account balance when on annuity payout tab', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<MemberDetailPage params={mockParams} />);
    });

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Member Management')).toBeInTheDocument();
    });

    // Click the Annuity Payout tab
    const annuityPayoutTab = screen.getByText('Annuity Payout');
    await user.click(annuityPayoutTab);

    // Verify that the annuity balance is displayed
    await waitFor(() => {
      expect(screen.getByText('Annuity Account Balance')).toBeInTheDocument();
      expect(screen.getByText('$10,000.00')).toBeInTheDocument();
      expect(screen.getByText(/Available for payout as of/)).toBeInTheDocument();
    });
  });

  it('handles form submission correctly', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<MemberDetailPage params={mockParams} />);
    });

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Member Management')).toBeInTheDocument();
    });

    // Click the Annuity Payout tab
    const annuityPayoutTab = screen.getByText('Annuity Payout');
    await user.click(annuityPayoutTab);

    // Wait for form to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('annuity-payout-form')).toBeInTheDocument();
    });

    // Click the submit button in the mocked form
    const submitButton = screen.getByText('Submit Form');
    await user.click(submitButton);

    // Verify that success message is shown
    await waitFor(() => {
      expect(screen.getByText('Annuity payout form has been successfully submitted!')).toBeInTheDocument();
    });
  });
});
