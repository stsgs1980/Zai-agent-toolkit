'use client'

// ============================================================
// Memory Dashboard with Graph Integration
// ============================================================
// This is a REFERENCE template showing how to integrate
// GraphViewer + GraphStats into an existing memory-dashboard.
//
// MINIMAL CHANGES needed (see comments marked with ★):
//   1. Add imports for GraphViewer, GraphStats
//   2. Add viewMode state
//   3. Add Graph/List icons to Icons object
//   4. Add tab toggle buttons in header
//   5. Add Ctrl+G keyboard shortcut
//   6. Wrap existing content in viewMode === 'entries'
//   7. Add graph view block
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'

// ★ ADD THESE TWO IMPORTS:
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

// Icons (inline SVG)
const Icons = {
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Copy: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Brain: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Refresh: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  // ★ ADD THESE TWO ICONS:
  Graph: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
  List: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
}

// Terminal Frame Component
function TerminalFrame({ title, children, headerRight }: { title: string; children: React.ReactNode; headerRight?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border-b border-zinc-700">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <span className="text-xs font-mono text-zinc-400 ml-2">
          {title}
        </span>
        {headerRight && <div className="ml-auto">{headerRight}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// Button Component
function Button({ children, variant = 'default', size = 'default', className = '', ...props }: any) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const variants: Record<string, string> = {
    default: 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
    outline: 'border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300',
    ghost: 'bg-transparent hover:bg-zinc-800 text-zinc-300',
    destructive: 'bg-red-500 text-white hover:bg-red-600'
  }
  const sizes: Record<string, string> = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs',
    icon: 'h-9 w-9'
  }
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>
}

// Input Component
function Input({ className = '', ...props }: any) {
  return <input className={`flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100 px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-500 placeholder-zinc-500 ${className}`} {...props} />
}

// Textarea Component
function Textarea({ className = '', ...props }: any) {
  return <textarea className={`flex min-h-[60px] w-full rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-500 resize-none placeholder-zinc-500 ${className}`} {...props} />
}

// Label Component
function Label({ children, className = '' }: any) {
  return <label className={`text-sm font-medium leading-none text-zinc-300 ${className}`}>{children}</label>
}

// Badge Component
function Badge({ children, variant = 'default', className = '' }: any) {
  const variants: Record<string, string> = {
    default: 'bg-zinc-800 text-zinc-100',
    secondary: 'bg-zinc-800/50 text-zinc-400',
    outline: 'border border-zinc-700 bg-transparent text-zinc-300'
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>{children}</span>
}

// Select Components
function Select({ value, onValueChange, children }: any) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100 px-3 py-2 text-sm"
      >
        {TYPE_LABELS[value] || value}
        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 shadow-lg">
          <div className="p-1">
            {['knowledge', 'session', 'pattern', 'project', 'template'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => { onValueChange(type); setOpen(false) }}
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                {TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Dialog Components
function Dialog({ open, onOpenChange, children }: any) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg p-6 mx-4">
        {children}
      </div>
    </div>
  )
}

// Toast notification
function toast(message: { title: string; description?: string }) {
  alert(message.title + (message.description ? `\n${message.description}` : ''))
}

// Main Component
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

  // ★ ADD THIS STATE:
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
    if (!newEntry.content.trim()) {
      toast({ title: 'Content required' })
      return
    }
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
        fetchEntries()
        fetchStats()
        fetchAllEntries()
      }
    } catch {
      toast({ title: 'Error' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/memory?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setDetailOpen(false)
        setSelectedEntry(null)
        fetchEntries()
        fetchStats()
        fetchAllEntries()
      }
    } catch {}
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied' })
  }

  const openEntry = (entry: MemoryEntry) => {
    setSelectedEntry(entry)
    setDetailOpen(true)
    fetchRelated(entry)
  }

  useEffect(() => {
    fetchStats()
    fetchAllEntries()
  }, [])

  useEffect(() => {
    if (!semanticMode) fetchEntries()
  }, [selectedType, semanticMode])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); searchInputRef.current?.focus() }
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); setDialogOpen(true) }
      // ★ ADD THIS SHORTCUT:
      if (e.ctrlKey && e.key === 'g') { e.preventDefault(); setViewMode(v => v === 'graph' ? 'entries' : 'graph') }
      if (e.key === 'Escape') { setDetailOpen(false); setSelectedEntry(null) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Memory Dashboard</h1>
            <p className="text-sm text-zinc-500">
              {stats ? `${stats.total} entries` : 'Loading...'}
              <span className="ml-3 text-xs text-zinc-600">[Ctrl+K search] [Ctrl+N new] [Ctrl+G graph] [Esc back]</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* ★ ADD THESE TAB BUTTONS: */}
            <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
              <button
                onClick={() => setViewMode('entries')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                  viewMode === 'entries'
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <Icons.List /> Entries
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                  viewMode === 'graph'
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <Icons.Graph /> Graph
              </button>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Icons.Plus /> New
            </Button>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════
            ★ GRAPH VIEW — NEW!
            ═══════════════════════════════════════════════════════ */}
        {viewMode === 'graph' && (
          <div className="space-y-4">
            <GraphStats />
            <GraphViewer />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            ★ ENTRIES VIEW — wrap existing content in this condition
            ═══════════════════════════════════════════════════════ */}
        {viewMode === 'entries' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar */}
            <aside className="col-span-3 space-y-4">
              <div className="relative">
                <Icons.Search />
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
                <Button
                  variant={semanticMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setSemanticMode(!semanticMode); if (!semanticMode && searchQuery) handleSemanticSearch() }}
                  className="gap-1"
                >
                  <Icons.Brain /> AI
                </Button>
                <Button variant="outline" size="sm" onClick={handleSearch}>Search</Button>
              </div>

              {/* Type Filters */}
              <div className="space-y-1">
                <span className="text-xs text-zinc-500 uppercase tracking-wide">Types</span>
                {stats && Object.entries(stats.byType)
                  .filter(([_, count]) => count > 0)
                  .map(([type, count]) => (
                    <button
                      key={type}
                      onClick={() => { setSelectedType(type); setSemanticMode(false) }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                        selectedType === type && !semanticMode
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="capitalize">{type}</span>
                      <span className="text-zinc-600">{count}</span>
                    </button>
                  ))}
              </div>
            </aside>

            {/* Main Content */}
            <main className="col-span-6">
              {semanticMode && (
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="gap-1"><Icons.Brain /> Semantic Mode</Badge>
                  <Button variant="ghost" size="sm" onClick={() => { setSemanticMode(false); fetchEntries() }}>Clear</Button>
                </div>
              )}

              {loading || semanticLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 rounded bg-zinc-800 animate-pulse" />)}
                </div>
              ) : entries.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-zinc-600">No entries</div>
              ) : (
                <div className="space-y-1">
                  {entries.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => openEntry(entry)}
                      className="w-full text-left group flex items-start gap-3 py-3 px-3 rounded hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-zinc-500 capitalize">{entry.type}</span>
                          {(entry.distance !== undefined || entry.relevanceScore !== undefined) && (
                            <span className="text-xs text-zinc-500">
                              {Math.round(((entry.distance ? 1 - entry.distance : entry.relevanceScore || 0)) * 100)}%
                            </span>
                          )}
                          <span className="text-xs text-zinc-600">{new Date(entry.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-zinc-300 line-clamp-2">{entry.content}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </main>

            {/* Stats Panel */}
            <aside className="col-span-3">
              {stats && (
                <div className="space-y-4">
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Statistics</span>
                  <div className="space-y-3">
                    {Object.entries(stats.byType)
                      .filter(([_, count]) => count > 0)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400 capitalize">{type}</span>
                          <span className="text-sm font-medium text-zinc-200">{count}</span>
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
              <Label className="text-zinc-500">Metadata (optional)</Label>
              <Input
                value={newEntry.metadata}
                onChange={(e: any) => setNewEntry({ ...newEntry, metadata: e.target.value })}
                placeholder="key=value, project=myapp"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEntry}>Store</Button>
          </div>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          {selectedEntry && (
            <TerminalFrame title={`memory/${selectedEntry.type}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge className="capitalize">{selectedEntry.type}</Badge>
                  <span className="text-xs text-zinc-500">{new Date(selectedEntry.created_at).toLocaleString()}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(selectedEntry.content)}><Icons.Copy /></Button>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400" onClick={() => handleDelete(selectedEntry.id)}><Icons.Trash /></Button>
                </div>
              </div>

              <div className="bg-zinc-800/50 p-3 rounded mb-4 max-h-64 overflow-auto">
                <pre className="text-sm whitespace-pre-wrap text-zinc-200">{selectedEntry.content}</pre>
              </div>

              {Object.keys(selectedEntry.metadata).filter(k => k !== 'type').length > 0 && (
                <div className="space-y-1 text-xs mb-4">
                  {Object.entries(selectedEntry.metadata)
                    .filter(([k]) => k !== 'type')
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-zinc-500">{key}:</span>
                        <span className="text-zinc-300 font-mono">{value}</span>
                      </div>
                    ))}
                </div>
              )}

              <div className="pt-4 border-t border-zinc-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-500 uppercase">Related</span>
                  <Button variant="ghost" size="icon" onClick={() => fetchRelated(selectedEntry)} disabled={relatedLoading}>
                    <Icons.Refresh />
                  </Button>
                </div>
                {relatedLoading ? (
                  <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-8 bg-zinc-800 rounded animate-pulse" />)}</div>
                ) : relatedEntries.length > 0 ? (
                  <div className="space-y-1">
                    {relatedEntries.map(rel => (
                      <button
                        key={rel.id}
                        onClick={() => { setSelectedEntry(rel); fetchRelated(rel) }}
                        className="w-full flex items-center justify-between p-2 rounded border border-zinc-700 hover:bg-zinc-800 text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate text-zinc-300">{rel.content}</p>
                          <p className="text-[10px] text-zinc-500">{rel.similarityReason}</p>
                        </div>
                        <Badge className={`ml-2 text-[10px] ${rel.similarityScore && rel.similarityScore >= 0.7 ? 'bg-green-900 text-green-300' : ''}`}>
                          {rel.similarityScore ? Math.round(rel.similarityScore * 100) : 0}%
                        </Badge>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600">No related entries</p>
                )}
              </div>
            </TerminalFrame>
          )}
        </Dialog>
      </div>
    </div>
  )
}
