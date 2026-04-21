// ============================================
// CRIMINAL REPORTS (Police/PD → DA) - GLOBAL FUNCTIONS
// ============================================

/**
 * Add a charge row to the report form
 * @param {string} containerId - Container element ID
 */
function addChargeRow(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const row = document.createElement('div');
  row.className = 'charge-row flex gap-2 mb-2';
  row.innerHTML = `
    <select class="chargeCode w-1/2 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
      <option value="">Select Penal Code</option>
      <option value="(1)01">(1)01 Murder, First Degree</option>
      <option value="(2)01">(2)01 Robbery</option>
      <option value="(2)13">(2)13 Grand Theft Auto</option>
    </select>
    <textarea placeholder="Description" class="chargeDesc w-1/2 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white" rows="1"></textarea>
    <button type="button" class="remove-charge text-red-400 hover:text-red-300">✖</button>
  `;
  
  container.appendChild(row);
  
  row.querySelector('.remove-charge').addEventListener('click', () => {
    row.remove();
    updateReportBail();
  });
  
  row.querySelector('.chargeCode').addEventListener('change', updateReportBail);
  
  updateReportBail();
}

// ============================================================================
// 🔹 CALCULATE BAIL FROM PENAL CODE FINE COLUMN
// ============================================================================
async function updateReportBail() {
  let total = 0;
  
  // Fetch Penal Code data once (cache if needed)
  try {
    const pcResult = await apiCall('getPenalCode');
    const penalCodes = pcResult.codes || [];
    
    // Create lookup map: code -> fine amount
    const fineMap = {};
    penalCodes.forEach(pc => {
      const code = pc.Code || '';
      const fine = parseFloat(pc['Fine ($)'] || pc.Fine || 0);
      fineMap[code] = isNaN(fine) ? 0 : fine;
    });
    
    // Calculate total from selected charges
    document.querySelectorAll('.charge-row').forEach(row => {
      const code = row.querySelector('.chargeCode')?.value || '';
      const fine = fineMap[code] || 0;
      total += fine;
    });
    
  } catch (err) {
    console.error('Failed to fetch Penal Code for bail calculation:', err);
    // Fallback to old hardcoded method if API fails
    document.querySelectorAll('.charge-row').forEach(row => {
      const code = row.querySelector('.chargeCode')?.value || '';
      if (code.includes('Murder')) total += 100000;
      else if (code.includes('Robbery')) total += 50000;
      else if (code.includes('Grand Theft Auto')) total += 25000;
      else if (code) total += 25000;
    });
  }
  
  const bailInput = document.getElementById('bailTotal');
  if (bailInput) {
    bailInput.value = total;
    bailInput.dataset.rawTotal = total; // Store raw value for formatting
  }
  return total;
}
// After updateReportBail() call, format the display:
const bailInput = document.getElementById('bailTotal');
if (bailInput) {
  const raw = parseInt(bailInput.dataset.rawTotal || bailInput.value) || 0;
  bailInput.value = '$' + raw.toLocaleString();
}
// ============================================================================
// 🔹 ENHANCED CRIMINAL REPORT FORM (Police/PD → DA)
// ============================================================================
async function showCriminalReportForm(reportType) {
  // Fetch Penal Code data
  let penalCodes = [];
  try {
    const pcResult = await apiCall('getPenalCode');
    penalCodes = pcResult.codes || [];
  } catch (err) {
    console.error('Failed to load Penal Code:', err);
  }
  
  showModal(`
    <div class="p-4">
      <h3 class="text-xl font-bold mb-4 text-white">
        ${reportType === 'police' ? '🚨 File Criminal Report (Police)' : '🛡️ Submit Criminal Report to DA (Public Defender)'}
      </h3>
      
      <div class="space-y-4">
        <!-- Defendant -->
        <div>
          <label class="block text-gray-300 mb-2 text-sm font-medium">Defendant Name:</label>
          <input type="text" id="defendant" class="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="Enter defendant's character name" required>
        </div>
        
        <!-- Case # (optional) -->
        <div>
          <label class="block text-gray-300 mb-2 text-sm font-medium">Case Number (optional):</label>
          <input type="text" id="caseNo" class="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="e.g., CRIM-042">
        </div>
        
        <!-- Charges Section -->
        <div>
          <label class="block text-gray-300 mb-2 text-sm font-medium">Charges:</label>
          <div id="chargesContainer" class="space-y-2 mb-2"></div>
          <button type="button" id="addChargeBtn" class="btn-secondary text-sm py-1 px-3 rounded-lg">+ Add Another Charge</button>
        </div>
        
        <!-- Bail Total (auto-calculated) -->
        <div>
          <label class="block text-gray-300 mb-2 text-sm font-medium">Total Bail (calculated automatically):</label>
          <input type="number" id="bailTotal" class="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white" readonly>
        </div>
        
        <!-- Evidence URLs -->
        <div>
          <label class="block text-gray-300 mb-2 text-sm font-medium">Evidence URLs (optional):</label>
          <div id="evidenceUrlsContainer" class="space-y-2 mb-2">
            <div class="flex gap-2">
              <input type="url" name="evidenceUrl" class="flex-1 p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="https://example.com/evidence">
              <button type="button" onclick="addEvidenceUrlField()" class="text-green-400 hover:text-green-300 text-xl font-bold" title="Add URL">+</button>
            </div>
          </div>
        </div>
        
        <!-- Bodycam URL (Police only) -->
        ${reportType === 'police' ? `
          <div>
            <label class="block text-gray-300 mb-2 text-sm font-medium">Bodycam URL (optional):</label>
            <input type="url" id="bodycamUrl" class="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="https://example.com/bodycam">
          </div>
        ` : ''}
      </div>
      
      <div class="flex gap-3 justify-end mt-6">
        <button id="submitReportBtn" class="btn-primary py-2 px-4 rounded-lg">Submit to DA</button>
        <button onclick="closeModal('globalModal')" class="btn-secondary py-2 px-4 rounded-lg">Cancel</button>
      </div>
    </div>
  `);
  
  // Initialize charge rows
  addChargeRow('chargesContainer', penalCodes);
  
  // Add charge button
  document.getElementById('addChargeBtn')?.addEventListener('click', () => {
    addChargeRow('chargesContainer', penalCodes);
  });
  
  // Submit handler
  document.getElementById('submitReportBtn')?.addEventListener('click', async () => {
    const defendant = document.getElementById('defendant')?.value?.trim();
    const caseNo = document.getElementById('caseNo')?.value?.trim();
    const bodycamUrl = reportType === 'police' ? document.getElementById('bodycamUrl')?.value?.trim() : '';
    
    // Collect charges
    const charges = [];
    document.querySelectorAll('.charge-row').forEach(row => {
      const code = row.querySelector('.chargeCode')?.value;
      const offense = row.querySelector('.chargeCode')?.options[row.querySelector('.chargeCode').selectedIndex]?.text || '';
      const level = row.querySelector('.chargeCode')?.dataset?.level || '';
      const bailAmount = parseInt(row.querySelector('.chargeCode')?.dataset?.bail || 0);
      const desc = row.querySelector('.chargeDesc')?.value?.trim() || '';
      
      if (code) {
        charges.push({
          code,
          offense: offense.split(' - ')[1] || offense,
          level,
          bailAmount,
          description: desc
        });
      }
    });
    
    // Collect evidence URLs
    const evidenceUrls = [];
    document.querySelectorAll('#evidenceUrlsContainer input[name="evidenceUrl"]').forEach(input => {
      const url = input.value?.trim();
      if (url && url.startsWith('http')) {
        evidenceUrls.push(url);
      }
    });
    
    const bailTotal = parseInt(document.getElementById('bailTotal')?.value) || 0;
    
    if (!defendant || charges.length === 0) {
      alert('Please enter defendant name and at least one charge.');
      return;
    }
    
    try {
      await apiCall('submitReport', {
        type: reportType,
        defendant,
        caseNo: caseNo || '',
        charges,
        bailTotal,
        bodycamUrl: bodycamUrl || '',
        evidenceUrls,
        submittedBy: currentUser.name
      });
      
      alert('✅ Report submitted to DA for review.');
      closeModal('globalModal');
      
      // Notify DA
      if (typeof sendNotificationToRole === 'function') {
        sendNotificationToRole('district_attorney', `New ${reportType} report filed for ${defendant}`);
      }
    } catch (err) {
      alert('❌ Failed to submit report: ' + (err.message || 'Unknown error'));
    }
  });
}

