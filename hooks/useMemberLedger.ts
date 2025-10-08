import { useCallback, useEffect, useState } from 'react';

import { backendApiClient } from '@/lib/api-client';
import type {
  LedgerEntry,
  LedgerEntryType,
} from '@/lib/members/types';

interface UseMemberLedgerOptions {
  memberId: string;
  isActive: boolean;
}

export interface MemberLedgerState {
  ledgerEntries: LedgerEntry[];
  ledgerLoading: boolean;
  ledgerError: string | null;
  ledgerTotalEntries: number;
  ledgerCurrentPage: number;
  ledgerItemsPerPage: number;
  expandedEntries: Set<number>;
  ledgerEntryTypes: LedgerEntryType[];
  accountTypeFilter: string;
  entryTypeFilter: string;
  startDateFilter: string;
  endDateFilter: string;
  dateRangeFilter: string;
  setLedgerCurrentPage: (page: number) => void;
  setLedgerItemsPerPage: (count: number) => void;
  setAccountTypeFilter: (value: string) => void;
  setEntryTypeFilter: (value: string) => void;
  setStartDateFilter: (value: string) => void;
  setEndDateFilter: (value: string) => void;
  toggleEntryExpansion: (id: number) => void;
  resetExpandedEntries: () => void;
  handleDateRangeChange: (range: string) => void;
  handleFilterChange: () => void;
  refresh: () => Promise<void>;
}

export function useMemberLedger({ memberId, isActive }: UseMemberLedgerOptions): MemberLedgerState {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [ledgerTotalEntries, setLedgerTotalEntries] = useState(0);
  const [ledgerCurrentPage, setLedgerCurrentPage] = useState(1);
  const [ledgerItemsPerPage, setLedgerItemsPerPage] = useState(25);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());
  const [ledgerEntryTypes, setLedgerEntryTypes] = useState<LedgerEntryType[]>([]);

  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');
  const [entryTypeFilter, setEntryTypeFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');

  const fetchLedgerEntries = useCallback(async () => {
    try {
      setLedgerLoading(true);
      setLedgerError(null);

      const params: Record<string, unknown> = {
        offset: (ledgerCurrentPage - 1) * ledgerItemsPerPage,
        limit: ledgerItemsPerPage,
      };

      if (accountTypeFilter !== 'all') {
        params.account_type = accountTypeFilter.toUpperCase();
      }

      if (entryTypeFilter !== 'all') {
        params.entry_type = entryTypeFilter;
      }

      if (startDateFilter) {
        params.start_date = startDateFilter;
      }

      if (endDateFilter) {
        params.end_date = endDateFilter;
      }

      const response = await backendApiClient.members.getLedgerEntries!(memberId, params);

      setLedgerEntries(response.items);
      setLedgerTotalEntries(response.total);
    } catch (err) {
      console.error('Error fetching ledger entries:', err);
      setLedgerError('Failed to load ledger entries. Please try again.');
      setLedgerEntries([]);
      setLedgerTotalEntries(0);
    } finally {
      setLedgerLoading(false);
    }
  }, [
    memberId,
    ledgerCurrentPage,
    ledgerItemsPerPage,
    accountTypeFilter,
    entryTypeFilter,
    startDateFilter,
    endDateFilter,
  ]);

  const fetchLedgerEntryTypes = useCallback(async () => {
    try {
      const types = await backendApiClient.ledgerEntries.getTypes();
      setLedgerEntryTypes(types);
    } catch (err) {
      console.error('Error fetching ledger entry types:', err);
    }
  }, []);

  useEffect(() => {
    fetchLedgerEntryTypes();
  }, [fetchLedgerEntryTypes]);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    fetchLedgerEntries();
  }, [fetchLedgerEntries, isActive]);

  const toggleEntryExpansion = (entryId: number) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const resetExpandedEntries = useCallback(() => {
    setExpandedEntries(new Set());
  }, []);

  const handleDateRangeChange = (range: string) => {
    setDateRangeFilter(range);

    const now = new Date();
    let start = '';
    let end = '';

    switch (range) {
      case 'this-month':
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'last-month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'this-year':
        start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
      case 'last-year':
        start = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
        break;
      default:
        start = '';
        end = '';
    }

    setStartDateFilter(start);
    setEndDateFilter(end);
    setLedgerCurrentPage(1);
  };

  const handleFilterChange = () => {
    setLedgerCurrentPage(1);
  };

  return {
    ledgerEntries,
    ledgerLoading,
    ledgerError,
    ledgerTotalEntries,
    ledgerCurrentPage,
    ledgerItemsPerPage,
    expandedEntries,
    ledgerEntryTypes,
    accountTypeFilter,
    entryTypeFilter,
    startDateFilter,
    endDateFilter,
    dateRangeFilter,
    setLedgerCurrentPage,
    setLedgerItemsPerPage,
    setAccountTypeFilter,
    setEntryTypeFilter,
    setStartDateFilter,
    setEndDateFilter,
    toggleEntryExpansion,
    resetExpandedEntries,
    handleDateRangeChange,
    handleFilterChange,
    refresh: fetchLedgerEntries,
  };
}
