# WebSurf-AI — Your Intelligent Browsing Companion

  <img src="src/websurf.gif" />

**WebSurf-AI** is a powerful, open-source AI agent that revolutionizes your web browsing experience. It integrates seamlessly as both a browser extension and desktop application, providing you with a persistent, context-aware assistant that can perform complex tasks, automate workflows, and enhance your productivity while ensuring your privacy.

##
<img src="src/websurf-demo.gif"/>




---

## Key Highlights

- **AI-Powered Web Browsing:** Delegate tasks to an intelligent agent that can understand and interact with web pages. It can view, scroll, click, fill out forms, and take screenshots.
- **Privacy First:** Operates with a separate, sandboxed browser profile to protect your personal data and maintain your privacy. All operations can be run locally.
- **Persistent Context:** Maintains a consistent and persistent context of your browsing session, allowing for more intelligent and relevant assistance over time.
- **Multiple Deployment Options:** Available as a Chrome extension, Electron desktop app, or standalone MCP server - choose what works best for your workflow.
- **Advanced Data Handling:** Supports embedding and analysis of PDF and text files, allowing the agent to work with a wider range of data sources.
- **Secure and Local:** Built with security in mind, using OAuth2 for authentication. The entire stack can be run locally, giving you full control over your data.
- **Modern Tech Stack:** Powered by FastAPI, Pydantic-AI, Playwright, and robust frontend applications, ensuring high-performance and reliable experience.
- **Portable Distribution:** Comes with automated launchers that handle dependencies and browser setup, making deployment effortless.

---

## Overview

WebSurf-AI is a full-stack application designed to bring the power of AI to your web browser. The backend is a FastAPI server that orchestrates the AI agent's actions through a Model Context Protocol (MCP) server, while the frontend is available as both a Chrome extension and an Electron desktop application.

The agent is capable of performing a wide range of tasks, from simple web navigation to complex data extraction and form submission. It uses a combination of browser automation and accessibility APIs to understand and interact with web pages, just like a human would.


## Websurf-AI App
![Desktop 2](src/websurf-app.jpg)

## Websurf-AI Extension
![Desktop 2](src/websurf-extension.jpg)

## In Action
![Desktop 1](src/websurf-demo1.jpg)

---

## Tech Stack

- **Backend:** FastAPI (Python)
- **AI Orchestration:** Pydantic-AI with Gemini 2.5 Flash
- **Browser Automation:** Playwright
- **Database:** SQLAlchemy (PostgreSQL recommended)
- **Authentication:** JWT (OAuth2 password flow)
- **Frontend:** Chrome Extension + Electron Desktop App (JavaScript, HTML, CSS)
- **MCP Server:** Model Context Protocol server for browser automation
- **Storage:** ChromaDB for embeddings, Electron Store for desktop persistence

---

## Features

### Browser Automation
- **Web Navigation:** Open, close, and navigate between tabs
- **Page Interaction:** Click buttons, links, and other elements
- **Scrolling:** Scroll up, down, left, or right
- **Form Filling:** Fill out text boxes, checkboxes, and other form fields
- **Screenshots:** Capture full-page or partial screenshots
- **Data Extraction:** Extract text and other data from web pages

### AI Capabilities
- **File Embeddings:** Attach and process PDF and text files
- **RAG Mode:** Retrieval-Augmented Generation for factual queries
- **Conversational AI:** Natural language chat interface
- **Auto Mode:** Intelligently switches between RAG and conversational responses
- **Persistent Memory:** Maintains conversation context across sessions

### Deployment Options
- **Chrome Extension:** Sidebar interface for in-browser assistance
- **Desktop App:** Standalone Electron application with system tray
- **MCP Server:** Direct integration for AI agent development

---

## Quick Start

### Prerequisites

- **Python 3.12+** for backend
- **Node.js 18+** & npm for MCP server and desktop app
- **PostgreSQL** (or adapt the database URL in your environment)

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/websurf-ai.git
cd websurf-ai/websurf-backend

# Create and activate Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .

# Configure environment
cp example.env .env
# Edit .env with your database credentials and API keys

# Run the FastAPI server
uvicorn app.app:app --reload --host 0.0.0.0 --port 8000
```

### 2. MCP Browser Server

The MCP server manages browser automation with persistent profiles. Each instance creates a new browser window while maintaining shared cookies and history.

```bash
cd websurf-build
node main-launcher.js
```

**What happens:**
- ⚡ Auto-installs Node.js dependencies
- ⚡ Downloads Chromium browser (~150MB, one-time)
- ⚡ Launches browser with extension pre-loaded
- ⚡ Starts MCP server ready for AI connections

**Alternative:**
```bash
cd websurf-mcp
node browser-mcp.js
```

### 3. Frontend Options

#### Option A: Chrome Extension

The extension loads automatically when the MCP server launches. For manual loading:

1. Navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome-extension` directory
5. Click the WebSurf-AI icon to open the sidebar

#### Option B: Desktop Application

```bash
cd websurf-build/electron-app
npm install
npm start
```

