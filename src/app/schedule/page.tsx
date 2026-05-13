import {
  createServerSupabaseClient,
  SOLO_USER_ID,
} from "@/lib/supabase/server";
import { listTasks } from "@/lib/supabase/queries/tasks";
import { getDaySchedule } from "@/lib/supabase/queries/schedule";
import { DailyScheduler } from "@/components/schedule/DailyScheduler";
import {
  createSingleBlockAction,
  createPomodoroBlockAction,
  createTaskAndScheduleAction,
  createTaskAndAddToBlockAction,
  addTaskToBlockAction,
  removeTaskFromBlockAction,
  deleteBlockAction,
} from "./actions";

export default async function SchedulePage() {
  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  const [tasks, blocks] = await Promise.all([
    listTasks(supabase, SOLO_USER_ID, { status: "open", limit: 200 }),
    getDaySchedule(supabase, SOLO_USER_ID, today),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <DailyScheduler
        tasks={tasks}
        blocks={blocks}
        date={today}
        createSingleBlockAction={createSingleBlockAction}
        createPomodoroBlockAction={createPomodoroBlockAction}
        createTaskAndScheduleAction={createTaskAndScheduleAction}
        createTaskAndAddToBlockAction={createTaskAndAddToBlockAction}
        addTaskToBlockAction={addTaskToBlockAction}
        removeTaskFromBlockAction={removeTaskFromBlockAction}
        deleteBlockAction={deleteBlockAction}
      />
    </div>
  );
}
