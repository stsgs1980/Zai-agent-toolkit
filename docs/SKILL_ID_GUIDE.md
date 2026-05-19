# Guide: Skill ID System for Z.ai Agent Toolkit

## What is this?

The Skill ID System helps you:
- Distinguish your skills from ZCode Desktop built-in skills
- Track and discuss skills by short ID (e.g., "use ZAI-MEM-001")
- Keep your toolkit organized

---

## ID Format

```text
ZAI-<DOMAIN>-<NUMBER>
```

| Part | Description |
|------|-------------|
| `ZAI` | Prefix for all toolkit skills |
| `DOMAIN` | Skill category (MEM, FS, STS, etc.) |
| `NUMBER` | Sequential number (001, 002, etc.) |

---

## Domains

| Domain | For Skills About |
|--------|------------------|
| `MEM` | Memory operations (store, query, delete, export) |
| `FS` | File system (folder indexing, scanning) |
| `SESSION` | Session management (logging, context, handoff) |
| `DEV` | Development (project clone, commit, schema design) |
| `ARCH` | Architecture diagrams, C4, Mermaid |
| `QA` | Testing, validation |
| `REQ` | Requirements, PRD |
| `META` | Toolkit itself (ID system, skill creator) |
| `STS` | YOUR custom skills (your signature) |
| `GIT` | (reserved) Git operations |
| `SDK` | (reserved) API integration |
| `SEC` | (reserved) Security |
| `DOC` | (reserved) Document generation |
| `HEALTH` | (reserved) Monitoring, retry |

---

## Creating Your Own Skill

### Option 1: Ask AI Agent

Just say:
```text
Create a skill for <your purpose>
```

The AI agent will:
1. Use `skill-creator` (ZAI-META-002)
2. Assign a `ZAI-STS-XXX` ID automatically
3. Update the registry

### Option 2: Manual Creation

1. Create folder: `skills/your-skill-name_sts/`
2. Create `SKILL.md`:

```markdown
---
name: your-skill-name_sts
description: What this skill does and when to use it
id: ZAI-STS-008
version: 1.0
trigger: keyword1, keyword2
---

# Skill: Your Skill Name v1.0

> ID: ZAI-STS-008
> Version: 1.0
> Last Updated: 2026-05

<Your skill instructions here>
```

3. Update registry in `skills/skill-id-system/SKILL.md`:
   - Find section "5.9. User-Created (STS)"
   - Add your skill

---

## Current Registry

### Memory (MEM)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-MEM-001 | memory-store | Store memory records |
| ZAI-MEM-002 | memory-query | Query memory records |
| ZAI-MEM-003 | memory-delete | Delete memory records |
| ZAI-MEM-004 | memory-export | Export memory records |

### File System (FS)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-FS-001 | folder-indexer | Index and scan folders |

### Session (SESSION)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-SESSION-001 | session-log | Session logging |
| ZAI-SESSION-001 | context-consolidation | Consolidate context |

### Development (DEV)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-DEV-001 | project-clone | Smart project cloning |
| ZAI-DEV-002 | commit-work | Commit workflow |
| ZAI-DEV-001 | database-schema-designer | DB schema design |

### Architecture (ARCH)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-ARCH-001 | mermaid-diagrams | Mermaid diagrams |

### Quality Assurance (QA)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-QA-001 | qa-test-planner | Test planning |

### Requirements (REQ)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-REQ-001 | requirements-clarity | Requirements analysis |

### Meta (META)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-META-001 | skill-id-system | ID system and registry |
| ZAI-META-002 | skill-creator | Create new skills |

### Your Skills (STS)

**IMPORTANT:** All your skills use `STS` domain and `_sts` suffix in folder name.

| ID | Skill | Created |
|----|-------|---------|
| ZAI-STS-001 | prompt-engineering_sts | 2026-05 |
| ZAI-STS-002 | sync-toolkit_sts | 2026-05 |
| ZAI-STS-003 | performance-code-generator_sts | 2026-05 |
| ZAI-STS-004 | frontend-styling-expert_sts | 2026-05 |
| ZAI-STS-005 | phi-layout_sts | 2026-05 |
| ZAI-STS-006 | zai-ui-composer_sts | 2026-05 |
| ZAI-STS-007 | workflow-discipline_sts | 2026-05 |

### Naming Convention

| Type | Format | Example |
|------|--------|---------|
| Folder name | `<skill-name>_sts` | `prompt-engineering_sts` |
| ID | `ZAI-STS-XXX` | `ZAI-STS-001` |

**Why STS?** Your signature/initials - instantly identifies your skills.

---

## Quick Sync Commands

| You Say | What Happens |
|---------|--------------|
| "sync toolkit" | Push to GitHub + instruction for Windows |
| "obnovit" | Same as above |
| "sync" | Same as above |

**On Windows:** Run `sync-toolkit` in PowerShell

---

## Quick Reference

### How to use a skill by ID

Just tell the AI:
```text
Use ZAI-MEM-001 for storing memory records
```

### How to find a skill

Check `skills/skill-id-system/SKILL.md` for full registry.

### ZCode Desktop vs Toolkit

| Source | Prefix | Example |
|--------|--------|---------|
| ZCode Desktop built-in | None | `background-process-manager` |
| Z.ai Agent Toolkit | `ZAI-` | `ZAI-MEM-001` |

---

## Where Skills Are Stored

### Important: Two Locations

| Environment | Path |
|-------------|------|
| Z.ai server | `/home/z/my-project/Zai-agent-toolkit/skills/` |
| Your Windows | `$env:USERPROFILE\.zcode\Zai-agent-toolkit\skills\` |

### Synchronization

Skills created on Z.ai server are NOT automatically synced to your Windows.

**Workflow:**
```bash
Z.ai server:    git push  -->  GitHub  -->  git pull / update-toolkit.ps1  :Your Windows
```

### Toolkit vs Project Skills

| Type | Location | Scope |
|------|----------|-------|
| Toolkit | `Zai-agent-toolkit/skills/` | All projects (via symlink) |
| Project | `<project>/skills/` | Only this project |

**Use toolkit for:** Reusable skills you want everywhere
**Use project for:** Project-specific skills

---

## Files

| File | Purpose |
|------|---------|
| `skills/skill-id-system/SKILL.md` | ID registry and system docs |
| `skills/skill-creator/SKILL.md` | Skill creation with auto-ID |
| `docs/skill-id-registry.md` | Detailed registry with compatibility |
| `docs/SKILL_ID_GUIDE.md` | This guide for you |

---

Built with: Z.ai Agent Toolkit
