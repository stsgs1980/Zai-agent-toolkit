import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { createHmac } from 'crypto'
import https from 'node:https'
import http from 'node:http'

// FORCE Node.js runtime
export const runtime = 'nodejs'

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

// ── Z.ai API Key → JWT conversion ────────────────────────────

function toBase64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function generateZaiJWT(apiKey: string): string {
  const parts = apiKey.split('.')
  if (parts.length !== 2) return apiKey

  const [id, secret] = parts
  const now = Date.now()

  const header = toBase64Url(Buffer.from(JSON.stringify({ alg: 'HS256', sign_type: 'SIGN' })))
  const payload = toBase64Url(Buffer.from(JSON.stringify({
    api_key: id,
    exp: Math.floor(now / 1000) + 3600,
    timestamp: now,
  })))
  const signature = toBase64Url(
    createHmac('sha256', secret).update(`${header}.${payload}`).digest()
  )

  return `${header}.${payload}.${signature}`
}

// ── AI Config ────────────────────────────────────────────────

interface AIConfig {
  baseUrl: string
  apiKey: string
  model: string
  chatId?: string
  userId?: string
  token?: string
  source: string
}

// Strip BOM, zero-width chars, and any non-printable garbage
function sanitize(str: string): string {
  return str
    .replace(/[\uFEFF\u200B\u200C\u200D\u00AD]/g, '') // BOM + zero-width chars
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')   // control chars except tab/newline
    .trim()
}

// Force ASCII-only for HTTP header values (node:http rejects non-latin1)
function asciiOnly(str: string): string {
  return str.replace(/[^\x20-\x7E]/g, '')
}

function loadAIConfig(): AIConfig {
  const envBaseUrl = sanitize(process.env.ZAI_BASE_URL || '')
  const envApiKey = sanitize(process.env.ZAI_API_KEY || '')
  if (envBaseUrl && envApiKey) {
    const jwtKey = generateZaiJWT(envApiKey)
    const converted = jwtKey !== envApiKey
    // Debug: dump JWT char codes to catch any remaining invalid chars
    const authValue = `Bearer ${jwtKey}`
    const badChars = [...authValue].map((c, i) => c.charCodeAt(0) > 127 ? ` [${i}]='${c}'(0x${c.charCodeAt(0).toString(16)})` : '').filter(Boolean).join('')
    if (badChars) {
      console.error(`[DocIntel] WARNING: non-ASCII in Authorization:${badChars}`)
    }
    console.log(`[DocIntel] Using env vars${converted ? ' (id.secret → JWT)' : ''}, auth header length=${authValue.length}`)
    console.log(`[DocIntel] JWT preview: ${jwtKey.substring(0, 20)}...${jwtKey.substring(jwtKey.length - 10)}`)
    return {
      baseUrl: envBaseUrl,
      apiKey: asciiOnly(jwtKey),
      model: sanitize(process.env.ZAI_MODEL || 'glm-4.5-flash'),
      chatId: sanitize(process.env.ZAI_CHAT_ID || ''),
      userId: sanitize(process.env.ZAI_USER_ID || ''),
      token: sanitize(process.env.ZAI_TOKEN || ''),
      source: 'env',
    }
  }

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
    } catch { /* skip */ }
  }

  throw new Error(
    'No AI config found. Create .env.local with ZAI_BASE_URL and ZAI_API_KEY.'
  )
}

// ── Node.js HTTPS/HTTP request (bypasses Web Fetch API ByteString validation) ──

