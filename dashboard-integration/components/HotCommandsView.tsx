'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────

interface SkillCommand {
  phrase: string
  action: string
}

interface SkillMeta {
  name: string
  id: string
  version: string
  description: string
  trigger: string
  folder: string
  commands: SkillCommand[]
}

// ── Color tokens ─────────────────────────────────────────────

const C = {
  bg:        '#0a0e17',
  card:      '#111827',
  cardHover: '#1a2235',
  border:    '#1e293b',
  accent:    '#f59e0b',
  red:       '#ef4444',
  yellow:    '#fbbf24',
  text:      '#e2e8f0',
  textDim:   '#94a3b8',
  textMuted: '#64748b',
  tagBg:     '#1e293b',
  tagActive: '#fbbf2420',
}

// ── Category extraction ──────────────────────────────────────

function getCategory(name: string, id: string): string {
  if (id.startsWith('ZAI-STS')) return 'Styles'
  if (id.startsWith('ZAI-DEV')) return 'Dev'
  if (id.startsWith('ZAI-SESSION')) return 'Session'
  if (id.startsWith('ZAI-OPS')) return 'Ops'
  if (name.includes('memory') || name.includes('session')) return 'Memory'
  return 'Tool'
}

const CATEGORIES = ['All', 'Styles', 'Dev', 'Memory', 'Session', 'Ops', 'Tool']

// ── Main component ──────────────────────────────────────────

