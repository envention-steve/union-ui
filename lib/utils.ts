import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a date string (YYYY-MM-DD or ISO) to a full ISO 8601 datetime string (UTC midnight).
 * If already a datetime, returns as-is. If invalid, returns null.
 */
export function toISOStringWithMidnight(dateStr?: string): string | null {
  if (!dateStr) return null;
  // Already a full ISO datetime
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateStr)) {
    return dateStr;
  }
  // YYYY-MM-DD only
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00.000Z').toISOString();
  }
  // Fallback: try to parse and convert
  const datePart = dateStr.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return new Date(datePart + 'T00:00:00.000Z').toISOString();
  }
  return null;
}
