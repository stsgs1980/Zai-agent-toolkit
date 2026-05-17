---
name: skill-id-system
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
| Confusion with ZCode Desktop built-in skills | Clear prefix `ZAI-` for our skills |
| Finding skill in discussions | "Use ZAI-GIT-001 for safe git operations" |
| Tracking skill versions | Version in header and registry |
| Distinguishing skill types | Domain-based ID structure |

---

## 2. ID Format

```
ZAI-<DOMAIN>-<NUMBER>
```

| Component | Description |
|-----------|-------------|
| `ZAI` | Prefix (Z.ai Agent Toolkit) |
| `<DOMAIN>` | Skill domain (3-4 letters) |
| `<NUMBER>` | Sequential number (3 digits) |

**Examples:**
- `ZAI-GIT-001` - git-safe-ops skill
- `ZAI-SDK-001` - z-ai-web-dev-sdk skill
- `ZAI-ARCH-001` - c4-architecture skill

---

## 3. Reserved Domains

| Domain | Expansion | Scope |
|--------|-----------|-------|
| `GIT` | Git Operations | Safe git, checkpoints, commits |
| `SDK` | SDK Integration | z-ai-web-dev-sdk, API calls |
| `ARCH` | Architecture | C4 diagrams, mermaid, DB design |
| `QA` | Quality Assurance | Test planning, validation |
| `SEC` | Security | Sanitization, validation |
| `SESSION` | Session Management | Handoff, resume, context |
| `REQ` | Requirements | Clarity, PRD generation |
| `DOC` | Documentation | PDF, DOCX, PPT generation |
| `DEV` | Development | Dev server, watchdog |
| `HEALTH` | Health Monitoring | API health, fallback, retry |
| `META` | Meta-skills | This document, skill creation |
| `STS` | User-Created (STS) | Skills created by STS |

---

## 4. ZCode Desktop Built-in Skills (NO PREFIX)

ZCode Desktop has its own built-in skills. They do NOT have `ZAI-` prefix:

| Built-in Skill | Source |
|----------------|--------|
| `background-process-manager` | ZCode Desktop |
| `code-analyzer` | ZCode Desktop |
| `context-manager` | ZCode Desktop |

**Our skills always have `ZAI-` prefix to distinguish.**

---

## 5. Skill ID Registry

### 5.1. Skills with Assigned IDs

| ID | Skill Name | Version | Status |
|----|------------|---------|--------|
| ZAI-META-001 | skill-id-system | 1.0 | Active |
| ZAI-META-002 | skill-creator | 1.0 | Active |
| ZAI-DEV-002 | anti-monolith | 1.0 | Active |
| ZAI-STS-001 | prompt-engineering_sts | 1.1 | Active |
| ZAI-STS-002 | sync-toolkit_sts | 1.0 | Active |
| ZAI-STS-003 | (available) | - | - |

### 5.2. Skills Pending ID Assignment

These skills exist in toolkit but do not have IDs assigned yet:

| Skill Name | Suggested Domain |
|------------|------------------|
| git-safe-ops | GIT |
| git-checkpoint | GIT |
| commit-work | GIT |
| git-safety | GIT |
| z-ai-web-dev-sdk | SDK |
| api-retry | SDK |
| fallback | SDK |
| health-check | HEALTH |
| c4-architecture | ARCH |
| mermaid-diagrams | ARCH |
| database-schema-designer | ARCH |
| qa-test-planner | QA |
| sanitize-validate | SEC |
| session-handoff | SESSION |
| session-resume | SESSION |
| requirements-clarity | REQ |
| doc-gen | DOC |
| dev-watchdog | DEV |
| project-clone | DEV |

**Note:** IDs will be assigned when updating these skills.

---

## 6. Skill Header Format

```markdown
---
name: skill-name
description: Short description
id: ZAI-XXX-NNN
version: 1.0
trigger: keyword1, keyword2
---

# Skill: <Name> v<Version>

> ID: ZAI-<DOMAIN>-<NUMBER>
> Version: <Version>
```

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
