import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ── Path to graph.json ─────────────────────────────────────
// On Windows: C:\Users\<name>\.zcode\memory\graph.json
// On Linux/Mac: /home/<name>/.zcode/memory/graph.json

function getGraphPath(): string {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  return path.join(home, ".zcode", "memory", "graph.json");
}

// ── Types ──────────────────────────────────────────────────

interface GraphEdge {
  from: string;
  to: string;
  type: string;
  weight: number;
  metadata: Record<string, unknown>;
}

interface GraphData {
  version: number;
  created_at: string;
  stats?: {
    nodes: number;
    edges: number;
    isolated: number;
  };
  edges: GraphEdge[];
  isolated_nodes?: string[];
}

interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  density: number;
  isolatedNodes: number;
  edgeTypes: Record<string, number>;
  topConnectedNodes: Array<{ id: string; degree: number }>;
}

// ── Read graph.json with retry ─────────────────────────────
// Python might be writing at the same time, so retry once.

function readGraphData(): GraphData {
  const graphPath = getGraphPath();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (!fs.existsSync(graphPath)) {
        return { version: 1, created_at: "", edges: [], isolated_nodes: [] };
      }
      const raw = fs.readFileSync(graphPath, "utf-8");
      return JSON.parse(raw) as GraphData;
    } catch (err) {
      if (attempt < 2) {
        // Wait a tiny bit and retry (Python might be mid-write)
        const start = Date.now();
        while (Date.now() - start < 100) {
          // busy-wait 100ms
        }
        continue;
      }
      throw new Error(
        `Failed to read graph.json after 3 attempts: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Should never reach here, but TypeScript needs it
  return { version: 1, created_at: "", edges: [], isolated_nodes: [] };
}

// ── Write graph.json atomically ────────────────────────────

function writeGraphData(data: GraphData): void {
  const graphPath = getGraphPath();
  const dir = path.dirname(graphPath);

  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Atomic write: write to temp file first, then rename
  const tmpPath = graphPath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmpPath, graphPath);
}

// ── Compute stats from graph data ──────────────────────────

function computeStats(data: GraphData): GraphStats {
  const edges = data.edges || [];

  // Collect all unique node IDs
  const nodeSet = new Set<string>();
  for (const edge of edges) {
    nodeSet.add(edge.from);
    nodeSet.add(edge.to);
  }
  for (const node of data.isolated_nodes || []) {
    nodeSet.add(node);
  }

  const nodeCount = nodeSet.size;
  const edgeCount = edges.length;

  // Density: ratio of actual edges to max possible edges in a directed graph
  const maxEdges = nodeCount * (nodeCount - 1);
  const density = maxEdges > 0 ? Number((edgeCount / maxEdges).toFixed(4)) : 0;

  // Isolated nodes (not present in any edge)
  const nodesInEdges = new Set<string>();
  for (const edge of edges) {
    nodesInEdges.add(edge.from);
    nodesInEdges.add(edge.to);
  }
  const isolatedNodes = [...nodeSet].filter((n) => !nodesInEdges.has(n)).length;

  // Edge type distribution
  const edgeTypes: Record<string, number> = {};
  for (const edge of edges) {
    edgeTypes[edge.type] = (edgeTypes[edge.type] || 0) + 1;
  }

  // Top connected nodes (by degree)
  const degreeMap: Record<string, number> = {};
  for (const edge of edges) {
    degreeMap[edge.from] = (degreeMap[edge.from] || 0) + 1;
    degreeMap[edge.to] = (degreeMap[edge.to] || 0) + 1;
  }
  const topConnectedNodes = Object.entries(degreeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, degree]) => ({ id, degree }));

  return { nodeCount, edgeCount, density, isolatedNodes, edgeTypes, topConnectedNodes };
}

// ── GET: Read graph, optionally filter ─────────────────────
// ?node=X     — edges involving node X
// ?type=T     — edges of type T
// ?stats=true — return only stats (no edge list)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeFilter = searchParams.get("node");
    const typeFilter = searchParams.get("type");
    const statsOnly = searchParams.get("stats") === "true";

    const data = readGraphData();

    // Return stats only
    if (statsOnly) {
      const stats = computeStats(data);
      return NextResponse.json({ stats });
    }

    // Filter edges
    let edges = data.edges || [];

    if (nodeFilter) {
      edges = edges.filter(
        (e) => e.from === nodeFilter || e.to === nodeFilter
      );
    }

    if (typeFilter) {
      edges = edges.filter((e) => e.type === typeFilter);
    }

    const stats = computeStats(data);

    return NextResponse.json({
      stats: {
        nodeCount: stats.nodeCount,
        edgeCount: stats.edgeCount,
        density: stats.density,
        isolatedNodes: stats.isolatedNodes,
        edgeTypes: stats.edgeTypes,
      },
      filteredCount: edges.length,
      edges,
    });
  } catch (err) {
    console.error("[graph/route.ts] GET error:", err);
    return NextResponse.json(
      {
        error: "Failed to read graph data",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

// ── POST: Add an edge ──────────────────────────────────────
// Body: { from, to, type, weight?, metadata? }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, type, weight, metadata } = body as {
      from?: string;
      to?: string;
      type?: string;
      weight?: number;
      metadata?: Record<string, unknown>;
    };

    // Validate required fields
    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing required fields: from, to" },
        { status: 400 }
      );
    }

    const edgeType = type || "related_to";
    const edgeWeight = typeof weight === "number" ? weight : 1.0;
    const edgeMetadata = metadata || {};

    const data = readGraphData();

    // Check for duplicate edge (same from + to + type)
    const exists = (data.edges || []).some(
      (e) => e.from === from && e.to === to && e.type === edgeType
    );

    if (exists) {
      return NextResponse.json(
        { error: "Edge already exists", from, to, type: edgeType },
        { status: 409 }
      );
    }

    // Add the new edge
    const newEdge: GraphEdge = {
      from,
      to,
      type: edgeType,
      weight: edgeWeight,
      metadata: edgeMetadata,
    };

    data.edges = data.edges || [];
    data.edges.push(newEdge);

    writeGraphData(data);

    return NextResponse.json(
      { message: "Edge added", edge: newEdge },
      { status: 201 }
    );
  } catch (err) {
    console.error("[graph/route.ts] POST error:", err);
    return NextResponse.json(
      {
        error: "Failed to add edge",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

// ── DELETE: Remove an edge ─────────────────────────────────
// Body: { from, to, type? }

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, type } = body as {
      from?: string;
      to?: string;
      type?: string;
    };

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing required fields: from, to" },
        { status: 400 }
      );
    }

    const data = readGraphData();
    const originalLength = (data.edges || []).length;

    // If type is specified, only remove edges with that type
    data.edges = (data.edges || []).filter((e) => {
      if (e.from !== from || e.to !== to) return true;
      if (type && e.type !== type) return true;
      return false;
    });

    if (data.edges.length === originalLength) {
      return NextResponse.json(
        { error: "Edge not found", from, to, type },
        { status: 404 }
      );
    }

    writeGraphData(data);

    return NextResponse.json({
      message: "Edge removed",
      from,
      to,
      type: type || "all types",
      removedCount: originalLength - data.edges.length,
    });
  } catch (err) {
    console.error("[graph/route.ts] DELETE error:", err);
    return NextResponse.json(
      {
        error: "Failed to remove edge",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
