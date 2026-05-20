import { useState, useEffect, useCallback } from 'react'
import { CATEGORY_CONFIG, getInitialTheme, applyTheme } from '@/lib/constants'
import type { CategoryKey, ThemeMode } from '@/lib/constants'
import type { DashboardStats, UnifiedEntry } from '@/lib/types'

// ── Helpers ─────────────────────────────────────────────────

export function isMemoryCategory(cat: CategoryKey): boolean {
  return CATEGORY_CONFIG[cat]?.group === 'memory'
}

/** Ensure stats.tools always exists even if API returns old format without it */
function normalizeStats(raw: any): DashboardStats {
  const tools = raw?.tools
  const graph = raw?.graph
  return {
    entries: raw?.entries ?? { byType: {}, total: 0, todayByType: {}, today: 0 },
    experience: raw?.experience ?? { total: 0, verified: 0, unverified: 0, conflict: 0, today: 0 },
    graph: { nodeCount: graph?.nodeCount ?? 0, edgeCount: graph?.edgeCount ?? 0 },
    tools: {
      skills: tools?.skills ?? 0,
      graphNodes: tools?.graphNodes ?? graph?.nodeCount ?? 0,
      graphEdges: tools?.graphEdges ?? graph?.edgeCount ?? 0,
    },
  }
}

// ── Hook ────────────────────────────────────────────────────

export function useDashboard() {
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
        const raw = await res.json()
        const normalized = normalizeStats(raw)
        console.log('[MD] raw.tools =', raw?.tools, '→ normalized.tools =', normalized.tools)
        setStats(normalized)
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

  // ── Derived ──────────────────────────────────────────────
  const selectedEntry = selectedId ? entries.find((e) => e.id === selectedId) || null : null
  const isMemory = isMemoryCategory(activeCategory)

  return {
    activeCategory,
    setActiveCategory,
    stats,
    entries,
    selectedId,
    setSelectedId,
    loading,
    searchQuery,
    setSearchQuery,
    isSearchMode,
    setIsSearchMode,
    showNewDialog,
    setShowNewDialog,
    theme,
    setTheme,
    loadEntries,
    loadStats,
    handleCategoryChange,
    handleVerify,
    selectedEntry,
    isMemory,
  }
}
