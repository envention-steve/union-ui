import { render, screen, fireEvent } from '@testing-library/react';

import { MemberAnnuityPayoutTab } from '@/components/features/members/member-overview';

jest.mock('@/components/features/annuity/annuity-payout-form', () => ({
  AnnuityPayoutForm: ({ onSubmit }: { onSubmit: (data: any) => void }) => (
    <button type="button" onClick={() => onSubmit({ amount: '100' })}>
      Submit Payout
    </button>
  ),
}));

const fundBalances = {
  health_account_id: 1,
  annuity_account_id: 2,
  health_balance: 1000,
  annuity_balance: 5000,
  last_updated: new Date('2024-01-01').toISOString(),
};

describe('MemberAnnuityPayoutTab', () => {
  it('renders account summary when balances are provided', () => {
    render(
      <MemberAnnuityPayoutTab
        fundBalances={fundBalances}
        onSubmit={jest.fn()}
        isSubmitting={false}
      />,
    );

    expect(screen.getByText(/Annuity Account Balance/i)).toBeInTheDocument();
    expect(screen.getByText(/5,000.00/)).toBeInTheDocument();
  });

  it('passes submit handler to annuity form', () => {
    const onSubmit = jest.fn();

    render(
      <MemberAnnuityPayoutTab
        fundBalances={undefined}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /submit payout/i }));

    expect(onSubmit).toHaveBeenCalledWith({ amount: '100' });
  });
});
