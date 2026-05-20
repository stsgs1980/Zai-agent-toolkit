/**
 * ai-bridge.ts — Shared Z.ai API communication layer
 *
 * Extracted from doc-intelligence and experience/extract routes
 * to eliminate ~200 lines of code duplication.
 *
 * Provides:
 * - JWT conversion (id.secret → HS256 JWT)
 * - AI config loading (env vars → .z-ai-config fallback)
 * - Node.js HTTP/HTTPS POST (bypasses Web Fetch API ByteString validation)
 * - AI response JSON parsing
 * - Reusable callAI() + healthCheck()
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { createHmac } from 'crypto'
import https from 'node:https'
import http from 'node:http'

// ── Types ──────────────────────────────────────────────────────

export interface AIConfig {
  baseUrl: string
  apiKey: string     // JWT-converted, ASCII-safe
  model: string
  chatId?: string
  userId?: string
  token?: string
  source: string
}

export interface AICallOptions {
  systemPrompt: string
  userContent: string
  maxContent?: number   // truncate user content to this length (default: 6000)
  temperature?: number  // default: 0.2
  logTag?: string       // prefix for console.log messages
}

// ── Z.ai API Key → JWT conversion ────────────────────────────

function toBase64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function generateZaiJWT(apiKey: string): string {
  const parts = apiKey.split('.')
  if (parts.length !== 2) return apiKey  // already a JWT or bearer token

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

// ── String Sanitizers ────────────────────────────────────────

/** Strip BOM, zero-width chars, and non-printable garbage */
export function sanitize(str: string): string {
  return str
    .replace(/[\uFEFF\u200B\u200C\u200D\u00AD]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
}

/** Force ASCII-only for HTTP header values (node:http rejects non-latin1) */
export function asciiOnly(str: string): string {
  return str.replace(/[^\x20-\x7E]/g, '')
}

// ── AI Config Loader ─────────────────────────────────────────

export function loadAIConfig(logTag = 'AIBridge'): AIConfig {
  const envBaseUrl = sanitize(process.env.ZAI_BASE_URL || '')
  const envApiKey = sanitize(process.env.ZAI_API_KEY || '')
  if (envBaseUrl && envApiKey) {
    const jwtKey = generateZaiJWT(envApiKey)
    const converted = jwtKey !== envApiKey

    // Debug: detect non-ASCII chars in auth header
    const authValue = `Bearer ${jwtKey}`
    const badChars = [...authValue].map((c, i) =>
      c.charCodeAt(0) > 127 ? ` [${i}]='${c}'(0x${c.charCodeAt(0).toString(16)})` : ''
    ).filter(Boolean).join('')
    if (badChars) {
      console.error(`[${logTag}] WARNING: non-ASCII in Authorization:${badChars}`)
    }
    console.log(`[${logTag}] Using env vars${converted ? ' (id.secret → JWT)' : ''}, auth header length=${authValue.length}`)

    return {
      baseUrl: envBaseUrl,
      apiKey: asciiOnly(jwtKey),
      model: sanitize(process.env.ZAI_MODEL || 'glm-4.5'),
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
          console.log(`[${logTag}] Using .z-ai-config from ${configPath}`)
          return { ...cfg, source: `file:${configPath}` }
        }
      }
    } catch { /* skip */ }
  }

  throw new Error(
    'No AI config found. Create .env.local with ZAI_BASE_URL and ZAI_API_KEY.'
  )
}

// ── Node.js HTTPS/HTTP POST ──────────────────────────────────
// Bypasses Web Fetch API ByteString validation issues

export function nodePost(
  urlStr: string,
  headerObj: Record<string, string>,
  bodyObj: any,
  logTag = 'AIBridge',
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(bodyObj)
    const bodyBuf = Buffer.from(bodyStr, 'utf-8')

    // Sanitize ALL header values to pure ASCII
    const safeHeaders: Record<string, string | number> = {}
    for (const [k, v] of Object.entries(headerObj)) {
      const clean = asciiOnly(v)
      if (clean !== v) {
        console.warn(`[${logTag}] Header '${k}' had non-ASCII chars — sanitized`)
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

// ── AI Response JSON Parser ──────────────────────────────────

export function parseAIResponse(raw: string, logTag = 'AIBridge'): any {
  console.log(`[${logTag}] Raw AI response (${raw.length} chars): ${raw.substring(0, 300)}...`)
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```json?\s*/g, '')
    .replace(/```/g, '')
  try { return JSON.parse(cleaned.trim()) } catch { /* continue */ }
  const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/)
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]) }
    catch (e: any) { throw new Error(`JSON parse error: ${e.message}`) }
  }
  throw new Error('No JSON found in AI response. Raw: ' + raw.substring(0, 200))
}

// ── Reusable: Call AI ────────────────────────────────────────

export async function callAI(opts: AICallOptions, config: AIConfig): Promise<any> {
  const tag = opts.logTag || 'AIBridge'
  const maxLen = opts.maxContent || 6000
  const temp = opts.temperature ?? 0.2
  const truncated = opts.userContent.substring(0, maxLen)

  console.log(`[${tag}] callAI() — ${truncated.length} chars, baseUrl: ${config.baseUrl}`)

  const url = `${config.baseUrl}/chat/completions`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  }

  const bodyObj = {
    model: config.model,
    messages: [
      { role: 'system', content: opts.systemPrompt },
      { role: 'user', content: truncated },
    ],
    temperature: temp,
    thinking: { type: 'disabled' },
  }

  console.log(`[${tag}] POST ${url}`)

  const { status, body } = await nodePost(url, headers, bodyObj, tag)

  if (status !== 200) {
    console.error(`[${tag}] API error ${status}: ${body.substring(0, 300)}`)
    throw new Error(`API ${status}: ${body.substring(0, 200)}`)
  }

  const completion = JSON.parse(body)
  console.log(`[${tag}] AI completion received, model: ${completion?.model || 'unknown'}`)

  const raw = completion.choices?.[0]?.message?.content || ''
  if (!raw.trim()) throw new Error('AI returned empty response')

  return parseAIResponse(raw, tag)
}

// ── Reusable: Health Check ───────────────────────────────────

export async function healthCheck(logTag = 'AIBridge'): Promise<Record<string, any>> {
  const health: Record<string, any> = {
    status: 'checking',
    config: 'unknown',
    ai_call: 'unknown',
    timestamp: new Date().toISOString(),
  }

  try {
    const config = loadAIConfig(logTag)
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

    const { status, body } = await nodePost(url, headers, bodyObj, logTag)

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

  return health
}
