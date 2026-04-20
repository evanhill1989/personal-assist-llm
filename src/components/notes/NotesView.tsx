"use client";

import { useState, useTransition, useRef } from "react";
import type { NoteRow } from "@/types/supabase";

type GroupedNotes = { label: string; notes: NoteRow[] }[];

function groupByDate(notes: NoteRow[]): GroupedNotes {
  const map = new Map<string, NoteRow[]>();
  for (const note of notes) {
    const date = new Date(note.created_at);
    const key = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    map.set(key, [...(map.get(key) ?? []), note]);
  }
  return Array.from(map.entries()).map(([label, notes]) => ({ label, notes }));
}

interface Props {
  notes: NoteRow[];
  createCaptureAction: (formData: FormData) => Promise<void>;
  createJournalAction: (formData: FormData) => Promise<void>;
}

export function NotesView({ notes, createCaptureAction }: Props) {
  const grouped = groupByDate(notes);
  const [selectedId, setSelectedId] = useState<string | null>(
    notes[0]?.id ?? null,
  );
  const [isSaving, startSave] = useTransition();
  const captureRef = useRef<HTMLTextAreaElement>(null);

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  return (
    <div className="flex gap-8">
      {/* Sidebar */}
      <div className="w-44 shrink-0 space-y-5">
        {grouped.map(({ label, notes: groupNotes }) => (
          <div key={label}>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-neutral-400">
              {label}
            </p>
            <div className="space-y-0.5">
              {groupNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => setSelectedId(note.id)}
                  className={[
                    "w-full rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                    selectedId === note.id
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800",
                  ].join(" ")}
                >
                  <p className="truncate">{note.title}</p>
                  {note.tags && note.tags.length > 0 && (
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {note.tags[0]}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {notes.length === 0 && (
          <p className="text-xs text-neutral-400">No notes yet.</p>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Quick capture */}
        <form
          action={(formData) => {
            startSave(async () => {
              await createCaptureAction(formData);
              if (captureRef.current) captureRef.current.value = "";
            });
          }}
          className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
        >
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-neutral-400">
            Quick capture
          </p>
          <textarea
            ref={captureRef}
            name="body"
            rows={3}
            placeholder="Dump a thought…"
            className="w-full resize-none bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>

        {/* Selected note */}
        {selectedNote ? (
          <div>
            <p className="mb-3 text-sm font-medium text-neutral-900">
              {selectedNote.title}
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">
              {selectedNote.body}
            </p>
            {selectedNote.tags && selectedNote.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {selectedNote.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Select a note to read it.</p>
        )}
      </div>
    </div>
  );
}
