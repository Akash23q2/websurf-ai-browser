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
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = new Server(
  {
    name: "autonomous-browser-mcp",
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
const PROFILE_PATH = "C:\\websurf-browser"; //change for yourself

// Define extension path (absolute)
const EXTENSION_PATH = "C:\\Users\\being\\OneDrive - Madan Mohan Malaviya University of Technology\\Documents\\SIHO WORKS\\websurf-ai\\chrome-extension";

// Or use relative path from current directory
// const EXTENSION_PATH = path.join(__dirname, "chrome-extension");

// Default starting URL
const DEFAULT_URL = "https://websurf-ai.vercel.app/";

// Get browser executable path from environment variable or use default
const BROWSER_EXE_PATH = process.env.BROWSER_EXE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

// Initialize browser on first use with persistent profile
async function ensureBrowser() {
  if (!browser) {
    browser = await chromium.launchPersistentContext(PROFILE_PATH, {
      headless: false,
      executablePath: BROWSER_EXE_PATH,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        `--homepage=${DEFAULT_URL}` // Set homepage to default URL
      ],
      // Additional settings for persistent context
      viewport: null, // Use full screen
      acceptDownloads: true,
      // You can add more options like:
      // locale: 'en-US',
      // timezoneId: 'America/New_York',
    });
    console.error(`Browser launched with persistent profile at: ${PROFILE_PATH}`);
    console.error(`Extension loaded from: ${EXTENSION_PATH}`);
    
    // The persistent context automatically creates pages, get the first one
    const pages = browser.pages();
    if (pages.length > 0) {
      defaultPage = pages[0];
      console.error("Using existing page from persistent context");
      
      // Check if page is on about:blank and navigate to default URL
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
    
    // Remove focus from address bar by clicking on the page content
    try {
      await defaultPage.waitForTimeout(1500); // Wait longer for page to fully settle
      await defaultPage.evaluate(() => {
        // Blur active element (address bar)
        if (document.activeElement && document.activeElement.tagName !== 'BODY') {
          document.activeElement.blur();
        }
        // Remove any text selection
        if (window.getSelection) {
          window.getSelection().removeAllRanges();
        }
        // Focus on document body
        document.body.focus();
        // Dispatch a click event on body
        document.body.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
      });
      
      // Physical click on the page
      try {
        await defaultPage.mouse.click(100, 200); // Click somewhere in the page content area
      } catch (e) {
        // Ignore click errors
      }
      
      console.error("Removed address bar focus");
    } catch (err) {
      console.error("Failed to remove address bar focus:", err);
    }
  }
  return browser;
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
          // Create new page in persistent context
          await ensureBrowser();
          const page = await browser.newPage();
          await page.goto(args.url);
          const pageId = Date.now().toString();
          contexts.set(pageId, page);
          return {
            content: [{ type: "text", text: JSON.stringify({ pageId, message: `Opened ${args.url} in new page` }) }],
          };
        } else {
          // Use default page
          const page = await getDefaultPage();
          await page.goto(args.url);
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
    return {
      content: [{ type: "text", text: JSON.stringify({ error: error.message }) }],
      isError: true,
    };
  }
});

// Start the server
const transport = new StdioServerTransport();

// Launch browser immediately when script starts
(async () => {
  try {
    await ensureBrowser(); // 🚀 Launch browser with extension and navigate to default URL
    
    // Additional focus removal after browser is fully loaded
    const page = await getDefaultPage();
    await page.waitForTimeout(1000); // Wait a bit longer for full page load
    
    // Click on page content multiple times to ensure focus is removed
    await page.evaluate(() => {
      // Remove focus from address bar
      if (document.activeElement) {
        document.activeElement.blur();
      }
      // Click on body
      document.body.click();
      // Remove any selection
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
      // Focus on body
      document.body.focus();
    });
    
    // Try clicking on a specific element if body click doesn't work
    try {
      await page.click('body', { force: true });
    } catch (e) {
      // Ignore if click fails
    }
    
    console.error("Browser pre-launched successfully with extension loaded");
  } catch (err) {
    console.error("Failed to pre-launch browser:", err);
  }
})();


await server.connect(transport);

console.error("MCP Browser Server running on stdio with persistent profile");
console.error(`Profile location: ${PROFILE_PATH}`);
console.error(`Extension location: ${EXTENSION_PATH}`);
console.error(`Default URL: ${DEFAULT_URL}`);
console.error(`Browser executable: ${BROWSER_EXE_PATH}`);

setInterval(() => {}, 1 << 30); // prevent exit

// Cleanup handlers - gracefully close browser
process.on('SIGINT', async () => {
  console.error('Received SIGINT, closing browser gracefully...');
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
  console.error('Received SIGTERM, closing browser gracefully...');
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