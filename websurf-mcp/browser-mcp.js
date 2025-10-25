import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = new Server(
  {
    name: "websurf-browser-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Global browser instance
let browser = null;
let defaultContext = null;
let defaultPage = null;

// Define persistent profile path
const PROFILE_PATH = "C:\\websurf-browser";

// Define extension path (absolute)
const EXTENSION_PATH =  path.resolve(__dirname, "../chrome-extension");

// Default starting URL
const DEFAULT_URL = "https://websurf-ai.vercel.app/";

// CDP endpoint file to share browser instance
const CDP_ENDPOINT_FILE = path.join(PROFILE_PATH, ".cdp-endpoint");

// Check if browser context is still valid
async function isBrowserValid() {
  if (!browser) return false;
  
  try {
    await browser.pages();
    return true;
  } catch (error) {
    console.error("Browser context is no longer valid:", error.message);
    return false;
  }
}

// Reset browser state
function resetBrowser() {
  browser = null;
  defaultContext = null;
  defaultPage = null;
  contexts.clear();
  console.error("Browser state has been reset");
}

// Try to connect to existing browser first, then launch new one
async function ensureBrowser() {
  // Check if existing browser is still valid
  if (browser && !(await isBrowserValid())) {
    console.error("Detected closed browser, resetting...");
    resetBrowser();
  }

  if (!browser) {
    // Try to connect to existing browser instance first
    if (fs.existsSync(CDP_ENDPOINT_FILE)) {
      try {
        const cdpEndpoint = fs.readFileSync(CDP_ENDPOINT_FILE, 'utf-8').trim();
        console.error(`Attempting to connect to existing browser at: ${cdpEndpoint}`);
        
        browser = await chromium.connectOverCDP(cdpEndpoint);
        console.error("✓ Successfully connected to existing browser instance!");
        
        // Get existing contexts
        const contexts = browser.contexts();
        if (contexts.length > 0) {
          const pages = contexts[0].pages();
          if (pages.length > 0) {
            defaultPage = pages[0];
            console.error("✓ Using existing page from connected browser");
          }
        }
        
        if (!defaultPage) {
          defaultPage = await browser.contexts()[0].newPage();
          console.error("Created new page in connected browser");
        }
        
        return browser;
      } catch (err) {
        console.error("Failed to connect to existing browser:", err.message);
        console.error("Will launch new browser instance...");
        // Clean up stale endpoint file
        try {
          fs.unlinkSync(CDP_ENDPOINT_FILE);
        } catch (e) {}
      }
    }

    // Launch new browser with CDP enabled
    console.error("Launching new browser instance...");
    browser = await chromium.launchPersistentContext(PROFILE_PATH, {
      headless: false,
      executablePath: path.resolve(__dirname, "../websurf-build/chromium/chrome.exe"), //change it with any browser of your liking {chromium based}
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--remote-debugging-port=9222', // Enable CDP
      ],
      viewport: null,
      acceptDownloads: true,
    });
    
    // Save CDP endpoint for other processes to connect
    try {
      const cdpEndpoint = browser.context().browser()?.options?.cdpEndpoint || 
                         `http://localhost:9222`;
      fs.writeFileSync(CDP_ENDPOINT_FILE, cdpEndpoint);
      console.error(`✓ CDP endpoint saved to: ${CDP_ENDPOINT_FILE}`);
    } catch (err) {
      console.error("Warning: Could not save CDP endpoint:", err.message);
    }
    
    console.error(`✓ Browser launched with persistent profile at: ${PROFILE_PATH}`);
    console.error(`✓ Extension loaded from: ${EXTENSION_PATH}`);
    
    // Get or create the first page
    const pages = browser.pages();
    if (pages.length > 0) {
      defaultPage = pages[0];
      console.error("Using existing page from persistent context");
      
      if (defaultPage.url() === 'about:blank' || defaultPage.url() === '') {
        try {
          await defaultPage.goto(DEFAULT_URL, { waitUntil: 'domcontentloaded' });
          console.error(`Navigated to default URL: ${DEFAULT_URL}`);
        } catch (err) {
          console.error(`Failed to navigate to ${DEFAULT_URL}:`, err);
        }
      }
    } else {
      defaultPage = await browser.newPage();
      console.error("Created new default page");
      try {
        await defaultPage.goto(DEFAULT_URL, { waitUntil: 'domcontentloaded' });
        console.error(`Navigated to default URL: ${DEFAULT_URL}`);
      } catch (err) {
        console.error(`Failed to navigate to ${DEFAULT_URL}:`, err);
      }
    }
    
    await removeFocusFromAddressBar(defaultPage);
  }
  return browser;
}

// Helper function to remove focus from address bar
async function removeFocusFromAddressBar(page) {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => {
      try {
        const selection = window.getSelection();
        if (selection) selection.removeAllRanges();
        
        if (document.body) document.body.focus();
        
        const temp = document.createElement('input');
        temp.style.position = 'absolute';
        temp.style.opacity = '0';
        temp.style.pointerEvents = 'none';
        document.body.appendChild(temp);
        temp.focus();
        temp.blur();
        document.body.removeChild(temp);
        
        if (document.body) document.body.focus();
      } catch (e) {
        console.error('Error removing focus:', e);
      }
    });
    
    try {
      const viewport = page.viewportSize() || { width: 1920, height: 1080 };
      await page.mouse.click(viewport.width / 2, viewport.height / 2);
    } catch (e) {
      console.error('Error clicking page:', e);
    }
    
    console.error("Removed address bar focus");
  } catch (err) {
    console.error("Failed to remove address bar focus:", err);
  }
}

