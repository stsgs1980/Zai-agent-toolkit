'use client'

import { P, CATEGORY_CONFIG } from '@/lib/constants'
import type { CategoryKey, ThemeMode } from '@/lib/constants'
import type { UnifiedEntry } from '@/lib/types'

interface DashboardToolbarProps {
  activeCategory: CategoryKey
  selectedEntry: UnifiedEntry | null
  isMemory: boolean
  showNewDialog: boolean
  setShowNewDialog: (v: boolean) => void
  loadEntries: (cat: CategoryKey) => void
  loadStats: (bustCache?: boolean) => void
  theme: ThemeMode
  setTheme: (fn: (t: ThemeMode) => ThemeMode) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  isSearchMode: boolean
  setIsSearchMode: (v: boolean) => void
}

export function DashboardToolbar({
  activeCategory,
  selectedEntry,
  isMemory,
  setShowNewDialog,
  loadEntries,
  loadStats,
  theme,
  setTheme,
  isSearchMode,
  setSearchQuery,
  setIsSearchMode,
}: DashboardToolbarProps) {
  const catConf = CATEGORY_CONFIG[activeCategory]

  return (
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
            loadStats(true)
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
  )
}
