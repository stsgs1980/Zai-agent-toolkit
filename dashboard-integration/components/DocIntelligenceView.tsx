'use client'

import { useState, useCallback } from 'react'
import { InputArea } from './doc-intelligence/InputArea'
import { ResultsPanel } from './doc-intelligence/ResultsPanel'
import type { ExtractionResult, SubTab } from './doc-intelligence/types'

// ── Component ────────────────────────────────────────────────

export function DocIntelligenceView() {
  const [content, setContent] = useState('')
  const [sourceTag, setSourceTag] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [ingesting, setIngesting] = useState(false)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [error, setError] = useState('')
  const [subTab, setSubTab] = useState<SubTab>('terms')
  const [dragOver, setDragOver] = useState(false)
  const [healthStatus, setHealthStatus] = useState<Record<string, any> | null>(null)
  const [checkingHealth, setCheckingHealth] = useState(false)

  // ── Health Check ──

  const handleHealthCheck = useCallback(async () => {
    setCheckingHealth(true)
    setHealthStatus(null)
    try {
      const res = await fetch('/api/memory/doc-intelligence')
      const data = await res.json()
      setHealthStatus(data)
    } catch (e: any) {
      setHealthStatus({ status: 'error', error: e.message })
    } finally {
      setCheckingHealth(false)
    }
  }, [])

  // ── Extract ──

  const handleExtract = useCallback(async () => {
    if (!content.trim()) return
    setExtracting(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/memory/doc-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, mode: 'all' }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Show detailed error with stack if available
        const detail = data.details ? `${data.error}: ${data.details}` : (data.error || 'Extraction failed')
        throw new Error(detail)
      }
      setResult(data as ExtractionResult)
    } catch (e: any) {
      setError(e.message || 'Unknown error')
    } finally {
      setExtracting(false)
    }
  }, [content])

  // ── Ingest ──

  const handleIngest = useCallback(async () => {
    if (!result || !content.trim()) return
    setIngesting(true)
    try {
      let stored = 0
      const tags = [
        ...(result.analysis.suggested_tags || []),
        ...(sourceTag ? [sourceTag] : []),
      ].join(',')

      const docRes = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'project', content, metadata: { source: sourceTag || 'doc-intelligence', title: result.analysis.category || 'Document', doc_type: 'markdown', summary: result.analysis.summary || '', tags } }),
      })
      if (docRes.ok) stored++

      for (const term of result.terms) {
        const termContent = `${term.translation}\n\n${term.explanation}${term.usage ? `\n\nUsage:\n${term.usage}` : ''}`
        const res = await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'knowledge', content: termContent, metadata: { term: term.term, pattern: 'llm', source: sourceTag || 'doc-intelligence', tags } }),
        })
        if (res.ok) stored++
      }

      for (const inst of result.instructions) {
        const res = await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'pattern', content: JSON.stringify(inst.steps, null, 2), metadata: { title: inst.title, has_code: String(inst.steps.some(s => s.codeBlocks.length > 0)), source: sourceTag || 'doc-intelligence', tags } }),
        })
        if (res.ok) stored++
      }

      for (const cmd of result.commands) {
        const res = await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'command', content: cmd.full_code, metadata: { command: cmd.command.substring(0, 100), language: cmd.language, source: sourceTag || 'doc-intelligence', tags } }),
        })
        if (res.ok) stored++
      }

      alert(`Ingested ${stored} entries to memory!`)
    } catch (e: any) {
      alert(`Ingest error: ${e.message}`)
    } finally {
      setIngesting(false)
    }
  }, [result, content, sourceTag])

  // ── File handling ──

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setContent(text)
      if (!sourceTag) setSourceTag(file.name.replace(/\.[^/.]+$/, ''))
    }
    reader.readAsText(file)
  }, [sourceTag])

  // ── Render ──

  return (
    <div className="space-y-4">
      <InputArea
        content={content} setContent={setContent}
        sourceTag={sourceTag} setSourceTag={setSourceTag}
        extracting={extracting} onExtract={handleExtract}
        dragOver={dragOver} setDragOver={setDragOver}
        onFile={handleFile}
      />

      {/* Health Check Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleHealthCheck}
          disabled={checkingHealth}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium transition-all"
          style={{
            background: checkingHealth ? '#334155' : '#1e293b',
            border: '1px solid #334155',
            color: checkingHealth ? '#64748b' : '#94a3b8',
          }}
        >
          {checkingHealth ? 'Checking...' : 'SDK Health Check'}
        </button>
        {healthStatus && (
          <span
            className="text-xs font-mono px-2 py-1 rounded"
            style={{
              color: healthStatus.status === 'healthy' ? '#4ade80' : healthStatus.status === 'degraded' ? '#fbbf24' : '#f87171',
              background: healthStatus.status === 'healthy' ? '#16a34a22' : healthStatus.status === 'degraded' ? '#ca8a0422' : '#ef444422',
            }}
          >
            {healthStatus.status === 'healthy' ? 'SDK OK' : healthStatus.status === 'degraded' ? 'Degraded' : 'Broken'}
            {healthStatus.model && ` (${healthStatus.model})`}
            {healthStatus.error && `: ${String(healthStatus.error).substring(0, 80)}`}
          </span>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono break-all">
          {error}
        </div>
      )}

      {/* AI extraction errors */}
      {result?.errors && Object.keys(result.errors).length > 0 && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-mono">
          <div className="font-semibold mb-1">AI extraction errors:</div>
          {Object.entries(result.errors).map(([mode, msg]) => (
            <div key={mode} className="mb-0.5">&#8226; {mode}: {String(msg)}</div>
          ))}
          <div className="mt-2 text-amber-500/60 text-xs">
            Tip: Try &quot;SDK Health Check&quot; above to diagnose, or paste shorter content.
          </div>
        </div>
      )}

      {result?.html_stripped && (
        <div className="px-3 py-1.5 rounded-md text-xs font-mono flex items-center gap-2"
          style={{ background: '#0f172a', border: '1px solid #1e293b', color: '#22d3ee' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          HTML auto-stripped to {result.clean_length?.toLocaleString()} chars clean text
        </div>
      )}

      {result && (
        <ResultsPanel
          result={result}
          subTab={subTab}
          setSubTab={setSubTab}
          ingesting={ingesting}
          onIngest={handleIngest}
        />
      )}
    </div>
  )
}
