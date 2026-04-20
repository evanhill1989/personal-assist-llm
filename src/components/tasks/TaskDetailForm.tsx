"use client";

import { useTransition } from "react";

import type { TaskRow, GoalRow } from "@/types/supabase";

interface Props {
  task: TaskRow;
  goals: GoalRow[];
  updateAction: (taskId: string, formData: FormData) => Promise<void>;
  deleteAction: (taskId: string) => Promise<void>;
}

export function TaskDetailForm({
  task,
  goals,
  updateAction,
  deleteAction,
}: Props) {
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-medium text-neutral-900">{task.title}</h1>

      <form
        action={(formData) => {
          startSave(async () => {
            await updateAction(task.id, formData);
          });
        }}
        className="space-y-4"
      >
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-neutral-400">
            Title
          </label>
          <input
            name="title"
            defaultValue={task.title}
            required
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-neutral-400">
              Priority
            </label>
            <select
              name="priority"
              defaultValue={task.priority ?? ""}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
            >
              <option value="">None</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-neutral-400">
              Due date
            </label>
            <input
              name="due_date"
              type="date"
              defaultValue={task.due_date ?? ""}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-neutral-400">
            Linked goal
          </label>
          <select
            name="goal_id"
            defaultValue={task.goal_id ?? ""}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
          >
            <option value="">No goal</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-neutral-400">
            Notes
          </label>
          <textarea
            name="description"
            defaultValue={task.description ?? ""}
            rows={3}
            placeholder="Any context…"
            className="w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
        </div>

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
                await deleteAction(task.id);
              });
            }}
            className="rounded-lg border border-red-200 px-5 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            {isDeleting ? "Deleting…" : "Delete task"}
          </button>
        </div>
      </form>
    </div>
  );
}
