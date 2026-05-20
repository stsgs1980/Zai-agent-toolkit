'use client'

import { CATEGORY_CONFIG, CATEGORY_KEYS, P } from '@/lib/constants'
import type { CategoryKey, DashboardStats } from '@/lib/types'

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

  return (
    <div
      style={{
        width: 260,
        minWidth: 260,
        background: P.bgSidebar,
        borderRight: `1px solid ${P.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${P.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 800,
            color: 'white',
          }}
        >
          MD
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: P.text }}>
            Memory Dashboard
          </div>
          <div style={{ fontSize: 10, fontWeight: 400, color: P.muted, marginTop: 1 }}>
            Zai-agent-toolkit
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${P.border}` }}>
        <div style={{ position: 'relative' }}>
          <svg
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: P.faint,
            }}
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search entries..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              background: P.bgInput,
              border: `1px solid ${P.border}`,
              borderRadius: 8,
              color: P.dim,
              fontSize: 13,
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: P.muted,
                cursor: 'pointer',
                padding: 2,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Stat chips ── */}
      <div style={{ padding: '8px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <StatChip label={stats?.entries.total ?? 0} text="total" />
        <StatChip label={stats?.experience.verified ?? 0} text="verified" color={P.ok} />
        <StatChip label={stats?.experience.unverified ?? 0} text="pending" color={P.warn} />
        <StatChip label={stats?.experience.conflict ?? 0} text="conflict" color={P.err} />
        {(stats?.entries.today ?? 0) > 0 && (
          <StatChip label={`+${stats?.entries.today}`} text="today" color="#06B6D4" />
        )}
      </div>

      {/* ── Category list ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
        }}
        className="sidebar-scroll"
      >
        {/* Memory group */}
        <GroupLabel>Memory</GroupLabel>
        {memoryKeys.map((key) => {
          const cfg = CATEGORY_CONFIG[key]
          const count = getCategoryCount(key, stats)
          const today = getTodayCount(key, stats)
          return (
            <CategoryItem
              key={key}
              label={cfg.label}
              color={cfg.color}
              count={count}
              today={today}
              active={activeCategory === key}
              onClick={() => onCategoryChange(key)}
            />
          )
        })}

        {/* Tools group */}
        <GroupLabel>Tools</GroupLabel>
        {toolKeys.map((key) => {
          const cfg = CATEGORY_CONFIG[key]
          const count = getToolCount(key, stats)
          return (
            <CategoryItem
              key={key}
              label={cfg.label}
              color={cfg.color}
              count={count}
              active={activeCategory === key}
              onClick={() => onCategoryChange(key)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────

function getCategoryCount(key: string, stats: DashboardStats | null): number | undefined {
  if (!stats) return undefined
  if (key === 'experience') return stats.experience.total
  return stats.entries.byType[key] ?? 0
}

function getTodayCount(key: string, stats: DashboardStats | null): number {
  if (!stats) return 0
  if (key === 'experience') return stats.experience.today
  return stats.entries.todayByType[key] ?? 0
}

function getToolCount(key: string, stats: DashboardStats | null): number | undefined {
  if (!stats) return undefined
  const tools = (stats as any).tools
  if (!tools) return undefined
  if (key === 'graph') return tools.graphNodes ?? 0
  if (key === 'skills') return tools.skills ?? 0
  return undefined  // docintel has no count
}

// ── Sub-components ─────────────────────────────────────────

function StatChip({ label, text, color }: { label: number | string; text: string; color?: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        padding: '3px 8px',
        background: P.bgInput,
        borderRadius: 6,
        color: color || P.dim,
        border: `1px solid ${P.border}`,
      }}
    >
      <strong style={{ color: color || P.text }}>{label}</strong> {text}
    </div>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        color: P.faint,
        padding: '12px 20px 4px',
      }}
    >
      {children}
    </div>
  )
}

function CategoryItem({
  label,
  color,
  count,
  today,
  active,
  onClick,
}: {
  label: string
  color: string
  count?: number
  today?: number
  active: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px 8px 20px',
        cursor: 'pointer',
        transition: 'background 0.15s',
        fontSize: 13,
        color: active ? P.text : P.dim,
        background: active ? P.bgBody : 'transparent',
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          boxShadow: active
            ? `0 0 0 2px ${P.bgSidebar}, 0 0 0 3px ${P.blue}`
            : 'none',
        }}
      />
      <div style={{ flex: 1 }}>{label}</div>
      {count !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {(today ?? 0) > 0 && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#06B6D4',
                background: '#06B6D415',
                border: '1px solid #06B6D444',
                borderRadius: 4,
                padding: '1px 4px',
              }}
            >
              +{today}
            </span>
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              minWidth: 20,
              textAlign: 'right',
              color: active ? P.muted : P.faint,
            }}
          >
            {count}
          </span>
        </div>
      )}
    </div>
  )
}
