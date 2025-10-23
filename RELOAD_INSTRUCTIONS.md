# How to See CSS Changes in Chrome Extension

## The Issue
Chrome extensions aggressively cache CSS files. Your changes ARE in the code but the browser is showing old cached styles.

## Solution - Force Reload the Extension

### Method 1: Reload Extension (Recommended)
1. Go to `chrome://extensions/`
2. Find "WebSurf AI"
3. Click the **refresh/reload icon** (circular arrow)
4. Close and reopen the extension sidebar
5. You should now see the subtle user message colors

### Method 2: Full Reinstall
1. Go to `chrome://extensions/`
2. Remove "WebSurf AI" extension
3. Click "Load unpacked" again
4. Select the chrome-extension folder
5. Open the extension

### Method 3: Hard Refresh
1. Open the extension sidebar
2. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
3. Or right-click → Inspect → Right-click reload button → "Empty Cache and Hard Reload"

## What Changed

### User Messages (The "hi" bubble)
- **Old**: Bright solid mustard/gold background
- **New**: Subtle 12% opacity tint - barely visible warm glow
- **Text**: Light color (readable on dark background)

### User Avatar (The "T" circle)
- **Old**: Bright gradient background
- **New**: Subtle 20% opacity mustard tint

### Changes Made in CSS:
```css
.message.user .message-content {
  background: rgba(232, 185, 35, 0.12) !important;  /* Very subtle! */
  color: var(--text-primary) !important;            /* Light text */
  border: 1px solid rgba(232, 185, 35, 0.25);      /* Subtle border */
}

.message.user .message-avatar {
  background: rgba(232, 185, 35, 0.2);              /* Subtle avatar */
}
```

## If Still Not Working

1. Check the browser console for errors
2. Verify the styles.css file was saved
3. Try closing ALL Chrome windows and reopening
4. Check if there are any inline styles overriding (inspect element)

The changes are DEFINITELY in the code - it's just a caching issue! 🎨