// ============================================================================
// 🔹 ADD CHARGE ROW WITH PENAL CODE DROPDOWN
// ============================================================================
function addChargeRow(containerId, penalCodes = []) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const row = document.createElement('div');
  row.className = 'charge-row flex gap-2 mb-2 items-start';
  
  // Build Penal Code options
  const pcOptions = penalCodes.map(pc => `
    <option value="${pc.Code || ''}" 
            data-level="${pc.Level || ''}" 
            data-bail="${pc.Fine || 0}"
            data-offense="${pc.Offense || ''}">
      ${pc.Code || ''} - ${pc.Offense || ''} (${pc.Level || ''}) - $${Number(pc.Fine || 0).toLocaleString()}
    </option>
  `).join('');
  
  row.innerHTML = `
    <select class="chargeCode w-1/2 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
      <option value="">Select Penal Code</option>
      ${pcOptions}
    </select>
    <textarea placeholder="Description (optional)" class="chargeDesc w-1/2 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" rows="1"></textarea>
    <button type="button" class="remove-charge text-red-400 hover:text-red-300 text-xl font-bold" title="Remove">✖</button>
  `;
  
  container.appendChild(row);
  
  // Remove handler
  row.querySelector('.remove-charge').addEventListener('click', () => {
    row.remove();
    updateReportBail();
  });
  
  // Bail calculation on change
  row.querySelector('.chargeCode').addEventListener('change', updateReportBail);
  
  updateReportBail();
}

