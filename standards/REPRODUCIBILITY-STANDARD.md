# Standard: Reproducibility v2.0

> ID: STD-ENV-001
> Version: 2.0
> Level: **[C] Critical**
> Related: STD-ENV-002 (Z.ai Integration), STD-GIT-001 (GitHub), STD-SEC-001 (Security)

**`git clone` + `bun install` + `npx next dev -p 3000` = working application.**
Always. Everywhere. On any machine. Without exceptions.

**Note on package manager vs. runtime:** Use `bun install` for dependency installation (fast, reliable). Use `npx next dev` for dev server (not `bun run dev` -- the Bun wrapper for Next.js is unstable in sandbox environments). Use `bun run` for other scripts (lint, build, test).

---

## 1. Environment (L1)

Rules that ensure the project starts identically on any machine.

### 1.1 Environment Variables

**`.env.example` -- required.** Contains all variables with safe defaults. Secrets as placeholders. `.env` -- in gitignore.

**Runtime environment validation.** Critical variables checked at startup. Missing vars -- warning, not crash.

### 1.2 Path Rules

**No hardcoded personal paths.** Prohibited: developer-specific absolute paths and localhost URLs in source code. Environment-constant paths are allowed.

| Category | Examples | Status | Reason |
|----------|----------|--------|--------|
| Personal/developer paths | `/home/<username>/`, `/Users/<name>/`, `C:\Users\` | **PROHIBITED** | Machine-specific, breaks on other machines |
| Localhost URLs in source | `http://localhost:3000/api/...` | **PROHIBITED** | Use relative paths or XTransformPort |
| Environment-constant paths | `/home/z/my-project/`, `/tmp/` | **ALLOWED** | Identical on all Z.ai sandbox instances |
| Runtime-resolved paths | `path.resolve(process.cwd(), ...)` | **REQUIRED** | Produces correct path on any machine |

**Principle:** if the path is identical on ALL machines running this code, it is allowed. If the path is specific to ONE developer's machine, it is prohibited.

**Exception for Z.ai Sandbox** (see STD-ENV-002 section 3.1):

| Path | Allowed in | Reason |
|------|------------|--------|
| `/home/z/my-project/` | Shell commands, sandbox configs | Designated sandbox working directory |
| `/home/z/my-project/download/` | Output file writes | Designated output directory |
| `/tmp/zdev.log` | Dev server log redirect | System temp, not in source code |
| `/tmp/` | Backup operations | System temp, not committed to git |

All other absolute paths remain prohibited. Outside Z.ai sandbox, this exception does not apply -- use relative paths exclusively.

```typescript
// PROHIBITED -- developer-specific path
fetch('http://localhost:3000/api/documents')

// REQUIRED -- relative path
fetch('/api/documents')
```

For cross-port services -- only `XTransformPort`:

```typescript
// PROHIBITED
fetch('http://localhost:3003/api/chat')

// REQUIRED
fetch('/api/chat?XTransformPort=3003')
```

### 1.3 Binary Files

**Binary files -- outside git.** Only source code and configuration in git. No `.db`, `.sqlite`, images in upload/, backups, logs, build artifacts.

---

## 2. Code (L2)

Rules that ensure the project runs without machine-specific dependencies.

### 2.1 Database Paths

**Relative path via `path.resolve()`:**

```typescript
const dbPath = resolve(process.cwd(), rawUrl.replace(/^file:/, ''))
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
```

### 2.2 Database Permissions

**Safe permissions:** `0o755` for directories, `0o644` for files.

### 2.3 SQLite Constraints

**SQLite: no `mode: 'insensitive'`** -- SQLite does not support case-insensitive in Prisma. Use `contains`.

**SQLite: connection_limit=1** -- single connection to prevent concurrent write errors.

### 2.4 Database Migration Rules for Z.ai Sandbox

Schema changes must be reversible. Always test `prisma migrate reset` on a clean clone.

### 2.5 Dependency Hygiene

**No dead packages.** Each package in `dependencies` MUST be used in `src/`. Dead dependencies increase install time and attack surface.

**UI components:** `src/components/ui/` -- shadcn/ui library, excluded from dead file check. Each custom file in `src/components/codex/` MUST be imported in `src/`.

---

## 3. Delivery (L3)

Rules that ensure the project builds and deploys identically.

### 3.1 Version Control

**Default branch:** `main`. **Lockfile committed** (`bun.lock`). **Semantic Versioning** in `package.json`.

### 3.2 CI Pipeline (recommended)

`.github/workflows/ci.yml` -- lint, type-check, tests on every push/PR.

### 3.3 Dockerfile (recommended)

Production image based on `node:20-alpine`, multi-stage build, Bun runtime. No `.env`, `.db`, backups.

---

## 4. Process (L4)

Checklists that verify reproducibility before and after changes.

### 4.1 Checklist Before Each Commit

- [ ] `bun run lint` -- 0 errors
- [ ] No hardcoded personal paths in code (environment-constant paths allowed per STD-ENV-002 section 3.1)
- [ ] No unused packages / files
- [ ] Binary files not in git

### 4.2 Checklist Before Release

- [ ] All from commit checklist
- [ ] `.env.example` exists with all variables
- [ ] `bun install && npx next dev -p 3000` on clean clone -- works
- [ ] Tests (if present) -- pass without errors

### 4.3 Worklog

File `worklog.md` in root, append (don't overwrite).

---

## 5. Clean Repository Formula

```text
clone + install + dev = works
```

Everything violating this formula is a bug.

---

## 6. Cross-References

The following standards contain rules that support reproducibility within their respective domains:

| Domain | Standard | Relevant Sections |
|--------|----------|-------------------|
| Error handling | STD-ERR-001 | Section 5.2 (no internal error leaks), Section 7.3 (fallback mechanisms) |
| Security | STD-SEC-001 | Section 2.1 (env validation), Section 2.2 (.env management) |
| Git operations | STD-GIT-001 | Section 5 (push policy), Section 8 (.gitignore), Section 6 (versioning) |
| Frontend | STD-FE-001 | Section 10.5 (auto-backup), Section 10.6 (deduplication) |
| Z.ai sandbox | STD-ENV-002 | Section 3 (project directory), Section 3.1 (absolute path exception) |
| Testing | STD-TEST-001 | Section 6 (CI pipeline), Section 11 (sandbox coverage) |

---

## 7. Version History

| Version | Date | Changes |
|--------|------|---------|
| 2.0 | 2026-05-18 | Major restructuring: removed rules not directly ensuring reproducibility (dark theme, color palette, error handling, anti-fragility, dedup, push policy, deletion UI). These rules relocated to their domain-specific standards (STD-FE-001, STD-ERR-001, STD-GIT-001). Added Cross-References section. Renumbered sections. |
| 1.1 | 2026-05-18 | K-01 fix: replaced categorical absolute path ban with nuanced rule. Added Z.ai sandbox exception. |
| 1.0 | 2025-01 | Initial standard |

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
