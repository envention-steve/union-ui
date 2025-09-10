'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { backendApiClient } from '@/lib/api-client';
import { Member } from '@/types';


export default function MembersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [members, setMembers] = useState<Member[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
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

  // Fetch members from API
  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await backendApiClient.members.list({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm || undefined
      });
      
      // Transform API data to match UI expectations
      const transformedMembers: Member[] = response.items.map((member: any) => ({
        ...member,
        full_name: `${member.first_name} ${member.last_name}`,
        member_id: member.unique_id,
        employer: 'N/A', // TODO: Get from relationships
        plan: 'N/A', // TODO: Get from relationships
        status: member.deceased ? 'Inactive' : (member.disabled_waiver ? 'Pending' : 'Active')
      }));
      
      setMembers(transformedMembers);
      setTotalMembers(response.total);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to load members. Please try again.');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch members on component mount and when filters change
  useEffect(() => {
    fetchMembers();
  }, [currentPage, itemsPerPage, debouncedSearchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(totalMembers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  // Filter members client-side for status (since API doesn't support status filtering yet)
  const filteredMembers = statusFilter === 'all' 
    ? members 
    : members.filter(member => member.status?.toLowerCase() === statusFilter.toLowerCase());
  
  const paginatedMembers = filteredMembers;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Inactive':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Action handlers (TODO: wire to routes/modals)
  const handleViewMember = (id: number) => {
    console.log('View member', id);
  };
  const handleEditMember = (id: number) => {
    console.log('Edit member', id);
  };
  const handleDeleteMember = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this member?')) return;
    try {
      await backendApiClient.members.delete(String(id));
      fetchMembers();
    } catch (err) {
      console.error('Failed to deactivate member', err);
      setError('Failed to deactivate member.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-union-900">Members Management</h1>
          <p className="text-muted-foreground">
            Manage union members and their benefit enrollments
          </p>
        </div>
        <Button className="bg-union-600 hover:bg-union-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add Member
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
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
                onClick={fetchMembers} 
                className="mt-4 bg-union-600 hover:bg-union-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Members ({loading ? '...' : totalMembers})
          </CardTitle>
          <CardDescription>
            {loading 
              ? 'Loading members...' 
              : `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, totalMembers)} of ${totalMembers} entries`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Employer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
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
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-48"></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></TableCell>
                      <TableCell><div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div></TableCell>
                      <TableCell><div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div></TableCell>
                    </TableRow>
                  ))
                ) : paginatedMembers.length === 0 ? (
                  // Empty state
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'No members found matching your criteria.' 
                        : 'No members found.'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  // Member rows
                  paginatedMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-union-100 text-union-900">
                              {getInitials(member.full_name || `${member.first_name} ${member.last_name}`)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.full_name || `${member.first_name} ${member.last_name}`}</div>
                            <div className="text-sm text-muted-foreground">{member.email || 'No email'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{member.member_id || member.unique_id}</TableCell>
                      <TableCell>{member.employer}</TableCell>
                      <TableCell>{member.plan}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(member.status || 'Active')} className={
                          member.status === 'Active' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : member.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }>
                          {member.status || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => handleViewMember(member.id)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEditMember(member.id)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Member</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-red-600"
                            onClick={() => handleDeleteMember(member.id)}
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
      {!loading && totalMembers > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalMembers)} of {totalMembers} entries
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
