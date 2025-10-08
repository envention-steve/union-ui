import { Building, DollarSign, ClipboardList, Users, Folder } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type EmployerDetailTabId =
  | 'employer'
  | 'employer-rates'
  | 'notes'
  | 'members'
  | 'employee-ledger';

export type EmployerDetailTab = {
  id: EmployerDetailTabId;
  label: string;
  icon: LucideIcon;
};

export const EMPLOYER_DETAIL_TABS: EmployerDetailTab[] = [
  { id: 'employer', label: 'Employer', icon: Building },
  { id: 'employer-rates', label: 'Employer Rates', icon: DollarSign },
  { id: 'notes', label: 'Notes', icon: ClipboardList },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'employee-ledger', label: 'Employee Ledger', icon: Folder },
];
