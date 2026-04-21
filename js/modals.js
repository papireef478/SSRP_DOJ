// ============================================
// MODAL HELPERS - GLOBAL FUNCTIONS
// ============================================

/**
 * Close a modal by ID
 * @param {string} modalId - The modal element ID
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
Show a modal with custom content
@param {string} contentHtml - HTML content to display
*/
function showModal(contentHtml) {
  if (!contentHtml || contentHtml.trim() === '') {
    console.warn('showModal() called with empty content. Ignoring.');
    return;
  }
  
  const modal = document.getElementById('globalModal');
  const modalContent = document.getElementById('modalContent');
  
  if (modal && modalContent) {
    modalContent.innerHTML = `<div class="modal-scroll-container">${contentHtml}</div>`;
    modal.classList.remove('hidden');
    
    // Close on overlay click
    modal.onclick = (e) => {
      if (e.target === modal) closeModal('globalModal');
    };
  }
}
}

/**
 * Show Quick Guide modal
 */
function showQuickGuide() {
  document.getElementById('quickGuideModal')?.classList.remove('hidden');
}

/**
 * Show Training modal for a specific role
 * @param {string} role - User's role
 */
function showTrainingModal(role) {
  const modal = document.getElementById('trainingModal');
  const title = document.getElementById('trainingModalTitle');
  const content = document.getElementById('trainingModalContent');
  
  if (!modal || !title || !content) return;
  
  const roleName = role?.charAt(0).toUpperCase() + role?.slice(1) || 'User';
  title.innerText = `${roleName} Training`;
  
  content.innerHTML = `
    <div class="mb-4">
      <iframe class="w-full h-64" src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&loop=0" frameborder="0" allowfullscreen></iframe>
    </div>
    <div class="prose max-w-none text-gray-300">
      <p>This is the training guide for ${roleName}. It covers essential duties, procedures, and best practices.</p>
      <ul class="list-disc pl-5 mt-2">
        <li>Role-specific responsibility overview</li>
        <li>How to use the DOJ Portal for this role</li>
        <li>Common workflows and tasks</li>
        <li>Where to find additional help</li>
      </ul>
    </div>
  `;
  
  modal.classList.remove('hidden');
}

/**
 * Initialize modal event listeners
 */
function initModals() {
  // Quick Guide button (on home page)
  document.getElementById('quickGuideBtn')?.addEventListener('click', showQuickGuide);
  
  // Close buttons
  document.querySelectorAll('[onclick^="closeModal"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modalId = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
      closeModal(modalId);
    });
  });
}
