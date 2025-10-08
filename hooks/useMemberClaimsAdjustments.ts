import { useCallback, useEffect, useMemo, useState } from 'react';

import { backendApiClient } from '@/lib/api-client';
import type { FundBalance } from '@/lib/members/types';
import type { MutableValue, ClaimTypeOption } from '@/components/features/members/member-detail-context';

export interface ClaimFormState {
  account_id: string | number;
  claim_type: string;
  description: string;
  check_number: string;
  check_date: string;
  amount: string;
  posted_date: string;
  allow_overdraft: boolean;
}

export interface AdjustmentFormState {
  account_id: string | number;
  amount: string;
  description: string;
  posted_date: string;
  allow_overdraft: boolean;
}

interface UseMemberClaimsAdjustmentsOptions {
  memberId: string;
  fundBalances?: FundBalance;
  onSuccess: (message: string | null) => void;
  onError: (message: string | null) => void;
  fetchMember: () => Promise<void>;
  refreshLedger?: () => Promise<void>;
}

interface HandleOptions {
  shouldRefreshLedger?: boolean;
}

interface MemberClaimsAdjustmentsHook {
  claimTypes: ClaimTypeOption[];
  claimForm: ClaimFormState;
  updateClaimFormField: (field: keyof ClaimFormState, value: MutableValue) => void;
  creatingClaim: boolean;
  handleCreateClaim: (options?: HandleOptions) => Promise<void>;
  adjustmentForm: AdjustmentFormState;
  updateAdjustmentFormField: (field: keyof AdjustmentFormState, value: MutableValue) => void;
  creatingAdjustment: boolean;
  handleCreateAdjustment: (options?: HandleOptions) => Promise<void>;
}

const createInitialClaimForm = (): ClaimFormState => ({
  account_id: '',
  claim_type: '',
  description: '',
  check_number: '',
  check_date: '',
  amount: '',
  posted_date: new Date().toISOString().split('T')[0],
  allow_overdraft: false,
});

const createInitialAdjustmentForm = (): AdjustmentFormState => ({
  account_id: '',
  amount: '',
  description: '',
  posted_date: new Date().toISOString().split('T')[0],
  allow_overdraft: false,
});

export function useMemberClaimsAdjustments({
  memberId,
  fundBalances,
  onSuccess,
  onError,
  fetchMember,
  refreshLedger,
}: UseMemberClaimsAdjustmentsOptions): MemberClaimsAdjustmentsHook {
  const [claimTypes, setClaimTypes] = useState<ClaimTypeOption[]>([]);
  const [creatingClaim, setCreatingClaim] = useState(false);
  const [creatingAdjustment, setCreatingAdjustment] = useState(false);
  const [claimForm, setClaimForm] = useState<ClaimFormState>(() => createInitialClaimForm());
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentFormState>(() => createInitialAdjustmentForm());

  const fetchClaimTypes = useCallback(async () => {
    try {
      const types = await backendApiClient.claimTypes.list();
      if (Array.isArray(types)) {
        setClaimTypes(types.map((type) => ({ value: type, label: type })));
      } else {
        setClaimTypes([]);
      }
    } catch (error) {
      console.error('Error fetching claim types:', error);
      setClaimTypes([]);
    }
  }, []);

  useEffect(() => {
    fetchClaimTypes();
  }, [fetchClaimTypes]);

  const updateClaimFormField = useCallback(
    (field: keyof ClaimFormState, value: MutableValue) => {
      setClaimForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const updateAdjustmentFormField = useCallback(
    (field: keyof AdjustmentFormState, value: MutableValue) => {
      setAdjustmentForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handleCreateClaim = useCallback(
    async ({ shouldRefreshLedger }: HandleOptions = {}) => {
      if (!claimForm.claim_type || !claimForm.amount) {
        onError('Please fill in all required fields: Claim Type and Amount.');
        return;
      }

      const healthAccountId = fundBalances?.health_account_id;
      if (!healthAccountId) {
        onError('Unable to create claim: Health account not found for this member.');
        return;
      }

      try {
        setCreatingClaim(true);
        onError(null);

        const claimData = {
          account_id: healthAccountId,
          member_id: parseInt(memberId, 10),
          posted: false,
          suspended: false,
          amount: parseFloat(claimForm.amount),
          posted_date: claimForm.posted_date,
          description: claimForm.description || '',
          check_date: claimForm.check_date || null,
          check_number: claimForm.check_number || null,
          allow_overdraft: claimForm.allow_overdraft,
          claim_type: claimForm.claim_type,
        };

        await backendApiClient.claims.create(claimData);

        setClaimForm(createInitialClaimForm());
        onSuccess('Claim created successfully! Refreshing data...');
        await fetchMember();

        if (shouldRefreshLedger && refreshLedger) {
          await refreshLedger();
        }

        onSuccess('Claim created and data refreshed!');
        setTimeout(() => onSuccess(null), 3000);
      } catch (error) {
        console.error('Error creating claim:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        onError(`Failed to create claim: ${message}`);
      } finally {
        setCreatingClaim(false);
      }
    },
    [
      claimForm,
      fundBalances?.health_account_id,
      memberId,
      onError,
      onSuccess,
      fetchMember,
      refreshLedger,
    ],
  );

  const handleCreateAdjustment = useCallback(
    async ({ shouldRefreshLedger }: HandleOptions = {}) => {
      if (!adjustmentForm.account_id || !adjustmentForm.amount) {
        onError('Please fill in required fields: Account and Adjustment Amount');
        return;
      }

      try {
        setCreatingAdjustment(true);
        onError(null);

        const adjustmentData = {
          account_id: parseInt(String(adjustmentForm.account_id), 10),
          member_id: parseInt(memberId, 10),
          posted: false,
          suspended: false,
          amount: parseFloat(adjustmentForm.amount),
          posted_date: adjustmentForm.posted_date,
          description: adjustmentForm.description || '',
          allow_overdraft: adjustmentForm.allow_overdraft,
        };

        await backendApiClient.manualAdjustments.create(adjustmentData);

        onSuccess('Manual adjustment created successfully! Refreshing data...');
        await fetchMember();

        setAdjustmentForm(createInitialAdjustmentForm());

        if (shouldRefreshLedger && refreshLedger) {
          await refreshLedger();
        }

        onSuccess('Manual adjustment created and data refreshed!');
        setTimeout(() => onSuccess(null), 3000);
      } catch (error) {
        console.error('Error creating manual adjustment:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        onError(`Failed to create manual adjustment: ${message}`);
      } finally {
        setCreatingAdjustment(false);
      }
    },
    [
      adjustmentForm,
      memberId,
      onError,
      onSuccess,
      fetchMember,
      refreshLedger,
    ],
  );

  return useMemo(
    () => ({
      claimTypes,
      claimForm,
      updateClaimFormField,
      creatingClaim,
      handleCreateClaim,
      adjustmentForm,
      updateAdjustmentFormField,
      creatingAdjustment,
      handleCreateAdjustment,
    }),
    [
      claimTypes,
      claimForm,
      updateClaimFormField,
      creatingClaim,
      handleCreateClaim,
      adjustmentForm,
      updateAdjustmentFormField,
      creatingAdjustment,
      handleCreateAdjustment,
    ],
  );
}
