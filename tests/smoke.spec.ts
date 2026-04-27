import { test, expect } from '@playwright/test';

test.describe('BrainStack Smoke Tests', () => {
  test('homepage loads and shows content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/BrainStack/);
    // Page should have visible content
    await expect(page.locator('body')).toBeVisible();
  });

  test('blog page loads', async ({ page }) => {
    await page.goto('/blog');
    await expect(page).toHaveTitle(/BrainStack/);
    // Should show article list or empty state
    await expect(page.locator('body')).toBeVisible();
  });

  test('cheatsheets page loads', async ({ page }) => {
    await page.goto('/cheatsheets');
    await expect(page).toHaveTitle(/BrainStack/);
  });

  test('discover page loads', async ({ page }) => {
    await page.goto('/discover');
    await expect(page).toHaveTitle(/BrainStack/);
  });

  test('ask page loads', async ({ page }) => {
    await page.goto('/ask');
    await expect(page).toHaveTitle(/BrainStack/);
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    // Should have email and password fields
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('404 page shows for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-xyz');
    expect(response?.status()).toBe(404);
    await expect(page.locator('text=404')).toBeVisible();
  });

  test('health endpoint returns 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.db).toBe('connected');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('timestamp');
  });

  test('search API returns results for valid query', async ({ request }) => {
    const response = await request.get('/api/search?q=docker');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('search API returns empty for no query', async ({ request }) => {
    const response = await request.get('/api/search?q=');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  test('pages API returns published pages without auth', async ({ request }) => {
    const response = await request.get('/api/pages');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Paginated response: { data: [...], pagination: {...} }
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
    // All returned pages should be published
    for (const page of body.data) {
      expect(page.status).toBe('published');
    }
  });

  test('collections API returns collections', async ({ request }) => {
    const response = await request.get('/api/collections');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('pages API rejects POST without auth', async ({ request }) => {
    const response = await request.post('/api/pages', {
      data: { title: 'Test', mdx_source: 'test' },
    });
    expect(response.status()).toBe(401);
  });

  test('admin providers API rejects without auth', async ({ request }) => {
    const response = await request.get('/api/admin/providers');
    expect(response.status()).toBe(401);
  });

  test('robots.txt is accessible', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('User-Agent');
    expect(text).toContain('Disallow: /admin');
  });

  test('sitemap.xml is accessible', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('<?xml');
    expect(text).toContain('<urlset');
  });
});

test.describe('Auth Flow', () => {
  test('can login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'noa@brainstack.dev');
    await page.fill('input[type="password"]', 'noa');
    await page.click('button[type="submit"]');
    // signIn uses redirect:false + router.push('/'), wait for navigation
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  });

  test('login fails with wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Should stay on login page or show error
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain('login');
  });

  test('editor redirects to login without auth', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForURL(/\/login/, { timeout: 10000 });
  });
});

test.describe('Keyboard Shortcuts', () => {
  test('Ctrl+K opens command palette', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    // Command palette should appear
    await expect(page.locator('input[placeholder*="command"]').or(page.locator('input[placeholder*="search"]'))).toBeVisible({ timeout: 3000 });
  });

  test('Escape closes command palette', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    // Command palette should be gone
    await expect(page.locator('input[placeholder*="command"]').or(page.locator('input[placeholder*="search"]'))).not.toBeVisible();
  });
});
