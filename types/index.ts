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

// Member types
export interface Member {
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

export type EmploymentStatus = 
  | 'active'
  | 'on_leave'
  | 'terminated'
  | 'retired';

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

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Status types
export type Status = 'idle' | 'loading' | 'success' | 'error';
