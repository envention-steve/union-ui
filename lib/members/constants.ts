import {
  User,
  Users,
  Heart,
  FileText,
  Briefcase,
  ClipboardList,
  CircleDollarSign,
  Folder,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type MemberDetailTab = {
  id:
    | 'member'
    | 'dependents'
    | 'health-coverage'
    | 'life-insurance'
    | 'employers'
    | 'notes'
    | 'claims-adjustments'
    | 'annuity-payout'
    | 'fund-ledger';
  label: string;
  icon: LucideIcon;
};

export const MEMBER_DETAIL_TABS: MemberDetailTab[] = [
  { id: 'member', label: 'Member', icon: User },
  { id: 'dependents', label: 'Dependents', icon: Users },
  { id: 'health-coverage', label: 'Health Coverage', icon: Heart },
  { id: 'life-insurance', label: 'Life Insurance', icon: FileText },
  { id: 'employers', label: 'Employers', icon: Briefcase },
  { id: 'notes', label: 'Notes', icon: ClipboardList },
  { id: 'claims-adjustments', label: 'Claims/Adjustments', icon: CircleDollarSign },
  { id: 'annuity-payout', label: 'Annuity Payout', icon: CircleDollarSign },
  { id: 'fund-ledger', label: 'Fund Ledger', icon: Folder },
];
