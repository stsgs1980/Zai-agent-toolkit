# ID Assignment Guide

This reference provides detailed guidance on assigning IDs to new skills.

---

## Quick Reference

### ID Format

```
ZAI-<DOMAIN>-<NUMBER>
```

### Domain Selection

Choose the domain that BEST fits the skill's primary purpose:

| Domain | When to Use |
|--------|-------------|
| `GIT` | Git operations: clone, commit, branch, checkpoint, safety |
| `SDK` | API integration: z-ai-web-dev-sdk, external APIs, retry logic |
| `ARCH` | Architecture: diagrams, C4, mermaid, database schemas |
| `QA` | Testing: test plans, validation, quality checks |
| `SEC` | Security: input validation, sanitization, OWASP |
| `SESSION` | Context: handoff, resume, state management |
| `REQ` | Requirements: PRD, clarity, specifications |
| `DOC` | Documents: PDF, DOCX, PPT, reports |
| `DEV` | Development: dev server, file watching, project setup |
| `HEALTH` | Monitoring: API health, fallback, circuit breaker |
| `META` | Meta-skills: skill creation, ID system, toolkit itself |
| `USER` | User-created: any skill created by the user |

---

## Number Assignment

### Finding Next Number

1. Open skill-id-system (ZAI-META-001)
2. Find the domain section (e.g., "5.1. Git Operations (GIT)")
3. Find the highest number in that domain
4. Add 1 for the new skill

### Example

Current GIT skills:
- ZAI-GIT-001: git-safe-ops
- ZAI-GIT-002: git-checkpoint
- ZAI-GIT-003: commit-work

Next GIT skill: ZAI-GIT-004

---

## User-Created Skills

**IMPORTANT:** Skills created by the user should ALWAYS use `ZAI-USER-XXX`.

This distinguishes them from toolkit skills and prevents conflicts.

### User ID Registry

| ID | Skill Name | Created |
|----|------------|---------|
| ZAI-USER-001 | (available) | - |
| ZAI-USER-002 | (available) | - |
| ZAI-USER-003 | (available) | - |

When a user creates a skill:
1. Find first available ZAI-USER-XXX
2. Assign to new skill
3. Update registry with skill name and date

---

## Conflicts

### What if domain is unclear?

If a skill could fit multiple domains:
1. Choose the PRIMARY function
2. If equal, prefer: GIT > SDK > ARCH > QA > SEC > SESSION > REQ > DOC > DEV > HEALTH > META > USER

### What if number is taken?

Check the registry carefully. If a number is skipped, use the first available.

---

## Updating the Registry

After creating a skill with an ID:

1. Open `/skills/skill-id-system/SKILL.md`
2. Find the appropriate domain section
3. Add entry in format:

```markdown
| ZAI-XXX-NNN | skill-name | 1.0 |
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

**ID:** ZAI-QA-003 (after ZAI-QA-002 sanitize-validate)

### Example 2: User's Custom Report Generator

**Skill purpose:** Weekly report generation from Jira

**Domain analysis:**
- Could be DOC (documentation)
- Could be USER (user-created)

**Decision:** USER (user-created takes priority for custom skills)

**ID:** ZAI-USER-001

### Example 3: Git Hook Manager

**Skill purpose:** Manage git hooks for pre-commit checks

**Domain analysis:**
- Could be GIT (git operations)
- Could be QA (quality checks)

**Decision:** GIT (primary function is git)

**ID:** ZAI-GIT-004 (next available)

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
