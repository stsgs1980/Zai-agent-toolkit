import { NextRequest, NextResponse } from 'next/server'

// ── Helper: HTML → Clean Text ───────────────────────────────

function stripHtml(html: string): string {
  let text = html

  // Preserve code blocks: <pre><code>...</code></pre> → fenced block
  text = text.replace(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    (_, code) => '\n```\n' + code.trim() + '\n```\n')

  // <pre>...</pre> without inner <code>
  text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi,
    (_, code) => '\n```\n' + code.trim() + '\n```\n')

  // <code>...</code> → `...`
  text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')

  // Headings → markdown (h1→#, h2→##, etc)
  text = text.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, level, c) => {
    return '\n' + '#'.repeat(Number(level)) + ' ' + c.trim() + '\n'
  })

  // <li> → - item
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1')

  // <br> / <br/> → newline
  text = text.replace(/<br\s*\/?>/gi, '\n')

  // <p> → double newline
  text = text.replace(/<\/p>/gi, '\n\n')

  // <div>, <section> → newline
  text = text.replace(/<\/(div|section|article|main|header|footer|nav|aside)>/gi, '\n')

  // Remove all remaining tags
  text = text.replace(/<[^>]+>/g, '')

  // Decode HTML entities
  text = decodeHtmlEntities(text)

  // Collapse multiple blank lines to max 2
  text = text.replace(/\n{3,}/g, '\n\n')

  return text.trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
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

// ── Helper: Parse AI JSON Response ──────────────────────────

function parseAIResponse(raw: string): any {
  console.log(`[DocIntel] Raw AI response (${raw.length} chars): ${raw.substring(0, 300)}...`)

  // Strip markdown fences
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```json?\s*/g, '').replace(/```/g, '')

  // Try direct parse first
  try {
    return JSON.parse(cleaned.trim())
  } catch {
    // Continue to regex extraction
  }

  // Regex extraction: find JSON array or object
  const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch (e: any) {
      console.error(`[DocIntel] JSON parse failed: ${e.message}`)
      console.error(`[DocIntel] Extracted text: ${jsonMatch[0].substring(0, 500)}`)
      throw new Error(`JSON parse error: ${e.message}`)
    }
  }

  throw new Error('No JSON found in AI response. Raw: ' + raw.substring(0, 200))
}

// ── Helper: Call AI via SDK (dynamic import) ────────────────

async function callAI(mode: ExtractMode, content: string): Promise<any> {
  const prompt = PROMPTS[mode]
  const truncated = content.substring(0, prompt.maxContent)

  console.log(`[DocIntel] callAI('${mode}') — content ${truncated.length} chars`)

  // Dynamic import — same pattern as working Wiki-Codex-v2 routes
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  console.log(`[DocIntel] SDK imported OK`)

  const zai = await ZAI.create()
  console.log(`[DocIntel] ZAI instance created OK`)

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: truncated },
    ],
    temperature: 0.2,
  })
  console.log(`[DocIntel] AI completion received, model: ${completion?.model || 'unknown'}`)

  const raw = completion.choices[0]?.message?.content || ''
  if (!raw.trim()) {
    throw new Error('AI returned empty response')
  }

  return parseAIResponse(raw)
}

// ── GET: Health Check ───────────────────────────────────────

export async function GET() {
  const health: Record<string, any> = {
    status: 'checking',
    sdk: 'unknown',
    config: 'unknown',
    ai_call: 'unknown',
    timestamp: new Date().toISOString(),
  }

  try {
    // Test SDK import
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    health.sdk = 'imported'

    // Test ZAI.create()
    const zai = await ZAI.create()
    health.config = 'loaded'

    // Test a simple AI call
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Return exactly: [{"status":"ok"}]' },
        { role: 'user', content: 'test' },
      ],
      temperature: 0,
    })

    const raw = completion.choices[0]?.message?.content || ''
    health.ai_call = raw.includes('ok') ? 'working' : `unexpected: ${raw.substring(0, 100)}`
    health.model = completion?.model || 'unknown'
    health.status = health.ai_call === 'working' ? 'healthy' : 'degraded'
  } catch (e: any) {
    health.status = 'unhealthy'
    health.error = e.message
    health.error_stack = e.stack?.substring(0, 500)
  }

  const statusCode = health.status === 'healthy' ? 200 : 503
  return NextResponse.json(health, { status: statusCode })
}

// ── POST Handler ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, mode } = body as { content: string; mode: ExtractMode | 'all' }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      )
    }

    // Auto-detect and strip HTML → clean text
    let cleanContent = content
    let wasHtml = false
    if (isHtmlContent(content)) {
      cleanContent = stripHtml(content)
      wasHtml = true
      console.log(`[DocIntel] HTML detected, stripped ${content.length} → ${cleanContent.length} chars`)
    } else {
      console.log(`[DocIntel] Plain text, ${content.length} chars`)
    }

    // If mode is 'all', run extractions SEQUENTIALLY (not parallel — avoids overwhelming the API)
    if (mode === 'all') {
      const errors: Record<string, string> = {}
      let terms: any[] = []
      let instructions: any[] = []
      let commands: any[] = []
      let analysis: any = {}

      // Sequential extraction with error isolation
      try {
        terms = await callAI('terms', cleanContent)
        if (!Array.isArray(terms)) terms = []
        console.log(`[DocIntel] terms: ${terms.length} extracted`)
      } catch (e: any) {
        errors.terms = e.message
        console.error(`[DocIntel] terms error: ${e.message}`)
      }

      try {
        instructions = await callAI('instructions', cleanContent)
        if (!Array.isArray(instructions)) instructions = []
        console.log(`[DocIntel] instructions: ${instructions.length} extracted`)
      } catch (e: any) {
        errors.instructions = e.message
        console.error(`[DocIntel] instructions error: ${e.message}`)
      }

      try {
        commands = await callAI('commands', cleanContent)
        if (!Array.isArray(commands)) commands = []
        console.log(`[DocIntel] commands: ${commands.length} extracted`)
      } catch (e: any) {
        errors.commands = e.message
        console.error(`[DocIntel] commands error: ${e.message}`)
      }

      try {
        analysis = await callAI('analyze', cleanContent)
        if (!analysis || typeof analysis !== 'object') analysis = {}
        console.log(`[DocIntel] analysis: done`)
      } catch (e: any) {
        errors.analyze = e.message
        console.error(`[DocIntel] analyze error: ${e.message}`)
      }

      return NextResponse.json({
        terms,
        instructions,
        commands,
        analysis,
        html_stripped: wasHtml,
        clean_length: cleanContent.length,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        count: {
          terms: terms.length,
          instructions: instructions.length,
          commands: commands.length,
        },
      })
    }

    // Single mode extraction
    if (!PROMPTS[mode]) {
      return NextResponse.json(
        { error: `Invalid mode. Valid: ${Object.keys(PROMPTS).join(', ')}, all` },
        { status: 400 }
      )
    }

    const result = await callAI(mode, cleanContent)

    return NextResponse.json({
      mode,
      items: Array.isArray(result) ? result : [result],
      count: Array.isArray(result) ? result.length : 1,
      html_stripped: wasHtml,
      clean_length: cleanContent.length,
    })

  } catch (error: any) {
    console.error('[DocIntel] POST error:', error)
    return NextResponse.json(
      { error: 'Extraction failed', details: error.message, stack: error.stack?.substring(0, 300) },
      { status: 500 }
    )
  }
}
