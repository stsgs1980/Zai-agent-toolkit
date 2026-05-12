# Standard: WCAG 2.1 AA Accessibility v1.0

> ID: STD-A11Y-001
> Version: 1.0
> Level: **[C] Critical**
> Reference: https://www.w3.org/TR/WCAG21/

---

## 1. Principle: Perceivable

### 1.1 Text Contrast (1.4.3 — AA)

Minimum contrast ratios:

| Element type | Normal text (< 18px / < 14px bold) | Large text (>= 18px / >= 14px bold) |
|---|---|---|
| Minimum (AA) | 4.5:1 | 3:1 |
| Enhanced (AAA) | 7:1 | 4.5:1 |

**Rule:** Every theme preset MUST pass AA for ALL token color pairs used in text.

**Validation pairs per theme:**

- foreground on background
- muted on background
- muted-foreground on card
- border-foreground on background
- destructive on background

### 1.2 Non-Text Contrast (1.4.11 — AA)

UI components and graphical objects MUST have >= 3:1 contrast against adjacent colors.

Applies to:

- Button borders and backgrounds (vs surrounding)
- Input borders (vs background)
- Focus indicators (vs background)
- Selection indicators, toggles, checkboxes
- Icons used for state (not decorative)

### 1.3 Text Resize (1.4.4 — AA)

Text MUST be resizable up to 200% without loss of content or functionality.

- Use `rem` units for font-size, NOT `px`
- Container must not overflow at 200% zoom
- No `overflow: hidden` on text containers

### 1.4 Reflow (1.4.10 — AA)

Content MUST reflow in a single column at 320px width without horizontal scroll.

- No fixed widths > 320px on any content block
- Use responsive utilities (max-w-*, w-full)
- Test: browser width = 320px, no horizontal scroll

### 1.5 Images and Media (1.1.1 — A)

- All `<img>` MUST have `alt` attribute
- Decorative images: `alt=""` + `role="presentation"`
- Informative images: descriptive `alt` text
- SVG icons: `aria-hidden="true"` when decorative, `role="img"` + `aria-label` when informative

---

## 2. Principle: Operable

### 2.1 Keyboard Navigation (2.1.1 — A)

All interactive elements MUST be operable via keyboard.

| Element | Key | Action |
|---|---|---|
| Button/Link | Enter / Space | Activate |
| Tab/Option | Tab | Move focus |
| Tab list | Left/Right arrow | Switch tab |
| Listbox | Up/Down arrow | Navigate options |
| Dialog | Escape | Close |
| Accordion | Enter / Space | Toggle |
| Menu | Up/Down arrow, Escape | Navigate, close |

**Rule:** No `onClick` without keyboard equivalent. If using `onClick` on non-interactive element, add `role="button"` + `tabIndex={0}` + `onKeyDown`.

### 2.2 Focus Visible (2.4.7 — AA)

Every focusable element MUST have a visible focus indicator.

```css
/* Global focus style — applied via Tailwind */
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

- Focus indicator MUST have >= 3:1 contrast against background
- NEVER use `outline: none` without providing alternative focus style
- Focus ring color: `tokens.ring` from active theme preset

### 2.3 Focus Order (2.4.3 — A)

Focus order MUST be logical and predictable.

- Tab order follows visual order (top-to-bottom, left-to-right)
- Modals: focus trap — Tab cycles within modal
- After closing modal: focus returns to trigger element
- Skip navigation: first Tab focus goes to skip link

### 2.4 Touch Targets (2.5.5 — AAA, recommended AA)

All interactive elements MUST have minimum 44x44px touch target.

- Buttons, links, inputs: min `h-11 w-11` (44px)
- If visual size < 44px, add padding to reach 44px target
- Icon-only buttons: min 44x44px with `aria-label`

### 2.5 Skip Navigation (2.4.1 — A)

Every page MUST have a skip navigation link as the first focusable element.

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute ...">
  Skip to main content
</a>
```

For sidebar layouts, also provide:

