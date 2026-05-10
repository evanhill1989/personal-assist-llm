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
  completeTaskAction: (taskId: string) => Promise<void>;
}

export function TaskList({
  tasks,
  goals,
  createTaskAction,
  completeTaskAction,
}: Props) {
  const groups = groupTasks(tasks);
  const goalMap = Object.fromEntries(goals.map((g) => [g.id, g.title]));
  const [showAdd, setShowAdd] = useState(false);
  const [isAddPending, startAddTransition] = useTransition();
  const [completingId, setCompletingId] = useState<string | null>(null);

  async function handleComplete(taskId: string) {
    setCompletingId(taskId);
    await completeTaskAction(taskId);
    setCompletingId(null);
  }

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
              <div
                key={task.id}
                className="flex items-center rounded-lg border border-neutral-200 bg-white text-sm transition-colors hover:bg-neutral-50"
              >
                <Link
                  href={`/tasks/${task.id}`}
                  className="flex flex-1 items-center gap-3 px-4 py-3"
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
                <button
                  type="button"
                  disabled={completingId === task.id}
                  onClick={() => handleComplete(task.id)}
                  aria-label="Mark complete"
                  className="flex items-center px-4 py-3 text-neutral-300 transition-colors hover:text-green-500 disabled:opacity-40"
                >
                  {completingId === task.id ? (
                    <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-500" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M5 8l2 2 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showAdd ? (
        <form
          action={(formData) => {
            startAddTransition(async () => {
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
              disabled={isAddPending}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white transition-opacity disabled:opacity-50"
            >
              {isAddPending ? "Adding…" : "Add task"}
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
