import { renderHook, act, waitFor } from '@testing-library/react';

import { useMemberDetails } from '@/hooks/useMemberDetails';
import type {
  DistributionClass,
  InsurancePlan,
  MemberFormData,
  MemberStatus,
} from '@/lib/members/types';

type MockBackendApiClient = {
  members: {
    getDetails: jest.Mock;
    update: jest.Mock;
  };
  distributionClasses: {
    list: jest.Mock;
  };
  memberStatuses: {
    list: jest.Mock;
  };
  insurancePlans: {
    list: jest.Mock;
  };
};

jest.mock('@/lib/api-client', () => ({
  backendApiClient: {
    members: {
      getDetails: jest.fn(),
      update: jest.fn(),
    },
    distributionClasses: {
      list: jest.fn(),
    },
    memberStatuses: {
      list: jest.fn(),
    },
    insurancePlans: {
      list: jest.fn(),
    },
  },
}));

const { backendApiClient: mockBackendApiClient } = jest.requireMock('@/lib/api-client') as {
  backendApiClient: MockBackendApiClient;
};

jest.mock('@/lib/members/transformers', () => ({
  transformMemberResponseToFormData: jest.fn(),
  buildMemberUpdatePayload: jest.fn(),
}));

const {
  transformMemberResponseToFormData: mockTransformMemberResponseToFormData,
  buildMemberUpdatePayload: mockBuildMemberUpdatePayload,
} = jest.requireMock('@/lib/members/transformers') as {
  transformMemberResponseToFormData: jest.Mock;
  buildMemberUpdatePayload: jest.Mock;
};

describe('useMemberDetails', () => {
  const memberId = '123';
  const mockApiResponse = { id: 1 } as const;

  const createMemberFormData = (): MemberFormData => ({
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    middle_name: '',
    suffix: '',
    phone: '555-555-5555',
    email: 'john@example.com',
    gender: 'MALE',
    birth_date: '1980-01-01',
    deceased: false,
    deceased_date: '',
    is_forced_distribution: false,
    force_distribution_class_id: undefined,
    unique_id: 'UID-123',
    disabled_waiver: false,
    care_of: '',
    include_cms: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    addresses: [],
    phoneNumbers: [],
    emailAddresses: [],
    distribution_class_coverages: [
      {
        id: 10,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        start_date: '2023-01-01',
        end_date: undefined,
        member_id: 1,
        distribution_class_id: 10,
      },
    ],
    member_status_coverages: [
      {
        id: 11,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        start_date: '2023-01-01',
        end_date: undefined,
        member_id: 1,
        member_status_id: 5,
      },
    ],
    life_insurance_coverages: [],
    dependent_coverages: [],
    employer_coverages: [],
    insurance_plan_coverages: [
      {
        id: 12,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        start_date: '2023-01-01',
        end_date: undefined,
        member_id: 1,
        insurance_plan_id: 20,
        policy_number: 'POL-123',
      },
    ],
    member_notes: [],
    fund_balances: undefined,
  });

  const distributionClasses: DistributionClass[] = [
    {
      id: 10,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      name: 'Class A',
      description: 'Primary distribution class',
    },
  ];

  const memberStatuses: MemberStatus[] = [
    {
      id: 5,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      name: 'Active',
      admin_fee: '0.00',
    },
  ];

  const insurancePlans: InsurancePlan[] = [
    {
      id: 20,
      name: 'Plan A',
      code: 'PLAN-A',
      type: 'HEALTH',
      group: 'A',
      include_cms: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockBackendApiClient.members.getDetails.mockReset();
    mockBackendApiClient.members.update.mockReset();
    mockBackendApiClient.distributionClasses.list.mockReset();
    mockBackendApiClient.memberStatuses.list.mockReset();
    mockBackendApiClient.insurancePlans.list.mockReset();

    mockBackendApiClient.members.getDetails.mockResolvedValue(mockApiResponse);
    mockBackendApiClient.members.update.mockResolvedValue(undefined);
    mockBackendApiClient.distributionClasses.list.mockResolvedValue(distributionClasses);
    mockBackendApiClient.memberStatuses.list.mockResolvedValue(memberStatuses);
    mockBackendApiClient.insurancePlans.list.mockResolvedValue({ items: insurancePlans });

    mockTransformMemberResponseToFormData.mockImplementation(() => createMemberFormData());
    mockBuildMemberUpdatePayload.mockImplementation(({ formData }) => ({ ...formData }));
  });

  it('loads member data and supporting metadata', async () => {
    const { result } = renderHook(() =>
      useMemberDetails({
        memberId,
        isEditMode: true,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockBackendApiClient.members.getDetails).toHaveBeenCalledWith(memberId);
    expect(mockTransformMemberResponseToFormData).toHaveBeenCalledWith(mockApiResponse);
    expect(result.current.formData.first_name).toBe('John');
    expect(result.current.originalData?.first_name).toBe('John');
    expect(result.current.distributionClasses).toEqual(distributionClasses);
    expect(result.current.memberStatuses).toEqual(memberStatuses);
    expect(result.current.insurancePlans).toEqual(insurancePlans);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('saves updates and refreshes member data', async () => {
    const { result } = renderHook(() =>
      useMemberDetails({
        memberId,
        isEditMode: true,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const saved = await result.current.handleSave();
      expect(saved).toBe(true);
    });

    expect(mockBuildMemberUpdatePayload).toHaveBeenCalledWith(
      expect.objectContaining({
        formData: expect.objectContaining({ id: 1 }),
        originalData: expect.objectContaining({ id: 1 }),
        memberId,
      }),
    );
    expect(mockBackendApiClient.members.update).toHaveBeenCalledWith(
      memberId,
      expect.any(Object),
    );
    expect(mockBackendApiClient.members.getDetails).toHaveBeenCalledTimes(2);
    expect(result.current.success).toBe('Member data saved successfully!');
    expect(result.current.error).toBeNull();
  });

  it('prevents saving when coverage validation fails', async () => {
    const { result } = renderHook(() =>
      useMemberDetails({
        memberId,
        isEditMode: true,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setFormData((prev) => ({
        ...prev,
        distribution_class_coverages: [
          {
            ...prev.distribution_class_coverages[0],
            start_date: '',
          },
        ],
      }));
    });

    await act(async () => {
      const saved = await result.current.handleSave();
      expect(saved).toBe(false);
    });

    expect(result.current.error).toBe(
      'Please complete all distribution class coverage entries before saving. Each coverage must have a distribution class selected and a start date.',
    );
    expect(mockBackendApiClient.members.update).not.toHaveBeenCalled();
  });
});
