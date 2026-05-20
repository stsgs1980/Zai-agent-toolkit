import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// ── HTML→Text Stripper ──────────────────────────────────────

function stripHtml(html: string): string {
  // Remove <style> and <script> blocks entirely
  let text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  // Convert <br>, <p>, <div>, <li>, <tr>, <h1-6> to newlines
  text = text.replace(/<\/(p|div|li|tr|h[1-6]|br|blockquote|pre|section|article|header|footer|nav|aside)>/gi, '\n')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '')
  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  text = text.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
  // Collapse 3+ blank lines into 2
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

function preprocessContent(raw: string): string {
  // Auto-detect HTML: if content starts with < or contains <html>/<body>/<div> tags
  const looksLikeHtml = /^\s*</.test(raw) || /<(html|body|div|p|span|head|table)\b/i.test(raw.substring(0, 500))
  if (looksLikeHtml) {
    console.log('[doc-intelligence] Detected HTML input, stripping tags')
    return stripHtml(raw)
  }
  return raw
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

Return ONLY valid JSON array, no markdown:
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

Return ONLY valid JSON array, no markdown:
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

Return ONLY valid JSON array, no markdown:
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

Return ONLY valid JSON, no markdown:
{"summary":"...","suggested_tags":["..."],"category":"...","difficulty":"..."}`,
    maxContent: 4000,
  },
}

type ExtractMode = keyof typeof PROMPTS

// ── Helper: Parse AI JSON Response ──────────────────────────

function parseAIResponse(raw: string): any {
  const cleaned = raw.replace(/```json?\s*/g, '').replace(/```/g, '')
  const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }
  throw new Error('No JSON found in AI response')
}

// ── Helper: Call AI ─────────────────────────────────────────

async function callAI(mode: ExtractMode, content: string): Promise<any> {
  const prompt = PROMPTS[mode]
  const truncated = content.substring(0, prompt.maxContent)

  const zai = await ZAI.create()

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: truncated },
    ],
    temperature: 0.2,
  })

  const raw = completion.choices[0]?.message?.content || ''
  return parseAIResponse(raw)
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

    // Auto-strip HTML if detected
    const cleanContent = preprocessContent(content)

    // If mode is 'all', run all extractions in parallel
    if (mode === 'all') {
      const [terms, instructions, commands, analysis] = await Promise.all([
        callAI('terms', cleanContent).catch(() => []),
        callAI('instructions', cleanContent).catch(() => []),
        callAI('commands', cleanContent).catch(() => []),
        callAI('analyze', cleanContent).catch(() => ({})),
      ])

      return NextResponse.json({
        terms: Array.isArray(terms) ? terms : [],
        instructions: Array.isArray(instructions) ? instructions : [],
        commands: Array.isArray(commands) ? commands : [],
        analysis: analysis || {},
        count: {
          terms: Array.isArray(terms) ? terms.length : 0,
          instructions: Array.isArray(instructions) ? instructions.length : 0,
          commands: Array.isArray(commands) ? commands.length : 0,
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
    })

  } catch (error: any) {
    console.error('Doc Intelligence error:', error)
    return NextResponse.json(
      { error: 'Extraction failed', details: error.message },
      { status: 500 }
    )
  }
}
