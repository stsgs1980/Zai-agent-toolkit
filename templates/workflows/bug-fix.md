# Bug Fix Workflow

reproduce -> diagnose -> fix -> verify

Use this workflow when fixing a bug, error, or unexpected behavior.

---

## Phase 1: REPRODUCE

Goal: understand and reproduce the bug.

### Steps

1. Ask user to describe the bug
2. Reproduce the bug locally
3. Document current (broken) behavior

---

## Phase 2: DIAGNOSE

Goal: find the root cause.

### Steps

1. Check error logs
2. Check browser console
3. Find the responsible code

---

## Phase 3: FIX

Goal: fix the bug with minimal changes.

### Rules

- Fix only the specific bug
- Do not refactor along the way
- Commit with descriptive message

---

## Phase 4: VERIFY

Goal: ensure the fix works.

### Steps

1. Bug is fixed
2. Nothing else is broken
3. Lint and build pass

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
