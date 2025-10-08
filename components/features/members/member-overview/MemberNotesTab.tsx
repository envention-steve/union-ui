"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { MemberNote } from '@/lib/members/types';
import { Plus, Trash2 } from 'lucide-react';

type MutableValue = string | number | boolean | undefined;

interface MemberNotesTabProps {
  notes: MemberNote[];
  isEditMode: boolean;
  onAddNote: () => void;
  onRemoveNote: (index: number) => void;
  onUpdateNote: (index: number, field: string, value: MutableValue) => void;
}

export function MemberNotesTab({
  notes,
  isEditMode,
  onAddNote,
  onRemoveNote,
  onUpdateNote,
}: MemberNotesTabProps) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Notes</CardTitle>
          {isEditMode ? (
            <Button
              onClick={onAddNote}
              size="sm"
              className="bg-union-600 text-white hover:bg-union-700"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Note
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {notes.length === 0 ? (
            <p className="text-sm text-gray-500">No notes found</p>
          ) : (
            notes.map((note, index) => (
              <div key={note.id ?? index} className="space-y-4 rounded-lg border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900">Note #{index + 1}</h3>
                      {note.created_at ? (
                        <span className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleString()}
                        </span>
                      ) : null}
                    </div>

                    <label
                      htmlFor={`note-message-${index}`}
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Message
                    </label>
                    <Textarea
                      id={`note-message-${index}`}
                      value={note.message}
                      onChange={(event) => onUpdateNote(index, 'message', event.target.value)}
                      disabled={!isEditMode}
                      rows={4}
                      className="resize-vertical"
                    />
                  </div>

                  {isEditMode ? (
                    <Button
                      onClick={() => onRemoveNote(index)}
                      variant="ghost"
                      size="sm"
                      className="ml-4 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
