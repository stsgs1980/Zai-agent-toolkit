'use client'

import { P, DESIGN_TOKENS_CSS, F } from '@/lib/constants'
import { Sidebar } from './Sidebar'
import { ItemList } from './ItemList'
import { ItemDetail } from './ItemDetail'
import { NewEntryDialog } from './NewEntryDialog'
import { GraphViewer } from './GraphViewer'
import { GraphStats } from './GraphStats'
import { HotCommandsView } from './HotCommandsView'
import { DocIntelligenceView } from './DocIntelligenceView'
import { ExperienceView } from './ExperienceView'
import { DashboardToolbar } from './DashboardToolbar'
import { useDashboard } from './useDashboard'

export function MemoryDashboard() {
  const {
    activeCategory,
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
  } = useDashboard()

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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* ── Toolbar ── */}
        <DashboardToolbar
          activeCategory={activeCategory}
          selectedEntry={selectedEntry}
          isMemory={isMemory}
          showNewDialog={showNewDialog}
          setShowNewDialog={setShowNewDialog}
          loadEntries={loadEntries}
          loadStats={loadStats}
          theme={theme}
          setTheme={setTheme}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearchMode={isSearchMode}
          setIsSearchMode={setIsSearchMode}
        />

        {/* ── Content area ── */}
        {activeCategory === 'experience' ? (
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            <ExperienceView />
          </div>
        ) : isMemory ? (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <ItemList
              entries={entries}
              selectedId={selectedId}
              onSelect={setSelectedId}
              loading={loading}
              category={activeCategory}
              isSearchMode={isSearchMode}
            />
            <ItemDetail entry={selectedEntry} onVerify={handleVerify} />
          </div>
        ) : (
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
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
          <span>ChromaDB</span>
          <span style={{ color: P.border }}>.</span>
          <span>{stats ? `${stats.entries.total} entries` : '-- entries'}</span>
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
