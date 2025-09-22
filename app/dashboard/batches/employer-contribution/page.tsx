'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Eye, Plus, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { backendApiClient } from '@/lib/api-client';
import { CreateEmployerContributionBatchDialog } from '@/components/features/batches/CreateEmployerContributionBatchDialog';

interface EmployerSummary {
  id: number;
  name: string;
  ein?: string;
}

interface EmployerContributionBatchListItem {
  id: number;
  start_date: string;
  end_date: string;
  received_date?: string;
  posted: boolean;
  suspended?: boolean;
  amount_received?: number;
  employer_id: number;
  employer?: EmployerSummary;
  created_at?: string;
  updated_at?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export default function EmployerContributionPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [batches, setBatches] = useState<EmployerContributionBatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalBatches, setTotalBatches] = useState(0);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await backendApiClient.employerContributionBatches.list({
          page: currentPage,
          limit: itemsPerPage,
        });
        const paginated = response as PaginatedResponse<EmployerContributionBatchListItem>;
        setBatches(paginated.items ?? []);
        setTotalBatches(paginated.total ?? 0);
      } catch (fetchError) {
        console.error('Failed to load employer contribution batches', fetchError);
        setError('Failed to load employer contribution batches. Please try again.');
        setBatches([]);
        setTotalBatches(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, [currentPage, itemsPerPage, refreshToggle]);

  const totalPages = useMemo(() => {
    if (itemsPerPage === 0) return 1;
    return Math.max(1, Math.ceil(totalBatches / itemsPerPage));
  }, [itemsPerPage, totalBatches]);

  const handleViewBatch = (id: number) => {
    router.push(`/dashboard/batches/employer-contribution/${id}/details`);
  };

  const handlePostBatch = async (id: number) => {
    if (!confirm('Post this batch? Posting will mark all contributions as final.')) return;
    try {
      await backendApiClient.employerContributionBatches.post(String(id));
      triggerReload();
    } catch (postError) {
      console.error('Failed to post batch', postError);
      setError('Failed to post batch, please try again.');
    }
  };

  const handleUnpostBatch = async (id: number) => {
    if (!confirm('Unpost this batch?')) return;
    try {
      await backendApiClient.employerContributionBatches.unpost(String(id));
      triggerReload();
    } catch (unpostError) {
      console.error('Failed to unpost batch', unpostError);
      setError('Failed to unpost batch, please try again.');
    }
  };

  const handleDeleteBatch = async (id: number) => {
    if (!confirm('Delete this batch? This action cannot be undone.')) return;
    try {
      await backendApiClient.employerContributionBatches.delete(String(id));
      triggerReload();
    } catch (deleteError) {
      console.error('Failed to delete batch', deleteError);
      setError('Failed to delete batch, please try again.');
    }
  };

  const triggerReload = () => {
    setRefreshToggle((value) => !value);
  };

  const handleItemsPerPageChange = (value: string) => {
    const parsed = parseInt(value, 10);
    setItemsPerPage(parsed);
    setCurrentPage(1);
  };

  const statusBadgeVariant = (posted: boolean) => {
    return posted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const formatDate = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-union-900">Employer Contributions</h1>
          <p className="text-muted-foreground">Manage employer contribution batches and their lifecycle.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-union-600 text-white hover:bg-union-700" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Batch
          </Button>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button className="mt-4 bg-union-600 text-white hover:bg-union-700" onClick={triggerReload}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Employer Contribution Batches</CardTitle>
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
                  <TableHead>Employer</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Loading batches...
                    </TableCell>
                  </TableRow>
                ) : batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No employer contribution batches found.
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>
                        <div className="font-medium">{batch.employer?.name || 'Unknown Employer'}</div>
                        {batch.employer?.ein && (
                          <div className="text-xs text-muted-foreground">EIN: {batch.employer.ein}</div>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(batch.start_date)}</TableCell>
                      <TableCell>{formatDate(batch.end_date)}</TableCell>
                      <TableCell>
                        <Badge className={statusBadgeVariant(batch.posted)}>
                          {batch.posted ? 'Posted' : 'Unposted'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {typeof batch.amount_received === 'number'
                          ? batch.amount_received.toLocaleString('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewBatch(batch.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          {batch.posted ? (
                            <Button variant="outline" size="sm" onClick={() => handleUnpostBatch(batch.id)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Unpost
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handlePostBatch(batch.id)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Post
                            </Button>
                          )}
                          {!batch.posted && (
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteBatch(batch.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
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

      <CreateEmployerContributionBatchDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={triggerReload}
      />
    </div>
  );
}
