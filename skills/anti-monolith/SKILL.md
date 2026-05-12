---
name: anti-monolith
description: >
  Anti-monolith standard for React/Next.js projects. Enforces modular component architecture,
  file size limits, single-responsibility components, custom hook extraction, data-layer separation,
  barrel exports, strict layer dependency rules, dynamic imports, and ESLint integration.
  Activate whenever the user is creating React components, building Next.js pages, refactoring
  large files, setting up a component library, writing page.tsx or layout.tsx files, or mentions
  "monolith", "too long", "refactor", "component library", "design system", "modular", "split",
  "extract component", "file too big", "too many useState", "dynamic import", "code splitting",
  or any situation where a React/Next.js file is growing beyond manageable size.
  Also use proactively when scaffolding new projects to ensure the architecture is modular from the start.
---

# Anti-Monolith Standard for React/Next.js

## Why this matters

Monolithic components are the #1 cause of unmaintainable React code. A single 1000+ line page.tsx with 15+ useState hooks, inline sub-components, and direct data fetching makes the code impossible to test, reuse, or reason about. This skill prevents that pattern from ever forming.

---

## The 7 Rules

### Rule 1: Line Limits

Hard boundaries that force decomposition:

| Unit | Recommended | Hard limit | Action if exceeded |
|------|------------|-----------|-------------------|
| Single component function | 100 lines | 200 lines | Extract sub-components |
| Single file | 150 lines | 250 lines | Split into multiple files |
| Custom hook | 50 lines | 100 lines | Split into smaller hooks |
| Barrel index.ts | 30 lines | 50 lines | Group into sub-barrels |

**How to count:** Lines of code excluding blank lines and comments.

**When a component reaches 150+ lines** but cannot be reasonably split (e.g., a DataTable with complex conditional JSX), document the reason with a comment at the top of the function:

```typescript
// [ANTI-MONOLITH EXCEPTION] This component has 170 lines because it renders
// 12 conditional columns in a data table. Extracting each column into a separate
// component would fragment the table API. Revisit if complexity grows.
function DataTable({ columns, data, sortConfig, filters }: DataTableProps) {
```

**Auto-flag in CI:** Any component exceeding the hard limit (200 lines) should trigger an automated PR comment requesting decomposition.

**Exceptions:** Configuration objects, large type definitions, and generated code may exceed limits. Move them to separate files.

### Rule 2: Maximum 3 useState per Component

When a component needs 4 or more useState calls, the state logic must be extracted into a custom hook.

**Escalation path:**
- 1-3 useState: Fine, keep in component
- 4-6 useState: Extract into a custom hook OR use `useReducer` for related state
- 7+ useState: Mandatory custom hook extraction — no exceptions

```typescript
// BAD: 8 useState in one component
function Dashboard() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [favorites, setFavorites] = useState([])
  const [selected, setSelected] = useState(null)
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
}

// GOOD: State extracted into hooks
function Dashboard() {
  const filters = useDashboardFilters()    // query, category, sortBy, viewMode
  const { items, isLoading, error } = useDashboardData(filters)
  const { favorites, toggleFavorite } = useFavorites()
  const [selected, setSelected] = useState(null)  // only local UI state
}

// ACCEPTABLE: useReducer for tightly coupled state
function FormWizard() {
  const [state, dispatch] = useReducer(formReducer, initialState)
  // Instead of 6 separate useState for step, values, errors, touched, isValid, isSubmitting
}
```

**Why:** Each useState is a potential source of re-renders and bugs. Grouping related state into hooks makes the logic testable, reusable, and readable.

### Rule 3: Components Do Not Fetch Data

A Client Component should never call fetch, axios, or any data-loading function directly. Data arrives through props, custom hooks, or Server Components.

```typescript
// BAD: Component fetches its own data
function UserList() {
  const [users, setUsers] = useState([])
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers)
  }, [])
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}

// GOOD: Data comes from props (most testable)
function UserList({ users }: { users: User[] }) {
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}

// GOOD: Data comes from a hook (recommended pattern)
function UserPage() {
  const { users, isLoading } = useUsers()
  if (isLoading) return <Skeleton />
  return <UserList users={users} />
}

// BEST: React Query / TanStack Query integration
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
  })
}
// The component never knows about fetch — it only knows useUsers()
```

**Server Components exception:** In Next.js App Router, Server Components can and should fetch data directly. This is the recommended pattern:

```typescript
// Server Component — direct fetch is correct here
async function UserPage() {
  const users = await db.user.findMany()
  return <UserList users={users} />
}
```

**React Query is recommended** for Client Components that need data. It handles caching, revalidation, and loading states, eliminating the need for hand-rolled useEffect + fetch patterns. The hook wraps useQuery; the component only sees the hook's return value.

**Why:** Separating data loading from rendering makes components testable (pass mock data), reusable in different contexts, and eliminates useEffect-related bugs.

### Rule 4: Barrel Exports (index.ts)

Every directory that contains components or hooks must have an index.ts barrel file. The project must have a single master export.

