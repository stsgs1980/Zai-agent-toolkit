'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { GraphViewer } from '@/components/GraphViewer'
import { GraphStats } from '@/components/GraphStats'

// Types
interface MemoryEntry {
  id: string
  type: 'session' | 'knowledge' | 'pattern' | 'project' | 'template'
  content: string
  metadata: Record<string, string>
  created_at: string
  distance?: number
  relevanceScore?: number
  similarityScore?: number
  similarityReason?: string
}

interface MemoryStats {
  total: number
  byType: Record<string, number>
}

const TYPE_LABELS: Record<string, string> = {
  knowledge: 'Knowledge',
  session: 'Session',
  pattern: 'Pattern',
  project: 'Project',
  template: 'Template'
}

const TYPE_COLORS: Record<string, string> = {
  knowledge: '#a855f7',
  session: '#38bdf8',
  pattern: '#fbbf24',
  project: '#4ade80',
  template: '#fb923c',
}

// Icons
const Icons = {
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Copy: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Brain: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Refresh: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Graph: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
  List: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  Database: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
}

// Terminal Frame
function TerminalFrame({ title, children, headerRight }: { title: string; children: React.ReactNode; headerRight?: React.ReactNode }) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        border: "1px solid #33415544",
      }}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs font-mono text-zinc-500 ml-2">{title}</span>
        {headerRight && <div className="ml-auto">{headerRight}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// Button
function Button({ children, variant = 'default', size = 'default', className = '', ...props }: any) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none'
  const variants: Record<string, string> = {
    default: 'bg-zinc-100 text-zinc-900 hover:bg-white',
    outline: 'border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200',
    ghost: 'bg-transparent hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200',
    destructive: 'bg-red-600 text-white hover:bg-red-500'
  }
  const sizes: Record<string, string> = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs',
    icon: 'h-9 w-9'
  }
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>
}

// Input
function Input({ className = '', ...props }: any) {
  return <input className={`flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-900/50 text-zinc-100 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/50 focus:border-sky-500/50 placeholder-zinc-600 transition-all duration-200 ${className}`} {...props} />
}

// Textarea
function Textarea({ className = '', ...props }: any) {
  return <textarea className={`flex min-h-[60px] w-full rounded-md border border-zinc-700 bg-zinc-900/50 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/50 focus:border-sky-500/50 resize-none placeholder-zinc-600 transition-all duration-200 ${className}`} {...props} />
}

// Label
function Label({ children, className = '' }: any) {
  return <label className={`text-sm font-medium leading-none text-zinc-400 ${className}`}>{children}</label>
}

