import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";

// ── Python bridge ──────────────────────────────────────────

function getToolPath(tool: string): string {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const toolkitPath = process.env.ZAI_TOOLKIT_PATH || path.join(home, ".zcode", "Zai-agent-toolkit");
  const userToolsPath = path.join(home, ".zcode", "tools");

  const userTool = path.join(userToolsPath, tool);
  const toolkitTool = path.join(toolkitPath, "tools", tool);

  if (fs.existsSync(userTool)) return userTool;
  if (fs.existsSync(toolkitTool)) return toolkitTool;
  return toolkitTool;
}

function runPython(tool: string, args: string[]): Promise<string> {
  const toolPath = getToolPath(tool);
  return new Promise((resolve, reject) => {
    execFile("python", [toolPath, ...args], {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
      windowsHide: true,
    }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
        return;
      }
      resolve(stdout);
    });
  });
}

// ── Graph.json reader (for fast stats, no Python needed) ───

function getGraphPath(): string {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  return path.join(home, ".zcode", "memory", "graph.json");
}

interface GraphData {
  version: number;
  edges: Array<{ from: string; to: string; type: string; weight: number }>;
  isolated_nodes?: string[];
}

function readGraphData(): GraphData | null {
  const graphPath = getGraphPath();
  try {
    if (!fs.existsSync(graphPath)) return null;
    const raw = fs.readFileSync(graphPath, "utf-8");
    return JSON.parse(raw) as GraphData;
  } catch {
    return null;
  }
}

// ── GET: Dashboard stats ───────────────────────────────────
// Aggregates: entry counts by type, graph stats, experience counts

export async function GET() {
  try {
    // 1. Count entries per type (run memory_cli.py list for each type)
    const types = ["knowledge", "pattern", "command", "project", "session", "template", "experience"];
    const typeCounts: Record<string, number> = {};

    // Try to get counts from Python
    for (const type of types) {
      try {
        const output = await runPython("memory_cli.py", ["list", type, "--limit", "1"]);
        // Parse count from output — look for "N entries" or count lines
        const countMatch = output.match(/(\d+)\s*entries?/i);
        if (countMatch) {
          typeCounts[type] = parseInt(countMatch[1]);
        } else {
          // Count lines that match entry format
          const entryLines = output.split("\n").filter(l => l.trim().match(/^\[\w+\]/));
          typeCounts[type] = entryLines.length;
        }
      } catch {
        typeCounts[type] = 0;
      }
    }

    const totalEntries = Object.values(typeCounts).reduce((a, b) => a + b, 0);

    // 2. Graph stats (fast, from file)
    const graphData = readGraphData();
    const graphStats = graphData
      ? {
          nodeCount: new Set([
            ...graphData.edges.map(e => e.from),
            ...graphData.edges.map(e => e.to),
            ...(graphData.isolated_nodes || []),
          ]).size,
          edgeCount: graphData.edges.length,
          edgeTypes: graphData.edges.reduce<Record<string, number>>((acc, e) => {
            acc[e.type] = (acc[e.type] || 0) + 1;
            return acc;
          }, {}),
        }
      : { nodeCount: 0, edgeCount: 0, edgeTypes: {} };

    // 3. Experience stats (quick)
    let experienceStats = { total: 0, verified: 0, unverified: 0, conflict: 0 };
    try {
      const expOutput = await runPython("session_summary.py", ["list"]);
      const lines = expOutput.split("\n").filter(l => l.trim());
      experienceStats.total = lines.filter(l => l.match(/^\[/)).length;
      experienceStats.verified = lines.filter(l => l.includes("verified")).length;
      experienceStats.unverified = lines.filter(l => l.includes("unverified")).length;
      experienceStats.conflict = lines.filter(l => l.includes("conflict")).length;
    } catch {
      // ignore
    }

    return NextResponse.json({
      entries: { byType: typeCounts, total: totalEntries },
      graph: graphStats,
      experience: experienceStats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[stats/route.ts] GET error:", err);
    return NextResponse.json(
      { error: "Failed to compute stats", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
