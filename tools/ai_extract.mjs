#!/usr/bin/env node
/**
 * AI Extract Bridge for Document Intelligence
 * Uses z-ai-web-dev-sdk for LLM-powered extraction
 *
 * Usage:
 *   echo "content..." | node ai_extract.mjs terms
 *   node ai_extract.mjs terms < doc.md
 *   node ai_extract.mjs instructions < doc.md
 *   node ai_extract.mjs analyze < doc.md
 *   node ai_extract.mjs commands < doc.md
 *
 * Outputs JSON to stdout.
 */

import ZAI from 'z-ai-web-dev-sdk';
import { readFileSync } from 'fs';

// ── Prompt Templates (inspired by Wiki-Codex-v2) ──────────────

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
Max 20 commands. Include shell commands, npm/pip installs, git commands, etc.`,

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
};

// ── Main ──────────────────────────────────────────────────────

async function main() {
  const mode = process.argv[2];

  if (!mode || !PROMPTS[mode]) {
    console.error('Usage: node ai_extract.mjs <terms|instructions|commands|analyze>');
    console.error('  Reads content from stdin, outputs JSON to stdout');
    process.exit(1);
  }

  // Read content from stdin
  let content = '';
  try {
    content = readFileSync(0, 'utf-8');
  } catch {
    console.error('ERROR: No input on stdin');
    process.exit(1);
  }

  if (!content.trim()) {
    console.error('ERROR: Empty content');
    process.exit(1);
  }

  const prompt = PROMPTS[mode];
  const truncated = content.substring(0, prompt.maxContent);

  try {
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: truncated },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content || '';

    // Extract JSON from response
    let parsed;
    try {
      // Strip markdown code fences if present
      const cleaned = raw.replace(/```json?\s*/g, '').replace(/```/g, '');
      const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      // Return raw response as fallback
      console.log(JSON.stringify({ error: 'parse_failed', raw, items: [] }));
      process.exit(0);
    }

    // Normalize output
    if (Array.isArray(parsed)) {
      console.log(JSON.stringify({ items: parsed, count: parsed.length }));
    } else {
      console.log(JSON.stringify({ ...parsed, count: 1 }));
    }

  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}

main();
