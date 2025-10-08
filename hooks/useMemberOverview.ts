import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type {
  DistributionClassCoverage,
  InsurancePlanCoverage,
  LifeInsuranceCoverage,
  MemberFormData,
  MemberStatusCoverage,
} from '@/lib/members/types';

type MutableValue = string | number | boolean | undefined;

type SetFormData = Dispatch<SetStateAction<MemberFormData>>;

type CoverageUpdater = (index: number, field: string, value: MutableValue) => void;

type LifeInsurancePersonUpdater = (
  index: number,
  field: string,
  value: MutableValue,
) => void;

interface UseMemberOverviewOptions {
  isEditMode: boolean;
  setFormData: SetFormData;
}

export interface MemberOverviewHandlers {
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
  updateDistributionClassCoverage: CoverageUpdater;
  addMemberStatusCoverage: () => void;
  removeMemberStatusCoverage: (index: number) => void;
  updateMemberStatusCoverage: CoverageUpdater;
  addInsurancePlanCoverage: () => void;
  removeInsurancePlanCoverage: (index: number) => void;
  updateInsurancePlanCoverage: CoverageUpdater;
  updateLifeInsurancePerson: LifeInsurancePersonUpdater;
}

export function useMemberOverview({
  isEditMode,
  setFormData,
}: UseMemberOverviewOptions): MemberOverviewHandlers {
  const handleInputChange = useCallback(
    (field: string, value: MutableValue) => {
      if (!isEditMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [isEditMode, setFormData],
  );

  const addAddress = useCallback(() => {
    if (!isEditMode) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        { type: 'Home', street1: '', street2: '', city: '', state: '', zip: '' },
      ],
    }));
  }, [isEditMode, setFormData]);

  const removeAddress = useCallback(
    (index: number) => {
      if (!isEditMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        addresses: prev.addresses.filter((_, i) => i !== index),
      }));
    },
    [isEditMode, setFormData],
  );

  const updateAddress = useCallback(
    (index: number, field: string, value: string) => {
      if (!isEditMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        addresses: prev.addresses.map((addr, i) =>
          i === index ? { ...addr, [field]: value } : addr,
        ),
      }));
    },
    [isEditMode, setFormData],
  );

  const addPhoneNumber = useCallback(() => {
    if (!isEditMode) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      phoneNumbers: [
        ...prev.phoneNumbers,
        { type: 'Mobile', number: '', extension: '' },
      ],
    }));
  }, [isEditMode, setFormData]);

  const removePhoneNumber = useCallback(
    (index: number) => {
      if (!isEditMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        phoneNumbers: prev.phoneNumbers.filter((_, i) => i !== index),
      }));
    },
    [isEditMode, setFormData],
  );

  const updatePhoneNumber = useCallback(
    (index: number, field: string, value: string) => {
      if (!isEditMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        phoneNumbers: prev.phoneNumbers.map((phone, i) =>
          i === index ? { ...phone, [field]: value } : phone,
        ),
      }));
    },
    [isEditMode, setFormData],
  );

  const addEmailAddress = useCallback(() => {
    if (!isEditMode) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      emailAddresses: [
        ...prev.emailAddresses,
        { type: 'Personal', email: '' },
      ],
    }));
  }, [isEditMode, setFormData]);

  const removeEmailAddress = useCallback(
    (index: number) => {
      if (!isEditMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        emailAddresses: prev.emailAddresses.filter((_, i) => i !== index),
      }));
    },
    [isEditMode, setFormData],
  );

  const updateEmailAddress = useCallback(
    (index: number, field: string, value: string) => {
      if (!isEditMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        emailAddresses: prev.emailAddresses.map((email, i) =>
          i === index ? { ...email, [field]: value } : email,
        ),
      }));
    },
    [isEditMode, setFormData],
  );

  const addDistributionClassCoverage = useCallback(() => {
    if (!isEditMode) {
      return;
    }
    const now = new Date();
    const todayDateISO = new Date(
      `${now.toISOString().split('T')[0]}T00:00:00.000Z`,
    ).toISOString();

    setFormData((prev) => {
      const newCoverage: DistributionClassCoverage = {
        id: -Date.now(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        start_date: todayDateISO,
        end_date: undefined,
        member_id: prev.id,
        distribution_class_id: 0,
        distribution_class: undefined,
      };

      return {
        ...prev,
        distribution_class_coverages: [
          ...prev.distribution_class_coverages,
          newCoverage,
        ],
      };
    });
  }, [isEditMode, setFormData]);

  const removeDistributionClassCoverage = useCallback(
    (index: number) => {
      if (!isEditMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        distribution_class_coverages: prev.distribution_class_coverages.filter(
          (_, i) => i !== index,
        ),
      }));
    },
    [isEditMode, setFormData],
  );

  const updateDistributionClassCoverage = useCallback(
    (index: number, field: string, value: MutableValue) => {
      if (!isEditMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        distribution_class_coverages: prev.distribution_class_coverages.map((coverage, i) =>
          i === index ? { ...coverage, [field]: value } : coverage,
        ),
      }));
    },
    [isEditMode, setFormData],
  );

  const addMemberStatusCoverage = useCallback(() => {
    if (!isEditMode) {
      return;
    }
    const previousScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const now = new Date();
    const todayDateISO = new Date(
      `${now.toISOString().split('T')[0]}T00:00:00.000Z`,
    ).toISOString();

    setFormData((prev) => {
      const newCoverage: MemberStatusCoverage = {
        id: -Date.now(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        start_date: todayDateISO,
        end_date: undefined,
        member_id: prev.id,
        member_status_id: 0,
        member_status: undefined,
      };

      return {
        ...prev,
        member_status_coverages: [
          ...prev.member_status_coverages,
          newCoverage,
        ],
      };
    });

    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: previousScrollY,
          behavior: 'instant',
        });
      });
    }
  }, [isEditMode, setFormData]);

  const removeMemberStatusCoverage = useCallback(
    (index: number) => {
      if (!isEditMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        member_status_coverages: prev.member_status_coverages.filter((_, i) => i !== index),
      }));
    },
    [isEditMode, setFormData],
  );

  const updateMemberStatusCoverage = useCallback(
    (index: number, field: string, value: MutableValue) => {
      if (!isEditMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        member_status_coverages: prev.member_status_coverages.map((coverage, i) =>
          i === index ? { ...coverage, [field]: value } : coverage,
        ),
      }));
    },
    [isEditMode, setFormData],
  );

  const addInsurancePlanCoverage = useCallback(() => {
    if (!isEditMode) {
      return;
    }
    const now = new Date();
    const todayDateISO = new Date(
      `${now.toISOString().split('T')[0]}T00:00:00.000Z`,
    ).toISOString();

    setFormData((prev) => {
      const newCoverage: InsurancePlanCoverage = {
        id: -Date.now(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        start_date: todayDateISO,
        end_date: undefined,
        member_id: prev.id,
        insurance_plan_id: 0,
        policy_number: '',
        insurance_plan: undefined,
      };

      return {
        ...prev,
        insurance_plan_coverages: [
          ...prev.insurance_plan_coverages,
          newCoverage,
        ],
      };
    });
  }, [isEditMode, setFormData]);

  const removeInsurancePlanCoverage = useCallback(
    (index: number) => {
      if (!isEditMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        insurance_plan_coverages: prev.insurance_plan_coverages.filter((_, i) => i !== index),
      }));
    },
    [isEditMode, setFormData],
  );

  const updateInsurancePlanCoverage = useCallback(
    (index: number, field: string, value: MutableValue) => {
      if (!isEditMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        insurance_plan_coverages: prev.insurance_plan_coverages.map((coverage, i) =>
          i === index ? { ...coverage, [field]: value } : coverage,
        ),
      }));
    },
    [isEditMode, setFormData],
  );

  const updateLifeInsurancePerson = useCallback<LifeInsurancePersonUpdater>(
    (index, field, value) => {
      if (!isEditMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        life_insurance_coverages: prev.life_insurance_coverages.map((coverage, i) =>
          i === index
            ? {
                ...coverage,
                life_insurance_person: {
                  ...(coverage.life_insurance_person || {}),
                  [field]: value,
                },
              }
            : coverage,
        ),
      }));
    },
    [isEditMode, setFormData],
  );

  return {
    handleInputChange,
    addAddress,
    removeAddress,
    updateAddress,
    addPhoneNumber,
    removePhoneNumber,
    updatePhoneNumber,
    addEmailAddress,
    removeEmailAddress,
    updateEmailAddress,
    addDistributionClassCoverage,
    removeDistributionClassCoverage,
    updateDistributionClassCoverage,
    addMemberStatusCoverage,
    removeMemberStatusCoverage,
    updateMemberStatusCoverage,
    addInsurancePlanCoverage,
    removeInsurancePlanCoverage,
    updateInsurancePlanCoverage,
    updateLifeInsurancePerson,
  };
}
