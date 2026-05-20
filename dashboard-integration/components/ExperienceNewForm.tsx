'use client'

import { useState, useCallback } from 'react'

// ── Component ───────────────────────────────────────────────

interface ExperienceNewFormProps {
  onSubmit: (data: { title: string; good: string; bad: string; why: string }) => Promise<boolean>
  onCancel: () => void
}

export function ExperienceNewForm({ onSubmit, onCancel }: ExperienceNewFormProps) {
  const [newTitle, setNewTitle] = useState('')
  const [newGood, setNewGood] = useState('')
  const [newBad, setNewBad] = useState('')
  const [newWhy, setNewWhy] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!newTitle.trim()) return
    setSubmitting(true)
    const ok = await onSubmit({ title: newTitle, good: newGood, bad: newBad, why: newWhy })
    if (ok) {
      setNewTitle(''); setNewGood(''); setNewBad(''); setNewWhy('')
      onCancel()
    }
    setSubmitting(false)
  }, [newTitle, newGood, newBad, newWhy, onSubmit, onCancel])

  return (
    <div
      className="rounded-lg p-4 space-y-3"
      style={{
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        border: '1px solid #a855f733',
        boxShadow: '0 0 20px #a855f711',
      }}
    >
      <div className="text-xs font-mono text-purple-400 uppercase tracking-wider">New Experience</div>

      <input
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="Title: what happened?"
        className="w-full h-8 px-3 text-sm rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 4px #4ade8088' }} />
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono">Good</span>
          </div>
          <textarea
            value={newGood}
            onChange={(e) => setNewGood(e.target.value)}
            placeholder="What worked well..."
            className="w-full h-20 px-3 py-2 text-xs rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-300 placeholder-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" style={{ boxShadow: '0 0 4px #f8717188' }} />
            <span className="text-[10px] text-red-400 uppercase tracking-wider font-mono">Bad</span>
          </div>
          <textarea
            value={newBad}
            onChange={(e) => setNewBad(e.target.value)}
            placeholder="What failed..."
            className="w-full h-20 px-3 py-2 text-xs rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-300 placeholder-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-red-500/50"
          />
        </div>
      </div>

      <div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Why (verdict)</span>
        <input
          value={newWhy}
          onChange={(e) => setNewWhy(e.target.value)}
          placeholder="Root cause / lesson learned..."
          className="w-full h-8 px-3 text-xs rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-300 placeholder-zinc-600 mt-1 focus:outline-none focus:ring-1 focus:ring-zinc-500/50"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting || !newTitle.trim()}
          className="h-8 px-4 text-xs rounded-md font-medium flex items-center gap-1.5 transition-all"
          style={{
            background: submitting ? '#334155' : 'linear-gradient(180deg, #4ade80, #16a34a)',
            color: submitting ? '#64748b' : '#052e16',
          }}
        >
          {submitting ? 'Saving...' : 'Save Experience'}
        </button>
      </div>
    </div>
  )
}
