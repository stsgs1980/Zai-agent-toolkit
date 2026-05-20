'use client'

import { useState, useEffect, useCallback } from 'react'
import { P, CATEGORY_CONFIG, DESIGN_TOKENS_CSS, getInitialTheme, applyTheme, F } from '@/lib/constants'
import type { CategoryKey, ThemeMode } from '@/lib/constants'
import type { DashboardStats, UnifiedEntry } from '@/lib/types'
import { Sidebar } from './Sidebar'
import { ItemList } from './ItemList'
import { ItemDetail } from './ItemDetail'
import { NewEntryDialog } from './NewEntryDialog'
import { GraphViewer } from './GraphViewer'
import { GraphStats } from './GraphStats'
import { HotCommandsView } from './HotCommandsView'
import { DocIntelligenceView } from './DocIntelligenceView'
import { ExperienceView } from './ExperienceView'

// ── Helpers ─────────────────────────────────────────────────

function isMemoryCategory(cat: CategoryKey): boolean {
  return CATEGORY_CONFIG[cat]?.group === 'memory'
}

// ── Main layout ─────────────────────────────────────────────

export function MemoryDashboard() {
  // ── State ────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('knowledge')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [entries, setEntries] = useState<UnifiedEntry[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)

  // ── Apply theme on mount + change ──
  useEffect(() => { applyTheme(theme) }, [theme])

  // ── Load stats ───────────────────────────────────────────
  const loadStats = useCallback(async (bustCache = false) => {
    try {
      const url = bustCache ? '/api/memory/stats?nocache=1' : '/api/memory/stats'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        console.log('[MD] stats.tools =', data?.tools)
        setStats(data)
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  // ── Load entries for memory categories (NOT experience — handled by ExperienceView) ──
  const loadEntries = useCallback(async (category: CategoryKey) => {
    if (!isMemoryCategory(category) || category === 'experience') return
    setLoading(true)
    setSelectedId(null)
    setIsSearchMode(false)
    try {
      const res = await fetch(`/api/memory/entries?type=${category}&limit=50`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setEntries(
        (data.entries || []).map((e: any) => ({
          id: e.id,
          type: e.type || category,
          tags: e.tags || [],
          source: e.source || '',
          verification_status: e.verification_status || 'unverified',
          content: e.content || '',
          raw: e.raw || '',
        }))
      )
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Semantic search ──────────────────────────────────────
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIsSearchMode(false)
      loadEntries(activeCategory)
      return
    }
    setLoading(true)
    setSelectedId(null)
    setIsSearchMode(true)
    try {
      const res = await fetch(`/api/memory/search?q=${encodeURIComponent(query)}&limit=30`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setEntries(
        (data.results || []).map((r: any) => ({
          id: r.id,
          type: r.type,
          tags: r.tags || [],
          source: r.source || '',
          verification_status: r.verification_status || 'unverified',
          content: r.content || '',
          raw: '',
          distance: r.distance,
        }))
      )
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [activeCategory, loadEntries])

  // ── Debounced search ─────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => handleSearch(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery, handleSearch])

  // ── Switch category ──────────────────────────────────────
  const handleCategoryChange = useCallback((cat: CategoryKey) => {
    setActiveCategory(cat)
    setSearchQuery('')
    setIsSearchMode(false)
    if (isMemoryCategory(cat)) {
      loadEntries(cat)
    }
  }, [loadEntries])

  // ── Verify entry ─────────────────────────────────────────
  const handleVerify = useCallback(async (id: string, status: string) => {
    try {
      const res = await fetch('/api/memory/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', id, status }),
      })
      if (res.ok) {
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, verification_status: status } : e))
        )
      }
    } catch {
      // silent
    }
  }, [])

  // ── Load on mount ────────────────────────────────────────
  useEffect(() => {
    loadEntries('knowledge')
  }, [loadEntries])

  // ── Selected entry ───────────────────────────────────────
  const selectedEntry = selectedId ? entries.find((e) => e.id === selectedId) || null : null

  const isMemory = isMemoryCategory(activeCategory)
  const catConf = CATEGORY_CONFIG[activeCategory]

  // ── Render ───────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        background: P.bgBody,
        fontFamily: F.sans,
        color: P.text,
        overflow: 'hidden',
      }}
    >
      {/* Design system tokens + scrollbar CSS */}
      <style>{DESIGN_TOKENS_CSS}{`
        .sidebar-scroll::-webkit-scrollbar,
        .item-list-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb,
        .item-list-scroll::-webkit-scrollbar-thumb {
          background: var(--md-border, #334155);
          border-radius: 2px;
        }
        .sidebar-scroll::-webkit-scrollbar-track,
        .item-list-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>

      {/* ═══ SIDEBAR ═══ */}
      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        stats={stats}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* ═══ MAIN ═══ */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Toolbar ── */}
        <div
          style={{
            padding: '12px 24px',
            borderBottom: `1px solid ${P.borderDim}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: P.bgBody,
          }}
        >
          {/* Breadcrumb */}
          <div style={{ fontSize: 13, color: P.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Memory</span>
            <span style={{ color: P.border }}>/</span>
            <span style={{ color: P.dim, fontWeight: 500 }}>{catConf?.label || activeCategory}</span>
            {selectedEntry && (
              <>
                <span style={{ color: P.border }}> / </span>
                <span style={{ color: P.blue, fontWeight: 500 }}>{selectedEntry.title || selectedEntry.id}</span>
              </>
            )}
          </div>

          {/* Right actions */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* + New entry button (memory categories only, experience has its own) */}
            {isMemory && activeCategory !== 'experience' && (
              <button
                onClick={() => setShowNewDialog(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  background: P.bgSidebar,
                  border: `1px solid ${P.border}`,
                  color: P.dim,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New
              </button>
            )}

            {/* Refresh */}
            <button
              onClick={() => {
                if (isMemory) loadEntries(activeCategory)
                loadStats(true)  // bust cache on manual refresh
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                background: P.bgSidebar,
                border: `1px solid ${P.border}`,
                color: P.dim,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
              style={{
                padding: '6px 8px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                background: P.bgSidebar,
                border: `1px solid ${P.border}`,
                color: P.dim,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {theme === 'dark' ? (
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Search mode indicator */}
            {isSearchMode && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setIsSearchMode(false)
                  loadEntries(activeCategory)
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  background: '#1E3A5F',
                  border: `1px solid ${P.blue}44`,
                  color: P.blue,
                  cursor: 'pointer',
                }}
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        {/* ── Content area ── */}
        {activeCategory === 'experience' ? (
          /* ── Experience: full-width specialized view ── */
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            <ExperienceView />
          </div>
        ) : isMemory ? (
          /* ── Memory: split layout (ItemList + ItemDetail) ── */
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <ItemList
              entries={entries}
              selectedId={selectedId}
              onSelect={setSelectedId}
              loading={loading}
              category={activeCategory}
              isSearchMode={isSearchMode}
            />
            <ItemDetail
              entry={selectedEntry}
              onVerify={handleVerify}
            />
          </div>
        ) : (
          /* ── Tools: full-width layout ── */
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {activeCategory === 'graph' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
                <GraphStats />
                <GraphViewer />
              </div>
            )}
            {activeCategory === 'skills' && <HotCommandsView />}
            {activeCategory === 'docintel' && <DocIntelligenceView />}
          </div>
        )}

        {/* ── Status bar ── */}
        <div
          style={{
            height: 28,
            padding: '0 16px',
            background: P.bgSidebar,
            borderTop: `1px solid ${P.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 11,
            color: P.faint,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#10B981',
            }}
          />
          <span>ChromaDB</span>
          <span style={{ color: P.border }}>.</span>
          <span>
            {stats ? `${stats.entries.total} entries` : '-- entries'}
          </span>
          {stats && stats.graph.nodeCount > 0 && (
            <>
              <span style={{ color: P.border }}>.</span>
              <span>{stats.graph.nodeCount} nodes / {stats.graph.edgeCount} edges</span>
            </>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
            <span>NetworkX</span>
            <span style={{ color: P.border }}>.</span>
            <span>z-ai-web-dev-sdk</span>
          </div>
        </div>
      </div>

      {/* ── New entry dialog ── */}
      {showNewDialog && isMemory && activeCategory !== 'experience' && (
        <NewEntryDialog
          category={activeCategory}
          onClose={() => setShowNewDialog(false)}
          onCreated={() => {
            loadEntries(activeCategory)
            loadStats()
          }}
        />
      )}
    </div>
  )
}
