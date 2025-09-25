'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Pencil, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { backendApiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { AddInterestDialog } from '@/components/features/annuity/add-interest-dialog';

interface FiscalYear {
  id: number;
  start_date: string;
  end_date: string;
}

interface AnnuityInterest {
  id: number;
  fiscal_year_id: number;
  fiscal_year?: FiscalYear;
  rate: number;
  posted_date: string;
  posted?: boolean;
}

export default function AnnuityInterestPage() {
  useRouter();
  const [annuityInterests, setAnnuityInterests] = useState<AnnuityInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalInterests, setTotalInterests] = useState(0);
  const [isAddInterestDialogOpen, setIsAddInterestDialogOpen] = useState(false);

  const fetchAnnuityInterests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await backendApiClient.annuityInterests.list({
        page: currentPage,
        limit: itemsPerPage,
      });
      if (response && Array.isArray(response.items)) {
        setAnnuityInterests(response.items);
        let total = 0;
        if (typeof response.total === 'number') {
          total = response.total;
        } else {
          total = response.items.length;
        }
        setTotalInterests(total);
      } else {
        console.error('List response.items is not an array:', response);
        setAnnuityInterests([]);
        setTotalInterests(0);
      }
    } catch (err) {
      console.error('Error fetching annuity interests:', err);
      setError('Failed to load annuity interests. Please try again.');
      setAnnuityInterests([]);
      setTotalInterests(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnuityInterests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  const handlePostToggle = (id: number) => {
    console.log('Post/Unpost:', id);
  };

  const handleEdit = (id: number) => {
    console.log('Edit:', id);
  };

  const handleDestroy = async (id: number) => {
    if (!confirm('Are you sure you want to delete this annuity interest?')) return;
    try {
      await backendApiClient.annuityInterests.delete(String(id));
      fetchAnnuityInterests();
    } catch (err) {
      console.error('Failed to delete annuity interest', err);
      setError('Failed to delete annuity interest.');
    }
  };

  const totalPages = itemsPerPage === 0 ? 1 : Math.max(1, Math.ceil(totalInterests / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalInterests);

  return (
    <>
      <AddInterestDialog
        open={isAddInterestDialogOpen}
        onOpenChange={setIsAddInterestDialogOpen}
        onInterestAdded={() => {
          fetchAnnuityInterests();
          setCurrentPage(1); // Reset to first page to see the new entry
        }}
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-union-900">Annuity Interest Batches</h1>
            <p className="text-muted-foreground">
              Manage annuity interest batches.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-union-600 hover:bg-union-700 text-white"
              onClick={() => setIsAddInterestDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Interest
            </Button>
          </div>
        </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Annuity Interests ({loading ? '...' : totalInterests})
          </CardTitle>
          <CardDescription>
            {loading
              ? 'Loading annuity interests...'
              : `Showing ${totalInterests === 0 ? 0 : startIndex + 1} to ${endIndex} of ${totalInterests} entries`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fiscal Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: itemsPerPage }, (_, i) => (
                    <TableRow key={`loading-${i}`}>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div></TableCell>
                      <TableCell><div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div></TableCell>
                    </TableRow>
                  ))
                ) : annuityInterests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No annuity interests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  annuityInterests.map((interest) => (
                    <TableRow key={interest.id}>
                      <TableCell>
                        {interest.fiscal_year && interest.fiscal_year.start_date && interest.fiscal_year.end_date
                          ? `${new Date(interest.fiscal_year.start_date).toLocaleDateString()} through ${new Date(interest.fiscal_year.end_date).toLocaleDateString()}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        Rate of {(interest.rate * 100).toFixed(2)}% posted on {interest.posted_date}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {interest.posted_date ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-orange-600"
                              onClick={() => handlePostToggle(interest.id)}
                              aria-label="Unpost"
                            >
                              <RotateCcw className="h-5 w-5" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                                onClick={() => handleEdit(interest.id)}
                                aria-label="Edit"
                              >
                                <Pencil className="h-5 w-5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                onClick={() => handleDestroy(interest.id)}
                                aria-label="Delete"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page</span>
              <select
                className="border rounded px-2 py-1 bg-white text-sm"
                value={itemsPerPage}
                onChange={e => {
                  setCurrentPage(1);
                  setItemsPerPage(Number(e.target.value));
                }}
              >
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-4 text-sm text-muted-foreground">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
