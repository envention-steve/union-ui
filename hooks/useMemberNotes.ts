import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type { MemberFormData, MemberNote } from '@/lib/members/types';

type MutableValue = string | number | boolean | undefined;

type SetFormData = Dispatch<SetStateAction<MemberFormData>>;

interface UseMemberNotesOptions {
  formData: MemberFormData;
  setFormData: SetFormData;
}

interface MemberNotesHandlers {
  addNote: () => void;
  removeNote: (index: number) => void;
  updateNote: (index: number, field: string, value: MutableValue) => void;
}

export function useMemberNotes({ formData, setFormData }: UseMemberNotesOptions): MemberNotesHandlers {
  const addNote = useCallback(() => {
    const now = new Date();
    const newNote: MemberNote = {
      id: -Date.now(),
      member_id: formData.id,
      message: '',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    setFormData((prev) => ({
      ...prev,
      member_notes: [...prev.member_notes, newNote],
    }));
  }, [formData.id, setFormData]);

  const removeNote = useCallback(
    (index: number) => {
      setFormData((prev) => ({
        ...prev,
        member_notes: prev.member_notes.filter((_, i) => i !== index),
      }));
    },
    [setFormData],
  );

  const updateNote = useCallback(
    (index: number, field: string, value: MutableValue) => {
      setFormData((prev) => ({
        ...prev,
        member_notes: prev.member_notes.map((note, i) => (
          i === index ? { ...note, [field]: value } : note
        )),
      }));
    },
    [setFormData],
  );

  return {
    addNote,
    removeNote,
    updateNote,
  };
}
