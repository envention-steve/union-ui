'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Users,
  DollarSign,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';

import { backendApiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmployerSummary {
  id: number;
  name: string;
}

interface BatchInfo {
  id: number;
  employer_id: number;
  employer?: EmployerSummary;
  start_date: string;
  end_date: string;
  received_date: string;
  posted: boolean;
  suspended: boolean;
  amount_received: number;
}

interface EmployerRateOption {
  id: number;
  name: string;
  contribution_rate: number;
}

interface EmployerRateApiItem {
  id?: number | string;
  name?: string;
  contribution_rate?: number | string;
  rate?: number | string;
}

interface EmployerContributionDetailApiItem {
  id?: number;
  amount?: number | string;
  hours?: number | string;
  member?: {
    id?: number;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    unique_id?: string;
  };
  employer_rate?: {
    id?: number;
    name?: string;
    contribution_rate?: number | string;
    rate?: number | string;
  };
}

interface MemberSuggestion {
  id: number;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  unique_id?: string;
}

interface ContributionFormRow {
  id?: number;
  member_id: number;
  member_name: string;
  member_unique_id?: string;
  hours: number;
  employer_rate_id: number | null;
  contribution_amount: number;
}

interface ContributionFormData {
  contributions: ContributionFormRow[];
}

interface MemberAutocompleteApiItem {
  id?: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  unique_id?: string;
}

interface EmployerAutocompletePayload {
  search_term: string;
  employer_id: number | string;
  start_date?: string;
  end_date?: string;
}

export default function EmployerContributionBatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params?.batchId as string | undefined;

  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [rates, setRates] = useState<EmployerRateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberSuggestions, setMemberSuggestions] = useState<MemberSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<Record<number, boolean>>({});
  const [searchTerms, setSearchTerms] = useState<Record<number, string>>({});
  const suggestionTimeouts = useRef<Record<number, NodeJS.Timeout>>({});
  const memberInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const form = useForm<ContributionFormData>({
    defaultValues: {
      contributions: [],
    },
  });

  const { control, reset, watch } = form;
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'contributions',
  });

  const contributions = watch('contributions') ?? [];

  const isPosted = Boolean(batchInfo?.posted);
  const isEditable = !isPosted;

  useEffect(() => {
    const fetchData = async () => {
      if (!batchId) return;

      try {
        setLoading(true);
        setError(null);

        const [batchResponse, detailResponse] = await Promise.all([
          backendApiClient.employerContributionBatches.get(String(batchId)),
          backendApiClient.employerContributionBatches.getDetails(String(batchId)),
        ]);

        const castBatch = batchResponse as BatchInfo;
        setBatchInfo(castBatch);

        await loadEmployerRates(castBatch.employer_id);

        const detailItems = Array.isArray(detailResponse?.employer_contributions)
          ? (detailResponse.employer_contributions as EmployerContributionDetailApiItem[])
          : [];

        const mappedRows: ContributionFormRow[] = detailItems.map(mapDetailItemToRow);

        replace(mappedRows);

        const initialTerms: Record<number, string> = {};
        mappedRows.forEach((row, index) => {
          initialTerms[index] = row.member_name;
        });
        setSearchTerms(initialTerms);
        setShowSuggestions({});
      } catch (fetchError) {
        console.error('Failed to fetch employer contribution batch', fetchError);
        setError('Failed to load employer contribution batch. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [batchId, replace]);

  const totalAmount = contributions.reduce((sum, row) => sum + (Number(row.contribution_amount) || 0), 0);
  const totalMembers = (() => {
    const memberIds = contributions
      .map((row) => row.member_id)
      .filter((id) => Number(id) > 0);
    return new Set(memberIds).size;
  })();

  async function loadEmployerRates(employerId: number) {
    if (!employerId) {
      setRates([]);
      return;
    }

    try {
      const ratesResponse = await backendApiClient.employerRates.list({ employerId });
      const parsedRates: EmployerRateOption[] = Array.isArray(ratesResponse)
        ? (ratesResponse as EmployerRateApiItem[])
            .map((rate) => {
              const parsedId = rate?.id !== undefined ? Number(rate.id) : NaN;
              if (!Number.isFinite(parsedId)) {
                return null;
              }
              const parsedName = typeof rate?.name === 'string' ? rate.name : undefined;
              const rawRate = rate?.contribution_rate ?? rate?.rate;
              const numericRate = rawRate !== undefined ? Number(rawRate) : NaN;
              if (!parsedName || !Number.isFinite(numericRate)) {
                return null;
              }
              return {
                id: parsedId,
                name: parsedName,
                contribution_rate: Number(numericRate),
              };
            })
            .filter((rate): rate is EmployerRateOption => Boolean(rate))
        : [];
      setRates(parsedRates);
    } catch (loadError) {
      console.error('Failed to load employer rates', loadError);
      setRates([]);
    }
  }

  const mapDetailItemToRow = (item: EmployerContributionDetailApiItem): ContributionFormRow => {
    const memberRawId = item.member?.id;
    const parsedMemberId = memberRawId !== undefined && memberRawId !== null ? Number(memberRawId) : NaN;
    const fullName = item.member?.full_name
      ? item.member.full_name
      : [item.member?.first_name, item.member?.last_name].filter(Boolean).join(' ').trim();
    const hoursValue = Number(item.hours ?? 0);
    const rateRawId = item.employer_rate?.id;
    const parsedRateId = rateRawId !== undefined && rateRawId !== null ? Number(rateRawId) : NaN;
    const rawAmount = item.amount ?? 0;
    const amountValue = Number(rawAmount);

    return {
      id: item.id,
      member_id: Number.isFinite(parsedMemberId) ? parsedMemberId : 0,
      member_name: fullName || 'Unknown Member',
      member_unique_id: item.member?.unique_id,
      hours: Number.isFinite(hoursValue) ? hoursValue : 0,
      employer_rate_id: Number.isFinite(parsedRateId) ? parsedRateId : null,
      contribution_amount: Number.isFinite(amountValue) ? amountValue : 0,
    };
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (value?: string) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString();
  };

  const handleAddContribution = () => {
    if (!isEditable) return;
    const newIndex = fields.length;
    append({
      member_id: 0,
      member_name: '',
      member_unique_id: undefined,
      hours: 0,
      employer_rate_id: null,
      contribution_amount: 0,
    });
    setSearchTerms((prev) => ({ ...prev, [newIndex]: '' }));
    setShowSuggestions((prev) => ({ ...prev, [newIndex]: false }));

    setTimeout(() => {
      memberInputRefs.current[newIndex]?.focus();
    }, 100);
  };

  const handleRemoveContribution = (index: number) => {
    remove(index);
    setSearchTerms((prev) => {
      const next: Record<number, string> = {};
      Object.entries(prev)
        .map(([key, value]) => [Number(key), value] as [number, string])
        .filter(([key]) => key !== index)
        .sort((a, b) => a[0] - b[0])
        .forEach(([key, value]) => {
          const newKey = key > index ? key - 1 : key;
          next[newKey] = value;
        });
      return next;
    });
    setShowSuggestions((prev) => {
      const next: Record<number, boolean> = {};
      Object.entries(prev)
        .map(([key, value]) => [Number(key), value] as [number, boolean])
        .filter(([key]) => key !== index)
        .sort((a, b) => a[0] - b[0])
        .forEach(([key, value]) => {
          const newKey = key > index ? key - 1 : key;
          next[newKey] = value;
        });
      return next;
    });
  };

  const searchMembers = async (query: string, index: number) => {
    if (!query || query.length < 2) {
      setMemberSuggestions([]);
      setShowSuggestions((prev) => ({ ...prev, [index]: false }));
      return;
    }

    const employerId = batchInfo?.employer_id ?? 0;
    if (!employerId) {
      setMemberSuggestions([]);
      setShowSuggestions((prev) => ({ ...prev, [index]: false }));
      return;
    }
    const payload: EmployerAutocompletePayload = {
      search_term: query,
      employer_id: employerId,
      start_date: batchInfo?.start_date,
      end_date: batchInfo?.end_date,
    };

    try {
      const response = await (backendApiClient.members.employerAutocomplete
        ? backendApiClient.members.employerAutocomplete(payload)
        : backendApiClient.members.autocomplete?.(query));

      if (Array.isArray(response)) {
        const mapped: MemberSuggestion[] = (response as MemberAutocompleteApiItem[])
          .map((member) => {
            const id = member?.id;
            if (id === undefined || id === null) {
              return null;
            }
            const fullName = member.full_name
              ? member.full_name
              : [member.first_name, member.last_name].filter(Boolean).join(' ').trim();
            if (!fullName) {
              return null;
            }
            return {
              id: Number(id),
              full_name: fullName,
              unique_id: member.unique_id,
            } as MemberSuggestion;
          })
          .filter((member): member is MemberSuggestion => Boolean(member));
        setMemberSuggestions(mapped);
        setShowSuggestions((prev) => ({ ...prev, [index]: mapped.length > 0 }));
      } else {
        setMemberSuggestions([]);
        setShowSuggestions((prev) => ({ ...prev, [index]: false }));
      }
    } catch (memberError) {
      console.error('Failed to fetch member suggestions', memberError);
      setMemberSuggestions([]);
      setShowSuggestions((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleMemberInputChange = (value: string, index: number) => {
    setSearchTerms((prev) => ({ ...prev, [index]: value }));
    form.setValue(`contributions.${index}.member_name`, value, { shouldDirty: true });
    form.setValue(`contributions.${index}.member_id`, 0, { shouldDirty: true });

    if (suggestionTimeouts.current[index]) {
      clearTimeout(suggestionTimeouts.current[index]);
    }

    suggestionTimeouts.current[index] = setTimeout(() => {
      searchMembers(value, index);
    }, 300);
  };

  const handleMemberSelect = (member: MemberSuggestion, index: number) => {
    const name = member.full_name || 'Unknown Member';
    setSearchTerms((prev) => ({ ...prev, [index]: name }));
    setShowSuggestions((prev) => ({ ...prev, [index]: false }));
    setMemberSuggestions([]);
    form.setValue(`contributions.${index}.member_id`, member.id, { shouldDirty: true });
    form.setValue(`contributions.${index}.member_name`, name, { shouldDirty: true });
    form.setValue(`contributions.${index}.member_unique_id`, member.unique_id, { shouldDirty: true });
  };

  const recalculateContribution = (index: number, overrideHours?: number, overrideRateId?: number | null) => {
    const hours = overrideHours ?? contributions[index]?.hours ?? 0;
    const selectedRateId = overrideRateId ?? contributions[index]?.employer_rate_id ?? null;
    const rate = rates.find((option) => option.id === Number(selectedRateId));
    const rateValue = rate ? Number(rate.contribution_rate) : 0;
    const calculated = Math.round(Number(hours) * rateValue * 100) / 100;
    form.setValue(`contributions.${index}.contribution_amount`, calculated, { shouldDirty: true });
  };

  const handleHoursChange = (value: string, index: number) => {
    const numericValue = Number(value);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
    form.setValue(`contributions.${index}.hours`, safeValue, { shouldDirty: true });
    recalculateContribution(index, safeValue);
  };

  const handleRateChange = (value: string, index: number) => {
    if (!value) {
      form.setValue(`contributions.${index}.employer_rate_id`, null, { shouldDirty: true });
      recalculateContribution(index, undefined, null);
      return;
    }

    const numericId = Number(value);
    const safeValue = Number.isFinite(numericId) ? numericId : null;
    form.setValue(`contributions.${index}.employer_rate_id`, safeValue, {
      shouldDirty: true,
    });
    recalculateContribution(index, undefined, safeValue);
  };

  const handleRefresh = async () => {
    if (!batchId) return;
    try {
      setLoading(true);
      setError(null);
      const [batchResponse, detailResponse] = await Promise.all([
        backendApiClient.employerContributionBatches.get(String(batchId)),
        backendApiClient.employerContributionBatches.getDetails(String(batchId)),
      ]);
      const castBatch = batchResponse as BatchInfo;
      setBatchInfo(castBatch);
      await loadEmployerRates(castBatch.employer_id);

      const detailItems = Array.isArray(detailResponse?.employer_contributions)
        ? (detailResponse.employer_contributions as EmployerContributionDetailApiItem[])
        : [];

      const mappedRows: ContributionFormRow[] = detailItems.map(mapDetailItemToRow);

      reset({ contributions: mappedRows });
      const refreshedTerms: Record<number, string> = {};
      mappedRows.forEach((row, index) => {
        refreshedTerms[index] = row.member_name;
      });
      setSearchTerms(refreshedTerms);
      setShowSuggestions({});
    } catch (refreshError) {
      console.error('Failed to refresh batch', refreshError);
      setError('Failed to refresh batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!batchId) return;
    if (!confirm('Post this batch? Posting will mark contributions as final.')) return;
    try {
      await backendApiClient.employerContributionBatches.post(String(batchId));
      toast.success('Batch posted successfully.');
      await handleRefresh();
    } catch (postError) {
      console.error('Failed to post batch', postError);
      toast.error('Failed to post batch.');
    }
  };

  const handleUnpost = async () => {
    if (!batchId) return;
    if (!confirm('Unpost this batch?')) return;
    try {
      await backendApiClient.employerContributionBatches.unpost(String(batchId));
      toast.success('Batch unposted.');
      await handleRefresh();
    } catch (unpostError) {
      console.error('Failed to unpost batch', unpostError);
      toast.error('Failed to unpost batch.');
    }
  };

  const onSubmit = async (data: ContributionFormData) => {
    if (!batchId || !batchInfo) return;

    const hasInvalidRow = data.contributions.some((row) => {
      return !row.member_id || !row.employer_rate_id || Number(row.hours) <= 0;
    });

    if (hasInvalidRow) {
      toast.error('Each contribution must include a member, rate, and hours greater than zero.');
      return;
    }

    const payload = {
      start_date: batchInfo.start_date,
      end_date: batchInfo.end_date,
      received_date: batchInfo.received_date,
      posted: false,
      suspended: batchInfo.suspended,
      amount_received: data.contributions.reduce((sum, row) => sum + Number(row.contribution_amount), 0),
      employer_id: batchInfo.employer_id,
      employer_contributions: data.contributions.map((row) => ({
        id: row.id,
        member_id: row.member_id,
        employer_rate_id: row.employer_rate_id,
        hours: Number(row.hours),
        amount: Number(row.contribution_amount),
      })),
    };

    try {
      setSaving(true);
      await backendApiClient.employerContributionBatches.updateWithContributions(String(batchId), payload);
      toast.success('Changes saved successfully.');
      await handleRefresh();
    } catch (saveError) {
      console.error('Failed to save employer contribution batch', saveError);
      toast.error('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 animate-pulse rounded bg-muted" />
          <div className="h-24 animate-pulse rounded bg-muted" />
          <div className="h-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-96 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/dashboard/batches/employer-contribution')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to list
        </Button>
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            <p>{error}</p>
            <Button className="mt-4 bg-union-600 text-white hover:bg-union-700" onClick={handleRefresh}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/batches/employer-contribution')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-union-900">Employer Contribution Batch</h1>
            <p className="text-muted-foreground">
              {batchInfo?.employer?.name ?? 'Unknown employer'} · {formatDate(batchInfo?.start_date)} – {formatDate(batchInfo?.end_date)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPosted ? (
            <Button variant="outline" onClick={handleUnpost} disabled={saving}>
              <RotateCcw className="mr-2 h-4 w-4" /> Unpost
            </Button>
          ) : (
            <Button className="bg-union-600 text-white hover:bg-union-700" onClick={handlePost} disabled={saving}>
              <ShieldAlert className="mr-2 h-4 w-4" /> Post Batch
            </Button>
          )}
          <Button onClick={form.handleSubmit(onSubmit)} disabled={saving || !isEditable}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-muted-foreground" /> Total Members
            </CardTitle>
            <CardDescription>Unique members in this batch</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-union-900">{totalMembers}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-muted-foreground" /> Total Amount
            </CardTitle>
            <CardDescription>Calculated from hours and rates</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-union-900">{formatCurrency(totalAmount)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              Status
            </CardTitle>
            <CardDescription>Posting state</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className={isPosted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
              {isPosted ? 'Posted' : 'Unposted'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="text-lg">Employer Contributions</CardTitle>
            <CardDescription>
              {isEditable
                ? 'Search for members, enter hours, choose a rate, and add each contribution entry.'
                : 'This batch is posted and read-only.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Member</TableHead>
                  <TableHead className="w-[15%]">Hours Worked</TableHead>
                  <TableHead className="w-[25%]">Rate Name</TableHead>
                  <TableHead className="w-[15%]">Contribution</TableHead>
                  <TableHead className="w-[15%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No contributions yet. {isEditable ? 'Use “Add contribution” to start.' : ''}
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <div className="relative">
                          <Input
                            ref={(element) => {
                              memberInputRefs.current[index] = element;
                            }}
                            placeholder="Search member..."
                            value={searchTerms[index] ?? ''}
                            onChange={(event) => handleMemberInputChange(event.target.value, index)}
                            onFocus={() => {
                              if ((searchTerms[index] ?? '').length >= 2 && memberSuggestions.length > 0) {
                                setShowSuggestions((prev) => ({ ...prev, [index]: true }));
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setShowSuggestions((prev) => ({ ...prev, [index]: false }));
                              }, 150);
                            }}
                            disabled={!isEditable}
                          />
                          {contributions[index]?.member_unique_id && (
                            <p className="mt-1 text-xs text-muted-foreground">Member ID: {contributions[index]?.member_unique_id}</p>
                          )}
                          {showSuggestions[index] && memberSuggestions.length > 0 && (
                            <div className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                          {memberSuggestions.map((member) => (
                                <button
                                  type="button"
                                  key={member.id}
                                  className="block w-full px-3 py-2 text-left hover:bg-gray-100"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => handleMemberSelect(member, index)}
                                >
                                  <div className="font-medium">{member.full_name ?? 'Unknown Member'}</div>
                                  {member.unique_id && (
                                    <div className="text-xs text-muted-foreground">Member ID: {member.unique_id}</div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={contributions[index]?.hours ?? 0}
                          onChange={(event) => handleHoursChange(event.target.value, index)}
                          disabled={!isEditable}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={contributions[index]?.employer_rate_id ? String(contributions[index]?.employer_rate_id) : ''}
                          onValueChange={(value) => handleRateChange(value, index)}
                          disabled={!isEditable || rates.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={rates.length === 0 ? 'No rates available' : 'Select rate'} />
                          </SelectTrigger>
                          <SelectContent>
                            {rates.map((rate) => (
                              <SelectItem key={rate.id} value={String(rate.id)}>
                                {rate.name} ({formatCurrency(rate.contribution_rate)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{formatCurrency(contributions[index]?.contribution_amount ?? 0)}</TableCell>
                      <TableCell className="text-right">
                        {isEditable ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveContribution(index)}
                            aria-label="Remove contribution"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Locked</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {isEditable && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddContribution}
                        className="w-full border-dashed text-union-600 hover:text-union-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Contribution
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
