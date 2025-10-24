## imports , this indicates start of import section
import { storage, apiFetch, copyToClipboard } from './utils.js';

// constants
const TYPING_WORDS = ["typing..","wondering...","searching...","thinking...","pondering...","digging...","fetching...","mulling...","consulting...","scanning..."];

/* methods, indicates start of methods */
// generate short unique ID
function uid() { return Math.random().toString(36).slice(2,9); }

/* UI elements */
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send');
const historyList = document.getElementById('history-list');
const newChatBtn = document.getElementById('new-chat');
const typingEl = document.getElementById('typing-indicator');
const attachBtn = document.getElementById('attach-btn');
const attachModal = document.getElementById('attach-modal');
const fileInput = document.getElementById('file-input');
const pdfUrlInput = document.getElementById('pdf-url');
const bigTextInput = document.getElementById('big-text');
const attachUpload = document.getElementById('attach-upload');
const attachCancel = document.getElementById('attach-cancel');
const modeSelect = document.getElementById('mode-select');
const profileBtn = document.getElementById('profile-btn');
const profileMenu = document.getElementById('profile-menu');
const logoutBtn = document.getElementById('logout');
const updateProfileBtn = document.getElementById('update-profile');
const openOptionsBtn = document.getElementById('open-options');

let state = {
  chats: [], // {id, title, messages: [{role, text}], created_at}
  activeChatId: null,
  pendingAttachment: null // {file|pdf_url|text, collection_name?}
};

/* -- storage keys -- */
const CHAT_KEY = 'WSAI_CHATS';
const TOKEN_KEY = 'AUTH_TOKEN';

/* load saved chats */
async function loadChats() {
  const saved = await storage.get(CHAT_KEY, []);
  state.chats = saved;
  if (!state.activeChatId && state.chats.length) state.activeChatId = state.chats[0].id;
  renderHistory();
  if (state.activeChatId) loadChat(state.activeChatId);
}

/* save chats */
async function saveChats() {
  await storage.set(CHAT_KEY, state.chats);
}

/* render history list */
function renderHistory() {
  historyList.innerHTML = '';
  for (const c of state.chats) {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.textContent = c.title || c.messages?.[0]?.text?.slice(0,40) || 'New chat';
    div.onclick = () => { state.activeChatId = c.id; loadChat(c.id); };
    historyList.appendChild(div);
  }
}

/* load a chat into UI */
function loadChat(id) {
  const chat = state.chats.find(x => x.id === id);
  messagesEl.innerHTML = '';
  if (!chat) return;
  for (const m of chat.messages) {
    appendMessageToUI(m.role, m.text);
  }
}

/* append message visually */
function appendMessageToUI(role, text) {
  const tpl = document.getElementById('message-template').content.cloneNode(true);
  tpl.querySelector('.role').textContent = role === 'user' ? 'You' : 'Agent';
  tpl.querySelector('.content').textContent = text;
  const copyBtn = tpl.querySelector('.copy-btn');
  copyBtn.addEventListener('click', () => copyToClipboard(text));
  messagesEl.appendChild(tpl);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/* push message to active chat model */
function pushMessage(role, text) {
  let chat = state.chats.find(x => x.id === state.activeChatId);
  if (!chat) {
    chat = { id: uid(), title: null, messages: [], created_at: Date.now() };
    state.chats.unshift(chat);
    state.activeChatId = chat.id;
  }
  chat.messages.push({ role, text, t: Date.now() });
  // set title for history if no title
  if (!chat.title && role === 'user') chat.title = text.slice(0,60);
  saveChats();
}

/* new chat */
function newChat() {
  const chat = { id: uid(), title: 'New chat', messages: [], created_at: Date.now() };
  state.chats.unshift(chat);
  state.activeChatId = chat.id;
  renderHistory();
  loadChat(chat.id);
}

/* show typing animation */
let typingTimer = null;
function startTyping() {
  typingEl.textContent = TYPING_WORDS[Math.floor(Math.random()*TYPING_WORDS.length)];
  if (typingTimer) clearInterval(typingTimer);
  typingTimer = setInterval(() => {
    typingEl.textContent = TYPING_WORDS[Math.floor(Math.random()*TYPING_WORDS.length)];
  }, 1600);
}
function stopTyping() {
  if (typingTimer) clearInterval(typingTimer);
  typingEl.textContent = '';
}

/* handle send */
sendBtn.addEventListener('click', submitInput);
inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitInput(); } });

