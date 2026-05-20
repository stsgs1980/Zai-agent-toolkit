# Golden Ratio Layouts - Composition Theory

## Table of Contents

1. [Why the Golden Ratio Works](#why-the-golden-ratio-works)
2. [Visual Weight Distribution](#visual-weight-distribution)
3. [Focal Point Placement](#focal-point-placement)
4. [The Phi Grid vs Rule of Thirds](#phi-grid-vs-rule-of-thirds)
5. [Compositional Patterns](#compositional-patterns)
6. [Color and Golden Proportions](#color-and-golden-proportions)
7. [Animation Timing](#animation-timing)
8. [Practical Checklist](#practical-checklist)
9. [Animation Patterns](#animation-patterns)
10. [Subgrid Integration](#subgrid-integration)
11. [Container Query Layouts](#container-query-layouts)

---

## Why the Golden Ratio Works

The golden ratio (phi = 1.618...) appears throughout nature: in the spiral of nautilus shells, the arrangement of sunflower seeds, the branching of trees, and the proportions of the human face. This ubiquity means human perception is tuned to find golden proportions naturally pleasing.

When applied to layout design, the golden ratio provides three concrete benefits:

1. **Inherent balance** - Proportions that mirror natural forms create layouts that feel "right" without the viewer consciously understanding why. The eye moves smoothly from element to element because the size relationships match expectations formed by a lifetime of observing nature.

2. **Clear hierarchy** - The mathematical relationship between sections (larger is exactly 1.618x the smaller) ensures visual dominance is unambiguous. Unlike arbitrary size choices, golden proportions create a definitive "primary" and "secondary" that the eye immediately comprehends.

3. **Scalable harmony** - The ratio is self-similar: if you split the larger section again by the golden ratio, the same proportion appears. This means layouts remain harmonious at every level of zoom or nesting, from the overall page grid down to individual component internals.

---

## Visual Weight Distribution

In a golden ratio layout, visual weight follows the proportions:

```
+=============================+===================+
|                             |                   |
|       61.8% (dominant)      |  38.2% (support)  |
|                             |                   |
+=============================+===================+
```

The 61.8% / 38.2% split (derived from 1/1.618 = 0.618) creates an asymmetric balance that is more dynamic than a 50/50 split but more stable than extreme ratios like 80/20.

### Multi-level weight distribution

When you apply the golden ratio recursively:

```
Level 1:  100% -> 61.8% + 38.2%
Level 2:  61.8% -> 38.2% + 23.6%  (of total)
Level 3:  38.2% -> 23.6% + 14.6%  (of total)
```

This creates a natural priority cascade where each subdivision carries proportionally less visual weight, perfect for content hierarchies.

---

## Focal Point Placement

The golden ratio identifies two key points in any rectangle:

```
+---------------------------+
|                           |
|   phi point        *      |
|              +------      |
|              |             |
|   *    phi point          |
+---------------------------+
```

These are the points where the golden section lines cross. Placing key content (headlines, CTAs, hero images) at or near these intersections creates maximum visual impact.

In CSS Grid coordinates:

```css
/* Approximate phi points in a grid */
.phi-focal-left {
  /* Content positioned at ~38.2% from left */
  grid-column-start: 5;  /* in a 13-column grid */
}

.phi-focal-right {
  /* Content positioned at ~61.8% from left */
  grid-column-start: 8;  /* in a 13-column grid */
}
```

---

## The Phi Grid vs Rule of Thirds

### Rule of Thirds

The rule of thirds divides the frame into 9 equal sections (33.3% each):

```
+---------+---------+---------+
|         |         |         |
|    *----|----*    |         |
|         |         |         |
+---------+---------+---------+
|         |         |         |
|    *----|----*    |         |
|         |         |         |
+---------+---------+---------+
```

### Phi Grid

The phi grid divides at 38.2% / 61.8%:

```
+=============+==================+
|             |                  |
|       *-----|-----------*      |
|             |                  |
+=============+==================+
|             |                  |
|       *-----|-----------*      |
|             |                  |
+=============+==================+
```

The phi grid pushes the focal points slightly toward the center compared to the rule of thirds. This creates compositions that feel more natural and less "posed." Photography research suggests that images composed on the phi grid are rated as more aesthetically pleasing than those on the rule of thirds, though the difference is subtle.

### When to use each

- **Rule of thirds**: Dynamic, energetic compositions. Good for action shots, dramatic hero images.
- **Phi grid**: Calm, elegant, natural-feeling compositions. Good for editorial, luxury, and content-heavy layouts.

---

## Compositional Patterns

### Pattern: Golden Triangle

Divide the layout diagonally, creating a triangle whose sides are in golden proportion:

```css
.golden-triangle {
  display: grid;
  grid-template-columns: 1.618fr 1fr;
  grid-template-rows: 1.618fr 1fr;
  gap: 1.5rem;
}

.golden-triangle .dominant {
  grid-column: 1 / -1;
  grid-row: 1;
}

.golden-triangle .support-a {
  grid-column: 1;
  grid-row: 2;
}

.golden-triangle .support-b {
  grid-column: 2;
  grid-row: 2;
}
```

### Pattern: Fibonacci Rhythm

Alternate between Fibonacci-sizes content blocks to create visual rhythm:

```css
.fib-rhythm {
  display: grid;
  grid-template-rows: 5fr 3fr 8fr 5fr 13fr;
  gap: 1.5rem;
}
```

This creates a visual beat where the viewer's eye accelerates and decelerates as it moves down the page, mimicking the natural rhythm of breathing or walking.

### Pattern: Sacred Geometry Overlay

Use CSS Grid to create the underlying structure, then overlay geometric guides:

```css
.sacred-grid {
  display: grid;
  grid-template-columns: 1fr 1.618fr 1fr;
  grid-template-rows: 1fr 1.618fr 1fr;
  gap: 1.5rem;
  position: relative;
}

/* The center cell is the golden rectangle */
.sacred-grid .center {
  grid-column: 2;
  grid-row: 2;
}
```

---

## Color and Golden Proportions

Apply the golden ratio to color distribution across the layout:

- **61.8%** of the visible area: dominant color (background, large sections)
- **23.6%** (61.8% of remaining 38.2%): secondary color (cards, sidebars)
- **14.6%** (remaining): accent color (buttons, highlights, CTAs)

This creates a natural color hierarchy where the accent color stands out precisely because it occupies the smallest proportion, consistent with the mathematical relationship.

```css
:root {
  /* 61.8% dominant */
  --color-dominant: #fafafa;
  /* 23.6% secondary */
  --color-secondary: #2d2d2d;
  /* 14.6% accent */
  --color-accent: #c4956a; /* Golden accent - warm, natural tone */
}
```

---

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

Using Fibonacci-based timing creates animations that feel organic. The human brain expects acceleration and deceleration patterns that follow natural physics, and Fibonacci timing maps well to these expectations.

---

## Practical Checklist

Before finalizing a golden grid layout, verify:

- [ ] Column ratios use `1fr 1.618fr` or Fibonacci-based `fr` values, not arbitrary percentages
- [ ] Gaps follow the Fibonacci spacing scale (0.75rem, 1.5rem, 2.5rem, 4rem)
- [ ] Primary content occupies approximately 61.8% of the layout area
- [ ] Secondary content occupies approximately 38.2%
- [ ] Key focal points (CTAs, hero elements) align with phi intersection points
- [ ] Typography scale follows Fibonacci proportions
- [ ] Border radius and shadow values use Fibonacci multiples
- [ ] Mobile breakpoints collapse to single column but retain Fibonacci spacing
- [ ] Color distribution follows 61.8/23.6/14.6 proportions
- [ ] Animation durations use Fibonacci-based values

---

## Animation Patterns

Production-ready CSS animation examples using Fibonacci timing and golden-ratio proportions.

### 1. Grid Layout Transition

Animate `grid-template-columns` change on breakpoint. The transition duration of **500ms** comes from the Fibonacci sequence (5), which is slow enough to be perceived but fast enough to feel responsive.

`[W]` — Not all browsers interpolate `grid-template-columns` smoothly. Always provide a `min-width` fallback with an instant switch for unsupported engines.

```css
.grid-transition {
  display: grid;
  grid-template-columns: 1fr 1.618fr;
  gap: 1.5rem;
  transition: grid-template-columns 0.5s ease; /* Fib: 5 → 500ms */
}

@media (max-width: 55em) { /* Fib: 55 */
  .grid-transition {
    grid-template-columns: 1fr;
  }
}

/* Fallback for browsers without grid-transition support */
@supports not (transition: grid-template-columns 1s) {
  .grid-transition {
    transition: none;
  }
}
```

### 2. Staggered Fade-In

Child elements fade in with Fibonacci-timed delays. The delays follow 100ms, 200ms, 300ms, 500ms, 800ms — the first five non-trivial Fibonacci numbers × 100ms, creating an accelerating rhythm that mirrors natural movement.

`[I]` — Fibonacci stagger creates a more organic feel than linear (equal-interval) stagger, but avoid going beyond 5–6 items or the last items will appear uncomfortably delayed.

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(1.5rem); /* Fib spacing: 1.5rem */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stagger-fade-in > * {
  opacity: 0;
  animation: fadeInUp 0.5s ease forwards; /* Fib: 5 → 500ms */
}

/* Fibonacci-timed stagger delays: 1, 2, 3, 5, 8 (× 100ms) */
.stagger-fade-in > :nth-child(1) { animation-delay: 100ms; }  /* Fib: 1 */
.stagger-fade-in > :nth-child(2) { animation-delay: 200ms; }  /* Fib: 2 */
.stagger-fade-in > :nth-child(3) { animation-delay: 300ms; }  /* Fib: 3 */
.stagger-fade-in > :nth-child(4) { animation-delay: 500ms; }  /* Fib: 5 */
.stagger-fade-in > :nth-child(5) { animation-delay: 800ms; }  /* Fib: 8 */
```

### 3. Golden Pulse

A breathing animation where scale oscillates between `1` and `1.01618` — phi at micro scale (1.618 ÷ 100). The **1300ms** duration comes from Fibonacci (13 × 100ms), long enough for the subtlety to register without being distracting.

`[I]` — The golden pulse is intentionally subtle. If the scale change is too visible, it defeats the "breathing" metaphor. Never exceed `1.03` for pulse animations.

```css
@keyframes goldenPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.01618); /* phi at micro scale: 1.618 / 100 */
  }
}

.golden-pulse {
  animation: goldenPulse 1300ms ease-in-out infinite; /* Fib: 13 → 1300ms */
}
```

### 4. Timeline Event Reveal

Timeline items slide in from alternating sides with Fibonacci-spaced stagger delays. Delays use **300ms, 500ms, 800ms, 1300ms** (Fibonacci: 3, 5, 8, 13 × 100ms), creating a narrative rhythm where each event arrives slightly later than expected, building anticipation.

`[W]` — Alternating slide directions require `transform-origin` awareness. On RTL layouts, swap left/right directions or use logical properties.

```css
@keyframes slideFromLeft {
  from {
    opacity: 0;
    transform: translateX(-2.5rem); /* Fib spacing: 2.5rem */
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideFromRight {
  from {
    opacity: 0;
    transform: translateX(2.5rem);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.timeline-event {
  opacity: 0;
  animation-duration: 0.5s; /* Fib: 5 → 500ms */
  animation-timing-function: ease-out;
  animation-fill-mode: forwards;
}

/* Alternating slide directions */
.timeline-event:nth-child(odd) {
  animation-name: slideFromLeft;
}

.timeline-event:nth-child(even) {
  animation-name: slideFromRight;
}

/* Fibonacci stagger delays: 3, 5, 8, 13 (× 100ms) */
.timeline-event:nth-child(1) { animation-delay: 300ms; }   /* Fib: 3 */
.timeline-event:nth-child(2) { animation-delay: 500ms; }   /* Fib: 5 */
.timeline-event:nth-child(3) { animation-delay: 800ms; }   /* Fib: 8 */
.timeline-event:nth-child(4) { animation-delay: 1300ms; }  /* Fib: 13 */
```

### 5. Bento Card Hover

Hover effect using golden-ratio shadow progression. The shadow spreads follow Fibonacci multiples (3, 5, 8 × 1px). Transition duration of **300ms** (Fibonacci: 3 × 100ms) feels snappy and responsive.

`[W]` — Box-shadow transitions are GPU-friendly but can cause repaints on large surfaces. Use `will-change: box-shadow` sparingly and only on elements that are actively being hovered.

```css
@keyframes bentoHoverIn {
  from {
    transform: translateY(0);
    box-shadow:
      0 3px 5px rgba(0, 0, 0, 0.08),
      0 5px 8px rgba(0, 0, 0, 0.05);
  }
  to {
    transform: translateY(-0.25rem);
    box-shadow:
      0 3px 5px rgba(0, 0, 0, 0.10),
      0 5px 8px rgba(0, 0, 0, 0.07),
      0 8px 13px rgba(0, 0, 0, 0.04); /* 3-tier Fibonacci shadow: 3, 5, 8 */
  }
}

.bento-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease; /* Fib: 3 → 300ms */
}

.bento-card:hover {
  transform: translateY(-0.25rem);
  box-shadow:
    0 3px 5px rgba(0, 0, 0, 0.10),
    0 5px 8px rgba(0, 0, 0, 0.07),
    0 8px 13px rgba(0, 0, 0, 0.04); /* Fibonacci: 3, 5, 8 × 1px */
}
```

### 6. Reduced Motion Override

All animations must respect the user's `prefers-reduced-motion` preference. This is not optional — it is an accessibility requirement.

`[W]` — Failing to provide a reduced-motion override is a WCAG 2.3.3 violation. Always include this media query when using any non-instant animation.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .grid-transition {
    transition: none;
  }

  .stagger-fade-in > * {
    opacity: 1;
    animation: none;
  }

  .golden-pulse {
    animation: none;
  }

  .timeline-event {
    opacity: 1;
    animation: none;
  }

  .bento-card {
    transition: none;
  }

  .bento-card:hover {
    transform: none;
  }
}
```

---

## Subgrid Integration

CSS Subgrid enhances the Nested Golden Grids pattern (Pattern 10) by allowing child grids to adopt their parent's track sizing, ensuring perfect alignment across nesting levels.

### Why Subgrid

In the current nested golden grids pattern, child grids define their own track sizing independently. This means a child grid's columns do not align with the parent grid's columns, even when they visually overlap. Content in nested cells appears misaligned with content in sibling cells at the parent level.

Subgrid solves this by allowing a child element to inherit its parent's track definitions for rows, columns, or both. The child's `grid-template-columns: subgrid` directive means its tracks are literally the same tracks as the parent — no independent sizing, no alignment drift.

### Subgrid Golden Split

A golden-split parent (`1fr 1.618fr`) whose child adopts the same column tracks via subgrid:

```css
.golden-split-parent {
  display: grid;
  grid-template-columns: 1fr 1.618fr;
  gap: 1.5rem;
}

.golden-split-child {
  grid-column: 1 / -1; /* Span both parent columns */
  display: grid;
  grid-template-columns: subgrid; /* Inherit parent's 1fr 1.618fr tracks */
  gap: 1.5rem; /* Must match parent gap for alignment */
}

.golden-split-child .primary {
  grid-column: 1; /* Aligns exactly with parent's 1fr column */
}

.golden-split-child .secondary {
  grid-column: 2; /* Aligns exactly with parent's 1.618fr column */
}
```

### Subgrid Bento

A bento grid with 6 columns where nested cards align to the parent's 6-column track system:

```css
.bento-parent {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1.5rem;
}

/* A bento card that spans 3 columns and uses subgrid internally */
.bento-card-wide {
  grid-column: span 3;
  display: grid;
  grid-template-columns: subgrid;
  gap: 1.5rem;
}

/* Inner elements now align to the parent's 6-column grid */
.bento-card-wide .card-media {
  grid-column: span 2; /* 2 of the parent's 6 columns */
}

.bento-card-wide .card-text {
  grid-column: span 1; /* 1 of the parent's 6 columns */
}

/* A tall card that spans rows and uses row subgrid */
.bento-card-tall {
  grid-column: span 2;
  grid-row: span 2;
  display: grid;
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;
  gap: 1.5rem;
}
```

### Browser Support Note

CSS Subgrid is stable in all major browsers since late 2023:

| Browser | Support Since |
|---------|--------------|
| Chrome  | 117 (Sep 2023) |
| Firefox | 71 (Dec 2019) |
| Safari  | 16.0 (Sep 2022) |
| Edge    | 117 (Sep 2023) |

As of 2024, global support exceeds 93%. Use `@supports (grid-template-columns: subgrid)` as a progressive enhancement guard if you need to support older engines.

### Subgrid Decision Rule

`[W]` — Use subgrid when child elements must align with parent grid tracks. Use independent nested grids when child needs its own proportion system.

This means:
- **Subgrid** for: bento grids where card internals must line up with adjacent cards, golden-split layouts where nested content shares the same visual columns, any case where alignment across nesting levels is the goal.
- **Independent nested grid** for: a card that uses its own golden split internally regardless of parent layout, a component with its own proportional system (e.g., a 3-column internal layout inside a 6-column parent), any case where the child's proportions should be self-contained.

---

## Container Query Layouts

Container queries allow golden proportions to adapt to the component's container size rather than the viewport. This is essential for golden-grid components that may appear in contexts of varying width — sidebars, dialogs, cards, or responsive page regions.

### Phi at Any Size

The golden ratio is a proportion, not an absolute measurement. A sidebar component should use the golden split (61.8% / 38.2%) regardless of whether the viewport is 1920px or 375px wide — what matters is the component's own width.

With media queries, a golden-split layout in a 300px sidebar would see the "mobile" breakpoint (typically ≤ 768px) and collapse to a single column, even though 300px is enough space for a golden split. Container queries fix this by letting the component respond to its own dimensions.

### Fibonacci Container Breakpoints

Use Fibonacci numbers as container query breakpoints, mirroring the same Fibonacci scale used for viewport breakpoints and spacing:

| Breakpoint | Fibonacci | Use Case |
|-----------|-----------|----------|
| `34em` | F(9) | Compact layout: golden split collapses to stacked |
| `55em` | F(10) | Standard layout: golden split + sidebar visible |
| `89em` | F(11) | Extended layout: bento grid reaches full 6 columns |

These breakpoints apply to the **container** width, not the viewport. A component placed in a 40em-wide sidebar hits the 34em breakpoint but not 55em, regardless of the viewport being 1920px wide.

### Container Query Golden Split

A golden-split component that responds to its container width:

```css
.golden-split-container {
  container-type: inline-size;
  container-name: golden-split;
}

.golden-split-inner {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr; /* Default: stacked */
}

/* Fibonacci container breakpoint: F(9) = 34em */
@container golden-split (min-width: 34em) {
  .golden-split-inner {
    grid-template-columns: 1fr 1.618fr; /* Golden split activates */
  }
}

/* Fibonacci container breakpoint: F(10) = 55em */
@container golden-split (min-width: 55em) {
  .golden-split-inner {
    grid-template-columns: 1fr 1.618fr;
    gap: 2.5rem; /* Fib spacing scales up */
  }
}
```

### Container Query Bento

A bento grid that adapts from 6-column to 4-column to 1-column based on container width:

```css
.bento-container {
  container-type: inline-size;
  container-name: bento;
}

.bento-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr; /* Default: single column */
}

/* Fibonacci container breakpoint: F(9) = 34em → 4 columns */
@container bento (min-width: 34em) {
  .bento-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .bento-grid .span-2 {
    grid-column: span 2;
  }

  .bento-grid .span-3 {
    grid-column: span 3;
  }
}

/* Fibonacci container breakpoint: F(11) = 89em → full 6 columns */
@container bento (min-width: 89em) {
  .bento-grid {
    grid-template-columns: repeat(6, 1fr);
  }

  .bento-grid .span-2 {
    grid-column: span 2;
  }

  .bento-grid .span-3 {
    grid-column: span 3;
  }

  .bento-grid .span-4 {
    grid-column: span 4;
  }
}
```

### Container Query Rule

`[C]` — When a golden-grid component may be placed in containers of varying width (sidebar, dialog, card), always use container queries for internal responsive behavior.

This rule takes precedence because:
1. **Viewport queries lie** — a component in a narrow sidebar on a wide viewport will never trigger the "desktop" media query, even though the viewport is "desktop."
2. **Portability** — container-queried components are truly self-contained. They can be moved anywhere in the layout without breaking their responsive behavior.
3. **Golden proportions are relational** — the ratio only works if both sections are visible. Container queries ensure the golden split activates when there is actually room for both sections, regardless of viewport.
