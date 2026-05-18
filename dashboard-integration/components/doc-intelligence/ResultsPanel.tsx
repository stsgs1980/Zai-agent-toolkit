import React from 'react'
import type { ExtractionResult, SubTab } from './types'

interface ResultsPanelProps {
  result: ExtractionResult
  subTab: SubTab
  setSubTab: (tab: SubTab) => void
  ingesting: boolean
  onIngest: () => void
}

export function ResultsPanel({ result, subTab, setSubTab, ingesting, onIngest }: ResultsPanelProps) {
  const subTabs: { key: SubTab; label: string; count: number }[] = [
    { key: 'terms', label: 'Terms', count: result.count.terms },
    { key: 'instructions', label: 'Instructions', count: result.count.instructions },
    { key: 'commands', label: 'Commands', count: result.count.commands },
    { key: 'analysis', label: 'Analysis', count: result.analysis ? 1 : 0 },
  ]

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', border: '1px solid #33415544' }}
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
            {tab.count > 0 && <span className="px-1 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-400">{tab.count}</span>}
          </button>
        ))}
        <div className="ml-auto">
          <button
            onClick={onIngest}
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
        {/* Terms */}
        {subTab === 'terms' && (
          <div className="space-y-2">
            {result.terms.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-8">No terms extracted</p>
            ) : result.terms.map((term, i) => (
              <div key={i} className="p-3 rounded-lg border border-zinc-800 hover:border-purple-500/30 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="text-sm font-mono font-semibold text-purple-400">{term.term}</span>
                    {term.translation && <span className="text-sm text-zinc-500 ml-2">= {term.translation}</span>}
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">term</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{term.explanation}</p>
                {term.usage && <pre className="mt-2 p-2 rounded bg-zinc-950/50 text-[11px] text-zinc-500 font-mono overflow-x-auto">{term.usage}</pre>}
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        {subTab === 'instructions' && (
          <div className="space-y-3">
            {result.instructions.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-8">No instructions extracted</p>
            ) : result.instructions.map((inst, i) => (
              <div key={i} className="p-3 rounded-lg border border-zinc-800 hover:border-green-500/30 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-sm font-semibold text-green-400">{inst.title}</span>
                    {inst.description && <p className="text-xs text-zinc-500 mt-0.5">{inst.description}</p>}
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{inst.steps.length} steps</span>
                </div>
                <div className="space-y-2 pl-4">
                  {inst.steps.map((step, si) => (
                    <div key={si} className="relative pl-5">
                      <div className="absolute left-0 top-1 w-4 h-4 rounded-sm bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold">{si + 1}</div>
                      <p className="text-xs font-medium text-zinc-300">{step.title}</p>
                      {step.description && <p className="text-[11px] text-zinc-500 mt-0.5">{step.description}</p>}
                      {step.codeBlocks.map((block, bi) => (
                        <div key={bi} className="mt-1.5 rounded border border-zinc-800 overflow-hidden">
                          <div className="flex items-center justify-between px-2 py-0.5 bg-zinc-900/80 border-b border-zinc-800">
                            <span className="text-[10px] text-zinc-600 font-mono">{block.label}</span>
                          </div>
                          <pre className="px-2 py-1.5 text-[11px] text-zinc-400 font-mono overflow-x-auto bg-zinc-950/30">{block.code}</pre>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Commands */}
        {subTab === 'commands' && (
          <div className="space-y-1.5">
            {result.commands.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-8">No commands extracted</p>
            ) : result.commands.map((cmd, i) => (
              <div key={i} className="p-2 rounded-lg border border-zinc-800 hover:border-rose-500/30 transition-colors">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-xs font-mono shrink-0">$</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono text-zinc-200">{cmd.command}</span>
                    {cmd.description && <p className="text-[11px] text-zinc-500 mt-0.5">{cmd.description}</p>}
                    {cmd.full_code !== cmd.command && <pre className="mt-1.5 p-2 rounded bg-zinc-950/50 text-[10px] text-zinc-500 font-mono overflow-x-auto">{cmd.full_code}</pre>}
                  </div>
                  <span className="text-[10px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 shrink-0">{cmd.language}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analysis */}
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
                }`}>{result.analysis.difficulty}</span>
              </div>
            )}
            {result.analysis.suggested_tags && result.analysis.suggested_tags.length > 0 && (
              <div className="p-3 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Suggested Tags</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {result.analysis.suggested_tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
