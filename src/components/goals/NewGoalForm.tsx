"use client";

import { useTransition } from "react";

interface Props {
  createAction: (formData: FormData) => Promise<void>;
}

export function NewGoalForm({ createAction }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-medium text-neutral-900">New goal</h1>

      <form
        action={(formData) => {
          startTransition(async () => {
            await createAction(formData);
          });
        }}
        className="space-y-4"
      >
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-neutral-400">
            Goal
          </label>
          <input
            name="title"
            placeholder="e.g. Land a new role"
            required
            autoFocus
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-neutral-400">
              Status
            </label>
            <select
              name="status"
              defaultValue="on_track"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
            >
              <option value="on_track">On track</option>
              <option value="at_risk">At risk</option>
              <option value="stalled">Stalled</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-neutral-400">
              Target date
            </label>
            <input
              name="target_date"
              type="date"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-neutral-400">
            Status note
          </label>
          <textarea
            name="status_note"
            rows={3}
            placeholder="Optional — what's the current situation?"
            className="w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
        </div>

        <div className="border-t border-neutral-100 pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm text-white transition-opacity disabled:opacity-50"
          >
            {isPending ? "Creating…" : "Create goal"}
          </button>
        </div>
      </form>
    </div>
  );
}
