// ============================================
// API CALL HELPERS - GLOBAL FUNCTIONS
// ============================================

/**
 * Make an API call to the Google Apps Script backend
 * @param {string} action - The action to perform (e.g., 'sendMessage')
 * @param {object} params - Parameters to send
 * @param {string} baseUrl - Optional custom base URL (defaults to API_URL from config.js)
 * @returns {Promise<object>} API response data
 */
async function apiCall(action, params = {}, baseUrl = API_URL) {
  // ✅ FIX: Ensure params is never null or undefined
  if (!params || typeof params !== 'object') {
    params = {};
  }
  
  const url = new URL(baseUrl);
  url.searchParams.append('action', action);
  
  // ✅ Loop through each parameter and add to URL
  for (const [key, value] of Object.entries(params)) {
    // ✅ Handle arrays: join with commas so backend can split them
    if (Array.isArray(value)) {
      url.searchParams.append(key, value.join(','));
    }
    // ✅ Handle plain objects: stringify into 'data' parameter
    else if (typeof value === 'object' && value !== null) {
      url.searchParams.append('data', JSON.stringify(value));
    }
    // ✅ Handle strings/numbers: append directly
    else {
      url.searchParams.append(key, value);
    }
  }
  
  // Make the fetch request
  const response = await fetch(url.toString());
  const data = await response.json();
  
  // ✅ Throw error if backend returned success: false
  if (!data.success) {
    throw new Error(data.error || 'API call failed');
  }
  
  return data;
}

/**
 * Handle fetch errors gracefully (optional helper)
 * @param {Function} fn - Async function to wrap
 * @param {string} errorMessage - Error message to show
 * @returns {Promise<any>}
 */
async function withErrorHandling(fn, errorMessage = 'An error occurred') {
  try {
    return await fn();
  } catch (err) {
    console.error(`${errorMessage}:`, err);
    throw err;
  }
}
