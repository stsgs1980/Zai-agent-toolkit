# Guide: Skill ID System for Z.ai Agent Toolkit

## What is this?

The Skill ID System helps you:
- Distinguish your skills from ZCode Desktop built-in skills
- Track and discuss skills by short ID (e.g., "use ZAI-GIT-001")
- Keep your toolkit organized

---

## ID Format

```text
ZAI-<DOMAIN>-<NUMBER>
```

| Part | Description |
|------|-------------|
| `ZAI` | Prefix for all toolkit skills |
| `DOMAIN` | Skill category (GIT, SDK, USER, etc.) |
| `NUMBER` | Sequential number (001, 002, etc.) |

---

## Domains

| Domain | For Skills About |
|--------|------------------|
| `GIT` | Git operations (clone, commit, checkpoint) |
| `SDK` | API integration, z-ai-web-dev-sdk |
| `ARCH` | Architecture diagrams, C4, Mermaid |
| `QA` | Testing, validation |
| `SEC` | Security, sanitization |
| `SESSION` | Context management, handoff |
| `REQ` | Requirements, PRD |
| `DOC` | Documents (PDF, DOCX, PPT) |
| `DEV` | Development (dev server, project setup) |
| `HEALTH` | API monitoring, retry logic |
| `META` | Toolkit itself (ID system, skill creator) |
| `USER` | YOUR custom skills |

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

1. Create folder: `skills/your-skill-name/`
2. Create `SKILL.md`:

```markdown
---
name: your-skill-name
description: What this skill does and when to use it
id: ZAI-STS-007
version: 1.0
trigger: keyword1, keyword2
---

# Skill: Your Skill Name v1.0

> ID: ZAI-STS-007
> Version: 1.0
> Last Updated: 2026-05

<Your skill instructions here>
```

3. Update registry in `skills/skill-id-system/SKILL.md`:
   - Find section "5.10. User-Created (USER)"
   - Add your skill

---

## Current Registry

### Toolkit Skills

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-GIT-001 | git-safe-ops | Safe git operations |
| ZAI-GIT-002 | git-checkpoint | Create checkpoint commits |
| ZAI-GIT-003 | commit-work | Commit workflow |
| ZAI-SDK-001 | z-ai-web-dev-sdk | SDK integration |
| ZAI-SDK-002 | api-retry | Retry logic for APIs |
| ZAI-SDK-003 | fallback | Fallback provider |
| ZAI-SDK-004 | health-check | API health monitoring |
| ZAI-ARCH-001 | c4-architecture | C4 diagrams |
| ZAI-ARCH-002 | mermaid-diagrams | Mermaid diagrams |
| ZAI-ARCH-003 | database-schema-designer | DB schema design |
| ZAI-QA-001 | qa-test-planner | Test planning |
| ZAI-QA-002 | sanitize-validate | Input validation |
| ZAI-SESSION-001 | session-handoff | Context handoff |
| ZAI-SESSION-002 | session-resume | Resume work |
| ZAI-REQ-001 | requirements-clarity | Requirements analysis |
| ZAI-DOC-001 | doc-gen | Document generation |
| ZAI-DEV-001 | dev-watchdog | Dev server monitoring |
| ZAI-DEV-002 | anti-monolith | System skill (Z.ai sandbox) -- not in toolkit |
| ZAI-DEV-003 | project-clone | Smart project cloning |
| ZAI-META-001 | skill-id-system | This ID system |
| ZAI-META-002 | skill-creator | Create new skills |

### Your Skills (ZAI-STS-XXX)

**IMPORTANT:** All your skills use `STS` domain and `_sts` suffix in folder name.

| ID | Skill | Created |
|----|-------|---------|
| ZAI-STS-001 | prompt-engineering_sts | 2026-05 |
| ZAI-STS-002 | sync-toolkit_sts | 2026-05 |
| ZAI-STS-003 | (available) | - |

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
Use ZAI-GIT-001 for safe git operations
```

### How to find a skill

Check `skills/skill-id-system/SKILL.md` for full registry.

### ZCode Desktop vs Toolkit

| Source | Prefix | Example |
|--------|--------|---------|
| ZCode Desktop built-in | None | `background-process-manager` |
| Z.ai Agent Toolkit | `ZAI-` | `ZAI-GIT-001` |

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
| `docs/SKILL_ID_GUIDE.md` | This guide for you |

---

Built with: Z.ai Agent Toolkit
