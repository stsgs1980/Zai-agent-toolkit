# Onboarding Protocol

## Instruction for AI Agent Behavior

---

## Rule: Always Onboard Before Acting

When entering an existing project (new chat, session restart, context loss),
the agent MUST complete ALL onboarding steps before starting any work.

Failure to onboard = acting blind = high risk of breaking existing code.

---

## Onboarding Steps (execute in order)

### Step 1: Read Agent Rules

```text
Read AGENT_RULES.md in project root.
```

This file contains mandatory behavioral rules, git workflow rules,
and references to all other instructions and skills.

If AGENT_RULES.md does not exist -> skip to Step 2 and notify user.

### Step 1.5: Read Project Configuration

```text
Read PROJECT_CONFIG.md in project root.
```

Contains project-specific settings: stack, dev server command,
project paths, and environment notes.

If PROJECT_CONFIG.md does not exist -> ask user for stack and
project structure before proceeding.

### Step 2: Read Worklog

```text
Read worklog.md in project root.
```

Contains history of all previous work sessions:
- What was done
- What decisions were made
- What problems occurred
- Current state of the project

If worklog.md does not exist -> note "no worklog found" and ask user for context.

### Step 3: Check Git State

```bash
git log --oneline -10
git status
git branch -a
```

Record:
- Latest commit hash and message
- Current branch
- Uncommitted changes (dirty files)
- Remote URL and status

### Step 4: Verify Dev Server

```bash
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000
```

| Response | Action |
|----------|--------|
| 200 | Server running, note it |
| 000 | Server down, restart with dev-watchdog skill |
| 500 | Server error, check logs, fix issue |

### Step 5: Scan Project Structure

```bash
ls -la instructions/
ls -la skills/
ls src/app/
```

Identify:
- Available instructions (behavioral rules)
- Available skills (automated tools)
- Project entry point and routes

### Step 6: Report to User

After completing Steps 1-5, report to the user in their language:

```text
Project: [name from README]
Branch: [branch] | Last commit: [hash] [message]
Server: [running/down] on port 3000
Worklog: [X sessions recorded, last dated Y]
Instructions: [list available]
Skills: [list available]
Uncommitted changes: [yes/no - list files]

Ready. What would you like to work on?
```

---

## Forbidden Actions During Onboarding

| Action | Why Forbidden |
|--------|---------------|
| Start coding immediately | You don't know what exists |
| Delete or modify files | You don't know git state |
| Run git push/pull | You don't know branch state |
| Install new packages | You don't know dependencies |
| Assume project state | worklog may contradict assumptions |

---

## Partial Onboarding

If the user explicitly says "skip onboarding" or "just fix X quickly":
- Still run Step 1 (AGENT_RULES.md) and Step 3 (git state) -- these are NON-SKIPPABLE
- Skip Steps 2, 4, 5, 6 only with user confirmation
- Note in worklog: "Partial onboarding per user request"

---

## Onboarding After Context Window Exhaustion

When a conversation is continued from a summary:
- The summary replaces worklog context -- treat it as onboarding data
- Still verify actual git state (summary may be outdated)
- Run Steps 3 and 4 at minimum

---

## Example: Correct Onboarding

```text
[Agent reads AGENT_RULES.md]
[Agent reads worklog.md - 3 sessions, last update 2026-04-17]
[Agent checks git: commit ee0baba, main branch, clean]
[Agent checks server: 200 OK]
[Agent scans: instructions/ (3 files), skills/ (2 dirs)]
[Agent reports to user in Russian]
```

## Example: Incorrect Onboarding

```text
[Agent starts coding immediately without reading anything]
[Agent deletes file that was added in previous session]
[Agent force pushes without checking current branch]
```

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
