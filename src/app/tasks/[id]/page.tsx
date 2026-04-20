import {
  createServerSupabaseClient,
  SOLO_USER_ID,
} from "@/lib/supabase/server";
import { getTaskById } from "@/lib/supabase/queries/tasks";
import { listGoals } from "@/lib/supabase/queries/goals";
import { TaskDetailForm } from "@/components/tasks/TaskDetailForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateTaskAction, deleteTaskAction } from "../actions";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const [task, goals] = await Promise.all([
    getTaskById(supabase, SOLO_USER_ID, id),
    listGoals(supabase, SOLO_USER_ID, {}),
  ]);

  if (!task) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/tasks"
        className="mb-8 inline-flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-neutral-700"
      >
        ← Tasks
      </Link>
      <TaskDetailForm
        task={task}
        goals={goals}
        updateAction={updateTaskAction}
        deleteAction={deleteTaskAction}
      />
    </div>
  );
}
