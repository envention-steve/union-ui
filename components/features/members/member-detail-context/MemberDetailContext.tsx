"use client";

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import type {
  DistributionClass,
  InsurancePlan,
  MemberFormData,
  MemberStatus,
} from '@/lib/members/types';

export type MutableValue = string | number | boolean | undefined;

export interface ClaimTypeOption {
  value: string;
  label: string;
}

export interface MemberDetailContextValue {
  formData: MemberFormData;
  isEditMode: boolean;
  distributionClasses: DistributionClass[];
  memberStatuses: MemberStatus[];
  insurancePlans: InsurancePlan[];
  handleInputChange: (field: string, value: MutableValue) => void;
  addAddress: () => void;
  removeAddress: (index: number) => void;
  updateAddress: (index: number, field: string, value: string) => void;
  addPhoneNumber: () => void;
  removePhoneNumber: (index: number) => void;
  updatePhoneNumber: (index: number, field: string, value: string) => void;
  addEmailAddress: () => void;
  removeEmailAddress: (index: number) => void;
  updateEmailAddress: (index: number, field: string, value: string) => void;
  addDistributionClassCoverage: () => void;
  removeDistributionClassCoverage: (index: number) => void;
  updateDistributionClassCoverage: (index: number, field: string, value: MutableValue) => void;
  addMemberStatusCoverage: () => void;
  removeMemberStatusCoverage: (index: number) => void;
  updateMemberStatusCoverage: (index: number, field: string, value: MutableValue) => void;
  addInsurancePlanCoverage: () => void;
  removeInsurancePlanCoverage: (index: number) => void;
  updateInsurancePlanCoverage: (index: number, field: string, value: MutableValue) => void;
  updateLifeInsurancePerson: (index: number, field: string, value: MutableValue) => void;
}

const MemberDetailContext = createContext<MemberDetailContextValue | undefined>(undefined);

interface MemberDetailProviderProps {
  value: MemberDetailContextValue;
  children: ReactNode;
}

export function MemberDetailProvider({ value, children }: MemberDetailProviderProps) {
  return <MemberDetailContext.Provider value={value}>{children}</MemberDetailContext.Provider>;
}

export function useMemberDetailContext(): MemberDetailContextValue {
  const context = useContext(MemberDetailContext);

  if (!context) {
    throw new Error('useMemberDetailContext must be used within a MemberDetailProvider');
  }

  return context;
}
