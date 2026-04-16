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

/**
 * Calculate total bail from charges
 */
function updateReportBail() {
  let total = 0;
  
  document.querySelectorAll('.charge-row').forEach(row => {
    const code = row.querySelector('.chargeCode')?.value || '';
    if (code.includes('Murder')) total += 100000;
    else if (code.includes('Robbery')) total += 50000;
    else if (code.includes('Grand Theft Auto')) total += 25000;
    else if (code) total += 25000;
  });
  
  const bailInput = document.getElementById('bailTotal');
  if (bailInput) bailInput.value = total;
  
  return total;
}

/**
 * Show Police Report Form
 */
function showPoliceReportForm() {
  showModal(`
    <h3 class="text-xl font-bold mb-4 text-white">File Criminal Report (Police)</h3>
    <div class="space-y-3 max-h-[60vh] overflow-y-auto">
      <input type="text" id="defendant" placeholder="Defendant Name" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
      <input type="text" id="caseNo" placeholder="Case # (if known)" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
      <div id="chargesContainer" class="space-y-2"></div>
      <button type="button" id="addChargeBtn" class="btn-secondary text-sm py-1 px-2 rounded-lg">+ Add Another Charge</button>
      <div class="border-t border-gray-600 pt-2 mt-2">
        <p class="text-sm text-gray-400 mb-2">Total Bail (calculated automatically):</p>
        <input type="number" id="bailTotal" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white" readonly>
      </div>
      <input type="url" id="bodycamUrl" placeholder="Body Camera Footage URL" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
      <div class="flex gap-2 mt-2">
        <button id="submitReport" class="btn-primary py-2 px-4 rounded-lg">Submit to DA</button>
        <button onclick="closeModal('globalModal')" class="btn-secondary py-2 px-4 rounded-lg">Cancel</button>
      </div>
    </div>
  `);
  
  addChargeRow('chargesContainer');
  
  document.getElementById('addChargeBtn')?.addEventListener('click', () => {
    addChargeRow('chargesContainer');
  });
  
  document.getElementById('submitReport')?.addEventListener('click', async () => {
    const defendant = document.getElementById('defendant').value;
    const caseNo = document.getElementById('caseNo').value;
    const bodycamUrl = document.getElementById('bodycamUrl').value;
    
    const charges = [];
    document.querySelectorAll('.charge-row').forEach(row => {
      const code = row.querySelector('.chargeCode')?.value;
      const desc = row.querySelector('.chargeDesc')?.value;
      if (code) {
        charges.push({ code, description: desc || 'No details' });
      }
    });
    
    const bailTotal = parseInt(document.getElementById('bailTotal').value) || 0;
    
    if (!defendant || charges.length === 0) {
      alert('Please fill defendant name and at least one charge');
      return;
    }
    
    try {
      await apiCall('submitReport', {
        type: 'police',
        defendant,
        caseNo,
        charges,
        bailTotal,
        bodycamUrl,
        submittedBy: currentUser.name
      });
      alert('Report submitted to DA for review.');
      closeModal('globalModal');
    } catch (err) {
      alert('Failed to submit report: ' + err.message);
    }
  });
}

/**
 * Show Public Defender Report Form
 */
function showPDReportForm() {
  showModal(`
    <h3 class="text-xl font-bold mb-4 text-white">Submit Criminal Report to DA (Public Defender)</h3>
    <div class="space-y-3 max-h-[60vh] overflow-y-auto">
      <input type="text" id="defendant" placeholder="Defendant Name" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
      <input type="text" id="caseNo" placeholder="Case # (if known)" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
      <div id="chargesContainer" class="space-y-2"></div>
      <button type="button" id="addChargeBtn" class="btn-secondary text-sm py-1 px-2 rounded-lg">+ Add Another Charge</button>
      <div class="border-t border-gray-600 pt-2 mt-2">
        <p class="text-sm text-gray-400 mb-2">Total Bail (calculated automatically):</p>
        <input type="number" id="bailTotal" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white" readonly>
      </div>
      <div class="flex gap-2 mt-2">
        <button id="submitReport" class="btn-primary py-2 px-4 rounded-lg">Submit to DA</button>
        <button onclick="closeModal('globalModal')" class="btn-secondary py-2 px-4 rounded-lg">Cancel</button>
      </div>
    </div>
  `);
  
  addChargeRow('chargesContainer');
  
  document.getElementById('addChargeBtn')?.addEventListener('click', () => {
    addChargeRow('chargesContainer');
  });
  
  document.getElementById('submitReport')?.addEventListener('click', async () => {
    const defendant = document.getElementById('defendant').value;
    const caseNo = document.getElementById('caseNo').value;
    
    const charges = [];
    document.querySelectorAll('.charge-row').forEach(row => {
      const code = row.querySelector('.chargeCode')?.value;
      const desc = row.querySelector('.chargeDesc')?.value;
      if (code) {
        charges.push({ code, description: desc || 'No details' });
      }
    });
    
    const bailTotal = parseInt(document.getElementById('bailTotal').value) || 0;
    
    if (!defendant || charges.length === 0) {
      alert('Please fill defendant name and at least one charge');
      return;
    }
    
    try {
      await apiCall('submitReport', {
        type: 'pd',
        defendant,
        caseNo,
        charges,
        bailTotal,
        submittedBy: currentUser.name
      });
      alert('Report submitted to DA for review.');
      closeModal('globalModal');
    } catch (err) {
      alert('Failed to submit report: ' + err.message);
    }
  });
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
