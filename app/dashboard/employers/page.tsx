'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { backendApiClient } from '@/lib/api-client';
import { Employer } from '@/types';
import { useRouter } from 'next/navigation';


export default function EmployersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [totalEmployers, setTotalEmployers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on new search
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch employers from API
  const fetchEmployers = async () => {
    try {
      setLoading(true);
      setError(null);

      let transformedEmployers: Employer[] = [];
      let total = 0;

      const response = await backendApiClient.employers.list({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm || undefined,
      });
      // Defensive check to ensure response.items is an array
      if (response && Array.isArray(response.items)) {
        transformedEmployers = response.items as Employer[];
        total = response.total as number;
      } else {
        console.error('List response.items is not an array:', response);
        transformedEmployers = [];
        total = 0;
      }
      
      setEmployers(transformedEmployers);
      setTotalEmployers(total);
    } catch (err) {
      console.error('Error fetching employers:', err);
      setError('Failed to load employers. Please try again.');
      setEmployers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employers on component mount and when filters change
  useEffect(() => {
    fetchEmployers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, debouncedSearchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(totalEmployers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  const paginatedEmployers = employers;


  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Action handlers
  const handleViewEmployer = (id: number) => {
    router.push(`/dashboard/employers/${id}?mode=view`);
  };
  const handleEditEmployer = (id: number) => {
    router.push(`/dashboard/employers/${id}?mode=edit`);
  };
  const handleDeleteEmployer = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this employer?')) return;
    try {
      await backendApiClient.employers.delete(String(id));
      fetchEmployers();
    } catch (err) {
      console.error('Failed to deactivate employer', err);
      setError('Failed to deactivate employer.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-union-900">Employers Management</h1>
          <p className="text-muted-foreground">
            Manage employers and their member associations
          </p>
        </div>
        <Button className="bg-union-600 hover:bg-union-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add Employer
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4">
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
                onClick={fetchEmployers} 
                className="mt-4 bg-union-600 hover:bg-union-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Employers ({loading ? '...' : totalEmployers})
          </CardTitle>
          <CardDescription>
            {loading 
              ? 'Loading employers...' 
              : `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, totalEmployers)} of ${totalEmployers} entries`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={`loading-${i}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div></TableCell>
                      <TableCell><div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div></TableCell>
                    </TableRow>
                  ))
                ) : paginatedEmployers.length === 0 ? (
                  // Empty state
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      {searchTerm 
                        ? 'No employers found matching your criteria.' 
                        : 'No employers found.'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  // Employer rows
                  paginatedEmployers.map((employer) => (
                    <TableRow key={employer.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-union-100 text-union-900">
                              {getInitials(employer.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{employer.name}</div>
                            {employer.tax_id && (
                              <div className="text-sm text-muted-foreground">EIN: {employer.tax_id}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {employer.employer_type?.name || 'Not specified'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => handleViewEmployer(employer.id)}
                            aria-label="View Details"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEditEmployer(employer.id)}
                            aria-label="Edit Employer"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Employer</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-red-600"
                            onClick={() => handleDeleteEmployer(employer.id)}
                            aria-label="Deactivate"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Deactivate</span>
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

      {/* Pagination */}
      {!loading && totalEmployers > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalEmployers)} of {totalEmployers} entries
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