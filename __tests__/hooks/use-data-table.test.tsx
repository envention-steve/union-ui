import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDataTable } from '../../hooks/use-data-table';

// Mock API response
const mockApiResponse = {
  items: [
    { id: '1', name: 'Item 1', status: 'active' },
    { id: '2', name: 'Item 2', status: 'inactive' },
    { id: '3', name: 'Item 3', status: 'active' },
  ],
  total: 3,
  page: 1,
  limit: 10,
};

// Mock query function
const mockQueryFn = jest.fn();

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDataTable', () => {
  beforeEach(() => {
    mockQueryFn.mockClear();
    mockQueryFn.mockResolvedValue(mockApiResponse);
  });

  describe('Initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
        }),
        { wrapper: createWrapper() }
      );

      expect(result.current.pagination).toEqual({
        page: 1,
        pageSize: 10,
      });
      expect(result.current.sorting).toBeNull();
      expect(result.current.filters).toEqual({});
      expect(result.current.globalFilter).toBe('');
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toEqual([]);
      expect(result.current.total).toBe(0);
      expect(result.current.totalPages).toBe(0);
    });

    it('should accept custom initial values', () => {
      const initialPagination = { page: 2, pageSize: 20 };
      const initialSorting = { field: 'name', direction: 'desc' as const };
      const initialFilters = { status: 'active' };

      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
          initialPagination,
          initialSorting,
          initialFilters,
        }),
        { wrapper: createWrapper() }
      );

      expect(result.current.pagination).toEqual(initialPagination);
      expect(result.current.sorting).toEqual(initialSorting);
      expect(result.current.filters).toEqual(initialFilters);
    });
  });

  describe('Data fetching', () => {
    it('should fetch data with correct parameters', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockQueryFn).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        filters: {},
        sorting: null,
        globalFilter: '',
      });
      expect(result.current.data).toEqual(mockApiResponse.items);
      expect(result.current.total).toBe(mockApiResponse.total);
    });

    it('should refetch data when parameters change', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change pagination
      act(() => {
        result.current.setPagination({ page: 2, pageSize: 20 });
      });

      await waitFor(() => {
        expect(mockQueryFn).toHaveBeenCalledWith({
          page: 2,
          pageSize: 20,
          filters: {},
          sorting: null,
          globalFilter: '',
        });
      });
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'API Error';
      mockQueryFn.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toEqual([]);
    });
  });

  describe('Pagination', () => {
    it('should update pagination correctly', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setPagination({ page: 3, pageSize: 15 });
      });

      expect(result.current.pagination).toEqual({ page: 3, pageSize: 15 });
    });

    it('should go to next page', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.pagination.page).toBe(2);
    });

    it('should go to previous page', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
          initialPagination: { page: 2, pageSize: 10 },
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.pagination.page).toBe(1);
    });

    it('should not go to previous page when on first page', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.pagination.page).toBe(1);
    });

    it('should calculate total pages correctly', async () => {
      mockQueryFn.mockResolvedValueOnce({
        ...mockApiResponse,
        total: 25,
      });

      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalPages).toBe(3); // 25 items / 10 per page = 3 pages
    });
  });

  describe('Sorting', () => {
    it('should set sorting correctly', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newSorting = { field: 'name', direction: 'asc' as const };
      
      act(() => {
        result.current.setSorting(newSorting);
      });

      expect(result.current.sorting).toEqual(newSorting);
    });

    it('should toggle sorting direction for same field', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
          initialSorting: { field: 'name', direction: 'asc' },
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleSort('name');
      });

      expect(result.current.sorting).toEqual({ field: 'name', direction: 'desc' });
    });

    it('should set new field sorting to ascending', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
          initialSorting: { field: 'name', direction: 'desc' },
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleSort('status');
      });

      expect(result.current.sorting).toEqual({ field: 'status', direction: 'asc' });
    });

    it('should reset pagination when sorting changes', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
          initialPagination: { page: 3, pageSize: 10 },
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setSorting({ field: 'name', direction: 'asc' });
      });

      expect(result.current.pagination.page).toBe(1);
    });
  });

  describe('Filtering', () => {
    it('should set individual filters', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setFilter('status', 'active');
      });

      expect(result.current.filters).toEqual({ status: 'active' });
    });

    it('should set multiple filters', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newFilters = { status: 'active', category: 'premium' };

      act(() => {
        result.current.setFilters(newFilters);
      });

      expect(result.current.filters).toEqual(newFilters);
    });

    it('should clear individual filters', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
          initialFilters: { status: 'active', category: 'premium' },
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.clearFilter('status');
      });

      expect(result.current.filters).toEqual({ category: 'premium' });
    });

    it('should clear all filters', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
          initialFilters: { status: 'active', category: 'premium' },
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.clearAllFilters();
      });

      expect(result.current.filters).toEqual({});
    });

    it('should reset pagination when filters change', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
          initialPagination: { page: 3, pageSize: 10 },
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setFilter('status', 'active');
      });

      expect(result.current.pagination.page).toBe(1);
    });
  });

  describe('Global filter (search)', () => {
    it('should set global filter', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setGlobalFilter('search term');
      });

      expect(result.current.globalFilter).toBe('search term');
    });

    it('should reset pagination when global filter changes', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
          initialPagination: { page: 3, pageSize: 10 },
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setGlobalFilter('search');
      });

      expect(result.current.pagination.page).toBe(1);
    });

    it('should debounce global filter changes', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
          debounceMs: 100,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear previous calls
      mockQueryFn.mockClear();

      // Rapidly change global filter
      act(() => {
        result.current.setGlobalFilter('a');
      });
      act(() => {
        result.current.setGlobalFilter('ab');
      });
      act(() => {
        result.current.setGlobalFilter('abc');
      });

      expect(result.current.globalFilter).toBe('abc');

      // Should not trigger immediate API call due to debouncing
      expect(mockQueryFn).not.toHaveBeenCalled();

      // Wait for debounce
      await waitFor(
        () => {
          expect(mockQueryFn).toHaveBeenCalledWith(
            expect.objectContaining({ globalFilter: 'abc' })
          );
        },
        { timeout: 200 }
      );
    });
  });

  describe('Refresh functionality', () => {
    it('should provide refresh function', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockQueryFn.mockClear();

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(mockQueryFn).toHaveBeenCalled();
      });
    });
  });

  describe('Reset functionality', () => {
    it('should reset all state to initial values', async () => {
      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change all state
      act(() => {
        result.current.setPagination({ page: 3, pageSize: 20 });
        result.current.setSorting({ field: 'name', direction: 'desc' });
        result.current.setFilters({ status: 'active', category: 'premium' });
        result.current.setGlobalFilter('search term');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.pagination).toEqual({ page: 1, pageSize: 10 });
      expect(result.current.sorting).toBeNull();
      expect(result.current.filters).toEqual({});
      expect(result.current.globalFilter).toBe('');
    });
  });

  describe('Query options', () => {
    it('should pass through custom query options', () => {
      const customQueryOptions = {
        enabled: false,
        staleTime: 5000,
        retry: 3,
      };

      renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
          queryOptions: customQueryOptions,
        }),
        { wrapper: createWrapper() }
      );

      // The hook should not automatically fetch data when enabled is false
      expect(mockQueryFn).not.toHaveBeenCalled();
    });
  });
});
