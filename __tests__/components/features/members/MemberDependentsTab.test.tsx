import { fireEvent, render, screen } from '@testing-library/react';

import { MemberDependentsTab } from '@/components/features/members/member-overview';
import type { DependentCoverage } from '@/lib/members/types';

const baseCoverage: DependentCoverage = {
  id: 1,
  member_id: 1,
  dependent_id: 1,
  start_date: '2024-01-01T00:00:00.000Z',
  dependent: {
    first_name: 'Sam',
    last_name: 'Example',
    dependent_type: 'DEPENDENT',
    include_cms: false,
  },
};

describe('MemberDependentsTab', () => {
  it('shows empty state when no dependents exist', () => {
    render(
      <MemberDependentsTab
        dependentCoverages={[]}
        isEditMode={false}
        onAddDependent={jest.fn()}
        onRemoveDependent={jest.fn()}
        onUpdateDependent={jest.fn()}
        onUpdateDependentCoverage={jest.fn()}
      />,
    );

    expect(screen.getByText('No dependents found')).toBeInTheDocument();
  });

  it('calls update handler when editing a dependent', () => {
    const onUpdateDependent = jest.fn();

    render(
      <MemberDependentsTab
        dependentCoverages={[baseCoverage]}
        isEditMode
        onAddDependent={jest.fn()}
        onRemoveDependent={jest.fn()}
        onUpdateDependent={onUpdateDependent}
        onUpdateDependentCoverage={jest.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Samuel' } });

    expect(onUpdateDependent).toHaveBeenCalledWith(0, 'first_name', 'Samuel');
  });

  it('invokes add dependent when the button is clicked', () => {
    const onAdd = jest.fn();

    render(
      <MemberDependentsTab
        dependentCoverages={[]}
        isEditMode
        onAddDependent={onAdd}
        onRemoveDependent={jest.fn()}
        onUpdateDependent={jest.fn()}
        onUpdateDependentCoverage={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /add dependent/i }));

    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
