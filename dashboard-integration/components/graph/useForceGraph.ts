import { useEffect, useRef, useCallback } from "react";
import type { GraphEdge } from "@/lib/graph-client";
import { EDGE_COLORS, EDGE_GLOW, getNodeColor, getNodeGlow } from "./colors";

// ── Simulation data types ──────────────────────────────────

export interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  glow: string;
  degree: number;
}

export interface SimEdge {
  source: string;
  target: string;
  type: string;
  color: string;
  glow: string;
}

// ── Main hook ──────────────────────────────────────────────

interface UseForceGraphOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  filteredEdges: GraphEdge[];
  selectedNodeRef: React.MutableRefObject<string | null>;
  hoveredNodeRef: React.MutableRefObject<string | null>;
  onNodeClickRef: React.MutableRefObject<((nodeId: string) => void) | undefined>;
  zoomRef: React.MutableRefObject<number>;
  panRef: React.MutableRefObject<{ x: number; y: number }>;
  setZoomDisplay: (v: number) => void;
  setSelectedNode: (v: string | null) => void;
  setHoveredNode: (v: string | null) => void;
}

export function useForceGraph({
  canvasRef, containerRef, filteredEdges,
  selectedNodeRef, hoveredNodeRef, onNodeClickRef,
  zoomRef, panRef, setZoomDisplay,
  setSelectedNode, setHoveredNode,
}: UseForceGraphOptions) {

  // Stable simulation data (survives re-renders)
  const simDataRef = useRef<{
    nodes: SimNode[];
    edges: SimEdge[];
    nodeMap: Map<string, SimNode>;
    width: number;
    height: number;
  } | null>(null);

  // Draw function ref
  const drawFnRef = useRef<(() => void) | null>(null);

  // Expose draw function ref
  const getDrawFn = useCallback(() => drawFnRef.current, []);

  // ── EFFECT: Run force simulation once per filteredEdges change ──
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

    // Force simulation
    const REPULSION = 900;
    const ATTRACTION = 0.004;
    const DAMPING = 0.85;
    const MAX_ITERATIONS = 250;

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

    simDataRef.current = { nodes, edges: simEdges, nodeMap, width, height };

    // ── DRAW function ──
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

      // Legend
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

    drawFnRef.current = draw;
    draw();

    // ── Event handlers ──

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
      const canvasRect = canvas.getBoundingClientRect();
      const mx = e.clientX - canvasRect.left;
      const my = e.clientY - canvasRect.top;
      const { wx, wy } = screenToWorld(mx, my);
      const hit = findNodeAt(wx, wy, 6);
      const newHov = hit ? hit.id : null;
      if (newHov !== hoveredNodeRef.current) {
        setHoveredNode(newHov);
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
  }, [filteredEdges]); // eslint-disable-line react-hooks/exhaustive-deps

  return { getDrawFn };
}
