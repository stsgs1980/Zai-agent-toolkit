# Standard: Frontend Development v1.5 (EN)

> ID: STD-FE-001
> Version: 1.5
> Level: **[C] Critical**
> Last Updated: 2026-05
> Related: WCAG 2.1 AA (STD-A11Y-001), GitHub Standard (STD-GIT-001), Error Handling (STD-ERR-001)

## 1. Scope
This standard is mandatory for the development of all User Interfaces built on the **React ecosystem**.

**Coverage:**
-   **Frameworks:** Next.js (App Router / Pages Router), Remix, Vite, Pure React.
-   **Language:** TypeScript (Strict Mode).
-   **Runtimes & Tools:** The rules are agnostic to package managers (npm, yarn, pnpm, bun) and runtimes (Node.js, Bun), provided they support the target framework.

---

## 2. Code Complexity Metrics
These limits are hard thresholds. Code exceeding limits must not be merged without documented exception.

### 2.1. Size Constraints

| Unit | Recommended | Hard limit | Action if exceeded |
|------|------------|-----------|-------------------|
| **Component function** | 100 lines | 200 lines | Extract sub-components |
| **File (Module)** | 150 lines | 250 lines | Split into multiple files |
| **Page / Route** | 40 lines | 40 lines | Composition Roots only |
| **Custom hook** | 50 lines | 100 lines | Split into smaller hooks |
| **Barrel index.ts** | 30 lines | 50 lines | Group into sub-barrels |

**How to count:** Lines of code excluding blank lines and comments.

**Exception documentation:** When a component reaches 150+ lines but cannot be reasonably split, document the reason:

```typescript
// [ANTI-MONOLITH EXCEPTION] This component has 170 lines because it renders
// 12 conditional columns in a data table. Extracting each column into a separate
// component would fragment the table API. Revisit if complexity grows.
function DataTable({ columns, data, sortConfig, filters }: DataTableProps) {
```

**Auto-flag in CI:** Any component exceeding the hard limit (200 lines) triggers an automated PR comment requesting decomposition.

### 2.2. State Management

**Rule:** A single React component (Client Component) MUST contain **no more than 3 `useState` hooks**.

**Escalation path:**

| useState count | Action |
|----------------|--------|
| 1-3 | Fine, keep in component |
| 4-6 | Extract into custom hook OR use `useReducer` |
| 7+ | Mandatory custom hook extraction |

**Example — BAD:**

```typescript
function Dashboard() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [favorites, setFavorites] = useState([])
  const [selected, setSelected] = useState(null)
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  // 8 useState — VIOLATION
}
```

**Example — GOOD:**

```typescript
function Dashboard() {
  const filters = useDashboardFilters()    // query, category, sortBy, viewMode
  const { items, isLoading, error } = useDashboardData(filters)
  const { favorites, toggleFavorite } = useFavorites()
  const [selected, setSelected] = useState(null)  // only local UI state
}
```

---

## 3. Architectural Constraints

### 3.1. Data Isolation

**Principle:** Strict separation between Smart (Container) and Dumb (Presentational) components.

**Prohibitions:**
-   Direct API calls (`fetch`, `axios`, `trpc`) inside Client Components are PROHIBITED.
-   Direct access to global stores (Zustand, Redux, Context) in leaf UI components is discouraged.

**Next.js Implementation:**
-   Server Components: Data fetching is permitted and recommended.
-   Client Components: Data arrives via props or custom hooks.

**Recommended: TanStack Query**

```typescript
// Hook wraps useQuery — component only sees the return value
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
  })
}
```

### 3.2. Modularity & Exports

**Requirement:** Every module (folder) MUST have a Public API (Barrel Export) via `index.ts`.

**Explicit exports preferred:**

```typescript
// PREFERRED — better for Fast Refresh, tree-shaking, IDE support
export { Button } from './Button'
export { Card } from './Card'

// AVOID in directories with 10+ components
export * from './ui'
```

**Prohibition:** Deep imports are PROHIBITED.

| Violation | Compliance |
|-----------|------------|
| `import { Button } from 'shared/ui/Button/Button'` | `import { Button } from 'shared/ui'` |

