"use client";

import type { FC } from 'react';

import {
  LedgerEntry as PolymorphicLedgerEntry,
  getLedgerEntryTypeDisplayName,
  isAccountContributionEntry,
  isAdminFeeEntry,
  isAnnuityPayoutEntry,
  isAnnuityUpdateEntry,
  isClaimEntry,
  isInsurancePremiumEntry,
  isManualAdjustmentEntry,
  isMemberContributionEntry,
} from '@/types/ledger-entries';

interface LedgerEntryExpandedDetailsProps {
  entry: PolymorphicLedgerEntry;
}

export const LedgerEntryExpandedDetails: FC<LedgerEntryExpandedDetailsProps> = ({ entry }) => {
  const renderTypeSpecificDetails = () => {
    if (isAdminFeeEntry(entry)) {
      return (
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <span className="font-medium">Insurance Premium ID:</span> {entry.insurance_premium_id || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Insurance Premium Batch ID:</span> {entry.insurance_premium_batch_id || 'N/A'}
          </div>
        </div>
      );
    }

    if (isAnnuityPayoutEntry(entry)) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div>
              <span className="font-medium">Account Number:</span> {entry.account_number}
            </div>
            <div>
              <span className="font-medium">Check Date:</span> {entry.check_date ? new Date(entry.check_date).toLocaleDateString() : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Check Number:</span> {entry.check_number || 'N/A'}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div>
              <span className="font-medium">Tax Rate:</span> {(entry.tax_rate * 100).toFixed(2)}%
            </div>
            <div>
              <span className="font-medium">1099 Code:</span> {entry.code1099}
            </div>
            <div>
              <span className="font-medium">Allow Overdraft:</span> {entry.allow_overdraft ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div>
              <span className="font-medium">Use Member Info:</span> {entry.use_member_info ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-medium">Admin Fee:</span> {entry.admin_fee ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-medium">Admin Fee Amount:</span> ${entry.admin_fee_amount.toFixed(2)}
            </div>
          </div>
          {(entry.tax_override_amount !== null || entry.company_id || entry.annuity_person_id) && (
            <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-2 text-sm md:grid-cols-3">
              {entry.tax_override_amount !== null && (
                <div>
                  <span className="font-medium">Tax Override Amount:</span> ${entry.tax_override_amount.toFixed(2)}
                </div>
              )}
              {entry.company_id && (
                <div>
                  <span className="font-medium">Company ID:</span> {entry.company_id}
                </div>
              )}
              {entry.annuity_person_id && (
                <div>
                  <span className="font-medium">Annuity Person ID:</span> {entry.annuity_person_id}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (isManualAdjustmentEntry(entry)) {
      return (
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <span className="font-medium">Description:</span> {entry.description || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Posted:</span> {entry.posted ? 'Yes' : 'No'}
          </div>
          <div>
            <span className="font-medium">Allow Overdraft:</span> {entry.allow_overdraft ? 'Yes' : 'No'}
          </div>
          <div>
            <span className="font-medium">Created By:</span> {entry.created_by?.name || 'N/A'}
          </div>
        </div>
      );
    }

    if (isClaimEntry(entry)) {
      return (
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <span className="font-medium">Claim Type:</span> {entry.claim_type || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Check Number:</span> {entry.check_number || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Check Date:</span> {entry.check_date ? new Date(entry.check_date).toLocaleDateString() : 'N/A'}
          </div>
          <div>
            <span className="font-medium">Description:</span> {entry.description || 'N/A'}
          </div>
        </div>
      );
    }

    if (isAccountContributionEntry(entry) || isMemberContributionEntry(entry)) {
      return (
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <span className="font-medium">Source:</span> {entry.source || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Batch ID:</span> {entry.batch_id || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Reference:</span> {entry.reference || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Posted:</span> {entry.posted ? 'Yes' : 'No'}
          </div>
        </div>
      );
    }

    if (isInsurancePremiumEntry(entry)) {
      return (
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <span className="font-medium">Premium ID:</span> {entry.insurance_premium_id || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Batch ID:</span> {entry.insurance_premium_batch_id || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Coverage Month:</span> {entry.coverage_month || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Created By:</span> {entry.created_by?.name || 'N/A'}
          </div>
        </div>
      );
    }

    if (isAnnuityUpdateEntry(entry)) {
      return (
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <span className="font-medium">Transaction Type:</span> {getLedgerEntryTypeDisplayName(entry.type)}
          </div>
          <div>
            <span className="font-medium">Reference:</span> {entry.reference || 'N/A'}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <span className="font-medium">Entry ID:</span> {entry.id}
        </div>
        <div>
          <span className="font-medium">Account Type:</span> {entry.account?.type || 'N/A'}
        </div>
        <div>
          <span className="font-medium">Posted Date:</span>{' '}
          {entry.posted_date ? new Date(entry.posted_date).toLocaleDateString() : 'N/A'}
        </div>
      </div>

      <div>
        <span className="font-medium">Amount:</span>{' '}
        <span className={entry.amount < 0 ? 'text-red-600' : 'text-green-600'}>
          ${entry.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      <div>
        <span className="font-medium">Created:</span> {new Date(entry.created_at).toLocaleString()}
      </div>
      <div>
        <span className="font-medium">Updated:</span> {new Date(entry.updated_at).toLocaleString()}
      </div>

      {renderTypeSpecificDetails()}
    </div>
  );
};
