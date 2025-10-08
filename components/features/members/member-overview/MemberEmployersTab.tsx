"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EmployerCoverage } from '@/lib/members/types';
import { Plus, Trash2 } from 'lucide-react';

interface MemberEmployersTabProps {
  employerCoverages: EmployerCoverage[];
  isEditMode: boolean;
  onAddEmployer: () => void;
  onRemoveEmployer: (index: number) => void;
}

export function MemberEmployersTab({
  employerCoverages,
  isEditMode,
  onAddEmployer,
  onRemoveEmployer,
}: MemberEmployersTabProps) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Employers</CardTitle>
          {isEditMode ? (
            <Button
              onClick={onAddEmployer}
              size="sm"
              className="bg-union-600 text-white hover:bg-union-700"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Employer
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {employerCoverages.length === 0 ? (
            <p className="text-sm text-gray-500">No employers found</p>
          ) : (
            employerCoverages.map((coverage, index) => (
              <div key={coverage.id ?? index} className="space-y-4 rounded-lg border p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {coverage.employer?.name || 'Unnamed Employer'}
                  </h3>
                  {isEditMode ? (
                    <Button
                      onClick={() => onRemoveEmployer(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>

                <div className="border-t pt-4">
                  <h4 className="mb-2 text-sm font-medium text-gray-700">Employment Period</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
                      <p className="text-sm text-gray-600">
                        {coverage.start_date ? new Date(coverage.start_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">End Date</label>
                      <p className="text-sm text-gray-600">
                        {coverage.end_date ? new Date(coverage.end_date).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
