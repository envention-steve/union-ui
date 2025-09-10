import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TableSorting, TablePagination, PaginatedResponse } from '@/types';

interface UseDataTableOptions<T> {
  queryKey: string[];
  queryFn: (params: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    [key: string]: any;
  }) => Promise<PaginatedResponse<T>>;
  pageSize?: number;
  initialSorting?: TableSorting;
  initialFilters?: Record<string, any>;
  enabled?: boolean;
}

export function useDataTable<T>({
  queryKey,
  queryFn,
  pageSize = 10,
  initialSorting,
  initialFilters = {},
  enabled = true,
}: UseDataTableOptions<T>) {
  const [pagination, setPagination] = useState<TablePagination>({
    page: 1,
    pageSize,
  });

  const [sorting, setSorting] = useState<TableSorting>(
    initialSorting || { field: 'created_at', direction: 'desc' }
  );

  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);

  // Build query parameters
  const queryParams = {
    page: pagination.page,
    limit: pagination.pageSize,
    sortBy: sorting.field,
    sortOrder: sorting.direction,
    search: globalFilter || undefined,
    ...filters,
  };

  // Use React Query for data fetching
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [...queryKey, queryParams],
    queryFn: () => queryFn(queryParams),
    enabled,
    placeholderData: (previousData) => previousData,
  });

  const totalPages = data?.total ? Math.ceil(data.total / pagination.pageSize) : 0;

  // Action handlers
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination({ page: 1, pageSize: newPageSize });
  };

  const handleSortChange = (field: string) => {
    setSorting((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    // Reset to first page when sorting changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleGlobalFilterChange = (value: string) => {
    setGlobalFilter(value);
    // Reset to first page when filter changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setGlobalFilter('');
    setFilters(initialFilters);
    setPagination({ page: 1, pageSize });
    setSorting(initialSorting || { field: 'created_at', direction: 'desc' });
  };

  return {
    // Data
    data: data?.items || [],
    totalItems: data?.total || 0,
    totalPages,
    
    // State
    pagination,
    sorting,
    globalFilter,
    filters,
    
    // Loading states
    isLoading,
    isFetching,
    error,
    
    // Actions
    handlePageChange,
    handlePageSizeChange,
    handleSortChange,
    handleGlobalFilterChange,
    handleFilterChange,
    handleResetFilters,
    refetch,
  };
}
