import React from "react";
import { EDGE_COLORS, EDGE_GLOW } from "./colors";

interface EdgeFilterProps {
  edgeTypes: string[];
  activeTypes: Set<string>;
  onToggle: (type: string) => void;
}

export function EdgeFilter({ edgeTypes, activeTypes, onToggle }: EdgeFilterProps) {
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