### 3.3. Layer Separation

**Methodology:** Feature-Sliced Design (FSD) with sections/features distinction.

```text
tokens/       <- Colors, spacing, typography (no React, no logic)
  ^
ui/           <- Button, Card, Input (pure presentation, no state, no hooks)
  ^
sections/     <- HeroSection, NavigationSection (compose ui/, NO own state)
  ^
features/     <- FlowCanvas, AgentHierarchy (complex, HAVE own state)
  ^
hooks/        <- useTheme, useMediaQuery (stateful logic, no JSX)
  ^
providers/    <- ThemeProvider, ErrorBoundary (wrap the app)
```

**sections/ vs features/ distinction:**

| | sections/ | features/ |
|---|-----------|-----------|
| **Own state** | No — only props | Yes — useState, useReducer, hooks |
| **Calls hooks** | No | Yes |
| **Purpose** | Layout composition | Self-contained interactive blocks |
| **Example** | HeroSection, FooterSection | FlowCanvas, SearchPanel |

**When unsure:** "Does this component manage its own state?" If yes -> features/. If only props -> sections/.

**Layer rules:**

| Layer | Can import from |
|-------|-----------------|
| `tokens` | Nothing from other layers |
| `ui` | Only from `tokens` |
| `sections` | From `ui` and `tokens` — never hooks or state |
| `features` | From `sections`, `ui`, `hooks`, `tokens` |
| `hooks` | Only from `tokens` (or external libraries) |
| `providers` | From `hooks`, `ui`, `tokens` |

**No upward imports. Ever.**

---

## 4. Dynamic Imports

If a component exceeds 200 lines OR imports a heavy dependency (Three.js, Recharts, Monaco, D3), use dynamic import:

```typescript
const FlowCanvas = dynamic(() => import('@/components/features/FlowCanvas'), {
  loading: () => <CanvasSkeleton />,
  ssr: false,
})
```

**When to use:**

| Condition | Dynamic import? |
|-----------|----------------|
| Component < 200 lines, no heavy deps | No |
| Imports Three.js, D3, Recharts, Monaco | Yes |
| Below the fold (not visible on first paint) | Yes |
| Used in a modal/tab that opens on click | Yes |
| Critical for first paint (hero, navigation) | No |

---

## 5. File Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Component | PascalCase.tsx | `HeroSection.tsx` |
| Hook | camelCase.ts | `useTheme.ts` |
| Provider | PascalCase.tsx | `ThemeProvider.tsx` |
| Barrel | index.ts | `index.ts` |
| Types | PascalCase.types.ts | `Button.types.ts` |
| Utils | camelCase.ts | `formatDate.ts` |

**Co-location principle:** A hook that serves only one feature lives in the same directory as that feature. Shared hooks go in `hooks/`.

---

## 6. Enforcement

### 6.1. ESLint Configuration

```javascript
module.exports = {
  rules: {
    'max-lines': ['warn', { max: 250, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
    'react-hooks/exhaustive-deps': 'error',
  },
  overrides: [
    {
      files: ['**/components/**/*.tsx', '**/sections/**/*.tsx', '**/features/**/*.tsx'],
      rules: {
        'max-lines-per-function': ['error', { max: 150 }],
      },
    },
  ],
}
```

### 6.2. Layer Boundary Enforcement

```javascript
'boundaries/element-types': [
  'error',
  {
    default: 'allow',
    rules: [
      { from: 'ui', disallow: ['sections', 'features', 'hooks', 'providers'] },
      { from: 'sections', disallow: ['features', 'hooks', 'providers'] },
      { from: 'features', disallow: ['providers'] },
    ],
  },
]
```

### 6.3. Code Review Policy

Any violation not caught by linter is grounds for **Request Changes**.

---

## 7. Refactoring Strategy

When encountering a monolith (e.g., 1200-line `page.tsx`):

