'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { GraphViewer } from '@/components/GraphViewer'
import { GraphStats } from '@/components/GraphStats'
import { DocIntelligenceView } from '@/components/DocIntelligenceView'
import { Button, Input, Textarea, Label, Select, Dialog, TerminalFrame, toast } from '@/components/ui'
import { Icons, TYPE_COLORS } from '@/lib/constants'
import type { MemoryEntry, MemoryStats } from '@/lib/types'

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
  const [viewMode, setViewMode] = useState<'entries' | 'graph' | 'doc-intel'>('entries')

  const searchInputRef = useRef<HTMLInputElement>(null)

  // ── Data fetching ──

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
    } catch {} finally { setLoading(false) }
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
    } catch { toast({ title: 'Search error' }) } finally { setSemanticLoading(false) }
  }

  const handleSearch = async () => {
    if (semanticMode) { handleSemanticSearch(); return }
    if (!searchQuery.trim()) { fetchEntries(); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/memory?action=query&query=${encodeURIComponent(searchQuery)}&limit=20`)
      const data = await res.json()
      if (data.success) setEntries(data.data)
    } catch {} finally { setLoading(false) }
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
    } catch {} finally { setRelatedLoading(false) }
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
      if (data.success) { toast({ title: 'Stored' }); setDialogOpen(false); setNewEntry({ type: 'knowledge', content: '', metadata: '' }); fetchEntries(); fetchStats(); fetchAllEntries() }
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

  const openEntryByNodeId = useCallback(async (nodeId: string) => {
    const found = allEntries.find(e => e.id === nodeId)
    if (found) { openEntry(found); return }
    try {
      const res = await fetch(`/api/memory?action=query&query=${encodeURIComponent(nodeId)}&limit=10`)
      const data = await res.json()
      if (data.success && data.data?.length > 0) {
        const exact = data.data.find((e: MemoryEntry) => e.id === nodeId)
        openEntry(exact || data.data[0])
      } else { toast({ title: 'Entry not found', description: `No memory entry for node: ${nodeId}` }) }
    } catch { toast({ title: 'Error', description: 'Failed to fetch entry' }) }
  }, [allEntries, fetchRelated])

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

  // ── Render ──

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(180deg, #020617 0%, #0f172a 100%)" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #38bdf822, #a855f722)", border: "1px solid #38bdf833", boxShadow: "0 0 15px #38bdf811" }}>
              <Icons.Database />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                Memory Dashboard
                {viewMode === 'graph' && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-normal" style={{ backgroundColor: "#38bdf815", color: "#38bdf8", border: "1px solid #38bdf833" }}>GRAPH</span>}
              </h1>
              <p className="text-xs text-zinc-600">{stats ? `${stats.total} entries` : 'Loading...'}<span className="ml-2 text-zinc-700">Ctrl+K Ctrl+N Ctrl+G Esc</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #1e293b", boxShadow: "inset 0 1px 0 #ffffff06" }}>
              <button onClick={() => setViewMode('entries')} className="flex items-center gap-1.5 px-3.5 py-2 text-sm transition-all duration-200" style={{ background: viewMode === 'entries' ? "linear-gradient(180deg, #e2e8f0, #cbd5e1)" : "transparent", color: viewMode === 'entries' ? '#0f172a' : '#64748b', boxShadow: viewMode === 'entries' ? '0 0 10px #94a3b833' : 'none' }}><Icons.List /> Entries</button>
              <button onClick={() => setViewMode('graph')} className="flex items-center gap-1.5 px-3.5 py-2 text-sm transition-all duration-200" style={{ background: viewMode === 'graph' ? "linear-gradient(180deg, #38bdf8, #0ea5e9)" : "transparent", color: viewMode === 'graph' ? '#0c4a6e' : '#64748b', boxShadow: viewMode === 'graph' ? '0 0 15px #38bdf844' : 'none' }}><Icons.Graph /> Graph</button>
              <button onClick={() => setViewMode('doc-intel')} className="flex items-center gap-1.5 px-3.5 py-2 text-sm transition-all duration-200" style={{ background: viewMode === 'doc-intel' ? "linear-gradient(180deg, #a855f7, #7c3aed)" : "transparent", color: viewMode === 'doc-intel' ? '#fff' : '#64748b', boxShadow: viewMode === 'doc-intel' ? '0 0 15px #a855f744' : 'none' }}><Icons.Brain /> AI Doc</button>
            </div>
            <button onClick={() => setDialogOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-lg transition-all duration-200" style={{ background: "linear-gradient(180deg, #e2e8f0, #cbd5e1)", color: "#0f172a" }}><Icons.Plus /> New</button>
          </div>
        </header>

        <div className="mb-6 h-px" style={{ background: viewMode === 'graph' ? "linear-gradient(90deg, transparent, #38bdf855, transparent)" : viewMode === 'doc-intel' ? "linear-gradient(90deg, transparent, #a855f755, transparent)" : "linear-gradient(90deg, transparent, #1e293b, transparent)" }} />

        {/* Graph View */}
        {viewMode === 'graph' && <div className="space-y-2"><GraphStats /><GraphViewer onNodeClick={openEntryByNodeId} /></div>}

        {/* Doc Intelligence View */}
        {viewMode === 'doc-intel' && <DocIntelligenceView />}

        {/* Entries View */}
        {viewMode === 'entries' && (
          <div className="grid grid-cols-12 gap-6">
            <aside className="col-span-3 space-y-4">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"><Icons.Search /></div>
                <Input ref={searchInputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder={semanticMode ? 'AI search...' : 'Search...'} className="pl-9" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setSemanticMode(!semanticMode); if (!semanticMode && searchQuery) handleSemanticSearch() }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-all duration-200" style={{ background: semanticMode ? "linear-gradient(135deg, #a855f722, #a855f711)" : "transparent", border: `1px solid ${semanticMode ? "#a855f744" : "#1e293b"}`, color: semanticMode ? "#c084fc" : "#64748b", boxShadow: semanticMode ? "0 0 10px #a855f711" : "none" }}><Icons.Brain /> AI</button>
                <Button variant="outline" size="sm" onClick={handleSearch}>Search</Button>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider px-3">Types</span>
                {stats && Object.entries(stats.byType).filter(([_, count]) => count > 0).map(([type, count]) => (
                  <button key={type} onClick={() => { setSelectedType(type); setSemanticMode(false) }} className="w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-all duration-200" style={{ background: selectedType === type && !semanticMode ? `${TYPE_COLORS[type] || "#38bdf8"}11` : "transparent", border: "1px solid transparent", borderColor: selectedType === type && !semanticMode ? `${TYPE_COLORS[type] || "#38bdf8"}33` : "transparent", color: selectedType === type && !semanticMode ? TYPE_COLORS[type] || "#38bdf8" : "#64748b" }}>
                    <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] || "#38bdf8" }} /><span className="capitalize">{type}</span></span>
                    <span className="text-zinc-600 text-xs">{count}</span>
                  </button>
                ))}
              </div>
            </aside>

            <main className="col-span-6">
              {semanticMode && <div className="flex items-center gap-2 mb-3"><span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: "#a855f715", color: "#c084fc", border: "1px solid #a855f733" }}><Icons.Brain /> Semantic</span><Button variant="ghost" size="sm" onClick={() => { setSemanticMode(false); fetchEntries() }}>Clear</Button></div>}
              {loading || semanticLoading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "linear-gradient(90deg, #0f172a, #1e293b, #0f172a)" }} />)}</div>
              ) : entries.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-zinc-700">No entries</div>
              ) : (
                <div className="space-y-0.5">
                  {entries.map(entry => (
                    <button key={entry.id} onClick={() => openEntry(entry)} className="w-full text-left group flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-zinc-800/30 transition-all duration-200">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[entry.type] || "#38bdf8" }} />
                          <span className="text-xs text-zinc-500 capitalize">{entry.type}</span>
                          {(entry.distance !== undefined || entry.relevanceScore !== undefined) && <span className="text-xs text-zinc-600">{Math.round(((entry.distance ? 1 - entry.distance : entry.relevanceScore || 0)) * 100)}%</span>}
                          <span className="text-xs text-zinc-700">{new Date(entry.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-zinc-400 group-hover:text-zinc-200 line-clamp-2 transition-colors">{entry.content}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </main>

            <aside className="col-span-3">
              {stats && (
                <div className="rounded-lg p-3 space-y-3" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", border: "1px solid #1e293b44" }}>
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Statistics</span>
                  <div className="space-y-2">
                    {Object.entries(stats.byType).filter(([_, count]) => count > 0).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-zinc-500"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />{type}</span>
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
            <div><Label>Type</Label><Select value={newEntry.type} onValueChange={(v: string) => setNewEntry({ ...newEntry, type: v })} /></div>
            <div><Label>Content</Label><Textarea value={newEntry.content} onChange={(e: any) => setNewEntry({ ...newEntry, content: e.target.value })} placeholder="Enter content..." rows={4} /></div>
            <div><Label className="text-zinc-600">Metadata (optional)</Label><Input value={newEntry.metadata} onChange={(e: any) => setNewEntry({ ...newEntry, metadata: e.target.value })} placeholder="key=value, project=myapp" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <button onClick={handleAddEntry} className="px-4 py-2 text-sm rounded-md font-medium transition-all duration-200" style={{ background: "linear-gradient(180deg, #38bdf8, #0ea5e9)", color: "#0c4a6e", boxShadow: "0 0 10px #38bdf833" }}>Store</button>
          </div>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          {selectedEntry && (
            <TerminalFrame title={`memory/${selectedEntry.type}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[selectedEntry.type] || "#38bdf8" }} />
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
                  {Object.entries(selectedEntry.metadata).filter(([k]) => k !== 'type').map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2"><span className="text-zinc-600">{key}:</span><span className="text-zinc-300 font-mono">{value}</span></div>
                  ))}
                </div>
              )}
              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Related</span>
                  <Button variant="ghost" size="icon" onClick={() => fetchRelated(selectedEntry)} disabled={relatedLoading}><Icons.Refresh /></Button>
                </div>
                {relatedLoading ? (
                  <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-8 rounded animate-pulse" style={{ background: "linear-gradient(90deg, #0f172a, #1e293b, #0f172a)" }} />)}</div>
                ) : relatedEntries.length > 0 ? (
                  <div className="space-y-1">
                    {relatedEntries.map(rel => (
                      <button key={rel.id} onClick={() => { setSelectedEntry(rel); fetchRelated(rel) }} className="w-full flex items-center justify-between p-2 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 text-left transition-all duration-200">
                        <div className="flex-1 min-w-0"><p className="text-xs truncate text-zinc-300">{rel.content}</p><p className="text-[10px] text-zinc-600">{rel.similarityReason}</p></div>
                        <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: rel.similarityScore && rel.similarityScore >= 0.7 ? "#4ade8015" : "#1e293b", color: rel.similarityScore && rel.similarityScore >= 0.7 ? "#4ade80" : "#64748b", border: `1px solid ${rel.similarityScore && rel.similarityScore >= 0.7 ? "#4ade8033" : "#1e293b"}` }}>{rel.similarityScore ? Math.round(rel.similarityScore * 100) : 0}%</span>
                      </button>
                    ))}
                  </div>
                ) : <p className="text-xs text-zinc-700">No related entries</p>}
              </div>
            </TerminalFrame>
          )}
        </Dialog>
      </div>
    </div>
  )
}
