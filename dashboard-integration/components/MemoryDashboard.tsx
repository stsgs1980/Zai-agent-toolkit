'use client'

import { useState } from 'react'
import { DashboardHome } from './DashboardHome'
import { MemoryBrowser } from './MemoryBrowser'
import { GraphViewer } from './GraphViewer'
import { GraphStats } from './GraphStats'
import { DocIntelligenceView } from './DocIntelligenceView'

// ── Tab config ──────────────────────────────────────────────

type TabKey = 'home' | 'memory' | 'graph' | 'intelligence'

interface Tab {
  key: TabKey
  label: string
  icon: string
  color: string
  glow: string
}

const TABS: Tab[] = [
  { key: 'home',         label: 'Dashboard',  icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', color: '#38bdf8', glow: '#7dd3fc' },
  { key: 'memory',       label: 'Memory',     icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: '#a855f7', glow: '#c084fc' },
  { key: 'graph',        label: 'Graph',      icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', color: '#2dd4bf', glow: '#5eead4' },
  { key: 'intelligence', label: 'Intelligence',icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', color: '#fbbf24', glow: '#fde68a' },
]

// ── SVG icon component ──────────────────────────────────────

function TabIcon({ path, size = 18 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={path} />
    </svg>
  )
}

// ── Main dashboard layout ───────────────────────────────────

export function MemoryDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('home')
  const activeTabConf = TABS.find(t => t.key === activeTab) || TABS[0]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#020617' }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 px-4 py-3"
        style={{
          background: '#0f172a',
          borderBottom: '1px solid #1e293b55',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #38bdf8, #a855f7)',
                boxShadow: 'none',
              }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">Memory Dashboard</h1>
              <p className="text-[10px] text-zinc-500 font-mono">Zai-agent-toolkit</p>
            </div>
          </div>

          {/* Tab navigation */}
          <nav className="flex items-center gap-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                  style={{
                    backgroundColor: isActive ? `${tab.color}15` : 'transparent',
                    border: `1px solid ${isActive ? `${tab.color}33` : 'transparent'}`,
                    color: isActive ? tab.glow : '#64748b',
                    boxShadow: isActive ? `0 0 12px ${tab.color}11` : 'none',
                  }}
                >
                  <TabIcon path={tab.icon} size={14} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* ── Accent line ── */}
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${activeTabConf.color}44, ${activeTabConf.glow}22, transparent)` }} />

      {/* ── Content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {activeTab === 'home' && <DashboardHome />}
        {activeTab === 'memory' && <MemoryBrowser />}
        {activeTab === 'graph' && (
          <div className="space-y-4">
            <GraphStats />
            <GraphViewer />
          </div>
        )}
        {activeTab === 'intelligence' && <DocIntelligenceView />}
      </main>

      {/* ── Footer ── */}
      <footer
        className="mt-auto px-4 py-3 text-center"
        style={{ borderTop: '1px solid #1e293b44' }}
      >
        <p className="text-[10px] text-zinc-700 font-mono">
          Memory Dashboard &middot; ChromaDB + NetworkX + z-ai-web-dev-sdk
        </p>
      </footer>
    </div>
  )
}
