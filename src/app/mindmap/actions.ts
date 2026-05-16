"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createMindMap,
  deleteMindMap,
  createMindMapNode,
  updateMindMapNode,
  deleteMindMapNode,
} from "@/lib/supabase/queries/mindmaps";

const SOLO_USER_ID = process.env.SOLO_USER_ID!;

export async function createMindMapFormAction(
  formData: FormData,
): Promise<void> {
  const title = (formData.get("title") as string)?.trim();
  if (!title) return;
  const supabase = createServerSupabaseClient();
  const map = await createMindMap(supabase, SOLO_USER_ID, title);
  await createMindMapNode(supabase, map.id, null, title);
  redirect(`/mindmap/${map.id}`);
}

export async function deleteMindMapFormAction(
  formData: FormData,
): Promise<void> {
  const mapId = formData.get("mapId") as string;
  const supabase = createServerSupabaseClient();
  await deleteMindMap(supabase, SOLO_USER_ID, mapId);
  redirect("/mindmap");
}

export async function addNodeAction(
  mapId: string,
  parentNodeId: string,
  label: string,
): Promise<{ id: string }> {
  const supabase = createServerSupabaseClient();
  const node = await createMindMapNode(supabase, mapId, parentNodeId, label);
  revalidatePath(`/mindmap/${mapId}`);
  return { id: node.id };
}

export async function updateNodeLabelAction(
  mapId: string,
  nodeId: string,
  label: string,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  await updateMindMapNode(supabase, nodeId, { label });
  revalidatePath(`/mindmap/${mapId}`);
}

export async function attachTaskAction(
  mapId: string,
  nodeId: string,
  taskId: string,
  taskTitle: string,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  await updateMindMapNode(supabase, nodeId, {
    task_id: taskId,
    node_type: "task",
    label: taskTitle,
  });
  revalidatePath(`/mindmap/${mapId}`);
}

export async function deleteNodeAction(
  mapId: string,
  nodeId: string,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  await deleteMindMapNode(supabase, nodeId);
  revalidatePath(`/mindmap/${mapId}`);
}
