'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PayoutCalculatorProps {
  formData: any;
  federalTaxType: 'rate' | 'amount';
  className?: string;
}

export function PayoutCalculator({ formData, federalTaxType, className }: PayoutCalculatorProps) {
  const calculations = useMemo(() => {
    const payoutAmount = parseFloat(formData.annuityPayout || '0');
    const annuityFee = formData.annuityFee ? 25.00 : 0;
    
    let federalTax = 0;
    if (federalTaxType === 'rate' && formData.federalTaxRate) {
      const rate = parseFloat(formData.federalTaxRate) / 100;
      federalTax = payoutAmount * rate;
    } else if (federalTaxType === 'amount' && formData.federalTaxAmount) {
      federalTax = parseFloat(formData.federalTaxAmount);
    }
    
    const distributionAmount = payoutAmount - annuityFee - federalTax;

    return {
      payoutAmount,
      annuityFee,
      federalTax,
      distributionAmount,
    };
  }, [formData, federalTaxType]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className={cn('sticky top-6', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Payout Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">
              Payout Amount:
            </span>
            <span className="font-medium">
              {formatCurrency(calculations.payoutAmount)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">
              Annuity Fee:
            </span>
            <span className="font-medium">
              {formatCurrency(calculations.annuityFee)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">
              Federal Tax {federalTaxType === 'rate' && formData.federalTaxRate ? `(${formData.federalTaxRate}%)` : ''}:
            </span>
            <span className="font-medium">
              {formatCurrency(calculations.federalTax)}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-t border-gray-200 bg-gray-50 rounded px-3 -mx-3">
            <span className="text-sm font-semibold">
              Distribution Amount:
            </span>
            <span className="font-bold text-lg text-green-600">
              {formatCurrency(calculations.distributionAmount)}
            </span>
          </div>
        </div>

        {/* Summary Information */}
        <div className="pt-4 space-y-2 text-xs text-muted-foreground border-t">
          <p>
            <strong>Note:</strong> The distribution amount is calculated by subtracting 
            the annuity fee and federal tax from the payout amount.
          </p>
          {calculations.distributionAmount < 0 && (
            <p className="text-red-600 font-medium">
              <strong>Warning:</strong> The distribution amount is negative. 
              Please adjust the payout amount or fees.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}