import { renderHook, act, waitFor } from '@testing-library/react';

import { useMemberClaimsAdjustments } from '@/hooks/useMemberClaimsAdjustments';
import type { FundBalance } from '@/lib/members/types';

type MockBackendApiClient = {
  claimTypes: {
    list: jest.Mock;
  };
  claims: {
    create: jest.Mock;
  };
  manualAdjustments: {
    create: jest.Mock;
  };
};

jest.mock('@/lib/api-client', () => ({
  backendApiClient: {
    claimTypes: {
      list: jest.fn(),
    },
    claims: {
      create: jest.fn(),
    },
    manualAdjustments: {
      create: jest.fn(),
    },
  },
}));

const { backendApiClient: mockBackendApiClient } = jest.requireMock('@/lib/api-client') as {
  backendApiClient: MockBackendApiClient;
};

describe('useMemberClaimsAdjustments', () => {
  const memberId = '123';
  const fundBalances: FundBalance = {
    health_account_id: 10,
    annuity_account_id: 11,
    health_balance: 1500,
    annuity_balance: 8000,
    last_updated: '2024-05-10T00:00:00.000Z',
  };

  const createCallbacks = () => ({
    onSuccess: jest.fn(),
    onError: jest.fn(),
    fetchMember: jest.fn().mockResolvedValue(undefined),
    refreshLedger: jest.fn().mockResolvedValue(undefined),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();

    mockBackendApiClient.claimTypes.list.mockReset();
    mockBackendApiClient.claims.create.mockReset();
    mockBackendApiClient.manualAdjustments.create.mockReset();

    mockBackendApiClient.claimTypes.list.mockResolvedValue(['CLAIM', 'ADJUSTMENT']);
    mockBackendApiClient.claims.create.mockResolvedValue(undefined);
    mockBackendApiClient.manualAdjustments.create.mockResolvedValue(undefined);
  });

  it('fetches claim types on mount and creates a claim successfully', async () => {
    jest.useFakeTimers();
    const callbacks = createCallbacks();

    const { result } = renderHook(() =>
      useMemberClaimsAdjustments({
        memberId,
        fundBalances,
        onSuccess: callbacks.onSuccess,
        onError: callbacks.onError,
        fetchMember: callbacks.fetchMember,
        refreshLedger: callbacks.refreshLedger,
      }),
    );

    await waitFor(() => {
      expect(mockBackendApiClient.claimTypes.list).toHaveBeenCalled();
      expect(result.current.claimTypes).toEqual([
        { value: 'CLAIM', label: 'CLAIM' },
        { value: 'ADJUSTMENT', label: 'ADJUSTMENT' },
      ]);
    });

    act(() => {
      result.current.updateClaimFormField('claim_type', 'CLAIM');
      result.current.updateClaimFormField('amount', '250.75');
      result.current.updateClaimFormField('description', 'Dental work');
      result.current.updateClaimFormField('allow_overdraft', true);
    });

    await act(async () => {
      await result.current.handleCreateClaim({ shouldRefreshLedger: true });
    });

    expect(mockBackendApiClient.claims.create).toHaveBeenCalledWith({
      account_id: fundBalances.health_account_id,
      member_id: Number(memberId),
      posted: false,
      suspended: false,
      amount: 250.75,
      posted_date: expect.any(String),
      description: 'Dental work',
      check_date: null,
      check_number: null,
      allow_overdraft: true,
      claim_type: 'CLAIM',
    });
    expect(callbacks.fetchMember).toHaveBeenCalled();
    expect(callbacks.refreshLedger).toHaveBeenCalled();
    expect(callbacks.onError).toHaveBeenCalledTimes(1);
    expect(callbacks.onError).toHaveBeenCalledWith(null);
    expect(callbacks.onSuccess).toHaveBeenCalledWith('Claim created successfully! Refreshing data...');
    expect(callbacks.onSuccess).toHaveBeenCalledWith('Claim created and data refreshed!');

    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();

    expect(callbacks.onSuccess).toHaveBeenCalledWith(null);
  });

  it('prevents adjustment creation when required fields are missing', async () => {
    const callbacks = createCallbacks();

    const { result } = renderHook(() =>
      useMemberClaimsAdjustments({
        memberId,
        fundBalances,
        onSuccess: callbacks.onSuccess,
        onError: callbacks.onError,
        fetchMember: callbacks.fetchMember,
      }),
    );

    await waitFor(() => expect(mockBackendApiClient.claimTypes.list).toHaveBeenCalled());

    await act(async () => {
      await result.current.handleCreateAdjustment();
    });

    expect(mockBackendApiClient.manualAdjustments.create).not.toHaveBeenCalled();
    expect(callbacks.onError).toHaveBeenCalledWith('Please fill in required fields: Account and Adjustment Amount');
  });
});
