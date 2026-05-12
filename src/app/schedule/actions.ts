"use server";

import {
  createServerSupabaseClient,
  SOLO_USER_ID,
} from "@/lib/supabase/server";
import {
  createScheduleBlock,
  addTaskToBlock,
  removeTaskFromBlock,
  deleteScheduleBlock,
} from "@/lib/supabase/queries/schedule";
import { revalidatePath } from "next/cache";

export async function createSingleBlockAction(
  date: string,
  startTime: string,
  endTime: string,
  taskId: string,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  const block = await createScheduleBlock(supabase, SOLO_USER_ID, {
    date,
    start_time: startTime,
    end_time: endTime,
    type: "single",
  });
  await addTaskToBlock(supabase, block.id, taskId);
  revalidatePath("/schedule");
}

export async function createPomodoroBlockAction(
  date: string,
  startTime: string,
  endTime: string,
  label: string,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  await createScheduleBlock(supabase, SOLO_USER_ID, {
    date,
    start_time: startTime,
    end_time: endTime,
    type: "pomodoro",
    label: label || undefined,
  });
  revalidatePath("/schedule");
}

export async function addTaskToBlockAction(
  blockId: string,
  taskId: string,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  await addTaskToBlock(supabase, blockId, taskId);
  revalidatePath("/schedule");
}

export async function removeTaskFromBlockAction(
  blockId: string,
  taskId: string,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  await removeTaskFromBlock(supabase, blockId, taskId);
  revalidatePath("/schedule");
}

export async function deleteBlockAction(blockId: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  await deleteScheduleBlock(supabase, SOLO_USER_ID, blockId);
  revalidatePath("/schedule");
}
