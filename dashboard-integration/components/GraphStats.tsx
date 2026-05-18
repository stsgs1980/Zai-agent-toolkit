"use client";

import React, { useEffect, useState } from "react";
import { fetchGraphStats, type GraphStats } from "@/lib/graph-client";

// ── Neon color map ─────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
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

const TYPE_GLOW: Record<string, string> = {
  parent_dir: "#94a3b8",
  imports: "#c084fc",
  same_session: "#7dd3fc",
  depends_on: "#5eead4",
  follow_up: "#86efac",
  fixed_by: "#fca5a5",
  implements: "#fde68a",
  modifies: "#fdba74",
  related_to: "#93c5fd",
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || "#60a5fa";
}

function getTypeGlow(type: string): string {
  return TYPE_GLOW[type] || "#93c5fd";
}

// ── Main GraphStats component — compact horizontal strip ───

export function GraphStats() {
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchGraphStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div
        className="rounded-lg h-10 animate-pulse"
        style={{
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          border: "1px solid #1e293b44",
        }}
      />
    );
  }

  if (error || !stats) {
    return (
      <div
        className="rounded-lg px-4 py-2"
        style={{
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          border: "1px solid #7f1d1d44",
        }}
      >
        <p className="text-red-400 text-xs">{error || "No stats available"}</p>
      </div>
    );
  }

  const edgeEntries = Object.entries(stats.edgeTypes).sort((a, b) => b[1] - a[1]);
  const maxEdgeVal = edgeEntries.length > 0 ? edgeEntries[0][1] : 1;
  const topNodes = stats.topConnectedNodes.slice(0, 5);
  const maxDeg = topNodes.length > 0 ? topNodes[0].degree : 1;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        border: "1px solid #1e293b44",
        boxShadow: "0 0 15px #0f172a",
      }}
    >
      {/* Accent line */}
      <div
        className="h-0.5"
        style={{ background: "linear-gradient(90deg, #38bdf855, #a855f755, #2dd4bf55, transparent)" }}
      />

      <div className="flex flex-wrap items-stretch gap-0 divide-x divide-zinc-800/50">
        {/* ── Summary stats (compact) ── */}
        <div className="flex items-center gap-4 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400" style={{ boxShadow: "0 0 6px #38bdf888" }} />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Nodes</span>
            <span className="text-sm font-mono font-medium text-sky-400">{stats.nodeCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" style={{ boxShadow: "0 0 6px #a855f788" }} />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Edges</span>
            <span className="text-sm font-mono font-medium text-purple-400">{stats.edgeCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400" style={{ boxShadow: "0 0 6px #2dd4bf88" }} />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Density</span>
            <span className="text-sm font-mono font-medium text-teal-400">{stats.density}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" style={{ boxShadow: "0 0 6px #fb923c88" }} />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Isolated</span>
            <span className="text-sm font-mono font-medium text-orange-400">{stats.isolatedNodes}</span>
          </div>
        </div>

        {/* ── Edge type distribution (compact horizontal bars) ── */}
        <div className="flex-1 px-4 py-2.5 min-w-0">
          <div className="flex items-center gap-1 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" style={{ boxShadow: "0 0 6px #a855f788" }} />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Edge Types</span>
          </div>
          <div className="flex items-end gap-2">
            {edgeEntries.map(([type, count]) => {
              const pct = (count / maxEdgeVal) * 100;
              const color = getTypeColor(type);
              const glow = getTypeGlow(type);
              return (
                <div key={type} className="flex flex-col items-center gap-0.5 group min-w-0">
                  <div
                    className="w-6 rounded-sm transition-all duration-500"
                    style={{
                      height: `${Math.max(4, pct * 0.3)}px`,
                      background: `linear-gradient(180deg, ${glow}, ${color})`,
                      boxShadow: `0 0 6px ${color}44`,
                    }}
                  />
                  <span
                    className="text-[8px] leading-none group-hover:text-zinc-200 transition-colors truncate max-w-[48px]"
                    style={{ color: glow }}
                  >
                    {type}
                  </span>
                  <span className="text-[8px] text-zinc-600 font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Top connected nodes (compact list) ── */}
        <div className="px-4 py-2.5 min-w-0">
          <div className="flex items-center gap-1 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400" style={{ boxShadow: "0 0 6px #2dd4bf88" }} />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Top Connected</span>
          </div>
          <div className="flex items-center gap-3">
            {topNodes.map((node, i) => {
              const pct = (node.degree / maxDeg) * 100;
              return (
                <div key={node.id} className="flex flex-col items-center gap-0.5 group min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-zinc-600 font-mono">{node.degree}</span>
                    <div className="w-8 h-1 bg-zinc-800/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, #2dd4bf, #5eead4)",
                          boxShadow: "0 0 4px #2dd4bf44",
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[8px] text-zinc-500 font-mono truncate max-w-[56px] group-hover:text-zinc-200 transition-colors">
                    {node.id}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
