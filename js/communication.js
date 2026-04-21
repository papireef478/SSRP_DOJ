// ============================================================================
// COMMUNICATION SYSTEM - ROLE-BASED MESSAGING
// ============================================================================

// ============================================================================
// 🔹 HELPER: Fetch DOJ users by role from backend (CORS-friendly)
// ============================================================================
async function fetchDOJUsersByRole(roleFilter) {
  try {
    // ✅ Handle special "clerk_or_admin" filter for combined Clerk/Admin dropdown
    const actualRole = roleFilter === 'clerk_or_admin' ? 'clerk' : roleFilter;
    const url = `${API_URL}?action=getDOJUsers&role=${encodeURIComponent(actualRole)}`;
    const response = await fetch(url);
    const result = await response.json();
    let users = result.success ? result.users : [];

    // ✅ If filtering for clerk_or_admin, ALSO include admin/master_clerk users
    if (roleFilter === 'clerk_or_admin') {
      const adminUrl = `${API_URL}?action=getDOJUsers&role=admin`;
      const adminResponse = await fetch(adminUrl);
      const adminResult = await adminResponse.json();
      if (adminResult.success) {
        users = [...users, ...adminResult.users];
      }
    }

    return users;
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return [];
  }
}

// ============================================================================
// 🔹 DYNAMIC URL FIELDS: +/- buttons for multiple URLs (MAX 2)
// ============================================================================
function addUrlField() {
  const container = document.getElementById('urlFieldsContainer');
  if (!container) return;
  
  // ✅ LIMIT: Only allow 2 URL fields max
  if (container.children.length >= 2) {
    alert('Maximum 2 URL links allowed per message.');
    return;
  }
  
  const div = document.createElement('div');
  div.className = 'flex gap-2 items-center animate-fade-in';
  div.innerHTML = `
    <input type="url" name="messageUrl" class="flex-1 p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="https://example.com">
    <button type="button" onclick="addUrlField()" class="text-green-400 hover:text-green-300 text-xl font-bold" title="Add URL">+</button>
    <button type="button" onclick="removeUrlField(this)" class="text-red-400 hover:text-red-300 text-xl font-bold" title="Remove">×</button>
  `;
  
  container.appendChild(div);
  
  // Hide "+" on all but last field (and only if < 2 fields)
  container.querySelectorAll('button[onclick="addUrlField()"]').forEach((btn, idx, arr) => {
    btn.classList.toggle('hidden', idx < arr.length - 1 || arr.length >= 2);
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
      
      <!-- ✅ MULTI-URL FIELDS WITH +/- BUTTONS (MAX 2) -->
      <div class="mb-4">
        <label class="block text-gray-300 mb-2 text-sm font-medium">URL Links (optional, max 2):</label>
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
    
    // ✅ Add visual indicator for combined Clerk/Admin dropdown
    if (targetRole === 'clerk_or_admin') {
      const note = document.createElement('div');
      note.className = 'text-xs text-gray-400 mt-1';
      note.textContent = 'Includes all Clerks and Admins/Master Clerks';
      recipientSelect.parentNode.appendChild(note);
    }
  }).catch(err => {
    recipientSelect.innerHTML = `<option value="" disabled>❌ Error loading users</option>`;
    console.error('User fetch error:', err);
  });
  
  // Attach send handler for normal mode
  setupSendMessageHandler(targetRole, targetLabel, false);
}

