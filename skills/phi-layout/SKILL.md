---
name: golden-grid
version: 2.2
description: "CSS Grid layouts based on golden ratio, Fibonacci, and Bento Grid. Use when users want harmonious page compositions, nature-inspired grid proportions, Fibonacci spacing, Bento box layouts, masonry grids, timeline layouts, Linear/Vercel-style zeitgeist pages, or any layout beyond standard symmetric grids. Triggers: golden ratio, Fibonacci, Fibonacci layout, Fibonacci spacing, phi grid, golden grid, golden CSS grid, golden grid layout, golden grid template, bento grid, bento layout, bento box, sacred geometry, asymmetric grid, divine proportion, modular scale grid, neutral palette, masonry, masonry grid, timeline layout, golden timeline, zeitgeist, staggered layout, Linear-style, Vercel-style, dark mode grid, accessible grid, container query grid."
---

# Golden Grid - Harmonious CSS Grid Layouts

This skill applies the golden ratio (phi approximately 1.618) and Fibonacci sequence to CSS Grid, producing layouts that feel naturally balanced. Standard grids use equal columns; golden-grid uses proportional relationships found in nature, architecture, and art to create visually compelling compositions that draw the eye along intentional focal paths.

## Severity Tags

Rules in this skill are tagged with severity levels:

- **[C] Critical** -- Mandatory. Violation is an error. Agent MUST follow this rule.
- **[W] Warning** -- Recommended. Violation triggers a warning. Agent SHOULD follow unless there is a justified reason to deviate.
- **[I] Informational** -- Supplementary. Useful context, not enforced. Agent considers when applicable.

## Priority and Compatibility

When this skill is active alongside other styling skills (ui-ux-pro-max, visual-design-foundations), golden-grid takes priority for:

- **Grid layout structure** (`grid-template-columns`, `grid-template-rows`) -- golden-grid always wins
- **Spacing values** -- Fibonacci scale replaces the 8-point grid when golden proportions are requested
- **Token naming** -- use `--fib-*` and `--phi-*` tokens instead of `--space-*` tokens

Other skills retain priority for:
- **Component styling** (borders, shadows, typography outside the grid system)
- **Color palette** (if the project has an existing chromatic brand palette, use it; golden-grid only provides the neutral subset)
- **Interaction patterns** (hover states, transitions beyond Fibonacci timing)

[C] When golden-grid is invoked, its spacing and grid tokens MUST override conflicting tokens from other skills. Document the override in a comment: `/* golden-grid override: Fib-val 5 replaces default gap */`

## FORBIDDEN

The following practices are explicitly forbidden when using this skill:

- FORBIDDEN: Using fixed pixel widths in `grid-template-columns` when golden proportions are requested. Use `fr` units with `1.618` multipliers instead.
- FORBIDDEN: Equal-width columns (e.g., `repeat(3, 1fr)`) when the user requests golden ratio or Fibonacci proportions. Equal columns contradict the asymmetric balance principle.
- FORBIDDEN: Arbitrary gap values (e.g., `gap: 20px`, `gap: 15px`) when Fibonacci spacing is specified. Use the Fibonacci scale: `0.75rem`, `1.5rem`, `2.5rem`, `4rem`.
- FORBIDDEN: Relying solely on color (neutral tone differences) to convey information. Always pair with text labels, patterns, or icons for accessibility.
- FORBIDDEN: Omitting responsive behavior. Every golden grid must define at least a mobile collapse strategy.
- FORBIDDEN: Using `float` or `flexbox` for primary layout structure when CSS Grid is available and the pattern calls for explicit grid tracks.

## Workflow

When applying this skill, follow this structured workflow:

### Step 1: Identify the Pattern

Analyze the user's request to determine the appropriate layout pattern from the 18 available:

