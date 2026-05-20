'use client'

import { useState, useCallback, useEffect } from 'react'
import type { ExperienceEntry } from '@/lib/types'
import { ExperienceNewForm } from './ExperienceNewForm'
import { ExperienceEntryCard } from './ExperienceEntryCard'

// ── Component ───────────────────────────────────────────────

interface ExperienceBrowseProps {
  refreshTrigger: number
}

export function ExperienceBrowse({ refreshTrigger }: ExperienceBrowseProps) {
  const [entries, setEntries] = useState<ExperienceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)

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

  useEffect(() => { loadEntries() }, [loadEntries, refreshTrigger])

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

  // ── Submit new experience (delegated to ExperienceNewForm) ─

  const handleSubmitNew = useCallback(async (data: { title: string; good: string; bad: string; why: string }) => {
    try {
      const res = await fetch('/api/memory/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'manual', ...data }),
      })
      if (res.ok) {
        loadEntries()
        return true
      }
      return false
    } catch {
      return false
    }
  }, [loadEntries])

  // ── Render ────────────────────────────────────────────────

  return (
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
        <ExperienceNewForm
          onSubmit={handleSubmitNew}
          onCancel={() => setShowNewForm(false)}
        />
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

      {/* ── Empty state ── */}
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

      {/* ── Entries list ── */}
      {!loading && entries.map((entry) => (
        <ExperienceEntryCard
          key={entry.id}
          entry={entry}
          onVerify={handleVerify}
        />
      ))}
    </>
  )
}
