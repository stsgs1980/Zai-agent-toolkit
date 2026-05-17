---
name: session-log
id: ZAI-SESSION-002
description: >
  Capture session knowledge: problems solved, decisions made, best practices discovered.
  Use when: (1) user says "create session log", "log this", "save knowledge",
  (2) significant work completed, (3) before session ends, (4) problem solved,
  (5) user says "what did we do", "summarize session".
  Creates entries in KNOWLEDGE_BASE.md for future reference and best practices.
---

# Session Log

> ID: ZAI-SESSION-002
> Version: 1.0

Capture knowledge from AI sessions for future reference. Prevents knowledge loss
when context resets and builds a searchable knowledge base over time.

## Triggers

| Trigger | Action |
|---------|--------|
| `"create session log"` | Generate full session report |
| `"log this"` | Add quick entry to knowledge base |
| `"save knowledge"` | Create structured entry |
| `"what did we do"` | Summarize and optionally save |
| Before handoff | Auto-include session log |
| End of session | Prompt to save if substantial work |

## Workflow

### Step 1: Detect Scope

What type of log entry?

| Type | When | Template |
|------|------|----------|
| Full Session | End of significant work | Session Template |
| Problem Solved | Bug fix, issue resolved | Problem Template |
| Decision Made | Architectural choices | Decision Template |
| Best Practice | Pattern discovered | Practice Template |
| Quick Note | Something to remember | Note Template |

### Step 2: Gather Information

Scan the conversation for:

1. **Files changed** - What was created/modified?
2. **Problems encountered** - What went wrong?
3. **Solutions applied** - How was it fixed?
4. **Decisions made** - Why this approach?
5. **Open issues** - What's still pending?
6. **Patterns discovered** - Reusable approaches?

### Step 3: Generate Entry

Use the appropriate template from `references/templates.md`.

### Step 4: Append to Knowledge Base

Add the entry to `docs/KNOWLEDGE_BASE.md`:

```markdown
## [DATE] - [SESSION TITLE]

### Summary
Brief description of what was accomplished.

### Problems Solved
| Problem | Solution |
|---------|----------|
| X not working | Did Y |

### Decisions Made
- Chose X over Y because Z

### Best Practices
- Always do X when Y

### Open Issues
- Z still needs attention

### Files Changed
- `path/to/file.ts` - description
```

### Step 5: Confirm

Report to user:
- Entry created in KNOWLEDGE_BASE.md
- Summary of captured knowledge
- Any open issues flagged

## Quick Commands

| User Says | Action |
|-----------|--------|
| `"log this: <note>"` | Add quick note |
| `"log problem: <desc>"` | Add problem entry |
| `"log decision: <desc>"` | Add decision entry |
| `"create session log"` | Full session capture |
| `"show knowledge base"` | Display KNOWLEDGE_BASE.md |

## Templates

See `references/templates.md` for all entry templates.

## Knowledge Base Structure

```markdown
# Knowledge Base

## Sessions
(Chronological session logs)

## Best Practices
(Accumulated patterns)

## Common Problems
(Frequent issues and solutions)

## Decisions Archive
(Important architectural choices)
```

## Integration

This skill works with:
- `session-handoff` - Include session log in handoff
- `commit-work` - Reference session in commits
- `git-checkpoint` - Tag significant discoveries

## File Locations

| File | Purpose |
|------|---------|
| `docs/KNOWLEDGE_BASE.md` | Main knowledge storage |
| `docs/session-logs/YYYY-MM-DD-*.md` | Individual session logs (optional) |

---

Built with: Z.ai Agent Toolkit
