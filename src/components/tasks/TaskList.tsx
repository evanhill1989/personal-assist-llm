"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { TaskRow, GoalRow } from "@/types/supabase";

type Group = { label: string; tasks: TaskRow[] };

function groupTasks(tasks: TaskRow[]): Group[] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowStart.getDate() + 1);

  const in7DaysEnd = new Date(todayStart);
  in7DaysEnd.setDate(todayStart.getDate() + 7);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const buckets: Record<string, TaskRow[]> = {
    [`Today — ${fmt(todayStart)}`]: [],
    [`Tomorrow — ${fmt(tomorrowStart)}`]: [],
    "Next 7 days": [],
    Later: [],
    "No due date": [],
  };

  const keys = Object.keys(buckets);

  for (const task of tasks) {
    if (!task.due_date) {
      buckets[keys[4]].push(task);
      continue;
    }
    const due = new Date(`${task.due_date}T00:00:00`);
    if (due < tomorrowStart) buckets[keys[0]].push(task);
    else if (due < tomorrowEnd) buckets[keys[1]].push(task);
    else if (due <= in7DaysEnd) buckets[keys[2]].push(task);
    else buckets[keys[3]].push(task);
  }

  return Object.entries(buckets)
    .filter(([, t]) => t.length > 0)
    .map(([label, tasks]) => ({ label, tasks }));
}

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-neutral-300",
};

interface Props {
  tasks: TaskRow[];
  goals: GoalRow[];
  createTaskAction: (formData: FormData) => Promise<void>;
}

export function TaskList({ tasks, goals, createTaskAction }: Props) {
  const groups = groupTasks(tasks);
  const goalMap = Object.fromEntries(goals.map((g) => [g.id, g.title]));
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      {groups.length === 0 && !showAdd && (
        <p className="text-sm text-neutral-400">
          No open tasks. Add one below or use the chat.
        </p>
      )}

      {groups.map(({ label, tasks: groupTasks }) => (
        <div key={label}>
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
            {label}
          </p>
          <div className="space-y-1.5">
            {groupTasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm transition-colors hover:bg-neutral-50"
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    PRIORITY_DOT[task.priority ?? "low"]
                  }`}
                />
                <span className="flex-1 text-neutral-900">{task.title}</span>
                {(task.goal_id && goalMap[task.goal_id]) || task.project ? (
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                    {task.goal_id ? goalMap[task.goal_id] : task.project}
                  </span>
                ) : null}
                <span className="text-neutral-300">›</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {showAdd ? (
        <form
          action={(formData) => {
            startTransition(async () => {
              await createTaskAction(formData);
              setShowAdd(false);
            });
          }}
          className="space-y-3 rounded-lg border border-neutral-200 p-4"
        >
          <input
            name="title"
            placeholder="Task title"
            autoFocus
            required
            className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
          <div className="flex gap-2">
            <select
              name="priority"
              className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600"
            >
              <option value="">Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input
              name="due_date"
              type="date"
              className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600"
            />
            <select
              name="goal_id"
              className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600"
            >
              <option value="">No goal</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity disabled:opacity-50"
            >
              {isPending ? "Adding…" : "Add task"}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-md border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="text-sm text-neutral-400 transition-colors hover:text-neutral-700"
        >
          + Add task
        </button>
      )}
    </div>
  );
}
