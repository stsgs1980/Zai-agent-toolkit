# Agent Rules

> Toolkit version: **v1.8.3**
>
> Mandatory rules for AI agents working with this toolkit.
> Read before starting work on any project.

---

## 0. Onboarding Protocol

When entering a project (new chat, session restart, context loss),
you MUST complete the onboarding protocol before starting any work:

1. Read `AGENT_RULES.md` (this file)
2. Read `PROJECT_CONFIG.md` (project-specific settings) -- if exists
3. Read `worklog.md` (previous session history)
4. Check git state: `git log --oneline -10` and `git status`
5. Verify project state per `PROJECT_CONFIG.md` (dev server, paths)
6. Scan project structure
7. Report current state to user

See `instructions/onboarding-protocol.md` for full details.
NEVER start coding or modifying files before completing Steps 1-3.

## 1. Language Rule

Always respond in the user's language. If the user writes in Russian, respond in Russian. If in English, respond in English. Never switch languages without explicit request.

- Code, file paths, terminal commands, git commit messages - always English
- Chat messages, explanations, worklog - match user's language
- Before each response verify: "Am I writing in the same language as the user?"

## 2. Git Workflow Rules

### 2.1 Backup Before Rewrite

Before any git operation that rewrites history (rebase, merge, pull, reset --hard):

1. `git stash push -m "pre-op-backup"`
2. `cp -r src/ /tmp/src-backup/`
3. `git log --oneline -20 > /tmp/git-log-backup.txt`

### 2.2 Force Push Over Rebase

When `git push` is rejected (diverged branches):

- `git push --force-with-lease origin main` - CORRECT
- `git push --force origin main` - AVOID (overrides remote without safety check)
- `git pull --rebase` - FORBIDDEN (blocks sandbox environment on conflict)

### 2.3 Never Pull After Remote URL Change

After `git remote set-url origin <url>`:

- `git push --force-with-lease origin main` - CORRECT
- `git push --force origin main` - AVOID (no safety check)
- `git pull` - FORBIDDEN (creates unnecessary conflicts)

### 2.4 No Panic Diagnostics

Before telling the user data is lost, check ALL 5 paths:

1. `ls src/app/` - do files exist?
2. `ls .git/rebase-merge/` - is rebase paused?
3. `git reflog` - are commits referenced?
4. `ls /tmp/src-backup-*/` - were backups created?
5. `git fsck --lost-found` - dangling objects?

NEVER say "permanently lost" until all 5 checks are exhausted.

### 2.5 Log Everything

After every git operation, log to `worklog.md`: operation, hash before/after, result.

## 3. Project Environment

Project-specific settings are defined in **`PROJECT_CONFIG.md`**.
If that file exists, it contains:

- Stack signature (e.g., `Built with: Next.js 16 + TypeScript + Tailwind CSS`)
- Dev server command and port
- Project paths (entry points, config locations)
- Environment-specific notes

If `PROJECT_CONFIG.md` does not exist, the agent MUST ask the user
for the stack and project structure before proceeding.

## 4. Code Standards

This toolkit enforces the following standards. All files referenced below
are in the `standards/` directory.

### 4.1 Unicode Policy v2.1

> File: `standards/UNICODE_POLICY.md`
> Levels: **[C] Critical** (code, UI) + **[W] Warning** (AI-communication, docs) + **[I] Info** (prototypes, internal)

Prohibits emoji and Unicode graphic characters in:
- Source code and UI text **[C]**
- AI agent chat responses **[W]** -- user messages are NOT regulated
- Project documentation **[W]** (subject to MARKDOWN_STANDARD)

Exceptions:
- `(ref)` marking in tables and code blocks for identification purposes
- Typographic characters (em dash, copyright, degree) in plain text only
- Cyrillic characters in Russian-language content

### 4.2 MARKDOWN_STANDARD v2.1

> File: `standards/MARKDOWN_STANDARD.md`
> Level: **[W] Warning**

Governs formatting of all .md files in the project:
- ASCII + Cyrillic + typographic characters in text
- No Unicode in headings, code, or tables (except `(ref)`)
- 4 backticks for nested code blocks, language tags required
- Dash `-` for unordered lists
- Stack signature format: `Built with: <project technologies>`
  (default value defined in `standards/README_TEMPLATE.md`)

### 4.3 Reproducibility Standard

