import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMindMapNodes } from "@/lib/supabase/queries/mindmaps";
import { listTasks } from "@/lib/supabase/queries/tasks";
import { MindMapCanvas } from "@/components/mindmap/MindMapCanvas";
import { deleteMindMapFormAction } from "../actions";

const SOLO_USER_ID = process.env.SOLO_USER_ID!;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MindMapPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const [nodes, tasks] = await Promise.all([
    getMindMapNodes(supabase, id),
    listTasks(supabase, SOLO_USER_ID, { status: "open", limit: 100 }),
  ]);

  if (nodes.length === 0) notFound();

  const root = nodes.find((n) => n.parent_node_id === null);
  const title = root?.label ?? "Mind map";

  return (
    <div className="flex h-screen flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <a
            href="/mindmap"
            className="text-sm text-neutral-400 hover:text-neutral-600"
          >
            ← Maps
          </a>
          <h1 className="text-sm font-medium text-neutral-900">{title}</h1>
        </div>
        <form action={deleteMindMapFormAction}>
          <input type="hidden" name="mapId" value={id} />
          <button
            type="submit"
            className="text-xs text-neutral-400 hover:text-red-500"
          >
            Delete map
          </button>
        </form>
      </div>
      <div className="min-h-0 flex-1">
        <MindMapCanvas mapId={id} nodes={nodes} tasks={tasks} />
      </div>
    </div>
  );
}
