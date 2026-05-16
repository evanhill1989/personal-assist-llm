import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listMindMaps } from "@/lib/supabase/queries/mindmaps";
import { createMindMapFormAction } from "./actions";

const SOLO_USER_ID = process.env.SOLO_USER_ID!;

export default async function MindMapListPage() {
  const supabase = createServerSupabaseClient();
  const maps = await listMindMaps(supabase, SOLO_USER_ID);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-neutral-900">Mind maps</h1>
        <form
          action={createMindMapFormAction}
          className="flex items-center gap-2"
        >
          <input
            name="title"
            placeholder="New map…"
            required
            className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white"
          >
            Create
          </button>
        </form>
      </div>

      {maps.length === 0 ? (
        <p className="text-sm text-neutral-400">No mind maps yet.</p>
      ) : (
        <ul className="space-y-2">
          {maps.map((map) => (
            <li key={map.id}>
              <Link
                href={`/mindmap/${map.id}`}
                className="flex items-center justify-between rounded-xl border border-neutral-100 bg-white px-4 py-3 text-sm text-neutral-900 hover:bg-neutral-50"
              >
                <span>{map.title}</span>
                <span className="text-xs text-neutral-400">
                  {new Date(map.created_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
