---
name: skill-id-system
compatibility: both
description: ID system for Z.ai Agent Toolkit skills
id: ZAI-META-001
version: 1.0
trigger: skill id, create skill, new skill
---

# Skill: Skill ID System v1.0

> ID: ZAI-META-001
> Version: 1.0
> Last Updated: 2026-05

This document describes the ID system for all skills in Z.ai Agent Toolkit.

---

## 1. Purpose

Skill IDs solve the following problems:

| Problem | Solution |
|---------|----------|
| Confusion with Z.ai sandbox built-in skills | Clear prefix `ZAI-` for our toolkit skills |
| Finding skill in discussions | "Use ZAI-DEV-002 for commit workflow" |
| Tracking skill versions | Version in header and registry |
| Distinguishing skill types | Domain-based ID structure |

---

## 2. ID Format

```text
ZAI-<DOMAIN>-<NUMBER>
```

| Component | Description |
|-----------|-------------|
| `ZAI` | Prefix (Z.ai Agent Toolkit) |
| `<DOMAIN>` | Skill domain (3-4 letters) |
| `<NUMBER>` | Sequential number (3 digits) |

**Examples:**
- `ZAI-MEM-001` - memory-store skill
- `ZAI-ARCH-001` - mermaid-diagrams skill
- `ZAI-STS-001` - prompt-engineering_sts skill

---

## 3. Reserved Domains

| Domain | Expansion | Scope |
|--------|-----------|-------|
| `MEM` | Memory | Store, query, delete, export memory records |
| `FS` | File System | Folder indexing, file scanning |
| `SESSION` | Session Management | Session logging, context consolidation |
| `DEV` | Development | Project clone, commit, schema design |
| `ARCH` | Architecture | Mermaid diagrams |
| `QA` | Quality Assurance | Test planning |
| `REQ` | Requirements | Clarity, PRD generation |
| `META` | Meta-skills | This document, skill creation |
| `STS` | User-Created (STS) | Skills created by STS |

> **Note:** Git operations, SDK integration, security, documentation, and health monitoring
> are handled by Z.ai sandbox system skills. They do NOT receive ZAI- prefix IDs.
> See the System Skills section in `docs/skill-id-registry.md` for the full list.

---

## 4. Z.ai Sandbox System Skills (NO ZAI- PREFIX)

Z.ai sandbox provides system skills in `/home/z/my-project/skills/`. They do NOT have `ZAI-` prefix:

| System Skill | Category | Notes |
|-------------|----------|-------|
| `fullstack-dev` | Development | Next.js 16 development |
| `git-checkpoint` | Git | WIP commits and recovery tags |
| `git-safe-ops` | Git | Backup + recover for risky ops |
| `git-safety` | Git | Deadlock prevention rules |
| `sanitize-validate` | Security | Input sanitization and validation |
| `api-retry` | API | Retry logic with exponential backoff |
| `health-check` | API | API health monitoring |
| `fallback` | API | Fallback provider strategy |
| `dev-watchdog` | Development | Dev server keepalive |
| `z-ai-web-dev-sdk` | SDK | Z.ai SDK for chat, images, search |
| `doc-gen` | Documents | PDF, DOCX, XLSX generation |
| `c4-architecture` | Architecture | C4 model diagrams with Mermaid |
| `anti-monolith` | Architecture | Modular architecture enforcement |
| `session-experience` | Session | Auto-save session experience to ChromaDB |
| `session-handoff` | Session | Context handoff between sessions |
| `session-resume` | Session | Session recovery after restart |
| `ui-ux-pro-max` | Design | Advanced UI/UX patterns |
| `visual-design-foundations` | Design | Design tokens, typography |
| `phi-layout` | Design | Grid layouts (toolkit twin: phi-layout_sts) |
| `zai-ui-composer` | Design | UI composition (toolkit twin: zai-ui-composer_sts) |
| `frontend-styling-expert` | Design | CSS/styling (toolkit twin: frontend-styling-expert_sts) |
| `performance-code-generator` | Development | Code optimization (toolkit twin: performance-code-generator_sts) |

**Our toolkit skills always have `ZAI-` prefix to distinguish from system skills.**

---

## 5. Skill ID Registry

> **Canonical source:** `docs/skill-id-registry.md`
> The registry below is a summary. For the full registry with system skills,
> reserved IDs, and compatibility info, see `docs/skill-id-registry.md`.

### 5.1. Memory (MEM)

| ID | Skill Name | Version | Status |
|----|------------|---------|--------|
| ZAI-MEM-001 | memory-store | 1.0 | Active |
| ZAI-MEM-002 | memory-query | 1.0 | Active |
| ZAI-MEM-003 | memory-delete | 1.0 | Active |
| ZAI-MEM-004 | memory-export | 1.0 | Active |

