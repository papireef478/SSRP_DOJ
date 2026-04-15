// ============================================
// MAIN ENTRY POINT - SSRP DOJ Portal
// ============================================

/**
 * Initialize the application
 */
async function initApp() {
  try {
    // Initialize all modules
    initAuth();
    initNavigation();
    initModals();
    initNotificationPanel();
    initCommunicationButtons();
    initAvailability();
    
    // Hide splash screen and show main content
    const splash = document.getElementById('splashScreen');
    const main = document.getElementById('mainContent');
    
    if (splash && main) {
      splash.style.opacity = '0';
      setTimeout(() => {
        splash.classList.add('hidden');
        main.style.display = 'block';
        
        // Show home page by default (auth.js will redirect if logged in)
        if (typeof showHome === 'function') {
          showHome();
        }
      }, 500);
    }
    
  } catch (err) {
    console.error('Failed to initialize SSRP portal:', err);
    // Fallback: hide splash, show home
    const splash = document.getElementById('splashScreen');
    const main = document.getElementById('mainContent');
    if (splash) splash.classList.add('hidden');
    if (main) main.style.display = 'block';
    if (typeof showHome === 'function') showHome();
  }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM already ready
  initApp();
}

// Make initApp globally accessible if needed
window.initApp = initApp;