**Build installers:**
```bash
npm run build       # Current platform
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

---

## Project Structure

```
websurf-ai/
├── websurf-backend/          # FastAPI backend
│   ├── app/
│   │   ├── app.py           # Application bootstrap
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic & AI agent
│   │   └── schemas/         # Pydantic models
│   └── pyproject.toml       # Python dependencies
│
├── websurf-mcp/             # MCP server
│   ├── browser-mcp.js       # Main MCP server
│   ├── browser-server.js    # Browser automation server
│   └── package.json         # Node.js dependencies
│
├── websurf-build/           # Launchers and build scripts
│   ├── main-launcher.js     # Automated launcher
│   ├── launch.ps1           # PowerShell launcher (Windows)
│   ├── websurf.ico          # Application icon
│   └── electron-app/        # Desktop application
│       ├── main.js          # Electron main process
│       ├── preload.js       # Security bridge
│       └── package.json     # Desktop app config
│
└── chrome-extension/        # Browser extension
    ├── manifest.json        # Extension configuration
    ├── sidepanel.html       # Sidebar interface
    ├── auth.js              # Authentication logic
    ├── chat.js              # Chat functionality
    └── styles.css           # Styling
```

---

## Configuration

### Backend Configuration

Edit `websurf-backend/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/websurf_db

# JWT Authentication
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Model
GOOGLE_API_KEY=your-gemini-api-key

# MCP Server Path (optional)
MCP_BROWSER_SCRIPT_PATH=/path/to/websurf-mcp/browser-mcp.js
```

### Browser Configuration

Edit `websurf-mcp/browser-mcp.js`:

```javascript
// Browser profile location (line 17)
const PROFILE_PATH = "C:\\websurf-browser";

// Default starting URL (line 21)
const DEFAULT_URL = "https://websurf-ai.vercel.app/";

// Custom browser executable (line 59)
executablePath: path.resolve(__dirname, "../websurf-build/chromium/chrome.exe")
```

### Desktop App Configuration

Edit `electron-app/config.js`:

```javascript
const CONFIG = {
  BACKEND_URL: 'http://localhost:8000'  // Your backend URL
};
```

---

## Important API Endpoints

### Authentication
- `POST /signup` - Register a new user
- `POST /token` - Obtain a JWT for authentication
- `GET /users/me/` - Get current user profile
- `PUT /update_profile` - Update user profile

### AI Agent
- `POST /agent/run` - Execute a task with the AI agent
- `GET /agent/collections` - Get available RAG embedding collections

### Document Processing
- `POST /agent/embed` - Create embeddings from documents
- `GET /agent/embeddings` - List all embedding collections

---

## Distribution

### Chrome Extension Distribution

Package the extension:
1. Zip the `chrome-extension` directory
2. Upload to Chrome Web Store or distribute as unpacked extension

### Desktop App Distribution

Build standalone installers:

```bash
cd websurf-build/electron-app
npm install
npm run build
```

**Output:**
- `dist/WebSurf AI Setup.exe` (Windows)
- `dist/WebSurf AI.dmg` (macOS)
- `dist/WebSurf AI.AppImage` (Linux)

### MCP Server Distribution

For developers integrating the MCP server:

```bash
cd websurf-build
npm install
npm run build
```

Creates portable executables that bundle Node.js runtime and dependencies.

---

## Troubleshooting

### Backend Issues

**Database connection errors:**
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database exists: `createdb websurf_db`

**JWT authentication errors:**
- Verify `SECRET_KEY` is set in `.env`
- Token may have expired - login again

**MCP client connection fails:**
- Check `browser-mcp.js` path is correct
- Ensure MCP server is running
- Verify Node.js is installed

### MCP Server Issues

**"Cannot find chromium executable":**
- Browser downloads automatically on first run
- Manual install: `cd websurf-mcp && npx playwright install chromium`

**"Dependencies not installed":**
- Dependencies install automatically on first launch
- Manual install: `cd websurf-mcp && npm install`

**Extension not loading:**
- Verify `chrome-extension/` folder exists
- Check path in `browser-mcp.js` line 18

### Desktop App Issues

**App won't start:**
- Run `npm install` in `electron-app` directory
- Check `config.js` has correct backend URL

**Can't connect to backend:**
- Ensure backend is running on `http://localhost:8000`
- Check CORS settings in FastAPI backend
- Verify firewall isn't blocking connections

**System tray icon not showing:**
- Ensure `icons/icon.png` exists
- Restart the application

### Manual Cleanup

Reset the installation:

```bash
# Remove browser installation
rm -rf websurf-build/chromium

# Remove dependency markers
rm websurf-mcp/.deps-installed
rm websurf-build/.browser-installed

# Clear browser profile
rm -rf C:/websurf-browser  # Windows
rm -rf ~/websurf-browser   # Linux/macOS

# Reinstall dependencies
cd websurf-mcp && npm install
```

---

## Development

### Backend Development

```bash
cd websurf-backend
source venv/bin/activate

# Run with auto-reload
uvicorn app.app:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Format code
black app/
```

### Frontend Development

**Chrome Extension:**
```bash
cd chrome-extension
# Make changes and reload extension in chrome://extensions
```

**Desktop App:**
```bash
cd electron-app
npm run dev  # Run with DevTools open
```

### MCP Server Development

```bash
cd websurf-mcp
node browser-mcp.js  # Test server directly
```

---

## Security Considerations

- **OAuth2 Authentication:** All API endpoints require JWT tokens
- **Sandboxed Browser:** Browser runs in isolated profile
- **CORS Protection:** Backend configured with strict CORS policies
- **Context Isolation:** Desktop app uses Electron's security best practices
- **No Credential Storage:** Passwords are never stored, only hashed
- **Local-First:** All data can be stored locally without external services

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Acknowledgments

- Built with ✨ using FastAPI, Pydantic-AI, and Playwright
- Powered by ⚡ Gemini 2.5 Flash for AI capabilities
- Browser automation via 🏄 Playwright
- Desktop app built with Electron

---

Made with 💖 by Akash