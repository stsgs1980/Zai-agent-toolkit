// ── Doc Intelligence types ─────────────────────────────────

export interface TermItem {
  term: string
  translation: string
  explanation: string
  usage?: string
}

export interface StepBlock {
  title: string
  description: string
  codeBlocks: { label: string; code: string }[]
}

export interface InstructionItem {
  title: string
  description: string
  steps: StepBlock[]
}

export interface CommandItem {
  command: string
  description: string
  full_code: string
  language: string
}

export interface AnalysisResult {
  summary?: string
  suggested_tags?: string[]
  category?: string
  difficulty?: string
}

export interface ExtractionResult {
  terms: TermItem[]
  instructions: InstructionItem[]
  commands: CommandItem[]
  analysis: AnalysisResult
  count: { terms: number; instructions: number; commands: number }
}

export type SubTab = 'terms' | 'instructions' | 'commands' | 'analysis'
