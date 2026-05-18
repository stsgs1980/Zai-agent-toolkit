// ── Neon color palette for graph visualization ─────────────

export const EDGE_COLORS: Record<string, string> = {
  parent_dir: "#64748b",
  imports: "#a855f7",
  same_session: "#38bdf8",
  depends_on: "#2dd4bf",
  follow_up: "#4ade80",
  fixed_by: "#f87171",
  implements: "#fbbf24",
  modifies: "#fb923c",
  related_to: "#60a5fa",
};

export const EDGE_GLOW: Record<string, string> = {
  parent_dir: "#64748b",
  imports: "#c084fc",
  same_session: "#7dd3fc",
  depends_on: "#5eead4",
  follow_up: "#86efac",
  fixed_by: "#fca5a5",
  implements: "#fde68a",
  modifies: "#fdba74",
  related_to: "#93c5fd",
};

export const NODE_COLORS: Record<string, string> = {
  session: "#38bdf8",
  task: "#4ade80",
  bug: "#f87171",
  knowledge: "#a855f7",
  commit: "#fb923c",
  src: "#2dd4bf",
  REQ: "#fbbf24",
};

export const NODE_GLOW: Record<string, string> = {
  session: "#7dd3fc",
  task: "#86efac",
  bug: "#fca5a5",
  knowledge: "#c084fc",
  commit: "#fdba74",
  src: "#5eead4",
  REQ: "#fde68a",
};

// ── Helpers ───────────────────────────────────────────────

export function classifyNode(id: string): string {
  const lower = id.toLowerCase();
  for (const prefix of Object.keys(NODE_COLORS)) {
    if (lower.startsWith(prefix.toLowerCase())) return prefix;
  }
  if (id.includes("/") || id.includes("\\")) return "src";
  return "default";
}

export function getNodeColor(id: string): string {
  return NODE_COLORS[classifyNode(id)] || "#60a5fa";
}

export function getNodeGlow(id: string): string {
  return NODE_GLOW[classifyNode(id)] || "#93c5fd";
}