```tsx
<a href="#sidebar" className="sr-only focus:not-sr-only ...">
  Skip to navigation
</a>
```

---

## 3. Principle: Understandable

### 3.1 Language (3.1.1 — A)

Page MUST have `lang` attribute on `<html>`.

```tsx
// layout.tsx
<html lang="ru">  // or "en" based on content
```

### 3.2 Error Identification (3.3.1 — A)

Form errors MUST be:

1. Described in text (not just red border)
2. Associated with the field via `aria-describedby`
3. Announced to screen readers via `aria-live` or `role="alert"`

```tsx
<div>
  <input aria-invalid="true" aria-describedby="email-error" />
  <p id="email-error" role="alert">Email is required</p>
</div>
```

### 3.3 Consistent Navigation (3.2.3 — A)

Navigation MUST appear in the same relative order on every page.

---

## 4. Principle: Robust

### 4.1 Name, Role, Value (4.1.2 — A)

All UI components MUST have programmatically determinable name and role.

| Component | Required ARIA |
|---|---|
| Tab list | `role="tablist"`, tabs: `role="tab"`, panels: `role="tabpanel"` |
| Tab | `aria-selected`, `aria-controls` (tab), `aria-labelledby` (panel) |
| Accordion | `aria-expanded`, `aria-controls` |
| Dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Progress | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Toggle | `aria-pressed` |
| Menu | `role="menu"`, items: `role="menuitem"` |
| Listbox | `role="listbox"`, options: `role="option"`, `aria-selected` |
| Slider | `role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Checkbox | `aria-checked` (if custom) |
| Radio | `aria-checked` (if custom) |

### 4.2 Status Messages (4.1.3 — AA)

Status messages MUST be announced to screen readers without taking focus.

```tsx
// Toast notifications
<div role="status" aria-live="polite">{message}</div>

// Critical alerts
<div role="alert">{errorMessage}</div>
```

---

## 5. Motion and Animation

### 5.1 prefers-reduced-motion (2.3.3 — AAA, recommended)

All animations MUST respect `prefers-reduced-motion`.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**In components:**

```tsx
// Check via hook
const prefersReducedMotion = usePrefersReducedMotion();

// Conditional animation
<motion.div animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }} />
```

---

## 6. Implementation Checklist

Every component MUST pass this checklist before merge:

- [ ] All text meets 4.5:1 contrast (3:1 for large text)
- [ ] All non-text UI meets 3:1 contrast
- [ ] Focus-visible ring visible on all interactive elements
- [ ] Keyboard navigable (Tab, Enter, Space, Arrows, Escape)
- [ ] Touch targets >= 44px
- [ ] aria-label on all icon-only buttons
- [ ] Correct ARIA roles and states
- [ ] Skip navigation link present
- [ ] No animation without prefers-reduced-motion guard
- [ ] Reflows at 320px without horizontal scroll
- [ ] Form errors have text + aria-describedby
- [ ] lang attribute on <html>

---

## 7. Theme Contrast Requirements

Each theme preset MUST document its contrast ratios:

| Token pair | Champagne | Cyan Night | Zinc | Champagne Light | Cyan Morning |
|---|---|---|---|---|---|
| foreground / background | | | | | |
| muted / background | | | | | |
| muted-foreground / card | | | | | |
| destructive / background | | | | | |
| ring / background | | | | | |

Filled values MUST show ratio >= 4.5:1 for normal text.

---

## 8. Testing

### 8.1 Manual Testing

- Tab through the entire page — every interactive element must be reachable
- Use screen reader (VoiceOver/NVDA) — every element must be announced correctly
- Zoom to 200% — no content must be lost
- Set viewport to 320px — no horizontal scroll
- Enable "Reduce Motion" in OS settings — animations must stop

### 8.2 Automated Testing (Future)

```bash
# Planned: npx stsgs a11y audit
# axe-core integration for automated checks
# Lighthouse accessibility score >= 90
```

---

Built with: WCAG 2.1 AA + WAI-ARIA 1.2
