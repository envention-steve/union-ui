import { renderHook, act } from '@testing-library/react';
import React from 'react';

import { useMemberFormHandlers } from '@/hooks/useMemberFormHandlers';
import type { MemberFormData } from '@/lib/members/types';

const createBaseFormData = (): MemberFormData => ({
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
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
  unique_id: 'UID-1',
  disabled_waiver: false,
  care_of: '',
  include_cms: false,
  created_at: undefined,
  updated_at: undefined,
  addresses: [],
  phoneNumbers: [],
  emailAddresses: [],
  distribution_class_coverages: [],
  member_status_coverages: [],
  life_insurance_coverages: [
    {
      id: 20,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      start_date: '2024-01-01T00:00:00.000Z',
      end_date: undefined,
      member_id: 1,
      beneficiary: '',
      beneficiary_info_received: false,
      life_insurance_person_id: 5,
      life_insurance_person: {
        id: 5,
        first_name: 'Jane',
        last_name: 'Doe',
        middle_name: '',
        suffix: '',
        ssn: undefined,
        birth_date: undefined,
        gender: undefined,
      },
    },
  ],
  dependent_coverages: [],
  employer_coverages: [],
  insurance_plan_coverages: [],
  member_notes: [],
  fund_balances: undefined,
});

describe('useMemberFormHandlers', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  it('adds default address when in edit mode and ignores when view-only', () => {
    const { result, rerender } = renderHook(
      ({ isEditMode }: { isEditMode: boolean }) => {
        const [formData, setFormData] = React.useState(createBaseFormData());
        const handlers = useMemberFormHandlers({ isEditMode, formData, setFormData });
        return { formData, handlers };
      },
      { initialProps: { isEditMode: true } },
    );

    expect(result.current.formData.addresses).toHaveLength(0);

    act(() => {
      result.current.handlers.addAddress();
    });

    expect(result.current.formData.addresses).toHaveLength(1);
    expect(result.current.formData.addresses[0]).toMatchObject({
      type: 'Home',
      street1: '',
      city: '',
    });

    rerender({ isEditMode: false });

    act(() => {
      result.current.handlers.addAddress();
    });

    expect(result.current.formData.addresses).toHaveLength(1);
  });

  it('creates distribution class coverage with ISO start date and updates fields', () => {
    const fixedDate = new Date('2024-05-20T12:34:56Z');
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);

    const { result } = renderHook(() => {
      const [formData, setFormData] = React.useState(createBaseFormData());
      const handlers = useMemberFormHandlers({ isEditMode: true, formData, setFormData });
      return { formData, handlers };
    });

    act(() => {
      result.current.handlers.addDistributionClassCoverage();
    });

    expect(result.current.formData.distribution_class_coverages).toHaveLength(1);
    const coverage = result.current.formData.distribution_class_coverages[0];
    expect(coverage.member_id).toBe(1);
    expect(coverage.start_date).toBe('2024-05-20T00:00:00.000Z');

    act(() => {
      result.current.handlers.updateDistributionClassCoverage(0, 'distribution_class_id', 42);
    });
    expect(result.current.formData.distribution_class_coverages[0].distribution_class_id).toBe(42);

    jest.useRealTimers();
  });

  it('updates nested life insurance person fields', () => {
    const { result } = renderHook(() => {
      const [formData, setFormData] = React.useState(createBaseFormData());
      const handlers = useMemberFormHandlers({ isEditMode: true, formData, setFormData });
      return { formData, handlers };
    });

    act(() => {
      result.current.handlers.updateLifeInsurancePerson(0, 'first_name', 'Janet');
    });

    expect(result.current.formData.life_insurance_coverages[0].life_insurance_person?.first_name).toBe('Janet');
  });

  it('adds and updates notes with edit guard respected', () => {
    const { result, rerender } = renderHook(
      ({ isEditMode }: { isEditMode: boolean }) => {
        const [formData, setFormData] = React.useState(createBaseFormData());
        const handlers = useMemberFormHandlers({ isEditMode, formData, setFormData });
        return { formData, handlers };
      },
      { initialProps: { isEditMode: true } },
    );

    act(() => {
      result.current.handlers.addNote();
    });

    expect(result.current.formData.member_notes).toHaveLength(1);

    act(() => {
      result.current.handlers.updateNote(0, 'message', 'Follow-up required');
    });

    expect(result.current.formData.member_notes[0].message).toBe('Follow-up required');

    rerender({ isEditMode: false });

    act(() => {
      result.current.handlers.removeNote(0);
    });

    expect(result.current.formData.member_notes).toHaveLength(1);
  });
});

