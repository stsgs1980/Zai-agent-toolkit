"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { fetchGraph, type GraphEdge, type GraphStats } from "@/lib/graph-client";

// ── Neon color palette ──────────────────────────────────────

const EDGE_COLORS: Record<string, string> = {
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

const EDGE_GLOW: Record<string, string> = {
  parent_dir: "#64748b",
  imports: "#c084fc",
  same_session: "#7dd3fc",
  depends_on: "#5eead4",
  follow_up: "#86efac",
  fixed_by: "#fca5a5",
  implements: "#fde68a",
  modifies: "#fdba74",
  related_to: "#93c5fd",
};

const NODE_COLORS: Record<string, string> = {
  session: "#38bdf8",
  task: "#4ade80",
  bug: "#f87171",
  knowledge: "#a855f7",
  commit: "#fb923c",
  src: "#2dd4bf",
  REQ: "#fbbf24",
};

const NODE_GLOW: Record<string, string> = {
  session: "#7dd3fc",
  task: "#86efac",
  bug: "#fca5a5",
  knowledge: "#c084fc",
  commit: "#fdba74",
  src: "#5eead4",
  REQ: "#fde68a",
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
  return NODE_COLORS[classifyNode(id)] || "#60a5fa";
}

function getNodeGlow(id: string): string {
  return NODE_GLOW[classifyNode(id)] || "#93c5fd";
}

// ── Node detail panel ──────────────────────────────────────

interface NodeDetailProps {
  nodeId: string;
  edges: GraphEdge[];
  onClose: () => void;
  onOpen?: (nodeId: string) => void;
}

function NodeDetail({ nodeId, edges, onClose, onOpen }: NodeDetailProps) {
  const incoming = edges.filter((e) => e.to === nodeId);
  const outgoing = edges.filter((e) => e.from === nodeId);
  const group = classifyNode(nodeId);
  const glow = getNodeGlow(nodeId);
  const color = getNodeColor(nodeId);

  return (
    <div
      className="rounded-lg overflow-hidden w-72 max-h-[60vh] overflow-y-auto"
      style={{
        background: "linear-gradient(135deg, #0f172aee 0%, #1e293bee 100%)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${color}33`,
        boxShadow: `0 0 30px ${color}15, 0 8px 32px #00000080, inset 0 1px 0 ${color}15`,
      }}
    >
      <div className="relative px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: color, boxShadow: `0 0 6px ${glow}` }}
            />
            <span className="text-sm font-mono text-zinc-100 truncate">{nodeId}</span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {onOpen && (
              <button
                onClick={() => onOpen(nodeId)}
                className="text-zinc-500 hover:text-sky-400 text-xs leading-none transition-colors cursor-pointer flex items-center gap-1 px-1.5 py-0.5 rounded"
                style={{ border: '1px solid #1e293b55' }}
                title="Open document"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open
              </button>
            )}
            <button onClick={onClose} className="text-zinc-500 hover:text-white text-sm leading-none transition-colors cursor-pointer">x</button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${color}66, transparent)` }} />
      </div>

      <div className="p-3 text-xs space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Type</span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ backgroundColor: `${color}15`, color: glow, border: `1px solid ${color}33`, boxShadow: `0 0 8px ${color}11` }}
          >
            {group}
          </span>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-zinc-400">{incoming.length}</span>
            <span className="text-zinc-600">in</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span className="text-zinc-400">{outgoing.length}</span>
            <span className="text-zinc-600">out</span>
          </div>
        </div>

        {incoming.length > 0 && (
          <div>
            <div className="text-zinc-600 mb-1.5 uppercase tracking-wider text-[10px]">Incoming</div>
            <div className="space-y-1">
              {incoming.slice(0, 5).map((e, i) => (
                <div key={i} className="flex items-center gap-1.5 ml-1 group/edge">
                  <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: EDGE_COLORS[e.type] || "#60a5fa", boxShadow: `0 0 4px ${EDGE_GLOW[e.type] || "#93c5fd"}66` }} />
                  <span className="text-zinc-400 truncate max-w-[55%] group-hover/edge:text-zinc-200 transition-colors">{e.from}</span>
                  <span className="px-1.5 py-0 rounded-full text-[9px]" style={{ backgroundColor: `${EDGE_COLORS[e.type]}15`, color: EDGE_GLOW[e.type] }}>{e.type}</span>
                </div>
              ))}
              {incoming.length > 5 && <div className="text-zinc-600 ml-1">+{incoming.length - 5} more</div>}
            </div>
          </div>
        )}

        {outgoing.length > 0 && (
          <div>
            <div className="text-zinc-600 mb-1.5 uppercase tracking-wider text-[10px]">Outgoing</div>
            <div className="space-y-1">
              {outgoing.slice(0, 5).map((e, i) => (
                <div key={i} className="flex items-center gap-1.5 ml-1 group/edge">
                  <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: EDGE_COLORS[e.type] || "#60a5fa", boxShadow: `0 0 4px ${EDGE_GLOW[e.type] || "#93c5fd"}66` }} />
                  <span className="text-zinc-400 truncate max-w-[55%] group-hover/edge:text-zinc-200 transition-colors">{e.to}</span>
                  <span className="px-1.5 py-0 rounded-full text-[9px]" style={{ backgroundColor: `${EDGE_COLORS[e.type]}15`, color: EDGE_GLOW[e.type] }}>{e.type}</span>
                </div>
              ))}
              {outgoing.length > 5 && <div className="text-zinc-600 ml-1">+{outgoing.length - 5} more</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Edge filter ─────────────────────────────────────────────

interface EdgeFilterProps {
  edgeTypes: string[];
  activeTypes: Set<string>;
  onToggle: (type: string) => void;
}

function EdgeFilter({ edgeTypes, activeTypes, onToggle }: EdgeFilterProps) {
  if (edgeTypes.length === 0) return null;
  return (
    <div
      className="flex flex-wrap gap-1.5 items-center rounded-lg px-3 py-2"
      style={{ background: "#0f172acc", backdropFilter: "blur(8px)", border: "1px solid #1e293b55", boxShadow: "0 4px 12px #00000040" }}
    >
      <span className="text-[10px] text-zinc-600 uppercase tracking-wider mr-1">Filter</span>
      {edgeTypes.map((type) => {
        const active = activeTypes.has(type);
        const color = EDGE_COLORS[type] || "#60a5fa";
        const glow = EDGE_GLOW[type] || "#93c5fd";
        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: active ? `${color}20` : "#0f172a",
              border: `1px solid ${active ? `${color}55` : "#1e293b"}`,
              color: active ? glow : "#4b5563",
              boxShadow: active ? `0 0 12px ${color}15` : "none",
            }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full transition-all duration-200" style={{ backgroundColor: active ? color : "#374151", boxShadow: active ? `0 0 6px ${glow}88` : "none" }} />
            {type}
          </button>
        );
      })}
    </div>
  );
}

// ── Draw subtle grid ────────────────────────────────────────

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const gridSize = 40;
  ctx.strokeStyle = "#ffffff06";
  ctx.lineWidth = 1;
  for (let x = gridSize; x < w; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = gridSize; y < h; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.strokeStyle = "#ffffff0a";
  ctx.beginPath();
  ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
  ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
  ctx.stroke();
}

// ── Data types for simulation ───────────────────────────────

interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  glow: string;
  degree: number;
}

interface SimEdge {
  source: string;
  target: string;
  type: string;
  color: string;
  glow: string;
}

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

  // ── Stable refs for render-on-demand ──
  const selectedNodeRef = useRef<string | null>(null);
  const hoveredNodeRef = useRef<string | null>(null);
  const onNodeClickRef = useRef(onNodeClick);

  // Keep refs in sync with state
  useEffect(() => { selectedNodeRef.current = selectedNode; }, [selectedNode]);
  useEffect(() => { hoveredNodeRef.current = hoveredNode; }, [hoveredNode]);
  useEffect(() => { onNodeClickRef.current = onNodeClick; }, [onNodeClick]);

  // ── Zoom & pan ──
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const [zoomDisplay, setZoomDisplay] = useState(100);

  // ── Stable simulation data (survives re-renders) ──
  const simDataRef = useRef<{
    nodes: SimNode[];
    edges: SimEdge[];
    nodeMap: Map<string, SimNode>;
    width: number;
    height: number;
  } | null>(null);

  // ── Draw function ref ──
  const drawFnRef = useRef<(() => void) | null>(null);

  // ── Request redraw from React side ──
  const requestRedraw = useCallback(() => {
    drawFnRef.current?.();
  }, []);

  // ── Fetch data ──
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

  // ── Toggle edge type filter ──
  const handleToggleType = useCallback((type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }, []);

  // ── Filtered edges ──
  const filteredEdges = edges.filter((e) => activeTypes.has(e.type));

  // ── Zoom controls ──
  const handleZoomIn = useCallback(() => {
    zoomRef.current = Math.min(5, zoomRef.current * 1.25);
    setZoomDisplay(Math.round(zoomRef.current * 100));
    requestRedraw();
  }, [requestRedraw]);

  const handleZoomOut = useCallback(() => {
    zoomRef.current = Math.max(0.1, zoomRef.current / 1.25);
    setZoomDisplay(Math.round(zoomRef.current * 100));
    requestRedraw();
  }, [requestRedraw]);

  const handleZoomReset = useCallback(() => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setZoomDisplay(100);
    requestRedraw();
  }, [requestRedraw]);

  // ═══════════════════════════════════════════════════════════
  // EFFECT 1: Run force simulation ONCE per filteredEdges change
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || filteredEdges.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

    // HiDPI
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

    const centerX = width / 2;
    const centerY = height / 2;

    // Build nodes
    const nodeMap = new Map<string, SimNode>();
    for (const edge of filteredEdges) {
      if (!nodeMap.has(edge.from)) {
        nodeMap.set(edge.from, {
          id: edge.from,
          x: centerX + (Math.random() - 0.5) * width * 0.6,
          y: centerY + (Math.random() - 0.5) * height * 0.6,
          vx: 0, vy: 0,
          color: getNodeColor(edge.from),
          glow: getNodeGlow(edge.from),
          degree: 0,
        });
      }
      if (!nodeMap.has(edge.to)) {
        nodeMap.set(edge.to, {
          id: edge.to,
          x: centerX + (Math.random() - 0.5) * width * 0.6,
          y: centerY + (Math.random() - 0.5) * height * 0.6,
          vx: 0, vy: 0,
          color: getNodeColor(edge.to),
          glow: getNodeGlow(edge.to),
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
      color: EDGE_COLORS[e.type] || "#60a5fa",
      glow: EDGE_GLOW[e.type] || "#93c5fd",
    }));

    // Force simulation constants
    const REPULSION = 900;
    const ATTRACTION = 0.004;
    const DAMPING = 0.85;
    const MAX_ITERATIONS = 250;

    // Run simulation synchronously (no animation — instant layout)
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = REPULSION / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodes[i].vx -= fx; nodes[i].vy -= fy;
          nodes[j].vx += fx; nodes[j].vy += fy;
        }
      }
      // Attraction
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
        source.vx += fx; source.vy += fy;
        target.vx -= fx; target.vy -= fy;
      }
      // Center gravity
      for (const node of nodes) {
        node.vx += (centerX - node.x) * 0.001;
        node.vy += (centerY - node.y) * 0.001;
      }
      // Apply velocity
      for (const node of nodes) {
        node.vx *= DAMPING;
        node.vy *= DAMPING;
        node.x += node.vx;
        node.y += node.vy;
        const margin = 30;
        node.x = Math.max(margin, Math.min(width - margin, node.x));
        node.y = Math.max(margin, Math.min(height - margin, node.y));
      }
    }

    // Store stable simulation data
    simDataRef.current = { nodes, edges: simEdges, nodeMap, width, height };

    // ── DRAW function (uses refs, no deps on React state) ──
    function draw() {
      const sd = simDataRef.current;
      if (!sd || !ctx) return;
      const { nodes: n, edges: se, width: w, height: h } = sd;

      const zoom = zoomRef.current;
      const pan = panRef.current;
      const selId = selectedNodeRef.current;
      const hovId = hoveredNodeRef.current;

      // Background
      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      bg.addColorStop(0, "#0f172a");
      bg.addColorStop(1, "#020617");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      drawGrid(ctx, w, h);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Edges
      for (const edge of se) {
        const source = sd.nodeMap.get(edge.source);
        const target = sd.nodeMap.get(edge.target);
        if (!source || !target) continue;

        const isHL = selId === edge.source || selId === edge.target || hovId === edge.source || hovId === edge.target;

        if (isHL) {
          ctx.beginPath();
          ctx.strokeStyle = edge.glow + "44";
          ctx.lineWidth = 4 / zoom;
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.strokeStyle = isHL ? edge.color + "cc" : edge.color + "55";
        ctx.lineWidth = isHL ? 1.5 / zoom : 0.8 / zoom;
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();

        // Arrow
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const aSize = isHL ? 8 : 6;
        const ax = target.x - (dx / dist) * 14;
        const ay = target.y - (dy / dist) * 14;
        ctx.beginPath();
        ctx.fillStyle = edge.color + "77";
        ctx.moveTo(ax + (dx / dist) * aSize, ay + (dy / dist) * aSize);
        ctx.lineTo(ax + (-dy / dist) * (aSize * 0.45), ay + (dx / dist) * (aSize * 0.45));
        ctx.lineTo(ax + (dy / dist) * (aSize * 0.45), ay + (-dx / dist) * (aSize * 0.45));
        ctx.closePath();
        ctx.fill();
      }

      // Nodes
      for (const node of n) {
        const radius = Math.max(4, Math.min(14, 4 + node.degree * 1.2));
        const isSel = selId === node.id;
        const isHov = hovId === node.id;

        if (isSel || isHov) {
          const gr = ctx.createRadialGradient(node.x, node.y, radius, node.x, node.y, radius + 12);
          gr.addColorStop(0, node.glow + "44");
          gr.addColorStop(1, node.glow + "00");
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 12, 0, Math.PI * 2);
          ctx.fillStyle = gr;
          ctx.fill();
        }

        const ambGlow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius + 4);
        ambGlow.addColorStop(0, node.color + "33");
        ambGlow.addColorStop(1, node.color + "00");
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = ambGlow;
        ctx.fill();

        const bodyG = ctx.createRadialGradient(node.x - radius * 0.3, node.y - radius * 0.3, 0, node.x, node.y, radius);
        bodyG.addColorStop(0, node.glow);
        bodyG.addColorStop(1, node.color);
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = bodyG;
        ctx.fill();
        ctx.strokeStyle = isSel ? "#ffffffbb" : isHov ? node.glow + "aa" : node.color + "55";
        ctx.lineWidth = (isSel ? 2 : 1) / zoom;
        ctx.stroke();

        const showLabel = node.degree >= 2 || n.length < 30 || isSel || isHov || zoom > 1.5;
        if (showLabel) {
          const fs = (isSel || isHov ? 11 : 9) / Math.max(zoom, 0.6);
          ctx.font = `${fs}px monospace`;
          ctx.fillStyle = isSel || isHov ? "#f1f5f9" : "#94a3b8";
          ctx.textAlign = "center";
          const label = node.id.length > 22 ? node.id.slice(0, 20) + ".." : node.id;
          ctx.fillText(label, node.x, node.y + radius + 16 / zoom);
        }
      }

      ctx.restore();

      // Legend (screen space)
      const usedTypes = new Set(se.map((e) => e.type));
      const legendTypes = Array.from(usedTypes);
      if (legendTypes.length > 0) {
        const lx = w - 150;
        const ly0 = 12;
        const lh = legendTypes.length * 18 + 12;
        ctx.fillStyle = "#0f172a99";
        ctx.beginPath();
        ctx.roundRect(lx - 8, ly0 - 4, 150, lh, 6);
        ctx.fill();
        ctx.strokeStyle = "#ffffff0d";
        ctx.lineWidth = 1;
        ctx.stroke();
        let ly = ly0 + 8;
        ctx.font = "10px monospace";
        for (const type of legendTypes) {
          const c = EDGE_COLORS[type] || "#60a5fa";
          const g = EDGE_GLOW[type] || "#93c5fd";
          ctx.beginPath(); ctx.arc(lx + 4, ly - 3, 3, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
          ctx.beginPath(); ctx.arc(lx + 4, ly - 3, 5, 0, Math.PI * 2); ctx.fillStyle = g + "33"; ctx.fill();
          ctx.fillStyle = "#94a3b8"; ctx.textAlign = "left"; ctx.fillText(type, lx + 14, ly);
          ly += 18;
        }
      }
    }

    // Expose draw
    drawFnRef.current = draw;

    // Initial draw
    draw();

    // ── Event handlers (use refs, not React state) ──

    function screenToWorld(sx: number, sy: number) {
      const z = zoomRef.current;
      const p = panRef.current;
      return { wx: (sx - p.x) / z, wy: (sy - p.y) / z };
    }

    function findNodeAt(wx: number, wy: number, tol: number): SimNode | null {
      const sd = simDataRef.current;
      if (!sd) return null;
      let closest: SimNode | null = null;
      let closestDist = Infinity;
      for (const node of sd.nodes) {
        const dx = node.x - wx;
        const dy = node.y - wy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = Math.max(4, Math.min(14, 4 + node.degree * 1.2));
        if (dist < radius + tol && dist < closestDist) {
          closest = node;
          closestDist = dist;
        }
      }
      return closest;
    }

    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    let didPan = false;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const canvasRect = canvas.getBoundingClientRect();
      const mx = e.clientX - canvasRect.left;
      const my = e.clientY - canvasRect.top;
      const oldZoom = zoomRef.current;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, oldZoom * factor));
      panRef.current.x = mx - (mx - panRef.current.x) * (newZoom / oldZoom);
      panRef.current.y = my - (my - panRef.current.y) * (newZoom / oldZoom);
      zoomRef.current = newZoom;
      setZoomDisplay(Math.round(newZoom * 100));
      draw();
    }

    function handleMouseDown(e: MouseEvent) {
      if (e.button === 1 || e.button === 2 || (e.button === 0 && e.ctrlKey)) {
        e.preventDefault();
        isPanning = true;
        didPan = false;
        panStartX = e.clientX - panRef.current.x;
        panStartY = e.clientY - panRef.current.y;
        canvas.style.cursor = "grabbing";
      }
    }

    function handleMouseMove(e: MouseEvent) {
      if (isPanning) {
        panRef.current.x = e.clientX - panStartX;
        panRef.current.y = e.clientY - panStartY;
        didPan = true;
        draw();
        return;
      }
      // Hover detection
      const canvasRect = canvas.getBoundingClientRect();
      const mx = e.clientX - canvasRect.left;
      const my = e.clientY - canvasRect.top;
      const { wx, wy } = screenToWorld(mx, my);
      const hit = findNodeAt(wx, wy, 6);
      const newHov = hit ? hit.id : null;
      if (newHov !== hoveredNodeRef.current) {
        setHoveredNode(newHov); // triggers React re-render but draw() reads from ref
        draw();
      }
    }

    function handleMouseUp() {
      if (isPanning) {
        isPanning = false;
        canvas.style.cursor = "pointer";
      }
    }

    function handleClick(e: MouseEvent) {
      if (didPan) { didPan = false; return; }
      const canvasRect = canvas.getBoundingClientRect();
      const mx = e.clientX - canvasRect.left;
      const my = e.clientY - canvasRect.top;
      const { wx, wy } = screenToWorld(mx, my);
      const hit = findNodeAt(wx, wy, 8);
      setSelectedNode(hit ? hit.id : null);
      draw();
    }

    function handleDblClick(e: MouseEvent) {
      const canvasRect = canvas.getBoundingClientRect();
      const mx = e.clientX - canvasRect.left;
      const my = e.clientY - canvasRect.top;
      const { wx, wy } = screenToWorld(mx, my);
      const hit = findNodeAt(wx, wy, 8);
      if (hit) {
        onNodeClickRef.current?.(hit.id);
      }
    }

    function handleContextMenu(e: MouseEvent) { e.preventDefault(); }

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("dblclick", handleDblClick);
    canvas.addEventListener("contextmenu", handleContextMenu);

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("dblclick", handleDblClick);
      canvas.removeEventListener("contextmenu", handleContextMenu);
      drawFnRef.current = null;
    };
  }, [filteredEdges]); // ← ONLY re-run when filtered edges change!

  // ── Redraw on hover/select/zoom changes (no re-simulation!) ──
  useEffect(() => {
    requestRedraw();
  }, [selectedNode, hoveredNode, zoomDisplay, requestRedraw]);

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

      {/* Edge filter pills */}
      <div className="absolute top-3 left-3 z-10">
        <EdgeFilter edgeTypes={allEdgeTypes} activeTypes={activeTypes} onToggle={handleToggleType} />
      </div>

      {/* Node detail */}
      {selectedNode && (
        <div className="absolute top-3 right-3 z-10">
          <NodeDetail nodeId={selectedNode} edges={filteredEdges} onClose={() => setSelectedNode(null)} onOpen={onNodeClick} />
        </div>
      )}

      {/* Zoom controls */}
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

      {/* Open in Pyvis */}
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

      {/* Hint */}
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
