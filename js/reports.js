// ============================================
// CRIMINAL REPORTS (Police/PD → DA) - SSRP (GLOBAL FUNCTIONS)
// ============================================

/**
 * Add a charge row to the SSRP report form
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
      <option value="1.01">1.01 Murder (PC §19.02)</option>
      <option value="1.03">1.03 Manslaughter (PC §19.04)</option>
      <option value="1.06">1.06 Aggravated Assault (PC §22.02)</option>
      <option value="2.01">2.01 Robbery (PC §29.02)</option>
      <option value="2.02">2.02 Aggravated Robbery (PC §29.03)</option>
      <option value="2.03">2.03 Burglary (PC §30.02)</option>
      <option value="2.04">2.04 Theft $2,500+ (PC §31.03)</option>
      <option value="2.05">2.05 Theft $30k+ (PC §31.03)</option>
      <option value="2.22">2.22 Grand Theft Auto</option>
      <option value="3.01">3.01 Evading Arrest (vehicle)</option>
      <option value="3.02">3.02 Resisting Arrest (PC §38.03)</option>
      <option value="5.01">5.01 Unlawful Carrying of Weapon (PC §46.02)</option>
      <option value="5.03">5.03 Possession of Class 2 Firearm</option>
      <option value="6.05">6.05 DUI (first)</option>
      <option value="7.01">7.01 Speeding – 1-10 mph over limit</option>
      <option value="7.07">7.07 Hit and Run – Property Damage</option>
      <option value="7.08">7.08 Hit and Run – Personal Injury</option>
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
 * Calculate total bail from SSRP charges based on Penal Code guidelines
 */
function updateReportBail() {
  let total = 0;
  
  document.querySelectorAll('.charge-row').forEach(row => {
    const code = row.querySelector('.chargeCode')?.value || '';
    // SSRP bail guidelines per Manual Section 32.2
    if (code.startsWith('1.01') || code.startsWith('1.02')) total += 150000; // Murder
    else if (code.startsWith('1.03') || code.startsWith('1.04')) total += 50000; // Manslaughter
    else if (code.startsWith('1.06') || code.startsWith('1.17')) total += 35000; // Aggravated Assault
    else if (code.startsWith('2.01')) total += 30000; // Robbery
    else if (code.startsWith('2.02')) total += 75000; // Aggravated Robbery
    else if (code.startsWith('2.22')) total += 10000; // Grand Theft Auto
    else if (code.startsWith('3.01')) total += 14000; // Evading Arrest
    else if (code.startsWith('3.02')) total += 10000; // Resisting Arrest
    else if (code.startsWith('5.01')) total += 4000; // Unlawful Carrying
    else if (code.startsWith('5.03')) total += 35000; // Class 2 Firearm
    else if (code.startsWith('6.05')) total += 4000; // DUI First
    else if (code.startsWith('7.01')) total += 1000; // Speeding
    else if (code.startsWith('7.07')) total += 7500; // Hit & Run Property
    else if (code.startsWith('7.08')) total += 30000; // Hit & Run Injury
    else if (code) total += 25000; // Default for other felonies
  });
  
  const bailInput = document.getElementById('bailTotal');
  if (bailInput) bailInput.value = total;
  
  return total;
}

/**
 * Show SSRP Police Report Form
 */
function showPoliceReportForm() {
  showModal(`
    <h3 class="text-xl font-bold mb-4 text-white">File SSRP Criminal Report (Police)</h3>
    <div class="space-y-3 max-h-[60vh] overflow-y-auto">
      <input type="text" id="defendant" placeholder="Defendant Name" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
      <input type="text" id="caseNo" placeholder="Case # (if known)" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
      <div id="chargesContainer" class="space-y-2"></div>
      <button type="button" id="addChargeBtn" class="btn-secondary text-sm py-1 px-2 rounded-lg">+ Add Another Charge</button>
      <div class="border-t border-gray-600 pt-2 mt-2">
        <p class="text-sm text-gray-400 mb-2">Total Bail (calculated per SSRP guidelines):</p>
        <input type="number" id="bailTotal" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white" readonly>
      </div>
      <input type="url" id="bodycamUrl" placeholder="Body Camera Footage URL (required per SSRP evidence rules)" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
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
      // ✅ SSRP: Use adminCall for Admin Ops endpoint
      await adminCall('submitReport', {
        type: 'police',
        defendant,
        caseNo,
        charges,
        bailTotal,
        bodycamUrl,
        submittedBy: currentUser.name
      });
      alert('SSRP report submitted to DA for review.');
      closeModal('globalModal');
    } catch (err) {
      alert('Failed to submit SSRP report: ' + err.message);
    }
  });
}

/**
 * Show SSRP Public Defender Report Form
 */
function showPDReportForm() {
  showModal(`
    <h3 class="text-xl font-bold mb-4 text-white">Submit SSRP Criminal Report to DA (Public Defender)</h3>
    <div class="space-y-3 max-h-[60vh] overflow-y-auto">
      <input type="text" id="defendant" placeholder="Defendant Name" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
      <input type="text" id="caseNo" placeholder="Case # (if known)" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
      <div id="chargesContainer" class="space-y-2"></div>
      <button type="button" id="addChargeBtn" class="btn-secondary text-sm py-1 px-2 rounded-lg">+ Add Another Charge</button>
      <div class="border-t border-gray-600 pt-2 mt-2">
        <p class="text-sm text-gray-400 mb-2">Total Bail (calculated per SSRP guidelines):</p>
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
      // ✅ SSRP: Use adminCall for Admin Ops endpoint
      await adminCall('submitReport', {
        type: 'pd',
        defendant,
        caseNo,
        charges,
        bailTotal,
        submittedBy: currentUser.name
      });
      alert('SSRP report submitted to DA for review.');
      closeModal('globalModal');
    } catch (err) {
      alert('Failed to submit SSRP report: ' + err.message);
    }
  });
}