// Get or create default page
async function getDefaultPage() {
  await ensureBrowser();
  
  if (!defaultPage || defaultPage.isClosed()) {
    defaultPage = await browser.newPage();
    console.error("Created new default page");
  }
  
  return defaultPage;
}

const contexts = new Map();

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "openPage",
        description: "Open a new page with the given URL. If no pageId is provided, uses the default page.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "URL to open" },
            useNewPage: { type: "boolean", description: "Create new page instead of reusing default", default: false },
          },
          required: ["url"],
        },
      },
      {
        name: "getTitle",
        description: "Get the title of the page",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
          },
        },
      },
      {
        name: "getURL",
        description: "Get the current URL of the page",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
          },
        },
      },
      {
        name: "clickElement",
        description: "Click on an element",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
            selector: { type: "string", description: "CSS selector" },
          },
          required: ["selector"],
        },
      },
      {
        name: "typeText",
        description: "Type text into an element",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
            selector: { type: "string", description: "CSS selector" },
            text: { type: "string", description: "Text to type" },
          },
          required: ["selector", "text"],
        },
      },
      {
        name: "extractText",
        description: "Extract text content from an element",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
            selector: { type: "string", description: "CSS selector" },
          },
          required: ["selector"],
        },
      },
      {
        name: "screenshot",
        description: "Take a screenshot of the page",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
          },
        },
      },
      {
        name: "waitForSelector",
        description: "Wait for an element to appear",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
            selector: { type: "string", description: "CSS selector" },
            timeout: { type: "number", description: "Timeout in ms", default: 5000 },
          },
          required: ["selector"],
        },
      },
      {
        name: "goBack",
        description: "Go back in browser history",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
          },
        },
      },
      {
        name: "goForward",
        description: "Go forward in browser history",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
          },
        },
      },
      {
        name: "closePage",
        description: "Close a specific page (not the default page)",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID" },
          },
          required: ["pageId"],
        },
      },
      {
        name: "listPages",
        description: "List all open pages",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "scrollPage",
        description: "Scroll the page",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
            x: { type: "number", description: "Horizontal scroll amount", default: 0 },
            y: { type: "number", description: "Vertical scroll amount", default: 1000 },
          },
        },
      },
      {
        name: "hoverElement",
        description: "Hover over an element",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
            selector: { type: "string", description: "CSS selector" },
          },
          required: ["selector"],
        },
      },
      {
        name: "getAttribute",
        description: "Get an attribute value from an element",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
            selector: { type: "string", description: "CSS selector" },
            attribute: { type: "string", description: "Attribute name" },
          },
          required: ["selector", "attribute"],
        },
      },
      {
        name: "checkCheckbox",
        description: "Check a checkbox",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
            selector: { type: "string", description: "CSS selector" },
          },
          required: ["selector"],
        },
      },
      {
        name: "uncheckCheckbox",
        description: "Uncheck a checkbox",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
            selector: { type: "string", description: "CSS selector" },
          },
          required: ["selector"],
        },
      },
      {
        name: "selectOption",
        description: "Select an option from a dropdown",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
            selector: { type: "string", description: "CSS selector" },
            value: { type: "string", description: "Option value" },
          },
          required: ["selector", "value"],
        },
      },
      {
        name: "getInnerHTML",
        description: "Get the innerHTML of an element",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
            selector: { type: "string", description: "CSS selector" },
          },
          required: ["selector"],
        },
      },
      {
        name: "getOuterHTML",
        description: "Get the outerHTML of an element",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID (optional, uses default if not provided)" },
            selector: { type: "string", description: "CSS selector" },
          },
          required: ["selector"],
        },
      },
    ],
  };
});