// Badge
function Badge({ children, variant = 'default', className = '' }: any) {
  const variants: Record<string, string> = {
    default: 'bg-zinc-800 text-zinc-200',
    secondary: 'bg-zinc-800/50 text-zinc-500',
    outline: 'border border-zinc-700 bg-transparent text-zinc-400'
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>{children}</span>
}

// Select
function Select({ value, onValueChange }: any) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-900/50 text-zinc-100 px-3 py-2 text-sm"
      >
        {TYPE_LABELS[value] || value}
        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 shadow-lg overflow-hidden">
          {['knowledge', 'session', 'pattern', 'project', 'template'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => { onValueChange(type); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Dialog
function Dialog({ open, onOpenChange, children }: any) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div
        className="relative z-50 w-full max-w-md rounded-lg shadow-2xl p-6 mx-4"
        style={{
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          border: "1px solid #33415566",
        }}
      >
        {children}
      </div>
    </div>
  )
}

function toast(message: { title: string; description?: string }) {
  alert(message.title + (message.description ? `\n${message.description}` : ''))
}

// ── Main Component ──────────────────────────────────────────

export default function MemoryDashboard() {
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [allEntries, setAllEntries] = useState<MemoryEntry[]>([])
  const [stats, setStats] = useState<MemoryStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('knowledge')
  const [loading, setLoading] = useState(true)
  const [semanticLoading, setSemanticLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<MemoryEntry | null>(null)
  const [relatedEntries, setRelatedEntries] = useState<MemoryEntry[]>([])
  const [relatedLoading, setRelatedLoading] = useState(false)
  const [semanticMode, setSemanticMode] = useState(false)
  const [newEntry, setNewEntry] = useState({ type: 'knowledge', content: '', metadata: '' })
  const [viewMode, setViewMode] = useState<'entries' | 'graph'>('entries')

  const searchInputRef = useRef<HTMLInputElement>(null)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/memory?action=stats')
      const data = await res.json()
      if (data.success) setStats(data.data)
    } catch {}
  }

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const url = `/api/memory?action=list&type=${selectedType}&limit=50`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) setEntries(data.data)
    } catch {} finally {
      setLoading(false)
    }
  }

  const fetchAllEntries = async () => {
    try {
      const res = await fetch('/api/memory?limit=100')
      const data = await res.json()
      if (data.success) setAllEntries(data.data)
    } catch {}
  }

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) { fetchEntries(); return }
    setSemanticLoading(true)
    setSemanticMode(true)
    try {
      const res = await fetch('/api/memory/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, entries: allEntries, limit: 20 })
      })
      const data = await res.json()
      setEntries(data.results || [])
    } catch {
      toast({ title: 'Search error' })
    } finally {
      setSemanticLoading(false)
    }
  }

  const handleSearch = async () => {
    if (semanticMode) { handleSemanticSearch(); return }
    if (!searchQuery.trim()) { fetchEntries(); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/memory?action=query&query=${encodeURIComponent(searchQuery)}&limit=20`)
      const data = await res.json()
      if (data.success) setEntries(data.data)
    } catch {} finally {
      setLoading(false)
    }
  }

  const fetchRelated = useCallback(async (entry: MemoryEntry) => {
    if (allEntries.length <= 1) return
    setRelatedLoading(true)
    try {
      const res = await fetch('/api/memory/related', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry, entries: allEntries, limit: 5 })
      })
      const data = await res.json()
      setRelatedEntries(data.related || [])
    } catch {} finally {
      setRelatedLoading(false)
    }
  }, [allEntries])

  const handleAddEntry = async () => {
    if (!newEntry.content.trim()) { toast({ title: 'Content required' }); return }
    const metadata: Record<string, string> = {}
    if (newEntry.metadata) {
      newEntry.metadata.split(',').forEach(pair => {
        const [key, value] = pair.split('=')
        if (key && value) metadata[key.trim()] = value.trim()
      })
    }
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newEntry.type, content: newEntry.content, metadata })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Stored' })
        setDialogOpen(false)
        setNewEntry({ type: 'knowledge', content: '', metadata: '' })
        fetchEntries(); fetchStats(); fetchAllEntries()
      }
    } catch { toast({ title: 'Error' }) }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/memory?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { setDetailOpen(false); setSelectedEntry(null); fetchEntries(); fetchStats(); fetchAllEntries() }
    } catch {}
  }

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); toast({ title: 'Copied' }) }

  const openEntry = (entry: MemoryEntry) => { setSelectedEntry(entry); setDetailOpen(true); fetchRelated(entry) }

  useEffect(() => { fetchStats(); fetchAllEntries() }, [])
  useEffect(() => { if (!semanticMode) fetchEntries() }, [selectedType, semanticMode])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); searchInputRef.current?.focus() }
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); setDialogOpen(true) }
      if (e.ctrlKey && e.key === 'g') { e.preventDefault(); setViewMode(v => v === 'graph' ? 'entries' : 'graph') }
      if (e.key === 'Escape') { setDetailOpen(false); setSelectedEntry(null) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: "linear-gradient(180deg, #020617 0%, #0f172a 100%)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* ═══ Header ═══ */}
        <header className="flex items-center justify-between mb-6 pb-4">
          {/* Left: Logo + title */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #38bdf822, #a855f722)",
                border: "1px solid #38bdf833",
                boxShadow: "0 0 15px #38bdf811",
              }}
            >
              <Icons.Database />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                Memory Dashboard
                {viewMode === 'graph' && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-normal"
                    style={{
                      backgroundColor: "#38bdf815",
                      color: "#38bdf8",
                      border: "1px solid #38bdf833",
                    }}
                  >
                    GRAPH
                  </span>
                )}
              </h1>
              <p className="text-xs text-zinc-600">
                {stats ? `${stats.total} entries` : 'Loading...'}
                <span className="ml-2 text-zinc-700">Ctrl+K Ctrl+N Ctrl+G Esc</span>
              </p>
            </div>
          </div>

          {/* Right: Tabs + New button */}
          <div className="flex items-center gap-2">
            <div
              className="flex rounded-lg overflow-hidden"
              style={{
                border: "1px solid #1e293b",
                boxShadow: "inset 0 1px 0 #ffffff06",
              }}
            >
              <button
                onClick={() => setViewMode('entries')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm transition-all duration-200"
                style={{
                  background: viewMode === 'entries' ? "linear-gradient(180deg, #e2e8f0, #cbd5e1)" : "transparent",
                  color: viewMode === 'entries' ? '#0f172a' : '#64748b',
                  boxShadow: viewMode === 'entries' ? '0 0 10px #94a3b833' : 'none',
                }}
              >
                <Icons.List /> Entries
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm transition-all duration-200"
                style={{
                  background: viewMode === 'graph' ? "linear-gradient(180deg, #38bdf8, #0ea5e9)" : "transparent",
                  color: viewMode === 'graph' ? '#0c4a6e' : '#64748b',
                  boxShadow: viewMode === 'graph' ? '0 0 15px #38bdf844' : 'none',
                }}
              >
                <Icons.Graph /> Graph
              </button>
            </div>
            <button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-lg transition-all duration-200"
              style={{
                background: "linear-gradient(180deg, #e2e8f0, #cbd5e1)",
                color: "#0f172a",
              }}
            >
              <Icons.Plus /> New
            </button>
          </div>
        </header>

        {/* Accent line under header */}
        <div
          className="mb-6 h-px"
          style={{
            background: viewMode === 'graph'
              ? "linear-gradient(90deg, transparent, #38bdf855, transparent)"
              : "linear-gradient(90deg, transparent, #1e293b, transparent)",
          }}
        />

        {/* ═══ GRAPH VIEW ═══ */}
        {viewMode === 'graph' && (
          <div className="space-y-2">
            <GraphStats />
            <GraphViewer />
          </div>
        )}

        {/* ═══ ENTRIES VIEW ═══ */}
        {viewMode === 'entries' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar */}
            <aside className="col-span-3 space-y-4">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                  <Icons.Search />
                </div>
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={semanticMode ? 'AI search...' : 'Search...'}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSemanticMode(!semanticMode); if (!semanticMode && searchQuery) handleSemanticSearch() }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-all duration-200"
                  style={{
                    background: semanticMode ? "linear-gradient(135deg, #a855f722, #a855f711)" : "transparent",
                    border: `1px solid ${semanticMode ? "#a855f744" : "#1e293b"}`,
                    color: semanticMode ? "#c084fc" : "#64748b",
                    boxShadow: semanticMode ? "0 0 10px #a855f711" : "none",
                  }}
                >
                  <Icons.Brain /> AI
                </button>
                <Button variant="outline" size="sm" onClick={handleSearch}>Search</Button>
              </div>

              {/* Type Filters */}
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider px-3">Types</span>
                {stats && Object.entries(stats.byType)
                  .filter(([_, count]) => count > 0)
                  .map(([type, count]) => (
                    <button
                      key={type}
                      onClick={() => { setSelectedType(type); setSemanticMode(false) }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-all duration-200"
                      style={{
                        background: selectedType === type && !semanticMode
                          ? `${TYPE_COLORS[type] || "#38bdf8"}11` : "transparent",
                        border: "1px solid transparent",
                        borderColor: selectedType === type && !semanticMode
                          ? `${TYPE_COLORS[type] || "#38bdf8"}33` : "transparent",
                        color: selectedType === type && !semanticMode
                          ? TYPE_COLORS[type] || "#38bdf8" : "#64748b",
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: TYPE_COLORS[type] || "#38bdf8" }}
                        />
                        <span className="capitalize">{type}</span>
                      </span>
                      <span className="text-zinc-600 text-xs">{count}</span>
                    </button>
                  ))}
              </div>
            </aside>

            {/* Main Content */}
            <main className="col-span-6">
              {semanticMode && (
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{
                      backgroundColor: "#a855f715",
                      color: "#c084fc",
                      border: "1px solid #a855f733",
                    }}
                  >
                    <Icons.Brain /> Semantic
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => { setSemanticMode(false); fetchEntries() }}>Clear</Button>
                </div>
              )}

              {loading || semanticLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "linear-gradient(90deg, #0f172a, #1e293b, #0f172a)" }} />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-zinc-700">No entries</div>
              ) : (
                <div className="space-y-0.5">
                  {entries.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => openEntry(entry)}
                      className="w-full text-left group flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-zinc-800/30 transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: TYPE_COLORS[entry.type] || "#38bdf8" }}
                          />
                          <span className="text-xs text-zinc-500 capitalize">{entry.type}</span>
                          {(entry.distance !== undefined || entry.relevanceScore !== undefined) && (
                            <span className="text-xs text-zinc-600">
                              {Math.round(((entry.distance ? 1 - entry.distance : entry.relevanceScore || 0)) * 100)}%
                            </span>
                          )}
                          <span className="text-xs text-zinc-700">{new Date(entry.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-zinc-400 group-hover:text-zinc-200 line-clamp-2 transition-colors">{entry.content}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </main>

            {/* Stats Panel */}
            <aside className="col-span-3">
              {stats && (
                <div
                  className="rounded-lg p-3 space-y-3"
                  style={{
                    background: "linear-gradient(135deg, #0f172a, #1e293b)",
                    border: "1px solid #1e293b44",
                  }}
                >
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Statistics</span>
                  <div className="space-y-2">
                    {Object.entries(stats.byType)
                      .filter(([_, count]) => count > 0)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-zinc-500">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />
                            {type}
                          </span>
                          <span className="font-mono text-zinc-300">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* New Entry Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">New Entry</h2>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={newEntry.type} onValueChange={(v: string) => setNewEntry({ ...newEntry, type: v })} />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={newEntry.content}
                onChange={(e: any) => setNewEntry({ ...newEntry, content: e.target.value })}
                placeholder="Enter content..."
                rows={4}
              />
            </div>
            <div>
              <Label className="text-zinc-600">Metadata (optional)</Label>
              <Input
                value={newEntry.metadata}
                onChange={(e: any) => setNewEntry({ ...newEntry, metadata: e.target.value })}
                placeholder="key=value, project=myapp"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <button
              onClick={handleAddEntry}
              className="px-4 py-2 text-sm rounded-md font-medium transition-all duration-200"
              style={{
                background: "linear-gradient(180deg, #38bdf8, #0ea5e9)",
                color: "#0c4a6e",
                boxShadow: "0 0 10px #38bdf833",
              }}
            >
              Store
            </button>
          </div>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          {selectedEntry && (
            <TerminalFrame title={`memory/${selectedEntry.type}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: TYPE_COLORS[selectedEntry.type] || "#38bdf8" }}
                  />
                  <span className="text-xs text-zinc-400 capitalize">{selectedEntry.type}</span>
                  <span className="text-xs text-zinc-600">{new Date(selectedEntry.created_at).toLocaleString()}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(selectedEntry.content)}><Icons.Copy /></Button>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400" onClick={() => handleDelete(selectedEntry.id)}><Icons.Trash /></Button>
                </div>
              </div>

              <div className="bg-zinc-950/50 p-3 rounded mb-4 max-h-64 overflow-auto">
                <pre className="text-sm whitespace-pre-wrap text-zinc-300">{selectedEntry.content}</pre>
              </div>

              {Object.keys(selectedEntry.metadata).filter(k => k !== 'type').length > 0 && (
                <div className="space-y-1 text-xs mb-4">
                  {Object.entries(selectedEntry.metadata)
                    .filter(([k]) => k !== 'type')
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-zinc-600">{key}:</span>
                        <span className="text-zinc-300 font-mono">{value}</span>
                      </div>
                    ))}
                </div>
              )}

              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Related</span>
                  <Button variant="ghost" size="icon" onClick={() => fetchRelated(selectedEntry)} disabled={relatedLoading}>
                    <Icons.Refresh />
                  </Button>
                </div>
                {relatedLoading ? (
                  <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-8 rounded animate-pulse" style={{ background: "linear-gradient(90deg, #0f172a, #1e293b, #0f172a)" }} />)}</div>
                ) : relatedEntries.length > 0 ? (
                  <div className="space-y-1">
                    {relatedEntries.map(rel => (
                      <button
                        key={rel.id}
                        onClick={() => { setSelectedEntry(rel); fetchRelated(rel) }}
                        className="w-full flex items-center justify-between p-2 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 text-left transition-all duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate text-zinc-300">{rel.content}</p>
                          <p className="text-[10px] text-zinc-600">{rel.similarityReason}</p>
                        </div>
                        <span
                          className="ml-2 px-1.5 py-0.5 rounded-full text-[10px]"
                          style={{
                            backgroundColor: rel.similarityScore && rel.similarityScore >= 0.7 ? "#4ade8015" : "#1e293b",
                            color: rel.similarityScore && rel.similarityScore >= 0.7 ? "#4ade80" : "#64748b",
                            border: `1px solid ${rel.similarityScore && rel.similarityScore >= 0.7 ? "#4ade8033" : "#1e293b"}`,
                          }}
                        >
                          {rel.similarityScore ? Math.round(rel.similarityScore * 100) : 0}%
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-700">No related entries</p>
                )}
              </div>
            </TerminalFrame>
          )}
        </Dialog>
      </div>
    </div>
  )
}
