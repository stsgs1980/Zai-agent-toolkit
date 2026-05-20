'use client'

import { useState, useCallback, useEffect } from 'react'
import type { ExtractedEntry } from '@/lib/types'
import { ExtractedEntryCard } from './ExtractedEntryCard'

// ── Component ───────────────────────────────────────────────

interface ExperienceExtractProps {
  onIngestComplete: () => void
}

export function ExperienceExtract({ onIngestComplete }: ExperienceExtractProps) {
  const [extractContent, setExtractContent] = useState('')
  const [extractSourceTag, setExtractSourceTag] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractedEntries, setExtractedEntries] = useState<ExtractedEntry[]>([])
  const [ingesting, setIngesting] = useState(false)
  const [ingestResult, setIngestResult] = useState<{ stored: number; failed: number; total: number } | null>(null)
  const [error, setError] = useState('')

  // Auto-dismiss ingest result after 6s
  useEffect(() => {
    if (!ingestResult) return
    const timer = setTimeout(() => setIngestResult(null), 6000)
    return () => clearTimeout(timer)
  }, [ingestResult])

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
        setExtractContent('')
        setExtractSourceTag('')
        setExtractedEntries([])
        onIngestComplete()
      } else {
        setError(`Ingestion failed: 0 of ${total} entries stored.`)
      }
    } catch (e: any) {
      setError(`Ingest error: ${e.message}`)
    } finally {
      setIngesting(false)
    }
  }, [extractedEntries, extractSourceTag, onIngestComplete])

  // ── Render ────────────────────────────────────────────────

  return (
    <>
      {/* ── Terminal-style Input Area ── */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: '#0f172a', border: '1px solid #1e293b' }}
      >
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

          {extractedEntries.map((entry, idx) => (
            <ExtractedEntryCard key={idx} entry={entry} index={idx} />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
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
  )
}