### 5.2. File System (FS)

| ID | Skill Name | Version | Status |
|----|------------|---------|--------|
| ZAI-FS-001 | folder-indexer | 1.0 | Active |

### 5.3. Session Management (SESSION)

| ID | Skill Name | Version | Status |
|----|------------|---------|--------|
| ZAI-SESSION-001 | session-log | 1.1 | Active |
| ZAI-SESSION-002 | context-consolidation | 1.0 | Active |
| ZAI-SESSION-003 | session-experience | 1.0 | Active |

### 5.4. Development (DEV)

| ID | Skill Name | Version | Status |
|----|------------|---------|--------|
| ZAI-DEV-001 | project-clone | 1.0 | Active |
| ZAI-DEV-002 | commit-work | 1.0 | Active |
| ZAI-DEV-003 | database-schema-designer | 1.0 | Active |

### 5.5. Architecture (ARCH)

| ID | Skill Name | Version | Status |
|----|------------|---------|--------|
| ZAI-ARCH-001 | mermaid-diagrams | 1.0 | Active |

### 5.6. Quality Assurance (QA)

| ID | Skill Name | Version | Status |
|----|------------|---------|--------|
| ZAI-QA-001 | qa-test-planner | 1.0 | Active |

### 5.7. Requirements (REQ)

| ID | Skill Name | Version | Status |
|----|------------|---------|--------|
| ZAI-REQ-001 | requirements-clarity | 1.0 | Active |

### 5.8. Meta-skills (META)

| ID | Skill Name | Version | Status |
|----|------------|---------|--------|
| ZAI-META-001 | skill-id-system | 1.0 | Active |
| ZAI-META-002 | skill-creator | 1.1 | Active |

### 5.9. User-Created (STS)

| ID | Skill Name | Version | Status |
|----|------------|---------|--------|
| ZAI-STS-001 | prompt-engineering_sts | 1.1 | Active |
| ZAI-STS-002 | sync-toolkit_sts | 1.0 | Active |
| ZAI-STS-003 | performance-code-generator_sts | 1.0 | Active |
| ZAI-STS-004 | frontend-styling-expert_sts | 1.0 | Active |
| ZAI-STS-005 | phi-layout_sts | 3.0 | Active |
| ZAI-STS-006 | zai-ui-composer_sts | 1.1.2 | Active |
| ZAI-STS-007 | workflow-discipline_sts | 1.0 | Active |

---

## 6. Skill Header Format

```markdown
---
name: skill-name
description: Short description
id: ZAI-XXX-NNN
version: 1.0
compatibility: both
trigger: keyword1, keyword2
---

# Skill: <Name> v<Version>

> ID: ZAI-<DOMAIN>-<NUMBER>
> Version: <Version>
```

### Compatibility Values

| Value | Meaning |
|-------|---------|
| `both` | Works in both Z.ai Sandbox and ZCode ADE |
| `sandbox` | Only works in Z.ai Sandbox (requires z-ai-web-dev-sdk) |
| `ade` | Only works in ZCode ADE |

**How to determine:**
- Does the skill require `z-ai-web-dev-sdk`? -> `sandbox`
- Does the skill use Z.ai-specific tokens/UI? -> `sandbox`
- Otherwise -> `both`

---

## 7. User-Created Skills (ZAI-STS-XXX)

Skills created by STS use `ZAI-STS-XXX` IDs.

This clearly distinguishes your skills from toolkit skills.

### 7.1. Naming Convention for User Skills

**IMPORTANT:** All user-created skills MUST have `_sts` suffix in folder name.

| Type | Format | Example |
|------|--------|---------|
| Folder name | `<skill-name>_sts` | `prompt-engineering_sts` |
| ID | `ZAI-STS-XXX` | `ZAI-STS-001` |

**Why `_sts` suffix and `STS` domain?**
- STS is your signature/initials
- Instantly identifies the skill as yours
- Prevents conflicts with Z.ai built-in skills and other users
- Easy to find your own skills in the list

### 7.2. Creating User Skills

Use `skill-creator` (ZAI-META-002) to create new skills.

The skill-creator will:
1. Guide you through skill creation
2. Assign appropriate ID (ZAI-STS-XXX for your skills)
3. Add `_sts` suffix to folder name
4. Update this registry automatically

---

## 8. Related Skills

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-META-002 | skill-creator | Create new skills with ID assignment |
| ZAI-META-001 | skill-id-system | This document - ID registry |

---

## 9. Checklist for New Skill

- [ ] Skill has assigned ID from registry
- [ ] YAML frontmatter includes `id` field
- [ ] Header matches format (Section 6)
- [ ] Registry updated (Section 5)
- [ ] Used skill-creator (ZAI-META-002) for creation

---

Built with: Z.ai Agent Toolkit
