const { chromium } = require('playwright');
const path = require('path');

const screenshots = [
  {
    name: 'home-page',
    url: 'http://localhost:3000',
    description: 'Main home page with project selector'
  },
  {
    name: 'conversation-view',
    url: 'http://localhost:3000/projects/-mnt-c-laragon-www-simple-migration/sessions/2b45ec38-4b3f-405f-b25e-96c557e0182d',
    description: 'Conversation thread view'
  },
  {
    name: 'search-page',
    url: 'http://localhost:3000/search',
    description: 'Search interface',
    beforeScreenshot: async (page) => {
      // Fill in search query
      await page.fill('input[type="text"]', 'migration');
      await page.click('button:has-text("Search")');
      await page.waitForTimeout(2000); // Wait for results
    }
  },
  {
    name: 'search-results',
    url: 'http://localhost:3000/search',
    description: 'Search results page',
    beforeScreenshot: async (page) => {
      await page.fill('input[type="text"]', 'database');
      await page.click('button:has-text("Search")');
      await page.waitForTimeout(2000);
    }
  }
];

async function takeScreenshots() {
  console.log('🎬 Starting screenshot capture with Playwright...\n');

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2 // Retina display
  });

  const page = await context.newPage();

  for (const screenshot of screenshots) {
    try {
      console.log(`📸 Capturing: ${screenshot.description}`);
      console.log(`   URL: ${screenshot.url}`);

      // Navigate to page
      await page.goto(screenshot.url, { waitUntil: 'networkidle' });

      // Wait a bit for any animations
      await page.waitForTimeout(1000);

      // Run any pre-screenshot actions
      if (screenshot.beforeScreenshot) {
        await screenshot.beforeScreenshot(page);
      }

      // Take screenshot
      const screenshotPath = path.join(__dirname, '..', 'screenshots', `${screenshot.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: false
      });

      console.log(`   ✅ Saved: screenshots/${screenshot.name}.png\n`);

    } catch (error) {
      console.error(`   ❌ Failed to capture ${screenshot.name}:`, error.message);
      console.log('   Skipping...\n');
    }
  }

  await browser.close();

  console.log('✨ Screenshot capture complete!');
  console.log(`📁 Screenshots saved to: ${path.join(__dirname, '..', 'screenshots')}`);
}

// Run the script
takeScreenshots().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
