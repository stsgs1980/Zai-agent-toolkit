# Golden Grid -- React & Next.js Components

Production-ready React and Next.js App Router components implementing the golden-grid pattern library. Every component is a **React Server Component** by default, with client component boundaries noted where interactivity is required.

## Table of Contents

1. [GoldenSplit Component](#1-goldensplit-component)
2. [FibonacciColumns Component](#2-fibonaccicolumns-component)
3. [GoldenBento Component](#3-goldenbento-component)
4. [ZeitgeistGrid Component](#4-zeitgeistgrid-component)
5. [GoldenTimeline Component](#5-goldentimeline-component)
6. [MasonryBento Component](#6-masonrybento-component)
7. [Tailwind Utility Mappings](#7-tailwind-utility-mappings)
8. [Server Component Guidelines](#8-server-component-guidelines)
9. [Dark Mode with next-themes](#9-dark-mode-with-next-themes)

---

## 1. GoldenSplit Component

Implements **Pattern 01: Golden Split** -- the foundational `1fr 1.618fr` two-column layout. The larger column carries 61.8% of visual weight, the smaller carries 38.2%.

### TypeScript Interface

```tsx
interface GoldenSplitProps {
  /** Content for the narrow (38.2%) column -- typically sidebar, nav, or anchor text */
  sidebar: React.ReactNode;
  /** Content for the wide (61.8%) column -- typically main content */
  content: React.ReactNode;
  /** When true, swaps to `1.618fr 1fr` so content occupies the left golden column */
  reverse?: boolean;
  /** Fibonacci-based gap between columns */
  gap?: 'tight' | 'default' | 'relaxed' | 'loose';
  /** Optional minimum height; defaults to unset so the component flows naturally */
  minHeight?: string;
  /** Additional Tailwind classes merged onto the grid container */
  className?: string;
}
```

### Full TSX (Server Component)

```tsx
// components/golden-grid/golden-split.tsx
// Pattern 01: Golden Split -- 1fr 1.618fr two-column layout

const gapMap = {
  tight: 'gap-3',     // ~12px (derived) -> 0.75rem -> gap-3
  default: 'gap-6',   // ~24px = Fib-val 3 -> 1.5rem -> gap-6
  relaxed: 'gap-10',  // ~40px = Fib-val 5 -> 2.5rem -> gap-10
  loose: 'gap-16',    // ~64px = Fib-val 8 -> 4rem -> gap-16
} as const;

export function GoldenSplit({
  sidebar,
  content,
  reverse = false,
  gap = 'default',
  minHeight,
  className,
}: GoldenSplitProps) {
  // Pattern 01: grid-cols-[1fr_1.618fr] or grid-cols-[1.618fr_1fr] when reversed
  const columns = reverse
    ? 'grid-cols-[1.618fr_1fr]'
    : 'grid-cols-[1fr_1.618fr]';

  return (
    <div
      className={`grid ${columns} ${gapMap[gap]}${minHeight ? ` ${minHeight}` : ''}${className ? ` ${className}` : ''}`}
    >
      {sidebar}
      {content}
    </div>
  );
}
```

### Usage Example

```tsx
import { GoldenSplit } from '@/components/golden-grid/golden-split';

export default function DocsPage() {
  return (
    <GoldenSplit
      sidebar={<nav>...</nav>}
      content={<article>...</article>}
      gap="relaxed"
      className="min-h-screen px-fib-4"
    />
  );
}
```

### Responsive Variant

On viewports below 768px, collapse to a single column while preserving Fibonacci vertical spacing:

```tsx
// Pattern 01: Golden Split with responsive collapse
export function GoldenSplitResponsive({
  sidebar,
  content,
  reverse = false,
  gap = 'default',
  className,
}: GoldenSplitProps) {
  const gapMap = {
    tight: 'gap-3',
    default: 'gap-6',
    relaxed: 'gap-10',
    loose: 'gap-16',
  } as const;

  return (
    <div
      className={`
        grid
        grid-cols-1
        md:${reverse ? 'grid-cols-[1.618fr_1fr]' : 'grid-cols-[1fr_1.618fr]'}
        ${gapMap[gap]}
        ${className ?? ''}
      `}
    >
      {sidebar}
      {content}
    </div>
  );
}
```

---

## 2. FibonacciColumns Component

Implements **Pattern 02: Fibonacci Columns** -- multi-column layout where each column width follows the Fibonacci sequence (1, 2, 3, 5). Creates a natural reading hierarchy from narrow sidebar to wide content.

### TypeScript Interface

```tsx
interface FibonacciColumnsProps {
  /** Number of columns; determines the Fibonacci column template */
  columns: 3 | 4 | 5;
  /** Column contents; length must match the `columns` prop */
  children: React.ReactNode[];
  /** Fibonacci-based gap between columns */
  gap?: 'tight' | 'default' | 'relaxed';
  /** Additional Tailwind classes merged onto the grid container */
  className?: string;
}
```

### Full TSX (Server Component)

```tsx
// components/golden-grid/fibonacci-columns.tsx
// Pattern 02: Fibonacci Columns -- 1fr 2fr 3fr (3-col), 1fr 2fr 3fr 5fr (4-col), 1fr 1fr 2fr 3fr 5fr (5-col)

const colMap = {
  3: 'grid-cols-[1fr_2fr_3fr]',         // Fib: 1, 2, 3
  4: 'grid-cols-[1fr_2fr_3fr_5fr]',     // Fib: 1, 2, 3, 5
  5: 'grid-cols-[1fr_1fr_2fr_3fr_5fr]', // Fib: 1, 1, 2, 3, 5
} as const;

const gapMap = {
  tight: 'gap-3',    // ~12px (derived)
  default: 'gap-6',  // ~24px = Fib-val 3
  relaxed: 'gap-10', // ~40px = Fib-val 5
} as const;

export function FibonacciColumns({
  columns,
  children,
  gap = 'default',
  className,
}: FibonacciColumnsProps) {
  if (children.length !== columns) {
    console.warn(
      `FibonacciColumns: expected ${columns} children, got ${children.length}`
    );
  }

  return (
    <div
      className={`grid ${colMap[columns]} ${gapMap[gap]}${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  );
}
```

### Usage Example

```tsx
import { FibonacciColumns } from '@/components/golden-grid/fibonacci-columns';

export default function PricingPage() {
  return (
    <FibonacciColumns columns={3} gap="default">
      <div>Basic Plan</div>
      <div>Pro Plan (2x weight)</div>
      <div>Enterprise (3x weight)</div>
    </FibonacciColumns>
  );
}
```

### Responsive Variant

Collapses to golden split on tablet and single column on mobile:

```tsx
export function FibonacciColumnsResponsive({
  columns,
  children,
  gap = 'default',
  className,
}: FibonacciColumnsProps) {
  // Responsive: md shows golden split, lg shows full Fibonacci columns
  const responsiveColMap = {
    3: 'grid-cols-1 md:grid-cols-[1fr_1.618fr] lg:grid-cols-[1fr_2fr_3fr]',
    4: 'grid-cols-1 md:grid-cols-[1fr_1.618fr] lg:grid-cols-[1fr_2fr_3fr_5fr]',
    5: 'grid-cols-1 md:grid-cols-[1fr_1.618fr] lg:grid-cols-[1fr_1fr_2fr_3fr_5fr]',
  } as const;

  const gapMap = {
    tight: 'gap-3',
    default: 'gap-6',
    relaxed: 'gap-10',
  } as const;

  return (
    <div
      className={`grid ${responsiveColMap[columns]} ${gapMap[gap]}${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  );
}
```

---

## 3. GoldenBento Component

Implements **Pattern 05: Bento Grid (6-column Golden)** -- a full bento layout with named slots. The hero compartment occupies 4 of 6 columns (~66.7%) and 2 rows, approximating the 61.8% golden section. Stats, mid-band, accent, and support slots fill the remaining space in decreasing Fibonacci proportions.

### TypeScript Interface

```tsx
interface GoldenBentoProps {
  /** Hero slot -- 4 cols x 2 rows, dominant visual element (~61.8% area) */
  hero: React.ReactNode;
  /** First stat slot -- 2 cols x 1 row, positioned top-right */
  stat1: React.ReactNode;
  /** Second stat slot -- 2 cols x 1 row, positioned mid-right */
  stat2: React.ReactNode;
  /** Mid-band slot -- 3 cols x 1 row, secondary content band */
  midBand: React.ReactNode;
  /** Accent slot -- 1 col x 1 row, visual accent or CTA */
  accent: React.ReactNode;
  /** Support slot A -- 1 col x 1 row, small detail */
  supportA?: React.ReactNode;
  /** Support slot B -- 1 col x 1 row, small detail */
  supportB?: React.ReactNode;
  /** Variant: 6-col (default) or 5-col asymmetric */
  variant?: '6col' | '5col';
  /** Fibonacci-based gap between cells */
  gap?: 'tight' | 'default' | 'relaxed';
  /** Additional Tailwind classes merged onto the grid container */
  className?: string;
}

/** Slot names for the 6-column bento grid */
type BentoSlot6 = 'hero' | 'stat1' | 'stat2' | 'midBand' | 'accent' | 'supportA' | 'supportB';

/** Grid placement map: slot name -> Tailwind grid-column/grid-row classes */
const slotPlacement6: Record<BentoSlot6, string> = {
  hero:     'col-span-4 row-span-2',     // 4 of 6 cols, 2 rows
  stat1:    'col-span-2 row-span-1',     // 2 of 6 cols, 1 row
  stat2:    'col-span-2 row-span-1',     // 2 of 6 cols, 1 row
  midBand:  'col-span-3 row-span-1',     // 3 of 6 cols, 1 row
  accent:   'col-span-1 row-span-1',     // 1 of 6 cols, 1 row
  supportA: 'col-span-1 row-span-1',     // 1 of 6 cols, 1 row
  supportB: 'col-span-1 row-span-1',     // 1 of 6 cols, 1 row
};
```

### Full TSX (Server Component)

```tsx
// components/golden-grid/golden-bento.tsx
// Pattern 05: Bento Grid (6-column Golden)
// Hero: 4/6 cols x 2 rows (~66.7% top area, close to 61.8% golden section)
// Stats: 2/6 cols x 1 row each (stacked vertically)
// Mid-band: 3/6 cols, Accent: 1/6 col, Support: 1/6 col each

const gapMap = {
  tight: 'gap-3',    // ~12px (derived)
  default: 'gap-6',  // ~24px = Fib-val 3
  relaxed: 'gap-10', // ~40px = Fib-val 5
} as const;

export function GoldenBento({
  hero,
  stat1,
  stat2,
  midBand,
  accent,
  supportA,
  supportB,
  variant = '6col',
  gap = 'default',
  className,
}: GoldenBentoProps) {
  if (variant === '5col') {
    // Pattern 06: Bento 5-col -- 3:2 split (1.5 ratio, close to phi=1.618)
    return (
      <div
        className={`grid grid-cols-5 auto-rows-[minmax(100px,auto)] ${gapMap[gap]}${className ? ` ${className}` : ''}`}
      >
        <div className="col-span-3 row-span-2">{hero}</div>
        <div className="col-span-2 row-span-1">{stat1}</div>
        <div className="col-span-1 row-span-1">{accent}</div>
        <div className="col-span-1 row-span-1">{supportA}</div>
      </div>
    );
  }

  // Pattern 05: Bento 6-col (default)
  return (
    <div
      className={`grid grid-cols-6 auto-rows-[minmax(120px,auto)] ${gapMap[gap]}${className ? ` ${className}` : ''}`}
    >
      {/* Row 1-2: Hero (4 cols) + Stats (2 cols stacked) */}
      <div className="col-span-4 row-span-2">{hero}</div>
      <div className="col-span-2 row-span-1">{stat1}</div>
      <div className="col-span-2 row-span-1">{stat2}</div>

      {/* Row 3: Mid-band (3 cols) + Accent (1 col) + Supports (2 cols) */}
      <div className="col-span-3 row-span-1">{midBand}</div>
      <div className="col-span-1 row-span-1">{accent}</div>
      {supportA && <div className="col-span-1 row-span-1">{supportA}</div>}
      {supportB && <div className="col-span-1 row-span-1">{supportB}</div>}
    </div>
  );
}
```

### Usage Example

```tsx
import { GoldenBento } from '@/components/golden-grid/golden-bento';

export default function LandingPage() {
  return (
    <GoldenBento
      hero={<HeroVisual />}
      stat1={<StatCard label="Users" value="12.4k" />}
      stat2={<StatCard label="Uptime" value="99.9%" />}
      midBand={<FeatureShowcase />}
      accent={<CallToAction />}
      supportA={<SocialProof />}
      supportB={<Testimonial />}
      gap="default"
    />
  );
}
```

### Responsive Bento

On tablet, the 6-column grid collapses to 4 columns with the hero going full-width. On mobile, everything stacks:

```tsx
export function GoldenBentoResponsive(props: GoldenBentoProps) {
  const { hero, stat1, stat2, midBand, accent, supportA, supportB, gap = 'default', className } = props;
  const gapClass = gapMap[gap];

  return (
    <div
      className={`
        grid
        grid-cols-1
        md:grid-cols-4
        lg:grid-cols-6
        auto-rows-[minmax(120px,auto)]
        ${gapClass}
        ${className ?? ''}
      `}
    >
      {/* Mobile: all items stack naturally. md+: grid takes effect */}
      <div className="col-span-1 md:col-span-4 lg:col-span-4 lg:row-span-2">{hero}</div>
      <div className="col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-1">{stat1}</div>
      <div className="col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-1">{stat2}</div>
      <div className="col-span-1 md:col-span-3 lg:col-span-3">{midBand}</div>
      <div className="col-span-1 md:col-span-1 lg:col-span-1">{accent}</div>
      {supportA && <div className="col-span-1 lg:col-span-1">{supportA}</div>}
      {supportB && <div className="col-span-1 lg:col-span-1">{supportB}</div>}
    </div>
  );
}
```

---

## 4. ZeitgeistGrid Component

Implements **Pattern 15: Zeitgeist Grid** -- the Linear/Vercel/Stripe-style `1fr 1.618fr 1fr` three-column grid. Content occupies the golden center column while generous negative space fills the sides, creating a premium, restrained feel. Staggered variants alternate content between center, center-left, and center-right positions.

### TypeScript Interface

```tsx
interface ZeitgeistGridProps {
  /** Feature blocks to render in the grid */
  features: ZeitgeistFeature[];
  /** Maximum width constraint; defaults to 1440px */
  maxWidth?: string;
  /** Fibonacci-based gap between feature rows */
  gap?: 'default' | 'relaxed' | 'loose';
  /** Layout variant */
  variant?: 'centered' | 'staggered';
  /** Additional Tailwind classes merged onto the grid container */
  className?: string;
}

interface ZeitgeistFeature {
  /** Unique key for React reconciliation */
  id: string;
  /** Feature content */
  content: React.ReactNode;
  /**
   * Placement within the 3-column zeitgeist grid:
   * - 'center'    -> col 2 (golden center)
   * - 'left'      -> col 1-2 (left-extended)
   * - 'right'     -> col 2-3 (right-extended)
   * - 'full'      -> col 1-3 (full bleed)
   * - 'left-side' -> col 1 only (side content for staggered)
   * - 'right-side'-> col 3 only (side content for staggered)
   */
  placement: 'center' | 'left' | 'right' | 'full' | 'left-side' | 'right-side';
}
```

### Full TSX (Server Component)

```tsx
// components/golden-grid/zeitgeist-grid.tsx
// Pattern 15: Zeitgeist Grid -- 1fr 1.618fr 1fr
// Center column is the golden section (~61.8% of content width)
// Breath zones on each side create premium negative space

const gapMap = {
  default: 'gap-10', // ~40px = Fib-val 5 -> gap-10
  relaxed: 'gap-16', // ~64px = Fib-val 8 -> gap-16
  loose: 'gap-24',   // ~96px between major features
} as const;

/** Maps placement prop to Tailwind grid-column classes */
const placementMap: Record<ZeitgeistFeature['placement'], string> = {
  center:     'col-start-2',       // Golden center only
  left:       'col-start-1 col-end-3',   // Center + left breath
  right:      'col-start-2 col-end-4',   // Center + right breath
  full:       'col-start-1 col-end-4',   // Full bleed across all 3 cols
  'left-side':  'col-start-1 col-end-2', // Left breath zone only
  'right-side': 'col-start-3 col-end-4', // Right breath zone only
};

export function ZeitgeistGrid({
  features,
  maxWidth = 'max-w-screen-2xl',
  gap = 'default',
  variant = 'centered',
  className,
}: ZeitgeistGridProps) {
  // Pattern 15: grid-cols-[1fr_1.618fr_1fr] -- breath : golden content : breath
  return (
    <div
      className={`grid grid-cols-[1fr_1.618fr_1fr] ${gapMap[gap]} mx-auto ${maxWidth}${className ? ` ${className}` : ''}`}
    >
      {features.map((feature) => (
        <div
          key={feature.id}
          className={placementMap[feature.placement]}
        >
          {feature.content}
        </div>
      ))}
    </div>
  );
}
```

### Usage Example (Staggered)

```tsx
import { ZeitgeistGrid } from '@/components/golden-grid/zeitgeist-grid';
import type { ZeitgeistFeature } from '@/components/golden-grid/zeitgeist-grid';

const features: ZeitgeistFeature[] = [
  { id: 'hero', content: <HeroSection />, placement: 'full' },
  { id: 'feat-1', content: <FeatureOne />, placement: 'center' },
  { id: 'feat-2', content: <FeatureTwo />, placement: 'left' },
  { id: 'feat-2-side', content: <SideNote />, placement: 'right-side' },
  { id: 'feat-3', content: <FeatureThree />, placement: 'center' },
  { id: 'feat-4', content: <FeatureFour />, placement: 'right' },
  { id: 'feat-4-side', content: <Quote />, placement: 'left-side' },
];

export default function ProductPage() {
  return (
    <ZeitgeistGrid
      features={features}
      variant="staggered"
      gap="relaxed"
      className="py-fib-5"
    />
  );
}
```

### Zeitgeist with Nested Bento

The center golden column can itself be a bento grid, combining premium zeitgeist spacing with information density:

```tsx
// Pattern 15 + Pattern 05: Zeitgeist with nested Golden Bento
export function ZeitgeistBento({
  bentoContent,
  sideContent,
}: {
  bentoContent: React.ReactNode;
  sideContent?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_1.618fr_1fr] gap-10 max-w-screen-2xl mx-auto">
      <div className="col-start-2">
        {/* Center: nested 3-column bento grid */}
        <div className="grid grid-cols-3 auto-rows-[minmax(100px,auto)] gap-6">
          {bentoContent}
        </div>
      </div>
      {sideContent && (
        <div className="col-start-3">{sideContent}</div>
      )}
    </div>
  );
}
```

---

## 5. GoldenTimeline Component

Implements **Pattern 14: Golden Timeline** -- vertical timeline with center axis at the golden section (38.2% from left). Events alternate left and right with Fibonacci-scaled vertical spacing. A Fibonacci rhythm variant makes recent events denser than ancient ones, mimicking human time perception.

### TypeScript Interface

```tsx
interface GoldenTimelineProps {
  /** Timeline events with positioning and era information */
  events: TimelineEvent[];
  /** Variant: standard alternating or Fibonacci rhythm (recent=dense, ancient=sparse) */
  variant?: 'standard' | 'fib-rhythm';
  /** Fibonacci-based gap between events (overridden by era in fib-rhythm variant) */
  gap?: 'default' | 'relaxed' | 'loose';
  /** Additional Tailwind classes merged onto the grid container */
  className?: string;
}

interface TimelineEvent {
  /** Unique key */
  id: string;
  /** Event content (title, description, date, etc.) */
  content: React.ReactNode;
  /** Which side of the axis the event appears on */
  side: 'left' | 'right';
  /**
   * Era for Fibonacci rhythm spacing (only used when variant='fib-rhythm'):
   * - 'ancient' -> 10.5rem margin-bottom (Fib-val 21)
   * - 'old'     -> 6.5rem margin-bottom (Fib-val 13)
   * - 'recent'  -> 4rem margin-bottom (Fib-val 8)
   * - 'current' -> 2.5rem margin-bottom (Fib-val 5)
   */
  era?: 'ancient' | 'old' | 'recent' | 'current';
}
```

### Full TSX (Server Component)

```tsx
// components/golden-grid/golden-timeline.tsx
// Pattern 14: Golden Timeline -- 38.2% axis with alternating events
// Grid: 3.82fr (left) | 1fr (axis) | 5.18fr (right)
// Vertical spacing follows Fibonacci rhythm: ancient events sparse, recent events dense

const eraSpacingMap = {
  ancient: 'mb-[10.5rem]',  // Fib-val 21 = 168px = 10.5rem
  old:     'mb-[6.5rem]',   // Fib-val 13 = 104px = 6.5rem
  recent:  'mb-[4rem]',     // Fib-val 8 = 64px = 4rem
  current: 'mb-[2.5rem]',   // Fib-val 5 = 40px = 2.5rem
} as const;

const gapMap = {
  default: 'gap-10',  // ~40px = Fib-val 5
  relaxed: 'gap-16',  // ~64px = Fib-val 8
  loose: 'gap-24',    // ~96px
} as const;

export function GoldenTimeline({
  events,
  variant = 'standard',
  gap = 'default',
  className,
}: GoldenTimelineProps) {
  // Pattern 14: 38.2% left | 10% axis | 51.8% right
  // Using grid-cols-[3.82fr_1fr_5.18fr] to place the axis at the golden section
  return (
    <div
      className={`grid grid-cols-[3.82fr_1fr_5.18fr] relative ${className ?? ''}`}
    >
      {/* Center axis line */}
      <div
        className="absolute left-[calc(38.2%+5%)] top-0 bottom-0 w-px bg-neutral-300 dark:bg-neutral-700"
        aria-hidden="true"
      />

      {events.map((event) => {
        const isLeft = event.side === 'left';

        // Era-based spacing (Fibonacci rhythm variant)
        const eraClass =
          variant === 'fib-rhythm' && event.era
            ? eraSpacingMap[event.era]
            : variant === 'fib-rhythm'
              ? eraSpacingMap.recent
              : 'mb-16'; // Standard: Fib-val 8 spacing

        return (
          <div key={event.id} className={`contents`}>
            {/* Left column content */}
            <div
              className={`text-right pr-[2.5rem] ${isLeft ? '' : 'invisible'} ${eraClass}`}
            >
              {isLeft ? event.content : null}
            </div>

            {/* Axis dot */}
            <div
              className={`flex items-start justify-center pt-2 ${eraClass}`}
            >
              <div className="w-3 h-3 rounded-full bg-neutral-500 dark:bg-neutral-400 shrink-0" />
            </div>

            {/* Right column content */}
            <div
              className={`text-left pl-[2.5rem] ${isLeft ? 'invisible' : ''} ${eraClass}`}
            >
              {!isLeft ? event.content : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Usage Example

```tsx
import { GoldenTimeline } from '@/components/golden-grid/golden-timeline';
import type { TimelineEvent } from '@/components/golden-grid/golden-timeline';

const events: TimelineEvent[] = [
  { id: '1', content: <EventCard date="2020" title="Founded" />, side: 'left', era: 'ancient' },
  { id: '2', content: <EventCard date="2021" title="Series A" />, side: 'right', era: 'old' },
  { id: '3', content: <EventCard date="2023" title="10k Users" />, side: 'left', era: 'recent' },
  { id: '4', content: <EventCard date="2024" title="Launch" />, side: 'right', era: 'current' },
];

export default function RoadmapPage() {
  return (
    <GoldenTimeline
      events={events}
      variant="fib-rhythm"
      gap="default"
      className="py-fib-6"
    />
  );
}
```

### Single-Column Timeline (Mobile)

For mobile or compact views, the timeline shifts to a single column with the axis on the left:

```tsx
export function GoldenTimelineMobile({
  events,
}: {
  events: TimelineEvent[];
}) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr] gap-6">
      {events.map((event) => (
        <div key={event.id} className="contents">
          <div className="flex flex-col items-center pt-2">
            <div className="w-3 h-3 rounded-full bg-neutral-500 dark:bg-neutral-400" />
            <div className="w-px flex-1 bg-neutral-300 dark:bg-neutral-700" />
          </div>
          <div className="pb-16">{event.content}</div>
        </div>
      ))}
    </div>
  );
}
```

---

## 6. MasonryBento Component

Implements **Pattern 16: Golden Masonry Bento** -- the most complex hybrid pattern combining masonry variable heights + bento explicit spans + golden proportions. Compartments have Fibonacci row spans (2, 3, 5, 8 rows) creating organic variety within a structured grid. Available in 6-column and 8-column variants.

### TypeScript Interface

```tsx
interface MasonryBentoProps {
  /** Masonry items with explicit grid placement */
  items: MasonryBentoItem[];
  /** Column variant */
  variant?: '6col' | '8col';
  /** Row unit height in pixels; defaults to 40px (Fib-val 5) */
  rowUnit?: number;
  /** Fibonacci-based gap between cells */
  gap?: 'tight' | 'default' | 'relaxed';
  /** Additional Tailwind classes merged onto the grid container */
  className?: string;
}

interface MasonryBentoItem {
  /** Unique key */
  id: string;
  /** Item content */
  content: React.ReactNode;
  /** Column span (1-based count of columns this item occupies) */
  colSpan: 1 | 2 | 3 | 4 | 5;
  /** Row span using Fibonacci values: 2, 3, 5, 8, 13 */
  rowSpan: 2 | 3 | 5 | 8 | 13;
  /** Starting column (1-based); auto-placed if omitted */
  colStart?: number;
}
```

### Full TSX (Server Component)

```tsx
// components/golden-grid/masonry-bento.tsx
// Pattern 16: Golden Masonry Bento -- masonry + bento + golden proportions
// Uses grid-auto-rows with a 40px (~40px) row unit
// Row spans follow Fibonacci: 2, 3, 5, 8, 13
// Visual weight: 61.8% compact items, 23.6% features, 14.6% heroes

const gapMap = {
  tight: 'gap-3',    // ~12px (derived)
  default: 'gap-6',  // ~24px = Fib-val 3
  relaxed: 'gap-10', // ~40px = Fib-val 5
} as const;

export function MasonryBento({
  items,
  variant = '6col',
  rowUnit = 40,
  gap = 'default',
  className,
}: MasonryBentoProps) {
  const colClass = variant === '8col'
    ? 'grid-cols-8'
    : 'grid-cols-6';

  // Pattern 16: grid-auto-rows: 40px (~40px row unit)
  // Row spans follow Fibonacci: 2, 3, 5, 8, 13
  //   span 2  -> ~80px + gaps (micro)
  //   span 3  -> ~120px + gaps (compact -- 61.8% of items)
  //   span 5  -> ~200px + gaps (feature -- 23.6% of items)
  //   span 8  -> ~320px + gaps (hero -- 14.6% of items)
  //   span 13 -> ~520px + gaps (full-bleed hero)
  return (
    <div
      className={`grid ${colClass} ${gapMap[gap]}${className ? ` ${className}` : ''}`}
      style={{ gridAutoRows: `minmax(${rowUnit}px, auto)` }}
    >
      {items.map((item) => {
        const colStartClass = item.colStart
          ? `col-start-${item.colStart}`
          : '';
        const colSpanClass = `col-span-${item.colSpan}`;
        const rowSpanClass = `row-span-${item.rowSpan}`;

        return (
          <div
            key={item.id}
            className={`${colStartClass} ${colSpanClass} ${rowSpanClass}`}
          >
            {item.content}
          </div>
        );
      })}
    </div>
  );
}
```

### Usage Example

```tsx
import { MasonryBento } from '@/components/golden-grid/masonry-bento';
import type { MasonryBentoItem } from '@/components/golden-grid/masonry-bento';

const items: MasonryBentoItem[] = [
  // Hero: 4 cols, 8 rows tall (~320px) -- 14.6% of items are heroes
  { id: 'hero', content: <HeroCard />, colSpan: 4, rowSpan: 8, colStart: 1 },
  // Tall stat: 2 cols, 5 rows (~200px) -- 23.6% are features
  { id: 'stat-tall', content: <StatCard />, colSpan: 2, rowSpan: 5, colStart: 5 },
  // Short stat: 2 cols, 3 rows (~120px) -- 61.8% are compact
  { id: 'stat-short', content: <MiniStat />, colSpan: 2, rowSpan: 3, colStart: 5 },
  // Medium band: 3 cols, 5 rows
  { id: 'band', content: <FeatureBand />, colSpan: 3, rowSpan: 5, colStart: 1 },
  // Accent: 1 col, 3 rows
  { id: 'accent', content: <AccentCard />, colSpan: 1, rowSpan: 3, colStart: 4 },
  // Micro items
  { id: 'micro-1', content: <TagCloud />, colSpan: 1, rowSpan: 2, colStart: 5 },
  { id: 'micro-2', content: <QuickAction />, colSpan: 1, rowSpan: 3, colStart: 6 },
];

export default function DashboardPage() {
  return (
    <MasonryBento
      items={items}
      variant="6col"
      gap="default"
      className="py-fib-5"
    />
  );
}
```

### 8-Column Variant Example

For wider viewports, 8 columns provide finer golden proportion control. The 5:3 column split (1.667) closely approximates phi (1.618):

```tsx
const items8col: MasonryBentoItem[] = [
  // Dominant: 5 of 8 cols (5:3 = 1.667, close to phi)
  { id: 'dom', content: <MainChart />, colSpan: 5, rowSpan: 8, colStart: 1 },
  // Secondary: 3 of 8 cols
  { id: 'sec', content: <SidePanel />, colSpan: 3, rowSpan: 5, colStart: 6 },
  // Tertiary: 3 of 8 cols
  { id: 'ter', content: <InfoPanel />, colSpan: 3, rowSpan: 3, colStart: 6 },
];

export default function WideDashboard() {
  return (
    <MasonryBento items={items8col} variant="8col" gap="default" />
  );
}
```

### Responsive Masonry Bento

```tsx
export function MasonryBentoResponsive({
  items,
  gap = 'default',
  className,
}: Omit<MasonryBentoProps, 'variant'>) {
  const gapClass = gapMap[gap];

  return (
    <div
      className={`
        grid
        grid-cols-1
        md:grid-cols-4
        lg:grid-cols-6
        ${gapClass}
        ${className ?? ''}
      `}
      style={{ gridAutoRows: 'minmax(40px, auto)' }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={`
            col-span-1
            md:col-span-${Math.min(item.colSpan, 4)}
            lg:col-span-${item.colSpan}
            row-span-${item.rowSpan <= 5 ? item.rowSpan : 5}
          `}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
```

---

## 7. Tailwind Utility Mappings

Complete reference table mapping each of the 18 golden-grid patterns to Tailwind CSS utility classes. Use these mappings to apply golden proportions directly via Tailwind without custom CSS.

### Grid Template Columns

| # | Pattern | `grid-template-columns` | Tailwind Class | Fibonacci Gap | Gap Tailwind |
|---|---------|------------------------|----------------|---------------|-------------|
| 01 | Golden Split | `1fr 1.618fr` | `grid-cols-[1fr_1.618fr]` | Fib-val 5 | `gap-10` |
| 01 | Golden Split (rev) | `1.618fr 1fr` | `grid-cols-[1.618fr_1fr]` | Fib-val 5 | `gap-10` |
| 02 | Fibonacci 3-col | `1fr 2fr 3fr` | `grid-cols-[1fr_2fr_3fr]` | Fib-val 3 | `gap-6` |
| 02 | Fibonacci 4-col | `1fr 2fr 3fr 5fr` | `grid-cols-[1fr_2fr_3fr_5fr]` | Fib-val 3 | `gap-6` |
| 02 | Fibonacci 5-col | `1fr 1fr 2fr 3fr 5fr` | `grid-cols-[1fr_1fr_2fr_3fr_5fr]` | Fib-val 3 | `gap-6` |
| 03 | Phi Grid 12-col | `repeat(12, 1fr)` | `grid-cols-12` | Fib-val 3 | `gap-6` |
| 04 | Spiral Grid | `34fr 21fr 13fr 8fr` | `grid-cols-[34fr_21fr_13fr_8fr]` | Fib-val 3 | `gap-6` |
| 05 | Bento 6-col | `repeat(6, 1fr)` | `grid-cols-6` | Fib-val 3 | `gap-6` |
| 06 | Bento 5-col | `repeat(5, 1fr)` | `grid-cols-5` | Fib-val 3 | `gap-6` |
| 07 | Asymmetric Holy Grail | `3fr 13fr 5fr` | `grid-cols-[3fr_13fr_5fr]` | Fib-val 3 | `gap-6` |
| 08 | Golden Card Grid | auto-fit + golden card | `grid-cols-[repeat(auto-fit,minmax(280px,1fr))]` | Fib-val 5 | `gap-10` |
| 09 | Diagonal Fibonacci | `1fr 2fr 3fr 5fr` cols, `5fr 3fr 2fr 1fr` rows | `grid-cols-[1fr_2fr_3fr_5fr]` + `grid-rows-[5fr_3fr_2fr_1fr]` | Fib-val 3 | `gap-6` |
| 10 | Nested Golden | recursive `1fr 1.618fr` | outer: `grid-cols-[1fr_1.618fr]`, inner: varies | outer Fib-val 5, inner Fib-val 3 | outer `gap-10`, inner `gap-6` |
| 11 | Magazine Layout | `5fr 3fr 2fr` | `grid-cols-[5fr_3fr_2fr]` | Fib-val 3 | `gap-6` |
| 12 | Dashboard Golden | `3fr 5fr 2fr` | `grid-cols-[3fr_5fr_2fr]` | Fib-val 3 | `gap-6` |
| 13 | Masonry Golden | `repeat(4, 1fr)` | `grid-cols-4` | Fib-val 3 | `gap-6` |
| 13 | Masonry (biased) | `1fr 1fr 1.618fr 1.618fr` | `grid-cols-[1fr_1fr_1.618fr_1.618fr]` | Fib-val 3 | `gap-6` |
| 14 | Golden Timeline | `3.82fr 1fr 5.18fr` | `grid-cols-[3.82fr_1fr_5.18fr]` | 0 | `gap-0` |
| 15 | Zeitgeist Grid | `1fr 1.618fr 1fr` | `grid-cols-[1fr_1.618fr_1fr]` | Fib-val 5 | `gap-10` |
| 16 | Masonry Bento 6-col | `repeat(6, 1fr)` | `grid-cols-6` + `grid-auto-rows-[40px]` | Fib-val 3 | `gap-6` |
| 16 | Masonry Bento 8-col | `repeat(8, 1fr)` | `grid-cols-8` + `grid-auto-rows-[40px]` | Fib-val 3 | `gap-6` |
| 17 | Golden Triangle | `1.618fr 1fr` cols, `1.618fr 1fr` rows | `grid-cols-[1.618fr_1fr]` + `grid-rows-[1.618fr_1fr]` | Fib-val 3 | `gap-6` |
| 18 | Sacred Geometry | `1fr 1.618fr 1fr` cols + rows | `grid-cols-[1fr_1.618fr_1fr]` + `grid-rows-[1fr_1.618fr_1fr]` | Fib-val 3 | `gap-6` |

### Fibonacci Spacing Scale (Tailwind)

| Fibonacci Index | Value | px | rem | Tailwind Class |
|----------------|-------|----|-----|---------------|
| 3 | 2 | 16px | 1rem | `gap-4`, `p-4`, `m-4` |
| 4 | 3 | 24px | 1.5rem | `gap-6`, `p-6`, `m-6` |
| 5 | 5 | 40px | 2.5rem | `gap-10`, `p-10`, `m-10` |
| 6 | 8 | 64px | 4rem | `gap-16`, `p-16`, `m-16` |
| 7 | 13 | 104px | 6.5rem | `gap-26`, `p-26`, `m-26` |
| 8 | 21 | 168px | 10.5rem | `gap-[10.5rem]`, `p-[10.5rem]` |

### Masonry Row Spans (Tailwind)

| Fibonacci Row Span | Approx Height | Tailwind Class | Visual Weight |
|--------------------|--------------|----------------|---------------|
| 2 | ~80px + gaps | `row-span-2` | Micro |
| 3 | ~120px + gaps | `row-span-3` | Compact (61.8% of items) |
| 5 | ~200px + gaps | `row-span-5` | Feature (23.6% of items) |
| 8 | ~320px + gaps | `row-span-8` | Hero (14.6% of items) |
| 13 | ~520px + gaps | `row-span-13` | Full-bleed hero |

### Tailwind v4 Custom Theme Extension

For Tailwind v4, add golden-grid utilities via CSS `@theme`:

```css
/* app/globals.css -- Tailwind v4 syntax */
@import "tailwindcss";

@theme {
  /* Fibonacci spacing scale */
  --spacing-fib-1: 0.5rem;   /* 8px  */
  --spacing-fib-2: 0.75rem;  /* 12px */
  --spacing-fib-3: 1.5rem;   /* 24px */
  --spacing-fib-4: 2.5rem;   /* 40px */
  --spacing-fib-5: 4rem;     /* 64px */
  --spacing-fib-6: 6.5rem;   /* 104px */
  --spacing-fib-7: 10.5rem;  /* 168px */

  /* Golden grid column templates */
  --grid-template-columns-golden: 1fr 1.618fr;
  --grid-template-columns-golden-r: 1.618fr 1fr;
  --grid-template-columns-fib-3: 1fr 2fr 3fr;
  --grid-template-columns-fib-4: 1fr 2fr 3fr 5fr;
  --grid-template-columns-fib-5: 1fr 1fr 2fr 3fr 5fr;
  --grid-template-columns-zeitgeist: 1fr 1.618fr 1fr;
  --grid-template-columns-timeline: 3.82fr 1fr 5.18fr;
  --grid-template-columns-holy-grail: 3fr 13fr 5fr;
  --grid-template-columns-magazine: 5fr 3fr 2fr;
  --grid-template-columns-dashboard: 3fr 5fr 2fr;

  /* Golden ratio row templates */
  --grid-template-rows-golden: 1fr 1.618fr;
  --grid-template-rows-sacred: 1fr 1.618fr 1fr;
}
```

With these theme extensions, you can use classes like `grid-cols-golden`, `grid-cols-fib-3`, `grid-cols-zeitgeist`, `p-fib-4`, `gap-fib-3`, etc.

---

## 8. Server Component Guidelines

All golden-grid layout components are **React Server Components** by default. This is the correct architecture because:

1. Grid layout components are structural -- they arrange children without client-side state or effects.
2. Server Components reduce JavaScript sent to the client.
3. Children can be Client Components nested inside Server Component layout shells.

### When to Use `'use client'`

Mark a golden-grid component as a Client Component **only** when:

| Condition | Example | Why Client |
|-----------|---------|-----------|
| Interactive layout | Drag-to-resize golden split | Needs `onMouseDown`, `useState` for drag offset |
| Theme toggle | Dark mode switch | Needs `next-themes` `useTheme()` hook |
| Animated transitions | Grid column count changes on interaction | Needs `useState` + `useEffect` for animation |
| Scroll-triggered layout | Masonry items reveal on scroll | Needs `IntersectionObserver` |
| Collapsible sections | Accordion within bento cell | Needs `useState` for open/closed state |

### Pattern: Server Shell + Client Interactive Child

```tsx
// components/golden-grid/golden-split-draggable.tsx
// The layout shell is a Server Component; the drag handle is a Client Component.

'use client'; // This file is a client component because it uses useState

import { useState, useCallback, useRef } from 'react';

interface GoldenSplitDraggableProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  initialRatio?: number; // 0.382 for golden default
}

export function GoldenSplitDraggable({
  sidebar,
  content,
  initialRatio = 0.382,
}: GoldenSplitDraggableProps) {
  const [ratio, setRatio] = useState(initialRatio);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrag = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = (e.clientX - rect.left) / rect.width;
      // Clamp between 20% and 80% to prevent collapse
      setRatio(Math.max(0.2, Math.min(0.8, newRatio)));
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className="grid relative"
      style={{ gridTemplateColumns: `${ratio}fr ${1 - ratio}fr` }}
      onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
    >
      {sidebar}
      {/* Drag handle at the column boundary */}
      <div
        className="absolute top-0 bottom-0 w-1 cursor-col-resize bg-neutral-300 hover:bg-neutral-500 dark:bg-neutral-700 dark:hover:bg-neutral-500 transition-colors"
        style={{ left: `${ratio * 100}%` }}
      />
      {content}
    </div>
  );
}
```

### Pattern: Client Component Inside Server Layout

```tsx
// components/golden-grid/bento-cell-collapsible.tsx
// A client component that can be placed inside any server-rendered bento grid

'use client';

import { useState } from 'react';

interface BentoCellCollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function BentoCellCollapsible({
  title,
  children,
  defaultOpen = true,
}: BentoCellCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="h-full flex flex-col">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-fib-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {title}
        </h3>
        <span className="text-neutral-400">{isOpen ? '\u25B2' : '\u25BC'}</span>
      </button>
      {isOpen && <div className="flex-1 p-fib-3">{children}</div>}
    </div>
  );
}
```

Usage in a Server Component layout:

```tsx
// app/dashboard/page.tsx (Server Component)
import { GoldenBento } from '@/components/golden-grid/golden-bento';
import { BentoCellCollapsible } from '@/components/golden-grid/bento-cell-collapsible';

export default function DashboardPage() {
  return (
    <GoldenBento
      hero={<StaticHeroChart />}                        {/* Server Component */}
      stat1={<BentoCellCollapsible title="Revenue">...{/* Client inside Server */}</BentoCellCollapsible>}
      stat2={<BentoCellCollapsible title="Users">...</BentoCellCollapsible>}
      midBand={<FeatureList />}                          {/* Server Component */}
      accent={<CallToAction />}                          {/* Server Component */}
    />
  );
}
```

### Server Component Checklist

- [ ] Layout components have no `useState`, `useEffect`, or event handlers
- [ ] No `'use client'` directive on layout components
- [ ] Children that need interactivity are extracted as separate Client Components
- [ ] Data fetching happens at the Server Component level (async components)
- [ ] No `window`, `document`, or browser APIs in layout components
- [ ] CSS classes are static strings (no dynamic class computation based on state)

---

## 9. Dark Mode with next-themes

Integrates the golden-grid dark mode tokens with `next-themes` for class-based dark mode toggling. The golden-grid neutral palette inverts cleanly: surfaces become dark, text becomes light, and the same 61.8/23.6/14.6 visual weight distribution applies in reverse.

### ThemeProvider Setup

```tsx
// app/providers.tsx
// Client Component: wraps children with next-themes ThemeProvider
// Placed in the root layout to provide theme context to all components

'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"          // Adds 'dark' class to <html> for Tailwind
      defaultTheme="system"      // Respects OS preference by default
      enableSystem={true}        // Enables system theme detection
      disableTransitionOnChange  // Prevents flash during theme change
    >
      {children}
    </ThemeProvider>
  );
}
```

### Root Layout Integration

```tsx
// app/layout.tsx
// Server Component: root layout with theme support

import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Golden Grid App',
  description: 'Built with golden ratio proportions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/*
        suppressHydrationWarning prevents React hydration mismatch
        caused by next-themes modifying the <html> class before hydration.
      */}
      <body className="bg-[#fafafa] text-neutral-700 dark:bg-[#1a1a1a] dark:text-neutral-300 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Tailwind v4 Dark Mode Configuration

```css
/* app/globals.css -- Tailwind v4 syntax */
@import "tailwindcss";

/* Enable class-based dark mode */
@variant dark (&:where(.dark, .dark *));

@theme {
  /* Light mode golden-grid tokens */
  --color-surface: #fafafa;
  --color-surface-alt: #e5e5e5;
  --color-border: #d4d4d4;
  --color-border-hover: #a3a3a3;
  --color-text-primary: #404040;
  --color-text-body: #525252;
  --color-text-secondary: #737373;
  --color-text-muted: #a3a3a3;

  /* Dark mode tokens (applied via .dark class) */
  --color-dark-surface: #1a1a1a;
  --color-dark-surface-alt: #262626;
  --color-dark-border: #262626;
  --color-dark-border-hover: #404040;
  --color-dark-text-primary: #d4d4d4;
  --color-dark-text-body: #a3a3a3;
  --color-dark-text-secondary: #737373;
  --color-dark-text-muted: #525252;

  /* Fibonacci spacing scale */
  --spacing-fib-1: 0.5rem;
  --spacing-fib-2: 0.75rem;
  --spacing-fib-3: 1.5rem;
  --spacing-fib-4: 2.5rem;
  --spacing-fib-5: 4rem;
  --spacing-fib-6: 6.5rem;
  --spacing-fib-7: 10.5rem;

  /* Golden grid column templates */
  --grid-template-columns-golden: 1fr 1.618fr;
  --grid-template-columns-golden-r: 1.618fr 1fr;
  --grid-template-columns-fib-3: 1fr 2fr 3fr;
  --grid-template-columns-fib-4: 1fr 2fr 3fr 5fr;
  --grid-template-columns-fib-5: 1fr 1fr 2fr 3fr 5fr;
  --grid-template-columns-zeitgeist: 1fr 1.618fr 1fr;
  --grid-template-columns-timeline: 3.82fr 1fr 5.18fr;
}

/* Dark mode overrides using the .dark class set by next-themes */
.dark {
  --color-surface: var(--color-dark-surface);
  --color-surface-alt: var(--color-dark-surface-alt);
  --color-border: var(--color-dark-border);
  --color-border-hover: var(--color-dark-border-hover);
  --color-text-primary: var(--color-dark-text-primary);
  --color-text-body: var(--color-dark-text-body);
  --color-text-secondary: var(--color-dark-text-secondary);
  --color-text-muted: var(--color-dark-text-muted);
}

/* Dark mode depth coding for nested grids */
.dark .grid-depth-0 { border: 2px solid var(--color-dark-text-primary); }
.dark .grid-depth-1 { border: 1px solid var(--color-dark-text-body); }
.dark .grid-depth-2 { border: 1px dashed var(--color-dark-text-secondary); }
.dark .grid-depth-3 { border: 1px dotted var(--color-dark-text-secondary); }
```

### Theme Toggle Component (Client Component)

```tsx
// components/theme-toggle.tsx
// Client Component: requires next-themes useTheme hook

'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />; // Placeholder to prevent layout shift
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="
        w-10 h-10
        flex items-center justify-center
        rounded-[var(--radius-sm)]
        border border-neutral-300 dark:border-neutral-700
        hover:border-neutral-500 dark:hover:border-neutral-500
        transition-colors duration-300
      "
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        /* Sun icon */
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        /* Moon icon */
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
```

### Dark Mode Bento Cell (Utility Pattern)

A reusable bento cell wrapper that handles dark mode border and background transitions:

```tsx
// components/golden-grid/bento-cell.tsx
// Server Component: dark mode handled purely via Tailwind dark: prefix

interface BentoCellProps {
  children: React.ReactNode;
  /** Depth level for nested grid border coding (0 = outermost) */
  depth?: 0 | 1 | 2 | 3;
  /** Additional Tailwind classes */
  className?: string;
}

const depthBorders = {
  0: 'border-2 border-neutral-600 dark:border-neutral-200',
  1: 'border border-neutral-400 dark:border-neutral-400',
  2: 'border border-dashed border-neutral-300 dark:border-neutral-500',
  3: 'border border-dotted border-neutral-300 dark:border-neutral-500',
} as const;

export function BentoCell({
  children,
  depth = 0,
  className,
}: BentoCellProps) {
  return (
    <div
      className={`
        rounded-[var(--radius-md)]
        bg-[var(--color-surface)]
        dark:bg-[var(--color-dark-surface-alt)]
        ${depthBorders[depth]}
        p-fib-3
        hover:border-neutral-500 dark:hover:border-neutral-300
        transition-colors duration-300
        ${className ?? ''}
      `}
    >
      {children}
    </div>
  );
}
```

### Dark Mode Shadow Overrides

Dark mode requires stronger shadows for visual depth against dark surfaces:

```css
/* In globals.css, within @theme or as overrides */
.dark {
  --shadow-sm: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.3);
  --shadow-md: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 0.5rem 1rem rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 1rem 2rem rgba(0, 0, 0, 0.6);
}
```

### Dark Mode Golden Ratio Color Distribution

The visual weight distribution inverts but the proportions follow the same golden ratio split:

- **61.8%** of surface area: dark surfaces and backgrounds (`#1a1a1a`, `#262626`)
- **23.6%** of surface area: medium tones -- borders, dividers, secondary text (`#525252`, `#737373`)
- **14.6%** of surface area: bright accent text and emphasis (`#a3a3a3`, `#d4d4d4`)

This ensures that in dark mode, the majority of the canvas recedes (dark), structure occupies the golden-section minority, and the brightest elements -- text -- form the smallest, most visually concentrated layer.

---

## Appendix: Component File Structure

Recommended file organization for a Next.js App Router project:

```
components/
  golden-grid/
    golden-split.tsx          # Pattern 01: Golden Split
    golden-split-draggable.tsx # Pattern 01: Interactive variant (Client)
    fibonacci-columns.tsx     # Pattern 02: Fibonacci Columns
    golden-bento.tsx          # Pattern 05-06: Bento Grid
    zeitgeist-grid.tsx        # Pattern 15: Zeitgeist Grid
    golden-timeline.tsx       # Pattern 14: Golden Timeline
    masonry-bento.tsx         # Pattern 16: Masonry Bento
    bento-cell.tsx            # Utility: Styled bento cell wrapper
    bento-cell-collapsible.tsx # Utility: Collapsible cell (Client)
    index.ts                  # Barrel export for all components
```

Barrel export (`index.ts`):

```tsx
// components/golden-grid/index.ts
export { GoldenSplit } from './golden-split';
export { GoldenSplitDraggable } from './golden-split-draggable';
export { FibonacciColumns } from './fibonacci-columns';
export { GoldenBento } from './golden-bento';
export { ZeitgeistGrid } from './zeitgeist-grid';
export type { ZeitgeistFeature } from './zeitgeist-grid';
export { GoldenTimeline } from './golden-timeline';
export type { TimelineEvent } from './golden-timeline';
export { MasonryBento } from './masonry-bento';
export type { MasonryBentoItem } from './masonry-bento';
export { BentoCell } from './bento-cell';
export { BentoCellCollapsible } from './bento-cell-collapsible';
```
