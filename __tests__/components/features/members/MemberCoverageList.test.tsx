import { fireEvent, render, screen } from '@testing-library/react';
import { MemberCoverageList } from '@/components/features/members/member-overview';

describe('MemberCoverageList', () => {
  it('shows empty message when no coverages are provided', () => {
    render(
      <MemberCoverageList
        title="Distribution Class Coverages"
        coverages={[]}
        type="distribution_class"
        isEditMode={false}
      />,
    );

    expect(screen.getByText('No distribution class coverages found')).toBeInTheDocument();
  });

  it('renders add coverage control when edit mode is enabled', () => {
    const onAddCoverage = jest.fn();

    render(
      <MemberCoverageList
        title="Distribution Class Coverages"
        coverages={[]}
        type="distribution_class"
        isEditMode
        onAddCoverage={onAddCoverage}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /add coverage/i }));

    expect(onAddCoverage).toHaveBeenCalledTimes(1);
  });
});
