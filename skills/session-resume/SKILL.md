---
name: session-resume
version: 1.0
description: >
  Resume work in Z.ai sandbox after session restart, context loss, or chat break.
  Automatically checks git state, restarts dev server, reads worklog, and reports
  current status. Activate at the start of every new session, after "session restart",
  or when agent loses context. Also use when user says "continue", "where were we",
  "what's the status", or any indication of returning to previous work.
---

# Session Resume for Z.ai Sandbox

## Why this matters

In Z.ai sandbox, each chat session has its own shell process. When a session ends:
- The dev server dies (~5 min inactivity timeout)
- Git may be left in a dirty or blocked state
- All context about what was being done is lost
- Files on disk remain, but process state is gone

Without a systematic resume procedure, the agent starts blind — not knowing what
the project state is, whether git is blocked, or what task was in progress.

---

## Resume Protocol (6 Steps)

### Step 1: Check Git State

Before doing anything else, verify git is not in a blocked state:

```bash
# Check for deadlock indicators
ls .git/rebase-merge/ 2>/dev/null && echo "CRITICAL: Rebase in progress"
ls .git/rebase-apply/ 2>/dev/null && echo "CRITICAL: Rebase in progress"
ls .git/MERGE_HEAD 2>/dev/null && echo "CRITICAL: Merge in progress"
ls .git/*.lock 2>/dev/null && echo "WARNING: Lock files exist"

# Quick status check
git status
```

**Decision matrix:**

| State | Action |
|-------|--------|
| Clean working tree | Proceed to Step 2 |
| Rebase/merge in progress | Recover: `rm -rf .git/rebase-merge .git/rebase-apply; git reset --hard HEAD` |
| Lock files exist | Remove: `rm -f .git/*.lock` |
| Uncommitted changes | Review with `git diff --stat`, then commit or stash |

### Step 2: Sync with Remote

```bash
# Fetch latest (safe — does not modify working tree)
git fetch origin

# Check divergence
git log HEAD..origin/main --oneline
# If NOT empty: remote is ahead

git log origin/main..HEAD --oneline
# If NOT empty: local is ahead (unpushed commits)
```

**Decision matrix:**

| State | Action |
|-------|--------|
| Local and remote in sync | Proceed |
| Local ahead | `git push --force-with-lease origin main` |
| Remote ahead (your project) | `git reset --hard origin/main` |
| Remote ahead (shared project) | Review remote changes first |

### Step 3: Read Worklog

```bash
# Check if worklog exists
ls -la worklog.md 2>/dev/null || echo "No worklog found"

# If exists, read the Current State section and last 30 lines
head -50 worklog.md
tail -30 worklog.md
```

Extract from worklog:
- Active task and task ID
- Last completed step
- Known issues or blockers
- Dev server status (likely down after session break)

### Step 4: Restart Dev Server

```bash
# Kill any leftover process
pkill -f 'next dev' 2>/dev/null
sleep 1

# Start with disown for survival
cd /home/z/my-project && npx next dev -p 3000 </dev/null >/tmp/zdev.log 2>&1 & disown

# Wait for compilation
sleep 6

# Verify (always use 127.0.0.1)
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/
```

**Expected:** HTTP 200. If 000 — server not ready, check `/tmp/zdev.log`.

### Step 5: Verify Project Integrity

```bash
# Check dependencies
ls node_modules/.package-lock.json 2>/dev/null || echo "Dependencies missing — run bun install"

# Check database
ls prisma/schema.prisma 2>/dev/null && echo "Prisma schema found" || echo "No Prisma"

# Check environment
ls .env 2>/dev/null || echo "No .env — copy from .env.example"

# Quick compile check
npx next build 2>&1 | head -20
```

### Step 6: Report Status to User

After completing Steps 1-5, report:

```
## Session Resumed

**Git:** [clean / dirty / recovered from deadlock]
**Remote:** [synced / X commits ahead / X commits behind]
**Dev Server:** [running on :3000 / down / error]
**Active Task:** [from worklog or "unknown"]
**Known Issues:** [from worklog or "none"]
**Next Step:** [recommendation based on context]

Ready to continue. What would you like to work on?
```

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `git status` hangs | Middleware deadlock | New session + `rm -rf .git/rebase-merge; git reset --hard HEAD` |
| Dev server returns 000 | Not compiled yet | Wait 10s, retry |
| Dev server returns 500 | Build error | Check `/tmp/zdev.log` |
| `node_modules` missing | New clone | `bun install` |
| `.env` missing | Not set up | `cp .env.example .env` |
| Worklog not found | First session | Create from template |
| Prisma client error | Schema changed | `bunx prisma generate && bunx prisma db push` |

---

## When to Use This Skill

| Trigger | Action |
|---------|--------|
| New chat session starts | Full 6-step protocol |
| User says "continue" | Steps 1, 3, 6 (quick resume) |
| User says "where were we?" | Steps 3, 6 (status check) |
| After git deadlock recovery | Steps 1-6 (full verification) |
| After dev server crash | Steps 4, 5, 6 (server focus) |
| Session timeout warning | Steps 1-3 (save state before loss) |

---

## Integration with Other Skills

- **git-safe-ops**: Use before any git operations during resume
- **git-checkpoint**: Create recovery tag before risky operations
- **dev-watchdog**: Use for ongoing server monitoring after resume
- **health-check**: Verify API availability after server restart

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
