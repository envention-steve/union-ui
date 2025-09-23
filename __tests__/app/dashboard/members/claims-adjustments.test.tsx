import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberDetailPage from '@/app/dashboard/members/[id]/page';
import { backendApiClient } from '@/lib/api-client';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  backendApiClient: {
    members: {
      getDetails: jest.fn(),
      getLedgerEntries: jest.fn(),
      createClaim: jest.fn(),
      createManualAdjustment: jest.fn(),
    },
    claimTypes: {
      list: jest.fn(),
    },
    distributionClasses: {
      list: jest.fn(),
    },
    memberStatuses: {
      list: jest.fn(),
    },
    insurancePlans: {
      list: jest.fn(),
    },
    ledgerEntries: {
      getTypes: jest.fn(),
    },
  },
}));

// Mock Next.js router
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

// Mock the params promise
const mockParams = Promise.resolve({ id: '123' });

describe('Claims/Adjustments Tab', () => {
  const mockMemberData = {
    id: 123,
    first_name: 'John',
    last_name: 'Doe',
    unique_id: 'MEM123',
    addresses: [],
    phoneNumbers: [],
    emailAddresses: [],
    distribution_class_coverages: [],
    member_status_coverages: [],
    life_insurance_coverages: [],
    dependent_coverages: [],
    employer_coverages: [],
    insurance_plan_coverages: [],
    member_notes: [],
  };

    // Use strings for claim types to match SelectItem children
    const mockClaimTypes = [
      'Medical',
      'Dental',
    ];

    // Mock fund/account options matching component expectations
    const mockFundBalances = {
      health_account_id: 1,
      annuity_account_id: 2,
      health_balance: 5000.00,
      annuity_balance: 15000.00,
      last_updated: new Date().toISOString(),
    };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // add missing namespaces used by component
    (backendApiClient as any).claims = { create: jest.fn() };
    (backendApiClient as any).manualAdjustments = { create: jest.fn() };

    (backendApiClient.claimTypes.list as jest.Mock).mockResolvedValue(mockClaimTypes);
    (backendApiClient.members.getDetails as jest.Mock).mockResolvedValue({
      ...mockMemberData,
      fund_balances: mockFundBalances,
    });
    (backendApiClient.claimTypes.list as jest.Mock).mockResolvedValue(mockClaimTypes);
    (backendApiClient.distributionClasses.list as jest.Mock).mockResolvedValue([]);
    (backendApiClient.memberStatuses.list as jest.Mock).mockResolvedValue([]);
    (backendApiClient.insurancePlans.list as jest.Mock).mockResolvedValue({ items: [] });
    (backendApiClient.ledgerEntries.getTypes as jest.Mock).mockResolvedValue([]);
    (backendApiClient.members.getLedgerEntries as jest.Mock).mockResolvedValue({ items: [], total: 0 });
  });

  test('should render Claims/Adjustments tab with both forms', async () => {
  await act(async () => render(<MemberDetailPage params={mockParams} />));

    // Wait for component to load (name text may be split by elements)
    await waitFor(() => {
      expect(screen.getByText(/John\s+Doe/)).toBeInTheDocument();
    });

    // Click on Claims/Adjustments tab
    const claimsAdjustmentsTab = screen.getByText('Claims/Adjustments');
    fireEvent.click(claimsAdjustmentsTab);
    // Wait for tab content to load
    await waitFor(() => {
      expect(screen.getByText('Claim')).toBeInTheDocument();
      expect(screen.getByText('Manual Adjustment')).toBeInTheDocument();
    });

    // Check for form fields
    expect(screen.getByText('Claim Type:')).toBeInTheDocument();
    expect(screen.getByText('Claim Amount')).toBeInTheDocument();
  expect(screen.getByText('Account:')).toBeInTheDocument();
    expect(screen.getByText('Adjustment Amount')).toBeInTheDocument();

  // Debug: log claimTypes and fund_balances
  // eslint-disable-next-line no-console
  console.log('DEBUG claimTypes', (backendApiClient.claimTypes.list as jest.Mock).mock.calls);
  // eslint-disable-next-line no-console
  console.log('DEBUG fund_balances', (backendApiClient.members.getDetails as jest.Mock).mock.calls);

      // Check that claim type select renders string values, not objects
      fireEvent.click(screen.getByText('Select claim type'));
      await waitFor(() => {
        expect(screen.getByText('Medical')).toBeInTheDocument();
        expect(typeof screen.getByText('Medical').textContent).toBe('string');
      });
  });

  test('should show validation message when submitting claim without required fields', async () => {
  await act(async () => render(<MemberDetailPage params={mockParams} />));

    await waitFor(() => {
      expect(screen.getByText(/John\s+Doe/)).toBeInTheDocument();
    });

    // Click on Claims/Adjustments tab
    const claimsAdjustmentsTab = screen.getByText('Claims/Adjustments');
    fireEvent.click(claimsAdjustmentsTab);

    // Try to submit claim without filling required fields
    const createClaimButton = screen.getByText('Create Claim');
    expect(createClaimButton).toBeDisabled(); // Should be disabled when no required fields are filled
  });

  test('should enable create claim button when required fields are filled', async () => {
  await act(async () => render(<MemberDetailPage params={mockParams} />));

    await waitFor(() => {
      expect(screen.getByText(/John\s+Doe/)).toBeInTheDocument();
    });

    // Click on Claims/Adjustments tab
    const claimsAdjustmentsTab = screen.getByText('Claims/Adjustments');
    fireEvent.click(claimsAdjustmentsTab);

    // Wait for claim types to load and form to be ready
    await waitFor(() => {
      expect(screen.getByText('Select claim type')).toBeInTheDocument();
    });

    // Select claim type (this should enable the dropdown)
    const claimTypeSelect = screen.getByText('Select claim type');
    fireEvent.click(claimTypeSelect);
    
    // Wait for options to appear and select one
    await waitFor(() => {
      expect(screen.getByText('Medical')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Medical'));

      // Fill in claim amount
      const claimAmountInputs = screen.getAllByPlaceholderText('0.00');
      fireEvent.change(claimAmountInputs[0], { target: { value: '100.00' } });

    // Now the create claim button should be enabled
    const createClaimButton = screen.getByText('Create Claim');
    expect(createClaimButton).not.toBeDisabled();
  });

  test('should show fund options for manual adjustment', async () => {
  await act(async () => render(<MemberDetailPage params={mockParams} />));

    await waitFor(() => {
      expect(screen.getByText(/John\s+Doe/)).toBeInTheDocument();
    });

    // Click on Claims/Adjustments tab
    const claimsAdjustmentsTab = screen.getByText('Claims/Adjustments');
    fireEvent.click(claimsAdjustmentsTab);
    // Wait for tab content to load
    await waitFor(() => {
      expect(screen.getByText('Manual Adjustment')).toBeInTheDocument();
    });
    // Click on fund dropdown
    const fundSelect = screen.getByText('Select account');
    fireEvent.click(fundSelect);
    // Wait for fund options to appear
    await waitFor(() => {
      expect(screen.getByText('Health Account')).toBeInTheDocument();
      expect(screen.getByText('Annuity Account')).toBeInTheDocument();
    });
  });

  test('should call createClaim API when claim form is submitted', async () => {
    const mockCreateClaim = (backendApiClient.claims.create as unknown) as jest.Mock;
    mockCreateClaim.mockResolvedValue({ success: true });

  await act(async () => render(<MemberDetailPage params={mockParams} />));

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on Claims/Adjustments tab
    const claimsAdjustmentsTab = screen.getByText('Claims/Adjustments');
    fireEvent.click(claimsAdjustmentsTab);
    // Wait for tab content to load
    await waitFor(() => {
      expect(screen.getByText('Claim')).toBeInTheDocument();
    });
    // Wait for form to be ready
    await waitFor(() => {
      expect(screen.getByText('Select claim type')).toBeInTheDocument();
    });
    // Fill out the claim form
    const claimTypeSelect = screen.getByText('Select claim type');
    fireEvent.click(claimTypeSelect);
    await waitFor(() => {
      expect(screen.getByText('Medical')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Medical'));
    const claimAmountInputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(claimAmountInputs[0], { target: { value: '100.00' } });
    // Submit the form
    const createClaimButton = screen.getByText('Create Claim');
    fireEvent.click(createClaimButton);
    await waitFor(() => {
      expect(mockCreateClaim).toHaveBeenCalledWith(expect.objectContaining({
        account_id: 1,
        amount: 100,
        claim_type: 'Medical',
      }));
    });
  });

  test('should call createManualAdjustment API when adjustment form is submitted', async () => {
    const mockCreateAdjustment = (backendApiClient.manualAdjustments.create as unknown) as jest.Mock;
    mockCreateAdjustment.mockResolvedValue({ success: true });

    render(<MemberDetailPage params={mockParams} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on Claims/Adjustments tab
    const claimsAdjustmentsTab = screen.getByText('Claims/Adjustments');
    fireEvent.click(claimsAdjustmentsTab);
    // Wait for tab content to load
    await waitFor(() => {
      expect(screen.getByText('Manual Adjustment')).toBeInTheDocument();
    });
    // Fill out the adjustment form
    const fundSelect = screen.getByText('Select account');
    fireEvent.click(fundSelect);
    await waitFor(() => {
      expect(screen.getByText('Health Account')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Health Account'));
    const adjustmentAmountInputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(adjustmentAmountInputs[1], { target: { value: '50.00' } });
    // Submit the form
  const createAdjustmentButton = screen.getByText('Create Manual Adjustment');
    fireEvent.click(createAdjustmentButton);
    await waitFor(() => {
      expect(mockCreateAdjustment).toHaveBeenCalledWith(expect.objectContaining({
        account_id: 1,
        amount: 50,
      }));
    });
  });
});