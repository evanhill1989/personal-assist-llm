import {
  createServerSupabaseClient,
  SOLO_USER_ID,
} from "@/lib/supabase/server";
import { listTasks } from "@/lib/supabase/queries/tasks";
import { CalendarView } from "@/components/calendar/CalendardView";

export default async function CalendarPage() {
  const supabase = createServerSupabaseClient();
  // Fetch all open tasks — calendar filters client-side by week
  const tasks = await listTasks(supabase, SOLO_USER_ID, {
    status: "open",
    limit: 100,
  });

  return <CalendarView tasks={tasks} />;
}
