'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X,
  Building,
  DollarSign,
  ClipboardList,
  Users,
  Folder,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  ChevronDown
} from 'lucide-react';
import { backendApiClient } from '@/lib/api-client';
import { 
  Employer, 
  EmployerType, 
  EmployerRate, 
  EmployerNote, 
  EmployerLedgerEntry, 
  Member,
  EmployerWithContributions,
  EmployerContributionBatch
} from '@/types';

interface CompanyAddress {
  id?: string;
  type: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
}

interface CompanyPhoneNumber {
  id?: string;
  type: string;
  number: string;
  extension?: string;
}

interface CompanyEmailAddress {
  id?: string;
  type: string;
  email: string;
}

interface EmployerFormData {
  id: number;
  name: string;
  tax_id?: string;
  employer_type_id?: number;
  include_cms: boolean;
  is_forced_distribution: boolean;
  force_distribution_class_id?: number;
  created_at?: string;
  updated_at?: string;
  employer_type?: EmployerType;
  addresses: CompanyAddress[];
  phoneNumbers: CompanyPhoneNumber[];
  emailAddresses: CompanyEmailAddress[];
  employer_notes: EmployerNote[];
}

const TABS = [
  { id: 'employer', label: 'Employer', icon: Building },
  { id: 'employer-rates', label: 'Employer Rates', icon: DollarSign },
  { id: 'notes', label: 'Notes', icon: ClipboardList },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'employee-ledger', label: 'Employee Ledger', icon: Folder },
];

