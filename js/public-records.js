// ============================================
// PUBLIC RECORDS PAGE - GLOBAL FUNCTIONS
// ============================================

/**
 * Format date for display (MM/DD/YYYY)
 * @param {string} dateStr - Date string to format
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  
  // Already formatted
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
 * Get CSS class for status value
 * @param {string} status - Status value
 * @returns {string} CSS class
 */
function getStatusClass(status) {
  if (!status) return '';
  
  const val = String(status).toLowerCase();
  
  if (val.includes('active') || val.includes('approved') || val.includes('completed')) {
    return 'text-green-400 font-medium';
  }
  if (val.includes('pending') || val.includes('processing')) {
    return 'text-yellow-400 font-medium';
  }
  if (val.includes('denied') || val.includes('rejected') || val.includes('closed')) {
    return 'text-red-400 font-medium';
  }
  if (val.includes('expired') || val.includes('inactive')) {
    return 'text-gray-400 font-medium line-through';
  }
  
  return '';
}

/**
 * Render a data table with proper formatting
 * @param {string} tableId - Table element ID
 * @param {Array} records - Array of record objects
 * @param {Array} headers - Column headers
 * @param {object} fieldMap - Mapping of header to data field
 * @param {string} statusField - Optional status field for coloring
 */
function renderTable(tableId, records, headers, fieldMap, statusField = null) {
  const table = document.getElementById(tableId);
  if (!table) {
    console.error('Table not found:', tableId);
    return;
  }
  
  const tbody = table.querySelector('tbody');
  if (!tbody) {
    console.error('Table body not found in:', tableId);
    return;
  }
  
  if (!records || records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center text-gray-500 py-4">No records found</td></tr>`;
    return;
  }
  
  tbody.innerHTML = records.map(record => {
    const cells = headers.map(h => {
      let value = record[fieldMap[h]] || 'N/A';
      
      // Format dates
      if (h.toLowerCase().includes('date') || h.toLowerCase().includes('timestamp') || h.toLowerCase().includes('expires')) {
        value = formatDate(value);
      }
      
      // ✅ Make Certificate # a hyperlink if Certificate URL column has value (Marriage Registry)
      if (tableId === 'marriageTable' && h === 'Certificate #') {
        const certUrl = record.certificateUrl || '';
        if (certUrl && certUrl.startsWith('http')) {
          value = `<a href="${certUrl}" target="_blank" class="text-blue-400 hover:underline">${value}</a>`;
        }
      }
      
      // ✅ Make Case # a hyperlink if Official Letter URL column has value (Case Docket)
      if (tableId === 'casesTable' && h === 'Case #') {
        const letterUrls = [];
        // Check columns U-Y for official letter URLs
        for (let i = 1; i <= 5; i++) {
          const urlKey = `Official Letter URL #${i}`;
          const url = record[urlKey] || '';
          if (url && url.startsWith('http')) {
            letterUrls.push(url);
          }
        }
        if (letterUrls.length > 0) {
          // Show first URL as link, others in tooltip
          const firstUrl = letterUrls[0];
          const tooltip = letterUrls.length > 1 ? `title="${letterUrls.length} document(s) linked"` : '';
          value = `<a href="${firstUrl}" target="_blank" class="text-blue-400 hover:underline" ${tooltip}>${value}</a>`;
        }
      }
      
      // Add status styling
      if (statusField && h.toLowerCase() === statusField.toLowerCase()) {
        const statusClass = getStatusClass(value);
        return `<td class="${statusClass}">${value}</td>`;
      }
      
      return `<td>${value}</td>`;
    });
    
    return `<tr>${cells.join('')}</tr>`;
  }).join('');
}

/**
 * Filter table records by search term
 * @param {Array} records - Records to filter
 * @param {Array} headers - Headers to search
 * @param {object} fieldMap - Field mapping
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered records
 */
function filterTable(records, headers, fieldMap, searchTerm) {
  if (!searchTerm) return records;
  
  const term = searchTerm.toLowerCase();
  return records.filter(record =>
    headers.some(h => String(record[fieldMap[h]] || '').toLowerCase().includes(term))
  );
}

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
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
 * Fetch sheet data via API
 * @param {string} sheetName - Name of the sheet to fetch
 * @returns {Promise<Array>} Array of records
 */
