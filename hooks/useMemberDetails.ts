import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

import { backendApiClient } from '@/lib/api-client';
import {
  buildMemberUpdatePayload,
  transformMemberResponseToFormData,
  type MemberApiResponse,
} from '@/lib/members/transformers';
import type {
  DistributionClass,
  InsurancePlan,
  MemberFormData,
  MemberStatus,
} from '@/lib/members/types';

interface UseMemberDetailsOptions {
  memberId: string;
  isEditMode: boolean;
}

interface UseMemberDetailsResult {
  formData: MemberFormData;
  setFormData: Dispatch<SetStateAction<MemberFormData>>;
  originalData: MemberFormData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
  hasUnsavedChanges: boolean;
  distributionClasses: DistributionClass[];
  memberStatuses: MemberStatus[];
  insurancePlans: InsurancePlan[];
  fetchMember: () => Promise<void>;
  handleSave: () => Promise<boolean>;
  resetFormToOriginal: () => void;
  setError: Dispatch<SetStateAction<string | null>>;
  setSuccess: Dispatch<SetStateAction<string | null>>;
  setSavingState: Dispatch<SetStateAction<boolean>>;
  clearUnsavedChanges: () => void;
}

const createEmptyMemberForm = (): MemberFormData => ({
  id: 0,
  first_name: '',
  last_name: '',
  middle_name: '',
  suffix: '',
  phone: '',
  email: '',
  gender: undefined,
  birth_date: '',
  deceased: false,
  deceased_date: '',
  is_forced_distribution: false,
  force_distribution_class_id: undefined,
  unique_id: '',
  disabled_waiver: false,
  care_of: '',
  include_cms: false,
  addresses: [],
  phoneNumbers: [],
  emailAddresses: [],
  distribution_class_coverages: [],
  member_status_coverages: [],
  life_insurance_coverages: [],
  dependent_coverages: [],
  employer_coverages: [],
  insurance_plan_coverages: [],
  member_notes: [],
  fund_balances: undefined,
});

export function useMemberDetails({
  memberId,
  isEditMode,
}: UseMemberDetailsOptions): UseMemberDetailsResult {
  const [formData, setFormData] = useState<MemberFormData>(() => createEmptyMemberForm());
  const [originalData, setOriginalData] = useState<MemberFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [distributionClasses, setDistributionClasses] = useState<DistributionClass[]>([]);
  const [memberStatuses, setMemberStatuses] = useState<MemberStatus[]>([]);
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>([]);

  const validateCoverages = useCallback((): string | null => {
    const hasInvalidDistributionCoverage = formData.distribution_class_coverages.some(
      (coverage) => !coverage.start_date || !coverage.distribution_class_id,
    );
    if (hasInvalidDistributionCoverage) {
      return 'Please complete all distribution class coverage entries before saving. Each coverage must have a distribution class selected and a start date.';
    }

    const activeDistributionCoverages = formData.distribution_class_coverages.filter(
      (coverage) => coverage.start_date && coverage.distribution_class_id && !coverage.end_date,
    );
    if (activeDistributionCoverages.length > 1) {
      return 'Only one distribution class coverage can be active at a time. Please set an end date for existing active coverages before adding a new one.';
    }

    const hasInvalidMemberStatusCoverage = formData.member_status_coverages.some(
      (coverage) => !coverage.start_date || !coverage.member_status_id,
    );
    if (hasInvalidMemberStatusCoverage) {
      return 'Please complete all member status coverage entries before saving. Each coverage must have a member status selected and a start date.';
    }

    const activeMemberStatusCoverages = formData.member_status_coverages.filter(
      (coverage) => coverage.start_date && coverage.member_status_id && !coverage.end_date,
    );
    if (activeMemberStatusCoverages.length > 1) {
      return 'Only one member status coverage can be active at a time. Please set an end date for existing active coverages before adding a new one.';
    }

    const hasInvalidInsurancePlanCoverage = formData.insurance_plan_coverages.some(
      (coverage) => !coverage.start_date || !coverage.insurance_plan_id,
    );
    if (hasInvalidInsurancePlanCoverage) {
      return 'Please complete all insurance plan coverage entries before saving. Each coverage must have an insurance plan selected and a start date.';
    }

    const activeInsurancePlanCoverages = formData.insurance_plan_coverages.filter(
      (coverage) => coverage.start_date && coverage.insurance_plan_id && !coverage.end_date,
    );
    if (activeInsurancePlanCoverages.length > 1) {
      return 'Only one insurance plan coverage can be active at a time. Please set an end date for existing active coverages before adding a new one.';
    }

    return null;
  }, [formData]);

  const fetchMember = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = (await backendApiClient.members.getDetails!(memberId)) as MemberApiResponse;
      const transformed = transformMemberResponseToFormData(response);

      setFormData(transformed);
      setOriginalData(transformed);
    } catch (err) {
      console.error('Error fetching member:', err);
      setError('Failed to load member data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  const fetchDistributionClasses = useCallback(async () => {
    try {
      const classes = await backendApiClient.distributionClasses.list();
      setDistributionClasses(classes);
    } catch (err) {
      console.error('Error fetching distribution classes:', err);
    }
  }, []);

  const fetchMemberStatuses = useCallback(async () => {
    try {
      const statuses = await backendApiClient.memberStatuses.list();
      setMemberStatuses(statuses);
    } catch (err) {
      console.error('Error fetching member statuses:', err);
    }
  }, []);

  const fetchInsurancePlans = useCallback(async () => {
    try {
      const response = await backendApiClient.insurancePlans.list({ limit: 1000 });
      setInsurancePlans(response.items || []);
    } catch (err) {
      console.error('Error fetching insurance plans:', err);
      setInsurancePlans([]);
    }
  }, []);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  useEffect(() => {
    fetchDistributionClasses();
    fetchMemberStatuses();
    fetchInsurancePlans();
  }, [fetchDistributionClasses, fetchInsurancePlans, fetchMemberStatuses]);

  useEffect(() => {
    if (!originalData || !isEditMode) {
      setHasUnsavedChanges(false);
      return;
    }

    const timeout = setTimeout(() => {
      const hasChanges = JSON.stringify(originalData) !== JSON.stringify(formData);
      setHasUnsavedChanges(hasChanges);
    }, 100);

    return () => clearTimeout(timeout);
  }, [formData, isEditMode, originalData]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (saving) {
      return false;
    }

    const validationError = validateCoverages();
    if (validationError) {
      setError(validationError);
      return false;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = buildMemberUpdatePayload({
        formData,
        originalData,
        memberId,
      });

      await backendApiClient.members.update(memberId, payload);

      await fetchMember();

      setHasUnsavedChanges(false);
      setSuccess('Member data saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err) {
      console.error('Error saving member:', err);
      setError('Failed to save member data. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchMember, formData, memberId, originalData, saving, validateCoverages]);

  const resetFormToOriginal = useCallback(() => {
    if (originalData) {
      setFormData(originalData);
      setHasUnsavedChanges(false);
    }
  }, [originalData]);

  const clearUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  return {
    formData,
    setFormData,
    originalData,
    loading,
    saving,
    error,
    success,
    hasUnsavedChanges,
    distributionClasses,
    memberStatuses,
    insurancePlans,
    fetchMember,
    handleSave,
    resetFormToOriginal,
    setError,
    setSuccess,
    setSavingState: setSaving,
    clearUnsavedChanges,
  };
}