```
User request                    -> Pattern
---------------------------------------------------------
"two columns, golden ratio"     -> 01 Golden Split
"sidebar + content"             -> 01 or 07 Holy Grail
"dashboard with charts"         -> 12 Dashboard Golden
"bento, card grid"              -> 05 or 06 Bento
"Pinterest-style"               -> 13 Masonry Golden
"timeline, roadmap"             -> 14 Golden Timeline
"Linear/Vercel style"           -> 15 Zeitgeist Grid
"complex mixed content"         -> 16 Masonry Bento
"hero with diagonal emphasis"   -> 17 Golden Triangle
"centered focal point"          -> 18 Sacred Geometry
"magazine, editorial"           -> 11 Magazine Layout
"multi-column data"             -> 02 Fibonacci Columns
"compatible with design system" -> 03 Phi Grid 12-col
"portfolio, spiral"             -> 04 Spiral Grid
"card catalog"                  -> 08 Golden Card Grid
"diagonal visual flow"          -> 09 Diagonal Fibonacci
"nested components"             -> 10 Nested Grids
"news, blog"                    -> 11 Magazine Layout
```

### Step 2: Apply Fibonacci Spacing

Select gaps from the Fibonacci scale:
- `gap: 0.75rem` (12px) -- tight, inside cards
- `gap: 1.5rem` (24px) -- default, standard grid
- `gap: 2.5rem` (40px) -- relaxed, section-level
- `gap: 4rem` (64px) -- loose, major divisions

### Step 3: Build the Grid

1. Define `grid-template-columns` with golden/Fibonacci `fr` values
2. Define `grid-template-rows` if needed (same principle)
3. Place items with `grid-column` and `grid-row` spans
4. Apply Fibonacci gap values

### Step 4: Add Responsive Behavior

- **Desktop (>1024px)**: Full golden proportions
- **Tablet (768-1024px)**: Simplified golden split
- **Mobile (<768px)**: Single column, retain Fibonacci spacing
- [C] Use container queries (`@container`) for component-level responsive. Use media queries for page-level.

### Step 5: Add Dark Mode

Apply dark mode tokens from `references/fibonacci-scale.md`:
- Swap `--color-surface` to `#1a1a1a`
- Invert border depth coding
- [C] Always provide `prefers-color-scheme: dark` overrides when the project supports dark mode.

### Step 6: Verify Accessibility

- Tab order follows visual order (grid source order matches layout)
- Focus rings visible on interactive grid cells
- `prefers-reduced-motion` disables animations
- Color contrast meets WCAG AA (4.5:1 for text)
- Semantic landmarks (`<nav>`, `<main>`, `<aside>`, `<footer>`) used instead of generic `<div>`

### Step 7: Validate Golden Proportions

- Primary content occupies approximately 61.8% of layout area
- Secondary content occupies approximately 38.2%
- Column ratios use `1.618fr` or Fibonacci `fr` values
- Gaps follow Fibonacci spacing scale

## Core Principles

### The Golden Ratio in Layout

The golden ratio divides space so that the ratio of the larger part to the smaller equals the ratio of the whole to the larger. In a 1440px viewport:

- Larger section: `1440 / 1.618 = 890px`
- Smaller section: `1440 - 890 = 550px`
- Verify: `890 / 550 = 1.618`

[C] When creating golden-proportioned columns, use `1fr 1.618fr` (or the inverse) in `grid-template-columns` rather than fixed pixel values. This maintains proportions at every viewport width.

### Fibonacci Spacing Scale

The Fibonacci sequence (0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144) maps directly to pixel/rem values for padding, margins, and gaps. Each Fibonacci VALUE multiplied by the 8px base unit produces the spacing scale. Comments use `Fib-val N` notation to indicate which Fibonacci value is used:

| Fib-val | Calculation | px | rem | Use |
|---------|-------------|-----|-----|-----|
| 3       | 3 x 8       | 24px  | 1.5rem  | Standard grid gap |
| 5       | 5 x 8       | 40px  | 2.5rem  | Section-level gap |
| 8       | 8 x 8       | 64px  | 4rem    | Major layout gap |
| 13      | 13 x 8      | 104px | 6.5rem  | Page area spacing |
| 21      | 21 x 8      | 168px | 10.5rem | Large-scale spacing |
| 34      | 34 x 8      | 272px | 17rem   | Max practical spacing |

[I] The 0.75rem (12px) gap used in tight/bento layouts is a derived step (between 8px and 16px), not a direct Fibonacci value. It is practical but not part of the Fib-val scale.

[W] Use Fibonacci-based gaps (`gap: 1.5rem`, `gap: 2.5rem`, `gap: 4rem`) instead of arbitrary values. This creates consistent visual rhythm.

