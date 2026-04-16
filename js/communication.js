// ============================================================================
// 🔹 HELPER: Fetch DOJ users by role from backend (CORS-friendly)
// ============================================================================
async function fetchDOJUsersByRole(roleFilter) {
  try {
    const url = `${API_URL}?action=getDOJUsers&role=${encodeURIComponent(roleFilter)}`;
    const response = await fetch(url);
    const result = await response.json();
    return result.success ? result.users : [];
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return [];
  }
}

// ============================================================================
// 🔹 DYNAMIC URL FIELDS: +/- buttons for multiple URLs
// ============================================================================
function addUrlField() {
  const container = document.getElementById('urlFieldsContainer');
  if (!container) return;
  
  const div = document.createElement('div');
  div.className = 'flex gap-2 items-center animate-fade-in';
  div.innerHTML = `
    <input type="url" name="messageUrl" class="flex-1 p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="https://example.com">
    <button type="button" onclick="addUrlField()" class="text-green-400 hover:text-green-300 text-xl font-bold" title="Add URL">+</button>
    <button type="button" onclick="removeUrlField(this)" class="text-red-400 hover:text-red-300 text-xl font-bold" title="Remove">×</button>
  `;
  container.appendChild(div);
  
  // Hide "+" on all but last field
  container.querySelectorAll('button[onclick="addUrlField()"]').forEach((btn, idx, arr) => {
    btn.classList.toggle('hidden', idx < arr.length - 1);
  });
  // Show "×" on all fields when >1
  container.querySelectorAll('button[onclick^="removeUrlField"]').forEach(btn => {
    btn.classList.toggle('hidden', container.children.length <= 1);
  });
}

function removeUrlField(btn) {
  const container = document.getElementById('urlFieldsContainer');
  if (!container || container.children.length <= 1) return;
  
  btn.closest('.flex').remove();
  
  // Re-adjust "+" and "×" visibility
  container.querySelectorAll('button[onclick="addUrlField()"]').forEach((btn, idx, arr) => {
    btn.classList.toggle('hidden', idx < arr.length - 1);
  });
  container.querySelectorAll('button[onclick^="removeUrlField"]').forEach(btn => {
    btn.classList.toggle('hidden', container.children.length <= 1);
  });
}

// ============================================================================
// 🔹 SHOW MODAL WITH ROLE-FILTERED USER DROPDOWN
// ============================================================================
/**
 * Show communication modal to send message
 * @param {string} targetRole - Role to send to (e.g., 'clerk', 'admin') - use 'any' for replies
 * @param {string} targetLabel - Display label (e.g., 'Master Clerk')
 */
