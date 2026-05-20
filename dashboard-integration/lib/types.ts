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
    todayByType: Record<string, number>
    today: number
  }
  experience: {
    total: number
    verified: number
    unverified: number
    conflict: number
    today: number
  }
  graph: {
    nodeCount: number
    edgeCount: number
  }
  tools: {
    skills: number
    graphNodes: number
    graphEdges: number
  }
}

export interface RelatedNode {
  id: string
  edgeType: string
  direction: 'incoming' | 'outgoing'
  weight: number
  sourceType?: string
  targetType?: string
}

export type { CategoryKey }

// ── Experience types ────────────────────────────────────────

export interface ExperienceEntry {
  id: string
  title: string
  experience_type: string
  verification_status: string
  good_count: number
  bad_count: number
  source_type: string
  preview: string
  tags: string[]
}

export interface ExtractedEntry {
  title: string
  good: string
  bad: string
  why: string
  verdict: string
  tech: string[]
}
