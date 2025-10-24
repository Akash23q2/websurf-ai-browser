import { storage, apiFetch } from './utils.js';

const backendInput = document.getElementById('backend-host');
const signupBtn = document.getElementById('signup');
const loginBtn = document.getElementById('login');
const logoutBtn = document.getElementById('logout');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authStatus = document.getElementById('auth-status');
const clearHistoryBtn = document.getElementById('clear-history');

async function initOptions() {
  const host = await storage.get('BACKEND_HOST', 'http://localhost:8000');
  backendInput.value = host;
  const token = await storage.get('AUTH_TOKEN', null);
  authStatus.textContent = token ? 'Signed in' : 'Not signed in';
}

backendInput.addEventListener('change', async () => {
  await storage.set('BACKEND_HOST', backendInput.value.trim() || 'http://localhost:8000');
  alert('Saved BACKEND_HOST');
});

signupBtn.addEventListener('click', async () => {
  const payload = {
    username: usernameInput.value.trim(),
    name: usernameInput.value.trim(),
    age: 20,
    email: usernameInput.value.trim() + '@example.com',
    password: passwordInput.value
  };
  try {
    await apiFetch('/signup', { method: 'POST', body: JSON.stringify(payload) });
    alert('Signup ok. Now login.');
  } catch (e) { alert('Signup failed: ' + JSON.stringify(e)); }
});

loginBtn.addEventListener('click', async () => {
  const b = new URLSearchParams();
  b.append('username', usernameInput.value);
  b.append('password', passwordInput.value);
  try {
    const token = await apiFetch('/token', { method: 'POST', body: b.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }});
    if (token && token.access_token) {
      await storage.set('AUTH_TOKEN', token.access_token);
      authStatus.textContent = 'Signed in';
      alert('Logged in');
    } else {
      alert('Login response invalid');
    }
  } catch (err) {
    alert('Login failed: ' + JSON.stringify(err));
  }
});

logoutBtn.addEventListener('click', async () => {
  await storage.remove('AUTH_TOKEN');
  authStatus.textContent = 'Not signed in';
  alert('Logged out');
});

clearHistoryBtn.addEventListener('click', async () => {
  await storage.set('WSAI_CHATS', []);
  alert('Chat history cleared');
});

initOptions();
