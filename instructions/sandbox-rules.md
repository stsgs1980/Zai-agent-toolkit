# Sandbox Rules

## Instruction for AI Agent Behavior

Rules specific to the Z.ai sandbox environment. These rules exist because the
sandbox has unique constraints that differ from a normal development environment.

---

## 1. Shared Filesystem

All chat sessions share the same filesystem:

- Files created in one chat are visible in all other chats
- There is NO isolation between chat sessions on disk
- `/home/z/my-project/` is the designated working directory for ALL chats
- Do NOT create project clones in other directories

**Implication:** If you need to recover from a previous session, the files are
still there. Check before recreating.

## 2. Shell Process Lifecycle

Each chat session has its own shell process:

- When the chat session ends, the shell process dies
- When the shell process dies, all child processes (dev servers, watchers) also die
- Files on disk survive shell death -- only processes are killed
- A new chat gets a new shell process but the same filesystem

**Implication:** A dev server started in one chat will NOT survive into a new chat.
Always check server status at session start and restart if needed.

## 3. Recovery from Git Lockup

If a previous chat left git in a blocked state (e.g., `needs merge`,
`rebase in progress`, `you need to resolve your current index first`):

```bash
# ONLY from a NEW chat session (the old one is blocked)
rm -rf .git/rebase-merge .git/rebase-apply
rm -f .git/MERGE_HEAD .git/MERGE_MSG .git/index.lock
git reset --hard HEAD
```

**Warning:** Do NOT attempt `git rebase --continue` or `git merge --continue`
when the environment is blocked. These commands require resolving conflicts,
which is impossible when all tools are locked by git hooks.

**Why from a new chat:** The old chat's shell process may have a git lock that
prevents any command from executing. A new chat has a clean shell process.

## 4. Startup Checklist

When entering a project (new chat, session restart), complete this checklist
BEFORE starting any work:

### Step 1: Git Status

```bash
cd /home/z/my-project
git status
git log --oneline -5
git remote -v
```

- If git is blocked (needs merge/rebase): apply recovery procedure (Section 3)
- If git is clean: proceed to Step 2

### Step 2: Dev Server

```bash
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/
# 200 = alive, 000 = dead
```

- If alive (200): proceed to Step 3
- If dead (000): start server with Standard Start protocol:

```bash
pkill -f 'next dev' 2>/dev/null
sleep 1
cd /home/z/my-project && npx next dev -p 3000 </dev/null >/tmp/zdev.log 2>&1 & disown
sleep 6
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/
```

### Step 3: Verify Project State

```bash
ls src/app/page.tsx
ls prisma/schema.prisma 2>/dev/null
```

- If files exist: project is intact, ready to work
- If files missing: check `/tmp/src-backup-*/` for recovery

### Step 4: Report

Report current state to user:
- Git branch, last commit, any uncommitted changes
- Server status (alive/dead, port)
- Project files status (intact/missing)

---

## Quick Reference

| Symptom | Cause | Fix |
|---------|-------|-----|
| All git commands blocked | Previous chat left rebase/merge | Recovery from new chat (Section 3) |
| Dev server returns 000 | Process died with chat | Standard Start with `disown` |
| Files missing after restart | Sandbox preserved git, not process | Check `/tmp/` backups or `git checkout` |
| `bun run dev` dies fast | Bun wrapper instability | Use `npx next dev` instead |
| `localhost` fails in curl | IPv6 resolution in sandbox | Use `127.0.0.1` instead |
| Server dies after ~5 min | Sandbox process timeout | Watchdog cron every 5 min |

---
Built with: Python + PowerShell + Markdown
