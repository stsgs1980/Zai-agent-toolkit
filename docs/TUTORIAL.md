# Z.ai Agent Toolkit: Complete Tutorial

A comprehensive guide for using and extending the toolkit.

---

## Table of Contents

1. [What is Z.ai Agent Toolkit](#1-what-is-zai-agent-toolkit)
2. [Installation on Windows](#2-installation-on-windows)
3. [How Skills Work](#3-how-skills-work)
4. [Skill ID System](#4-skill-id-system)
5. [Creating Your Own Skills](#5-creating-your-own-skills)
6. [Synchronization](#6-synchronization)
7. [Best Practices](#7-best-practices)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. What is Z.ai Agent Toolkit

### Purpose

Z.ai Agent Toolkit is a collection of reusable skills for AI agents. These skills help the AI:

- Work with git safely
- Generate documents (PDF, DOCX, PPT)
- Create architecture diagrams
- Manage sessions and context
- And much more

### Why Use It

| Without Toolkit | With Toolkit |
|-----------------|--------------|
| AI forgets context between sessions | session-handoff preserves context |
| Git mistakes cause problems | git-safety prevents disasters |
| No standardized document output | doc-gen ensures quality |
| Inconsistent code architecture | anti-monolith (system skill) enforces modularity |

### Architecture

```text
Z.ai Sandbox                    Your Windows PC
+------------------+           +------------------+
| /home/z/         |           | $env:USERPROFILE\  |
|   my-project/    |           |   .zcode\        |
|     Zai-agent-   |<--sync--->|     Zai-agent-   |
|     toolkit/     |   Git     |     toolkit\     |
+------------------+           +------------------+
        |                              |
        v                              v
   AI reads skills              ZCode Desktop reads
                                skills via symlink
```

---

## 2. Installation on Windows

### Prerequisites

- Windows 10/11
- PowerShell (built-in)
- Git installed
- ZCode Desktop installed

### Step-by-Step Installation

#### Step 1: Open PowerShell

Press `Win + X`, select "Windows PowerShell" or "Terminal".

#### Step 2: Navigate to ZCode Directory

```powershell
cd $env:USERPROFILE\.zcode
```

If the directory does not exist:

```powershell
mkdir $env:USERPROFILE\.zcode
cd $env:USERPROFILE\.zcode
```

#### Step 3: Clone Toolkit

```powershell
git clone https://github.com/stsgs1980/Zai-agent-toolkit.git
```

#### Step 4: Create Symlinks

ZCode Desktop expects skills in `~/.zcode/skills/`. Create symbolic links:

```powershell
# Remove existing directories if they exist (backup first!)
# Then create symlinks:

New-Item -ItemType SymbolicLink -Path "skills" -Target "Zai-agent-toolkit\skills"
New-Item -ItemType SymbolicLink -Path "instructions" -Target "Zai-agent-toolkit\instructions"
New-Item -ItemType SymbolicLink -Path "standards" -Target "Zai-agent-toolkit\standards"
```

#### Step 5: Verify Installation

```powershell
ls skills
```

You should see skill folders like:
- git-safe-ops
- session-handoff
- skill-creator
- etc.

### Update Script

Create `update-toolkit.ps1` in `$env:USERPROFILE\.zcode\`:

```powershell
# update-toolkit.ps1
# Run this script to update Z.ai Agent Toolkit

Write-Host "Updating Z.ai Agent Toolkit..." -ForegroundColor Green

# Navigate to toolkit
Set-Location "$env:USERPROFILE\.zcode\Zai-agent-toolkit"

# Fetch and pull changes
git fetch origin
git pull origin main

Write-Host "Update complete!" -ForegroundColor Green
Write-Host "Current version: $(Get-Content VERSION)" -ForegroundColor Cyan
```

To run:

```powershell
cd $env:USERPROFILE\.zcode
.\update-toolkit.ps1
```

---

## 3. How Skills Work

### What is a Skill

A skill is a set of instructions that the AI agent can load when needed. Think of it as a "plugin" or "module" that extends AI capabilities.

### Skill Structure

```text
skill-name/
+-- SKILL.md           # Main file (required)
+-- references/        # Additional docs (optional)
|   +-- guide.md
+-- scripts/           # Helper scripts (optional)
|   +-- helper.py
+-- assets/            # Templates, icons (optional)
    +-- template.md
```

### SKILL.md Anatomy

```markdown
---
name: skill-name
description: When to use this skill and what it does
id: ZAI-XXX-NNN
version: 1.0
trigger: keyword1, keyword2, keyword3
---

# Skill: Skill Name v1.0

> ID: ZAI-XXX-NNN
> Version: 1.0
> Last Updated: 2026-05

<Main instructions here>

---

## When to Use

Activate this skill when:
- User says "keyword1"
- Context matches "keyword2"

---

## Instructions

<Step-by-step guide>

---

## Checklist

- [ ] Step 1
- [ ] Step 2
```

### How Skills Load

Skills use a three-level loading system:

| Level | Content | When Loaded |
|-------|---------|-------------|
| 1 | Name + Description | Always (in every conversation) |
| 2 | SKILL.md body | When skill triggers (AI decides) |
| 3 | references/, scripts/ | When explicitly needed |

This means:
- AI always knows skill exists (from description)
- AI only loads full instructions when needed
- Large files (scripts, references) load only when used

---

## 4. Skill ID System

### Why IDs Matter

Without IDs, it's hard to:
- Distinguish your skills from built-in ZCode skills
- Reference skills in conversations
- Track versions and updates

With IDs:
- "Use ZAI-DEV-002 for commit workflow" - clear reference
- ZAI-STS-001 - clearly your skill, not built-in

### ID Format

```text
ZAI-<DOMAIN>-<NUMBER>
```

| Part | Meaning |
|------|---------|
| ZAI | Z.ai Agent Toolkit prefix |
| DOMAIN | Category (GIT, SDK, USER, etc.) |
| NUMBER | Sequential (001, 002, 003...) |

### Domain Reference

| Domain | For Skills About |
|--------|------------------|
| META | Toolkit itself (ID system, skill creator) |
| MEM | Memory system (ChromaDB storage and retrieval) |
| FS | Filesystem tools (indexing, scanning) |
| DEV | Development (project clone, commit, schema design) |
| SESSION | Session management (logging, context consolidation) |
| ARCH | Architecture (Mermaid diagrams) |
| QA | Quality assurance (test planning) |
| REQ | Requirements (clarity, PRD) |
| STS | Personal skills (user signature: _sts) |

> **Note:** Git operations, SDK integration, security, documentation, and health monitoring
> are handled by Z.ai sandbox system skills (see Section 4.2). They do NOT receive ZAI- IDs.

### 4.1 Toolkit Skills Registry

These skills belong to the Zai-agent-toolkit repository and have ZAI- prefix IDs.

#### Meta (META)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-META-001 | skill-id-system | This ID system |
| ZAI-META-002 | skill-creator | Create new skills with auto-ID |

#### Memory (MEM)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-MEM-001 | memory-store | Store sessions, knowledge, patterns in ChromaDB |
| ZAI-MEM-002 | memory-query | Semantic search across stored memory entries |
| ZAI-MEM-003 | memory-delete | Delete entries from ChromaDB |
| ZAI-MEM-004 | memory-export | Export memory entries to JSON |

#### Filesystem (FS)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-FS-001 | folder-indexer | Scan directories and create searchable indexes |

#### Development (DEV)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-DEV-001 | project-clone | Smart project cloning with user confirmation |
| ZAI-DEV-002 | commit-work | Structured conventional commit workflow |
| ZAI-DEV-001 | database-schema-designer | Database schema design |

#### Session (SESSION)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-SESSION-001 | session-log | Automatic session knowledge capture |
| ZAI-SESSION-001 | context-consolidation | Long-running session context compression |

#### Architecture (ARCH)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-ARCH-001 | mermaid-diagrams | Mermaid diagram generation |

#### Quality Assurance (QA)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-QA-001 | qa-test-planner | Test planning and bug reports |

#### Requirements (REQ)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-REQ-001 | requirements-clarity | Requirements analysis and PRD generation |

#### Personal (STS)

| ID | Skill | Purpose |
|----|-------|---------|
| ZAI-STS-001 | prompt-engineering_sts | Expert prompt engineering with scoring |
| ZAI-STS-002 | sync-toolkit_sts | Sync toolkit between sandbox and Windows |
| ZAI-STS-003 | performance-code-generator_sts | High-performance code generation |
| ZAI-STS-004 | frontend-styling-expert_sts | CSS/styling specialist |
| ZAI-STS-005 | phi-layout_sts | Golden ratio CSS Grid layouts |
| ZAI-STS-006 | zai-ui-composer_sts | Production UI composition |

### 4.2 System Skills (Z.ai Sandbox)

These skills are provided by the Z.ai platform. They do NOT have ZAI- prefix IDs.
Some have toolkit twins (personalized _sts versions in the toolkit).

| Skill | Category | Toolkit Twin |
|-------|----------|-------------|
| fullstack-dev | Development | -- |
| visual-design-foundations | Design | -- |
| phi-layout | Design | phi-layout_sts (ZAI-STS-005) |
| zai-ui-composer | Design | zai-ui-composer_sts (ZAI-STS-006) |
| frontend-styling-expert | Design | frontend-styling-expert_sts (ZAI-STS-004) |
| performance-code-generator | Development | performance-code-generator_sts (ZAI-STS-003) |
| ui-ux-pro-max | Design | -- |
| session-resume | Session | -- |
| session-handoff | Session | -- |
| git-checkpoint | Git | -- |
| git-safe-ops | Git | -- |
| git-safety | Git | -- |
| sanitize-validate | Security | -- |
| api-retry | API | -- |
| health-check | API | -- |
| fallback | API | -- |
| dev-watchdog | Development | -- |
| z-ai-web-dev-sdk | SDK | -- |
| doc-gen | Documents | -- |
| c4-architecture | Architecture | -- |
| anti-monolith | Architecture | -- |

---

## 5. Creating Your Own Skills

### Method 1: Ask AI (Recommended)

Just say to the AI:

```text
Create a skill for <purpose>
```

Example:

```bash
Create a skill for generating weekly progress reports from git commits
```

The AI will:
1. Use skill-creator (ZAI-META-002)
2. Ask clarifying questions
3. Assign a ZAI-STS-XXX ID
4. Create the SKILL.md file
5. Update the registry

### Method 2: Manual Creation

#### Step 1: Determine Domain

For user-created skills, always use `STS` domain (with `_sts` suffix in folder name).

#### Step 2: Get Next ID

Check the registry in `docs/skill-id-registry.md` for the next available STS ID.
Currently ZAI-STS-007 is the next available.

#### Step 3: Create Directory

```powershell
cd $env:USERPROFILE\.zcode\Zai-agent-toolkit\skills
mkdir my-skill-name_sts
```

#### Step 4: Create SKILL.md

Create `my-skill-name/SKILL.md`:

```markdown
---
name: my-skill-name
description: What this skill does and when to trigger
id: ZAI-STS-001
version: 1.0
trigger: keyword1, keyword2
---

# Skill: My Skill Name v1.0

> ID: ZAI-STS-001
> Version: 1.0
> Last Updated: 2026-05

Description of what this skill does.

---

## When to Use

Activate this skill when:
- User says "keyword1"
- User mentions "keyword2"

---

## Instructions

### Step 1: Do Something

<Instructions here>

### Step 2: Do Another Thing

<More instructions>

---

## Checklist

- [ ] Completed step 1
- [ ] Completed step 2

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
```

#### Step 5: Update Registry

Edit `skills/skill-id-system/SKILL.md`:

```markdown
### 5.10. Personal (STS)

| ID | Skill Name | Version |
|----|------------|---------|
| ZAI-STS-007 | my-skill-name_sts | 1.0 |
```

#### Step 6: Commit and Push

```powershell
cd $env:USERPROFILE\.zcode\Zai-agent-toolkit
git add .
git commit -m "Add skill: my-skill-name (ZAI-STS-001)"
git push
```

---

## 6. Synchronization

### The Sync Problem

Skills created on Z.ai server are NOT automatically on your Windows.

```text
Z.ai Server                GitHub                Your Windows
+----------+              +-------+              +------------+
| skills/  | --push----->| repo  |----pull----->| skills/    |
+----------+              +-------+              +------------+
     ^                                                   |
     |                                                   |
     +------------------NOT AUTOMATIC--------------------+
```

### Sync Workflow

#### From Z.ai Server to Windows

1. On Z.ai (after creating skill):
   ```bash
   cd /home/z/my-project/Zai-agent-toolkit
   git add .
   git commit -m "Add new skill"
   git push
   ```

2. On Windows:
   ```powershell
   cd $env:USERPROFILE\.zcode
   .\update-toolkit.ps1
   # OR manually:
   cd Zai-agent-toolkit
   git pull
   ```

#### From Windows to Z.ai Server

1. On Windows:
   ```powershell
   cd $env:USERPROFILE\.zcode\Zai-agent-toolkit
   git add .
   git commit -m "Update skill"
   git push
   ```

2. On Z.ai server:
   ```bash
   cd /home/z/my-project/Zai-agent-toolkit
   git pull
   ```

### Best Practice

Always sync before starting work:

```bash
On Z.ai:     git pull before creating skills
On Windows:  update-toolkit.ps1 before using ZCode Desktop
```

---

## 7. Best Practices

### Skill Design

| Good | Bad |
|------|-----|
| Clear trigger keywords | Vague "use when needed" |
| Step-by-step instructions | Wall of text |
| Checklist for verification | No way to verify |
| Under 500 lines | 2000+ lines |

### Naming Conventions

```text
Good:    weekly-report-generator
Bad:     skill1, myskill, new_skill

Good:    ZAI-STS-001
Bad:     skill-1, user_skill_1
```

### Version Control

Update version when:
- Adding new features: 1.0 -> 1.1
- Breaking changes: 1.0 -> 2.0
- Bug fixes: 1.0.1 -> 1.0.2

### Documentation

Every skill should have:
- Clear description
- When to use section
- Step-by-step instructions
- Checklist

---

## 8. Troubleshooting

### Skill Not Triggering

**Symptom:** AI ignores your skill.

**Causes:**
1. Trigger keywords not matching
2. Description too vague
3. Skill not in correct directory

**Solutions:**
1. Add more trigger keywords
2. Make description more specific
3. Check symlink is correct:
   ```powershell
   ls $env:USERPROFILE\.zcode\skills
   # Should show Zai-agent-toolkit\skills contents
   ```

### Symlink Broken

**Symptom:** Skills folder is empty or wrong.

**Solution:**
```powershell
# Remove broken symlink
Remove-Item $env:USERPROFILE\.zcode\skills

# Recreate
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.zcode\skills" -Target "$env:USERPROFILE\.zcode\Zai-agent-toolkit\skills"
```

### Git Conflicts

**Symptom:** `git pull` shows conflicts.

**Solution:**
```powershell
# Stash your changes
git stash

# Pull updates
git pull

# Reapply your changes
git stash pop
```

### ZCode Desktop Not Seeing Skills

**Symptom:** ZCode Desktop doesn't recognize your skills.

**Check:**
1. Symlink exists: `ls $env:USERPROFILE\.zcode\skills`
2. SKILL.md exists in skill folder
3. SKILL.md has valid YAML frontmatter

---

## Quick Reference Card

### Essential Commands

```powershell
# Update toolkit
cd $env:USERPROFILE\.zcode
.\update-toolkit.ps1

# Create skill manually
cd Zai-agent-toolkit\skills
mkdir my-skill
# Create SKILL.md...

# Commit and push
git add .
git commit -m "Add skill"
git push
```

### ID Assignment

```text
Your skills: ZAI-STS-001, ZAI-STS-002, ...
Toolkit skills: ZAI-DEV-xxx, ZAI-MEM-xxx, ZAI-SESSION-xxx, ...
System skills: no ZAI- prefix (git-safe-ops, api-retry, etc.)
```

### File Locations

| What | Where |
|------|-------|
| Toolkit | `$env:USERPROFILE\.zcode\Zai-agent-toolkit\` |
| Skills | `Zai-agent-toolkit\skills\` |
| ID Registry | `skills\skill-id-system\SKILL.md` |
| This Guide | `docs\TUTORIAL.md` |

---

## Summary

1. **Install** once via git clone + symlinks
2. **Update** with `update-toolkit.ps1`
3. **Create skills** by asking AI or manually
4. **Use IDs** (ZAI-STS-xxx) for your skills
5. **Sync** via git push/pull

---

Built with: Z.ai Agent Toolkit
