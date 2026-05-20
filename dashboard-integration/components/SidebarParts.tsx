import { P } from '@/lib/constants'
import type { DashboardStats } from '@/lib/types'

// ── Safe stats extractor (works with ANY API response shape) ──

export function safeTools(stats: any): { skills: number; graphNodes: number; graphEdges: number } {
  // Try stats.tools first (new API)
  if (stats?.tools && typeof stats.tools === 'object') {
    return {
      skills: typeof stats.tools.skills === 'number' ? stats.tools.skills : 0,
      graphNodes: typeof stats.tools.graphNodes === 'number' ? stats.tools.graphNodes : 0,
      graphEdges: typeof stats.tools.graphEdges === 'number' ? stats.tools.graphEdges : 0,
    }
  }
  // Fallback: extract from stats.graph (old API or missing tools)
  if (stats?.graph && typeof stats.graph === 'object') {
    return {
      skills: 0,
      graphNodes: typeof stats.graph.nodeCount === 'number' ? stats.graph.nodeCount : 0,
      graphEdges: typeof stats.graph.edgeCount === 'number' ? stats.graph.edgeCount : 0,
    }
  }
  return { skills: 0, graphNodes: 0, graphEdges: 0 }
}

// ── Helpers ────────────────────────────────────────────────

export function getCategoryCount(key: string, stats: DashboardStats | null): number | undefined {
  if (!stats) return undefined
  const entries = (stats as any).entries
  if (!entries) return undefined
  if (key === 'experience') {
    const exp = (stats as any).experience
    return exp?.total ?? 0
  }
  return entries.byType?.[key] ?? 0
}

export function getTodayCount(key: string, stats: DashboardStats | null): number {
  if (!stats) return 0
  const entries = (stats as any).entries
  if (!entries) return 0
  if (key === 'experience') {
    const exp = (stats as any).experience
    return exp?.today ?? 0
  }
  return entries.todayByType?.[key] ?? 0
}

export function getToolCount(key: string, tools: { skills: number; graphNodes: number; graphEdges: number }): number | undefined {
  if (key === 'graph') return tools.graphNodes
  if (key === 'skills') return tools.skills
  return undefined  // docintel has no count
}

// ── Sub-components ─────────────────────────────────────────

export function StatChip({ label, text, color }: { label: number | string; text: string; color?: string }) {
  return (
    <div style={{
      fontSize: 10, padding: '3px 8px', background: P.bgInput,
      borderRadius: 6, color: color || P.dim, border: `1px solid ${P.border}`,
    }}>
      <strong style={{ color: color || P.text }}>{label}</strong> {text}
    </div>
  )
}

export function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: 1.2, color: P.faint, padding: '12px 20px 4px',
    }}>
      {children}
    </div>
  )
}

export function CategoryItem({
  label, color, count, today, active, onClick,
}: {
  label: string
  color: string
  count?: number
  today?: number
  active: boolean
  onClick: () => void
}) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 16px 8px 20px', cursor: 'pointer',
      transition: 'background 0.15s', fontSize: 13,
      color: active ? P.text : P.dim,
      background: active ? P.bgBody : 'transparent',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%', background: color,
        flexShrink: 0,
        boxShadow: active ? `0 0 0 2px ${P.bgSidebar}, 0 0 0 3px ${P.blue}` : 'none',
      }} />
      <div style={{ flex: 1 }}>{label}</div>
      {count !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {(today ?? 0) > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: '#06B6D4',
              background: '#06B6D415', border: '1px solid #06B6D444',
              borderRadius: 4, padding: '1px 4px',
            }}>
              +{today}
            </span>
          )}
          <span style={{
            fontSize: 11, fontWeight: 600, minWidth: 20,
            textAlign: 'right', color: active ? P.muted : P.faint,
          }}>
            {count}
          </span>
        </div>
      )}
    </div>
  )
}
