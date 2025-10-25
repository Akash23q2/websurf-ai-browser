// standalone-launcher.js
// Run this with: node standalone-launcher.js
// MCP server can connect to this running browser!

import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Same settings as your MCP server
const PROFILE_PATH = "C:\\websurf-browser";
const EXTENSION_PATH = path.resolve(__dirname, "../chrome-extension");
const DEFAULT_URL = "https://websurf-ai.vercel.app/";
const CDP_ENDPOINT_FILE = path.join(PROFILE_PATH, ".cdp-endpoint");

async function launchBrowser() {
  console.log("Press Ctrl+C to close the browser");
  console.log("========================================");
  console.log("");

  // Keep the script running
  process.on('SIGINT', async () => {
    console.log('\n\n========================================');
    console.log('Closing browser gracefully...');
    console.log('========================================');
    
    // Clean up CDP endpoint file
    try {
      if (fs.existsSync(CDP_ENDPOINT_FILE)) {
        fs.unlinkSync(CDP_ENDPOINT_FILE);
        console.log('✓ Cleaned up CDP endpoint file');
      }
    } catch (e) {
      console.error('#  Error cleaning up:', e.message);
    }
    
    // Close browser
    try {
      await browser.close();
      console.log('✓ Browser closed successfully');
    } catch (e) {
      console.error('#  Error closing browser:', e.message);
    }
    
    console.log('========================================');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    try {
      if (fs.existsSync(CDP_ENDPOINT_FILE)) {
        fs.unlinkSync(CDP_ENDPOINT_FILE);
      }
      await browser.close();
    } catch (e) {}
    process.exit(0);
  });
}

// Launch the browser
launchBrowser().catch((error) => {
  console.error('\n========================================');
  console.error('ERROR: Failed to launch browser');
  console.error('========================================');
  console.error(error);
  console.error('========================================');
  process.exit(1);
});
  console.log("  WebSurf Browser Launcher");
  console.log("========================================");
  console.log(`Profile: ${PROFILE_PATH}`);
  console.log(`Extension: ${EXTENSION_PATH}`);
  console.log("");
  
  // Check if profile is already in use
  if (fs.existsSync(CDP_ENDPOINT_FILE)) {
    console.log("#  Browser profile appears to be in use");
    console.log("   Attempting to clean up...");
    try {
      fs.unlinkSync(CDP_ENDPOINT_FILE);
    } catch (e) {
      console.error("   Could not clean up. Another instance may be running.");
    }
  }

  console.log("🚀 Launching browser with persistent profile...");
  
  const browser = await chromium.launchPersistentContext(PROFILE_PATH, {
    headless: false,
          executablePath: path.resolve(__dirname, "../websurf-build/chromium/chrome.exe"), //change it with any browser of your liking {chromium based},
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--remote-debugging-port=9222', // Enable CDP for MCP connection
    ],
    viewport: null,
    acceptDownloads: true,
  });

  // Save CDP endpoint so MCP can connect
  try {
    const wsEndpoint = browser.context().browser()?.wsEndpoint();
    if (wsEndpoint) {
      fs.writeFileSync(CDP_ENDPOINT_FILE, wsEndpoint);
      console.log("✓ CDP endpoint saved - MCP can now connect!");
    } else {
      fs.writeFileSync(CDP_ENDPOINT_FILE, "ws://localhost:9222");
      console.log("✓ CDP enabled on port 9222");
    }
  } catch (err) {
    console.error("#  Could not save CDP endpoint:", err.message);
  }

  console.log("✓ Browser launched successfully!");
  console.log("✓ Extension loaded from:", EXTENSION_PATH);

  // Get or create the first page
  const pages = browser.pages();
  let page;
  
  if (pages.length > 0) {
    page = pages[0];
    console.log("✓ Using existing page");
  } else {
    page = await browser.newPage();
    console.log("✓ Created new page");
  }

  // Navigate to default URL if needed
  if (page.url() === 'about:blank' || page.url() === '') {
    try {
      await page.goto(DEFAULT_URL, { waitUntil: 'domcontentloaded' });
      console.log(`✓ Navigated to: ${DEFAULT_URL}`);
    } catch (err) {
      console.error(`#  Failed to navigate to ${DEFAULT_URL}:`, err);
    }
  }

  // Remove address bar focus
  try {
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const selection = window.getSelection();
      if (selection) selection.removeAllRanges();
      if (document.body) document.body.focus();
      
      const temp = document.createElement('input');
      temp.style.position = 'absolute';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.focus();
      temp.blur();
      document.body.removeChild(temp);
      
      if (document.body) document.body.focus();
    });
    const viewport = page.viewportSize() || { width: 1920, height: 1080 };
    await page.mouse.click(viewport.width / 2, viewport.height / 2);
    console.log("✓ Removed address bar focus");
  } catch (err) {
    console.error("#  Failed to remove address bar focus:", err);
  }

  console.log("");
  console.log("========================================");
  console.log(" Browser is ready!");
  console.log("========================================");
  console.log("• All saved data, cookies, and extensions loaded");
  console.log("• MCP server can connect to this browser");
  console.log("");