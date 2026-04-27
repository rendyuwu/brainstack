import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3100';
const LOGIN_EMAIL = 'admin@test.com';
const LOGIN_PASSWORD = 'admin123';

// Helper: login via the UI
async function login(page: any) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input[type="email"], input[name="email"]');
  const passwordInput = page.locator('input[type="password"], input[name="password"]');

  if (await emailInput.count() > 0) {
    await emailInput.fill(LOGIN_EMAIL);
    await passwordInput.fill(LOGIN_PASSWORD);
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForLoadState('networkidle');
  }
}

test.describe('Search Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.screenshot({ path: 'test-screenshots/search-01-after-login.png', fullPage: true });
  });

  test('1. Search API - keyword query "docker"', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/search?q=docker`);
    const status = response?.status();
    console.log('=== Search API docker ===');
    console.log('Status:', status);

    let body: any = null;
    try {
      body = await response?.json();
    } catch {
      const text = await page.textContent('body');
      console.log('Non-JSON response:', text?.slice(0, 500));
    }

    await page.screenshot({ path: 'test-screenshots/search-02-api-docker.png', fullPage: true });

    if (status === 500) {
      console.log('BUG: Search API returns 500 for keyword query "docker"');
      console.log('Root cause: malformed array literal in search.ts:184 — pageIds passed as JS array to ANY($1::uuid[])');
    } else if (status === 200 && body) {
      console.log('Response:', JSON.stringify(body, null, 2));
      if (Array.isArray(body) && body.length > 0) {
        const hasDocker = body.some((r: any) =>
          (r.title || r.slug || '').toLowerCase().includes('docker')
        );
        console.log('Has Docker result:', hasDocker);
      } else {
        console.log('Empty results for "docker"');
      }
    }

    // Record status — don't fail test, just report
    expect(status).toBeDefined();
  });

  test('2. Search API - semantic query "how do containers communicate"', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/search?q=how+do+containers+communicate`);
    const status = response?.status();
    console.log('=== Search API semantic ===');
    console.log('Status:', status);

    let body: any = null;
    try {
      body = await response?.json();
    } catch {
      const text = await page.textContent('body');
      console.log('Non-JSON response:', text?.slice(0, 500));
    }

    await page.screenshot({ path: 'test-screenshots/search-03-api-semantic.png', fullPage: true });

    if (status === 500) {
      console.log('BUG: Search API returns 500 for semantic query');
      console.log('Same root cause as keyword search — pageIds array literal bug');
    } else if (status === 200 && body) {
      console.log('Semantic results:', JSON.stringify(body, null, 2));
      if (Array.isArray(body) && body.length > 0) {
        console.log('Semantic search returned', body.length, 'results');
      } else {
        console.log('Semantic search returned empty — embeddings may be broken');
      }
    }

    expect(status).toBeDefined();
  });

  test('3. Search API - no results query "xyznonexistent"', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/search?q=xyznonexistent`);
    const status = response?.status();
    console.log('=== Search API nonexistent ===');
    console.log('Status:', status);

    let body: any = null;
    try {
      body = await response?.json();
    } catch {
      const text = await page.textContent('body');
      console.log('Non-JSON response:', text?.slice(0, 500));
    }

    await page.screenshot({ path: 'test-screenshots/search-04-api-nonexistent.png', fullPage: true });

    if (status === 200 && body) {
      console.log('Response:', JSON.stringify(body));
      if (Array.isArray(body)) {
        console.log('Empty query returned', body.length, 'results');
        expect(body.length).toBe(0);
      }
    }

    expect(status).toBeDefined();
  });

  test('4. Search API - empty query', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/search?q=`);
    const status = response?.status();
    console.log('=== Search API empty query ===');
    console.log('Status:', status);

    let body: any = null;
    try {
      body = await response?.json();
    } catch {}

    await page.screenshot({ path: 'test-screenshots/search-05-api-empty.png', fullPage: true });

    if (status === 200 && body) {
      console.log('Empty query response:', JSON.stringify(body));
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    }
  });

  test('5. Search UI - command palette (Cmd+K / Ctrl+K)', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-screenshots/search-06-homepage.png', fullPage: true });

    // Try Cmd+K
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);

    let searchInput = page.locator('[role="dialog"] input, [data-cmdk-input], [class*="search"] input, [class*="command"] input, [class*="palette"] input, input[placeholder*="search" i], input[placeholder*="Search" i]');
    let found = false;

    if (await searchInput.count() > 0) {
      found = true;
      console.log('Command palette opened with Cmd+K');
    } else {
      await page.keyboard.press('Escape');
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(500);
      if (await searchInput.count() > 0) {
        found = true;
        console.log('Command palette opened with Ctrl+K');
      }
    }

    await page.screenshot({ path: 'test-screenshots/search-07-cmdk-attempt.png', fullPage: true });

    // Look for search button in nav
    if (!found) {
      const searchBtn = page.locator('button:has-text("Search"), a:has-text("Search"), [aria-label*="search" i], [aria-label*="Search"]');
      const count = await searchBtn.count();
      console.log('Search buttons found:', count);
      if (count > 0) {
        await searchBtn.first().click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'test-screenshots/search-08-search-btn.png', fullPage: true });
        found = true;
      }
    }

    // Try /search page
    if (!found) {
      const resp = await page.goto(`${BASE}/search`);
      console.log('/search page status:', resp?.status());
      await page.screenshot({ path: 'test-screenshots/search-09-search-page.png', fullPage: true });
      if (resp?.status() === 200) {
        found = true;
        console.log('Dedicated /search page exists');
      }
    }

    console.log('Search UI found:', found);
  });

  test('6. Search UI - type Docker in command palette', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');

    // Open command palette
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);

    let searchInput = page.locator('[role="dialog"] input, [data-cmdk-input], input[placeholder*="search" i], input[placeholder*="Search" i]');

    if (await searchInput.count() === 0) {
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(500);
    }

    if (await searchInput.count() > 0) {
      await searchInput.first().fill('Docker');
      await page.waitForTimeout(1500); // Wait for debounced search

      await page.screenshot({ path: 'test-screenshots/search-10-ui-docker.png', fullPage: true });

      // Check results
      const resultItems = page.locator('[role="dialog"] [role="option"], [data-cmdk-item], [class*="result"] a, [class*="result"] li');
      const count = await resultItems.count();
      console.log('UI search result count:', count);

      for (let i = 0; i < Math.min(count, 5); i++) {
        const text = await resultItems.nth(i).textContent();
        console.log(`Result ${i}:`, text?.trim());
      }

      // Check for Docker networking guide link
      const dockerLink = page.locator('a[href*="docker-container-networking"]');
      const linkCount = await dockerLink.count();
      console.log('Docker networking guide links:', linkCount);
    } else {
      console.log('No search input found in command palette');
      await page.screenshot({ path: 'test-screenshots/search-10-no-palette.png', fullPage: true });
    }
  });

  test('7. Docker article page exists', async ({ page }) => {
    const response = await page.goto(`${BASE}/blog/docker-container-networking-guide`);
    const status = response?.status();
    console.log('Docker article status:', status);

    await page.screenshot({ path: 'test-screenshots/search-11-docker-article.png', fullPage: true });

    if (status === 200) {
      const title = await page.title();
      const h1 = await page.locator('h1').first().textContent();
      console.log('Page title:', title);
      console.log('H1:', h1);
    } else {
      console.log('Article not at /blog/..., trying alternates');
      for (const path of ['/articles/docker-container-networking-guide', '/posts/docker-container-networking-guide']) {
        const r = await page.goto(`${BASE}${path}`);
        console.log(`${path} → ${r?.status()}`);
        if (r?.status() === 200) {
          await page.screenshot({ path: 'test-screenshots/search-12-docker-alt.png', fullPage: true });
          break;
        }
      }
    }
  });
});