async function submitInput() {
  const text = inputEl.value.trim();
  if (!text && !state.pendingAttachment) return;
  inputEl.value = '';
  appendMessageToUI('user', text || '[attachment]');
  pushMessage('user', text || '[attachment]');

  // prepare agent request
  const selectedMode = modeSelect.value; // auto, rag, talk
  // decide mode: if pendingAttachment present -> rag unless user forced talk
  let mode = 'TALK';
  if (selectedMode === 'rag') mode = 'RAG';
  else if (selectedMode === 'talk') mode = 'TALK';
  else {
    mode = state.pendingAttachment ? 'RAG' : 'TALK';
  }

  // if there's an attachment, upload it to /api/rag/add first
  if (state.pendingAttachment) {
    try {
      startTyping();
      const result = await uploadAttachmentAndUse(state.pendingAttachment);
      // optionally we can show a small system message about ingest result
      appendMessageToUI('agent', `Document ingested: ${result?.message || 'ok'}`);
      pushMessage('agent', `Document ingested: ${result?.message || 'ok'}`);
      // after ingest, ensure mode is RAG
      mode = 'RAG';
    } catch (err) {
      stopTyping();
      appendMessageToUI('agent', 'Failed to upload document: ' + (err?.body?.detail || JSON.stringify(err)));
      pushMessage('agent', 'Failed to upload document: ' + (err?.body?.detail || JSON.stringify(err)));
      state.pendingAttachment = null;
      return;
    }
    state.pendingAttachment = null;
  }

  // call the agent
  try {
    startTyping();
    const requestBody = { mode, query: text || null };
    const res = await apiFetch('/agent/run', { method: 'POST', body: JSON.stringify(requestBody) });
    // API returns {mode, result, summary, available_collections}
    stopTyping();
    appendMessageToUI('agent', res.result || (res.summary || 'No response'));
    pushMessage('agent', res.result || (res.summary || 'No response'));
  } catch (err) {
    stopTyping();
    appendMessageToUI('agent', 'Agent error: ' + (err?.body || JSON.stringify(err)));
    pushMessage('agent', 'Agent error: ' + (err?.body || JSON.stringify(err)));
  }
}

/* upload helper for attachment handling */
async function uploadAttachmentAndUse(att) {
  // att = {type: 'file'|'url'|'text', file?, pdf_url?, text? , collection_name?}
  const form = new FormData();
  form.append('collection_name', att.collection_name || 'learning_notes');
  form.append('description', att.description || 'uploaded from websurf-ai extension');
  if (att.type === 'file' && att.file) form.append('file', att.file);
  else if (att.type === 'url' && att.pdf_url) form.append('pdf_url', att.pdf_url);
  else if (att.type === 'text' && att.text) form.append('text', att.text);
  else throw new Error('invalid attachment');

  // call /api/rag/add (multipart)
  return apiFetch('/api/rag/add', { method: 'POST', body: form });
}

/* attach modal interactions */
attachBtn.addEventListener('click', () => { attachModal.classList.remove('hidden'); });
attachCancel.addEventListener('click', () => { attachModal.classList.add('hidden'); fileInput.value = ''; pdfUrlInput.value = ''; bigTextInput.value = ''; });
attachUpload.addEventListener('click', async () => {
  const file = fileInput.files && fileInput.files[0];
  const pdf_url = pdfUrlInput.value.trim();
  const text = bigTextInput.value.trim();
  if (file) {
    state.pendingAttachment = { type:'file', file };
  } else if (pdf_url) {
    state.pendingAttachment = { type:'url', pdf_url };
  } else if (text) {
    state.pendingAttachment = { type:'text', text };
  } else {
    alert('Select a file or enter a URL/text');
    return;
  }
  attachModal.classList.add('hidden');
  // notify user in chat
  appendMessageToUI('user', '[attached document]');
  pushMessage('user', '[attached document]');
});

/* new chat button */
newChatBtn.addEventListener('click', () => {
  newChat();
  renderHistory();
});

/* profile menu */
profileBtn.addEventListener('click', async () => {
  profileMenu.classList.toggle('hidden');
  if (!profileMenu.classList.contains('hidden')) {
    // load user info
    try {
      const user = await apiFetch('/users/me/');
      document.getElementById('username').textContent = user.username || user.name || '—';
      document.getElementById('email').textContent = user.email || '';
    } catch(e) {
      document.getElementById('username').textContent = 'Not signed in';
      document.getElementById('email').textContent = '';
    }
  }
});
logoutBtn.addEventListener('click', async () => {
  await storage.remove(TOKEN_KEY);
  await storage.remove('AUTH_USER');
  profileMenu.classList.add('hidden');
  alert('Logged out');
});
updateProfileBtn.addEventListener('click', async () => {
  // open update page (simple prompt-driven flow)
  try {
    const user = await apiFetch('/users/me/');
    const name = prompt('Name', user.name || '');
    const age = parseInt(prompt('Age', user.age || '18'), 10);
    const payload = { ...user, name, age };
    const updated = await apiFetch('/update_profile', { method: 'PUT', body: JSON.stringify(payload) });
    alert('Profile updated');
  } catch (err) {
    alert('Update failed: ' + JSON.stringify(err));
  }
});
openOptionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

/* initial load */
(async function init() {
  // load chats
  await loadChats();

  // if no chats present, create a starter
  if (!state.chats.length) newChat();

  // show token info (if any)
  const token = await storage.get('AUTH_TOKEN', null);
  if (!token) {
    // ask user to signup/login via options flow (quick minimal prompts)
    if (confirm('You are not signed in. Do you want to open sign-in page?')) {
      chrome.runtime.openOptionsPage();
    }
  }

})();