// ============================================================================
// 🔹 ADD EVIDENCE URL FIELD
// ============================================================================
function addEvidenceUrlField() {
  const container = document.getElementById('evidenceUrlsContainer');
  if (!container) return;
  
  // Limit to 5 URLs max
  if (container.children.length >= 5) {
    alert('Maximum 5 evidence URLs allowed per report.');
    return;
  }
  
  const div = document.createElement('div');
  div.className = 'flex gap-2 items-center';
  div.innerHTML = `
    <input type="url" name="evidenceUrl" class="flex-1 p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="https://example.com/evidence">
    <button type="button" onclick="removeEvidenceUrlField(this)" class="text-red-400 hover:text-red-300 text-xl font-bold" title="Remove">×</button>
  `;
  
  container.appendChild(div);
  
  // Show/hide remove buttons
  container.querySelectorAll('button[onclick^="removeEvidenceUrlField"]').forEach(btn => {
    btn.classList.toggle('hidden', container.children.length <= 1);
  });
}

function removeEvidenceUrlField(btn) {
  const container = document.getElementById('evidenceUrlsContainer');
  if (!container || container.children.length <= 1) return;
  
  btn.closest('.flex').remove();
  
  // Show/hide remove buttons
  container.querySelectorAll('button[onclick^="removeEvidenceUrlField"]').forEach(btn => {
    btn.classList.toggle('hidden', container.children.length <= 1);
  });
}

// ============================================================================
// 🔹 UPDATE BAIL TOTAL
// ============================================================================
function updateReportBail() {
  let total = 0;
  document.querySelectorAll('.charge-row').forEach(row => {
    const bail = parseInt(row.querySelector('.chargeCode')?.dataset?.bail || 0);
    total += bail;
  });
  const bailInput = document.getElementById('bailTotal');
  if (bailInput) bailInput.value = total;
  return total;
}

// ============================================================================
// 🔹 WRAPPER FUNCTIONS FOR DASHBOARD BUTTONS
// ============================================================================
function showPoliceReportForm() {
  showCriminalReportForm('police');
}

function showPDReportForm() {
  showCriminalReportForm('pd');
}

/**
 * Render DA Dashboard with pending reports
 * @returns {Promise<string>} HTML string
 */
