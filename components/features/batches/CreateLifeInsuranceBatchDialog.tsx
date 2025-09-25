"use client";

import { useState } from 'react';
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
import { FormControl, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { backendApiClient } from '@/lib/api-client';

interface CreateLifeInsuranceBatchDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CreateLifeInsuranceBatchDialog({ isOpen, onOpenChange }: CreateLifeInsuranceBatchDialogProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!startDate || !endDate) {
      toast.error('Please provide both start and end dates');
      return;
    }
    // Validate that startDate is on or before endDate
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error('Please provide valid dates');
      return;
    }

    if (start > end) {
      toast.error('Start date must be on or before end date');
      return;
    }

    const payload = {
      start_date: startDate,
      end_date: endDate,
      posted: false,
      suspended: false,
    };

    setSubmitting(true);

    try {
      const newBatch = await backendApiClient.lifeInsuranceBatches.create(payload as unknown as Record<string, unknown>);
      onOpenChange(false);
      setStartDate('');
      setEndDate('');
      if (newBatch && newBatch.id) {
        router.push(`/dashboard/batches/life-insurance/${newBatch.id}`);
      }
      toast.success('Batch created successfully!');
    } catch (errUnknown) {
      const err = errUnknown as { message?: string } | undefined;
      toast.error(`Failed to create batch: ${err?.message ?? String(errUnknown)}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Life Insurance Batch</DialogTitle>
          <DialogDescription>
            Select the start and end date for the new batch.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <FormItem>
            <FormLabel>Start Date</FormLabel>
            <FormControl>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </FormControl>
          </FormItem>

          <FormItem>
            <FormLabel>End Date</FormLabel>
            <FormControl>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </FormControl>
          </FormItem>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
