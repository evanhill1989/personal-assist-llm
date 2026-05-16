import type { SupabaseClient } from "@supabase/supabase-js";
import type { MindMapRow, MindMapNodeRow } from "@/types/supabase";

export async function listMindMaps(
  supabase: SupabaseClient,
  userId: string,
): Promise<MindMapRow[]> {
  const { data, error } = await supabase
    .from("mind_maps")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function createMindMap(
  supabase: SupabaseClient,
  userId: string,
  title: string,
): Promise<MindMapRow> {
  const { data, error } = await supabase
    .from("mind_maps")
    .insert({ user_id: userId, title })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMindMap(
  supabase: SupabaseClient,
  userId: string,
  mapId: string,
): Promise<void> {
  const { error } = await supabase
    .from("mind_maps")
    .delete()
    .eq("id", mapId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function getMindMapNodes(
  supabase: SupabaseClient,
  mapId: string,
): Promise<MindMapNodeRow[]> {
  const { data, error } = await supabase
    .from("mind_map_nodes")
    .select("*")
    .eq("map_id", mapId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function createMindMapNode(
  supabase: SupabaseClient,
  mapId: string,
  parentNodeId: string | null,
  label: string,
): Promise<MindMapNodeRow> {
  const { data, error } = await supabase
    .from("mind_map_nodes")
    .insert({
      map_id: mapId,
      parent_node_id: parentNodeId,
      label,
      node_type: "label",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateMindMapNode(
  supabase: SupabaseClient,
  nodeId: string,
  fields: Partial<Pick<MindMapNodeRow, "label" | "task_id" | "node_type">>,
): Promise<void> {
  const { error } = await supabase
    .from("mind_map_nodes")
    .update(fields)
    .eq("id", nodeId);
  if (error) throw new Error(error.message);
}

export async function deleteMindMapNode(
  supabase: SupabaseClient,
  nodeId: string,
): Promise<void> {
  const { error } = await supabase
    .from("mind_map_nodes")
    .delete()
    .eq("id", nodeId);
  if (error) throw new Error(error.message);
}
