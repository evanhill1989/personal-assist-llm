import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScheduleBlockRow } from "@/types/supabase";

export interface ScheduleBlockWithTasks extends ScheduleBlockRow {
  task_ids: string[];
}

export async function getDaySchedule(
  supabase: SupabaseClient,
  userId: string,
  date: string,
): Promise<ScheduleBlockWithTasks[]> {
  const { data, error } = await supabase
    .from("schedule_blocks")
    .select("*, schedule_block_tasks(task_id)")
    .eq("user_id", userId)
    .eq("date", date)
    .order("start_time", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((block) => ({
    ...block,
    task_ids: (block.schedule_block_tasks as { task_id: string }[]).map(
      (r) => r.task_id,
    ),
    schedule_block_tasks: undefined,
  }));
}

export async function createScheduleBlock(
  supabase: SupabaseClient,
  userId: string,
  input: {
    date: string;
    start_time: string;
    end_time: string;
    type: "single" | "pomodoro";
    label?: string;
  },
): Promise<ScheduleBlockRow> {
  const { data, error } = await supabase
    .from("schedule_blocks")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function addTaskToBlock(
  supabase: SupabaseClient,
  blockId: string,
  taskId: string,
): Promise<void> {
  const { error } = await supabase
    .from("schedule_block_tasks")
    .insert({ block_id: blockId, task_id: taskId });
  if (error) throw new Error(error.message);
}

export async function removeTaskFromBlock(
  supabase: SupabaseClient,
  blockId: string,
  taskId: string,
): Promise<void> {
  const { error } = await supabase
    .from("schedule_block_tasks")
    .delete()
    .eq("block_id", blockId)
    .eq("task_id", taskId);
  if (error) throw new Error(error.message);
}

export async function deleteScheduleBlock(
  supabase: SupabaseClient,
  userId: string,
  blockId: string,
): Promise<void> {
  const { error } = await supabase
    .from("schedule_blocks")
    .delete()
    .eq("id", blockId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