/**
 * Render SSRP DA Dashboard with pending reports
 * @returns {Promise<string>} HTML string
 */
async function renderDADashboard() {
  try {
    // ✅ SSRP: Use adminCall for Admin Ops endpoint
    const [pending, charged] = await Promise.all([
      adminCall('getPendingReports'),
      adminCall('getChargedCases')
    ]);
    
    const pendingHtml = pending.reports?.length === 0 
      ? '<div class="text-gray-400">No pending SSRP reports</div>' 
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
              Submitted by ${r.submittedBy || 'Unknown'} on ${new Date(r.timestamp || Date.now()).toLocaleString('en-US', { timeZone: CONFIG.timeZone })}
            </div>
            <div class="flex gap-2 mt-2">
              <button class="btn-primary text-sm py-1 px-2 rounded approve-report" data-id="${r.id}">Approve & File Charges</button>
              <button class="btn-secondary text-sm py-1 px-2 rounded edit-report" data-id="${r.id}">Edit</button>
              <button class="btn-secondary text-sm py-1 px-2 rounded deny-report" data-id="${r.id}">Deny</button>
            </div>
          </div>
        `).join('');
    
    const chargedHtml = charged.cases?.length === 0 
      ? '<div class="text-gray-400">No SSRP charged cases yet</div>' 
      : charged.cases.map(c => `
          <div class="border border-green-700 rounded p-3 mb-2">
            <div><strong>${c.defendant}</strong> (Case #: ${c.caseNo || 'TBD'})</div>
            <div>Charges: ${(c.charges || []).map(ch => ch.code).join(', ')}</div>
            <div>Bail: $${c.bailTotal || 0}</div>
            <div class="text-xs text-gray-500">
              Approved by ${c.approvedBy || 'Unknown'} on ${new Date(c.approvedAt || Date.now()).toLocaleString('en-US', { timeZone: CONFIG.timeZone })}
            </div>
          </div>
        `).join('');
    
    return `
      <div class="grid md:grid-cols-2 gap-6">
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-[#facc15] mb-3">Pending SSRP Reports</h3>
          <div id="pendingReportsList" class="max-h-96 overflow-y-auto">${pendingHtml}</div>
        </div>
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-[#facc15] mb-3">SSRP Charged Cases</h3>
          <div id="chargedCasesList" class="max-h-96 overflow-y-auto">${chargedHtml}</div>
        </div>
      </div>
      <div class="card p-6 mt-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="message-square"></i> SSRP Communications
        </div>
        <button id="sendToPoliceBtn" class="btn-secondary py-2 px-4 rounded-lg">Send Message to Police</button>
      </div>
    `;
  } catch (err) {
    console.error('SSRP failed to load DA dashboard:', err);
    return '<div class="text-red-400">Failed to load SSRP dashboard data</div>';
  }
}

/**
 * Attach SSRP DA dashboard event listeners
 */
function attachDAEventListeners() {
  document.querySelectorAll('.approve-report').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      const caseNo = prompt('Enter SSRP Case Number (or leave blank to auto-generate):');
      
      try {
        // ✅ SSRP: Use adminCall for Admin Ops endpoint
        await adminCall('approveReport', {
          id,
          approved_by: currentUser.name,
          caseNo: caseNo || undefined
        });
        alert('SSRP report approved. Clerk will be notified.');
        renderDashboardByRole();
      } catch (err) {
        alert('Failed to approve SSRP report: ' + err.message);
      }
    });
  });
  
  document.querySelectorAll('.deny-report').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      
      try {
        // ✅ SSRP: Use adminCall for Admin Ops endpoint
        await adminCall('denyReport', { id });
        alert('SSRP report denied.');
        renderDashboardByRole();
      } catch (err) {
        alert('Failed to deny SSRP report: ' + err.message);
      }
    });
  });
  
  document.querySelectorAll('.edit-report').forEach(btn => {
    btn.addEventListener('click', () => {
      alert('SSRP edit functionality coming soon.');
    });
  });
  
  document.getElementById('sendToPoliceBtn')?.addEventListener('click', () => {
    showCommunicationModal('police', 'Police');
  });
}