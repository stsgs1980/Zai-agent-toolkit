'use client'

import { P, CATEGORY_CONFIG } from '@/lib/constants'
import type { CategoryKey, UnifiedEntry } from '@/lib/types'

// ── Props ───────────────────────────────────────────────────

interface ItemListProps {
  entries: UnifiedEntry[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading: boolean
  category: CategoryKey
  isSearchMode: boolean
}

// ── Component ───────────────────────────────────────────────

export function ItemList({
  entries,
  selectedId,
  onSelect,
  loading,
  category,
  isSearchMode,
}: ItemListProps) {
  if (loading) {
    return (
      <div
        style={{
          width: 280,
          minWidth: 280,
          borderRight: `1px solid ${P.borderDim}`,
          overflowY: 'auto',
          padding: 12,
          background: P.bgBody,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            border: `2px solid ${P.blue}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const catConf = CATEGORY_CONFIG[category]

  return (
    <div
      style={{
        width: 280,
        minWidth: 280,
        borderRight: `1px solid ${P.borderDim}`,
        overflowY: 'auto',
        padding: 12,
        background: P.bgBody,
      }}
      className="item-list-scroll"
    >
      {entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 12px', color: P.faint, fontSize: 13 }}>
          <svg width="36" height="36" fill="none" stroke={P.border} viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>{isSearchMode ? 'No results found' : `No ${catConf?.label || category} entries`}</div>
        </div>
      )}

      {entries.map((entry) => {
        const isActive = selectedId === entry.id
        const typeConf = CATEGORY_CONFIG[entry.type as CategoryKey]
        const statusTag = getStatusTag(entry.verification_status)

        return (
          <div
            key={entry.id}
            onClick={() => onSelect(entry.id)}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${isActive ? P.blue : 'transparent'}`,
              marginBottom: 6,
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: isActive ? P.bgHover : 'transparent',
              boxShadow: isActive ? '0 0 0 1px rgba(59,130,246,0.2)' : 'none',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 500, color: P.text, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {entry.title || entry.id}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 11 }}>
              {entry.distance !== undefined && (
                <MetaTag bg="#1E3A5F" color={P.blue}>{Math.round((1 - entry.distance) * 100)}%</MetaTag>
              )}
              <MetaTag bg={statusTag.bg} color={statusTag.color}>{entry.verification_status}</MetaTag>
              {isSearchMode && typeConf && (
                <MetaTag bg={`${typeConf.color}15`} color={typeConf.color}>{typeConf.label}</MetaTag>
              )}
              {entry.tags && entry.tags.length > 0 && (
                <MetaTag bg={P.bgHover} color={P.muted}>+{entry.tags.length}</MetaTag>
              )}
            </div>
            {(entry.content || entry.preview) && (
              <div style={{ marginTop: 6, fontSize: 11, color: P.faint, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {(entry.content || entry.preview || '').slice(0, 120)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────

function getStatusTag(status: string): { bg: string; color: string } {
  switch (status) {
    case 'verified':   return { bg: '#064E3B', color: '#34D399' }
    case 'unverified': return { bg: '#78350F', color: '#FBBF24' }
    case 'conflict':   return { bg: '#7F1D1D', color: '#FCA5A5' }
    default:           return { bg: '#1E293B', color: '#64748B' }
  }
}

function MetaTag({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 500, background: bg, color }}>
      {children}
    </span>
  )
}
