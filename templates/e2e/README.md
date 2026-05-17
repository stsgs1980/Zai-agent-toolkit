# E2E Testing with Playwright

## When to Use

| Project Type | Use E2E? |
|-------------|----------|
| Showcase / Landing | No (visual only) |
| Blog / CMS | Yes (forms, search) |
| Dashboard / Admin | Yes (complex UI) |
| E-commerce | Yes (payments, cart) |
| SaaS | Yes (auth, roles, data) |
| API-only | No (use unit tests) |

## Quick Setup

### 1. Install Playwright

```bash
bun add -D @playwright/test
bunx playwright install --with-deps chromium
```

### 2. Copy E2E files

Copy the `e2e/` folder from this template to your project root.

### 3. Configure

Edit `playwright.config.ts`:
- `baseURL` - your dev server URL
- `testDir` - test folder path (default: `./e2e`)

### 4. Run tests

```bash
# Run all tests
bunx playwright test

# Run with UI
bunx playwright test --ui

# Run specific file
bunx playwright test e2e/home.spec.ts

# Run in headless mode (CI)
bunx playwright test --reporter=list
```

## Test Structure

```text
e2e/
  home.spec.ts            - Main page tests
  playwright.config.ts    - Playwright configuration
```

### Test Categories

Each spec file follows this structure:

```text
1. Basic page load tests     - Always active
2. Navigation tests          - Uncomment when project has nav
3. Form tests                - Uncomment when project has forms
4. Auth tests                - Uncomment when project has auth
5. Responsive tests          - Always active
6. Accessibility checks      - Always active
```

### Writing New Tests

```typescript
import { test, expect } from '@playwright/test';

test('description of what is being tested', async ({ page }) => {
  // 1. Navigate
  await page.goto('/page');

  // 2. Interact
  await page.fill('[name="field"]', 'value');
  await page.click('button');

  // 3. Assert
  await expect(page.locator('.result')).toBeVisible();
});
```

### Best Practices

- Each test should be independent (can run in any order)
- Use `data-testid` attributes for stable selectors
- Avoid flaky tests: use `waitForLoadState`, `waitForSelector`
- Test user behavior, not implementation details
- Keep tests short: one assertion per test ideal, max 3-5

## CI Integration

Add to your `.github/workflows/ci.yml`:

```yaml
e2e:
  runs-on: ubuntu-latest
  needs: build
  steps:
    - uses: actions/checkout@v4

    - uses: oven-sh/setup-bun@v2
      with:
        bun-version: latest

    - name: Install dependencies
      run: bun install --frozen-lockfile

    - name: Install Playwright
      run: bunx playwright install --with-deps chromium

    - name: Run E2E tests
      run: bunx playwright test --reporter=list
```

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
