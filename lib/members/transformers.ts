import { toISOStringWithMidnight } from '@/lib/utils';

import type {
  Address,
  DependentCoverage,
  DistributionClassCoverage,
  EmailAddress,
  InsurancePlanCoverage,
  MemberFormData,
  MemberNote,
  MemberStatusCoverage,
  PhoneNumber,
} from './types';

type MemberAddressApi = {
  id?: number;
  label?: string;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  zip: string;
};

type MemberPhoneApi = {
  id?: number;
  label?: string;
  number: string;
};

type MemberEmailApi = {
  id?: number;
  label?: string;
  email_address?: string;
  email?: string;
};

export interface MemberApiResponse
  extends Omit<
    MemberFormData,
    'addresses' | 'phoneNumbers' | 'emailAddresses' | 'member_notes' | 'dependent_coverages'
  > {
  addresses?: MemberAddressApi[];
  phone_numbers?: MemberPhoneApi[];
  email_addresses?: MemberEmailApi[];
  member_notes?: MemberNote[];
  dependent_coverages?: (DependentCoverage & {
    dependent?: DependentCoverage['dependent'];
  })[];
}

export function transformMemberResponseToFormData(response: MemberApiResponse): MemberFormData {
  return {
    id: response.id,
    first_name: response.first_name,
    last_name: response.last_name,
    middle_name: response.middle_name ?? '',
    suffix: response.suffix ?? '',
    phone: response.phone,
    email: response.email,
    gender: response.gender,
    birth_date: response.birth_date ?? '',
    deceased: response.deceased,
    deceased_date: response.deceased_date ?? '',
    is_forced_distribution: response.is_forced_distribution,
    force_distribution_class_id: response.force_distribution_class_id,
    unique_id: response.unique_id,
    disabled_waiver: response.disabled_waiver,
    care_of: response.care_of ?? '',
    include_cms: response.include_cms,
    created_at: response.created_at,
    updated_at: response.updated_at,
    addresses: (response.addresses ?? []).map((address): Address => ({
      id: address.id,
      type: address.label ?? 'Home',
      street1: address.street1,
      street2: address.street2 ?? '',
      city: address.city,
      state: address.state,
      zip: address.zip,
    })),
    phoneNumbers: (response.phone_numbers ?? []).map((phone): PhoneNumber => ({
      id: phone.id,
      type: phone.label ?? 'Mobile',
      number: phone.number,
      extension: '',
    })),
    emailAddresses: (response.email_addresses ?? []).map((email): EmailAddress => ({
      id: email.id,
      type: email.label ?? 'Personal',
      email: email.email_address ?? email.email ?? '',
    })),
    distribution_class_coverages: response.distribution_class_coverages ?? [],
    member_status_coverages: response.member_status_coverages ?? [],
    life_insurance_coverages: response.life_insurance_coverages ?? [],
    dependent_coverages: response.dependent_coverages ?? [],
    employer_coverages: response.employer_coverages ?? [],
    insurance_plan_coverages: response.insurance_plan_coverages ?? [],
    member_notes: response.member_notes ?? [],
    fund_balances: response.fund_balances,
  };
}

interface BuildMemberUpdatePayloadOptions {
  formData: MemberFormData;
  originalData: MemberFormData | null;
  memberId: string;
}

export function buildMemberUpdatePayload({
  formData,
  originalData,
  memberId,
}: BuildMemberUpdatePayloadOptions): Record<string, unknown> {
  const memberIdNumber = Number.parseInt(memberId, 10);

  const basePayload = {
    id: formData.id,
    first_name: formData.first_name,
    last_name: formData.last_name,
    middle_name: formData.middle_name || null,
    suffix: formData.suffix || null,
    gender: formData.gender || null,
    birth_date: formData.birth_date || null,
    deceased: formData.deceased,
    deceased_date: formData.deceased_date || null,
    is_forced_distribution: formData.is_forced_distribution,
    force_distribution_class_id: formData.force_distribution_class_id || null,
    unique_id: formData.unique_id,
    disabled_waiver: formData.disabled_waiver,
    care_of: formData.care_of || null,
    include_cms: formData.include_cms,
    addresses: formData.addresses.map((address) => ({
      ...(address.id && { id: address.id }),
      type: 'person_address',
      label: address.type,
      street1: address.street1,
      street2: address.street2 || null,
      city: address.city,
      state: address.state,
      zip: address.zip,
    })),
    phone_numbers: formData.phoneNumbers.map((phone) => ({
      ...(phone.id && { id: phone.id }),
      type: 'person_phone_number',
      label: phone.type,
      number: phone.number,
      country_code: '1',
      is_default: false,
    })),
    email_addresses: formData.emailAddresses.map((email) => ({
      ...(email.id && { id: email.id }),
      type: 'person_email_address',
      label: email.type,
      email_address: email.email,
      is_default: false,
    })),
  };

  const payload: Record<string, unknown> = { ...basePayload };

  const shouldInclude = <Key extends keyof MemberFormData>(key: Key) => {
    if (!originalData) {
      return true;
    }
    return JSON.stringify(formData[key]) !== JSON.stringify(originalData[key]);
  };

  if (shouldInclude('distribution_class_coverages')) {
    payload.distribution_class_coverages = serializeDistributionCoverages(
      formData.distribution_class_coverages,
    );
  }

  if (shouldInclude('member_status_coverages')) {
    payload.member_status_coverages = serializeMemberStatusCoverages(
      formData.member_status_coverages,
    );
  }

  if (shouldInclude('insurance_plan_coverages')) {
    payload.insurance_plan_coverages = serializeInsurancePlanCoverages(
      formData.insurance_plan_coverages,
    );
  }

  if (shouldInclude('dependent_coverages')) {
    payload.dependent_coverages = serializeDependentCoverages(
      formData.dependent_coverages,
      memberIdNumber,
    );
  }

  if (shouldInclude('member_notes')) {
    payload.member_notes = serializeMemberNotes(formData.member_notes, memberIdNumber);
  }

  return payload;
}

