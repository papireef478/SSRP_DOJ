// ============================================
// GOOGLE SHEETS API FUNCTIONS - GLOBAL
// ============================================

/**
 * Fetch data from a Google Sheet (headers in row 5, data from row 6+)
 * @param {string} sheetName - Name of the sheet tab
 * @param {string} spreadsheetId - Optional custom spreadsheet ID
 * @returns {Promise<Array>} Array of record objects
 */
async function fetchSheetData(sheetName, spreadsheetId = DOJ_DB_SPREADSHEET_ID) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getSheetData',
        sheetName: sheetName,
        spreadsheetId: spreadsheetId
      })
    });
    const result = await response.json();
    return result.data || [];
  } catch (err) {
    console.error(`Failed to fetch ${sheetName}:`, err);
    return [];
  }
}

/**
 * Fetch Penal Code data directly from Sheets (no API middleware)
 * @returns {Promise<Array>} Array of penal code entries
 */
async function fetchPenalCodeData() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${PENAL_CODE_SPREADSHEET_ID}/values/PenalCode?key=${SHEETS_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Sheets API error: ${response.status}`);
    
    const data = await response.json();
    if (!data.values || data.values.length < 2) {
      throw new Error('No penal code data found');
    }
    
    const rows = data.values;
    const headers = rows[0];
    
    return rows.slice(1).map(row => {
      const code = {};
      headers.forEach((h, idx) => { code[h] = row[idx] || ''; });
      return code;
    });
  } catch (err) {
    console.error('Failed to fetch penal code:', err);
    throw err;
  }
}