[I] For very large layouts, Fibonacci values beyond 34 become impractical in pixels. Switch to a modular scale at that point.

## Quick-Start Patterns

### Pattern 01: Golden Split (2-column)

```css
.golden-split {
  display: grid;
  grid-template-columns: 1fr 1.618fr;
  gap: 2.5rem; /* 40px = Fib-val 5 */
  min-height: 100vh;
}
```

Left column is the focal anchor (sidebar, hero text). Right column is the content flow. The eye naturally lands on the larger area first, then the smaller anchor provides contrast.

### Pattern 02: Fibonacci Columns (multi-column)

```css
.fib-columns {
  display: grid;
  grid-template-columns: 1fr 2fr 3fr 5fr;
  gap: 1.5rem; /* 24px = Fib-val 3 */
}
```

Each column follows the Fibonacci ratio. The progressive widening creates a natural reading hierarchy: narrow sidebar, medium aside, wide content.

### Pattern 03: Phi Grid (12-column with golden breakpoints)

```css
.phi-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
}

/* Golden cut at column 7/12 (7:5 ratio = 1.4, close to phi) */
.phi-grid .main-content { grid-column: 1 / 8; }
.phi-grid .sidebar { grid-column: 8 / 13; }
```

A 12-column grid lets you approximate the golden ratio at 7:5 columns. The 12-column base remains compatible with standard design systems while embedding golden proportions.

### Pattern 04: Fibonacci Spiral Grid

```css
.spiral-grid {
  display: grid;
  grid-template-columns: 34fr 21fr 13fr 8fr 5fr 3fr 2fr 1fr;
  grid-template-rows: 34fr 21fr 13fr;
  gap: 1.5rem;
}

.spiral-grid .hero {
  grid-column: 1 / 3; /* 34+21 = 55 total */
  grid-row: 1 / 3;    /* 34+21 = 55 total */
}
```

This creates a layout where content blocks shrink according to the Fibonacci spiral, producing a natural visual flow from the dominant hero down to smaller accent elements.

### Pattern 05: Bento Grid (Golden)

Bento Grid borrows from the Japanese lunch box: each compartment has a different size and purpose. Combined with golden proportions, the largest compartment occupies approximately 61.8% of the area while smaller compartments fill the remaining 38.2% in decreasing Fibonacci ratios.

```css
.golden-bento {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: minmax(120px, auto);
  gap: 1.5rem; /* 24px = Fib-val 3 */
}

/* Hero: 4 of 6 cols = 66.7%, 2 rows */
.golden-bento .hero { grid-column: 1 / 5; grid-row: 1 / 3; }

/* Stats: 2 cols each */
.golden-bento .stat-1 { grid-column: 5 / 7; grid-row: 1; }
.golden-bento .stat-2 { grid-column: 5 / 7; grid-row: 2; }

/* Mid-band: 3 cols */
.golden-bento .mid-band { grid-column: 1 / 4; grid-row: 3; }

/* Accent: 1 col */
.golden-bento .accent { grid-column: 4 / 5; grid-row: 3; }
```

The 6-column bento grid naturally supports golden proportions: 4:2 (2:1), 3:1:2, and 4:1:1 all approximate the 61.8/38.2 split at different scales.

### Pattern 06: Bento Grid (5-column Asymmetric)

```css
.bento-5col {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-auto-rows: minmax(100px, auto);
  gap: 1.5rem;
}

/* 3:2 split -- close to phi (1.5 vs 1.618) */
.bento-5col .main { grid-column: 1 / 4; grid-row: 1 / 3; }
.bento-5col .feature { grid-column: 4 / 6; grid-row: 1; }
.bento-5col .small-a { grid-column: 4 / 5; grid-row: 2; }
.bento-5col .small-b { grid-column: 5 / 6; grid-row: 2; }
```

### Pattern 07: Asymmetric Holy Grail

```css
.holy-grail-golden {
  display: grid;
  grid-template-columns: 3fr 13fr 5fr;  /* Fib proportions */
  grid-template-rows: auto 1fr auto;
  gap: 1.5rem;
  min-height: 100vh;
}

.holy-grail-golden header  { grid-column: 1 / -1; }
.holy-grail-golden nav     { grid-column: 1; grid-row: 2; }
.holy-grail-golden main    { grid-column: 2; grid-row: 2; }
.holy-grail-golden aside   { grid-column: 3; grid-row: 2; }
.holy-grail-golden footer  { grid-column: 1 / -1; }
```

