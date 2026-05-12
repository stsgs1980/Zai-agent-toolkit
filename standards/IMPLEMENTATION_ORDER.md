# Standard: Implementation Order v2.1

> ID: STD-ARCH-001
> Version: 2.1
> Level: **[W] Warning**
> Related: All Group B standards

This document describes the implementation order for all project documents — from reading standards to assembling README. Each step builds on the results of the previous one. Violating the order leads to rework.

---

## Project Documents

### Group B: Standards (governance)

Define rules. Not modified when starting a new project — only read and accepted.

**ID System:** All standards have a unique ID (e.g., `STD-FE-001`). See **STD-META-001** for the ID registry and assignment rules.

| ID | Document | Level | Scope |
|----|----------|-------|-------|
| STD-ENV-001 | REPRODUCIBILITY-STANDARD.md | [C] | Infrastructure, env, DB |
| STD-FE-001 | FRONTEND_STANDARD.md | [C] | React, Next.js, FSD |
| STD-GIT-001 | GITHUB_STANDARD.md | [C] | Commits, branches, push policy |
| STD-A11Y-001 | WCAG_2.1_AA_STANDARD.md | [C] | WCAG, ARIA, contrast |
| STD-TEST-001 | TESTING_STANDARD.md | [C] | Unit, integration, E2E testing |
| STD-ERR-001 | ERROR_HANDLING_STANDARD.md | [C] | Error types, logging, recovery |
| STD-SEC-001 | SECURITY_STANDARD.md | [C] | OWASP, secrets, authentication |
| STD-DOC-001 | MARKDOWN_STANDARD.md | [W] | README, project documentation |
| STD-DOC-003 | UNICODE_POLICY.md | [C]+[W]+[I] | UI, production code, AI-chat |
| STD-DOC-004 | README_TEMPLATE.md | - | README.md structure |
| STD-DOC-005 | CODE_EXAMPLES_GUIDE.md | [W] | Code examples in documentation |
| STD-ARCH-001 | IMPLEMENTATION_ORDER.md | [W] | Implementation sequence |
| STD-META-001 | STANDARD_ID_SYSTEM.md | [W] | Standard ID system |

### Group A: Operational System (worklog)

Work tools. Copied into the project and used from day one.

| Document | Purpose |
|----------|---------|
| README_WORKLOG.md | Worklog system guide |
| TASK_TEMPLATE.md | Prompt templates for sub-agents |
| WORKLOG.md | Agent work journal (live file) |

### Relationship Between Groups

- Group A submits to Group B (all .md files must comply with MARKDOWN_STANDARD and No-Unicode Policy)
- Group B does not know about Group A (standards do not mention worklog)
- Group A references Group B (README_WORKLOG mentions standards)

---

## Full Sequence (6 Steps)

### Step 1: Accept Standards (Group B)

**What is done:**

- Copy all Group B files to project folder (e.g., `docs/standards/`)
- Read each standard completely
- Ensure team understands levels [C], [W], [I]
- Define stack signature for project (format: `Built with: <technologies>`, default: see README_TEMPLATE)

**Why first:** Standards are the foundation. Everything else must comply with them. If you start work without understanding the rules, you will have to redo.

**Risk:** Without this step, each project participant will format code and documentation differently.

---

### Step 2: Deploy Worklog System (Group A)

**What is done:**

- Copy README_WORKLOG.md to project (guide)
- Copy TASK_TEMPLATE.md to project (prompt templates)
- Create WORKLOG.md from template (empty journal with header)
- Verify all three files comply with MARKDOWN_STANDARD (stack signature, code block languages, list markers)

**Why second:** Worklog starts recording work from step 3. Without it — no history, no coordination between agents, no ability to rollback.

**Why after standards:** Group A files must comply with Group B standards from the moment they appear in the project. Verification at step 2 ensures the worklog system does not violate MARKDOWN_STANDARD.

**Risk:** If worklog is deployed before accepting standards — files may not comply with rules, and at step 5 they will need to be redone.

---

### Step 3: REPRODUCIBILITY-STANDARD (Foundation)

**What is done:**

