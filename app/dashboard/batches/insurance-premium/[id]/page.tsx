'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle,
  Edit,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { backendApiClient } from '@/lib/api-client';

interface InsurancePremiumBatchSummary {
  id: number;
  start_date?: string;
  end_date?: string;
  posted?: boolean;
  suspended?: boolean;
  created_at?: string;
  updated_at?: string;
  total_due?: number | null;
  total_members?: number | null;
}

interface InsurancePremiumMemberRow {
  id: number | null;
  memberName: string;
  memberId: number | null;
  memberUniqueId: string | null;
  status: string;
  action: string;
  totalDue: number | null;
  healthBalance: number | null;
  newBalance: number | null;
}

type InsurancePremiumDetailsResponse = {
  [key: string]: any;
};

const listRoute = '/dashboard/batches/insurance-premium';

const parseNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const direct = Number(trimmed);
    if (!Number.isNaN(direct)) return direct;
    const cleaned = trimmed.replace(/[$,]/g, '');
    const cleanedNumber = Number(cleaned);
    return Number.isNaN(cleanedNumber) ? null : cleanedNumber;
  }
  return null;
};

const parseBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    return normalized === 'true' || normalized === 'posted' || normalized === 'yes';
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return false;
};

const formatMemberName = (item: any): string => {
  if (typeof item?.member_name === 'string' && item.member_name.trim().length > 0) {
    return item.member_name.trim();
  }

  const member = item?.member ?? {};
  if (typeof member.full_name === 'string' && member.full_name.trim().length > 0) {
    return member.full_name.trim();
  }

  const first = typeof member.first_name === 'string' ? member.first_name.trim() : '';
  const last = typeof member.last_name === 'string' ? member.last_name.trim() : '';

  if (first && last) return `${last}, ${first}`;
  if (last) return last;
  if (first) return first;

  return 'Unknown member';
};

const deriveMemberId = (item: any): number | null => {
  const direct = parseNumber(item?.member_id);
  if (direct !== null) return direct;

  const nested = parseNumber(item?.member?.id);
  return nested;
};

const deriveMemberUniqueId = (item: any): string | null => {
  if (typeof item?.member_unique_id === 'string' && item.member_unique_id.trim().length > 0) {
    return item.member_unique_id.trim();
  }

  if (typeof item?.member?.unique_id === 'string' && item.member.unique_id.trim().length > 0) {
    return item.member.unique_id.trim();
  }

  return null;
};

const deriveRowStatus = (item: any): string => {
  if (typeof item?.status === 'string' && item.status.trim().length > 0) {
    return item.status.trim();
  }

  if (parseBoolean(item?.active)) {
    return 'Active';
  }

  if (parseBoolean(item?.suspended)) {
    return 'Suspended';
  }

  return 'Inactive';
};

const deriveRowAction = (item: any): string => {
  if (typeof item?.action === 'string' && item.action.trim().length > 0) {
    return item.action.trim();
  }

  if (parseBoolean(item?.suspended)) {
    return 'Suspended';
  }

  if (parseBoolean(item?.posted)) {
    return 'Posted';
  }

  return 'Not suspended or posted';
};

const extractDetailItems = (data: InsurancePremiumDetailsResponse | null | undefined): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  const candidateKeys = [
    'items',
    'entries',
    'member_details',
    'members',
    'details',
    'insurance_premium_entries',
    'insurance_premium_members',
    'insurance_premiums',
    'premium_details',
  ];

  for (const key of candidateKeys) {
    if (Array.isArray((data as Record<string, unknown>)[key])) {
      return (data as Record<string, any>)[key];
    }
  }

  return [];
};

