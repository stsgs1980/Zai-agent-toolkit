# Standard: Z.ai Integration v1.1 (EN)

> ID: STD-ENV-002
> Version: 1.1
> Level: **[C] Critical**
> Related: REPRODUCIBILITY-STANDARD (STD-ENV-001), SANDBAX_RULES

---

## 1. Introduction

This standard defines rules and best practices for AI agent operation within the Z.ai sandbox environment. It ensures consistent, safe, and reproducible behavior across all Z.ai chat sessions.

---

## 2. Sandbox Environment Constraints

The Z.ai sandbox has specific characteristics that affect all operations:

| Constraint | Impact | Mitigation |
|-----------|--------|------------|
| Shared filesystem | Files from one chat visible in all chats | Use project-specific directories |
| Chat = Shell process | Processes die when chat ends | Use `disown` for background processes |
| Process mortality | Background processes die after ~5 min inactivity | Watchdog with cron every 5 min |
| No cross-chat process sharing | Cannot control processes from other chats | File-based coordination |
| Git lockup possible | Previous chat may leave git blocked | Recovery protocol defined below |

---

## 3. Project Directory

All projects MUST reside in `/home/z/my-project/`:

- This is the designated sandbox working directory
- Do NOT create project clones in other directories
- All relative paths in configs must resolve from this directory
- Output files go to `/home/z/my-project/download/`
- Dev server logs go to `/tmp/zdev.log`

---

## 4. Git Operations in Sandbox

### 4.1 Backup Before Rewrite

Before any git operation that rewrites history (rebase, merge, pull, reset --hard):

```bash
git stash push -m "pre-op-backup"
cp -r src/ /tmp/src-backup/
git log --oneline -20 > /tmp/git-log-backup.txt
```

### 4.2 Force Push Over Rebase

- `git push --force-with-lease origin main` -- CORRECT
- `git push --force origin main` -- AVOID
- `git pull --rebase` -- FORBIDDEN (blocks sandbox on conflict)

### 4.3 Git Lockup Recovery

If a previous chat left git in a blocked state:

```bash
rm -rf .git/rebase-merge .git/rebase-apply
git reset --hard HEAD
```

This must be done from a NEW chat session.

---

## 5. Dev Server Protocol

### 5.1 Startup

```bash
pkill -f 'next dev' 2>/dev/null
sleep 1
cd /home/z/my-project && npx next dev -p 3000 </dev/null >/tmp/zdev.log 2>&1 & disown
sleep 6
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/
```

### 5.2 Rules

- Always use `disown` after backgrounding
- Always use `npx next dev`, NOT `bun run dev`
- Always redirect output: `>/tmp/zdev.log 2>&1`
- Always close stdin: `</dev/null`
- Always use `127.0.0.1` for health checks (not `localhost`)

### 5.3 Health Check Response Codes

| Code | Action |
|------|--------|
| 200 | Server running, proceed |
| 000 | Server down, restart |
| 500 | Server error, check logs |

---

## 6. Session Continuity

### 6.1 Context Preservation

When a session is interrupted or context is lost:

1. Read `worklog.md` for previous session history
2. Check git state: `git log --oneline -10` and `git status`
3. Verify dev server status
4. Report current state to user before continuing

### 6.2 Worklog Protocol

- Every agent MUST append work records to `worklog.md`
- Format: Task ID, agent name, work log, stage summary
- NEVER overwrite existing worklog entries
- Use `/home/z/my-project/worklog.md` as the canonical location

---

## 7. File Safety

### 7.1 Auto-Backup

Before any write mutation on critical files:
- Create a backup copy in `/tmp/`
- Log the backup location in worklog.md

### 7.2 Safe Delete

Before deleting any entity:
- Verify with user via confirmation dialog
- Archive instead of hard-delete when possible

---

## 8. API Communication

### 8.1 z-ai-web-dev-sdk

- Use `z-ai-web-dev-sdk` for AI model interactions
- MUST be used in backend code only (never client-side)
- Import: `import ZAI from 'z-ai-web-dev-sdk'`

### 8.2 Retry Strategy

When calling chat.z.ai:
- Exponential backoff: 2s initial, 2x multiplier
- Max 3 retries
- Retryable: 502, 503, 504
- Non-retryable: 401, 403, 404

---

## Version History

| Version | Date | Changes |
|--------|------|---------|
| 1.1 | 2026-05-14 | Added SDK Integration section with 10 usage rules |
| 1.0 | 2026-05 | Initial standard extracted from AGENT_RULES.md |

---

## v1.1 -- SDK Integration (2026-05-14)

### SDK Usage Rules

1. **Backend-only**: z-ai-web-dev-sdk MUST only be used in API routes (app/api/), never in client components
2. **Singleton Pattern**: Create a single ZAI instance and reuse it across requests
3. **Error Propagation**: All SDK errors must propagate through the api-retry skill
4. **Health Check**: Verify chat.z.ai availability via health-check skill before SDK calls
5. **Fallback Chain**: When SDK fails, use fallback skill to switch providers
6. **Image Generation**: Use z-ai-generate CLI for website assets (favicon, logo, backgrounds)
7. **Web Search**: Use zai.functions.invoke("web_search", {...}) for real-time data
8. **Type Safety**: Always type API responses with TypeScript interfaces
9. **Timeout**: Set explicit timeouts (30s for chat, 60s for image generation)
10. **Logging**: Log all SDK interactions to worklog.md with request/response metadata

---

**Document complies with MARKDOWN_STANDARD v2.1 (level [W])**

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
