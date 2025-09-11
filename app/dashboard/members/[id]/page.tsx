'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Folder
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

interface MemberFormData extends Member {
  addresses: Address[];
  phoneNumbers: PhoneNumber[];
  emailAddresses: EmailAddress[];
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
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
                  <div key={index} className="border rounded-lg p-4 space-y-3">
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
                  <div key={index} className="flex items-center gap-4">
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
                  <div key={index} className="flex items-center gap-4">
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

      {/* Placeholder for other tabs */}
      {activeTab !== 'member' && (
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