- Create .env.example with relative paths
- Configure db.ts: connection_limit=1, mkdirSync, relative paths via process.cwd()
- Remove absolute paths (/home/, http://localhost:)
- Verify dependencies (no dead packages)
- Configure dark theme via CSS variables
- Log result to WORKLOG.md (Task ID: 3)

**Why third:** Infrastructure must be stable before code and documentation start relying on it.

**Risk:** If you write UI first and then fix DB paths or environment variables — you will have to retest all code that used these connections.

---

### Step 4: UNICODE_POLICY [C] (UI Code Protection)

**What is done:**

- Add custom ESLint rule no-unicode-policy/no-unicode (error)
- Replace all emoji in UI components with Lucide SVG icons
- Replace unicode statuses with text tags: [OK], [FAIL], [TODO]
- Run bun run lint for verification
- Log result to WORKLOG.md (Task ID: 4)

**Why fourth:** After infrastructure setup (step 3), code must be "frozen" from unicode pollution. ESLint rule blocks all new emoji/unicode in code. .ts/.tsx files are already stable (step 3 done), no repeated cleanup needed.

**Risk:** If No-Unicode is done before Reproducibility — .ts/.tsx files will be changed during DB setup, and cleanup will need to be repeated. If done after Markdown Standard — emoji will remain in .md files, which No-Unicode does not catch.

---

### Step 5: MARKDOWN_STANDARD [W] (Documentation)

**What is done:**

- Remove emoji from all .md files (worklog, README, AGENT_RULES, etc.)
- Replace unicode pseudo-graphics with ASCII
- Verify lists (only `-`, not `*` or `+`)
- Verify code blocks (always with language specified, fallback: `text` or `bash`)
- Add Stack Signature to root files (format: `Built with: <technologies>`)
- Validate Group A files (README_WORKLOG.md, TASK_TEMPLATE.md, WORKLOG.md)
- Log result to WORKLOG.md (Task ID: 5)

**Why fifth:** No-Unicode already cleaned code (step 4), but ESLint rule does not cover .md files. Markdown Standard is final cleanup for documentation, including worklog system files.

**Risk:** If Markdown Standard is done before No-Unicode — you will have to go through .md files again, because both standards prohibit emoji but with different scope.

---

### Step 6: README_TEMPLATE (Final Assembly)

**What is done:**

- README.md is assembled from template (Title, Features, Tech Stack, Getting Started, Configuration, Project Structure, API Reference, Scripts, Development Rules, Agent Rules)
- Stack Signature added at end (specific project stack value)
- Formatting complies with MARKDOWN_STANDARD
- Log result to WORKLOG.md (Task ID: 6)

**Why last:** README.md must comply with MARKDOWN_STANDARD, so template is applied after formatting rules are established (step 5). Tech stack was defined at step 1, infrastructure is stable (step 3), code is clean (step 4).

**Risk:** If README is done first — when Markdown Standard is applied, you will have to reformat lists (`*` to `-`), add language to code blocks, add Stack Signature.

---

## Dependency Diagram

```text
Step 1: Standards (Group B)          Read, accept rules
        |
        v
Step 2: Worklog (Group A)            Deploy, verify compliance with B
        |
        v
Step 3: REPRODUCIBILITY              Configure infrastructure (env, db, paths)
        |                            Log to WORKLOG
        v
Step 4: UNICODE_POLICY [C]           ESLint rule + UI code cleanup
        |                            Log to WORKLOG
        v
Step 5: MARKDOWN_STANDARD [W]        Clean .md files (including Group A)
        |                            Log to WORKLOG
        v
Step 6: README_TEMPLATE              Assemble README from template
                                     Log to WORKLOG
```

---

## What Happens When Order is Violated

| Mistake | Consequence |
|---------|-------------|
| Worklog (step 2) before Standards (step 1) | Group A files do not comply with B — re-verification and editing at step 5 |
| No-Unicode before Reproducibility | .ts/.tsx files change during DB setup — repeated cleanup |
| Markdown Standard before No-Unicode | Emoji in .md and code — double pass through files |
| README Template before Markdown Standard | README format does not comply with standard — reformatting |
| Any standard without Reproducibility | Absolute paths, dead packages — hidden bugs |
| Reproducibility after README | Absolute paths in .env and db.ts break deploy — rewriting config and reformatting README |
| Skipping step 2 (worklog) | No work history, no coordination between agents, no rollback possible |

---

## Key Rules

1. **Layers:** Each step is a layer. The lower layer must be stable before laying the next. Otherwise layers will have to be relaid.

2. **Group A submits to Group B:** All worklog system files are verified against standards. This is done twice: during deployment (step 2) and when applying MARKDOWN_STANDARD (step 5).

3. **Worklog records each step:** Starting from step 3, each step is logged to WORKLOG.md. Steps 1-2 are manual (worklog not yet used), steps 3-6 are with logging.

4. **Stack signature defined at step 1:** Format is defined by MARKDOWN_STANDARD, specific value by README_TEMPLATE. When project stack changes, only README_TEMPLATE is updated.

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
