# Standard: Standard ID System v1.0 (EN)

> ID: STD-META-001
> Version: 1.0
> Level: **[W] Warning**
> Last Updated: 2025-01

This document describes the ID system for all project standards. ID provides an unambiguous reference to a standard in discussions, code, AI prompts, and documentation.

---

## 1. Purpose

The ID system solves the following tasks:

| Task | Example |
|------|---------|
| Unambiguous reference in discussions | "Violation of STD-FE-001 section 2.1" |
| Reference in AI prompts | "Follow STD-GIT-001 for commits" |
| Link between standards | No-Unicode Policy references STD-DOC-001 |
| Search and cataloging | grep "STD-FE-" finds all Frontend Standard mentions |

---

## 2. ID Format

```
STD-<DOMAIN>-<NUMBER>
```

| Component | Description |
|-----------|-------------|
| `STD` | Prefix (Standard) |
| `<DOMAIN>` | Standard domain (2-4 letters) |
| `<NUMBER>` | Sequential number in domain (3 digits) |

**Examples:**
- `STD-FE-001` — Frontend Development Standard
- `STD-GIT-001` — GitHub Operations Standard
- `STD-A11Y-001` — WCAG Accessibility Standard

---

## 3. Reserved Domains

| Domain | Expansion | Scope |
|--------|-----------|-------|
| `FE` | Frontend | React, Next.js, UI components, FSD |
| `GIT` | Git / GitHub | Commits, branches, push policy |
| `A11Y` | Accessibility | WCAG, ARIA, contrast, keyboard |
| `DOC` | Documentation | Markdown, Unicode, code examples |
| `ARCH` | Architecture | Implementation order, dependencies |
| `META` | Meta-standards | This document, ID system |
| `API` | API Design | (reserved) REST, GraphQL, tRPC |
| `TEST` | Testing | Unit, E2E, integration testing |
| `ERR` | Error Handling | Error types, logging, recovery |
| `SEC` | Security | OWASP, secrets, authentication |
| `DB` | Database | (reserved) Prisma, migrations, schemas |
| `ENV` | Environment | Infrastructure, reproducibility |

---

## 4. ID Registry (Current Assignments)

### 4.1. Frontend (FE)

| ID | Document | Version | Level |
|----|----------|---------|-------|
| STD-FE-001 | Frontend Development Standard | 1.3 | [C] Critical |

### 4.2. Git / GitHub (GIT)

| ID | Document | Version | Level |
|----|----------|---------|-------|
| STD-GIT-001 | GitHub Standard | 1.1 | [C] Critical |

### 4.3. Accessibility (A11Y)

| ID | Document | Version | Level |
|----|----------|---------|-------|
| STD-A11Y-001 | WCAG 2.1 AA Standard | 1.0 | [C] Critical |

### 4.4. Documentation (DOC)

| ID | Document | Version | Level |
|----|----------|---------|-------|
| STD-DOC-001 | Markdown Standard (RU) | 2.1.5 | [W] Warning |
| STD-DOC-002 | Markdown Standard (EN) | 2.1.5 | [W] Warning |
| STD-DOC-003 | No-Unicode Policy | 2.1.3 | [C]+[W]+[I] |
| STD-DOC-004 | README Template | - | - |
| STD-DOC-005 | Code Examples Guide | 1.0 | [W] Warning |

### 4.5. Architecture (ARCH)

| ID | Document | Version | Level |
|----|----------|---------|-------|
| STD-ARCH-001 | Implementation Order | 2.1 | [W] Warning |

### 4.6. Environment (ENV)

| ID | Document | Version | Level |
|----|----------|---------|-------|
| STD-ENV-001 | Reproducibility Standard | 1.0 | [C] Critical |

### 4.7. Testing (TEST)

| ID | Document | Version | Level |
|----|----------|---------|-------|
| STD-TEST-001 | Testing Standard | 1.0 | [C] Critical |