### Pattern 08: Golden Card Grid

```css
.golden-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2.5rem;
}

.golden-card {
  display: grid;
  grid-template-rows: 1.618fr 1fr;
  gap: 1.5rem;
}
```

### Pattern 09: Diagonal Fibonacci

```css
.diagonal-fib {
  display: grid;
  grid-template-columns: 1fr 2fr 3fr 5fr;
  grid-template-rows: 5fr 3fr 2fr 1fr;
  gap: 1.5rem;
}
```

### Pattern 10: Nested Golden Grids

```css
.outer-golden {
  display: grid;
  grid-template-columns: 1fr 1.618fr;
  gap: 2.5rem;
}

.outer-golden .sidebar {
  display: grid;
  grid-template-rows: 1.618fr 1fr;
  gap: 1.5rem;
}

.outer-golden .content {
  display: grid;
  grid-template-columns: 1fr 2fr 3fr;
  gap: 1.5rem;
}

/* Subgrid variant: child aligns with parent tracks */
.parent-golden {
  display: grid;
  grid-template-columns: 1fr 1.618fr;
  gap: 1.5rem;
}

.nested-card {
  display: grid;
  grid-template-columns: subgrid; /* inherits 1fr and 1.618fr from parent */
  grid-column: span 2;            /* occupies both parent columns */
}
```

[W] Use `subgrid` when child elements must align with parent grid tracks. Use independent nested grids when the child needs its own proportion system. Subgrid browser support: Chrome 117+, Firefox 71+, Safari 16+. Provide a nested grid fallback for older browsers.

### Pattern 11: Magazine Layout

```css
.magazine-layout {
  display: grid;
  grid-template-columns: 5fr 3fr 2fr;  /* Consecutive Fibonacci: 5:3:2 ~ 2.5:1.5:1 ~ golden hierarchy */
  grid-template-rows: 8fr 5fr 3fr;     /* Same Fibonacci sequence for rows: 8:5:3 ~ 2.67:1.67:1 */
  gap: 1.5rem;
}

.magazine-layout .lead-story { grid-column: 1; grid-row: 1 / 3; }
.magazine-layout .feature { grid-column: 2 / 4; grid-row: 1; }
.magazine-layout .side-story { grid-column: 2; grid-row: 2; }
.magazine-layout .quick-read { grid-column: 3; grid-row: 2 / 4; }
.magazine-layout .bottom-row { grid-column: 1 / 3; grid-row: 3; }
```

### Pattern 12: Dashboard Golden

```css
.dashboard-golden {
  display: grid;
  grid-template-columns: 3fr 5fr 2fr;
  grid-template-rows: auto 1fr 1.618fr;
  gap: 1.5rem;
  min-height: 100vh;
}

.dashboard-golden .kpi-bar { grid-column: 1 / -1; grid-row: 1; }
.dashboard-golden .filters { grid-column: 1; grid-row: 2 / 4; }
.dashboard-golden .chart-primary { grid-column: 2 / -1; grid-row: 2; }
.dashboard-golden .data-table { grid-column: 2 / -1; grid-row: 3; }
```

### Pattern 13: Masonry Golden

Pinterest-style variable-height grid where items have Fibonacci-proportioned row spans. Uses `grid-auto-rows` with a 40px unit and `span` values from the Fibonacci sequence (2, 3, 5, 8, 13) to approximate masonry with full CSS Grid support. Visual weight distribution follows the golden ratio: 61.8% compact items, 23.6% features, 14.6% heroes.

```css
.masonry-golden {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(40px, auto);
  gap: 1.5rem;
}

.masonry-golden .item-xs  { grid-row: span 2; }
.masonry-golden .item-sm  { grid-row: span 3; }
.masonry-golden .item-md  { grid-row: span 5; }
.masonry-golden .item-lg  { grid-row: span 8; }
.masonry-golden .item-xl  { grid-row: span 13; }
```

### Pattern 14: Golden Timeline

Vertical timeline with a center axis at the golden section (38.2% from left). Events alternate left/right with Fibonacci-scaled vertical spacing.

