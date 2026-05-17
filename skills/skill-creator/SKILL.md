---
name: skill-creator
compatibility: both
description: Create new skills with automatic ID assignment for Z.ai Agent Toolkit. Use when users want to create a skill from scratch, modify existing skills, or need a new skill for their workflow. Automatically assigns ZAI-XXX-NNN IDs and updates registry.
id: ZAI-META-002
version: 1.1
trigger: create skill, new skill, skill creator, make skill, skill for
---

# Skill: Skill Creator v1.1

> ID: ZAI-META-002
> Version: 1.1
> Last Updated: 2026-05

Create new skills for Z.ai Agent Toolkit with automatic ID assignment.

---

## When to Use

Activate this skill when:
- User says "create a skill", "new skill", "make a skill"
- User wants to capture a workflow as a reusable skill
- User needs a custom skill for their project

---

## Integration with Skill ID System

**CRITICAL:** All skills in Z.ai Agent Toolkit must have IDs.

Read `skill-id-system` (ZAI-META-001) for full ID system details.

### ID Format

```text
ZAI-<DOMAIN>-<NUMBER>
```

### Reserved Domains

| Domain | Scope |
|--------|-------|
| `GIT` | Git operations (clone, checkpoint, safe-ops) |
| `SDK` | SDK integration (z-ai-web-dev-sdk, API) |
| `ARCH` | Architecture (C4, mermaid, DB design) |
| `QA` | Quality assurance (testing, validation) |
| `SEC` | Security (sanitization, validation) |
| `SESSION` | Session management (handoff, resume) |
| `REQ` | Requirements (clarity, PRD) |
| `DOC` | Documentation (PDF, DOCX, PPT) |
| `DEV` | Development (dev server, watchdog) |
| `HEALTH` | Health monitoring (API health, retry) |
| `META` | Meta-skills (this skill, ID system) |
| `USER` | User-created skills |

---

## Skill Creation Workflow

### Step 1: Capture Intent

Ask the user:

1. **What should this skill do?**
   - Describe the workflow or task
   - What problem does it solve?

2. **When should it trigger?**
   - What user phrases/keywords?
   - What contexts?

3. **What is the output format?**
   - File generation?
   - Code?
   - Analysis?

### Step 2: Assign ID and Folder Name

**Before writing the skill, assign an ID:**

1. Determine the domain from the table above
2. Check skill-id-system (ZAI-META-001) for next available number
3. Assign ID: `ZAI-<DOMAIN>-<NNN>`

**For user-created skills:**
- Always use `ZAI-STS-XXX` domain (STS = your signature)
- Start from ZAI-STS-001, increment for each new skill
- **IMPORTANT:** Add `_sts` suffix to folder name

| Type | Format | Example |
|------|--------|---------|
| Folder name | `<skill-name>_sts` | `prompt-engineering_sts` |
| ID | `ZAI-STS-XXX` | `ZAI-STS-001` |

### Step 3: Write SKILL.md

Use this template:

```markdown
---
name: skill-name
description: Short description with trigger phrases
id: ZAI-XXX-NNN
version: 1.0
trigger: keyword1, keyword2, keyword3
---

# Skill: <Name> v<Version>

> ID: ZAI-<DOMAIN>-<NUMBER>
> Version: <Version>
> Last Updated: YYYY-MM

<Description of what the skill does>

---

## When to Use

Activate this skill when:
- <trigger condition 1>
- <trigger condition 2>

---

## Instructions

<Main skill content>

---

## Checklist

- [ ] Item 1
- [ ] Item 2

---

Built with: Z.ai Agent Toolkit
```

### Step 4: Update Registry

After creating the skill, update the registry in skill-id-system (ZAI-META-001):

1. Find the appropriate domain section
2. Add new entry:

```markdown
| ZAI-XXX-NNN | skill-name | 1.0 |
```

---

## Example: Creating a User Skill

**User request:** "Create a skill for generating weekly reports"

**Workflow:**

1. **Determine domain:** DOC (documentation)
2. **Check registry:** ZAI-DOC-001 is doc-gen, so next is ZAI-DOC-002
   - But user-created, so use ZAI-STS-001
3. **Assign ID:** ZAI-STS-001
4. **Create folder with _sts suffix:** `weekly-report_sts/`
5. **Write skill:**

```markdown
---
name: weekly-report_sts
description: Generate weekly progress reports from git commits and task tracking
id: ZAI-STS-001
version: 1.0
trigger: weekly report, progress report, status report
---

# Skill: Weekly Report v1.0

> ID: ZAI-STS-001
> Version: 1.0
...
```

5. **Update registry:** Add to USER section in skill-id-system

---

## Trigger Guidelines

### What Are Triggers?

Triggers are keywords and phrases that activate the skill. They appear in two places:

1. **`description` field** - Full sentences with context (loaded always)
2. **`trigger` field** - Comma-separated keywords (quick matching)

