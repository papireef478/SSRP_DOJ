// ============================================
// UTILITY FUNCTIONS - SSRP (GLOBAL)
// ============================================

/**
 * Format date string to MM/DD/YYYY for SSRP records
 * @param {string} dateStr - Date string in any format
 * @returns {string} Formatted date or 'N/A'
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  
  // Already in correct format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) return dateStr;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Get CSS class for SSRP status-based coloring
 * @param {string} status - Status value
 * @returns {string} CSS class name or empty string
 */
function getStatusClass(status) {
  if (!status) return '';
  const s = status.toLowerCase();
  
  if (s === 'active') return 'status-active';
  if (s === 'pending') return 'status-pending';
  if (s === 'dissolved') return 'status-dissolved';
  if (s === 'separation') return 'status-separation';
  if (s === 'expired') return 'status-expired';
  
  return '';
}

/**
 * Debounce function for SSRP search inputs
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Escape HTML to prevent XSS in SSRP content
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}