// Chrome API adapter for Electron
// This file creates a compatibility layer to replace chrome.storage API

(function() {
  console.log('Chrome adapter initializing...');
  
  if (window.electronStorage) {
    console.log('Electron storage API detected');
    
    // Create chrome object if it doesn't exist
    if (!window.chrome) {
      window.chrome = {};
    }

    // Create storage object that mimics chrome.storage.local API
    window.chrome.storage = {
      local: {
        // Get items from storage
        get: function(keys, callback) {
          if (callback) {
            // Callback style (used by your auth.js and chat.js)
            window.electronStorage.get(keys).then(callback);
          } else {
            // Promise style (fallback)
            return window.electronStorage.get(keys);
          }
        },
        
        // Set items in storage
        set: function(items, callback) {
          if (callback) {
            window.electronStorage.set(items).then(callback);
          } else {
            return window.electronStorage.set(items);
          }
        },
        
        // Remove items from storage
        remove: function(keys, callback) {
          if (callback) {
            window.electronStorage.remove(keys).then(callback);
          } else {
            return window.electronStorage.remove(keys);
          }
        },
        
        // Clear all storage
        clear: function(callback) {
          if (callback) {
            window.electronStorage.clear().then(callback);
          } else {
            return window.electronStorage.clear();
          }
        }
      }
    };

    // Create runtime object for compatibility (not used but prevents errors)
    window.chrome.runtime = {
      onInstalled: {
        addListener: function() {
          // No-op in Electron
        }
      },
      openOptionsPage: function() {
        console.log('Options page not implemented in Electron version');
      }
    };

    console.log(' Chrome API adapter loaded successfully');
  } else {
    console.error('X Electron storage API not available - preload.js may not be loaded');
  }
})();