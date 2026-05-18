// ── Shared types for Memory Dashboard ──────────────────────

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
