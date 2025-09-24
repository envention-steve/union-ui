'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { backendApiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

interface AnnuityInterest {
  id: number;
  fiscal_year_start: string;
  fiscal_year_end: string;
  rate: number;
  posted_date: string;
}

export default function AnnuityInterestPage() {
  const router = useRouter();
  const [annuityInterests, setAnnuityInterests] = useState<AnnuityInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnuityInterests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await backendApiClient.annuity_interests.list();
      if (response && Array.isArray(response.items)) {
        setAnnuityInterests(response.items);
      } else {
        console.error('List response.items is not an array:', response);
        setAnnuityInterests([]);
      }
    } catch (err) {
      console.error('Error fetching annuity interests:', err);
      setError('Failed to load annuity interests. Please try again.');
      setAnnuityInterests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnuityInterests();
  }, []);

  const handleShow = (id: number) => {
    // TODO: Implement show functionality
    console.log('Show:', id);
  };

  const handleEdit = (id: number) => {
    // TODO: Implement edit functionality
    console.log('Edit:', id);
  };

  const handleDestroy = async (id: number) => {
    if (!confirm('Are you sure you want to delete this annuity interest?')) return;
    try {
      await backendApiClient.annuity_interests.delete(String(id));
      fetchAnnuityInterests();
    } catch (err) {
      console.error('Failed to delete annuity interest', err);
      setError('Failed to delete annuity interest.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-union-900">Annuity Interest Batches</h1>
          <p className="text-muted-foreground">
            Manage annuity interest batches.
          </p>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button
                onClick={fetchAnnuityInterests}
                className="mt-4 bg-union-600 hover:bg-union-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Annuity Interests ({loading ? '...' : annuityInterests.length})
          </CardTitle>
          <CardDescription>
            {loading
              ? 'Loading annuity interests...'
              : `Showing ${annuityInterests.length} entries`
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
                  Array.from({ length: 5 }, (_, i) => (
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
                        {interest.fiscal_year_start} through {interest.fiscal_year_end}
                      </TableCell>
                      <TableCell>
                        Rate of {interest.rate} posted on {interest.posted_date}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => handleShow(interest.id)}
                            aria-label="Show"
                          >
                            Show
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEdit(interest.id)}
                            aria-label="Edit"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-red-600"
                            onClick={() => handleDestroy(interest.id)}
                            aria-label="Destroy"
                          >
                            Destroy
                          </Button>
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
    </div>
  );
}