async function fetchSheetData(sheetName) {
  try {
    const result = await apiCall('getSheetData', { sheetName });
    return result.data || [];
  } catch (err) {
    console.error(`Failed to fetch ${sheetName}:`, err);
    return [];
  }
}

/**
 * Render Public Records page with all registries
 */
async function renderPublicRecords() {
  const recordsDiv = document.getElementById('publicRecordsSection');
  if (!recordsDiv) return;
  
  // Show loading state
  recordsDiv.innerHTML = `
    <div class="card p-6">
      <div class="text-center text-gray-400 py-8">
        <div class="animate-spin inline-block w-8 h-8 border-2 border-[#c9a227] border-t-transparent rounded-full mb-4"></div>
        <p>Loading public records...</p>
      </div>
    </div>
  `;
  
  // Fetch all data in parallel
  const [marriages, properties, professionals, cases] = await Promise.all([
    fetchSheetData('MarriageRegistry'),
    fetchSheetData('PropertyRegistry'),
    fetchSheetData('ProfessionalRegistry'),
    fetchSheetData('CaseRegistry')
  ]);
  
  // Map Marriage Registry with certificate URL support
  const mappedMarriages = marriages.map(r => ({
    cert: r['Certificate #'] || '',
    spouse1: r['Spouse 1'] || '',
    spouse2: r['Spouse 2'] || '',
    date: r['Marriage Date'] || r['Date'] || '',
    officiant: r['Officiant'] || '',
    status: r['Status'] || '',
    certificateUrl: r['Certificate URL'] || r['Certificate Url'] || '' // Column M
  }));
  
  // Map Property Registry
  const mappedProperties = properties.map(r => ({
    deed: r['Deed/Transfer #'] || r['Deed #'] || '',
    type: r['Property Type'] || r['Type'] || '',
    grantor: r['Grantor (Seller)'] || r['Grantor'] || '',
    grantee: r['Grantee (Buyer)'] || r['Grantee'] || '',
    date: r['Transfer Date'] || r['Date'] || ''
  }));
  
  // Map Professional Registry
  const mappedProfessionals = professionals.map(r => ({
    entity: r['Entity Name'] || r['Entity'] || '',
    type: r['TYPE'] || r['Type'] || '',
    owner: r['Owner Name'] || r['Owner'] || '',
    license: r['Registration #'] || r['License #'] || '',
    expires: r['Expires'] || '',
    notes: r['Notes'] || '',
    status: r['Status'] || ''
  }));
  
  // Map Case Docket with Official Letter URL support (Columns U-Y)
  const mappedCases = cases.map(r => {
    let judgeDisplay = r['Judge'] || r['Assigned Judge'] || 'Pending';
    if (judgeDisplay === '[Enter Assigned Judge]' || !judgeDisplay || judgeDisplay.trim() === '') {
      judgeDisplay = 'Pending';
    }
    
    // Collect Official Letter URLs from columns U-Y
    const letterUrls = [];
    for (let i = 1; i <= 5; i++) {
      const urlKey = `Official Letter URL #${i}`;
      const url = r[urlKey] || '';
      if (url && url.startsWith('http')) {
        letterUrls.push(url);
      }
    }
    
    return {
      caseNo: r['Case #'] || '',
      type: r['Case Type'] || r['Type'] || '',
      plaintiff: r['Plaintiff/Petitioner'] || r['Plaintiff'] || '',
      defendant: r['Defendant/Respondent'] || r['Defendant'] || '',
      judge: judgeDisplay,
      courtLevel: r['Court Level'] || '',
      filedDate: r['Filing Timestamp'] || r['Filed Date'] || '',
      status: r['Status'] || '',
      letterUrls: letterUrls // Store for hyperlink rendering
    };
  });
  
  // Store for search filtering
  window.publicData = {
    marriages: mappedMarriages,
    properties: mappedProperties,
    cases: mappedCases,
    professionals: mappedProfessionals
  };
  
  // Build HTML with tabs
  recordsDiv.innerHTML = `
    <div class="card p-6">
      <div class="flex gap-4 border-b border-gray-700 mb-4 flex-wrap">
        <button class="tab-btn active px-4 py-2 bg-[#c9a227]/20 text-[#c9a227] rounded-t-lg" data-tab="marriage">Marriage Registry</button>
        <button class="tab-btn px-4 py-2 hover:bg-gray-700 rounded-t-lg" data-tab="property">Property Registry</button>
        <button class="tab-btn px-4 py-2 hover:bg-gray-700 rounded-t-lg" data-tab="professional">Professional Registry</button>
        <button class="tab-btn px-4 py-2 hover:bg-gray-700 rounded-t-lg" data-tab="cases">Case Docket</button>
      </div>
      <div class="mb-4">
        <input type="text" id="searchInput" placeholder="Search records..." class="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c9a227]">
      </div>
      
      <!-- Marriage Registry -->
      <div id="marriageTab" class="tab-content active">
        <div class="overflow-x-auto">
          <table class="data-table" id="marriageTable">
            <thead>
              <tr>
                <th>Certificate #</th>
                <th>Spouse 1</th>
                <th>Spouse 2</th>
                <th>Date</th>
                <th>Officiant</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
      
      <!-- Property Registry -->
      <div id="propertyTab" class="tab-content hidden">
        <div class="overflow-x-auto">
          <table class="data-table" id="propertyTable">
            <thead>
              <tr>
                <th>Deed #</th>
                <th>Type</th>
                <th>Grantor</th>
                <th>Grantee</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
      
      <!-- Professional Registry -->
      <div id="professionalTab" class="tab-content hidden">
        <div class="overflow-x-auto">
          <table class="data-table" id="professionalTable">
            <thead>
              <tr>
                <th>Entity</th>
                <th>Type</th>
                <th>Owner</th>
                <th>License #</th>
                <th>Expires</th>
                <th>Notes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
      
      <!-- Case Docket -->
      <div id="casesTab" class="tab-content hidden">
        <div class="overflow-x-auto">
          <table class="data-table" id="casesTable">
            <thead>
              <tr>
                <th>Case #</th>
                <th>Type</th>
                <th>Plaintiff</th>
                <th>Defendant</th>
                <th>Judge</th>
                <th>Court Level</th>
                <th>Filed Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  // Render initial tables
  renderTable('marriageTable', mappedMarriages,
    ['Certificate #', 'Spouse 1', 'Spouse 2', 'Date', 'Officiant', 'Status'],
    { 'Certificate #': 'cert', 'Spouse 1': 'spouse1', 'Spouse 2': 'spouse2', 'Date': 'date', 'Officiant': 'officiant', 'Status': 'status' },
    'Status'
  );
  
  renderTable('propertyTable', mappedProperties,
    ['Deed #', 'Type', 'Grantor', 'Grantee', 'Date'],
    { 'Deed #': 'deed', 'Type': 'type', 'Grantor': 'grantor', 'Grantee': 'grantee', 'Date': 'date' }
  );
  
  renderTable('professionalTable', mappedProfessionals,
    ['Entity', 'Type', 'Owner', 'License #', 'Expires', 'Notes', 'Status'],
    { 'Entity': 'entity', 'Type': 'type', 'Owner': 'owner', 'License #': 'license', 'Expires': 'expires', 'Notes': 'notes', 'Status': 'status' },
    'Status'
  );
  
  renderTable('casesTable', mappedCases,
    ['Case #', 'Type', 'Plaintiff', 'Defendant', 'Judge', 'Court Level', 'Filed Date', 'Status'],
    { 'Case #': 'caseNo', 'Type': 'type', 'Plaintiff': 'plaintiff', 'Defendant': 'defendant', 'Judge': 'judge', 'Court Level': 'courtLevel', 'Filed Date': 'filedDate', 'Status': 'status' }
  );
  
  // Search functionality with debounce
  const searchInput = document.getElementById('searchInput');
  const debouncedSearch = debounce((term) => {
    const activeTab = document.querySelector('.tab-content.active')?.id;
    
    if (activeTab === 'marriageTab') {
      const filtered = filterTable(mappedMarriages,
        ['Certificate #', 'Spouse 1', 'Spouse 2', 'Date', 'Officiant', 'Status'],
        { 'Certificate #': 'cert', 'Spouse 1': 'spouse1', 'Spouse 2': 'spouse2', 'Date': 'date', 'Officiant': 'officiant', 'Status': 'status' },
        term
      );
      renderTable('marriageTable', filtered,
        ['Certificate #', 'Spouse 1', 'Spouse 2', 'Date', 'Officiant', 'Status'],
        { 'Certificate #': 'cert', 'Spouse 1': 'spouse1', 'Spouse 2': 'spouse2', 'Date': 'date', 'Officiant': 'officiant', 'Status': 'status' },
        'Status'
      );
    } else if (activeTab === 'propertyTab') {
      const filtered = filterTable(mappedProperties,
        ['Deed #', 'Type', 'Grantor', 'Grantee', 'Date'],
        { 'Deed #': 'deed', 'Type': 'type', 'Grantor': 'grantor', 'Grantee': 'grantee', 'Date': 'date' },
        term
      );
      renderTable('propertyTable', filtered,
        ['Deed #', 'Type', 'Grantor', 'Grantee', 'Date'],
        { 'Deed #': 'deed', 'Type': 'type', 'Grantor': 'grantor', 'Grantee': 'grantee', 'Date': 'date' }
      );
    } else if (activeTab === 'professionalTab') {
      const filtered = filterTable(mappedProfessionals,
        ['Entity', 'Type', 'Owner', 'License #', 'Expires', 'Notes', 'Status'],
        { 'Entity': 'entity', 'Type': 'type', 'Owner': 'owner', 'License #': 'license', 'Expires': 'expires', 'Notes': 'notes', 'Status': 'status' },
        term
      );
      renderTable('professionalTable', filtered,
        ['Entity', 'Type', 'Owner', 'License #', 'Expires', 'Notes', 'Status'],
        { 'Entity': 'entity', 'Type': 'type', 'Owner': 'owner', 'License #': 'license', 'Expires': 'expires', 'Notes': 'notes', 'Status': 'status' },
        'Status'
      );
    } else if (activeTab === 'casesTab') {
      const filtered = filterTable(mappedCases,
        ['Case #', 'Type', 'Plaintiff', 'Defendant', 'Judge', 'Court Level', 'Filed Date', 'Status'],
        { 'Case #': 'caseNo', 'Type': 'type', 'Plaintiff': 'plaintiff', 'Defendant': 'defendant', 'Judge': 'judge', 'Court Level': 'courtLevel', 'Filed Date': 'filedDate', 'Status': 'status' },
        term
      );
      renderTable('casesTable', filtered,
        ['Case #', 'Type', 'Plaintiff', 'Defendant', 'Judge', 'Court Level', 'Filed Date', 'Status'],
        { 'Case #': 'caseNo', 'Type': 'type', 'Plaintiff': 'plaintiff', 'Defendant': 'defendant', 'Judge': 'judge', 'Court Level': 'courtLevel', 'Filed Date': 'filedDate', 'Status': 'status' }
      );
    }
  }, 300);
  
  searchInput?.addEventListener('input', (e) => {
    debouncedSearch(e.target.value.toLowerCase());
  });
  
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      
      // Update tab buttons
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active', 'bg-[#c9a227]/20', 'text-[#c9a227]');
        b.classList.add('hover:bg-gray-700');
      });
      btn.classList.add('active', 'bg-[#c9a227]/20', 'text-[#c9a227]');
      btn.classList.remove('hover:bg-gray-700');
      
      // Update tab content
      document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.remove('active');
        c.classList.add('hidden');
      });
      
      const selected = document.getElementById(`${tab}Tab`);
      selected?.classList.remove('hidden');
      selected?.classList.add('active');
      
      // Trigger search to refresh current table
      searchInput?.dispatchEvent(new Event('input'));
    });
  });
  
  // Initialize icons
  if (window.lucide) {
    lucide.createIcons();
  }
}

// ============================================================================
// 🔹 MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================================================
window.renderPublicRecords = renderPublicRecords;
window.renderTable = renderTable;
window.filterTable = filterTable;
window.fetchSheetData = fetchSheetData;
window.formatDate = formatDate;
window.getStatusClass = getStatusClass;
window.debounce = debounce;
