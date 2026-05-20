'use client'

import type { ExtractedEntry } from '@/lib/types'

// ── Color maps ──────────────────────────────────────────────

const VERDICT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  mostly_succeeded:  { bg: '#22c55e18', text: '#4ade80', border: '#22c55e44' },
  mostly_failed:     { bg: '#ef444418', text: '#f87171', border: '#ef444444' },
  mixed:             { bg: '#eab30818', text: '#fbbf24', border: '#eab30844' },
  succeeded:         { bg: '#22c55e18', text: '#4ade80', border: '#22c55e44' },
  failed:            { bg: '#ef444418', text: '#f87171', border: '#ef444444' },
}

// ── Component ───────────────────────────────────────────────

interface ExtractedEntryCardProps {
  entry: ExtractedEntry
  index: number
}

export function ExtractedEntryCard({ entry, index }: ExtractedEntryCardProps) {
  const verdictColor = VERDICT_COLORS[entry.verdict] || VERDICT_COLORS.mixed

  return (
    <div
      key={index}
      className="rounded-lg p-4 transition-all hover:border-purple-500/30"
      style={{
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        border: '1px solid #1e293b55',
      }}
    >
      {/* Title row with verdict badge */}
      <div className="flex items-start gap-2 mb-3">
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0"
          style={{
            backgroundColor: verdictColor.bg,
            color: verdictColor.text,
            border: `1px solid ${verdictColor.border}`,
            boxShadow: `0 0 8px ${verdictColor.border}`,
          }}
        >
          {entry.verdict}
        </span>
        <span className="text-sm text-zinc-200 font-medium leading-tight">
          {entry.title}
        </span>
      </div>

      {/* Good / Bad / Why sections */}
      <div className="space-y-2">
        {entry.good && (
          <div className="flex gap-2">
            <div className="flex items-start gap-1.5 shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1" style={{ boxShadow: '0 0 4px #4ade8088' }} />
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono w-8">Good</span>
            </div>
            <p className="text-xs text-emerald-300/80 font-mono leading-relaxed">{entry.good}</p>
          </div>
        )}
        {entry.bad && (
          <div className="flex gap-2">
            <div className="flex items-start gap-1.5 shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1" style={{ boxShadow: '0 0 4px #f8717188' }} />
              <span className="text-[10px] text-red-400 uppercase tracking-wider font-mono w-8">Bad</span>
            </div>
            <p className="text-xs text-red-300/80 font-mono leading-relaxed">{entry.bad}</p>
          </div>
        )}
        {entry.why && (
          <div className="flex gap-2">
            <div className="flex items-start gap-1.5 shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1" style={{ boxShadow: '0 0 4px #fbbf2488' }} />
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-mono w-8">Why</span>
            </div>
            <p className="text-xs text-amber-300/80 font-mono leading-relaxed">{entry.why}</p>
          </div>
        )}
      </div>

      {/* Tech tags */}
      {entry.tech && entry.tech.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-zinc-800/50">
          {entry.tech.map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
