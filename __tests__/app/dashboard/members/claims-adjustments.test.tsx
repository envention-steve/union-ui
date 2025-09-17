import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  const mockClaimTypes = [
    { value: 'medical', label: 'Medical' },
    { value: 'dental', label: 'Dental' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    (backendApiClient.members.getDetails as jest.Mock).mockResolvedValue(mockMemberData);
    (backendApiClient.claimTypes.list as jest.Mock).mockResolvedValue(mockClaimTypes);
    (backendApiClient.distributionClasses.list as jest.Mock).mockResolvedValue([]);
    (backendApiClient.memberStatuses.list as jest.Mock).mockResolvedValue([]);
    (backendApiClient.insurancePlans.list as jest.Mock).mockResolvedValue({ items: [] });
    (backendApiClient.ledgerEntries.getTypes as jest.Mock).mockResolvedValue([]);
    (backendApiClient.members.getLedgerEntries as jest.Mock).mockResolvedValue({ items: [], total: 0 });
  });

  test('should render Claims/Adjustments tab with both forms', async () => {
    render(<MemberDetailPage params={mockParams} />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on Claims/Adjustments tab
    const claimsAdjustmentsTab = screen.getByText('Claims/Adjustments');
    fireEvent.click(claimsAdjustmentsTab);

    // Check if both forms are rendered
    expect(screen.getByText('Claim')).toBeInTheDocument();
    expect(screen.getByText('Manual Adjustment')).toBeInTheDocument();

    // Check for form fields
    expect(screen.getByText('Claim Type:')).toBeInTheDocument();
    expect(screen.getByText('Claim Amount')).toBeInTheDocument();
    expect(screen.getByText('Fund:')).toBeInTheDocument();
    expect(screen.getByText('Adjustment Amount')).toBeInTheDocument();
  });

  test('should show validation message when submitting claim without required fields', async () => {
    render(<MemberDetailPage params={mockParams} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on Claims/Adjustments tab
    const claimsAdjustmentsTab = screen.getByText('Claims/Adjustments');
    fireEvent.click(claimsAdjustmentsTab);

    // Try to submit claim without filling required fields
    const createClaimButton = screen.getByText('Create Claim');
    expect(createClaimButton).toBeDisabled(); // Should be disabled when no required fields are filled
  });

  test('should enable create claim button when required fields are filled', async () => {
    render(<MemberDetailPage params={mockParams} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
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
    const claimAmountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(claimAmountInput, { target: { value: '100.00' } });

    // Now the create claim button should be enabled
    const createClaimButton = screen.getByText('Create Claim');
    expect(createClaimButton).not.toBeDisabled();
  });

  test('should show fund options for manual adjustment', async () => {
    render(<MemberDetailPage params={mockParams} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on Claims/Adjustments tab
    const claimsAdjustmentsTab = screen.getByText('Claims/Adjustments');
    fireEvent.click(claimsAdjustmentsTab);

    // Click on fund dropdown
    const fundSelect = screen.getByText('Select fund type');
    fireEvent.click(fundSelect);

    // Check if fund options are available
    expect(screen.getByText('Health Fund')).toBeInTheDocument();
    expect(screen.getByText('Annuity Fund')).toBeInTheDocument();
  });

  test('should call createClaim API when claim form is submitted', async () => {
    const mockCreateClaim = backendApiClient.members.createClaim as jest.Mock;
    mockCreateClaim.mockResolvedValue({ success: true });

    render(<MemberDetailPage params={mockParams} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on Claims/Adjustments tab
    const claimsAdjustmentsTab = screen.getByText('Claims/Adjustments');
    fireEvent.click(claimsAdjustmentsTab);

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

    const claimAmountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(claimAmountInput, { target: { value: '100.00' } });

    // Submit the form
    const createClaimButton = screen.getByText('Create Claim');
    fireEvent.click(createClaimButton);

    await waitFor(() => {
      expect(mockCreateClaim).toHaveBeenCalledWith('123', expect.objectContaining({
        claim_type: 'medical',
        amount: 100,
      }));
    });
  });

  test('should call createManualAdjustment API when adjustment form is submitted', async () => {
    const mockCreateAdjustment = backendApiClient.members.createManualAdjustment as jest.Mock;
    mockCreateAdjustment.mockResolvedValue({ success: true });

    render(<MemberDetailPage params={mockParams} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on Claims/Adjustments tab
    const claimsAdjustmentsTab = screen.getByText('Claims/Adjustments');
    fireEvent.click(claimsAdjustmentsTab);

    // Fill out the adjustment form
    const fundSelect = screen.getByText('Select fund type');
    fireEvent.click(fundSelect);
    fireEvent.click(screen.getByText('Health Fund'));

    const adjustmentAmountInputs = screen.getAllByPlaceholderText('0.00');
    const adjustmentAmountInput = adjustmentAmountInputs[1]; // Second input is for adjustment
    fireEvent.change(adjustmentAmountInput, { target: { value: '50.00' } });

    // Submit the form
    const createAdjustmentButton = screen.getByText('Create Manual adjustment');
    fireEvent.click(createAdjustmentButton);

    await waitFor(() => {
      expect(mockCreateAdjustment).toHaveBeenCalledWith('123', expect.objectContaining({
        fund: 'HEALTH',
        amount: 50,
      }));
    });
  });
});