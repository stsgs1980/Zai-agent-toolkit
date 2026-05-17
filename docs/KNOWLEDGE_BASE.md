# Knowledge Base

> Last Updated: 2026-05-17
> Sessions Logged: 1

This document accumulates knowledge from AI sessions for future reference.

---

## Sessions

### 2026-05-17 - Skill ID System & Toolkit Migration

**Summary**: Created comprehensive ID system for skills (ZAI-<DOMAIN>-<NUMBER>),
migrated personal skills to toolkit to prevent sandbox overwrites, fixed CI
trailing whitespace issue.

**Duration**: ~2 hours
**Files Changed**: 18 skills updated, 4 new skills added

#### Problems Solved

| Problem | Solution | Status |
|---------|----------|--------|
| System skills overwritten on sandbox restart | Store personal skills in `/home/z/my-project/Zai-agent-toolkit/skills/` with `_sts` suffix | Resolved |
| No consistent ID system for skills | Created ZAI-<DOMAIN>-<NUMBER> format with domain registry | Resolved |
| CI failing: trailing whitespace | Fixed `sync-toolkit_sts/SKILL.md` trailing spaces | Resolved |
| Git operations failing in submodule | Use `git -C <path>` instead of `cd` | Resolved |

#### Decisions Made

| Decision | Rationale | Alternatives |
|----------|-----------|--------------|
| Use `_sts` suffix for personal skills | Distinguishes from system skills | Prefix `sts-` |
| Store in separate toolkit directory | Sandbox resets don't affect it | Store in home directory |
| Keep both phi-layout_sts and zai-ui-composer_sts | They're complementary (HOW vs WHAT) | Merge into one skill |

#### Best Practices Discovered

1. **Git in submodules**: Use `git -C /path/to/repo` instead of `cd`
   - When: Working with nested git repositories
   - Example: `git -C /home/z/my-project/Zai-agent-toolkit push origin main`

2. **Skill ID format**: ZAI-<DOMAIN>-<NUMBER>
   - Domains: META, DEV, GIT, HEALTH, SESSION, STS, SEC, ARCH, QA, SDK
   - Example: ZAI-HEALTH-001, ZAI-STS-006

3. **System vs Personal skills separation**:
   - System: `/home/z/my-project/skills/` (overwritten on reset)
   - Personal: `/home/z/my-project/Zai-agent-toolkit/skills/` (persistent)

#### Open Issues

- None currently

#### Files Modified

| File | Changes |
|------|---------|
| `skills/git-safe-ops/SKILL.md` | Added ID: ZAI-GIT-001 |
| `skills/git-checkpoint/SKILL.md` | Added ID: ZAI-GIT-002 |
| `skills/health-check/SKILL.md` | Added ID: ZAI-HEALTH-001 |
| `skills/api-retry/SKILL.md` | Added ID: ZAI-HEALTH-002 |
| `skills/fallback/SKILL.md` | Added ID: ZAI-HEALTH-003 |
| `skills/session-handoff/SKILL.md` | Added ID: ZAI-SESSION-001 |
| `skills/commit-work/SKILL.md` | Added ID: ZAI-DEV-004 |
| `skills/frontend-styling-expert_sts/SKILL.md` | New, ID: ZAI-STS-004 |
| `skills/performance-code-generator_sts/SKILL.md` | New, ID: ZAI-STS-003 |
| `skills/phi-layout_sts/SKILL.md` | New, ID: ZAI-STS-005 |
| `skills/zai-ui-composer_sts/SKILL.md` | New, ID: ZAI-STS-006 |
| `skills/sync-toolkit_sts/SKILL.md` | Fixed trailing whitespace |

---

## Best Practices

### Git Operations

- **Submodule commits**: Use `git -C /path/to/submodule` for operations
- **Push after commit**: Always push submodule changes, then update parent reference

### Skill Development

- **ID Assignment**: Check `docs/skill-id-registry.md` for next available ID
- **Domain Selection**: Use appropriate domain (DEV, GIT, HEALTH, etc.)
- **Personal Skills**: Use `_sts` suffix and store in toolkit directory

### CI/CD

- **Trailing Whitespace**: Always check for ` $` patterns before pushing
- **Required Files**: Ensure all files in validation workflow exist

---

## Common Problems

### CI Failing: Toolkit Validation

**Symptoms**: "Check no trailing whitespace" fails

**Solution**:
```bash
grep -rn ' $' skills/ instructions/
# Fix any matches found
```

### Git Operations in Submodule Fail

**Symptoms**: "no changes added to commit" when files are modified

**Solution**:
```bash
# Instead of:
cd /path/to/submodule && git add -A

# Use:
git -C /path/to/submodule add -A
```

### System Skills Overwritten

**Symptoms**: Custom skills disappear after sandbox restart

**Solution**: Store personal skills in `Zai-agent-toolkit/skills/` with `_sts` suffix

---

## Decisions Archive

### 2026-05-17: Skill ID System

**Decision**: Use ZAI-<DOMAIN>-<NUMBER> format for all skills

**Rationale**:
1. Easy to reference and search
2. Domain grouping for organization
3. Sequential numbering within domains

**Consequences**:
- Positive: Clear organization, easy reference
- Negative: Need to maintain registry

---

## Skill ID Registry

| ID | Skill | Domain | Status |
|----|-------|--------|--------|
| ZAI-META-001 | skill-id-system | META | Active |
| ZAI-META-002 | skill-creator | META | Active |
| ZAI-SEC-001 | sanitize-validate | SEC | Active |
| ZAI-DEV-002 | anti-monolith | DEV | Active |
| ZAI-DEV-003 | project-clone | DEV | Active |
| ZAI-DEV-004 | commit-work | DEV | Active |
| ZAI-GIT-001 | git-safe-ops | GIT | Active |
| ZAI-GIT-002 | git-checkpoint | GIT | Active |
| ZAI-HEALTH-001 | health-check | HEALTH | Active |
| ZAI-HEALTH-002 | api-retry | HEALTH | Active |
| ZAI-HEALTH-003 | fallback | HEALTH | Active |
| ZAI-SESSION-001 | session-handoff | SESSION | Active |
| ZAI-SESSION-002 | session-log | SESSION | Active |
| ZAI-STS-001 | prompt-engineering_sts | STS | Active |
| ZAI-STS-002 | sync-toolkit_sts | STS | Active |
| ZAI-STS-003 | performance-code-generator_sts | STS | Active |
| ZAI-STS-004 | frontend-styling-expert_sts | STS | Active |
| ZAI-STS-005 | phi-layout_sts | STS | Active |
| ZAI-STS-006 | zai-ui-composer_sts | STS | Active |

---

Built with: Z.ai Agent Toolkit
