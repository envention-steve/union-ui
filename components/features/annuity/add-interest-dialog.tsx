'use client';

import { useState, useEffect, ChangeEvent } from 'react';
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
  interestId?: number;
  initialRate?: number;
  initialFiscalYearLabel?: string;
}

export function AddInterestDialog({
  open,
  onOpenChange,
  onInterestAdded,
  interestId,
  initialRate,
  initialFiscalYearLabel,
}: AddInterestDialogProps) {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (interestId) {
        setRate(initialRate ? String(initialRate) : '');
      } else {
        setRate('');
        setSelectedFiscalYear('');
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
        fetchFiscalYears();
      }
    }
  }, [open, interestId, initialRate]);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      if (interestId) {
        await backendApiClient.annuityInterests.post(String(interestId));
      } else {
        if (!selectedFiscalYear || !rate) {
          setError('Please fill out all fields.');
          setIsSaving(false);
          return;
        }
        await backendApiClient.annuityInterests.create({
          fiscal_year_id: Number(selectedFiscalYear),
          rate: Number(rate),
        });
      }
      onInterestAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save annuity interest', error);
      setError('Failed to save annuity interest. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{interestId ? 'Post Annuity Interest' : 'Add New Annuity Interest'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {interestId ? (
            <div className="space-y-2">
              <Label>Fiscal Year</Label>
              <p className="text-sm text-muted-foreground">{initialFiscalYearLabel}</p>
            </div>
          ) : (
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
          )}
          <div className="space-y-2">
            <Label htmlFor="rate">Interest Rate</Label>
            <Input
              id="rate"
              type="number"
              placeholder="e.g., 0.05 for 5%"
              value={rate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setRate(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : interestId ? 'Post' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}