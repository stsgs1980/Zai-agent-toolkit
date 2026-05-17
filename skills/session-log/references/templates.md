# Session Log Templates

## Full Session Template

```markdown
## [YYYY-MM-DD HH:MM] - [Session Title]

### Summary
[2-3 sentences describing what was accomplished]

### Context
- **Project**: [project name/path]
- **Duration**: [approximate time]
- **Files Changed**: [count] files

### Problems Solved

| Problem | Solution | Status |
|---------|----------|--------|
| [Description] | [How fixed] | [Resolved/Partial] |

### Decisions Made

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| [Choice] | [Why] | [Other options] |

### Best Practices Discovered

1. **[Practice Name]**: [Description]
   - When to apply: [Context]
   - Example: [Code or reference]

### Open Issues

- [ ] [Issue description] - [Priority: High/Medium/Low]

### Files Modified

| File | Changes |
|------|---------|
| `path/to/file` | [Brief description] |

### Key Commands Used

```bash
# [Purpose]
[command]
```text

### Next Steps

1. [ ] [Action item]
```

## Problem Solved Template

```markdown
### Problem: [Title]

**Context**: [When/where it occurred]

**Symptoms**: [What was wrong]

**Root Cause**: [Why it happened]

**Solution**:
[Steps taken to fix]

**Code**:
```[language]
// Fix implementation
```text

**Prevention**: [How to avoid in future]

**Related**: [Links to similar issues]
```

## Decision Template

```markdown
### Decision: [Title]

**Date**: [YYYY-MM-DD]

**Context**: [Situation requiring decision]

**Decision**: [What was decided]

**Rationale**:
1. [Reason 1]
2. [Reason 2]

**Alternatives Considered**:
| Option | Pros | Cons | Why Not Chosen |
|--------|------|------|----------------|
| [A] | [...] | [...] | [...] |

**Consequences**:
- Positive: [...]
- Negative: [...]
- Risks: [...]

**Related Decisions**: [Links]
```

## Best Practice Template

```markdown
### Best Practice: [Title]

**Category**: [Code/Architecture/Process/Tooling]

**Problem**: [What problem this solves]

**Practice**:
[Description of the pattern/approach]

**Example**:
```[language]
// Code example
```text

**When to Apply**:
- [Condition 1]
- [Condition 2]

**When NOT to Apply**:
- [Condition 1]

**Related Patterns**: [Links]
```

## Quick Note Template

```markdown
### Note: [Title]
**Date**: [YYYY-MM-DD]
**Tags**: [tag1, tag2]

[Content - 1-3 sentences]

**Reference**: [File/URL if applicable]
```

## Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `bug-fix` | Resolved issues | Trailing whitespace CI fix |
| `feature` | New functionality | Session-log skill created |
| `architecture` | Design decisions | ID system for skills |
| `process` | Workflow improvements | Git workflow for submodules |
| `tooling` | Tool configurations | CI pipeline fixes |
| `research` | Findings from investigation | Skill comparison results |
