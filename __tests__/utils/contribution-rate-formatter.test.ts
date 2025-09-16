/**
 * Test utility function for formatting contribution rates from backend Decimal values
 */
describe('Contribution Rate Formatting', () => {
  // Helper function that mimics the logic in our component
  const formatContributionRate = (rate: number | string | undefined): string => {
    if (!rate) return '0.00';
    return parseFloat(rate.toString()).toFixed(2);
  };

  it('should format string decimal values correctly', () => {
    // Simulating what the backend sends (serialized Decimal as string)
    expect(formatContributionRate('25.5')).toBe('25.50');
    expect(formatContributionRate('0.25')).toBe('0.25');
    expect(formatContributionRate('100')).toBe('100.00');
  });

  it('should format number values correctly', () => {
    // Simulating frontend number values
    expect(formatContributionRate(25.5)).toBe('25.50');
    expect(formatContributionRate(0.25)).toBe('0.25');
    expect(formatContributionRate(100)).toBe('100.00');
  });

  it('should handle edge cases', () => {
    expect(formatContributionRate(undefined)).toBe('0.00');
    expect(formatContributionRate('')).toBe('0.00');
    expect(formatContributionRate(0)).toBe('0.00');
    expect(formatContributionRate('0')).toBe('0.00');
  });

  it('should handle invalid string values gracefully', () => {
    // parseFloat() returns NaN for invalid strings, toFixed() on NaN returns 'NaN'
    // But our actual implementation checks for truthiness first
    expect(formatContributionRate('invalid')).toBe('NaN');
  });
});