async function renderDADashboard() {
  try {
    const [pending, charged] = await Promise.all([
      apiCall('getPendingReports'),
      apiCall('getChargedCases')
    ]);
    
    const pendingHtml = pending.reports?.length === 0 
      ? '<div class="text-gray-400">No pending reports</div>' 
      : pending.reports.map(r => `
          <div class="border border-gray-700 rounded p-3 mb-2" data-id="${r.id}">
            <div class="flex justify-between">
              <div><strong>${r.defendant}</strong> (${r.type?.toUpperCase() || 'UNKNOWN'})</div>
              <div>Bail: $${r.bailTotal || 0}</div>
            </div>
            <div class="text-sm text-gray-400">
              Charges: ${(r.charges || []).map(c => c.code).join(', ')}
            </div>
            <div class="text-xs text-gray-500">
              Submitted by ${r.submittedBy || 'Unknown'} on ${new Date(r.timestamp || Date.now()).toLocaleString()}
            </div>
            <div class="flex gap-2 mt-2">
              <button class="btn-primary text-sm py-1 px-2 rounded approve-report" data-id="${r.id}">Approve & File Charges</button>
              <button class="btn-secondary text-sm py-1 px-2 rounded edit-report" data-id="${r.id}">Edit</button>
              <button class="btn-secondary text-sm py-1 px-2 rounded deny-report" data-id="${r.id}">Deny</button>
            </div>
          </div>
        `).join('');
    
    const chargedHtml = charged.cases?.length === 0 
      ? '<div class="text-gray-400">No charged cases yet</div>' 
      : charged.cases.map(c => `
          <div class="border border-green-700 rounded p-3 mb-2">
            <div><strong>${c.defendant}</strong> (Case #: ${c.caseNo || 'TBD'})</div>
            <div>Charges: ${(c.charges || []).map(ch => ch.code).join(', ')}</div>
            <div>Bail: $${c.bailTotal || 0}</div>
            <div class="text-xs text-gray-500">
              Approved by ${c.approvedBy || 'Unknown'} on ${new Date(c.approvedAt || Date.now()).toLocaleString()}
            </div>
          </div>
        `).join('');
    
    return `
      <div class="grid md:grid-cols-2 gap-6">
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-[#facc15] mb-3">Pending Reports</h3>
          <div id="pendingReportsList" class="max-h-96 overflow-y-auto">${pendingHtml}</div>
        </div>
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-[#facc15] mb-3">Charged Cases</h3>
          <div id="chargedCasesList" class="max-h-96 overflow-y-auto">${chargedHtml}</div>
        </div>
      </div>
      <div class="card p-6 mt-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="message-square"></i> Communications
        </div>
        <button id="sendToPoliceBtn" class="btn-secondary py-2 px-4 rounded-lg">Send Message to Police</button>
      </div>
    `;
  } catch (err) {
    console.error('Failed to load DA dashboard:', err);
    return '<div class="text-red-400">Failed to load dashboard data</div>';
  }
}

/**
 * Attach DA dashboard event listeners
 */
function attachDAEventListeners() {
  document.querySelectorAll('.approve-report').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      const caseNo = prompt('Enter Case Number (or leave blank to auto-generate):');
      
      try {
        await apiCall('approveReport', {
          id,
          approved_by: currentUser.name,
          caseNo: caseNo || undefined
        });
        alert('Report approved. Clerk will be notified.');
        renderDashboardByRole();
      } catch (err) {
        alert('Failed to approve report: ' + err.message);
      }
    });
  });
  
  document.querySelectorAll('.deny-report').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      
      try {
        await apiCall('denyReport', { id });
        alert('Report denied.');
        renderDashboardByRole();
      } catch (err) {
        alert('Failed to deny report: ' + err.message);
      }
    });
  });
  
  document.querySelectorAll('.edit-report').forEach(btn => {
    btn.addEventListener('click', () => {
      alert('Edit functionality coming soon.');
    });
  });
  
  document.getElementById('sendToPoliceBtn')?.addEventListener('click', () => {
    showCommunicationModal('police', 'Police');
  });
}
