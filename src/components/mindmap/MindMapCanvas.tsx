"use client";

import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import type { MindMapNodeRow, TaskRow } from "@/types/supabase";
import {
  addNodeAction,
  updateNodeLabelAction,
  deleteNodeAction,
  attachTaskAction,
} from "@/app/mindmap/actions";

// ---- Types ----

interface LayoutNode {
  id: string;
  label: string;
  nodeType: "label" | "task";
  taskId: string | null;
  parentId: string | null;
  x: number;
  y: number;
  children: LayoutNode[];
  color: string;
  depth: number;
  labelYOffset: number;
}

// ---- Constants ----

const BRANCH_COLORS = [
  "#a78bfa",
  "#60a5fa",
  "#f87171",
  "#fb923c",
  "#facc15",
  "#4ade80",
  "#f472b6",
  "#34d399",
];

// ---- Tree helpers ----

function buildTree(nodes: MindMapNodeRow[]): LayoutNode | null {
  if (nodes.length === 0) return null;
  const map = new Map<string, LayoutNode>();
  for (const n of nodes) {
    map.set(n.id, {
      id: n.id,
      label: n.label,
      nodeType: n.node_type,
      taskId: n.task_id,
      parentId: n.parent_node_id,
      x: 0,
      y: 0,
      children: [],
      color: "#94a3b8",
      depth: 0,
      labelYOffset: 0,
    });
  }
  let root: LayoutNode | undefined;
  for (const n of nodes) {
    if (n.parent_node_id === null) {
      root = map.get(n.id);
    } else {
      const parent = map.get(n.parent_node_id);
      const child = map.get(n.id);
      if (parent && child) parent.children.push(child);
    }
  }
  return root ?? null;
}

function subtreeSize(node: LayoutNode): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((sum, c) => sum + subtreeSize(c), 0);
}

function applyLayout(
  node: LayoutNode,
  cx: number,
  cy: number,
  startAngle: number,
  totalAngle: number,
  depth: number,
): void {
  node.x = cx;
  node.y = cy;
  node.depth = depth;
  if (node.children.length === 0) return;
  const r = depth === 0 ? 240 : Math.max(120, 200 - depth * 20);
  const total = node.children.reduce((sum, c) => sum + subtreeSize(c), 0);
  let angle = startAngle;
  for (const child of node.children) {
    const slice = (subtreeSize(child) / total) * totalAngle;
    const mid = angle + slice / 2;
    applyLayout(
      child,
      cx + Math.cos(mid) * r,
      cy + Math.sin(mid) * r,
      angle,
      slice,
      depth + 1,
    );
    angle += slice;
  }
}

function assignColors(node: LayoutNode, color: string): void {
  node.color = color;
  node.children.forEach((child, i) => {
    assignColors(
      child,
      node.depth === 0 ? BRANCH_COLORS[i % BRANCH_COLORS.length] : color,
    );
  });
}

function flattenTree(node: LayoutNode): LayoutNode[] {
  return [node, ...node.children.flatMap(flattenTree)];
}

function collectEdges(
  node: LayoutNode,
): Array<{ parent: LayoutNode; child: LayoutNode }> {
  return node.children.flatMap((child) => [
    { parent: node, child },
    ...collectEdges(child),
  ]);
}

const SIN_70 = Math.sin((70 * Math.PI) / 180); // ≈ 0.940 — threshold for ±20° of vertical

function applyLabelOffsets(flat: LayoutNode[]): void {
  const byId = new Map<string, LayoutNode>();
  for (const n of flat) byId.set(n.id, n);

  for (const node of flat) {
    if (node.depth === 0 || !node.parentId) {
      node.labelYOffset = 0;
      continue;
    }
    const parent = byId.get(node.parentId);
    if (!parent) {
      node.labelYOffset = 0;
      continue;
    }
    const angle = Math.atan2(node.y - parent.y, node.x - parent.x);
    if (Math.abs(Math.sin(angle)) > SIN_70) {
      const dx = node.x - parent.x;
      node.labelYOffset = Math.abs(dx) > 5 ? (dx > 0 ? 14 : -14) : 0;
    } else {
      node.labelYOffset = 0;
    }
  }
}

function computeLayout(nodes: MindMapNodeRow[]): {
  flat: LayoutNode[];
  edges: Array<{ parent: LayoutNode; child: LayoutNode }>;
} {
  const root = buildTree(nodes);
  if (!root) return { flat: [], edges: [] };
  applyLayout(root, 0, 0, -Math.PI, 2 * Math.PI, 0);
  assignColors(root, "#94a3b8");
  const flat = flattenTree(root);
  applyLabelOffsets(flat);
  return { flat, edges: collectEdges(root) };
}

// ---- Component ----

