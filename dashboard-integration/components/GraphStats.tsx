"use client";

import React, { useEffect, useState } from "react";
import { fetchGraphStats, type GraphStats } from "@/lib/graph-client";

// ── Color map for edge types ───────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  parent_dir: "#95a5a6",
  imports: "#8e44ad",
  same_session: "#2980b9",
  depends_on: "#16a085",
  follow_up: "#27ae60",
  fixed_by: "#c0392b",
  implements: "#f39c12",
  modifies: "#e67e22",
  related_to: "#3498db",
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || "#4a90d9";
}

// ── Simple bar chart using divs ────────────────────────────

interface BarChartProps {
  data: Record<string, number>;
}

function BarChart({ data }: BarChartProps) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  const maxVal = Math.max(...entries.map(([, v]) => v));

  return (
    <div className="space-y-1.5">
      {entries.map(([type, count]) => {
        const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;
        return (
          <div key={type} className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-24 truncate text-right">
              {type}
            </span>
            <div className="flex-1 h-3 bg-zinc-800 rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: getTypeColor(type),
                }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 w-8 text-right">
              {count}
            </span>
          </div>
        );
      })}
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
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <p className="text-zinc-400 text-sm">Loading graph stats...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <p className="text-red-400 text-sm">
          {error || "No stats available"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Summary card */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg">
        <div className="px-3 pt-3 pb-1">
          <h3 className="text-sm text-zinc-300 font-medium">Graph Summary</h3>
        </div>
        <div className="px-3 pb-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Nodes</span>
            <span className="text-zinc-200 font-mono">{stats.nodeCount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Edges</span>
            <span className="text-zinc-200 font-mono">{stats.edgeCount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Density</span>
            <span className="text-zinc-200 font-mono">{stats.density}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Isolated</span>
            <span className="text-zinc-200 font-mono">
              {stats.isolatedNodes}
            </span>
          </div>
        </div>
      </div>

      {/* Edge type distribution */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg">
        <div className="px-3 pt-3 pb-1">
          <h3 className="text-sm text-zinc-300 font-medium">Edge Types</h3>
        </div>
        <div className="px-3 pb-3">
          {Object.keys(stats.edgeTypes).length > 0 ? (
            <BarChart data={stats.edgeTypes} />
          ) : (
            <p className="text-zinc-500 text-xs">No edges yet</p>
          )}
        </div>
      </div>

      {/* Top connected nodes */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg">
        <div className="px-3 pt-3 pb-1">
          <h3 className="text-sm text-zinc-300 font-medium">Most Connected</h3>
        </div>
        <div className="px-3 pb-3">
          {stats.topConnectedNodes.length > 0 ? (
            <div className="space-y-1">
              {stats.topConnectedNodes.slice(0, 8).map((node, i) => (
                <div
                  key={node.id}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="text-zinc-500 w-4 text-right">
                    {i + 1}
                  </span>
                  <span className="text-zinc-300 font-mono truncate flex-1">
                    {node.id}
                  </span>
                  <span className="text-zinc-500">{node.degree}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-xs">No nodes yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
