# WebSurf AI - Electron Desktop App Setup Guide

## 📁 Project Structure

Create a new folder called `websurf-ai-desktop` with this structure:

```
electron-app/
├── main.js                 (Electron main process)
├── preload.js             (Preload script)
├── chrome-adapter.js      (Chrome API compatibility)
├── package.json           (Dependencies & build config)
├── index.html             (Modified from chrome-extension)
├── auth.js                (Same as chrome-extension)
├── chat.js                (Same as chrome-extension)
├── config.js              (Same as chrome-extension)
├── styles.css             (Same as chrome-extension)
└── icons/
    ├── icon.png           (512x512 PNG for Linux)
    ├── icon.ico           (Windows icon)
    └── icon.icns          (macOS icon)
```

## 🚀 Setup Steps

### 1. Create the project folder

```bash
mkdir websurf-ai-desktop
cd websurf-ai-desktop
```

### 2. Copy files from chrome-extension

Copy these files **as-is** from your chrome-extension folder:
- `auth.js`
- `chat.js`
- `config.js`
- `styles.css`

### 3. Create new Electron files

Create the following new files with the code from the artifacts I provided:
- `main.js` - Main Electron process
- `preload.js` - Preload script for security
- `chrome-adapter.js` - Chrome API compatibility layer
- `package.json` - Dependencies and build configuration

```

Remove or comment out the `background.js` script reference (not needed in Electron).

### 5. Create icons folder

Create an `icons` folder and add your icon images:
- `icon.png` (512x512 pixels) - for Linux and fallback
- `icon.ico` (256x256 pixels) - for Windows
- `icon.icns` - for macOS

**Tip**: You can use online converters to create .ico and .icns from PNG files.

### 6. Install dependencies

```bash
npm install
```

This will install:
- `electron` - The Electron framework
- `electron-builder` - For building installers
- `electron-store` - For persistent storage

### 7. Run the app in development

```bash
npm start
```

Or with DevTools open:
```bash
npm run dev
```

## 📦 Building Installers

### Build for Windows (creates .exe installer)
```bash
npm run build:win
```

### Build for macOS (creates .dmg)
```bash
npm run build:mac
```

### Build for Linux (creates AppImage and .deb)
```bash
npm run build:linux
```

### Build for all platforms
```bash
npm run build
```

The installers will be created in the `dist` folder.

## ✨ Features

### ✅ What's Included

- **System Tray Icon**: App minimizes to system tray instead of closing
- **Persistent Storage**: Uses `electron-store` instead of Chrome's storage API
- **Native Window**: Proper desktop app window with minimize/maximize
- **Auto-start Support**: Can be configured to start with system
- **Cross-platform**: Works on Windows, macOS, and Linux

### 🎯 Key Changes from Chrome Extension

1. **Storage API**: Automatically converted from `chrome.storage` to Electron storage
2. **No Background Service Worker**: Main process handles background tasks
3. **System Tray**: Click tray icon to show/hide the app
4. **Window Management**: App hides on close, quit from tray menu

## 🔧 Configuration

### Change Backend URL

Edit `config.js`:
```javascript
const CONFIG = {
  BACKEND_URL: 'http://localhost:8000'  // Change to your backend URL
};
```

### Enable Auto-start

Add to `main.js` after `app.whenReady()`:
```javascript
app.setLoginItemSettings({
  openAtLogin: true
});
```

### Change Window Size

Edit `main.js` in the `createWindow()` function:
```javascript
width: 420,   // Change width
height: 800,  // Change height
```

## 🐛 Troubleshooting

### Issue: "electron-store" not found
**Solution**: Run `npm install` again

### Issue: Icons not showing
**Solution**: Make sure icon files exist in `icons/` folder

### Issue: Can't connect to backend
**Solution**: 
1. Check `config.js` has correct backend URL
2. Ensure backend is running and accessible
3. Check CORS settings on your FastAPI backend

### Issue: Build fails
**Solution**: 
1. Make sure all files are in the correct locations
2. Check `package.json` file paths are correct
3. Install build tools for your platform:
   - **Windows**: Run `npm install --global windows-build-tools`
   - **macOS**: Install Xcode Command Line Tools
   - **Linux**: Install build-essential

## 📝 Notes

- The app stores data in the system's app data directory
- Clear storage: Delete the app data folder or use "Clear All" in settings
- The first time you run the app, you'll need to login/signup again
- All your existing API calls work exactly the same way

# 🏄 WebSurf AI Desktop App

A standalone desktop application converted from Chrome Extension. Works on **Windows**, **macOS**, and **Linux**.

## ✨ What's Changed?

| Feature | Chrome Extension | Desktop App |
|---------|-----------------|-------------|
| **Platform** | Chrome browser only | Standalone app |
| **Storage** | chrome.storage API | electron-store (persistent) |
| **Window** | Browser sidebar | Native app window |
| **System Tray** | ❌ No | ✅ Yes - minimize to tray |
| **Auto-start** | ❌ No | ✅ Optional |
| **Background** | Service worker | Electron main process |

## 📁 Complete File Structure

```
websurf-ai-desktop/
│
├── package.json              ← Dependencies & build config (FROM ARTIFACTS)
├── main.js                   ← Electron main process (FROM ARTIFACTS)
├── preload.js                ← Security bridge (FROM ARTIFACTS)
├── chrome-adapter.js         ← Chrome API compatibility (FROM ARTIFACTS)
│
├── index.html                ← Modified HTML (FROM ARTIFACTS)
├── auth.js                   ← Same as chrome-extension (COPY AS-IS)
├── chat.js                   ← Same as chrome-extension (COPY AS-IS)
├── config.js                 ← Same as chrome-extension (COPY AS-IS)
├── styles.css                ← Same as chrome-extension (COPY AS-IS)
│
└── icons/
    ├── icon.png              ← 512x512 PNG icon
    ├── icon.ico              ← Windows icon
    └── icon.icns             ← macOS icon