const extractBatchMetadata = (
  source: InsurancePremiumDetailsResponse | null | undefined
): InsurancePremiumBatchSummary | null => {
  if (!source) {
    return null;
  }

  const fromObject = Array.isArray(source) ? {} : (source as Record<string, any>);
  const nestedBatch = !Array.isArray(source)
    ? (fromObject?.batch ?? fromObject?.batch_info ?? fromObject?.summary ?? {})
    : {};

  const bestSource = {
    ...(nestedBatch || {}),
    ...(fromObject || {}),
  } as Record<string, any>;

  const id = parseNumber(bestSource.id) ?? parseNumber(bestSource.batch_id) ?? parseNumber(bestSource?.batch?.id);

  return {
    id: id ?? 0,
    start_date: bestSource.start_date ?? bestSource.batch_start_date ?? nestedBatch?.start_date,
    end_date: bestSource.end_date ?? bestSource.batch_end_date ?? nestedBatch?.end_date,
    posted: parseBoolean(bestSource.posted),
    suspended: parseBoolean(bestSource.suspended),
    created_at: bestSource.created_at,
    updated_at: bestSource.updated_at,
    total_due: parseNumber(bestSource.total_due) ?? null,
    total_members: parseNumber(bestSource.total_members) ?? null,
  };
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (value?: string): string => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString();
};

const computeStatusBadge = (batch: InsurancePremiumBatchSummary | null) => {
  if (!batch) {
    return { label: 'Unknown', className: 'bg-gray-100 text-gray-800' };
  }

  if (batch.suspended) {
    return { label: 'Suspended', className: 'bg-red-100 text-red-800' };
  }

  if (batch.posted) {
    return { label: 'Posted', className: 'bg-green-100 text-green-800' };
  }

  return { label: 'Unposted', className: 'bg-yellow-100 text-yellow-800' };
};

