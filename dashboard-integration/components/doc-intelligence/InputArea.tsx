import React, { useCallback } from 'react'

interface InputAreaProps {
  content: string
  setContent: (v: string) => void
  sourceTag: string
  setSourceTag: (v: string) => void
  extracting: boolean
  onExtract: () => void
  dragOver: boolean
  setDragOver: (v: boolean) => void
  onFile: (file: File) => void
}

export function InputArea({
  content, setContent, sourceTag, setSourceTag,
  extracting, onExtract, dragOver, setDragOver, onFile,
}: InputAreaProps) {

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile, setDragOver])

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
        <span className="text-xs font-mono text-zinc-500 ml-2">doc-intelligence</span>
        <div className="ml-auto flex gap-2">
          <input
            value={sourceTag}
            onChange={(e) => setSourceTag(e.target.value)}
            placeholder="source tag"
            className="h-6 px-2 text-xs rounded border border-zinc-700 bg-zinc-900/50 text-zinc-400 font-mono w-32 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
          />
          <button
            onClick={onExtract}
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

      {/* Content area */}
      <div className="p-3">
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
                  if (file) onFile(file)
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
  )
}
