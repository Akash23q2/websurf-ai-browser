const { contextBridge, ipcRenderer } = require('electron');

// Expose storage API to renderer process (mimics chrome.storage API)
contextBridge.exposeInMainWorld('electronStorage', {
  get: async (keys) => {
    if (typeof keys === 'string') {
      const value = await ipcRenderer.invoke('storage:get', keys);
      return { [keys]: value };
    } else if (Array.isArray(keys)) {
      const result = {};
      for (const key of keys) {
        result[key] = await ipcRenderer.invoke('storage:get', key);
      }
      return result;
    }
    return {};
  },
  
  set: async (items) => {
    for (const [key, value] of Object.entries(items)) {
      await ipcRenderer.invoke('storage:set', key, value);
    }
    return true;
  },
  
  remove: async (keys) => {
    if (typeof keys === 'string') {
      await ipcRenderer.invoke('storage:remove', keys);
    } else if (Array.isArray(keys)) {
      for (const key of keys) {
        await ipcRenderer.invoke('storage:remove', key);
      }
    }
    return true;
  },
  
  clear: async () => {
    await ipcRenderer.invoke('storage:clear');
    return true;
  }
});

// Expose platform info
contextBridge.exposeInMainWorld('electronApp', {
  platform: process.platform,
  isElectron: true
});