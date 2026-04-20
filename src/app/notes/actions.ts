"use server";

import {
  createServerSupabaseClient,
  SOLO_USER_ID,
} from "@/lib/supabase/server";
import { createNote } from "@/lib/supabase/queries/notes";
import { revalidatePath } from "next/cache";

export async function createQuickCaptureAction(
  formData: FormData,
): Promise<void> {
  const body = (formData.get("body") as string).trim();
  if (!body) return;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const supabase = createServerSupabaseClient();
  await createNote(supabase, SOLO_USER_ID, {
    title: `Capture — ${today}`,
    body,
    tags: ["capture"],
  });
  revalidatePath("/notes");
}

export async function createJournalEntryAction(
  formData: FormData,
): Promise<void> {
  const body = (formData.get("body") as string).trim();
  if (!body) return;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const supabase = createServerSupabaseClient();
  await createNote(supabase, SOLO_USER_ID, {
    title: today,
    body,
    tags: ["journal"],
  });
  revalidatePath("/notes");
}