function showCommunicationModal(targetRole, targetLabel) {
  // ✅ CHECK FOR REPLY MODE via global window.replyContext (set by notifications.js)
  const replyContext = window.replyContext;
  const isReplyMode = replyContext?.replyTo;
  
  // Build recipient options based on mode
  let recipientOptions = '';
  if (isReplyMode) {
    // ✅ REPLY MODE: Lock recipient to original sender, skip role filtering
    recipientOptions = `<option value="${replyContext.replyTo}" selected>↩ ${replyContext.replyTo} (replying)</option>`;
  } else {
    // Normal mode: Build role-filtered options
    recipientOptions = `
      <option value="">-- Select a ${targetLabel} --</option>
      <option value="all">📢 All ${targetLabel}s</option>
      <option disabled>⏳ Loading users...</option>
    `;
  }
  
  // Show modal HTML
  showModal(`
    <div class="p-4">
      <h3 class="text-xl font-bold mb-4 text-white">
        ${isReplyMode ? '↩ Reply to Message' : `Send Message to ${targetLabel}`}
      </h3>
      
      <!-- Recipient Field -->
      <div class="mb-4">
        <label class="block text-gray-300 mb-2 text-sm font-medium">Recipient:</label>
        <select id="recipientSelect" class="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[#c9a227]" ${isReplyMode ? 'disabled' : ''}>
          ${recipientOptions}
        </select>
      </div>
      
      <!-- Subject Field -->
      <div class="mb-4">
        <label class="block text-gray-300 mb-2 text-sm font-medium">Subject:</label>
        <input type="text" id="messageSubject" class="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white" 
               value="${isReplyMode && replyContext?.subject ? (replyContext.subject.startsWith('Re:') ? replyContext.subject : 'Re: ' + replyContext.subject) : ''}" 
               placeholder="Subject line...">
      </div>
      
      <!-- ✅ REPLY MODE: Show original message preview -->
      ${isReplyMode && replyContext?.message ? `
        <div class="mb-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
          <label class="block text-gray-400 mb-1 text-xs font-medium">Original Message:</label>
          <div class="text-sm text-gray-300 whitespace-pre-wrap max-h-24 overflow-y-auto">
            ${replyContext.message.split('\n').map(line => `> ${line}`).join('\n')}
          </div>
        </div>
      ` : ''}
      
      <!-- Message Body -->
      <div class="mb-4">
        <label class="block text-gray-300 mb-2 text-sm font-medium">${isReplyMode ? 'Your Reply:' : 'Message:'}</label>
        <textarea id="messageBody" class="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white h-32" placeholder="${isReplyMode ? 'Type your reply...' : 'Type your message...'}"></textarea>
      </div>
      
      <!-- ✅ MULTI-URL FIELDS WITH +/- BUTTONS -->
      <div class="mb-4">
        <label class="block text-gray-300 mb-2 text-sm font-medium">URL Links (optional):</label>
        <div id="urlFieldsContainer" class="space-y-2">
          <div class="flex gap-2 items-center">
            <input type="url" name="messageUrl" class="flex-1 p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="https://example.com">
            <button type="button" onclick="addUrlField()" class="text-green-400 hover:text-green-300 text-xl font-bold" title="Add URL">+</button>
            <button type="button" onclick="removeUrlField(this)" class="text-red-400 hover:text-red-300 text-xl font-bold hidden" title="Remove">×</button>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex gap-3 justify-end">
        <button id="sendMessageBtn" class="btn-primary py-2 px-4 rounded-lg">${isReplyMode ? 'Send Reply' : 'Send Message'}</button>
        <button onclick="closeModal('globalModal')" class="btn-secondary py-2 px-4 rounded-lg">Cancel</button>
      </div>
    </div>
  `);
  
  // ✅ REPLY MODE: Skip user fetching, pre-fill fields, store thread_id
  if (isReplyMode) {
    // Store thread_id for backend grouping
    if (replyContext.threadId) {
      let hidden = document.getElementById('replyThreadId');
      if (!hidden) {
        hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.id = 'replyThreadId';
        document.getElementById('globalModal')?.querySelector('.p-4')?.appendChild(hidden);
      }
      hidden.value = replyContext.threadId;
    }
    
    // Pre-fill message body with quoted original if not already done via template
    if (replyContext.message) {
      const messageBody = document.getElementById('messageBody');
      if (messageBody && !messageBody.value) {
        const quoted = replyContext.message.split('\n').map(line => `> ${line}`).join('\n');
        messageBody.value = `\n\n--- Original Message ---\n${quoted}\n\n`;
      }
      messageBody?.focus();
    }
    
    // Clear reply context after use
    delete window.replyContext;
    
    // Attach send handler for reply mode
    setupSendMessageHandler(targetRole, targetLabel, true);
    return; // Skip normal user-fetching flow
  }
  
  // ✅ NORMAL MODE: Fetch users and populate dropdown
  const recipientSelect = document.getElementById('recipientSelect');
  fetchDOJUsersByRole(targetRole).then(users => {
    recipientSelect.innerHTML = `
      <option value="">-- Select a ${targetLabel} --</option>
      <option value="all">📢 All ${targetLabel}s</option>
    `;
    
    if (users.length === 0) {
      recipientSelect.innerHTML += `<option value="" disabled>😕 No active ${targetLabel}s available</option>`;
    } else {
      users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.name;
        option.textContent = `${user.name}${user.discord_id ? ` (${user.discord_id})` : ''}`;
        recipientSelect.appendChild(option);
      });
    }
  }).catch(err => {
    recipientSelect.innerHTML = `<option value="" disabled>❌ Error loading users</option>`;
    console.error('User fetch error:', err);
  });
  
  // Attach send handler for normal mode
  setupSendMessageHandler(targetRole, targetLabel, false);
}

/**
 * Setup send button handler (shared logic for reply and normal modes)
 */
