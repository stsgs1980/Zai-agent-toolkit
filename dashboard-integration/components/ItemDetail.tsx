'use client'

import { useState, useEffect, useCallback } from 'react'
import { P, CATEGORY_CONFIG } from '@/lib/constants'
import type { CategoryKey, UnifiedEntry, RelatedNode } from '@/lib/types'

// ── Props ───────────────────────────────────────────────────

interface ItemDetailProps {
  entry: UnifiedEntry | null
  onVerify?: (id: string, status: string) => void
}

// ── Component ───────────────────────────────────────────────

export function ItemDetail({ entry, onVerify }: ItemDetailProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'metadata' | 'related'>('content')
  const [relatedNodes, setRelatedNodes] = useState<RelatedNode[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)

  // Fetch related nodes
  useEffect(() => {
    if (!entry || activeTab !== 'related') return
    let cancelled = false
    setLoadingRelated(true)
    fetch(`/api/memory/related-graph?id=${encodeURIComponent(entry.id)}`)
      .then((r) => (r.ok ? r.json() : { related: [] }))
      .then((data) => { if (!cancelled) setRelatedNodes(data.related || []) })
      .catch(() => { if (!cancelled) setRelatedNodes([]) })
      .finally(() => { if (!cancelled) setLoadingRelated(false) })
    return () => { cancelled = true }
  }, [entry?.id, activeTab])

  useEffect(() => { setActiveTab('content') }, [entry?.id])

  if (!entry) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: P.faint, fontSize: 14 }}>
        <svg width="48" height="48" fill="none" stroke={P.border} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div style={{ marginTop: 12 }}>Select an entry to view details</div>
      </div>
    )
  }

  const typeConf = CATEGORY_CONFIG[entry.type as CategoryKey]
  const content = entry.content || entry.raw || entry.preview || ''
  const statusTag = getStatusTag(entry.verification_status)
  const isExperience = entry.type === 'experience'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Tabs ── */}
      <div style={{ display: 'flex', padding: '0 24px', borderBottom: `1px solid ${P.borderDim}`, background: P.bgBody }}>
        {(['content', 'metadata', 'related'] as const).map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 500,
              color: activeTab === tab ? P.blue : P.muted,
              cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === tab ? P.blue : 'transparent'}`,
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'related' && (
              <span style={{ fontSize: 10, padding: '1px 6px', background: activeTab === tab ? '#1E3A5F' : P.bgHover, borderRadius: 8, marginLeft: 6, color: activeTab === tab ? P.blue : P.muted }}>
                {relatedNodes.length}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${P.border}`, background: P.bgBody }}>
        {typeConf && <div style={{ width: 8, height: 8, borderRadius: '50%', background: typeConf.color }} />}
        <div style={{ fontSize: 14, fontWeight: 600, color: P.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.title || entry.id}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 500, background: statusTag.bg, color: statusTag.color }}>
            {entry.verification_status}
          </span>
          {entry.verification_status === 'unverified' && onVerify && (
            <button onClick={() => onVerify(entry.id, 'verified')} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: '#064E3B', color: '#34D399', border: '1px solid #34D39944', cursor: 'pointer' }}>
              Verify
            </button>
          )}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, overflow: 'auto', background: P.bgHover }}>
        {/* Content tab */}
        {activeTab === 'content' && (
          <div style={{ padding: '16px 24px' }}>
            {entry.distance !== undefined && (
              <div style={{ marginBottom: 12, padding: '6px 12px', background: '#1E3A5F', borderRadius: 8, fontSize: 11, color: P.blue, display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                Semantic match: {Math.round((1 - entry.distance) * 100)}%
              </div>
            )}
            {isExperience && (entry.good_count !== undefined || entry.bad_count !== undefined) && (
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                {entry.good_count !== undefined && entry.good_count > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.ok }} />
                    <span style={{ fontSize: 12, color: P.ok, fontWeight: 500 }}>{entry.good_count} good</span>
                  </div>
                )}
                {entry.bad_count !== undefined && entry.bad_count > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.err }} />
                    <span style={{ fontSize: 12, color: P.err, fontWeight: 500 }}>{entry.bad_count} bad</span>
                  </div>
                )}
              </div>
            )}
            <SmartContent content={content || '(empty)'} />
          </div>
        )}

        {/* Metadata tab */}
        {activeTab === 'metadata' && (
          <div style={{ padding: '16px 24px' }}>
            <MetaRow label="Type" value={entry.type} />
            <MetaRow label="Source" value={entry.source} />
            <MetaRow label="Status" value={entry.verification_status} />
            {entry.title && <MetaRow label="Title" value={entry.title} />}
            {entry.tags && entry.tags.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: P.faint, marginBottom: 8 }}>Tags</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {entry.tags.map((tag, i) => (
                    <span key={i} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, background: `${P.blue}15`, color: P.blue, border: `1px solid ${P.blue}33` }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Related tab */}
        {activeTab === 'related' && (
          <div style={{ padding: '16px 24px' }}>
            {loadingRelated && <div style={{ textAlign: 'center', color: P.faint, padding: 24 }}>Loading related nodes...</div>}
            {!loadingRelated && relatedNodes.length === 0 && (
              <div style={{ textAlign: 'center', color: P.faint, padding: 24 }}>
                <svg width="36" height="36" fill="none" stroke={P.border} viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <div>No related nodes found in graph</div>
              </div>
            )}
            {relatedNodes.map((node, i) => (
              <div key={i} style={{ padding: '8px 12px', borderRadius: 6, background: P.bgBody, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 500, background: node.direction === 'incoming' ? '#064E3B' : '#1E3A5F', color: node.direction === 'incoming' ? '#34D399' : P.blue }}>
                  {node.direction}
                </span>
                <span style={{ color: P.dim, fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.id}</span>
                <span style={{ fontSize: 10, color: P.muted, flexShrink: 0 }}>{node.edgeType} (w:{node.weight})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────

function getStatusTag(status: string): { bg: string; color: string } {
  switch (status) {
    case 'verified':   return { bg: '#064E3B', color: '#34D399' }
    case 'unverified': return { bg: '#78350F', color: '#FBBF24' }
    case 'conflict':   return { bg: '#7F1D1D', color: '#FCA5A5' }
    default:           return { bg: '#1E293B', color: '#64748B' }
  }
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', padding: '8px 0', borderBottom: `1px solid ${P.borderDim}` }}>
      <div style={{ width: 100, fontSize: 11, fontWeight: 600, color: P.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 12, color: P.dim, fontFamily: 'monospace' }}>{value || '--'}</div>
    </div>
  )
}

// ── SmartContent: renders markdown-like content with copyable code blocks ──

function SmartContent({ content }: { content: string }) {
  const blocks = parseContent(content)
  return (
    <div style={{ fontSize: 13, lineHeight: 1.7, color: P.dim }}>
      {blocks.map((block, i) => {
        if (block.type === 'code') return <CodeBlock key={i} code={block.value} lang={block.lang} />
        if (block.type === 'heading') return <HeadingBlock key={i} level={block.level} text={block.value} />
        return <ProseLine key={i} text={block.value} />
      })}
    </div>
  )
}

// ── Content parser ──

type ContentBlock =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string; lang: string }
  | { type: 'heading'; value: string; level: number }

function parseContent(raw: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  const lines = raw.split('\n')
  let i = 0

  // CLI command prefixes (auto-detect unfenced shell commands)
  const CLI_RE = /^(mkdir|cd |cd$|ls |cat |cp |mv |rm |chmod|chown|ln |git |python |python3|pip |pip3|npm |npx |yarn |pnpm |docker |curl |wget |ssh |scp |tar |echo |export |source |sudo |apt |brew |choco|winget|pow|\.\/|bash |sh |zsh |node |nvm |rbenv|make |cmake|gcc |cargo|rustup|go |dotnet|java |javac|code |nano |vim |cat$|grep |sed |awk |find |xargs|jq |yq |terraform|kubectl|helm |aws |gcloud|az )/

  // Comment line: # something (but NOT markdown heading #)
  const COMMENT_RE = /^#\s/

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Fenced code block: ```lang ... ```
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      blocks.push({ type: 'code', value: codeLines.join('\n'), lang })
      continue
    }

    // Indented code block (4+ spaces, common in CLI recipes)
    if (line.startsWith('    ') && trimmed.length > 0) {
      const codeLines: string[] = []
      while (i < lines.length && lines[i].startsWith('    ') && lines[i].trim().length > 0) {
        codeLines.push(lines[i].slice(4))
        i++
      }
      blocks.push({ type: 'code', value: codeLines.join('\n'), lang: '' })
      continue
    }

    // Markdown heading (## Title, not # comment)
    const headingMatch = line.match(/^(#{2,4})\s+(.+)/)
    if (headingMatch) {
      blocks.push({ type: 'heading', value: headingMatch[2], level: headingMatch[1].length })
      i++
      continue
    }

    // Auto-detect consecutive CLI/command lines as code block
    if ((CLI_RE.test(trimmed) || COMMENT_RE.test(trimmed)) && trimmed.length > 0) {
      const codeLines: string[] = []
      while (i < lines.length) {
        const t = lines[i].trim()
        if (t.length === 0) { i++; break } // blank line ends the block
        if (CLI_RE.test(t) || COMMENT_RE.test(t) || t.startsWith('|') || t.startsWith('&&') || t.startsWith('||')) {
          codeLines.push(lines[i])
          i++
        } else {
          break
        }
      }
      if (codeLines.length > 0) {
        blocks.push({ type: 'code', value: codeLines.join('\n'), lang: 'bash' })
      }
      continue
    }

    // Numbered step: "1. Clone toolkit..." or "1) Clone..."
    const stepMatch = line.match(/^(\d+)[.)]\s+(.+)/)
    if (stepMatch) {
      blocks.push({ type: 'text', value: line })
      i++
      continue
    }

    // Regular text line
    blocks.push({ type: 'text', value: line })
    i++
  }

  return blocks
}

// ── Code block with copy button ──

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [code])

  return (
    <div style={{ position: 'relative', margin: '10px 0', borderRadius: 8, overflow: 'hidden', border: `1px solid ${P.border}`, background: '#0d1117' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px', background: '#161b22', borderBottom: `1px solid ${P.border}` }}>
        <span style={{ fontSize: 10, color: P.muted, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {lang || 'code'}
        </span>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 4, fontSize: 10,
            background: copied ? '#064E3B' : 'transparent',
            color: copied ? '#34D399' : P.muted,
            border: `1px solid ${copied ? '#34D39944' : P.border}`,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {copied ? (
            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {/* Code body */}
      <pre style={{ margin: 0, padding: '12px 16px', fontSize: 12, lineHeight: 1.6, color: '#c9d1d9', fontFamily: "'SF Mono','Fira Code','Cascadia Code',monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'auto' }}>
        {code}
      </pre>
    </div>
  )
}

// ── Heading block ──

function HeadingBlock({ level, text }: { level: number; text: string }) {
  const sizes: Record<number, number> = { 1: 16, 2: 15, 3: 14, 4: 13 }
  return (
    <div style={{ fontSize: sizes[level] || 13, fontWeight: 700, color: P.text, marginTop: level === 1 ? 16 : 12, marginBottom: 4 }}>
      {renderInline(text)}
    </div>
  )
}

// ── Prose line with inline code highlighting ──

function ProseLine({ text }: { text: string }) {
  if (!text.trim()) return <div style={{ height: 8 }} />
  return <div style={{ marginBottom: 2 }}>{renderInline(text)}</div>
}

// ── Inline renderer: `code`, **bold**, - list items, numbered steps ──

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Split on inline code (`...`), bold (**...**), and preserve everything else
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      parts.push(...renderPlainText(text.slice(lastIndex, match.index), key))
      key += 100
    }

    const segment = match[0]
    if (segment.startsWith('`')) {
      // Inline code
      const codeText = segment.slice(1, -1)
      parts.push(
        <code key={`ic-${key++}`} style={{
          padding: '1px 5px', borderRadius: 4, fontSize: 12,
          background: '#1e293b', color: '#e2b55a',
          border: `1px solid #334155`, fontFamily: 'monospace',
        }}>
          {codeText}
        </code>
      )
    } else if (segment.startsWith('**')) {
      // Bold
      const boldText = segment.slice(2, -2)
      parts.push(<strong key={`b-${key++}`} style={{ color: P.text, fontWeight: 600 }}>{boldText}</strong>)
    }

    lastIndex = match.index + segment.length
  }

  // Remaining text after last match
  if (lastIndex < text.length) {
    parts.push(...renderPlainText(text.slice(lastIndex), key))
  }

  return parts.length > 0 ? parts : [<span key="empty">{text}</span>]
}

function renderPlainText(text: string, keyOffset: number): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  // Detect numbered steps: "1. ..." or "1) ..."
  const stepMatch = text.match(/^(\s*)(\d+)([.)]\s+)/)
  if (stepMatch) {
    const [, indent, num, sep] = stepMatch
    const rest = text.slice(indent.length + num.length + sep.length)
    nodes.push(
      <span key={`step-${keyOffset}`} style={{ color: '#e2b55a', fontWeight: 600, fontFamily: 'monospace' }}>
        {indent}{num}{sep}
      </span>
    )
    nodes.push(...renderInline(rest))
    return nodes
  }

  // Detect list items: "- " or "* "
  const listMatch = text.match(/^(\s*)([-*]\s+)/)
  if (listMatch) {
    const [, indent, bullet] = listMatch
    const rest = text.slice(indent.length + bullet.length)
    nodes.push(
      <span key={`li-${keyOffset}`} style={{ color: P.muted }}>
        {indent}{bullet}
      </span>
    )
    nodes.push(...renderInline(rest))
    return nodes
  }

  nodes.push(<span key={`txt-${keyOffset}`}>{text}</span>)
  return nodes
}
