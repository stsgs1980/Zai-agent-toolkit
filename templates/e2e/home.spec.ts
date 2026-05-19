// E2E tests for Next.js project
// Run: npx playwright test
// Install: npx playwright install --with-deps

import { test, expect } from '@playwright/test';

// ========================================
// HOME PAGE
// ========================================

test.describe('Home Page', () => {

  test('page loads with 200 status', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('main heading is visible', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('no forbidden Unicode in page text', async ({ page }) => {
    await page.goto('/');
    const bodyText = await page.locator('body').innerText();
    // Check for emoji
    const emojiRegex = /[\u{1F000}-\u{1FFFF}]/u;
    expect(bodyText).not.toMatch(emojiRegex);
  });

});

// ========================================
// NAVIGATION
// ========================================

test.describe('Navigation', () => {

  test('all internal links return 200', async ({ page }) => {
    await page.goto('/');
    const links = await page.locator('a[href^="/"]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && !href.startsWith('#')) {
        const response = await page.goto(href);
        expect(response?.status()).toBe(200);
        await page.goto('/');
      }
    }
  });

});

// ========================================
// FORMS (if applicable)
// ========================================

// Uncomment and adapt if your project has forms:
//
// test.describe('Form Submission', () => {
//
//   test('guestbook form submits successfully', async ({ page }) => {
//     await page.goto('/');
//     await page.fill('[name="name"]', 'Test User');
//     await page.fill('[name="message"]', 'Test message');
//     await page.click('button[type="submit"]');
//     await expect(page.locator('text=Test message')).toBeVisible();
//   });
//
// });
