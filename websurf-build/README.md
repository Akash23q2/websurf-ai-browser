# WebSurf MCP Build Instructions

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git (for cloning the repository)

## Project Structure

```
root/
├── websurf-build/          # Build configuration folder
│   ├── main.js             # Launcher script
│   ├── package.json        # Build config with pkg settings
│   └── websurf.ico         # Application icon
├── websurf-mcp/            # Main MCP server code
│   ├── browser-mcp.js
│   ├── browser-server.js
│   └── package.json
└── README.md
```

## Building the Executable

### 1. Install Build Dependencies

Navigate to the `websurf-build` folder and install dependencies:

```bash
cd websurf-build
npm install
```

### 2. Build the Executable

#### Windows (64-bit)
```bash
npm run build
```

This creates `websurf.exe` in the `websurf-build/dist` folder.

#### All Platforms
```bash
npm run build-all
```

This creates executables for:
- Windows (x64)
- Linux (x64)
- macOS (x64)

### 3. Manual Build with Custom Options

```bash
pkg . --targets node20-win-x64 --output websurf.exe
```

#### Available Targets:
- `node20-win-x64` - Windows 64-bit
- `node20-linux-x64` - Linux 64-bit
- `node20-macos-x64` - macOS 64-bit (Intel)
- `node20-macos-arm64` - macOS 64-bit (Apple Silicon)

## Adding Icon to Executable (Windows)

After building, use `rcedit` to add the icon:

### Install rcedit
```bash
npm install -g rcedit
```

### Apply Icon
```bash
rcedit dist/websurf.exe --set-icon websurf.ico
```

Or use the PowerShell script:

```powershell
# install-icon.ps1
npm install -g rcedit
rcedit dist/websurf.exe --set-icon websurf.ico
Write-Host "Icon applied successfully!" -ForegroundColor Green
```

## How It Works

### First Launch
1. User runs `websurf.exe`
2. Launcher checks if dependencies are installed
3. If not, runs `npm install` in `websurf-mcp` folder
4. Installs `@modelcontextprotocol/sdk`, `playwright`, etc.
5. Creates a marker file `.deps-installed`
6. Launches browser server and MCP server

### Subsequent Launches
1. Detects existing dependencies
2. Immediately launches both servers
3. Fast startup (< 2 seconds)

## Distribution

### Option 1: Executable Only
Distribute just the `.exe` file. Users need:
- Node.js installed on their system
- Internet connection for first-run dependency download

### Option 2: Full Package
Create a zip with:
```
websurf-package/
├── websurf.exe
├── websurf-mcp/
│   ├── browser-mcp.js
│   ├── browser-server.js
│   └── package.json
└── README.md
```

### Option 3: With Pre-installed Dependencies
Include `node_modules` in the package (larger file size but no install needed):
```
websurf-package/
├── websurf.exe
├── websurf-mcp/
│   ├── browser-mcp.js
│   ├── browser-server.js
│   ├── package.json
│   └── node_modules/        # Pre-installed
└── README.md
```

## Troubleshooting

### "Cannot find module" errors
- Ensure all scripts are in the `pkg.scripts` array in `package.json`
- Try building with `--debug` flag

### Icon not showing
- Use `rcedit` after building
- Ensure `websurf.ico` is a valid Windows icon file
- Icon should be 256x256 or smaller

### Slow first launch
- This is normal as npm installs dependencies
- Subsequent launches are fast
- Consider distributing with pre-installed `node_modules`

### Browser installation
- Playwright browsers are NOT auto-installed
- Users must run `npx playwright install chromium` manually if needed
- Or modify the launcher to include browser installation
