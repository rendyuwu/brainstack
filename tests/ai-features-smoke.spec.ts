import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:3100';
const LOGIN_EMAIL = 'admin@test.com';
const LOGIN_PASSWORD = 'admin123';

// Collect console errors
const consoleErrors: string[] = [];

async function login(page: Page) {
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

test.describe('AI Features Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
        console.log(`CONSOLE ERROR: ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(`[pageerror] ${err.message}`);
      console.log(`PAGE ERROR: ${err.message}`);
    });

    await login(page);
    await page.screenshot({ path: 'test-screenshots/ai-01-after-login.png', fullPage: true });
    console.log('=== Login complete ===');
  });

  test('1. /ask page - Ask about Docker networking', async ({ page }) => {
    console.log('=== TEST 1: /ask page ===');

    const response = await page.goto(`${BASE}/ask`);
    const status = response?.status();
    console.log('/ask status:', status);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-screenshots/ai-02-ask-page.png', fullPage: true });

    if (status !== 200) {
      console.log('FAIL: /ask page returned', status);
      return;
    }

    // Find input/textarea for asking questions
    const inputSelectors = [
      'textarea',
      'input[type="text"]',
      '[contenteditable="true"]',
      'input[placeholder*="ask" i]',
      'input[placeholder*="question" i]',
      'textarea[placeholder*="ask" i]',
      'textarea[placeholder*="question" i]',
    ];

    let inputEl = null;
    for (const sel of inputSelectors) {
      const el = page.locator(sel);
      if (await el.count() > 0) {
        inputEl = el.first();
        console.log('Found input with selector:', sel);
        break;
      }
    }

    if (!inputEl) {
      console.log('FAIL: No input found on /ask page');
      await page.screenshot({ path: 'test-screenshots/ai-02b-ask-no-input.png', fullPage: true });
      return;
    }

    // Type question
    await inputEl.fill('What is Docker networking?');
    await page.screenshot({ path: 'test-screenshots/ai-03-ask-typed.png', fullPage: true });

    // Submit - try Enter, then look for submit button
    await inputEl.press('Enter');

    // Also try clicking a submit button if Enter didn't work
    const submitBtn = page.locator('button[type="submit"], button:has-text("Ask"), button:has-text("Send"), button:has-text("Submit"), button[aria-label*="send" i], button[aria-label*="submit" i]');
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click();
      console.log('Clicked submit button');
    }

    // Wait for streaming response (up to 30s)
    console.log('Waiting for AI response (up to 30s)...');

    // Look for response container
    const responseSelectors = [
      '[class*="response"]',
      '[class*="answer"]',
      '[class*="message"]',
      '[class*="chat"]',
      '[class*="stream"]',
      '[role="article"]',
      '.prose',
      '[data-testid*="response"]',
      '[data-testid*="answer"]',
    ];

    let responseFound = false;
    let responseText = '';

    // Poll for response appearing
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);

      for (const sel of responseSelectors) {
        const el = page.locator(sel);
        const count = await el.count();
        if (count > 0) {
          const text = await el.last().textContent();
          if (text && text.length > 20 && text.toLowerCase().includes('docker')) {
            responseFound = true;
            responseText = text.slice(0, 500);
            console.log(`Response found with selector "${sel}" after ${i+1}s`);
            break;
          }
        }
      }
      if (responseFound) break;

      // Also check for error messages
      const errorEl = page.locator('[class*="error"], [role="alert"], .text-red-500, .text-destructive');
      if (await errorEl.count() > 0) {
        const errText = await errorEl.first().textContent();
        console.log('ERROR displayed on page:', errText);
        break;
      }
    }

    await page.screenshot({ path: 'test-screenshots/ai-04-ask-response.png', fullPage: true });

    if (responseFound) {
      console.log('SUCCESS: AI response received');
      console.log('Response preview:', responseText.slice(0, 300));

      // Check for citations
      const citations = page.locator('a[href*="docker"], [class*="citation"], [class*="source"], [class*="reference"]');
      const citCount = await citations.count();
      console.log('Citation-like elements found:', citCount);
    } else {
      console.log('FAIL: No AI response after 30s');
      // Capture page content for debugging
      const bodyText = await page.locator('body').textContent();
      console.log('Page body (first 500 chars):', bodyText?.slice(0, 500));
    }
  });

  test('2. Article chat - Docker article chat toggle', async ({ page }) => {
    console.log('=== TEST 2: Article chat toggle ===');

    const response = await page.goto(`${BASE}/blog/docker-container-networking-guide`);
    const status = response?.status();
    console.log('Article page status:', status);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-screenshots/ai-05-article-page.png', fullPage: true });

    if (status !== 200) {
      console.log('FAIL: Article page returned', status);
      return;
    }

    // Look for chat toggle button
    const chatToggleSelectors = [
      'button:has-text("Chat")',
      'button:has-text("Ask")',
      'button:has-text("AI")',
      'button[aria-label*="chat" i]',
      'button[aria-label*="ask" i]',
      '[class*="chat-toggle"]',
      '[class*="chatToggle"]',
      '[data-testid*="chat"]',
      'button svg', // icon buttons
      // Floating action buttons
      'button[class*="fixed"]',
      'button[class*="float"]',
      '[class*="fab"]',
    ];

    let chatToggle = null;
    for (const sel of chatToggleSelectors) {
      const el = page.locator(sel);
      const count = await el.count();
      if (count > 0) {
        // For generic selectors, check all matches
        for (let i = 0; i < count; i++) {
          const text = await el.nth(i).textContent();
          const ariaLabel = await el.nth(i).getAttribute('aria-label');
          const title = await el.nth(i).getAttribute('title');
          const combined = `${text} ${ariaLabel} ${title}`.toLowerCase();
          if (combined.includes('chat') || combined.includes('ask') || combined.includes('ai')) {
            chatToggle = el.nth(i);
            console.log(`Found chat toggle: "${sel}" text="${text}" aria="${ariaLabel}"`);
            break;
          }
        }
        if (chatToggle) break;
      }
    }

    if (!chatToggle) {
      // Try broader search - any button that might be a chat toggle
      const allButtons = page.locator('button');
      const btnCount = await allButtons.count();
      console.log('Total buttons on page:', btnCount);
      for (let i = 0; i < btnCount; i++) {
        const btn = allButtons.nth(i);
        const text = await btn.textContent();
        const ariaLabel = await btn.getAttribute('aria-label');
        const className = await btn.getAttribute('class');
        console.log(`Button ${i}: text="${text?.trim()}" aria="${ariaLabel}" class="${className?.slice(0, 80)}"`);
      }
      console.log('FAIL: No chat toggle button found on article page');
      await page.screenshot({ path: 'test-screenshots/ai-05b-no-chat-toggle.png', fullPage: true });
      return;
    }

    // Click chat toggle
    await chatToggle.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/ai-06-chat-opened.png', fullPage: true });

    // Find chat input
    const chatInput = page.locator('textarea, input[type="text"], [contenteditable="true"]').last();
    if (await chatInput.count() === 0) {
      console.log('FAIL: No chat input after opening chat');
      return;
    }

    await chatInput.fill('How do bridge networks work?');
    await page.screenshot({ path: 'test-screenshots/ai-07-chat-typed.png', fullPage: true });

    // Submit
    await chatInput.press('Enter');
    const chatSubmit = page.locator('button[type="submit"], button:has-text("Send"), button[aria-label*="send" i]');
    if (await chatSubmit.count() > 0) {
      await chatSubmit.first().click();
    }

    // Wait for response (up to 30s)
    console.log('Waiting for chat response (up to 30s)...');
    let chatResponseFound = false;

    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      const messages = page.locator('[class*="message"], [class*="response"], [class*="answer"], .prose');
      const count = await messages.count();
      if (count > 0) {
        const lastMsg = await messages.last().textContent();
        if (lastMsg && lastMsg.length > 30 && (lastMsg.toLowerCase().includes('bridge') || lastMsg.toLowerCase().includes('network'))) {
          chatResponseFound = true;
          console.log(`Chat response found after ${i+1}s`);
          console.log('Response preview:', lastMsg.slice(0, 300));
          break;
        }
      }

      // Check for errors
      const errorEl = page.locator('[class*="error"], [role="alert"]');
      if (await errorEl.count() > 0) {
        const errText = await errorEl.first().textContent();
        console.log('Chat ERROR:', errText);
        break;
      }
    }

    await page.screenshot({ path: 'test-screenshots/ai-08-chat-response.png', fullPage: true });

    if (chatResponseFound) {
      console.log('SUCCESS: Article chat response received');
    } else {
      console.log('FAIL: No chat response after 30s');
    }
  });

  test('3. Editor - AI assist panel and draft generation', async ({ page }) => {
    console.log('=== TEST 3: Editor AI assist ===');

    const response = await page.goto(`${BASE}/editor/new`);
    const status = response?.status();
    console.log('/editor/new status:', status);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-screenshots/ai-09-editor-new.png', fullPage: true });

    if (status !== 200) {
      console.log('FAIL: /editor/new returned', status);
      // Try alternate paths
      for (const path of ['/admin/editor/new', '/admin/posts/new', '/admin/articles/new', '/dashboard/editor/new']) {
        const r = await page.goto(`${BASE}${path}`);
        console.log(`${path} → ${r?.status()}`);
        if (r?.status() === 200) {
          await page.screenshot({ path: 'test-screenshots/ai-09b-editor-alt.png', fullPage: true });
          break;
        }
      }
    }

    // Look for AI assist panel/button
    const aiPanelSelectors = [
      'button:has-text("AI")',
      'button:has-text("Generate")',
      'button:has-text("Draft")',
      'button:has-text("Assist")',
      '[class*="ai-assist"]',
      '[class*="aiAssist"]',
      '[class*="ai-panel"]',
      '[class*="aiPanel"]',
      '[data-testid*="ai"]',
      'button[aria-label*="AI" i]',
      'button[aria-label*="generate" i]',
      'button[aria-label*="assist" i]',
    ];

    let aiPanel = null;
    for (const sel of aiPanelSelectors) {
      const el = page.locator(sel);
      if (await el.count() > 0) {
        aiPanel = el.first();
        const text = await aiPanel.textContent();
        console.log(`Found AI panel/button: "${sel}" text="${text}"`);
        break;
      }
    }

    // List all buttons for debugging
    const allButtons = page.locator('button');
    const btnCount = await allButtons.count();
    console.log('Total buttons on editor page:', btnCount);
    for (let i = 0; i < Math.min(btnCount, 15); i++) {
      const btn = allButtons.nth(i);
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute('aria-label');
      console.log(`Editor button ${i}: text="${text?.trim().slice(0, 50)}" aria="${ariaLabel}"`);
    }

    if (!aiPanel) {
      console.log('INFO: No AI assist panel/button found on editor page');

      // Check if there's a text area where we can look for AI features
      const textarea = page.locator('textarea, [contenteditable="true"], .ProseMirror, .tiptap, [class*="editor"]');
      if (await textarea.count() > 0) {
        console.log('Editor textarea found, checking for AI features in toolbar/menu');

        // Try right-click context menu
        await textarea.first().click({ button: 'right' });
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'test-screenshots/ai-10-editor-context.png', fullPage: true });

        // Check for AI option in context menu
        const aiMenuItem = page.locator('[role="menuitem"]:has-text("AI"), [role="menuitem"]:has-text("Generate")');
        if (await aiMenuItem.count() > 0) {
          console.log('Found AI option in context menu');
          await aiMenuItem.first().click();
        }
      }

      await page.screenshot({ path: 'test-screenshots/ai-10b-editor-no-ai.png', fullPage: true });
      return;
    }

    // Click AI panel
    await aiPanel.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/ai-11-ai-panel-open.png', fullPage: true });

    // Look for idea/prompt input
    const ideaInput = page.locator('textarea, input[type="text"]').last();
    if (await ideaInput.count() > 0) {
      await ideaInput.fill('Kubernetes pod networking basics');
      await page.screenshot({ path: 'test-screenshots/ai-12-ai-idea-typed.png', fullPage: true });

      // Submit
      const generateBtn = page.locator('button:has-text("Generate"), button:has-text("Create"), button:has-text("Draft"), button[type="submit"]');
      if (await generateBtn.count() > 0) {
        await generateBtn.first().click();
        console.log('Clicked generate button');

        // Wait for draft generation (up to 30s)
        console.log('Waiting for draft generation (up to 30s)...');
        for (let i = 0; i < 30; i++) {
          await page.waitForTimeout(1000);
          const editorContent = page.locator('.ProseMirror, .tiptap, [contenteditable="true"], textarea');
          if (await editorContent.count() > 0) {
            const text = await editorContent.first().textContent();
            if (text && text.length > 50) {
              console.log(`Draft generated after ${i+1}s`);
              console.log('Draft preview:', text.slice(0, 300));
              break;
            }
          }
        }
        await page.screenshot({ path: 'test-screenshots/ai-13-draft-generated.png', fullPage: true });
      } else {
        console.log('No generate button found');
      }
    }
  });

  test('4. Editor - AI rewrite on existing article', async ({ page }) => {
    console.log('=== TEST 4: AI rewrite existing article ===');

    // First find the article in admin
    const adminResponse = await page.goto(`${BASE}/admin/content`);
    console.log('/admin/content status:', adminResponse?.status());
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-screenshots/ai-14-admin-content.png', fullPage: true });

    // Try alternate admin paths
    if (adminResponse?.status() !== 200) {
      for (const path of ['/admin/posts', '/admin/articles', '/admin/pages', '/admin']) {
        const r = await page.goto(`${BASE}${path}`);
        console.log(`${path} → ${r?.status()}`);
        if (r?.status() === 200) {
          await page.waitForLoadState('networkidle');
          await page.screenshot({ path: 'test-screenshots/ai-14b-admin-alt.png', fullPage: true });
          break;
        }
      }
    }

    // Find Docker article link to edit
    const editLink = page.locator('a[href*="docker"][href*="edit"], a[href*="editor"][href*="docker"], tr:has-text("Docker") a:has-text("Edit"), a:has-text("Docker")');
    if (await editLink.count() > 0) {
      await editLink.first().click();
      await page.waitForLoadState('networkidle');
      console.log('Opened Docker article in editor');
    } else {
      // Try direct URL
      console.log('No edit link found, trying direct editor URL');
      // Look for article ID or slug-based editor URL
      const directPaths = [
        '/editor/docker-container-networking-guide',
        '/admin/editor/docker-container-networking-guide',
        '/admin/posts/docker-container-networking-guide/edit',
      ];
      for (const path of directPaths) {
        const r = await page.goto(`${BASE}${path}`);
        console.log(`${path} → ${r?.status()}`);
        if (r?.status() === 200) {
          await page.waitForLoadState('networkidle');
          break;
        }
      }
    }

    await page.screenshot({ path: 'test-screenshots/ai-15-article-editor.png', fullPage: true });

    // Look for AI rewrite button/feature
    const rewriteSelectors = [
      'button:has-text("Rewrite")',
      'button:has-text("AI Rewrite")',
      'button:has-text("Improve")',
      'button:has-text("Enhance")',
      'button:has-text("AI")',
      '[class*="rewrite"]',
      '[data-testid*="rewrite"]',
      'button[aria-label*="rewrite" i]',
    ];

    let rewriteBtn = null;
    for (const sel of rewriteSelectors) {
      const el = page.locator(sel);
      if (await el.count() > 0) {
        rewriteBtn = el.first();
        const text = await rewriteBtn.textContent();
        console.log(`Found rewrite button: "${sel}" text="${text}"`);
        break;
      }
    }

    // List all buttons
    const allButtons = page.locator('button');
    const btnCount = await allButtons.count();
    console.log('Total buttons on article editor:', btnCount);
    for (let i = 0; i < Math.min(btnCount, 15); i++) {
      const btn = allButtons.nth(i);
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute('aria-label');
      console.log(`Article editor button ${i}: text="${text?.trim().slice(0, 50)}" aria="${ariaLabel}"`);
    }

    if (rewriteBtn) {
      // Select some text first
      const editor = page.locator('.ProseMirror, .tiptap, [contenteditable="true"], textarea');
      if (await editor.count() > 0) {
        await editor.first().click();
        await page.keyboard.press('Control+a'); // Select all
        await page.waitForTimeout(500);
      }

      await rewriteBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-screenshots/ai-16-rewrite-clicked.png', fullPage: true });
      console.log('Clicked rewrite button');
    } else {
      console.log('INFO: No AI rewrite button found on article editor');

      // Check for inline AI features (slash commands, etc.)
      const editor = page.locator('.ProseMirror, .tiptap, [contenteditable="true"], textarea');
      if (await editor.count() > 0) {
        // Try typing / to see if slash commands appear
        await editor.first().click();
        await page.keyboard.type('/');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-screenshots/ai-16b-slash-commands.png', fullPage: true });

        const slashMenu = page.locator('[class*="slash"], [class*="command-menu"], [role="listbox"], [role="menu"]');
        if (await slashMenu.count() > 0) {
          console.log('Slash command menu found');
          const aiOption = slashMenu.locator(':has-text("AI"), :has-text("Rewrite"), :has-text("Generate")');
          if (await aiOption.count() > 0) {
            console.log('AI option found in slash commands');
          }
        } else {
          console.log('No slash command menu found');
        }
      }
    }
  });

  test('5. Admin AI usage page', async ({ page }) => {
    console.log('=== TEST 5: AI usage page ===');

    const response = await page.goto(`${BASE}/admin/ai/usage`);
    const status = response?.status();
    console.log('/admin/ai/usage status:', status);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-screenshots/ai-17-usage-page.png', fullPage: true });

    if (status !== 200) {
      // Try alternate paths
      const altPaths = ['/admin/ai', '/admin/usage', '/admin/analytics', '/admin/ai/analytics'];
      for (const path of altPaths) {
        const r = await page.goto(`${BASE}${path}`);
        console.log(`${path} → ${r?.status()}`);
        if (r?.status() === 200) {
          await page.waitForLoadState('networkidle');
          await page.screenshot({ path: 'test-screenshots/ai-17b-usage-alt.png', fullPage: true });
          break;
        }
      }
    }

    if (status === 200) {
      // Check for usage data
      const pageText = await page.locator('body').textContent();
      console.log('Usage page content (first 500 chars):', pageText?.slice(0, 500));

      // Look for usage entries/table
      const tableRows = page.locator('table tr, [class*="usage-row"], [class*="usage-item"]');
      const rowCount = await tableRows.count();
      console.log('Usage table rows:', rowCount);

      // Look for stats/metrics
      const stats = page.locator('[class*="stat"], [class*="metric"], [class*="count"]');
      const statCount = await stats.count();
      console.log('Stat elements:', statCount);
      for (let i = 0; i < Math.min(statCount, 5); i++) {
        const text = await stats.nth(i).textContent();
        console.log(`Stat ${i}:`, text?.trim());
      }

      // Check for any numbers indicating usage
      const hasNumbers = pageText?.match(/\d+/g);
      if (hasNumbers && hasNumbers.length > 0) {
        console.log('Numbers found on page (possible usage counts):', hasNumbers.slice(0, 10).join(', '));
      }
    }
  });

  test('6. Console errors summary', async ({ page }) => {
    console.log('=== TEST 6: Console errors summary ===');
    console.log('Total console errors captured:', consoleErrors.length);
    for (const err of consoleErrors) {
      console.log('  -', err);
    }

    // Navigate to a few AI pages to capture any additional errors
    const pages = ['/ask', '/admin/ai/usage', '/editor/new'];
    for (const path of pages) {
      await page.goto(`${BASE}${path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    console.log('Final console errors count:', consoleErrors.length);
    for (const err of consoleErrors) {
      console.log('  -', err);
    }
  });
});
