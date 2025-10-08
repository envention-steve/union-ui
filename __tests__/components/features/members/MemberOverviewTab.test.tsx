import { render, screen, fireEvent } from '@testing-library/react';
import type { MemberFormData } from '@/lib/members/types';
import { MemberOverviewTab } from '@/components/features/members/member-overview';
import {
  MemberDetailProvider,
  type MemberDetailContextValue,
} from '@/components/features/members/member-detail-context';

describe('MemberOverviewTab', () => {
  const baseFormData: MemberFormData = {
    id: 1,
    first_name: 'Jane',
    last_name: 'Doe',
    middle_name: '',
    suffix: '',
    email: '',
    gender: undefined,
    birth_date: '1980-01-01T00:00:00.000Z',
    deceased: false,
    deceased_date: '',
    is_forced_distribution: false,
    unique_id: '12345',
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
  };

  const createContextValue = (
    overrides: Partial<MemberDetailContextValue> = {},
  ): MemberDetailContextValue => ({
    formData: baseFormData,
    isEditMode: false,
    distributionClasses: [],
    memberStatuses: [],
    handleInputChange: jest.fn(),
    addAddress: jest.fn(),
    removeAddress: jest.fn(),
    updateAddress: jest.fn(),
    addPhoneNumber: jest.fn(),
    removePhoneNumber: jest.fn(),
    updatePhoneNumber: jest.fn(),
    addEmailAddress: jest.fn(),
    removeEmailAddress: jest.fn(),
    updateEmailAddress: jest.fn(),
    addDistributionClassCoverage: jest.fn(),
    removeDistributionClassCoverage: jest.fn(),
    updateDistributionClassCoverage: jest.fn(),
    addMemberStatusCoverage: jest.fn(),
    removeMemberStatusCoverage: jest.fn(),
    updateMemberStatusCoverage: jest.fn(),
    ...overrides,
  });

  const renderWithProvider = (value: MemberDetailContextValue) =>
    render(
      <MemberDetailProvider value={value}>
        <MemberOverviewTab />
      </MemberDetailProvider>,
    );

  it('renders member info and coverage sections', () => {
    renderWithProvider(createContextValue());

    expect(screen.getByText('Member Details')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
    expect(screen.getByText('Distribution Class Coverages')).toBeInTheDocument();
    expect(screen.getByText('Member Status Coverages')).toBeInTheDocument();
  });

  it('invokes edit handlers when in edit mode', () => {
    const handleInputChange = jest.fn();

    renderWithProvider(
      createContextValue({
        isEditMode: true,
        handleInputChange,
        formData: {
          ...baseFormData,
          addresses: [{ type: 'Home', street1: '', city: '', state: '', zip: '' }],
          phoneNumbers: [{ type: 'Mobile', number: '', extension: '' }],
          emailAddresses: [{ type: 'Personal', email: '' }],
        },
      }),
    );

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Janet' } });

    expect(handleInputChange).toHaveBeenCalledWith('first_name', 'Janet');
  });
});
