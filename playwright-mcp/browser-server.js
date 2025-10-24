import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({
    headless: false,
    executablePath: "C:\\Users\\being\\AppData\\Local\\ms-playwright\\chromium-1187\\chrome-win\\chrome.exe"
  });

  const page = await browser.newPage();
  await page.goto("https://example.com");
  console.log(await page.title());

  // No wsEndpoint() here — you can wrap browser in MCP server functions
})();
