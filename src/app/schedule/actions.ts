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
import { createTask } from "@/lib/supabase/queries/tasks";
import { revalidatePath } from "next/cache";
import type { TaskPriority, TaskCategory } from "@/types/tools";

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

export async function createTaskAndScheduleAction(
  date: string,
  startTime: string,
  endTime: string,
  taskInput: { title: string; category?: string; priority?: string },
): Promise<void> {
  const supabase = createServerSupabaseClient();
  const task = await createTask(supabase, SOLO_USER_ID, {
    title: taskInput.title,
    category: taskInput.category as TaskCategory | undefined,
    priority: taskInput.priority as TaskPriority | undefined,
  });
  const block = await createScheduleBlock(supabase, SOLO_USER_ID, {
    date,
    start_time: startTime,
    end_time: endTime,
    type: "single",
  });
  await addTaskToBlock(supabase, block.id, task.id);
  revalidatePath("/schedule");
  revalidatePath("/tasks");
}

export async function createTaskAndAddToBlockAction(
  blockId: string,
  taskInput: { title: string; category?: string; priority?: string },
): Promise<void> {
  const supabase = createServerSupabaseClient();
  const task = await createTask(supabase, SOLO_USER_ID, {
    title: taskInput.title,
    category: taskInput.category as TaskCategory | undefined,
    priority: taskInput.priority as TaskPriority | undefined,
  });
  await addTaskToBlock(supabase, blockId, task.id);
  revalidatePath("/schedule");
  revalidatePath("/tasks");
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
