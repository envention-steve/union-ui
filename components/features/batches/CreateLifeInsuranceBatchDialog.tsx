"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { backendApiClient } from '@/lib/api-client';

const formSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: 'Start date must be on or before end date',
  path: ['endDate'],
});

type FormData = z.infer<typeof formSchema>;

interface CreateLifeInsuranceBatchDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CreateLifeInsuranceBatchDialog({ isOpen, onOpenChange }: CreateLifeInsuranceBatchDialogProps) {
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
    },
  });

  const { handleSubmit, formState: { isSubmitting }, reset } = form;

  async function onSubmit(values: FormData) {
    const payload = {
      start_date: values.startDate,
      end_date: values.endDate,
      posted: false,
      suspended: false,
    };

    try {
      const newBatch = await backendApiClient.lifeInsuranceBatches.create(payload as unknown as Record<string, unknown>);
      onOpenChange(false);
      reset();
      if (newBatch && newBatch.id) {
        router.push(`/dashboard/batches/life-insurance/${newBatch.id}`);
      }
      toast.success('Batch created successfully!');
    } catch (errUnknown) {
      const err = errUnknown as { message?: string } | undefined;
      toast.error(`Failed to create batch: ${err?.message ?? String(errUnknown)}`);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        reset();
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Life Insurance Batch</DialogTitle>
          <DialogDescription>
            Select the start and end date for the new batch.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