export default function InsurancePremiumBatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const mode = searchParams?.get('mode') || 'view';
  const isEditMode = mode === 'edit';

  const [batchInfo, setBatchInfo] = useState<InsurancePremiumBatchSummary | null>(null);
  const [memberRows, setMemberRows] = useState<InsurancePremiumMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'post' | 'unpost' | 'delete' | null>(null);
  const [actionSortOrder, setActionSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchBatchData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const detailsResponse = await backendApiClient.insurancePremiumBatches.getDetails(id);

      const normalizedBatch = extractBatchMetadata(detailsResponse) ?? null;

      const detailItems = extractDetailItems(detailsResponse);
      const normalizedRows: InsurancePremiumMemberRow[] = detailItems
        .map((item: any): InsurancePremiumMemberRow | null => {
          const memberName = formatMemberName(item);
          const memberId = deriveMemberId(item);
          const memberUniqueId = deriveMemberUniqueId(item);
          const status = deriveRowStatus(item);
          const action = deriveRowAction(item);
          const totalDue = parseNumber(item?.total_due);
          const healthBalance = parseNumber(item?.health_balance ?? item?.current_health_balance ?? item?.health_balance_due);
          const newBalance = parseNumber(item?.new_balance ?? item?.resulting_balance ?? item?.updated_balance);
          const rowId = parseNumber(item?.id) ?? null;

          return {
            id: rowId,
            memberName,
            memberId,
            memberUniqueId,
            status,
            action,
            totalDue,
            healthBalance,
            newBalance,
          };
        })
        .filter((row): row is InsurancePremiumMemberRow => Boolean(row));

      setBatchInfo(normalizedBatch);
      setMemberRows(normalizedRows);
    } catch (fetchError) {
      console.error('Failed to load insurance premium batch details', fetchError);
      setError('Failed to load insurance premium batch details. Please try again.');
      setBatchInfo(null);
      setMemberRows([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBatchData();
  }, [fetchBatchData]);

  const sortedRows = useMemo(() => {
    const rows = [...memberRows];
    rows.sort((a, b) => {
      const actionA = (a.action || '').toLowerCase();
      const actionB = (b.action || '').toLowerCase();
      if (actionSortOrder === 'asc') {
        return actionA.localeCompare(actionB);
      }
      return actionB.localeCompare(actionA);
    });
    return rows;
  }, [memberRows, actionSortOrder]);

  const handleBackToList = () => {
    router.push(listRoute);
  };

  const handlePostBatch = async () => {
    if (!id || batchInfo?.posted) return;
    try {
      setActionLoading('post');
      await backendApiClient.insurancePremiumBatches.post(id);
      await fetchBatchData();
    } catch (postError) {
      console.error('Failed to post insurance premium batch', postError);
      setError('Posting batch failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpostBatch = async () => {
    if (!id || !batchInfo?.posted) return;
    try {
      setActionLoading('unpost');
      await backendApiClient.insurancePremiumBatches.unpost(id);
      setBatchInfo((current) => (current ? { ...current, posted: false } : current));
    } catch (unpostError) {
      console.error('Failed to unpost insurance premium batch', unpostError);
      setError('Unposting batch failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBatch = async () => {
    if (!id) return;
    if (!confirm('Delete this insurance premium batch? This action cannot be undone.')) return;

    try {
      setActionLoading('delete');
      await backendApiClient.insurancePremiumBatches.delete?.(id);
      router.push(listRoute);
    } catch (deleteError) {
      console.error('Failed to delete insurance premium batch', deleteError);
      setError('Failed to delete batch. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = () => {
    fetchBatchData();
  };

  const handleEnterEditMode = () => {
    if (!id) return;
    const params = new URLSearchParams(searchParams?.toString());
    if (isEditMode) {
      params.delete('mode');
    } else {
      params.set('mode', 'edit');
    }
    const query = params.toString();
    router.replace(`/dashboard/batches/insurance-premium/${id}${query ? `?${query}` : ''}`);
  };

  const toggleActionSortOrder = () => {
    setActionSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'));
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

  const { label: statusLabel, className: statusClass } = computeStatusBadge(batchInfo);
  const dateRangeLabel = batchInfo?.start_date && batchInfo?.end_date
    ? `${formatDate(batchInfo.start_date)} through ${formatDate(batchInfo.end_date)}`
    : 'Date range unavailable';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" onClick={handleBackToList} className="text-union-600 hover:text-union-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-union-900">Insurance Premium Batch</h1>
              <Badge className={statusClass}>{statusLabel}</Badge>
              {isEditMode && <Badge variant="outline">Edit mode</Badge>}
            </div>
            <p className="text-muted-foreground">{dateRangeLabel}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!batchInfo?.posted && (
            <Button variant="outline" onClick={handleEnterEditMode} className="text-union-600 hover:text-union-700">
              <Edit className="mr-2 h-4 w-4" />
              {isEditMode ? 'Exit edit' : 'Edit'}
            </Button>
          )}
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
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Unpost
            </Button>
          ) : (
            <Button
              onClick={handlePostBatch}
              disabled={actionLoading === 'post'}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {actionLoading === 'post' ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Post
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={handleDeleteBatch}
            disabled={batchInfo?.posted || actionLoading === 'delete'}
          >
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
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberRows.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Posted: {batchInfo?.posted ? 'Yes' : 'No'}</p>
              <p className="text-sm text-muted-foreground">Suspended: {batchInfo?.suspended ? 'Yes' : 'No'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Insurance Premium Members ({memberRows.length})</CardTitle>
          <CardDescription>Member details and contribution impacts for this batch.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[22%]">Member</TableHead>
                  <TableHead className="w-[12%]">Member ID</TableHead>
                  <TableHead className="w-[16%]">Status</TableHead>
                  <TableHead
                    className="w-[18%]"
                    aria-sort={actionSortOrder === 'asc' ? 'ascending' : 'descending'}
                  >
                    <button
                      type="button"
                      onClick={toggleActionSortOrder}
                      className="flex items-center gap-1 text-left font-medium text-sm text-muted-foreground hover:text-foreground"
                    >
                      <span>Action</span>
                      {actionSortOrder === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="w-[12%] text-right">Total Due</TableHead>
                  <TableHead className="w-[10%] text-right">Health Balance</TableHead>
                  <TableHead className="w-[10%] text-right">New Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No member records were returned for this batch.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRows.map((row, index) => {
                    const key = row.id ?? row.memberUniqueId ?? row.memberId ?? index;
                    return (
                      <TableRow key={key}>
                        <TableCell className="font-medium">{row.memberName}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {row.memberUniqueId || '—'}
                        </TableCell>
                        <TableCell>{row.status}</TableCell>
                        <TableCell>{row.action}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.totalDue)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.healthBalance)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(row.newBalance)}</TableCell>
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
