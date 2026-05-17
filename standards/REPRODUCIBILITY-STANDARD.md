# Standard: Reproducibility v1.0

> ID: STD-ENV-001
> Version: 1.0
> Level: **[C] Critical**

**`git clone` + `bun install` + `npx next dev -p 3000` = working application.**
Always. Everywhere. On any machine. Without exceptions.

**Note on package manager vs. runtime:** Use `bun install` for dependency installation (fast, reliable). Use `npx next dev` for dev server (not `bun run dev` — the Bun wrapper for Next.js is unstable in sandbox environments). Use `bun run` for other scripts (lint, build, test).

---

## Levels

```text
L1 -- Environment     Files, paths, dependencies, environment
L2 -- Code           Source code, DB, API, security
L3 -- Delivery       CI, Docker, build, deploy
L4 -- Process        Audit, tests, checklist, repo work
```

#### L1 -- Environment

**`.env.example` -- required.** Contains all variables with safe defaults. Secrets as placeholders. `.env` -- in gitignore.

**Paths -- relative only.** Prohibited: `/home/`, `/Users/`, `http://localhost:` in code.

```typescript
// PROHIBITED
fetch('http://localhost:3000/api/documents')

// REQUIRED
fetch('/api/documents')
```

For cross-port services -- only `XTransformPort`:

```typescript
// PROHIBITED
fetch('http://localhost:3003/api/chat')

// REQUIRED
fetch('/api/chat?XTransformPort=3003')
```

**Runtime environment validation.** Critical variables checked at startup. Missing vars -- warning, not crash.

**Binary files -- outside git.** Only source code and configuration in git. No `.db`, `.sqlite`, images in upload/, backups, logs, build artifacts.

#### L2 -- Code

**Database: relative path via `path.resolve()`:**

```typescript
const dbPath = resolve(process.cwd(), rawUrl.replace(/^file:/, ''))
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
```

**Database: safe permissions:** `0o755` for directories, `0o644` for files.

**SQLite: no `mode: 'insensitive'`** -- SQLite doesn't support case-insensitive in Prisma. Use `contains`.

**Error handling: don't leak internal errors.** API routes never return Prisma error messages to client:

```typescript
// PROHIBITED -- leaks internal details
catch (error) {
  const msg = error instanceof Error ? error.message : 'Failed'
  return NextResponse.json({ error: msg }, { status: 500 })
}

// REQUIRED -- generic message + log
catch (error) {
  console.error('Error creating document:', error)
  return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
}
```

**Anti-fragility: error isolation.** Non-critical operations (backup, AI analysis) don't break main one. Critical operations (save, delete) MUST show error to user via toast.

**Dark theme: required.** Use only CSS variables: `bg-primary`, `text-foreground`, `bg-muted`, `text-muted-foreground`.

**Color palette:** default `stone`, `slate`, `neutral`, `green`, `emerald`. `indigo` / `blue` -- only if explicitly requested.

**Dependencies:** no dead packages. Each package in `dependencies` MUST be used in `src/`.

**UI components:** `src/components/ui/` -- shadcn/ui library, excluded from dead file check. Each custom file in `src/components/codex/` MUST be imported in `src/`.

#### L3 -- Delivery

**Default branch:** `main`. Lockfile committed (`bun.lock`). Semantic Versioning in `package.json`.

**CI pipeline (recommended):** `.github/workflows/ci.yml` -- lint, type-check, tests on every push/PR.

**Dockerfile (recommended):** production image based on `node:20-alpine`, multi-stage build, Bun runtime. No `.env`, `.db`, backups.

#### L4 -- Process

**Checklist before each commit:**

- [ ] `bun run lint` -- 0 errors
- [ ] No absolute paths in code
- [ ] No `console.log` (only `console.error` in catch)
- [ ] No unused packages / files
- [ ] API error handling -- generic messages
- [ ] Binary files not in git

**Checklist before release:**

- [ ] All from commit checklist
- [ ] `.env.example` exists with all variables
- [ ] `bun install && npx next dev -p 3000` on clean clone -- works
- [ ] Dark theme works
- [ ] All API routes return correct statuses
- [ ] Tests (if present) -- pass without errors

**Worklog:** file `worklog.md` in root, append (don't overwrite).

**Clean repository formula:**

```text
clone + install + dev = works
```

Everything violating this formula is a bug.

---

### Rule 1. Deduplication-First

All create endpoints **MUST** check for existing record before creating.

**Algorithm (two levels):**
1. Exact match: `findFirst({ where: { name: { equals: value } } })`
2. Case-insensitive fallback (for SQLite): `findFirst({ where: { name: { equals: value.toLowerCase() } } })`

**If found** -- return existing record (HTTP 200), don't create duplicate.

### Rule 2. Auto-Backup Policy

### Rule 3. SQLite Safety (connection_limit=1)

### Rule 4. Database Migration Rules for Z.ai Sandbox

### Rule 5. AI Prompt Language Standard

### Rule 6. Counter Synchronization

### Rule 7. Safe Delete Policy

### Rule 8. localStorage Persistence

### Rule 9. JSON-Only AI Responses

### Rule 10. Push Policy

**Push after every significant change** -- don't accumulate half-finished work in local branch.

| Situation | Action |
|-----------|--------|
| Feature or fix completed | Push immediately |
| End of work session | Push even if unfinished changes |
| CI red | Push OK, but fix soon |
| Experimental branch | Push immediately (in separate branch), don't merge to main without review |
| Token expired | Update token, update remote URL, push |

**Minimum:** 1 push at end of each session. Local changes without push = loss on Z.ai environment reset.

**Formula:**

```text
work -> commit -> push -> peace of mind
```

## Deletion

| Entity | Where | How |
|--------|-------|-----|
| Note | List + Editor | Trash2 button + AlertDialog confirmation |
| Extracted instruction | List | Trash2 button + AlertDialog confirmation |
| Built-in instruction | List | Trash2 button + AlertDialog (localStorage, persistence) |
| Document | View | Trash2 button + AlertDialog confirmation |
| Category | Sidebar | Trash2 button (hover) + AlertDialog confirmation |
| Tag | Sidebar | X button (hover) + AlertDialog confirmation |
| Term | Dictionary | Trash2 button (hover) + AlertDialog, bulk select + delete |

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
