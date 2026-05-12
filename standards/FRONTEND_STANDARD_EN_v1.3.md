# Standard: Frontend Development v1.3 (EN)

> ID: STD-FE-001
> Version: 1.3
> Level: **[C] Critical**
> Last Updated: 2025-01
> Related: anti-monolith skill (skills/anti-monolith/SKILL.md)

## 1. Scope
This standard is mandatory for the development of all User Interfaces built on the **React ecosystem**.

**Coverage:**
*   **Frameworks:** Next.js (App Router / Pages Router), Remix, Vite, Pure React.
*   **Language:** TypeScript (Strict Mode).
*   **Runtimes & Tools:** The rules are agnostic to package managers (npm, yarn, pnpm, bun) and runtimes (Node.js, Bun), provided they support the target framework.

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
*   Direct API calls (`fetch`, `axios`, `trpc`) inside Client Components are PROHIBITED.
*   Direct access to global stores (Zustand, Redux, Context) in leaf UI components is discouraged.

**Next.js Implementation:**
*   Server Components: Data fetching is permitted and recommended.
*   Client Components: Data arrives via props or custom hooks.

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

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2023-10 | Initial version |
| 1.1 | 2023-10 | Added Page/Route limit (40 lines) |
| 1.2 | 2025-01 | Merged anti-monolith patterns, examples, refactoring strategy |
| 1.3 | 2025-01 | Added Recommended/Hard limits, sections/features distinction, ESLint config, dynamic imports rules, co-location principle, exception documentation format |

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
