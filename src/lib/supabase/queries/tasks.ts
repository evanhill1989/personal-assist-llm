import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateTaskInput,
  ListTasksInput,
  UpdateTaskInput,
} from "@/types/tools";
import type { TaskRow } from "@/types/supabase";

export async function createTask(
  supabase: SupabaseClient,
  userId: string,
  input: CreateTaskInput,
): Promise<TaskRow> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...input, user_id: userId, status: "open" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listTasks(
  supabase: SupabaseClient,
  userId: string,
  input: ListTasksInput,
): Promise<TaskRow[]> {
  let query = supabase.from("tasks").select("*").eq("user_id", userId);

  const status = input.status ?? "open";
  if (status !== "all") query = query.eq("status", status);
  if (input.priority) query = query.eq("priority", input.priority);
  if (input.project) query = query.ilike("project", `%${input.project}%`);
  if (input.due_before) query = query.lte("due_date", input.due_before);
  if (input.contact_name)
    query = query.ilike("contact_name", `%${input.contact_name}%`);
  if (input.goal_id) query = query.eq("goal_id", input.goal_id);

  query = query
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(input.limit ?? 20);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getTaskById(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
): Promise<TaskRow | null> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateTask(
  supabase: SupabaseClient,
  userId: string,
  input: UpdateTaskInput,
): Promise<TaskRow> {
  const { task_id, ...fields } = input;
  const { data, error } = await supabase
    .from("tasks")
    .update(fields)
    .eq("id", task_id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Task ${task_id} not found`);
  return data;
}

export async function deleteTask(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
): Promise<{ id: string; title: string }> {
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId)
    .select("id, title")
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Task ${taskId} not found`);
  return data;
}
