// Chat functionality for WebSurf AI

let currentAttachment = null;
let attachmentData = null;

// Improved markdown to HTML converter
function parseMarkdown(text) {
  if (!text) return '';
  
  let html = text;
  
  // Escape HTML first
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Code blocks (```language or ```)
  html = html.replace(/```([\w]*)?\n?([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });
  
  // Inline code (`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Bold (**text**)
  html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
  
  // Italic (*text*)
  html = html.replace(/(?<!\*)\*([^\*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Headers (must be at start of line)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Unordered lists (- or *)
  html = html.replace(/((?:^[\*\-]\s+.+$\n?)+)/gm, (match) => {
    const items = match.split('\n').filter(line => line.trim()).map(line => {
      return '<li>' + line.replace(/^[\*\-]\s+/, '') + '</li>';
    }).join('');
    return '<ul>' + items + '</ul>';
  });
  
  // Ordered lists (1. 2. etc)
  html = html.replace(/((?:^\d+\.\s+.+$\n?)+)/gm, (match) => {
    const items = match.split('\n').filter(line => line.trim()).map(line => {
      return '<li>' + line.replace(/^\d+\.\s+/, '') + '</li>';
    }).join('');
    return '<ol>' + items + '</ol>';
  });
  
  // Paragraphs (double line break)
  html = html.split('\n\n').map(para => {
    para = para.trim();
    // Don't wrap if already a block element
    if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<ol') || para.startsWith('<pre')) {
      return para;
    }
    // Single line breaks within paragraphs
    para = para.replace(/\n/g, '<br>');
    return para ? '<p>' + para + '</p>' : '';
  }).join('');
  
  return html;
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', initChat);

function initChat() {
  // DOM Elements
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const attachmentMenu = document.getElementById('attachmentMenu');
  const attachmentPreview = document.getElementById('attachmentPreview');
  const removeAttachmentBtn = document.getElementById('removeAttachment');
  const fileInput = document.getElementById('fileInput');
  const chatMessages = document.getElementById('chatMessages');
  const agentMode = document.getElementById('agentMode');

  if (!chatInput || !sendBtn) return; // Not on chat page

  // Auto-resize textarea
  chatInput.addEventListener('input', (e) => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    
    // Enable/disable send button
    sendBtn.disabled = !chatInput.value.trim();
    
    // Check if user typed '@' to show attachment menu
    const value = e.target.value;
    if (value.endsWith('@')) {
      // Remove the '@' from input
      chatInput.value = value.slice(0, -1);
      // Show attachment menu
      const rect = chatInput.getBoundingClientRect();
      attachmentMenu.style.display = 'block';
      attachmentMenu.style.left = rect.left + 'px';
    }
  });

  // Send message on Enter (Shift+Enter for new line)
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) {
        sendMessage();
      }
    }
  });

  // Send button click
  sendBtn.addEventListener('click', sendMessage);

  // Close attachment menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!attachmentMenu.contains(e.target) && e.target !== chatInput) {
      attachmentMenu.style.display = 'none';
    }
  });

  // Attachment options
  document.querySelectorAll('.attachment-option').forEach(option => {
    option.addEventListener('click', () => {
      const type = option.dataset.type;
      attachmentMenu.style.display = 'none';
      handleAttachmentType(type);
    });
  });

  // Remove attachment
  removeAttachmentBtn.addEventListener('click', clearAttachment);

  // File input
  fileInput.addEventListener('change', handleFileSelect);
}

// Handle different attachment types
async function handleAttachmentType(type) {
  switch (type) {
    case 'text':
      showTextInputModal();
      break;
    case 'url':
      showUrlInputModal();
      break;
    case 'file':
      document.getElementById('fileInput').click();
      break;
  }
}

// Show text input modal
function showTextInputModal() {
  const text = prompt('Enter your text content:');
  if (text && text.trim()) {
    currentAttachment = {
      type: 'text',
      content: text.trim(),
      name: 'Text Content'
    };
    showAttachmentPreview('Text Content', 'TEXT');
  }
}

// Show URL input modal
function showUrlInputModal() {
  const url = prompt('Enter PDF URL:');
  if (url && url.trim()) {
    currentAttachment = {
      type: 'url',
      content: url.trim(),
      name: url.split('/').pop() || 'PDF URL'
    };
    showAttachmentPreview(currentAttachment.name, 'URL');
  }
}

// Handle file selection
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    if (file.type === 'application/pdf') {
      currentAttachment = {
        type: 'file',
        content: file,
        name: file.name
      };
      showAttachmentPreview(file.name, 'PDF');
    } else {
      alert('Please select a PDF file');
    }
  }
  e.target.value = ''; // Reset input
}

// Show attachment preview
function showAttachmentPreview(name, type) {
  const preview = document.getElementById('attachmentPreview');
  const nameEl = document.getElementById('attachmentName');
  const typeEl = document.getElementById('attachmentType');
  
  nameEl.textContent = name;
  typeEl.textContent = type;
  preview.style.display = 'flex';

  // Auto-switch to RAG mode if attachment is present
  const modeSelect = document.getElementById('agentMode');
  if (modeSelect.value === 'auto') {
    modeSelect.value = 'rag';
  }
}

// Clear attachment
function clearAttachment() {
  currentAttachment = null;
  document.getElementById('attachmentPreview').style.display = 'none';
  
  // Reset mode to auto if it was RAG
  const modeSelect = document.getElementById('agentMode');
  if (modeSelect.value === 'rag') {
    modeSelect.value = 'auto';
  }
}

