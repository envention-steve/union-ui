'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { backendApiClient } from '@/lib/api-client';
import { InsurancePlan } from '@/types';
import { useRouter } from 'next/navigation';

export default function InsurancePlansPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>([]);
  const [totalInsurancePlans, setTotalInsurancePlans] = useState(0);
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

  // Fetch insurance plans from API
  const fetchInsurancePlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let responseItems: InsurancePlan[] = [];
      let total = 0;

      if (debouncedSearchTerm && backendApiClient.insurancePlans.autocomplete) {
        const response = await backendApiClient.insurancePlans.autocomplete(debouncedSearchTerm);
        if (Array.isArray(response)) {
          responseItems = response;
          total = response.length;
        } else {
          console.error('Autocomplete response is not an array:', response);
        }
      } else {
        const response = await backendApiClient.insurancePlans.list({
          page: currentPage,
          limit: itemsPerPage,
        });
        if (response && Array.isArray(response.items)) {
          responseItems = response.items;
          total = response.total;
        } else {
          console.error('List response.items is not an array:', response);
        }
      }

      // Transform and sort API data by code
      const transformedPlans: InsurancePlan[] = responseItems.map((plan: any) => ({
        ...plan,
      })).sort((a: InsurancePlan, b: InsurancePlan) => {
        const codeA = a.code || '';
        const codeB = b.code || '';
        return codeA.localeCompare(codeB);
      });
      
      setInsurancePlans(transformedPlans);
      setTotalInsurancePlans(total);
    } catch (err) {
      console.error('Error fetching insurance plans:', err);
      setError('Failed to load insurance plans. Please try again.');
      setInsurancePlans([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch insurance plans on component mount and when filters change
  useEffect(() => {
    fetchInsurancePlans();
  }, [currentPage, itemsPerPage, debouncedSearchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(totalInsurancePlans / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  const paginatedInsurancePlans = insurancePlans;

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Action handlers
  const handleViewPlan = (id: number) => {
    router.push(`/dashboard/insurance-plans/${id}?mode=view`);
  };
  
  const handleEditPlan = (id: number) => {
    router.push(`/dashboard/insurance-plans/${id}?mode=edit`);
  };
  
  const handleDeletePlan = async (id: number) => {
    if (!confirm('Are you sure you want to delete this insurance plan?')) return;
    try {
      await backendApiClient.insurancePlans.delete(String(id));
      fetchInsurancePlans();
    } catch (err) {
      console.error('Failed to delete insurance plan', err);
      setError('Failed to delete insurance plan.');
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'HEALTH': 'bg-green-100 text-green-800',
      'DENTAL': 'bg-blue-100 text-blue-800',
      'VISION': 'bg-purple-100 text-purple-800',
      'OTHER': 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.OTHER;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-union-900">Insurance Plans Management</h1>
          <p className="text-muted-foreground">
            Manage insurance plans and their coverage details
          </p>
        </div>
        <Button className="bg-union-600 hover:bg-union-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add Insurance Plan
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
                placeholder="Search insurance plans..."
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
                onClick={fetchInsurancePlans} 
                className="mt-4 bg-union-600 hover:bg-union-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insurance Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Insurance Plans ({loading ? '...' : totalInsurancePlans})
          </CardTitle>
          <CardDescription>
            {loading 
              ? 'Loading insurance plans...' 
              : `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, totalInsurancePlans)} of ${totalInsurancePlans} entries`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Insurance Plan Name</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={`loading-${i}`}>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div></TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div></TableCell>
                      <TableCell><div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div></TableCell>
                    </TableRow>
                  ))
                ) : paginatedInsurancePlans.length === 0 ? (
                  // Empty state
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {searchTerm 
                        ? 'No insurance plans found matching your criteria.' 
                        : 'No insurance plans found.'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  // Insurance Plan rows
                  paginatedInsurancePlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {plan.code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-union-100 text-union-900">
                              <Shield className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{plan.name}</div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(plan.type)}`}>
                              {plan.type}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{plan.group}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => handleViewPlan(plan.id)}
                            aria-label="View Details"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEditPlan(plan.id)}
                            aria-label="Edit Plan"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Plan</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-red-600"
                            onClick={() => handleDeletePlan(plan.id)}
                            aria-label="Delete Plan"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete Plan</span>
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
      {!loading && totalInsurancePlans > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalInsurancePlans)} of {totalInsurancePlans} entries
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