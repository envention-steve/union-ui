'use client';

import { AnnuityPayoutForm } from '@/components/features/annuity/annuity-payout-form';
import { toast } from 'sonner';

export default function AnnuityPayoutPage() {
  const handleFormSubmit = (data: any) => {
    // In a real application, this would submit to an API
    console.log('Submitting annuity payout:', data);
    
    // Show success message
    toast.success('Annuity payout submitted successfully!', {
      description: `Distribution amount: ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(data.distributionAmount || 0)}`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Annuity Payout
        </h1>
        <p className="text-muted-foreground">
          Process annuity payments for members and companies
        </p>
      </div>

      <AnnuityPayoutForm onSubmit={handleFormSubmit} />
    </div>
  );
}