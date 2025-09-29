'use client';

import { CreateLifeInsuranceBatchDialog } from '@/components/features/batches/CreateLifeInsuranceBatchDialog';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight, Eye, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Badge column removed; no badge import needed
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { backendApiClient } from '@/lib/api-client';

interface LifeInsuranceBatchListItem {
  id: number;
  start_date?: string;
  end_date?: string;
  suspended?: boolean;
  posted?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export default function LifeInsuranceBatchesPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<LifeInsuranceBatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalBatches, setTotalBatches] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await backendApiClient.lifeInsuranceBatches.list({
          page: currentPage,
          limit: itemsPerPage,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        const paginated = response as PaginatedResponse<LifeInsuranceBatchListItem>;
        setBatches(paginated.items ?? []);
        setTotalBatches(paginated.total ?? 0);
      } catch (fetchError) {
        console.error('Failed to load life insurance batches', fetchError);
        setError('Failed to load life insurance batches. Please try again.');
        setBatches([]);
        setTotalBatches(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, [currentPage, itemsPerPage, startDate, endDate, refreshToggle]);

  const totalPages = useMemo(() => {
    if (itemsPerPage === 0) return 1;
    return Math.max(1, Math.ceil(totalBatches / itemsPerPage));
  }, [itemsPerPage, totalBatches]);

  const triggerReload = () => {
    setRefreshToggle((value) => !value);
  };

  const handleViewBatch = (id: number) => {
    router.push(`/dashboard/batches/life-insurance/${id}`);
  };

  const handleDeleteBatch = async (id: number) => {
    if (!confirm('Delete this life insurance batch? This action cannot be undone.')) return;
    try {
      await backendApiClient.lifeInsuranceBatches.delete?.(String(id));
      triggerReload();
    } catch (deleteError) {
      console.error('Failed to delete life insurance batch', deleteError);
      setError('Failed to delete life insurance batch. Please try again.');
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString();
  };

  const formatDateRange = (start?: string, end?: string) => {
    const formattedStart = formatDate(start);
    const formattedEnd = formatDate(end);

    if (formattedStart && formattedEnd) {
      return `${formattedStart} through ${formattedEnd}`;
    }

    if (formattedStart) {
      return formattedStart;
    }

    if (formattedEnd) {
      return formattedEnd;
    }

    return 'No date range provided';
  };

  // Status column removed — batch status label and b adge are no longer rendered here.

  const filterApplied = Boolean(startDate || endDate);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-union-900">Life Insurance</h1>
          <p className="text-muted-foreground">Review life insurance batches and manage their lifecycle.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-union-600 hover:bg-union-700 text-white"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Batch
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Choose a start and end date to refine the list of batches.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex flex-1 flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Start date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="End date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" onClick={handleClearFilters} disabled={!filterApplied}>
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button className="mt-4 bg-union-600 text-white hover:bg-union-700" onClick={triggerReload}>
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Life Insurance Batches</CardTitle>
          <CardDescription>
            {loading
              ? 'Loading batches...'
              : `Showing ${batches.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                  to ${Math.min(currentPage * itemsPerPage, totalBatches)} of ${totalBatches} batches`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time Range</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                      Loading batches...
                    </TableCell>
                  </TableRow>
                ) : batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                      {filterApplied
                        ? 'No life insurance batches found for the selected filters.'
                        : 'No life insurance batches found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{formatDateRange(batch.start_date, batch.end_date)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" aria-label="Show" onClick={() => handleViewBatch(batch.id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!batch.posted && (
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Delete"
                              onClick={() => handleDeleteBatch(batch.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              const parsed = parseInt(value, 10);
              setItemsPerPage(parsed);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-end gap-4 text-sm text-muted-foreground">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <CreateLifeInsuranceBatchDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
