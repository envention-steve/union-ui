"use client";

import { memo } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit } from 'lucide-react';
import type {
  DistributionClass,
  DistributionClassCoverage,
  InsurancePlan,
  InsurancePlanCoverage,
  LifeInsuranceCoverage,
  MemberStatus,
  MemberStatusCoverage,
} from '@/lib/members/types';

type MutableValue = string | number | boolean | undefined;

type CoverageUnion =
  | DistributionClassCoverage
  | MemberStatusCoverage
  | InsurancePlanCoverage
  | LifeInsuranceCoverage;

interface MemberCoverageListProps {
  title: string;
  coverages: CoverageUnion[];
  type: 'distribution_class' | 'member_status' | 'insurance_plan' | 'life_insurance';
  isEditMode: boolean;
  onAddCoverage?: () => void;
  onRemoveCoverage?: (index: number) => void;
  onUpdateCoverage?: (index: number, field: string, value: MutableValue) => void;
  onEditBeneficiary?: (coverage: LifeInsuranceCoverage) => void;
  onUpdateLifeInsurancePerson?: (index: number, field: string, value: MutableValue) => void;
  distributionClasses?: DistributionClass[];
  memberStatuses?: MemberStatus[];
  insurancePlans?: InsurancePlan[];
}

function MemberCoverageListComponent({
  title,
  coverages,
  type,
  isEditMode,
  onAddCoverage,
  onRemoveCoverage,
  onUpdateCoverage,
  onEditBeneficiary,
  onUpdateLifeInsurancePerson,
  distributionClasses = [],
  memberStatuses = [],
  insurancePlans = [],
}: MemberCoverageListProps) {
  const currentLifeCoverageId = type === 'life_insurance'
    ? (coverages as LifeInsuranceCoverage[]).find((coverage) => !coverage.end_date)?.id ?? null
    : null;

  const getDisplayName = (coverage: CoverageUnion) => {
    if (type === 'distribution_class' && 'distribution_class' in coverage && coverage.distribution_class) {
      return coverage.distribution_class.description;
    }
    if (type === 'member_status' && 'member_status' in coverage && coverage.member_status) {
      return coverage.member_status.name;
    }
    if (type === 'insurance_plan' && 'insurance_plan' in coverage && coverage.insurance_plan) {
      return coverage.insurance_plan.name;
    }
    return 'N/A';
  };

  const getSecondaryInfo = (coverage: CoverageUnion) => {
    if (type === 'distribution_class' && 'distribution_class' in coverage && coverage.distribution_class) {
      return `Class: ${coverage.distribution_class.name}`;
    }

    if (type === 'member_status' && 'member_status' in coverage && coverage.member_status) {
      return `Admin Fee: $${coverage.member_status.admin_fee}`;
    }

    if (type === 'insurance_plan') {
      const info: string[] = [];
      if ('insurance_plan' in coverage && coverage.insurance_plan) {
        info.push(`Type: ${coverage.insurance_plan.type}`);
        info.push(`Code: ${coverage.insurance_plan.code}`);
      }
      if ('policy_number' in coverage && coverage.policy_number) {
        info.push(`Policy: ${coverage.policy_number}`);
      }
      return info.length > 0 ? info.join(' | ') : null;
    }

    if (type === 'life_insurance') {
      const lifeCoverage = coverage as LifeInsuranceCoverage;
      const lines: string[] = [];

      if (lifeCoverage.beneficiary_info_received !== undefined) {
        lines.push(`Beneficiary Info: ${lifeCoverage.beneficiary_info_received ? 'Received' : 'Pending'}`);
      }

      if (lifeCoverage.beneficiary) {
        lines.push(`Beneficiary: ${lifeCoverage.beneficiary}`);
      }

      return (
        <div className="flex w-full items-start justify-between">
          <div>
            {lines.length > 0
              ? lines.map((line, index) => <div key={index}>{line}</div>)
              : <div className="text-gray-500">No beneficiary info</div>}
          </div>
          {onEditBeneficiary && lifeCoverage.id === currentLifeCoverageId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditBeneficiary(lifeCoverage)}
              className="ml-4"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      );
    }

    return null;
  };

  const handleDateChange = (index: number, field: string, value: string) => {
    if (!onUpdateCoverage) {
      return;
    }

    const isoValue = value
      ? new Date(`${value}T00:00:00.000Z`).toISOString()
      : undefined;

    onUpdateCoverage(index, field, isoValue ?? (field === 'start_date' ? '' : undefined));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {isEditMode && onAddCoverage ? (
          <Button
            onClick={onAddCoverage}
            size="sm"
            className="bg-union-600 text-white hover:bg-union-700"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Coverage
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {coverages.length === 0 ? (
          <p className="text-sm text-gray-500">No {title.toLowerCase()} found</p>
        ) : (
          <div className="space-y-3">
            {coverages.map((coverage, index) => {
              const displayName = getDisplayName(coverage);
              const secondaryInfo = getSecondaryInfo(coverage);

              return (
                <div key={coverage.id ?? index} className="rounded-lg border p-4">
                  <div className="space-y-3">
                    {isEditMode && onRemoveCoverage ? (
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">Coverage #{index + 1}</h4>
                        <Button
                          onClick={() => onRemoveCoverage(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        {type === 'distribution_class'
                          ? 'Distribution Class'
                          : type === 'member_status'
                            ? 'Member Status'
                            : type === 'insurance_plan'
                              ? 'Insurance Plan'
                              : 'Coverage Type'}
                      </label>

                      {isEditMode && type === 'distribution_class' && onUpdateCoverage ? (
                        <Select
                          value={(coverage as DistributionClassCoverage).distribution_class_id?.toString() ?? ''}
                          onValueChange={(value) => {
                            const intValue = parseInt(value, 10);
                            const selectedClass = distributionClasses.find((item) => item.id === intValue);
                            onUpdateCoverage(index, 'distribution_class_id', intValue);
                            onUpdateCoverage(index, 'distribution_class', selectedClass ? selectedClass.id : undefined);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Distribution Class" />
                          </SelectTrigger>
                          <SelectContent>
                            {distributionClasses.map((item) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : null}

                      {isEditMode && type === 'member_status' && onUpdateCoverage ? (
                        <Select
                          value={(coverage as MemberStatusCoverage).member_status_id?.toString() ?? ''}
                          onValueChange={(value) => {
                            const intValue = parseInt(value, 10);
                            const selectedStatus = memberStatuses.find((item) => item.id === intValue);
                            onUpdateCoverage(index, 'member_status_id', intValue);
                            onUpdateCoverage(index, 'member_status', selectedStatus ? selectedStatus.id : undefined);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Member Status" />
                          </SelectTrigger>
                          <SelectContent>
                            {memberStatuses.map((item) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : null}

                      {isEditMode && type === 'insurance_plan' && onUpdateCoverage ? (
                        <Select
                          value={(coverage as InsurancePlanCoverage).insurance_plan_id?.toString() ?? ''}
                          onValueChange={(value) => {
                            const intValue = parseInt(value, 10);
                            const selectedPlan = insurancePlans.find((item) => item.id === intValue);
                            onUpdateCoverage(index, 'insurance_plan_id', intValue);
                            onUpdateCoverage(index, 'insurance_plan', selectedPlan ? selectedPlan.id : undefined);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Insurance Plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {insurancePlans.map((item) => (
                              <SelectItem key={item.id} value={item.id?.toString() ?? ''}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : null}

                      {!(isEditMode && (type === 'distribution_class' || type === 'member_status' || type === 'insurance_plan')) ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">{displayName}</p>
                          {secondaryInfo ? (
                            <div className="mt-1 text-xs text-gray-600">{secondaryInfo}</div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {type !== 'life_insurance' ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
                          {isEditMode && onUpdateCoverage ? (
                            <Input
                              type="date"
                              value={coverage.start_date ? coverage.start_date.split('T')[0] : ''}
                              onChange={(event) => handleDateChange(index, 'start_date', event.target.value)}
                            />
                          ) : (
                            <p className="text-sm">
                              {coverage.start_date ? new Date(coverage.start_date).toLocaleDateString() : 'N/A'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">End Date</label>
                          {isEditMode && onUpdateCoverage ? (
                            <Input
                              type="date"
                              value={coverage.end_date ? coverage.end_date.split('T')[0] : ''}
                              onChange={(event) => handleDateChange(index, 'end_date', event.target.value)}
                              placeholder="Leave empty for active coverage"
                            />
                          ) : (
                            <p className="text-sm">
                              {coverage.end_date ? new Date(coverage.end_date).toLocaleDateString() : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {type === 'insurance_plan' && isEditMode && onUpdateCoverage ? (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Policy Number</label>
                        <Input
                          defaultValue={(coverage as InsurancePlanCoverage).policy_number ?? ''}
                          onBlur={(event) => onUpdateCoverage(index, 'policy_number', event.target.value)}
                          placeholder="Enter policy number"
                        />
                      </div>
                    ) : null}

                    {type === 'insurance_plan' && !isEditMode ? (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Policy Number</label>
                        <p className="text-sm">
                          {(coverage as InsurancePlanCoverage).policy_number || 'N/A'}
                        </p>
                      </div>
                    ) : null}

                    {type === 'life_insurance' && 'life_insurance_person' in coverage && coverage.life_insurance_person ? (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="mb-2 text-sm font-medium text-gray-700">Insured Person</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          {['first_name', 'middle_name', 'last_name'].map((field) => (
                            <div key={field}>
                              <label className="mb-1 block text-sm font-medium text-gray-700">
                                {field.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                              </label>
                              {isEditMode && onUpdateLifeInsurancePerson ? (
                                <Input
                                  value={(coverage as LifeInsuranceCoverage).life_insurance_person?.[field as keyof LifeInsuranceCoverage['life_insurance_person']] ?? ''}
                                  onChange={(event) => onUpdateLifeInsurancePerson(index, field, event.target.value)}
                                />
                              ) : (
                                <p className="text-sm">
                                  {(coverage as LifeInsuranceCoverage).life_insurance_person?.[field as keyof LifeInsuranceCoverage['life_insurance_person']] || 'N/A'}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">SSN</label>
                            {isEditMode && onUpdateLifeInsurancePerson ? (
                              <Input
                                value={(coverage as LifeInsuranceCoverage).life_insurance_person?.ssn ?? ''}
                                onChange={(event) => onUpdateLifeInsurancePerson(index, 'ssn', event.target.value)}
                              />
                            ) : (
                              <p className="text-sm">
                                {(coverage as LifeInsuranceCoverage).life_insurance_person?.ssn ? '***-**-****' : 'N/A'}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Birth Date</label>
                            {isEditMode && onUpdateLifeInsurancePerson ? (
                              <Input
                                type="date"
                                value={(coverage as LifeInsuranceCoverage).life_insurance_person?.birth_date
                                  ? (coverage as LifeInsuranceCoverage).life_insurance_person!.birth_date!.split('T')[0]
                                  : ''}
                                onChange={(event) => onUpdateLifeInsurancePerson(index, 'birth_date', event.target.value)}
                              />
                            ) : (
                              <p className="text-sm">
                                {(coverage as LifeInsuranceCoverage).life_insurance_person?.birth_date
                                  ? new Date((coverage as LifeInsuranceCoverage).life_insurance_person!.birth_date!).toLocaleDateString()
                                  : 'N/A'}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Gender</label>
                            {isEditMode && onUpdateLifeInsurancePerson ? (
                              <Select
                                value={(coverage as LifeInsuranceCoverage).life_insurance_person?.gender ?? 'not-specified'}
                                onValueChange={(value) => onUpdateLifeInsurancePerson(index, 'gender', value === 'not-specified' ? undefined : value)}
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
                            ) : (
                              <p className="text-sm">
                                {(coverage as LifeInsuranceCoverage).life_insurance_person?.gender || 'N/A'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const MemberCoverageList = memo(MemberCoverageListComponent);
