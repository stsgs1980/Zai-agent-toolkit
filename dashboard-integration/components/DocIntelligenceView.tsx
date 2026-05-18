'use client'

import { useState, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────

interface TermItem {
  term: string
  translation: string
  explanation: string
  usage?: string
}

interface StepBlock {
  title: string
  description: string
  codeBlocks: { label: string; code: string }[]
}

interface InstructionItem {
  title: string
  description: string
  steps: StepBlock[]
}

interface CommandItem {
  command: string
  description: string
  full_code: string
  language: string
}

interface AnalysisResult {
  summary?: string
  suggested_tags?: string[]
  category?: string
  difficulty?: string
}

interface ExtractionResult {
  terms: TermItem[]
  instructions: InstructionItem[]
  commands: CommandItem[]
  analysis: AnalysisResult
  count: { terms: number; instructions: number; commands: number }
}

type SubTab = 'terms' | 'instructions' | 'commands' | 'analysis'

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

  // ── Extract ──────────────────────────────────────────────

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

  // ── Ingest (store to ChromaDB) ───────────────────────────

  const handleIngest = useCallback(async () => {
    if (!result || !content.trim()) return
    setIngesting(true)

    try {
      let stored = 0

      // Store document as project
      const tags = [
        ...(result.analysis.suggested_tags || []),
        ...(sourceTag ? [sourceTag] : []),
      ].join(',')

      const docRes = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'project',
          content: content,
          metadata: {
            source: sourceTag || 'doc-intelligence',
            title: result.analysis.category || 'Document',
            doc_type: 'markdown',
            summary: result.analysis.summary || '',
            tags,
          },
        }),
      })
      if (docRes.ok) stored++

      // Store terms as knowledge
      for (const term of result.terms) {
        const termContent = `${term.translation}\n\n${term.explanation}${term.usage ? `\n\nUsage:\n${term.usage}` : ''}`
        const res = await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'knowledge',
            content: termContent,
            metadata: { term: term.term, pattern: 'llm', source: sourceTag || 'doc-intelligence', tags },
          }),
        })
        if (res.ok) stored++
      }

      // Store instructions as pattern
      for (const inst of result.instructions) {
        const res = await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'pattern',
            content: JSON.stringify(inst.steps, null, 2),
            metadata: { title: inst.title, has_code: String(inst.steps.some(s => s.codeBlocks.length > 0)), source: sourceTag || 'doc-intelligence', tags },
          }),
        })
        if (res.ok) stored++
      }

      // Store commands as command
      for (const cmd of result.commands) {
        const res = await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'command',
            content: cmd.full_code,
            metadata: { command: cmd.command.substring(0, 100), language: cmd.language, source: sourceTag || 'doc-intelligence', tags },
          }),
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

  // ── File handling ────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setContent(text)
      if (!sourceTag) setSourceTag(file.name.replace(/\.[^/.]+$/, ''))
    }
    reader.readAsText(file)
  }, [sourceTag])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  // ── Sub-tab counts ──────────────────────────────────────

  const subTabs: { key: SubTab; label: string; count: number }[] = [
    { key: 'terms', label: 'Terms', count: result?.count.terms || 0 },
    { key: 'instructions', label: 'Instructions', count: result?.count.instructions || 0 },
    { key: 'commands', label: 'Commands', count: result?.count.commands || 0 },
    { key: 'analysis', label: 'Analysis', count: result?.analysis ? 1 : 0 },
  ]

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Input Area ── */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          border: '1px solid #33415544',
        }}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs font-mono text-zinc-500 ml-2">doc-intelligence</span>
          <div className="ml-auto flex gap-2">
            <input
              value={sourceTag}
              onChange={(e) => setSourceTag(e.target.value)}
              placeholder="source tag"
              className="h-6 px-2 text-xs rounded border border-zinc-700 bg-zinc-900/50 text-zinc-400 font-mono w-32 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
            />
            <button
              onClick={handleExtract}
              disabled={extracting || !content.trim()}
              className="flex items-center gap-1.5 px-3 py-1 text-xs rounded font-medium transition-all"
              style={{
                background: extracting ? '#334155' : 'linear-gradient(180deg, #a855f7, #7c3aed)',
                color: extracting ? '#64748b' : '#fff',
                boxShadow: extracting ? 'none' : '0 0 10px #a855f733',
              }}
            >
              {extracting ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Extracting...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Extract
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-3">
          {/* Drop zone / textarea */}
          <div
            className={`relative rounded-md border-2 border-dashed transition-colors ${
              dragOver ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-800'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {content ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-40 bg-transparent text-zinc-300 text-sm font-mono p-3 resize-y focus:outline-none"
                placeholder="Paste markdown content here..."
              />
            ) : (
              <div
                className="flex flex-col items-center justify-center h-40 text-zinc-600 cursor-pointer"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.md,.txt,.html'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) handleFile(file)
                  }
                  input.click()
                }}
              >
                <svg className="w-8 h-8 mb-2 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm font-mono">Drop .md file or click to upload</span>
                <span className="text-xs font-mono text-zinc-700 mt-1">Or paste content below</span>
              </div>
            )}
          </div>

          {!content && (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-40 bg-zinc-900/50 text-zinc-300 text-sm font-mono p-3 rounded-md border border-zinc-800 mt-2 resize-y focus:outline-none focus:ring-1 focus:ring-sky-500/50"
              placeholder="Or paste markdown content directly..."
            />
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            border: '1px solid #33415544',
          }}
        >
          {/* Sub-tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800">
            {subTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSubTab(tab.key)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-all"
                style={{
                  background: subTab === tab.key ? '#a855f722' : 'transparent',
                  border: `1px solid ${subTab === tab.key ? '#a855f744' : 'transparent'}`,
                  color: subTab === tab.key ? '#c084fc' : '#64748b',
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="px-1 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-400">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
            <div className="ml-auto">
              <button
                onClick={handleIngest}
                disabled={ingesting}
                className="flex items-center gap-1.5 px-3 py-1 text-xs rounded font-medium transition-all"
                style={{
                  background: ingesting ? '#334155' : 'linear-gradient(180deg, #4ade80, #16a34a)',
                  color: ingesting ? '#64748b' : '#052e16',
                }}
              >
                {ingesting ? 'Storing...' : 'Ingest to Memory'}
              </button>
            </div>
          </div>

          <div className="p-3 max-h-96 overflow-y-auto">
            {/* ── Terms ── */}
            {subTab === 'terms' && (
              <div className="space-y-2">
                {result.terms.length === 0 ? (
                  <p className="text-zinc-600 text-sm text-center py-8">No terms extracted</p>
                ) : (
                  result.terms.map((term, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-zinc-800 hover:border-purple-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="text-sm font-mono font-semibold text-purple-400">{term.term}</span>
                          {term.translation && (
                            <span className="text-sm text-zinc-500 ml-2">= {term.translation}</span>
                          )}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          term
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{term.explanation}</p>
                      {term.usage && (
                        <pre className="mt-2 p-2 rounded bg-zinc-950/50 text-[11px] text-zinc-500 font-mono overflow-x-auto">
                          {term.usage}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Instructions ── */}
            {subTab === 'instructions' && (
              <div className="space-y-3">
                {result.instructions.length === 0 ? (
                  <p className="text-zinc-600 text-sm text-center py-8">No instructions extracted</p>
                ) : (
                  result.instructions.map((inst, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-zinc-800 hover:border-green-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-sm font-semibold text-green-400">{inst.title}</span>
                          {inst.description && (
                            <p className="text-xs text-zinc-500 mt-0.5">{inst.description}</p>
                          )}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          {inst.steps.length} steps
                        </span>
                      </div>
                      <div className="space-y-2 pl-4">
                        {inst.steps.map((step, si) => (
                          <div key={si} className="relative pl-5">
                            <div className="absolute left-0 top-1 w-4 h-4 rounded-sm bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold">
                              {si + 1}
                            </div>
                            <p className="text-xs font-medium text-zinc-300">{step.title}</p>
                            {step.description && (
                              <p className="text-[11px] text-zinc-500 mt-0.5">{step.description}</p>
                            )}
                            {step.codeBlocks.map((block, bi) => (
                              <div key={bi} className="mt-1.5 rounded border border-zinc-800 overflow-hidden">
                                <div className="flex items-center justify-between px-2 py-0.5 bg-zinc-900/80 border-b border-zinc-800">
                                  <span className="text-[10px] text-zinc-600 font-mono">{block.label}</span>
                                </div>
                                <pre className="px-2 py-1.5 text-[11px] text-zinc-400 font-mono overflow-x-auto bg-zinc-950/30">
                                  {block.code}
                                </pre>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Commands ── */}
            {subTab === 'commands' && (
              <div className="space-y-1.5">
                {result.commands.length === 0 ? (
                  <p className="text-zinc-600 text-sm text-center py-8">No commands extracted</p>
                ) : (
                  result.commands.map((cmd, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg border border-zinc-800 hover:border-rose-500/30 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-green-600 text-xs font-mono shrink-0">$</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-mono text-zinc-200">{cmd.command}</span>
                          {cmd.description && (
                            <p className="text-[11px] text-zinc-500 mt-0.5">{cmd.description}</p>
                          )}
                          {cmd.full_code !== cmd.command && (
                            <pre className="mt-1.5 p-2 rounded bg-zinc-950/50 text-[10px] text-zinc-500 font-mono overflow-x-auto">
                              {cmd.full_code}
                            </pre>
                          )}
                        </div>
                        <span className="text-[10px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 shrink-0">
                          {cmd.language}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Analysis ── */}
            {subTab === 'analysis' && result.analysis && (
              <div className="space-y-3">
                {result.analysis.summary && (
                  <div className="p-3 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Summary</span>
                    <p className="text-sm text-zinc-300 mt-1 leading-relaxed">{result.analysis.summary}</p>
                  </div>
                )}
                {result.analysis.category && (
                  <div className="p-3 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Category</span>
                    <p className="text-sm text-zinc-300 mt-1">{result.analysis.category}</p>
                  </div>
                )}
                {result.analysis.difficulty && (
                  <div className="p-3 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Difficulty</span>
                    <span className={`inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs ${
                      result.analysis.difficulty === 'beginner' ? 'bg-green-500/10 text-green-400' :
                      result.analysis.difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {result.analysis.difficulty}
                    </span>
                  </div>
                )}
                {result.analysis.suggested_tags && result.analysis.suggested_tags.length > 0 && (
                  <div className="p-3 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Suggested Tags</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {result.analysis.suggested_tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
