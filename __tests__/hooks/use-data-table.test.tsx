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

describe('useDataTable (Fixed)', () => {
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
      expect(result.current.sorting).toEqual({ field: 'created_at', direction: 'desc' });
      expect(result.current.filters).toEqual({});
      expect(result.current.globalFilter).toBe('');
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toEqual([]);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPages).toBe(0);
    });

    it('should accept custom initial values', () => {
      const initialSorting = { field: 'name', direction: 'desc' as const };
      const initialFilters = { status: 'active' };

      const { result } = renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
          pageSize: 20,
          initialSorting,
          initialFilters,
        }),
        { wrapper: createWrapper() }
      );

      expect(result.current.pagination).toEqual({
        page: 1,
        pageSize: 20,
      });
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
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc',
        search: undefined,
      });
      expect(result.current.data).toEqual(mockApiResponse.items);
      expect(result.current.totalItems).toBe(mockApiResponse.total);
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
        result.current.handlePageChange(2);
      });

      await waitFor(() => {
        expect(mockQueryFn).toHaveBeenCalledWith({
          page: 2,
          limit: 10,
          sortBy: 'created_at',
          sortOrder: 'desc',
          search: undefined,
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
    it('should handle page changes', async () => {
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
        result.current.handlePageChange(3);
      });

      expect(result.current.pagination.page).toBe(3);
    });

    it('should handle page size changes', async () => {
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
        result.current.handlePageSizeChange(25);
      });

      expect(result.current.pagination).toEqual({ page: 1, pageSize: 25 });
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
    it('should handle sort changes', async () => {
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
        result.current.handleSortChange('name');
      });

      expect(result.current.sorting).toEqual({ field: 'name', direction: 'asc' });
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
        result.current.handleSortChange('name');
      });

      expect(result.current.sorting).toEqual({ field: 'name', direction: 'desc' });
    });

    it('should reset pagination when sorting changes', async () => {
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

      // Change to page 3
      act(() => {
        result.current.handlePageChange(3);
      });

      expect(result.current.pagination.page).toBe(3);

      // Change sorting - should reset to page 1
      act(() => {
        result.current.handleSortChange('name');
      });

      expect(result.current.pagination.page).toBe(1);
    });
  });

  describe('Filtering', () => {
    it('should handle filter changes', async () => {
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
        result.current.handleFilterChange(newFilters);
      });

      expect(result.current.filters).toEqual(newFilters);
    });

    it('should reset pagination when filters change', async () => {
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

      // Change to page 3
      act(() => {
        result.current.handlePageChange(3);
      });

      expect(result.current.pagination.page).toBe(3);

      // Change filters - should reset to page 1
      act(() => {
        result.current.handleFilterChange({ status: 'active' });
      });

      expect(result.current.pagination.page).toBe(1);
    });
  });

  describe('Global filter (search)', () => {
    it('should handle global filter changes', async () => {
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
        result.current.handleGlobalFilterChange('search term');
      });

      expect(result.current.globalFilter).toBe('search term');
    });

    it('should reset pagination when global filter changes', async () => {
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

      // Change to page 3
      act(() => {
        result.current.handlePageChange(3);
      });

      expect(result.current.pagination.page).toBe(3);

      // Change global filter - should reset to page 1
      act(() => {
        result.current.handleGlobalFilterChange('search');
      });

      expect(result.current.pagination.page).toBe(1);
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
        result.current.handlePageChange(3);
        result.current.handleSortChange('name');
        result.current.handleFilterChange({ status: 'active', category: 'premium' });
        result.current.handleGlobalFilterChange('search term');
      });

      // Reset
      act(() => {
        result.current.handleResetFilters();
      });

      expect(result.current.pagination).toEqual({ page: 1, pageSize: 10 });
      expect(result.current.sorting).toEqual({ field: 'created_at', direction: 'desc' });
      expect(result.current.filters).toEqual({});
      expect(result.current.globalFilter).toBe('');
    });
  });

  describe('Query options', () => {
    it('should respect enabled option', async () => {
      renderHook(
        () => useDataTable({
          queryKey: ['test-data'],
          queryFn: mockQueryFn,
          enabled: false,
        }),
        { wrapper: createWrapper() }
      );

      // Wait a bit to ensure no query is triggered
      await new Promise(resolve => setTimeout(resolve, 100));

      // The hook should not automatically fetch data when enabled is false
      expect(mockQueryFn).not.toHaveBeenCalled();
    });
  });

  describe('Refetch functionality', () => {
    it('should provide refetch function', async () => {
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
});
