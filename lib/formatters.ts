export function formatStatus(status: string | null | undefined): string {
  if (!status) return '—';
  const normalized = String(status).replace(/_/g, ' ').toLowerCase();
  return normalized.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export default formatStatus;
