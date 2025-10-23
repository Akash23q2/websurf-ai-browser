# WebSurf AI - Chrome Extension

A beautiful Chrome extension with sidebar authentication for WebSurf AI.

## Features

- 🎨 Modern, gradient-based UI with dark theme
- 🔐 Complete authentication flow (Login & Signup)
- 📱 Responsive sidebar panel
- 💾 Persistent login using Chrome Storage API
- 🔄 Auto-login after signup
- ⚡ Loading states and error handling

## Setup Instructions

### 1. Prerequisites

Make sure your FastAPI backend is running on `http://localhost:8000`

### 2. Install the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder from this project
5. The WebSurf AI extension should now appear in your extensions list

### 3. Use the Extension

1. Click the WebSurf AI icon in your Chrome toolbar
2. The sidebar will open with the login/signup form
3. Create an account or login with existing credentials
4. After successful authentication, you'll see the dashboard

## Configuration

The backend URL is configured in `config.js`:

```javascript
const CONFIG = {
  BACKEND_URL: 'http://localhost:8000'
};
```

To change the backend URL, edit this file accordingly.

## File Structure

```
chrome-extension/
├── manifest.json       # Extension configuration
├── background.js       # Service worker for sidebar management
├── config.js          # Backend URL configuration
├── index.html         # Main sidebar UI
├── styles.css         # Styles for the sidebar
├── auth.js           # Authentication logic
├── icons/            # Extension icons (add your own)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md         # This file
```

## API Endpoints Used

### Signup
- **POST** `/signup`
- **Body**: `{ username, name, email, password, age, gender, location, api_key }`

### Login
- **POST** `/token`
- **Body** (form-urlencoded): `username`, `password`
- **Response**: `{ access_token, token_type }`

## Icon Placeholders

Currently, the extension references icon files that need to be created:
- `icons/icon16.png` (16x16)
- `icons/icon48.png` (48x48)
- `icons/icon128.png` (128x128)

You can create these icons or use placeholder images for testing.

## Troubleshooting

### CORS Issues
Make sure your FastAPI backend has CORS enabled for `chrome-extension://*`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specifically add chrome-extension://
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Backend Connection
Verify your backend is running and accessible at `http://localhost:8000`

## Development

To modify the extension:
1. Make your changes to the files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the WebSurf AI extension card
4. Reload the sidebar to see your changes
