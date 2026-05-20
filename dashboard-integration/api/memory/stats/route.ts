import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { readdir } from "fs/promises";
import { runPython } from "@/lib/memory/bridge";
import { MemoryCache } from "@/lib/memory/cache";

const cache = MemoryCache.getInstance();

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

// ── Skills counter (filesystem, no Python) ─────────────────

async function countSkills(): Promise<number> {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const candidates = [
    path.join(home, ".zcode", "Zai-agent-toolkit", "skills"),
  ];
  for (const dir of candidates) {
    try {
      const entries = await readdir(dir);
      // Count subdirs that contain SKILL.md
      let count = 0;
      for (const entry of entries) {
        try {
          const skillPath = path.join(dir, entry, "SKILL.md");
          fs.accessSync(skillPath);
          count++;
        } catch { /* not a skill dir */ }
      }
      return count;
    } catch { /* next candidate */ }
  }
  return 0;
}

// ── GET: Dashboard stats ───────────────────────────────────

export async function GET(req: Request) {
  try {
    // ?nocache=1 bypasses cache — use after code updates
    const url = new URL(req.url);
    const nocache = url.searchParams.get('nocache') === '1';
    if (nocache) cache.invalidate('stats');

    return await cache.getOrFetch("stats", async () => {
      // 1. Count entries per type using export (fast, reliable JSON)
      const types = ["knowledge", "pattern", "command", "project", "session", "template", "experience"];
      const typeCounts: Record<string, number> = {};
      const todayCounts: Record<string, number> = {};
      let totalToday = 0;

      // Today's date prefix for matching: "20260521"
      const todayPrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");

      // Run exports in parallel
      const exportPromises = types.map(async (type) => {
        try {
          const output = await runPython("memory_cli.py", ["export", type]);
          const data = JSON.parse(output) as { count: number; entries?: Array<{ id: string; metadata?: Record<string, string> }> };
          typeCounts[type] = data.count || 0;

          // Count entries created today
          let todayCount = 0;
          if (data.entries && Array.isArray(data.entries)) {
            for (const entry of data.entries) {
              // Fast: check entry ID prefix (format: type_YYYYMMDD_HHMMSS)
              if (entry.id && entry.id.includes(todayPrefix)) {
                todayCount++;
              }
              // Fallback: check metadata.created_at
              else if (entry.metadata?.created_at) {
                const dateStr = entry.metadata.created_at.slice(0, 10).replace(/-/g, "");
                if (dateStr === todayPrefix) todayCount++;
              }
            }
          }
          todayCounts[type] = todayCount;
          totalToday += todayCount;
        } catch {
          typeCounts[type] = 0;
          todayCounts[type] = 0;
        }
      });

      await Promise.all(exportPromises);

      const totalEntries = Object.values(typeCounts).reduce((a, b) => a + b, 0);

      // 2. Graph stats (fast, from file — no Python needed)
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

      // 3. Experience stats
      let experienceStats = { total: 0, verified: 0, unverified: 0, conflict: 0, today: 0 };
      try {
        const expOutput = await runPython("session_summary.py", ["list"]);
        const lines = expOutput.split("\n").filter(l => l.trim());
        experienceStats.total = lines.filter(l => l.match(/^\[/)).length;
        experienceStats.verified = lines.filter(l => l.includes("verified")).length;
        experienceStats.unverified = lines.filter(l => l.includes("unverified")).length;
        experienceStats.conflict = lines.filter(l => l.includes("conflict")).length;
        experienceStats.today = lines.filter(l => l.includes(todayPrefix)).length;
      } catch {
        // session_summary.py may not have entries yet
      }

      // 4. Tools counts (filesystem, no Python)
      let skillsCount = 0;
      try {
        skillsCount = await countSkills();
      } catch (e) {
        console.warn("[stats] countSkills failed:", e);
      }

      const result = {
        entries: { byType: typeCounts, total: totalEntries, todayByType: todayCounts, today: totalToday },
        graph: { nodeCount: graphStats.nodeCount, edgeCount: graphStats.edgeCount },
        experience: experienceStats,
        tools: { skills: skillsCount, graphNodes: graphStats.nodeCount, graphEdges: graphStats.edgeCount },
        timestamp: new Date().toISOString(),
      };

      console.log(`[stats] tools: skills=${skillsCount}, graphNodes=${graphStats.nodeCount}, graphEdges=${graphStats.edgeCount}`);

      return NextResponse.json(result);
    });
  } catch (err) {
    console.error("[stats/route.ts] GET error:", err);
    return NextResponse.json(
      { error: "Failed to compute stats", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