export function HotCommandsView() {
  const [skills, setSkills] = useState<SkillMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1200)
    })
  }, [])

  const fetchSkills = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const q = query ? `&q=${encodeURIComponent(query)}` : ''
      const res = await fetch(`/api/memory/commands?_t=${Date.now()}${q}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSkills(data.skills || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => { fetchSkills() }, [fetchSkills])

  // Debounced search
  const [inputVal, setInputVal] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setQuery(inputVal), 300)
    return () => clearTimeout(t)
  }, [inputVal])

  // Filter by category
  const filtered = category === 'All'
    ? skills
    : skills.filter(s => getCategory(s.name, s.id) === category)

  // Stats
  const totalCommands = skills.reduce((acc, s) => acc + s.commands.length, 0)

  return (
    <div className="space-y-4">
      {/* ── Search bar ── */}
      <div className="flex items-center gap-2">
        <div
          className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <svg width="16" height="16" fill="none" stroke={C.textMuted} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Semantic search across all skills and commands..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: C.text, caretColor: C.accent }}
          />
          {inputVal && (
            <button onClick={() => { setInputVal(''); setQuery('') }} className="cursor-pointer" style={{ color: C.textMuted }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <span className="text-xs whitespace-nowrap" style={{ color: C.textMuted }}>
          {skills.length} skills · {totalCommands} commands
        </span>
      </div>

      {/* ── Category pills ── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => {
          const isActive = category === cat
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
              style={{
                background: isActive ? C.tagActive : C.tagBg,
                border: `1px solid ${isActive ? C.accent + '44' : C.border}`,
                color: isActive ? C.yellow : C.textMuted,
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="px-3 py-2 rounded-md text-sm" style={{ background: '#3b1a1c', border: `1px solid ${C.red}44`, color: C.red }}>
          Failed to load: {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="text-center py-12" style={{ color: C.textMuted }}>
          <div className="animate-pulse text-sm">Loading skills...</div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12" style={{ color: C.textMuted }}>
          <svg className="mx-auto mb-3" width="40" height="40" fill="none" stroke={C.border} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No skill entries found</p>
          {query && <p className="text-xs mt-1" style={{ color: C.textMuted }}>Try a different search query</p>}
        </div>
      )}

      {/* ── Skill cards (vertical) ── */}
      {!loading && filtered.map(skill => {
        const isExpanded = expanded === skill.folder
        const cat = getCategory(skill.name, skill.id)
        const catColors: Record<string, string> = {
          Styles: '#a855f7',
          Dev: '#38bdf8',
          Memory: '#2dd4bf',
          Session: '#fbbf24',
          Ops: '#f87171',
          Tool: '#94a3b8',
        }
        const catColor = catColors[cat] || C.textMuted

        return (
          <div
            key={skill.folder}
            className="rounded-lg overflow-hidden transition-all"
            style={{
              background: C.card,
              border: `1px solid ${isExpanded ? C.accent + '33' : C.border}`,
              boxShadow: isExpanded ? `0 0 20px ${C.accent}08` : 'none',
            }}
          >
            {/* ── Card header (click to expand) ── */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpanded(isExpanded ? null : skill.folder)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(isExpanded ? null : skill.folder) } }}
              className="w-full px-4 py-3 flex items-start gap-3 text-left cursor-pointer"
              style={{ background: isExpanded ? C.cardHover : 'transparent' }}
            >
              {/* Category dot */}
              <div
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ background: catColor }}
              />

              {/* Name + description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: C.text }}>
                    {skill.name}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(skill.name, skill.folder) }}
                    className="shrink-0 cursor-pointer transition-colors"
                    style={{ color: copiedId === skill.folder ? '#4ade80' : C.textMuted, padding: '2px 4px', borderRadius: 4 }}
                    title="Copy skill name"
                  >
                    {copiedId === skill.folder ? (
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                  </button>
                  {skill.id && (
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: C.tagBg, color: catColor }}
                    >
                      {skill.id}
                    </span>
                  )}
                  {skill.version && (
                    <span className="text-[10px] font-mono" style={{ color: C.textMuted }}>
                      v{skill.version}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: C.textDim }}>
                  {skill.description}
                </p>
              </div>

              {/* Expand chevron */}
              <svg
                width="16" height="16" fill="none" stroke={C.textMuted} viewBox="0 0 24 24"
                className="shrink-0 mt-1 transition-transform"
                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* ── Expanded content ── */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {/* Triggers */}
                {skill.trigger && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: C.red }}>
                      Triggers
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {skill.trigger.split(',').map(t => (
                        <span
                          key={t.trim()}
                          className="text-[11px] px-2 py-0.5 rounded-md font-mono"
                          style={{ background: C.tagBg, color: C.yellow }}
                        >
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hot Commands */}
                {skill.commands.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: C.red }}>
                      $skill command
                    </div>
                    <div className="space-y-1">
                      {skill.commands.map((cmd, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md group"
                          style={{ background: '#0d1117' }}
                        >
                          <code className="text-[11px] font-mono" style={{ color: C.yellow }}>
                            {cmd.phrase}
                          </code>
                          <button
                            onClick={() => copyToClipboard(cmd.phrase, `cmd-${skill.folder}-${i}`)}
                            className="shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: copiedId === `cmd-${skill.folder}-${i}` ? '#4ade80' : C.textMuted, padding: '1px 3px', borderRadius: 3 }}
                            title="Copy command"
                          >
                            {copiedId === `cmd-${skill.folder}-${i}` ? (
                              <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                              <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            )}
                          </button>
                          <span className="text-[11px]" style={{ color: C.textMuted }}>—</span>
                          <span className="text-[11px] flex-1" style={{ color: C.textDim }}>
                            {cmd.action}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No explicit commands — generate from triggers */}
                {skill.commands.length === 0 && skill.trigger && (() => {
                  const triggerCmds = skill.trigger.split(',').map(t => t.trim()).filter(Boolean)
                  return (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>
                        Activation phrases
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {triggerCmds.map(t => (
                          <button
                            key={t}
                            onClick={() => copyToClipboard(t, `trigger-${skill.folder}-${t}`)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-pointer transition-all hover:brightness-125"
                            style={{ background: '#0d1117', border: `1px solid ${C.border}` }}
                            title="Click to copy"
                          >
                            <code className="text-[11px] font-mono" style={{ color: C.yellow }}>{t}</code>
                            {copiedId === `trigger-${skill.folder}-${t}` ? (
                              <svg width="10" height="10" fill="none" stroke="#4ade80" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                              <svg width="10" height="10" fill="none" stroke={C.textMuted} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Description (full) */}
                {skill.description.length > 120 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.textMuted }}>
                      Full description
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: C.textDim }}>
                      {skill.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
