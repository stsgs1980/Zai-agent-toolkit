'use client'

import { useState, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────

interface MemoryEntry {
  id: string
  type: string
  tags: string[]
  source: string
  verification_status: string
  content: string
  raw: string
}

interface SearchResult {
  id: string
  type: string
  content: string
  distance: number
  tags: string[]
  source: string
  verification_status: string
}

// ── Entry type config ───────────────────────────────────────

const ENTRY_TYPES = [
  { key: 'knowledge', label: 'Knowledge', color: '#a855f7', glow: '#c084fc' },
  { key: 'pattern', label: 'Patterns', color: '#2dd4bf', glow: '#5eead4' },
  { key: 'command', label: 'Commands', color: '#fbbf24', glow: '#fde68a' },
  { key: 'project', label: 'Projects', color: '#60a5fa', glow: '#93c5fd' },
  { key: 'session', label: 'Sessions', color: '#38bdf8', glow: '#7dd3fc' },
  { key: 'template', label: 'Templates', color: '#fb923c', glow: '#fdba74' },
  { key: 'experience', label: 'Experience', color: '#4ade80', glow: '#86efac' },
]

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  verified:   { bg: '#22c55e15', color: '#4ade80' },
  unverified: { bg: '#eab30815', color: '#fbbf24' },
  conflict:   { bg: '#ef444415', color: '#f87171' },
}

// ── Component ────────────────────────────────────────────────

export function MemoryBrowser() {
  const [activeType, setActiveType] = useState('knowledge')
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [mode, setMode] = useState<'browse' | 'search'>('browse')

  // ── Load entries by type ──────────────────────────────────

  const loadEntries = useCallback(async (type: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/memory/entries?type=${type}&limit=50`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setEntries(data.entries || [])
    } catch (e: any) {
      setError(e.message)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Search ────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setError('')
    setMode('search')
    try {
      const res = await fetch(`/api/memory/search?q=${encodeURIComponent(searchQuery)}&limit=20`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setSearchResults(data.results || [])
    } catch (e: any) {
      setError(e.message)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  // ── Switch type tab ───────────────────────────────────────

  const handleTypeSwitch = useCallback((type: string) => {
    setActiveType(type)
    setMode('browse')
    setSearchQuery('')
    setSearchResults([])
    loadEntries(type)
  }, [loadEntries])

  // Initial load
  const [loaded, setLoaded] = useState(false)
  if (!loaded) {
    setLoaded(true)
    loadEntries('knowledge')
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Type tabs ── */}
      <div className="flex flex-wrap gap-1.5">
        {ENTRY_TYPES.map((t) => {
          const isActive = activeType === t.key && mode === 'browse'
          return (
            <button
              key={t.key}
              onClick={() => handleTypeSwitch(t.key)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer"
              style={{
                backgroundColor: isActive ? `${t.color}20` : '#0f172a',
                border: `1px solid ${isActive ? `${t.color}55` : '#1e293b'}`,
                color: isActive ? t.glow : '#4b5563',
                boxShadow: isActive ? `0 0 12px ${t.color}15` : 'none',
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  backgroundColor: isActive ? t.color : '#374151',
                  boxShadow: isActive ? `0 0 6px ${t.glow}88` : 'none',
                }}
              />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Search bar ── */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Semantic search across all memory..."
            className="w-full h-9 px-3 pl-9 text-sm rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50 font-mono"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {mode === 'search' && (
          <button
            onClick={() => { setMode('browse'); setSearchQuery(''); setSearchResults([]); loadEntries(activeType) }}
            className="h-9 px-3 text-xs rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{error}</div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Browse mode: entry list ── */}
      {mode === 'browse' && !loading && entries.map((entry) => {
        const typeConf = ENTRY_TYPES.find(t => t.key === entry.type)
        const statusStyle = STATUS_STYLES[entry.verification_status] || STATUS_STYLES.unverified

        return (
          <div
            key={entry.id}
            className="rounded-lg p-3 transition-all hover:border-zinc-600"
            style={{
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              border: `1px solid ${typeConf ? `${typeConf.color}22` : '#1e293b55'}`,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {typeConf && (
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: typeConf.color, boxShadow: `0 0 4px ${typeConf.glow}` }} />
                  )}
                  <span className="text-xs font-mono text-zinc-300 truncate">{entry.id}</span>
                </div>

                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {entry.tags.slice(0, 5).map((tag, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded-full text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {tag}
                      </span>
                    ))}
                    {entry.tags.length > 5 && (
                      <span className="text-[10px] text-zinc-600">+{entry.tags.length - 5}</span>
                    )}
                  </div>
                )}
              </div>

              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0"
                style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
              >
                {entry.verification_status}
              </span>
            </div>

            {(entry.content || entry.raw) && (
              <p className="mt-2 text-xs text-zinc-400 font-mono leading-relaxed line-clamp-3">
                {(entry.content || entry.raw).slice(0, 200)}
              </p>
            )}
            {entry.source && (
              <div className="mt-1.5 text-[10px] text-zinc-600 font-mono">
                src: {entry.source}
              </div>
            )}
          </div>
        )
      })}

      {/* ── Search mode: results ── */}
      {mode === 'search' && !loading && searchResults.map((result) => {
        const typeConf = ENTRY_TYPES.find(t => t.key === result.type)

        return (
          <div
            key={result.id}
            className="rounded-lg p-3 transition-all hover:border-sky-500/30"
            style={{
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              border: '1px solid #1e293b55',
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {typeConf && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: typeConf.color, boxShadow: `0 0 4px ${typeConf.glow}` }} />
                )}
                <span className="text-xs font-mono text-zinc-300">{result.id}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400">
                  {result.type}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <svg className="w-3 h-3 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-[10px] text-zinc-500 font-mono">{(result.distance * 100).toFixed(1)}%</span>
              </div>
            </div>

            {result.content && (
              <p className="text-xs text-zinc-400 font-mono leading-relaxed line-clamp-3">{result.content.slice(0, 200)}</p>
            )}

            {result.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {result.tags.slice(0, 5).map((tag, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded-full text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* ── Empty states ── */}
      {mode === 'browse' && !loading && entries.length === 0 && (
        <div className="text-center py-12 text-zinc-600 text-sm">No {activeType} entries found</div>
      )}
      {mode === 'search' && !loading && searchResults.length === 0 && searchQuery && (
        <div className="text-center py-12 text-zinc-600 text-sm">No results for &quot;{searchQuery}&quot;</div>
      )}
    </div>
  )
}
