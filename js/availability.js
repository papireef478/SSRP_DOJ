// ============================================
// AVAILABILITY & SCHEDULING - SSRP (GLOBAL FUNCTIONS)
// ============================================

/**
 * Get pay period dates (2 weeks) - SSRP uses bi-weekly clerk schedules
 * @returns {object} Start and end dates
 */
function getPayPeriodDates() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  let firstMonday = new Date(firstDayOfMonth);
  while (firstMonday.getDay() !== 1) {
    firstMonday.setDate(firstMonday.getDate() + 1);
  }
  
  const start = new Date(firstMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 13);
  
  return { start, end };
}

/**
 * Generate two-week calendar for SSRP clerk scheduling
 * @returns {object} Week 1 and Week 2 arrays
 */
function getTwoWeekCalendar() {
  const { start } = getPayPeriodDates();
  const week1 = [], week2 = [];
  
  for (let i = 0; i < 7; i++) {
    const d1 = new Date(start);
    d1.setDate(start.getDate() + i);
    week1.push({
      label: `${d1.toLocaleDateString('en-US', { weekday: 'short' })} ${d1.getMonth()+1}/${d1.getDate()}`,
      dateStr: d1.toISOString().slice(0, 10)
    });
  }
  
  for (let i = 7; i < 14; i++) {
    const d2 = new Date(start);
    d2.setDate(start.getDate() + i);
    week2.push({
      label: `${d2.toLocaleDateString('en-US', { weekday: 'short' })} ${d2.getMonth()+1}/${d2.getDate()}`,
      dateStr: d2.toISOString().slice(0, 10)
    });
  }
  
  return { week1, week2 };
}

/**
 * Load user availability from SSRP Admin Ops API
 */
async function loadUserAvailability() {
  if (!currentUser?.name) return;
  
  try {
    const { start, end } = getPayPeriodDates();
    // ✅ SSRP: Use adminCall for Admin Ops endpoint
    const result = await adminCall('getUserAvailability', {
      user_name: currentUser.name,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10)
    });
    
    userAvailability[currentUser.name] = result.availability || {};
  } catch (err) {
    console.error('SSRP availability load error:', err);
    userAvailability[currentUser.name] = {};
  }
}

/**
 * Save user availability to SSRP Admin Ops API
 * @param {Array} availabilityList - Array of {date, availability} objects
 */
async function saveUserAvailability(availabilityList) {
  try {
    // ✅ SSRP: Use adminCall for Admin Ops endpoint
    await adminCall('saveUserAvailability', {
      user_name: currentUser.name,
      availabilityList: availabilityList
    });
  } catch (err) {
    console.error('SSRP availability save error:', err);
    throw err;
  }
}

/**
 * Render scheduling calendar UI - SSRP branded
 * @returns {string} HTML string
 */
function renderScheduling() {
  const { week1, week2 } = getTwoWeekCalendar();
  const avail = userAvailability[currentUser?.name] || {};
  const { start, end } = getPayPeriodDates();
  
  return `
    <div class="card p-6 mb-6">
      <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
        <i data-lucide="calendar"></i> SSRP Clerk Scheduling
      </div>
      <div class="space-y-4">
        <div class="grid grid-cols-7 gap-2 text-center text-sm">
          ${week1.map(d => `<div class="font-semibold">${d.label}</div>`).join('')}
        </div>
        <div class="grid grid-cols-7 gap-2 text-center text-xs">
          ${week1.map(d => `<div class="bg-gray-700 rounded p-1">${avail[d.dateStr] || '—'}</div>`).join('')}
        </div>
        <div class="grid grid-cols-7 gap-2 text-center text-sm">
          ${week2.map(d => `<div class="font-semibold">${d.label}</div>`).join('')}
        </div>
        <div class="grid grid-cols-7 gap-2 text-center text-xs">
          ${week2.map(d => `<div class="bg-gray-700 rounded p-1">${avail[d.dateStr] || '—'}</div>`).join('')}
        </div>
        <div class="text-xs text-gray-500 mt-2">
          Pay period (Central Time): ${start.toLocaleDateString('en-US', { timeZone: CONFIG.timeZone })} – ${end.toLocaleDateString('en-US', { timeZone: CONFIG.timeZone })}
        </div>
        <div class="flex flex-wrap gap-3 mt-2">
          <button id="loaBtn" class="btn-secondary py-2 px-4 rounded-lg">Request LOA</button>
          <button id="availabilityBtn" class="btn-secondary py-2 px-4 rounded-lg">Update Availability</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Show availability update form - SSRP branded
 */
function showAvailabilityForm() {
  const { week1, week2 } = getTwoWeekCalendar();
  const allDays = [...week1, ...week2];
  const avail = userAvailability[currentUser.name] || {};
  const options = ['Morning', 'Afternoon', 'Evening', 'All Day', 'Not Available'];
  
  showModal(`
    <h3 class="text-xl font-bold mb-4 text-white">Update SSRP Clerk Availability</h3>
    <div class="space-y-2 max-h-64 overflow-y-auto">
      ${allDays.map(d => `
        <div class="flex items-center gap-2">
          <div class="w-24 text-gray-300">${d.label}</div>
          <select id="avail_${d.dateStr}" class="flex-1 p-1 bg-gray-700 border border-gray-600 rounded text-white">
            ${options.map(opt => `<option ${avail[d.dateStr] === opt ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        </div>
      `).join('')}
    </div>
    <div class="flex gap-2 mt-4">
      <button id="saveAvailability" class="btn-primary py-2 px-4 rounded-lg">Save</button>
      <button onclick="closeModal('globalModal')" class="btn-secondary py-2 px-4 rounded-lg">Cancel</button>
    </div>
  `);
  
  document.getElementById('saveAvailability')?.addEventListener('click', async () => {
    const availabilityList = allDays.map(d => ({
      date: d.dateStr,
      availability: document.getElementById(`avail_${d.dateStr}`).value
    }));
    
    try {
      await saveUserAvailability(availabilityList);
      alert('SSRP availability saved! Your schedule has been updated.');
      closeModal('globalModal');
      await loadUserAvailability();
      
      // Re-render dashboard
      renderDashboardByRole();
    } catch (err) {
      alert('Failed to save SSRP availability. Please try again or open a DOJ Ticket.');
    }
  });
}

/**
 * Initialize availability event listeners - SSRP
 */
function initAvailability() {
  document.getElementById('availabilityBtn')?.addEventListener('click', showAvailabilityForm);
  document.getElementById('loaBtn')?.addEventListener('click', () => {
    // ✅ SSRP: Reference correct Discord channel per Manual Section 26
    alert('SSRP DOJ: LOA requests are handled via Discord ticket. Please open a DOJ Assistance ticket in #doj-assistance with your requested dates and reason.');
  });
}