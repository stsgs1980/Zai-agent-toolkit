'use client'

import { useState } from 'react'

// ── Data ──────────────────────────────────────────────────────

interface CommandEntry {
  name: string
  description: string
  command: string
  category: string
}

interface SkillEntry {
  name: string
  description: string
  trigger: string
  category: string
}

const COMMANDS: CommandEntry[] = [
  // ── PowerShell ──
  { name: 'Save-Session', description: 'Сохранить опыт сессии', command: 'ss', category: 'PowerShell' },
  { name: 'Get-Memory', description: 'Поиск по памяти', command: 'gmem <query>', category: 'PowerShell' },
  { name: 'List-Memory', description: 'Список записей памяти', command: 'lm', category: 'PowerShell' },
  { name: 'Sync-Index', description: 'Синхронизировать индекс файлов', command: 'Sync-Index', category: 'PowerShell' },
  { name: 'Check-IndexSync', description: 'Проверить актуальность индекса', command: 'Check-IndexSync', category: 'PowerShell' },
  { name: 'Stop-SessionTimer', description: 'Остановить таймер автосохранения', command: 'Stop-SessionTimer', category: 'PowerShell' },
  // ── Memory CLI ──
  { name: 'Stats', description: 'Статистика ChromaDB', command: 'python memory_cli.py stats', category: 'Memory CLI' },
  { name: 'Store Entry', description: 'Сохранить запись', command: 'python memory_cli.py store <type> --content "..."', category: 'Memory CLI' },
  { name: 'Query Memory', description: 'Семантический поиск', command: 'python memory_cli.py query <text>', category: 'Memory CLI' },
  { name: 'Graph Scan', description: 'Индексация графа зависимостей', command: 'python folder_indexer.py graph-scan', category: 'Memory CLI' },
  { name: 'Sync Files', description: 'Синхронизация файлов в индекс', command: 'python sync_index.py', category: 'Memory CLI' },
  // ── Session Summary ──
  { name: 'Save Experience', description: 'Сохранить опыт вручную', command: 'python session_summary.py manual --title "..." --good "..." --bad "..."', category: 'Session' },
  { name: 'From Worklog', description: 'Сгенерировать опыт из worklog', command: 'python session_summary.py from-worklog <path>', category: 'Session' },
  { name: 'List Experiences', description: 'Список опыта', command: 'python session_summary.py list', category: 'Session' },
  { name: 'Verify Experience', description: 'Подтвердить запись опыта', command: 'python session_summary.py verify <id> --status verified', category: 'Session' },
  // ── Git ──
  { name: 'Pull Toolkit', description: 'Обновить toolkit', command: 'cd ~/.zcode/Zai-agent-toolkit; git pull', category: 'Git' },
  { name: 'Push Changes', description: 'Закоммитить и запушить', command: 'git add .; git commit -m "..."; git push', category: 'Git' },
  { name: 'Check Status', description: 'Статус репозитория', command: 'git status --short', category: 'Git' },
  { name: 'Recent Commits', description: 'Последние коммиты', command: 'git log --oneline -10', category: 'Git' },
  // ── Dashboard ──
  { name: 'Start Dashboard', description: 'Запустить дашборд', command: 'cd ~/.zcode/memory-dashboard; npm run dev', category: 'Dashboard' },
  { name: 'Bridge Stats', description: 'Статистика через bridge', command: 'python memory_bridge.py stats', category: 'Dashboard' },
  { name: 'Bridge Search', description: 'Поиск через bridge', command: 'python memory_bridge.py search <query>', category: 'Dashboard' },
]

const SKILLS: SkillEntry[] = [
  { name: 'anti-monolith', description: 'Декомпозиция больших файлов и компонентов', trigger: 'ZAI-ARCH-002', category: 'Architecture' },
  { name: 'session-experience', description: 'Автосохранение опыта сессии в ChromaDB', trigger: 'ZAI-SESSION-003', category: 'Session' },
  { name: 'memory-store', description: 'Сохранение записей в память', trigger: 'ZAI-MEM-001', category: 'Memory' },
  { name: 'memory-query', description: 'Поиск по памяти', trigger: 'ZAI-MEM-002', category: 'Memory' },
  { name: 'folder-indexer', description: 'Индексация файлов и зависимостей', trigger: 'ZAI-FS-001', category: 'FileSystem' },
  { name: 'session-log', description: 'Логирование сессии', trigger: 'ZAI-SESSION-001', category: 'Session' },
  { name: 'context-consolidation', description: 'Сжатие контекста при переполнении', trigger: 'ZAI-SESSION-002', category: 'Session' },
  { name: 'doc-intelligence', description: 'AI-экстракция из документов', trigger: 'DocIntel', category: 'AI' },
  { name: 'graph-engine', description: 'Граф зависимостей и связей', trigger: 'GraphEngine', category: 'Graph' },
]

// ── Category colors ──

const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'PowerShell':   { bg: '#0ea5e915', text: '#38bdf8', border: '#0ea5e933' },
  'Memory CLI':   { bg: '#a855f715', text: '#c084fc', border: '#a855f733' },
  'Session':      { bg: '#4ade8015', text: '#4ade80', border: '#4ade8033' },
  'Git':          { bg: '#f8717115', text: '#f87171', border: '#f8717133' },
  'Dashboard':    { bg: '#fbbf2415', text: '#fbbf24', border: '#fbbf2433' },
  'Architecture': { bg: '#f59e0b15', text: '#f59e0b', border: '#f59e0b33' },
  'Memory':       { bg: '#a855f715', text: '#c084fc', border: '#a855f733' },
  'FileSystem':   { bg: '#2dd4bf15', text: '#2dd4bf', border: '#2dd4bf33' },
  'AI':           { bg: '#e879f915', text: '#e879f9', border: '#e879f933' },
  'Graph':        { bg: '#2dd4bf15', text: '#2dd4bf', border: '#2dd4bf33' },
}

