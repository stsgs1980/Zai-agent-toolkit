'use client'

import { CATEGORY_CONFIG, CATEGORY_KEYS, P } from '@/lib/constants'
import type { CategoryKey, DashboardStats } from '@/lib/types'
import {
  safeTools,
  getCategoryCount,
  getTodayCount,
  getToolCount,
  StatChip,
  GroupLabel,
  CategoryItem,
} from './SidebarParts'

// ── Props ───────────────────────────────────────────────────

interface SidebarProps {
  activeCategory: CategoryKey
  onCategoryChange: (cat: CategoryKey) => void
  stats: DashboardStats | null
  searchQuery: string
  onSearchChange: (q: string) => void
}

// ── Component ───────────────────────────────────────────────

export function Sidebar({
  activeCategory,
  onCategoryChange,
  stats,
  searchQuery,
  onSearchChange,
}: SidebarProps) {
  const memoryKeys = CATEGORY_KEYS.filter(k => CATEGORY_CONFIG[k].group === 'memory')
  const toolKeys = CATEGORY_KEYS.filter(k => CATEGORY_CONFIG[k].group === 'tools')
  const tools = stats ? safeTools(stats) : null

  return (
    <div style={{
      width: 260, minWidth: 260, background: P.bgSidebar,
      borderRight: `1px solid ${P.border}`, display: 'flex',
      flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '16px 20px', borderBottom: `1px solid ${P.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
          borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white',
        }}>
          MD
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: P.text }}>Memory Dashboard</div>
          <div style={{ fontSize: 10, fontWeight: 400, color: P.muted, marginTop: 1 }}>
            Zai-agent-toolkit
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${P.border}` }}>
        <div style={{ position: 'relative' }}>
          <svg
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: P.faint }}
            width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search entries..."
            style={{
              width: '100%', padding: '8px 12px 8px 32px', background: P.bgInput,
              border: `1px solid ${P.border}`, borderRadius: 8, color: P.dim,
              fontSize: 13, outline: 'none',
            }}
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: P.muted, cursor: 'pointer',
              padding: 2, display: 'flex', alignItems: 'center',
            }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Stat chips ── */}
      <div style={{ padding: '8px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <StatChip label={stats?.entries?.total ?? 0} text="total" />
        <StatChip label={stats?.experience?.verified ?? 0} text="verified" color={P.ok} />
        <StatChip label={stats?.experience?.unverified ?? 0} text="pending" color={P.warn} />
        <StatChip label={stats?.experience?.conflict ?? 0} text="conflict" color={P.err} />
        {(stats?.entries?.today ?? 0) > 0 && (
          <StatChip label={`+${stats?.entries?.today}`} text="today" color="#06B6D4" />
        )}
        {tools && (
          <>
            <StatChip label={tools.graphNodes} text="nodes" color="#2DD4BF" />
            <StatChip label={tools.skills} text="skills" color="#F59E0B" />
          </>
        )}
      </div>

      {/* ── Category list ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }} className="sidebar-scroll">
        <GroupLabel>Memory</GroupLabel>
        {memoryKeys.map((key) => {
          const cfg = CATEGORY_CONFIG[key]
          return (
            <CategoryItem key={key} label={cfg.label} color={cfg.color}
              count={getCategoryCount(key, stats)} today={getTodayCount(key, stats)}
              active={activeCategory === key} onClick={() => onCategoryChange(key)} />
          )
        })}

        <GroupLabel>Tools</GroupLabel>
        {toolKeys.map((key) => {
          const cfg = CATEGORY_CONFIG[key]
          return (
            <CategoryItem key={key} label={cfg.label} color={cfg.color}
              count={tools ? getToolCount(key, tools) : undefined}
              active={activeCategory === key} onClick={() => onCategoryChange(key)} />
          )
        })}
      </div>
    </div>
  )
}
