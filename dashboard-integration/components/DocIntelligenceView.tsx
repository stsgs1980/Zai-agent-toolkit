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
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Extraction failed')
      }
      const data: ExtractionResult = await res.json()
      setResult(data)
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

      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

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
