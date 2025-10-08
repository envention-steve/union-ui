"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

import { MemberCoverageList } from './MemberCoverageList';
import { useMemberDetailContext } from '@/components/features/members/member-detail-context';

export function MemberOverviewTab() {
  const {
    formData,
    isEditMode,
    handleInputChange,
    addAddress,
    removeAddress,
    updateAddress,
    addPhoneNumber,
    removePhoneNumber,
    updatePhoneNumber,
    addEmailAddress,
    removeEmailAddress,
    updateEmailAddress,
    addDistributionClassCoverage,
    removeDistributionClassCoverage,
    updateDistributionClassCoverage,
    distributionClasses,
    addMemberStatusCoverage,
    removeMemberStatusCoverage,
    updateMemberStatusCoverage,
    memberStatuses,
  } = useMemberDetailContext();

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Member Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                SSN
              </label>
              <Input value="***-**-6789" disabled className="bg-gray-50" />
            </div>

            <div />
            <div />

            <div>
              <label
                htmlFor="member-first-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                First Name
              </label>
              <Input
                id="member-first-name"
                value={formData.first_name}
                onChange={(event) => handleInputChange('first_name', event.target.value)}
                disabled={!isEditMode}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Middle Name
              </label>
              <Input
                value={formData.middle_name || ''}
                onChange={(event) => handleInputChange('middle_name', event.target.value)}
                disabled={!isEditMode}
              />
            </div>

            <div>
              <label
                htmlFor="member-last-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Last Name
              </label>
              <Input
                id="member-last-name"
                value={formData.last_name}
                onChange={(event) => handleInputChange('last_name', event.target.value)}
                disabled={!isEditMode}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Suffix
              </label>
              <Select
                value={formData.suffix || 'none'}
                onValueChange={(value) =>
                  handleInputChange('suffix', value === 'none' ? '' : value)
                }
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
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Gender
              </label>
              <Select
                value={formData.gender || 'not-specified'}
                onValueChange={(value) =>
                  handleInputChange('gender', value === 'not-specified' ? undefined : value)
                }
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
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Birth Date
              </label>
              <Input
                type="date"
                value={formData.birth_date ? formData.birth_date.split('T')[0] : ''}
                onChange={(event) => handleInputChange('birth_date', event.target.value)}
                disabled={!isEditMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="deceased"
                checked={formData.deceased}
                onCheckedChange={(checked) => handleInputChange('deceased', checked)}
                disabled={!isEditMode}
              />
              <Label htmlFor="deceased" className="cursor-pointer text-sm font-medium text-gray-700">
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
              <Label htmlFor="include-cms" className="cursor-pointer text-sm font-medium text-gray-700">
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
                className="cursor-pointer text-sm font-medium text-gray-700"
              >
                Lock Distribution
              </Label>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Unique ID
              </label>
              <Input
                value={formData.unique_id}
                onChange={(event) => handleInputChange('unique_id', event.target.value)}
                disabled={!isEditMode}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Care Of
              </label>
              <Input
                value={formData.care_of || ''}
                onChange={(event) => handleInputChange('care_of', event.target.value)}
                disabled={!isEditMode}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Disabled Waiver
              </label>
              <Checkbox
                id="disabled-waiver"
                checked={formData.disabled_waiver}
                onCheckedChange={(checked) => handleInputChange('disabled_waiver', checked)}
                disabled={!isEditMode}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Addresses</CardTitle>
          {isEditMode && (
            <Button
              onClick={addAddress}
              size="sm"
              className="bg-union-600 text-white hover:bg-union-700"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Address
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.addresses.length === 0 ? (
            <p className="text-sm text-gray-500">No addresses added</p>
          ) : (
            formData.addresses.map((address, index) => (
              <div key={address.id || `address-${index}`} className="flex items-start gap-4">
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Address Type
                    </label>
                    <Input
                      value={address.type}
                      onChange={(event) => updateAddress(index, 'type', event.target.value)}
                      disabled={!isEditMode}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Street Address 1
                    </label>
                    <Input
                      value={address.street1}
                      onChange={(event) => updateAddress(index, 'street1', event.target.value)}
                      disabled={!isEditMode}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Street Address 2
                    </label>
                    <Input
                      value={address.street2 || ''}
                      onChange={(event) => updateAddress(index, 'street2', event.target.value)}
                      disabled={!isEditMode}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <Input
                      value={address.city}
                      onChange={(event) => updateAddress(index, 'city', event.target.value)}
                      disabled={!isEditMode}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <Input
                      value={address.state}
                      onChange={(event) => updateAddress(index, 'state', event.target.value)}
                      disabled={!isEditMode}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      ZIP Code
                    </label>
                    <Input
                      value={address.zip}
                      onChange={(event) => updateAddress(index, 'zip', event.target.value)}
                      disabled={!isEditMode}
                    />
                  </div>
                </div>

                {isEditMode && (
                  <Button
                    onClick={() => removeAddress(index)}
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Phone Numbers</CardTitle>
          {isEditMode && (
            <Button
              onClick={addPhoneNumber}
              size="sm"
              className="bg-union-600 text-white hover:bg-union-700"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Phone
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.phoneNumbers.length === 0 ? (
            <p className="text-sm text-gray-500">No phone numbers added</p>
          ) : (
            formData.phoneNumbers.map((phone, index) => (
              <div key={phone.id || `phone-${index}`} className="flex items-center gap-4">
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
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
                        <SelectItem value="Work">Work</SelectItem>
                        <SelectItem value="Home">Home</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <Input
                      value={phone.number}
                      onChange={(event) => updatePhoneNumber(index, 'number', event.target.value)}
                      disabled={!isEditMode}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Extension
                    </label>
                    <Input
                      value={phone.extension || ''}
                      onChange={(event) => updatePhoneNumber(index, 'extension', event.target.value)}
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
                    className="mt-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Email Addresses</CardTitle>
          {isEditMode && (
            <Button
              onClick={addEmailAddress}
              size="sm"
              className="bg-union-600 text-white hover:bg-union-700"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Email
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.emailAddresses.length === 0 ? (
            <p className="text-sm text-gray-500">No email addresses added</p>
          ) : (
            formData.emailAddresses.map((email, index) => (
              <div key={email.id || `email-${index}`} className="flex items-center gap-4">
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
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
                    <label
                      htmlFor={`email-address-${index}`}
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Email Address
                    </label>
                    <Input
                      id={`email-address-${index}`}
                      type="email"
                      value={email.email}
                      onChange={(event) => updateEmailAddress(index, 'email', event.target.value)}
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
                    className="mt-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <MemberCoverageList
        title="Distribution Class Coverages"
        coverages={formData.distribution_class_coverages}
        type="distribution_class"
        isEditMode={isEditMode}
        onAddCoverage={addDistributionClassCoverage}
        onRemoveCoverage={removeDistributionClassCoverage}
        onUpdateCoverage={updateDistributionClassCoverage}
        distributionClasses={distributionClasses}
      />

      <div id="member-status-coverages">
        <MemberCoverageList
          title="Member Status Coverages"
          coverages={formData.member_status_coverages}
          type="member_status"
          isEditMode={isEditMode}
          onAddCoverage={addMemberStatusCoverage}
          onRemoveCoverage={removeMemberStatusCoverage}
          onUpdateCoverage={updateMemberStatusCoverage}
          memberStatuses={memberStatuses}
        />
      </div>
    </div>
  );
}