interface Props {
  mapId: string;
  nodes: MindMapNodeRow[];
  tasks: TaskRow[];
}

export function MindMapCanvas({ mapId, nodes, tasks }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingActive, setIsDraggingActive] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { flat: layoutNodes, edges } = computeLayout(nodes);

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    const obs = new ResizeObserver((entries) => {
      const e = entries[0];
      setContainerSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Auto-focus newly added node
  useEffect(() => {
    if (!pendingFocusId) return;
    const node = layoutNodes.find((n) => n.id === pendingFocusId);
    if (!node) return;
    startTransition(() => {
      setSelectedId(pendingFocusId);
      setEditingId(pendingFocusId);
      setEditValue(node.label);
      setPendingFocusId(null);
    });
  }, [layoutNodes, pendingFocusId, startTransition]);

  // Focus edit input
  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  // Wheel zoom (non-passive so we can preventDefault)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.max(0.3, Math.min(3, z * factor)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const target = e.target as Element;
      if (target.closest("[data-node-id]")) return;
      isDragging.current = true;
      hasDragged.current = false;
      setIsDraggingActive(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    },
    [pan],
  );

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    setIsDraggingActive(false);
  }, []);

  function getScreenPos(node: LayoutNode) {
    return {
      left: containerSize.w / 2 + pan.x + node.x * zoom,
      top: containerSize.h / 2 + pan.y + node.y * zoom,
    };
  }

  function commitEdit() {
    if (!editingId) return;
    const label = editValue.trim();
    const id = editingId;
    setEditingId(null);
    setEditValue("");
    if (label) {
      startTransition(async () => {
        await updateNodeLabelAction(mapId, id, label);
      });
    }
  }

  function handleAddChild(parentId: string) {
    setSelectedId(null);
    setAttachingId(null);
    startTransition(async () => {
      const result = await addNodeAction(mapId, parentId, "New node");
      setPendingFocusId(result.id);
    });
  }

  function handleDelete(nodeId: string) {
    const node = layoutNodes.find((n) => n.id === nodeId);
    if (!node || node.depth === 0) return;
    setSelectedId(null);
    setAttachingId(null);
    startTransition(async () => {
      await deleteNodeAction(mapId, nodeId);
    });
  }

  function handleAttachTask(nodeId: string, taskId: string, taskTitle: string) {
    setAttachingId(null);
    setSelectedId(null);
    startTransition(async () => {
      await attachTaskAction(mapId, nodeId, taskId, taskTitle);
    });
  }

  const selectedNode = selectedId
    ? layoutNodes.find((n) => n.id === selectedId)
    : null;
  const editingNode = editingId
    ? layoutNodes.find((n) => n.id === editingId)
    : null;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-neutral-50 select-none"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ cursor: isDraggingActive ? "grabbing" : "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={(e) => {
          if (hasDragged.current) return;
          const target = e.target as Element;
          if (!target.closest("[data-node-id]") && !editingId) {
            setSelectedId(null);
            setAttachingId(null);
          }
        }}
      >
        <g
          transform={`translate(${containerSize.w / 2 + pan.x} ${containerSize.h / 2 + pan.y}) scale(${zoom})`}
        >
          {edges.map(({ parent, child }) => {
            const mx = (parent.x + child.x) / 2;
            return (
              <path
                key={`${parent.id}-${child.id}`}
                d={`M ${parent.x} ${parent.y} C ${mx} ${parent.y} ${mx} ${child.y} ${child.x} ${child.y}`}
                fill="none"
                stroke={child.color}
                strokeWidth={1.5}
                strokeOpacity={0.5}
              />
            );
          })}

          {/* Pass 1: circles — rendered first so labels always paint on top */}
          {layoutNodes.map((node) => {
            const isRoot = node.depth === 0;
            const isSelected = node.id === selectedId;
            const r = isRoot ? 32 : 24;
            return (
              <g
                key={node.id}
                data-node-id={node.id}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  if (editingId) return;
                  setSelectedId((prev) => (prev === node.id ? null : node.id));
                  setAttachingId(null);
                }}
                onDoubleClick={() => {
                  setEditingId(node.id);
                  setEditValue(node.label);
                  setSelectedId(node.id);
                }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill={isRoot ? "#1e293b" : "white"}
                  stroke={isSelected ? "#6366f1" : node.color}
                  strokeWidth={isSelected ? 3 : 1.5}
                />
                {node.nodeType === "task" && (
                  <circle
                    cx={node.x + r - 7}
                    cy={node.y - r + 7}
                    r={5}
                    fill="#60a5fa"
                  />
                )}
              </g>
            );
          })}

          {/* Pass 2: non-selected labels first, selected label last — paint order = z-index */}
          {[
            ...layoutNodes.filter((n) => n.id !== selectedId),
            ...layoutNodes.filter((n) => n.id === selectedId),
          ].map((node) => {
            const isRoot = node.depth === 0;
            const isSelected = node.id === selectedId;
            if (isRoot) {
              return (
                <text
                  key={`lbl-${node.id}`}
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11}
                  fontWeight="500"
                  fill="white"
                  fontFamily="var(--font-dm-sans), sans-serif"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.label}
                </text>
              );
            }
            const estWidth = Math.max(node.label.length * 5.8, 28);
            const ly = node.y + node.labelYOffset;
            return (
              <g key={`lbl-${node.id}`} style={{ pointerEvents: "none" }}>
                <rect
                  x={node.x - estWidth / 2 - 4}
                  y={ly - 8}
                  width={estWidth + 8}
                  height={16}
                  fill={isSelected ? "#eef2ff" : "white"}
                  stroke={isSelected ? "#6366f1" : "none"}
                  strokeWidth={isSelected ? 1 : 0}
                  rx={2}
                />
                <text
                  x={node.x}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fill={isSelected ? "#1e293b" : "#374151"}
                  fontWeight={isSelected ? "500" : "normal"}
                  fontFamily="var(--font-dm-sans), sans-serif"
                  style={{ userSelect: "none" }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Inline edit overlay */}
      {editingNode &&
        (() => {
          const pos = getScreenPos(editingNode);
          return (
            <input
              ref={editRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") {
                  setEditingId(null);
                  setEditValue("");
                }
              }}
              onBlur={commitEdit}
              style={{
                position: "absolute",
                left: pos.left - 80,
                top: pos.top - 13,
                width: 160,
                zIndex: 10,
              }}
              className="rounded border border-indigo-400 bg-white px-2 py-1 text-xs text-neutral-900 shadow outline-none"
            />
          );
        })()}

      {/* Node toolbar */}
      {selectedNode &&
        !editingId &&
        (() => {
          const pos = getScreenPos(selectedNode);
          const isRoot = selectedNode.depth === 0;
          return (
            <div
              style={{
                position: "absolute",
                left: pos.left - 44,
                top: pos.top - (isRoot ? 52 : 44),
                zIndex: 20,
              }}
              className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white px-1.5 py-1 shadow-sm"
            >
              <button
                onClick={() => handleAddChild(selectedNode.id)}
                disabled={isPending}
                title="Add child"
                className="flex h-6 w-6 items-center justify-center rounded text-sm text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
              >
                +
              </button>
              {!isRoot && (
                <>
                  <button
                    onClick={() =>
                      setAttachingId((prev) => (prev ? null : selectedNode.id))
                    }
                    title="Attach task"
                    className="flex h-6 w-6 items-center justify-center rounded text-xs text-neutral-500 hover:bg-neutral-100"
                  >
                    ⚡
                  </button>
                  <button
                    onClick={() => handleDelete(selectedNode.id)}
                    disabled={isPending}
                    title="Delete node"
                    className="flex h-6 w-6 items-center justify-center rounded text-sm text-red-400 hover:bg-red-50 disabled:opacity-40"
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          );
        })()}

      {/* Task picker */}
      {attachingId &&
        selectedNode &&
        (() => {
          const pos = getScreenPos(selectedNode);
          return (
            <div
              style={{
                position: "absolute",
                left: pos.left - 100,
                top: pos.top - (selectedNode.depth === 0 ? 52 : 44) + 34,
                zIndex: 30,
                width: 220,
              }}
              className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-md"
            >
              <div className="border-b border-neutral-100 px-3 py-2 text-xs font-medium uppercase tracking-widest text-neutral-400">
                Attach task
              </div>
              <ul className="max-h-48 overflow-y-auto">
                {tasks.length === 0 ? (
                  <li className="px-3 py-2 text-xs text-neutral-400">
                    No open tasks
                  </li>
                ) : (
                  tasks.map((task) => (
                    <li key={task.id}>
                      <button
                        onClick={() =>
                          handleAttachTask(attachingId, task.id, task.title)
                        }
                        className="w-full px-3 py-2 text-left text-xs text-neutral-700 hover:bg-neutral-50"
                      >
                        {task.title}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })()}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1">
        <button
          onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)))}
          className="flex h-7 w-7 items-center justify-center rounded border border-neutral-200 bg-white text-sm text-neutral-600 hover:bg-neutral-50"
        >
          −
        </button>
        <span className="w-12 text-center text-xs text-neutral-400">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
          className="flex h-7 w-7 items-center justify-center rounded border border-neutral-200 bg-white text-sm text-neutral-600 hover:bg-neutral-50"
        >
          +
        </button>
      </div>
    </div>
  );
}
