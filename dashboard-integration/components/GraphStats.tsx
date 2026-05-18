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

// ── Animated bar chart ─────────────────────────────────────

interface BarChartProps {
  data: Record<string, number>;
}

function BarChart({ data }: BarChartProps) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  const maxVal = Math.max(...entries.map(([, v]) => v));

  return (
    <div className="space-y-2">
      {entries.map(([type, count]) => {
        const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;
        const color = getTypeColor(type);
        const glow = getTypeGlow(type);
        return (
          <div key={type} className="group flex items-center gap-2">
            <span
              className="text-[10px] w-24 truncate text-right transition-colors duration-200 group-hover:text-zinc-200"
              style={{ color: glow }}
            >
              {type}
            </span>
            <div className="flex-1 h-2.5 bg-zinc-800/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}, ${glow})`,
                  boxShadow: `0 0 8px ${color}44`,
                }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 w-8 text-right font-mono">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Stat item with glow ────────────────────────────────────

function StatItem({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between items-center text-xs group">
      <span className="text-zinc-500 group-hover:text-zinc-400 transition-colors">{label}</span>
      <span
        className="font-mono font-medium"
        style={{ color: color || "#e2e8f0" }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Main GraphStats component ──────────────────────────────

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg h-32 animate-pulse"
            style={{
              background: "linear-gradient(135deg, #0f172a, #1e293b)",
              border: "1px solid #1e293b44",
            }}
          />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div
        className="rounded-lg p-4"
        style={{
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          border: "1px solid #7f1d1d44",
        }}
      >
        <p className="text-red-400 text-sm">{error || "No stats available"}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Summary card */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: "1px solid #38bdf822",
          boxShadow: "0 0 20px #38bdf808",
        }}
      >
        {/* Header accent line */}
        <div className="h-0.5" style={{ background: "linear-gradient(90deg, #38bdf8, #38bdf800)" }} />
        <div className="px-3 pt-3 pb-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sky-400" style={{ boxShadow: "0 0 6px #38bdf888" }} />
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Graph Summary</h3>
        </div>
        <div className="px-3 pb-3 space-y-1.5">
          <StatItem label="Nodes" value={stats.nodeCount} color="#38bdf8" />
          <StatItem label="Edges" value={stats.edgeCount} color="#a855f7" />
          <StatItem label="Density" value={stats.density} color="#2dd4bf" />
          <StatItem label="Isolated" value={stats.isolatedNodes} color="#fb923c" />
        </div>
      </div>

      {/* Edge type distribution */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: "1px solid #a855f722",
          boxShadow: "0 0 20px #a855f708",
        }}
      >
        <div className="h-0.5" style={{ background: "linear-gradient(90deg, #a855f7, #a855f700)" }} />
        <div className="px-3 pt-3 pb-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-400" style={{ boxShadow: "0 0 6px #a855f788" }} />
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Edge Types</h3>
        </div>
        <div className="px-3 pb-3">
          {Object.keys(stats.edgeTypes).length > 0 ? (
            <BarChart data={stats.edgeTypes} />
          ) : (
            <p className="text-zinc-600 text-xs py-2">No edges yet</p>
          )}
        </div>
      </div>

      {/* Top connected nodes */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: "1px solid #2dd4bf22",
          boxShadow: "0 0 20px #2dd4bf08",
        }}
      >
        <div className="h-0.5" style={{ background: "linear-gradient(90deg, #2dd4bf, #2dd4bf00)" }} />
        <div className="px-3 pt-3 pb-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-400" style={{ boxShadow: "0 0 6px #2dd4bf88" }} />
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Most Connected</h3>
        </div>
        <div className="px-3 pb-3">
          {stats.topConnectedNodes.length > 0 ? (
            <div className="space-y-1">
              {stats.topConnectedNodes.slice(0, 8).map((node, i) => {
                const maxDeg = stats.topConnectedNodes[0]?.degree || 1;
                const pct = (node.degree / maxDeg) * 100;
                return (
                  <div key={node.id} className="flex items-center gap-2 text-xs group">
                    <span className="text-zinc-600 w-3 text-right font-mono">{i + 1}</span>
                    <span className="text-zinc-400 font-mono truncate flex-1 group-hover:text-zinc-200 transition-colors">
                      {node.id}
                    </span>
                    <div className="w-12 h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, #2dd4bf, #5eead4)",
                          boxShadow: "0 0 4px #2dd4bf44",
                        }}
                      />
                    </div>
                    <span className="text-zinc-500 w-5 text-right font-mono">{node.degree}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-zinc-600 text-xs py-2">No nodes yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
