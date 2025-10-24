## imports , this indicates start of import section
// small helper utilities used by main scripts

/* storage helpers - wrap chrome.storage */
const storage = {
  async get(key, defaultValue = null) {
    return new Promise((res) => {
      chrome.storage.local.get([key], (obj) => {
        res(obj[key] === undefined ? defaultValue : obj[key]);
      });
    });
  },
  async set(key, value) {
    return new Promise((res) => {
      const obj = {}; obj[key] = value;
      chrome.storage.local.set(obj, () => res());
    });
  },
  async remove(key) {
    return new Promise((res) => chrome.storage.local.remove(key, () => res()));
  }
};

// fetch wrapper - attach token and backend host
async function apiFetch(path, opts = {}) {
  const BACKEND_HOST = await storage.get('BACKEND_HOST', 'http://localhost:8000');
  const token = await storage.get('AUTH_TOKEN', null);
  const url = path.startsWith('http') ? path : (BACKEND_HOST.replace(/\/$/, '') + path);
  const headers = opts.headers || {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (!(opts.body instanceof FormData)) headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  const fetchOpts = {
    ...opts,
    headers
  };
  return fetch(url, fetchOpts).then(async (r) => {
    const text = await r.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch(e) { json = text; }
    if (!r.ok) throw { status: r.status, body: json || text };
    return json;
  });
}

/* small helper to copy text */
async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch(e) { return false; }
}

export { storage, apiFetch, copyToClipboard };
