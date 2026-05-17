---
name: context-consolidation
id: ZAI-SESSION-003
version: 1.0
compatibility: both
description: >
  Context and memory management for long-running agent sessions. Use when the
  conversation context is getting long, memory is running low, or the agent needs
  to preserve critical information while discarding noise. Keywords: context,
  memory, consolidate, summarize, compress, archive, optimize, cleanup.
trigger: context, memory, consolidate, summarize, compress, token limit, long conversation
---

# Context Consolidation

> ID: ZAI-SESSION-003
> Version: 1.0
> Last Updated: 2026-05

Context and memory management for long-running agent sessions.

---

## When to Activate

Use this skill when:
- The conversation context is approaching token limits
- The agent detects memory pressure or context bloat
- The user asks to "summarize", "consolidate", "optimize context", or "clean up"
- After completing a major task and before starting a new one
- When switching between unrelated tasks in the same session
- The user says "what were we doing?" (sign of context loss)

---

## Priority Levels

All context items are classified into four priority tiers. Consolidation always preserves higher priority tiers first.

### Tier 1: Critical (NEVER discard)

| Item | Why critical |
|------|-------------|
| Current task objectives and requirements | Losing these means the agent cannot continue |
| Architecture decisions made in this session | Reversing decisions causes regressions |
| Active file list and their current state | Required for accurate edits |
| Error patterns discovered (workarounds, gotchas) | Prevents re-discovering known issues |
| User preferences expressed in this session | Respecting user intent |

### Tier 2: High (Preserve when possible)

| Item | Why important |
|------|--------------|
| Implementation details of current work | Avoids re-reading files |
| Git branch and recent commits | Maintains development context |
| Dependencies and their versions | Prevents compatibility issues |
| Configuration values | Environment-specific settings |
| Partially completed tasks | Resume without rework |

### Tier 3: Medium (Summarize heavily)

| Item | Summarization approach |
|------|----------------------|
| Exploration and debugging history | Keep only conclusions |
| Alternative approaches considered | Keep only chosen one |
| Code snippets from research | Keep only useful parts |
| Long explanations | Convert to bullet points |

### Tier 4: Low (Discard freely)

| Item | Why discardable |
|------|----------------|
| Greeting and closing messages | No technical value |
| Repeated clarifications | Redundant |
| Abandoned code attempts | Not useful |
| Off-topic discussions | Irrelevant |

---

## Consolidation Protocol

### Step 1: Assess Context Size

```
1. Estimate current token usage (rough approximation)
2. Identify if approaching limits:
   - Below 50%: No action needed
   - 50-70%: Light consolidation
   - 70-85%: Moderate consolidation
   - 85%+: Aggressive consolidation
```

### Step 2: Categorize Items

```
1. Scan the conversation history
2. Assign each item to a priority tier
3. Mark Tier 4 items for discard
4. Mark Tier 3 items for summarization
5. Mark Tier 1-2 items for preservation
```

### Step 3: Execute Consolidation

```
1. Create a "Context Summary" section:
   - Current objective (1-2 sentences)
   - Active files and their states
   - Key decisions made
   - Known issues/gotchas

2. Discard Tier 4 items silently

3. Summarize Tier 3 items:
   - Replace long passages with bullet conclusions
   - Keep only actionable information

4. Preserve Tier 1-2 items verbatim

5. Present summary to user for confirmation
```

### Step 4: Output Format

After consolidation, provide:

```markdown
## Context Consolidated

**Preserved:**
- Current objective: [1 sentence]
- Active files: [list]
- Key decisions: [bullet list]
- Known issues: [bullet list]

**Summarized:** [X items compressed]
**Discarded:** [Y items removed]

**Token savings:** ~[Z]%
```

---

## Sandbox-Specific Notes

When working in Z.ai Sandbox:

1. **Session state**: Check `worklog.md` for persistent context
2. **Checkpoints**: If session-log created checkpoints, read them
3. **Git state**: Always verify git status before consolidation
4. **Dev servers**: Note which processes are running (ports, PIDs)

---

## Integration with Other Skills

| Skill | Interaction |
|-------|-------------|
| session-log | Read worklog.md for context |
| session-handoff | Create handoff after consolidation |
| session-resume | Use consolidated context on resume |

---

## Examples

### Example 1: Moderate Consolidation

**Before:** 15,000 tokens of conversation including:
- 3,000 tokens of greetings and small talk (Tier 4)
- 5,000 tokens of debugging exploration (Tier 3)
- 4,000 tokens of implementation details (Tier 2)
- 3,000 tokens of critical decisions (Tier 1)

**After:**
- Discard 3,000 tokens (Tier 4)
- Summarize 5,000 -> 1,000 tokens (Tier 3)
- Preserve 7,000 tokens (Tier 1-2)
- **Total:** 8,000 tokens (47% reduction)

### Example 2: Aggressive Consolidation

**Trigger:** Context at 90% capacity

**Action:**
1. Preserve only Tier 1 items verbatim
2. Heavily summarize Tier 2 (keep key facts only)
3. Compress Tier 3 to single bullet points
4. Discard all Tier 4

**Result:** 60-70% token reduction

---

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Discard without categorizing | Always use tier system |
| Summarize critical decisions | Preserve Tier 1 verbatim |
| Silent consolidation | Always show summary to user |
| Consolidate too early | Wait until 50%+ context usage |
| Forget git state | Always include git status |

---

Built with: Z.ai Agent Toolkit
