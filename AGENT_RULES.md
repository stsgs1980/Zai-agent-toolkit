# Agent Rules

> Toolkit version: **v2.0.4**
>
> Mandatory rules for AI agents working with this toolkit.
> Read before starting work on any project.

---

## 0. Read-Only Usage

> **CRITICAL**: Z.ai Agent Toolkit is a reference, not part of your project code.

When cloned into a project, zai-agent-toolkit must be treated as read-only:

1. **NEVER commit changes to zai-agent-toolkit/**
2. **NEVER modify files inside zai-agent-toolkit/**
3. **Add to .gitignore**: `zai-agent-toolkit/`

If the toolkit needs updates, clone a fresh copy from the repository.

---

## 1. Onboarding Protocol

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

## 2. Language Rule

Always respond in the user's language. If the user writes in Russian, respond in Russian. If in English, respond in English. Never switch languages without explicit request.

- Code, file paths, terminal commands, git commit messages - always English
- Chat messages, explanations, worklog - match user's language
- Before each response verify: "Am I writing in the same language as the user?"

## 3. Git Workflow Rules

### 3.1 Backup Before Rewrite

Before any git operation that rewrites history (rebase, merge, pull, reset --hard):

1. `git stash push -m "pre-op-backup"`
2. `cp -r src/ /tmp/src-backup/`
3. `git log --oneline -20 > /tmp/git-log-backup.txt`

### 3.2 Force Push Over Rebase

When `git push` is rejected (diverged branches):

- `git push --force-with-lease origin main` - CORRECT
- `git push --force origin main` - AVOID (overrides remote without safety check)
- `git pull --rebase` - FORBIDDEN (blocks sandbox environment on conflict)

### 3.3 Never Pull After Remote URL Change

After `git remote set-url origin <url>`:

- `git push --force-with-lease origin main` - CORRECT
- `git push --force origin main` - AVOID (no safety check)
- `git pull` - FORBIDDEN (creates unnecessary conflicts)

### 3.4 No Panic Diagnostics

Before telling the user data is lost, check ALL 5 paths:

1. `ls src/app/` - do files exist?
2. `ls .git/rebase-merge/` - is rebase paused?
3. `git reflog` - are commits referenced?
4. `ls /tmp/src-backup-*/` - were backups created?
5. `git fsck --lost-found` - dangling objects?

NEVER say "permanently lost" until all 5 checks are exhausted.

### 3.5 Log Everything

After every git operation, log to `worklog.md`: operation, hash before/after, result.

## 4. Project Environment

Project-specific settings are defined in **`PROJECT_CONFIG.md`**.
If that file exists, it contains:

- Stack signature (e.g., `Built with: Next.js 16 + TypeScript + Tailwind CSS`)
- Dev server command and port
- Project paths (entry points, config locations)
- Environment-specific notes

If `PROJECT_CONFIG.md` does not exist, the agent MUST ask the user
for the stack and project structure before proceeding.

## 5. Code Standards

This toolkit enforces the following standards. All files referenced below
are in the `standards/` directory.

**IMPORTANT:** The table below is a reference index, not a substitute for reading the full standard. Always read the complete standard document before applying rules.

| ID | Standard | Level | Key Rule | File |
|----|----------|-------|----------|------|
| STD-DOC-003 | Unicode Policy | [C]+[W]+[I] | No emoji in code/UI; `(ref)` exception for identification | `standards/UNICODE_POLICY.md` |
| STD-DOC-002 | Markdown Standard | [W] | ASCII + typography in text; `-` for lists; stack signature | `standards/MARKDOWN_STANDARD.md` |
| STD-ENV-001 | Reproducibility | [C] | Relative paths; `.env.example`; `connection_limit=1`; auto-backup | `standards/REPRODUCIBILITY-STANDARD.md` |
| STD-ENV-002 | Z.ai Integration | [C] | Sandbox constraints; dev server protocol; session continuity | `standards/ZAI_INTEGRATION_STANDARD.md` |
| STD-ARCH-001 | Implementation Order | [W] | 6-step mandatory sequence; Group A submits to Group B | `standards/IMPLEMENTATION_ORDER.md` |
| STD-FE-001 | Frontend Development | [C] | 150-line limit; max 3 useState; FSD layers; no client fetch | `standards/FRONTEND_STANDARD.md` |
| STD-GIT-001 | GitHub Standard | [C] | Conventional commits; `--force-with-lease`; push after every stage | `standards/GITHUB_STANDARD.md` |
| STD-A11Y-001 | WCAG Accessibility | [C] | 4.5:1 contrast; keyboard nav; 44px touch targets **DEPRECATED** | `standards/WCAG_2.1_AA_STANDARD.md` |
| STD-GIT-002 | GitHub Sandbox Safety | [C] | Sandbox-specific git safety rules | `standards/GITHUB_SANDBOX_STANDARD.md` |
| STD-ERR-002 | Error Recovery | [C] | Recovery strategies, retry policies | `standards/ERROR_RECOVERY_STANDARD.md` |
| STD-SEC-002 | Security Extended | [C] | Advanced security patterns | `standards/SECURITY_EXTENDED_STANDARD.md` |
| STD-AGENT-001 | Subagent Standard | [C] | Sub-agent communication protocol | `standards/SUBAGENT_STANDARD.md` |
| STD-AGENT-002 | Orchestration Standard | [C] | Multi-agent orchestration patterns | `standards/ORCHESTRATION_STANDARD.md` |
| STD-TEST-001 | Testing Standard | [C] | 70/20/10 pyramid; AAA pattern; 60% sandbox minimum | `standards/TESTING_STANDARD.md` |
| STD-ERR-001 | Error Handling | [C] | ApplicationError hierarchy; structured logging; circuit breaker | `standards/ERROR_HANDLING_STANDARD.md` |
| STD-SEC-001 | Security Standard | [C] | OWASP Top 10; secrets management; RBAC; Zod validation | `standards/SECURITY_STANDARD.md` |

### 5.1 Implementation Order

Standards must be applied in a specific order.
See `standards/IMPLEMENTATION_ORDER.md` for the full 6-step sequence.

## 6. Diagnostic Disclosure

Severity ladder for communicating problems:

| Certainty | Phrase |
|-----------|--------|
| File exists | "File X is present, Y lines" |
| Not found | "File X not found, checking alternatives..." |
| All checks exhausted | "File X not found after exhaustive search. Options: A, B, C" |
| All recovery failed | "File X could not be recovered. You may need to recreate it." |

Never jump to the last row without passing through all previous rows.

## 7. Planning Rule

For tasks that require more than 3 steps, write a plan in `worklog.md` BEFORE writing code.

- Tasks 1-3 steps: just do it, log after
- Tasks 4-10 steps: write a brief plan in worklog, then execute
- Tasks 10+ steps: write a detailed plan, show user for confirmation before starting

See `instructions/writing-plans.md` for full details.

## 8. Skills to Use

### 8.1 Toolkit Skills (installed in skills/)

| ID | Skill | When to Use |
|----|-------|-------------|
| ZAI-META-001 | `skill-id-system` | Creating new skills, understanding skill IDs |
| ZAI-META-002 | `skill-creator` | Full skill creation workflow with automatic ID assignment |
| ZAI-DEV-001 | `project-clone` | Cloning repositories with user confirmation |
| ZAI-DEV-002 | `commit-work` | Creating high-quality conventional commits with change analysis |
| ZAI-DEV-003 | `database-schema-designer` | Designing robust database schemas |
| ZAI-REQ-001 | `requirements-clarity` | Clarifying vague requirements, generating PRD through dialogue |
| ZAI-ARCH-001 | `mermaid-diagrams` | Creating flowcharts, sequence diagrams, ERDs with Mermaid |
| ZAI-QA-001 | `qa-test-planner` | Comprehensive QA test planning |
| ZAI-MEM-001 | `memory-store` | Storing sessions, knowledge, patterns in ChromaDB |
| ZAI-MEM-002 | `memory-query` | Semantic search across stored memory entries |
| ZAI-MEM-003 | `memory-delete` | Deleting entries from ChromaDB |
| ZAI-MEM-004 | `memory-export` | Exporting memory entries to JSON |
| ZAI-FS-001 | `folder-indexer` | Scanning directories and creating searchable indexes |
| ZAI-SESSION-001 | `session-log` | Automatic session knowledge capture and snapshots |
| ZAI-SESSION-002 | `context-consolidation` | Managing long-running session context compression |
| ZAI-STS-001 | `prompt-engineering_sts` | Expert prompt engineering with scoring frameworks |
| ZAI-STS-002 | `sync-toolkit_sts` | Syncing toolkit between Z.ai sandbox and Windows PC |
| ZAI-STS-003 | `performance-code-generator_sts` | High-performance code generation with optimization |
| ZAI-STS-004 | `frontend-styling-expert_sts` | CSS/styling specialist for responsive design |
| ZAI-STS-005 | `phi-layout_sts` | Proportional CSS Grid layouts using golden ratio |
| ZAI-STS-006 | `zai-ui-composer_sts` | Production UI composition with zai-ui-kit tokens |

### 8.2 System Skills (Z.ai sandbox only)

These skills are provided by the Z.ai platform. They do NOT have ZAI- IDs.

| Skill | Category | When to Use |
|-------|----------|-------------|
| `fullstack-dev` | Development | Next.js 16 development |
| `visual-design-foundations` | Design | Design tokens, typography |
| `phi-layout` | Design | Grid layouts (sandbox system version; toolkit twin: phi-layout_sts) |
| `zai-ui-composer` | Design | UI composition (sandbox system version; toolkit twin: zai-ui-composer_sts) |
| `frontend-styling-expert` | Design | CSS/styling (sandbox system version; toolkit twin: frontend-styling-expert_sts) |
| `performance-code-generator` | Development | Code optimization (sandbox system version; toolkit twin: performance-code-generator_sts) |
| `ui-ux-pro-max` | Design | Advanced UI/UX patterns |
| `session-resume` | Session | Start of every new session, after context loss |
| `session-handoff` | Session | Creating handoff documents, context preservation |
| `git-checkpoint` | Git | Every 15-20 min during active work, before risky operations |
| `git-safe-ops` | Git | Before any git push/pull/rebase/merge with remote |
| `git-safety` | Git | Deadlock prevention rules |
| `sanitize-validate` | Security | User input, form data, API requests, security |
| `api-retry` | API | Making HTTP requests to external APIs |
| `health-check` | API | Checking availability of chat.z.ai |
| `fallback` | API | chat.z.ai is unavailable, need alternative providers |
| `dev-watchdog` | Development | Starting, restarting, or checking dev server |
| `z-ai-web-dev-sdk` | SDK | Chat, image gen, web search via z-ai-web-dev-sdk |
| `doc-gen` | Documents | Generating PDF, DOCX, XLSX documents |
| `c4-architecture` | Architecture | C4 architecture diagrams with Mermaid |
| `anti-monolith` | Architecture | Enforcing modular architecture (ZAI-ARCH-002, auto-triggers on file > 250 lines, 3+ useState) |

## 9. Instructions to Follow

| Instruction | File |
|-------------|------|
| Onboarding Protocol | `instructions/onboarding-protocol.md` |
| Git Workflow Rules | `instructions/git-workflow-rules.md` |
| Language Rule | `instructions/language-rule.md` |
| Diagnostic Disclosure | `instructions/diagnostic-disclosure.md` |
| Writing Plans | `instructions/writing-plans.md` |
| Sandbox Rules | `instructions/sandbox-rules.md` |
| Z.ai SDK Guidelines | `instructions/zai-sdk-guidelines.md` |

## 10. Z.ai SDK Integration

When building features that use AI capabilities:
1. Use `z-ai-web-dev-sdk` skill for all AI model interactions
2. SDK calls MUST be in API routes only (never client-side)
3. Follow `api-retry` skill for error handling
4. Follow `health-check` skill for availability monitoring
5. Follow `fallback` skill for provider failover

## 11. Document Classification

This toolkit organizes files into two groups:

### Group B -- Governance (standards)

Apply FIRST. Define rules that all other documents must follow.

| ID | File | Level | Purpose |
|----|------|-------|---------|
| STD-DOC-002 | `MARKDOWN_STANDARD.md` | [W] | Markdown formatting rules |
| STD-DOC-003 | `UNICODE_POLICY.md` | [C]+[W]+[I] | Unicode/emoji prohibition |
| STD-DOC-004 | `README_TEMPLATE.md` | [W] | Mandatory README structure |
| STD-DOC-005 | `CODE_EXAMPLES_GUIDE.md` | [W] | Code examples formatting |
| STD-ENV-001 | `REPRODUCIBILITY-STANDARD.md` | [C] | Clone+install+dev = works |
| STD-ENV-002 | `ZAI_INTEGRATION_STANDARD.md` | [C] | Z.ai sandbox integration |
| STD-ARCH-001 | `IMPLEMENTATION_ORDER.md` | [W] | Implementation sequence (6 steps) |
| STD-META-001 | `STANDARD_ID_SYSTEM.md` | [W] | Standard ID registry and rules |
| STD-FE-001 | `FRONTEND_STANDARD.md` | [C] | Frontend development (React/Next.js) |
| STD-GIT-001 | `GITHUB_STANDARD.md` | [C] | Git/GitHub operations standard |
| STD-A11Y-001 | `WCAG_2.1_AA_STANDARD.md` | [C] | Accessibility compliance (WCAG 2.1 AA) **DEPRECATED** |
| STD-GIT-002 | `GITHUB_SANDBOX_STANDARD.md` | [C] | Sandbox git safety |
| STD-ERR-002 | `ERROR_RECOVERY_STANDARD.md` | [C] | Error recovery strategies |
| STD-SEC-002 | `SECURITY_EXTENDED_STANDARD.md` | [C] | Extended security patterns |
| STD-AGENT-001 | `SUBAGENT_STANDARD.md` | [C] | Sub-agent protocol |
| STD-AGENT-002 | `ORCHESTRATION_STANDARD.md` | [C] | Multi-agent orchestration |
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

## 12. Sandbox Z.ai

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

## 13. Project in Sandbox

The project MUST reside in `/home/z/my-project/`:

- This is the sandbox's designated working directory
- Do NOT create project clones in other directories (e.g., `/home/z/pmas/`)
- If a project exists elsewhere, move it to `/home/z/my-project/`
- All relative paths in configs must resolve from this directory
- Dev server logs go to `/tmp/zdev.log`

## 14. Dev Server Startup

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

Built with: Python + PowerShell + Markdown
