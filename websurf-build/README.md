# WebSurf MCP

**AI-powered browser automation with persistent memory and intelligent control**

WebSurf MCP combines browser automation capabilities with a Model Context Protocol (MCP) server, enabling AI agents to browse, interact with, and extract information from websites while maintaining session persistence.

---

## ✨ What is WebSurf MCP?

WebSurf MCP is a browser automation server that:
- Launches a **persistent browser instance** with saved cookies, logins, and history
- Provides **MCP tools** for AI agents to control the browser (navigate, click, type, extract data)
- Maintains **session state** across multiple interactions
- Supports **Chrome extensions** for enhanced functionality

***

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** installed
- npm package manager
- Windows, Linux, or macOS

### Quick Start

#### Option 1: Run via Executable (Recommended)

1. Download the latest release from `websurf-build/`
2. Double-click `WebSurf.exe` (Windows) or run the executable
3. Browser launches automatically with MCP server ready

#### Option 2: Run via Node.js

```bash
cd websurf-build
node main-launcher.js
```

The launcher will:
- Check and install dependencies automatically
- Download Chromium browser if needed
- Launch the MCP server with browser

***

## 📦 Project Structure

```
websurf-ai/
├── websurf-build/           # Build and launcher scripts
│   ├── main-launcher.js     # Main entry point
│   ├── build-script.ps1     # Windows build script
│   ├── websurf.ico          # Application icon
│   └── electron-app/        # Desktop client (see folder for details)
├── websurf-mcp/             # MCP server code
│   ├── browser-mcp.js       # Main MCP server
│   └── package.json         # Dependencies
├── chrome-extension/        # Browser extension for enhanced features
└── websurf-backend/         # Backend API and agent logic
```

***

##  How to Use

### Browser-Based Access

WebSurf provides a **web frontend** for easy interaction:

1. Launch WebSurf MCP (via executable or `main-launcher.js`)
2. Open the frontend in your browser
3. Use the browser agent while browsing normally
4. The **Chrome extension** provides additional controls directly in-browser

### Desktop Client

For a dedicated experience, WebSurf includes an **Electron desktop app**:

📁 **See `websurf-build/electron-app/` for installation and usage details**

***

## 🛠️ Building from Source

### Build Executable

Navigate to `websurf-build/` and run:

**Windows:**
```bash
npm install
npm run build
```

**All Platforms:**
```bash
npm run build-all
```

Outputs:
- `dist/websurf.exe` (Windows)
- `dist/websurf-linux` (Linux)
- `dist/websurf-macos` (macOS)

### Add Icon (Windows only)

```bash
npm install -g rcedit
rcedit dist/websurf.exe --set-icon websurf.ico
```

***

## 🔧 Configuration

### Browser Profile

Browser data is stored at: `C:\websurf-browser`

This includes:
- 🍪 Cookies and sessions
- 🔑 Saved passwords
- 📚 Browsing history
- ⚙️ Extensions and settings

### Custom Browser Path

Edit `browser-mcp.js` line 59:

```javascript
executablePath: path.resolve(__dirname, "../websurf-build/chromium/chrome.exe")
```

Change to your preferred Chromium-based browser.

### Default URL

Edit `browser-mcp.js` line 21:

```javascript
const DEFAULT_URL = "https://websurf-ai.vercel.app/";
```

***

## ⚡ MCP Tools Available

The server provides these tools for AI agents:

| Tool | Description |
|------|-------------|
| `openPage` | Navigate to a URL |
| `clickElement` | Click on elements using CSS selectors |
| `typeText` | Type text into input fields |
| `extractText` | Extract text content from page |
| `screenshot` | Capture page screenshots |
| `scrollPage` | Scroll the page |
| `getTitle` / `getURL` | Get page information |

Full tool list: See `browser-mcp.js` lines 101-223

***

##  Integration

### Using with AI Agents

WebSurf MCP uses **stdio transport** for communication:

```javascript
import { MCPClient } from '@modelcontextprotocol/sdk/client';

const client = new MCPClient({
  command: 'node',
  args: ['path/to/browser-mcp.js']
});

await client.connect();
const result = await client.callTool('openPage', { url: 'https://example.com' });
```

### Using with Python Backend

See `websurf-backend/` for FastAPI integration example with Gemini AI.

***

## Troubleshooting

**X "Cannot find chromium executable"**
- Run `npx playwright install chromium` in `websurf-mcp/`
- Or set custom browser path (see Configuration)

**X "Dependencies not installed"**
- First launch installs automatically
- Manual: `cd websurf-mcp && npm install`

**X "Browser already open" errors**
- Each MCP instance creates a **new browser window**
- Persistent profile is shared across windows
- Old windows won't conflict with new MCP calls

**X Extension not loading**
- Check `chrome-extension/` folder exists
- Verify path in `browser-mcp.js` line 18

***

### Standalone Executable

Distribute just the `.exe` file:
- ✅ Users need Node.js installed
- ✅ Auto-installs dependencies on first run
- ✅ Small file size (~50MB)

### Full Package

Include everything pre-installed:
```
websurf-package/
├── websurf.exe
├── websurf-mcp/
│   └── node_modules/     # Pre-installed
├── chrome-extension/
└── README.md
```

***

## 🔐 Desktop Client

For advanced users who want a dedicated desktop application:

📁 **Check `websurf-build/electron-app/` for:**
- Installation instructions
- Feature details
- Build configuration
- Usage guide

***

