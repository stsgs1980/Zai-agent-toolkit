'use client'

// ── Component ───────────────────────────────────────────────

interface ExtractTerminalInputProps {
  extractContent: string
  setExtractContent: (v: string) => void
  extractSourceTag: string
  setExtractSourceTag: (v: string) => void
  onExtract: () => void
  extracting: boolean
}

export function ExtractTerminalInput({
  extractContent,
  setExtractContent,
  extractSourceTag,
  setExtractSourceTag,
  onExtract,
  extracting,
}: ExtractTerminalInputProps) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: '#0f172a', border: '1px solid #1e293b' }}
    >
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs font-mono text-zinc-500 ml-2">experience-extract</span>
        <div className="ml-auto flex gap-2">
          <input
            value={extractSourceTag}
            onChange={(e) => setExtractSourceTag(e.target.value)}
            placeholder="source tag"
            className="h-6 px-2 text-xs rounded border border-zinc-700 bg-zinc-900/50 text-zinc-400 font-mono w-32 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
          />
          <button
            onClick={onExtract}
            disabled={extracting || !extractContent.trim()}
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

      {/* Content area */}
      <div className="p-3">
        <textarea
          value={extractContent}
          onChange={(e) => setExtractContent(e.target.value)}
          className="w-full h-40 bg-zinc-900/50 text-zinc-300 text-sm font-mono p-3 rounded-md border border-zinc-800 resize-y focus:outline-none focus:ring-1 focus:ring-sky-500/50"
          placeholder="Paste session text, worklog, or conversation summary here..."
        />
      </div>
    </div>
  )
}
