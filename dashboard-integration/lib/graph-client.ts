/**
 * Client-side utility for graph API calls.
 *
 * All functions call the Next.js API routes defined in
 * dashboard-integration/api/memory/graph/
 */

// ── Types ──────────────────────────────────────────────────

export interface GraphEdge {
  from: string;
  to: string;
  type: string;
  weight: number;
  metadata: Record<string, unknown>;
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  density: number;
  isolatedNodes: number;
  edgeTypes: Record<string, number>;
  topConnectedNodes: Array<{ id: string; degree: number }>;
}

export interface GraphResponse {
  stats: {
    nodeCount: number;
    edgeCount: number;
    density: number;
    isolatedNodes: number;
    edgeTypes: Record<string, number>;
  };
  filteredCount: number;
  edges: GraphEdge[];
}

export interface RelatedNode {
  id: string;
  edgeType: string;
  direction: "incoming" | "outgoing";
  weight: number;
  metadata: Record<string, unknown>;
}

export interface RelatedResponse {
  source: "graph";
  nodeId: string;
  related: RelatedNode[];
  byType: Record<string, RelatedNode[]>;
  stats: {
    incoming: number;
    outgoing: number;
    total: number;
    types: string[];
  };
  fallbackToLLM: boolean;
}

// ── Fetch graph edges (with optional filter) ───────────────

export async function fetchGraph(
  filter?: { node?: string; type?: string }
): Promise<GraphResponse> {
  const params = new URLSearchParams();
  if (filter?.node) params.set("node", filter.node);
  if (filter?.type) params.set("type", filter.type);

  const query = params.toString();
  const url = `/api/memory/graph${query ? `?${query}` : ""}`;

  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.error || `Failed to fetch graph (HTTP ${res.status})`
    );
  }

  return res.json();
}

// ── Fetch graph stats only ─────────────────────────────────

export async function fetchGraphStats(): Promise<GraphStats> {
  const res = await fetch("/api/memory/graph?stats=true");

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.error || `Failed to fetch graph stats (HTTP ${res.status})`
    );
  }

  const data = await res.json();
  return data.stats;
}

// ── Add an edge ────────────────────────────────────────────

export async function addEdge(
  from: string,
  to: string,
  type: string,
  weight?: number
): Promise<{ message: string; edge: GraphEdge }> {
  const res = await fetch("/api/memory/graph", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, type, weight }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to add edge (HTTP ${res.status})`);
  }

  return res.json();
}

// ── Remove an edge ─────────────────────────────────────────

export async function removeEdge(
  from: string,
  to: string,
  type?: string
): Promise<{ message: string; removedCount: number }> {
  const res = await fetch("/api/memory/graph", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, type }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.error || `Failed to remove edge (HTTP ${res.status})`
    );
  }

  return res.json();
}

// ── Fetch related nodes (fast graph-based lookup) ──────────

export async function fetchRelatedNodes(
  nodeId: string
): Promise<RelatedResponse> {
  const res = await fetch(`/api/memory/related-graph?id=${encodeURIComponent(nodeId)}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.error || `Failed to fetch related nodes (HTTP ${res.status})`
    );
  }

  return res.json();
}
