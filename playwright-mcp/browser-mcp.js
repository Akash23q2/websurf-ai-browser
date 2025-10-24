import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { chromium } from "playwright";

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

// Initialize browser on first use
async function ensureBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: false,
      executablePath: "C:\\Users\\being\\AppData\\Local\\ms-playwright\\chromium-1187\\chrome-win\\chrome.exe",
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    console.error("Browser launched successfully in headed mode");
  }
  return browser;
}

// Get or create default context and page
async function getDefaultPage() {
  await ensureBrowser();
  
  if (!defaultContext) {
    defaultContext = await browser.newContext();
    console.error("Created default browser context");
  }
  
  if (!defaultPage || defaultPage.isClosed()) {
    defaultPage = await defaultContext.newPage();
    console.error("Created default page");
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
  const ctx = contexts.get(pageId);
  if (!ctx) throw new Error("Page not found");
  return ctx.page;
}

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "openPage": {
        if (args.useNewPage) {
          // Create new context and page
          await ensureBrowser();
          const context = await browser.newContext();
          const page = await context.newPage();
          await page.goto(args.url);
          const pageId = Date.now().toString();
          contexts.set(pageId, { context, page });
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
        const ctx = contexts.get(args.pageId);
        if (!ctx) throw new Error("Page not found");
        await ctx.page.close();
        await ctx.context.close();
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
await server.connect(transport);

console.error("MCP Browser Server running on stdio");

setInterval(() => {}, 1 << 30); // prevent exit

// Cleanup handlers - don't close browser, just cleanup contexts
process.on('SIGINT', async () => {
  console.error('Received SIGINT, cleaning up contexts...');
  for (const [pageId, ctx] of contexts) {
    try {
      await ctx.page.close();
      await ctx.context.close();
    } catch (e) {
      console.error(`Error closing context ${pageId}:`, e);
    }
  }
  // Keep browser open for reuse
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, cleaning up contexts...');
  for (const [pageId, ctx] of contexts) {
    try {
      await ctx.page.close();
      await ctx.context.close();
    } catch (e) {
      console.error(`Error closing context ${pageId}:`, e);
    }
  }
  // Keep browser open for reuse
  process.exit(0);
});

process.stdin.resume();