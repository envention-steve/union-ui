import { describe, expect, it } from '@jest/globals';
import {
  parseNumber,
  extractDetailItems,
  extractBatchMetadata,
  LifeInsuranceRawMember,
  LifeInsuranceRawResponse,
} from '../../lib/life-insurance-helpers';
import { formatCurrency, formatDate } from '../../lib/life-insurance-helpers';

describe('life-insurance-helpers', () => {
  describe('parseNumber', () => {
    it('parses numeric string with commas and dollar sign', () => {
      expect(parseNumber('$1,234.56')).toBeCloseTo(1234.56);
    });

    it('returns null for empty or invalid strings', () => {
      expect(parseNumber('')).toBeNull();
      expect(parseNumber('abc')).toBeNull();
      expect(parseNumber(null)).toBeNull();
      expect(parseNumber(undefined)).toBeNull();
    });

    it('returns numbers untouched', () => {
      expect(parseNumber(42)).toBe(42);
      expect(parseNumber(3.14)).toBeCloseTo(3.14);
    });

    it('handles numeric-like strings without punctuation', () => {
      expect(parseNumber('1000')).toBe(1000);
      expect(parseNumber('  2000  ')).toBe(2000);
    });

    it('returns null for impossible types', () => {
      expect(parseNumber({})).toBeNull();
      expect(parseNumber([])).toBeNull();
    });
  });

  describe('extractDetailItems', () => {
    it('extracts from coverages key', () => {
      const payload: LifeInsuranceRawResponse = {
        coverages: [
          { id: 1, member_name: 'Alice' } as LifeInsuranceRawMember,
          { id: 2, member_name: 'Bob' } as LifeInsuranceRawMember,
        ],
      };
      const items = extractDetailItems(payload);
      expect(items.length).toBe(2);
      expect(items[0].member_name).toBe('Alice');
    });

    it('returns empty array for null or empty input', () => {
      expect(extractDetailItems(null)).toEqual([]);
      expect(extractDetailItems(undefined)).toEqual([]);
      expect(extractDetailItems([])).toEqual([]);
    });

    it('extracts from items and members keys', () => {
      const payloadItems = { items: [{ id: 10 }] } as unknown as LifeInsuranceRawResponse;
      expect(extractDetailItems(payloadItems).length).toBe(1);

      const payloadMembers = { members: [{ id: 11 }] } as unknown as LifeInsuranceRawResponse;
      expect(extractDetailItems(payloadMembers)[0].id).toBe(11);
    });
  });

  describe('extractBatchMetadata', () => {
    it('extracts top-level metadata', () => {
      const payload = {
        id: 123,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        posted: true,
        life_insurance_threshold: 1000,
        months_below_threshold: 2,
      } as unknown as LifeInsuranceRawResponse;

      const meta = extractBatchMetadata(payload);
      expect(meta).not.toBeNull();
      expect(meta?.id).toBe(123);
      expect(meta?.start_date).toBe('2024-01-01');
      expect(meta?.end_date).toBe('2024-01-31');
      expect(meta?.posted).toBe(true);
      expect(meta?.life_insurance_threshold).toBe(1000);
    });

    it('extracts nested batch metadata', () => {
      const payload = {
        batch: {
          id: 5,
          start_date: '2023-06-01',
          end_date: '2023-06-30',
          posted: false,
        },
      } as unknown as LifeInsuranceRawResponse;

      const meta = extractBatchMetadata(payload);
      expect(meta).not.toBeNull();
      expect(meta?.id).toBe(5);
      expect(meta?.start_date).toBe('2023-06-01');
    });

    it('returns null for undefined source', () => {
      expect(extractBatchMetadata(undefined)).toBeNull();
      expect(extractBatchMetadata(null)).toBeNull();
    });

    it('prefers nested summary over top-level when present', () => {
      const payload = {
        id: 999,
        summary: { id: 777, start_date: '2020-01-01' },
      } as unknown as LifeInsuranceRawResponse;

      const meta = extractBatchMetadata(payload);
      // summary should be merged into result and override where appropriate
      expect(meta).not.toBeNull();
      expect(meta?.id).toBe(777);
      expect(meta?.start_date).toBe('2020-01-01');
    });
  });

  describe('format helpers', () => {
    it('formatCurrency shows dash for null/undefined', () => {
      expect(formatCurrency(null)).toBe('—');
      expect(formatCurrency(undefined)).toBe('—');
    });

    it('formatCurrency formats numeric values', () => {
      expect(formatCurrency(1234.5)).toBe('$1,234.50');
    });

    it('formatDate returns dash for invalid or missing values', () => {
      expect(formatDate(undefined)).toBe('—');
      expect(formatDate('not-a-date')).toBe('—');
    });

    it('formatDate formats valid ISO dates', () => {
      // platform locale may vary, so assert presence of year-month-day parts
      const out = formatDate('2024-02-15');
      expect(out).toMatch(/2024|2|15/);
    });
  });
});
