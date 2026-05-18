"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { fetchGraph, type GraphEdge, type GraphStats } from "@/lib/graph-client";

// ── Edge type colors (matches graph_engine.py TYPE_COLORS) ─

const EDGE_COLORS: Record<string, string> = {
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

const NODE_COLORS: Record<string, string> = {
  session: "#2980b9",
  task: "#27ae60",
  bug: "#c0392b",
  knowledge: "#8e44ad",
  commit: "#e67e22",
  src: "#16a085",
  REQ: "#f39c12",
};

// ── Helper: classify node by prefix ────────────────────────

function classifyNode(id: string): string {
  const lower = id.toLowerCase();
  for (const prefix of Object.keys(NODE_COLORS)) {
    if (lower.startsWith(prefix.toLowerCase())) return prefix;
  }
  if (id.includes("/") || id.includes("\\")) return "src";
  return "default";
}

function getNodeColor(id: string): string {
  const group = classifyNode(id);
  return NODE_COLORS[group] || "#4a90d9";
}

// ── Selected node detail panel (plain HTML + Tailwind) ─────

interface NodeDetailProps {
  nodeId: string;
  edges: GraphEdge[];
  onClose: () => void;
}

function NodeDetail({ nodeId, edges, onClose }: NodeDetailProps) {
  const incoming = edges.filter((e) => e.to === nodeId);
  const outgoing = edges.filter((e) => e.from === nodeId);
  const group = classifyNode(nodeId);

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700">
        <span className="text-sm font-mono text-zinc-100 truncate max-w-[80%]">
          {nodeId}
        </span>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white text-sm leading-none"
        >
          x
        </button>
      </div>
      <div className="p-3 text-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Group:</span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] border"
            style={{
              borderColor: NODE_COLORS[group] || "#4a90d9",
              color: NODE_COLORS[group] || "#4a90d9",
            }}
          >
            {group}
          </span>
        </div>
        <div className="text-zinc-400">
          Incoming: {incoming.length} | Outgoing: {outgoing.length}
        </div>
        {incoming.length > 0 && (
          <div>
            <div className="text-zinc-500 mb-1">Incoming edges:</div>
            {incoming.slice(0, 5).map((e, i) => (
              <div key={i} className="flex items-center gap-1 ml-2">
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: EDGE_COLORS[e.type] || "#3498db" }}
                />
                <span className="text-zinc-400 truncate max-w-[60%]">
                  {e.from}
                </span>
                <span className="px-1 py-0 rounded bg-zinc-800 text-[10px] text-zinc-400">
                  {e.type}
                </span>
              </div>
            ))}
            {incoming.length > 5 && (
              <div className="text-zinc-500 ml-2">
                +{incoming.length - 5} more
              </div>
            )}
          </div>
        )}
        {outgoing.length > 0 && (
          <div>
            <div className="text-zinc-500 mb-1">Outgoing edges:</div>
            {outgoing.slice(0, 5).map((e, i) => (
              <div key={i} className="flex items-center gap-1 ml-2">
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: EDGE_COLORS[e.type] || "#3498db" }}
                />
                <span className="text-zinc-400 truncate max-w-[60%]">
                  {e.to}
                </span>
                <span className="px-1 py-0 rounded bg-zinc-800 text-[10px] text-zinc-400">
                  {e.type}
                </span>
              </div>
            ))}
            {outgoing.length > 5 && (
              <div className="text-zinc-500 ml-2">
                +{outgoing.length - 5} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Edge type filter checkboxes ────────────────────────────

interface EdgeFilterProps {
  edgeTypes: string[];
  activeTypes: Set<string>;
  onToggle: (type: string) => void;
}

function EdgeFilter({ edgeTypes, activeTypes, onToggle }: EdgeFilterProps) {
  if (edgeTypes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs text-zinc-400">Filter:</span>
      {edgeTypes.map((type) => (
        <label
          key={type}
          className="flex items-center gap-1 cursor-pointer text-xs"
        >
          <input
            type="checkbox"
            checked={activeTypes.has(type)}
            onChange={() => onToggle(type)}
            className="accent-blue-500"
          />
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: EDGE_COLORS[type] || "#3498db" }}
          />
          <span className="text-zinc-300">{type}</span>
        </label>
      ))}
    </div>
  );
}

