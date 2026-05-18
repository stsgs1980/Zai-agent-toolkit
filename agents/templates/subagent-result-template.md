# Subagent Result Template

> Standard: STD-AGENT-001 Section 3.2 compliant
> Usage: Every subagent MUST return results in this format

---

## Result Report

### Identity

| Field | Value |
|-------|-------|
| Task ID | `<id>` |
| Agent Type | `<subagent type>` |
| Status | COMPLETED / FAILED / BLOCKED |
| Runtime | `<minutes>` |

### Summary

`<1-3 sentence description of what was accomplished>`

### Files Created

| Path | Purpose |
|------|---------|
| `/home/z/my-project/<path>` | `<description>` |

### Files Modified

| Path | Changes |
|------|---------|
| `/home/z/my-project/<path>` | `<what changed>` |

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| `<decision>` | `<why>` |

### Errors Encountered

| Error | Resolution |
|-------|------------|
| `<error description>` | `<how resolved, or BLOCKER if unresolved>` |

### Next Steps

- `<recommended next action 1>`
- `<recommended next action 2>`

### Compliance Check

- [ ] No emoji/Unicode in output (STD-DOC-003)
- [ ] No hardcoded personal paths (STD-ENV-001)
- [ ] WORKLOG entry appended
- [ ] Files committed + pushed (if modified)

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