function nodePost(urlStr: string, headerObj: Record<string, string>, bodyObj: any): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    // Build body ONCE, compute Content-Length from it
    const bodyStr = JSON.stringify(bodyObj)
    const bodyBuf = Buffer.from(bodyStr, 'utf-8')

    // Sanitize ALL header values to pure ASCII
    const safeHeaders: Record<string, string | number> = {}
    for (const [k, v] of Object.entries(headerObj)) {
      const clean = asciiOnly(v)
      if (clean !== v) {
        console.warn(`[DocIntel] Header '${k}' had non-ASCII chars — sanitized`)
      }
      safeHeaders[k] = clean
    }
    safeHeaders['Content-Length'] = bodyBuf.length

    const url = new URL(urlStr)
    const isHttps = url.protocol === 'https:'
    const lib = isHttps ? https : http

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: safeHeaders,
    }

    const req = lib.request(options, (res) => {
      let data = ''
      res.on('data', (chunk: Buffer) => { data += chunk.toString() })
      res.on('end', () => { resolve({ status: res.statusCode || 0, body: data }) })
    })

    req.on('error', reject)
    req.write(bodyBuf)
    req.end()
  })
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
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```json?\s*/g, '').replace(/```/g, '')
  try { return JSON.parse(cleaned.trim()) } catch { /* continue */ }
  const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/)
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]) }
    catch (e: any) { throw new Error(`JSON parse error: ${e.message}`) }
  }
  throw new Error('No JSON found in AI response. Raw: ' + raw.substring(0, 200))
}

// ── Helper: Call AI via Node.js http/https (NO Web Fetch API) ──

async function callAI(mode: ExtractMode, content: string, config: AIConfig): Promise<any> {
  const prompt = PROMPTS[mode]
  const truncated = content.substring(0, prompt.maxContent)

  console.log(`[DocIntel] callAI('${mode}') — ${truncated.length} chars, baseUrl: ${config.baseUrl}`)

  const url = `${config.baseUrl}/chat/completions`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  }

  const bodyObj = {
    model: config.model,
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: truncated },
    ],
    temperature: 0.2,
  }

  console.log(`[DocIntel] POST ${url}`)

  const { status, body } = await nodePost(url, headers, bodyObj)

  if (status !== 200) {
    console.error(`[DocIntel] API error ${status}: ${body.substring(0, 300)}`)
    throw new Error(`API ${status}: ${body.substring(0, 200)}`)
  }

  const completion = JSON.parse(body)
  console.log(`[DocIntel] AI completion received, model: ${completion?.model || 'unknown'}`)

  const raw = completion.choices?.[0]?.message?.content || ''
  if (!raw.trim()) throw new Error('AI returned empty response')

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

    const url = `${config.baseUrl}/chat/completions`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    }

    const bodyObj = {
      model: config.model,
      messages: [
        { role: 'system', content: 'Return exactly: [{"status":"ok"}]' },
        { role: 'user', content: 'test' },
      ],
      temperature: 0,
    }

    const { status, body } = await nodePost(url, headers, bodyObj)

    if (status !== 200) {
      health.ai_call = `API ${status}: ${body.substring(0, 200)}`
      health.status = 'unhealthy'
    } else {
      try {
        const completion = JSON.parse(body)
        const raw = completion.choices?.[0]?.message?.content || ''
        health.ai_call = raw.includes('ok') ? 'working' : `unexpected: ${raw.substring(0, 150)}`
        health.model = completion?.model || 'unknown'
        health.raw_response = body.substring(0, 300)
        health.status = health.ai_call === 'working' ? 'healthy' : 'degraded'
      } catch (parseErr: any) {
        health.ai_call = `Parse error: ${body.substring(0, 200)}`
        health.status = 'unhealthy'
      }
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
    const config = loadAIConfig()

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
      console.log(`[DocIntel] HTML detected, stripped ${content.length} → ${cleanContent.length} chars`)
    } else {
      console.log(`[DocIntel] Plain text, ${content.length} chars`)
    }

    if (mode === 'all') {
      const errors: Record<string, string> = {}
      let terms: any[] = []
      let instructions: any[] = []
      let commands: any[] = []
      let analysis: any = {}

      try { terms = await callAI('terms', cleanContent, config); if (!Array.isArray(terms)) terms = [] }
      catch (e: any) { errors.terms = e.message }

      try { instructions = await callAI('instructions', cleanContent, config); if (!Array.isArray(instructions)) instructions = [] }
      catch (e: any) { errors.instructions = e.message }

      try { commands = await callAI('commands', cleanContent, config); if (!Array.isArray(commands)) commands = [] }
      catch (e: any) { errors.commands = e.message }

      try { analysis = await callAI('analyze', cleanContent, config); if (!analysis || typeof analysis !== 'object') analysis = {} }
      catch (e: any) { errors.analyze = e.message }

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