```text
packages/react/src/
+-- ui/
|   +-- Button.tsx
|   +-- Card.tsx
|   +-- Input.tsx
|   +-- index.ts          <- export { Button } from './Button'
+-- sections/
|   +-- HeroSection.tsx
|   +-- FooterSection.tsx
|   +-- index.ts          <- export { HeroSection } from './HeroSection'
+-- hooks/
|   +-- useTheme.ts
|   +-- index.ts          <- export { useTheme } from './useTheme'
+-- index.ts              <- MASTER EXPORT
```

**Explicit exports preferred over wildcards:**

```typescript
// PREFERRED: Explicit — better for Fast Refresh, tree-shaking, and IDE support
export { Button } from './Button'
export { Card } from './Card'
export { Input } from './Input'

// AVOID in directories with 10+ components: Can slow Fast Refresh and bundler
export * from './ui'
```

**When to use `export *`:** Only in the master index.ts with a small number of sub-modules (under 8). For large directories (50+ shadcn/ui components), use explicit named exports.

Master export (index.ts at root):

```typescript
export { Button, Card, Input } from './ui'
export { HeroSection, FooterSection } from './sections'
export { useTheme, useMediaQuery } from './hooks'
export { ThemeProvider, ErrorBoundary } from './providers'
```

Consumer imports from a single source:

```typescript
import { Button, HeroSection, useTheme } from '@my-org/ui'
```

**Why:** Barrel exports create a clean public API, enable tree-shaking, and prevent consumers from depending on internal file paths. Explicit exports protect Fast Refresh performance in development.

### Rule 5: Layer Separation

Components are organized in layers. Dependencies flow strictly downward:

```text
tokens/       <- Colors, spacing, typography (no React, no logic)
  ^
ui/           <- Button, Card, Input (pure presentation, no state, no hooks)
  ^
sections/     <- HeroSection, NavigationSection (compose ui/ components, NO own state)
  ^
features/     <- FlowCanvas, AgentHierarchy (complex, HAVE own state and hooks)
  ^
hooks/        <- useTheme, useMediaQuery (stateful logic, no JSX)
  ^
providers/    <- ThemeProvider, ErrorBoundary (wrap the app)
```

**Clear distinction between sections and features:**

| | sections/ | features/ |
|---|-----------|-----------|
| **Own state** | No — only props and children | Yes — useState, useReducer, custom hooks |
| **Calls hooks** | No (only from props) | Yes |
| **Purpose** | Layout composition of ui/ components | Self-contained interactive blocks |
| **Example** | HeroSection, FooterSection | FlowCanvas, SearchPanel, DataTableInteractive |
| **Testability** | Snapshot test with props | Integration test with state changes |

**When unsure, ask:** "Does this component manage its own state?" If yes -> features/. If it only receives data through props -> sections/.

**Common borderline cases:**

| Component | Layer | Why |
|-----------|-------|-----|
| UserProfileCard (displays data) | sections/ | No state, receives user prop |
| UserProfileCard (editable form) | features/ | Has form state, validation |
| Navigation (highlight current) | sections/ | Active item from prop |
| Navigation (collapsible menu) | features/ | Has isOpen state |
| TagList (static) | sections/ | Pure rendering of tags prop |
| TagInput (add/remove) | features/ | Has input state, keyboard handlers |

**Layer rules:**
- `tokens` imports nothing from other layers
- `ui` imports only from `tokens`
- `sections` imports from `ui` and `tokens` — never calls hooks or manages state
- `features` imports from `sections`, `ui`, `hooks`, and `tokens`
- `hooks` imports only from `tokens` (or external libraries)
- `providers` imports from `hooks`, `ui`, and `tokens`
- No upward imports. Ever. If `ui/button.tsx` imports from `features/`, the architecture is broken.

**Why:** Layer violations create circular dependencies, make testing impossible, and lead to the "everything depends on everything" problem that makes monoliths intractable. The sections/features distinction prevents the "where does this go?" debate.

### Rule 6: Dynamic Imports for Heavy Components

If a component exceeds 200 lines OR imports a heavy dependency (Three.js, Recharts, Monaco Editor, D3, etc.), use dynamic import:

```typescript
// Heavy component loaded only when needed
const FlowCanvas = dynamic(() => import('@/components/features/FlowCanvas'), {
  loading: () => <CanvasSkeleton />,
  ssr: false,  // if component uses browser APIs
})

// Usage is the same — transparent to the consumer
function FlowPage() {
  return <FlowCanvas initialNodes={nodes} />
}
```

**When to use dynamic import:**

| Condition | Dynamic import? |
|-----------|----------------|
| Component < 200 lines, no heavy deps | No |
| Component > 200 lines | Consider — extract first, then dynamic |
| Imports Three.js, D3, Recharts, Monaco | Yes |
| Below the fold (not visible on first paint) | Yes |
| Used in a modal/tab that opens on click | Yes |
| Critical for first paint (hero, navigation) | No |

**In Next.js App Router:** Use `next/dynamic` for Client Components. For Server Components, use the standard `import()` in Suspense boundaries.