function setupSendMessageHandler(targetRole, targetLabel, isReplyMode) {
  document.getElementById('sendMessageBtn')?.addEventListener('click', async () => {
    const sendBtn = document.getElementById('sendMessageBtn');
    const originalBtnText = sendBtn.innerHTML;
    
    // Disable button and show loading state
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="animate-spin mr-2">⏳</span>Sending...';
    
    try {
      const recipientSelect = document.getElementById('recipientSelect');
      const recipient = recipientSelect?.value;
      const subject = document.getElementById('messageSubject')?.value?.trim();
      const body = document.getElementById('messageBody')?.value?.trim();
      
      // ✅ COLLECT ALL URLS from dynamic fields
      const urlInputs = document.querySelectorAll('#urlFieldsContainer input[name="messageUrl"]');
      const urlsArray = Array.from(urlInputs)
        .map(input => input.value?.trim())
        .filter(url => url && url.startsWith('http'));
      
      // Validation
      if (!currentUser?.name) {
        alert('⚠️ Please log in first to send messages.');
        return;
      }
      if (!body) { alert('Please enter a message.'); return; }
      if (!recipient && !isReplyMode) { alert('Please select a recipient.'); return; }
      
      // Determine recipients array
      let recipientsArray;
      if (isReplyMode) {
        // ✅ Reply mode: Send only to the locked recipient
        recipientsArray = [recipient];
      } else if (recipient === 'all') {
        recipientsArray = [targetRole].filter(r => r && r.trim() !== '');
      } else {
        recipientsArray = [recipient].filter(r => r && r.trim() !== '');
      }
      
      // ✅ Get thread_id if replying
      const threadId = document.getElementById('replyThreadId')?.value || null;
      
      // Send via apiCall - ✅ include urls array and thread_id
      await apiCall('sendMessage', {
        recipientNames: recipientsArray,
        message: body,
        sender: currentUser.name,
        targetRole: isReplyMode ? null : targetRole,
        subject: subject || '',
        urls: urlsArray,  // ✅ Send array of URLs
        thread_id: threadId  // ✅ Include thread_id for conversation grouping
      });
      
      // Success feedback
      let msg;
      if (isReplyMode) {
        msg = `✅ Reply sent to ${recipient}.`;
      } else if (recipient === 'all') {
        msg = `✅ Message sent to all ${targetLabel}s.`;
      } else {
        msg = `✅ Message sent to ${recipient}.`;
      }
      alert(msg);
      
      // Close modal and refresh notifications
      closeModal('globalModal');
      if (currentUser?.name && typeof loadNotifications === 'function') {
        await loadNotifications();
      }
      
    } catch (err) {
      console.error('Send error:', err);
      alert('❌ Failed to send: ' + (err.message || 'Unknown error'));
    } finally {
      // Re-enable button regardless of success/failure
      sendBtn.disabled = false;
      sendBtn.innerHTML = originalBtnText;
    }
  });
}

// ============================================================================
// 🔹 Initialize communication buttons (called from navigation.js)
// ============================================================================
function initCommunicationButtons() {
  const buttonMap = {
    'sendToClerkBtn': ['clerk', 'Clerk'],
    'sendToMasterClerkBtn': ['admin', 'Master Clerk'],
    'sendToDABtn': ['district_attorney', 'District Attorney'],
    'sendToCJBtn': ['chief_justice', 'Chief Justice'],
    'sendToPoliceBtn': ['police', 'Police']
  };
  
  for (const [btnId, [role, label]] of Object.entries(buttonMap)) {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', () => {
        showCommunicationModal(role, label);
      });
    }
  }
  
  // ✅ "Send to All DOJ Roles" button - ONLY for authorized roles (Clerks, Master Clerks, CJ)
  const sendToAllBtn = document.getElementById('sendToAllDOJBtn');
  if (sendToAllBtn && ['clerk', 'admin', 'chief_justice'].includes(currentUser?.role)) {
    sendToAllBtn.addEventListener('click', () => {
      // Open modal with special handling for all_doj_roles broadcast
      if (typeof showCommunicationModal === 'function') {
        window.replyContext = { 
          replyTo: 'all_doj_roles', 
          threadId: null, 
          subject: 'ANNOUNCEMENT', 
          message: '' 
        };
        showCommunicationModal('any', 'All DOJ Roles');
      }
    });
  } else if (sendToAllBtn) {
    // Hide button for unauthorized roles
    sendToAllBtn.style.display = 'none';
  }
}

// ============================================================================
// 🔹 MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================================================
window.fetchDOJUsersByRole = fetchDOJUsersByRole;
window.showCommunicationModal = showCommunicationModal;
window.initCommunicationButtons = initCommunicationButtons;
window.addUrlField = addUrlField;
window.removeUrlField = removeUrlField;