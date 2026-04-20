"use server";

import {
  createServerSupabaseClient,
  SOLO_USER_ID,
} from "@/lib/supabase/server";
import {
  createTask,
  updateTask,
  deleteTask,
} from "@/lib/supabase/queries/tasks";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TaskPriority } from "@/types/tools";

export async function createTaskAction(formData: FormData): Promise<void> {
  const title = (formData.get("title") as string).trim();
  if (!title) return;

  const supabase = createServerSupabaseClient();
  await createTask(supabase, SOLO_USER_ID, {
    title,
    priority: (formData.get("priority") as TaskPriority) || undefined,
    due_date: (formData.get("due_date") as string) || undefined,
    goal_id: (formData.get("goal_id") as string) || undefined,
  });
  revalidatePath("/tasks");
}

export async function updateTaskAction(
  taskId: string,
  formData: FormData,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  await updateTask(supabase, SOLO_USER_ID, {
    task_id: taskId,
    title: (formData.get("title") as string).trim(),
    description: (formData.get("description") as string) || undefined,
    priority: (formData.get("priority") as TaskPriority) || undefined,
    due_date: (formData.get("due_date") as string) || undefined,
    goal_id: (formData.get("goal_id") as string) || null,
  });
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  redirect("/tasks");
}

export async function completeTaskAction(taskId: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  await updateTask(supabase, SOLO_USER_ID, {
    task_id: taskId,
    status: "completed",
  });
  revalidatePath("/tasks");
}

export async function deleteTaskAction(taskId: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  await deleteTask(supabase, SOLO_USER_ID, taskId);
  revalidatePath("/tasks");
  redirect("/tasks");
}
