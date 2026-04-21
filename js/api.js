// ============================================
// API CALL HELPERS - GLOBAL FUNCTIONS
// ============================================

/**
 * Make an API call to the Google Apps Script backend
 * @param {string} action - The action to perform (e.g., 'sendMessage', 'verifyLogin')
 * @param {object} params - Parameters to send to the backend
 * @param {string} baseUrl - Optional custom base URL (defaults to API_URL from config.js)
 * @returns {Promise<object>} API response data (parsed JSON)
 * @throws {Error} If the API call fails or backend returns success: false
 */
async function apiCall(action, params = {}, baseUrl = API_URL) {
  // ✅ Ensure params is always a valid object (never null/undefined)
  if (!params || typeof params !== 'object') {
    params = {};
  }

  // ✅ Build the request URL with action parameter
  const url = new URL(baseUrl);
  url.searchParams.append('action', action);

  // ✅ Loop through each parameter and encode properly for Google Apps Script
  for (const [key, value] of Object.entries(params)) {
    // Skip null/undefined values
    if (value === null || value === undefined) {
      continue;
    }

    // ✅ Handle arrays: join with commas so backend can split them
    if (Array.isArray(value)) {
      // Filter out empty/null values before joining
      const cleanArray = value.filter(v => v !== null && v !== undefined && v !== '');
      if (cleanArray.length > 0) {
        url.searchParams.append(key, cleanArray.join(','));
      }
    }
    // ✅ Handle plain objects: stringify into 'data' parameter for complex payloads
    else if (typeof value === 'object' && value !== null) {
      try {
        url.searchParams.append('data', JSON.stringify(value));
      } catch (e) {
        console.error('Failed to stringify parameter:', key, value, e);
        // Fallback: skip this parameter if it can't be serialized
      }
    }
    // ✅ Handle strings/numbers/booleans: append directly
    else {
      // Convert to string and trim whitespace for clean URLs
      const stringValue = String(value).trim();
      if (stringValue !== '') {
        url.searchParams.append(key, stringValue);
      }
    }
  }

  try {
    // ✅ Make the fetch request with proper headers
    const response = await fetch(url.toString(), {
      method: 'GET', // Google Apps Script Web Apps use GET for all requests
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // ✅ Check for HTTP errors (4xx, 5xx)
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // ✅ Parse JSON response
    const data = await response.json();

    // ✅ Throw error if backend returned success: false
    if (!data.success) {
      // Provide helpful error message based on common backend errors
      const errorMsg = data.error || 'API call failed';
      if (errorMsg.includes('Unknown action')) {
        throw new Error(`Backend function not deployed: "${action}". Please contact an administrator.`);
      } else if (errorMsg.includes('Sheet not found')) {
        throw new Error(`Required spreadsheet sheet not found. Please contact an administrator.`);
      }
      throw new Error(errorMsg);
    }

    return data;

  } catch (fetchError) {
    // ✅ Enhance fetch errors with context
    if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
      throw new Error('Connection error. Please check your internet connection and try again.');
    }
    // Re-throw with original message if it's already an Error
    if (fetchError instanceof Error) {
      throw fetchError;
    }
    // Fallback for unknown errors
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

/**
 * Handle fetch errors gracefully - wrapper for async functions
 * @param {Function} fn - Async function to wrap and execute
 * @param {string} errorMessage - Custom error message to show if fn fails
 * @returns {Promise} Result of the async function, or throws enhanced error
 */
async function withErrorHandling(fn, errorMessage = 'An error occurred') {
  try {
    return await fn();
  } catch (err) {
    // Log full error for debugging (won't show to user)
    console.error(`${errorMessage}:`, err);
    
    // Re-throw with user-friendly message if not already an Error
    if (!(err instanceof Error)) {
      throw new Error(errorMessage);
    }
    
    // Preserve original error message for known issues
    throw err;
  }
}

/**
 * Helper: Check if user is logged in
 * @returns {boolean} True if currentUser exists and has required properties
 */
function isLoggedIn() {
  return !!(currentUser && currentUser.name && currentUser.role);
}

/**
 * Helper: Get current user's name safely
 * @returns {string} User's name or 'Unknown' if not logged in
 */
function getCurrentUserName() {
  return currentUser?.name || 'Unknown';
}

/**
 * Helper: Get current user's role safely
 * @returns {string} User's role or 'guest' if not logged in
 */
function getCurrentUserRole() {
  return currentUser?.role || 'guest';
}

/**
 * Helper: Format API error for display to user
 * @param {Error|string} error - Error object or message string
 * @param {string} fallback - Fallback message if error is unclear
 * @returns {string} User-friendly error message
 */
function formatApiError(error, fallback = 'An error occurred. Please try again.') {
  if (!error) return fallback;
  
  const msg = error instanceof Error ? error.message : String(error);
  
  // Map technical errors to user-friendly messages
  const errorMap = {
    'Invalid passcode': 'Incorrect passcode. Please check and try again.',
    'Users sheet not found': 'System configuration error. Please contact support.',
    'Connection error': 'Unable to connect to server. Please check your internet connection.',
    'Backend function not deployed': 'This feature is being updated. Please try again later.',
    'Required spreadsheet sheet not found': 'Database configuration error. Please contact support.',
    'Case Number is required': 'Please enter a valid Case Number.',
    'Case ID required': 'Please select a case to proceed.'
  };
  
  // Check for exact matches first
  if (errorMap[msg]) return errorMap[msg];
  
  // Check for partial matches
  for (const [key, value] of Object.entries(errorMap)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Return original message if it's clear, otherwise fallback
  return msg.length < 100 ? msg : fallback;
}

/**
 * Helper: Retry an API call with exponential backoff
 * @param {Function} apiFn - Async function that makes the API call
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} initialDelay - Initial delay in ms before first retry (default: 1000)
 * @returns {Promise} Result of the API call, or throws after max retries
 */
async function apiCallWithRetry(apiFn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiFn();
    } catch (err) {
      lastError = err;
      
      // Don't retry on certain errors (auth failures, validation errors)
      if (err.message?.includes('Invalid passcode') || 
          err.message?.includes('required') ||
          err.message?.includes('not found')) {
        throw err;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff + jitter
      const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 100;
      console.log(`API call failed, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries exhausted - throw the last error
  throw lastError;
}

// ============================================
// EXPORTS - Make functions globally accessible
// ============================================
window.apiCall = apiCall;
window.withErrorHandling = withErrorHandling;
window.isLoggedIn = isLoggedIn;
window.getCurrentUserName = getCurrentUserName;
window.getCurrentUserRole = getCurrentUserRole;
window.formatApiError = formatApiError;
window.apiCallWithRetry = apiCallWithRetry;
