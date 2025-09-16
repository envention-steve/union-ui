// User and Authentication types
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'member' | 'manager';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  confirm_password?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Benefit types
export interface Benefit {
  id: string;
  name: string;
  description: string;
  category: BenefitCategory;
  monthly_premium: number;
  deductible: number;
  coverage_limit: number;
  is_active: boolean;
  eligibility_rules?: string;
  enrolled_members?: number;
  created_at: string;
  updated_at: string;
}

export type BenefitCategory = 
  | 'health'
  | 'dental' 
  | 'vision'
  | 'life'
  | 'disability'
  | 'retirement'
  | 'wellness';

export interface BenefitFormData {
  name: string;
  description: string;
  category: BenefitCategory;
  monthlyPremium: number;
  deductible: number;
  coverageLimit: number;
  isActive: boolean;
  eligibilityRules?: string;
}

// Coverage types
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

export interface BaseCoverage {
  id: number;
  created_at: string;
  updated_at: string;
  start_date: string;
  end_date?: string;
  member_id: number;
}

export interface DistributionClassCoverage extends BaseCoverage {
  distribution_class_id: number;
  distribution_class?: DistributionClass;
}

export interface MemberStatusCoverage extends BaseCoverage {
  member_status_id: number;
  member_status?: MemberStatus;
}

export interface LifeInsuranceCoverage extends BaseCoverage {
  beneficiary_info_received?: boolean;
  status?: string;
  beneficiary?: string;
  life_insurance_person_id?: number;
}

export interface InsurancePlan {
  id: number;
  name: string;
  code: string;
  type: 'HEALTH' | 'DENTAL' | 'VISION' | 'OTHER';
  group: string;
  include_cms: boolean;
  insurance_plan_company_id: number;
  created_at?: string;
  updated_at?: string;
  // Company relationship with contact info
  insurance_plan_company?: {
    id: number;
    name: string;
    addresses: Address[];
    phone_numbers: PhoneNumber[];
    email_addresses: {
      id?: string;
      type: string;
      label?: string;
      email_address: string;
      is_default?: boolean;
    }[];
  };
  // Premium rate coverages
  insurance_plan_rates?: InsurancePlanRateCoverage[];
}

