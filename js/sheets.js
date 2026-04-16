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
    // Fetch headers from row 5
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A5:ZZ5?key=${SHEETS_API_KEY}`;
    const headerResponse = await fetch(headerUrl);
    const headerData = await headerResponse.json();
    const headers = headerData.values?.[0] || [];
    
    // Fetch data from row 6 onwards
    const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A6:ZZ?key=${SHEETS_API_KEY}`;
    const dataResponse = await fetch(dataUrl);
    const data = await dataResponse.json();
    const rows = data.values || [];
    
    if (rows.length === 0) return [];
    
    // Map rows to objects using headers
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] || '';
      });
      return obj;
    });
  } catch (err) {
    console.error(`Failed to fetch ${sheetName}:`, err);
    return [];
  }
}

/**
 * Fetch Penal Code data directly from Sheets (no API middleware)
 * @returns {Promise<Array>} Array of penal code entries
 */
async function fetchPenalCodeData(spreadsheetId = PENAL_CODE_SPREADSHEET_ID) {
    try {
        // PenalCode sheet has headers in ROW 1, data starts ROW 2
        const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/PenalCode!A1:ZZ1?key=${SHEETS_API_KEY}`;
        const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/PenalCode!A2:ZZ?key=${SHEETS_API_KEY}`;
        
        const [headerRes, dataRes] = await Promise.all([
            fetch(headerUrl),
            fetch(dataUrl)
        ]);
        
        if (!headerRes.ok || !dataRes.ok) {
            throw new Error(`Sheets API error: ${headerRes.status || dataRes.status}`);
        }
        
        const [headersData, dataData] = await Promise.all([
            headerRes.json(),
            dataRes.json()
        ]);
        
        const headers = headersData.values?.[0] || [];
        const rows = dataData.values || [];
        
        return rows.map(row => {
            const obj = {};
            headers.forEach((header, i) => {
                obj[header] = row[i] || '';
            });
            return obj;
        });
    } catch(err) {
        console.error('Failed to fetch penal code:', err);
        // Return empty array instead of crashing
        return [];
    }
}
