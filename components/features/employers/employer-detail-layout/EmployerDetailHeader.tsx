'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Save, X, Building } from 'lucide-react';

interface EmployerDetailHeaderProps {
  isEditMode: boolean;
  employerName?: string;
  onBack(): void;
  onEdit(): void;
  onCancel(): void;
  onSave(): void;
  saving: boolean;
  hasUnsavedChanges: boolean;
}

export function EmployerDetailHeader({
  isEditMode,
  employerName,
  onBack,
  onEdit,
  onCancel,
  onSave,
  saving,
  hasUnsavedChanges,
}: EmployerDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={onBack}
          className="hover:bg-gray-100"
          aria-label="Back to employers list"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-union-900">
            {isEditMode ? 'Edit Employer' : 'Employer Management'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Building className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">{employerName || 'Employer'}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {isEditMode ? (
          <>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={saving}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={saving || !hasUnsavedChanges}
              className="bg-union-600 hover:bg-union-700 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button
            onClick={onEdit}
            className="bg-union-600 hover:bg-union-700 text-white"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}
