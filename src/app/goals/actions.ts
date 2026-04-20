"use server";

import {
  createServerSupabaseClient,
  SOLO_USER_ID,
} from "@/lib/supabase/server";
import {
  createGoal,
  updateGoal,
  deleteGoal,
} from "@/lib/supabase/queries/goals";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { GoalStatus } from "@/types/tools";

export async function createGoalAction(formData: FormData): Promise<void> {
  const title = (formData.get("title") as string).trim();
  if (!title) return;

  const supabase = createServerSupabaseClient();
  await createGoal(supabase, SOLO_USER_ID, {
    title,
    status: (formData.get("status") as GoalStatus) || "on_track",
    status_note: (formData.get("status_note") as string) || undefined,
    target_date: (formData.get("target_date") as string) || undefined,
  });
  revalidatePath("/goals");
  redirect("/goals");
}

export async function updateGoalAction(
  goalId: string,
  formData: FormData,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  await updateGoal(supabase, SOLO_USER_ID, {
    goal_id: goalId,
    title: (formData.get("title") as string).trim(),
    status: formData.get("status") as GoalStatus,
    status_note: (formData.get("status_note") as string) || null,
    progress: Number(formData.get("progress")),
    target_date: (formData.get("target_date") as string) || null,
  });
  revalidatePath("/goals");
  revalidatePath(`/goals/${goalId}`);
  redirect("/goals");
}

export async function deleteGoalAction(goalId: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  await deleteGoal(supabase, SOLO_USER_ID, goalId);
  revalidatePath("/goals");
  redirect("/goals");
}