// ── Main GraphViewer component ─────────────────────────────

export function GraphViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [allEdgeTypes, setAllEdgeTypes] = useState<string[]>([]);

  // ── Fetch data ─────────────────────────────────────────

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

  // ── Toggle edge type filter ────────────────────────────

  const handleToggleType = useCallback((type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // ── Filtered edges ─────────────────────────────────────

  const filteredEdges = edges.filter((e) => activeTypes.has(e.type));

  // ── Build node/edge structures for canvas ──────────────

  interface SimNode {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    degree: number;
  }

  interface SimEdge {
    source: string;
    target: string;
    type: string;
    color: string;
  }

  // ── Force-directed layout + canvas rendering ───────────

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || filteredEdges.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Size canvas to container
    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 500;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Build nodes from edges
    const nodeMap = new Map<string, SimNode>();
    const centerX = width / 2;
    const centerY = height / 2;

    for (const edge of filteredEdges) {
      if (!nodeMap.has(edge.from)) {
        nodeMap.set(edge.from, {
          id: edge.from,
          x: centerX + (Math.random() - 0.5) * width * 0.6,
          y: centerY + (Math.random() - 0.5) * height * 0.6,
          vx: 0,
          vy: 0,
          color: getNodeColor(edge.from),
          degree: 0,
        });
      }
      if (!nodeMap.has(edge.to)) {
        nodeMap.set(edge.to, {
          id: edge.to,
          x: centerX + (Math.random() - 0.5) * width * 0.6,
          y: centerY + (Math.random() - 0.5) * height * 0.6,
          vx: 0,
          vy: 0,
          color: getNodeColor(edge.to),
          degree: 0,
        });
      }
      nodeMap.get(edge.from)!.degree++;
      nodeMap.get(edge.to)!.degree++;
    }

    const nodes = Array.from(nodeMap.values());
    const simEdges: SimEdge[] = filteredEdges.map((e) => ({
      source: e.from,
      target: e.to,
      type: e.type,
      color: EDGE_COLORS[e.type] || "#3498db",
    }));

    // Force simulation parameters
    const REPULSION = 800;
    const ATTRACTION = 0.005;
    const DAMPING = 0.85;
    const MAX_ITERATIONS = 200;
    let iteration = 0;

    function simulate() {
      if (iteration >= MAX_ITERATIONS) return;

      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = REPULSION / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }

      // Attraction along edges
      for (const edge of simEdges) {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (!source || !target) continue;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = dist * ATTRACTION;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      }

      // Center gravity
      for (const node of nodes) {
        node.vx += (centerX - node.x) * 0.001;
        node.vy += (centerY - node.y) * 0.001;
      }

      // Apply velocity with damping
      for (const node of nodes) {
        node.vx *= DAMPING;
        node.vy *= DAMPING;
        node.x += node.vx;
        node.y += node.vy;

        const margin = 30;
        node.x = Math.max(margin, Math.min(width - margin, node.x));
        node.y = Math.max(margin, Math.min(height - margin, node.y));
      }

      iteration++;
    }

    function draw() {
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      // Draw edges
      ctx.lineWidth = 1;
      for (const edge of simEdges) {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (!source || !target) continue;

        ctx.beginPath();
        ctx.strokeStyle = edge.color + "99";
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();

        // Arrow
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const arrowSize = 6;
        const arrowX = target.x - (dx / dist) * 12;
        const arrowY = target.y - (dy / dist) * 12;

        ctx.beginPath();
        ctx.fillStyle = edge.color + "99";
        ctx.moveTo(arrowX + (dx / dist) * arrowSize, arrowY + (dy / dist) * arrowSize);
        ctx.lineTo(
          arrowX + (-dy / dist) * (arrowSize * 0.5),
          arrowY + (dx / dist) * (arrowSize * 0.5)
        );
        ctx.lineTo(
          arrowX + (dy / dist) * (arrowSize * 0.5),
          arrowY + (-dx / dist) * (arrowSize * 0.5)
        );
        ctx.closePath();
        ctx.fill();
      }

      // Draw nodes
      for (const node of nodes) {
        const radius = Math.max(4, Math.min(12, 4 + node.degree * 1.5));
        const isSelected = selectedNode === node.id;

        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = node.color + "33";
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = isSelected ? "#ffffff" : "#00000044";
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        if (node.degree >= 2 || nodes.length < 30) {
          ctx.font = "10px monospace";
          ctx.fillStyle = "#e0e0e0";
          ctx.textAlign = "center";
          const label =
            node.id.length > 20 ? node.id.slice(0, 18) + "..." : node.id;
          ctx.fillText(label, node.x, node.y + radius + 14);
        }
      }

      // Legend
      const usedTypes = new Set(simEdges.map((e) => e.type));
      let legendY = 15;
      ctx.font = "11px monospace";
      for (const type of usedTypes) {
        ctx.fillStyle = EDGE_COLORS[type] || "#3498db";
        ctx.fillRect(10, legendY - 8, 10, 10);
        ctx.fillStyle = "#cccccc";
        ctx.textAlign = "left";
        ctx.fillText(type, 25, legendY);
        legendY += 16;
      }
    }

    // Run simulation
    let animFrame: number;

    function loop() {
      simulate();
      draw();
      if (iteration < MAX_ITERATIONS) {
        animFrame = requestAnimationFrame(loop);
      }
    }

    loop();

    // Click handler for node selection
    function handleClick(e: MouseEvent) {
      const canvasRect = canvas.getBoundingClientRect();
      const mx = e.clientX - canvasRect.left;
      const my = e.clientY - canvasRect.top;

      let closest: SimNode | null = null;
      let closestDist = Infinity;

      for (const node of nodes) {
        const dx = node.x - mx;
        const dy = node.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = Math.max(4, Math.min(12, 4 + node.degree * 1.5));
        if (dist < radius + 8 && dist < closestDist) {
          closest = node;
          closestDist = dist;
        }
      }

      setSelectedNode(closest ? closest.id : null);

      if (iteration >= MAX_ITERATIONS) {
        draw();
      }
    }

    canvas.addEventListener("click", handleClick);

    return () => {
      cancelAnimationFrame(animFrame);
      canvas.removeEventListener("click", handleClick);
    };
  }, [filteredEdges, selectedNode]);

  // ── Loading / error / empty states ────────────────────

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg flex items-center justify-center h-[500px]">
        <p className="text-zinc-400">Loading graph data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg flex items-center justify-center h-[500px]">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (edges.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg flex flex-col items-center justify-center h-[500px] gap-4">
        <p className="text-zinc-400">No graph edges found.</p>
        <p className="text-zinc-500 text-sm">
          Run: python tools/memory_cli.py graph add-edge --from X --to Y
          --type same_session
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Edge type filter */}
      <EdgeFilter
        edgeTypes={allEdgeTypes}
        activeTypes={activeTypes}
        onToggle={handleToggleType}
      />

      <div className="flex gap-3">
        {/* Graph canvas */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg flex-1 overflow-hidden">
          <div className="p-0" ref={containerRef}>
            <canvas
              ref={canvasRef}
              className="cursor-pointer block"
              style={{ background: "#1a1a2e" }}
            />
          </div>
        </div>

        {/* Node detail panel */}
        <div className="w-72 shrink-0">
          {selectedNode ? (
            <NodeDetail
              nodeId={selectedNode}
              edges={filteredEdges}
              onClose={() => setSelectedNode(null)}
            />
          ) : (
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg flex items-center justify-center h-32">
              <p className="text-zinc-500 text-xs">
                Click a node to see details
              </p>
            </div>
          )}

          {/* Open in Pyvis button */}
          <div className="mt-3">
            <button
              className="w-full border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded px-3 py-1.5 text-sm transition-colors"
              onClick={() => window.open("/api/memory/graph/vis", "_blank")}
            >
              Open in Pyvis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
