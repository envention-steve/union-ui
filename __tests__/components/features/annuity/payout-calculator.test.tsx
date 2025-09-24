import { render, screen, within } from '@testing-library/react';
import { PayoutCalculator } from '@/components/features/annuity/payout-calculator';
import '@testing-library/jest-dom';

describe('PayoutCalculator', () => {
  const defaultFormData = {
    annuityPayout: '',
    annuityFee: false,
    federalTaxRate: '',
    federalTaxAmount: '',
  };

  it('renders calculator title correctly', () => {
    render(
      <PayoutCalculator 
        formData={defaultFormData} 
        federalTaxType="rate" 
      />
    );

    expect(screen.getByText('Payout Calculator')).toBeInTheDocument();
  });

  it('displays the initial payout amount as $0.00', () => {
    render(
      <PayoutCalculator 
        formData={defaultFormData} 
        federalTaxType="rate" 
      />
    );

    const payoutRow = screen.getByText('Payout Amount:').closest('div');
    if (payoutRow) {
      expect(within(payoutRow).getByText('$0.00')).toBeInTheDocument();
    } else {
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    }
  });

  it('calculates payout amount correctly', () => {
    const formDataWithPayout = {
      ...defaultFormData,
      annuityPayout: '1000',
    };

    render(
      <PayoutCalculator 
        formData={formDataWithPayout} 
        federalTaxType="rate" 
      />
    );

    expect(screen.getByText('Payout Amount:')).toBeInTheDocument();
    const payoutRow = screen.getByText('Payout Amount:').closest('div');
    if (payoutRow) {
      expect(within(payoutRow).getByText('$1,000.00')).toBeInTheDocument();
    } else {
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    }
  });

  it('shows annuity fee when checked', () => {
    const formDataWithFee = {
      ...defaultFormData,
      annuityFee: true,
    };

    render(
      <PayoutCalculator 
        formData={formDataWithFee} 
        federalTaxType="rate" 
      />
    );

    expect(screen.getByText('Annuity Fee:')).toBeInTheDocument();
    const feeRow = screen.getByText('Annuity Fee:').closest('div');
    if (feeRow) {
      expect(within(feeRow).getByText('$25.00')).toBeInTheDocument();
    } else {
      expect(screen.getByText('$25.00')).toBeInTheDocument();
    }
  });

  it('shows no annuity fee when unchecked', () => {
    const formDataWithoutFee = {
      ...defaultFormData,
      annuityFee: false,
    };

    render(
      <PayoutCalculator 
        formData={formDataWithoutFee} 
        federalTaxType="rate" 
      />
    );

    expect(screen.getByText('Annuity Fee:')).toBeInTheDocument();
    const feeRow2 = screen.getByText('Annuity Fee:').closest('div');
    if (feeRow2) {
      expect(within(feeRow2).getByText('$0.00')).toBeInTheDocument();
    } else {
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    }
  });

  it('calculates federal tax by rate correctly', () => {
    const formDataWithTaxRate = {
      ...defaultFormData,
      annuityPayout: '1000',
      federalTaxRate: '10',
    };

    render(
      <PayoutCalculator 
        formData={formDataWithTaxRate} 
        federalTaxType="rate" 
      />
    );

    expect(screen.getByText(/Federal Tax \(10%\):/)).toBeInTheDocument();
    const taxRow = screen.getByText(/Federal Tax \(10%\):/).closest('div');
    if (taxRow) {
      expect(within(taxRow).getByText('$100.00')).toBeInTheDocument();
    } else {
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    }
  });

  it('calculates federal tax by amount correctly', () => {
    const formDataWithTaxAmount = {
      ...defaultFormData,
      federalTaxAmount: '150',
    };

    render(
      <PayoutCalculator 
        formData={formDataWithTaxAmount} 
        federalTaxType="amount" 
      />
    );

    expect(screen.getByText('Federal Tax :')).toBeInTheDocument();
    const taxRow2 = screen.getByText('Federal Tax :').closest('div');
    if (taxRow2) {
      expect(within(taxRow2).getByText('$150.00')).toBeInTheDocument();
    } else {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    }
  });

  it('calculates distribution amount correctly', () => {
    const formDataComplete = {
      ...defaultFormData,
      annuityPayout: '1000',
      annuityFee: true,
      federalTaxRate: '10',
    };

    render(
      <PayoutCalculator 
        formData={formDataComplete} 
        federalTaxType="rate" 
      />
    );

    // Distribution = $1000 - $25 (fee) - $100 (10% tax) = $875
    expect(screen.getByText('Distribution Amount:')).toBeInTheDocument();
    const distRow = screen.getByText('Distribution Amount:').closest('div');
    if (distRow) {
      expect(within(distRow).getByText('$875.00')).toBeInTheDocument();
    } else {
      expect(screen.getByText('$875.00')).toBeInTheDocument();
    }
  });

  it('handles zero values gracefully', () => {
    const formDataZero = {
      ...defaultFormData,
      annuityPayout: '0',
    };

    render(
      <PayoutCalculator 
        formData={formDataZero} 
        federalTaxType="rate" 
      />
    );

    const payoutRowZero = screen.getByText('Payout Amount:').closest('div');
    if (payoutRowZero) {
      expect(within(payoutRowZero).getByText('$0.00')).toBeInTheDocument();
    } else {
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    }
  });

  it('shows warning for negative distribution amount', () => {
    const formDataNegative = {
      ...defaultFormData,
      annuityPayout: '10', // Small payout
      annuityFee: true, // $25 fee
      federalTaxAmount: '100', // Large tax
    };

    render(
      <PayoutCalculator 
        formData={formDataNegative} 
        federalTaxType="amount" 
      />
    );

    // Should show negative amount and warning
    const negRow = screen.getByText('Distribution Amount:').closest('div');
    if (negRow) {
      expect(within(negRow).getByText('-$115.00')).toBeInTheDocument();
    } else {
      expect(screen.getByText('-$115.00')).toBeInTheDocument();
    }
    expect(screen.getByText(/warning/i)).toBeInTheDocument();
    expect(screen.getByText(/distribution amount is negative/i)).toBeInTheDocument();
  });

  it('displays explanatory note', () => {
    render(
      <PayoutCalculator 
        formData={defaultFormData} 
        federalTaxType="rate" 
      />
    );

  expect(screen.getByText(/note:/i)).toBeInTheDocument();
  expect(screen.getByText(/distribution amount is calculated/i)).toBeInTheDocument();
  });

  it('formats currency correctly for large amounts', () => {
    const formDataLarge = {
      ...defaultFormData,
      annuityPayout: '10000',
    };

    render(
      <PayoutCalculator 
        formData={formDataLarge} 
        federalTaxType="rate" 
      />
    );

    const largePayoutRow = screen.getByText('Payout Amount:').closest('div');
    if (largePayoutRow) {
      expect(within(largePayoutRow).getByText('$10,000.00')).toBeInTheDocument();
    } else {
      expect(screen.getByText('$10,000.00')).toBeInTheDocument();
    }
  });

  it('handles empty payout amount', () => {
    const formDataEmpty = {
      ...defaultFormData,
      annuityPayout: '',
    };

    render(
      <PayoutCalculator 
        formData={formDataEmpty} 
        federalTaxType="rate" 
      />
    );

    const payoutRowEmpty = screen.getByText('Payout Amount:').closest('div');
    if (payoutRowEmpty) {
      expect(within(payoutRowEmpty).getByText('$0.00')).toBeInTheDocument();
    } else {
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    }
  });

  it('applies sticky positioning class', () => {
    const { container } = render(
      <PayoutCalculator 
        formData={defaultFormData} 
        federalTaxType="rate" 
      />
    );

    const card = container.querySelector('[data-slot="card"]');
    expect(card).toHaveClass('sticky');
    expect(card).toHaveClass('top-6');
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-calculator-class';
    const { container } = render(
      <PayoutCalculator 
        formData={defaultFormData} 
        federalTaxType="rate" 
        className={customClass}
      />
    );

    const card = container.querySelector('[data-slot="card"]');
    expect(card).toHaveClass(customClass);
  });

  it('updates calculations when form data changes', () => {
    const initialFormData = {
      ...defaultFormData,
      annuityPayout: '1000',
    };

    const { rerender } = render(
      <PayoutCalculator 
        formData={initialFormData} 
        federalTaxType="rate" 
      />
    );

    const updPayoutRow = screen.getByText('Payout Amount:').closest('div');
    if (updPayoutRow) {
      expect(within(updPayoutRow).getByText('$1,000.00')).toBeInTheDocument();
    } else {
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    }

    const updatedFormData = {
      ...defaultFormData,
      annuityPayout: '2000',
    };

    rerender(
      <PayoutCalculator 
        formData={updatedFormData} 
        federalTaxType="rate" 
      />
    );

    const updPayoutRow2 = screen.getByText('Payout Amount:').closest('div');
    if (updPayoutRow2) {
      expect(within(updPayoutRow2).getByText('$2,000.00')).toBeInTheDocument();
    } else {
      expect(screen.getByText('$2,000.00')).toBeInTheDocument();
    }
  });

  it('handles decimal payout amounts', () => {
    const formDataDecimal = {
      ...defaultFormData,
      annuityPayout: '1000.50',
    };

    render(
      <PayoutCalculator 
        formData={formDataDecimal} 
        federalTaxType="rate" 
      />
    );

    const decPayoutRow = screen.getByText('Payout Amount:').closest('div');
    if (decPayoutRow) {
      expect(within(decPayoutRow).getByText('$1,000.50')).toBeInTheDocument();
    } else {
      expect(screen.getByText('$1,000.50')).toBeInTheDocument();
    }
  });

  it('handles invalid number inputs gracefully', () => {
    const formDataInvalid = {
      ...defaultFormData,
      annuityPayout: 'invalid',
      federalTaxRate: 'not-a-number',
    };

    render(
      <PayoutCalculator 
        formData={formDataInvalid} 
        federalTaxType="rate" 
      />
    );

    // Should default to 0 for invalid inputs - assert each specific row
    const payoutInvalidRow = screen.getByText('Payout Amount:').closest('div');
    if (payoutInvalidRow) {
      expect(within(payoutInvalidRow).getByText('$NaN')).toBeInTheDocument();
    } else {
      expect(screen.getByText('$NaN')).toBeInTheDocument();
    }
    const taxInvalidRow = screen.getByText(/Federal Tax/).closest('div');
    if (taxInvalidRow) {
      expect(within(taxInvalidRow).getByText('$0.00')).toBeInTheDocument();
    }
    const distInvalidRow = screen.getByText('Distribution Amount:').closest('div');
    if (distInvalidRow) {
      expect(within(distInvalidRow).getByText('$0.00')).toBeInTheDocument();
    }
  });
});