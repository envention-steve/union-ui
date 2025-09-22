import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { backendApiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface CreateEmployerContributionBatchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

interface EmployerAutocompleteResult {
  id: number;
  name: string;
  ein?: string;
}

interface EmployerAutocompleteApiItem {
  id?: number | string;
  name?: string;
  ein?: string;
}

interface EmployerContributionBatchCreateResponse {
  id?: number | string;
}

const formSchema = z
  .object({
    employer_id: z
      .number({ invalid_type_error: 'Employer is required.' })
      .min(1, 'Employer is required.'),
    employer_name: z.string().min(1, 'Employer is required.'),
    start_date: z.coerce.date({ required_error: 'Start date is required.' }),
    end_date: z.coerce.date({ required_error: 'End date is required.' }),
  })
  .refine(
    (values) => values.start_date <= values.end_date,
    {
      path: ['end_date'],
      message: 'End date must be on or after start date.',
    },
  );

export function CreateEmployerContributionBatchDialog({
  isOpen,
  onOpenChange,
  onCreated,
}: CreateEmployerContributionBatchDialogProps) {
  const router = useRouter();
  const [employerSearchTerm, setEmployerSearchTerm] = useState('');
  const [employerSuggestions, setEmployerSuggestions] = useState<EmployerAutocompleteResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employer_id: 0,
      employer_name: '',
      start_date: undefined,
      end_date: undefined,
    },
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setEmployerSearchTerm('');
      setEmployerSuggestions([]);
      setShowSuggestions(false);
    }
  }, [form, isOpen]);

  const searchEmployers = async (query: string) => {
    if (!query || query.length < 2) {
      setEmployerSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await backendApiClient.employers.autocomplete?.(query);
      if (Array.isArray(response)) {
        const mapped = (response as EmployerAutocompleteApiItem[])
          .map((employer) => {
            const parsedId = employer.id !== undefined && employer.id !== null ? Number(employer.id) : NaN;
            const name = typeof employer.name === 'string' ? employer.name : undefined;
            if (!Number.isFinite(parsedId) || !name) {
              return null;
            }
            return {
              id: parsedId,
              name,
              ein: typeof employer.ein === 'string' ? employer.ein : undefined,
            };
          })
          .filter((employer): employer is EmployerAutocompleteResult => Boolean(employer));
        setEmployerSuggestions(mapped);
        setShowSuggestions(mapped.length > 0);
      } else {
        setEmployerSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Failed to fetch employer suggestions', error);
      setEmployerSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleEmployerInputChange = (value: string) => {
    setEmployerSearchTerm(value);
    form.setValue('employer_name', value);
    form.setValue('employer_id', 0);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      searchEmployers(value);
    }, 300);
  };

  const handleEmployerSelect = (employer: EmployerAutocompleteResult) => {
    form.setValue('employer_id', employer.id, { shouldValidate: true });
    form.setValue('employer_name', employer.name, { shouldValidate: true });
    setEmployerSearchTerm(employer.name);
    setEmployerSuggestions([]);
    setShowSuggestions(false);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const payload = {
      employer_id: values.employer_id,
      start_date: values.start_date.toISOString().split('T')[0],
      end_date: values.end_date.toISOString().split('T')[0],
      received_date: new Date().toISOString(),
      posted: false,
      suspended: false,
      amount_received: 0,
      employer_contributions: [],
    };

    toast.promise(
      backendApiClient.employerContributionBatches.create(payload),
      {
        loading: 'Creating batch...',
        success: (newBatch: EmployerContributionBatchCreateResponse) => {
          onOpenChange(false);
          form.reset();
          onCreated?.();
          if (newBatch?.id) {
            router.push(`/dashboard/batches/employer-contribution/${newBatch.id}/details`);
          }
          return 'Employer contribution batch created.';
        },
        error: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Failed to create batch.';
          return message;
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create Employer Batch</DialogTitle>
          <DialogDescription>
            Select an employer and date range to create a new contribution batch.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="employer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employer</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        value={employerSearchTerm}
                        placeholder="Search employer..."
                        onFocus={() => {
                          if (employerSuggestions.length > 0) {
                            setShowSuggestions(true);
                          }
                        }}
                        onChange={(event) => handleEmployerInputChange(event.target.value)}
                      />
                      {showSuggestions && employerSuggestions.length > 0 && (
                        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                          {employerSuggestions.map((employer) => (
                            <button
                              type="button"
                              key={employer.id}
                              className="flex w-full flex-col items-start gap-1 px-4 py-2 text-left hover:bg-gray-100"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleEmployerSelect(employer)}
                            >
                              <span className="font-medium">{employer.name}</span>
                              {employer.ein && (
                                <span className="text-xs text-muted-foreground">EIN: {employer.ein}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.employer_name?.message ||
                      form.formState.errors.employer_id?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employer_id"
              render={({ field }) => (
                <input type="hidden" value={field.value} readOnly />
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
