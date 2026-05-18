import React from "react";
import type { GraphEdge } from "@/lib/graph-client";
import { EDGE_COLORS, EDGE_GLOW, classifyNode, getNodeColor, getNodeGlow } from "./colors";

interface NodeDetailProps {
  nodeId: string;
  edges: GraphEdge[];
  onClose: () => void;
  onOpen?: (nodeId: string) => void;
}

export function NodeDetail({ nodeId, edges, onClose, onOpen }: NodeDetailProps) {
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
