# Standard: GitHub v1.0

> ID: STD-GIT-001
> Version: 1.2
> Level: **[C] Critical**
> Reference: https://www.conventionalcommits.org/

---

## 1. Commit Format

### 1.1 Conventional Commits (Required)

All commit messages MUST follow [Conventional Commits v1.0](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 1.2 Types

| Type | Purpose | Example |
|------|---------|---------|
| `feat` | New feature | `feat(button): add size="lg" variant` |
| `fix` | Bug fix | `fix(tabs): correct aria-selected on rerender` |
| `refactor` | Code restructuring, no behavior change | `refactor(tokens): move contrast utils to separate file` |
| `docs` | Documentation only | `docs(standards): add WCAG 2.1 AA compliance` |
| `style` | Formatting, whitespace, no logic change | `style(card): fix indentation` |
| `test` | Adding or updating tests | `test(button): add keyboard navigation tests` |
| `chore` | Build, tooling, CI, dependencies | `chore(deps): update react to 19.1` |
| `perf` | Performance improvement | `perf(grid): memoize layout calculations` |
| `ci` | CI/CD configuration | `ci: add accessibility audit step` |
| `build` | Build system changes | `build(tsup): add minification` |

### 1.3 Scopes

Scope = layer or package affected:

```
tokens, ui, sections, features, hooks, providers, cli, eslint-plugin,
browser, create-app, theme, layout, a11y, docs, standards
```

### 1.4 Rules

- Description in **imperative mood**: "add feature" NOT "added feature"
- Description in **English** always (per Language Rule)
- No period at end
- Lowercase first letter
- Max 72 characters in first line
- Body: explain WHY, not WHAT (diff shows WHAT)

**Examples:**

```bash
# Good
feat(sections): add hero-section with 3 variants
fix(theme): correct contrast ratio for muted-foreground on Zinc
refactor(docs): consolidate standards into docs/standards/

# Bad
update stuff
fixed bug
Added new component
feat: add feature.  # no period
feat(ui): This component does X and Y and Z...  # too long
```

---

## 2. Branch Naming

### 2.1 Format

```
<type>/<ticket>-<short-description>
```

| Type | Purpose | Example |
|------|---------|---------|
| `feat/` | New feature | `feat/wcag-contrast-audit` |
| `fix/` | Bug fix | `fix/tabs-keyboard-nav` |
| `refactor/` | Code restructuring | `refactor/docs-consolidation` |
| `docs/` | Documentation | `docs/github-standard` |
| `chore/` | Tooling, CI | `chore/update-deps` |
| `release/` | Release preparation | `release/v1.2.0` |

### 2.2 Rules

- Lowercase, hyphens only (no underscores, no camelCase)
- Max 50 characters
- Short description: 2-4 words
- No ticket number = use descriptive name

---

## 3. Forbidden Operations

### 3.1 CRITICAL: Never Do This

| Operation | Why Forbidden | Alternative |
|-----------|---------------|-------------|
| `git pull --rebase` | Blocks Z.ai sandbox on conflict | `git push --force-with-lease` |
| `git push --force` | Overwrites remote without safety | `git push --force-with-lease` |
| `git pull` after remote URL change | Creates unnecessary conflicts | `git push --force-with-lease` |
| `git reset --hard` without backup | Data loss | Backup first (see Section 4) |
| Direct push to `main` for experiments | No review, no rollback | Use branch + PR/merge |
| Commit secrets/tokens | Security breach | Use `.env.example` + `.gitignore` |
| `git add .` for partial changes | Stages unrelated files | `git add -p` or explicit paths |
| Amend published commits | Rewrites shared history | New commit instead |

### 3.2 WARNING: Avoid Without Good Reason

| Operation | Risk | When OK |
|-----------|------|---------|
| `git merge` (vs rebase) | Messy history | Release branches only |
| `git rebase -i` on shared branch | Rewrites others' commits | Only on your own branch |
| `git cherry-pick` | Duplicate commits | Hotfixes only |
| Force push to feature branch | Team disruption | Solo work only |

---

## 4. Backup Before Rewrite

Before ANY operation that rewrites history (rebase, merge, pull, reset --hard):

```bash
# Step 1: Stash uncommitted work
git stash push -m "pre-op-backup"

# Step 2: Copy packages (most valuable code)
cp -r packages/ /tmp/stsgs-backup/

# Step 3: Save git log reference
git log --oneline -20 > /tmp/git-log-backup.txt
```

### 4.1 Recovery from Git Lockup

If a previous session left git in blocked state:

```bash
rm -rf .git/rebase-merge .git/rebase-apply
git reset --hard HEAD
```

### 4.2 No Panic Diagnostics

Before telling user data is lost, check ALL 5 paths:

1. `ls packages/ui/src/` — do files exist?
2. `ls .git/rebase-merge/` — is rebase paused?
3. `git reflog` — are commits referenced?
4. `ls /tmp/stsgs-backup-*/` — were backups created?
5. `git fsck --lost-found` — dangling objects?

NEVER say "permanently lost" until all 5 checks are exhausted.

---

## 5. Push Policy

### 5.1 Push Frequency

Push after every significant change. Do not accumulate half-finished work locally.

| Situation | Action |
|-----------|--------|
| Feature or fix completed | Push immediately |
| End of work session | Push even if unfinished |
| CI red | Push OK, fix soon |
| Experimental branch | Push immediately, do not merge without review |
| Token expired | Update token, update remote URL, push |

**Minimum:** 1 push at end of every session.

**Formula:**

```
work -> commit -> push -> peace of mind
```

### 5.2 Checkpoint System

Do NOT wait until session end. Create checkpoints during work systematically.

| Checkpoint Type | When | Commit Format |
|-----------------|------|---------------|
| **WIP** | Every 15-20 min during active work | `chore(wip): checkpoint -- <task-id> in progress` |
| **Milestone** | Logical unit completed | `feat(ui): add button component` |
| **Pre-risk** | Before risky operation (refactor, delete) | `chore: checkpoint before <operation>` |
| **Session End** | End of session | `chore: session checkpoint` |

**WIP Checkpoint Rules:**

- Even incomplete work gets committed
- Prefix with `chore(wip):` to signal "work in progress"
- Push immediately after commit
- Log to worklog.md

**Example workflow:**

```bash
# After 15-20 min of work
git add -A
git commit -m "chore(wip): checkpoint -- task 2-a in progress"
git push --force-with-lease origin main

# Continue working...
```

### 5.3 Recovery Tags

Before operations that might need rollback:

```bash
# Create recovery point
git tag checkpoint-<task-id>-before-<operation>
git push origin checkpoint-<task-id>-before-<operation>

# Example
git tag checkpoint-2a-before-refactor
git push origin checkpoint-2a-before-refactor

# Perform risky operation...

# If something goes wrong, rollback
git reset --hard checkpoint-2a-before-refactor
git push --force-with-lease origin main
```

**Tag naming convention:**

```
checkpoint-<task-id>-before-<operation>
checkpoint-<task-id>-after-<operation>  (optional, for verification)
```

### 5.4 Force Push Rules

| Command | Status | Reason |
|---------|--------|--------|
| `git push --force-with-lease origin main` | CORRECT | Safe force push with remote check |
| `git push --force origin main` | AVOID | No safety check, overwrites silently |
| `git push --force-with-lease origin <branch>` | OK | Feature branch force push after rebase |

---

## 6. Versioning and Tags

### 6.1 Semantic Versioning

All releases MUST follow [SemVer 2.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

| Change | Bump | Example |
|--------|------|---------|
| Breaking API change | MAJOR | 1.x.x -> 2.0.0 |
| New feature (backward compatible) | MINOR | 1.2.x -> 1.3.0 |
| Bug fix (backward compatible) | PATCH | 1.2.3 -> 1.2.4 |

### 6.2 Tagging

```bash
# Annotated tag (required)
git tag -a v1.2.0 -m "feat: add hero-section with 3 variants"

# Push tag
git push origin v1.2.0
```

Rules:
- Tags MUST be annotated (`-a`), not lightweight
- Tag format: `v` + semver (e.g., `v1.2.0`)
- No pre-release tags without team agreement

### 6.3 Changelog

Every release MUST update `CHANGELOG.md` with:

```markdown
## [1.2.0] - 2025-01-15

### Added
- hero-section with 3 variants

### Fixed
- Contrast ratio for muted-foreground on Zinc theme

### Changed
- Consolidated docs into docs/ directory
```

---

## 7. Branch Protection

### 7.1 Main Branch

- No direct pushes (use PR or merge from feature branch)
- CI must pass before merge
- At least 1 review required (when team grows)
- Squash merge preferred (clean history)

### 7.2 Feature Branches

- Auto-delete after merge
- Prefix with type (feat/, fix/, refactor/)
- One feature per branch — no mixed changes

### 7.3 Release Branches

- `release/vX.Y.Z` for release preparation
- Only bug fixes and docs on release branches
- Merge back to main after release

---

## 8. .gitignore Requirements

These MUST be in `.gitignore`:

```gitignore
# Secrets
.env
.env.local
.env.*.local

# Dependencies
node_modules/

# Build
dist/
.next/
.turbo/

# Database
*.db
*.db-journal

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
dev.log

# Uploads (user content, not code)
upload/
```

### 8.1 Required in Repository

These MUST be committed:

```text
.env.example        # Safe defaults, no real secrets
.eslintrc.*         # Linting configuration
.prettierrc         # Formatting configuration
```

---

## 9. GitHub-Specific

### 9.1 Repository Settings

| Setting | Value | Reason |
|---------|-------|--------|
| Default branch | `main` | Standard convention |
| Allow force push | Disabled on `main` | Prevent history rewrite |
| Allow deletion | Disabled on `main` | Prevent accidental removal |
| Issues | Enabled | Track bugs and features |
| Wiki | Disabled | Use docs/ instead |
| Discussions | Enabled | Community questions |

### 9.2 Issue Labels

| Label | Color | Purpose |
|-------|-------|---------|
| `bug` | Red | Something broken |
| `feature` | Green | New functionality |
| `a11y` | Blue | Accessibility |
| `breaking` | Orange | Breaking change |
| `docs` | Gray | Documentation |
| `good first issue` | Light green | Onboarding |
| `wontfix` | Dark gray | Not fixing |

### 9.3 PR Checklist

Every PR MUST pass this checklist:

- [ ] Conventional commit format
- [ ] No secrets in diff
- [ ] CI passes
- [ ] CHANGELOG.md updated (for user-facing changes)
- [ ] Docs updated (if behavior changed)
- [ ] WCAG checklist passed (if UI changed)
- [ ] No new `any` types
- [ ] Barrel exports updated (if new module)

---

## 10. Sandbox Z.ai Git Rules

The Z.ai sandbox has specific constraints:

- **Shared filesystem**: All chat sessions share the same filesystem
- **Process mortality**: Background processes die when chat ends
- **No cross-chat process sharing**: Cannot control processes from other chats
- **Local changes = data loss risk**: Always push before session ends

### 10.1 Session Start Checklist

```bash
# Check if git is in a blocked state
ls .git/rebase-merge/ 2>/dev/null && echo "REBASE BLOCKED"
git status

# If blocked, recover
rm -rf .git/rebase-merge .git/rebase-apply
git reset --hard HEAD
```

### 10.2 Session End Checklist

```bash
# Commit everything
git add -A
git commit -m "chore: session checkpoint"

# Push always
git push --force-with-lease origin main
```

### 10.3 Deadlock Problem

Sandbox performs automatic `git pull` / `git merge` on session restart. If local repository state diverges from remote (unpushed commits, uncommitted files, dirty working tree) — a merge conflict occurs.

Merge conflict blocks `git status` (exit code != 0). Infrastructure uses `git status` as pre-check before executing ANY tool (Bash, Read, Write, Edit, Glob, Grep, etc.). Result: **complete deadlock** — no tool can execute, including tools to fix the conflict itself.

**Vicious cycle:**
```
git status -> merge conflict -> exit code != 0
-> tool pre-check fails -> tool blocked
-> cannot fix merge -> git status still fails
-> DEADLOCK
```

### 10.4 Mandatory Rules to Prevent Deadlock

#### Rule 1: Push After Every Stage

Each completed stage of work = commit + push. No exceptions.

```bash
git add -A
git commit -m "stage: description"
git push origin main
```

**Forbidden:**
- Accumulating multiple stages in one commit
- Making commit without subsequent push
- Leaving uncommitted files when moving to next task

#### Rule 2: Checklist Before Session End

Before session closes / breaks / restarts:

```bash
# 1. All changes committed?
git status
# Expected: "nothing to commit, working tree clean"

# 2. All commits pushed?
git log --oneline -5
# Compare with remote:
git log origin/main..HEAD
# Expected: empty (no unpushed commits)

# 3. Final push
git push origin main

# 4. Re-check
git status
# Expected: "nothing to commit, working tree clean"
```

#### Rule 3: Dirty Working Tree = No Stop

If `git status` shows uncommitted changes — session MUST NOT interrupt without prior commit + push. If session breaks unexpectedly — first command on next start: `git status` to check.

#### Rule 4: One Task = One Commit + Push

```
Task -> code -> test -> git add -> git commit -> git push -> next task
```

Not "10 tasks -> 1 commit -> push", but "1 task -> 1 commit -> 1 push".

### 10.5 Deadlock Recovery Procedure

If deadlock already occurred (all tools blocked):

**Level 1 - Manual Terminal (if available):**
```bash
rm -f .git/MERGE_HEAD .git/MERGE_MSG .git/MERGE_MODE
git reset --hard HEAD
git status  # check if clean
git push origin main --force  # if needed to sync with remote
```

**Level 2 - Sandbox Restart:**
- All code is on GitHub (if push rules were followed)
- Sandbox will clone fresh repository on clean start
- Merge conflict won't occur since starting state = remote

**Level 3 - Nuclear Reset (if Level 1 and 2 don't help):**
```bash
mv .git .git.broken
git init
git remote add origin <remote-url>
git fetch origin
git reset origin/main
```

### 10.6 Signs of Standard Violation

| Sign | Meaning | Action |
|------|---------|--------|
| `git status` != clean before restart | Deadlock risk | Immediate commit + push |
| `git log origin/main..HEAD` != empty | Unpushed commits | Immediate push |
| Commits without push at session end | Conflict on restart | Push before ending |
| `git status` shows "needs merge" | Deadlock already started | Recovery procedure |

### 10.7 Integration with Other Standards

- **STD-FE-001** (Anti-Monolith): after file refactoring -> commit + push
- **Worklog**: after updating worklog.md -> commit + push
- **New skill/documentation**: after creation -> commit + push

**Principle:** any action changing filesystem must end with commit + push before moving to next action.

### 10.8 AI Agent Checklist (mandatory before each stage)

```
[ ] Code written/changed
[ ] git add -A
[ ] git commit -m "description"
[ ] git push origin main
[ ] git status -> clean
[ ] Logged to worklog.md
[ ] git add worklog.md && git commit && git push (if worklog updated)
```

---

## 11. Log Everything

After every git operation, log to `worklog.md`:

```markdown
### Git Operation: <operation>
- **Before**: <hash>
- **After**: <hash>
- **Result**: success / failed / conflicted
- **Details**: <what happened>
```

---

## 12. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01 | Initial version: Conventional Commits, branching, forbidden operations, backup rules |
| 1.1 | 2025-05 | Added Checkpoint System (WIP, Milestone, Pre-risk, Recovery Tags); systematic versioning during work |
| 1.2 | 2025-05 | Added Deadlock Problem section, mandatory push rules, recovery procedures, violation signs, AI agent checklist |

---

Built with: Git + Conventional Commits + SemVer 2.0 + GitHub
