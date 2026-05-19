# Refactor Workflow

analyze -> plan -> refactor -> verify

Use this workflow when restructuring code without changing functionality.

---

## Phase 1: ANALYZE

Goal: understand current structure and problems.

### Steps

1. Identify what to refactor
2. Determine why it's needed
3. Identify risks

---

## Phase 2: PLAN

Goal: plan the refactoring.

### Steps

1. Define target structure
2. Break into small steps
3. Write plan to worklog.md

---

## Phase 3: REFACTOR

Goal: execute the refactoring.

### Rules

- Make small changes
- Commit after each step
- Do not change functionality

---

## Phase 4: VERIFY

Goal: ensure everything works.

### Steps

1. All tests pass
2. Lint and build succeed
3. Functionality unchanged

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
