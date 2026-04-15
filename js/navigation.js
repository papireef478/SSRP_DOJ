// ============================================
// NAVIGATION & PAGE ROUTING - GLOBAL FUNCTIONS
// ============================================

/**
 * Hide all page sections
 */
function hideAllSections() {
  ['homeSection', 'publicRecordsSection', 'penalCodeSection', 'careersSection', 'dashboardSection'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });
}

/**
 * Show Home page
 */
function showHome() {
  hideAllSections();
  document.getElementById('homeSection').classList.remove('hidden');
  renderHome();
  
  // 🔥 NO OVERLAY - Public can access home page 🔥
  // Overlay only shows during login process
}

/**
 * Show Public Records page
 */
function showPublicRecords() {
  hideAllSections();
  document.getElementById('publicRecordsSection').classList.remove('hidden');
  renderPublicRecords();
  
  // 🔥 NO OVERLAY - Public can access public records 🔥
}

/**
 * Show Penal Code page
 */
function showPenalCode() {
  hideAllSections();
  document.getElementById('penalCodeSection').classList.remove('hidden');
  renderPenalCode();
  
  // 🔥 NO OVERLAY - Public can access penal code 🔥
}

/**
 * Show Careers page
 */
function showCareers() {
  hideAllSections();
  document.getElementById('careersSection').classList.remove('hidden');
  renderCareers();
  
  // 🔥 NO OVERLAY - Public can access careers 🔥
}

/**
 * Show Dashboard page (REQUIRES LOGIN)
 */
function showDashboard() {
  // 🔥 Only show dashboard if user is logged in 🔥
  if (!currentUser) {
    // Not logged in - redirect to home
    showHome();
    return;
  }
  
  hideAllSections();
  document.getElementById('dashboardSection').classList.remove('hidden');
  
  document.getElementById('dashboardTitle').innerText = 
    `${currentUser.name} (${currentUser.role?.replace('_', ' ') || 'User'})`;
  
  renderDashboardByRole();
}

/**
 * Initialize navigation event listeners
 */
function initNavigation() {
  document.getElementById('homeNavBtn')?.addEventListener('click', showHome);
  document.getElementById('publicRecordsNavBtn')?.addEventListener('click', showPublicRecords);
  document.getElementById('penalCodeNavBtn')?.addEventListener('click', showPenalCode);
  document.getElementById('careersNavBtn')?.addEventListener('click', showCareers);
  
  // Initialize modals
  initModals();
  
  // Initialize notification panel
  initNotificationPanel();
  
  // Initialize communication buttons
  initCommunicationButtons();
}