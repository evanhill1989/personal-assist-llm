"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { GoalRow, TaskRow } from "@/types/supabase";
import type { GoalStatus } from "@/types/tools";

const STATUS_OPTIONS: { value: GoalStatus; label: string; cls: string }[] = [
  {
    value: "on_track",
    label: "On track",
    cls: "bg-green-50 text-green-700 border-green-200",
  },
  {
    value: "at_risk",
    label: "At risk",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    value: "stalled",
    label: "Stalled",
    cls: "bg-red-50 text-red-600 border-red-200",
  },
];

const STATUS_NOTE_CLS: Record<GoalStatus, string> = {
  on_track: "border-neutral-200 bg-neutral-50",
  at_risk: "border-amber-200 bg-amber-50",
  stalled: "border-red-200 bg-red-50",
};

interface Props {
  goal: GoalRow;
  tasks: TaskRow[];
  updateAction: (goalId: string, formData: FormData) => Promise<void>;
  deleteAction: (goalId: string) => Promise<void>;
}

export function GoalDetailForm({
  goal,
  tasks,
  updateAction,
  deleteAction,
}: Props) {
  const [status, setStatus] = useState<GoalStatus>(goal.status);
  const [progress, setProgress] = useState(goal.progress);
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-medium text-neutral-900">{goal.title}</h1>

      <form
        action={(formData) => {
          formData.set("status", status);
          formData.set("progress", String(progress));
          startSave(async () => {
            await updateAction(goal.id, formData);
          });
        }}
        className="space-y-5"
      >
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-neutral-400">
            Title
          </label>
          <input
            name="title"
            defaultValue={goal.title}
            required
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-neutral-400">
              Target date
            </label>
            <input
              name="target_date"
              type="date"
              defaultValue={goal.target_date ?? ""}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-neutral-400">
            Status
          </label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={[
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-opacity",
                  opt.cls,
                  status !== opt.value ? "opacity-40" : "",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-neutral-400">
            Status note
          </label>
          <textarea
            name="status_note"
            defaultValue={goal.status_note ?? ""}
            rows={3}
            placeholder="What's blocking this, or what's going well?"
            className={[
              "w-full resize-none rounded-lg border px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400 transition-colors",
              STATUS_NOTE_CLS[status],
            ].join(" ")}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-widest text-neutral-400">
              Progress
            </label>
            <span className="text-sm text-neutral-500">{progress}%</span>
          </div>
          <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-1.5 rounded-full bg-green-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-neutral-900"
          />
        </div>

        {tasks.length > 0 && (
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-neutral-400">
              Open tasks
            </label>
            <div className="space-y-1.5">
              {tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300" />
                  <span className="flex-1">{task.title}</span>
                  <span className="text-neutral-300">›</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-neutral-100 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm text-white transition-opacity disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={() => {
              startDelete(async () => {
                await deleteAction(goal.id);
              });
            }}
            className="rounded-lg border border-red-200 px-5 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            {isDeleting ? "Deleting…" : "Delete goal"}
          </button>
        </div>
      </form>
    </div>
  );
}
