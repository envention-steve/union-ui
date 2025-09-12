// Account interface matching the existing structure in the member page
export interface Account {
  id: number;
  type: 'HEALTH' | 'ANNUITY';
}

// Base LedgerEntry interface
export interface BaseLedgerEntry {
  id: number;
  account_id: number;
  member_id: number;
  posted: boolean;
  suspended: boolean;
  amount: number;
  posted_date: string;
  created_at: string;
  updated_at: string;
  account?: Account;
}

// Admin Fee type
export interface AdminFeeLedgerEntry extends BaseLedgerEntry {
  type: 'admin_fee';
  insurance_premium_id: number | null;
  insurance_premium_batch_id: number | null;
}

// Annuity Payout type
export interface AnnuityPayoutLedgerEntry extends BaseLedgerEntry {
  type: 'annuity_payout';
  account_number: string;
  check_date: string;
  check_number: string | null;
  tax_rate: number;
  allow_overdraft: boolean;
  code1099: string;
  use_member_info: boolean;
  admin_fee: boolean;
  admin_fee_amount: number;
  tax_override_amount: number | null;
  company_id: number | null;
  annuity_person_id: number | null;
}

// Manual Adjustment type
export interface ManualAdjustmentLedgerEntry extends BaseLedgerEntry {
  type: 'manual_adjustment';
  description: string | null;
  allow_overdraft: boolean;
}

// Claim type
export interface ClaimLedgerEntry extends BaseLedgerEntry {
  type: 'claim';
  description: string | null;
  check_date: string | null;
  check_number: string | null;
  allow_overdraft: boolean;
  claim_type: string;
}

// Account Contribution type
export interface AccountContributionLedgerEntry extends BaseLedgerEntry {
  type: 'account_contribution';
  description: string | null;
  account_contribution_batch_id: number | null;
}

// Member Contribution type
export interface MemberContributionLedgerEntry extends BaseLedgerEntry {
  type: 'member_contribution';
  employer_contribution_id: number | null;
}

// Insurance Premium type
export interface InsurancePremiumLedgerEntry extends BaseLedgerEntry {
  type: 'insurance_premium';
  insurance_premium_batch_id: number | null;
}

// Annuity Update type
export interface AnnuityUpdateLedgerEntry extends BaseLedgerEntry {
  type: 'annuity_update';
  year_end_balance: number | null;
  annuity_interest_id: number | null;
}

// Base type (fallback)
export interface GenericLedgerEntry extends BaseLedgerEntry {
  type: 'ledger_entries';
}

// Polymorphic type - union of all possible types
export type LedgerEntry = 
  | AdminFeeLedgerEntry
  | AnnuityPayoutLedgerEntry
  | ManualAdjustmentLedgerEntry
  | ClaimLedgerEntry
  | AccountContributionLedgerEntry
  | MemberContributionLedgerEntry
  | InsurancePremiumLedgerEntry
  | AnnuityUpdateLedgerEntry
  | GenericLedgerEntry;

// Type guard functions
export const isAdminFeeEntry = (entry: LedgerEntry): entry is AdminFeeLedgerEntry => 
  entry.type === 'admin_fee';

export const isAnnuityPayoutEntry = (entry: LedgerEntry): entry is AnnuityPayoutLedgerEntry => 
  entry.type === 'annuity_payout';

export const isManualAdjustmentEntry = (entry: LedgerEntry): entry is ManualAdjustmentLedgerEntry => 
  entry.type === 'manual_adjustment';

export const isClaimEntry = (entry: LedgerEntry): entry is ClaimLedgerEntry => 
  entry.type === 'claim';

export const isAccountContributionEntry = (entry: LedgerEntry): entry is AccountContributionLedgerEntry => 
  entry.type === 'account_contribution';

export const isMemberContributionEntry = (entry: LedgerEntry): entry is MemberContributionLedgerEntry => 
  entry.type === 'member_contribution';

export const isInsurancePremiumEntry = (entry: LedgerEntry): entry is InsurancePremiumLedgerEntry => 
  entry.type === 'insurance_premium';

export const isAnnuityUpdateEntry = (entry: LedgerEntry): entry is AnnuityUpdateLedgerEntry => 
  entry.type === 'annuity_update';

// Helper function to get type display name
export const getLedgerEntryTypeDisplayName = (type: string): string => {
  switch (type) {
    case 'admin_fee':
      return 'Admin Fee';
    case 'annuity_payout':
      return 'Annuity Payout';
    case 'manual_adjustment':
      return 'Manual Adjustment';
    case 'claim':
      return 'Claim';
    case 'account_contribution':
      return 'Account Contribution';
    case 'member_contribution':
      return 'Member Contribution';
    case 'insurance_premium':
      return 'Insurance Premium';
    case 'annuity_update':
      return 'Annuity Update';
    case 'ledger_entries':
      return 'Ledger Entry';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  }
};