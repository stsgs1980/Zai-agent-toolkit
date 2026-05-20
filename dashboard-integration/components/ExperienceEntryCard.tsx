'use client'

import type { ExperienceEntry } from '@/lib/types'

// ── Color maps ──────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  verified:   { bg: '#22c55e15', text: '#4ade80', border: '#22c55e44', glow: '#22c55e44' },
  unverified: { bg: '#eab30815', text: '#fbbf24', border: '#eab30844', glow: '#eab30844' },
  conflict:   { bg: '#ef444415', text: '#f87171', border: '#ef444444', glow: '#ef444444' },
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  good:  { bg: '#22c55e15', text: '#4ade80' },
  bad:   { bg: '#ef444415', text: '#f87171' },
  mixed: { bg: '#a855f715', text: '#c084fc' },
}

// ── Component ───────────────────────────────────────────────

interface ExperienceEntryCardProps {
  entry: ExperienceEntry
  onVerify: (id: string, status: string) => void
}

export function ExperienceEntryCard({ entry, onVerify }: ExperienceEntryCardProps) {
  const statusColor = STATUS_COLORS[entry.verification_status] || STATUS_COLORS.unverified
  const typeColor = TYPE_COLORS[entry.experience_type] || TYPE_COLORS.mixed

  return (
    <div
      className="rounded-lg p-4 transition-all hover:border-purple-500/30"
      style={{
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        border: '1px solid #1e293b55',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
              style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
            >
              {entry.experience_type}
            </span>
            <span className="text-xs font-mono text-zinc-400">{entry.id.slice(0, 12)}...</span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            {entry.good_count > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 4px #4ade8088' }} />
                <span className="text-[10px] text-emerald-400 font-mono">{entry.good_count} good</span>
              </div>
            )}
            {entry.bad_count > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" style={{ boxShadow: '0 0 4px #f8717188' }} />
                <span className="text-[10px] text-red-400 font-mono">{entry.bad_count} bad</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              backgroundColor: statusColor.bg,
              color: statusColor.text,
              border: `1px solid ${statusColor.border}`,
              boxShadow: `0 0 8px ${statusColor.glow}`,
            }}
          >
            {entry.verification_status}
          </span>
          {entry.verification_status === 'unverified' && (
            <button
              onClick={() => onVerify(entry.id, 'verified')}
              className="h-6 px-2 text-[10px] rounded border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              Verify
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-zinc-500 font-mono line-clamp-2">{entry.preview}</p>

      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {entry.tags.slice(0, 6).map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {tag}
            </span>
          ))}
          {entry.tags.length > 6 && (
            <span className="text-[10px] text-zinc-600">+{entry.tags.length - 6}</span>
          )}
        </div>
      )}
    </div>
  )
}
