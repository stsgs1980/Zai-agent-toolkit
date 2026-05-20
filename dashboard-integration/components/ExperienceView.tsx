'use client'

import { useState, useCallback } from 'react'
import { ExperienceBrowse } from './ExperienceBrowse'
import { ExperienceExtract } from './ExperienceExtract'

type Tab = 'browse' | 'extract'

// ── Component ───────────────────────────────────────────────

export function ExperienceView() {
  const [activeTab, setActiveTab] = useState<Tab>('browse')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleIngestComplete = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <div className="space-y-4">
      {/* ── Tab Bar ── */}
      <div
        className="flex rounded-lg overflow-hidden"
        style={{ background: '#0f172a', border: '1px solid #1e293b' }}
      >
        <button
          onClick={() => setActiveTab('browse')}
          className="flex-1 px-4 py-2 text-xs font-mono font-medium transition-all"
          style={{
            background: activeTab === 'browse' ? 'linear-gradient(180deg, #a855f7, #7c3aed)' : 'transparent',
            color: activeTab === 'browse' ? '#fff' : '#64748b',
            boxShadow: activeTab === 'browse' ? '0 0 10px #a855f733' : 'none',
          }}
        >
          Browse
        </button>
        <button
          onClick={() => setActiveTab('extract')}
          className="flex-1 px-4 py-2 text-xs font-mono font-medium transition-all"
          style={{
            background: activeTab === 'extract' ? 'linear-gradient(180deg, #a855f7, #7c3aed)' : 'transparent',
            color: activeTab === 'extract' ? '#fff' : '#64748b',
            boxShadow: activeTab === 'extract' ? '0 0 10px #a855f733' : 'none',
          }}
        >
          AI Extract
        </button>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'browse' && (
        <ExperienceBrowse refreshTrigger={refreshTrigger} />
      )}
      {activeTab === 'extract' && (
        <ExperienceExtract onIngestComplete={handleIngestComplete} />
      )}
    </div>
  )
}
