# Feature Development Workflow

brainstorm -> plan -> implement -> QA

Use this workflow when building a new feature, page, component, or integration.

---

## Phase 1: BRAINSTORM

Goal: understand what the user wants and propose approaches.

### Steps

1. Ask user to describe the feature in their own words
2. Clarify ambiguous requirements
3. Propose 2-3 approaches with pros/cons
4. User selects approach

### Skip Condition

Skip brainstorm ONLY if task is trivial or there's an exact specification.

---

## Phase 2: PLAN

Goal: create detailed implementation plan.

### Steps

1. List all files to create/modify
2. Determine implementation order (dependencies first)
3. Identify risks
4. Estimate size (small/medium/large)
5. Write plan to worklog.md
6. Get user confirmation

---

## Phase 3: IMPLEMENT

Goal: write code according to plan.

### Rules

- Follow AGENT_RULES.md
- Follow UNICODE_POLICY.md
- Use shadcn/ui
- TypeScript strict typing

---

## Phase 4: QA

Goal: verify the feature works.

### Steps

1. Lint: `bun run lint`
2. Build: `bun run build`
3. Health check: `curl http://127.0.0.1:3000`
4. Manual testing

### After QA

- Push to GitHub
- Update worklog.md

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
