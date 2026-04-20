import {
  createServerSupabaseClient,
  SOLO_USER_ID,
} from "@/lib/supabase/server";
import { listGoals } from "@/lib/supabase/queries/goals";
import { listTasks } from "@/lib/supabase/queries/tasks";
import { GoalList } from "@/components/goals/GoalList";
import Link from "next/link";

export default async function GoalsPage() {
  const supabase = createServerSupabaseClient();
  const [goals, tasks] = await Promise.all([
    listGoals(supabase, SOLO_USER_ID, {}),
    listTasks(supabase, SOLO_USER_ID, { status: "open" }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-sm font-medium text-neutral-900">Goals</h1>
        <Link
          href="/goals/new"
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          + New goal
        </Link>
      </div>
      <GoalList goals={goals} tasks={tasks} />
    </div>
  );
}