```css
.golden-timeline {
  display: grid;
  grid-template-columns: 3.82fr 1fr 5.18fr;
  gap: 0;
}

.golden-timeline .event-left { grid-column: 1; text-align: right; padding-right: 2.5rem; }
.golden-timeline .event-axis { grid-column: 2; }
.golden-timeline .event-right { grid-column: 3; text-align: left; padding-left: 2.5rem; }
```

[W] In RTL languages, swap left/right alignment and padding directions for timeline events.

### Pattern 15: Zeitgeist Grid

The layout pattern popularized by Linear, Vercel, and Stripe: three-column grid (`1fr 1.618fr 1fr`) where content occupies the golden center column and breath/negative space fills the sides.

```css
.zeitgeist-grid {
  display: grid;
  grid-template-columns: 1fr 1.618fr 1fr;
  gap: 2.5rem;
  max-width: 1440px;
  margin: 0 auto;
}

.zeitgeist-grid .feature { grid-column: 2; }
.zeitgeist-grid .feature-extended { grid-column: 2 / 4; }
.zeitgeist-grid .hero-full { grid-column: 1 / -1; }
```

### Pattern 16: Golden Masonry Bento

The most complex hybrid: masonry variable heights + bento explicit spans + golden proportions.

```css
.masonry-bento {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: 40px;
  gap: 1.5rem;
}

.masonry-bento .hero { grid-column: 1 / 5; grid-row: span 8; }
.masonry-bento .stat-tall { grid-column: 5 / 7; grid-row: span 5; }
.masonry-bento .stat-short { grid-column: 5 / 7; grid-row: span 3; }
.masonry-bento .band-medium { grid-column: 1 / 4; grid-row: span 5; }
.masonry-bento .accent { grid-column: 4 / 5; grid-row: span 3; }
```

### Pattern 17: Golden Triangle

Diagonal compositional layout where sides form golden proportions. Creates dramatic diagonal visual weight.

```css
.golden-triangle {
  display: grid;
  grid-template-columns: 1.618fr 1fr;
  grid-template-rows: 1.618fr 1fr;
  gap: 1.5rem;
}

.golden-triangle .dominant { grid-column: 1 / -1; grid-row: 1; }
.golden-triangle .support-a { grid-column: 1; grid-row: 2; }
.golden-triangle .support-b { grid-column: 2; grid-row: 2; }
```

### Pattern 18: Sacred Geometry

Three-zone layout where the center zone is the golden rectangle, flanked by breath zones. The center carries 61.8% of both width and height.

```css
.sacred-grid {
  display: grid;
  grid-template-columns: 1fr 1.618fr 1fr;
  grid-template-rows: 1fr 1.618fr 1fr;
  gap: 1.5rem;
}

.sacred-grid .center { grid-column: 2; grid-row: 2; }
```

## 18 Patterns Summary

| # | Pattern | Key CSS | Best For |
|---|---------|---------|----------|
| 01 | Golden Split | `1fr 1.618fr` | Landing pages, editorials |
| 02 | Fibonacci Columns | `1fr 2fr 3fr 5fr` | Dashboards, comparisons |
| 03 | Phi Grid 12-col | 7:5 golden cut | Design systems, CMS |
| 04 | Spiral Grid | `34fr 21fr 13fr 8fr` | Portfolios, magazines |
| 05 | Bento 6-col | hero 4:2 | SaaS, product pages |
| 06 | Bento 5-col | 3:2 asymmetric | App features, teams |
| 07 | Asymmetric Holy Grail | `3fr 13fr 5fr` | Docs, web apps |
| 08 | Golden Card Grid | `1.618fr 1fr` cards | Catalogs, blogs |
| 09 | Diagonal Fibonacci | cols grow, rows shrink | Creative, storytelling |
| 10 | Nested Golden Grids | recursive `display:grid` | Complex dashboards |
| 11 | Magazine Layout | `5fr 3fr 2fr` | News, editorial |
| 12 | Dashboard Golden | `3fr 5fr 2fr` + KPI | Analytics, admin |
| 13 | Masonry Golden | Fib row spans | Galleries, feeds |
| 14 | Golden Timeline | 38.2% axis | Roadmaps, changelog |
| 15 | Zeitgeist Grid | `1fr 1.618fr 1fr` | SaaS marketing, premium |
| 16 | Golden Masonry Bento | masonry + bento + phi | Mixed-content dashboards |
| 17 | Golden Triangle | `1.618fr 1fr` diagonal | Compositional accents |
| 18 | Sacred Geometry | `1fr 1.618fr 1fr` center | Focal-point layouts |

