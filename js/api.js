// ============================================
// API CALL HELPERS - SSRP (Google Apps Script Backend)
// ============================================

/**
 * Make an API call to the SSRP Google Apps Script backend
 * @param {string} action - The action to perform (e.g., 'verifyLogin', 'sendMessage')
 * @param {object} params - Parameters to send
 * @param {string} endpoint - Optional endpoint URL (defaults to API_URLS.adminOps from config.js)
 * @returns {Promise<object>} API response data
 */
async function apiCall(action, params = {}, endpoint = API_URLS.adminOps) {
  const url = new URL(endpoint);
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
    throw new Error(data.error || 'SSRP API call failed');
  }
  
  return data;
}

/**
 * Handle fetch errors gracefully (optional helper)
 * @param {Function} fn - Async function to wrap
 * @param {string} errorMessage - Error message to show
 * @returns {Promise<any>}
 */
async function withErrorHandling(fn, errorMessage = 'An SSRP error occurred') {
  try {
    return await fn();
  } catch (err) {
    console.error(`${errorMessage}:`, err);
    throw err;
  }
}

/**
 * Helper: Call the Database endpoint (cases, marriages, property, professionals)
 * @param {string} action - Action to perform
 * @param {object} params - Parameters
 */
async function dbCall(action, params = {}) {
  return apiCall(action, params, API_URLS.database);
}

/**
 * Helper: Call the Admin Ops endpoint (auth, messaging, reports, penal code, tasks)
 * @param {string} action - Action to perform
 * @param {object} params - Parameters
 */
async function adminCall(action, params = {}) {
  return apiCall(action, params, API_URLS.adminOps);
}

/**
 * Helper: Call the Bar Exam endpoint (exam codes, results, clerk verification)
 * @param {string} action - Action to perform
 * @param {object} params - Parameters
 */
async function barCall(action, params = {}) {
  return apiCall(action, params, API_URLS.barExam);
}