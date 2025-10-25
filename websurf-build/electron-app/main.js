const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize electron-store for persistent storage
const store = new Store();
let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 800,
    minWidth: 380,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#1a1a1a',
    frame: true, // Show window controls (minimize, maximize, close)
    title: 'WebSurf AI',
    // Only set icon if file exists
    ...(require('fs').existsSync(path.join(__dirname, 'icons/icon.png')) && {
      icon: path.join(__dirname, 'icons/icon.png')
    })
  });

  // Remove the menu bar completely
  Menu.setApplicationMenu(null);

  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icons/icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show WebSurf AI',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('WebSurf AI');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

// Storage IPC handlers
ipcMain.handle('storage:get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('storage:set', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('storage:remove', (event, key) => {
  store.delete(key);
  return true;
});

ipcMain.handle('storage:clear', () => {
  store.clear();
  return true;
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});