## Fibonacci Modular Typography Scale

Typography should follow the same mathematical system as the grid:

```css
:root {
  --font-size-1: 0.625rem;  /* 10px - sub-body, captions */
  --font-size-2: 0.75rem;   /* 12px - small text */
  --font-size-3: 1rem;      /* 16px - body base */
  --font-size-4: 1.25rem;   /* 20px - subheading */
  --font-size-5: 1.625rem;  /* 26px - Fib-val 5 scaled */
  --font-size-6: 2.625rem;  /* 42px - Fib-val 8 scaled */
  --font-size-7: 4.25rem;   /* 68px - Fib-val 13 scaled */
}
```

[I] The font-size scale uses a practical stepped progression where each step is visually distinct, unlike the raw Fibonacci sequence where Fib(1)=Fib(2)=1 would produce identical values. See `references/fibonacci-scale.md` for the complete `--text-*` token system.

[W] Font sizes derived from the Fibonacci sequence create a consistent visual hierarchy that feels naturally proportional rather than arbitrarily chosen.

## Responsive Golden Grids

Golden proportions work across viewport sizes, but the strategy changes:

- **Large (>1024px)**: Full golden split or Fibonacci multi-column
- **Medium (768-1024px)**: Collapse to 2-column with `1fr 1.618fr`
- **Small (<768px)**: Single column, but maintain Fibonacci spacing for padding and gaps

```css
.golden-responsive {
  display: grid;
  grid-template-columns: 1fr 1.618fr;
  gap: 2.5rem;
}

@media (max-width: 768px) {
  .golden-responsive {
    grid-template-columns: 1fr;
    gap: 1.5rem; /* 24px = Fib-val 3 - tighter on mobile */
    padding: 1.5rem;
  }
}
```

[C] Do not simply stack all columns on mobile without adjusting the Fibonacci spacing scale. Reduce gaps following the Fibonacci sequence (e.g., 2.5rem -> 1.5rem).

## Dark Mode

All golden-grid patterns support dark mode via the neutral palette inversion defined in `references/fibonacci-scale.md`:

- Surface: `#1a1a1a` (was `#fafafa`)
- Border depth coding inverts: `neutral-500` for outer structure, `neutral-700` for inner nesting
- Text: `neutral-200` primary, `neutral-300` body, `neutral-400` secondary
- [C] Always provide `prefers-color-scheme: dark` overrides when the project supports dark mode. In Next.js, use `next-themes` with `darkMode: 'class'` in Tailwind config.

## Accessibility

Golden-grid layouts must meet WCAG 2.1 AA:

- [C] Tab order must follow visual order. Grid source order must match the intended reading/navigation order.
- [C] Use semantic HTML landmarks (`<nav>`, `<main>`, `<aside>`, `<footer>`) instead of generic `<div>` for grid regions.
- [C] Never rely solely on neutral tone differences to convey information. Pair with text labels, patterns, or icons.
- [C] Provide `prefers-reduced-motion: reduce` overrides that set all animation durations to `0ms` or minimal values.
- [W] Focus rings must be visible on interactive grid cells. Use `--radius-sm` (Fibonacci) for focus ring border-radius.
- [I] Color contrast: `neutral-700` on `#fafafa` = 10.3:1 (passes AAA). `neutral-400` on `#fafafa` = 3.4:1 (fails AA for normal text, passes for large text). See contrast tables in `references/fibonacci-scale.md`.

## Container Queries

Golden proportions should adapt to container size, not just viewport:

```css
.card-golden {
  container-type: inline-size;
  container-name: golden-card;
}

@container golden-card (min-width: 34em) {
  .card-golden-inner {
    grid-template-columns: 1fr 1.618fr;
  }
}
```

[C] When a golden-grid component may be placed in containers of varying width (sidebar, dialog, card), always use container queries for internal responsive behavior. Use media queries only for page-level layout changes.

