import { NextRequest, NextResponse } from 'next/server'
import {
  loadAIConfig,
  callAI,
  healthCheck,
} from '@/lib/ai-bridge'

// FORCE Node.js runtime
export const runtime = 'nodejs'

const LOG_TAG = 'ExpExtract'

// ── Experience Extraction Prompt ────────────────────────────

const EXPERIENCE_SYSTEM_PROMPT = `You are an expert at extracting actionable lessons from development sessions. Analyze the text and extract individual EXPERIENCE entries.

Each experience = ONE specific lesson, not a general summary. Split complex sessions into multiple entries.

For each entry provide:
1) title - concise title (max 80 chars)
2) good - WHAT worked (facts only, no "because", max 1024 chars)
3) bad - WHAT failed (facts only, no "because", max 1024 chars)
4) why - Root cause ONLY (no symptoms, max 1024 chars)
5) verdict - one of: "mostly_succeeded", "mostly_failed", "mixed_with_pivots", "inconclusive"
6) tech - comma-separated technologies involved

RULES:
- good/bad = WHAT happened (facts). why = WHY it happened (root cause). NO duplication.
- If why just restates bad, dig deeper. Ask "why did THAT happen?"
- Reject entries where any field is empty, "?" or "не знаю"
- One lesson per entry. If a session had 3 distinct problems, create 3 entries.

Return ONLY valid JSON array, no markdown fences:
[{"title":"...","good":"...","bad":"...","why":"...","verdict":"...","tech":"..."}]
Max 10 entries.`

const MAX_CONTENT = 12000

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
    const { content } = body as { content: string }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    console.log(`[${LOG_TAG}] Extracting experiences from ${content.length} chars`)

    const parsed = await callAI({
      systemPrompt: EXPERIENCE_SYSTEM_PROMPT,
      userContent: content,
      maxContent: MAX_CONTENT,
      temperature: 0.2,
      logTag: LOG_TAG,
    }, config)

    if (!Array.isArray(parsed)) {
      throw new Error(`Expected JSON array, got ${typeof parsed}`)
    }

    return NextResponse.json({
      entries: parsed,
      count: parsed.length,
      source_length: content.length,
    })

  } catch (error: any) {
    console.error(`[${LOG_TAG}] POST error:`, error)
    return NextResponse.json(
      { error: 'Experience extraction failed', details: error.message, stack: error.stack?.substring(0, 300) },
      { status: 500 }
    )
  }
}
