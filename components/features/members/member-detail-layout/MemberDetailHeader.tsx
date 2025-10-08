'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';

interface MemberDetailHeaderProps {
  isEditMode: boolean;
  memberName: {
    firstName?: string;
    lastName?: string;
  };
  uniqueId?: string | number | null;
  onBack(): void;
  onEdit(): void;
  onCancel(): void;
  onSave(): void;
  saving: boolean;
  hasUnsavedChanges: boolean;
}

export function MemberDetailHeader({
  isEditMode,
  memberName,
  uniqueId,
  onBack,
  onEdit,
  onCancel,
  onSave,
  saving,
  hasUnsavedChanges,
}: MemberDetailHeaderProps) {
  const fullName = [memberName.firstName, memberName.lastName]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={onBack}
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
              {fullName || 'Member'}
            </span>
            {uniqueId ? (
              <Badge
                variant="outline"
                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                Unique ID: {uniqueId}
              </Badge>
            ) : null}
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