// ============================================================================
// 🔹 SETUP SEND BUTTON HANDLER
// ============================================================================
function setupSendMessageHandler(targetRole, targetLabel, isReplyMode) {
  document.getElementById('sendMessageBtn')?.addEventListener('click', async () => {
    const sendBtn = document.getElementById('sendMessageBtn');
    const originalBtnText = sendBtn.innerHTML;
    
    sendBtn.disabled = true;
    sendBtn.innerHTML = '⏳Sending...';
    
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
      
      // ✅ VALIDATION: Limit to 2 URLs max
      if (urlsArray.length > 2) {
        alert('⚠️ Maximum 2 URL links allowed per message. Please remove excess links.');
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalBtnText;
        return;
      }
      
      // Validation
      if (!currentUser?.name) {
        alert('⚠️ Please log in first to send messages.');
        return;
      }
      if (!body) {
        alert('Please enter a message.');
        return;
      }
      if (!recipient && !isReplyMode) {
        alert('Please select a recipient.');
        return;
      }
      
      // Determine recipients array
      let recipientsArray;
      if (isReplyMode) {
        recipientsArray = [recipient];
      } else if (recipient === 'all') {
        recipientsArray = [targetRole].filter(r => r && r.trim() !== '');
      } else {
        recipientsArray = [recipient].filter(r => r && r.trim() !== '');
      }
      
      // ✅ Get thread_id if replying
      const threadId = document.getElementById('replyThreadId')?.value || null;
      
      // ✅ FIX: Capture the API response properly
      const apiResponse = await apiCall('sendMessage', {
        recipientNames: recipientsArray,
        message: body,
        sender: currentUser.name,
        targetRole: isReplyMode ? null : targetRole,
        subject: subject || '',
        urls: urlsArray,
        thread_id: threadId
      });
      
      // ✅ Check response
      if (!apiResponse || !apiResponse.success) {
        throw new Error(apiResponse?.error || 'Unknown error');
      }
      
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
      
      closeModal('globalModal');
      
      // ✅ FIX 1: Add sent message to LOCAL notifications array immediately so sender sees it
      if (typeof dojNotifications !== 'undefined' && apiResponse?.thread_id) {
        const sentNotif = {
          id: Date.now(), // temporary local ID
          thread_id: apiResponse.thread_id,
          sender_name: currentUser.name,
          recipient_name: recipient || targetLabel,
          subject: subject || '',
          text: `📨 Message sent to ${recipient || targetLabel}${subject ? ': ' + subject : ''}`,
          message: body,
          url: urlsArray[0] || '',
          urls: urlsArray,
          created_at: new Date().toISOString(),
          read: true, // Mark as read since sender just sent it
          expires_at: new Date(Date.now() + 14*24*60*60*1000).toISOString()
        };
        // Avoid duplicates
        if (!dojNotifications.find(n => n.thread_id === apiResponse.thread_id)) {
          dojNotifications.unshift(sentNotif);
        }
        // Re-render UI instantly
        if (typeof updateNotificationBadge === 'function') updateNotificationBadge();
        if (typeof renderNotificationPanel === 'function') renderNotificationPanel();
        if (typeof renderDojNotifications === 'function') renderDojNotifications();
      }
      
      // ✅ FIX 2: Use apiResponse (not undefined 'result') to open new thread
      if (!threadId && apiResponse?.thread_id) {
        const partnerName = isReplyMode ? recipient : (recipient === 'all' ? targetLabel : recipient);
        setTimeout(async () => {
          if (typeof openThreadView === 'function') {
            await openThreadView(apiResponse.thread_id, partnerName);
          }
        }, 300);
      } else {
        if (currentUser?.name && typeof loadNotifications === 'function') {
          await loadNotifications();
        }
      }
      
    } catch (err) {
      console.error('Send error:', err);
      alert('❌ Failed to send: ' + (err.message || 'Unknown error'));
    } finally {
      sendBtn.disabled = false;
      sendBtn.innerHTML = originalBtnText;
    }
  });
}

// ============================================================================
// 🔹 INITIALIZE COMMUNICATION BUTTONS (CALLED FROM NAVIGATION.JS)
// ============================================================================
function initCommunicationButtons() {
  // ✅ Base buttons for ALL roles
  const buttonMap = {
    'sendToClerkBtn': ['clerk_or_admin', 'Clerk/Admin'], // ✅ Combined Clerk/Admin for non-clerk roles
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
  
  // ✅ Clerk/Admin/Master Clerk: Individual role buttons for ALL DOJ roles
  if (currentUser?.role === 'clerk' || currentUser?.role === 'admin' || currentUser?.role === 'master_clerk') {
    // Judge button
    const judgeBtn = document.getElementById('sendToJudgeBtn');
    if (judgeBtn) judgeBtn.addEventListener('click', () => showCommunicationModal('judge', 'Judge'));
    
    // Attorney button
    const attyBtn = document.getElementById('sendToAttorneyBtn');
    if (attyBtn) attyBtn.addEventListener('click', () => showCommunicationModal('attorney', 'Attorney'));
    
    // Public Defender button
    const pdBtn = document.getElementById('sendToPDBtn');
    if (pdBtn) pdBtn.addEventListener('click', () => showCommunicationModal('public_defender', 'Public Defender'));
    
    // DA button (already in buttonMap, but ensure it works for clerks)
    const daBtn = document.getElementById('sendToDABtn');
    if (daBtn) daBtn.addEventListener('click', () => showCommunicationModal('district_attorney', 'District Attorney'));
    
    // Bailiff button
    const bailiffBtn = document.getElementById('sendToBailiffBtn');
    if (bailiffBtn) bailiffBtn.addEventListener('click', () => showCommunicationModal('bailiff', 'Bailiff'));
    
    // Marshal button
    const marshalBtn = document.getElementById('sendToMarshalBtn');
    if (marshalBtn) marshalBtn.addEventListener('click', () => showCommunicationModal('marshal', 'Marshal'));
    
    // Reporter button
    const reporterBtn = document.getElementById('sendToReporterBtn');
    if (reporterBtn) reporterBtn.addEventListener('click', () => showCommunicationModal('reporter', 'Reporter'));
    
    // Police button (already in buttonMap, but ensure it works for clerks)
    const policeBtn = document.getElementById('sendToPoliceBtn');
    if (policeBtn) policeBtn.addEventListener('click', () => showCommunicationModal('police', 'Police'));
    
    // Chief Justice button (already in buttonMap, but ensure it works for clerks)
    const cjBtn = document.getElementById('sendToCJBtn');
    if (cjBtn) cjBtn.addEventListener('click', () => showCommunicationModal('chief_justice', 'Chief Justice'));
    
    // Send to All DOJ Roles button
    const sendToAllBtn = document.getElementById('sendToAllDOJBtn');
    if (sendToAllBtn) {
      sendToAllBtn.addEventListener('click', () => {
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
    }
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