export default function EmployerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'view';
  const isEditMode = mode === 'edit';

  const [activeTab, setActiveTab] = useState('employer');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Tab-specific state
  const [rates, setRates] = useState<EmployerRate[]>([]);
  const [notes, setNotes] = useState<EmployerNote[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<EmployerLedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalLedgerEntries, setTotalLedgerEntries] = useState(0);
  const [ledgerCurrentPage, setLedgerCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  
  // Employee Ledger (Contribution Batches) state
  const [contributionBatches, setContributionBatches] = useState<EmployerContributionBatch[]>([]);
  const [expandedBatches, setExpandedBatches] = useState<Set<number>>(new Set());
  const [employerWithContributions, setEmployerWithContributions] = useState<EmployerWithContributions | null>(null);
  
  // Employer types state
  const [employerTypes, setEmployerTypes] = useState<EmployerType[]>([]);
  
  const [originalData, setOriginalData] = useState<EmployerFormData | null>(null);
  const [originalRates, setOriginalRates] = useState<EmployerRate[]>([]);
  const [formData, setFormData] = useState<EmployerFormData>({
    id: 0,
    name: '',
    tax_id: '',
    employer_type_id: undefined,
    include_cms: false,
    is_forced_distribution: false,
    force_distribution_class_id: undefined,
    addresses: [],
    phoneNumbers: [],
    emailAddresses: [],
    employer_notes: [],
  });

  // Check for unsaved changes (debounced to prevent excessive re-renders)
  useEffect(() => {
    if (originalData && isEditMode) {
      const timeoutId = setTimeout(() => {
        const hasFormChanges = JSON.stringify(originalData) !== JSON.stringify(formData);
        const hasRateChanges = JSON.stringify(originalRates) !== JSON.stringify(rates);
        setHasUnsavedChanges(hasFormChanges || hasRateChanges);
      }, 100); // 100ms debounce
      
      return () => clearTimeout(timeoutId);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [formData, originalData, rates, originalRates, isEditMode]);

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

  // Fetch employer data
  const fetchEmployer = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, try the details endpoint like members use
      let response;
      try {
        console.log('Trying employer getDetails endpoint...');
        response = await backendApiClient.employers.getDetails!(resolvedParams.id);
        console.log('✅ Success with getDetails endpoint');
      } catch (detailsError) {
        console.log('❌ getDetails endpoint failed:', detailsError);
        console.log('Falling back to basic get endpoint...');
        try {
          response = await backendApiClient.employers.get(resolvedParams.id);
          console.log('✅ Success with basic get endpoint');
        } catch (getError) {
          console.log('❌ Both endpoints failed:', getError);
          throw getError;
        }
      }
      
      // Debug: Log the response to understand the data structure
      console.log('Employer API Response:', JSON.stringify(response, null, 2));
      
      const employerData: EmployerFormData = {
        ...response,
        // Transform company addresses from API format to UI format
        // Handle case where the basic get endpoint doesn't include contact info
        addresses: (response.company_addresses || response.addresses || []).map((addr: any) => ({
          id: addr.id,
          type: addr.label || 'Home', // Map API 'label' to UI 'type'
          street1: addr.street1,
          street2: addr.street2 || '',
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
        })),
        
        // Transform company phone numbers from API format to UI format
        // Handle case where the basic get endpoint doesn't include contact info
        phoneNumbers: (response.company_phone_numbers || response.phone_numbers || []).map((phone: any) => ({
          id: phone.id,
          type: phone.label || 'Mobile', // Map API 'label' to UI 'type'
          number: phone.number,
          extension: phone.extension || '', // Include extension if available
        })),
        
        // Transform company email addresses from API format to UI format
        // Handle case where the basic get endpoint doesn't include contact info
        emailAddresses: (response.company_email_addresses || response.email_addresses || []).map((email: any) => ({
          id: email.id,
          type: email.label || 'Work', // Map API 'label' to UI 'type'
          email: email.email_address,
        })),
        
        // Include employer notes in formData
        employer_notes: response.employer_notes || [],
      };
      
      // Extract employer rates from the details response (already sorted by backend)
      if (response.employer_rates) {
        setRates(response.employer_rates);
        setOriginalRates(response.employer_rates);
      } else {
        setRates([]);
        setOriginalRates([]);
      }
      
      // Employer notes are now included in formData
      
      // Extract members from the details response
      if (response.members) {
        setMembers(response.members);
        setTotalMembers(response.members.length);
      }
      
      // Extract contribution batches from the details response
      if (response.employer_contribution_batches) {
        setContributionBatches(response.employer_contribution_batches);
        setEmployerWithContributions(response as EmployerWithContributions);
      }
      
      setFormData(employerData);
      setOriginalData(employerData);
    } catch (err) {
      console.error('Error fetching employer:', err);
      setError('Failed to load employer data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);



  // Members are now fetched as part of the employer details response

  // Toggle expanded state for contribution batches
  const toggleBatchExpansion = useCallback((batchId: number) => {
    setExpandedBatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
      } else {
        newSet.add(batchId);
      }
      return newSet;
    });
  }, []);

  // Fetch employer ledger entries
  const fetchLedgerEntries = useCallback(async () => {
    if (activeTab !== 'employee-ledger') return;
    
    try {
      setLedgerLoading(true);
      const response = await backendApiClient.employers.getLedgerEntries!(resolvedParams.id, {
        offset: (ledgerCurrentPage - 1) * itemsPerPage,
        limit: itemsPerPage
      });
      setLedgerEntries(response.items || []);
      setTotalLedgerEntries(response.total || 0);
    } catch (err) {
      console.error('Error fetching employer ledger entries:', err);
      setLedgerEntries([]);
    } finally {
      setLedgerLoading(false);
    }
  }, [resolvedParams.id, activeTab, ledgerCurrentPage, itemsPerPage]);

  // Fetch employer types
  const fetchEmployerTypes = useCallback(async () => {
    try {
      const response = await backendApiClient.employerTypes.list();
      setEmployerTypes(response || []);
    } catch (err) {
      console.error('Error fetching employer types:', err);
      setEmployerTypes([]);
    }
  }, []);

  useEffect(() => {
    fetchEmployer();
  }, [fetchEmployer]);

  useEffect(() => {
    fetchEmployerTypes();
  }, [fetchEmployerTypes]);



  // Members are fetched as part of employer details

  useEffect(() => {
    fetchLedgerEntries();
  }, [fetchLedgerEntries]);

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
      setSuccess(null);
      
      const updateData = {
        id: formData.id,
        name: formData.name,
        tax_id: formData.tax_id || null,
        employer_type_id: formData.employer_type_id || null,
        include_cms: formData.include_cms,
        is_forced_distribution: formData.is_forced_distribution,
        force_distribution_class_id: formData.force_distribution_class_id || null,
        
        // Transform company addresses with proper type field
        company_addresses: formData.addresses.map(addr => ({
          ...(addr.id && { id: addr.id }),
          company_id: formData.id, // Required field for API
          type: 'company_address', // Required polymorphic identity
          label: addr.type, // Map UI 'type' to API 'label'
          street1: addr.street1,
          street2: addr.street2 || null,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
        })),
        
        // Transform company phone numbers with proper type field
        company_phone_numbers: formData.phoneNumbers.map(phone => ({
          ...(phone.id && { id: phone.id }),
          company_id: formData.id, // Required field for API
          type: 'company_phone_number', // Required polymorphic identity
          label: phone.type, // Map UI 'type' to API 'label'
          number: phone.number,
          extension: phone.extension || null,
          country_code: '1', // Default to US
          is_default: false,
        })),
        
        // Transform company email addresses with proper type field
        company_email_addresses: formData.emailAddresses.map(email => ({
          ...(email.id && { id: email.id }),
          company_id: formData.id, // Required field for API
          type: 'company_email_address', // Required polymorphic identity
          label: email.type, // Map UI 'type' to API 'label'
          email_address: email.email,
          is_default: false,
        })),
        
        // Include employer notes in the update payload
        employer_notes: formData.employer_notes.map(note => ({
          ...(note.id && { id: note.id }),
          employer_id: formData.id,
          message: note.message,
        })),
        
        // Include employer rates in the update payload
        employer_rates: rates.map(rate => ({
          ...(rate.id && { id: rate.id }),
          employer_id: formData.id,
          name: rate.name,
          contribution_rate: parseFloat(rate.contribution_rate.toString()) || 0,
          enabled: rate.enabled,
        })),
      };
      
      const response = await backendApiClient.employers.update(resolvedParams.id, updateData);
      
      // Refresh data from API to get updated info
      await fetchEmployer();
      
      setHasUnsavedChanges(false);
      setSuccess('Employer data saved successfully!');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
      router.push(`/dashboard/employers/${resolvedParams.id}?mode=view`);
    } catch (err) {
      console.error('Error saving employer:', err);
      setError('Failed to save employer data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setFormData(originalData!);
        setRates(originalRates);
        setHasUnsavedChanges(false);
        router.push(`/dashboard/employers/${resolvedParams.id}?mode=view`);
      }
    } else {
      router.push(`/dashboard/employers/${resolvedParams.id}?mode=view`);
    }
  };

  const handleBackToList = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/dashboard/employers');
      }
    } else {
      router.push('/dashboard/employers');
    }
  };

  // Rate management functions
  const addRate = () => {
    if (!isEditMode) return;
    
    const newRate: EmployerRate = {
      employer_id: formData.id,
      name: '',
      contribution_rate: 0,
      enabled: true,
    };
    setRates(prev => [...prev, newRate]);
  };

  const removeRate = (index: number) => {
    if (!isEditMode) return;
    
    setRates(prev => prev.filter((_, i) => i !== index));
  };

  const updateRate = (index: number, field: string, value: any) => {
    if (!isEditMode) return;
    
    setRates(prev => prev.map((rate, i) => 
      i === index ? { ...rate, [field]: value } : rate
    ));
  };

  // Note management functions
  const addNote = () => {
    if (!isEditMode) return;
    
    const newNote: EmployerNote = {
      employer_id: formData.id,
      message: '',
    };
    setFormData(prev => ({
      ...prev,
      employer_notes: [...prev.employer_notes, newNote]
    }));
  };

  const removeNote = (index: number) => {
    if (!isEditMode) return;
    
    setFormData(prev => ({
      ...prev,
      employer_notes: prev.employer_notes.filter((_, i) => i !== index)
    }));
  };

  const updateNote = (index: number, field: string, value: any) => {
    if (!isEditMode) return;
    
    setFormData(prev => ({
      ...prev,
      employer_notes: prev.employer_notes.map((note, i) => 
        i === index ? { ...note, [field]: value } : note
      )
    }));
  };

  // Address management functions
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

  // Phone number management functions
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

  // Email address management functions
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

  // Utility functions
  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleViewMember = (id: number) => {
    router.push(`/dashboard/members/${id}?mode=view`);
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
          <h1 className="text-3xl font-bold text-union-900">Employer Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button 
                onClick={fetchEmployer} 
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
              {isEditMode ? 'Edit Employer' : 'Employer Management'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Building className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                {formData.name}
              </span>
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
              onClick={() => router.push(`/dashboard/employers/${resolvedParams.id}?mode=edit`)}
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
      {activeTab === 'employer' && (
        <div className="grid gap-6">
          {/* Employer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Employer Details</CardTitle>
              <CardDescription>
                Basic information about the employer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditMode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID / EIN
                  </label>
                  <Input
                    value={formData.tax_id || ''}
                    onChange={(e) => handleInputChange('tax_id', e.target.value)}
                    disabled={!isEditMode}
                    placeholder="XX-XXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employer Type
                  </label>
                  {isEditMode ? (
                    <Select 
                      value={formData.employer_type_id?.toString() || ''} 
                      onValueChange={(value) => {
                        const selectedType = employerTypes.find(et => et.id === parseInt(value));
                        handleInputChange('employer_type_id', parseInt(value));
                        setFormData(prev => ({ ...prev, employer_type: selectedType }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Employer Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {employerTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{formData.employer_type?.name || 'Not specified'}</p>
                  )}
                </div>
              </div>
              
              {/* Settings Section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Settings</h3>
                <div className="space-y-4">
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
                      id="force-distribution"
                      checked={formData.is_forced_distribution}
                      onCheckedChange={(checked) => handleInputChange('is_forced_distribution', checked)}
                      disabled={!isEditMode}
                    />
                    <Label 
                      htmlFor="force-distribution" 
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Force Distribution Class
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Addresses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Company Addresses</CardTitle>
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

          {/* Company Phone Numbers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Company Phone Numbers</CardTitle>
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

          {/* Company Email Addresses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Company Email Addresses</CardTitle>
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
        </div>
      )}

      {/* Employer Rates Tab */}
      {activeTab === 'employer-rates' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Employer Rates</CardTitle>
              <CardDescription>
                Manage rate structures and pricing for this employer
              </CardDescription>
            </div>
            {isEditMode && (
              <Button 
                onClick={addRate}
                className="bg-union-600 hover:bg-union-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Rate
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {rates.length === 0 ? (
              <p className="text-gray-500 text-sm">No rates configured for this employer</p>
            ) : (
              <div className="space-y-4">
                {rates.map((rate, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    {isEditMode && (
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">Rate #{index + 1}</h4>
                        <Button 
                          onClick={() => removeRate(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rate Name
                        </label>
                        {isEditMode ? (
                          <Input
                            value={rate.name}
                            onChange={(e) => updateRate(index, 'name', e.target.value)}
                            placeholder="e.g., Standard Rate, Premium Rate"
                          />
                        ) : (
                          <p className="text-sm">{rate.name}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contribution Rate ($)
                        </label>
                        {isEditMode ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={rate.contribution_rate}
                            onChange={(e) => updateRate(index, 'contribution_rate', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        ) : (
                          <p className="text-sm">${rate.contribution_rate ? parseFloat(rate.contribution_rate.toString()).toFixed(2) : '0.00'}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        {isEditMode ? (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`rate-enabled-${index}`}
                              checked={rate.enabled}
                              onCheckedChange={(checked) => updateRate(index, 'enabled', checked)}
                            />
                            <Label 
                              htmlFor={`rate-enabled-${index}`} 
                              className="text-sm font-medium text-gray-700 cursor-pointer"
                            >
                              Enabled
                            </Label>
                          </div>
                        ) : (
                          <Badge variant={rate.enabled ? "default" : "secondary"}>
                            {rate.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Employer Notes</CardTitle>
              <CardDescription>
                Manage notes and comments for this employer
              </CardDescription>
            </div>
            {isEditMode && (
              <Button 
                onClick={addNote}
                className="bg-union-600 hover:bg-union-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.employer_notes.length === 0 ? (
              <p className="text-gray-500 text-sm">No notes for this employer</p>
            ) : (
              <div className="space-y-4">
                {formData.employer_notes.map((note, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    {isEditMode && (
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">Note #{index + 1}</h4>
                        <Button 
                          onClick={() => removeNote(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message
                      </label>
                      {isEditMode ? (
                        <Textarea
                          value={note.message}
                          onChange={(e) => updateNote(index, 'message', e.target.value)}
                          placeholder="Enter note content..."
                          rows={4}
                        />
                      ) : (
                        <div className="bg-gray-50 rounded p-3">
                          <p className="text-sm whitespace-pre-wrap">{note.message}</p>
                        </div>
                      )}
                    </div>
                    
                    {!isEditMode && note.created_at && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Created:</span> {new Date(note.created_at).toLocaleString()}
                        {note.created_by && (
                          <span className="ml-4">
                            <span className="font-medium">By:</span> {note.created_by}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Employer Members</CardTitle>
            <CardDescription>
              Members associated with this employer
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Unique ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }, (_, i) => (
                      <TableRow key={`loading-${i}`}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                            <div>
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></TableCell>
                        <TableCell><div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div></TableCell>
                      </TableRow>
                    ))
                  ) : members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No members associated with this employer
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-union-100 text-union-900">
                                {getInitials(member.full_name || `${member.first_name} ${member.last_name}`)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.full_name || `${member.first_name} ${member.last_name}`}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{member.unique_id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-foreground"
                              onClick={() => handleViewMember(member.id)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View Details</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          {/* Member count display */}
          {!loading && totalMembers > 0 && (
            <div className="flex items-center justify-between p-4">
              <p className="text-sm text-muted-foreground">
                Total: {totalMembers} active member{totalMembers !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Employee Ledger Tab */}
      {activeTab === 'employee-ledger' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Employee Ledger</CardTitle>
            <CardDescription>
              Contribution batches and individual member contributions for this employer
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Period Start</TableHead>
                    <TableHead>Period End</TableHead>
                    <TableHead>Period Year End</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Amount Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    // Loading skeleton rows
                    Array.from({ length: 5 }, (_, i) => (
                      <TableRow key={`loading-${i}`}>
                        <TableCell><div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-20 ml-auto"></div></TableCell>
                      </TableRow>
                    ))
                  ) : contributionBatches.length === 0 ? (
                    // Empty state
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No contribution batches found for this employer.
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Contribution batch rows
                    contributionBatches.map((batch) => {
                      const isExpanded = expandedBatches.has(batch.id);
                      
                      return (
                        <React.Fragment key={batch.id}>
                          <TableRow className="cursor-pointer hover:bg-gray-50" onClick={() => toggleBatchExpansion(batch.id)}>
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
                              {batch.received_date ? new Date(batch.received_date).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {batch.period_start ? new Date(batch.period_start).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {batch.period_end ? new Date(batch.period_end).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {batch.period_year_end ? new Date(batch.period_year_end).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-blue-600 font-medium">
                                {parseFloat(batch.total_hours.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-green-600 font-medium">
                                ${parseFloat(batch.amount_received.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </TableCell>
                          </TableRow>
                          
                          {/* Expanded detail rows for individual member contributions */}
                          {isExpanded && (
                            <TableRow>
                              <TableCell colSpan={7} className="bg-gray-50 p-0">
                                <div className="p-6">
                                  <h4 className="font-medium mb-4 text-gray-900">Individual Member Contributions</h4>
                                  {batch.employer_contributions.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">No individual contributions found for this batch.</p>
                                  ) : (
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="border-gray-300">
                                          <TableHead className="text-xs font-medium text-gray-600">Member ID</TableHead>
                                          <TableHead className="text-xs font-medium text-gray-600">Member Name</TableHead>
                                          <TableHead className="text-xs font-medium text-gray-600 text-right">Hours</TableHead>
                                          <TableHead className="text-xs font-medium text-gray-600 text-right">Rate</TableHead>
                                          <TableHead className="text-xs font-medium text-gray-600 text-right">Distribution</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {batch.employer_contributions.map((contribution) => (
                                          <TableRow key={contribution.id} className="border-gray-200">
                                            <TableCell className="text-sm text-gray-700 font-mono">
                                              {contribution.member.unique_id}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-700">
                                              {contribution.member.full_name || `${contribution.member.first_name} ${contribution.member.last_name}`}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-700 text-right">
                                              {parseFloat(contribution.hours.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-700 text-right">
                                              ${parseFloat(contribution.employer_rate.contribution_rate.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-700 text-right">
                                              ${parseFloat(contribution.amount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  )}
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
          {!loading && contributionBatches.length > 0 && (
            <div className="flex items-center justify-between p-4">
              <p className="text-sm text-muted-foreground">
                Total: {contributionBatches.length} contribution batch{contributionBatches.length !== 1 ? 'es' : ''}
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
