// ── Shared types for Memory Dashboard ──────────────────────

import type { CategoryKey } from './constants'

export interface MemoryEntry {
  id: string
  type: 'session' | 'knowledge' | 'pattern' | 'project' | 'template' | 'command'
  content: string
  metadata: Record<string, string>
  created_at: string
  distance?: number
  relevanceScore?: number
  similarityScore?: number
  similarityReason?: string
}

export interface MemoryStats {
  total: number
  byType: Record<string, number>
}

export interface UnifiedEntry {
  id: string
  type: string
  tags: string[]
  source: string
  verification_status: string
  content: string
  raw: string
  title?: string
  good_count?: number
  bad_count?: number
  preview?: string
  distance?: number
}

export interface DashboardStats {
  entries: {
    total: number
    byType: Record<string, number>
  }
  experience: {
    total: number
    verified: number
    unverified: number
    conflict: number
  }
  graph: {
    nodeCount: number
    edgeCount: number
  }
}

export type { CategoryKey }