export interface InsurancePlanRateCoverage {
  id?: number; // Use 0 for new rates, positive numbers for existing rates
  insurance_plan_id: number;
  rate: number; // Will be converted from Decimal in API
  start_date: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

// Phone Number interface (if not already defined)
export interface PhoneNumber {
  id?: string;
  type: string;
  number: string;
  extension?: string;
  label?: string; // API uses label instead of type
  country_code?: string;
  is_default?: boolean;
}

export interface InsurancePlanCoverage extends BaseCoverage {
  insurance_plan_id: number;
  policy_number: string;
  insurance_plan?: InsurancePlan;
}

// Dependent types
export interface Dependent {
  id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  phone?: string;
  email?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  birth_date?: string;
  created_at: string;
  updated_at: string;
  dependent_type: string;
  include_cms: boolean;
  marriage_date?: string;
  marriage_certificate?: boolean;
}

export interface DependentCoverage extends BaseCoverage {
  dependent_id: number;
  dependent?: Dependent;
}

// Member types - Updated to match FastAPI backend structure
export interface Member {
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
  unique_id: string; // This is like member_number
  disabled_waiver: boolean;
  care_of?: string;
  include_cms: boolean;
  created_at?: string;
  updated_at?: string;
  // Additional computed fields for the UI
  full_name?: string;
  member_id?: string; // For display purposes
  employer?: string; // From relationships
  plan?: string; // From relationships 
  status?: 'Active' | 'Pending' | 'Inactive'; // Computed status
  // Coverage relationships
  dependent_coverages?: DependentCoverage[];
  distribution_class_coverages?: DistributionClassCoverage[];
  member_status_coverages?: MemberStatusCoverage[];
  life_insurance_coverages?: LifeInsuranceCoverage[];
  insurance_plan_coverages?: InsurancePlanCoverage[];
}

export type EmploymentStatus = 
  | 'active'
  | 'on_leave'
  | 'terminated'
  | 'retired';

// Keep legacy Member interface for backward compatibility if needed
export interface LegacyMember {
  id: string;
  user_id: string;
  member_number: string;
  union_local?: string;
  employment_status: EmploymentStatus;
  hire_date?: string;
  phone?: string;
  address?: Address;
  emergency_contact?: EmergencyContact;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
  enrollments?: BenefitEnrollment[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

// Plan types
export interface Plan {
  id: string;
  name: string;
  description: string;
  plan_type: PlanType;
  benefits: Benefit[];
  total_premium: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PlanType = 
  | 'individual'
  | 'family'
  | 'employee_plus_one'
  | 'employee_plus_children';

// Enrollment types
export interface BenefitEnrollment {
  id: string;
  member_id: string;
  benefit_id: string;
  plan_id?: string;
  enrollment_date: string;
  effective_date: string;
  termination_date?: string;
  status: EnrollmentStatus;
  monthly_premium: number;
  created_at: string;
  updated_at: string;
  member?: Member;
  benefit?: Benefit;
  plan?: Plan;
}

export type EnrollmentStatus = 
  | 'pending'
  | 'active'
  | 'terminated'
  | 'suspended';

// Claim types
export interface Claim {
  id: string;
  member_id: string;
  benefit_id: string;
  claim_number: string;
  claim_amount: number;
  approved_amount?: number;
  claim_date: string;
  service_date: string;
  provider_name?: string;
  description: string;
  status: ClaimStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  member?: Member;
  benefit?: Benefit;
  documents?: Document[];
}

export type ClaimStatus = 
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'denied'
  | 'paid';

// Document types
export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

// Dashboard types
export interface DashboardStats {
  totalMembers: number;
  activeBenefits: number;
  pendingClaims: number;
  totalPremiums: number;
  membersTrend: number;
  benefitsTrend: number;
  claimsTrend: number;
  premiumsTrend: number;
}

// API Response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface ApiError {
  message: string;
  detail?: string;
  status: number;
}

// Form types
export interface FormErrors {
  [key: string]: string | string[];
}

export interface SelectOption {
  value: string;
  label: string;
}

// Table types
export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface TableSorting {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TablePagination {
  page: number;
  pageSize: number;
}

// Navigation types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  external?: boolean;
}

// Employer types
export interface Employer {
  id: number;
  name: string;
  tax_id?: string;
  employer_type_id?: number;
  include_cms: boolean;
  is_forced_distribution: boolean;
  force_distribution_class_id?: number;
  created_at?: string;
  updated_at?: string;
  // Additional computed fields for the UI
  member_count?: number; // From relationships
  employer_type?: EmployerType; // From relationships
  members?: Member[]; // Members with active coverage for this employer
}

// Employer Type interface
export interface EmployerType {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Employer Rate types
export interface EmployerRate {
  id?: number;
  employer_id: number;
  name: string;
  contribution_rate: number | string; // Can be number (frontend) or string (backend Decimal)
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// Employer Note types
export interface EmployerNote {
  id?: number;
  employer_id: number;
  message: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

// Employer Ledger Entry types
export interface EmployerLedgerEntry {
  id: number;
  employer_id: number;
  account_id: number;
  type: string;
  amount: number;
  posted_date: string;
  posted: boolean;
  suspended: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
  account?: {
    id: number;
    type: 'HEALTH' | 'ANNUITY';
  };
}

// Employee Ledger (Contribution Batch) types
export interface MemberBasicInfo {
  id: number;
  unique_id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
}

export interface EmployerRateBasicInfo {
  id: number;
  name: string;
  contribution_rate: number;
}

export interface EmployerContributionWithMember {
  id: number;
  amount: number;
  hours: number;
  member: MemberBasicInfo;
  employer_rate: EmployerRateBasicInfo;
}

export interface EmployerContributionBatch {
  id: number;
  received_date: string;
  period_start?: string;
  period_end?: string;
  period_year_end?: string;
  amount_received: number;
  posted: boolean;
  suspended: boolean;
  employer_contributions: EmployerContributionWithMember[];
  total_hours: number;
}

// Update Employer interface to include contribution batches
export interface EmployerWithContributions extends Employer {
  employer_contribution_batches?: EmployerContributionBatch[];
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Status types
export type Status = 'idle' | 'loading' | 'success' | 'error';
