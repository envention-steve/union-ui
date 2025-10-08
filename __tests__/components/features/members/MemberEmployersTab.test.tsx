import { fireEvent, render, screen } from '@testing-library/react';

import { MemberEmployersTab } from '@/components/features/members/member-overview';
import type { EmployerCoverage } from '@/lib/members/types';

describe('MemberEmployersTab', () => {
  it('renders empty state when no employer coverage exists', () => {
    render(
      <MemberEmployersTab
        employerCoverages={[]}
        isEditMode={false}
        onAddEmployer={jest.fn()}
        onRemoveEmployer={jest.fn()}
      />,
    );

    expect(screen.getByText('No employers found')).toBeInTheDocument();
  });

  it('invokes add employer handler', () => {
    const onAdd = jest.fn();

    render(
      <MemberEmployersTab
        employerCoverages={[]}
        isEditMode
        onAddEmployer={onAdd}
        onRemoveEmployer={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /add employer/i }));

    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('shows employer name and remove button when coverage exists', () => {
    const employerCoverage: EmployerCoverage = {
      start_date: '2021-01-01T00:00:00.000Z',
      member_id: 1,
      employer_id: 1,
      employer: { name: 'Acme Corp', include_cms: false, is_forced_distribution: false },
    };

    const onRemove = jest.fn();

    render(
      <MemberEmployersTab
        employerCoverages={[employerCoverage]}
        isEditMode
        onAddEmployer={jest.fn()}
        onRemoveEmployer={onRemove}
      />,
    );

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button')[1]);

    expect(onRemove).toHaveBeenCalledWith(0);
  });
});
