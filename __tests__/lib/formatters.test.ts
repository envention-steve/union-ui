import formatStatus from '@/lib/formatters';

describe('formatStatus', () => {
  it('returns em dash for null/undefined/empty', () => {
    expect(formatStatus(null)).toBe('—');
    expect(formatStatus(undefined)).toBe('—');
    expect(formatStatus('')).toBe('—');
  });

  it('converts upper snake case to title case with spaces', () => {
    expect(formatStatus('UNINSURED')).toBe('Uninsured');
    expect(formatStatus('INSURED_CANCELLATION_PENDING')).toBe('Insured Cancellation Pending');
  });

  it('handles mixed case and underscores', () => {
    expect(formatStatus('partially_Insured')).toBe('Partially Insured');
  });
});
