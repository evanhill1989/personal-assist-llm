"use client";

import { useState, useTransition } from "react";
import type { TaskRow } from "@/types/supabase";
import type { ScheduleBlockWithTasks } from "@/lib/supabase/queries/schedule";

const MORNING_SLOTS = ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00"];
const AFTERNOON_SLOTS = [
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];
const ALL_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];
const SLOT_HEIGHT_PX = 64;

const POMODORO_PRESETS = [
  { label: "25 min", minutes: 25 },
  { label: "50 min", minutes: 50 },
  { label: "90 min", minutes: 90 },
];

const SINGLE_DURATION_PRESETS = [
  { label: "30 min", minutes: 30 },
  { label: "1 hr", minutes: 60 },
  { label: "90 min", minutes: 90 },
  { label: "2 hr", minutes: 120 },
  { label: "3 hr", minutes: 180 },
];

const CATEGORY_PILL: Record<string, string> = {
  work: "bg-blue-50 text-blue-800",
  personal: "bg-emerald-50 text-emerald-800",
};

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function toSlotKey(dbTime: string): string {
  return dbTime.slice(0, 5);
}

function durationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

interface Props {
  tasks: TaskRow[];
  blocks: ScheduleBlockWithTasks[];
  date: string;
  createSingleBlockAction: (
    date: string,
    startTime: string,
    endTime: string,
    taskId: string,
  ) => Promise<void>;
  createPomodoroBlockAction: (
    date: string,
    startTime: string,
    endTime: string,
    label: string,
  ) => Promise<void>;
  addTaskToBlockAction: (blockId: string, taskId: string) => Promise<void>;
  removeTaskFromBlockAction: (blockId: string, taskId: string) => Promise<void>;
  deleteBlockAction: (blockId: string) => Promise<void>;
}

