export interface LifeInsuranceBatchSummary {
  id: number;
  start_date?: string;
  end_date?: string;
  posted?: boolean;
  suspended?: boolean;
  created_at?: string;
  updated_at?: string;
  life_insurance_threshold?: number | null;
  months_below_threshold?: number | null;
}

export interface LifeInsuranceRawMember {
  id?: number | string;
  coverage_id?: number | string;
  life_insurance_person_id?: number | string;
  member_id?: number | string;
  member?: Record<string, unknown>;
  member_name?: string;
  member_unique_id?: string;
  birth_date?: string;
  birthdate?: string;
  pending_health_balance?: string | number;
  health_balance?: string | number;
  pending_balance?: string | number;
  new_life_insurance_status?: string;
  new_status?: string;
  status?: string;
}

export interface LifeInsuranceRawResponse {
  id?: number | string;
  batch_id?: number | string;
  items?: LifeInsuranceRawMember[];
  coverages?: LifeInsuranceRawMember[];
  members?: LifeInsuranceRawMember[];
  batch?: Record<string, unknown>;
  summary?: Record<string, unknown>;
}

export const parseNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const direct = Number(trimmed);
    if (!Number.isNaN(direct)) return direct;
    const cleaned = trimmed.replace(/[$,]/g, '');
    const cleanedNumber = Number(cleaned);
    return Number.isNaN(cleanedNumber) ? null : cleanedNumber;
  }
  return null;
};

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatDate = (value?: string): string => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString();
};

export const extractDetailItems = (
  data: LifeInsuranceRawResponse | LifeInsuranceRawMember[] | null | undefined,
): LifeInsuranceRawMember[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data as LifeInsuranceRawMember[];
  const candidateKeys = ['coverages', 'items', 'members', 'entries', 'details', 'life_insurance_members', 'life_insurance_entries'];
  const dataRecord = data as Record<string, unknown>;
  for (const key of candidateKeys) {
    const maybe = dataRecord[key] as unknown;
    if (Array.isArray(maybe)) return maybe as LifeInsuranceRawMember[];
  }
  return [];
};

export const extractBatchMetadata = (source: LifeInsuranceRawResponse | null | undefined): LifeInsuranceBatchSummary | null => {
  if (!source) return null;
  const fromObject = Array.isArray(source) ? {} : source;
  const nested = !Array.isArray(source) ? (fromObject.batch ?? fromObject.summary ?? {}) : {};
  // Prefer nested batch/summary fields over top-level fields when both exist
  const best = { ...(fromObject || {}), ...(nested || {}) } as Record<string, unknown>;

  const bestRecord = best as Record<string, unknown>;
  const nestedRecord = nested as Record<string, unknown>;

  const id = parseNumber(bestRecord['id']) ?? parseNumber(bestRecord['batch_id']) ?? 0;

  return {
    id: id,
    start_date: (bestRecord['start_date'] as string) ?? (bestRecord['batch_start_date'] as string) ?? (nestedRecord['start_date'] as string),
    end_date: (bestRecord['end_date'] as string) ?? (bestRecord['batch_end_date'] as string) ?? (nestedRecord['end_date'] as string),
    posted: Boolean(bestRecord['posted']),
    suspended: Boolean(bestRecord['suspended']),
    created_at: bestRecord['created_at'] as string | undefined,
    updated_at: bestRecord['updated_at'] as string | undefined,
    life_insurance_threshold: parseNumber(bestRecord['life_insurance_threshold']) ?? null,
    months_below_threshold: parseNumber(bestRecord['months_below_threshold']) ?? null,
  };
};
