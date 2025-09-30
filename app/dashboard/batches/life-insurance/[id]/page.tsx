 'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { backendApiClient } from '@/lib/api-client';
import {
  LifeInsuranceBatchSummary,
  LifeInsuranceRawMember,
  parseNumber,
  formatCurrency,
  formatDate,
  extractDetailItems,
  extractBatchMetadata,
} from '@/lib/life-insurance-helpers';

interface LifeInsuranceMemberRow {
  id: number | null;
  memberName: string;
  memberUniqueId: string | null;
  birthdate: string | null;
  pendingHealthBalance: number | null;
  newLifeInsuranceStatus: string | null;
}

const listRoute = '/dashboard/batches/life-insurance';

// helpers imported from lib/life-insurance-helpers

export default function LifeInsuranceBatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [batchInfo, setBatchInfo] = useState<LifeInsuranceBatchSummary | null>(null);
  const [memberRows, setMemberRows] = useState<LifeInsuranceMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'post' | 'unpost' | 'delete' | null>(null);

  const fetchBatchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

  const detailsResponse = await backendApiClient.lifeInsuranceBatches.get(id);

      const normalizedBatch = extractBatchMetadata(detailsResponse) ?? null;

      const detailItems = extractDetailItems(detailsResponse);
      const rows: LifeInsuranceMemberRow[] = detailItems.map((item: LifeInsuranceRawMember) => {
        const memberObj = (item.member ?? {}) as Record<string, unknown>;
        const memberName =
          item.member_name ?? (memberObj['full_name'] as string | undefined) ?? `${(memberObj['last_name'] as string | undefined) ?? ''}${(memberObj['first_name'] as string | undefined) ? ', ' + (memberObj['first_name'] as string) : ''}`;
        const uniqueId = item.member_unique_id ?? (memberObj['unique_id'] as string | undefined) ?? null;
        const birthdate = item.birth_date ?? item.birthdate ?? (memberObj['birth_date'] as string | undefined) ?? (memberObj['birthdate'] as string | undefined) ?? (memberObj['dob'] as string | undefined) ?? null;
        const pending = parseNumber(item.pending_health_balance ?? item.health_balance ?? item.pending_balance ?? item.pending_health_balance) ?? null;
        const status = item.new_life_insurance_status ?? item.new_status ?? item.status ?? item.status ?? null;
        const rowId = parseNumber(item.id ?? item.coverage_id ?? item.life_insurance_person_id) ?? null;

        return {
          id: rowId,
          memberName: typeof memberName === 'string' ? memberName : 'Unknown member',
          memberUniqueId: uniqueId ?? null,
          birthdate: birthdate ?? null,
          pendingHealthBalance: pending,
          newLifeInsuranceStatus: status ?? null,
        };
      });

      setBatchInfo(normalizedBatch);
      setMemberRows(rows);
    } catch (fetchError) {
      console.error('Failed to load life insurance batch details', fetchError);
      setError('Failed to load life insurance batch details. Please try again.');
      setBatchInfo(null);
      setMemberRows([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBatchData();
  }, [fetchBatchData]);

  const handleBackToList = () => {
    router.push(listRoute);
  };

  const handlePostBatch = async () => {
    if (!id || batchInfo?.posted) return;
    try {
      setActionLoading('post');
      await backendApiClient.lifeInsuranceBatches.post(id);
      await fetchBatchData();
    } catch (postError) {
      console.error('Failed to post life insurance batch', postError);
      setError('Posting batch failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpostBatch = async () => {
    if (!id || !batchInfo?.posted) return;
    try {
      setActionLoading('unpost');
      await backendApiClient.lifeInsuranceBatches.unpost(id);
  setBatchInfo((current: LifeInsuranceBatchSummary | null) => (current ? { ...current, posted: false } : current));
    } catch (unpostError) {
      console.error('Failed to unpost life insurance batch', unpostError);
      setError('Unposting batch failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBatch = async () => {
    if (!id) return;
    if (!confirm('Delete this life insurance batch? This action cannot be undone.')) return;

    try {
      setActionLoading('delete');
      await backendApiClient.lifeInsuranceBatches.delete?.(id);
      router.push(listRoute);
    } catch (deleteError) {
      console.error('Failed to delete life insurance batch', deleteError);
      setError('Failed to delete batch. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = () => {
    fetchBatchData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded bg-gray-200 animate-pulse" />
          <div className="h-8 w-48 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-32 rounded bg-gray-200 animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded bg-gray-200 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBackToList} className="text-union-600 hover:text-union-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button onClick={handleRefresh} className="mt-4 bg-union-600 text-white hover:bg-union-700">
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dateRangeLabel = batchInfo?.start_date && batchInfo?.end_date
    ? `${formatDate(batchInfo.start_date)} through ${formatDate(batchInfo.end_date)}`
    : 'Date range unavailable';

  function sanitizeStatus(status: string | null | undefined) {
    if (!status) return '—';
    // Replace underscores with spaces, downcase, then title case each word
    const normalized = String(status).replace(/_/g, ' ').toLowerCase();
    return normalized.replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" onClick={handleBackToList} className="text-union-600 hover:text-union-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-union-900">Life Insurance Batch</h1>
          <p className="text-muted-foreground">{dateRangeLabel}</p>
        </div>
        <div className="flex gap-2">
          {batchInfo?.posted ? (
            <Button
              variant="outline"
              onClick={handleUnpostBatch}
              disabled={actionLoading === 'unpost'}
              className="border-orange-200 text-orange-600 hover:border-orange-300 hover:text-orange-700"
            >
              {actionLoading === 'unpost' ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Unpost'
              )}
            </Button>
          ) : (
            <Button onClick={handlePostBatch} disabled={actionLoading === 'post'} className="bg-green-600 text-white hover:bg-green-700">
              {actionLoading === 'post' ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Post'
              )}
            </Button>
          )}
          <Button variant="destructive" onClick={handleDeleteBatch} disabled={batchInfo?.posted || actionLoading === 'delete'}>
            {actionLoading === 'delete' ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Report date range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">{dateRangeLabel}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Life insurance threshold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">{formatCurrency(batchInfo?.life_insurance_threshold ?? null)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Months below threshold before life insurance loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">{batchInfo?.months_below_threshold ? `${batchInfo.months_below_threshold} months` : '—'}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Life Insurance Members ({memberRows.length})</CardTitle>
          <CardDescription>Member details and status changes for this batch.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Member</TableHead>
                  <TableHead className="w-[15%]">Member ID</TableHead>
                  <TableHead className="w-[15%]">Birthdate</TableHead>
                    <TableHead className="w-[20%] text-center">Pending Health Balance</TableHead>
                    <TableHead className="w-[15%]">New Life Insurance Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No member records were returned for this batch.
                    </TableCell>
                  </TableRow>
                ) : (
                  memberRows.map((row, index) => {
                    const key = row.id ?? row.memberUniqueId ?? index;
                    return (
                      <TableRow key={key}>
                        <TableCell className="font-medium">{row.memberName}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{row.memberUniqueId || '—'}</TableCell>
                        <TableCell>{row.birthdate ? formatDate(row.birthdate) : '—'}</TableCell>
                        <TableCell className="font-mono text-sm text-center">{formatCurrency(row.pendingHealthBalance)}</TableCell>
                        <TableCell>{sanitizeStatus(row.newLifeInsuranceStatus)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

