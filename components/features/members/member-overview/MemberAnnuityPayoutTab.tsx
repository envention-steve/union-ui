"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FundBalance } from '@/lib/members/types';
import { AnnuityPayoutForm } from '@/components/features/annuity/annuity-payout-form';

interface MemberAnnuityPayoutTabProps {
  fundBalances?: FundBalance;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function MemberAnnuityPayoutTab({ fundBalances, onSubmit, isSubmitting }: MemberAnnuityPayoutTabProps) {
  return (
    <div className="space-y-6">
      {fundBalances ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-blue-700">Annuity Account Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${fundBalances.annuity_balance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Available for payout as of {new Date(fundBalances.last_updated).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <AnnuityPayoutForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
