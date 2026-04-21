// ============================================
// CRIMINAL REPORTS (Police/PD → DA) - GLOBAL FUNCTIONS
// ============================================

/**
 * Add a charge row to the report form with Penal Code dropdown
 * @param {string} containerId - Container element ID
 * @param {Array} penalCodes - Array of penal code objects from API
 */
function addChargeRow(containerId, penalCodes = []) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Charge row container not found:', containerId);
    return;
  }
  
  const row = document.createElement('div');
  row.className = 'charge-row flex gap-2 mb-2 items-start';
  
  // Build Penal Code options with Fine $ data attribute
  const pcOptions = penalCodes.map(pc => {
    const code = pc.Code || '';
    const offense = pc.Offense || '';
    const level = pc.Level || '';
    const fine = pc.Fine || pc['Fine ($)'] || 0;
    const fineNum = typeof fine === 'string' ? parseFloat(fine.replace(/[^0-9.]/g, '')) || 0 : parseFloat(fine) || 0;
    
    return `<option 
      value="${code}" 
      data-level="${level}" 
      data-bail="${fineNum}" 
      data-offense="${offense}"
    >${code} - ${offense} (${level}) - $${fineNum.toLocaleString()}</option>`;
  }).join('');
  
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
  row.querySelector('.remove-charge')?.addEventListener('click', () => {
    row.remove();
    updateReportBail();
  });
  
  // Bail calculation on change - pulls from data-bail attribute
  row.querySelector('.chargeCode')?.addEventListener('change', updateReportBail);
  
  // Initial bail calculation
  updateReportBail();
}

// ============================================================================
// 🔹 ADD EVIDENCE URL FIELD
// ============================================================================
function addEvidenceUrlField() {
  const container = document.getElementById('evidenceUrlsContainer');
  if (!container) {
    console.error('Evidence URLs container not found');
    return;
  }
  
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
  
  btn.closest('.flex')?.remove();
  
  // Show/hide remove buttons
  container.querySelectorAll('button[onclick^="removeEvidenceUrlField"]').forEach(btn => {
    btn.classList.toggle('hidden', container.children.length <= 1);
  });
}

// ============================================================================
// 🔹 UPDATE BAIL TOTAL - Pulls from PenalCode Fine $ data attribute
// ============================================================================
function updateReportBail() {
  let total = 0;
  
  document.querySelectorAll('.charge-row').forEach(row => {
    const select = row.querySelector('.chargeCode');
    if (select && select.selectedIndex > 0) {
      const selectedOption = select.options[select.selectedIndex];
      const bail = parseFloat(selectedOption?.dataset?.bail || 0);
      total += bail;
    }
  });
  
  const bailInput = document.getElementById('bailTotal');
  if (bailInput) {
    bailInput.value = total;
  }
  
  return total;
}

