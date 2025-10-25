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

- **Node.js 18+** (auto-installed if not present)
- npm package manager (comes with Node.js)
- Windows, Linux, or macOS

### Quick Start

#### Option 1: Run via Launcher Scripts (Recommended)

**Windows (PowerShell):**
```powershell
.\websurf-launcher.ps1
```

**Windows (Batch):**
```batch
websurf-launcher.bat
```

**Linux/macOS (Shell):**
```bash
chmod +x websurf-launcher.sh
./websurf-launcher.sh
```

The launcher will:
- Check for Node.js installation
- Download portable Node.js if needed (one-time, ~30MB)
- Create a desktop shortcut
- Install dependencies automatically
- Download Chromium browser if needed
- Launch the MCP server with browser

#### Option 2: Run via Node.js Directly

```bash
cd websurf-build
node main-launcher.js
```

#### Option 3: Use Desktop Shortcut

After first launch, double-click the generated shortcut:
- **Windows:** `WebSurf.lnk`
- **Linux:** Application menu entry (Desktop Environment)

***

## 📦 Project Structure

```
websurf-ai/
├── websurf-build/           # Build and launcher scripts
│   ├── main-launcher.js     # Main entry point
│   ├── websurf-launcher.ps1 # PowerShell launcher (Windows)
│   ├── websurf-launcher.bat # Batch launcher (Windows)
│   ├── websurf-launcher.sh  # Shell launcher (Linux/macOS)
│   ├── build-script.ps1     # Windows build script
│   ├── websurf.ico          # Application icon
│   ├── .node-portable/      # Portable Node.js (auto-downloaded)
│   └── electron-app/        # Desktop client (see folder for details)
├── websurf-mcp/             # MCP server code
│   ├── browser-mcp.js       # Main MCP server
│   └── package.json         # Dependencies
├── chrome-extension/        # Browser extension for enhanced features
└── websurf-backend/         # Backend API and agent logic
```

***

## 🎯 How to Use

### Browser-Based Access

WebSurf provides a **web frontend** for easy interaction:

1. Launch WebSurf MCP (via launcher script or `main-launcher.js`)
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

## 🔌 Integration

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

##  Troubleshooting

**❌ "Cannot find chromium executable"**
- Run `npx playwright install chromium` in `websurf-mcp/`
- Or set custom browser path (see Configuration)

**❌ "Dependencies not installed"**
- First launch installs automatically
- Manual: `cd websurf-mcp && npm install`

**❌ "Browser already open" errors**
- Each MCP instance creates a **new browser window**
- Persistent profile is shared across windows
- Old windows won't conflict with new MCP calls

**❌ Extension not loading**
- Check `chrome-extension/` folder exists
- Verify path in `browser-mcp.js` line 18

**❌ "Node.js not found"**
- Launcher scripts auto-download portable Node.js
- Or install from https://nodejs.org/
- Portable Node.js is stored in `.node-portable/` folder

**❌ Launcher script won't run (Linux/macOS)**
- Make executable: `chmod +x websurf-launcher.sh`
- Ensure bash is installed: `which bash`

**❌ PowerShell execution policy error**
- Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Or use batch script instead: `websurf-launcher.bat`

***

## 📦 Distribution

```
websurf-package/
├── websurf-launcher.ps1    # Windows PowerShell
├── websurf-launcher.bat    # Windows Batch
├── websurf-launcher.sh     # Linux/macOS
├── main-launcher.js        # Node.js entry point
├── websurf.ico/.png        # Icon files
├── websurf-mcp/
├── chrome-extension/
└── README.md
```

**Benefits:**
- ✅ No Node.js required (auto-downloads portable version)
- ✅ Creates desktop shortcuts automatically
- ✅ Cross-platform support
- ✅ Auto-installs dependencies

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

## 💻 Desktop Client

For advanced users who want a dedicated desktop application:

📁 **Check `websurf-build/electron-app/` for:**
- Installation instructions
- Feature details
- Build configuration
- Usage guide

***

## 📝 Launcher Script Features

The launcher scripts provide:

- **Automatic Node.js Detection**: Checks for system Node.js installation
- **Portable Node.js Download**: Downloads Node.js v22.11.0 if not found (one-time)
- **Platform Detection**: Auto-detects OS and architecture (x64/ARM64)
- **Shortcut Creation**: 
  - Windows: `.lnk` shortcut with icon
  - Linux: `.desktop` file for application menu
- **Dependency Management**: Auto-installs npm packages on first run
- **Color-Coded Output**: Easy-to-read console messages
- **Error Handling**: Clear error messages and troubleshooting hints

***
