// ============================================
// PENAL CODE PAGE - GLOBAL FUNCTIONS
// ============================================

/**
 * Render Penal Code accordion
 * @param {object} grouped - Grouped penal codes by title
 */
function renderPenalCodeAccordion(grouped) {
  const container = document.getElementById('penalCodeAccordion');
  if (!container) return;
  
  container.innerHTML = Object.entries(grouped).map(([title, rows], idx) => `
    <div class="border border-gray-700 rounded-lg overflow-hidden">
      <div class="accordion-header bg-gray-800 p-3 font-semibold flex justify-between items-center" data-idx="${idx}">
        <span>${title}</span>
        <i data-lucide="chevron-down" class="w-5 h-5"></i>
      </div>
      <div class="accordion-content" data-idx="${idx}">
        <div class="overflow-x-auto">
          <table class="data-table w-full">
            <thead>
              <tr>
                <th>Code</th>
                <th>Offense</th>
                <th>Description</th>
                <th>Level</th>
                <th>Jail (mo)</th>
                <th>Fine</th>
                <th>TxRef</th>
                <th>SSRPRef</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${r.Code || ''}</td>
                  <td>${r.Offense || ''}</td>
                  <td class="desc-col" title="${r.Description || ''}">${r.Description || '—'}</td>
                  <td>${r.Level || ''}</td>
                  <td>${r.Jail || ''}</td>
                  <td>${r.Fine ? '$' + Number(r.Fine).toLocaleString() : ''}</td>
                  <td>${r.TxRef || ''}</td>
                  <td>${r.SSRPRef || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `).join('');
  
  // Add accordion click handlers
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const idx = header.dataset.idx;
      const content = document.querySelector(`.accordion-content[data-idx="${idx}"]`);
      
      if (content) {
        content.classList.toggle('active');
        
        const icon = header.querySelector('i');
        if (icon) {
          icon.setAttribute('data-lucide', content.classList.contains('active') ? 'chevron-up' : 'chevron-down');
        }
        
        if (window.lucide) {
          lucide.createIcons();
        }
      }
    });
  });
  
  if (window.lucide) {
    lucide.createIcons();
  }
}

/**
 * Render Penal Code page
 */
async function renderPenalCode() {
  const penalDiv = document.getElementById('penalCodeSection');
  if (!penalDiv) return;
  
  penalDiv.innerHTML = `
    <div class="card p-6">
      <h2 class="text-2xl font-bold text-white mb-4">Texas Penal Code</h2>
      <p class="text-gray-300 mb-4">The complete Penal Code is available in the DOJ Manual.</p>
      <div class="flex gap-4 mb-6">
        <a href="https://docs.google.com/document/d/1s5Y4PqGibZOogH8MKxJc5J7yv35fjSRGVNCAhulKMmI/export?format=pdf" target="_blank" class="btn-primary py-2 px-4 rounded-lg">Download Manual (PDF)</a>
        <button id="openManualBtn" class="btn-secondary py-2 px-4 rounded-lg">Open Full Manual</button>
      </div>
      <div class="space-y-2 penal-code-table" id="penalCodeAccordion">
        <div class="text-center text-gray-400 py-8">Loading penal code...</div>
      </div>
    </div>
  `;
  
  document.getElementById('openManualBtn')?.addEventListener('click', () => {
    window.open('https://docs.google.com/document/d/1s5Y4PqGibZOogH8MKxJc5J7yv35fjSRGVNCAhulKMmI/edit?usp=sharing', '_blank');
  });
  
  try {
    const codes = await fetchPenalCodeData();
    
    if (codes.length > 0) {
      const grouped = {};
      
      codes.forEach(c => {
        const title = c['Title'] || 'Uncategorized';
        if (!grouped[title]) grouped[title] = [];
        
        grouped[title].push({
          Code: c['Code'] || '',
          Offense: c['Offense'] || '',
          Description: c['Description'] || '',
          Level: c['Level'] || '',
          Jail: c['Jail (month)'] || c['Jail'] || '',
          Fine: c['Fine ($)'] || c['Fine'] || c['Fine $'] || '',
          TxRef: c['TxRef'] || '',
          SSRPRef: c['SSRPRef'] || '',
        });
      });
      
      renderPenalCodeAccordion(grouped);
    } else {
      document.getElementById('penalCodeAccordion').innerHTML = `
        <div class="text-red-400 p-4">
          <p class="font-semibold mb-2">No penal code data found.</p>
          <p class="text-sm">Please ensure the PenalCode tab exists in the spreadsheet with data.</p>
        </div>
      `;
    }
  } catch (err) {
    console.error('Penal code error:', err);
    document.getElementById('penalCodeAccordion').innerHTML = `
      <div class="text-red-400 p-4">
        <p class="font-semibold mb-2">Error loading penal code.</p>
        <p class="text-sm">${err.message}</p>
      </div>
    `;
  }
}