// ============================================================================
// 🔹 ENHANCED CRIMINAL REPORT FORM - Dynamic Bail from PenalCode
// ============================================================================
async function showCriminalReportForm(reportType) {
  // Fetch Penal Code data for bail amounts
  let penalCodes = [];
  try {
    const pcResult = await apiCall('getPenalCode');
    penalCodes = pcResult.codes || [];
  } catch (err) {
    console.error('Failed to load Penal Code:', err);
    alert('⚠️ Could not load Penal Code. Bail amounts may not calculate correctly.');
  }
  
  const formTitle = reportType === 'police' 
    ? '🚨 File Criminal Report (Police)' 
    : '🛡️ Submit Criminal Report to DA (Public Defender)';
  
  showModal(`
    <div class="p-4">
      <h3 class="text-xl font-bold mb-4 text-white">${formTitle}</h3>
      
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
        
        <!-- Bail Total (auto-calculated from PenalCode Fine $) -->
        <div>
          <label class="block text-gray-300 mb-2 text-sm font-medium">Total Bail (calculated from Penal Code):</label>
          <input type="number" id="bailTotal" class="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white" readonly>
        </div>
        
        <!-- Evidence URLs -->
        <div>
          <label class="block text-gray-300 mb-2 text-sm font-medium">Evidence URLs (optional, max 5):</label>
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
  
  // Initialize charge rows with PenalCode dropdown
  addChargeRow('chargesContainer', penalCodes);
  
  // Add charge button
  document.getElementById('addChargeBtn')?.addEventListener('click', () => {
    addChargeRow('chargesContainer', penalCodes);
  });
  
  // Submit handler
  document.getElementById('submitReportBtn')?.addEventListener('click', async () => {
    const defendantEl = document.getElementById('defendant');
    const caseNoEl = document.getElementById('caseNo');
    const bodycamUrlEl = document.getElementById('bodycamUrl');
    const bailTotalEl = document.getElementById('bailTotal');
    
    const defendant = defendantEl?.value?.trim() || '';
    const caseNo = caseNoEl?.value?.trim() || '';
    const bodycamUrl = reportType === 'police' ? bodycamUrlEl?.value?.trim() || '' : '';
    
    // Collect charges with bail amounts from PenalCode
    const charges = [];
    document.querySelectorAll('.charge-row').forEach(row => {
      const select = row.querySelector('.chargeCode');
      const descInput = row.querySelector('.chargeDesc');
      
      if (select && select.value) {
        const selectedOption = select.options[select.selectedIndex];
        charges.push({
          code: select.value,
          offense: selectedOption?.dataset?.offense || subject.split(' - ')[1] || select.value,
          level: selectedOption?.dataset?.level || '',
          bailAmount: parseFloat(selectedOption?.dataset?.bail || 0),
          description: descInput?.value?.trim() || ''
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
    
    const bailTotal = parseFloat(bailTotalEl?.value) || 0;
    
    // Validation
    if (!defendant) {
      alert('❌ Please enter defendant name.');
      defendantEl?.focus();
      return;
    }
    
    if (charges.length === 0) {
      alert('❌ Please add at least one charge.');
      return;
    }
    
    // Disable button and show loading state
    const submitBtn = document.getElementById('submitReportBtn');
    const originalText = submitBtn?.innerHTML || 'Submit to DA';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ Submitting...';
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
        submittedBy: currentUser?.name || 'Unknown'
      });
      
      alert('✅ Report submitted to DA for review.');
      closeModal('globalModal');
      
      // Notify DA
      if (typeof sendNotificationToRole === 'function') {
        sendNotificationToRole('district_attorney', `New ${reportType} report filed for ${defendant}`);
      }
      
      // Refresh dashboard if available
      if (typeof renderDashboardByRole === 'function') {
        await renderDashboardByRole();
      }
      
    } catch (err) {
      console.error('Failed to submit report:', err);
      alert('❌ Failed to submit report: ' + (err.message || 'Unknown error'));
    } finally {
      // Re-enable button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  });
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

// ============================================================================
// 🔹 RENDER DA DASHBOARD WITH PENDING REPORTS
// ============================================================================
async function renderDADashboard() {
  let pendingReports = [];
  
  try {
    const reportsData = await apiCall('getPendingReports');
    pendingReports = reportsData.reports || [];
  } catch (err) {
    console.error('Failed to load pending reports:', err);
  }
  
  const pendingHtml = pendingReports.length === 0
    ? '<div class="text-gray-400 text-sm">No pending reports</div>'
    : pendingReports.map(r => {
        const charges = Array.isArray(r.charges) ? r.charges : [];
        const chargesText = charges.map(c => c.code || c).join(', ');
        const submittedDate = r.timestamp ? new Date(r.timestamp).toLocaleDateString() : 'Unknown';
        const submittedBy = r.submittedBy || 'Unknown';
        
        return `
          <div class="border border-gray-700 rounded p-3 mb-2" data-id="${r.id}">
            <div class="flex justify-between">
              <div>
                <strong class="text-white">${r.defendant || 'Unknown'}</strong> 
                <span class="text-gray-400">(${r.type?.toUpperCase() || 'UNKNOWN'})</span>
              </div>
              <div class="text-[#c9a227]">Bail: $${Number(r.bailTotal || 0).toLocaleString()}</div>
            </div>
            <div class="text-sm text-gray-400 mt-1">Charges: ${chargesText || 'None listed'}</div>
            <div class="text-xs text-gray-500 mt-1">
              Submitted by ${submittedBy} on ${submittedDate}
            </div>
            <div class="flex gap-2 mt-2">
              <button class="btn-primary text-sm py-1 px-2 rounded approve-report" data-id="${r.id}">
                Approve & File Charges
              </button>
              <button class="btn-secondary text-sm py-1 px-2 rounded text-red-400 deny-report" data-id="${r.id}">
                Deny
              </button>
            </div>
          </div>
        `;
      }).join('');
  
  return `
    <div class="card p-6 mb-6">
      <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
        <i data-lucide="file-text"></i> Pending Reports
      </div>
      <div id="pendingReportsList" class="space-y-2">
        ${pendingHtml}
      </div>
    </div>
    <div class="card p-6 mb-6">
      <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
        <i data-lucide="settings"></i> Actions
      </div>
      <div class="flex flex-wrap gap-3">
        <button id="daFileChargesBtn" class="btn-secondary py-2 px-4 rounded-lg">File Charges</button>
        <button id="daRequestEvidenceBtn" class="btn-secondary py-2 px-4 rounded-lg">Request Evidence</button>
      </div>
    </div>
  `;
}

// ============================================================================
// 🔹 ATTACH DA DASHBOARD EVENT LISTENERS
// ============================================================================
function attachDAEventListeners() {
  // Approve report buttons
  document.querySelectorAll('.approve-report').forEach(btn => {
    btn?.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      if (isNaN(id)) {
        alert('❌ Invalid report ID');
        return;
      }
      
      const caseNo = prompt('Enter Case Number (or leave blank to auto-generate):', '');
      
      try {
        await apiCall('approveReport', {
          id,
          approved_by: currentUser?.name || 'Unknown',
          caseNo: caseNo || undefined
        });
        
        alert('✅ Report approved. Clerk will be notified.');
        
        // Refresh dashboard
        if (typeof renderDashboardByRole === 'function') {
          await renderDashboardByRole();
        }
        
      } catch (err) {
        console.error('Failed to approve report:', err);
        alert('❌ Failed to approve report: ' + (err.message || 'Unknown error'));
      }
    });
  });
  
  // Deny report buttons
  document.querySelectorAll('.deny-report').forEach(btn => {
    btn?.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      if (isNaN(id)) {
        alert('❌ Invalid report ID');
        return;
      }
      
      if (!confirm('Are you sure you want to deny this report?')) {
        return;
      }
      
      try {
        await apiCall('denyReport', { id });
        
        alert('✅ Report denied.');
        
        // Refresh dashboard
        if (typeof renderDashboardByRole === 'function') {
          await renderDashboardByRole();
        }
        
      } catch (err) {
        console.error('Failed to deny report:', err);
        alert('❌ Failed to deny report: ' + (err.message || 'Unknown error'));
      }
    });
  });
  
  // File charges button (placeholder)
  document.getElementById('daFileChargesBtn')?.addEventListener('click', () => {
    alert('File charges form (coming soon)');
  });
  
  // Request evidence button (placeholder)
  document.getElementById('daRequestEvidenceBtn')?.addEventListener('click', () => {
    alert('Request evidence form (coming soon)');
  });
  
  // Send to Police button (if exists)
  document.getElementById('sendToPoliceBtn')?.addEventListener('click', () => {
    if (typeof showCommunicationModal === 'function') {
      showCommunicationModal('police', 'Police');
    }
  });
}

// ============================================================================
// 🔹 MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================================================
window.addChargeRow = addChargeRow;
window.addEvidenceUrlField = addEvidenceUrlField;
window.removeEvidenceUrlField = removeEvidenceUrlField;
window.updateReportBail = updateReportBail;
window.showCriminalReportForm = showCriminalReportForm;
window.showPoliceReportForm = showPoliceReportForm;
window.showPDReportForm = showPDReportForm;
window.renderDADashboard = renderDADashboard;
window.attachDAEventListeners = attachDAEventListeners;
