"use client";

import Link from "next/link";
import type { GoalRow, TaskRow } from "@/types/supabase";

const STATUS_BADGE: Record<string, string> = {
  on_track: "bg-green-50 text-green-700",
  at_risk: "bg-amber-50 text-amber-700",
  stalled: "bg-red-50 text-red-600",
};

const STATUS_LABEL: Record<string, string> = {
  on_track: "On track",
  at_risk: "At risk",
  stalled: "Stalled",
};

interface Props {
  goals: GoalRow[];
  tasks: TaskRow[];
}

export function GoalList({ goals, tasks }: Props) {
  const tasksByGoal = tasks.reduce<Record<string, TaskRow[]>>((acc, task) => {
    if (!task.goal_id) return acc;
    acc[task.goal_id] = [...(acc[task.goal_id] ?? []), task];
    return acc;
  }, {});

  if (goals.length === 0) {
    return (
      <p className="text-sm text-neutral-400">
        No goals yet.{" "}
        <Link href="/goals/new" className="underline underline-offset-2">
          Add your first goal
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {goals.map((goal) => {
        const linkedTasks = tasksByGoal[goal.id] ?? [];
        return (
          <Link
            key={goal.id}
            href={`/goals/${goal.id}`}
            className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 transition-colors hover:bg-neutral-50"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium leading-snug text-neutral-900">
                {goal.title}
              </span>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                  STATUS_BADGE[goal.status]
                }`}
              >
                {STATUS_LABEL[goal.status]}
              </span>
            </div>

            {/* Progress bar */}
            <div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-1 rounded-full bg-green-400 transition-all"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-neutral-400">
                {goal.progress}% complete
              </p>
            </div>

            {/* Linked tasks */}
            {linkedTasks.length > 0 && (
              <div className="space-y-1 border-t border-neutral-100 pt-3">
                {linkedTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-300" />
                    <span className="truncate text-xs text-neutral-500">
                      {task.title}
                    </span>
                  </div>
                ))}
                {linkedTasks.length > 3 && (
                  <p className="text-xs text-neutral-400">
                    +{linkedTasks.length - 3} more
                  </p>
                )}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
