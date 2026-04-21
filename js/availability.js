// ============================================
// AVAILABILITY & SCHEDULING - GLOBAL FUNCTIONS
// ============================================

/**
 * Get pay period dates (1 week: Monday-Sunday)
 * @returns {object} Start and end dates for current week
 */
function getPayPeriodDates() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday...
  
  // Calculate most recent Monday (or today if it's Monday)
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  
  // Calculate Sunday of same week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { start: monday, end: sunday };
}

/**
 * Generate one-week calendar (Monday-Sunday)
 * @returns {Array} Array of 7 day objects
 */
function getOneWeekCalendar() {
  const { start } = getPayPeriodDates();
  const week = [];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    week.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      dateStr: d.toLocaleDateString('en-US'), // MM/DD/YYYY format
      isoDate: d.toISOString().slice(0, 10) // YYYY-MM-DD format
    });
  }
  
  return week;
}

/**
 * Load user availability from API
 */
async function loadUserAvailability() {
  if (!currentUser?.name) return;
  
  try {
    const { start, end } = getPayPeriodDates();
    const result = await apiCall('getUserAvailability', {
      user_name: currentUser.name,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10)
    });
    
    userAvailability[currentUser.name] = result.availability || {};
  } catch (err) {
    console.error('Failed to load availability:', err);
    userAvailability[currentUser.name] = {};
  }
}

/**
 * Save user availability to API
 * @param {Array} availabilityList - Array of {date, availability} objects
 */
async function saveUserAvailability(availabilityList) {
  try {
    await apiCall('saveUserAvailability', {
      user_name: currentUser.name,
      availabilityList: availabilityList
    });
  } catch (err) {
    console.error('Failed to save availability:', err);
    throw err;
  }
}

/**
 * Render scheduling calendar UI (1 week view)
 * @returns {string} HTML string
 */
function renderScheduling() {
  const week = getOneWeekCalendar();
  const avail = userAvailability[currentUser?.name] || {};
  const { start, end } = getPayPeriodDates();
  
  return `
    <div class="card p-6 mb-6">
      <div class="flex items-center gap-2 text-[#c9a227] font-semibold text-lg mb-3">
        <i data-lucide="calendar"></i> Weekly Schedule
      </div>
      <div class="space-y-4">
        <!-- Week Header -->
        <div class="grid grid-cols-7 gap-2 text-center text-sm font-medium">
          ${week.map(d => `
            <div class="text-[#c9a227]">${d.label}</div>
          `).join('')}
        </div>
        
        <!-- Dates -->
        <div class="grid grid-cols-7 gap-2 text-center text-sm">
          ${week.map(d => `
            <div class="text-gray-300">${d.month}/${d.date}</div>
          `).join('')}
        </div>
        
        <!-- Availability Status -->
        <div class="grid grid-cols-7 gap-2 text-center text-xs">
          ${week.map(d => `
            <div class="${getAvailabilityColor(avail[d.dateStr])} font-medium">
              ${avail[d.dateStr] || '—'}
            </div>
          `).join('')}
        </div>
        
        <!-- Pay Period Info -->
        <div class="text-xs text-gray-500 mt-2">
          Week of: ${start.toLocaleDateString()} – ${end.toLocaleDateString()}
        </div>
        
        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-3 mt-2">
          <button id="loaBtn" class="btn-secondary py-2 px-4 rounded-lg">Request Leave</button>
          <button id="availabilityBtn" class="btn-secondary py-2 px-4 rounded-lg">Update Availability</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Show availability update form (7 days)
 */
function showAvailabilityForm() {
  const week = getOneWeekCalendar();
  const avail = userAvailability[currentUser.name] || {};
  const options = ['Morning', 'Afternoon', 'Evening', 'All Day', 'Not Available'];
  
  showModal(`
    <div class="p-4">
      <h3 class="text-xl font-bold mb-4 text-white">Update Weekly Availability</h3>
      
      <div class="space-y-2 max-h-96 overflow-y-auto">
        ${week.map(d => `
          <div class="flex items-center gap-3">
            <div class="w-32 text-sm text-gray-300">
              ${d.label} ${d.month}/${d.date}
            </div>
            <select id="avail_${d.dateStr}" class="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
              ${options.map(opt => `
                <option value="${opt}" ${avail[d.dateStr] === opt ? 'selected' : ''}>
                  ${opt}
                </option>
              `).join('')}
            </select>
          </div>
        `).join('')}
      </div>
      
      <div class="flex gap-3 mt-4">
        <button id="saveAvailability" class="btn-primary py-2 px-4 rounded-lg">Save</button>
        <button onclick="closeModal('globalModal')" class="btn-secondary py-2 px-4 rounded-lg">Cancel</button>
      </div>
    </div>
  `);
  
  // Attach save handler
  document.getElementById('saveAvailability')?.addEventListener('click', async () => {
    const availabilityList = week.map(d => ({
      date: d.dateStr,
      availability: document.getElementById(`avail_${d.dateStr}`).value
    }));
    
    try {
      await saveUserAvailability(availabilityList);
      alert('✅ Availability saved!');
      closeModal('globalModal');
      await loadUserAvailability();
      
      // Re-render dashboard
      if (typeof renderDashboardByRole === 'function') {
        await renderDashboardByRole();
      }
    } catch (err) {
      alert('❌ Failed to save availability. Please try again.');
    }
  });
}

/**
 * Helper: Color-code availability status
 * @param {string} availability - Availability string
 * @returns {string} CSS class for color
 */
function getAvailabilityColor(availability) {
  if (!availability) return 'text-gray-400';
  
  const val = String(availability).toLowerCase();
  if (val.includes('morning')) return 'text-blue-400';
  if (val.includes('afternoon')) return 'text-yellow-400';
  if (val.includes('evening')) return 'text-purple-400';
  if (val.includes('all day')) return 'text-green-400';
  if (val.includes('not available') || val.includes('off')) return 'text-red-400 line-through';
  return 'text-gray-400';
}

/**
 * Initialize availability event listeners
 */
function initAvailability() {
  // Update Availability button
  document.getElementById('availabilityBtn')?.addEventListener('click', showAvailabilityForm);
  
  // Request Leave (LOA) button
  document.getElementById('loaBtn')?.addEventListener('click', () => {
    alert('📋 Leave of Absence (LOA) requests are handled via Discord ticket.\n\nPlease open a DOJ Assistance ticket and select "LOA Request" to submit your request.');
  });
  
  // Load availability on init
  loadUserAvailability();
}

// ============================================================================
// 🔹 MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================================================
window.getPayPeriodDates = getPayPeriodDates;
window.getOneWeekCalendar = getOneWeekCalendar;
window.loadUserAvailability = loadUserAvailability;
window.saveUserAvailability = saveUserAvailability;
window.renderScheduling = renderScheduling;
window.showAvailabilityForm = showAvailabilityForm;
window.getAvailabilityColor = getAvailabilityColor;
window.initAvailability = initAvailability;
