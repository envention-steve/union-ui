import { fireEvent, render, screen } from '@testing-library/react';

import { MemberNotesTab } from '@/components/features/members/member-overview';
import type { MemberNote } from '@/lib/members/types';

const sampleNote: MemberNote = {
  id: 1,
  member_id: 1,
  message: 'Initial note',
};

describe('MemberNotesTab', () => {
  it('renders empty state when no notes present', () => {
    render(
      <MemberNotesTab
        notes={[]}
        isEditMode={false}
        onAddNote={jest.fn()}
        onRemoveNote={jest.fn()}
        onUpdateNote={jest.fn()}
      />,
    );

    expect(screen.getByText('No notes found')).toBeInTheDocument();
  });

  it('responds to add and update actions in edit mode', () => {
    const onAddNote = jest.fn();
    const onUpdateNote = jest.fn();

    render(
      <MemberNotesTab
        notes={[sampleNote]}
        isEditMode
        onAddNote={onAddNote}
        onRemoveNote={jest.fn()}
        onUpdateNote={onUpdateNote}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /add note/i }));
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Updated note' } });

    expect(onAddNote).toHaveBeenCalledTimes(1);
    expect(onUpdateNote).toHaveBeenCalledWith(0, 'message', 'Updated note');
  });
});
