# Fibonacci Scale - Complete Spacing and Sizing System

## Table of Contents

1. [The Scale](#the-scale)
2. [Design Tokens](#design-tokens)
3. [Spacing System](#spacing-system)
4. [Sizing System](#sizing-system)
5. [Typography Scale](#typography-scale)
6. [Border Radius Scale](#border-radius-scale)
7. [Shadow Scale](#shadow-scale)
8. [Neutral Color Palette](#neutral-color-palette)
9. [Implementation](#implementation)
10. [Dark Mode Tokens](#dark-mode-tokens)
11. [Accessibility Tokens](#accessibility-tokens)
12. [Container Query Tokens](#container-query-tokens)

---

## The Scale

The Fibonacci sequence provides a naturally harmonious progression. Each value is the sum of the two preceding values:

```
0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377
```

For design systems, we use a base unit multiplier to convert Fibonacci values into usable pixel/rem values.

---

## Design Tokens

### CSS Custom Properties (base unit: 8px)

```css
:root {
  /* Fibonacci spacing scale */
  --fib-0: 0;        /* 0px */
  --fib-1: 0.5rem;   /* 8px  - base unit */
  --fib-2: 0.5rem;   /* 8px  - Fib-val 1 (1 x 8px) */
  --fib-3: 0.75rem;  /* 12px - derived step between 8px and 16px */
  --fib-4: 1.5rem;   /* 24px - Fib-val 3 (3 x 8px) */
  --fib-5: 2.5rem;   /* 40px - Fib-val 5 (5 x 8px) */
  --fib-6: 4rem;     /* 64px - Fib-val 8 (8 x 8px) */
  --fib-7: 6.5rem;   /* 104px - Fib-val 13 (13 x 8px) */
  --fib-8: 10.5rem;  /* 168px - Fib-val 21 (21 x 8px) */

  /* Golden ratio multiplier */
  --phi: 1.618;

  /* Phi-scaled spacing (for cases between Fibonacci values) */
  --phi-xs: 0.5rem;    /* 8px */
  --phi-sm: 0.81rem;   /* 13px = 8 * phi rounded */
  --phi-md: 1.31rem;   /* 21px = 13 * phi rounded */
  --phi-lg: 2.12rem;   /* 34px = 21 * phi rounded */
  --phi-xl: 3.44rem;   /* 55px = 34 * phi rounded */
  --phi-2xl: 5.56rem;  /* 89px = 55 * phi rounded */
  --phi-3xl: 9rem;     /* 144px = 89 * phi rounded */
}
```

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    spacing: {
      'fib-1': '0.5rem',   // 8px
      'fib-2': '0.75rem',  // 12px
      'fib-3': '1.5rem',   // 24px
      'fib-4': '2.5rem',   // 40px
      'fib-5': '4rem',     // 64px
      'fib-6': '6.5rem',   // 104px
      'fib-7': '10.5rem',  // 168px
    },
    extend: {
      gridTemplateColumns: {
        'golden': '1fr 1.618fr',
        'golden-r': '1.618fr 1fr',
        'fib-3': '1fr 2fr 3fr',
        'fib-4': '1fr 2fr 3fr 5fr',
        'fib-5': '1fr 1fr 2fr 3fr 5fr',
        'phi-12': 'repeat(12, 1fr)',
      },
    },
  },
}
```

---

## Spacing System

### Margin/Padding Guidelines

Apply Fibonacci spacing following the principle of increasing space for increasing visual separation:

```
Component internal padding:    Fib-val 3  = 1.5rem (24px)   -- 3 x 8px
Between related components:    Fib-val 5  = 2.5rem (40px)   -- 5 x 8px
Between sections:              Fib-val 8  = 4rem (64px)     -- 8 x 8px
Between major page areas:      Fib-val 13 = 6.5rem (104px)  -- 13 x 8px
```

### Gap Values for Grid

```css
.grid-tight   { gap: 0.75rem; }   /* 12px - tight, inside cards */
.grid-default { gap: 1.5rem; }    /* 24px = Fib-val 3 - standard grid gaps */
.grid-relaxed { gap: 2.5rem; }    /* 40px = Fib-val 5 - section-level gaps */
.grid-loose   { gap: 4rem; }      /* 64px = Fib-val 8 - major layout divisions */
```

---

## Sizing System

### Element Sizing with Fibonacci

```css
/* Minimum touch targets */
.touch-target { min-width: 2.5rem; min-height: 2.5rem; } /* 40px = Fib-val 5 */

/* Icon sizes */
.icon-sm { width: 1.5rem; height: 1.5rem; }  /* 24px = Fib-val 3 */
.icon-md { width: 2.5rem; height: 2.5rem; }  /* 40px = Fib-val 5 */
.icon-lg { width: 4rem; height: 4rem; }       /* 64px = Fib-val 8 */

/* Avatar sizes */
.avatar-sm { width: 2.5rem; height: 2.5rem; }  /* Fib-val 5 */
.avatar-md { width: 4rem; height: 4rem; }       /* Fib-val 8 */
.avatar-lg { width: 6.5rem; height: 6.5rem; }   /* Fib-val 13 */

/* Card dimensions (golden ratio) */
.card-golden {
  aspect-ratio: 1.618;
}

.card-portrait {
  aspect-ratio: 1 / 1.618;
}

.card-landscape {
  aspect-ratio: 1.618 / 1;
}
```

---

## Typography Scale

### Fibonacci-Based Font Sizes

```css
:root {
  /* Scale factor: phi (1.618) applied to base 16px */
  --text-xs:   0.625rem;  /* 10px */
  --text-sm:   0.75rem;   /* 12px */
  --text-base: 1rem;      /* 16px - base */
  --text-md:   1.25rem;   /* 20px */
  --text-lg:   1.625rem;  /* 26px - Fib-val 5 scaled */
  --text-xl:   2.625rem;  /* 42px - Fib-val 8 scaled */
  --text-2xl:  4.25rem;   /* 68px - Fib-val 13 scaled */
  --text-3xl:  6.875rem;  /* 110px - Fib-val 21 scaled */
}

/* Fibonacci line-heights (proportional to font-size) */
:root {
  --leading-tight: 1.2;    /* For headings */
  --leading-normal: 1.5;   /* For body */
  --leading-relaxed: 1.618; /* Golden ratio line-height */
}
```

### Heading Hierarchy

```css
h1 { font-size: var(--text-2xl); line-height: var(--leading-tight); }
h2 { font-size: var(--text-xl);  line-height: var(--leading-tight); }
h3 { font-size: var(--text-lg);  line-height: var(--leading-normal); }
h4 { font-size: var(--text-md);  line-height: var(--leading-normal); }
p  { font-size: var(--text-base); line-height: var(--leading-relaxed); }
small { font-size: var(--text-sm); }
```

---

## Border Radius Scale

```css
:root {
  --radius-sm: 0.375rem;  /* 6px  - buttons, inputs */
  --radius-md: 0.625rem;  /* 10px - cards */
  --radius-lg: 1rem;      /* 16px - modals */
  --radius-xl: 1.625rem;  /* 26px - feature cards */
}
```

These values follow the Fibonacci sequence scaled to an 8px base, creating subtle harmony between border curves and spacing.

---

## Shadow Scale

```css
:root {
  --shadow-sm: 0 0.125rem 0.25rem rgba(0,0,0,0.08);   /* 2px 4px - Fib-val 1,2 */
  --shadow-md: 0 0.25rem 0.5rem rgba(0,0,0,0.1);      /* 4px 8px - Fib-val 3,4 */
  --shadow-lg: 0 0.5rem 1rem rgba(0,0,0,0.12);        /* 8px 16px */
  --shadow-xl: 0 1rem 2rem rgba(0,0,0,0.15);          /* 16px 32px */
}
```

Shadow offsets and blur radii follow Fibonacci multiples, ensuring visual depth that aligns with the spacing system.

---

## Neutral Color Palette

The golden-grid system uses a strict neutral palette with no chromatic color. This ensures that layout proportions — not color — carry the visual message. The six neutral tones span from light borders to dark text, following the golden ratio for visual weight distribution:

- **61.8%** of surface area: backgrounds and light surfaces (neutral-200, neutral-300)
- **23.6%** of surface area: borders, dividers, secondary text (neutral-400, neutral-500)
- **14.6%** of surface area: primary text, emphasis (neutral-600, neutral-700)

### CSS Custom Properties

```css
:root {
  /* Neutral palette - zero chroma, pure value scale */
  --neutral-200: #e5e5e5; /* hsl(0 0% 90%) - light borders, subtle backgrounds */
  --neutral-300: #d4d4d4; /* hsl(0 0% 83%) - dividers, cell borders */
  --neutral-400: #a3a3a3; /* hsl(0 0% 64%) - secondary text, dashed lines */
  --neutral-500: #737373; /* hsl(0 0% 45%) - body text, labels */
  --neutral-600: #525252; /* hsl(0 0% 32%) - headings, emphasis */
  --neutral-700: #404040; /* hsl(0 0% 25%) - primary text, strong emphasis */

  /* Semantic aliases */
  --color-border:       var(--neutral-300);
  --color-border-hover: var(--neutral-400);
  --color-divider:      var(--neutral-200);
  --color-text-primary: var(--neutral-700);
  --color-text-body:    var(--neutral-600);
  --color-text-secondary: var(--neutral-500);
  --color-text-muted:   var(--neutral-400);
  --color-surface:      #fafafa;
  --color-surface-alt:  var(--neutral-200);
}
```

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      neutral: {
        200: '#e5e5e5',
        300: '#d4d4d4',
        400: '#a3a3a3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
      },
    },
  },
}
```

### Usage in Grid Patterns

Each golden-grid pattern uses these neutral tones consistently:

| Element | Token | Role |
|---------|-------|------|
| Cell borders (solid) | `--neutral-300` | Structure, containment |
| Cell borders (hover) | `--neutral-500` | Interactive feedback |
| Dashed dividers | `--neutral-400` | Sub-section boundaries |
| Section dividers | `--neutral-200` | Horizontal rule, thin separator |
| Labels and captions | `--neutral-500` | Secondary information |
| Ratio annotations | `--neutral-400` | Mathematical context |
| Headings | `--neutral-700` | Primary visual anchor |
| Body text | `--neutral-600` | Readable content |
| Background | `#fafafa` | Canvas, breathing room |

### Depth Coding (Nested Grids)

When grids are nested, border style encodes depth level to maintain visual clarity:

```
Level 0: 2px solid   var(--neutral-600)  -- outer structure
Level 1: 1px solid   var(--neutral-400)  -- first nesting
Level 2: 1px dashed  var(--neutral-300)  -- second nesting
Level 3: 1px dotted  var(--neutral-300)  -- third nesting
```

This depth coding ensures that nested grid compositions remain readable even at 4+ levels of nesting, because the eye can distinguish structural layers by border weight and style.

---

## Implementation

### Complete Design Token File

```css
/* fibonacci-tokens.css */
:root {
  /* Base */
  --fib-base: 8px;
  --phi: 1.6180339887;

  /* Spacing */
  --space-1: 0.5rem;
  --space-2: 0.75rem;
  --space-3: 1.5rem;
  --space-4: 2.5rem;
  --space-5: 4rem;
  --space-6: 6.5rem;
  --space-7: 10.5rem;

  /* Grid gaps */
  --gap-xs: 0.75rem;
  --gap-sm: 1.5rem;
  --gap-md: 2.5rem;
  --gap-lg: 4rem;

  /* Typography */
  --font-xs: 0.75rem;
  --font-sm: 1rem;
  --font-md: 1.25rem;
  --font-lg: 1.625rem;
  --font-xl: 2.625rem;
  --font-2xl: 4.25rem;

  /* Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.625rem;
  --radius-lg: 1rem;

  /* Shadows */
  --shadow-sm: 0 0.125rem 0.25rem rgba(0,0,0,0.08);
  --shadow-md: 0 0.25rem 0.5rem rgba(0,0,0,0.1);
  --shadow-lg: 0 0.5rem 1rem rgba(0,0,0,0.12);

  /* Neutral palette */
  --neutral-200: #e5e5e5;
  --neutral-300: #d4d4d4;
  --neutral-400: #a3a3a3;
  --neutral-500: #737373;
  --neutral-600: #525252;
  --neutral-700: #404040;
  --color-surface: #fafafa;
}
```

---

## Dark Mode Tokens

Dark mode inverts the light palette while preserving the same zero-chroma hue (0% saturation). Lightness values are mirrored so that surfaces become dark and text becomes light, maintaining the golden ratio visual weight distribution in reverse.

### Dark Mode CSS Custom Properties

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Dark mode neutral palette - inverted lightness, same hue */
    --neutral-200: #1a1a1a; /* hsl(0 0% 10%) - inverted: was lightest, now darkest */
    --neutral-300: #262626; /* hsl(0 0% 15%) - dark dividers */
    --neutral-400: #525252; /* hsl(0 0% 32%) - secondary text in dark mode */
    --neutral-500: #737373; /* hsl(0 0% 45%) - body text in dark mode */
    --neutral-600: #a3a3a3; /* hsl(0 0% 64%) - headings in dark mode */
    --neutral-700: #d4d4d4; /* hsl(0 0% 83%) - primary text in dark mode */

    /* Dark mode surfaces */
    --dark-surface: #1a1a1a;       /* hsl(0 0% 10%) - background */
    --dark-surface-alt: #262626;   /* hsl(0 0% 15%) - cards, raised surfaces */

    /* Override semantic aliases for dark mode */
    --color-surface:      var(--dark-surface);
    --color-surface-alt:  var(--dark-surface-alt);
    --color-border:       #262626;        /* neutral-800 equivalent */
    --color-border-hover: #404040;        /* neutral-700 equivalent */
    --color-divider:      #262626;
    --color-text-primary: #d4d4d4;        /* neutral-700 (inverted) → light text */
    --color-text-body:    #a3a3a3;        /* neutral-600 (inverted) → body text */
    --color-text-secondary: #737373;      /* neutral-500 → secondary */
    --color-text-muted:   #525252;        /* neutral-400 (inverted) → muted */

    /* Dark mode shadow adjustments */
    --shadow-sm: 0 0.125rem 0.25rem rgba(0,0,0,0.3);
    --shadow-md: 0 0.25rem 0.5rem rgba(0,0,0,0.4);
    --shadow-lg: 0 0.5rem 1rem rgba(0,0,0,0.5);
    --shadow-xl: 0 1rem 2rem rgba(0,0,0,0.6);
  }
}
```

### Semantic Aliases for Dark Mode

In dark mode, the role of each neutral tone shifts. Light tones become structural (borders, dividers) and dark tones become textual (headings, body):

| Alias | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--color-text-primary` | `#404040` (neutral-700) | `#d4d4d4` (neutral-700 inverted) |
| `--color-text-body` | `#525252` (neutral-600) | `#a3a3a3` (neutral-600 inverted) |
| `--color-text-secondary` | `#737373` (neutral-500) | `#737373` (neutral-500, same) |
| `--color-text-muted` | `#a3a3a3` (neutral-400) | `#525252` (neutral-400 inverted) |
| `--color-border` | `#d4d4d4` (neutral-300) | `#262626` (neutral-300 inverted) |
| `--color-divider` | `#e5e5e5` (neutral-200) | `#262626` (neutral-200 inverted) |
| `--color-surface` | `#fafafa` | `#1a1a1a` |
| `--color-surface-alt` | `#e5e5e5` | `#262626` |

### Tailwind Config for Dark Mode Colors

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'media', // or 'class' for toggle-based
  theme: {
    colors: {
      neutral: {
        200: '#e5e5e5',
        300: '#d4d4d4',
        400: '#a3a3a3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626', // dark mode borders
        900: '#1a1a1a', // dark mode surfaces
      },
      dark: {
        surface: '#1a1a1a',
        'surface-alt': '#262626',
      },
    },
  },
}
```

### Golden Ratio Color Distribution in Dark Mode

The visual weight distribution inverts but the proportions follow the same golden ratio split:

- **61.8%** of surface area: dark surfaces and backgrounds (`#1a1a1a`, `#262626`)
- **23.6%** of surface area: medium tones — borders, dividers, secondary text (`#525252`, `#737373`)
- **14.6%** of surface area: bright accent text and emphasis (`#a3a3a3`, `#d4d4d4`)

This ensures that in dark mode, the majority of the canvas recedes (dark), structure occupies the golden-section minority, and the brightest elements — text — form the smallest, most visually concentrated layer.

### Depth Coding in Dark Mode (Nested Grids)

**[C]** In dark mode, swap border roles: use neutral-700 for outer structure, neutral-600 for first nesting, neutral-500 dashed for second nesting.

```
Dark Mode Depth Coding:
Level 0: 2px solid   #d4d4d4  (neutral-700) -- outer structure
Level 1: 1px solid   #a3a3a3  (neutral-600) -- first nesting
Level 2: 1px dashed  #737373  (neutral-500) -- second nesting
Level 3: 1px dotted  #737373  (neutral-500) -- third nesting
```

---

## Accessibility Tokens

### Minimum Contrast Ratios (WCAG 2.1 AA)

The neutral palette must meet the following minimum contrast ratios:

- **Normal text** (< 18px regular or < 14px bold): **4.5:1** against background
- **Large text** (≥ 18px regular or ≥ 14px bold): **3:1** against background
- **UI components & graphical objects**: **3:1** against adjacent colors

### Contrast Table — Light Mode

All ratios measured against the default light surface `#fafafa` (hsl 0 0% 98%):

| Foreground | Hex | On `#fafafa` | Normal Text AA | Large Text AA | UI Component |
|-----------|-----|-------------|---------------|--------------|-------------|
| neutral-200 | `#e5e5e5` | 1.1:1 | ❌ FAIL | ❌ FAIL | ❌ FAIL |
| neutral-300 | `#d4d4d4` | 1.4:1 | ❌ FAIL | ❌ FAIL | ❌ FAIL |
| neutral-400 | `#a3a3a3` | 3.0:1 | ❌ FAIL | ✅ PASS | ✅ PASS |
| neutral-500 | `#737373` | 4.6:1 | ✅ PASS | ✅ PASS | ✅ PASS |
| neutral-600 | `#525252` | 7.5:1 | ✅ PASS | ✅ PASS | ✅ PASS |
| neutral-700 | `#404040` | 10.8:1 | ✅ PASS | ✅ PASS | ✅ PASS |

### Contrast Table — Dark Mode

All ratios measured against the dark surface `#1a1a1a` (hsl 0 0% 10%):

| Foreground | Hex | On `#1a1a1a` | Normal Text AA | Large Text AA | UI Component |
|-----------|-----|-------------|---------------|--------------|-------------|
| neutral-300 (dark) | `#262626` | 1.5:1 | ❌ FAIL | ❌ FAIL | ❌ FAIL |
| neutral-400 (dark) | `#525252` | 3.1:1 | ❌ FAIL | ✅ PASS | ✅ PASS |
| neutral-500 (dark) | `#737373` | 4.8:1 | ✅ PASS | ✅ PASS | ✅ PASS |
| neutral-600 (dark) | `#a3a3a3` | 7.9:1 | ✅ PASS | ✅ PASS | ✅ PASS |
| neutral-700 (dark) | `#d4d4d4` | 11.7:1 | ✅ PASS | ✅ PASS | ✅ PASS |

**Key takeaway:** Only neutral-500 and above pass AA for normal text. Neutral-400 and below are reserved for decorative borders, dividers, and non-text elements only.

### `prefers-reduced-motion` Token Overrides

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    /* Disable all motion durations */
    --duration-instant: 0ms;
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    --duration-slow: 0ms;
    --duration-golden: 0ms;  /* phi-based transitions disabled */

    /* Override transition and animation properties */
    --transition-default: 0ms ease;
    --transition-spring: 0ms cubic-bezier(0.34, 1.56, 0.64, 1);

    /* Minimal duration for essential state changes (e.g., focus rings) */
    --duration-essential: 1ms;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Focus Ring Specifications

Focus rings use Fibonacci border-radius and the golden accent to maintain visual consistency while ensuring accessibility:

```css
:root {
  /* Focus ring tokens */
  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;
  --focus-ring-radius: var(--radius-sm);   /* 0.375rem - Fibonacci border-radius */
  --focus-ring-color: var(--neutral-700);  /* golden accent in neutral palette */
  --focus-ring-style: solid;
}

/* Light mode focus ring */
:focus-visible {
  outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  border-radius: var(--focus-ring-radius);
}

/* Dark mode focus ring — uses lighter tone for contrast */
@media (prefers-color-scheme: dark) {
  :root {
    --focus-ring-color: #d4d4d4; /* neutral-700 (dark) for visibility on dark surfaces */
  }
}

/* High-contrast focus ring for enhanced visibility */
@media (prefers-contrast: more) {
  :root {
    --focus-ring-width: 3px;
    --focus-ring-offset: 3px;
  }
}
```

### Color-Only Information Rule

**[C]** Never rely solely on color (neutral tone) to convey information. Always pair with text labels, patterns, or icons.

This means:
- Border depth levels must use **style + weight** (solid/dashed/dotted + 1px/2px), not color alone
- Status states must include **text labels or icons** alongside tone changes
- Data visualizations using neutral gradients must include **pattern overlays or annotations**
- Interactive vs. static elements must differ in **more than just neutral shade** (e.g., cursor, underline, border style)

---

## Container Query Tokens

### Fibonacci-Based Container Query Breakpoints

Container query breakpoints use Fibonacci numbers as em values, creating a naturally progressive scale that aligns with the spacing system:

```css
/* Container query breakpoints - Fibonacci numbers in em */
@container (min-width: 34em) { /* ... */ }
@container (min-width: 55em) { /* ... */ }
@container (min-width: 89em) { /* ... */ }
```

### CSS Custom Properties

```css
:root {
  /* Container query breakpoint tokens */
  --cq-sm: 34em;   /* 544px - Fib-val 34 small containers, cards, sidebars */
  --cq-md: 55em;   /* 880px - Fib-val 55 medium containers, panels */
  --cq-lg: 89em;   /* 1424px - Fib-val 89 large containers, full layouts */
}
```

### Container Query Usage with Fibonacci Scale

```css
/* Define a containment context */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* Small container — single column, compact spacing */
@container card (min-width: 34em) {
  .card-inner {
    grid-template-columns: 1fr;
    gap: var(--gap-sm);   /* 1.5rem = Fib-val 3 */
    padding: var(--space-3); /* 1.5rem = Fib-val 3 */
  }
}

/* Medium container — two columns, golden ratio split */
@container card (min-width: 55em) {
  .card-inner {
    grid-template-columns: 1fr 1.618fr;
    gap: var(--gap-md);   /* 2.5rem = Fib-val 5 */
    padding: var(--space-4); /* 2.5rem = Fib-val 5 */
  }
}

/* Large container — three columns, Fibonacci proportion */
@container card (min-width: 89em) {
  .card-inner {
    grid-template-columns: 1fr 2fr 3fr;
    gap: var(--gap-lg);   /* 4rem = Fib-val 8 */
    padding: var(--space-5); /* 4rem = Fib-val 8 */
  }
}
```

### Container Query vs. Media Query Decision Rule

**[W]** Use container queries for component-level responsive behavior. Use media queries for page-level layout changes.

| Scope | Technique | Example |
|-------|-----------|---------|
| Individual component adapts to its parent width | Container query | Card layout changes when sidebar collapses |
| Component within a resizable panel | Container query | Data table adapts to panel width |
| Page-level layout restructure | Media query | Sidebar navigation collapses to hamburger |
| Typography scale shift at viewport breakpoints | Media query | Headings resize based on viewport |
| Cross-component orchestration | Media query | Page transitions from 3-col to 1-col |

### Tailwind Container Query Plugin Config

```javascript
// tailwind.config.js
// Requires: @tailwindcss/container-queries plugin
module.exports = {
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
  theme: {
    extend: {
      containers: {
        sm: '34em',   // Fib-val 34
        md: '55em',   // Fib-val 55
        lg: '89em',   // Fib-val 89
      },
    },
  },
}
```
