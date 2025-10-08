import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a value representing a calendar date to an ISO 8601 string pinned to midnight UTC.
 * Accepts plain date strings (YYYY-MM-DD), ISO strings, or Date instances. Returns null when parsing fails.
 */
export function toISOStringWithMidnight(dateInput?: string | Date | null): string | null {
  if (!dateInput) {
    return null;
  }

  if (dateInput instanceof Date) {
    if (Number.isNaN(dateInput.getTime())) {
      return null;
    }

    const midnightUtc = new Date(Date.UTC(
      dateInput.getFullYear(),
      dateInput.getMonth(),
      dateInput.getDate(),
    ));
    return midnightUtc.toISOString();
  }

  const trimmed = dateInput.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(trimmed + 'T00:00:00.000Z').toISOString();
  }

  const datePart = trimmed.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return new Date(datePart + 'T00:00:00.000Z').toISOString();
  }

  return null;
}
