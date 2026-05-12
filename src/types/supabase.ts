export type TaskCategory = "work" | "personal";

export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: "open" | "completed";
  priority: "low" | "medium" | "high" | null;
  due_date: string | null;
  project: string | null;
  contact_name: string | null;
  goal_id: string | null;
  category: TaskCategory | null;
  created_at: string;
}

export interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  tags: string[] | null;
  related_project: string | null;
  contact_name: string | null;
  created_at: string;
}

export interface ContactRow {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  relationship: string | null;
  company: string | null;
  notes: string | null;
  last_contacted: string | null;
}

export interface UserContextRow {
  id: string;
  user_id: string;
  field: string;
  value: string;
  updated_at: string;
}

export interface GoalRow {
  id: string;
  user_id: string;
  title: string;
  status: "on_track" | "at_risk" | "stalled";
  status_note: string | null;
  progress: number;
  target_date: string | null;
  created_at: string;
}

export interface ScheduleBlockRow {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: "single" | "pomodoro";
  label: string | null;
  created_at: string;
}

export interface ScheduleBlockTaskRow {
  id: string;
  block_id: string;
  task_id: string;
  created_at: string;
}
