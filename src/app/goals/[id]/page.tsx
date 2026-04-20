import {
  createServerSupabaseClient,
  SOLO_USER_ID,
} from "@/lib/supabase/server";
import { getGoalById } from "@/lib/supabase/queries/goals";
import { listTasks } from "@/lib/supabase/queries/tasks";
import { GoalDetailForm } from "@/components/goals/GoalDetailForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { deleteGoalAction, updateGoalAction } from "../actions";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const [goal, tasks] = await Promise.all([
    getGoalById(supabase, SOLO_USER_ID, id),
    listTasks(supabase, SOLO_USER_ID, { goal_id: id, status: "open" }),
  ]);

  if (!goal) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/goals"
        className="mb-8 inline-flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-neutral-700"
      >
        ← Goals
      </Link>
      <GoalDetailForm
        goal={goal}
        tasks={tasks}
        updateAction={updateGoalAction}
        deleteAction={deleteGoalAction}
      />
    </div>
  );
}
