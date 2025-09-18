'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Plus,
  Trash2,
  User,
  Users,
  Heart,
  FileText,
  Briefcase,
  ClipboardList,
  CircleDollarSign,
  Folder,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Filter
} from 'lucide-react';
import { backendApiClient } from '@/lib/api-client';
import { Member } from '@/types';
import {
  LedgerEntry as PolymorphicLedgerEntry,
  getLedgerEntryTypeDisplayName,
  isAdminFeeEntry,
  isAnnuityPayoutEntry,
  isManualAdjustmentEntry,
  isClaimEntry,
  isAccountContributionEntry,
  isMemberContributionEntry,
  isInsurancePremiumEntry,
  isAnnuityUpdateEntry
} from '@/types/ledger-entries';

// Component to render type-specific ledger entry details
const LedgerEntryExpandedDetails: React.FC<{ entry: PolymorphicLedgerEntry }> = ({ entry }) => {
  const renderTypeSpecificDetails = () => {
    if (isAdminFeeEntry(entry)) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Insurance Premium ID:</span> {entry.insurance_premium_id || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Insurance Premium Batch ID:</span> {entry.insurance_premium_batch_id || 'N/A'}
          </div>
        </div>
      );
    }

    if (isAnnuityPayoutEntry(entry)) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Account Number:</span> {entry.account_number}
            </div>
            <div>
              <span className="font-medium">Check Date:</span> {entry.check_date ? new Date(entry.check_date).toLocaleDateString() : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Check Number:</span> {entry.check_number || 'N/A'}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Tax Rate:</span> {(entry.tax_rate * 100).toFixed(2)}%
            </div>
            <div>
              <span className="font-medium">1099 Code:</span> {entry.code1099}
            </div>
            <div>
              <span className="font-medium">Allow Overdraft:</span> {entry.allow_overdraft ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Use Member Info:</span> {entry.use_member_info ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-medium">Admin Fee:</span> {entry.admin_fee ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-medium">Admin Fee Amount:</span> ${entry.admin_fee_amount.toFixed(2)}
            </div>
          </div>
          {(entry.tax_override_amount !== null || entry.company_id || entry.annuity_person_id) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pt-2 border-t border-gray-200">
              {entry.tax_override_amount !== null && (
                <div>
                  <span className="font-medium">Tax Override Amount:</span> ${entry.tax_override_amount.toFixed(2)}
                </div>
              )}
              {entry.company_id && (
                <div>
                  <span className="font-medium">Company ID:</span> {entry.company_id}
                </div>
              )}
              {entry.annuity_person_id && (
                <div>
                  <span className="font-medium">Annuity Person ID:</span> {entry.annuity_person_id}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (isManualAdjustmentEntry(entry)) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Description:</span> {entry.description || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Allow Overdraft:</span> {entry.allow_overdraft ? 'Yes' : 'No'}
          </div>
        </div>
      );
    }

    if (isClaimEntry(entry)) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Description:</span> {entry.description || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Claim Type:</span> {entry.claim_type}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Check Date:</span> {entry.check_date ? new Date(entry.check_date).toLocaleDateString() : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Check Number:</span> {entry.check_number || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Allow Overdraft:</span> {entry.allow_overdraft ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      );
    }

    if (isAccountContributionEntry(entry)) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Description:</span> {entry.description || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Account Contribution Batch ID:</span> {entry.account_contribution_batch_id || 'N/A'}
          </div>
        </div>
      );
    }

    if (isMemberContributionEntry(entry)) {
      return (
        <div className="grid grid-cols-1 gap-4 text-sm">
          <div>
            <span className="font-medium">Employer Contribution ID:</span> {entry.employer_contribution_id || 'N/A'}
          </div>
        </div>
      );
    }

    if (isInsurancePremiumEntry(entry)) {
      return (
        <div className="grid grid-cols-1 gap-4 text-sm">
          <div>
            <span className="font-medium">Insurance Premium Batch ID:</span> {entry.insurance_premium_batch_id || 'N/A'}
          </div>
        </div>
      );
    }

    if (isAnnuityUpdateEntry(entry)) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Year End Balance:</span> {entry.year_end_balance ? `$${entry.year_end_balance.toFixed(2)}` : 'N/A'}
          </div>
          <div>
            <span className="font-medium">Annuity Interest ID:</span> {entry.annuity_interest_id || 'N/A'}
          </div>
        </div>
      );
    }

    // Fallback for base ledger entries or unknown types
    return (
      <div className="text-sm text-gray-500">
        No additional details available for this entry type.
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900 flex items-center gap-2">
        <span>Entry Details</span>
        <Badge variant="outline" className="text-xs">
          {getLedgerEntryTypeDisplayName(entry.type)}
        </Badge>
      </h4>
      
      {/* Common fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-3 rounded">
        <div>
          <span className="font-medium">Posted:</span> {entry.posted ? 'Yes' : 'No'}
        </div>
        <div>
          <span className="font-medium">Suspended:</span> {entry.suspended ? 'Yes' : 'No'}
        </div>
        <div>
          <span className="font-medium">Account ID:</span> {entry.account_id}
        </div>
        <div>
          <span className="font-medium">Entry ID:</span> {entry.id}
        </div>
      </div>

      {/* Type-specific details */}
      <div className="pt-2">
        <h5 className="font-medium text-gray-800 mb-3">Type-Specific Information</h5>
        {renderTypeSpecificDetails()}
      </div>

      {/* Timestamps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
        <div>
          <span className="font-medium">Created:</span> {new Date(entry.created_at).toLocaleString()}
        </div>
        <div>
          <span className="font-medium">Updated:</span> {new Date(entry.updated_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

interface Address {
  id?: string;
  type: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
}

interface PhoneNumber {
  id?: string;
  type: string;
  number: string;
  extension?: string;
}

interface EmailAddress {
  id?: string;
  type: string;
  email: string;
}

interface DistributionClass {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
}

interface MemberStatus {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  admin_fee: string;
}

interface Coverage {
  id: number;
  created_at: string;
  updated_at: string;
  start_date: string;
  end_date?: string;
  member_id: number;
}

interface Dependent {
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

interface DependentCoverage {
  id?: number;
  created_at?: string;
  updated_at?: string;
  start_date: string;
  end_date?: string;
  member_id: number;
  dependent_id: number;
  dependent?: Dependent;
}

interface Employer {
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

interface EmployerCoverage {
  id?: number;
  start_date: string;
  end_date?: string;
  member_id: number;
  employer_id: number;
  employer: Employer;
  created_at?: string;
  updated_at?: string;
}

interface InsurancePlan {
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

interface InsurancePlanCoverage {
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

interface MemberNote {
  id?: number;
  member_id: number;
  message: string;
  created_at?: string;
  updated_at?: string;
}

interface FundBalance {
  health_account_id: number;
  annuity_account_id: number;
  health_balance: number;
  annuity_balance: number;
  last_updated: string;
}

interface LedgerEntry {
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

interface LedgerEntryType {
  value: string;
  label: string;
}

interface DistributionClassCoverage extends Coverage {
  distribution_class_id: number;
  distribution_class?: DistributionClass;
}

interface MemberStatusCoverage extends Coverage {
  member_status_id: number;
  member_status?: MemberStatus;
}

interface LifeInsuranceCoverage extends Coverage {
  beneficiary_info_received?: boolean;
  beneficiary?: string;
  life_insurance_person_id?: number;
}

interface MemberFormData {
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

const TABS = [
  { id: 'member', label: 'Member', icon: User },
  { id: 'dependents', label: 'Dependents', icon: Users },
  { id: 'health-coverage', label: 'Health Coverage', icon: Heart },
  { id: 'life-insurance', label: 'Life Insurance', icon: FileText },
  { id: 'employers', label: 'Employers', icon: Briefcase },
  { id: 'notes', label: 'Notes', icon: ClipboardList },
  { id: 'claims-adjustments', label: 'Claims/Adjustments', icon: CircleDollarSign },
  { id: 'annuity-payout', label: 'Annuity Payout', icon: CircleDollarSign },
  { id: 'fund-ledger', label: 'Fund Ledger', icon: Folder },
];

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'view';
  const isEditMode = mode === 'edit';

  const [activeTab, setActiveTab] = useState('member');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Fund Ledger state
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [ledgerTotalEntries, setLedgerTotalEntries] = useState(0);
  const [ledgerCurrentPage, setLedgerCurrentPage] = useState(1);
  const [ledgerItemsPerPage, setLedgerItemsPerPage] = useState(25);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());
  const [ledgerEntryTypes, setLedgerEntryTypes] = useState<LedgerEntryType[]>([]);
  
  // Fund Ledger filters
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');
  const [entryTypeFilter, setEntryTypeFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  
  // Claims/Adjustments form state
  const [claimTypes, setClaimTypes] = useState<{value: string; label: string}[]>([]);
  const [creatingClaim, setCreatingClaim] = useState(false);
  const [creatingAdjustment, setCreatingAdjustment] = useState(false);
  const [claimForm, setClaimForm] = useState({
    account_id: '' as (string | number),
    claim_type: '',
    description: '',
    check_number: '',
    check_date: '',
    amount: '',
    posted_date: new Date().toISOString().split('T')[0],
    allow_overdraft: false
  });
  const [adjustmentForm, setAdjustmentForm] = useState({
    account_id: '' as (string | number),
    amount: '',
    description: '',
    posted_date: new Date().toISOString().split('T')[0],
    allow_overdraft: false
  });
  
  // Distribution classes state
  const [distributionClasses, setDistributionClasses] = useState<DistributionClass[]>([]);
  
  // Member statuses state
  const [memberStatuses, setMemberStatuses] = useState<MemberStatus[]>([]);
  
  // Insurance plans state
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>([]);
  
  const [originalData, setOriginalData] = useState<MemberFormData | null>(null);
  const [formData, setFormData] = useState<MemberFormData>({
    id: 0,
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    email: '',
    gender: undefined,
    birth_date: '',
    deceased: false,
    deceased_date: '',
    is_forced_distribution: false,
    unique_id: '',
    disabled_waiver: false,
    care_of: '',
    include_cms: false,
    addresses: [],
    phoneNumbers: [],
    emailAddresses: [],
    distribution_class_coverages: [],
    member_status_coverages: [],
    life_insurance_coverages: [],
    dependent_coverages: [],
    employer_coverages: [],
    insurance_plan_coverages: [],
    member_notes: [],
  });

  // Check for unsaved changes (debounced to prevent excessive re-renders)
  useEffect(() => {
    if (originalData && isEditMode) {
      const timeoutId = setTimeout(() => {
        const hasChanges = JSON.stringify(originalData) !== JSON.stringify(formData);
        setHasUnsavedChanges(hasChanges);
      }, 100); // 100ms debounce
      
      return () => clearTimeout(timeoutId);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [formData, originalData, isEditMode]);

  // Warn user about unsaved changes when navigating away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [hasUnsavedChanges]);

  // Fetch member data
  const fetchMember = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await backendApiClient.members.getDetails!(resolvedParams.id);
      
      // Transform API response to form data structure
      const memberData: MemberFormData = {
        ...response,
        // Transform addresses from API format to UI format
        addresses: (response.addresses || []).map((addr: any) => ({
          id: addr.id,
          type: addr.label || 'HOME', // Map API 'label' to UI 'type'
          street1: addr.street1,
          street2: addr.street2 || '',
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
        })),
        
        // Transform phone numbers from API format to UI format
        phoneNumbers: (response.phone_numbers || []).map((phone: any) => ({
          id: phone.id,
          type: phone.label || 'MOBILE', // Map API 'label' to UI 'type'
          number: phone.number,
          extension: '', // Not currently supported in API
        })),
        
        // Transform email addresses from API format to UI format
        emailAddresses: (response.email_addresses || []).map((email: any) => ({
          id: email.id,
          type: email.label || 'PERSONAL', // Map API 'label' to UI 'type'
          email: email.email_address,
        })),
        
        distribution_class_coverages: response.distribution_class_coverages || [],
        member_status_coverages: response.member_status_coverages || [],
        life_insurance_coverages: response.life_insurance_coverages || [],
        dependent_coverages: response.dependent_coverages || [],
        employer_coverages: response.employer_coverages || [],
        insurance_plan_coverages: response.insurance_plan_coverages || [],
        member_notes: response.member_notes || [],
        fund_balances: response.fund_balances,
      };
      
      console.log('******* MEMBER DATA LOADED FROM API *******', {
        memberId: response.id,
        apiMemberNotes: response.member_notes,
        apiMemberNotesCount: response.member_notes?.length || 0,
        transformedMemberNotes: memberData.member_notes,
        transformedMemberNotesCount: memberData.member_notes?.length || 0,
        apiResponseKeys: Object.keys(response),
        hasMemberNotesInResponse: 'member_notes' in response,
        timestamp: new Date().toISOString()
      });
      
      setFormData(memberData);
      setOriginalData(memberData);
    } catch (err) {
      console.error('Error fetching member:', err);
      setError('Failed to load member data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  const handleInputChange = (field: string, value: any) => {
    if (!isEditMode) return;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    console.log('******* HANDLE SAVE STARTED *******', {
      isEditMode,
      formDataNotes: formData.member_notes,
      originalDataNotes: originalData?.member_notes,
      formDataNotesCount: formData.member_notes.length,
      originalDataNotesCount: originalData?.member_notes?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Validate distribution class coverages before saving
      const invalidCoverages = formData.distribution_class_coverages.filter(
        coverage => !coverage.start_date || !coverage.distribution_class_id
      );
      
      if (invalidCoverages.length > 0) {
        setError('Please complete all distribution class coverage entries before saving. Each coverage must have a distribution class selected and a start date.');
        setSaving(false);
        return;
      }
      
      // Check for multiple active coverages (no end date)
      const activeCoverages = formData.distribution_class_coverages.filter(
        coverage => coverage.start_date && coverage.distribution_class_id && !coverage.end_date
      );
      
      if (activeCoverages.length > 1) {
        setError('Only one distribution class coverage can be active at a time. Please set an end date for existing active coverages before adding a new one.');
        setSaving(false);
        return;
      }
      
      // Validate member status coverages before saving
      const invalidMemberStatusCoverages = formData.member_status_coverages.filter(
        coverage => !coverage.start_date || !coverage.member_status_id
      );
      
      if (invalidMemberStatusCoverages.length > 0) {
        setError('Please complete all member status coverage entries before saving. Each coverage must have a member status selected and a start date.');
        setSaving(false);
        return;
      }
      
      // Check for multiple active member status coverages (no end date)
      const activeMemberStatusCoverages = formData.member_status_coverages.filter(
        coverage => coverage.start_date && coverage.member_status_id && !coverage.end_date
      );
      
      if (activeMemberStatusCoverages.length > 1) {
        setError('Only one member status coverage can be active at a time. Please set an end date for existing active coverages before adding a new one.');
        setSaving(false);
        return;
      }
      
      // Validate insurance plan coverages before saving
      const invalidInsurancePlanCoverages = formData.insurance_plan_coverages.filter(
        coverage => !coverage.start_date || !coverage.insurance_plan_id
      );
      
      if (invalidInsurancePlanCoverages.length > 0) {
        setError('Please complete all insurance plan coverage entries before saving. Each coverage must have an insurance plan selected and a start date.');
        setSaving(false);
        return;
      }
      
      // Check for multiple active insurance plan coverages (no end date)
      const activeInsurancePlanCoverages = formData.insurance_plan_coverages.filter(
        coverage => coverage.start_date && coverage.insurance_plan_id && !coverage.end_date
      );
      
      if (activeInsurancePlanCoverages.length > 1) {
        setError('Only one insurance plan coverage can be active at a time. Please set an end date for existing active coverages before adding a new one.');
        setSaving(false);
        return;
      }
      
      // Convert dates to timezone-aware format to match backend expectations
      const formatDateForAPI = (dateStr: string | undefined) => {
        if (!dateStr) return null;
        
        // If it's already a full ISO string, return as-is
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateStr)) {
          return dateStr;
        }
        
        // If it's YYYY-MM-DD format, convert to timezone-aware ISO string
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          // Create date at midnight UTC to match backend expectations
          return new Date(dateStr + 'T00:00:00.000Z').toISOString();
        }
        
        // Fallback: extract date part and convert to UTC
        const datePart = dateStr.split('T')[0];
        return new Date(datePart + 'T00:00:00.000Z').toISOString();
      };

      // Process coverage changes to handle transaction issues
      // We need to handle coverages that are being ended and new ones being created separately
      // to avoid constraint violations when ending one coverage and starting another
      
      // Only process distribution class coverages if they've actually been modified
      const originalDistributionCoverages = originalData?.distribution_class_coverages || [];
      const distributionCoveragesChanged = 
        JSON.stringify(formData.distribution_class_coverages) !== JSON.stringify(originalDistributionCoverages);
      
      const processedDistributionCoverages = distributionCoveragesChanged ? formData.distribution_class_coverages
        .map(coverage => {
          // Skip coverages that don't have required fields set
          if (!coverage.start_date || !coverage.distribution_class_id) {
            return null; // Will be filtered out below
          }
          
          return {
            ...(coverage.id && coverage.id > 0 && { id: coverage.id }),
            distribution_class_id: coverage.distribution_class_id,
            start_date: formatDateForAPI(coverage.start_date),
            end_date: formatDateForAPI(coverage.end_date),
          };
        })
        .filter(coverage => coverage !== null) : [];

      // Only process member status coverages if they've actually been modified
      const originalMemberStatusCoverages = originalData?.member_status_coverages || [];
      const memberStatusCoveragesChanged = 
        JSON.stringify(formData.member_status_coverages) !== JSON.stringify(originalMemberStatusCoverages);
      
      const processedMemberStatusCoverages = memberStatusCoveragesChanged ? formData.member_status_coverages
        .map(coverage => {
          // Skip coverages that don't have required fields set
          if (!coverage.start_date || !coverage.member_status_id) {
            return null; // Will be filtered out below
          }
          
          return {
            ...(coverage.id && coverage.id > 0 && { id: coverage.id }),
            member_status_id: coverage.member_status_id,
            start_date: formatDateForAPI(coverage.start_date),
            end_date: formatDateForAPI(coverage.end_date),
          };
        })
        .filter(coverage => coverage !== null) : [];

      // Only process insurance plan coverages if they've actually been modified
      const originalInsurancePlanCoverages = originalData?.insurance_plan_coverages || [];
      const insurancePlanCoveragesChanged = 
        JSON.stringify(formData.insurance_plan_coverages) !== JSON.stringify(originalInsurancePlanCoverages);
      
      
      const processedInsurancePlanCoverages = insurancePlanCoveragesChanged ? formData.insurance_plan_coverages
        .map(coverage => {
          // Skip coverages that don't have required fields set
          if (!coverage.start_date || !coverage.insurance_plan_id) {
            return null; // Will be filtered out below
          }
          
          const processed = {
            ...(coverage.id && coverage.id > 0 && { id: coverage.id }),
            member_id: parseInt(resolvedParams.id),
            insurance_plan_id: coverage.insurance_plan_id,
            policy_number: coverage.policy_number || '',
            start_date: formatDateForAPI(coverage.start_date),
            end_date: formatDateForAPI(coverage.end_date),
          };
          
          return processed;
        })
        .filter(coverage => coverage !== null) : [];

      // Only process dependent coverages if they've actually been modified
      const originalDependentCoverages = originalData?.dependent_coverages || [];
      const dependentCoveragesChanged = 
        JSON.stringify(formData.dependent_coverages) !== JSON.stringify(originalDependentCoverages);
      
      console.log('**** DEPENDENT SAVE DEBUG ****', {
        originalCount: originalDependentCoverages.length,
        formDataCount: formData.dependent_coverages.length,
        dependentCoveragesChanged,
        originalData: originalDependentCoverages,
        formData: formData.dependent_coverages
      });
      
      const processedDependentCoverages = dependentCoveragesChanged ? formData.dependent_coverages
        .map(coverage => {
          // Skip coverages that don't have a dependent with required fields
          if (!coverage.dependent || !coverage.dependent.first_name || !coverage.dependent.last_name) {
            return null; // Will be filtered out below
          }
          
          const processed = {
            ...(coverage.id && coverage.id > 0 && { id: coverage.id }),
            member_id: parseInt(resolvedParams.id),
            start_date: formatDateForAPI(coverage.start_date),
            end_date: formatDateForAPI(coverage.end_date),
            dependent: {
              ...(coverage.dependent.id && coverage.dependent.id > 0 && { id: coverage.dependent.id }),
              first_name: coverage.dependent.first_name,
              last_name: coverage.dependent.last_name,
              middle_name: coverage.dependent.middle_name || null,
              suffix: coverage.dependent.suffix || null,
              phone: coverage.dependent.phone || null,
              email: coverage.dependent.email || null,
              gender: coverage.dependent.gender || null,
              birth_date: coverage.dependent.birth_date || null,
              dependent_type: coverage.dependent.dependent_type,
              include_cms: coverage.dependent.include_cms,
              marriage_date: coverage.dependent.marriage_date || null,
              marriage_certificate: coverage.dependent.marriage_certificate || false,
            }
          };
          
          return processed;
        })
        .filter(coverage => coverage !== null) : [];

      console.log('**** PROCESSED DEPENDENT COVERAGES ****', {
        processedDependentCoverages,
        hasDependentCoverageChanges: dependentCoveragesChanged,
        willIncludeInPayload: dependentCoveragesChanged && processedDependentCoverages
      });

      // Only process member notes if they've actually been modified
      const originalMemberNotes = originalData?.member_notes || [];
      const memberNotesChanged = 
        JSON.stringify(formData.member_notes) !== JSON.stringify(originalMemberNotes);
      
      console.log('******* MEMBER NOTES CHANGE DETECTION *******', {
        originalMemberNotes,
        formDataMemberNotes: formData.member_notes,
        originalJSON: JSON.stringify(originalMemberNotes),
        formDataJSON: JSON.stringify(formData.member_notes),
        memberNotesChanged,
        originalCount: originalMemberNotes.length,
        formDataCount: formData.member_notes.length,
        jsonStringsMatch: JSON.stringify(originalMemberNotes) === JSON.stringify(formData.member_notes),
        originalNoteIds: originalMemberNotes.map(note => note.id),
        formDataNoteIds: formData.member_notes.map(note => note.id),
        timestamp: new Date().toISOString()
      });
      
      const processedMemberNotes = memberNotesChanged ? formData.member_notes
        .map(note => {
          // Skip notes that don't have a message
          if (!note.message || note.message.trim() === '') {
            return null; // Will be filtered out below
          }
          
          return {
            ...(note.id && note.id > 0 && { id: note.id }),
            member_id: parseInt(resolvedParams.id),
            message: note.message.trim(),
          };
        })
        .filter(note => note !== null) : [];

      console.log('******* PROCESSED MEMBER NOTES *******', {
        rawFormDataNotes: formData.member_notes,
        rawFormDataNoteIds: formData.member_notes.map(note => note.id),
        processedMemberNotes,
        processedMemberNoteIds: processedMemberNotes.map(note => note.id || 'NO_ID'),
        hasMemberNotesChanged: memberNotesChanged,
        processedNotesCount: processedMemberNotes.length,
        willIncludeInPayload: memberNotesChanged,
        filteredOutCount: memberNotesChanged ? formData.member_notes.length - processedMemberNotes.length : 0,
        notesWithEmptyMessages: formData.member_notes.filter(note => !note.message || note.message.trim() === ''),
        timestamp: new Date().toISOString()
      });

      // Note: We include all coverages (ending and new) in a single API call
      // The backend will handle updates vs creates based on the presence of IDs

      // Base data for member updates (without coverages)
      const baseUpdateData = {
        // Core member fields
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
        
        // Transform addresses with proper type field
        addresses: formData.addresses.map(addr => ({
          ...(addr.id && { id: addr.id }),
          type: 'person_address', // Required polymorphic identity
          label: addr.type, // Map UI 'type' to API 'label'
          street1: addr.street1,
          street2: addr.street2 || null,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
        })),
        
        // Transform phone numbers with proper type field  
        phone_numbers: formData.phoneNumbers.map(phone => ({
          ...(phone.id && { id: phone.id }),
          type: 'person_phone_number', // Required polymorphic identity
          label: phone.type, // Map UI 'type' to API 'label'
          number: phone.number,
          country_code: '1', // Default to US
          is_default: false,
        })),
        
        // Transform email addresses with proper type field
        email_addresses: formData.emailAddresses.map(email => ({
          ...(email.id && { id: email.id }),
          type: 'person_email_address', // Required polymorphic identity
          label: email.type, // Map UI 'type' to API 'label'
          email_address: email.email,
          is_default: false,
        })),
      };

      // Determine if we have any coverage changes to process
      const hasDistributionCoverageChanges = distributionCoveragesChanged && processedDistributionCoverages.length > 0;
      const hasMemberStatusCoverageChanges = memberStatusCoveragesChanged && processedMemberStatusCoverages.length > 0;
      const hasInsurancePlanCoverageChanges = insurancePlanCoveragesChanged && processedInsurancePlanCoverages.length > 0;
      const hasDependentCoverageChanges = dependentCoveragesChanged && processedDependentCoverages.length > 0;
      const hasMemberNotesChanges = memberNotesChanged; // We want to include even empty arrays to handle note deletions

      // Single API call with all changes
      const updateData = {
        ...baseUpdateData,
        ...(hasDistributionCoverageChanges && {
          distribution_class_coverages: processedDistributionCoverages
        }),
        ...(hasMemberStatusCoverageChanges && {
          member_status_coverages: processedMemberStatusCoverages
        }),
        ...(hasInsurancePlanCoverageChanges && {
          insurance_plan_coverages: processedInsurancePlanCoverages
        }),
        ...(hasDependentCoverageChanges && {
          dependent_coverages: processedDependentCoverages
        }),
        ...(hasMemberNotesChanges && {
          member_notes: processedMemberNotes
        }),
      };
      
      console.log('**** FINAL API PAYLOAD ****', {
        hasDependentCoverageChanges,
        processedDependentCoveragesLength: processedDependentCoverages.length,
        hasMemberNotesChanges,
        processedMemberNotesLength: processedMemberNotes.length,
        updateData,
        dependentCoverages: updateData.dependent_coverages || 'NOT INCLUDED',
        memberNotes: updateData.member_notes || 'NOT INCLUDED'
      });
      
      console.log('******* ABOUT TO CALL API *******', {
        memberId: resolvedParams.id,
        hasMemberNotesChanges,
        updateDataHasMemberNotes: 'member_notes' in updateData,
        updateDataMemberNotes: updateData.member_notes,
        updateDataMemberNotesCount: updateData.member_notes?.length || 0,
        fullUpdateData: updateData,
        timestamp: new Date().toISOString()
      });
      
      const response = await backendApiClient.members.update(resolvedParams.id, updateData);
      
      console.log('******* API UPDATE COMPLETED *******', {
        response,
        requestedDependentCoverages: updateData.dependent_coverages?.length || 0,
        requestedMemberNotes: updateData.member_notes?.length || 0,
        responseStatus: response?.status || 'unknown',
        responseMemberNotes: response?.member_notes,
        apiCallSuccessful: true,
        timestamp: new Date().toISOString()
      });
      
      // Refresh data from API to get updated nested info
      console.log('******* REFRESHING MEMBER DATA AFTER SAVE *******', {
        aboutToCallFetchMember: true,
        timestamp: new Date().toISOString()
      });
      
      await fetchMember();
      
      console.log('******* MEMBER DATA REFRESHED AFTER SAVE *******', {
        newFormDataNotes: formData.member_notes,
        newFormDataNotesCount: formData.member_notes.length,
        timestamp: new Date().toISOString()
      });
      
      setHasUnsavedChanges(false);
      setSuccess('Member data saved successfully!');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
      router.push(`/dashboard/members/${resolvedParams.id}?mode=view`);
    } catch (err) {
      console.log('******* ERROR SAVING MEMBER *******', {
        error: err,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorStack: err instanceof Error ? err.stack : 'No stack trace',
        timestamp: new Date().toISOString()
      });
      console.error('Error saving member:', err);
      setError('Failed to save member data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setFormData(originalData!);
        setHasUnsavedChanges(false);
        router.push(`/dashboard/members/${resolvedParams.id}?mode=view`);
      }
    } else {
      router.push(`/dashboard/members/${resolvedParams.id}?mode=view`);
    }
  };

  const handleBackToList = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/dashboard/members');
      }
    } else {
      router.push('/dashboard/members');
    }
  };

  const addAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        { type: 'Home', street1: '', street2: '', city: '', state: '', zip: '' }
      ]
    }));
  };

  const removeAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index)
    }));
  };

  const updateAddress = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.map((addr, i) => 
        i === index ? { ...addr, [field]: value } : addr
      )
    }));
  };

  const addPhoneNumber = () => {
    setFormData(prev => ({
      ...prev,
      phoneNumbers: [
        ...prev.phoneNumbers,
        { type: 'Mobile', number: '', extension: '' }
      ]
    }));
  };

  const removePhoneNumber = (index: number) => {
    setFormData(prev => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers.filter((_, i) => i !== index)
    }));
  };

  const updatePhoneNumber = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers.map((phone, i) => 
        i === index ? { ...phone, [field]: value } : phone
      )
    }));
  };

  const addEmailAddress = () => {
    setFormData(prev => ({
      ...prev,
      emailAddresses: [
        ...prev.emailAddresses,
        { type: 'Personal', email: '' }
      ]
    }));
  };

  const removeEmailAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emailAddresses: prev.emailAddresses.filter((_, i) => i !== index)
    }));
  };

  const updateEmailAddress = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emailAddresses: prev.emailAddresses.map((email, i) => 
        i === index ? { ...email, [field]: value } : email
      )
    }));
  };

  const addDependent = () => {
    const now = new Date();
    const todayDateISO = new Date(now.toISOString().split('T')[0] + 'T00:00:00.000Z').toISOString();
    const newDependentCoverage: DependentCoverage = {
      id: -Date.now(), // Use negative timestamp for temporary unique ID
      start_date: todayDateISO,
      member_id: formData.id,
      dependent_id: 0, // Will be set by API
      dependent: {
        first_name: '',
        last_name: '',
        dependent_type: 'DEPENDENT',
        include_cms: false,
      }
    };
    
    setFormData(prev => ({
      ...prev,
      dependent_coverages: [...prev.dependent_coverages, newDependentCoverage]
    }));
  };

  const removeDependent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      dependent_coverages: prev.dependent_coverages.filter((_, i) => i !== index)
    }));
  };

  const updateDependent = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      dependent_coverages: prev.dependent_coverages.map((depCoverage, i) => 
        i === index 
          ? {
              ...depCoverage,
              dependent: {
                ...depCoverage.dependent,
                [field]: value
              } as Dependent
            }
          : depCoverage
      )
    }) as MemberFormData);
  };

  const updateDependentCoverage = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      dependent_coverages: prev.dependent_coverages.map((depCoverage, i) => 
        i === index 
          ? {
              ...depCoverage,
              [field]: value
            }
          : depCoverage
      )
    }));
  };

  const addEmployer = () => {
    const newEmployerCoverage: EmployerCoverage = {
      start_date: new Date().toISOString(),
      member_id: formData.id,
      employer_id: 0, // Will be set by API
      employer: {
        name: '',
        ein: '',
        include_cms: false,
        is_forced_distribution: false,
        force_distribution_class_id: undefined,
        employer_type_id: undefined,
      }
    };
    
    setFormData(prev => ({
      ...prev,
      employer_coverages: [...prev.employer_coverages, newEmployerCoverage]
    }));
  };

  const removeEmployer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      employer_coverages: prev.employer_coverages.filter((_, i) => i !== index)
    }));
  };

  const updateEmployer = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      employer_coverages: prev.employer_coverages.map((empCoverage, i) => 
        i === index 
          ? {
              ...empCoverage,
              employer: {
                ...empCoverage.employer,
                [field]: value
              }
            }
          : empCoverage
      )
    }));
  };

  // Insurance Plan Coverage management functions
  const addInsurancePlanCoverage = () => {
    const now = new Date();
    const todayDateISO = new Date(now.toISOString().split('T')[0] + 'T00:00:00.000Z').toISOString();
    const newCoverage: InsurancePlanCoverage = {
      id: -Date.now(), // Use negative timestamp for temporary unique ID
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      start_date: todayDateISO, // Timezone-aware format
      end_date: undefined,
      member_id: formData.id,
      insurance_plan_id: 0, // Will be selected by user
      policy_number: '',
      insurance_plan: undefined,
    };
    
    setFormData(prev => ({
      ...prev,
      insurance_plan_coverages: [...prev.insurance_plan_coverages, newCoverage]
    }));
  };

  const removeInsurancePlanCoverage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      insurance_plan_coverages: prev.insurance_plan_coverages.filter((_, i) => i !== index)
    }));
  };

  const updateInsurancePlanCoverage = useCallback((index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      insurance_plan_coverages: prev.insurance_plan_coverages.map((coverage, i) => 
        i === index ? { ...coverage, [field]: value } : coverage
      )
    }));
  }, []);

  const addNote = () => {
    const now = new Date();
    const newNote: MemberNote = {
      id: -Date.now(), // Use negative timestamp for temporary unique ID
      member_id: formData.id,
      message: '',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    
    console.log('******* ADD NOTE DEBUG *******', {
      newNote,
      currentNotes: formData.member_notes,
      memberId: formData.id,
      timestamp: new Date().toISOString()
    });
    
    setFormData(prev => {
      const updatedFormData = {
        ...prev,
        member_notes: [...prev.member_notes, newNote]
      };
      
      console.log('******* ADD NOTE - FORM DATA UPDATED *******', {
        previousNotesCount: prev.member_notes.length,
        newNotesCount: updatedFormData.member_notes.length,
        newFormDataNotes: updatedFormData.member_notes,
        timestamp: new Date().toISOString()
      });
      
      return updatedFormData;
    });
  };

  const removeNote = (index: number) => {
    console.log('******* REMOVE NOTE DEBUG *******', {
      index,
      noteBeingRemoved: formData.member_notes[index],
      currentNotes: formData.member_notes,
      currentNotesCount: formData.member_notes.length,
      timestamp: new Date().toISOString()
    });
    
    setFormData(prev => {
      const noteToRemove = prev.member_notes[index];
      const updatedNotes = prev.member_notes.filter((_, i) => i !== index);
      
      const updatedFormData = {
        ...prev,
        member_notes: updatedNotes
      };
      
      console.log('******* REMOVE NOTE - FORM DATA UPDATED *******', {
        index,
        noteRemoved: noteToRemove,
        previousNotesCount: prev.member_notes.length,
        newNotesCount: updatedFormData.member_notes.length,
        newFormDataNotes: updatedFormData.member_notes,
        timestamp: new Date().toISOString()
      });
      
      return updatedFormData;
    });
  };

  const updateNote = (index: number, field: string, value: any) => {
    console.log('******* UPDATE NOTE DEBUG *******', {
      index,
      field,
      value,
      currentNotes: formData.member_notes,
      noteBeingUpdated: formData.member_notes[index],
      timestamp: new Date().toISOString()
    });
    
    setFormData(prev => {
      const updatedNotes = prev.member_notes.map((note, i) => 
        i === index ? { ...note, [field]: value } : note
      );
      
      const updatedFormData = {
        ...prev,
        member_notes: updatedNotes
      };
      
      console.log('******* UPDATE NOTE - FORM DATA UPDATED *******', {
        index,
        field,
        value,
        previousNote: prev.member_notes[index],
        updatedNote: updatedNotes[index],
        allUpdatedNotes: updatedNotes,
        timestamp: new Date().toISOString()
      });
      
      return updatedFormData;
    });
  };

  // Distribution Class Coverage management functions
  const addDistributionClassCoverage = () => {
    const now = new Date();
    const todayDateISO = new Date(now.toISOString().split('T')[0] + 'T00:00:00.000Z').toISOString();
    const newCoverage: DistributionClassCoverage = {
      id: -Date.now(), // Use negative timestamp for temporary unique ID
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      start_date: todayDateISO, // Timezone-aware format
      end_date: undefined,
      member_id: formData.id,
      distribution_class_id: 0, // Will be selected by user
      distribution_class: undefined,
    };
    
    setFormData(prev => ({
      ...prev,
      distribution_class_coverages: [...prev.distribution_class_coverages, newCoverage]
    }));
  };

  const removeDistributionClassCoverage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      distribution_class_coverages: prev.distribution_class_coverages.filter((_, i) => i !== index)
    }));
  };

  const updateDistributionClassCoverage = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      distribution_class_coverages: prev.distribution_class_coverages.map((coverage, i) => 
        i === index ? { ...coverage, [field]: value } : coverage
      )
    }));
  };

  // Member Status Coverage management functions
  const addMemberStatusCoverage = () => {
    // Store current scroll position before state update
    const currentScrollY = window.scrollY;
    
    const now = new Date();
    const todayDateISO = new Date(now.toISOString().split('T')[0] + 'T00:00:00.000Z').toISOString();
    const newCoverage: MemberStatusCoverage = {
      id: -Date.now(), // Use negative timestamp for temporary unique ID
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      start_date: todayDateISO, // Timezone-aware format
      end_date: undefined,
      member_id: formData.id,
      member_status_id: 0, // Will be selected by user
      member_status: undefined,
    };
    
    setFormData(prev => ({
      ...prev,
      member_status_coverages: [...prev.member_status_coverages, newCoverage]
    }));
    
    // Restore scroll position after state update
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      window.scrollTo({
        top: currentScrollY,
        behavior: 'instant'
      });
    });
  };

  const removeMemberStatusCoverage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      member_status_coverages: prev.member_status_coverages.filter((_, i) => i !== index)
    }));
  };

  const updateMemberStatusCoverage = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      member_status_coverages: prev.member_status_coverages.map((coverage, i) => 
        i === index ? { ...coverage, [field]: value } : coverage
      )
    }));
  };

  // Fund Ledger functions
  const fetchLedgerEntries = useCallback(async () => {
    if (activeTab !== 'fund-ledger') return;
    
    try {
      setLedgerLoading(true);
      setLedgerError(null);
      
      const params: any = {
        offset: (ledgerCurrentPage - 1) * ledgerItemsPerPage,
        limit: ledgerItemsPerPage,
      };
      
      if (accountTypeFilter !== 'all') {
        params.account_type = accountTypeFilter.toUpperCase();
      }
      
      if (entryTypeFilter !== 'all') {
        params.entry_type = entryTypeFilter;
      }
      
      if (startDateFilter) {
        params.start_date = startDateFilter;
      }
      
      if (endDateFilter) {
        params.end_date = endDateFilter;
      }
      
      const response = await backendApiClient.members.getLedgerEntries!(resolvedParams.id, params);
      
      setLedgerEntries(response.items);
      setLedgerTotalEntries(response.total);
    } catch (err) {
      console.error('Error fetching ledger entries:', err);
      setLedgerError('Failed to load ledger entries. Please try again.');
      setLedgerEntries([]);
    } finally {
      setLedgerLoading(false);
    }
  }, [resolvedParams.id, activeTab, ledgerCurrentPage, ledgerItemsPerPage, accountTypeFilter, entryTypeFilter, startDateFilter, endDateFilter]);
  
  const fetchLedgerEntryTypes = useCallback(async () => {
    try {
      const types = await backendApiClient.ledgerEntries.getTypes();
      setLedgerEntryTypes(types);
    } catch (err) {
      console.error('Error fetching ledger entry types:', err);
    }
  }, []);
  
  const fetchDistributionClasses = useCallback(async () => {
    try {
      const classes = await backendApiClient.distributionClasses.list();
      setDistributionClasses(classes);
    } catch (err) {
      console.error('Error fetching distribution classes:', err);
    }
  }, []);
  
  const fetchMemberStatuses = useCallback(async () => {
    try {
      const statuses = await backendApiClient.memberStatuses.list();
      setMemberStatuses(statuses);
    } catch (err) {
      console.error('Error fetching member statuses:', err);
    }
  }, []);
  
  const fetchInsurancePlans = useCallback(async () => {
    try {
      const response = await backendApiClient.insurancePlans.list({ limit: 1000 }); // Get all insurance plans
      setInsurancePlans(response.items || []);
    } catch (err) {
      console.error('Error fetching insurance plans:', err);
      setInsurancePlans([]); // Set empty array on error
    }
  }, []);
  
  const fetchClaimTypes = useCallback(async () => {
    try {
      const types: string[] = await backendApiClient.claimTypes.list();
      if (Array.isArray(types)) {
        // Transform the array of strings to objects with value and label
        const transformedTypes = types.map((type) => ({
          value: type,
          label: type
        }));
        setClaimTypes(transformedTypes);
      } else {
        console.error('Claim types response is not an array:', types);
        setClaimTypes([]);
      }
    } catch (err) {
      console.error('Error fetching claim types:', err);
      setClaimTypes([]);
    }
  }, []);
  
  const toggleEntryExpansion = (entryId: number) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };
  
  const handleDateRangeChange = (range: string) => {
    setDateRangeFilter(range);
    
    const now = new Date();
    let start = '';
    let end = '';
    
    switch (range) {
      case 'this-month':
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'last-month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'this-year':
        start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
      case 'last-year':
        start = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
        break;
      default:
        start = '';
        end = '';
    }
    
    setStartDateFilter(start);
    setEndDateFilter(end);
    setLedgerCurrentPage(1); // Reset to first page
  };
  
  const handleFilterChange = () => {
    setLedgerCurrentPage(1); // Reset to first page when filters change
  };
  
  const handleCreateClaim = async () => {
    if (!claimForm.account_id || !claimForm.claim_type || !claimForm.amount) {
      setError('Please fill in all required fields: Account, Claim Type, and Amount.');
      return;
    }
    
    try {
      setCreatingClaim(true);
      setError(null);
      
      const claimData = {
        account_id: parseInt(String(claimForm.account_id)),
        member_id: parseInt(resolvedParams.id),
        posted: false,
        suspended: false,
        amount: parseFloat(claimForm.amount),
        posted_date: claimForm.posted_date,
        description: claimForm.description || '',
        check_date: claimForm.check_date || null,
        check_number: claimForm.check_number || null,
        allow_overdraft: claimForm.allow_overdraft,
        claim_type: claimForm.claim_type,
      };
      
      await backendApiClient.claims.create(claimData);
      
      // Reset form
      setClaimForm({
        account_id: '',
        claim_type: '',
        description: '',
        check_number: '',
        check_date: '',
        amount: '',
        posted_date: new Date().toISOString().split('T')[0],
        allow_overdraft: false
      });
      
      setSuccess('Claim created successfully! Refreshing data...');
      await fetchMember(); // Refresh member details
      if (activeTab === 'fund-ledger') {
        fetchLedgerEntries(); // Refresh ledger if viewing it
      }
      setSuccess('Claim created and data refreshed!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error creating claim:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to create claim: ${errorMessage}`);
    } finally {
      setCreatingClaim(false);
    }
  };
  
  const handleCreateAdjustment = async () => {
    if (!adjustmentForm.account_id || !adjustmentForm.amount) {
      setError('Please fill in required fields: Account and Adjustment Amount');
      return;
    }
    
    try {
      setCreatingAdjustment(true);
      setError(null);
      
      const adjustmentData = {
        account_id: parseInt(String(adjustmentForm.account_id)),
        member_id: parseInt(resolvedParams.id),
        posted: false,
        suspended: false,
        amount: parseFloat(adjustmentForm.amount),
        posted_date: adjustmentForm.posted_date,
        description: adjustmentForm.description || '',
        allow_overdraft: adjustmentForm.allow_overdraft
      };
      
      await backendApiClient.manualAdjustments.create(adjustmentData);
      
      setSuccess('Manual adjustment created successfully! Refreshing data...');

      // Re-fetch all member data to update fund balances and other details
      await fetchMember();

      // Reset form
      setAdjustmentForm({
        account_id: '',
        amount: '',
        description: '',
        posted_date: new Date().toISOString().split('T')[0],
        allow_overdraft: false
      });
      
      // Refresh ledger entries if on fund-ledger tab
      if (activeTab === 'fund-ledger') {
        fetchLedgerEntries();
      }

      setSuccess('Manual adjustment created and data refreshed!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error creating manual adjustment:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to create manual adjustment: ${errorMessage}`);
    } finally {
      setCreatingAdjustment(false);
    }
  };
  
  // Fetch ledger entries when filters or pagination changes
  useEffect(() => {
    fetchLedgerEntries();
  }, [fetchLedgerEntries]);
  
  // Fetch ledger entry types on component mount
  useEffect(() => {
    fetchLedgerEntryTypes();
  }, [fetchLedgerEntryTypes]);
  
  // Fetch distribution classes on component mount
  useEffect(() => {
    fetchDistributionClasses();
  }, [fetchDistributionClasses]);
  
  // Fetch member statuses on component mount
  useEffect(() => {
    fetchMemberStatuses();
  }, [fetchMemberStatuses]);
  
  // Fetch insurance plans on component mount
  useEffect(() => {
    fetchInsurancePlans();
  }, [fetchInsurancePlans]);
  
  // Fetch claim types on component mount
  useEffect(() => {
    fetchClaimTypes();
  }, [fetchClaimTypes]);
  
  
  // Reset filters when changing to fund ledger tab
  useEffect(() => {
    if (activeTab === 'fund-ledger') {
      setLedgerCurrentPage(1);
      setExpandedEntries(new Set());
    }
  }, [activeTab]);
  
  // Log notes tab rendering
  useEffect(() => {
    if (activeTab === 'notes') {
      console.log('******* NOTES TAB RENDERING *******', {
        activeTab,
        isEditMode,
        notesCount: formData.member_notes.length,
        notes: formData.member_notes,
        timestamp: new Date().toISOString()
      });
    }
  }, [activeTab, formData.member_notes, isEditMode]);
  
  // Track all member_notes changes
  useEffect(() => {
    console.log('******* MEMBER NOTES STATE CHANGED *******', {
      notesCount: formData.member_notes.length,
      noteIds: formData.member_notes.map(note => note.id),
      notes: formData.member_notes,
      timestamp: new Date().toISOString()
    });
  }, [formData.member_notes]);

  // Coverage display component
  const CoverageList = React.memo(({ 
    title, 
    coverages, 
    type 
  }: { 
    title: string; 
    coverages: DistributionClassCoverage[] | MemberStatusCoverage[] | LifeInsuranceCoverage[] | InsurancePlanCoverage[];
    type: 'distribution_class' | 'member_status' | 'life_insurance' | 'insurance_plan';
  }) => {
    const getDisplayName = (coverage: any) => {
      if (type === 'distribution_class' && coverage.distribution_class) {
        return coverage.distribution_class.description;
      }
      if (type === 'member_status' && coverage.member_status) {
        return coverage.member_status.name;
      }
      if (type === 'insurance_plan' && coverage.insurance_plan) {
        return coverage.insurance_plan.name;
      }
      return coverage.status || 'N/A';
    };

    const getSecondaryInfo = (coverage: any) => {
      if (type === 'distribution_class' && coverage.distribution_class) {
        return `Class: ${coverage.distribution_class.name}`;
      }
      if (type === 'member_status' && coverage.member_status) {
        return `Admin Fee: $${coverage.member_status.admin_fee}`;
      }
      if (type === 'insurance_plan') {
        const info = [];
        if (coverage.insurance_plan) {
          info.push(`Type: ${coverage.insurance_plan.type}`);
          info.push(`Code: ${coverage.insurance_plan.code}`);
        }
        if (coverage.policy_number) {
          info.push(`Policy: ${coverage.policy_number}`);
        }
        return info.length > 0 ? info.join(' | ') : null;
      }
      if (type === 'life_insurance') {
        const info = [];
        if (coverage.beneficiary) info.push(`Beneficiary: ${coverage.beneficiary}`);
        if (coverage.beneficiary_info_received !== undefined) {
          info.push(`Beneficiary Info: ${coverage.beneficiary_info_received ? 'Received' : 'Pending'}`);
        }
        return info.length > 0 ? info.join(' | ') : null;
      }
      return null;
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {isEditMode && type === 'distribution_class' && (
            <Button 
              onClick={addDistributionClassCoverage}
              size="sm"
              className="bg-union-600 hover:bg-union-700 text-white"
              aria-label="Add Distribution Class Coverage"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Coverage
            </Button>
          )}
          {isEditMode && type === 'member_status' && (
            <Button 
              onClick={addMemberStatusCoverage}
              size="sm"
              className="bg-union-600 hover:bg-union-700 text-white"
              aria-label="Add Member Status Coverage"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Coverage
            </Button>
          )}
          {isEditMode && type === 'insurance_plan' && (
            <Button 
              onClick={addInsurancePlanCoverage}
              size="sm"
              className="bg-union-600 hover:bg-union-700 text-white"
              aria-label="Add Insurance Plan Coverage"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Coverage
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {coverages.length === 0 ? (
            <p className="text-gray-500 text-sm">No {title.toLowerCase()} found</p>
          ) : (
            <div className="space-y-3">
              {coverages.map((coverage, index) => {
                const displayName = getDisplayName(coverage);
                const secondaryInfo = getSecondaryInfo(coverage);
                
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="space-y-3">
                      {/* Header with remove button for edit mode */}
                      {isEditMode && type === 'distribution_class' && (
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">Coverage #{index + 1}</h4>
                          <Button 
                            onClick={() => removeDistributionClassCoverage(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {isEditMode && type === 'member_status' && (
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">Coverage #{index + 1}</h4>
                          <Button 
                            onClick={() => removeMemberStatusCoverage(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {isEditMode && type === 'insurance_plan' && (
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">Coverage #{index + 1}</h4>
                          <Button 
                            onClick={() => removeInsurancePlanCoverage(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Main coverage selection/display */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {type === 'distribution_class' ? 'Distribution Class' : 
                           type === 'member_status' ? 'Member Status' :
                           type === 'insurance_plan' ? 'Insurance Plan' : 'Coverage Type'}
                        </label>
                        {isEditMode && type === 'distribution_class' ? (
                          <Select 
                            value={(coverage as DistributionClassCoverage).distribution_class_id?.toString() || ''} 
                            onValueChange={(value) => {
                              const selectedClass = distributionClasses.find(dc => dc.id === parseInt(value));
                              updateDistributionClassCoverage(index, 'distribution_class_id', parseInt(value));
                              updateDistributionClassCoverage(index, 'distribution_class', selectedClass);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Distribution Class" />
                            </SelectTrigger>
                            <SelectContent>
                              {distributionClasses.map((dc) => (
                                <SelectItem key={dc.id} value={dc.id.toString()}>
                                  {dc.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : isEditMode && type === 'member_status' ? (
                          <Select 
                            value={(coverage as MemberStatusCoverage).member_status_id?.toString() || ''} 
                            onValueChange={(value) => {
                              const selectedStatus = memberStatuses.find(ms => ms.id === parseInt(value));
                              updateMemberStatusCoverage(index, 'member_status_id', parseInt(value));
                              updateMemberStatusCoverage(index, 'member_status', selectedStatus);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Member Status" />
                            </SelectTrigger>
                            <SelectContent>
                              {memberStatuses.map((ms) => (
                                <SelectItem key={ms.id} value={ms.id.toString()}>
                                  {ms.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : isEditMode && type === 'insurance_plan' ? (
                          <Select 
                            value={(coverage as InsurancePlanCoverage).insurance_plan_id?.toString() || ''} 
                            onValueChange={(value) => {
                              const selectedPlan = insurancePlans.find(ip => ip.id === parseInt(value));
                              updateInsurancePlanCoverage(index, 'insurance_plan_id', parseInt(value));
                              updateInsurancePlanCoverage(index, 'insurance_plan', selectedPlan);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Insurance Plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {insurancePlans.map((ip) => (
                                <SelectItem key={ip.id} value={ip.id?.toString() || ''}>
                                  {ip.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-gray-900">{displayName}</p>
                            {secondaryInfo && (
                              <p className="text-xs text-gray-600 mt-1">{secondaryInfo}</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Date information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                          </label>
                          {isEditMode && type === 'distribution_class' ? (
                            <Input
                              type="date"
                              value={coverage.start_date ? coverage.start_date.split('T')[0] : ''}
                              onChange={(e) => {
                                // Convert date input to ISO string format for consistent backend handling
                                const isoDate = e.target.value ? new Date(e.target.value + 'T00:00:00.000Z').toISOString() : '';
                                updateDistributionClassCoverage(index, 'start_date', isoDate);
                              }}
                            />
                          ) : isEditMode && type === 'member_status' ? (
                            <Input
                              type="date"
                              value={coverage.start_date ? coverage.start_date.split('T')[0] : ''}
                              onChange={(e) => {
                                // Convert date input to ISO string format for consistent backend handling
                                const isoDate = e.target.value ? new Date(e.target.value + 'T00:00:00.000Z').toISOString() : '';
                                updateMemberStatusCoverage(index, 'start_date', isoDate);
                              }}
                            />
                          ) : isEditMode && type === 'insurance_plan' ? (
                            <Input
                              type="date"
                              value={coverage.start_date ? coverage.start_date.split('T')[0] : ''}
                              onChange={(e) => {
                                // Convert date input to ISO string format for consistent backend handling
                                const isoDate = e.target.value ? new Date(e.target.value + 'T00:00:00.000Z').toISOString() : '';
                                updateInsurancePlanCoverage(index, 'start_date', isoDate);
                              }}
                            />
                          ) : (
                            <p className="text-sm">
                              {coverage.start_date ? new Date(coverage.start_date).toLocaleDateString() : 'N/A'}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                          </label>
                          {isEditMode && type === 'distribution_class' ? (
                            <Input
                              type="date"
                              value={coverage.end_date ? coverage.end_date.split('T')[0] : ''}
                              onChange={(e) => {
                                // Convert date input to ISO string format or undefined for empty values
                                const isoDate = e.target.value ? new Date(e.target.value + 'T00:00:00.000Z').toISOString() : undefined;
                                updateDistributionClassCoverage(index, 'end_date', isoDate);
                              }}
                              placeholder="Leave empty for active coverage"
                            />
                          ) : isEditMode && type === 'member_status' ? (
                            <Input
                              type="date"
                              value={coverage.end_date ? coverage.end_date.split('T')[0] : ''}
                              onChange={(e) => {
                                // Convert date input to ISO string format or undefined for empty values
                                const isoDate = e.target.value ? new Date(e.target.value + 'T00:00:00.000Z').toISOString() : undefined;
                                updateMemberStatusCoverage(index, 'end_date', isoDate);
                              }}
                              placeholder="Leave empty for active coverage"
                            />
                          ) : isEditMode && type === 'insurance_plan' ? (
                            <Input
                              type="date"
                              value={coverage.end_date ? coverage.end_date.split('T')[0] : ''}
                              onChange={(e) => {
                                // Convert date input to ISO string format or undefined for empty values
                                const isoDate = e.target.value ? new Date(e.target.value + 'T00:00:00.000Z').toISOString() : undefined;
                                updateInsurancePlanCoverage(index, 'end_date', isoDate);
                              }}
                              placeholder="Leave empty for active coverage"
                            />
                          ) : (
                            <p className="text-sm">
                              {coverage.end_date ? new Date(coverage.end_date).toLocaleDateString() : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Policy Number field for insurance plan coverages */}
                      {type === 'insurance_plan' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Policy Number
                          </label>
                          {isEditMode ? (
                            <Input
                              key={`policy-${index}`}
                              defaultValue={(coverage as InsurancePlanCoverage).policy_number || ''}
                              onBlur={(e) => updateInsurancePlanCoverage(index, 'policy_number', e.target.value)}
                              placeholder="Enter policy number"
                            />
                          ) : (
                            <p className="text-sm">
                              {(coverage as InsurancePlanCoverage).policy_number || 'N/A'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  });
  
  CoverageList.displayName = 'CoverageList';

  if (loading) {
    return (
      <div className="space-y-6" data-testid="loading">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64"></div>
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error && !formData.id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={handleBackToList}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold text-union-900">Member Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button 
                onClick={fetchMember} 
                className="mt-4 bg-union-600 hover:bg-union-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={handleBackToList}
            className="hover:bg-gray-100"
            aria-label="Back to members list"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-union-900">
              {isEditMode ? 'Edit Member' : 'Member Management'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-600">
                {formData.first_name} {formData.last_name}
              </span>
              <Badge 
                variant="outline" 
                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                Unique ID: {formData.unique_id}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isEditMode ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={saving}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-union-600 hover:bg-union-700 text-white"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => router.push(`/dashboard/members/${resolvedParams.id}?mode=edit`)}
              className="bg-union-600 hover:bg-union-700 text-white"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="text-red-600 text-sm">{error}</div>
          </CardContent>
        </Card>
      )}
      
      {/* Success Display */}
      {success && (
        <Card>
          <CardContent className="p-4">
            <div className="text-green-600 text-sm">{success}</div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-union-600 text-union-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'member' && (
        <div className="grid gap-6">
          {/* Member Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Member Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SSN
                  </label>
                  <Input
                    value="***-**-6789"
                    disabled={true}
                    className="bg-gray-50"
                  />
                </div>

                <div></div> {/* Empty space for grid layout */}
                <div></div> {/* Empty space for grid layout */}

                <div>
                  <label htmlFor="member-first-name" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <Input
                    id="member-first-name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    disabled={!isEditMode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name
                  </label>
                  <Input
                    value={formData.middle_name || ''}
                    onChange={(e) => handleInputChange('middle_name', e.target.value)}
                    disabled={!isEditMode}
                  />
                </div>

                <div>
                  <label htmlFor="member-last-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <Input
                    id="member-last-name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    disabled={!isEditMode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Suffix
                  </label>
                  <Select 
                    value={formData.suffix || 'none'} 
                    onValueChange={(value) => handleInputChange('suffix', value === 'none' ? '' : value)}
                    disabled={!isEditMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="Jr.">Jr.</SelectItem>
                      <SelectItem value="Sr.">Sr.</SelectItem>
                      <SelectItem value="II">II</SelectItem>
                      <SelectItem value="III">III</SelectItem>
                      <SelectItem value="IV">IV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <Select 
                    value={formData.gender || 'not-specified'} 
                    onValueChange={(value) => handleInputChange('gender', value === 'not-specified' ? undefined : value)}
                    disabled={!isEditMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-specified">Not Specified</SelectItem>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Date
                  </label>
                  <Input
                    type="date"
                    value={formData.birth_date ? formData.birth_date.split('T')[0] : ''}
                    onChange={(e) => handleInputChange('birth_date', e.target.value)}
                    disabled={!isEditMode}
                  />
                </div>
              </div>
              
              {/* Checkbox Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="deceased"
                    checked={formData.deceased}
                    onCheckedChange={(checked) => handleInputChange('deceased', checked)}
                    disabled={!isEditMode}
                  />
                  <Label 
                    htmlFor="deceased" 
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Deceased
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-cms"
                    checked={formData.include_cms}
                    onCheckedChange={(checked) => handleInputChange('include_cms', checked)}
                    disabled={!isEditMode}
                  />
                  <Label 
                    htmlFor="include-cms" 
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Include in CMS Report
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lock-distribution"
                    checked={formData.is_forced_distribution}
                    onCheckedChange={(checked) => handleInputChange('is_forced_distribution', checked)}
                    disabled={!isEditMode}
                  />
                  <Label 
                    htmlFor="lock-distribution" 
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Lock Distribution Class
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Addresses</CardTitle>
              {isEditMode && (
                <Button 
                  onClick={addAddress}
                  size="sm"
                  className="bg-union-600 hover:bg-union-700 text-white"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Address
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.addresses.length === 0 ? (
                <p className="text-gray-500 text-sm">No addresses added</p>
              ) : (
                formData.addresses.map((address, index) => (
                  <div key={address.id || `address-${index}`} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address Type
                          </label>
                          <Select 
                            value={address.type} 
                            onValueChange={(value) => updateAddress(index, 'type', value)}
                            disabled={!isEditMode}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Home">Home</SelectItem>
                              <SelectItem value="Work">Work</SelectItem>
                              <SelectItem value="Mailing">Mailing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {isEditMode && (
                        <Button 
                          onClick={() => removeAddress(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="md:col-span-2 lg:col-span-2">
                        <label htmlFor={`address-street1-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address 1
                        </label>
                        <Input
                          id={`address-street1-${index}`}
                          value={address.street1}
                          onChange={(e) => updateAddress(index, 'street1', e.target.value)}
                          disabled={!isEditMode}
                        />
                      </div>
                      
                      <div className="md:col-span-2 lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address 2
                        </label>
                        <Input
                          value={address.street2 || ''}
                          onChange={(e) => updateAddress(index, 'street2', e.target.value)}
                          disabled={!isEditMode}
                          placeholder="Apt, Suite, Unit, etc. (Optional)"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <Input
                          value={address.city}
                          onChange={(e) => updateAddress(index, 'city', e.target.value)}
                          disabled={!isEditMode}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <Input
                          value={address.state}
                          onChange={(e) => updateAddress(index, 'state', e.target.value)}
                          disabled={!isEditMode}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP Code
                        </label>
                        <Input
                          value={address.zip}
                          onChange={(e) => updateAddress(index, 'zip', e.target.value)}
                          disabled={!isEditMode}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Phone Numbers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Phone Numbers</CardTitle>
              {isEditMode && (
                <Button 
                  onClick={addPhoneNumber}
                  size="sm"
                  className="bg-union-600 hover:bg-union-700 text-white"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Phone
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.phoneNumbers.length === 0 ? (
                <p className="text-gray-500 text-sm">No phone numbers added</p>
              ) : (
                formData.phoneNumbers.map((phone, index) => (
                  <div key={phone.id || `phone-${index}`} className="flex items-center gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Type
                        </label>
                        <Select 
                          value={phone.type} 
                          onValueChange={(value) => updatePhoneNumber(index, 'type', value)}
                          disabled={!isEditMode}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mobile">Mobile</SelectItem>
                            <SelectItem value="Home">Home</SelectItem>
                            <SelectItem value="Work">Work</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label htmlFor={`phone-number-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <Input
                          id={`phone-number-${index}`}
                          value={phone.number}
                          onChange={(e) => updatePhoneNumber(index, 'number', e.target.value)}
                          disabled={!isEditMode}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Extension
                        </label>
                        <Input
                          value={phone.extension || ''}
                          onChange={(e) => updatePhoneNumber(index, 'extension', e.target.value)}
                          disabled={!isEditMode}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    
                    {isEditMode && (
                      <Button 
                        onClick={() => removePhoneNumber(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 mt-6"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Email Addresses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Email Addresses</CardTitle>
              {isEditMode && (
                <Button 
                  onClick={addEmailAddress}
                  size="sm"
                  className="bg-union-600 hover:bg-union-700 text-white"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Email
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.emailAddresses.length === 0 ? (
                <p className="text-gray-500 text-sm">No email addresses added</p>
              ) : (
                formData.emailAddresses.map((email, index) => (
                  <div key={email.id || `email-${index}`} className="flex items-center gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Type
                        </label>
                        <Select 
                          value={email.type} 
                          onValueChange={(value) => updateEmailAddress(index, 'type', value)}
                          disabled={!isEditMode}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Personal">Personal</SelectItem>
                            <SelectItem value="Work">Work</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label htmlFor={`email-address-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <Input
                          id={`email-address-${index}`}
                          type="email"
                          value={email.email}
                          onChange={(e) => updateEmailAddress(index, 'email', e.target.value)}
                          disabled={!isEditMode}
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                    
                    {isEditMode && (
                      <Button 
                        onClick={() => removeEmailAddress(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 mt-6"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Distribution Class and Member Status Coverage Sections */}
          <CoverageList 
            title="Distribution Class Coverages" 
            coverages={formData.distribution_class_coverages} 
            type="distribution_class"
          />
          
          <div id="member-status-coverages">
            <CoverageList 
              title="Member Status Coverages" 
              coverages={formData.member_status_coverages} 
              type="member_status"
            />
          </div>
        </div>
      )}

      {/* Health Coverage Tab */}
      {activeTab === 'health-coverage' && (
        <div className="grid gap-6">
          <CoverageList 
            title="Insurance Plan Coverages" 
            coverages={formData.insurance_plan_coverages} 
            type="insurance_plan"
          />
        </div>
      )}

      {/* Life Insurance Tab */}
      {activeTab === 'life-insurance' && (
        <div className="grid gap-6">
          <CoverageList 
            title="Life Insurance Coverages" 
            coverages={formData.life_insurance_coverages} 
            type="life_insurance"
          />
        </div>
      )}

      {/* Dependents Tab */}
      {activeTab === 'dependents' && (
        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Dependents</CardTitle>
              {isEditMode && (
                <Button 
                  onClick={addDependent}
                  size="sm"
                  className="bg-union-600 hover:bg-union-700 text-white"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Dependent
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.dependent_coverages.length === 0 ? (
                <p className="text-gray-500 text-sm">No dependents found</p>
              ) : (
                formData.dependent_coverages.map((dependentCoverage, index) => {
                  const dependent = dependentCoverage.dependent;
                  if (!dependent) return null;
                  return (
                    <div key={dependentCoverage.id || index} className="border rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          {dependent.first_name} {dependent.middle_name} {dependent.last_name}
                        </h3>
                        {isEditMode && (
                          <Button 
                            onClick={() => removeDependent(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor={`dependent-${index}-first-name`} className="block text-sm font-medium text-gray-700 mb-1">
                            First Name
                          </label>
                          <Input
                            id={`dependent-${index}-first-name`}
                            value={dependent.first_name}
                            onChange={(e) => updateDependent(index, 'first_name', e.target.value)}
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor={`dependent-${index}-middle-name`} className="block text-sm font-medium text-gray-700 mb-1">
                            Middle Name
                          </label>
                          <Input
                            id={`dependent-${index}-middle-name`}
                            value={dependent.middle_name || ''}
                            onChange={(e) => updateDependent(index, 'middle_name', e.target.value)}
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor={`dependent-${index}-last-name`} className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                          </label>
                          <Input
                            id={`dependent-${index}-last-name`}
                            value={dependent.last_name}
                            onChange={(e) => updateDependent(index, 'last_name', e.target.value)}
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Gender
                          </label>
                          <Select 
                            value={dependent.gender || 'not-specified'} 
                            onValueChange={(value) => updateDependent(index, 'gender', value === 'not-specified' ? undefined : value)}
                            disabled={!isEditMode}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not-specified">Not Specified</SelectItem>
                              <SelectItem value="MALE">Male</SelectItem>
                              <SelectItem value="FEMALE">Female</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Birth Date
                          </label>
                          <Input
                            type="date"
                            value={dependent.birth_date ? dependent.birth_date.split('T')[0] : ''}
                            onChange={(e) => updateDependent(index, 'birth_date', e.target.value)}
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Relationship
                          </label>
                          <Select 
                            value={dependent.dependent_type} 
                            onValueChange={(value) => updateDependent(index, 'dependent_type', value)}
                            disabled={!isEditMode}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SPOUSE">Spouse</SelectItem>
                              <SelectItem value="CHILD">Child</SelectItem>
                              <SelectItem value="DEPENDENT">Dependent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Coverage Period</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Date
                            </label>
                            {isEditMode ? (
                              <Input
                                type="date"
                                value={dependentCoverage.start_date ? dependentCoverage.start_date.split('T')[0] : ''}
                                onChange={(e) => updateDependentCoverage(index, 'start_date', e.target.value)}
                              />
                            ) : (
                              <p className="text-sm text-gray-600">
                                {dependentCoverage.start_date ? new Date(dependentCoverage.start_date).toLocaleDateString() : 'N/A'}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Date
                            </label>
                            {isEditMode ? (
                              <Input
                                type="date"
                                value={dependentCoverage.end_date ? dependentCoverage.end_date.split('T')[0] : ''}
                                onChange={(e) => updateDependentCoverage(index, 'end_date', e.target.value || undefined)}
                                placeholder="Leave empty for active coverage"
                              />
                            ) : (
                              <p className="text-sm text-gray-600">
                                {dependentCoverage.end_date ? new Date(dependentCoverage.end_date).toLocaleDateString() : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Employers Tab */}
      {activeTab === 'employers' && (
        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Employers</CardTitle>
              {isEditMode && (
                <Button 
                  onClick={addEmployer}
                  size="sm"
                  className="bg-union-600 hover:bg-union-700 text-white"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Employer
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.employer_coverages.length === 0 ? (
                <p className="text-gray-500 text-sm">No employers found</p>
              ) : (
                formData.employer_coverages.map((employerCoverage, index) => {
                  const employer = employerCoverage.employer;
                  return (
                    <div key={employerCoverage.id || index} className="border rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          {employer.name || 'Unnamed Employer'}
                        </h3>
                        {isEditMode && (
                          <Button 
                            onClick={() => removeEmployer(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Employer Name
                          </label>
                          <Input
                            value={employer.name}
                            onChange={(e) => updateEmployer(index, 'name', e.target.value)}
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            EIN (Employer Identification Number)
                          </label>
                          <Input
                            value={employer.ein || ''}
                            onChange={(e) => updateEmployer(index, 'ein', e.target.value)}
                            disabled={!isEditMode}
                            placeholder="xx-xxxxxxx"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Employer Type ID
                          </label>
                          <Input
                            type="number"
                            value={employer.employer_type_id || ''}
                            onChange={(e) => updateEmployer(index, 'employer_type_id', e.target.value ? parseInt(e.target.value) : undefined)}
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Force Distribution Class ID
                          </label>
                          <Input
                            type="number"
                            value={employer.force_distribution_class_id || ''}
                            onChange={(e) => updateEmployer(index, 'force_distribution_class_id', e.target.value ? parseInt(e.target.value) : undefined)}
                            disabled={!isEditMode}
                          />
                        </div>
                      </div>
                      
                      {/* Checkbox Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`employer-include-cms-${index}`}
                            checked={employer.include_cms}
                            onCheckedChange={(checked) => updateEmployer(index, 'include_cms', checked)}
                            disabled={!isEditMode}
                          />
                          <Label 
                            htmlFor={`employer-include-cms-${index}`} 
                            className="text-sm font-medium text-gray-700 cursor-pointer"
                          >
                            Include in CMS Report
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`employer-forced-distribution-${index}`}
                            checked={employer.is_forced_distribution}
                            onCheckedChange={(checked) => updateEmployer(index, 'is_forced_distribution', checked)}
                            disabled={!isEditMode}
                          />
                          <Label 
                            htmlFor={`employer-forced-distribution-${index}`} 
                            className="text-sm font-medium text-gray-700 cursor-pointer"
                          >
                            Is Forced Distribution
                          </Label>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Employment Period</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Date
                            </label>
                            <p className="text-sm text-gray-600">
                              {employerCoverage.start_date ? new Date(employerCoverage.start_date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Date
                            </label>
                            <p className="text-sm text-gray-600">
                              {employerCoverage.end_date ? new Date(employerCoverage.end_date).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}


      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Notes</CardTitle>
              {isEditMode && (
                <Button 
                  onClick={addNote}
                  size="sm"
                  className="bg-union-600 hover:bg-union-700 text-white"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Note
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.member_notes.length === 0 ? (
                <p className="text-gray-500 text-sm">No notes found</p>
              ) : (
                formData.member_notes.map((note, index) => (
                  <div key={note.id || index} className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            Note #{index + 1}
                          </h3>
                          {note.created_at && (
                            <span className="text-xs text-gray-500">
                              {new Date(note.created_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor={`note-message-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Message
                          </label>
                          <Textarea
                            id={`note-message-${index}`}
                            value={note.message}
                            onChange={(e) => updateNote(index, 'message', e.target.value)}
                            disabled={!isEditMode}
                            rows={4}
                            className="resize-vertical"
                          />
                        </div>
                      </div>
                      
                      {isEditMode && (
                        <Button 
                          onClick={() => removeNote(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800 ml-4"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fund Ledger Tab */}
      {activeTab === 'fund-ledger' && (
        <div className="space-y-6">
          {/* Fund Balance Cards */}
          {formData.fund_balances && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-green-700">Health Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    ${formData.fund_balances.health_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Last updated: {new Date(formData.fund_balances.last_updated).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-blue-700">Annuity Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    ${formData.fund_balances.annuity_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Last updated: {new Date(formData.fund_balances.last_updated).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Filters and Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Items per page */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Show
                  </label>
                  <Select 
                    value={ledgerItemsPerPage.toString()} 
                    onValueChange={(value) => {
                      setLedgerItemsPerPage(parseInt(value));
                      handleFilterChange();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Account Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type
                  </label>
                  <Select 
                    value={accountTypeFilter} 
                    onValueChange={(value) => {
                      setAccountTypeFilter(value);
                      handleFilterChange();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="annuity">Annuity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Entry Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entry Type
                  </label>
                  <Select 
                    value={entryTypeFilter} 
                    onValueChange={(value) => {
                      setEntryTypeFilter(value);
                      handleFilterChange();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {(ledgerEntryTypes || []).map((type, index) => (
                        <SelectItem key={type.value || `entry-type-${index}`} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <Select 
                    value={dateRangeFilter} 
                    onValueChange={handleDateRangeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                      <SelectItem value="last-year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Custom Date Range */}
              {dateRangeFilter === 'all' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => {
                        setStartDateFilter(e.target.value);
                        handleFilterChange();
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => {
                        setEndDateFilter(e.target.value);
                        handleFilterChange();
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Ledger Entries Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Ledger Entries ({ledgerLoading ? '...' : ledgerTotalEntries})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ledgerError && (
                <div className="p-6 text-center text-red-600">
                  <p>{ledgerError}</p>
                  <Button 
                    onClick={fetchLedgerEntries} 
                    className="mt-4 bg-union-600 hover:bg-union-700 text-white"
                  >
                    Try Again
                  </Button>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Transaction Type</TableHead>
                      <TableHead>Period Year End</TableHead>
                      <TableHead className="text-right">Health</TableHead>
                      <TableHead className="text-right">Annuity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerLoading ? (
                      // Loading skeleton rows
                      Array.from({ length: 5 }, (_, i) => (
                        <TableRow key={`loading-${i}`}>
                          <TableCell><div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto"></div></TableCell>
                        </TableRow>
                      ))
                    ) : ledgerEntries.length === 0 ? (
                      // Empty state
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No ledger entries found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      // Ledger entry rows
                      (ledgerEntries || []).map((entry) => {
                        const isExpanded = expandedEntries.has(entry.id);
                        const isHealth = entry.account?.type === 'HEALTH';
                        const isAnnuity = entry.account?.type === 'ANNUITY';
                        
                        return (
                          <React.Fragment key={entry.id}>
                            <TableRow className="cursor-pointer hover:bg-gray-50" onClick={() => toggleEntryExpansion(entry.id)}>
                              <TableCell>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell>
                                {entry.posted_date ? new Date(entry.posted_date).toLocaleDateString() : 'N/A'}
                              </TableCell>
                              <TableCell>{getLedgerEntryTypeDisplayName(entry.type)}</TableCell>
                              <TableCell>
                                {/* TODO: This should come from related data */}
                                2026-07-31
                              </TableCell>
                              <TableCell className="text-right">
                                {isHealth ? (
                                  <span className={entry.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                                    ${entry.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                ) : ''}
                              </TableCell>
                              <TableCell className="text-right">
                                {isAnnuity ? (
                                  <span className={entry.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                                    ${entry.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                ) : ''}
                              </TableCell>
                            </TableRow>
                            
                            {/* Expanded detail row */}
                            {isExpanded && (
                              <TableRow>
                                <TableCell colSpan={6} className="bg-gray-50 p-6">
                                  <LedgerEntryExpandedDetails entry={entry as PolymorphicLedgerEntry} />
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          {/* Pagination */}
          {!ledgerLoading && ledgerTotalEntries > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((ledgerCurrentPage - 1) * ledgerItemsPerPage) + 1} to {Math.min(ledgerCurrentPage * ledgerItemsPerPage, ledgerTotalEntries)} of {ledgerTotalEntries} entries
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLedgerCurrentPage(ledgerCurrentPage - 1)}
                  disabled={ledgerCurrentPage === 1 || ledgerLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, Math.ceil(ledgerTotalEntries / ledgerItemsPerPage)) }, (_, i) => {
                    const totalPages = Math.ceil(ledgerTotalEntries / ledgerItemsPerPage);
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else {
                      const start = Math.max(1, ledgerCurrentPage - 2);
                      const end = Math.min(totalPages, start + 4);
                      page = start + i;
                      if (page > end) return null;
                    }
                    
                    return (
                      <Button
                        key={page}
                        variant={ledgerCurrentPage === page ? "default" : "outline"}
                        size="sm"
                        className={ledgerCurrentPage === page ? "bg-union-600 hover:bg-union-700" : ""}
                        onClick={() => setLedgerCurrentPage(page)}
                        disabled={ledgerLoading}
                      >
                        {page}
                      </Button>
                    );
                  }).filter(Boolean)}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLedgerCurrentPage(ledgerCurrentPage + 1)}
                  disabled={ledgerCurrentPage >= Math.ceil(ledgerTotalEntries / ledgerItemsPerPage) || ledgerLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Claims/Adjustments Tab */}
      {activeTab === 'claims-adjustments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Claim Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Claim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> Claim Type:
                </label>
                <Select 
                  value={claimForm.claim_type} 
                  onValueChange={(value) => setClaimForm(prev => ({...prev, claim_type: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select claim type" />
                  </SelectTrigger>
                  <SelectContent>
                    {claimTypes.map((type, index) => (
                      <SelectItem key={index} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Claim Description:
                </label>
                <Textarea
                  value={claimForm.description}
                  onChange={(e) => setClaimForm(prev => ({...prev, description: e.target.value}))}
                  placeholder="Enter claim description"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check Number:
                </label>
                <Input
                  value={claimForm.check_number}
                  onChange={(e) => setClaimForm(prev => ({...prev, check_number: e.target.value}))}
                  placeholder="Enter check number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check Date:
                </label>
                <Input
                  type="date"
                  value={claimForm.check_date}
                  onChange={(e) => setClaimForm(prev => ({...prev, check_date: e.target.value}))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> Claim Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={claimForm.amount}
                    onChange={(e) => setClaimForm(prev => ({...prev, amount: e.target.value}))}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Posted Date:
                </label>
                <Input
                  type="date"
                  value={claimForm.posted_date}
                  onChange={(e) => setClaimForm(prev => ({...prev, posted_date: e.target.value}))}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="claim-overdraft"
                  checked={claimForm.allow_overdraft}
                  onCheckedChange={(checked) => setClaimForm(prev => ({...prev, allow_overdraft: !!checked}))}
                />
                <Label htmlFor="claim-overdraft" className="text-sm">
                  Allow Overdraft?
                </Label>
              </div>
              
              <Button 
                onClick={handleCreateClaim}
                disabled={creatingClaim || !claimForm.claim_type || !claimForm.amount}
                className="w-full bg-union-600 hover:bg-union-700 text-white"
              >
                {creatingClaim ? 'Creating...' : 'Create Claim'}
              </Button>
            </CardContent>
          </Card>
          
          {/* Manual Adjustment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Manual Adjustment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> Account:
                </label>
                <Select 
                  value={String(adjustmentForm.account_id)} 
                  onValueChange={(value) => setAdjustmentForm(prev => ({...prev, account_id: value}))}
                  disabled={!formData.fund_balances}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.fund_balances ? (
                      <>
                        <SelectItem value={String(formData.fund_balances.health_account_id)}>Health Account</SelectItem>
                        <SelectItem value={String(formData.fund_balances.annuity_account_id)}>Annuity Account</SelectItem>
                      </>
                    ) : (
                      <SelectItem value="disabled" disabled>No accounts found for member</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> Adjustment Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={adjustmentForm.amount}
                    onChange={(e) => setAdjustmentForm(prev => ({...prev, amount: e.target.value}))}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Description
                </label>
                <Textarea
                  value={adjustmentForm.description}
                  onChange={(e) => setAdjustmentForm(prev => ({...prev, description: e.target.value}))}
                  placeholder="Enter adjustment description"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Posted Date:
                </label>
                <Input
                  type="date"
                  value={adjustmentForm.posted_date}
                  onChange={(e) => setAdjustmentForm(prev => ({...prev, posted_date: e.target.value}))}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="adjustment-overdraft"
                  checked={adjustmentForm.allow_overdraft}
                  onCheckedChange={(checked) => setAdjustmentForm(prev => ({...prev, allow_overdraft: !!checked}))}
                />
                <Label htmlFor="adjustment-overdraft" className="text-sm">
                  Allow Overdraft?
                </Label>
              </div>
              
              <Button 
                onClick={handleCreateAdjustment}
                disabled={creatingAdjustment || !adjustmentForm.account_id || !adjustmentForm.amount}
                className="w-full bg-union-600 hover:bg-union-700 text-white"
              >
                {creatingAdjustment ? 'Creating...' : 'Create Manual Adjustment'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Placeholder for other tabs */}
      {activeTab !== 'member' && activeTab !== 'life-insurance' && activeTab !== 'dependents' && activeTab !== 'employers' && activeTab !== 'health-coverage' && activeTab !== 'notes' && activeTab !== 'fund-ledger' && activeTab !== 'claims-adjustments' && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">
              <div className="text-lg font-medium mb-2">
                {TABS.find(tab => tab.id === activeTab)?.label}
              </div>
              <p>This section is coming soon.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
