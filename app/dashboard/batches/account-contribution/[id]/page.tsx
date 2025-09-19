'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, DollarSign, Users, Calendar, CheckCircle, XCircle, Edit } from 'lucide-react';
import { backendApiClient } from '@/lib/api-client';

interface MemberContribution {
  member_name: string;
  amount: number;
}

interface BatchDetailsResponse {
  batch_id: number;
  member_contributions: MemberContribution[];
}

interface BatchInfo {
  id: number;
  start_date: string;
  end_date: string;
  contribution_type: string;
  amount_received: number;
  posted: boolean;
  suspended: boolean;
  received_date: string;
  created_at: string;
  updated_at: string;
  account_type?: string;
}

export default function AccountContributionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const mode = searchParams?.get('mode') || 'view';
  const accountTypeParam = searchParams?.get('account_type') || undefined;
  
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [batchDetails, setBatchDetails] = useState<BatchDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'post' | 'unpost' | null>(null);

  const listRoute = '/dashboard/batches/account-contribution';

  const fetchBatchData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);

      // Get batch info and details in parallel
      const [batchInfoResponse, detailsResponse] = await Promise.all([
        backendApiClient.accountContributions.get(id),
        backendApiClient.accountContributions.getDetails(id)
      ]);
      
      const effectiveAccountType = batchInfoResponse?.account_type ?? accountTypeParam ?? batchInfoResponse?.account_type;
      setBatchInfo({ ...batchInfoResponse, account_type: effectiveAccountType });
      setBatchDetails(detailsResponse);
    } catch (err) {
      console.error('Error fetching batch data:', err);
      setError('Failed to load batch details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchData();
  }, [id]);

  const handlePostBatch = async () => {
    if (!id || !batchInfo) return;
    
    try {
      setActionLoading('post');
      await backendApiClient.accountContributions.post(id);
      
      // Update the local state to reflect the change
      setBatchInfo({ ...batchInfo, posted: true });
    } catch (err) {
      console.error('Error posting batch:', err);
      setError('Failed to post batch. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpostBatch = async () => {
    if (!id || !batchInfo) return;
    
    try {
      setActionLoading('unpost');
      await backendApiClient.accountContributions.unpost(id);
      
      // Update the local state to reflect the change
      setBatchInfo({ ...batchInfo, posted: false });
    } catch (err) {
      console.error('Error unposting batch:', err);
      setError('Failed to unpost batch. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditBatch = () => {
    // Navigate to edit page
    const accountTypeForEdit = batchInfo?.account_type ?? accountTypeParam;
    const params = new URLSearchParams();
    if (accountTypeForEdit) {
      params.set('account_type', accountTypeForEdit);
    }
    const query = params.toString();
    router.push(`/dashboard/batches/account-contribution/${id}/edit${query ? `?${query}` : ''}`);
  };

  const handleBackToList = () => {
    router.push(listRoute);
  };

  const formatContributionType = (type: string) => {
    return type
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getTotalContributions = () => {
    if (!batchDetails?.member_contributions) return 0;
    return batchDetails.member_contributions.reduce((sum, contrib) => sum + contrib.amount, 0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={handleBackToList}
            className="text-union-600 hover:text-union-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button 
                onClick={fetchBatchData} 
                className="mt-4 bg-union-600 hover:bg-union-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={handleBackToList}
            className="text-union-600 hover:text-union-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-union-900">Account Contribution</h1>
            <p className="text-muted-foreground">
              {batchInfo?.start_date && batchInfo?.end_date
                ? `${formatDate(batchInfo.start_date)} through ${formatDate(batchInfo.end_date)}`
                : 'Contribution batch details'
              } for <Badge className="mx-1 bg-cyan-100 text-cyan-800">Health and Welfare</Badge> accounts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Conditional Action Buttons */}
          {batchInfo?.posted ? (
            <Button
              variant="outline"
              onClick={handleUnpostBatch}
              disabled={actionLoading === 'unpost'}
              className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
            >
              {actionLoading === 'unpost' ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Unpost
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleEditBatch}
                className="text-union-600 hover:text-union-700"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                onClick={handlePostBatch}
                disabled={actionLoading === 'post'}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {actionLoading === 'post' ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Post
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={fetchBatchData}
            className="text-union-600 hover:text-union-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(getTotalContributions())}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {batchDetails?.member_contributions?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={batchInfo?.posted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
              {batchInfo?.posted ? 'Posted' : 'Unposted'}
            </Badge>
          </CardContent>
        </Card>
      </div>


      {/* Member Contributions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Member Contributions ({batchDetails?.member_contributions?.length || 0})
          </CardTitle>
          <CardDescription>
            Individual member contributions for this batch
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-3/4">Member</TableHead>
                  <TableHead className="text-right">Contribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchDetails?.member_contributions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      No member contributions found for this batch.
                    </TableCell>
                  </TableRow>
                ) : (
                  batchDetails?.member_contributions?.map((contribution, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {contribution.member_name}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className="text-muted-foreground mr-1">$</span>
                        {contribution.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