> File: `standards/REPRODUCIBILITY-STANDARD.md`
> Level: **[C] Critical**

Ensures `clone + install + dev = works` on any machine. Key rules:
- `.env.example` required with all variables and safe defaults
- Relative paths only (no `/home/`, `http://localhost:` in code)
- SQLite: `connection_limit=1`, relative path via `path.resolve()`
- Error handling: generic messages to client, no Prisma error leakage
- Anti-fragility: non-critical ops must not break critical ones
- Dark theme required via CSS variables
- No dead packages in dependencies
- Auto-backup before every write mutation
- Deduplication-first on all create endpoints
- Safe delete with explicit confirmation for all entities

See the full document for 11 rules across 4 levels (Environment, Code, Delivery, Process).

### 4.4 Implementation Order

Standards must be applied in a specific order.
See `standards/IMPLEMENTATION_ORDER.md` for the full 6-step sequence.

### 4.5 Frontend Development Standard

> File: `standards/FRONTEND_STANDARD.md`
> Level: **[C] Critical**

Governs all React/Next.js frontend development:
- Component size limits: 150 lines max
- File size limits: 200 lines max
- State management: max 3 useState per component
- Architecture: Feature-Sliced Design (FSD)
- Data isolation: no direct API calls in UI components

### 4.6 GitHub Standard

> File: `standards/GITHUB_STANDARD.md`
> Level: **[C] Critical**

Governs all git operations:
- Conventional Commits format required
- Branch naming: `<type>/<description>`
- Force push: only `--force-with-lease`
- Backup before any history rewrite
- Push after every significant change

### 4.7 WCAG Accessibility

> File: `standards/WCAG_2.1_AA_STANDARD.md`
> Level: **[C] Critical**

Ensures UI accessibility:
- Text contrast: 4.5:1 minimum
- Non-text contrast: 3:1 minimum
- Keyboard navigation for all interactive elements
- Focus visible indicators
- Touch targets: 44x44px minimum
- ARIA roles and states

### 4.8 Code Examples Guide

> File: `standards/CODE_EXAMPLES_GUIDE.md`
> Level: **[W] Warning**

Governs code examples in documentation:
- Self-contained and executable
- Copy-paste ready (no line numbers, prompts)
- Proper syntax highlighting
- Security warnings for dangerous operations

## 5. Diagnostic Disclosure

Severity ladder for communicating problems:

| Certainty | Phrase |
|-----------|--------|
| File exists | "File X is present, Y lines" |
| Not found | "File X not found, checking alternatives..." |
| All checks exhausted | "File X not found after exhaustive search. Options: A, B, C" |
| All recovery failed | "File X could not be recovered. You may need to recreate it." |

Never jump to the last row without passing through all previous rows.

## 6. Planning Rule

For tasks that require more than 3 steps, write a plan in `worklog.md` BEFORE writing code.

- Tasks 1-3 steps: just do it, log after
- Tasks 4-10 steps: write a brief plan in worklog, then execute
- Tasks 10+ steps: write a detailed plan, show user for confirmation before starting

See `instructions/writing-plans.md` for full details.

## 7. Skills to Use

| Skill | When to Use |
|-------|-------------|
| `git-checkpoint` | Every 15-20 min during active work, before risky operations |
| `git-safe-ops` | Before any git push/pull/rebase/merge with remote |
| `sanitize-validate` | User input, form data, API requests, file uploads, security |
| `api-retry` | Making HTTP requests to external APIs, encountering 502/503/504 errors |
| `health-check` | Checking availability of chat.z.ai, monitoring API response times |
| `fallback` | chat.z.ai is unavailable, need alternative providers |
| `dev-watchdog` | Starting, restarting, or checking dev server |

## 8. Instructions to Follow

| Instruction | File |
|-------------|------|
| Onboarding Protocol | `instructions/onboarding-protocol.md` |
| Git Workflow Rules | `instructions/git-workflow-rules.md` |
| Language Rule | `instructions/language-rule.md` |
| Diagnostic Disclosure | `instructions/diagnostic-disclosure.md` |
| Writing Plans | `instructions/writing-plans.md` |
| Sandbox Rules | `instructions/sandbox-rules.md` |

## 9. Document Classification

This toolkit organizes files into two groups:

### Group B -- Governance (standards)

Apply FIRST. Define rules that all other documents must follow.

