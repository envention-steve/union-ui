import { Shield, CircleDollarSign } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type InsurancePlanDetailTabId = 'insurance-plan' | 'premium-rates';

export type InsurancePlanDetailTab = {
  id: InsurancePlanDetailTabId;
  label: string;
  icon: LucideIcon;
};

export const INSURANCE_PLAN_DETAIL_TABS: InsurancePlanDetailTab[] = [
  { id: 'insurance-plan', label: 'Insurance Plan', icon: Shield },
  { id: 'premium-rates', label: 'Premium Rates', icon: CircleDollarSign },
];
