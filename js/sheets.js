// ============================================
// GOOGLE SHEETS API FUNCTIONS - SSRP (GLOBAL)
// ============================================

/**
 * Fetch data from SSRP Google Sheets via deployed Apps Script endpoint
 * @param {string} sheetName - Name of the sheet tab
 * @param {string} endpoint - Optional custom endpoint URL (defaults to API_URLS.database from config.js)
 * @returns {Promise<Array>} Array of record objects
 */
async function fetchSheetData(sheetName, endpoint = API_URLS.database) {
  try {
    // ✅ SSRP: Use apiCall helper for Apps Script endpoint
    const result = await apiCall('getSheetData', { sheetName }, endpoint);
    return result.success ? result.data : [];
  } catch (err) {
    console.error(`SSRP failed to fetch ${sheetName}:`, err);
    return [];
  }
}

/**
 * Fetch SSRP Penal Code data via deployed Apps Script endpoint
 * @returns {Promise<Array>} Array of penal code entries
 */
async function fetchPenalCodeData() {
  try {
    // ✅ SSRP: Use adminCall for Admin Ops endpoint (PenalCode sheet lives there)
    const result = await adminCall('getPenalCode');
    return result.success ? result.codes : [];
  } catch (err) {
    console.error('SSRP failed to fetch penal code:', err);
    throw err;
  }
}