```

## 🚀 Installation Steps

### Step 1: Create Project Folder

```bash
mkdir websurf-ai-desktop
cd websurf-ai-desktop
```

### Step 2: Copy Existing Files

Copy these 4 files **exactly as they are** from your `chrome-extension` folder:

```bash
# Copy these files:
✅ auth.js
✅ chat.js
✅ config.js
✅ styles.css
```

### Step 3: Create New Files

Create these **new files** using the code from the artifacts I provided:

1. **package.json** - Copy from "package.json for Electron" artifact
2. **main.js** - Copy from "Electron Main Process" artifact
3. **preload.js** - Copy from "Electron Preload Script" artifact
4. **chrome-adapter.js** - Copy from "Chrome API Adapter" artifact
5. **index.html** - Copy from "Modified index.html" artifact

### Step 4: Create Icons Folder

```bash
mkdir icons
```

Add your icon files:
- **icon.png** (512x512 pixels) - Required for all platforms
- **icon.ico** (256x256 pixels) - For Windows
- **icon.icns** - For macOS

**Don't have icons?** Create them:
1. Use any PNG image (your logo/brand)
2. Convert to .ico using: https://convertio.co/png-ico/
3. Convert to .icns using: https://cloudconvert.com/png-to-icns

### Step 5: Install Dependencies

```bash
npm install
```

This installs:
- `electron` - The framework
- `electron-store` - Persistent storage
- `electron-builder` - Build installers

### Step 6: Run the App

```bash
npm start
```

🎉 Your app should open!

## 🔧 Configuration

### Change Backend URL

Edit `config.js`:
```javascript
const CONFIG = {
  BACKEND_URL: 'http://localhost:8000'  // ← Change this
};
```

### Enable Auto-Start on System Boot

Add to `main.js` after `app.whenReady()`:
```javascript
app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: true  // Start minimized to tray
});
```

### Customize Window Size

Edit `main.js` in `createWindow()`:
```javascript
width: 420,    // Change width
height: 800,   // Change height
minWidth: 380, // Minimum width
minHeight: 600 // Minimum height
```

## 📦 Building Installers

### Build for Your Current Platform

```bash
npm run build
```

### Build for Specific Platforms

```bash
# Windows (creates .exe installer)
npm run build:win

# macOS (creates .dmg)
npm run build:mac

# Linux (creates AppImage and .deb)
npm run build:linux
```

### Output Location

All installers are created in the **`dist/`** folder:

```
dist/
├── WebSurf AI Setup 1.0.0.exe     (Windows)
├── WebSurf AI-1.0.0.dmg           (macOS)
├── WebSurf AI-1.0.0.AppImage      (Linux)
└── websurf-ai_1.0.0_amd64.deb     (Linux Debian)
```

## 🎯 Features

### ✅ What Works

- ✅ All authentication (login/signup)
- ✅ Chat functionality
- ✅ File attachments (PDF, text, URLs)
- ✅ RAG mode with documents
- ✅ Settings and profile updates
- ✅ System tray integration
- ✅ Persistent storage (survives app restarts)
- ✅ All API calls to your backend
- ✅ Markdown rendering in chat
- ✅ Copy message functionality

### 🆕 New Desktop Features

- **System Tray**: App minimizes to tray instead of closing
- **Quick Access**: Click tray icon to show/hide window
- **Native Feel**: Proper desktop window with native controls
- **Auto-start**: Optional boot with system
- **Cross-platform**: Works on Windows, Mac, Linux

## 🐛 Troubleshooting

### "Cannot find module 'electron'"

```bash
# Solution:
npm install
```

### Backend connection fails

**Check:**
1. Is your FastAPI backend running on `http://localhost:8000`?
2. Is the URL correct in `config.js`?
3. Check backend CORS settings:

```python
# In your FastAPI backend:
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow Electron app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Icons not showing

- Make sure icon files exist in `icons/` folder
- Check file names match exactly: `icon.png`, `icon.ico`, `icon.icns`
- Restart the app after adding icons

### Build fails

**Windows:**
```bash
npm install --global windows-build-tools
```

**macOS:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt-get install build-essential
```

### App won't close

- Use the **Quit** button in the system tray menu
- The X button just minimizes to tray (by design)

### Clear stored data

Delete the app data folder:
- **Windows**: `%APPDATA%\websurf-ai`
- **macOS**: `~/Library/Application Support/websurf-ai`
- **Linux**: `~/.config/websurf-ai`

## 🔐 Security Notes

- Uses `contextIsolation: true` for security
- No `nodeIntegration` in renderer process
- All Chrome APIs are safely bridged via preload script
- Storage is encrypted by electron-store

## 📊 Storage Location

Your data is stored in:

| Platform | Location |
|----------|----------|
| Windows | `C:\Users\<username>\AppData\Roaming\websurf-ai` |
| macOS | `/Users/<username>/Library/Application Support/websurf-ai` |
| Linux | `/home/<username>/.config/websurf-ai` |

## 📝 Development and Production

### Development (with DevTools)
```bash
npm run dev
```

### Production
```bash
npm start
```

## ❓ Common Questions

**Q: Can I run both the extension and desktop app?**  
A: Yes! They use separate storage, so they won't conflict.

Run `npm start` to launch it. 🚀

## 🎉 You're Done!

Your Chrome extension is now a standalone desktop app! Run `npm start` to test it.