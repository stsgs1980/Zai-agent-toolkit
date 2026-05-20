// ── Shared constants for Memory Dashboard ──────────────────
//
// Design token system based on ui-clarity_sts / design-system-unify
// Color tokens use CSS custom properties (var(--md-*)) with hex fallbacks.
// This enables dark/light theme switching via a single class toggle.

// ── Design Token CSS ──────────────────────────────────────
// Inject this <style> block in the root layout component.
// It defines all semantic tokens for both themes.

export const DESIGN_TOKENS_CSS = `
:root {
  /* ── Backgrounds ── */
  --md-bg-body:      #0F172A;
  --md-bg-sidebar:   #1E293B;
  --md-bg-hover:     #334155;
  --md-bg-input:     #1E293B;
  --md-bg-card:      #0F172A;
  --md-bg-elevated:  #1E293B;

  /* ── Borders ── */
  --md-border:       #334155;
  --md-border-dim:   rgba(30, 41, 59, 0.33);
  --md-border-faint: rgba(30, 41, 59, 0.27);

  /* ── Text ── */
  --md-text:         #F1F5F9;
  --md-text-dim:     #CBD5E1;
  --md-text-muted:   #94A3B8;
  --md-text-faint:   #64748B;

  /* ── Accents ── */
  --md-blue:         #3B82F6;
  --md-purple:       #8B5CF6;
  --md-amber:        #F59E0B;
  --md-green:        #10B981;
  --md-cyan:         #06B6D4;

  /* ── Status ── */
  --md-ok:           #10B981;
  --md-warn:         #F59E0B;
  --md-err:          #EF4444;

  /* ── Alpha variants (common opacity levels) ── */
  --md-blue-a15:     rgba(59, 130, 246, 0.08);
  --md-blue-a44:     rgba(59, 130, 246, 0.27);
  --md-purple-a15:   rgba(139, 92, 246, 0.08);
  --md-purple-a33:   rgba(139, 92, 246, 0.20);
  --md-purple-a44:   rgba(139, 92, 246, 0.27);
  --md-green-a15:    rgba(16, 185, 129, 0.08);
  --md-green-a44:    rgba(16, 185, 129, 0.27);
  --md-amber-a15:    rgba(245, 158, 11, 0.08);
  --md-amber-a44:    rgba(245, 158, 11, 0.27);
  --md-cyan-a15:     rgba(6, 182, 212, 0.08);
  --md-cyan-a44:     rgba(6, 182, 212, 0.27);
  --md-err-a15:      rgba(239, 68, 68, 0.08);
  --md-err-a44:      rgba(239, 68, 68, 0.27);

  /* ── Radius scale (ui-clarity convention) ── */
  --md-radius-sm:    4px;
  --md-radius:       6px;
  --md-radius-md:    8px;
  --md-radius-lg:    10px;
  --md-radius-xl:    14px;

  /* ── Typography (ui-clarity convention) ── */
  --md-font-sans:    -apple-system, BlinkMacSystemFont, 'PingFang SC', 'SF Pro Display', 'Inter', sans-serif;
  --md-font-mono:    'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace;

  /* ── Shadows ── */
  --md-shadow-sm:    0 1px 2px rgba(0,0,0,0.3);
  --md-shadow:       0 4px 12px rgba(0,0,0,0.4);
  --md-shadow-lg:    0 8px 32px rgba(0,0,0,0.5);
}

/* ── Light theme ── */
:root.md-light {
  --md-bg-body:      #F8FAFC;
  --md-bg-sidebar:   #FFFFFF;
  --md-bg-hover:     #F1F5F9;
  --md-bg-input:     #F1F5F9;
  --md-bg-card:      #FFFFFF;
  --md-bg-elevated:  #F8FAFC;

  --md-border:       #E2E8F0;
  --md-border-dim:   rgba(226, 232, 240, 0.5);
  --md-border-faint: rgba(226, 232, 240, 0.33);

  --md-text:         #0F172A;
  --md-text-dim:     #334155;
  --md-text-muted:   #64748B;
  --md-text-faint:   #94A3B8;

  /* Accents stay the same in light mode */
  --md-blue-a15:     rgba(59, 130, 246, 0.06);
  --md-purple-a15:   rgba(139, 92, 246, 0.06);
  --md-green-a15:    rgba(16, 185, 129, 0.06);
  --md-amber-a15:    rgba(245, 158, 11, 0.06);
  --md-cyan-a15:     rgba(6, 182, 212, 0.06);
  --md-err-a15:      rgba(239, 68, 68, 0.06);

  --md-shadow-sm:    0 1px 2px rgba(0,0,0,0.06);
  --md-shadow:       0 4px 12px rgba(0,0,0,0.08);
  --md-shadow-lg:    0 8px 32px rgba(0,0,0,0.12);
}
`

// ── Color Palette — reads from CSS custom properties ──────
// Fallback hex values ensure rendering even before CSS loads.

