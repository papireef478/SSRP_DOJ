// ============================================
// HOME PAGE - SSRP (GLOBAL FUNCTIONS)
// ============================================

/**
 * Update SSRP home page statistics
 */
async function updateHomeStats() {
  try {
    const [cases, marriages, properties] = await Promise.all([
      fetchSheetData('CaseRegistry'),
      fetchSheetData('MarriageRegistry'),
      fetchSheetData('PropertyRegistry')
    ]);
    
    // Count only active cases
    const activeCases = cases.filter(c =>
      STATUS_FILTERS.activeCaseStatuses.some(s => s.toLowerCase() === (c['Status'] || '').toLowerCase())
    ).length;
    
    // Count only active/pending marriages
    const activeMarriages = marriages.filter(m =>
      STATUS_FILTERS.activeMarriageStatuses.includes((m['Status'] || '').toLowerCase())
    ).length;
    
    const statCases = document.getElementById('statCases');
    const statMarriages = document.getElementById('statMarriages');
    const statProperties = document.getElementById('statProperties');
    
    if (statCases) statCases.innerText = activeCases;
    if (statMarriages) statMarriages.innerText = activeMarriages;
    if (statProperties) statProperties.innerText = properties.length;
  } catch (err) {
    console.error('SSRP failed to load home stats:', err);
  }
}

/**
 * Render SSRP Home page
 */
function renderHome() {
  const homeDiv = document.getElementById('homeSection');
  if (!homeDiv) return;
  
  homeDiv.innerHTML = `
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-white mb-2">Silent Struggle RP - Department of Justice</h2>
      <p class="text-gray-400 max-w-2xl mx-auto italic">Here, every action has weight — and every story truly matters.</p>
    </div>
    
    <div class="grid md:grid-cols-3 gap-6 mb-12">
      <div class="card p-6 text-center">
        <div class="text-3xl mb-2">📋</div>
        <div class="text-2xl font-bold text-white" id="statCases">0</div>
        <div class="text-gray-400">Active Cases</div>
      </div>
      <div class="card p-6 text-center">
        <div class="text-3xl mb-2">💍</div>
        <div class="text-2xl font-bold text-white" id="statMarriages">0</div>
        <div class="text-gray-400">Active Marriages</div>
      </div>
      <div class="card p-6 text-center">
        <div class="text-3xl mb-2">🏠</div>
        <div class="text-2xl font-bold text-white" id="statProperties">0</div>
        <div class="text-gray-400">Registered Properties</div>
      </div>
    </div>
    
    <div class="card p-6 mb-12 bg-blue-900/30 border border-blue-700">
      <div class="flex items-center gap-3">
        <i data-lucide="info" class="w-6 h-6 text-blue-400"></i>
        <div>
          <h3 class="font-semibold text-lg">Start a New Filing</h3>
          <p class="text-gray-300">Open a <strong class="text-blue-400">DOJ Assistance</strong> ticket on Discord. Briefly explain what you need, and a clerk will contact you within 2 hours to assist with filing.</p>
          <a href="${DISCORD.ticketUrl}" target="_blank" class="inline-block mt-2 text-blue-400 hover:text-blue-300">Open Discord Ticket →</a>
        </div>
      </div>
    </div>
    
    <div class="card p-6 mb-12 border-yellow-600/50">
      <div class="flex items-center gap-3">
        <i data-lucide="alert-triangle" class="w-6 h-6 text-yellow-500"></i>
        <div>
          <h3 class="font-semibold text-lg">Whistleblower Information</h3>
          <p class="text-gray-300">If you have a complaint about an SSRP DOJ member, open a <strong class="text-blue-400">DOJ Assistance</strong> ticket and mark it as "Confidential – DOJ Complaint". Your report will be handled discreetly by the Chief Justice.</p>
        </div>
      </div>
    </div>
    
    <div class="card p-6 mb-12">
      <div class="flex flex-col md:flex-row gap-6">
        <div class="md:w-1/4 flex justify-center items-center">
          <div class="w-40 h-40 bg-yellow-100 rounded-full flex items-center justify-center text-6xl font-bold text-[#e94560] shadow-lg">⚖️</div>
        </div>
        <div class="md:w-3/4">
          <div class="mb-6">
            <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
              <i data-lucide="target"></i> Our Mission
            </div>
            <p class="text-gray-300">To provide a fair, efficient, and accessible justice system that upholds the rule of law, protects the rights of all citizens, and strengthens public trust through transparency and integrity in a Texas-inspired world.</p>
          </div>
          <div>
            <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
              <i data-lucide="heart"></i> Our Values
            </div>
            <ul class="list-disc pl-5 text-gray-300">
              <li>Integrity – Acting with honesty and moral clarity</li>
              <li>Fairness – Equal treatment for all</li>
              <li>Transparency – Open records and clear processes</li>
              <li>Service – Putting the SSRP community first</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    
    <div class="grid md:grid-cols-3 gap-6">
      <div class="card p-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="scale"></i> Quick Guide
        </div>
        <p class="text-gray-400 mb-4">Essential information for citizens interacting with the SSRP DOJ.</p>
        <button id="quickGuideBtn" class="btn-secondary py-2 px-4 rounded-lg">Read the Quick Guide →</button>
      </div>
      <div class="card p-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="book-open"></i> Full Manual
        </div>
        <p class="text-gray-400 mb-4">Complete SSRP DOJ Manual (PDF) including Texas-Inspired Penal Code and procedures.</p>
        <button id="downloadManualBtn" class="btn-secondary py-2 px-4 rounded-lg">Download PDF →</button>
      </div>
      <div class="card p-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="clipboard"></i> SSRP Bar Exam
        </div>
        <p class="text-gray-400 mb-4">Take the official SSRP Bar Examination to become an attorney.</p>
        <a href="/bar-examination.html" target="_blank" class="btn-primary py-2 px-4 rounded-lg inline-block">Go to Bar Exam Site →</a>
      </div>
    </div>
  `;
  
  // Attach event listeners
  document.getElementById('quickGuideBtn')?.addEventListener('click', showQuickGuide);
  
  document.getElementById('downloadManualBtn')?.addEventListener('click', () => {
    // ✅ SSRP: Update to your SSRP manual PDF link when ready
    window.open('https://docs.google.com/document/d/1d8A8j_Yl-hikWGq3_rYCCcvVir5sEfvY73NuRt7XEM0/export?format=pdf', '_blank');
  });
  
  // Load SSRP stats
  updateHomeStats();
  
  // Initialize icons
  if (window.lucide) {
    lucide.createIcons();
  }
}