// Send message
async function sendMessage() {
  const chatInput = document.getElementById('chatInput');
  const message = chatInput.value.trim();
  
  if (!message) return;

  // Clear input
  chatInput.value = '';
  chatInput.style.height = 'auto';
  document.getElementById('sendBtn').disabled = true;

  // Remove welcome message if present
  const welcomeMsg = document.querySelector('.welcome-message');
  if (welcomeMsg) {
    welcomeMsg.remove();
  }

  // Add user message
  addMessage(message, 'user');

  // Show typing indicator
  const typingId = showTypingIndicator();

  try {
    // Upload attachment if present
    if (currentAttachment) {
      await uploadAttachment();
    }

    // Get mode
    const mode = getSelectedMode();

    // Send to agent
    const response = await runAgent(message, mode);

    // Remove typing indicator
    removeTypingIndicator(typingId);

    // Add bot response
    console.log('Bot response result:', response.result);
    if (response.result) {
      addMessage(response.result, 'bot');
    } else {
      addMessage('No response from AI', 'bot', true);
    }

    // Clear attachment after successful send
    clearAttachment();

  } catch (error) {
    removeTypingIndicator(typingId);
    addMessage('Sorry, I encountered an error. Please try again.', 'bot', true);
    console.error('Error:', error);
  }
}

// Get selected mode
function getSelectedMode() {
  const modeSelect = document.getElementById('agentMode');
  let mode = modeSelect.value;
  
  // Auto mode logic
  if (mode === 'auto') {
    mode = currentAttachment ? 'rag' : 'talk';
  }
  
  return mode;
}

// Upload attachment to RAG endpoint
async function uploadAttachment() {
  if (!currentAttachment) return;

  const { accessToken } = await chrome.storage.local.get(['accessToken']);
  const formData = new FormData();
  
  formData.append('collection_name', 'learning_notes');
  formData.append('description', 'User uploaded content');

  switch (currentAttachment.type) {
    case 'text':
      formData.append('text', currentAttachment.content);
      break;
    case 'url':
      formData.append('pdf_url', currentAttachment.content);
      break;
    case 'file':
      formData.append('file', currentAttachment.content);
      break;
  }

  const response = await fetch(`${CONFIG.BACKEND_URL}/api/rag/add`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload attachment');
  }

  return await response.json();
}

// Run agent
async function runAgent(query, mode) {
  const { accessToken } = await chrome.storage.local.get(['accessToken']);
  
  console.log('Sending request to agent:', { mode, query, hasToken: !!accessToken });

  const requestBody = {
    mode: mode,
    query: query
  };
  
  console.log('Request body:', requestBody);

  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/agent/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        throw new Error(`Server error: ${response.status}`);
      }
      throw new Error(error.detail || 'Failed to get response');
    }

    const data = await response.json();
    console.log('Success response:', data);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Add message to chat
function addMessage(text, sender, isError = false) {
  const chatMessages = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  messageDiv.style.opacity = '0';
  messageDiv.style.transform = 'translateY(10px)';

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  
  if (sender === 'user') {
    // Get user's full name from storage and show first letter
    chrome.storage.local.get(['userName', 'username'], (data) => {
      const name = data.userName || data.username || 'U';
      const firstLetter = name.charAt(0).toUpperCase();
      avatar.textContent = firstLetter;
    });
  } else {
    // AI bot - use sparkle emoji
    avatar.textContent = '✨';
  }

  const content = document.createElement('div');
  content.className = 'message-content';
  
  // Render markdown for bot messages, plain text for user
  if (sender === 'bot') {
    content.innerHTML = parseMarkdown(text);
  } else {
    content.textContent = text;
  }
  
  if (isError) {
    content.style.background = 'rgba(239, 68, 68, 0.1)';
    content.style.borderLeft = '3px solid var(--error)';
  }

  // Create copy button
  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.title = 'Copy message';
  copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        copyBtn.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  });
  
  content.appendChild(copyBtn);

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  chatMessages.appendChild(messageDiv);

  // Trigger animation
  requestAnimationFrame(() => {
    messageDiv.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    messageDiv.style.opacity = '1';
    messageDiv.style.transform = 'translateY(0)';
  });

  // Smooth scroll to bottom
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: 'smooth'
  });
}

// Show typing indicator with dynamic text
function showTypingIndicator() {
  const chatMessages = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message bot';
  messageDiv.id = `typing-${Date.now()}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = '✨';

  const content = document.createElement('div');
  content.className = 'message-content message-typing';
  
  const typingText = document.createElement('span');
  typingText.className = 'typing-text';
  typingText.textContent = 'typing...';
  
  content.appendChild(typingText);

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  chatMessages.appendChild(messageDiv);

  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Rotate through different phrases
  const phrases = ['typing...', 'thinking...', 'wondering...', 'guessing...', 'evaluating...', 'processing...', 'analyzing...', 'surfing...'];
  let phraseIndex = 0;
  
  const interval = setInterval(() => {
    if (document.getElementById(messageDiv.id)) {
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typingText.textContent = phrases[phraseIndex];
    } else {
      clearInterval(interval);
    }
  }, 1500);
  
  // Store interval ID for cleanup
  messageDiv.dataset.intervalId = interval;

  return messageDiv.id;
}

// Remove typing indicator
function removeTypingIndicator(id) {
  const indicator = document.getElementById(id);
  if (indicator) {
    indicator.remove();
  }
}
