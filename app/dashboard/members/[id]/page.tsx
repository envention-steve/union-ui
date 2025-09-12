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
  id?: number;
  status: string;
  start_date: string;
  end_date?: string;
}

interface Dependent {
  id?: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  ssn?: string;
  birth_date: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dependent_type: 'SPOUSE' | 'DEPENDENT' | 'CHILD';
  include_cms: boolean;
}

interface DependentCoverage {
  id?: number;
  start_date: string;
  end_date?: string;
  member_id: number;
  dependent_id: number;
  dependent: Dependent;
  created_at?: string;
  updated_at?: string;
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
  insurance_plan: InsurancePlan;
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

interface MemberFormData extends Member {
  addresses: Address[];
  phoneNumbers: PhoneNumber[];
  emailAddresses: EmailAddress[];
  distribution_class_coverages: Coverage[];
  member_status_coverages: Coverage[];
  life_insurance_coverages: Coverage[];
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

  // Check for unsaved changes
  useEffect(() => {
    if (originalData && isEditMode) {
      const hasChanges = JSON.stringify(originalData) !== JSON.stringify(formData);
      setHasUnsavedChanges(hasChanges);
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
      
      const response = await backendApiClient.members.getDetails(resolvedParams.id);
      
      // Transform API response to form data structure
      const memberData: MemberFormData = {
        ...response,
        addresses: response.addresses || [],
        phoneNumbers: response.phone_numbers || [],
        emailAddresses: response.email_addresses || [],
        distribution_class_coverages: response.distribution_class_coverages || [],
        member_status_coverages: response.member_status_coverages || [],
        life_insurance_coverages: response.life_insurance_coverages || [],
        dependent_coverages: response.dependent_coverages || [],
        employer_coverages: response.employer_coverages || [],
        insurance_plan_coverages: response.insurance_plan_coverages || [],
        member_notes: response.member_notes || [],
        fund_balances: response.fund_balances,
      };
      
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
    try {
      setSaving(true);
      setError(null);
      
      // Prepare data for API (remove UI-specific fields)
      const { addresses, phoneNumbers, emailAddresses, ...memberData } = formData;
      
      const updateData = {
        ...memberData,
        addresses: addresses,
        phone_numbers: phoneNumbers,
        email_addresses: emailAddresses,
      };
      
      await backendApiClient.members.update(resolvedParams.id, updateData);
      
      // Update original data and exit edit mode
      setOriginalData(formData);
      setHasUnsavedChanges(false);
      router.push(`/dashboard/members/${resolvedParams.id}?mode=view`);
    } catch (err) {
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
    const newDependentCoverage: DependentCoverage = {
      start_date: new Date().toISOString(),
      member_id: formData.id,
      dependent_id: 0, // Will be set by API
      dependent: {
        first_name: '',
        middle_name: '',
        last_name: '',
        ssn: '',
        birth_date: '',
        gender: undefined,
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
              }
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

  const addInsurancePlan = () => {
    const newInsurancePlanCoverage: InsurancePlanCoverage = {
      start_date: new Date().toISOString(),
      member_id: formData.id,
      insurance_plan_id: 0, // Will be set by API
      policy_number: '',
      insurance_plan: {
        name: '',
        code: '',
        type: 'HEALTH',
        group: '',
        include_cms: false,
        insurance_plan_company_id: undefined,
      }
    };
    
    setFormData(prev => ({
      ...prev,
      insurance_plan_coverages: [...prev.insurance_plan_coverages, newInsurancePlanCoverage]
    }));
  };

  const removeInsurancePlan = (index: number) => {
    setFormData(prev => ({
      ...prev,
      insurance_plan_coverages: prev.insurance_plan_coverages.filter((_, i) => i !== index)
    }));
  };

  const updateInsurancePlan = (index: number, field: string, value: any) => {
    if (field === 'policy_number') {
      setFormData(prev => ({
        ...prev,
        insurance_plan_coverages: prev.insurance_plan_coverages.map((planCoverage, i) => 
          i === index ? { ...planCoverage, [field]: value } : planCoverage
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        insurance_plan_coverages: prev.insurance_plan_coverages.map((planCoverage, i) => 
          i === index 
            ? {
                ...planCoverage,
                insurance_plan: {
                  ...planCoverage.insurance_plan,
                  [field]: value
                }
              }
            : planCoverage
        )
      }));
    }
  };

  const addNote = () => {
    const newNote: MemberNote = {
      member_id: formData.id,
      message: '',
    };
    
    setFormData(prev => ({
      ...prev,
      member_notes: [...prev.member_notes, newNote]
    }));
  };

  const removeNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      member_notes: prev.member_notes.filter((_, i) => i !== index)
    }));
  };

  const updateNote = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      member_notes: prev.member_notes.map((note, i) => 
        i === index ? { ...note, [field]: value } : note
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
      
      const response = await backendApiClient.members.getLedgerEntries(resolvedParams.id, params);
      
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
  
  // Fetch ledger entries when filters or pagination changes
  useEffect(() => {
    fetchLedgerEntries();
  }, [fetchLedgerEntries]);
  
  // Fetch ledger entry types on component mount
  useEffect(() => {
    fetchLedgerEntryTypes();
  }, [fetchLedgerEntryTypes]);
  
  // Reset filters when changing to fund ledger tab
  useEffect(() => {
    if (activeTab === 'fund-ledger') {
      setLedgerCurrentPage(1);
      setExpandedEntries(new Set());
    }
  }, [activeTab]);

  // Coverage display component
  const CoverageList = ({ 
    title, 
    coverages, 
    type 
  }: { 
    title: string; 
    coverages: DistributionClassCoverage[] | MemberStatusCoverage[] | LifeInsuranceCoverage[];
    type: 'distribution_class' | 'member_status' | 'life_insurance';
  }) => {
    const getDisplayName = (coverage: any) => {
      if (type === 'distribution_class' && coverage.distribution_class) {
        return coverage.distribution_class.description;
      }
      if (type === 'member_status' && coverage.member_status) {
        return coverage.member_status.name;
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
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
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
                  <div key={coverage.id || index} className="border rounded-lg p-4">
                    <div className="space-y-3">
                      {/* Main coverage name/description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {type === 'distribution_class' ? 'Distribution Class' : 
                           type === 'member_status' ? 'Member Status' : 'Coverage Type'}
                        </label>
                        <p className="text-sm font-medium text-gray-900">{displayName}</p>
                        {secondaryInfo && (
                          <p className="text-xs text-gray-600 mt-1">{secondaryInfo}</p>
                        )}
                      </div>
                      
                      {/* Date information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                          </label>
                          <p className="text-sm">
                            {coverage.start_date ? new Date(coverage.start_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                          </label>
                          <p className="text-sm">
                            {coverage.end_date ? new Date(coverage.end_date).toLocaleDateString() : (
                              <span className="text-green-600 font-medium">Active</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <Input
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <Input
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
                  <div key={`address-${index}-${address.type}-${address.street1}`} className="border rounded-lg p-4 space-y-3">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address 1
                        </label>
                        <Input
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
                  <div key={`phone-${index}-${phone.type}-${phone.number}`} className="flex items-center gap-4">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <Input
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
                  <div key={`email-${index}-${email.type}-${email.email}`} className="flex items-center gap-4">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <Input
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

          {/* Coverage Sections */}
          <CoverageList 
            title="Distribution Class Coverages" 
            coverages={formData.distribution_class_coverages} 
          />
          
          <CoverageList 
            title="Member Status Coverages" 
            coverages={formData.member_status_coverages} 
          />
        </div>
      )}

      {/* Life Insurance Tab */}
      {activeTab === 'life-insurance' && (
        <div className="grid gap-6">
          <CoverageList 
            title="Life Insurance Coverages" 
            coverages={formData.life_insurance_coverages} 
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name
                          </label>
                          <Input
                            value={dependent.first_name}
                            onChange={(e) => updateDependent(index, 'first_name', e.target.value)}
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Middle Name
                          </label>
                          <Input
                            value={dependent.middle_name || ''}
                            onChange={(e) => updateDependent(index, 'middle_name', e.target.value)}
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                          </label>
                          <Input
                            value={dependent.last_name}
                            onChange={(e) => updateDependent(index, 'last_name', e.target.value)}
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            SSN
                          </label>
                          <Input
                            value={dependent.ssn || ''}
                            onChange={(e) => updateDependent(index, 'ssn', e.target.value)}
                            disabled={!isEditMode}
                            placeholder="xxx-xx-xxxx"
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
                            <p className="text-sm text-gray-600">
                              {dependentCoverage.start_date ? new Date(dependentCoverage.start_date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Date
                            </label>
                            <p className="text-sm text-gray-600">
                              {dependentCoverage.end_date ? new Date(dependentCoverage.end_date).toLocaleDateString() : 'Active'}
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
                              {employerCoverage.end_date ? new Date(employerCoverage.end_date).toLocaleDateString() : 'Active'}
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

      {/* Health Coverage Tab */}
      {activeTab === 'health-coverage' && (
        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Health Coverage</CardTitle>
              {isEditMode && (
                <Button 
                  onClick={addInsurancePlan}
                  size="sm"
                  className="bg-union-600 hover:bg-union-700 text-white"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Insurance Plan
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.insurance_plan_coverages.length === 0 ? (
                <p className="text-gray-500 text-sm">No insurance plans found</p>
              ) : (
                formData.insurance_plan_coverages.map((planCoverage, index) => {
                  const plan = planCoverage.insurance_plan;
                  return (
                    <div key={planCoverage.id || index} className="border rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          {plan.name || 'Unnamed Insurance Plan'}
                        </h3>
                        {isEditMode && (
                          <Button 
                            onClick={() => removeInsurancePlan(index)}
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
                            Plan Name
                          </label>
                          <Input
                            value={plan.name}
                            onChange={(e) => updateInsurancePlan(index, 'name', e.target.value)}
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plan Code
                          </label>
                          <Input
                            value={plan.code}
                            onChange={(e) => updateInsurancePlan(index, 'code', e.target.value)}
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plan Type
                          </label>
                          <Select 
                            value={plan.type} 
                            onValueChange={(value) => updateInsurancePlan(index, 'type', value)}
                            disabled={!isEditMode}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HEALTH">Health</SelectItem>
                              <SelectItem value="DENTAL">Dental</SelectItem>
                              <SelectItem value="VISION">Vision</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Group Number
                          </label>
                          <Input
                            value={plan.group}
                            onChange={(e) => updateInsurancePlan(index, 'group', e.target.value)}
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Policy Number
                          </label>
                          <Input
                            value={planCoverage.policy_number}
                            onChange={(e) => updateInsurancePlan(index, 'policy_number', e.target.value)}
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Insurance Company ID
                          </label>
                          <Input
                            type="number"
                            value={plan.insurance_plan_company_id || ''}
                            onChange={(e) => updateInsurancePlan(index, 'insurance_plan_company_id', e.target.value ? parseInt(e.target.value) : undefined)}
                            disabled={!isEditMode}
                          />
                        </div>
                      </div>
                      
                      {/* Checkbox Field */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`plan-include-cms-${index}`}
                            checked={plan.include_cms}
                            onCheckedChange={(checked) => updateInsurancePlan(index, 'include_cms', checked)}
                            disabled={!isEditMode}
                          />
                          <Label 
                            htmlFor={`plan-include-cms-${index}`} 
                            className="text-sm font-medium text-gray-700 cursor-pointer"
                          >
                            Include in CMS Report
                          </Label>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Coverage Period</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Date
                            </label>
                            <p className="text-sm text-gray-600">
                              {planCoverage.start_date ? new Date(planCoverage.start_date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Date
                            </label>
                            <p className="text-sm text-gray-600">
                              {planCoverage.end_date ? new Date(planCoverage.end_date).toLocaleDateString() : 'Active'}
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Message
                          </label>
                          <Textarea
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
                              <TableCell>{entry.type}</TableCell>
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
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-gray-900">Entry Details</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                                    {/* TODO: Add specific entry type details based on entry.type */}
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                      <p className="text-sm text-yellow-800">
                                        <strong>Note:</strong> Detailed entry information (like insurance plan details, employer info, etc.) 
                                        will be implemented once the API provides the related data structure.
                                      </p>
                                    </div>
                                  </div>
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

      {/* Placeholder for other tabs */}
      {activeTab !== 'member' && activeTab !== 'life-insurance' && activeTab !== 'dependents' && activeTab !== 'employers' && activeTab !== 'health-coverage' && activeTab !== 'notes' && activeTab !== 'fund-ledger' && (
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
