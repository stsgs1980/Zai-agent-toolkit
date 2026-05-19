# ID Assignment Guide

This reference provides detailed guidance on assigning IDs to new skills.

---

## Quick Reference

### ID Format

```text
ZAI-<DOMAIN>-<NUMBER>
```

### Domain Selection

Choose the domain that BEST fits the skill's primary purpose:

| Domain | When to Use |
|--------|-------------|
| `MEM` | Memory operations: store, query, delete, export records |
| `FS` | File system: folder indexing, file scanning |
| `SESSION` | Session management: handoff, resume, context, logging |
| `DEV` | Development: project clone, commit, schema design |
| `ARCH` | Architecture: diagrams, C4, mermaid, database schemas |
| `QA` | Testing: test plans, validation, quality checks |
| `REQ` | Requirements: PRD, clarity, specifications |
| `META` | Meta-skills: skill creation, ID system, toolkit itself |
| `STS` | User-created: any skill created by STS (with `_sts` suffix) |
| `GIT` | (reserved) Git operations: clone, branch, checkpoint |
| `SDK` | (reserved) API integration: z-ai-web-dev-sdk |
| `SEC` | (reserved) Security: input validation, sanitization |
| `DOC` | (reserved) Documents: PDF, DOCX, PPT generation |
| `HEALTH` | (reserved) Monitoring: API health, fallback, circuit breaker |

---

## Number Assignment

### Finding Next Number

1. Open skill-id-system (ZAI-META-001)
2. Find the domain section (e.g., "5.1. Memory (MEM)")
3. Find the highest number in that domain
4. Add 1 for the new skill

### Example

Current MEM skills:
- ZAI-MEM-001: memory-store
- ZAI-MEM-002: memory-query
- ZAI-MEM-003: memory-delete
- ZAI-MEM-004: memory-export

Next MEM skill: ZAI-MEM-005

---

## User-Created Skills (STS Domain)

**IMPORTANT:** Skills created by the user (STS) should ALWAYS use `ZAI-STS-XXX`.

This distinguishes them from toolkit skills and prevents conflicts.

### Naming Convention

- Folder name MUST have `_sts` suffix: `my-skill_sts/`
- ID uses `STS` domain: `ZAI-STS-XXX`

### Current STS Registry

| ID | Skill Name | Status |
|----|------------|--------|
| ZAI-STS-001 | prompt-engineering_sts | Active |
| ZAI-STS-002 | sync-toolkit_sts | Active |
| ZAI-STS-003 | performance-code-generator_sts | Active |
| ZAI-STS-004 | frontend-styling-expert_sts | Active |
| ZAI-STS-005 | phi-layout_sts | Active |
| ZAI-STS-006 | zai-ui-composer_sts | Active |
| ZAI-STS-007 | workflow-discipline_sts | Active |

When creating a user skill:
1. Find first available ZAI-STS-XXX
2. Assign to new skill
3. Add `_sts` suffix to folder name
4. Update registry with skill name

---

## Conflicts

### What if domain is unclear?

If a skill could fit multiple domains:
1. Choose the PRIMARY function
2. If equal, prefer: MEM > FS > SESSION > DEV > ARCH > QA > REQ > META > STS > GIT > SDK > SEC > DOC > HEALTH

### What if number is taken?

Check the registry carefully. If a number is skipped, use the first available.

---

## Updating the Registry

After creating a skill with an ID:

1. Open `/skills/skill-id-system/SKILL.md`
2. Find the appropriate domain section
3. Add entry in format:

```markdown
| ZAI-XXX-NNN | skill-name | 1.0 | Active |
```

4. Commit changes

---

## Examples

### Example 1: API Testing Skill

**Skill purpose:** Automated API endpoint testing

**Domain analysis:**
- Could be QA (testing)
- Could be SDK (API integration)
- Primary function: testing

**Decision:** QA

**ID:** ZAI-QA-002 (next after ZAI-QA-001 qa-test-planner)

### Example 2: User's Custom Report Generator

**Skill purpose:** Weekly report generation from Jira

**Domain analysis:**
- Could be DOC (documentation)
- Could be STS (user-created)

**Decision:** STS (user-created takes priority for custom skills)

**ID:** ZAI-STS-008, folder: `weekly-report_sts/`

### Example 3: Memory Backup Skill

**Skill purpose:** Backup memory database to file

**Domain analysis:**
- Could be MEM (memory operations)
- Could be FS (file system)

**Decision:** MEM (primary function is memory)

**ID:** ZAI-MEM-005 (next available)

---

## Verification Checklist

Before finalizing ID:

- [ ] Checked skill-id-system registry
- [ ] Confirmed domain selection
- [ ] Verified number is available
- [ ] Added to registry
- [ ] Updated SKILL.md frontmatter

---

Built with: Z.ai Agent Toolkit