// ── Component ────────────────────────────────────────────────

export function HotCommandsView() {
  const [filter, setFilter] = useState<string>('all')
  const [mode, setMode] = useState<'commands' | 'skills'>('commands')

  const allCategories = mode === 'commands'
    ? [...new Set(COMMANDS.map(c => c.category))]
    : [...new Set(SKILLS.map(s => s.category))]

  const filteredItems = mode === 'commands'
    ? COMMANDS.filter(c => filter === 'all' || c.category === filter)
    : SKILLS.filter(s => filter === 'all' || s.category === filter)

  return (
    <div className="space-y-4">
      {/* ── Mode toggle ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setMode('commands'); setFilter('all') }}
          className="h-9 px-4 text-xs rounded-lg font-medium transition-all"
          style={{
            background: mode === 'commands' ? 'linear-gradient(180deg, #f59e0b, #d97706)' : '#1e293b',
            color: mode === 'commands' ? '#fff' : '#64748b',
            border: `1px solid ${mode === 'commands' ? '#f59e0b55' : '#334155'}`,
            boxShadow: mode === 'commands' ? '0 0 10px #f59e0b33' : 'none',
          }}
        >
          Commands
        </button>
        <button
          onClick={() => { setMode('skills'); setFilter('all') }}
          className="h-9 px-4 text-xs rounded-lg font-medium transition-all"
          style={{
            background: mode === 'skills' ? 'linear-gradient(180deg, #e879f9, #a855f7)' : '#1e293b',
            color: mode === 'skills' ? '#fff' : '#64748b',
            border: `1px solid ${mode === 'skills' ? '#e879f955' : '#334155'}`,
            boxShadow: mode === 'skills' ? '0 0 10px #e879f933' : 'none',
          }}
        >
          Skills
        </button>

        <div className="flex-1" />

        <span className="text-[10px] text-zinc-600 font-mono">
          {filteredItems.length} {mode === 'commands' ? 'commands' : 'skills'}
        </span>
      </div>

      {/* ── Category filter ── */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter('all')}
          className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
          style={{
            backgroundColor: filter === 'all' ? '#334155' : '#0f172a',
            border: `1px solid ${filter === 'all' ? '#475569' : '#1e293b'}`,
            color: filter === 'all' ? '#e2e8f0' : '#475569',
          }}
        >
          All
        </button>
        {allCategories.map(cat => {
          const colors = CAT_COLORS[cat] || { bg: '#334155', text: '#94a3b8', border: '#475569' }
          const isActive = filter === cat
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
              style={{
                backgroundColor: isActive ? colors.bg : '#0f172a',
                border: `1px solid ${isActive ? colors.border : '#1e293b'}`,
                color: isActive ? colors.text : '#475569',
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* ── Table ── */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          border: '1px solid #1e293b55',
        }}
      >
        {/* Header */}
        <div
          className="grid gap-2 px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider"
          style={{
            gridTemplateColumns: mode === 'commands' ? '1fr 1.5fr 2fr' : '1fr 1.5fr 1fr',
            background: '#0f172a',
            borderBottom: '1px solid #1e293b55',
          }}
        >
          <span className="text-zinc-500">Name</span>
          <span className="text-zinc-500">Description</span>
          <span className="text-zinc-500">{mode === 'commands' ? 'Command' : 'Trigger ID'}</span>
        </div>

        {/* Rows */}
        {filteredItems.map((item, i) => {
          const cat = 'category' in item ? (item as CommandEntry | SkillEntry).category : ''
          const colors = CAT_COLORS[cat] || { bg: '#33415515', text: '#94a3b8', border: '#47556933' }

          return (
            <div
              key={i}
              className="grid gap-2 px-4 py-2.5 text-xs transition-colors hover:bg-zinc-800/30"
              style={{
                gridTemplateColumns: mode === 'commands' ? '1fr 1.5fr 2fr' : '1fr 1.5fr 1fr',
                borderBottom: i < filteredItems.length - 1 ? '1px solid #1e293b33' : 'none',
              }}
            >
              {/* Name */}
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium shrink-0"
                  style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                >
                  {cat}
                </span>
                <span className="text-zinc-200 font-mono truncate">{item.name}</span>
              </div>

              {/* Description */}
              <span className="text-zinc-400 text-[11px]">{item.description}</span>

              {/* Command / Trigger */}
              <code
                className="text-[11px] px-2 py-0.5 rounded bg-zinc-900/80 text-emerald-400 border border-emerald-500/15 font-mono truncate"
                style={{ maxWidth: '100%', display: 'inline-block' }}
              >
                {mode === 'commands' ? (item as CommandEntry).command : (item as SkillEntry).trigger}
              </code>
            </div>
          )
        })}
      </div>

      {/* ── Hint ── */}
      <div className="text-center py-2">
        <span className="text-[10px] text-zinc-700 font-mono">
          {mode === 'commands'
            ? 'Click command to copy | Run in PowerShell or terminal'
            : 'Skills auto-activate by triggers or call by ID'}
        </span>
      </div>
    </div>
  )
}
