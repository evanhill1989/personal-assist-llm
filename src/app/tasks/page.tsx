import {
  createServerSupabaseClient,
  SOLO_USER_ID,
} from "@/lib/supabase/server";
import { listTasks } from "@/lib/supabase/queries/tasks";
import { listGoals } from "@/lib/supabase/queries/goals";
import { TaskList } from "@/components/tasks/TaskList";
import { createTaskAction } from "./actions";

export default async function TasksPage() {
  const supabase = createServerSupabaseClient();
  const [tasks, goals] = await Promise.all([
    listTasks(supabase, SOLO_USER_ID, { status: "open" }),
    listGoals(supabase, SOLO_USER_ID, {}),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <TaskList
        tasks={tasks}
        goals={goals}
        createTaskAction={createTaskAction}
      />
    </div>
  );
}
