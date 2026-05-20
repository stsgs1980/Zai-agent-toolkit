import { NextRequest, NextResponse } from 'next/server'
import {
  loadAIConfig,
  callAI,
  healthCheck,
} from '@/lib/ai-bridge'

// FORCE Node.js runtime
export const runtime = 'nodejs'

const LOG_TAG = 'DocIntel'

// ── Helper: HTML → Clean Text ───────────────────────────────

function stripHtml(html: string): string {
  let text = html
  text = text.replace(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    (_, code) => '\n```\n' + code.trim() + '\n```\n')
  text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi,
    (_, code) => '\n```\n' + code.trim() + '\n```\n')
  text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
  text = text.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, level, c) => {
    return '\n' + '#'.repeat(Number(level)) + ' ' + c.trim() + '\n'
  })
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n\n')
  text = text.replace(/<\/(div|section|article|main|header|footer|nav|aside)>/gi, '\n')
  text = text.replace(/<[^>]+>/g, '')
  text = decodeHtmlEntities(text)
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

function isHtmlContent(text: string): boolean {
  return /<[a-zA-Z][^>]*>/.test(text.substring(0, 2000))
}

// ── Prompt Templates ────────────────────────────────────────

const PROMPTS = {
  terms: {
    system: `You are an expert lexicographer. Extract all technical terms from the text.
For each term provide:
1) term - the term in English
2) translation - Russian translation
3) explanation - what it does and why it matters (2-3 sentences)
4) usage - short code/example of usage (optional)

Return ONLY valid JSON array, no markdown fences:
[{"term":"...","translation":"...","explanation":"...","usage":"..."}]
Max 30 terms. Focus on non-obvious technical terms, not common words.`,
    maxContent: 6000,
  },
  instructions: {
    system: `You are a technical writer. Extract all step-by-step instructions/how-to guides from the text.
For each instruction provide:
1) title - instruction title
2) description - brief description (1-2 sentences)
3) steps - array of steps, each step has: title, description, codeBlocks (array of {label, code})

Return ONLY valid JSON array, no markdown fences:
[{"title":"...","description":"...","steps":[{"title":"...","description":"...","codeBlocks":[{"label":"...","code":"..."}]}]}]
Max 10 instructions. Only include real instructions with actionable steps.`,
    maxContent: 6000,
  },
  commands: {
    system: `You are a CLI expert. Extract all command-line commands and code recipes from the text.
For each command provide:
1) command - the primary command (first line)
2) description - what it does (1 sentence)
3) full_code - the complete code block
4) language - programming language or shell type

Return ONLY valid JSON array, no markdown fences:
[{"command":"...","description":"...","full_code":"...","language":"..."}]
Max 20 commands.`,
    maxContent: 6000,
  },
  analyze: {
    system: `You are a document analyst for a developer knowledge base.
Analyze the document and provide:
1) summary - 2-3 sentence summary
2) suggested_tags - array of up to 8 relevant tags (lowercase, kebab-case)
3) category - suggested category name
4) difficulty - "beginner", "intermediate", or "advanced"

Return ONLY valid JSON, no markdown fences:
{"summary":"...","suggested_tags":["..."],"category":"...","difficulty":"..."}`,
    maxContent: 4000,
  },
}

type ExtractMode = keyof typeof PROMPTS

// ── GET: Health Check ───────────────────────────────────────

export async function GET() {
  const health = await healthCheck(LOG_TAG)
  const statusCode = health.status === 'healthy' ? 200 : 503
  return NextResponse.json(health, { status: statusCode })
}

// ── POST Handler ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const config = loadAIConfig(LOG_TAG)

    const body = await request.json()
    const { content, mode } = body as { content: string; mode: ExtractMode | 'all' }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    let cleanContent = content
    let wasHtml = false
    if (isHtmlContent(content)) {
      cleanContent = stripHtml(content)
      wasHtml = true
      console.log(`[${LOG_TAG}] HTML detected, stripped ${content.length} → ${cleanContent.length} chars`)
    } else {
      console.log(`[${LOG_TAG}] Plain text, ${content.length} chars`)
    }

    if (mode === 'all') {
      const errors: Record<string, string> = {}
      let terms: any[] = []
      let instructions: any[] = []
      let commands: any[] = []
      let analysis: any = {}

      try {
        terms = await callAI({ systemPrompt: PROMPTS.terms.system, userContent: cleanContent, maxContent: PROMPTS.terms.maxContent, logTag: LOG_TAG }, config)
        if (!Array.isArray(terms)) terms = []
      } catch (e: any) { errors.terms = e.message }

      try {
        instructions = await callAI({ systemPrompt: PROMPTS.instructions.system, userContent: cleanContent, maxContent: PROMPTS.instructions.maxContent, logTag: LOG_TAG }, config)
        if (!Array.isArray(instructions)) instructions = []
      } catch (e: any) { errors.instructions = e.message }

      try {
        commands = await callAI({ systemPrompt: PROMPTS.commands.system, userContent: cleanContent, maxContent: PROMPTS.commands.maxContent, logTag: LOG_TAG }, config)
        if (!Array.isArray(commands)) commands = []
      } catch (e: any) { errors.commands = e.message }

      try {
        analysis = await callAI({ systemPrompt: PROMPTS.analyze.system, userContent: cleanContent, maxContent: PROMPTS.analyze.maxContent, logTag: LOG_TAG }, config)
        if (!analysis || typeof analysis !== 'object') analysis = {}
      } catch (e: any) { errors.analyze = e.message }

      return NextResponse.json({
        terms, instructions, commands, analysis,
        html_stripped: wasHtml,
        clean_length: cleanContent.length,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        count: { terms: terms.length, instructions: instructions.length, commands: commands.length },
      })
    }

    if (!PROMPTS[mode]) {
      return NextResponse.json(
        { error: `Invalid mode. Valid: ${Object.keys(PROMPTS).join(', ')}, all` },
        { status: 400 }
      )
    }

    const prompt = PROMPTS[mode]
    const result = await callAI({
      systemPrompt: prompt.system,
      userContent: cleanContent,
      maxContent: prompt.maxContent,
      logTag: LOG_TAG,
    }, config)

    return NextResponse.json({
      mode,
      items: Array.isArray(result) ? result : [result],
      count: Array.isArray(result) ? result.length : 1,
      html_stripped: wasHtml,
      clean_length: cleanContent.length,
    })

  } catch (error: any) {
    console.error(`[${LOG_TAG}] POST error:`, error)
    return NextResponse.json(
      { error: 'Extraction failed', details: error.message, stack: error.stack?.substring(0, 300) },
      { status: 500 }
    )
  }
}
