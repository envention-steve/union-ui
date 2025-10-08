"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { FundBalance } from '@/lib/members/types';

type MutableValue = string | number | boolean | undefined;

interface ClaimFormState {
  account_id: string | number;
  claim_type: string;
  description: string;
  check_number: string;
  check_date: string;
  amount: string;
  posted_date: string;
  allow_overdraft: boolean;
}

interface AdjustmentFormState {
  account_id: string | number;
  amount: string;
  description: string;
  posted_date: string;
  allow_overdraft: boolean;
}

interface ClaimTypeOption {
  value: string;
  label: string;
}

interface MemberClaimsAdjustmentsTabProps {
  claimForm: ClaimFormState;
  onUpdateClaimForm: (field: keyof ClaimFormState, value: MutableValue) => void;
  claimTypes: ClaimTypeOption[];
  creatingClaim: boolean;
  onCreateClaim: () => void;
  adjustmentForm: AdjustmentFormState;
  onUpdateAdjustmentForm: (field: keyof AdjustmentFormState, value: MutableValue) => void;
  creatingAdjustment: boolean;
  onCreateAdjustment: () => void;
  fundBalances?: FundBalance;
}

export function MemberClaimsAdjustmentsTab({
  claimForm,
  onUpdateClaimForm,
  claimTypes,
  creatingClaim,
  onCreateClaim,
  adjustmentForm,
  onUpdateAdjustmentForm,
  creatingAdjustment,
  onCreateAdjustment,
  fundBalances,
}: MemberClaimsAdjustmentsTabProps) {
  const healthAccountId = fundBalances?.health_account_id;
  const annuityAccountId = fundBalances?.annuity_account_id;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Claim</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              <span className="text-red-500">*</span> Claim Type
            </label>
            <Select
              value={claimForm.claim_type}
              onValueChange={(value) => onUpdateClaimForm('claim_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select claim type" />
              </SelectTrigger>
              <SelectContent>
                {claimTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="claim-description">
              Claim Description
            </label>
            <Textarea
              id="claim-description"
              value={claimForm.description}
              onChange={(event) => onUpdateClaimForm('description', event.target.value)}
              placeholder="Enter claim description"
              rows={3}
            />
          </div>

          <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="claim-check-number">
                    Check Number
                  </label>
                  <Input
                    id="claim-check-number"
                    value={claimForm.check_number}
                    onChange={(event) => onUpdateClaimForm('check_number', event.target.value)}
                    placeholder="Enter check number"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="claim-check-date">
                    Check Date
                  </label>
                  <Input
                    id="claim-check-date"
                    type="date"
                    value={claimForm.check_date}
                    onChange={(event) => onUpdateClaimForm('check_date', event.target.value)}
                  />
                </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              <span className="text-red-500">*</span> Claim Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={claimForm.amount}
                onChange={(event) => onUpdateClaimForm('amount', event.target.value)}
                className="pl-8"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="claim-posted-date">
                    Posted Date
                  </label>
                  <Input
                    id="claim-posted-date"
                    type="date"
                    value={claimForm.posted_date}
                    onChange={(event) => onUpdateClaimForm('posted_date', event.target.value)}
                  />
                </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="claim-overdraft"
              checked={claimForm.allow_overdraft}
              onCheckedChange={(checked) => onUpdateClaimForm('allow_overdraft', !!checked)}
            />
            <Label htmlFor="claim-overdraft" className="text-sm">
              Allow overdraft?
            </Label>
          </div>

          <Button
            onClick={onCreateClaim}
            disabled={creatingClaim || !claimForm.claim_type || !claimForm.amount}
            className="w-full bg-union-600 text-white hover:bg-union-700"
          >
            {creatingClaim ? 'Creating…' : 'Create Claim'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Manual Adjustment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              <span className="text-red-500">*</span> Account
            </label>
            <Select
              value={String(adjustmentForm.account_id)}
              onValueChange={(value) => onUpdateAdjustmentForm('account_id', value)}
              disabled={!fundBalances}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {fundBalances ? (
                  <>
                    <SelectItem value={String(healthAccountId)}>Health Account</SelectItem>
                    <SelectItem value={String(annuityAccountId)}>Annuity Account</SelectItem>
                  </>
                ) : (
                  <SelectItem value="disabled" disabled>
                    No accounts found for member
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              <span className="text-red-500">*</span> Adjustment Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                step="0.01"
                value={adjustmentForm.amount}
                onChange={(event) => onUpdateAdjustmentForm('amount', event.target.value)}
                className="pl-8"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="adjustment-description">
              Adjustment Description
            </label>
            <Textarea
              id="adjustment-description"
              value={adjustmentForm.description}
              onChange={(event) => onUpdateAdjustmentForm('description', event.target.value)}
              placeholder="Enter adjustment description"
              rows={3}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="adjustment-posted-date">
              Posted Date
            </label>
            <Input
              id="adjustment-posted-date"
              type="date"
              value={adjustmentForm.posted_date}
              onChange={(event) => onUpdateAdjustmentForm('posted_date', event.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="adjustment-overdraft"
              checked={adjustmentForm.allow_overdraft}
              onCheckedChange={(checked) => onUpdateAdjustmentForm('allow_overdraft', !!checked)}
            />
            <Label htmlFor="adjustment-overdraft" className="text-sm">
              Allow overdraft?
            </Label>
          </div>

          <Button
            onClick={onCreateAdjustment}
            disabled={creatingAdjustment || !adjustmentForm.account_id || !adjustmentForm.amount}
            className="w-full bg-union-600 text-white hover:bg-union-700"
          >
            {creatingAdjustment ? 'Creating…' : 'Create Manual Adjustment'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
