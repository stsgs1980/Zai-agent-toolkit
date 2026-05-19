"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { fetchGraph, type GraphEdge, type GraphStats } from "@/lib/graph-client";
import { NodeDetail } from "./graph/NodeDetail";
import { EdgeFilter } from "./graph/EdgeFilter";
import { useForceGraph } from "./graph/useForceGraph";

// ── Main GraphViewer component ─────────────────────────────

interface GraphViewerProps {
  onNodeClick?: (nodeId: string) => void;
}

export function GraphViewer({ onNodeClick }: GraphViewerProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [allEdgeTypes, setAllEdgeTypes] = useState<string[]>([]);

  // Stable refs for render-on-demand
  const selectedNodeRef = useRef<string | null>(null);
  const hoveredNodeRef = useRef<string | null>(null);
  const onNodeClickRef = useRef(onNodeClick);

  useEffect(() => { selectedNodeRef.current = selectedNode; }, [selectedNode]);
  useEffect(() => { hoveredNodeRef.current = hoveredNode; }, [hoveredNode]);
  useEffect(() => { onNodeClickRef.current = onNodeClick; }, [onNodeClick]);

  // Zoom & pan
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const [zoomDisplay, setZoomDisplay] = useState(100);

  // Force graph hook
  const { getDrawFn } = useForceGraph({
    canvasRef, containerRef,
    filteredEdges: edges.filter((e) => activeTypes.has(e.type)),
    selectedNodeRef, hoveredNodeRef, onNodeClickRef,
    zoomRef, panRef, setZoomDisplay,
    setSelectedNode, setHoveredNode,
  });

  // Fetch data
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchGraph();
        setEdges(data.edges);
        setStats(data.stats);
        const types = Object.keys(data.stats.edgeTypes);
        setAllEdgeTypes(types);
        setActiveTypes(new Set(types));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load graph");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Toggle edge type
  const handleToggleType = useCallback((type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }, []);

  const filteredEdges = edges.filter((e) => activeTypes.has(e.type));

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    zoomRef.current = Math.min(5, zoomRef.current * 1.25);
    setZoomDisplay(Math.round(zoomRef.current * 100));
    getDrawFn()?.();
  }, [getDrawFn]);

  const handleZoomOut = useCallback(() => {
    zoomRef.current = Math.max(0.1, zoomRef.current / 1.25);
    setZoomDisplay(Math.round(zoomRef.current * 100));
    getDrawFn()?.();
  }, [getDrawFn]);

  const handleZoomReset = useCallback(() => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setZoomDisplay(100);
    getDrawFn()?.();
  }, [getDrawFn]);

  // Redraw on hover/select/zoom
  useEffect(() => { getDrawFn()?.(); }, [selectedNode, hoveredNode, zoomDisplay, getDrawFn]);

  // ── Loading / error / empty states ──

  if (loading) {
    return (
      <div className="rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f172a, #020617)", minHeight: "70vh", border: "1px solid #1e293b", boxShadow: "0 0 30px #0f172a, 0 0 60px #1e293b33" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm animate-pulse">Loading graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f172a, #020617)", minHeight: "70vh", border: "1px solid #1e293b", boxShadow: "0 0 30px #0f172a, 0 0 60px #1e293b33" }}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (edges.length === 0) {
    return (
      <div className="rounded-lg flex flex-col items-center justify-center gap-4" style={{ background: "linear-gradient(135deg, #0f172a, #020617)", minHeight: "70vh", border: "1px solid #1e293b", boxShadow: "0 0 30px #0f172a, 0 0 60px #1e293b33" }}>
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
          <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <p className="text-zinc-500">No graph edges yet</p>
        <code className="text-[10px] text-zinc-600 bg-zinc-900 px-3 py-1 rounded">python memory_cli.py graph add-edge --from X --to Y --type same_session</code>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ border: "1px solid #1e293b", boxShadow: "0 0 30px #0f172a, 0 0 60px #1e293b33", minHeight: "70vh" }}>
      <div ref={containerRef} style={{ minHeight: "70vh" }}>
        <canvas ref={canvasRef} className="block" style={{ cursor: "pointer" }} />
      </div>

      <div className="absolute top-3 left-3 z-10">
        <EdgeFilter edgeTypes={allEdgeTypes} activeTypes={activeTypes} onToggle={handleToggleType} />
      </div>

      {selectedNode && (
        <div className="absolute top-3 right-3 z-10">
          <NodeDetail nodeId={selectedNode} edges={filteredEdges} onClose={() => setSelectedNode(null)} onOpen={onNodeClick} />
        </div>
      )}

      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1">
        <div className="flex flex-col items-center rounded-lg overflow-hidden" style={{ background: "#0f172acc", backdropFilter: "blur(8px)", border: "1px solid #1e293b55", boxShadow: "0 4px 12px #00000040" }}>
          <button onClick={handleZoomIn} className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-sky-400 hover:bg-white/5 transition-all duration-200 cursor-pointer" title="Zoom in">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
          <button onClick={handleZoomReset} className="w-9 h-7 flex items-center justify-center text-[10px] font-mono text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all duration-200 cursor-pointer border-y border-zinc-800/50" title="Reset zoom & pan">
            {zoomDisplay}%
          </button>
          <button onClick={handleZoomOut} className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-sky-400 hover:bg-white/5 transition-all duration-200 cursor-pointer" title="Zoom out">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
          </button>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 z-10">
        <button
          className="rounded-lg px-3 py-2 text-xs transition-all duration-200 flex items-center gap-2"
          style={{ background: "#0f172acc", backdropFilter: "blur(8px)", border: "1px solid #1e293b55", color: "#64748b", boxShadow: "0 4px 12px #00000040" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#94a3b8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e293b55"; e.currentTarget.style.color = "#64748b"; }}
          onClick={() => window.open("/api/memory/graph/vis", "_blank")}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          Open in Pyvis
        </button>
      </div>

      {!selectedNode && (
        <div className="absolute bottom-3 left-3 z-10">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "#0f172acc", backdropFilter: "blur(8px)", border: "1px solid #1e293b44", boxShadow: "0 4px 12px #00000040" }}>
            <svg className="w-3.5 h-3.5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
            <span className="text-zinc-600 text-xs">Scroll zoom · Right-drag pan · Click inspect · Dbl-click open</span>
          </div>
        </div>
      )}
    </div>
  );
}
