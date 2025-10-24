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

// Launch browser with visible window
const browser = await chromium.launch({
  headless: false,
  executablePath: "C:\\Users\\being\\AppData\\Local\\ms-playwright\\chromium-1187\\chrome-win\\chrome.exe",
  args: [
    '--start-maximized',
    '--disable-blink-features=AutomationControlled'
  ]
});

console.error("Browser launched successfully in headed mode");

const contexts = new Map();

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "openPage",
        description: "Open a new page with the given URL",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "URL to open" },
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
            pageId: { type: "string", description: "Page ID" },
          },
          required: ["pageId"],
        },
      },
      {
        name: "getURL",
        description: "Get the current URL of the page",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID" },
          },
          required: ["pageId"],
        },
      },
      {
        name: "clickElement",
        description: "Click on an element",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID" },
            selector: { type: "string", description: "CSS selector" },
          },
          required: ["pageId", "selector"],
        },
      },
      {
        name: "typeText",
        description: "Type text into an element",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID" },
            selector: { type: "string", description: "CSS selector" },
            text: { type: "string", description: "Text to type" },
          },
          required: ["pageId", "selector", "text"],
        },
      },
      {
        name: "extractText",
        description: "Extract text content from an element",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID" },
            selector: { type: "string", description: "CSS selector" },
          },
          required: ["pageId", "selector"],
        },
      },
      {
        name: "screenshot",
        description: "Take a screenshot of the page",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID" },
          },
          required: ["pageId"],
        },
      },
      {
        name: "waitForSelector",
        description: "Wait for an element to appear",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID" },
            selector: { type: "string", description: "CSS selector" },
            timeout: { type: "number", description: "Timeout in ms", default: 5000 },
          },
          required: ["pageId", "selector"],
        },
      },
      {
        name: "goBack",
        description: "Go back in browser history",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID" },
          },
          required: ["pageId"],
        },
      },
      {
        name: "goForward",
        description: "Go forward in browser history",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID" },
          },
          required: ["pageId"],
        },
      },
      {
        name: "closePage",
        description: "Close a page",
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
            pageId: { type: "string", description: "Page ID" },
            x: { type: "number", description: "Horizontal scroll amount", default: 0 },
            y: { type: "number", description: "Vertical scroll amount", default: 1000 },
          },
          required: ["pageId"],
        },
      },
      {
        name: "hoverElement",
        description: "Hover over an element",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID" },
            selector: { type: "string", description: "CSS selector" },
          },
          required: ["pageId", "selector"],
        },
      },
      {
        name: "getAttribute",
        description: "Get an attribute value from an element",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID" },
            selector: { type: "string", description: "CSS selector" },
            attribute: { type: "string", description: "Attribute name" },
          },
          required: ["pageId", "selector", "attribute"],
        },
      },
      {
        name: "checkCheckbox",
        description: "Check a checkbox",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID" },
            selector: { type: "string", description: "CSS selector" },
          },
          required: ["pageId", "selector"],
        },
      },
      {
        name: "uncheckCheckbox",
        description: "Uncheck a checkbox",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID" },
            selector: { type: "string", description: "CSS selector" },
          },
          required: ["pageId", "selector"],
        },
      },
      {
        name: "selectOption",
        description: "Select an option from a dropdown",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID" },
            selector: { type: "string", description: "CSS selector" },
            value: { type: "string", description: "Option value" },
          },
          required: ["pageId", "selector", "value"],
        },
      },
      {
        name: "getInnerHTML",
        description: "Get the innerHTML of an element",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID" },
            selector: { type: "string", description: "CSS selector" },
          },
          required: ["pageId", "selector"],
        },
      },
      {
        name: "getOuterHTML",
        description: "Get the outerHTML of an element",
        inputSchema: {
          type: "object",
          properties: {
            pageId: { type: "string", description: "Page ID" },
            selector: { type: "string", description: "CSS selector" },
          },
          required: ["pageId", "selector"],
        },
      },
    ],
  };
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "openPage": {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(args.url);
        const pageId = Date.now().toString();
        contexts.set(pageId, { context, page });
        return {
          content: [{ type: "text", text: JSON.stringify({ pageId, message: `Opened ${args.url}` }) }],
        };
      }

      case "getTitle": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
        const title = await page.title();
        return {
          content: [{ type: "text", text: JSON.stringify({ title }) }],
        };
      }

      case "getURL": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
        return {
          content: [{ type: "text", text: JSON.stringify({ url: page.url() }) }],
        };
      }

      case "clickElement": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
        await page.click(args.selector);
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Clicked ${args.selector}` }) }],
        };
      }

      case "typeText": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
        await page.fill(args.selector, args.text);
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Typed text into ${args.selector}` }) }],
        };
      }

      case "extractText": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
        const text = await page.textContent(args.selector);
        return {
          content: [{ type: "text", text: JSON.stringify({ text }) }],
        };
      }

      case "screenshot": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
        const path = `screenshot_${args.pageId}_${Date.now()}.png`;
        await page.screenshot({ path });
        return {
          content: [{ type: "text", text: JSON.stringify({ screenshotPath: path }) }],
        };
      }

      case "waitForSelector": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
        await page.waitForSelector(args.selector, { timeout: args.timeout || 5000 });
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Selector ${args.selector} appeared` }) }],
        };
      }

      case "goBack": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
        await page.goBack();
        return {
          content: [{ type: "text", text: JSON.stringify({ message: "Went back" }) }],
        };
      }

      case "goForward": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
        await page.goForward();
        return {
          content: [{ type: "text", text: JSON.stringify({ message: "Went forward" }) }],
        };
      }

      case "closePage": {
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
        return {
          content: [{ type: "text", text: JSON.stringify({ pages: Array.from(contexts.keys()) }) }],
        };
      }

      case "scrollPage": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
        const x = args.x || 0;
        const y = args.y || 1000;
        await page.evaluate(([scrollX, scrollY]) => window.scrollBy(scrollX, scrollY), [x, y]);
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Scrolled by x:${x} y:${y}` }) }],
        };
      }

      case "hoverElement": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
        await page.hover(args.selector);
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Hovered over ${args.selector}` }) }],
        };
      }

      case "getAttribute": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
        const value = await page.getAttribute(args.selector, args.attribute);
        return {
          content: [{ type: "text", text: JSON.stringify({ value }) }],
        };
      }

      case "checkCheckbox": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
        await page.check(args.selector);
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Checked ${args.selector}` }) }],
        };
      }

      case "uncheckCheckbox": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
        await page.uncheck(args.selector);
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Unchecked ${args.selector}` }) }],
        };
      }

      case "selectOption": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
        await page.selectOption(args.selector, args.value);
        return {
          content: [{ type: "text", text: JSON.stringify({ message: `Selected ${args.value} in ${args.selector}` }) }],
        };
      }

      case "getInnerHTML": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
        const html = await page.innerHTML(args.selector);
        return {
          content: [{ type: "text", text: JSON.stringify({ html }) }],
        };
      }

      case "getOuterHTML": {
        const { page } = contexts.get(args.pageId) || {};
        if (!page) throw new Error("Page not found");
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

setInterval(() => {}, 1 << 30); //prevent exit

// Keep the process alive and handle cleanup
process.on('SIGINT', async () => {
  console.error('Received SIGINT, closing browser...');
//  await browser.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, closing browser...');
//  await browser.close();
  process.exit(0);
});

// Keep process alive
process.stdin.resume();