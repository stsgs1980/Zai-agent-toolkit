import { NextResponse } from 'next/server'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'

interface SkillMeta {
  name: string
  id: string
  version: string
  description: string
  trigger: string
  folder: string
  commands: { phrase: string; action: string }[]
}

const HOME = process.env.USERPROFILE || process.env.HOME || ''

/** Search for skills directory — same dual-path logic as bridge.ts */
async function findSkillsDir(): Promise<string | null> {
  const candidates = [
    join(HOME, '.zcode', 'Zai-agent-toolkit', 'skills'),
    join(HOME, '.zcode', 'tools', '..', 'Zai-agent-toolkit', 'skills'),
  ]
  for (const dir of candidates) {
    try {
      await readdir(dir)
      return dir
    } catch { /* next */ }
  }
  return null
}

/** Parse YAML-like frontmatter from SKILL.md */
function parseFrontmatter(raw: string): Record<string, string> {
  const fm: Record<string, string> = {}
  const lines = raw.split('\n')
  let inFm = false
  for (const line of lines) {
    if (line.trim() === '---') {
      if (inFm) break
      inFm = true
      continue
    }
    if (!inFm) continue
    const idx = line.indexOf(':')
    if (idx > 0) {
      const key = line.slice(0, idx).trim()
      let val = line.slice(idx + 1).trim()
      // Remove surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      fm[key] = val
    }
  }
  return fm
}

/** Parse Hot Commands table from SKILL.md body */
function parseHotCommands(raw: string): { phrase: string; action: string }[] {
  const cmds: { phrase: string; action: string }[] = []
  const lines = raw.split('\n')
  let inTable = false
  for (const line of lines) {
    if (line.includes('## Hot Commands') || line.includes('## Hot commands')) {
      inTable = true
      continue
    }
    if (inTable && line.startsWith('## ')) break
    if (!inTable) continue
    // Parse markdown table rows: | phrase | action |
    const cells = line.split('|').map(c => c.trim()).filter(Boolean)
    if (cells.length >= 2 && cells[0] !== 'Phrase' && cells[0] !== '---' && !cells[0].startsWith('-')) {
      cmds.push({ phrase: cells[0], action: cells.slice(1).join(' | ') })
    }
  }
  return cmds
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = (searchParams.get('q') || '').toLowerCase()

    const skillsDir = await findSkillsDir()
    if (!skillsDir) {
      return NextResponse.json({ error: 'Skills directory not found', skills: [] }, { status: 404 })
    }

    const entries = await readdir(skillsDir)
    const skills: SkillMeta[] = []

    for (const entry of entries) {
      const skillPath = join(skillsDir, entry, 'SKILL.md')
      try {
        const raw = await readFile(skillPath, 'utf-8')
        const fm = parseFrontmatter(raw)
        const commands = parseHotCommands(raw)

        const skill: SkillMeta = {
          name: fm.name || entry,
          id: fm.id || '',
          version: fm.version || '',
          description: fm.description || '',
          trigger: fm.trigger || '',
          folder: entry,
          commands,
        }

        // Filter by search query
        if (query) {
          const haystack = `${skill.name} ${skill.id} ${skill.description} ${skill.trigger} ${skill.commands.map(c => c.phrase).join(' ')}`.toLowerCase()
          if (!haystack.includes(query)) continue
        }

        skills.push(skill)
      } catch {
        // Skip unreadable files
      }
    }

    // Sort: skills with IDs first, then alphabetical
    skills.sort((a, b) => {
      if (a.id && !b.id) return -1
      if (!a.id && b.id) return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ skills, total: skills.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message, skills: [] }, { status: 500 })
  }
}