**Why:** Heavy components dramatically increase bundle size. A Three.js scene adds 500KB+ to the initial load. Dynamic imports ensure users only download what they see.

### Rule 7: Enforce with Tooling

Rules without enforcement are suggestions. Set up these automated checks:

**ESLint configuration:**

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'max-lines': ['warn', { max: 250, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
    'react-hooks/exhaustive-deps': 'error',
  },
  overrides: [
    {
      // Stricter for components
      files: ['**/components/**/*.tsx', '**/sections/**/*.tsx', '**/features/**/*.tsx'],
      rules: {
        'max-lines-per-function': ['error', { max: 150 }],
      },
    },
  ],
}
```

**Layer boundary enforcement** with `eslint-plugin-boundaries`:

```javascript
// .eslintrc.js — boundaries config
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

**CI check — automated PR comment** when limits are exceeded:

```yaml
# .github/workflows/anti-monolith.yml
name: Anti-Monolith Check
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check file sizes
        run: |
          find src -name '*.tsx' -o -name '*.ts' | while read f; do
            lines=$(wc -l < "$f")
            if [ $lines -gt 250 ]; then
              echo "::warning file=$f::File has $lines lines (max 250). Consider splitting."
            fi
          done
```

**Plop.js templates** for generating correctly structured components:

```bash
# Generate a new feature component with all required files
npx plop feature UserSearchPanel
# Creates:
#   features/UserSearchPanel/UserSearchPanel.tsx  (< 150 lines)
#   features/UserSearchPanel/useUserSearch.ts     (hook)
#   features/UserSearchPanel/index.ts             (barrel)
```

---

## Practical Checklist

Before submitting any React/Next.js file, verify:

- [ ] File is under 250 lines (recommended under 150)
- [ ] No component function exceeds 200 lines (recommended under 150)
- [ ] No more than 3 useState in any single component (4+ -> custom hook)
- [ ] No direct fetch/axios calls in Client Components
- [ ] Every component directory has an index.ts barrel
- [ ] No upward layer imports (features -> ui is fine, ui -> features is forbidden)
- [ ] Each component has a single responsibility (one reason to change)
- [ ] Complex state logic is extracted into custom hooks
- [ ] Heavy components use dynamic imports
- [ ] sections/ have no own state; features/ may have state
- [ ] Barrel exports are explicit (not `export *`) for directories with 10+ files

---

## Refactoring Strategy

When encountering an existing monolith (e.g., a 1200-line page.tsx), follow this sequence:

1. **Identify sub-components** — Find all functions starting with uppercase that return JSX. Extract each into its own file.
2. **Identify state clusters** — Group related useState calls (4+ per group). Extract each group into a custom hook.
3. **Identify data loading** — Move all useEffect + fetch patterns into custom hooks (preferably with TanStack Query) or Server Components.
4. **Classify each component** — sections/ (no state) or features/ (has state). If unsure, default to features/.
5. **Add dynamic imports** — For components with heavy dependencies or below-the-fold content.
6. **Create barrel exports** — Add index.ts files for each directory. Use explicit exports.
7. **Verify layer separation** — Check that no upward imports exist. Run ESLint boundaries check.
8. **Test** — Ensure the refactored code works identically to the original.

The result: a 40-line page.tsx that composes well-named, testable, reusable components.

---

## File Naming Convention

| Type | Pattern | Example | Rationale |
|------|---------|---------|-----------|
| Component | PascalCase.tsx | `HeroSection.tsx` | Matches component name, standard in React/TS |
| Hook | camelCase.ts | `useTheme.ts` | Matches function name, standard convention |
| Provider | PascalCase.tsx | `ThemeProvider.tsx` | Matches component name |
| Barrel | index.ts | `index.ts` | Standard Node.js convention |
| Types | PascalCase.types.ts | `Button.types.ts` | Clear association with component |
| Utils | camelCase.ts | `formatDate.ts` | Standard TS utility naming |
| Constants | camelCase.ts | `apiRoutes.ts` | Standard TS naming |
| Page (Next.js) | page.tsx | `page.tsx` | Next.js App Router convention |
| Layout (Next.js) | layout.tsx | `layout.tsx` | Next.js App Router convention |

**Folder structure with PascalCase components:**

```text
components/
+-- ui/
|   +-- Button.tsx
|   +-- Card.tsx
|   +-- index.ts
+-- sections/
|   +-- HeroSection.tsx
|   +-- index.ts
+-- features/
|   +-- FlowCanvas.tsx
|   +-- useFlowCanvas.ts      <- hook co-located with its feature
|   +-- index.ts
```

**Co-location principle:** A hook that serves only one feature lives in the same directory as that feature. Shared hooks go in `hooks/`.

---

## What This Skill Does NOT Cover

- Styling methodology (CSS Modules, Tailwind, styled-components — all compatible)
- State management libraries (Zustand, Redux, Jotai — use what fits, but still extract hooks)
- Testing frameworks (Vitest, Jest — but the modular structure makes testing easy)
- Build tools (Vite, Webpack, Turbopack — architecture is tool-agnostic)
- Routing patterns (Next.js App Router, React Router — apply rules within each route)
