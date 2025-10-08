import { fireEvent, render, screen } from '@testing-library/react';

import { MemberClaimsAdjustmentsTab } from '@/components/features/members/member-overview';

const baseClaimForm = {
  account_id: '',
  claim_type: '',
  description: '',
  check_number: '',
  check_date: '',
  amount: '',
  posted_date: '2024-01-01',
  allow_overdraft: false,
};

const baseAdjustmentForm = {
  account_id: '',
  amount: '',
  description: '',
  posted_date: '2024-01-01',
  allow_overdraft: false,
};

const fundBalances = {
  health_account_id: 1,
  annuity_account_id: 2,
  health_balance: 1000,
  annuity_balance: 5000,
  last_updated: new Date().toISOString(),
};

describe('MemberClaimsAdjustmentsTab', () => {
  it('invokes create handlers for claim and adjustment', () => {
    const onUpdateClaimForm = jest.fn();
    const onUpdateAdjustmentForm = jest.fn();
    const onCreateClaim = jest.fn();
    const onCreateAdjustment = jest.fn();

    render(
      <MemberClaimsAdjustmentsTab
        claimForm={{ ...baseClaimForm, claim_type: 'TYPE_A', amount: '100' }}
        onUpdateClaimForm={onUpdateClaimForm}
        claimTypes={[{ value: 'TYPE_A', label: 'Type A' }]}
        creatingClaim={false}
        onCreateClaim={onCreateClaim}
        adjustmentForm={{ ...baseAdjustmentForm, account_id: '1', amount: '50' }}
        onUpdateAdjustmentForm={onUpdateAdjustmentForm}
        creatingAdjustment={false}
        onCreateAdjustment={onCreateAdjustment}
        fundBalances={fundBalances}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /create claim/i }));
    fireEvent.click(screen.getByRole('button', { name: /create manual adjustment/i }));

    expect(onCreateClaim).toHaveBeenCalledTimes(1);
    expect(onCreateAdjustment).toHaveBeenCalledTimes(1);
  });

  it('calls update handlers when inputs change', () => {
    const onUpdateClaimForm = jest.fn();
    const onUpdateAdjustmentForm = jest.fn();

    render(
      <MemberClaimsAdjustmentsTab
        claimForm={baseClaimForm}
        onUpdateClaimForm={onUpdateClaimForm}
        claimTypes={[]}
        creatingClaim={false}
        onCreateClaim={jest.fn()}
        adjustmentForm={baseAdjustmentForm}
        onUpdateAdjustmentForm={onUpdateAdjustmentForm}
        creatingAdjustment={false}
        onCreateAdjustment={jest.fn()}
        fundBalances={fundBalances}
      />,
    );

    fireEvent.change(screen.getByLabelText(/claim description/i), { target: { value: 'Updated' } });
    fireEvent.change(screen.getByLabelText(/adjustment description/i), { target: { value: 'Manual' } });

    expect(onUpdateClaimForm).toHaveBeenCalledWith('description', 'Updated');
    expect(onUpdateAdjustmentForm).toHaveBeenCalledWith('description', 'Manual');
  });
});
