"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DependentCoverage } from '@/lib/members/types';
import { Plus, Trash2 } from 'lucide-react';

type MutableValue = string | number | boolean | undefined;

interface MemberDependentsTabProps {
  dependentCoverages: DependentCoverage[];
  isEditMode: boolean;
  onAddDependent: () => void;
  onRemoveDependent: (index: number) => void;
  onUpdateDependent: (index: number, field: string, value: MutableValue) => void;
  onUpdateDependentCoverage: (index: number, field: string, value: MutableValue) => void;
}

export function MemberDependentsTab({
  dependentCoverages,
  isEditMode,
  onAddDependent,
  onRemoveDependent,
  onUpdateDependent,
  onUpdateDependentCoverage,
}: MemberDependentsTabProps) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Dependents</CardTitle>
          {isEditMode ? (
            <Button
              onClick={onAddDependent}
              size="sm"
              className="bg-union-600 text-white hover:bg-union-700"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Dependent
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {dependentCoverages.length === 0 ? (
            <p className="text-sm text-gray-500">No dependents found</p>
          ) : (
            dependentCoverages.map((coverage, index) => {
              const dependent = coverage.dependent;
              if (!dependent) {
                return null;
              }

              return (
                <div key={coverage.id ?? index} className="space-y-4 rounded-lg border p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {dependent.first_name} {dependent.middle_name} {dependent.last_name}
                    </h3>
                    {isEditMode ? (
                      <Button
                        onClick={() => onRemoveDependent(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label
                        htmlFor={`dependent-${index}-first-name`}
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        First Name
                      </label>
                      <Input
                        id={`dependent-${index}-first-name`}
                        value={dependent.first_name}
                        onChange={(event) => onUpdateDependent(index, 'first_name', event.target.value)}
                        disabled={!isEditMode}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`dependent-${index}-middle-name`}
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Middle Name
                      </label>
                      <Input
                        id={`dependent-${index}-middle-name`}
                        value={dependent.middle_name ?? ''}
                        onChange={(event) => onUpdateDependent(index, 'middle_name', event.target.value)}
                        disabled={!isEditMode}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`dependent-${index}-last-name`}
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Last Name
                      </label>
                      <Input
                        id={`dependent-${index}-last-name`}
                        value={dependent.last_name}
                        onChange={(event) => onUpdateDependent(index, 'last_name', event.target.value)}
                        disabled={!isEditMode}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Gender</label>
                      <Select
                        value={dependent.gender ?? 'not-specified'}
                        onValueChange={(value) => onUpdateDependent(index, 'gender', value === 'not-specified' ? undefined : value)}
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
                      <label className="mb-1 block text-sm font-medium text-gray-700">Birth Date</label>
                      <Input
                        type="date"
                        value={dependent.birth_date ? dependent.birth_date.split('T')[0] : ''}
                        onChange={(event) => onUpdateDependent(index, 'birth_date', event.target.value)}
                        disabled={!isEditMode}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Relationship</label>
                      <Select
                        value={dependent.dependent_type}
                        onValueChange={(value) => onUpdateDependent(index, 'dependent_type', value)}
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
                    <h4 className="mb-2 text-sm font-medium text-gray-700">Coverage Period</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
                        {isEditMode ? (
                          <Input
                            type="date"
                            value={coverage.start_date ? coverage.start_date.split('T')[0] : ''}
                            onChange={(event) => onUpdateDependentCoverage(index, 'start_date', event.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-gray-600">
                            {coverage.start_date ? new Date(coverage.start_date).toLocaleDateString() : 'N/A'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">End Date</label>
                        {isEditMode ? (
                          <Input
                            type="date"
                            value={coverage.end_date ? coverage.end_date.split('T')[0] : ''}
                            onChange={(event) => onUpdateDependentCoverage(index, 'end_date', event.target.value || undefined)}
                            placeholder="Leave empty for active coverage"
                          />
                        ) : (
                          <p className="text-sm text-gray-600">
                            {coverage.end_date ? new Date(coverage.end_date).toLocaleDateString() : ''}
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
  );
}
