import {
  createServerSupabaseClient,
  SOLO_USER_ID,
} from "@/lib/supabase/server";
import { searchNotes } from "@/lib/supabase/queries/notes";
import { NotesView } from "@/components/notes/NotesView";
import { createQuickCaptureAction, createJournalEntryAction } from "./actions";

export default async function NotesPage() {
  const supabase = createServerSupabaseClient();
  const notes = await searchNotes(supabase, SOLO_USER_ID, { limit: 50 });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <NotesView
        notes={notes}
        createCaptureAction={createQuickCaptureAction}
        createJournalAction={createJournalEntryAction}
      />
    </div>
  );
}
