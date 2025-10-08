"use client";

import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import type { MemberDetailTab } from '@/lib/members/constants';

import { MemberDetailHeader } from './MemberDetailHeader';
import { MemberDetailTabs } from './MemberDetailTabs';

interface MemberDetailLayoutProps {
  tabs: MemberDetailTab[];
  activeTab: MemberDetailTab['id'];
  onTabChange: (tabId: MemberDetailTab['id']) => void;
  isEditMode: boolean;
  memberName: {
    firstName?: string;
    lastName?: string;
  };
  uniqueId?: string | number | null;
  onBack: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  hasUnsavedChanges: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  children: ReactNode;
}

export function MemberDetailLayout({
  tabs,
  activeTab,
  onTabChange,
  isEditMode,
  memberName,
  uniqueId,
  onBack,
  onEdit,
  onCancel,
  onSave,
  saving,
  hasUnsavedChanges,
  errorMessage,
  successMessage,
  children,
}: MemberDetailLayoutProps) {
  return (
    <div className="space-y-6">
      <MemberDetailHeader
        isEditMode={isEditMode}
        memberName={memberName}
        uniqueId={uniqueId}
        onBack={onBack}
        onEdit={onEdit}
        onCancel={onCancel}
        onSave={onSave}
        saving={saving}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {errorMessage ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </CardContent>
        </Card>
      ) : null}

      {successMessage ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-green-600">{successMessage}</p>
          </CardContent>
        </Card>
      ) : null}

      <MemberDetailTabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />

      <div>{children}</div>
    </div>
  );
}