function serializeDistributionCoverages(
  coverages: DistributionClassCoverage[],
): DistributionClassCoverage[] {
  return coverages
    .filter((coverage) => coverage.start_date && coverage.distribution_class_id)
    .map((coverage) => ({
      ...(coverage.id && coverage.id > 0 && { id: coverage.id }),
      distribution_class_id: coverage.distribution_class_id,
      start_date: toISOStringWithMidnight(coverage.start_date),
      end_date: toISOStringWithMidnight(coverage.end_date),
    }));
}

function serializeMemberStatusCoverages(
  coverages: MemberStatusCoverage[],
): MemberStatusCoverage[] {
  return coverages
    .filter((coverage) => coverage.start_date && coverage.member_status_id)
    .map((coverage) => ({
      ...(coverage.id && coverage.id > 0 && { id: coverage.id }),
      member_status_id: coverage.member_status_id,
      start_date: toISOStringWithMidnight(coverage.start_date),
      end_date: toISOStringWithMidnight(coverage.end_date),
    }));
}

function serializeInsurancePlanCoverages(
  coverages: InsurancePlanCoverage[],
): InsurancePlanCoverage[] {
  return coverages
    .filter((coverage) => coverage.start_date && coverage.insurance_plan_id)
    .map((coverage) => ({
      ...(coverage.id && coverage.id > 0 && { id: coverage.id }),
      insurance_plan_id: coverage.insurance_plan_id,
      policy_number: coverage.policy_number || '',
      start_date: toISOStringWithMidnight(coverage.start_date),
      end_date: toISOStringWithMidnight(coverage.end_date),
    }));
}

function serializeDependentCoverages(
  coverages: DependentCoverage[],
  memberId: number,
): DependentCoverage[] {
  return coverages
    .filter((coverage) => coverage.dependent && coverage.dependent.first_name && coverage.dependent.last_name)
    .map((coverage) => ({
      ...(coverage.id && coverage.id > 0 && { id: coverage.id }),
      member_id: memberId,
      start_date: toISOStringWithMidnight(coverage.start_date),
      end_date: toISOStringWithMidnight(coverage.end_date),
      dependent: coverage.dependent
        ? {
            ...(coverage.dependent.id && coverage.dependent.id > 0 && { id: coverage.dependent.id }),
            first_name: coverage.dependent.first_name,
            last_name: coverage.dependent.last_name,
            middle_name: coverage.dependent.middle_name || null,
            suffix: coverage.dependent.suffix || null,
            phone: coverage.dependent.phone || null,
            email: coverage.dependent.email || null,
            gender: coverage.dependent.gender || null,
            birth_date: toISOStringWithMidnight(coverage.dependent.birth_date),
            dependent_type: coverage.dependent.dependent_type,
            include_cms: coverage.dependent.include_cms,
            marriage_date: toISOStringWithMidnight(coverage.dependent.marriage_date),
            marriage_certificate: coverage.dependent.marriage_certificate || false,
          }
        : undefined,
    }));
}

function serializeMemberNotes(notes: MemberNote[], memberId: number): MemberNote[] {
  return notes
    .filter((note) => note.message && note.message.trim() !== '')
    .map((note) => ({
      ...(note.id && note.id > 0 && { id: note.id }),
      member_id: memberId,
      message: note.message.trim(),
    }));
}
