import { renderHook, act, waitFor } from '@testing-library/react';

import { useMemberLedger } from '@/hooks/useMemberLedger';

type MockBackendApiClient = {
  members: {
    getLedgerEntries: jest.Mock;
  };
  ledgerEntries: {
    getTypes: jest.Mock;
  };
};

jest.mock('@/lib/api-client', () => ({
  backendApiClient: {
    members: {
      getLedgerEntries: jest.fn(),
    },
    ledgerEntries: {
      getTypes: jest.fn(),
    },
  },
}));

const { backendApiClient: mockBackendApiClient } = jest.requireMock('@/lib/api-client') as {
  backendApiClient: MockBackendApiClient;
};

describe('useMemberLedger', () => {
  const memberId = '123';

  const ledgerResponse = {
    items: [
      {
        id: 1,
        account_id: 10,
        member_id: 123,
        type: 'CLAIM',
        amount: 125.5,
        posted_date: '2024-05-01T00:00:00.000Z',
        posted: true,
        suspended: false,
        description: 'Claim Payment',
        created_at: '2024-05-02T00:00:00.000Z',
        updated_at: '2024-05-02T00:00:00.000Z',
      },
    ],
    total: 1,
    offset: 0,
    limit: 25,
  };

  const ledgerTypes = [
    { value: 'CLAIM', label: 'Claim' },
    { value: 'ADJUSTMENT', label: 'Adjustment' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockBackendApiClient.members.getLedgerEntries.mockReset();
    mockBackendApiClient.ledgerEntries.getTypes.mockReset();

    mockBackendApiClient.members.getLedgerEntries.mockResolvedValue(ledgerResponse);
    mockBackendApiClient.ledgerEntries.getTypes.mockResolvedValue(ledgerTypes);
  });

  it('loads ledger entries and entry types on mount when active', async () => {
    const { result } = renderHook(() => useMemberLedger({ memberId, isActive: true }));

    await waitFor(() => expect(result.current.ledgerLoading).toBe(false));

    expect(mockBackendApiClient.members.getLedgerEntries).toHaveBeenCalledWith(memberId, {
      offset: 0,
      limit: 25,
    });
    expect(result.current.ledgerEntries).toEqual(ledgerResponse.items);
    expect(result.current.ledgerTotalEntries).toBe(1);
    expect(result.current.ledgerEntryTypes).toEqual(ledgerTypes);
  });

  it('updates filters and pagination before refetching results', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-05-15T12:00:00Z'));

    const { result } = renderHook(() => useMemberLedger({ memberId, isActive: true }));

    await waitFor(() => expect(result.current.ledgerLoading).toBe(false));

    expect(mockBackendApiClient.members.getLedgerEntries).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setLedgerItemsPerPage(50);
    });

    await waitFor(() =>
      expect(mockBackendApiClient.members.getLedgerEntries).toHaveBeenLastCalledWith(memberId, {
        offset: 0,
        limit: 50,
      }),
    );

    act(() => {
      result.current.setLedgerCurrentPage(2);
    });

    await waitFor(() =>
      expect(mockBackendApiClient.members.getLedgerEntries).toHaveBeenLastCalledWith(memberId, {
        offset: 50,
        limit: 50,
      }),
    );

    act(() => {
      result.current.handleDateRangeChange('this-month');
    });

    await waitFor(() => {
      expect(mockBackendApiClient.members.getLedgerEntries).toHaveBeenLastCalledWith(
        memberId,
        expect.objectContaining({
          offset: 0,
          limit: 50,
          start_date: '2024-05-01',
          end_date: '2024-05-31',
        }),
      );
    });

    act(() => {
      result.current.toggleEntryExpansion(ledgerResponse.items[0].id);
    });
    expect(result.current.expandedEntries.has(ledgerResponse.items[0].id)).toBe(true);

    jest.useRealTimers();
  });
});
