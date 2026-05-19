/**
 * Client-side utility for Memory Dashboard API calls.
 *
 * Covers: graph, entries, search, experience, stats
 */

// ── Graph Types ─────────────────────────────────────────────

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

// ── Memory Entry Types ──────────────────────────────────────

export interface MemoryEntry {
  id: string;
  type: string;
  tags: string[];
  source: string;
  verification_status: string;
  raw: string;
}

export interface SearchResult {
  id: string;
  type: string;
  content: string;
  distance: number;
  tags: string[];
  source: string;
  verification_status: string;
}

// ── Experience Types ────────────────────────────────────────

export interface ExperienceEntry {
  id: string;
  title: string;
  experience_type: string;
  verification_status: string;
  good_count: number;
  bad_count: number;
  source_type: string;
  preview: string;
}

// ── Dashboard Stats Type ────────────────────────────────────

export interface DashboardStats {
  entries: {
    byType: Record<string, number>;
    total: number;
  };
  graph: {
    nodeCount: number;
    edgeCount: number;
    edgeTypes: Record<string, number>;
  };
  experience: {
    total: number;
    verified: number;
    unverified: number;
    conflict: number;
  };
  timestamp: string;
}

// ════════════════════════════════════════════════════════════
// Graph API
// ════════════════════════════════════════════════════════════

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
    throw new Error(body.error || `Failed to fetch graph (HTTP ${res.status})`);
  }

  return res.json();
}

export async function fetchGraphStats(): Promise<GraphStats> {
  const res = await fetch("/api/memory/graph?stats=true");

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch graph stats (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.stats;
}

export async function addEdge(
  from: string, to: string, type: string, weight?: number
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

export async function removeEdge(
  from: string, to: string, type?: string
): Promise<{ message: string; removedCount: number }> {
  const res = await fetch("/api/memory/graph", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, type }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to remove edge (HTTP ${res.status})`);
  }

  return res.json();
}

export async function fetchRelatedNodes(nodeId: string): Promise<RelatedResponse> {
  const res = await fetch(`/api/memory/related-graph?id=${encodeURIComponent(nodeId)}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch related nodes (HTTP ${res.status})`);
  }

  return res.json();
}

// ════════════════════════════════════════════════════════════
// Memory Entries API
// ════════════════════════════════════════════════════════════

export async function fetchEntries(type: string, limit = 50): Promise<{ entries: MemoryEntry[]; count: number }> {
  const res = await fetch(`/api/memory/entries?type=${type}&limit=${limit}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch entries (HTTP ${res.status})`);
  }

  return res.json();
}

// ════════════════════════════════════════════════════════════
// Search API
// ════════════════════════════════════════════════════════════

export async function searchMemory(
  query: string, type?: string, limit = 20
): Promise<{ results: SearchResult[]; count: number; query: string }> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (type) params.set("type", type);

  const res = await fetch(`/api/memory/search?${params}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Search failed (HTTP ${res.status})`);
  }

  return res.json();
}

// ════════════════════════════════════════════════════════════
// Experience API
// ════════════════════════════════════════════════════════════

export async function fetchExperiences(
  action: "list" | "query" = "list", query?: string
): Promise<{ entries: ExperienceEntry[]; count: number }> {
  const params = new URLSearchParams({ action });
  if (action === "query" && query) params.set("q", query);

  const res = await fetch(`/api/memory/experience?${params}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch experiences (HTTP ${res.status})`);
  }

  return res.json();
}

export async function createExperience(data: {
  title: string; good?: string; bad?: string; why?: string;
}): Promise<{ message: string }> {
  const res = await fetch("/api/memory/experience", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "manual", ...data }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to create experience (HTTP ${res.status})`);
  }

  return res.json();
}

export async function verifyExperience(id: string, status: string): Promise<{ message: string }> {
  const res = await fetch("/api/memory/experience", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify", id, status }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to verify experience (HTTP ${res.status})`);
  }

  return res.json();
}

// ════════════════════════════════════════════════════════════
// Stats API
// ════════════════════════════════════════════════════════════

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch("/api/memory/stats");

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch stats (HTTP ${res.status})`);
  }

  return res.json();
}