| ID | File | Level | Purpose |
|----|------|-------|---------|
| STD-DOC-001 | `MARKDOWN_STANDARD.md` | [W] | Markdown formatting rules |
| STD-DOC-003 | `UNICODE_POLICY.md` | [C]+[W]+[I] | Unicode/emoji prohibition |
| STD-DOC-004 | `README_TEMPLATE.md` | [W] | Mandatory README structure |
| STD-DOC-005 | `CODE_EXAMPLES_GUIDE.md` | [W] | Code examples formatting |
| STD-ENV-001 | `REPRODUCIBILITY-STANDARD.md` | [C] | Clone+install+dev = works |
| STD-ARCH-001 | `IMPLEMENTATION_ORDER.md` | [W] | Implementation sequence (6 steps) |
| STD-META-001 | `STANDARD_ID_SYSTEM.md` | [W] | Standard ID registry and rules |
| STD-FE-001 | `FRONTEND_STANDARD.md` | [C] | Frontend development (React/Next.js) |
| STD-GIT-001 | `GITHUB_STANDARD.md` | [C] | Git/GitHub operations standard |
| STD-A11Y-001 | `WCAG_2.1_AA_STANDARD.md` | [C] | Accessibility compliance (WCAG 2.1 AA) |
| STD-TEST-001 | `TESTING_STANDARD.md` | [C] | Unit, integration, E2E testing standards |
| STD-ERR-001 | `ERROR_HANDLING_STANDARD.md` | [C] | Error classification, logging, recovery |
| STD-SEC-001 | `SECURITY_STANDARD.md` | [C] | Authentication, secrets, OWASP compliance |

### Group A -- Operational (templates)

Deploy AFTER Group B. These SUBMIT to Group B standards.

| File | Purpose |
|------|---------|
| `WORKLOG.md` | Agent work journal (deployed as `worklog.md`) |
| `TASK_TEMPLATE.md` | Sub-agent prompt templates |
| `README_WORKLOG.md` | Worklog system guide |

### Infrastructure (non-standard)

| File | Purpose |
|------|---------|
| `AGENT_RULES.md` | This file -- agent behavioral rules |
| `PROJECT_CONFIG.md` | Project-specific settings (stack, paths, server) |
| `instructions/*.md` | Detailed behavioral instructions |

## 10. Sandbox Z.ai

Sandbox environment has specific constraints that affect all operations:

- **Shared filesystem**: All chat sessions share the same filesystem. Files created
  in one chat are visible in all other chats.
- **Chat = Shell process**: Each chat session has its own shell process. When the
  chat ends, the shell process dies, but files on disk remain.
- **Process mortality**: Background processes (dev servers, watchers) die when the
  chat session ends or after ~5 minutes of inactivity. Use `disown` to maximize
  survival time.
- **No cross-chat process sharing**: A process started in one chat cannot be
  controlled from another chat. But files left behind can be used.
- **Recovery from git lockup**: If a previous chat left git in a blocked state
  (e.g., `needs merge`, `rebase in progress`), the ONLY safe recovery is:
  ```bash
  rm -rf .git/rebase-merge .git/rebase-apply
  git reset --hard HEAD
  ```
  This must be done from a NEW chat session (the old one is blocked).

## 11. Project in Sandbox

The project MUST reside in `/home/z/my-project/`:

- This is the sandbox's designated working directory
- Do NOT create project clones in other directories (e.g., `/home/z/pmas/`)
- If a project exists elsewhere, move it to `/home/z/my-project/`
- All relative paths in configs must resolve from this directory
- Dev server logs go to `/tmp/zdev.log`

## 12. Dev Server Startup

Starting the dev server requires specific handling in sandbox:

```bash
# Kill any existing process
pkill -f 'next dev' 2>/dev/null
sleep 1

# Start with disown to survive parent shell death
cd /home/z/my-project && npx next dev -p 3000 </dev/null >/tmp/zdev.log 2>&1 & disown

# Wait for compilation
sleep 6

# Verify (always use 127.0.0.1, not localhost)
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/
```

Key rules:
- Always use `disown` after backgrounding the server process
- Always use `npx next dev`, NOT `bun run dev` (bun wrapper is unstable)
- Always redirect output: `>/tmp/zdev.log 2>&1`
- Always close stdin: `</dev/null`
- Always use `127.0.0.1` for health checks (not `localhost` -- IPv6 issues)
- Server lives ~5 min; watchdog should check every 5 min

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
