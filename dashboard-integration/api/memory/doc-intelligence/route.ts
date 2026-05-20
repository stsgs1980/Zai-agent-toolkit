import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { createHmac } from 'crypto'

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

// ── Z.ai API Key → JWT conversion ────────────────────────────
// Z.ai keys come in format "id.secret" and must be converted to JWT

function generateZaiJWT(apiKey: string): string {
  const parts = apiKey.split('.')
  if (parts.length !== 2) {
    // Already a JWT or other token format — use as-is
    return apiKey
  }

  const [id, secret] = parts
  const now = Date.now()

  // JWT header
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', sign_type: 'SIGN' })).toString('base64url')
  // JWT payload — exp = now + 1 hour
  const payload = Buffer.from(JSON.stringify({
    api_key: id,
    exp: now + 3600 * 1000,
    timestamp: now,
  })).toString('base64url')

  // Signature
  const signature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url')

  return `${header}.${payload}.${signature}`
}

// ── AI Config: Multi-source (env > .z-ai-config > fallback) ──

interface AIConfig {
  baseUrl: string
  apiKey: string
  chatId?: string
  userId?: string
  token?: string
  source: string
}

function loadAIConfig(): AIConfig {
  // 1. Environment variables (highest priority — works on any machine)
  const envBaseUrl = process.env.ZAI_BASE_URL
  const envApiKey = process.env.ZAI_API_KEY
  if (envBaseUrl && envApiKey) {
    // Auto-convert "id.secret" format to JWT
    const jwtKey = generateZaiJWT(envApiKey)
    const converted = jwtKey !== envApiKey
    console.log(`[DocIntel] Using env vars ZAI_BASE_URL + ZAI_API_KEY${converted ? ' (converted id.secret → JWT)' : ''}`)
    return {
      baseUrl: envBaseUrl,
      apiKey: jwtKey,
      chatId: process.env.ZAI_CHAT_ID,
      userId: process.env.ZAI_USER_ID,
      token: process.env.ZAI_TOKEN,
      source: 'env',
    }
  }

  // 2. .z-ai-config file (same as SDK uses)
  const configPaths = [
    join(process.cwd(), '.z-ai-config'),
    join(homedir(), '.z-ai-config'),
    '/etc/.z-ai-config',
  ]

  for (const configPath of configPaths) {
    try {
      if (existsSync(configPath)) {
        const raw = readFileSync(configPath, 'utf8')
        const cfg = JSON.parse(raw)
        if (cfg.baseUrl && cfg.apiKey) {
          console.log(`[DocIntel] Using .z-ai-config from ${configPath}`)
          return { ...cfg, source: `file:${configPath}` }
        }
      }
    } catch {
      // Skip to next path
    }
  }

  // 3. No config found — return error marker
  throw new Error(
    'No AI config found. Create .env.local with ZAI_BASE_URL and ZAI_API_KEY, ' +
    'or .z-ai-config file. Get API key at https://z.ai/manage-apikey/apikey-list'
  )
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

// ── Helper: Call AI via direct fetch (no SDK dependency) ────

async function callAI(mode: ExtractMode, content: string, config: AIConfig): Promise<any> {
  const prompt = PROMPTS[mode]
  const truncated = content.substring(0, prompt.maxContent)

  console.log(`[DocIntel] callAI('${mode}') — content ${truncated.length} chars, baseUrl: ${config.baseUrl}`)

  const url = `${config.baseUrl}/chat/completions`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
    'X-Z-AI-From': 'Z',
  }
  if (config.chatId) headers['X-Chat-Id'] = config.chatId
  if (config.userId) headers['X-User-Id'] = config.userId
  if (config.token) headers['X-Token'] = config.token

  const body = {
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: truncated },
    ],
    temperature: 0.2,
    thinking: { type: 'disabled' },
  }

  console.log(`[DocIntel] POST ${url}`)

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`[DocIntel] API error ${response.status}: ${errorBody.substring(0, 300)}`)
    throw new Error(`API ${response.status}: ${errorBody.substring(0, 200)}`)
  }

  const completion = await response.json()
  console.log(`[DocIntel] AI completion received, model: ${completion?.model || 'unknown'}`)

  const raw = completion.choices?.[0]?.message?.content || ''
  if (!raw.trim()) {
    throw new Error('AI returned empty response')
  }

  return parseAIResponse(raw)
}

// ── GET: Health Check ───────────────────────────────────────

export async function GET() {
  const health: Record<string, any> = {
    status: 'checking',
    config: 'unknown',
    ai_call: 'unknown',
    timestamp: new Date().toISOString(),
  }

  try {
    const config = loadAIConfig()
    health.config = config.source
    health.baseUrl = config.baseUrl

    // Test a simple AI call
    const url = `${config.baseUrl}/chat/completions`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'X-Z-AI-From': 'Z',
    }
    if (config.chatId) headers['X-Chat-Id'] = config.chatId
    if (config.userId) headers['X-User-Id'] = config.userId
    if (config.token) headers['X-Token'] = config.token

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'Return exactly: [{"status":"ok"}]' },
          { role: 'user', content: 'test' },
        ],
        temperature: 0,
        thinking: { type: 'disabled' },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      health.ai_call = `API ${response.status}: ${errText.substring(0, 100)}`
      health.status = 'unhealthy'
    } else {
      const completion = await response.json()
      const raw = completion.choices?.[0]?.message?.content || ''
      health.ai_call = raw.includes('ok') ? 'working' : `unexpected: ${raw.substring(0, 100)}`
      health.model = completion?.model || 'unknown'
      health.status = health.ai_call === 'working' ? 'healthy' : 'degraded'
    }
  } catch (e: any) {
    health.status = 'unhealthy'
    health.error = e.message
  }

  const statusCode = health.status === 'healthy' ? 200 : 503
  return NextResponse.json(health, { status: statusCode })
}

// ── POST Handler ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Load AI config (env vars or .z-ai-config)
    const config = loadAIConfig()

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

    // If mode is 'all', run extractions SEQUENTIALLY
    if (mode === 'all') {
      const errors: Record<string, string> = {}
      let terms: any[] = []
      let instructions: any[] = []
      let commands: any[] = []
      let analysis: any = {}

      try {
        terms = await callAI('terms', cleanContent, config)
        if (!Array.isArray(terms)) terms = []
        console.log(`[DocIntel] terms: ${terms.length} extracted`)
      } catch (e: any) {
        errors.terms = e.message
        console.error(`[DocIntel] terms error: ${e.message}`)
      }

      try {
        instructions = await callAI('instructions', cleanContent, config)
        if (!Array.isArray(instructions)) instructions = []
        console.log(`[DocIntel] instructions: ${instructions.length} extracted`)
      } catch (e: any) {
        errors.instructions = e.message
        console.error(`[DocIntel] instructions error: ${e.message}`)
      }

      try {
        commands = await callAI('commands', cleanContent, config)
        if (!Array.isArray(commands)) commands = []
        console.log(`[DocIntel] commands: ${commands.length} extracted`)
      } catch (e: any) {
        errors.commands = e.message
        console.error(`[DocIntel] commands error: ${e.message}`)
      }

      try {
        analysis = await callAI('analyze', cleanContent, config)
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

    const result = await callAI(mode, cleanContent, config)

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