1. **Identify sub-components** — Extract functions returning JSX.
2. **Identify state clusters** — Group `useState`, extract into hooks.
3. **Identify data loading** — Move to hooks or Server Components.
4. **Classify each** — sections/ (no state) or features/ (has state).
5. **Add dynamic imports** — For heavy dependencies.
6. **Create barrel exports** — Use explicit exports.
7. **Verify layer separation** — Run ESLint boundaries check.
8. **Test** — Ensure identical behavior.

**Result:** A 40-line `page.tsx` that composes testable, reusable components.

---

## 8. Pre-merge Checklist

- [ ] File is under 250 lines (recommended under 150)
- [ ] No component exceeds 200 lines (recommended under 150)
- [ ] No more than 3 `useState` per component (4+ -> custom hook)
- [ ] No direct `fetch`/`axios` in Client Components
- [ ] Every component directory has `index.ts` barrel
- [ ] No upward layer imports
- [ ] sections/ have no state; features/ may have state
- [ ] Heavy components use dynamic imports
- [ ] Barrel exports are explicit (not `export *`) for 10+ files
- [ ] Exception documented with `[ANTI-MONOLITH EXCEPTION]` comment

---

## 9. Exception Handling

Deviations require:
1. Tech Debt ticket (tagged `tech-debt`)
2. Tech Lead approval
3. `[ANTI-MONOLITH EXCEPTION]` comment in code

---

## 10. API Route Standard (Next.js App Router)

### 10.1. Route Handler Structure

Each route handler MUST be a single file with maximum 80 lines of logic:

```text
src/app/api/
+-- users/
|   +-- route.ts          <- GET (list), POST (create)
|   +-- [id]/
|       +-- route.ts      <- GET (detail), PATCH (update), DELETE (remove)
+-- documents/
|   +-- route.ts
|   +-- [id]/
|       +-- route.ts
```

### 10.2. Response Format

All API responses MUST follow a consistent structure:

```typescript
// Success response
return NextResponse.json({ success: true, data: result })

// Error response
return NextResponse.json(
  { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } },
  { status: 400 }
)
```

### 10.3. Input Validation

All input MUST be validated with Zod before processing. For comprehensive validation schemas and security considerations, see **STD-SEC-001 Section 3.1** (validation schemas, SQL injection prevention) and **STD-FE-001 Section 10.4** (error handling).

```typescript
import { z } from 'zod'

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
})

export async function POST(request: Request) {
  const body = await request.json()
  const result = CreateUserSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.errors } },
      { status: 400 }
    )
  }

  // Process validated data
  const user = await db.user.create({ data: result.data })
  return NextResponse.json({ success: true, data: user }, { status: 201 })
}
```

### 10.4. Error Handling

API routes MUST NOT leak internal error details to clients. For complete error handling patterns, see **STD-ERR-001 Section 5.2** (error handler middleware) and **STD-SEC-001 Section 8** (sandbox core checklist).

### 10.5. Auto-Backup Before Mutations

Write mutations (POST, PATCH, DELETE) SHOULD create a backup before execution. The backup implementation MUST follow these rules:

1. Non-blocking: backup failure MUST NOT prevent the mutation (log error, continue)
2. Location: `/tmp/` directory (system temp, not committed to git)
3. Format: `{entity}-{timestamp}.json` (e.g., `user-20260518T120000.json`)
4. Retention: cleanup backups older than 24 hours on next backup call

```typescript
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await autoBackup()  // Non-critical — failure logged but does not block
    await db.user.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
      { status: 404 }
    )
  }
}
```

### 10.6. Deduplication on Create

All POST endpoints MUST check for existing records before creating:

```typescript
const existing = await db.user.findFirst({
  where: { email: { equals: result.data.email } }
})
if (existing) {
  return NextResponse.json({ success: true, data: existing }, { status: 200 })
}
```

### 10.7. Pre-merge Checklist for API Routes

- [ ] Input validated with Zod
- [ ] Response format is { success, data? / error? }
- [ ] No internal error details in responses
- [ ] Write mutations call autoBackup()
- [ ] Create endpoints check for duplicates
- [ ] File is under 80 lines of logic
- [ ] DELETE requires confirmation (client-side AlertDialog)

---

## 11. UI Theme & Color System