export function DailyScheduler({
  tasks,
  blocks,
  date,
  createSingleBlockAction,
  createPomodoroBlockAction,
  addTaskToBlockAction,
  removeTaskFromBlockAction,
  deleteBlockAction,
}: Props) {
  const [creatingAt, setCreatingAt] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState<"single" | "pomodoro" | null>(
    null,
  );
  const [createTaskId, setCreateTaskId] = useState("");
  const [createSingleDuration, setCreateSingleDuration] = useState(30);
  const [createDuration, setCreateDuration] = useState(25);
  const [createLabel, setCreateLabel] = useState("");
  const [addingToBlockId, setAddingToBlockId] = useState<string | null>(null);
  const [addTaskId, setAddTaskId] = useState("");
  const [isPending, startTransition] = useTransition();

  const taskMap = Object.fromEntries(tasks.map((t) => [t.id, t]));
  const scheduledTaskIds = new Set(blocks.flatMap((b) => b.task_ids));
  const unscheduledTasks = tasks.filter((t) => !scheduledTaskIds.has(t.id));

  const blockBySlot: Record<string, ScheduleBlockWithTasks> = {};
  const occupiedSlots = new Set<string>();

  for (const block of blocks) {
    const startKey = toSlotKey(block.start_time);
    blockBySlot[startKey] = block;
    const duration = durationMinutes(
      toSlotKey(block.start_time),
      toSlotKey(block.end_time),
    );
    const slotsUsed = Math.ceil(duration / 30);
    const idx = ALL_SLOTS.indexOf(startKey);
    for (let i = 1; i < slotsUsed; i++) {
      if (idx + i < ALL_SLOTS.length) occupiedSlots.add(ALL_SLOTS[idx + i]);
    }
  }

  function cancelCreate() {
    setCreatingAt(null);
    setCreateMode(null);
    setCreateTaskId("");
    setCreateLabel("");
    setCreateDuration(25);
    setCreateSingleDuration(30);
  }

  function handleCreateSingle() {
    if (!creatingAt || !createTaskId) return;
    startTransition(async () => {
      await createSingleBlockAction(
        date,
        creatingAt,
        addMinutes(creatingAt, createSingleDuration),
        createTaskId,
      );
      cancelCreate();
    });
  }

  function handleCreatePomodoro() {
    if (!creatingAt) return;
    startTransition(async () => {
      await createPomodoroBlockAction(
        date,
        creatingAt,
        addMinutes(creatingAt, createDuration),
        createLabel,
      );
      cancelCreate();
    });
  }

  function handleAddTaskToBlock() {
    if (!addingToBlockId || !addTaskId) return;
    startTransition(async () => {
      await addTaskToBlockAction(addingToBlockId, addTaskId);
      setAddingToBlockId(null);
      setAddTaskId("");
    });
  }

  function renderSlotGroup(slots: string[]) {
    return slots.map((slot) => {
      if (occupiedSlots.has(slot)) return null;

      const block = blockBySlot[slot];

      if (block) {
        const duration = durationMinutes(
          toSlotKey(block.start_time),
          toSlotKey(block.end_time),
        );
        const height = Math.ceil(duration / 30) * SLOT_HEIGHT_PX;
        const blockTasks = block.task_ids
          .map((id) => taskMap[id])
          .filter(Boolean);
        const isPomodoro = block.type === "pomodoro";
        const availableToAdd = unscheduledTasks.filter(
          (t) => !block.task_ids.includes(t.id),
        );

        return (
          <div
            key={slot}
            className="flex gap-3"
            style={{ minHeight: `${height}px` }}
          >
            <span className="w-14 shrink-0 pt-2.5 text-right text-xs text-neutral-400">
              {formatTime(slot)}
            </span>
            <div
              className={[
                "flex-1 rounded-lg border p-3",
                isPomodoro
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-neutral-200 bg-white",
              ].join(" ")}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500">
                  {isPomodoro
                    ? `Pomodoro · ${duration} min${block.label ? ` · ${block.label}` : ""}`
                    : `${duration} min`}
                </span>
                <button
                  onClick={() =>
                    startTransition(() => deleteBlockAction(block.id))
                  }
                  disabled={isPending}
                  className="text-neutral-300 transition-colors hover:text-red-400 disabled:opacity-40"
                >
                  ×
                </button>
              </div>

              <div className="space-y-1">
                {blockTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between gap-2 rounded px-2 py-1.5 ${
                      task.category
                        ? CATEGORY_PILL[task.category]
                        : "bg-white text-neutral-700"
                    }`}
                  >
                    <span className="text-xs">{task.title}</span>
                    <button
                      onClick={() =>
                        startTransition(() =>
                          removeTaskFromBlockAction(block.id, task.id),
                        )
                      }
                      disabled={isPending}
                      className="opacity-40 transition-opacity hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {isPomodoro && (
                <div className="mt-2">
                  {addingToBlockId === block.id ? (
                    <div className="flex gap-1.5">
                      <select
                        value={addTaskId}
                        onChange={(e) => setAddTaskId(e.target.value)}
                        className="flex-1 rounded border border-indigo-200 bg-white px-2 py-1 text-xs text-neutral-700"
                      >
                        <option value="">Pick a task…</option>
                        {availableToAdd.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddTaskToBlock}
                        disabled={!addTaskId || isPending}
                        className="rounded bg-indigo-600 px-2 py-1 text-xs text-white disabled:opacity-40"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setAddingToBlockId(null);
                          setAddTaskId("");
                        }}
                        className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-400 hover:text-neutral-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingToBlockId(block.id)}
                      className="text-xs text-indigo-400 transition-colors hover:text-indigo-600"
                    >
                      + Add task
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }

      return (
        <div
          key={slot}
          className="flex gap-3"
          style={{ minHeight: `${SLOT_HEIGHT_PX}px` }}
        >
          <span className="w-14 shrink-0 pt-2.5 text-right text-xs text-neutral-400">
            {formatTime(slot)}
          </span>
          <div className="flex-1">
            {creatingAt === slot ? (
              <div className="rounded-lg border border-neutral-200 bg-white p-3 space-y-2.5">
                {createMode === null && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCreateMode("single")}
                      className="rounded border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-50"
                    >
                      Single task
                    </button>
                    <button
                      onClick={() => setCreateMode("pomodoro")}
                      className="rounded border border-indigo-200 px-3 py-1.5 text-xs text-indigo-600 transition-colors hover:bg-indigo-50"
                    >
                      Pomodoro
                    </button>
                    <button
                      onClick={cancelCreate}
                      className="ml-auto text-neutral-300 hover:text-neutral-500"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {createMode === "single" && (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {SINGLE_DURATION_PRESETS.map((p) => (
                        <button
                          key={p.minutes}
                          onClick={() => setCreateSingleDuration(p.minutes)}
                          className={[
                            "rounded px-2.5 py-1 text-xs transition-colors",
                            createSingleDuration === p.minutes
                              ? "bg-neutral-900 text-white"
                              : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50",
                          ].join(" ")}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <select
                      value={createTaskId}
                      onChange={(e) => setCreateTaskId(e.target.value)}
                      className="w-full rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-xs text-neutral-700"
                    >
                      <option value="">Pick a task…</option>
                      {unscheduledTasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateSingle}
                        disabled={!createTaskId || isPending}
                        className="rounded bg-neutral-900 px-3 py-1 text-xs text-white disabled:opacity-40"
                      >
                        Schedule
                      </button>
                      <button
                        onClick={cancelCreate}
                        className="text-xs text-neutral-400 hover:text-neutral-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}

                {createMode === "pomodoro" && (
                  <>
                    <div className="flex gap-1.5">
                      {POMODORO_PRESETS.map((p) => (
                        <button
                          key={p.minutes}
                          onClick={() => setCreateDuration(p.minutes)}
                          className={[
                            "rounded px-2.5 py-1 text-xs transition-colors",
                            createDuration === p.minutes
                              ? "bg-indigo-600 text-white"
                              : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50",
                          ].join(" ")}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <input
                      value={createLabel}
                      onChange={(e) => setCreateLabel(e.target.value)}
                      placeholder="Label (optional)"
                      className="w-full rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-xs text-neutral-700 outline-none placeholder:text-neutral-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreatePomodoro}
                        disabled={isPending}
                        className="rounded bg-indigo-600 px-3 py-1 text-xs text-white disabled:opacity-40"
                      >
                        Create
                      </button>
                      <button
                        onClick={cancelCreate}
                        className="text-xs text-neutral-400 hover:text-neutral-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setCreatingAt(slot);
                  setCreateMode(null);
                }}
                className="flex h-full w-full items-center rounded-lg border border-transparent px-3 text-xs text-neutral-200 transition-colors hover:border-neutral-200 hover:text-neutral-400"
              >
                +
              </button>
            )}
          </div>
        </div>
      );
    });
  }

  const todayLabel = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex gap-8">
      <div className="w-52 shrink-0">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
          Unscheduled
        </p>
        <div className="space-y-1.5">
          {unscheduledTasks.length === 0 ? (
            <p className="text-xs text-neutral-300">All tasks scheduled.</p>
          ) : (
            unscheduledTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-md border border-neutral-200 bg-white px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-neutral-700">{task.title}</p>
                  {task.category && (
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${CATEGORY_PILL[task.category]}`}
                    >
                      {task.category}
                    </span>
                  )}
                </div>
                {task.due_date && (
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {task.due_date}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="mb-5 text-sm font-medium text-neutral-900">
          {todayLabel}
        </p>
        <div className="space-y-1">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-neutral-400">
            Morning
          </p>
          {renderSlotGroup(MORNING_SLOTS)}

          <div className="py-4 text-center text-xs text-neutral-300">
            — lunch —
          </div>

          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-neutral-400">
            Afternoon
          </p>
          {renderSlotGroup(AFTERNOON_SLOTS)}
        </div>
      </div>
    </div>
  );
}
