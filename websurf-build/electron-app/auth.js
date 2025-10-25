// Authentication handling for WebSurf AI

const API_BASE_URL = CONFIG.BACKEND_URL;

// DOM Elements
const authContainer = document.getElementById('authContainer');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const dashboard = document.getElementById('dashboard');

const loginFormElement = document.getElementById('loginFormElement');
const signupFormElement = document.getElementById('signupFormElement');

const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');

const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');

const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const userAvatar = document.getElementById('userAvatar');
const menuBtn = document.getElementById('menuBtn');
const menuDropdown = document.getElementById('menuDropdown');
const menuSettingsBtn = document.getElementById('menuSettingsBtn');
const menuLogoutBtn = document.getElementById('menuLogoutBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const updateProfileBtn = document.getElementById('updateProfileBtn');

// Menu button - toggle dropdown
if (menuBtn) {
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = menuDropdown.style.display === 'block';
    menuDropdown.style.display = isVisible ? 'none' : 'block';
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (menuDropdown && !menuDropdown.contains(e.target) && e.target !== menuBtn) {
      menuDropdown.style.display = 'none';
    }
  });

  // Settings menu item
  menuSettingsBtn.addEventListener('click', async () => {
    menuDropdown.style.display = 'none';
    await openSettings();
  });

  // Logout menu item
  menuLogoutBtn.addEventListener('click', () => {
    menuDropdown.style.display = 'none';
    if (confirm('Are you sure you want to logout?')) {
      handleLogout();
    }
  });

  // Close settings
  closeSettings.addEventListener('click', () => {
    settingsModal.style.display = 'none';
  });

  // Close modal on outside click
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.style.display = 'none';
    }
  });

  // Update profile
  updateProfileBtn.addEventListener('click', async () => {
    await updateUserProfile();
  });
}

// Toggle between login and signup forms with smooth transition
showSignupLink.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.style.opacity = '0';
  setTimeout(() => {
    loginForm.classList.remove('active');
    signupForm.classList.add('active');
    signupForm.style.opacity = '1';
    clearError(loginError);
  }, 200);
});

showLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  signupForm.style.opacity = '0';
  setTimeout(() => {
    signupForm.classList.remove('active');
    loginForm.classList.add('active');
    loginForm.style.opacity = '1';
    clearError(signupError);
  }, 200);
});

// Helper Functions
function showError(element, message) {
  element.textContent = message;
  element.classList.add('show');
}

function clearError(element) {
  element.textContent = '';
  element.classList.remove('show');
}

function setLoading(button, isLoading) {
  if (isLoading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

// Login Handler
loginFormElement.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError(loginError);
  setLoading(loginBtn, true);

  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    // Create form data for token endpoint
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Login failed');
    }

    // Store token and user info
    await chrome.storage.local.set({
      accessToken: data.access_token,
      tokenType: data.token_type,
      username: username
    });

    // Show dashboard and fetch user data
    await showDashboard({ username }, data.access_token);

  } catch (error) {
    showError(loginError, error.message || 'Failed to login. Please try again.');
  } finally {
    setLoading(loginBtn, false);
  }
});

// Signup Handler
signupFormElement.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError(signupError);
  setLoading(signupBtn, true);

  const userData = {
    username: document.getElementById('signupUsername').value.trim(),
    name: document.getElementById('signupName').value.trim(),
    email: document.getElementById('signupEmail').value.trim(),
    password: document.getElementById('signupPassword').value,
    age: parseInt(document.getElementById('signupAge').value),
    gender: document.getElementById('signupGender').value,
    location: document.getElementById('signupLocation').value.trim(),
    api_key: document.getElementById('signupApiKey').value.trim() || ''
  };

  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.detail 
        ? (Array.isArray(data.detail) ? data.detail.map(e => e.msg).join(', ') : data.detail)
        : 'Signup failed';
      throw new Error(errorMsg);
    }

    // Auto-login after successful signup
    document.getElementById('loginUsername').value = userData.username;
    document.getElementById('loginPassword').value = userData.password;
    
    // Switch to login form and show success
    signupForm.classList.remove('active');
    loginForm.classList.add('active');
    
    // Auto-submit login form
    setTimeout(() => {
      loginFormElement.dispatchEvent(new Event('submit'));
    }, 500);

  } catch (error) {
    showError(signupError, error.message || 'Failed to create account. Please try again.');
  } finally {
    setLoading(signupBtn, false);
  }
});

