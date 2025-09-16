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
  Shield,
  CircleDollarSign,
  Building2,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { backendApiClient } from '@/lib/api-client';
import { InsurancePlan, InsurancePlanRateCoverage } from '@/types';

interface Address {
  id?: string;
  type: string;
  label?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
}

interface PhoneNumber {
  id?: string;
  type: string;
  label?: string;
  number: string;
  extension?: string;
  country_code?: string;
  is_default?: boolean;
}

interface EmailAddress {
  id?: string;
  type: string;
  label?: string;
  email_address: string;
  is_default?: boolean;
}

interface InsurancePlanFormData extends InsurancePlan {
  addresses: Address[];
  phoneNumbers: PhoneNumber[];
  emailAddresses: EmailAddress[];
  insurance_plan_rates: InsurancePlanRateCoverage[];
}

const TABS = [
  { id: 'insurance-plan', label: 'Insurance Plan', icon: Shield },
  { id: 'premium-rates', label: 'Premium Rates', icon: CircleDollarSign },
];

const PLAN_TYPES = [
  { value: 'HEALTH', label: 'Health' },
  { value: 'DENTAL', label: 'Dental' },
  { value: 'VISION', label: 'Vision' },
  { value: 'OTHER', label: 'Other' },
];

export default function InsurancePlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'view';
  const isEditMode = mode === 'edit';

  const [activeTab, setActiveTab] = useState('insurance-plan');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [originalData, setOriginalData] = useState<InsurancePlanFormData | null>(null);
  const [formData, setFormData] = useState<InsurancePlanFormData>({
    id: 0,
    name: '',
    code: '',
    type: 'HEALTH',
    group: '',
    include_cms: false,
    insurance_plan_company_id: 0,
    addresses: [],
    phoneNumbers: [],
    emailAddresses: [],
    insurance_plan_rates: [],
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

  // Fetch insurance plan data
  const fetchInsurancePlan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await backendApiClient.insurancePlans.getDetails!(resolvedParams.id);
      
      // Transform API response to form data structure
      const planData: InsurancePlanFormData = {
        ...response,
        // Transform addresses from API format to UI format - from insurance_plan_company relationship
        addresses: (response.insurance_plan_company?.addresses || []).map((addr: any) => ({
          id: addr.id,
          type: addr.label || 'OFFICE',
          label: addr.label,
          street1: addr.street1,
          street2: addr.street2 || '',
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
        })),
        
        // Transform phone numbers from API format to UI format - from insurance_plan_company relationship
        phoneNumbers: (response.insurance_plan_company?.phone_numbers || []).map((phone: any) => ({
          id: phone.id,
          type: phone.label || 'OFFICE',
          label: phone.label,
          number: phone.number,
          extension: '',
          country_code: phone.country_code || '1',
          is_default: phone.is_default || false,
        })),
        
        // Transform email addresses from API format to UI format - from insurance_plan_company relationship
        emailAddresses: (response.insurance_plan_company?.email_addresses || []).map((email: any) => ({
          id: email.id,
          type: email.label || 'OFFICE',
          label: email.label,
          email_address: email.email_address,
          is_default: email.is_default || false,
        })),
        
        insurance_plan_rates: response.insurance_plan_rates || [],
      };
      
      setFormData(planData);
      setOriginalData(planData);
    } catch (err) {
      console.error('Error fetching insurance plan:', err);
      setError('Failed to load insurance plan data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchInsurancePlan();
  }, [fetchInsurancePlan]);

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

      // Process insurance plan rate coverages
      const processedRateCoverages = formData.insurance_plan_rates
        .map(rate => {
          const now = new Date().toISOString();
          const processedRate: any = {
            insurance_plan_id: parseInt(resolvedParams.id),
            rate: parseFloat(rate.rate.toString()),
            start_date: formatDateForAPI(rate.start_date),
            end_date: rate.end_date ? formatDateForAPI(rate.end_date) : null,
            // Include created_at and updated_at - use existing values for existing rates, current time for new rates
            created_at: rate.created_at || now,
            updated_at: now, // Always update the updated_at timestamp
          };
          
          // Only include id for existing rates (positive IDs)
          if (rate.id && rate.id > 0) {
            processedRate.id = rate.id;
          }
          // New rates (no id or id <= 0) will be created without id field
          
          return processedRate;
        })
        .filter(rate => rate.start_date && rate.rate > 0);

      // Base data for insurance plan updates
      const updateData = {
        id: formData.id,
        name: formData.name,
        code: formData.code,
        type: formData.type,
        group: formData.group,
        include_cms: formData.include_cms,
        insurance_plan_company_id: formData.insurance_plan_company_id,
        
        // Transform addresses with proper type field - using company types to match API response
        addresses: formData.addresses.map(addr => ({
          ...(addr.id && { id: addr.id }),
          type: 'company_address', // Match the polymorphic type from API response
          label: addr.type, // Map UI 'type' to API 'label'
          street1: addr.street1,
          street2: addr.street2 || null,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
        })),
        
        // Transform phone numbers with proper type field - using company types to match API response
        phone_numbers: formData.phoneNumbers.map(phone => ({
          ...(phone.id && { id: phone.id }),
          type: 'company_phone_number', // Match the polymorphic type from API response
          label: phone.type, // Map UI 'type' to API 'label'
          number: phone.number,
          country_code: phone.country_code || '1',
          is_default: phone.is_default || false,
        })),
        
        // Transform email addresses with proper type field - using company types to match API response
        email_addresses: formData.emailAddresses.map(email => ({
          ...(email.id && { id: email.id }),
          type: 'company_email_address', // Match the polymorphic type from API response
          label: email.type, // Map UI 'type' to API 'label'
          email_address: email.email_address,
          is_default: email.is_default || false,
        })),
        
        // Include insurance plan rate coverages if any
        ...(processedRateCoverages.length > 0 && {
          insurance_plan_rates: processedRateCoverages
        }),
      };
      
      console.log('🚀 About to save insurance plan data:', {
        addresses: updateData.addresses,
        phone_numbers: updateData.phone_numbers,
        email_addresses: updateData.email_addresses,
        insurance_plan_rates: updateData.insurance_plan_rates,
        fullUpdateData: updateData
      });
      
      const response = await backendApiClient.insurancePlans.update(resolvedParams.id, updateData);
      
      // Refresh data from API to get updated nested info
      await fetchInsurancePlan();
      
      setHasUnsavedChanges(false);
      setSuccess('Insurance plan data saved successfully!');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
      router.push(`/dashboard/insurance-plans/${resolvedParams.id}?mode=view`);
    } catch (err) {
      console.error('Error saving insurance plan:', err);
      
      // Try to extract specific error details from API response
      let errorMessage = 'Failed to save insurance plan data. Please try again.';
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as any).response;
        if (response?.data?.detail) {
          console.error('API validation errors:', response.data.detail);
          errorMessage = 'Validation errors occurred. Check console for details.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setFormData(originalData!);
        setHasUnsavedChanges(false);
        router.push(`/dashboard/insurance-plans/${resolvedParams.id}?mode=view`);
      }
    } else {
      router.push(`/dashboard/insurance-plans/${resolvedParams.id}?mode=view`);
    }
  };

  const handleBackToList = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/dashboard/insurance-plans');
      }
    } else {
      router.push('/dashboard/insurance-plans');
    }
  };

  const addAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        { type: 'OFFICE', street1: '', street2: '', city: '', state: '', zip: '' }
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
        { type: 'OFFICE', number: '', extension: '' }
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
        { type: 'OFFICE', email_address: '' }
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

  const addRateCoverage = () => {
    const now = new Date();
    const todayDateISO = new Date(now.toISOString().split('T')[0] + 'T00:00:00.000Z').toISOString();
    // New rates don't need an ID - the API will generate it
    const newRate: Partial<InsurancePlanRateCoverage> = {
      insurance_plan_id: formData.id,
      rate: 0,
      start_date: todayDateISO,
      end_date: undefined,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    
    setFormData(prev => ({
      ...prev,
      insurance_plan_rates: [...prev.insurance_plan_rates, newRate as InsurancePlanRateCoverage]
    }));
  };

  const removeRateCoverage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      insurance_plan_rates: prev.insurance_plan_rates.filter((_, i) => i !== index)
    }));
  };

  const updateRateCoverage = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      insurance_plan_rates: prev.insurance_plan_rates.map((rate, i) => {
        if (i === index) {
          const updatedRate = { ...rate, [field]: value };
          // Ensure we maintain required timestamp fields for existing rates
          if (!updatedRate.created_at && rate.created_at) {
            updatedRate.created_at = rate.created_at;
          }
          // Always update the updated_at timestamp when modifying
          updatedRate.updated_at = new Date().toISOString();
          return updatedRate;
        }
        return rate;
      })
    }));
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'HEALTH': 'bg-green-100 text-green-800',
      'DENTAL': 'bg-blue-100 text-blue-800',
      'VISION': 'bg-purple-100 text-purple-800',
      'OTHER': 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.OTHER;
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
          <h1 className="text-3xl font-bold text-union-900">Insurance Plan Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button 
                onClick={fetchInsurancePlan} 
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
              {isEditMode ? 'Edit Insurance Plan' : 'Insurance Plan Management'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-600">
                {formData.name}
              </span>
              <Badge 
                variant="outline" 
                className={`text-xs ${getTypeColor(formData.type)}`}
              >
                {formData.type}
              </Badge>
              <Badge 
                variant="outline" 
                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                Code: {formData.code}
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
              onClick={() => router.push(`/dashboard/insurance-plans/${resolvedParams.id}?mode=edit`)}
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
      {activeTab === 'insurance-plan' && (
        <div className="grid gap-6">
          {/* Insurance Plan Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Insurance Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="plan-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Name
                  </label>
                  <Input
                    id="plan-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditMode}
                  />
                </div>

                <div>
                  <label htmlFor="plan-code" className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Code
                  </label>
                  <Input
                    id="plan-code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    disabled={!isEditMode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Type
                  </label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => handleInputChange('type', value)}
                    disabled={!isEditMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Plan Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group
                  </label>
                  <Input
                    value={formData.group}
                    onChange={(e) => handleInputChange('group', e.target.value)}
                    disabled={!isEditMode}
                  />
                </div>
              </div>
              
              {/* Checkbox Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_cms"
                    checked={formData.include_cms}
                    onCheckedChange={(checked) => handleInputChange('include_cms', checked)}
                    disabled={!isEditMode}
                  />
                  <Label 
                    htmlFor="include_cms" 
                    className="text-sm font-medium text-gray-700"
                  >
                    Include CMS
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Addresses
              </CardTitle>
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
                <p className="text-gray-500 text-sm">No addresses found</p>
              ) : (
                <div className="space-y-4">
                  {formData.addresses.map((address, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">Address #{index + 1}</h4>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          {isEditMode ? (
                            <Select 
                              value={address.type} 
                              onValueChange={(value) => updateAddress(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OFFICE">Office</SelectItem>
                                <SelectItem value="MAILING">Mailing</SelectItem>
                                <SelectItem value="BILLING">Billing</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm">{address.type}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor={`address-street1-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Street 1
                          </label>
                          {isEditMode ? (
                            <Input
                              id={`address-street1-${index}`}
                              value={address.street1}
                              onChange={(e) => updateAddress(index, 'street1', e.target.value)}
                            />
                          ) : (
                            <p className="text-sm">{address.street1}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street 2
                          </label>
                          {isEditMode ? (
                            <Input
                              value={address.street2 || ''}
                              onChange={(e) => updateAddress(index, 'street2', e.target.value)}
                            />
                          ) : (
                            <p className="text-sm">{address.street2 || 'N/A'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          {isEditMode ? (
                            <Input
                              value={address.city}
                              onChange={(e) => updateAddress(index, 'city', e.target.value)}
                            />
                          ) : (
                            <p className="text-sm">{address.city}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State
                          </label>
                          {isEditMode ? (
                            <Input
                              value={address.state}
                              onChange={(e) => updateAddress(index, 'state', e.target.value)}
                            />
                          ) : (
                            <p className="text-sm">{address.state}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ZIP
                          </label>
                          {isEditMode ? (
                            <Input
                              value={address.zip}
                              onChange={(e) => updateAddress(index, 'zip', e.target.value)}
                            />
                          ) : (
                            <p className="text-sm">{address.zip}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phone Numbers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Phone Numbers
              </CardTitle>
              {isEditMode && (
                <Button 
                  onClick={addPhoneNumber}
                  size="sm"
                  className="bg-union-600 hover:bg-union-700 text-white"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Phone Number
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.phoneNumbers.length === 0 ? (
                <p className="text-gray-500 text-sm">No phone numbers found</p>
              ) : (
                <div className="space-y-4">
                  {formData.phoneNumbers.map((phone, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">Phone #{index + 1}</h4>
                        {isEditMode && (
                          <Button 
                            onClick={() => removePhoneNumber(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          {isEditMode ? (
                            <Select 
                              value={phone.type} 
                              onValueChange={(value) => updatePhoneNumber(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OFFICE">Office</SelectItem>
                                <SelectItem value="FAX">Fax</SelectItem>
                                <SelectItem value="MOBILE">Mobile</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm">{phone.type}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor={`phone-number-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                          </label>
                          {isEditMode ? (
                            <Input
                              id={`phone-number-${index}`}
                              value={phone.number}
                              onChange={(e) => updatePhoneNumber(index, 'number', e.target.value)}
                            />
                          ) : (
                            <p className="text-sm">{phone.number}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Extension
                          </label>
                          {isEditMode ? (
                            <Input
                              value={phone.extension || ''}
                              onChange={(e) => updatePhoneNumber(index, 'extension', e.target.value)}
                            />
                          ) : (
                            <p className="text-sm">{phone.extension || 'N/A'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Addresses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Addresses
              </CardTitle>
              {isEditMode && (
                <Button 
                  onClick={addEmailAddress}
                  size="sm"
                  className="bg-union-600 hover:bg-union-700 text-white"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Email Address
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.emailAddresses.length === 0 ? (
                <p className="text-gray-500 text-sm">No email addresses found</p>
              ) : (
                <div className="space-y-4">
                  {formData.emailAddresses.map((email, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">Email #{index + 1}</h4>
                        {isEditMode && (
                          <Button 
                            onClick={() => removeEmailAddress(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          {isEditMode ? (
                            <Select 
                              value={email.type} 
                              onValueChange={(value) => updateEmailAddress(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OFFICE">Office</SelectItem>
                                <SelectItem value="BILLING">Billing</SelectItem>
                                <SelectItem value="SUPPORT">Support</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm">{email.type}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor={`email-address-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          {isEditMode ? (
                            <Input
                              id={`email-address-${index}`}
                              type="email"
                              value={email.email_address}
                              onChange={(e) => updateEmailAddress(index, 'email_address', e.target.value)}
                            />
                          ) : (
                            <p className="text-sm">{email.email_address}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'premium-rates' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5" />
              Premium Rates
            </CardTitle>
            {isEditMode && (
              <Button 
                onClick={addRateCoverage}
                size="sm"
                className="bg-union-600 hover:bg-union-700 text-white"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Rate Coverage
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.insurance_plan_rates.length === 0 ? (
              <p className="text-gray-500 text-sm">No premium rates found</p>
            ) : (
              <div className="space-y-4">
                {formData.insurance_plan_rates.map((rate, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">Rate #{index + 1}</h4>
                      {isEditMode && (
                        <Button 
                          onClick={() => removeRateCoverage(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor={`rate-amount-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Rate Amount ($)
                        </label>
                        {isEditMode ? (
                          <Input
                            id={`rate-amount-${index}`}
                            type="number"
                            step="0.01"
                            value={rate.rate}
                            onChange={(e) => updateRateCoverage(index, 'rate', parseFloat(e.target.value))}
                          />
                        ) : (
                          <p className="text-sm">${parseFloat(rate.rate).toFixed(2)}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        {isEditMode ? (
                          <Input
                            type="date"
                            value={rate.start_date ? rate.start_date.split('T')[0] : ''}
                            onChange={(e) => {
                              const isoDate = e.target.value ? new Date(e.target.value + 'T00:00:00.000Z').toISOString() : '';
                              updateRateCoverage(index, 'start_date', isoDate);
                            }}
                          />
                        ) : (
                          <p className="text-sm">
                            {rate.start_date ? new Date(rate.start_date).toLocaleDateString() : 'N/A'}
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
                            value={rate.end_date ? rate.end_date.split('T')[0] : ''}
                            onChange={(e) => {
                              const isoDate = e.target.value ? new Date(e.target.value + 'T00:00:00.000Z').toISOString() : undefined;
                              updateRateCoverage(index, 'end_date', isoDate);
                            }}
                            placeholder="Leave empty for active rate"
                          />
                        ) : (
                          <p className="text-sm">
                            {rate.end_date ? new Date(rate.end_date).toLocaleDateString() : 'Active'}
                          </p>
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
    </div>
  );
}