'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { backendApiClient } from '@/lib/api-client';

interface FiscalYear {
  id: number;
  start_date: string;
  end_date: string;
}

interface AddInterestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInterestAdded: () => void;
}

export function AddInterestDialog({
  open,
  onOpenChange,
  onInterestAdded,
}: AddInterestDialogProps) {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function fetchFiscalYears() {
      try {
        const response = await backendApiClient.fiscalYears.withoutAnnuityInterest();
        if (response && Array.isArray(response)) {
          setFiscalYears(response);
        }
      } catch (error) {
        console.error('Failed to fetch fiscal years', error);
      }
    }
    if (open) {
      fetchFiscalYears();
    }
  }, [open]);

  const handleCreate = async () => {
    if (!selectedFiscalYear || !rate) {
      setError('Please fill out all fields.');
      return;
    }
    setError(null);
    setIsCreating(true);
    try {
      await backendApiClient.annuityInterests.create({
        fiscal_year_id: Number(selectedFiscalYear),
        rate: Number(rate),
      });
      onInterestAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create annuity interest', error);
      setError('Failed to create annuity interest. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Annuity Interest</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fiscal-year">Fiscal Year</Label>
            <Select
              value={selectedFiscalYear}
              onValueChange={setSelectedFiscalYear}
            >
              <SelectTrigger id="fiscal-year">
                <SelectValue placeholder="Select a fiscal year" />
              </SelectTrigger>
              <SelectContent>
                {fiscalYears.map((year) => (
                  <SelectItem key={year.id} value={String(year.id)}>
                    {new Date(year.start_date).getFullYear()} - {new Date(year.end_date).getFullYear()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">Interest Rate</Label>
            <Input
              id="rate"
              type="number"
              placeholder="e.g., 0.05 for 5%"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
