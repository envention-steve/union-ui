'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, RotateCcw, Trash2, ChevronLeft, ChevronRight, RefreshCw, Calendar } from 'lucide-react';
import { backendApiClient } from '@/lib/api-client';
import { AccountContribution } from '@/types';
import { useRouter } from 'next/navigation';

export default function AccountContributionPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [contributions, setContributions] = useState<any[]>([]);
  const [totalContributions, setTotalContributions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, statusFilter, typeFilter]);

  // Fetch contributions from API
  const fetchContributions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await backendApiClient.accountContributions.list({
        page: currentPage,
        limit: itemsPerPage,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });

      if (response && Array.isArray(response.items)) {
        // Transform API response to match component expectations
        const transformedContributions = response.items.map((item: any) => ({
          id: item.id,
          date_range: item.start_date && item.end_date 
            ? `${new Date(item.start_date).toLocaleDateString()} - ${new Date(item.end_date).toLocaleDateString()}`
            : item.start_date 
            ? new Date(item.start_date).toLocaleDateString()
            : 'N/A',
          type: item.contribution_type || 'Unknown',
          status: item.posted ? 'Posted' : 'Unposted',
          amount_received: item.amount_received,
          received_date: item.received_date,
          start_date: item.start_date,
          end_date: item.end_date,
          created_at: item.created_at,
          updated_at: item.updated_at,
          suspended: item.suspended
        }));
        
        setContributions(transformedContributions);
        setTotalContributions(response.total);
      } else {
        console.error('Invalid API response:', response);
        setError('Invalid response from server');
        setContributions([]);
        setTotalContributions(0);
      }
    } catch (err) {
      console.error('Error fetching account contributions:', err);
      setError('Failed to load account contributions. Please try again.');
      setContributions([]);
      setTotalContributions(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch contributions on component mount and when filters change
  useEffect(() => {
    fetchContributions();
  }, [currentPage, itemsPerPage, startDate, endDate, statusFilter, typeFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(totalContributions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Action handlers
  const handleViewContribution = (id: number) => {
    // Find the contribution data to pass to detail page
    const contributionData = contributions.find(c => c.id === id);
    if (contributionData) {
      // Pass key batch info as URL params so detail page doesn't need separate API call
      const params = new URLSearchParams({
        mode: 'view',
        posted: contributionData.status === 'Posted' ? 'true' : 'false',
        start_date: contributionData.start_date || '',
        end_date: contributionData.end_date || '',
        contribution_type: contributionData.type || '',
        amount_received: contributionData.amount_received?.toString() || '0'
      });
      router.push(`/dashboard/batches/account-contribution/${id}?${params.toString()}`);
    } else {
      router.push(`/dashboard/batches/account-contribution/${id}?mode=view`);
    }
  };

  const handleUnpostContribution = async (id: number) => {
    if (!confirm('Are you sure you want to unpost this contribution?')) return;
    try {
      await backendApiClient.accountContributions.unpost(String(id));
      fetchContributions();
    } catch (err) {
      console.error('Failed to unpost contribution', err);
      setError('Failed to unpost contribution.');
    }
  };

  const handleDeleteContribution = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contribution? This action cannot be undone.')) return;
    try {
      await backendApiClient.accountContributions.delete(String(id));
      fetchContributions();
    } catch (err) {
      console.error('Failed to delete contribution', err);
      setError('Failed to delete contribution.');
    }
  };

  const handleReloadList = () => {
    fetchContributions();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'posted':
        return 'bg-green-100 text-green-800';
      case 'unposted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatContributionType = (type: string) => {
    // Convert snake_case and UPPER_CASE to readable format
    return type
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-union-900">Account Contributions</h1>
          <p className="text-muted-foreground">
            Manage account contribution batches and their posting status
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReloadList}
            className="text-union-600 hover:text-union-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload List
          </Button>
          <Button className="bg-union-600 hover:bg-union-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Contribution
          </Button>
        </div>
      </div>

      {/* Date Range and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Date Range & Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Posted">Posted</SelectItem>
                  <SelectItem value="Unposted">Unposted</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="SELF_PAY">Self Pay</SelectItem>
                  <SelectItem value="HEALTH_FUND_BONUS">Health Fund Bonus</SelectItem>
                </SelectContent>
              </Select>

              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                <SelectTrigger className="w-[70px]">
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
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button 
                onClick={fetchContributions} 
                className="mt-4 bg-union-600 hover:bg-union-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contributions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Account Contributions ({loading ? '...' : totalContributions})
          </CardTitle>
          <CardDescription>
            {loading 
              ? 'Loading contributions...' 
              : `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, totalContributions)} of ${totalContributions} entries`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={`loading-${i}`}>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div></TableCell>
                      <TableCell><div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div></TableCell>
                    </TableRow>
                  ))
                ) : contributions.length === 0 ? (
                  // Empty state
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {startDate || endDate || statusFilter || typeFilter
                        ? 'No contributions found matching your criteria.' 
                        : 'No contributions found.'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  // Contribution rows
                  contributions.map((contribution) => (
                    <TableRow key={contribution.id}>
                      <TableCell className="font-mono text-sm">
                        {contribution.date_range}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {formatContributionType(contribution.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {contribution.amount_received ? 
                          `$${contribution.amount_received.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(contribution.status)}>
                          {contribution.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => handleViewContribution(contribution.id)}
                            title="Show details"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Show Details</span>
                          </Button>
                          
                          {contribution.status === 'Posted' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-orange-600"
                              onClick={() => handleUnpostContribution(contribution.id)}
                              title="Unpost contribution"
                            >
                              <RotateCcw className="h-4 w-4" />
                              <span className="sr-only">Unpost</span>
                            </Button>
                          )}
                          
                          {contribution.status === 'Unposted' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-red-600"
                              onClick={() => handleDeleteContribution(contribution.id)}
                              title="Delete contribution"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
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

      {/* Pagination */}
      {!loading && totalContributions > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalContributions)} of {totalContributions} entries
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else {
                  const start = Math.max(1, currentPage - 2);
                  const end = Math.min(totalPages, start + 4);
                  page = start + i;
                  if (page > end) return null;
                }
                
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className={currentPage === page ? "bg-union-600 hover:bg-union-700" : ""}
                    onClick={() => setCurrentPage(page)}
                    disabled={loading}
                  >
                    {page}
                  </Button>
                );
              }).filter(Boolean)}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}