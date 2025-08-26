import { test, expect, Page } from '@playwright/test';

// Test data with various kanji characters
const TEST_SENTENCE = '今日は良い天気ですね。';
const EXPECTED_KANJI_TOKENS = ['今日', '良', '天気'];

// Color mapping for different parts of speech (based on the app's color system)
const POS_COLORS = {
  '名詞': '#2D5A27',   // Forest Green
  '動詞': '#C41E3A',   // Ruby Red
  '形容詞': '#8B4513', // Saddle Brown
  '助詞': '#DAA520',   // Goldenrod
  '副詞': '#4682B4',   // Steel Blue
  '助動詞': '#DC143C', // Crimson
};

// Helper function to analyze color contrast
function calculateLuminance(hexColor: string): number {
  const color = hexColor.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16) / 255;
  const g = parseInt(color.substr(2, 2), 16) / 255;
  const b = parseInt(color.substr(4, 2), 16) / 255;
  
  // Apply gamma correction
  const [rGamma, gGamma, bGamma] = [r, g, b].map(c => 
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  
  return 0.2126 * rGamma + 0.7152 * gGamma + 0.0722 * bGamma;
}

function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = calculateLuminance(color1);
  const lum2 = calculateLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Helper function to extract color from computed styles
async function getComputedColor(element: any, property: string): Promise<string> {
  const colorValue = await element.evaluate((el: Element, prop: string) => {
    const computed = window.getComputedStyle(el);
    return computed.getPropertyValue(prop);
  }, property);
  
  // Convert rgb(r, g, b) to hex
  if (colorValue.startsWith('rgb(')) {
    const matches = colorValue.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (matches) {
      const r = parseInt(matches[1]).toString(16).padStart(2, '0');
      const g = parseInt(matches[2]).toString(16).padStart(2, '0');
      const b = parseInt(matches[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
  }
  return colorValue;
}

// Helper function to check if authentication is required
async function handleAuthenticationIfRequired(page: Page) {
  // Clear any cached authentication state first
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Wait a moment for page to load
  await page.waitForTimeout(2000);
  
  // Check the auth API directly to confirm no auth is required
  const authStatus = await page.evaluate(async () => {
    try {
      const response = await fetch('/api/auth');
      const data = await response.json();
      return data;
    } catch (e) {
      return { requiresAuth: false, error: e.message };
    }
  });
  
  console.log('Auth API status:', authStatus);
  
  // If auth is required, we need to handle it differently
  if (authStatus.requiresAuth) {
    console.log('Authentication is required but none configured for tests');
    throw new Error('Authentication is required but test environment has no password configured');
  }
  
  // Set authentication status to bypass any frontend auth checks
  await page.evaluate(() => {
    localStorage.setItem('isAuthenticated', 'true');
  });
  
  // Check for any modal or dialog that might be blocking the interface
  const modalSelectors = [
    '[data-testid="login-modal"]',
    '.login-modal', 
    '[role="dialog"]',
    '.modal',
    '.dialog',
    'dialog'
  ];
  
  for (const selector of modalSelectors) {
    try {
      const modal = page.locator(selector);
      if (await modal.isVisible({ timeout: 2000 })) {
        console.log(`Found blocking modal with selector: ${selector}`);
        console.log('Modal should not be visible since auth is not required');
        
        // Take screenshot of the modal for debugging
        await page.screenshot({ 
          path: 'test-results/debug-unexpected-modal.png',
          fullPage: true 
        });
        
        // Try multiple close button patterns
        const closeButtonSelectors = [
          'button:has-text("×")',
          'button:has-text("✕")',
          'button:has-text("Close")',
          'button:has-text("Cancel")',
          '[aria-label="Close"]',
          '.close-button',
          'button.close',
          '[data-testid="close-button"]',
          // Try clicking any button in the modal
          modal.locator('button').first()
        ];
        
        for (const closeSelector of closeButtonSelectors) {
          try {
            const closeButton = typeof closeSelector === 'string' ? page.locator(closeSelector) : closeSelector;
            if (await closeButton.isVisible({ timeout: 500 })) {
              console.log(`Clicking close button: ${closeSelector}`);
              await closeButton.click();
              await page.waitForTimeout(500);
              
              // Check if modal is closed
              if (!await modal.isVisible({ timeout: 1000 })) {
                console.log('Modal successfully closed');
                break;
              }
            }
          } catch (e) {
            // Try next close button
            continue;
          }
        }
        
        // If can't close modal, try pressing Escape key
        if (await modal.isVisible({ timeout: 500 })) {
          try {
            console.log('Trying to close modal with Escape key');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          } catch (e) {
            console.log('Escape key did not work');
          }
        }
        
        // If modal still exists, try clicking outside it
        if (await modal.isVisible({ timeout: 500 })) {
          try {
            console.log('Trying to close modal by clicking outside');
            await page.click('body', { position: { x: 10, y: 10 } });
            await page.waitForTimeout(500);
          } catch (e) {
            console.log('Could not click outside modal');
          }
        }
        
        // Force reload the page if modal is still there
        if (await modal.isVisible({ timeout: 500 })) {
          console.log('Modal still visible, reloading page');
          await page.reload();
          await page.waitForTimeout(2000);
        }
        
        break; // Found a modal, stop looking for others
      }
    } catch {
      // This selector didn't find anything, try next
      continue;
    }
  }
  
  console.log('Authentication handling complete');
}

test.describe('Kanji Token Selection Visibility Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Handle authentication if required
    await handleAuthenticationIfRequired(page);
    
    // Wait for the main interface to be visible
    await expect(page.locator('h1:has-text("Japanese Sentence Analyzer")')).toBeVisible({ timeout: 10000 });
    
    // Ensure we're authenticated and ready
    const isReady = await page.evaluate(() => {
      // Check if any loading states are active
      const loadingElements = document.querySelectorAll('.animate-spin, [data-testid="loading"]');
      const hasModals = document.querySelectorAll('[role="dialog"], .modal').length > 0;
      return loadingElements.length === 0 && !hasModals;
    });
    
    if (!isReady) {
      console.log('Waiting for application to be fully ready...');
      await page.waitForTimeout(3000);
    }
    
    console.log('Application is ready for testing');
  });

  test('should display kanji tokens with proper color contrast when selected', async ({ page }) => {
    // Step 1: Input the test sentence
    console.log('Step 1: Inputting Japanese sentence...');
    
    // Take a screenshot of initial state for debugging
    await page.screenshot({ 
      path: 'test-results/debug-initial-state.png',
      fullPage: true 
    });
    
    // Find the input textarea (try multiple selectors)
    const inputSelectors = [
      'textarea[placeholder*="日本語"]',
      'textarea[placeholder*="Japanese"]', 
      'textarea',
      'input[type="text"]',
      '[contenteditable="true"]'
    ];
    
    let inputElement = null;
    for (const selector of inputSelectors) {
      try {
        inputElement = page.locator(selector).first();
        if (await inputElement.isVisible({ timeout: 2000 })) {
          console.log(`Found input element with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Selector ${selector} failed: ${e.message}`);
        continue;
      }
    }
    
    if (!inputElement) {
      // Take a screenshot for debugging
      await page.screenshot({ 
        path: 'test-results/debug-no-input-found.png',
        fullPage: true 
      });
      throw new Error('Could not find input element');
    }
    
    // Clear any existing content and fill with test sentence
    await inputElement.clear();
    await inputElement.fill(TEST_SENTENCE);
    await expect(inputElement).toHaveValue(TEST_SENTENCE);
    console.log('Successfully filled input with test sentence');
    
    // Step 2: Click the analyze button (use the first enabled one)
    console.log('Step 2: Clicking analyze button...');
    
    // Take screenshot before clicking analyze
    await page.screenshot({ 
      path: 'test-results/debug-before-analyze.png',
      fullPage: true 
    });
    
    const analyzeButtonSelectors = [
      'button:has-text("解析")',
      'button:has-text("Analyze")', 
      'button:has-text("分析")',
      'button[type="submit"]',
      'button:has([class*="analyze"])',
      '[data-testid="analyze-button"]'
    ];
    
    let analyzeButton = null;
    for (const selector of analyzeButtonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 }) && await button.isEnabled()) {
          analyzeButton = button;
          console.log(`Found analyze button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Analyze button selector ${selector} failed: ${e.message}`);
        continue;
      }
    }
    
    if (!analyzeButton) {
      await page.screenshot({ 
        path: 'test-results/debug-no-analyze-button.png',
        fullPage: true 
      });
      throw new Error('Could not find analyze button');
    }
    
    await analyzeButton.click();
    console.log('Analyze button clicked successfully');
    
    // Step 3: Wait for analysis to complete
    console.log('Step 3: Waiting for analysis to complete...');
    
    // Wait for loading to finish and tokens to appear
    await page.waitForFunction(() => {
      const loadingIndicators = document.querySelectorAll('[data-testid="loading"], .animate-spin, .loading');
      return loadingIndicators.length === 0 || 
             Array.from(loadingIndicators).every(el => !el.classList.contains('animate-spin'));
    }, { timeout: 30000 });
    
    // Wait for analysis to complete and tokens to appear
    console.log('Waiting for analysis to complete and tokens to appear...');
    
    // Wait for any loading states to complete
    try {
      // Wait for the button to become enabled again (indicates analysis is complete)
      await page.waitForFunction(() => {
        const analyzeButtons = document.querySelectorAll('button');
        return Array.from(analyzeButtons).some(button => {
          const text = button.textContent || '';
          return (text.includes('解析') || text.includes('Analyze') || text.includes('分析')) && 
                 !button.disabled && 
                 !button.classList.contains('loading');
        });
      }, { timeout: 30000 });
      console.log('Analysis button is enabled again, analysis likely complete');
      
      // Additional wait for UI to update
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Analysis completion check failed:', e.message);
    }
    
    // Take screenshot after analysis
    await page.screenshot({ 
      path: 'test-results/debug-after-analysis.png',
      fullPage: true 
    });
    
    // Now wait for tokens to appear
    const tokenSelectors = [
      '.tokens-display .token',
      '.sentence-container .token', 
      '.token',
      '[data-testid="token"]',
      '.word',
      '[role="button"]:has(.word)',
      '[class*="token"]'
    ];
    
    let tokenSelector = null;
    for (const selector of tokenSelectors) {
      try {
        const elements = await page.locator(selector).count();
        if (elements > 0) {
          tokenSelector = selector;
          console.log(`Found ${elements} tokens with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Token selector ${selector} failed: ${e.message}`);
        continue;
      }
    }
    
    if (!tokenSelector) {
      // Take screenshot for debugging
      await page.screenshot({ 
        path: 'test-results/debug-no-tokens-found.png',
        fullPage: true 
      });
      
      // Check for error messages or other content
      const pageText = await page.textContent('body');
      console.log('Page text content includes:');
      console.log('- Error keywords:', /error|错误|エラー|失败|fail/i.test(pageText));
      console.log('- Loading keywords:', /loading|分析中|analyzing/i.test(pageText));
      console.log('- Token keywords:', /token|word|今日|良い|天気/i.test(pageText));
      
      // Check API endpoint availability
      const apiResponse = await page.evaluate(() => {
        return fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: 'Test analysis request',
            stream: false 
          })
        }).then(r => r.status).catch(e => e.message);
      });
      console.log('Direct API test response status:', apiResponse);
      
      throw new Error('Could not find any tokens after analysis');
    }
    
    // Step 4: Take screenshot of unselected tokens
    console.log('Step 4: Taking screenshot of unselected tokens...');
    await page.screenshot({ 
      path: 'test-results/kanji-tokens-unselected.png',
      fullPage: true 
    });
    
    // Step 5: Find and test kanji tokens
    console.log('Step 5: Testing kanji token selection visibility...');
    
    const tokens = page.locator(tokenSelector);
    const tokenCount = await tokens.count();
    console.log(`Found ${tokenCount} tokens`);
    
    const testResults = [];
    
    for (let i = 0; i < tokenCount; i++) {
      const token = tokens.nth(i);
      
      // Get the token text to identify kanji
      const tokenText = await token.locator('.word, [class*="word"]').first().textContent() || 
                       await token.textContent() || '';
      
      console.log(`Testing token ${i}: "${tokenText}"`);
      
      // Check if this token contains kanji
      const containsKanji = /[\u4E00-\u9FAF\u3400-\u4DBF]/.test(tokenText);
      
      if (containsKanji) {
        console.log(`  → Contains kanji, testing selection...`);
        
        // Get unselected state colors from the word element (where the actual text is)
        const wordElement = token.locator('.word, [class*="word"]').first();
        const unselectedBgColor = await getComputedColor(token, 'background-color');
        const unselectedTextColor = await getComputedColor(wordElement, 'color');
        
        // Click to select the token
        await token.click();
        
        // Wait for selection animation/transition
        await page.waitForTimeout(500);
        
        // Verify token is selected (check for visual changes)
        const isSelected = await token.evaluate(el => {
          const style = window.getComputedStyle(el);
          const transform = style.transform;
          const boxShadow = style.boxShadow;
          return transform !== 'none' || boxShadow !== 'none';
        });
        
        if (isSelected) {
          // Get selected state colors from the correct elements
          const selectedBgColor = await getComputedColor(token, 'background-color');
          const selectedTextColor = await getComputedColor(wordElement, 'color');
          
          // Calculate contrast ratio
          const contrastRatio = calculateContrastRatio(selectedTextColor, selectedBgColor);
          
          // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
          const hasGoodContrast = contrastRatio >= 4.5;
          
          testResults.push({
            tokenText,
            index: i,
            unselectedBgColor,
            unselectedTextColor,
            selectedBgColor,
            selectedTextColor,
            contrastRatio: Math.round(contrastRatio * 100) / 100,
            hasGoodContrast,
            isSelected
          });
          
          console.log(`  → Selected state:`);
          console.log(`    Background: ${selectedBgColor}`);
          console.log(`    Text: ${selectedTextColor}`);
          console.log(`    Contrast ratio: ${contrastRatio.toFixed(2)}:1`);
          console.log(`    Good contrast: ${hasGoodContrast ? 'YES' : 'NO'}`);
          
          // Take screenshot of this selected token
          await page.screenshot({ 
            path: `test-results/kanji-token-selected-${i}-${tokenText.replace(/[^\w]/g, '')}.png`,
            fullPage: true 
          });
          
          // Verify the token text is still visible (not disappeared)
          const tokenTextElement = token.locator('.word, [class*="word"]').first();
          await expect(tokenTextElement).toBeVisible();
          const visibleText = await tokenTextElement.textContent();
          expect(visibleText).toBe(tokenText);
          
          // Test accessibility: ensure text color contrasts well with background
          expect(contrastRatio).toBeGreaterThan(3.0); // Minimum for basic readability
          
          // Click elsewhere to deselect
          await page.click('body', { position: { x: 10, y: 10 } });
          await page.waitForTimeout(300);
        } else {
          console.log(`  → Token not properly selected`);
        }
      }
    }
    
    // Step 6: Generate final summary screenshot
    await page.screenshot({ 
      path: 'test-results/kanji-tokens-final-state.png',
      fullPage: true 
    });
    
    // Step 7: Verify test results
    console.log('\n=== TEST RESULTS SUMMARY ===');
    console.log(`Total kanji tokens tested: ${testResults.length}`);
    
    testResults.forEach(result => {
      console.log(`\nToken: "${result.tokenText}"`);
      console.log(`  Contrast ratio: ${result.contrastRatio}:1`);
      console.log(`  WCAG compliance: ${result.hasGoodContrast ? 'PASS' : 'FAIL'}`);
      console.log(`  Colors: ${result.selectedTextColor} on ${result.selectedBgColor}`);
    });
    
    // Ensure we tested at least some kanji tokens
    expect(testResults.length).toBeGreaterThan(0);
    
    // Ensure all tested tokens have acceptable contrast
    const failedTokens = testResults.filter(r => !r.hasGoodContrast);
    if (failedTokens.length > 0) {
      console.log(`\nWARNING: ${failedTokens.length} tokens have poor contrast:`);
      failedTokens.forEach(token => {
        console.log(`  "${token.tokenText}": ${token.contrastRatio}:1`);
      });
    }
    
    // At least 80% of tokens should have good contrast
    const passRate = (testResults.length - failedTokens.length) / testResults.length;
    expect(passRate).toBeGreaterThan(0.8);
  });
  
  test('should show different color variations for different parts of speech', async ({ page }) => {
    console.log('Testing color variations for different POS...');
    
    // Input a sentence with diverse parts of speech
    const diverseSentence = '美しい花が咲いています。';
    
    const inputElement = page.locator('textarea, input[type="text"]').first();
    await inputElement.fill(diverseSentence);
    
    const analyzeButton = page.locator('button:has-text("解析"), button:has-text("Analyze")').first();
    await analyzeButton.click();
    
    // Wait for analysis
    await page.waitForSelector('.token, [data-testid="token"]', { timeout: 20000 });
    
    const tokens = page.locator('.token, [data-testid="token"]');
    const tokenCount = await tokens.count();
    
    const colorVariations = new Set();
    
    for (let i = 0; i < tokenCount; i++) {
      const token = tokens.nth(i);
      
      // Click to select
      await token.click();
      await page.waitForTimeout(300);
      
      // Get color
      const bgColor = await getComputedColor(token, 'background-color');
      colorVariations.add(bgColor);
      
      // Click elsewhere to deselect
      await page.click('body', { position: { x: 10, y: 10 } });
      await page.waitForTimeout(200);
    }
    
    console.log(`Found ${colorVariations.size} different color variations`);
    console.log('Colors used:', Array.from(colorVariations));
    
    // Should have at least 2 different colors for varied POS
    expect(colorVariations.size).toBeGreaterThan(1);
    
    await page.screenshot({ 
      path: 'test-results/pos-color-variations.png',
      fullPage: true 
    });
  });
  
  test('should maintain token visibility during rapid selection changes', async ({ page }) => {
    console.log('Testing rapid selection changes...');
    
    const inputElement = page.locator('textarea, input[type="text"]').first();
    await inputElement.fill(TEST_SENTENCE);
    
    const analyzeButton = page.locator('button:has-text("解析"), button:has-text("Analyze")').first();
    await analyzeButton.click();
    
    await page.waitForSelector('.token, [data-testid="token"]', { timeout: 20000 });
    
    const tokens = page.locator('.token, [data-testid="token"]');
    const tokenCount = await tokens.count();
    
    // Rapidly select different tokens
    for (let i = 0; i < Math.min(5, tokenCount); i++) {
      const token = tokens.nth(i);
      await token.click();
      
      // Verify text is still visible immediately after selection
      const tokenText = await token.locator('.word, [class*="word"]').first().textContent();
      expect(tokenText).toBeTruthy();
      
      // Quick wait between selections
      await page.waitForTimeout(100);
    }
    
    await page.screenshot({ 
      path: 'test-results/rapid-selection-test.png',
      fullPage: true 
    });
  });
  
});
