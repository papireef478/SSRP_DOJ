// ============================================
// AUTHENTICATION - SSRP (REAL API, NO MOCK DATA)
// ============================================

/**
 * Handle user login via API
 * @param {string} passcode - User's passcode
 */
async function handleLogin(passcode) {
  const loginError = document.getElementById('loginError');
  const loginModal = document.getElementById('loginModal');
  
  try {
    // 🔥 Show loading overlay WHILE logging in 🔥
    showLoginOverlay();
    
    // 🔥 REAL API CALL - verifies against SSRP Admin Ops 'users' sheet 🔥
    const result = await apiCall('verifyLogin', { passcode });
    
    if (result.success && result.user) {
      // Set current user
      currentUser = result.user;
      // ✅ SSRP: Use CONFIG.storagePrefix for session keys
      sessionStorage.setItem(CONFIG.storagePrefix + 'user', JSON.stringify(currentUser));
      
      // Update UI
      document.getElementById('loginNavBtn').classList.add('hidden');
      document.getElementById('logoutBtn').classList.remove('hidden');
      loginModal.classList.add('hidden');
      loginError.classList.add('hidden');
      
      // Load user-specific data
      await loadNotifications();
      await loadUserAvailability();
      
      // Show dashboard
      showDashboard();
      
      // 🔥 Hide the loading overlay now that dashboard is ready 🔥
      hideLoginOverlay();
    } else {
      // Hide overlay on error
      hideLoginOverlay();
      
      // Show error - SSRP branded message
      loginError.innerText = result.error || 'Invalid passcode. Please check with your Master Clerk.';
      loginError.classList.remove('hidden');
    }
  } catch (err) {
    // Hide overlay on error
    hideLoginOverlay();
    
    console.error('SSRP Login error:', err);
    loginError.innerText = 'Connection error. Please try again or open a DOJ Ticket.';
    loginError.classList.remove('hidden');
  }
}

/**
 * Handle user logout
 */
function handleLogout() {
  // Clear session - SSRP prefix
  currentUser = null;
  sessionStorage.removeItem(CONFIG.storagePrefix + 'user');
  
  // Clear global state
  userAvailability = {};
  dojNotifications = [];
  
  // Update UI
  document.getElementById('loginNavBtn').classList.remove('hidden');
  document.getElementById('logoutBtn').classList.add('hidden');
  document.getElementById('notifBadge').classList.add('hidden');
  
  // Return to home page (public can access)
  showHome();
}

/**
 * Show the login loading overlay (during authentication)
 */
function showLoginOverlay() {
  const overlay = document.getElementById('loginOverlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    // Prevent scrolling while overlay is active
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Hide the login loading overlay
 */
function hideLoginOverlay() {
  const overlay = document.getElementById('loginOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
    // Re-enable scrolling
    document.body.style.overflow = '';
  }
}

/**
 * Initialize auth event listeners - SSRP
 */
function initAuth() {
  // Login button in header - opens login modal (NO overlay)
  const loginNavBtn = document.getElementById('loginNavBtn');
  if (loginNavBtn) {
    loginNavBtn.addEventListener('click', () => {
      document.getElementById('loginModal').classList.remove('hidden');
    });
  }
  
  // Login submit button
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', async () => {
      const passcode = document.getElementById('loginPasscode').value.trim();
      if (passcode) {
        await handleLogin(passcode);
        document.getElementById('loginPasscode').value = '';
      }
    });
  }
  
  // Login cancel button - just close modal (NO overlay)
  const loginCancelBtn = document.getElementById('loginCancelBtn');
  if (loginCancelBtn) {
    loginCancelBtn.addEventListener('click', () => {
      document.getElementById('loginModal').classList.add('hidden');
      document.getElementById('loginError').classList.add('hidden');
      document.getElementById('loginPasscode').value = '';
    });
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Forgot password button - SSRP specific instructions
  const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', () => {
      alert('SSRP DOJ: Password reset requests are handled via Discord ticket. Please open a DOJ Assistance ticket in #doj-assistance.');
    });
  }
  
  // Check for saved SSRP session
  const saved = sessionStorage.getItem(CONFIG.storagePrefix + 'user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      document.getElementById('loginNavBtn').classList.add('hidden');
      document.getElementById('logoutBtn').classList.remove('hidden');
      // User is already logged in, show dashboard
      showDashboard();
    } catch (e) {
      console.error('Failed to restore SSRP session:', e);
      sessionStorage.removeItem(CONFIG.storagePrefix + 'user');
      // Show home page (public access)
      showHome();
    }
  } else {
    // No saved session - show home page (public access)
    showHome();
  }
}