# Context Handoff Template

> Standard: STD-AGENT-001 Section 6.2 compliant
> Usage: For complex multi-session work, fill this template to transfer context between agents

---

## Handoff Document

### Session Info

| Field | Value |
|-------|-------|
| Task ID | `<id>` |
| Date | `<YYYY-MM-DD>` |
| Agent | `<subagent type>` |
| Project | `<project name>` |

### What Was Done

- `<completed item 1>`
- `<completed item 2>`
- `<completed item 3>`

### What Remains

- `<pending item 1>`
- `<pending item 2>`
- `<pending item 3>`

### Blockers

| Blocker | Severity | Workaround |
|---------|----------|------------|
| `<blocker description>` | HIGH/MEDIUM/LOW | `<workaround if any>` |

### Key Decisions

| Decision | Rationale | Alternative Rejected |
|----------|-----------|---------------------|
| `<decision>` | `<why>` | `<what was not chosen>` |

### File Map

| File | Status | Notes |
|------|--------|-------|
| `/home/z/my-project/<path>` | CREATED/MODIFIED/READ | `<purpose>` |

### Configuration State

| Setting | Value | Notes |
|---------|-------|-------|
| `<env var or config>` | `<value>` | `<if applicable>` |

### Git State

| Field | Value |
|-------|-------|
| Last commit | `<hash>` |
| Branch | `<name>` |
| Unpushed commits | `<count>` |
| Working tree | `<clean/dirty>` |

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
