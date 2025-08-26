import { test, expect } from '@playwright/test';

test.describe('Mobile Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('Mobile viewport basic layout', async ({ page }) => {
    // Set to mobile viewport
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone 12 size
    
    // Take initial screenshot
    await page.screenshot({ path: 'mobile-layout-before.png', fullPage: true });
    
    // Check if main elements are visible and properly sized
    const mainElement = page.getByRole('main').first();
    await expect(mainElement).toBeVisible();
    
    // Verify main element dimensions
    const mainBox = await mainElement.boundingBox();
    expect(mainBox?.width).toBeLessThanOrEqual(375);
    
    // Check header/toolbar
    const header = page.getByRole('banner').first(); // header elements have banner role
    await expect(header).toBeVisible();
    const headerBox = await header.boundingBox();
    expect(headerBox?.width).toBeLessThanOrEqual(375);
    expect(headerBox?.height).toBeGreaterThan(0);
    
    // Check input area
    const textInput = page.getByRole('textbox').first();
    if (await textInput.count() > 0) {
      await expect(textInput).toBeVisible();
      const inputBox = await textInput.boundingBox();
      expect(inputBox?.width).toBeLessThanOrEqual(375);
    }
    
    // Check for horizontal overflow
    const bodyWidth = await page.evaluate(() => {
      return Math.max(
        document.body.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.clientWidth,
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth
      );
    });
    
    console.log(`Body width: ${bodyWidth}, Viewport width: 375`);
    expect(bodyWidth).toBeLessThanOrEqual(380); // Allow small margin
  });

  test('Test Japanese text input on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Try to input Japanese text
    const textInput = page.getByRole('textbox').first();
    if (await textInput.count() > 0) {
      await textInput.fill('これは日本語のテストです。');
      
      // Check if text is visible and not cut off
      const inputBox = await textInput.boundingBox();
      expect(inputBox?.width).toBeLessThanOrEqual(375);
    }
  });

  test('Mobile settings modal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Try to open settings
    const settingsButton = page.locator('button').filter({ hasText: /settings|设置|⚙/i });
    if (await settingsButton.count() > 0) {
      await settingsButton.first().click();
      
      // Check modal fits in viewport
      const modal = page.locator('[role="dialog"], .modal, [class*="modal"]');
      if (await modal.count() > 0) {
        await expect(modal.first()).toBeVisible();
        const modalBox = await modal.first().boundingBox();
        expect(modalBox?.width).toBeLessThanOrEqual(375);
        expect(modalBox?.height).toBeLessThanOrEqual(812);
      }
    }
  });

  test('Check responsive behavior on different mobile sizes', async ({ page }) => {
    const mobileSizes = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 375, height: 812, name: 'iPhone 12' },
      { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
      { width: 360, height: 800, name: 'Android Common' }
    ];

    for (const size of mobileSizes) {
      await page.setViewportSize(size);
      console.log(`Testing ${size.name}: ${size.width}x${size.height}`);
      
      // Check for horizontal overflow
      const bodyWidth = await page.evaluate(() => {
        return Math.max(
          document.body.scrollWidth,
          document.documentElement.scrollWidth
        );
      });
      
      expect(bodyWidth, `${size.name} should not have horizontal overflow`).toBeLessThanOrEqual(size.width + 5);
      
      // Take screenshot for each size
      await page.screenshot({ 
        path: `mobile-${size.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true 
      });
    }
  });
});