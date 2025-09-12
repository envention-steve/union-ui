import React, { Suspense } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { backendApiClient } from '@/lib/api-client';
import MemberDetailPage from '@/app/dashboard/members/[id]/page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  backendApiClient: {
    members: {
      getDetails: jest.fn(),
      update: jest.fn(),
      getLedgerEntries: jest.fn(),
    },
    ledgerEntries: {
      getTypes: jest.fn(),
    },
  },
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

// Test wrapper component that provides Suspense boundary
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Suspense fallback={<div data-testid="loading-suspense">Loading...</div>}>
      {children}
    </Suspense>
  );
};

// Helper to render with async params
const renderMemberDetailPage = async (memberId: string, mode: string = 'view') => {
  // Create a promise that resolves to the params
  const paramsPromise = Promise.resolve({ id: memberId });
  
  // Mock router and search params
  const mockPush = jest.fn();
  mockUseRouter.mockReturnValue({
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  });

  const mockSearchParams = new URLSearchParams();
  if (mode) mockSearchParams.set('mode', mode);
  
  mockUseSearchParams.mockReturnValue(mockSearchParams);

  // Render with proper Suspense boundary
  const utils = render(
    <TestWrapper>
      <MemberDetailPage params={paramsPromise} />
    </TestWrapper>
  );

  // Wait for Suspense to resolve
  await waitFor(() => {
    expect(screen.queryByTestId('loading-suspense')).not.toBeInTheDocument();
  });

  return { ...utils, mockPush };
};

describe('MemberDetailPage with Suspense', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default API mocks
    (backendApiClient.members.getDetails as jest.Mock).mockResolvedValue({
      id: 123,
      first_name: 'John',
      last_name: 'Doe',
      unique_id: 'MEMBER-123',
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
    });
  });

  describe('Basic Rendering', () => {
    it('should render member details in view mode', async () => {
      await act(async () => {
        await renderMemberDetailPage('123', 'view');
      });

      // Wait for component to load and API call to complete
      await waitFor(() => {
        expect(backendApiClient.members.getDetails).toHaveBeenCalledWith('123');
      });

      // Check if member data loaded successfully
      await waitFor(() => {
        expect(screen.getByText('Member Management')).toBeInTheDocument();
        expect(screen.getByText(/Unique ID:/)).toBeInTheDocument();
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });
    });

    it('should handle Suspense loading state', async () => {
      // Create a never-resolving promise to test Suspense
      const neverResolvePromise = new Promise(() => {}); // Never resolves
      
      render(
        <TestWrapper>
          <MemberDetailPage params={neverResolvePromise} />
        </TestWrapper>
      );

      // Should show Suspense fallback
      expect(screen.getByTestId('loading-suspense')).toBeInTheDocument();
    });

    it('should render edit mode when mode=edit', async () => {
      await act(async () => {
        await renderMemberDetailPage('123', 'edit');
      });

      await waitFor(() => {
        expect(backendApiClient.members.getDetails).toHaveBeenCalledWith('123');
      });

      // Should show edit-specific elements after loading
      await waitFor(() => {
        expect(screen.getByText('Edit Member')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (backendApiClient.members.getDetails as jest.Mock).mockRejectedValue(
        new Error('API Error: 404 Not Found')
      );

      await act(async () => {
        await renderMemberDetailPage('999');
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to load member data/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is clicked', async () => {
      const { mockPush } = await act(async () => {
        return await renderMemberDetailPage('123');
      });

      await waitFor(() => {
        // Check that buttons exist - there should be a back button and an Edit button
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThanOrEqual(2);
      });

      // Click back button (first button which is the back button)
      const backButton = screen.getAllByRole('button')[0];
      await act(async () => {
        backButton.click();
      });

      // Should navigate back
      expect(mockPush).toHaveBeenCalledWith('/dashboard/members');
    });
  });

  describe('Tabs', () => {
    it('should render all tabs', async () => {
      await act(async () => {
        await renderMemberDetailPage('123');
      });

      await waitFor(() => {
        expect(screen.getByText('Member')).toBeInTheDocument();
        expect(screen.getByText('Dependents')).toBeInTheDocument();
        expect(screen.getByText('Health Coverage')).toBeInTheDocument();
        expect(screen.getByText('Life Insurance')).toBeInTheDocument();
        expect(screen.getByText('Employers')).toBeInTheDocument();
        expect(screen.getByText('Notes')).toBeInTheDocument();
        expect(screen.getByText('Fund Ledger')).toBeInTheDocument();
      });
    });
  });

  describe('Data Processing', () => {
    it('should process member data correctly', async () => {
      const mockApiResponse = {
        id: 123,
        first_name: 'John',
        last_name: 'Doe',
        middle_name: 'Michael',
        addresses: [],
        phone_numbers: [{ type: 'Mobile', number: '555-1234' }],
        email_addresses: [],
        distribution_class_coverages: [],
        member_status_coverages: [],
        life_insurance_coverages: [],
        dependent_coverages: [],
        employer_coverages: [],
        insurance_plan_coverages: [],
        member_notes: [],
      };

      (backendApiClient.members.getDetails as jest.Mock).mockResolvedValue(mockApiResponse);

      await act(async () => {
        await renderMemberDetailPage('123');
      });

      await waitFor(() => {
        expect(backendApiClient.members.getDetails).toHaveBeenCalledWith('123');
      });

      // Verify that the data is processed and displayed
      await waitFor(() => {
        expect(screen.getByText('Member Management')).toBeInTheDocument();
        expect(screen.getByText(/Unique ID:/)).toBeInTheDocument();
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });
    });
  });
});