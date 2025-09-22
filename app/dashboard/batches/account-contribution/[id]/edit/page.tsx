'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Plus, Trash2, Search, UserCheck } from 'lucide-react';
import { backendApiClient } from '@/lib/api-client';

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  unique_id: string;
  full_name: string;
  account_id?: number;
  account_ids?: Array<number | string>;
  accounts?: Array<{ id?: number | string; account_type?: string }>;
  health_account_id?: number | string;
  annuity_account_id?: number | string;
}

interface MemberContribution {
  id?: number;
  member_id: number;
  member_name: string;
  account_id: number;
  amount: number;
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
  account_type?: string;
}

interface FormData {
  member_contributions: MemberContribution[];
}

interface MemberSuggestion extends Member {
  isSelected?: boolean;
  resolvedAccountId?: number;
}

export default function EditAccountContributionBatchPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const accountTypeParam = searchParams?.get('account_type') || undefined;
  
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Autocomplete state
  const [memberSuggestions, setMemberSuggestions] = useState<MemberSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<{ [key: number]: boolean }>({});
  const [searchTerms, setSearchTerms] = useState<{ [key: number]: string }>({});
  const suggestionTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});
  const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const form = useForm<FormData>({
    defaultValues: {
      member_contributions: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "member_contributions"
  });


  // Fetch batch data
  const fetchBatchData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);

      const [batchInfoResponse, detailsResponse] = await Promise.all([
        backendApiClient.accountContributions.get(id),
        backendApiClient.accountContributions.getDetails(id)
      ]);
      
      const effectiveAccountType = batchInfoResponse?.account_type ?? accountTypeParam ?? batchInfoResponse?.account_type;
      setBatchInfo({ ...batchInfoResponse, account_type: effectiveAccountType });
      
      // Set form data
      if (detailsResponse?.member_contributions) {
        const formattedContributions: MemberContribution[] = detailsResponse.member_contributions.map((contrib: any) => ({
          id: contrib.id,
          member_id: contrib.member_id,
          member_name: contrib.member_name,
          account_id: Number(contrib.account_id) || 0,
          amount: contrib.amount
        }));
        
        form.reset({
          member_contributions: formattedContributions
        });

        // Initialize search terms
        const initialSearchTerms: { [key: number]: string } = {};
        formattedContributions.forEach((_, index) => {
          initialSearchTerms[index] = formattedContributions[index].member_name;
        });
        setSearchTerms(initialSearchTerms);
      }
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

  // Ensure input values reflect the current searchTerms state
  useEffect(() => {
    // Force re-render of input components when searchTerms change
    // This is a workaround to ensure controlled inputs update properly
  }, [searchTerms]);

  const normalizeAccountId = (value: number | string | undefined | null) => {
    if (value === undefined || value === null) return undefined;
    const numericId = Number(value);
    return Number.isNaN(numericId) ? undefined : numericId;
  };

  const normalizeDateForApi = (value: string | Date | undefined | null) => {
    if (!value) return undefined;

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return undefined;
      return value.toISOString();
    }

    // If it's already an ISO string, return as-is
    if (typeof value === 'string' && value.includes('T')) {
      return value;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      // If parsing fails, assume the value is already in acceptable format
      if (typeof value === 'string' && value.trim() !== '') return value;
      return undefined;
    }

    return date.toISOString();
  };

  const resolveAccountId = (member: Partial<MemberSuggestion>): number | undefined => {
    const normalizedAccountType = (batchInfo?.account_type ?? accountTypeParam ?? '').toUpperCase();

    if (normalizedAccountType === 'HEALTH') {
      const id = normalizeAccountId(member.health_account_id ?? member.account_id);
      if (id !== undefined) return id;
    }

    if (normalizedAccountType === 'ANNUITY') {
      const id = normalizeAccountId(member.annuity_account_id ?? member.account_id);
      if (id !== undefined) return id;
    }

    const normalizedType = (batchInfo?.account_type ?? accountTypeParam ?? '').toUpperCase();

    if (normalizedType && Array.isArray(member.accounts)) {
      const matchingAccount = member.accounts.find(account => account?.account_type?.toUpperCase() === normalizedType);
      const matchingId = normalizeAccountId(matchingAccount?.id as number | string | undefined);
      if (matchingId !== undefined) return matchingId;
    }

    const fallbackId = normalizeAccountId(member.account_id);
    if (fallbackId !== undefined) return fallbackId;

    if (Array.isArray(member.account_ids)) {
      const firstId = member.account_ids.find(accountId => accountId !== null && accountId !== undefined);
      const normalized = normalizeAccountId(firstId as number | string | undefined);
      if (normalized !== undefined) return normalized;
    }

    if (Array.isArray(member.accounts)) {
      const accountWithId = member.accounts.find(account => account?.id !== undefined);
      const normalized = normalizeAccountId(accountWithId?.id as number | string | undefined);
      if (normalized !== undefined) return normalized;
    }

    return undefined;
  };

  // Member autocomplete functionality
  const searchMembers = async (query: string, fieldIndex: number) => {
    if (!query || query.length < 2) {
      setMemberSuggestions([]);
      setShowSuggestions(prev => ({ ...prev, [fieldIndex]: false }));
      return;
    }

    try {
      const response = await (backendApiClient.members.accountAutocomplete
        ? backendApiClient.members.accountAutocomplete(query)
        : backendApiClient.members.autocomplete?.(query));
      if (Array.isArray(response)) {
        const formattedMembers: MemberSuggestion[] = response.map((member: any) => ({
          ...member,
          full_name: `${member.first_name} ${member.last_name}`.trim(),
          isSelected: false,
          resolvedAccountId: resolveAccountId(member)
        }));
        
        setMemberSuggestions(formattedMembers);
        setShowSuggestions(prev => ({ ...prev, [fieldIndex]: true }));
      }
    } catch (err) {
      console.error('Error searching members:', err);
      setMemberSuggestions([]);
    }
  };

  const handleMemberInputChange = (value: string, fieldIndex: number) => {
    setSearchTerms(prev => ({ ...prev, [fieldIndex]: value }));
    
    // Clear existing timeout
    if (suggestionTimeouts.current[fieldIndex]) {
      clearTimeout(suggestionTimeouts.current[fieldIndex]);
    }

    // Set new timeout for debounced search
    suggestionTimeouts.current[fieldIndex] = setTimeout(() => {
      searchMembers(value, fieldIndex);
    }, 300);

    // Update form field
    form.setValue(`member_contributions.${fieldIndex}.member_name`, value);
  };

  const handleMemberSelect = (member: MemberSuggestion, fieldIndex: number) => {
    // Update both states immediately and synchronously
    setSearchTerms(prev => ({ ...prev, [fieldIndex]: member.full_name }));
    setShowSuggestions(prev => ({ ...prev, [fieldIndex]: false }));
    setMemberSuggestions([]);
    
    // Update form with selected member
    form.setValue(`member_contributions.${fieldIndex}.member_id`, member.id);
    form.setValue(`member_contributions.${fieldIndex}.member_name`, member.full_name);
    const accountId = member.resolvedAccountId ?? resolveAccountId(member);
    if (accountId !== undefined) {
      form.setValue(`member_contributions.${fieldIndex}.account_id`, accountId);
      setError(prev => (prev && prev.includes('matching account')) ? null : prev);
    } else {
      form.setValue(`member_contributions.${fieldIndex}.account_id`, 0);
      setError('Selected member does not have a matching account for this batch type.');
    }
    // Note: when selecting a member via autocomplete, we should also set account_id
    // if the autocomplete API includes account_id. If not, backend details fill it on load.
    
    // Force the input to update by ensuring the ref value is set
    const inputEl = inputRefs.current[fieldIndex];
    if (inputEl) {
      inputEl.value = member.full_name;
    }

    // Focus next input or amount field after a short delay
    setTimeout(() => {
      const nextInput = inputRefs.current[fieldIndex + 1] || 
                       document.querySelector(`input[name="member_contributions.${fieldIndex}.amount"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }, 100);
  };

  const addNewRow = () => {
    const newIndex = fields.length;
    append({
      member_id: 0,
      member_name: '',
      account_id: 0,
      amount: 0
    });
    
    // Initialize search term for new row
    setSearchTerms(prev => ({ ...prev, [newIndex]: '' }));
    
    // Focus the new member name input after a brief delay
    setTimeout(() => {
      const newInput = inputRefs.current[newIndex];
      if (newInput) {
        newInput.focus();
      }
    }, 100);
  };

  const removeRow = (index: number) => {
    remove(index);
    // Clean up refs and state for removed row
    delete inputRefs.current[index];
    const newSearchTerms = { ...searchTerms };
    delete newSearchTerms[index];
    setSearchTerms(newSearchTerms);
    const newShowSuggestions = { ...showSuggestions };
    delete newShowSuggestions[index];
    setShowSuggestions(newShowSuggestions);
  };

  const calculateTotal = () => {
    const contributions = form.watch('member_contributions') || [];
    return contributions.reduce((sum, contrib) => sum + (Number(contrib.amount) || 0), 0);
  };

  const onSubmit = async (data: FormData) => {
    if (!id || !batchInfo) return;
    
    try {
      setSaving(true);
      setError(null);

      // Validate that all rows have member names and amounts
      const invalidRows = data.member_contributions.some((contrib, index) => {
        const memberNameValid = contrib.member_name && contrib.member_name.trim().length > 0;
        const memberIdValid = contrib.member_id && contrib.member_id > 0;
        const amountValid = Number(contrib.amount) > 0;
        const accountIdValid = contrib.account_id && contrib.account_id > 0;
        
        const isInvalid = !memberNameValid || !memberIdValid || !amountValid || !accountIdValid;
        
        return isInvalid;
      });

      if (invalidRows) {
        setError('Please ensure all rows have valid members, linked accounts, and amounts greater than 0.');
        return;
      }

      // Calculate total amount from contributions
      const totalAmount = data.member_contributions.reduce((sum, contrib) => sum + Number(contrib.amount), 0);
      
      const normalizedAccountType = (batchInfo.account_type ?? accountTypeParam ?? '').toUpperCase();
      if (!normalizedAccountType) {
        setError('Unable to determine account type for this batch. Please navigate from the account contributions list and try again.');
        setSaving(false);
        return;
      }
      const normalizedStartDate = normalizeDateForApi(batchInfo.start_date);
      const normalizedEndDate = normalizeDateForApi(batchInfo.end_date);
      const normalizedReceivedDate = normalizeDateForApi(batchInfo.received_date);

      // Prepare the update data using the create schema structure
      const updateData = {
        contribution_type: batchInfo.contribution_type,
        amount_received: totalAmount, // Update total based on contributions
        received_date: normalizedReceivedDate,
        posted: false, // Keep as false when editing
        suspended: batchInfo.suspended,
        start_date: normalizedStartDate,
        end_date: normalizedEndDate,
        account_type: normalizedAccountType,
        account_contributions: data.member_contributions.map(contrib => ({
          account_id: Number(contrib.account_id),
          member_id: contrib.member_id,
          amount: Number(contrib.amount),
          posted_date: normalizeDateForApi(batchInfo.received_date),
          posted: false,
          suspended: false,
          description: `Contribution for ${contrib.member_name}`
        }))
      };

      await backendApiClient.accountContributions.updateWithContributions(id, updateData);
      
      // Navigate back to the detail page
      router.push(`/dashboard/batches/account-contribution/${id}`);
    } catch (err) {
      console.error('Error saving batch:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error && !batchInfo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
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
            onClick={() => router.back()}
            className="text-union-600 hover:text-union-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-union-900">Edit Account Contribution</h1>
            <p className="text-muted-foreground">
              {batchInfo?.start_date && batchInfo?.end_date
                ? `${formatDate(batchInfo.start_date)} through ${formatDate(batchInfo.end_date)}`
                : 'Edit contribution batch details'
              }
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="text-red-600 text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Member Contributions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Member Contributions</CardTitle>
                  <CardDescription>
                    Edit member contributions. Use autocomplete to search and select members.
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(calculateTotal())}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/2">Member Name</TableHead>
                      <TableHead className="w-1/4">Amount</TableHead>
                      <TableHead className="w-1/4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <div className="relative">
                            <div className="relative">
                              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                ref={(el) => inputRefs.current[index] = el}
                                placeholder="Search member name..."
                                value={searchTerms[index] || ''}
                                onChange={(e) => handleMemberInputChange(e.target.value, index)}
                                onFocus={() => {
                                  if (searchTerms[index] && memberSuggestions.length > 0) {
                                    setShowSuggestions(prev => ({ ...prev, [index]: true }));
                                  }
                                }}
                                onBlur={() => {
                                  // Delay hiding to allow for selection
                                  setTimeout(() => {
                                    setShowSuggestions(prev => ({ ...prev, [index]: false }));
                                  }, 300);
                                }}
                                className="pl-10"
                              />
                            </div>
                            
                            {/* Member suggestions dropdown */}
                            {showSuggestions[index] && memberSuggestions.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {memberSuggestions.map((member) => (
                                  <div
                                    key={member.id}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                    onMouseDown={(e) => {
                                      e.preventDefault(); // Prevent input from losing focus
                                      handleMemberSelect(member, index);
                                    }}
                                  >
                                    <UserCheck className="h-4 w-4 text-green-600" />
                                    <div>
                                      <div className="font-medium">{member.full_name}</div>
                                      <div className="text-sm text-gray-500">ID: {member.unique_id}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <FormField
                              control={form.control}
                              name={`member_contributions.${index}.member_name`}
                              render={({ field }) => (
                                <FormItem className="hidden">
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`member_contributions.${index}.member_id`}
                              render={({ field }) => (
                                <FormItem className="hidden">
                                  <FormControl>
                                    <Input {...field} type="hidden" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`member_contributions.${index}.amount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-3 top-3 text-sm text-muted-foreground">$</span>
                                    <Input
                                      {...field}
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                      className="pl-8"
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRow(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Add new row button */}
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addNewRow}
                          className="w-full text-union-600 hover:text-union-700 border-dashed"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Account Contribution
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-union-600 hover:bg-union-700 text-white"
            >
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
