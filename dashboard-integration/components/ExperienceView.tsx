'use client'

import { useState, useCallback, useEffect } from 'react'

// ── Types ────────────────────────────────────────────────────

interface ExperienceEntry {
  id: string
  title: string
  experience_type: string
  verification_status: string
  good_count: number
  bad_count: number
  source_type: string
  preview: string
  tags: string[]
}

interface ExtractedEntry {
  title: string
  good: string
  bad: string
  why: string
  verdict: string
  tech: string[]
}

// ── Status badge colors ─────────────────────────────────────

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

const VERDICT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  mostly_succeeded:  { bg: '#22c55e18', text: '#4ade80', border: '#22c55e44' },
  mostly_failed:     { bg: '#ef444418', text: '#f87171', border: '#ef444444' },
  mixed:             { bg: '#eab30818', text: '#fbbf24', border: '#eab30844' },
  succeeded:         { bg: '#22c55e18', text: '#4ade80', border: '#22c55e44' },
  failed:            { bg: '#ef444418', text: '#f87171', border: '#ef444444' },
}

// ── Component ────────────────────────────────────────────────

export function ExperienceView() {
  const [entries, setEntries] = useState<ExperienceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)

  // New experience form
  const [newTitle, setNewTitle] = useState('')
  const [newGood, setNewGood] = useState('')
  const [newBad, setNewBad] = useState('')
  const [newWhy, setNewWhy] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Tab + AI Extract state
  const [activeTab, setActiveTab] = useState<'browse' | 'extract'>('browse')
  const [extractContent, setExtractContent] = useState('')
  const [extractSourceTag, setExtractSourceTag] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractedEntries, setExtractedEntries] = useState<ExtractedEntry[]>([])
  const [ingesting, setIngesting] = useState(false)
  const [ingestResult, setIngestResult] = useState<{ stored: number; failed: number; total: number } | null>(null)

  // Auto-dismiss ingest result after 6s
  useEffect(() => {
    if (!ingestResult) return
    const timer = setTimeout(() => setIngestResult(null), 6000)
    return () => clearTimeout(timer)
  }, [ingestResult])

  // ── Load entries ──────────────────────────────────────────

  const loadEntries = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/memory/experience')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setEntries(data.entries || [])
    } catch (e: any) {
      setError(e.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadEntries() }, [loadEntries])

  // ── Search ────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      loadEntries()
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/memory/experience?action=query&q=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setEntries(data.entries || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, loadEntries])

  // ── Verify entry ──────────────────────────────────────────

  const handleVerify = useCallback(async (id: string, status: string) => {
    try {
      const res = await fetch('/api/memory/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', id, status }),
      })
      if (res.ok) {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, verification_status: status } : e))
      }
    } catch {
      // silent
    }
  }, [])

  // ── Submit new experience ─────────────────────────────────

  const handleSubmitNew = useCallback(async () => {
    if (!newTitle.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/memory/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual',
          title: newTitle,
          good: newGood,
          bad: newBad,
          why: newWhy,
        }),
      })
      if (res.ok) {
        setNewTitle(''); setNewGood(''); setNewBad(''); setNewWhy('')
        setShowNewForm(false)
        loadEntries()
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false)
    }
  }, [newTitle, newGood, newBad, newWhy, loadEntries])

  // ── AI Extract ────────────────────────────────────────────

  const handleExtract = useCallback(async () => {
    if (!extractContent.trim()) return
    setExtracting(true)
    setError('')
    setExtractedEntries([])
    try {
      const res = await fetch('/api/memory/experience/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: extractContent }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Extraction failed')
      }
      setExtractedEntries(data.entries || [])
    } catch (e: any) {
      setError(e.message || 'Unknown error')
    } finally {
      setExtracting(false)
    }
  }, [extractContent])

  // ── Ingest All ────────────────────────────────────────────

  const handleIngestAll = useCallback(async () => {
    if (extractedEntries.length === 0) return
    setIngesting(true)
    try {
      let stored = 0
      let failed = 0

      for (const entry of extractedEntries) {
        try {
          const res = await fetch('/api/memory/experience', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'store',
              title: entry.title,
              good: entry.good,
              bad: entry.bad,
              why: entry.why,
              tech: entry.tech,
              verdict: entry.verdict,
              source: extractSourceTag || 'ai-extract',
            }),
          })
          if (res.ok) {
            stored++
          } else {
            failed++
          }
        } catch {
          failed++
        }
      }

      const total = stored + failed
      if (stored > 0) {
        setIngestResult({ stored, failed, total })
        // Auto-clear on success
        setExtractContent('')
        setExtractSourceTag('')
        setExtractedEntries([])
        loadEntries()
      } else {
        setError(`Ingestion failed: 0 of ${total} entries stored.`)
      }
    } catch (e: any) {
      setError(`Ingest error: ${e.message}`)
    } finally {
      setIngesting(false)
    }
  }, [extractedEntries, extractSourceTag, loadEntries])

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Tab Bar ── */}
      <div
        className="flex rounded-lg overflow-hidden"
        style={{ background: '#0f172a', border: '1px solid #1e293b' }}
      >
        <button
          onClick={() => setActiveTab('browse')}
          className="flex-1 px-4 py-2 text-xs font-mono font-medium transition-all"
          style={{
            background: activeTab === 'browse' ? 'linear-gradient(180deg, #a855f7, #7c3aed)' : 'transparent',
            color: activeTab === 'browse' ? '#fff' : '#64748b',
            boxShadow: activeTab === 'browse' ? '0 0 10px #a855f733' : 'none',
          }}
        >
          Browse
        </button>
        <button
          onClick={() => setActiveTab('extract')}
          className="flex-1 px-4 py-2 text-xs font-mono font-medium transition-all"
          style={{
            background: activeTab === 'extract' ? 'linear-gradient(180deg, #a855f7, #7c3aed)' : 'transparent',
            color: activeTab === 'extract' ? '#fff' : '#64748b',
            boxShadow: activeTab === 'extract' ? '0 0 10px #a855f733' : 'none',
          }}
        >
          AI Extract
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════
          TAB: Browse (existing functionality)
          ════════════════════════════════════════════════════════ */}
      {activeTab === 'browse' && (
        <>
          {/* ── Header + Search ── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search experience..."
                className="w-full h-9 px-3 pl-9 text-sm rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 font-mono"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="h-9 px-4 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-all shrink-0"
              style={{
                background: showNewForm ? '#334155' : 'linear-gradient(180deg, #a855f7, #7c3aed)',
                color: showNewForm ? '#64748b' : '#fff',
                boxShadow: showNewForm ? 'none' : '0 0 10px #a855f733',
              }}
            >
              {showNewForm ? 'Cancel' : '+ New'}
            </button>
          </div>

          {/* ── New experience form ── */}
          {showNewForm && (
            <div
              className="rounded-lg p-4 space-y-3"
              style={{
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                border: '1px solid #a855f733',
                boxShadow: '0 0 20px #a855f711',
              }}
            >
              <div className="text-xs font-mono text-purple-400 uppercase tracking-wider">New Experience</div>

              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title: what happened?"
                className="w-full h-8 px-3 text-sm rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 4px #4ade8088' }} />
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono">Good</span>
                  </div>
                  <textarea
                    value={newGood}
                    onChange={(e) => setNewGood(e.target.value)}
                    placeholder="What worked well..."
                    className="w-full h-20 px-3 py-2 text-xs rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-300 placeholder-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" style={{ boxShadow: '0 0 4px #f8717188' }} />
                    <span className="text-[10px] text-red-400 uppercase tracking-wider font-mono">Bad</span>
                  </div>
                  <textarea
                    value={newBad}
                    onChange={(e) => setNewBad(e.target.value)}
                    placeholder="What failed..."
                    className="w-full h-20 px-3 py-2 text-xs rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-300 placeholder-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-red-500/50"
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Why (verdict)</span>
                <input
                  value={newWhy}
                  onChange={(e) => setNewWhy(e.target.value)}
                  placeholder="Root cause / lesson learned..."
                  className="w-full h-8 px-3 text-xs rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-300 placeholder-zinc-600 mt-1 focus:outline-none focus:ring-1 focus:ring-zinc-500/50"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSubmitNew}
                  disabled={submitting || !newTitle.trim()}
                  className="h-8 px-4 text-xs rounded-md font-medium flex items-center gap-1.5 transition-all"
                  style={{
                    background: submitting ? '#334155' : 'linear-gradient(180deg, #4ade80, #16a34a)',
                    color: submitting ? '#64748b' : '#052e16',
                  }}
                >
                  {submitting ? 'Saving...' : 'Save Experience'}
                </button>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* ── Entries list ── */}
          {!loading && entries.length === 0 && (
            <div
              className="rounded-lg flex flex-col items-center justify-center py-16 gap-3"
              style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', border: '1px solid #1e293b44' }}
            >
              <svg className="w-8 h-8 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-zinc-500 text-sm">No experiences recorded yet</p>
              <code className="text-[10px] text-zinc-600 bg-zinc-900 px-3 py-1 rounded">
                python session_summary.py manual --title "My first experience"
              </code>
            </div>
          )}

          {!loading && entries.map((entry) => {
            const statusColor = STATUS_COLORS[entry.verification_status] || STATUS_COLORS.unverified
            const typeColor = TYPE_COLORS[entry.experience_type] || TYPE_COLORS.mixed

            return (
              <div
                key={entry.id}
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

                  {/* Status + verify actions */}
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
                        onClick={() => handleVerify(entry.id, 'verified')}
                        className="h-6 px-2 text-[10px] rounded border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </div>

                {/* Preview line */}
                <p className="mt-2 text-xs text-zinc-500 font-mono line-clamp-2">{entry.preview}</p>

                {/* Tags */}
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
          })}
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: AI Extract (NEW)
          ════════════════════════════════════════════════════════ */}
      {activeTab === 'extract' && (
        <>
          {/* ── Terminal-style Input Area ── */}
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: '#0f172a', border: '1px solid #1e293b' }}
          >
            {/* Header bar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <span className="text-xs font-mono text-zinc-500 ml-2">experience-extract</span>
              <div className="ml-auto flex gap-2">
                <input
                  value={extractSourceTag}
                  onChange={(e) => setExtractSourceTag(e.target.value)}
                  placeholder="source tag"
                  className="h-6 px-2 text-xs rounded border border-zinc-700 bg-zinc-900/50 text-zinc-400 font-mono w-32 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                />
                <button
                  onClick={handleExtract}
                  disabled={extracting || !extractContent.trim()}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs rounded font-medium transition-all"
                  style={{
                    background: extracting ? '#334155' : 'linear-gradient(180deg, #a855f7, #7c3aed)',
                    color: extracting ? '#64748b' : '#fff',
                    boxShadow: extracting ? 'none' : '0 0 10px #a855f733',
                  }}
                >
                  {extracting ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Extracting...
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Extract
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="p-3">
              <textarea
                value={extractContent}
                onChange={(e) => setExtractContent(e.target.value)}
                className="w-full h-40 bg-zinc-900/50 text-zinc-300 text-sm font-mono p-3 rounded-md border border-zinc-800 resize-y focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                placeholder="Paste session text, worklog, or conversation summary here..."
              />
            </div>
          </div>

          {/* ── Ingest success banner ── */}
          {ingestResult && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-mono flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Ingested <strong>{ingestResult.stored}</strong> of {ingestResult.total} entries to memory{ingestResult.failed > 0 ? ` (${ingestResult.failed} failed)` : ''} — ready for next session</span>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* ── Extracted entries ── */}
          {extractedEntries.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-500">
                  {extractedEntries.length} experience{extractedEntries.length !== 1 ? 's' : ''} extracted
                </span>
                <button
                  onClick={handleIngestAll}
                  disabled={ingesting}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-md font-medium transition-all"
                  style={{
                    background: ingesting
                      ? '#334155'
                      : 'linear-gradient(180deg, #4ade80, #16a34a)',
                    color: ingesting ? '#64748b' : '#052e16',
                    boxShadow: ingesting ? 'none' : '0 0 10px #22c55e33',
                  }}
                >
                  {ingesting ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Ingesting...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Ingest All to Memory
                    </>
                  )}
                </button>
              </div>

              {extractedEntries.map((entry, idx) => {
                const verdictColor = VERDICT_COLORS[entry.verdict] || VERDICT_COLORS.mixed

                return (
                  <div
                    key={idx}
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
              })}
            </div>
          )}

          {/* ── Empty state for extract tab ── */}
          {extractedEntries.length === 0 && !extracting && !error && (
            <div
              className="rounded-lg flex flex-col items-center justify-center py-16 gap-3"
              style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', border: '1px solid #1e293b44' }}
            >
              <svg className="w-8 h-8 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <p className="text-zinc-500 text-sm font-mono">Paste session text above to extract experiences</p>
              <p className="text-zinc-600 text-xs font-mono">AI will identify good/bad/why patterns automatically</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
