import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateGoalInput,
  ListGoalsInput,
  UpdateGoalInput,
} from "@/types/tools";
import type { GoalRow } from "@/types/supabase";

export async function createGoal(
  supabase: SupabaseClient,
  userId: string,
  input: CreateGoalInput,
): Promise<GoalRow> {
  const { data, error } = await supabase
    .from("goals")
    .insert({
      ...input,
      user_id: userId,
      status: input.status ?? "on_track",
      progress: input.progress ?? 0,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listGoals(
  supabase: SupabaseClient,
  userId: string,
  input: ListGoalsInput,
): Promise<GoalRow[]> {
  let query = supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (input.status) query = query.eq("status", input.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getGoalById(
  supabase: SupabaseClient,
  userId: string,
  goalId: string,
): Promise<GoalRow | null> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("id", goalId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateGoal(
  supabase: SupabaseClient,
  userId: string,
  input: UpdateGoalInput,
): Promise<GoalRow> {
  const { goal_id, ...fields } = input;
  const { data, error } = await supabase
    .from("goals")
    .update(fields)
    .eq("id", goal_id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Goal ${goal_id} not found`);
  return data;
}

export async function deleteGoal(
  supabase: SupabaseClient,
  userId: string,
  goalId: string,
): Promise<{ id: string; title: string }> {
  const { data, error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId)
    .select("id, title")
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Goal ${goalId} not found`);
  return data;
}
