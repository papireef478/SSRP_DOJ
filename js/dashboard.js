// ============================================================================
// 🔹 HELPER: Format ISO date to MM/DD/YYYY
// ============================================================================
function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  // Already in MM/DD/YYYY format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) return dateStr;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

// ============================================================================
// 🔹 RECUSAL REQUEST MODAL - ROLE-SPECIFIC LABELS
// ============================================================================
function showRecusalModal() {
  // Get current role and format for display
  const currentRole = currentUser?.role || 'user';
  const roleDisplay = currentRole
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  showModal(`
    <div class="p-4">
      <h3 class="text-xl font-bold mb-4 text-white">⚖️ Motion for Recusal</h3>
      
      <div class="space-y-4">
        <!-- Case # -->
        <div>
          <label class="block text-gray-300 mb-2 text-sm font-medium">Case Number:</label>
          <input type="text" id="recusalCaseId" class="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="e.g., CIV-001, CRIM-042" required>
        </div>
        
        <!-- Grounds for Recusal - DYNAMIC ROLE LABELS -->
        <div>
          <label class="block text-gray-300 mb-2 text-sm font-medium">Grounds for Recusal:</label>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" id="groundPersonal" class="rounded bg-gray-700 border-gray-600">
              ${roleDisplay} has personal involvement in case
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" id="groundCharacter" class="rounded bg-gray-700 border-gray-600">
              ${roleDisplay}'s OTHER CHARACTER is involved in this matter
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" id="groundBias" class="rounded bg-gray-700 border-gray-600">
              ${roleDisplay} has bias or prejudice
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" id="groundFinancial" class="rounded bg-gray-700 border-gray-600">
              ${roleDisplay} has financial interest
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" id="groundPrior" class="rounded bg-gray-700 border-gray-600">
              ${roleDisplay} has prior involvement as attorney
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" id="groundAppearance" class="rounded bg-gray-700 border-gray-600">
              Appearance of bias (explain below)
            </label>
          </div>
        </div>
        
        <!-- Explanation -->
        <div>
          <label class="block text-gray-300 mb-2 text-sm font-medium">Detailed Explanation:</label>
          <textarea id="recusalExplanation" class="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white h-24" placeholder="Explain the grounds for recusal..."></textarea>
        </div>
        
        <!-- Evidence URL -->
        <div>
          <label class="block text-gray-300 mb-2 text-sm font-medium">Evidence URL (optional):</label>
          <input type="url" id="recusalEvidence" class="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="https://example.com/evidence">
        </div>
      </div>
      
      <div class="flex gap-3 justify-end mt-6">
        <button id="submitRecusalBtn" class="btn-primary py-2 px-4 rounded-lg">Submit Motion</button>
        <button onclick="closeModal('globalModal')" class="btn-secondary py-2 px-4 rounded-lg">Cancel</button>
      </div>
    </div>
  `);
  
  // Attach submit handler
  document.getElementById('submitRecusalBtn')?.addEventListener('click', async () => {
    const caseId = document.getElementById('recusalCaseId')?.value?.trim();
    const explanation = document.getElementById('recusalExplanation')?.value?.trim();
    const evidenceUrl = document.getElementById('recusalEvidence')?.value?.trim();
    
    // Collect selected grounds
    const grounds = [];
    if (document.getElementById('groundPersonal')?.checked) grounds.push('Personal involvement');
    if (document.getElementById('groundCharacter')?.checked) grounds.push('Character connection');
    if (document.getElementById('groundBias')?.checked) grounds.push('Bias or prejudice');
    if (document.getElementById('groundFinancial')?.checked) grounds.push('Financial interest');
    if (document.getElementById('groundPrior')?.checked) grounds.push('Prior involvement');
    if (document.getElementById('groundAppearance')?.checked) grounds.push('Appearance of bias');
    
    if (!caseId || grounds.length === 0) {
      alert('Please enter a Case # and select at least one ground for recusal.');
      return;
    }
    
    const reason = grounds.join('; ') + (explanation ? ` | ${explanation}` : '');
    
    try {
      await apiCall('submitRecusal', {
        caseId,
        requestor: currentUser.name,
        reason,
        evidenceUrl: evidenceUrl || ''
      });
      
      alert('✅ Recusal motion submitted to Chief Justice and Master Clerk.');
      closeModal('globalModal');
      
      // Notify user via DOJ notifications
      if (typeof sendNotificationToRole === 'function') {
        sendNotificationToRole(currentUser.name, `Your recusal motion for case ${caseId} has been submitted.`);
      }
    } catch (err) {
      alert('❌ Failed to submit recusal: ' + (err.message || 'Unknown error'));
    }
  });
}

