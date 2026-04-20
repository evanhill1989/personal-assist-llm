import { NewGoalForm } from "@/components/goals/NewGoalForm";
import { createGoalAction } from "../actions";
import Link from "next/link";

export default function NewGoalPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/goals"
        className="mb-8 inline-flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-neutral-700"
      >
        ← Goals
      </Link>
      <NewGoalForm createAction={createGoalAction} />
    </div>
  );
}
