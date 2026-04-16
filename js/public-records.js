// ============================================
// PUBLIC RECORDS PAGE - GLOBAL FUNCTIONS
// ============================================

/**
 * Render a data table
 * @param {string} tableId - Table element ID
 * @param {Array} records - Array of record objects
 * @param {Array} headers - Column headers
 * @param {object} fieldMap - Mapping of header to data field
 * @param {string} statusField - Optional status field for coloring
 */
function renderTable(tableId, records, headers, fieldMap, statusField = null) {
  const table = document.getElementById(tableId);
  if (!table) return;
  
  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  
  if (!records || records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center text-gray-500 py-4">No records found</td></tr>`;
    return;
  }
  
  tbody.innerHTML = records.map(record => {
    const cells = headers.map(h => {
      let value = record[fieldMap[h]] || 'N/A';
      
      // Format dates
      if (h.toLowerCase().includes('date') || h.toLowerCase().includes('timestamp')) {
        value = formatDate(value);
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
  const term = searchTerm.toLowerCase();
  return records.filter(record =>
    headers.some(h => String(record[fieldMap[h]] || '').toLowerCase().includes(term))
  );
}

/**
 * Render Public Records page
 */
async function renderPublicRecords() {
  const recordsDiv = document.getElementById('publicRecordsSection');
  if (!recordsDiv) return;
  
  recordsDiv.innerHTML = `
    <div class="card p-6">
      <div class="flex gap-4 border-b border-gray-700 mb-4 flex-wrap">
        <button class="tab-btn active" data-tab="marriage">Marriage Registry</button>
        <button class="tab-btn" data-tab="property">Property Registry</button>
        <button class="tab-btn" data-tab="professional">Professional Registry</button>
        <button class="tab-btn" data-tab="cases">Case Docket</button>
      </div>
      <div class="mb-4">
        <input type="text" id="searchInput" placeholder="Search..." class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
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
  
  // Fetch all data
  const [marriages, properties, professionals, cases] = await Promise.all([
    fetchSheetData('MarriageRegistry'),
    fetchSheetData('PropertyRegistry'),
    fetchSheetData('ProfessionalRegistry'),
    fetchSheetData('CaseRegistry')
  ]);
  
  // Map Marriage Registry
  const mappedMarriages = marriages.map(r => ({
    cert: r['Certificate #'] || '',
    spouse1: r['Spouse 1'] || '',
    spouse2: r['Spouse 2'] || '',
    date: r['Marriage Date'] || r['Date'] || '',
    officiant: r['Officiant'] || '',
    status: r['Status'] || ''
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
  
  // Map Case Docket
  const mappedCases = cases.map(r => {
    let judgeDisplay = r['Judge'] || r['Assigned Judge'] || 'Pending';
    if (judgeDisplay === '[Enter Assigned Judge]' || !judgeDisplay || judgeDisplay.trim() === '') {
      judgeDisplay = 'Pending';
    }
    return {
      caseNo: r['Case #'] || '',
      type: r['Case Type'] || r['Type'] || '',
      plaintiff: r['Plaintiff/Petitioner'] || r['Plaintiff'] || '',
      defendant: r['Defendant/Respondent'] || r['Defendant'] || '',
      judge: judgeDisplay,
      courtLevel: r['Court Level'] || '',
      filedDate: r['Filing Timestamp'] || r['Filed Date'] || '',
      status: r['Status'] || ''
    };
  });
  
  // Store for search filtering
  window.publicData = {
    marriages: mappedMarriages,
    properties: mappedProperties,
    cases: mappedCases,
    professionals: mappedProfessionals
  };
  
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
  
  // Search functionality
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
      
      document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.remove('active');
        c.classList.add('hidden');
      });
      
      const selected = document.getElementById(`${tab}Tab`);
      selected?.classList.remove('hidden');
      selected?.classList.add('active');
      
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Trigger search to refresh current table
      searchInput?.dispatchEvent(new Event('input'));
    });
  });
  
  // Initialize icons
  if (window.lucide) {
    lucide.createIcons();
  }
}