### 11.1. Dark Theme

Dark theme is required. Use only CSS variables for theme-aware colors:

| Token | Usage |
|-------|-------|
| `bg-primary` | Primary background |
| `text-foreground` | Primary text |
| `bg-muted` | Muted/subtle background |
| `text-muted-foreground` | Secondary/helper text |

Never hardcode hex colors in components. All color references MUST go through CSS variables to ensure theme switching works correctly. See STD-A11Y-001 section 7 for contrast validation requirements.

### 11.2. Color Palette

Default palette: `stone`, `slate`, `neutral`, `green`, `emerald`.

`indigo` / `blue` -- only if explicitly requested by the user.

Rationale: the default palettes are selected for WCAG 2.1 AA contrast compliance across both light and dark themes. Non-default palettes require manual contrast verification per STD-A11Y-001 section 1.1.

**Custom theme presets** (e.g., Champagne, Cyan Night, Zinc) MUST be validated against STD-A11Y-001 section 7 contrast requirements before use. Each preset MUST document its contrast ratios for all token pairs.

### 11.3. Anti-Fragility: Error Isolation

Non-critical operations (backup, AI analysis, background sync) MUST NOT break the main user flow. If a non-critical operation fails, log the error and continue.

Critical operations (save, delete, submit) MUST show the error to the user via toast notification with a clear, actionable message.

```typescript
// Non-critical: failure is logged, does not block
try {
  await autoBackup()  // non-blocking
} catch (e) {
  console.error('Backup failed:', e)
  // continue main flow
}

// Critical: failure must reach the user
try {
  await saveDocument(data)
} catch (e) {
  toast({ title: 'Save failed', description: 'Please try again', variant: 'destructive' })
}
```

### 11.4. Deletion UI Patterns

All destructive actions MUST require explicit user confirmation via AlertDialog before execution.

| Entity | Location | Trigger | Confirmation |
|--------|----------|---------|-------------|
| Note | List + Editor | Trash2 button | AlertDialog |
| Extracted instruction | List | Trash2 button | AlertDialog |
| Built-in instruction | List | Trash2 button | AlertDialog (with localStorage persistence) |
| Document | View | Trash2 button | AlertDialog |
| Category | Sidebar | Trash2 button (hover) | AlertDialog |
| Tag | Sidebar | X button (hover) | AlertDialog |
| Term | Dictionary | Trash2 button (hover) | AlertDialog |
| Bulk items | List | Bulk select + delete | AlertDialog with count |

When possible, prefer soft-delete (archive) over hard-delete. See STD-FE-001 section 10.5 for auto-backup before mutations.

---

## 12. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2023-10 | Initial version |
| 1.1 | 2023-10 | Added Page/Route limit (40 lines) |
| 1.2 | 2025-01 | Merged anti-monolith patterns, examples, refactoring strategy |
| 1.3 | 2025-01 | Added Recommended/Hard limits, sections/features distinction, ESLint config, dynamic imports rules, co-location principle, exception documentation format |
| 1.4 | 2026-05 | Relocated from STD-ENV-001: dark theme (11.1), color palette (11.2), anti-fragility/error isolation (11.3), deletion UI patterns (11.4). Added Related: STD-ERR-001. |
| 1.5 | 2026-05 | K-06/K-07: replaced duplicated error handling (10.4) and Zod validation (10.3) with cross-references to STD-ERR-001 and STD-SEC-001. K-08: added autoBackup() specification (10.5). K-09: added custom theme preset validation rule (11.2). |

---

## 13. Cross-References

| Standard | Relationship |
|----------|-------------|
| STD-A11Y-001 | WCAG accessibility: theme contrast validation (Section 11.2), component keyboard/screen reader patterns |
| STD-ERR-001 | Error handling: error boundaries, API error responses (cross-ref from Section 10.4) |
| STD-SEC-001 | Input validation: Zod schemas, sanitization (cross-ref from Section 10.3) |
| STD-GIT-001 | Git commit format for frontend code changes |
| STD-ENV-001 | Reproducibility: .env.example for theme tokens, path.resolve() for DB |

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