// Helper to get page by ID or default
async function getPage(pageId) {
  if (!pageId) {
    return await getDefaultPage();
  }
  const page = contexts.get(pageId);
  if (!page) throw new Error("Page not found");
  return page;
}

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "openPage": {
        if (args.useNewPage) {
          await ensureBrowser();
          const page = await browser.newPage();
          await page.goto(args.url);
          await removeFocusFromAddressBar(page);
          const pageId = Date.now().toString();
          contexts.set(pageId, page);
          return {
            content: [{ type: "text", text: JSON.stringify({ pageId, message: `Opened ${args.url} in new page` }) }],
          };
        } else {
          const page = await getDefaultPage();
          await page.goto(args.url);
          await removeFocusFromAddressBar(page);
          return {
            content: [{ type: "text", text: JSON.stringify({ pageId: "default", message: `Opened ${args.url} in default page` }) }],
          };
        }
      }

      case "getTitle": {
        const page = await getPage(args.pageId);
        const title = await page.title();
        return {
          content: [{ type: "text", text: JSON.stringify({ title }) }],
        };
      }

      case "getURL": {
        const page = await getPage(args.pageId);
        return {
          content: [{ type: "text", text: JSON.stringify({ url: page.url() }) }],
        };
      }

      case "clickElement": {
        const page = await getPage(args.pageId);
        await page.click(args.selector);
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Clicked ${args.selector}` }) }],
        };
      }

      case "typeText": {
        const page = await getPage(args.pageId);
        await page.fill(args.selector, args.text);
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Typed text into ${args.selector}` }) }],
        };
      }

      case "extractText": {
        const page = await getPage(args.pageId);
        const text = await page.textContent(args.selector);
        return {
          content: [{ type: "text", text: JSON.stringify({ text }) }],
        };
      }

      case "screenshot": {
        const page = await getPage(args.pageId);
        const path = `screenshot_${args.pageId || 'default'}_${Date.now()}.png`;
        await page.screenshot({ path });
        return {
          content: [{ type: "text", text: JSON.stringify({ screenshotPath: path }) }],
        };
      }

      case "waitForSelector": {
        const page = await getPage(args.pageId);
        await page.waitForSelector(args.selector, { timeout: args.timeout || 5000 });
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Selector ${args.selector} appeared` }) }],
        };
      }

      case "goBack": {
        const page = await getPage(args.pageId);
        await page.goBack();
        return {
          content: [{ type: "text", text: JSON.stringify({ message: "Went back" }) }],
        };
      }

      case "goForward": {
        const page = await getPage(args.pageId);
        await page.goForward();
        return {
          content: [{ type: "text", text: JSON.stringify({ message: "Went forward" }) }],
        };
      }

      case "closePage": {
        if (!args.pageId || args.pageId === "default") {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: "Cannot close default page" }) }],
            isError: true,
          };
        }
        const page = contexts.get(args.pageId);
        if (!page) throw new Error("Page not found");
        await page.close();
        contexts.delete(args.pageId);
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Closed page ${args.pageId}` }) }],
        };
      }

      case "listPages": {
        const pages = ["default", ...Array.from(contexts.keys())];
        return {
          content: [{ type: "text", text: JSON.stringify({ pages }) }],
        };
      }

      case "scrollPage": {
        const page = await getPage(args.pageId);
        const x = args.x || 0;
        const y = args.y || 1000;
        await page.evaluate(([scrollX, scrollY]) => window.scrollBy(scrollX, scrollY), [x, y]);
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Scrolled by x:${x} y:${y}` }) }],
        };
      }

      case "hoverElement": {
        const page = await getPage(args.pageId);
        await page.hover(args.selector);
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Hovered over ${args.selector}` }) }],
        };
      }

      case "getAttribute": {
        const page = await getPage(args.pageId);
        const value = await page.getAttribute(args.selector, args.attribute);
        return {
          content: [{ type: "text", text: JSON.stringify({ value }) }],
        };
      }

      case "checkCheckbox": {
        const page = await getPage(args.pageId);
        await page.check(args.selector);
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Checked ${args.selector}` }) }],
        };
      }

      case "uncheckCheckbox": {
        const page = await getPage(args.pageId);
        await page.uncheck(args.selector);
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Unchecked ${args.selector}` }) }],
        };
      }

      case "selectOption": {
        const page = await getPage(args.pageId);
        await page.selectOption(args.selector, args.value);
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Selected ${args.value} in ${args.selector}` }) }],
        };
      }

      case "getInnerHTML": {
        const page = await getPage(args.pageId);
        const html = await page.innerHTML(args.selector);
        return {
          content: [{ type: "text", text: JSON.stringify({ html }) }],
        };
      }

      case "getOuterHTML": {
        const page = await getPage(args.pageId);
        const element = await page.$(args.selector);
        const html = await page.evaluate(el => el.outerHTML, element);
        return {
          content: [{ type: "text", text: JSON.stringify({ html }) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error.message.includes('closed') || error.message.includes('Target closed')) {
      console.error("Detected closed browser during operation, resetting...");
      resetBrowser();
      return {
        content: [{ type: "text", text: JSON.stringify({ 
          error: "Browser was closed. It will be relaunched on the next operation.", 
          recoverable: true 
        }) }],
        isError: true,
      };
    }
    
    return {
      content: [{ type: "text", text: JSON.stringify({ error: error.message }) }],
      isError: true,
    };
  }
});

// Start the server
const transport = new StdioServerTransport();

// Don't auto-launch - wait for first use or connect to existing
console.error("MCP Browser Server starting...");
console.error("Will connect to existing browser or launch new instance on first use");

await server.connect(transport);

console.error("MCP Browser Server running on stdio with persistent profile");
console.error(`Profile location: ${PROFILE_PATH}`);
console.error(`Extension location: ${EXTENSION_PATH}`);
console.error(`Default URL: ${DEFAULT_URL}`);

setInterval(() => {}, 1 << 30);

// Cleanup handlers
process.on('SIGINT', async () => {
  console.error('Received SIGINT, cleaning up...');
  try {
    if (fs.existsSync(CDP_ENDPOINT_FILE)) {
      fs.unlinkSync(CDP_ENDPOINT_FILE);
    }
  } catch (e) {}
  
  if (browser) {
    try {
      await browser.close();
      console.error('Browser closed successfully');
    } catch (e) {
      console.error('Error closing browser:', e);
    }
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, cleaning up...');
  try {
    if (fs.existsSync(CDP_ENDPOINT_FILE)) {
      fs.unlinkSync(CDP_ENDPOINT_FILE);
    }
  } catch (e) {}
  
  if (browser) {
    try {
      await browser.close();
      console.error('Browser closed successfully');
    } catch (e) {
      console.error('Error closing browser:', e);
    }
  }
  process.exit(0);
});

process.stdin.resume();