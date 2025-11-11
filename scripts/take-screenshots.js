/**
 * Playwright Screenshot Script for Claudex v1.2.0
 *
 * Automatically captures screenshots of theming features:
 * - Theme selector with all 10 themes
 * - Font family preview grid
 * - Font size and border radius settings
 * - Different theme examples applied
 *
 * Usage:
 *   npm install -D @playwright/test
 *   npx playwright install chromium
 *   node scripts/take-screenshots.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '../screenshots/v1.2.0');
const APP_URL = 'http://localhost:3000';

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function takeScreenshots() {
  console.log('🎬 Starting Claudex screenshot capture...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to app
    console.log('📍 Navigating to', APP_URL);
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 1. Open Settings Modal
    console.log('⚙️  Opening settings modal...');
    await page.click('[title="Settings"]');
    await page.waitForTimeout(1000);

    // 2. Screenshot: Theme Selector
    console.log('📸 Capturing theme selector...');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-theme-selector.png'),
      fullPage: false
    });

    // 3. Scroll to Font Family section
    console.log('📸 Capturing font family preview...');
    await page.evaluate(() => {
      const fontSection = Array.from(document.querySelectorAll('label'))
        .find(label => label.textContent.includes('Font Family'));
      if (fontSection) fontSection.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-font-family-preview.png'),
      fullPage: false
    });

    // 4. Screenshot: Font Size and Border Radius
    console.log('📸 Capturing font size settings...');
    await page.evaluate(() => {
      const sizeSection = Array.from(document.querySelectorAll('label'))
        .find(label => label.textContent.includes('Font Size'));
      if (sizeSection) sizeSection.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-font-size-border-radius.png'),
      fullPage: false
    });

    // 5. Settings tabs with "Soon" badges
    console.log('📸 Capturing settings tabs...');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-settings-tabs-soon-badges.png'),
      fullPage: false
    });

    console.log('\n✅ All screenshots captured successfully!');
    console.log(`📁 Saved to: ${SCREENSHOT_DIR}`);

  } catch (error) {
    console.error('❌ Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  takeScreenshots().catch(console.error);
}

module.exports = { takeScreenshots };
