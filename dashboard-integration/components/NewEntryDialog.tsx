'use client'

import { useState, useCallback } from 'react'
import { P, CATEGORY_CONFIG } from '@/lib/constants'
import type { CategoryKey } from '@/lib/types'

// ── Props ───────────────────────────────────────────────────

interface NewEntryDialogProps {
  category: CategoryKey
  onClose: () => void
  onCreated: () => void
}

// ── Component ───────────────────────────────────────────────

export function NewEntryDialog({ category, onClose, onCreated }: NewEntryDialogProps) {
  const catConf = CATEGORY_CONFIG[category]
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [source, setSource] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // ── Experience-specific fields ──
  const isExperience = category === 'experience'
  const [title, setTitle] = useState('')
  const [good, setGood] = useState('')
  const [bad, setBad] = useState('')
  const [why, setWhy] = useState('')

  const handleSubmit = useCallback(async () => {
    if (!content.trim() && !isExperience) return
    if (isExperience && !title.trim()) return

    setSubmitting(true)
    setError('')
    try {
      if (isExperience) {
        const res = await fetch('/api/memory/experience', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'manual', title, good, bad, why }),
        })
        if (!res.ok) throw new Error('Failed to create')
      } else {
        const res = await fetch('/api/memory/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: category,
            content: content.trim(),
            tags: tags.trim(),
            source: source.trim(),
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to create')
        }
      }
      onCreated()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setSubmitting(false)
    }
  }, [category, content, tags, source, title, good, bad, why, onCreated, onClose, isExperience])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 480,
          maxHeight: '80vh',
          background: P.bgSidebar,
          border: `1px solid ${P.border}`,
          borderRadius: 12,
          overflow: 'auto',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
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
          {catConf && (
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: catConf.color,
              }}
            />
          )}
          <div style={{ fontSize: 14, fontWeight: 600, color: P.text, flex: 1 }}>
            New {catConf?.label || category}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: P.muted,
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Error */}
          {error && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: '#7F1D1D',
                color: '#FCA5A5',
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          {/* Experience form */}
          {isExperience ? (
            <>
              <FieldInput label="Title" value={title} onChange={setTitle} placeholder="What happened?" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FieldTextarea label="Good" value={good} onChange={setGood} placeholder="What worked well..." color={P.ok} />
                <FieldTextarea label="Bad" value={bad} onChange={setBad} placeholder="What failed..." color={P.err} />
              </div>
              <FieldInput label="Why (verdict)" value={why} onChange={setWhy} placeholder="Root cause / lesson learned..." />
            </>
          ) : (
            <>
              <FieldTextarea label="Content" value={content} onChange={setContent} placeholder={`Enter ${catConf?.label || 'entry'} content...`} rows={5} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FieldInput label="Tags" value={tags} onChange={setTags} placeholder="comma-separated" />
                <FieldInput label="Source" value={source} onChange={setSource} placeholder="optional" />
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: `1px solid ${P.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              background: P.bgHover,
              border: `1px solid ${P.border}`,
              color: P.dim,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              background: submitting ? P.border : 'linear-gradient(180deg, #4ade80, #16a34a)',
              color: submitting ? P.muted : '#052e16',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          color: P.muted,
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: P.bgBody,
          border: `1px solid ${P.border}`,
          borderRadius: 6,
          color: P.text,
          fontSize: 12,
          outline: 'none',
          fontFamily: 'monospace',
        }}
      />
    </div>
  )
}

function FieldTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  color,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  color?: string
}) {
  return (
    <div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          color: color || P.muted,
          marginBottom: 4,
        }}
      >
        {color && (
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: color,
            }}
          />
        )}
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: P.bgBody,
          border: `1px solid ${P.border}`,
          borderRadius: 6,
          color: P.text,
          fontSize: 12,
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'monospace',
          lineHeight: 1.5,
        }}
      />
    </div>
  )
}
