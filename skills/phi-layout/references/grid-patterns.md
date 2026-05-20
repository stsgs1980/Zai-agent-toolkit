# Golden Grid Patterns - Complete CSS Reference

## Table of Contents

1. [Golden Split](#golden-split)
2. [Fibonacci Columns](#fibonacci-columns)
3. [Phi Grid (12-column)](#phi-grid)
4. [Spiral Grid](#spiral-grid)
5. [Bento Grid (Golden)](#bento-grid)
6. [Asymmetric Holy Grail](#asymmetric-holy-grail)
7. [Golden Card Grid](#golden-card-grid)
8. [Diagonal Fibonacci](#diagonal-fibonacci)
9. [Nested Golden Grids](#nested-golden-grids)
10. [Magazine Layout](#magazine-layout)
11. [Dashboard Golden](#dashboard-golden)
12. [Masonry Golden](#masonry-golden)
13. [Golden Timeline](#golden-timeline)
14. [Zeitgeist Grid](#zeitgeist-grid)
15. [Golden Masonry Bento](#golden-masonry-bento)

---

## Golden Split

The foundational golden ratio layout. Two columns where the larger is 1.618x the smaller.

```css
.golden-split {
  display: grid;
  grid-template-columns: 1fr 1.618fr;
  gap: 2.5rem; /* 40px = Fib-val 5 */
  min-height: 100vh;
}

/* Inverse: content left, sidebar right */
.golden-split-inverse {
  display: grid;
  grid-template-columns: 1.618fr 1fr;
  gap: 2.5rem;
}

/* With vertical golden split for the sidebar */
.golden-split-deep {
  display: grid;
  grid-template-columns: 1fr 1.618fr;
  grid-template-rows: 1.618fr 1fr;
  gap: 2.5rem;
}
```

**When to use**: Landing pages, portfolio sites, editorial layouts where one element dominates.

---

## Fibonacci Columns

Multi-column layout where each column width follows the Fibonacci sequence.

```css
/* 3-column: 1:2:3 */
.fib-3col {
  display: grid;
  grid-template-columns: 1fr 2fr 3fr;
  gap: 1.5rem;
}

/* 4-column: 1:2:3:5 */
.fib-4col {
  display: grid;
  grid-template-columns: 1fr 2fr 3fr 5fr;
  gap: 1.5rem;
}

/* 5-column: 1:1:2:3:5 */
.fib-5col {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr 3fr 5fr;
  gap: 1.5rem;
}

/* Responsive: collapse to golden split */
@media (max-width: 1024px) {
  .fib-4col {
    grid-template-columns: 1fr 1.618fr;
  }
}
@media (max-width: 768px) {
  .fib-4col {
    grid-template-columns: 1fr;
  }
}
```

**When to use**: Data dashboards, product comparisons, content-heavy pages with clear hierarchy.

---

## Phi Grid

12-column grid with golden-ratio column spans, compatible with Bootstrap/Tailwind conventions.

```css
.phi-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
}

/* Golden cuts:
   7:5 ratio (1.4) - closest to phi in 12 columns
   8:4 ratio (2.0) - strong dominance
   5:7 ratio (0.714) - inverted golden
*/

.phi-grid .content-wide { grid-column: 1 / 8; }   /* 7 cols */
.phi-grid .sidebar-narrow { grid-column: 8 / 13; } /* 5 cols */

.phi-grid .content-dominant { grid-column: 1 / 9; }  /* 8 cols */
.phi-grid .sidebar-mini { grid-column: 9 / 13; }     /* 4 cols */

/* Nested phi grid for sub-sections */
.phi-grid .content-wide {
  display: grid;
  grid-template-columns: 5fr 3fr; /* Fibonacci ratio within */
  gap: 1.5rem;
}
```

**When to use**: When working within existing 12-column design systems, CMS templates, or team conventions.

---

## Spiral Grid

Layout inspired by the Fibonacci spiral, with decreasing element sizes.

```css
.spiral-grid {
  display: grid;
  grid-template-columns: 34fr 21fr 13fr 8fr;
  grid-template-rows: 34fr 21fr;
  gap: 1.5rem;
}

.spiral-grid .hero {
  grid-column: 1 / 2;
  grid-row: 1 / 3;
}

.spiral-grid .secondary {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
}

.spiral-grid .tertiary {
  grid-column: 2 / 4;
  grid-row: 2 / 3;
}

.spiral-grid .accent {
  grid-column: 3 / 5;
  grid-row: 1 / 2;
}

.spiral-grid .micro {
  grid-column: 4 / 5;
  grid-row: 2 / 3;
}
```

**When to use**: Creative portfolios, magazine-style pages, storytelling layouts with visual hierarchy.

---

## Bento Grid

Bento Grid takes inspiration from the Japanese bento box: variably-sized compartments arranged in a compact, visually rich layout. Combined with golden proportions, the dominant compartment occupies ~61.8% while smaller compartments fill the rest in decreasing Fibonacci ratios.

### 6-Column Golden Bento

```css
.golden-bento {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: minmax(120px, auto);
  gap: 1.5rem; /* 24px = Fib-val 3 */
}

/* Hero: 4 of 6 cols = 66.7%, 2 rows = dominant */
.golden-bento .hero {
  grid-column: 1 / 5;
  grid-row: 1 / 3;
}

/* Stats: 2 cols each, stacked vertically */
.golden-bento .stat-1 {
  grid-column: 5 / 7;
  grid-row: 1;
}
.golden-bento .stat-2 {
  grid-column: 5 / 7;
  grid-row: 2;
}

/* Mid-band: 3 cols */
.golden-bento .mid-band {
  grid-column: 1 / 4;
  grid-row: 3;
}

/* Accent: 1 col */
.golden-bento .accent {
  grid-column: 4 / 5;
  grid-row: 3;
}

/* Support row */
.golden-bento .support-a {
  grid-column: 5 / 6;
  grid-row: 3;
}
.golden-bento .support-b {
  grid-column: 6 / 7;
  grid-row: 3;
}
```

**When to use**: Landing pages, product showcases, SaaS dashboards, feature highlight sections.

### 5-Column Asymmetric Bento

```css
.bento-5col {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-auto-rows: minmax(100px, auto);
  gap: 1.5rem;
}

/* 3:2 split -- close to phi (1.5 vs 1.618) */
.bento-5col .main {
  grid-column: 1 / 4;
  grid-row: 1 / 3;
}

.bento-5col .feature {
  grid-column: 4 / 6;
  grid-row: 1;
}

.bento-5col .small-a {
  grid-column: 4 / 5;
  grid-row: 2;
}

.bento-5col .small-b {
  grid-column: 5 / 6;
  grid-row: 2;
}
```

**When to use**: App feature sections, team pages, portfolio grids.

### Responsive Bento

```css
.golden-bento {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: minmax(120px, auto);
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .golden-bento {
    grid-template-columns: repeat(4, 1fr);
  }
  .golden-bento .hero {
    grid-column: 1 / -1;
    grid-row: 1;
  }
}

@media (max-width: 768px) {
  .golden-bento {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .golden-bento .hero,
  .golden-bento .stat-1,
  .golden-bento .stat-2,
  .golden-bento .mid-band,
  .golden-bento .accent {
    grid-column: 1;
    grid-row: auto;
  }
}
```

**Key principle**: On mobile, bento compartments become a single-column stack, but Fibonacci spacing (gaps) is maintained to preserve rhythm.

---

## Asymmetric Holy Grail

Classic 3-column layout with Fibonacci proportions replacing equal-width columns.

```css
.holy-grail-golden {
  display: grid;
  grid-template-columns: 3fr 13fr 5fr;
  grid-template-rows: auto 1fr auto;
  gap: 1.5rem;
  min-height: 100vh;
}

.holy-grail-golden header {
  grid-column: 1 / -1;
  padding: 2.5rem 0; /* 40px = Fib-val 5 */
}

.holy-grail-golden nav {
  grid-column: 1;
  grid-row: 2;
  padding: 1.5rem; /* 24px = Fib-val 3 */
}

.holy-grail-golden main {
  grid-column: 2;
  grid-row: 2;
  padding: 4rem; /* 64px = Fib-val 8 */
}

.holy-grail-golden aside {
  grid-column: 3;
  grid-row: 2;
  padding: 1.5rem;
}

.holy-grail-golden footer {
  grid-column: 1 / -1;
  padding: 2.5rem 0;
}

@media (max-width: 768px) {
  .holy-grail-golden {
    grid-template-columns: 1fr;
  }
  .holy-grail-golden nav,
  .holy-grail-golden main,
  .holy-grail-golden aside {
    grid-column: 1;
    grid-row: auto;
  }
}
```

**When to use**: Documentation sites, web apps, content management systems.

---

## Golden Card Grid

Card layouts where card dimensions follow golden proportions.

```css
.golden-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2.5rem; /* 40px = Fib-val 5 */
}

/* Each card has golden-ratio internal layout */
.golden-card {
  display: grid;
  grid-template-rows: 1.618fr 1fr;
  gap: 1.5rem;
  overflow: hidden;
  border-radius: 1rem; /* 16px */
}

.golden-card .card-visual {
  /* Image/visual area - golden proportion of card height */
  aspect-ratio: 1.618;
}

.golden-card .card-body {
  padding: 1.5rem;
}
```

**When to use**: Product catalogs, team pages, portfolio grids, blog listing pages.

---

## Diagonal Fibonacci

Asymmetric layout that creates diagonal visual flow through Fibonacci proportions.

```css
.diagonal-fib {
  display: grid;
  grid-template-columns: 1fr 2fr 3fr 5fr;
  grid-template-rows: 5fr 3fr 2fr 1fr;
  gap: 1.5rem;
}

.diagonal-fib .block-1 {
  grid-column: 1 / 2;
  grid-row: 1 / 3;
}

.diagonal-fib .block-2 {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
}

.diagonal-fib .block-3 {
  grid-column: 3 / 5;
  grid-row: 1 / 4;
}

.diagonal-fib .block-4 {
  grid-column: 1 / 3;
  grid-row: 3 / 5;
}

.diagonal-fib .block-5 {
  grid-column: 2 / 4;
  grid-row: 2 / 4;
}
```

**When to use**: Creative agency sites, art exhibitions, storytelling pages.

---

## Nested Golden Grids

Combining outer golden split with inner Fibonacci columns for depth.

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

/* Third level of nesting */
.outer-golden .content .main-column {
  display: grid;
  grid-template-rows: auto 1.618fr 1fr;
  gap: 1.5rem;
}
```

**When to use**: Complex dashboards, news sites, multi-section pages.

---

## Magazine Layout

Editorial layout mimicking print magazine grids with golden proportions.

```css
.magazine-layout {
  display: grid;
  grid-template-columns: 5fr 3fr 2fr;
  grid-template-rows: 8fr 5fr 3fr;
  gap: 1.5rem;
}

.magazine-layout .lead-story {
  grid-column: 1 / 2;
  grid-row: 1 / 3;
}

.magazine-layout .feature {
  grid-column: 2 / 4;
  grid-row: 1 / 2;
}

.magazine-layout .side-story {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
}

.magazine-layout .quick-read {
  grid-column: 3 / 4;
  grid-row: 2 / 4;
}

.magazine-layout .bottom-row {
  grid-column: 1 / 3;
  grid-row: 3 / 4;
  display: grid;
  grid-template-columns: 3fr 2fr 1fr;
  gap: 1.5rem;
}
```

**When to use**: News sites, blogs, editorial pages, digital magazines.

---

## Dashboard Golden

Dashboard layout with golden proportions for data density and visual balance.

```css
.dashboard-golden {
  display: grid;
  grid-template-columns: 3fr 5fr 2fr;
  grid-template-rows: 2fr 3fr 5fr;
  gap: 1.5rem;
  min-height: 100vh;
}

.dashboard-golden .kpi-bar {
  grid-column: 1 / -1;
  grid-row: 1;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5rem;
}

.dashboard-golden .chart-primary {
  grid-column: 1 / 3;
  grid-row: 2 / 4;
}

.dashboard-golden .chart-secondary {
  grid-column: 3 / -1;
  grid-row: 2;
}

.dashboard-golden .data-table {
  grid-column: 2 / -1;
  grid-row: 3;
}

.dashboard-golden .filters {
  grid-column: 1;
  grid-row: 2;
}
```

**When to use**: Analytics dashboards, admin panels, monitoring tools.

---

## Masonry Golden

Pinterest-style masonry layout where items have variable heights following Fibonacci proportions. Unlike true CSS masonry (still experimental), this uses `grid-auto-rows` with small row units and `span` values from the Fibonacci sequence to approximate masonry behavior with full CSS Grid support.

### Basic Masonry

```css
.masonry-golden {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(40px, auto); /* 40px row unit */
  gap: 1.5rem; /* 24px = Fib-val 3 */
}

/* Height classes based on Fibonacci row spans */
.masonry-golden .item-xs  { grid-row: span 2; }  /* 80px + gap */
.masonry-golden .item-sm  { grid-row: span 3; }  /* 120px + gaps */
.masonry-golden .item-md  { grid-row: span 5; }  /* Fib-val 5 row spans */
.masonry-golden .item-lg  { grid-row: span 8; }  /* Fib-val 8 row spans */
.masonry-golden .item-xl  { grid-row: span 13; } /* Fib-val 13 row spans */
```

### Golden-Weighted Masonry

The visual weight of masonry items follows the golden ratio: 61.8% of items are small/medium, 23.6% are large, 14.6% are extra-large. This creates the natural distribution seen in organic layouts like Pinterest, where most content is compact with occasional tall features.

```css
.masonry-weighted {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  grid-auto-rows: 40px;
  gap: 1.5rem;
}

/* 61.8% of items — compact */
.masonry-weighted .item-common {
  grid-row: span 3; /* ~120px */
}

/* 23.6% of items — feature */
.masonry-weighted .item-feature {
  grid-row: span 5; /* ~200px */
}

/* 14.6% of items — hero */
.masonry-weighted .item-hero {
  grid-row: span 8; /* ~320px */
}
```

### Column-Biased Masonry (Golden)

Items gravitate toward the golden section columns, creating visual density on one side:

```css
.masonry-biased {
  display: grid;
  grid-template-columns: 1fr 1fr 1.618fr 1.618fr;
  grid-auto-rows: 40px;
  gap: 1.5rem;
}

/* Large items prefer the 1.618fr columns */
.masonry-biased .item-hero {
  grid-column: span 2; /* fills one golden column pair */
  grid-row: span 8;
}
```

**When to use**: Image galleries, product grids, blog feeds, portfolio walls, any content with variable aspect ratios.

---

## Golden Timeline

Vertical timeline layout where events are positioned along a center axis with alternating sides using golden ratio spacing. The timeline axis sits at the golden section (38.2% from left), and event spacing follows the Fibonacci scale.

### Basic Timeline

```css
.golden-timeline {
  display: grid;
  grid-template-columns: 3.82fr 1fr 5.18fr; /* 38.2% : 10% axis : 51.8% */
  grid-template-rows: auto;
  gap: 0;
  position: relative;
}

/* Center axis line */
.golden-timeline::before {
  content: '';
  position: absolute;
  left: calc(38.2% + 5%); /* center of the axis column */
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--n300, #d4d4d4);
}

/* Left events */
.golden-timeline .event-left {
  grid-column: 1;
  text-align: right;
  padding-right: 2.5rem; /* 40px = Fib-val 5 */
  padding-bottom: 4rem;  /* 64px = Fib-val 8 */
}

/* Axis dots */
.golden-timeline .event-axis {
  grid-column: 2;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-bottom: 4rem;
}

/* Right events */
.golden-timeline .event-right {
  grid-column: 3;
  text-align: left;
  padding-left: 2.5rem;
  padding-bottom: 4rem;
}
```

### Timeline with Fibonacci Vertical Rhythm

Event density increases along the timeline, creating a Fibonacci rhythm where early events are sparse and recent events are dense — mimicking how we perceive time (recent events feel closer together):

```css
.timeline-fib-rhythm {
  display: grid;
  grid-template-columns: 3.82fr 1fr 5.18fr;
  gap: 0;
}

/* Vertical gaps follow Fibonacci in reverse: */
/* Oldest events: large gap (8fr) */
/* Mid events: medium gap (5fr) */
/* Recent events: small gap (3fr) */
/* Current: tiny gap (2fr) */

.timeline-fib-rhythm .event-era-ancient { margin-bottom: 10.5rem; } /* 168px = Fib-val 21 */
.timeline-fib-rhythm .event-era-old     { margin-bottom: 6.5rem; }  /* 104px = Fib-val 13 */
.timeline-fib-rhythm .event-era-recent  { margin-bottom: 4rem; }    /* 64px = Fib-val 8 */
.timeline-fib-rhythm .event-era-current { margin-bottom: 2.5rem; }  /* 40px = Fib-val 5 */
```

### Single-Column Timeline

For mobile or compact views, the timeline shifts to a single column with the axis on the left:

```css
.timeline-single {
  display: grid;
  grid-template-columns: 2.5rem 1fr; /* axis + content */
  gap: 1.5rem;
}

.timeline-single .axis {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline-single .content {
  padding-bottom: 4rem; /* 64px = Fib-val 8 */
}
```

**When to use**: Company history pages, project roadmaps, changelog/release notes, personal portfolios, process visualization.

---

## Zeitgeist Grid

The layout pattern popularized by Linear, Vercel, and Stripe: a centered content column with generous whitespace, staggered feature blocks, and golden-ratio content-to-breath proportions. The defining characteristic is that content occupies the golden section while negative space occupies the remainder, creating a sense of premium restraint.

### Linear-Style Feature Grid

```css
.zeitgeist-grid {
  display: grid;
  grid-template-columns: 1fr 1.618fr 1fr; /* breath : content : breath */
  grid-template-rows: auto;
  gap: 2.5rem;
  max-width: 1440px;
  margin: 0 auto;
}

/* Content lives in the center golden column */
.zeitgeist-grid .feature {
  grid-column: 2;
}

/* Occasionally, a feature bleeds into the right breath zone */
.zeitgeist-grid .feature-extended {
  grid-column: 2 / 4;
}

/* Or the left breath zone */
.zeitgeist-grid .feature-extended-left {
  grid-column: 1 / 3;
}

/* Full-bleed hero (Vercel style) */
.zeitgeist-grid .hero-full {
  grid-column: 1 / -1;
}
```

### Staggered Zeitgeist

Features alternate between center, center-left, and center-right, creating the signature staggered rhythm of Linear's marketing pages:

```css
.zeitgeist-staggered {
  display: grid;
  grid-template-columns: 1fr 1.618fr 1fr;
  gap: 2.5rem;
}

/* Row 1: centered */
.zeitgeist-staggered .feat-1 { grid-column: 2; grid-row: 1; }

/* Row 2: left-aligned (golden split of content area) */
.zeitgeist-staggered .feat-2 { grid-column: 1 / 3; grid-row: 2; }
.zeitgeist-staggered .feat-2-side { grid-column: 3; grid-row: 2; }

/* Row 3: centered */
.zeitgeist-staggered .feat-3 { grid-column: 2; grid-row: 3; }

/* Row 4: right-aligned (inverse golden split) */
.zeitgeist-staggered .feat-4-side { grid-column: 1; grid-row: 4; }
.zeitgeist-staggered .feat-4 { grid-column: 2 / 4; grid-row: 4; }

/* Row 5: full bleed */
.zeitgeist-staggered .feat-5 { grid-column: 1 / -1; grid-row: 5; }
```

### Zeitgeist with Nested Bento

The center content column can itself be a bento grid, combining the premium feel of zeitgeist spacing with the information density of bento:

```css
.zeitgeist-bento {
  display: grid;
  grid-template-columns: 1fr 1.618fr 1fr;
  gap: 2.5rem;
}

.zeitgeist-bento .bento-center {
  grid-column: 2;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(100px, auto);
  gap: 1.5rem;
}

.zeitgeist-bento .bento-center .bento-main {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
}

.zeitgeist-bento .bento-center .bento-side {
  grid-column: 3;
  grid-row: 1;
}

.zeitgeist-bento .bento-center .bento-accent {
  grid-column: 3;
  grid-row: 2;
}
```

**When to use**: SaaS marketing pages, product landing pages, developer tool sites, any page that needs to feel premium and modern.

---

## Golden Masonry Bento

The hybrid layout combining masonry's variable-height items with bento's explicit spanning and golden proportions. This is the most complex pattern but produces the most visually striking results: a bento grid where compartments have Fibonacci-proportioned heights, creating an organic yet structured feel.

### 6-Column Masonry Bento

```css
.masonry-bento {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: 40px; /* 40px row unit */
  gap: 1.5rem; /* 24px = Fib-val 3 */
}

/* Hero: 4 cols wide, 8 rows tall (320px + gaps) */
.masonry-bento .hero {
  grid-column: 1 / 5;
  grid-row: span 8;
}

/* Tall stat: 2 cols, 5 rows (200px + gaps) */
.masonry-bento .stat-tall {
  grid-column: 5 / 7;
  grid-row: span 5;
}

/* Short stat: 2 cols, 3 rows (120px + gaps) */
.masonry-bento .stat-short {
  grid-column: 5 / 7;
  grid-row: span 3;
}

/* Medium band: 3 cols, 5 rows */
.masonry-bento .band-medium {
  grid-column: 1 / 4;
  grid-row: span 5;
}

/* Accent: 1 col, 3 rows */
.masonry-bento .accent {
  grid-column: 4 / 5;
  grid-row: span 3;
}

/* Micro: 1 col, 2 rows */
.masonry-bento .micro {
  grid-column: 5 / 6;
  grid-row: span 2;
}

/* Micro: 1 col, 3 rows */
.masonry-bento .micro-alt {
  grid-column: 6 / 7;
  grid-row: span 3;
}

/* Wide strip: 4 cols, 2 rows */
.masonry-bento .strip {
  grid-column: 1 / 5;
  grid-row: span 2;
}
```

### 8-Column Masonry Bento (Extended)

For wider viewports, 8 columns provide finer golden proportion control:

```css
.masonry-bento-8 {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-auto-rows: 40px;
  gap: 1.5rem;
}

/* Golden split at 5:3 columns (1.667, close to 1.618) */
.masonry-bento-8 .dominant {
  grid-column: 1 / 6;
  grid-row: span 8;
}

.masonry-bento-8 .secondary {
  grid-column: 6 / 9;
  grid-row: span 5;
}

.masonry-bento-8 .tertiary {
  grid-column: 6 / 9;
  grid-row: span 3;
}

/* Bottom row with Fibonacci column spans */
.masonry-bento-8 .fib-1 {
  grid-column: 1 / 2; /* 1 col */
  grid-row: span 3;
}

.masonry-bento-8 .fib-2 {
  grid-column: 2 / 4; /* 2 cols */
  grid-row: span 5;
}

.masonry-bento-8 .fib-3 {
  grid-column: 4 / 7; /* 3 cols */
  grid-row: span 3;
}

.masonry-bento-8 .fib-5 {
  grid-column: 7 / 9; /* 2 cols (closest in 8-col grid) */
  grid-row: span 2;
}
```

### Responsive Masonry Bento

```css
.masonry-bento {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: 40px;
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .masonry-bento {
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 40px;
  }
  .masonry-bento .hero {
    grid-column: 1 / -1;
    grid-row: span 5;
  }
}

@media (max-width: 768px) {
  .masonry-bento {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
    gap: 1.5rem;
  }
  .masonry-bento .hero,
  .masonry-bento .stat-tall,
  .masonry-bento .stat-short,
  .masonry-bento .band-medium,
  .masonry-bento .accent,
  .masonry-bento .micro {
    grid-column: 1;
    grid-row: auto;
  }
}
```

**Key principle**: The hybrid of masonry (variable heights) and bento (explicit spans) produces layouts that feel both organic (heights vary by Fibonacci amounts) and intentional (spans are precisely calculated, not random).

**When to use**: SaaS dashboards with mixed content types, analytics overviews, portfolio sites with mixed media, any layout needing both structure and organic variety.

---

## Golden Triangle

Full CSS pattern for the diagonal compositional layout where sides form golden proportions. This pattern creates dramatic diagonal visual weight.

### Basic Golden Triangle

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

### Inverted Triangle

```css
.triangle-inverted {
  display: grid;
  grid-template-columns: 1fr 1.618fr;
  grid-template-rows: 1fr 1.618fr;
  gap: 1.5rem;
}

.triangle-inverted .base {
  grid-column: 1 / -1;
  grid-row: 2;
}

.triangle-inverted .top-a {
  grid-column: 1;
  grid-row: 1;
}

.triangle-inverted .top-b {
  grid-column: 2;
  grid-row: 1;
}
```

### Triangle with Diagonal Accent

```css
.triangle-diagonal {
  display: grid;
  grid-template-columns: 1.618fr 1fr;
  grid-template-rows: 1fr 1.618fr;
  gap: 1.5rem;
}

.triangle-diagonal .accent {
  grid-column: 1;
  grid-row: 1;
}

.triangle-diagonal .main {
  grid-column: 2;
  grid-row: 1 / 3;
}

.triangle-diagonal .support {
  grid-column: 1;
  grid-row: 2;
}
```

Responsive variants and when-to-use guidance. **When to use**: Hero sections with diagonal emphasis, pricing pages with dominant offer, landing pages with asymmetric CTA placement.

---

## Sacred Geometry

Three-zone layout where the center zone is the golden rectangle, flanked by breath zones. The center carries 61.8% of both width and height.

### Basic Sacred Grid

```css
.sacred-grid {
  display: grid;
  grid-template-columns: 1fr 1.618fr 1fr;
  grid-template-rows: 1fr 1.618fr 1fr;
  gap: 1.5rem;
  min-height: 100vh;
}

.sacred-grid .center {
  grid-column: 2;
  grid-row: 2;
}

.sacred-grid .top-left {
  grid-column: 1;
  grid-row: 1;
}

.sacred-grid .top-center {
  grid-column: 2;
  grid-row: 1;
}

.sacred-grid .top-right {
  grid-column: 3;
  grid-row: 1;
}

.sacred-grid .mid-left {
  grid-column: 1;
  grid-row: 2;
}

.sacred-grid .mid-right {
  grid-column: 3;
  grid-row: 2;
}

.sacred-grid .bot-left {
  grid-column: 1;
  grid-row: 3;
}

.sacred-grid .bot-center {
  grid-column: 2;
  grid-row: 3;
}

.sacred-grid .bot-right {
  grid-column: 3;
  grid-row: 3;
}
```

### Sacred Grid with Merged Zones

```css
.sacred-merged {
  display: grid;
  grid-template-columns: 1fr 1.618fr 1fr;
  grid-template-rows: 1fr 1.618fr 1fr;
  gap: 1.5rem;
}

/* Top banner spanning full width */
.sacred-merged .banner {
  grid-column: 1 / -1;
  grid-row: 1;
}

/* Center golden rectangle */
.sacred-merged .focal {
  grid-column: 2;
  grid-row: 2;
}

/* Side panels */
.sacred-merged .left-panel {
  grid-column: 1;
  grid-row: 2 / 4;
}

.sacred-merged .right-panel {
  grid-column: 3;
  grid-row: 2 / 4;
}

/* Bottom full width */
.sacred-merged .footer-area {
  grid-column: 2 / -1;
  grid-row: 3;
}
```

### Sacred Grid Responsive

```css
@media (max-width: 768px) {
  .sacred-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1.618fr auto;
  }
  .sacred-grid .center {
    grid-column: 1;
    grid-row: 2;
  }
}
```

**When to use**: Focal-point layouts, product showcases with centered hero, meditation/zen-style pages, luxury brand layouts where the center must dominate.

---

## Real-World Components

### Navigation Bar (Golden Split)

```css
.nav-golden {
  display: grid;
  grid-template-columns: 1fr 1.618fr;
  align-items: center;
  padding: 0 2.5rem;
  height: 4rem; /* 64px = Fib-val 8 */
  border-bottom: 1px solid var(--neutral-300);
}

.nav-golden .logo { grid-column: 1; }
.nav-golden .nav-links { grid-column: 2; justify-self: end; }
```

### Pricing Table (Fibonacci Columns)

```css
.pricing-fib {
  display: grid;
  grid-template-columns: 1fr 2fr 3fr;
  gap: 1.5rem;
}

.pricing-fib .plan-basic { grid-column: 1; }
.pricing-fib .plan-pro { grid-column: 2; }
.pricing-fib .plan-enterprise { grid-column: 3; }
```

### Contact Form (Golden Split)

```css
.form-golden {
  display: grid;
  grid-template-columns: 1.618fr 1fr;
  gap: 2.5rem;
}

.form-golden .form-fields { grid-column: 1; }
.form-golden .form-sidebar { grid-column: 2; }
```

### Footer (Sacred Grid Variant)

```css
.footer-sacred {
  display: grid;
  grid-template-columns: 1fr 1.618fr 1fr;
  gap: 1.5rem;
  padding: 4rem 2.5rem;
}

.footer-sacred .footer-brand { grid-column: 1; }
.footer-sacred .footer-links { grid-column: 2; }
.footer-sacred .footer-social { grid-column: 3; }
```

### Hero Section (Zeitgeist)

```css
.hero-zeitgeist {
  display: grid;
  grid-template-columns: 1fr 1.618fr 1fr;
  grid-template-rows: auto;
  gap: 2.5rem;
  min-height: 80vh;
  align-items: center;
}

.hero-zeitgeist .hero-content {
  grid-column: 2;
  text-align: center;
}
```

### Dashboard KPI Bar (Bento)

```css
.kpi-bento {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5rem;
  padding: 1.5rem;
}

/* First KPI card is golden-wide */
.kpi-bento .kpi-primary {
  grid-column: 1 / 3; /* 2 of 5 = 40%, close to 38.2% */
}
```

---

## Dark Mode Variants

### Dark Token Overrides

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-surface: #1a1a1a;
    --color-surface-alt: #262626;
    --color-border: var(--neutral-700);
    --color-border-hover: var(--neutral-500);
    --color-divider: var(--neutral-800);
    --color-text-primary: var(--neutral-200);
    --color-text-body: var(--neutral-300);
    --color-text-secondary: var(--neutral-400);
    --color-text-muted: var(--neutral-500);
  }

  /* Depth coding inverts in dark mode */
  /* Level 0: 2px solid var(--neutral-500) */
  /* Level 1: 1px solid var(--neutral-600) */
  /* Level 2: 1px dashed var(--neutral-700) */
  /* Level 3: 1px dotted var(--neutral-700) */
}
```

### Dark Bento Grid

```css
@media (prefers-color-scheme: dark) {
  .golden-bento .cell {
    border-color: var(--neutral-700);
    background: var(--neutral-900);
  }
  .golden-bento .cell:hover {
    border-color: var(--neutral-500);
  }
}
```

---

## Print Styles

```css
@media print {
  .golden-split,
  .fib-columns,
  .phi-grid,
  .spiral-grid,
  .golden-bento,
  .holy-grail-golden {
    gap: 0;
    border: none;
  }

  /* Force single column for print */
  .golden-split,
  .holy-grail-golden {
    grid-template-columns: 1fr;
  }

  .golden-bento {
    grid-template-columns: 1fr;
  }

  .golden-bento .hero,
  .golden-bento .stat-1,
  .golden-bento .stat-2,
  .golden-bento .mid-band,
  .golden-bento .accent {
    grid-column: 1;
    grid-row: auto;
  }

  /* Remove visual decorations */
  .cell-ascii,
  .ascii-deco,
  .phi-marker { display: none; }

  /* Ensure text is dark */
  .cell-label,
  .cell-ratio { color: #000; }

  /* Page breaks between major sections */
  .section { page-break-inside: avoid; }

  /* Remove shadows */
  * { box-shadow: none !important; }
}
```
