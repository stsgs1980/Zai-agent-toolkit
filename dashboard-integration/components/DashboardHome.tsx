'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────

interface DashboardStats {
  entries: {
    byType: Record<string, number>
    total: number
  }
  graph: {
    nodeCount: number
    edgeCount: number
    edgeTypes: Record<string, number>
  }
  experience: {
    total: number
    verified: number
    unverified: number
    conflict: number
  }
  timestamp: string
}

// ── Type display config ─────────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string; glow: string; icon: string }> = {
  knowledge: { label: 'Knowledge', color: '#a855f7', glow: '#c084fc', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  pattern:   { label: 'Patterns', color: '#2dd4bf', glow: '#5eead4', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  command:   { label: 'Commands', color: '#fbbf24', glow: '#fde68a', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  project:   { label: 'Projects', color: '#60a5fa', glow: '#93c5fd', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  session:   { label: 'Sessions', color: '#38bdf8', glow: '#7dd3fc', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  template:  { label: 'Templates', color: '#fb923c', glow: '#fdba74', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  experience:{ label: 'Experience', color: '#4ade80', glow: '#86efac', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
}

// ── Component ────────────────────────────────────────────────

export function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/memory/stats')
      if (!res.ok) throw new Error('Failed to load stats')
      const data = await res.json()
      setStats(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded animate-pulse" style={{ background: '#0f172a' }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg animate-pulse" style={{ background: '#0f172a' }} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
        Failed to load stats: {error}
      </div>
    )
  }

  const typeEntries = Object.entries(stats.entries.byType).sort((a, b) => b[1] - a[1])
  const graphEdgeTypes = Object.entries(stats.graph.edgeTypes).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-6">
      {/* ── Hero stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total entries */}
        <div
          className="rounded-lg p-4 relative overflow-hidden"
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, #38bdf8, transparent)' }} />
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono mb-1">Total Entries</div>
          <div className="text-2xl font-mono font-bold text-sky-400">
            {stats.entries.total}
          </div>
        </div>

        {/* Graph nodes */}
        <div
          className="rounded-lg p-4 relative overflow-hidden"
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, #a855f7, transparent)' }} />
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono mb-1">Graph Nodes</div>
          <div className="text-2xl font-mono font-bold text-purple-400">
            {stats.graph.nodeCount}
          </div>
          <div className="text-[10px] text-zinc-600 font-mono">{stats.graph.edgeCount} edges</div>
        </div>

        {/* Experience */}
        <div
          className="rounded-lg p-4 relative overflow-hidden"
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, #4ade80, transparent)' }} />
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono mb-1">Experiences</div>
          <div className="text-2xl font-mono font-bold text-emerald-400">
            {stats.experience.total}
          </div>
          <div className="text-[10px] text-zinc-600 font-mono">
            {stats.experience.verified} verified / {stats.experience.unverified} pending
          </div>
        </div>

        {/* Conflict count */}
        <div
          className="rounded-lg p-4 relative overflow-hidden"
          style={{
            background: '#0f172a',
            border: `1px solid ${stats.experience.conflict > 0 ? '#ef444433' : '#1e293b'}`,
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${stats.experience.conflict > 0 ? '#ef4444' : '#374151'}, transparent)` }} />
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono mb-1">Conflicts</div>
          <div
            className="text-2xl font-mono font-bold"
            style={{ color: stats.experience.conflict > 0 ? '#f87171' : '#4b5563' }}
          >
            {stats.experience.conflict}
          </div>
          <div className="text-[10px] text-zinc-600 font-mono">
            {stats.experience.conflict > 0 ? 'Needs resolution' : 'All clear'}
          </div>
        </div>
      </div>

      {/* ── Entry type breakdown ── */}
      <div
        className="rounded-lg p-4"
        style={{ background: '#0f172a', border: '1px solid #1e293b' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Entries by Type</span>
        </div>

        <div className="space-y-2">
          {typeEntries.map(([type, count]) => {
            const meta = TYPE_META[type]
            if (!meta) return null
            const pct = stats.entries.total > 0 ? (count / stats.entries.total) * 100 : 0

            return (
              <div key={type} className="flex items-center gap-3">
                <div className="w-20 text-xs text-zinc-400 font-mono truncate">{meta.label}</div>
                <div className="flex-1 h-4 bg-zinc-900/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${meta.color}, ${meta.glow})`,
                      boxShadow: `0 0 8px ${meta.color}44`,
                      minWidth: count > 0 ? '4px' : '0',
                    }}
                  />
                </div>
                <div className="w-10 text-right text-xs font-mono" style={{ color: meta.glow }}>{count}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Graph edge types ── */}
      {graphEdgeTypes.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{ background: '#0f172a', border: '1px solid #1e293b55' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Graph Edge Types</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {graphEdgeTypes.map(([type, count]) => (
              <div
                key={type}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: '#0f172a', border: '1px solid #1e293b55' }}
              >
                <span className="text-xs text-zinc-400 font-mono">{type}</span>
                <span className="text-xs font-mono font-bold text-zinc-200">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Refresh ── */}
      <div className="flex justify-end">
        <button
          onClick={loadStats}
          className="h-7 px-3 text-[10px] rounded border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors font-mono"
        >
          Refresh Stats
        </button>
      </div>
    </div>
  )
}