### 4.8. Error Handling (ERR)

| ID | Document | Version | Level |
|----|----------|---------|-------|
| STD-ERR-001 | Error Handling Standard | 1.0 | [C] Critical |

### 4.9. Security (SEC)

| ID | Document | Version | Level |
|----|----------|---------|-------|
| STD-SEC-001 | Security Standard | 1.0 | [C] Critical |

### 4.10. Meta (META)

| ID | Document | Version | Level |
|----|----------|---------|-------|
| STD-META-001 | Standard ID System | 1.0 | [W] Warning |

---

## 5. ID Assignment Procedure

### 5.1. Who Assigns

| Role | Authority |
|------|-----------|
| Tech Lead | Creating new domains, assigning IDs |
| Any participant | Proposing new standard via Issue/PR |

### 5.2. Process

1. **Create Issue** with standard proposal
2. Specify proposed domain (or request new one)
3. Tech Lead assigns ID from registry
4. After approval — standard is added with ID in header

### 5.3. Numbering Rules

- Numbers go sequentially: 001, 002, 003...
- Gaps are not allowed (no STD-DOC-006 if no STD-DOC-005)
- Deleted standard: ID marked as `[DEPRECATED]` in registry, number not reassigned

---

## 6. Standard Header Format

All standards must have a header in the following format:

```markdown
# Standard: <Name> v<Version> (<Language>)

> ID: STD-<DOMAIN>-<NUMBER>
> Version: <Version>
> Level: **[<Level>] <Level Name>**
> Last Updated: <Date>
> Related: <Related standards by ID> (optional)
```

**Example:**

```markdown
# Standard: Frontend Development v1.3 (EN)

> ID: STD-FE-001
> Version: 1.3
> Level: **[C] Critical**
> Last Updated: 2025-01
```

---

## 7. References to Standards

### 7.1. In Documentation

```markdown
See **STD-FE-001 section 3.1** for Data Isolation rules.
```

### 7.2. In Code (comments)

```typescript
// eslint-disable-next-line max-lines -- See STD-FE-001 Section 2.1
```

### 7.3. In AI Prompts

```text
Follow STD-GIT-001 for commit messages.
Apply STD-FE-001 limits for component size.
```

### 7.4. In Discussions

```
@user: This is a violation of STD-A11Y-001 Section 2.1 (Keyboard Navigation)
```

---

## 8. Registry Updates

### 8.1. Triggers for Updates

| Event | Action |
|-------|--------|
| New standard | Add entry to registry |
| New version of standard | Update Version column |
| Standard deprecation | Add `[DEPRECATED]` |
| Level change | Update Level column |

### 8.2. Registry Location

The registry is maintained in this document (STD-META-001), section 4.

### 8.3. Synchronization

When changing the registry:
1. Update this document
2. Ensure ID in standard header matches registry
3. Commit changes with message `docs(meta): update standard registry`

---

## 9. Backward Compatibility

### 9.1. Changing ID

ID **does not change** after assignment. Exception — domain reorganization with explicit deprecation of old ID.

### 9.2. Deleting Standard

When deleting a standard:
1. ID is marked `[DEPRECATED]` in registry
2. Warning is added to standard file header
3. Number is not reassigned to new standard

---

## 10. FAQ

### Q: Why need IDs if there are file names?

A: File names can change, files can move. ID is a permanent identifier that survives structure refactoring.

### Q: What to do if domain is full (999 standards)?

A: Split domain into subdomains (e.g., `FE-COMP` for components, `FE-PERF` for performance).

### Q: Can IDs be used in CI/CD?

A: Yes. For example, a linter can output: `Error: STD-FE-001 violation — component exceeds 150 lines`.

---

## 11. Checklist Before Publishing New Standard

- [ ] Standard has assigned ID from registry
- [ ] Header matches format (Section 6)
- [ ] Registry updated (Section 4)
- [ ] Related standards specified in `Related` field

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
