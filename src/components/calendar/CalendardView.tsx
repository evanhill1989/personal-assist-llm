"use client";

import { useState } from "react";
import Link from "next/link";
import type { TaskRow } from "@/types/supabase";

function getWeekDays(offset: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay() + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function toDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-neutral-300",
};

interface Props {
  tasks: TaskRow[];
}

export function CalendarView({ tasks }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const days = getWeekDays(weekOffset);

  const todayKey = toDateKey(new Date());

  const tasksByDay = tasks.reduce<Record<string, TaskRow[]>>((acc, task) => {
    if (!task.due_date) return acc;
    acc[task.due_date] = [...(acc[task.due_date] ?? []), task];
    return acc;
  }, {});

  const weekLabel = `${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-900">
          {weekLabel}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            ← Prev
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200">
        {days.map((day) => {
          const key = toDateKey(day);
          const isToday = key === todayKey;
          const dayTasks = tasksByDay[key] ?? [];

          return (
            <div key={key} className="flex flex-col bg-white">
              {/* Day header */}
              <div
                className={[
                  "px-3 py-2.5 text-center",
                  isToday ? "bg-neutral-900" : "bg-neutral-50",
                ].join(" ")}
              >
                <p
                  className={[
                    "text-xs font-medium",
                    isToday ? "text-white" : "text-neutral-500",
                  ].join(" ")}
                >
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p
                  className={[
                    "text-sm font-medium",
                    isToday ? "text-white" : "text-neutral-900",
                  ].join(" ")}
                >
                  {day.getDate()}
                </p>
              </div>

              {/* Tasks */}
              <div className="flex flex-col gap-1 p-2 min-h-28">
                {dayTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center gap-1.5 rounded-md bg-neutral-50 px-2 py-1.5 text-xs text-neutral-700 transition-colors hover:bg-neutral-100"
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        PRIORITY_DOT[task.priority ?? "low"]
                      }`}
                    />
                    <span className="truncate leading-tight">{task.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
