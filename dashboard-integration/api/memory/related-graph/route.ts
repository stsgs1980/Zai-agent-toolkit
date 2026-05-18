import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
  edges: GraphEdge[];
}

interface RelatedNode {
  id: string;
  edgeType: string;
  direction: "incoming" | "outgoing";
  weight: number;
  metadata: Record<string, unknown>;
}

// ── Path to graph.json ─────────────────────────────────────

function getGraphPath(): string {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  return path.join(home, ".zcode", "memory", "graph.json");
}

// ── Read graph.json with retry ─────────────────────────────

function readGraphData(): GraphData {
  const graphPath = getGraphPath();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (!fs.existsSync(graphPath)) {
        return { version: 1, edges: [] };
      }
      const raw = fs.readFileSync(graphPath, "utf-8");
      return JSON.parse(raw) as GraphData;
    } catch {
      if (attempt < 2) {
        const start = Date.now();
        while (Date.now() - start < 100) {
          // busy-wait 100ms
        }
        continue;
      }
      return { version: 1, edges: [] };
    }
  }

  return { version: 1, edges: [] };
}

// ── GET: Fast structural relationships ─────────────────────
// ?id=X — find all neighbors of node X in the graph
//
// This replaces the old /api/memory/related route which called the LLM.
// If the graph has no edges for the requested node, it falls back to
// the LLM approach by returning a flag so the frontend can decide.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get("id");

    if (!nodeId) {
      return NextResponse.json(
        { error: "Missing required query parameter: id" },
        { status: 400 }
      );
    }

    const data = readGraphData();
    const edges = data.edges || [];

    // Find all edges involving this node
    const incoming: RelatedNode[] = [];
    const outgoing: RelatedNode[] = [];

    for (const edge of edges) {
      if (edge.to === nodeId) {
        incoming.push({
          id: edge.from,
          edgeType: edge.type,
          direction: "incoming",
          weight: edge.weight,
          metadata: edge.metadata || {},
        });
      }
      if (edge.from === nodeId) {
        outgoing.push({
          id: edge.to,
          edgeType: edge.type,
          direction: "outgoing",
          weight: edge.weight,
          metadata: edge.metadata || {},
        });
      }
    }

    const allRelated = [...incoming, ...outgoing];

    // If no graph edges exist for this node, signal the fallback
    if (allRelated.length === 0) {
      return NextResponse.json({
        source: "graph",
        nodeId,
        related: [],
        totalEdges: edges.length,
        fallbackToLLM: true,
        message:
          "No graph edges found for this node. " +
          "The frontend should fall back to the LLM-based /api/memory/related endpoint.",
      });
    }

    // Sort by weight (highest first) then by edge type
    allRelated.sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.edgeType.localeCompare(b.edgeType);
    });

    // Group by edge type for easy display
    const byType: Record<string, RelatedNode[]> = {};
    for (const node of allRelated) {
      if (!byType[node.edgeType]) {
        byType[node.edgeType] = [];
      }
      byType[node.edgeType].push(node);
    }

    return NextResponse.json({
      source: "graph",
      nodeId,
      related: allRelated,
      byType,
      stats: {
        incoming: incoming.length,
        outgoing: outgoing.length,
        total: allRelated.length,
        types: Object.keys(byType),
      },
      fallbackToLLM: false,
    });
  } catch (err) {
    console.error("[related-graph/route.ts] GET error:", err);
    return NextResponse.json(
      {
        error: "Failed to find related nodes",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