// ============================================================================
// 🔹 OFFICIAL LETTER MODAL (Judge Only)
// ============================================================================
function showOfficialLetterModal() {
  showModal(`
    <div class="p-4">
      <h3 class="text-xl font-bold mb-4 text-white">✉️ Official Letter</h3>
      
      <div class="space-y-4">
        <!-- Case # (auto-filled from judge's cases) -->
        <div>
          <label class="block text-gray-300 mb-2 text-sm font-medium">Case Number:</label>
          <input type="text" id="letterCaseNo" class="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="e.g., CIV-001, CRIM-042" required>
        </div>
        
        <!-- Letter Type -->
        <div>
          <label class="block text-gray-300 mb-2 text-sm font-medium">Letter Type:</label>
          <select id="letterType" class="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white">
            <option value="">Select letter type...</option>
            <option value="ruling">Court Ruling</option>
            <option value="order">Court Order</option>
            <option value="subpoena">Subpoena</option>
            <option value="warrant">Search/Arrest Warrant</option>
            <option value="other">Other Official Document</option>
          </select>
        </div>
        
        <!-- Content -->
        <div>
          <label class="block text-gray-300 mb-2 text-sm font-medium">Letter Content:</label>
          <textarea id="letterContent" class="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white h-40" placeholder="Enter the official letter content..."></textarea>
        </div>
        
        <!-- Signature -->
        <div>
          <label class="block text-gray-300 mb-2 text-sm font-medium">Judge's Signature:</label>
          <input type="text" id="letterSignature" class="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="Judge's name/title" value="${currentUser.name || ''}" readonly>
        </div>
        
        <!-- Preview Section -->
        <div class="border border-gray-600 rounded-lg p-3 bg-gray-800/50">
          <label class="block text-gray-300 mb-2 text-sm font-medium">Preview:</label>
          <div id="letterPreview" class="text-sm text-gray-300 whitespace-pre-wrap border border-gray-700 rounded p-2 bg-gray-900 min-h-[100px]">
            [Letter preview will appear here]
          </div>
        </div>
      </div>
      
      <div class="flex gap-3 justify-end mt-6">
        <button id="generateLetterBtn" class="btn-primary py-2 px-4 rounded-lg">Generate & Upload Letter</button>
        <button onclick="closeModal('globalModal')" class="btn-secondary py-2 px-4 rounded-lg">Cancel</button>
      </div>
    </div>
  `);
  
  // Live preview as user types
  const contentInput = document.getElementById('letterContent');
  const caseNoInput = document.getElementById('letterCaseNo');
  const typeSelect = document.getElementById('letterType');
  const previewDiv = document.getElementById('letterPreview');
  
  function updatePreview() {
    const caseNo = caseNoInput?.value || '[Case #]';
    const type = typeSelect?.options[typeSelect?.selectedIndex]?.text || '[Letter Type]';
    const content = contentInput?.value || '[Letter content...]';
    const signature = currentUser.name || '[Judge Name]';
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    previewDiv.innerHTML = `
      <div style="font-family: serif; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 20px;">
          <strong style="font-size: 1.2em;">DEPARTMENT OF JUSTICE</strong><br>
          <em>Silent Struggle Roleplay</em>
        </div>
        <div style="margin-bottom: 15px;">
          <strong>OFFICIAL ${type.toUpperCase()}</strong><br>
          Case #: ${caseNo}<br>
          Date: ${date}
        </div>
        <div style="margin: 20px 0; padding: 10px; background: rgba(255,255,255,0.05); border-left: 3px solid #c9a227;">
          ${content.replace(/\n/g, '<br>')}
        </div>
        <div style="margin-top: 30px; text-align: right;">
          <div style="border-top: 1px solid #666; padding-top: 5px; width: 200px; margin-left: auto;">
            ${signature}<br>
            <em style="font-size: 0.9em;">Presiding Judge</em>
          </div>
        </div>
      </div>
    `;
  }
  
  contentInput?.addEventListener('input', updatePreview);
  caseNoInput?.addEventListener('input', updatePreview);
  typeSelect?.addEventListener('change', updatePreview);
  
  // Generate and upload letter
  document.getElementById('generateLetterBtn')?.addEventListener('click', async () => {
    const caseNo = document.getElementById('letterCaseNo')?.value?.trim();
    const letterType = document.getElementById('letterType')?.value;
    const content = document.getElementById('letterContent')?.value?.trim();
    const signature = document.getElementById('letterSignature')?.value?.trim() || currentUser.name;
    
    if (!caseNo || !letterType || !content) {
      alert('Please fill in Case #, Letter Type, and Content.');
      return;
    }
    
    const btn = document.getElementById('generateLetterBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ Generating...';
    
    try {
      // ✅ STEP 1: Generate letter HTML for preview/capture
      const letterHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Georgia, serif; line-height: 1.6; padding: 40px; background: white; color: #000; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .header h1 { margin: 0; font-size: 1.5em; }
            .header p { margin: 5px 0 0; font-style: italic; }
            .meta { margin: 20px 0; }
            .content { margin: 30px 0; padding: 20px; background: #f9f9f9; border-left: 4px solid #c9a227; }
            .signature { margin-top: 50px; text-align: right; }
            .signature-line { border-top: 1px solid #000; width: 250px; margin-left: auto; padding-top: 5px; }
            .footer { margin-top: 40px; text-align: center; font-size: 0.9em; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DEPARTMENT OF JUSTICE</h1>
            <p>Silent Struggle Roleplay</p>
          </div>
          <div class="meta">
            <strong>OFFICIAL ${letterType.toUpperCase()}</strong><br>
            Case #: ${caseNo}<br>
            Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div class="content">
            ${content.replace(/\n/g, '<br>')}
          </div>
          <div class="signature">
            <div class="signature-line">
              ${signature}<br>
              <em>Presiding Judge</em>
            </div>
          </div>
          <div class="footer">
            This is an official document of the Silent Struggle RP Department of Justice.<br>
            Generated on ${new Date().toISOString()}
          </div>
        </body>
        </html>
      `;
      
      // ✅ STEP 2: Call backend to upload to Drive and update CaseRegistry
      const result = await apiCall('generateOfficialLetter', {
        caseNo,
        letterType,
        content,
        signature,
        letterHtml,
        judgeName: currentUser.name,
        folderId: '15H4kUlsoOOpblHvg6HVjdQXZgGUAGBVI' // Official Letters folder
      });
      
      if (result.success && result.driveUrl) {
        alert(`✅ Official letter generated and uploaded!\n\n📁 Drive Link: ${result.driveUrl}\n\nThe CaseRegistry has been updated with this letter URL.`);
        closeModal('globalModal');
        
        // Notify relevant parties
        if (typeof sendNotificationToRole === 'function') {
          sendNotificationToRole('clerk', `📄 Official letter filed for case ${caseNo} by Judge ${currentUser.name}`);
        }
      } else {
        throw new Error(result.error || 'Failed to generate letter');
      }
      
    } catch (err) {
      console.error('Failed to generate official letter:', err);
      alert('❌ Failed to generate letter: ' + (err.message || 'Unknown error'));
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
}

// ============================================
// DASHBOARD - ALL ROLES WITH REAL API
// ============================================

/**
 * Render dashboard based on user role
 */
async function renderDashboardByRole() {
  const roleContent = document.getElementById('roleContent');
  if (!roleContent || !currentUser) return;
  
  const role = currentUser.role;
  
  // Load real tasks for clerks AND admins/master_clerks
  let tasks = [];
  if (role === 'clerk' || role === 'admin' || role === 'master_clerk') {
    try {
      const tasksData = await apiCall('getClerkTasks');
      // ✅ Filter tasks by clerk_type column
      tasks = (tasksData.tasks || []).filter(task => {
        const clerkType = task.clerk_type?.toLowerCase() || 'all';
        if (clerkType === 'all') return true; // Show to both clerks and admins
        if (clerkType === 'admin' && (role === 'admin' || role === 'master_clerk')) return true;
        if (clerkType === 'clerk' && role === 'clerk') return true;
        return false;
      });
    } catch (err) {
      console.error('Failed to load clerk tasks:', err);
      // Fallback to mock tasks if API fails
      tasks = [
        { id: 1, task: "Check Discord tickets", due: "Today", status: "pending" },
        { id: 2, task: "Process new filings", due: "Within 24h", status: "pending" },
        { id: 3, task: "Update daily docket by 9PM", due: "Today", status: "pending" },
        { id: 4, task: "Follow up on offline dues", due: "Weekly", status: "pending" }
      ];
    }
  }
  
  // Tasks HTML (for roles that have tasks) - with proper date formatting + null-safe data-id
  const rolesWithTasks = ['clerk', 'judge', 'attorney', 'public_defender', 'district_attorney', 'bailiff', 'marshal', 'reporter', 'admin', 'master_clerk', 'chief_justice'];
  const tasksHtml = rolesWithTasks.includes(role) ? `
    <div class="card p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg">
          <i data-lucide="check-square"></i> Daily Tasks
        </div>
        ${role === 'clerk' ? '<button id="refreshTasks" class="btn-secondary text-sm py-1 px-3 rounded-lg">Refresh</button>' : ''}
      </div>
      <ul id="tasksList" class="space-y-2">
        ${tasks.length > 0 ? tasks.map(task => {
          // ✅ Ensure task.id exists and is valid number
          const taskId = task.id != null && !isNaN(parseInt(task.id)) ? parseInt(task.id) : '';
          // ✅ Format due_date properly and show frequency
          return `
            <li class="flex items-center gap-2">
              <input type="checkbox" 
                     ${task.status === 'done' ? 'checked' : ''} 
                     data-id="${taskId}" 
                     class="task-checkbox">
              <span class="flex-1">${task.task || 'Unnamed task'}</span>
              <span class="text-xs text-gray-500">
                ${formatDateForDisplay(task.due_date || task.due || '')}${task.frequency ? ` • ${task.frequency}` : ''}
              </span>
            </li>
          `;
        }).join('') : '<li class="text-gray-400 text-sm">No tasks assigned</li>'}
      </ul>
    </div>
  ` : '';
  
  // ✅ FIX: Notifications HTML - ADDED MISSING OPENING CARD DIV
  const notifHtml = `
    <div class="card p-6 mb-6">
      <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
        <i data-lucide="bell"></i> DOJ Notifications
      </div>
      <div id="dojNotificationsContainer">
        <!-- Rendered by renderDojNotifications() -->
      </div>
    </div>
  `;
  
  // Communication buttons by role - ENHANCED for direct role messaging
  let commButtons = '';
  
  if (role === 'clerk' || role === 'admin' || role === 'master_clerk') {
    // ✅ Clerk/Admin/Master Clerk: Can send to ANY individual DOJ role
    commButtons = `
      <button id="sendToJudgeBtn" class="btn-secondary py-2 px-4 rounded-lg">Send to Judge</button>
      <button id="sendToAttorneyBtn" class="btn-secondary py-2 px-4 rounded-lg">Send to Attorney</button>
      <button id="sendToPDBtn" class="btn-secondary py-2 px-4 rounded-lg">Send to Public Defender</button>
      <button id="sendToDABtn" class="btn-secondary py-2 px-4 rounded-lg">Send to DA</button>
      <button id="sendToBailiffBtn" class="btn-secondary py-2 px-4 rounded-lg">Send to Bailiff</button>
      <button id="sendToMarshalBtn" class="btn-secondary py-2 px-4 rounded-lg">Send to Marshal</button>
      <button id="sendToReporterBtn" class="btn-secondary py-2 px-4 rounded-lg">Send to Reporter</button>
      <button id="sendToPoliceBtn" class="btn-secondary py-2 px-4 rounded-lg">Send to Police</button>
      <button id="sendToCJBtn" class="btn-secondary py-2 px-4 rounded-lg">Send to Chief Justice</button>
      <button id="sendToAllDOJBtn" class="btn-primary py-2 px-4 rounded-lg">🌐 Send to All DOJ Roles</button>
    `;
  } else if (role === 'judge' || role === 'attorney' || role === 'public_defender') {
    commButtons = `
      <button id="sendToClerkBtn" class="btn-secondary py-2 px-4 rounded-lg">Send to Clerk</button>
      <button id="sendToDABtn" class="btn-secondary py-2 px-4 rounded-lg">Send to DA</button>
      <button id="sendToCJBtn" class="btn-secondary py-2 px-4 rounded-lg">Send to Chief Justice</button>
    `;
  } else if (role === 'district_attorney') {
    commButtons = `
      <button id="sendToClerkBtn" class="btn-secondary py-2 px-4 rounded-lg">Send to Clerk</button>
      <button id="sendToCJBtn" class="btn-secondary py-2 px-4 rounded-lg">Send to Chief Justice</button>
    `;
  } else if (role === 'bailiff' || role === 'marshal' || role === 'reporter') {
    commButtons = `
      <button id="sendToClerkBtn" class="btn-secondary py-2 px-4 rounded-lg">Send to Clerk</button>
      <button id="sendToCJBtn" class="btn-secondary py-2 px-4 rounded-lg">Send to Chief Justice</button>
    `;
  } else if (role === 'police') {
    commButtons = `
      <button id="sendToDABtn" class="btn-secondary py-2 px-4 rounded-lg">Send to District Attorney</button>
    `;
  } else {
    // ✅ DEFAULT CASE: Every role gets basic communication buttons (per PDF request)
    commButtons = `
      <button id="sendToClerkBtn" class="btn-secondary py-2 px-4 rounded-lg">Send to Clerk</button>
      <button id="sendToCJBtn" class="btn-secondary py-2 px-4 rounded-lg">Send to Chief Justice</button>
    `;
  }
  
  // ✅ FIX: Communications HTML - ADDED MISSING OPENING CARD DIV
  const commHtml = `
    <div class="card p-6 mb-6">
      <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
        <i data-lucide="message-square"></i> Communications
      </div>
      <div class="flex flex-wrap gap-3">${commButtons}</div>
    </div>
  `;
  
  // Role-specific content
  let roleSpecific = '';
  
  if (role === 'clerk') {
    roleSpecific = `
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="file-plus"></i> New Filing
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a href="https://docs.google.com/spreadsheets/d/1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc/edit?gid=59417065#gid=59417065" target="_blank" class="btn-secondary text-center py-2 rounded-lg">📄 Case Filing</a>
          <a href="https://docs.google.com/spreadsheets/d/1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc/edit?gid=1895005036#gid=1895005036" target="_blank" class="btn-secondary text-center py-2 rounded-lg">💍 Marriage</a>
          <a href="https://docs.google.com/spreadsheets/d/1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc/edit?gid=1376146295#gid=1376146295" target="_blank" class="btn-secondary text-center py-2 rounded-lg">🚗 Property</a>
          <a href="https://docs.google.com/spreadsheets/d/1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc/edit?gid=1538730298#gid=1538730298" target="_blank" class="btn-secondary text-center py-2 rounded-lg">🏢 Professional</a>
          <a href="https://docs.google.com/spreadsheets/d/1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc/edit?gid=1478971826#gid=1478971826" target="_blank" class="btn-secondary text-center py-2 rounded-lg">👶 Paternity</a>
          <a href="https://docs.google.com/spreadsheets/d/1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc/edit?gid=1874312862#gid=1874312862" target="_blank" class="btn-secondary text-center py-2 rounded-lg">📜 Will</a>
          <a href="https://docs.google.com/spreadsheets/d/1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc/edit?gid=318970083#gid=318970083" target="_blank" class="btn-secondary text-center py-2 rounded-lg">💰 Treasury</a>
          <a href="${allFilingsSheetUrl}" target="_blank" class="btn-secondary text-center py-2 rounded-lg">📊 All Sheets</a>
        </div>
      </div>
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="dollar-sign"></i> Financial Tools
        </div>
        <div class="flex flex-wrap gap-3">
          <a href="${offlineDuesSheetUrl}" target="_blank" class="btn-secondary py-2 px-4 rounded-lg">Manage Offline Dues</a>
          <a href="${allFilingsSheetUrl}" target="_blank" class="btn-secondary py-2 px-4 rounded-lg">View All Filings (Audit)</a>
        </div>
      </div>
      <!-- ✅ AUDIT TOOLS PLACEHOLDER BUTTONS -->
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="settings"></i> Audit Tools
        </div>
        <div class="flex flex-wrap gap-3">
          <button id="cleanupFilesBtn" class="btn-secondary py-2 px-4 rounded-lg opacity-75 cursor-not-allowed" title="Coming soon">🧹 Clean-up Files</button>
          <button id="issueMarriageBtn" class="btn-secondary py-2 px-4 rounded-lg opacity-75 cursor-not-allowed" title="Coming soon">💒 Issue Marriage Certificates</button>
        </div>
      </div>
    `;
  } else if (role === 'judge') {
    roleSpecific = `
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="gavel"></i> Court Level: ${currentUser.courtLevel || 'Not specified'}
        </div>
        <div id="judgeCasesList" class="space-y-2">
          <div class="text-gray-400 text-sm">Case assignments coming soon</div>
        </div>
      </div>
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="settings"></i> Actions
        </div>
        <div class="flex flex-wrap gap-3">
          <button id="recusalBtn" class="btn-secondary py-2 px-4 rounded-lg">Recusal Request</button>
          <button id="sentencingBtn" class="btn-secondary py-2 px-4 rounded-lg">Submit Sentencing</button>
          <button id="officialLetterBtn" class="btn-secondary py-2 px-4 rounded-lg">Official Letter</button>
        </div>
      </div>
    `;
  } else if (role === 'attorney') {
    roleSpecific = `
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="folder"></i> My Cases
        </div>
        <div class="text-gray-400 text-sm">Case list coming soon</div>
      </div>
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="dollar-sign"></i> Trust Account
        </div>
        <div class="flex flex-wrap gap-3">
          <button id="trustWithdrawalBtn" class="btn-secondary py-2 px-4 rounded-lg">Request Withdrawal</button>
          <button id="trustDepositBtn" class="btn-secondary py-2 px-4 rounded-lg">Request Deposit</button>
        </div>
      </div>
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="settings"></i> Actions
        </div>
        <button id="recusalBtn" class="btn-secondary py-2 px-4 rounded-lg">Recusal Request</button>
      </div>
    `;
  } else if (role === 'public_defender') {
    roleSpecific = `
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="users"></i> Assigned Clients
        </div>
        <div class="text-gray-400 text-sm">Client list coming soon</div>
      </div>
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="settings"></i> Actions
        </div>
        <div class="flex flex-wrap gap-3">
          <button id="recusalBtn" class="btn-secondary py-2 px-4 rounded-lg">Recusal Request</button>
          <button id="pdReportBtn" class="btn-secondary py-2 px-4 rounded-lg">Submit Criminal Report to DA</button>
        </div>
      </div>
    `;
  } else if (role === 'district_attorney') {
    roleSpecific = await renderDADashboard();
  } else if (role === 'police') {
    roleSpecific = `
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="badge-check"></i> Police Dashboard
        </div>
        <p class="text-gray-300 mb-4">File criminal reports for review by the District Attorney.</p>
      </div>
    `;
  } else if (role === 'bailiff') {
    roleSpecific = `
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="shield"></i> Civil Process
        </div>
        <button id="serviceProcessBtn" class="btn-secondary py-2 px-4 rounded-lg">Manage Service of Process</button>
      </div>
    `;
  } else if (role === 'marshal') {
    roleSpecific = `
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="badge"></i> U.S. Marshal Dashboard
        </div>
        <p class="text-gray-300 mb-4">Federal court security, prisoner transport, and warrant service.</p>
      </div>
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="truck"></i> Transport & Security
        </div>
        <div class="flex flex-wrap gap-3">
          <button id="transportRequestBtn" class="btn-secondary py-2 px-4 rounded-lg">Request Prisoner Transport</button>
          <button id="warrantServiceBtn" class="btn-secondary py-2 px-4 rounded-lg">Serve Federal Warrant</button>
          <button id="manhuntReportBtn" class="btn-secondary py-2 px-4 rounded-lg">Report Manhunt Status</button>
        </div>
      </div>
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="clipboard"></i> Court Security Log
        </div>
        <button id="securityLogBtn" class="btn-secondary py-2 px-4 rounded-lg">Submit Security Report</button>
      </div>
    `;
  } else if (role === 'reporter') {
    roleSpecific = `
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="upload"></i> Transcripts
        </div>
        <button id="uploadTranscriptBtn" class="btn-secondary py-2 px-4 rounded-lg">Upload Transcript URL</button>
      </div>
    `;
  } else if (role === 'admin' || role === 'master_clerk') {
    roleSpecific = `
      <!-- ✅ NEW: New Filing Section (same as Clerk) -->
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="file-plus"></i> New Filing
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a href="https://docs.google.com/spreadsheets/d/1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc/edit?gid=59417065#gid=59417065" target="_blank" class="btn-secondary text-center py-2 rounded-lg">📄 Case Filing</a>
          <a href="https://docs.google.com/spreadsheets/d/1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc/edit?gid=1895005036#gid=1895005036" target="_blank" class="btn-secondary text-center py-2 rounded-lg">💍 Marriage</a>
          <a href="https://docs.google.com/spreadsheets/d/1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc/edit?gid=1376146295#gid=1376146295" target="_blank" class="btn-secondary text-center py-2 rounded-lg">🚗 Property</a>
          <a href="https://docs.google.com/spreadsheets/d/1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc/edit?gid=1538730298#gid=1538730298" target="_blank" class="btn-secondary text-center py-2 rounded-lg">🏢 Professional</a>
          <a href="https://docs.google.com/spreadsheets/d/1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc/edit?gid=1478971826#gid=1478971826" target="_blank" class="btn-secondary text-center py-2 rounded-lg">👶 Paternity</a>
          <a href="https://docs.google.com/spreadsheets/d/1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc/edit?gid=1874312862#gid=1874312862" target="_blank" class="btn-secondary text-center py-2 rounded-lg">📜 Will</a>
          <a href="https://docs.google.com/spreadsheets/d/1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc/edit?gid=318970083#gid=318970083" target="_blank" class="btn-secondary text-center py-2 rounded-lg">💰 Treasury</a>
          <a href="${allFilingsSheetUrl}" target="_blank" class="btn-secondary text-center py-2 rounded-lg">📊 All Sheets</a>
        </div>
      </div>
      
      <!-- ✅ EXISTING: User Management -->
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="users"></i> User Management
        </div>
        <button id="userMgmtBtn" class="btn-secondary py-2 px-4 rounded-lg">Manage Users</button>
      </div>
      
      <!-- ✅ EXISTING: Judge Assignment -->
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="refresh-cw"></i> Judge Assignment
        </div>
        <button id="assignJudgeBtn" class="btn-secondary py-2 px-4 rounded-lg">Auto-Assign Unassigned Cases</button>
      </div>
      
      <!-- ✅ EXISTING: Recusal Queue -->
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="refresh-cw"></i> Recusal Queue
        </div>
        <button id="recusalQueueBtn" class="btn-secondary py-2 px-4 rounded-lg">View Queue</button>
      </div>
      
      <!-- ✅ EXISTING: Audit Tools -->
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="chart-line"></i> Audit Tools
        </div>
        <div class="flex flex-wrap gap-3">
          <button id="financialAuditBtn" class="btn-secondary py-2 px-4 rounded-lg">Financial Summary</button>
          <button id="offlineDuesBtn" class="btn-secondary py-2 px-4 rounded-lg">Offline Dues</button>
          <a href="${allFilingsSheetUrl}" target="_blank" class="btn-secondary py-2 px-4 rounded-lg">Audit Log (All Filings)</a>
          <!-- ✅ AUDIT TOOLS PLACEHOLDER BUTTONS -->
          <button id="cleanupFilesBtn" class="btn-secondary py-2 px-4 rounded-lg opacity-75 cursor-not-allowed" title="Coming soon">🧹 Clean-up Files</button>
          <button id="issueMarriageBtn" class="btn-secondary py-2 px-4 rounded-lg opacity-75 cursor-not-allowed" title="Coming soon">💒 Issue Marriage Certificates</button>
        </div>
      </div>
    `;
  } else if (role === 'chief_justice') {
    roleSpecific = `
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="gavel"></i> Judicial Oversight
        </div>
        <div class="space-y-2">
          <button id="cjViewRecusalsBtn" class="btn-secondary w-full text-left py-2 px-4 rounded-lg">View Recusal Queue</button>
          <button id="cjAssignJudgeBtn" class="btn-secondary w-full text-left py-2 px-4 rounded-lg">Manually Assign Judge to Case</button>
          <button id="cjViewAuditBtn" class="btn-secondary w-full text-left py-2 px-4 rounded-lg">View Audit Log (All Filings)</button>
        </div>
      </div>
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="users"></i> Manage Users
        </div>
        <button id="cjUserMgmtBtn" class="btn-secondary py-2 px-4 rounded-lg">Edit User Roles</button>
      </div>
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
          <i data-lucide="chart-line"></i> Audit Tools
        </div>
        <div class="flex flex-wrap gap-3">
          <!-- ✅ AUDIT TOOLS PLACEHOLDER BUTTONS -->
          <button id="cleanupFilesBtn" class="btn-secondary py-2 px-4 rounded-lg opacity-75 cursor-not-allowed" title="Coming soon">🧹 Clean-up Files</button>
          <button id="issueMarriageBtn" class="btn-secondary py-2 px-4 rounded-lg opacity-75 cursor-not-allowed" title="Coming soon">💒 Issue Marriage Certificates</button>
        </div>
      </div>
    `;
  }
  
  // Scheduling (all roles except police)
  const scheduleHtml = role !== 'police' ? renderScheduling() : '';
  
  // Training (all roles)
  const trainingHtml = `
    <div class="card p-6 mb-6">
      <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
        <i data-lucide="book"></i> Training Guide
      </div>
      <button id="trainingBtn" class="btn-secondary py-2 px-4 rounded-lg">Open Training Materials</button>
    </div>
  `;
  
  // Render everything
  roleContent.innerHTML = tasksHtml + notifHtml + commHtml + roleSpecific + scheduleHtml + trainingHtml;
  
  // Render notifications in the container
  if (typeof renderDojNotifications === 'function') {
    renderDojNotifications();
  }
  
  // Attach event listeners
  attachDashboardEventListeners(role);
  
  // Initialize icons
  if (window.lucide) {
    lucide.createIcons();
  }
}

/**
 * Attach dashboard event listeners
 * @param {string} role - User's role
 */
function attachDashboardEventListeners(role) {
  // Task refresh (clerk/admin/master_clerk)
  document.getElementById('refreshTasks')?.addEventListener('click', async () => {
    if (role === 'clerk' || role === 'admin' || role === 'master_clerk') {
      try {
        const tasksData = await apiCall('getClerkTasks');
        if (tasksData.tasks?.length > 0) {
          const tasksList = document.getElementById('tasksList');
          if (tasksList) {
            tasksList.innerHTML = tasksData.tasks.map(task => `
              <li class="flex items-center gap-2">
                <input type="checkbox" ${task.status === 'done' ? 'checked' : ''} data-id="${task.id}" class="task-checkbox">
                <span class="flex-1">${task.task}</span>
                <span class="text-xs text-gray-500">
                  ${formatDateForDisplay(task.due_date || task.due || '')}${task.frequency ? ` • ${task.frequency}` : ''}
                </span>
              </li>
            `).join('');
          }
          alert('✅ Tasks refreshed!');
        }
      } catch (err) {
        console.error('Failed to refresh tasks:', err);
        alert('❌ Failed to refresh tasks');
      }
    }
  });
  
  // Task checkboxes (clerk/admin/master_clerk) - with strict ID validation
  document.querySelectorAll('.task-checkbox')?.forEach(cb => {
    cb.addEventListener('change', async () => {
      if (role === 'clerk' || role === 'admin' || role === 'master_clerk') {
        const taskId = cb.dataset.id;
        
        // ✅ Skip if no valid task ID
        if (!taskId || taskId.trim() === '' || isNaN(parseInt(taskId))) {
          console.warn('Invalid or missing task ID:', taskId);
          cb.checked = !cb.checked; // Revert UI
          return;
        }
        
        try {
          await apiCall('updateClerkTask', {
            id: parseInt(taskId, 10),
            status: cb.checked ? 'done' : 'pending',
            completed_by: currentUser.name
          });
          // ✅ Keep checkbox state as-is (no re-render flicker)
        } catch (err) {
          console.error('Failed to update task:', err);
          // Revert checkbox on error
          cb.checked = !cb.checked;
          alert('❌ Failed to save task: ' + (err.message || 'Please check your connection and try again.'));
        }
      }
    });
  });
  
  // ✅ NEW: Direct role messaging buttons (for Clerk/Admin/Master Clerk only)
  if (role === 'clerk' || role === 'admin' || role === 'master_clerk') {
    document.getElementById('sendToJudgeBtn')?.addEventListener('click', () => {
      if (typeof showCommunicationModal === 'function') showCommunicationModal('judge', 'Judge');
    });
    document.getElementById('sendToAttorneyBtn')?.addEventListener('click', () => {
      if (typeof showCommunicationModal === 'function') showCommunicationModal('attorney', 'Attorney');
    });
    document.getElementById('sendToPDBtn')?.addEventListener('click', () => {
      if (typeof showCommunicationModal === 'function') showCommunicationModal('public_defender', 'Public Defender');
    });
    document.getElementById('sendToDABtn')?.addEventListener('click', () => {
      if (typeof showCommunicationModal === 'function') showCommunicationModal('district_attorney', 'District Attorney');
    });
    document.getElementById('sendToBailiffBtn')?.addEventListener('click', () => {
      if (typeof showCommunicationModal === 'function') showCommunicationModal('bailiff', 'Bailiff');
    });
    document.getElementById('sendToMarshalBtn')?.addEventListener('click', () => {
      if (typeof showCommunicationModal === 'function') showCommunicationModal('marshal', 'Marshal');
    });
    document.getElementById('sendToReporterBtn')?.addEventListener('click', () => {
      if (typeof showCommunicationModal === 'function') showCommunicationModal('reporter', 'Reporter');
    });
    document.getElementById('sendToPoliceBtn')?.addEventListener('click', () => {
      if (typeof showCommunicationModal === 'function') showCommunicationModal('police', 'Police');
    });
    document.getElementById('sendToCJBtn')?.addEventListener('click', () => {
      if (typeof showCommunicationModal === 'function') showCommunicationModal('chief_justice', 'Chief Justice');
    });
    document.getElementById('sendToAllDOJBtn')?.addEventListener('click', () => {
      if (typeof showCommunicationModal === 'function') showCommunicationModal('all_doj_roles', 'All DOJ Roles');
    });
  } else {
    // ✅ For other roles: "Send to Clerk" button includes BOTH clerk AND admin roles
    document.getElementById('sendToClerkBtn')?.addEventListener('click', () => {
      if (typeof showCommunicationModal === 'function') {
        // ✅ Pass special flag to include both clerk AND admin/master_clerk users
        showCommunicationModal('clerk_or_admin', 'Clerk/Admin');
      }
    });
    document.getElementById('sendToDABtn')?.addEventListener('click', () => {
      if (typeof showCommunicationModal === 'function') showCommunicationModal('district_attorney', 'District Attorney');
    });
    document.getElementById('sendToCJBtn')?.addEventListener('click', () => {
      if (typeof showCommunicationModal === 'function') showCommunicationModal('chief_justice', 'Chief Justice');
    });
  }
  
  // Role-specific buttons
  if (role === 'judge') {
    // ✅ Recusal button - use new modal
    document.getElementById('recusalBtn')?.addEventListener('click', () => {
      if (typeof showRecusalModal === 'function') {
        showRecusalModal();
      } else {
        alert('Recusal request form (coming soon)');
      }
    });
    
    // ✅ Sentencing button (placeholder for now)
    document.getElementById('sentencingBtn')?.addEventListener('click', () => {
      alert('📝 Sentencing form (coming soon)\n\nThis will allow you to upload professional sentencing letters to the Drive folder and update the CaseRegistry.');
    });
    
    // ✅ Official Letter button - use new modal
    document.getElementById('officialLetterBtn')?.addEventListener('click', () => {
      if (typeof showOfficialLetterModal === 'function') {
        showOfficialLetterModal();
      } else {
        alert('Official letter form (coming soon)');
      }
    });
    
  } else if (role === 'attorney') {
    document.getElementById('recusalBtn')?.addEventListener('click', () => {
      if (typeof showRecusalModal === 'function') {
        showRecusalModal();
      } else {
        alert('Recusal request form (coming soon)');
      }
    });
    document.getElementById('trustWithdrawalBtn')?.addEventListener('click', () => alert('Trust withdrawal form (coming soon)'));
    document.getElementById('trustDepositBtn')?.addEventListener('click', () => alert('Trust deposit form (coming soon)'));
  } else if (role === 'public_defender') {
    document.getElementById('recusalBtn')?.addEventListener('click', () => {
      if (typeof showRecusalModal === 'function') {
        showRecusalModal();
      } else {
        alert('Recusal request form (coming soon)');
      }
    });
    document.getElementById('pdReportBtn')?.addEventListener('click', () => {
      if (typeof showPDReportForm === 'function') {
        showPDReportForm();
      } else {
        alert('Criminal report form (coming soon)');
      }
    });
  } else if (role === 'district_attorney') {
    if (typeof attachDAEventListeners === 'function') {
      attachDAEventListeners();
    }
  } else if (role === 'police') {
    document.getElementById('policeReportBtn')?.addEventListener('click', () => {
      if (typeof showPoliceReportForm === 'function') {
        showPoliceReportForm();
      } else {
        alert('Criminal report form (coming soon)');
      }
    });
  } else if (role === 'bailiff') {
    document.getElementById('serviceProcessBtn')?.addEventListener('click', () => alert('Service of process (coming soon)'));
  } else if (role === 'reporter') {
    document.getElementById('uploadTranscriptBtn')?.addEventListener('click', () => alert('Upload transcript URL (coming soon)'));
  } else if (role === 'admin' || role === 'master_clerk') {
    document.getElementById('userMgmtBtn')?.addEventListener('click', () => window.open(usersSheetUrl, '_blank'));
    document.getElementById('assignJudgeBtn')?.addEventListener('click', () => alert('Auto-assign judges (coming soon)'));
    document.getElementById('recusalQueueBtn')?.addEventListener('click', () => {
      if (typeof showRecusalQueue === 'function') {
        showRecusalQueue();
      } else {
        alert('Recusal queue (coming soon)');
      }
    });
    document.getElementById('financialAuditBtn')?.addEventListener('click', () => alert('Financial summary (coming soon)'));
    document.getElementById('offlineDuesBtn')?.addEventListener('click', () => window.open(offlineDuesSheetUrl, '_blank'));
    // ✅ AUDIT PLACEHOLDER BUTTONS - Admin/Master Clerk
    document.getElementById('cleanupFilesBtn')?.addEventListener('click', () => {
      alert('🧹 Clean-up Files feature coming soon!\n\nThis will help audit and organize case files in Google Drive.');
    });
    document.getElementById('issueMarriageBtn')?.addEventListener('click', () => {
      alert('💒 Issue Marriage Certificates feature coming soon!\n\nThis will generate and send official marriage certificates.');
    });
  } else if (role === 'marshal') {
    document.getElementById('transportRequestBtn')?.addEventListener('click', () => requestTransport());
    document.getElementById('warrantServiceBtn')?.addEventListener('click', () => serveWarrant());
    document.getElementById('manhuntReportBtn')?.addEventListener('click', () => reportManhunt());
    document.getElementById('securityLogBtn')?.addEventListener('click', () => submitSecurityReport());
  } else if (role === 'chief_justice') {
    document.getElementById('cjViewRecusalsBtn')?.addEventListener('click', () => {
      if (typeof showRecusalQueue === 'function') {
        showRecusalQueue();
      } else {
        alert('Recusal queue (coming soon)');
      }
    });
    document.getElementById('cjAssignJudgeBtn')?.addEventListener('click', () => alert('Manual judge assignment (coming soon)'));
    document.getElementById('cjViewAuditBtn')?.addEventListener('click', () => window.open(allFilingsSheetUrl, '_blank'));
    document.getElementById('cjUserMgmtBtn')?.addEventListener('click', () => window.open(usersSheetUrl, '_blank'));
    // ✅ AUDIT PLACEHOLDER BUTTONS - Chief Justice
    document.getElementById('cleanupFilesBtn')?.addEventListener('click', () => {
      alert('🧹 Clean-up Files feature coming soon!\n\nThis will help audit and organize case files in Google Drive.');
    });
    document.getElementById('issueMarriageBtn')?.addEventListener('click', () => {
      alert('💒 Issue Marriage Certificates feature coming soon!\n\nThis will generate and send official marriage certificates.');
    });
  }
  
  // Training button
  document.getElementById('trainingBtn')?.addEventListener('click', () => {
    if (typeof showTrainingModal === 'function') {
      showTrainingModal(role);
    } else {
      alert('Training materials (coming soon)');
    }
  });
  
  // Availability
  if (typeof initAvailability === 'function') {
    initAvailability();
  }
}

/**
 * Render scheduling section (work calendar)
 */
function renderScheduling() {
  // Generate next 14 days
  const today = new Date();
  const days = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toLocaleDateString('en-US'); // "M/d/yyyy" format
    days.push({
      date: date,
      dateStr: dateStr,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      availability: userAvailability[currentUser?.name]?.[dateStr] || '—'
    });
  }
  
  return `
    <div class="card p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-white">📅 Work Schedule (Next 2 Weeks)</h3>
        <button onclick="showAvailabilityForm()" class="btn-primary text-sm py-1 px-3 rounded-lg">✏️ Update</button>
      </div>
      <div class="grid grid-cols-7 gap-2 text-sm">
        ${days.map(d => `
          <div class="text-center p-2 bg-gray-700/30 rounded hover:bg-gray-700/50 transition">
            <div class="font-medium text-gray-300">${d.dayName}</div>
            <div class="text-xs text-gray-400">${d.dateStr}</div>
            <div class="mt-1 text-xs font-semibold ${getAvailabilityColor(d.availability)}">
              ${d.availability}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Helper: Color-code availability status
 */
function getAvailabilityColor(availability) {
  const val = String(availability).toLowerCase();
  if (val.includes('morning')) return 'text-blue-400';
  if (val.includes('afternoon')) return 'text-yellow-400';
  if (val.includes('evening')) return 'text-purple-400';
  if (val.includes('unavailable') || val.includes('off')) return 'text-red-400 line-through';
  return 'text-gray-400';
}

/**
 * Render DA Dashboard (called from renderDashboardByRole)
 */
async function renderDADashboard() {
  let pendingReports = [];
  try {
    const reportsData = await apiCall('getPendingReports');
    pendingReports = reportsData.reports || [];
  } catch (err) {
    console.error('Failed to load pending reports:', err);
  }
  
  return `
    <div class="card p-6 mb-6">
      <div class="flex items-center gap-2 text-[#facc15] font-semibold text-lg mb-3">
        <i data-lucide="file-text"></i> Pending Reports
      </div>
      <div id="pendingReportsList" class="space-y-2">
        ${pendingReports.length > 0 ? pendingReports.map(r => `
          <div class="border border-gray-700 rounded p-3 flex justify-between items-center">
            <div>
              <strong>${r.type.toUpperCase()}</strong> - ${r.defendant}<br>
              <span class="text-sm text-gray-400">Submitted: ${new Date(r.timestamp).toLocaleDateString()}</span>
            </div>
            <div class="flex gap-2">
              <button onclick="approveReport(${r.id})" class="btn-primary text-sm py-1 px-3 rounded-lg">Approve</button>
              <button onclick="denyReport(${r.id})" class="btn-secondary text-sm py-1 px-3 rounded-lg">Deny</button>
            </div>
          </div>
        `).join('') : '<div class="text-gray-400">No pending reports</div>'}
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

/**
 * U.S. Marshal Functions
 * Replace the alerts with actual API calls or modal forms.
 */
function requestTransport() {
  alert(`🚔 Prisoner Transport Request (coming soon)\n\nSubmit a request to transport a prisoner from Bolingbroke Penitentiary to court.`);
  // TODO: Open a modal with fields: prisoner name, case number, destination, date/time, security level.
  // Then call apiCall('requestTransport', { ... })
}

function serveWarrant() {
  alert(`📜 Serve Federal Warrant (coming soon)\n\nLog the service of a federal arrest warrant.`);
  // TODO: Open a modal with: warrant number, defendant name, date served, status (served / not found / etc.)
  // Then call apiCall('serveWarrant', { ... })
}

function reportManhunt() {
  alert(`🔍 Manhunt Status Report (coming soon)\n\nReport the status of an active manhunt for an escaped felon.`);
  // TODO: Open a modal with: suspect name, last known location, status (active / suspended / concluded).
  // Then call apiCall('reportManhunt', { ... })
}

function submitSecurityReport() {
  alert(`📋 Court Security Log (coming soon)\n\nSubmit a security report for a court session.`);
  // TODO: Open a modal with: date, judge name, case number, security incidents (none / warnings / arrests).
  // Then call apiCall('submitSecurityReport', { ... })
}

/**
 * Attach DA event listeners (called from attachDashboardEventListeners)
 */
function attachDAEventListeners() {
  document.getElementById('daFileChargesBtn')?.addEventListener('click', () => alert('File charges form (coming soon)'));
  document.getElementById('daRequestEvidenceBtn')?.addEventListener('click', () => alert('Request evidence form (coming soon)'));
  
  // Approve/Deny report buttons (inline onclick handlers)
  window.approveReport = async (id) => {
    try {
      await apiCall('approveReport', { id, approved_by: currentUser.name });
      alert('✅ Report approved!');
      renderDashboardByRole(); // Refresh dashboard
    } catch (err) {
      alert('❌ Failed to approve: ' + err.message);
    }
  };
  
  window.denyReport = async (id) => {
    try {
      await apiCall('denyReport', { id });
      alert('✅ Report denied!');
      renderDashboardByRole(); // Refresh dashboard
    } catch (err) {
      alert('❌ Failed to deny: ' + err.message);
    }
  };
}

/**
 * Show recusal queue modal (for admin/CJ)
 */
function showRecusalQueue() {
  alert('⚖️ Recusal Queue (coming soon)\n\nThis will show pending recusal requests for Chief Justice review.');
}

/**
 * Show recusal request form (for judges/attorneys) - DEPRECATED, use showRecusalModal instead
 */
function submitRecusal() {
  // Redirect to new modal if available
  if (typeof showRecusalModal === 'function') {
    showRecusalModal();
  } else {
    alert('⚖️ Recusal Request Form (coming soon)\n\nSubmit a request to be recused from a case.');
  }
}

/**
 * Show PD report form
 */
function showPDReportForm() {
  alert('📋 Criminal Report Form (coming soon)\n\nSubmit a criminal report to the District Attorney.');
}

/**
 * Show police report form
 */
function showPoliceReportForm() {
  alert('🚨 Criminal Report Form (coming soon)\n\nFile a criminal report for DA review.');
}

/**
 * Show training modal
 */
function showTrainingModal(role) {
  alert(`📚 Training Materials for ${role}\n\nTraining content coming soon!`);
}

// ============================================================================
// 🔹 MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================================================
window.renderDashboardByRole = renderDashboardByRole;
window.attachDashboardEventListeners = attachDashboardEventListeners;
window.renderScheduling = renderScheduling;
window.getAvailabilityColor = getAvailabilityColor;
window.renderDADashboard = renderDADashboard;
window.attachDAEventListeners = attachDAEventListeners;
window.showRecusalQueue = showRecusalQueue;
window.submitRecusal = submitRecusal; // Keep for backward compatibility
window.showRecusalModal = showRecusalModal; // NEW: Full recusal modal
window.showOfficialLetterModal = showOfficialLetterModal; // NEW: Official letter modal
window.showPDReportForm = showPDReportForm;
window.showPoliceReportForm = showPoliceReportForm;
window.requestTransport = requestTransport;
window.serveWarrant = serveWarrant;
window.reportManhunt = reportManhunt;
window.submitSecurityReport = submitSecurityReport;
window.showTrainingModal = showTrainingModal;
window.formatDateForDisplay = formatDateForDisplay;
