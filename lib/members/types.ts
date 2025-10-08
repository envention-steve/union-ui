export interface Address {
  id?: string;
  type: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface PhoneNumber {
  id?: string;
  type: string;
  number: string;
  extension?: string;
}

export interface EmailAddress {
  id?: string;
  type: string;
  email: string;
}

export interface DistributionClass {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
}

export interface MemberStatus {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  admin_fee: string;
}

export interface LifeInsurancePerson {
  id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  ssn?: string;
  birth_date?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface Coverage {
  id: number;
  created_at: string;
  updated_at: string;
  start_date: string;
  end_date?: string;
  member_id: number;
}

export interface Dependent {
  id?: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  phone?: string;
  email?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  birth_date?: string;
  created_at?: string;
  updated_at?: string;
  dependent_type: string;
  include_cms: boolean;
  marriage_date?: string;
  marriage_certificate?: boolean;
}

export interface DependentCoverage {
  id?: number;
  created_at?: string;
  updated_at?: string;
  start_date: string;
  end_date?: string;
  member_id: number;
  dependent_id: number;
  dependent?: Dependent;
}

export interface Employer {
  id?: number;
  name: string;
  ein?: string;
  include_cms: boolean;
  is_forced_distribution: boolean;
  force_distribution_class_id?: number;
  employer_type_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EmployerCoverage {
  id?: number;
  start_date: string;
  end_date?: string;
  member_id: number;
  employer_id: number;
  employer: Employer;
  created_at?: string;
  updated_at?: string;
}

export interface InsurancePlan {
  id?: number;
  name: string;
  code: string;
  type: 'HEALTH' | 'DENTAL' | 'VISION' | 'OTHER';
  group: string;
  include_cms: boolean;
  insurance_plan_company_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface InsurancePlanCoverage {
  id?: number;
  start_date: string;
  end_date?: string;
  member_id: number;
  insurance_plan_id: number;
  policy_number: string;
  insurance_plan?: InsurancePlan;
  created_at?: string;
  updated_at?: string;
}

export interface MemberNote {
  id?: number;
  member_id: number;
  message: string;
  created_at?: string;
  updated_at?: string;
}

export interface FundBalance {
  health_account_id: number;
  annuity_account_id: number;
  health_balance: number;
  annuity_balance: number;
  last_updated: string;
}

export interface LedgerEntry {
  id: number;
  account_id: number;
  member_id: number;
  type: string;
  amount: number;
  posted_date: string;
  posted: boolean;
  suspended: boolean;
  created_at: string;
  updated_at: string;
  account?: {
    id: number;
    type: 'HEALTH' | 'ANNUITY';
  };
}

export interface LedgerEntryType {
  value: string;
  label: string;
}

export interface DistributionClassCoverage extends Coverage {
  distribution_class_id: number;
  distribution_class?: DistributionClass;
}

export interface MemberStatusCoverage extends Coverage {
  member_status_id: number;
  member_status?: MemberStatus;
}

export interface LifeInsuranceCoverage extends Coverage {
  beneficiary_info_received?: boolean;
  beneficiary?: string;
  life_insurance_person_id?: number;
  life_insurance_person?: LifeInsurancePerson;
}

export interface MemberFormData {
  id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  phone?: string;
  email?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  birth_date?: string;
  deceased: boolean;
  deceased_date?: string;
  is_forced_distribution: boolean;
  force_distribution_class_id?: number;
  unique_id: string;
  disabled_waiver: boolean;
  care_of?: string;
  include_cms: boolean;
  created_at?: string;
  updated_at?: string;
  addresses: Address[];
  phoneNumbers: PhoneNumber[];
  emailAddresses: EmailAddress[];
  distribution_class_coverages: DistributionClassCoverage[];
  member_status_coverages: MemberStatusCoverage[];
  life_insurance_coverages: LifeInsuranceCoverage[];
  dependent_coverages: DependentCoverage[];
  employer_coverages: EmployerCoverage[];
  insurance_plan_coverages: InsurancePlanCoverage[];
  member_notes: MemberNote[];
  fund_balances?: FundBalance;
}