### Trigger Sources

Identify triggers from:

| Source | Example |
|--------|---------|
| User's explicit request | "create a prompt" -> `prompt` |
| Synonyms | "improve", "optimize", "enhance" |
| Domain terms | "Big O", "SIMD", "cache miss" |
| Common misspellings | "promprt" (for prompt) |
| Multiple languages | "obnovit" (Russian for "update") |

### Trigger Quality Rules

**GOOD triggers:**
- Specific: `cache miss` not just `cache`
- Action-oriented: `optimize code` not just `optimize`
- Domain terms: `Big O`, `SIMD`, `lock-free`

**BAD triggers:**
- Too generic: `code`, `help`, `fix`
- Ambiguous: `fast` (fast what?)
- Overlapping: `git` (too broad, use `git checkpoint`, `git safe`)

### Description as Extended Trigger

The `description` field is your PRIMARY trigger. AI matches user requests against it.

**Pattern:**
```text
description: "Use this skill when user asks for X, mentions Y, or needs Z.
Also activate on: 'keyword1', 'keyword2', 'phrase example'."
```

**Example from performance-code-generator_sts:**
```yaml
description: "Generate high-performance code with optimization for algorithmic
complexity, cache locality, memory allocations, and parallelism. Use this skill
when the user asks for performant code, to optimize existing code, improve program
speed, reduce memory consumption, or mentions Big O, cache hits, SIMD, lock-free
structures, object pooling, arena allocator, vectorization, profiling. Also
activate on: 'slow code', 'optimization', 'performance', 'high performance',
'low latency', 'throughput', 'cache miss', 'allocation', 'memory leak',
'bottleneck', 'profiling', 'hot path'."
```

### Trigger Field Format

The `trigger` field is comma-separated keywords:

```yaml
trigger: keyword1, keyword2, phrase example, domain-term
```

**Keep it concise** - 5-15 keywords maximum.

### Hot Commands

Hot commands are short phrases user can type to quickly invoke a skill:

| Skill | Hot Commands |
|-------|--------------|
| prompt-engineering_sts | "score prompt", "improve prompt", "prompt review" |
| performance-code-generator_sts | "optimize", "performance", "slow code" |
| sync-toolkit_sts | "sync toolkit", "obnovit" |

**Document hot commands in the skill's "When to Use" section.**

---

## Skill Writing Guidelines

### Keep It Lean

- SKILL.md should be under 500 lines
- Use references/ for detailed content
- Use scripts/ for repetitive tasks

### Progressive Disclosure

Skills load in three levels:
1. **Metadata** (name + description) - always loaded
2. **SKILL.md body** - loaded when skill triggers
3. **Bundled resources** - loaded as needed

### Principle of Least Surprise

- Skills must not contain malware
- Skills must not do unexpected things
- User should understand what skill does from description

---

## File Structure

```text
skill-name/
+-- SKILL.md (required)
|   +-- YAML frontmatter (name, description, id, version, trigger)
|   +-- Markdown instructions
+-- references/ (optional)
|   +-- detailed-docs.md
+-- scripts/ (optional)
|   +-- helper-script.py
+-- assets/ (optional)
    +-- templates/
```

---

## Distinguishing from ZCode Desktop Built-ins

ZCode Desktop has its own built-in skills without ZAI- prefix:

| Built-in Skill | Source |
|----------------|--------|
| background-process-manager | ZCode Desktop |
| code-analyzer | ZCode Desktop |
| context-manager | ZCode Desktop |

**All Z.ai Agent Toolkit skills have ZAI- prefix.**

---

## Where Skills Are Stored

### Important: Toolkit Location

Skills are stored in the Z.ai Agent Toolkit repository, not in individual projects.

**Default location on Z.ai server:**
```text
/home/z/my-project/Zai-agent-toolkit/skills/
```

**Your local location (Windows):**
```text
C:\Users\stsgr\.zcode\Zai-agent-toolkit\skills\
```

### Synchronization

Skills created in Z.ai sandbox are NOT automatically synced to your local machine.

**To sync:**
1. Here: `git push` to GitHub
2. On Windows: `git pull` or run `update-toolkit.ps1`

### Project Skills vs Toolkit Skills

| Type | Location | Scope |
|------|----------|-------|
| Toolkit skills | `Zai-agent-toolkit/skills/` | Available in all projects |
| Project skills | `<project>/skills/` | Only in this project |

**Recommendation:** Use toolkit for reusable skills, project for project-specific.

---

## Checklist for New Skill

- [ ] Captured user intent
- [ ] Assigned ZAI-XXX-NNN ID
- [ ] Created SKILL.md with proper frontmatter
- [ ] Added trigger keywords
- [ ] Tested trigger phrases
- [ ] Updated skill-id-system registry
- [ ] Committed to toolkit repository
- [ ] Pushed to GitHub for local sync

---

Built with: Z.ai Agent Toolkit