export const P = {
  // Backgrounds
  bgBody:     'var(--md-bg-body, #0F172A)',
  bgSidebar:  'var(--md-bg-sidebar, #1E293B)',
  bgHover:    'var(--md-bg-hover, #334155)',
  bgInput:    'var(--md-bg-input, #1E293B)',
  bgCard:     'var(--md-bg-card, #0F172A)',
  bgElevated: 'var(--md-bg-elevated, #1E293B)',
  // Borders
  border:     'var(--md-border, #334155)',
  borderDim:  'var(--md-border-dim, rgba(30,41,59,0.33))',
  borderFaint:'var(--md-border-faint, rgba(30,41,59,0.27))',
  // Text
  text:       'var(--md-text, #F1F5F9)',
  dim:        'var(--md-text-dim, #CBD5E1)',
  muted:      'var(--md-text-muted, #94A3B8)',
  faint:      'var(--md-text-faint, #64748B)',
  // Accents
  blue:       'var(--md-blue, #3B82F6)',
  purple:     'var(--md-purple, #8B5CF6)',
  amber:      'var(--md-amber, #F59E0B)',
  green:      'var(--md-green, #10B981)',
  cyan:       'var(--md-cyan, #06B6D4)',
  // Status
  ok:         'var(--md-ok, #10B981)',
  warn:       'var(--md-warn, #F59E0B)',
  err:        'var(--md-err, #EF4444)',
} as const

// ── Alpha tokens (for bg/border with opacity) ─────────────
export const PA = {
  blue15:     'var(--md-blue-a15, rgba(59,130,246,0.08))',
  blue44:     'var(--md-blue-a44, rgba(59,130,246,0.27))',
  purple15:   'var(--md-purple-a15, rgba(139,92,246,0.08))',
  purple33:   'var(--md-purple-a33, rgba(139,92,246,0.20))',
  purple44:   'var(--md-purple-a44, rgba(139,92,246,0.27))',
  green15:    'var(--md-green-a15, rgba(16,185,129,0.08))',
  green44:    'var(--md-green-a44, rgba(16,185,129,0.27))',
  amber15:    'var(--md-amber-a15, rgba(245,158,11,0.08))',
  amber44:    'var(--md-amber-a44, rgba(245,158,11,0.27))',
  cyan15:     'var(--md-cyan-a15, rgba(6,182,212,0.08))',
  cyan44:     'var(--md-cyan-a44, rgba(6,182,212,0.27))',
  err15:      'var(--md-err-a15, rgba(239,68,68,0.08))',
  err44:      'var(--md-err-a44, rgba(239,68,68,0.27))',
} as const

// ── Radius tokens ─────────────────────────────────────────
export const R = {
  sm:   'var(--md-radius-sm, 4px)',
  base: 'var(--md-radius, 6px)',
  md:   'var(--md-radius-md, 8px)',
  lg:   'var(--md-radius-lg, 10px)',
  xl:   'var(--md-radius-xl, 14px)',
} as const

// ── Font tokens ───────────────────────────────────────────
export const F = {
  sans: "var(--md-font-sans, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'SF Pro Display', 'Inter', sans-serif)",
  mono: "var(--md-font-mono, 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace)",
} as const

// ── Category Configuration ────────────────────────────────

export type CategoryKey =
  | 'knowledge' | 'pattern' | 'command' | 'project'
  | 'session' | 'template' | 'experience'
  | 'graph' | 'skills' | 'docintel'

export const CATEGORY_CONFIG: Record<CategoryKey, {
  label: string
  color: string
  icon: string
  group: 'memory' | 'tools'
}> = {
  // Memory categories
  knowledge:  { label: 'Knowledge',  color: '#8B5CF6', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', group: 'memory' },
  pattern:    { label: 'Patterns',   color: '#F59E0B', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', group: 'memory' },
  command:    { label: 'Commands',   color: '#EF4444', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', group: 'memory' },
  project:    { label: 'Projects',   color: '#10B981', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', group: 'memory' },
  session:    { label: 'Sessions',   color: '#3B82F6', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', group: 'memory' },
  template:   { label: 'Templates',  color: '#FB923C', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', group: 'memory' },
  experience: { label: 'Experience', color: '#06B6D4', icon: 'M13 10V3L4 14h7v7l9-11h-7z', group: 'memory' },
  // Tool views
  graph:      { label: 'Graph',      color: '#2DD4BF', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', group: 'tools' },
  skills:     { label: 'Skills',     color: '#F59E0B', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', group: 'tools' },
  docintel:   { label: 'Doc Intel',  color: '#A78BFA', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', group: 'tools' },
}

export const CATEGORY_KEYS: CategoryKey[] = Object.keys(CATEGORY_CONFIG) as CategoryKey[]

// ── Legacy type/color maps (used by older components) ─────

export const TYPE_LABELS: Record<string, string> = {
  knowledge: 'Knowledge',
  session: 'Session',
  pattern: 'Pattern',
  project: 'Project',
  template: 'Template',
  command: 'Command',
}

export const TYPE_COLORS: Record<string, string> = {
  knowledge: '#8B5CF6',
  session: '#3B82F6',
  pattern: '#F59E0B',
  project: '#10B981',
  template: '#FB923C',
  command: '#EF4444',
}

// ── SVG Icon components ────────────────────────────────────

export const Icons = {
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Copy: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Brain: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Refresh: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Graph: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
  List: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  Database: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
  Sun: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Moon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
}

// ── Theme Hook ────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light'

const THEME_STORAGE_KEY = 'md-theme'

export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* ignore */ }
  return 'dark'
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (mode === 'light') {
    root.classList.add('md-light')
  } else {
    root.classList.remove('md-light')
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch { /* ignore */ }
}