[W] Use Fibonacci container breakpoints: `34em`, `55em`, `89em`. These map to `--cq-sm`, `--cq-md`, `--cq-lg` tokens.

## Animation Timing

Fibonacci numbers create natural-feeling animation durations:

```css
:root {
  --duration-instant: 100ms;   /* Fib-like: 1 */
  --duration-fast: 200ms;      /* Fib-like: 2 */
  --duration-normal: 300ms;    /* Fib-like: 3 */
  --duration-slow: 500ms;      /* Fib-like: 5 */
  --duration-slower: 800ms;    /* Fib-like: 8 */
  --duration-dramatic: 1300ms; /* Fib-like: 13 */
}
```

[I] Using Fibonacci-based timing creates animations that feel organic. See `references/golden-ratio-layouts.md` for complete `@keyframes` examples including staggered fade-in, golden pulse, and timeline event reveal.

[W] Grid `grid-template-columns` transitions are not smoothly interpolated in all browsers. Test before relying on animated column changes.

## Print Styles

Golden-grid layouts must print cleanly:

```css
@media print {
  .golden-split, .holy-grail-golden, .golden-bento {
    grid-template-columns: 1fr;
    gap: 0;
  }
  * { box-shadow: none !important; }
  .section { page-break-inside: avoid; }
}
```

[I] Multi-column grids waste paper when printed. Force single-column and remove gaps. Full print styles in `references/grid-patterns.md`.

## Design Decision Guide

When choosing a golden grid pattern, consider:

1. **Content hierarchy** -- Is there a clear primary/secondary relationship? Use golden split.
2. **Information density** -- Many related sections? Fibonacci multi-column spreads attention proportionally.
3. **Visual impact** -- Need a dramatic hero? Spiral grid concentrates visual weight.
4. **Standard compatibility** -- Working within an existing design system? Phi grid (12-column) blends golden proportions with conventional grids.
5. **Container variability** -- Component may appear in different containers? Use container queries.
6. **Dark mode requirement** -- Need both themes? Start with neutral palette tokens, not hardcoded colors.

## Reference Files

For detailed implementations, read the reference files:

- `references/grid-patterns.md` -- Full CSS for all 18 grid patterns (including Bento, Masonry, Timeline, Zeitgeist, Masonry Bento, Golden Triangle, Sacred Geometry, real-world components, dark mode variants, print styles)
- `references/fibonacci-scale.md` -- Complete Fibonacci spacing/sizing system, design tokens, neutral palette, dark mode tokens, accessibility tokens, container query tokens
- `references/golden-ratio-layouts.md` -- Layout composition theory, visual weight distribution, nesting rules, animation patterns, subgrid integration, container query layouts
- `references/react-components.md` -- React/Next.js component implementations, TypeScript interfaces, Tailwind utility mappings, Server Component guidelines, dark mode with next-themes

## Skill Relationships

**Closest ally:** `$frontend-design`
- `frontend-design` = layout theory, visual hierarchy, color theory
- `golden-grid` = precise phi/Fibonacci grid implementation
- Use together: `frontend-design` determines WHAT and WHY, `golden-grid` determines HOW by phi

**Compatible with:** `$fullstack-dev`
- No overlap -- `fullstack-dev` handles app architecture, routing, data
- `golden-grid` handles visual grid layout
- Use together naturally, no conflicts

**Overlap zone with:** `$frontend-styling-expert`
- BOTH define spacing scales and grid patterns -> potential conflict
- Resolution: when golden-grid is active, `--fib-*` tokens override `--spacing-*` tokens
- When golden-grid is NOT active, `frontend-styling-expert` is the default
- Critical override comment required: `/* golden-grid override: Fib-val N replaces default spacing */`

**Priority rule:**
1. When user explicitly requests golden ratio / Fibonacci / phi / bento / masonry -> golden-grid wins
2. When user asks for general layout -> frontend-design wins
3. When user asks CSS technique questions -> frontend-styling-expert wins
4. `fullstack-dev` never conflicts -- different domain entirely

## Communication style

This skill communicates in a professional, design-oriented style:
- No emoji or Unicode graphics in responses
- Use text tags for status: [OK], [FAIL], [TODO], [WARNING]
- Use ASCII diagrams for layout flows: ->, |, +, v, ^
- If you must reference a Unicode character as the object of description, mark it with (ref)