// Logout Handler
async function handleLogout() {
  await chrome.storage.local.clear();
  settingsModal.style.display = 'none';
  showAuth();
}

// Fetch user data from API
async function fetchUserData(accessToken) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

// Show Dashboard
async function showDashboard(user, accessToken = null) {
  authContainer.style.display = 'none';
  dashboard.style.display = 'block';
  
  // Show menu button
  if (menuBtn) {
    menuBtn.classList.remove('hidden');
  }
  
  // If accessToken is provided, fetch full user data
  if (accessToken) {
    const userData = await fetchUserData(accessToken);
    if (userData) {
      // Store user data in storage
      await chrome.storage.local.set({
        userName: userData.name,
        userAge: userData.age,
        userGender: userData.gender,
        userLocation: userData.location
      });
      
      // Update UI
      updateUserUI(userData);
      return;
    }
  }
  
  // Fallback to stored data or provided user object
  updateUserUI(user);
}

// Update user UI elements
function updateUserUI(user) {
  document.getElementById('userName').textContent = user.name || user.username;
  
  const userAvatar = document.getElementById('userAvatar');
  const firstLetter = (user.name || user.username).charAt(0).toUpperCase();
  userAvatar.textContent = firstLetter;
}

// Show Auth Forms
function showAuth() {
  authContainer.style.display = 'flex';
  dashboard.style.display = 'none';
  loginForm.classList.add('active');
  signupForm.classList.remove('active');
  
  // Hide menu button
  if (menuBtn) {
    menuBtn.classList.add('hidden');
  }
  
  // Clear forms
  loginFormElement.reset();
  signupFormElement.reset();
  clearError(loginError);
  clearError(signupError);
}

// Check if user is already logged in
async function checkAuth() {
  const data = await chrome.storage.local.get(['accessToken', 'username', 'userName', 'userAge', 'userGender', 'userLocation']);
  
  if (data.accessToken && data.username) {
    // If we have stored user data, use it; otherwise fetch it
    if (data.userName) {
      await showDashboard({
        username: data.username,
        name: data.userName,
        age: data.userAge,
        gender: data.userGender,
        location: data.userLocation
      });
    } else {
      await showDashboard({ username: data.username }, data.accessToken);
    }
  }
}

// Open Settings
async function openSettings() {
  const data = await chrome.storage.local.get(['accessToken']);
  if (!data.accessToken) return;

  const userData = await fetchUserData(data.accessToken);
  if (userData) {
    // Populate form
    document.getElementById('settingsUsername').value = userData.username;
    document.getElementById('settingsName').value = userData.name || '';
    document.getElementById('settingsAge').value = userData.age || '';
    document.getElementById('settingsGender').value = userData.gender || '';
    document.getElementById('settingsLocation').value = userData.location || '';
    
    // Clear messages
    clearError(document.getElementById('settingsError'));
    document.getElementById('settingsSuccess').style.display = 'none';
    
    // Show modal
    settingsModal.style.display = 'flex';
  }
}

// Update User Profile
async function updateUserProfile() {
  const errorEl = document.getElementById('settingsError');
  const successEl = document.getElementById('settingsSuccess');
  clearError(errorEl);
  successEl.style.display = 'none';
  setLoading(updateProfileBtn, true);

  const data = await chrome.storage.local.get(['accessToken', 'username']);
  if (!data.accessToken) return;

  const updateData = {
    username: data.username,
    name: document.getElementById('settingsName').value.trim(),
    age: parseInt(document.getElementById('settingsAge').value),
    gender: document.getElementById('settingsGender').value,
    location: document.getElementById('settingsLocation').value.trim()
  };

  try {
    const response = await fetch(`${API_BASE_URL}/update_profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${data.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || 'Failed to update profile');
    }

    // Update stored data
    await chrome.storage.local.set({
      userName: result.name,
      userAge: result.age,
      userGender: result.gender,
      userLocation: result.location
    });

    // Update UI
    updateUserUI(result);

    // Show success message
    successEl.textContent = 'Profile updated successfully!';
    successEl.style.display = 'block';
    successEl.classList.add('show');

    setTimeout(() => {
      settingsModal.style.display = 'none';
    }, 1500);

  } catch (error) {
    showError(errorEl, error.message || 'Failed to update profile');
  } finally {
    setLoading(updateProfileBtn, false);
  }
}

// Initialize
checkAuth();
