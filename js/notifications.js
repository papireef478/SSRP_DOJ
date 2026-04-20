// ============================================================================
// NOTIFICATIONS SYSTEM - ENHANCED WITH ACTIONS & VISUAL INDICATORS
// ============================================================================
// NOTE: dojNotifications is declared in config.js - DO NOT redeclare here!

// ============================================================================
// 🔹 HELPER: Safely parse & render message with clickable hyperlinks
// ============================================================================
function renderMessageWithLinks(messageText, urlsParam) {
  const escapeHtml = (str) => {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };
  
  let html = escapeHtml(messageText || '');
  let urlsArray = [];
  
  if (urlsParam) {
    if (Array.isArray(urlsParam)) {
      urlsArray = urlsParam.filter(u => u && u.trim());
    } else if (typeof urlsParam === 'string') {
      if (urlsParam.trim().startsWith('[')) {
        try { urlsArray = JSON.parse(urlsParam); } catch(e) { urlsArray = []; }
      } else if (urlsParam.includes(',')) {
        urlsArray = urlsParam.split(',').map(u => u.trim()).filter(u => u);
      } else if (urlsParam.trim().startsWith('http')) {
        urlsArray = [urlsParam.trim()];
      }
    }
  }
  
  if (urlsArray.length > 0) {
    const uniqueUrls = [...new Set(urlsArray)].filter(u => u && u.trim());
    uniqueUrls.forEach(url => {
      const safeUrl = url.startsWith('http') ? url : `https://${url}`;
      const displayText = url.length > 40 ? url.substring(0, 37) + '...' : url;
      html += `<br><a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener" class="msg-link">🔗 ${escapeHtml(displayText)}</a>`;
    });
  }
  
  return html;
}

// ============================================================================
// 🔹 HELPER: Group notifications by thread to avoid duplicates
// ============================================================================
function groupNotificationsByThread(notifications) {
  const threadMap = new Map();
  
  notifications.forEach(n => {
    const threadId = n.thread_id || ('msg_' + n.id);
    
    if (threadMap.has(threadId)) {
      // Keep the most recent version of this thread
      const existing = threadMap.get(threadId);
      const newDate = new Date(n.created_at);
      const existingDate = new Date(existing.created_at);
      
      if (newDate > existingDate) {
        // Update with newer message but preserve read status if already read
        n.read = existing.read || n.read;
        threadMap.set(threadId, n);
      }
    } else {
      threadMap.set(threadId, n);
    }
  });
  
  return Array.from(threadMap.values()).sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );
}

// ============================================================================
// 🔹 HELPER: Build display text with conditional "New"/"From" prefix
// ============================================================================
function buildNotificationDisplayText(n) {
  const isUnread = !n.read;
  const senderName = n.sender_name || 'Unknown';
  
  // ✅ Backend sends clean text; frontend adds "New" prefix only for unread
  return isUnread 
    ? `📨 New message from ${senderName}` 
    : `📨 Message from ${senderName}`;
}

// ============================================================================
// 🔹 LOAD NOTIFICATIONS FROM API
// ============================================================================
async function loadNotifications() {
  if (!currentUser?.name) return;
  
  const container = document.getElementById('dojNotificationsContainer');
  if (container) {
    container.innerHTML = '⏳ Loading notifications...';
  }
  
  try {
    const result = await apiCall('getNotifications', { user_name: currentUser.name });
    
    // Clear and replace notifications
    dojNotifications.length = 0;
    dojNotifications.push(...(result.notifications || []));
    
    // Convert read field from string to boolean
    dojNotifications.forEach(n => {
      if (typeof n.read === 'string') {
        n.read = n.read.toUpperCase() === 'TRUE';
      }
    });
    
    // ✅ Group notifications by thread_id to avoid duplicates
    dojNotifications = groupNotificationsByThread(dojNotifications);
    
    updateNotificationBadge();
    renderNotificationPanel();
    renderDojNotifications();
    
  } catch (err) {
    console.error('Failed to load notifications:', err);
    if (container) {
      container.innerHTML = '❌ Error loading notifications';
    }
  }
}

// ============================================================================
// 🔹 UPDATE NOTIFICATION BADGE COUNT
// ============================================================================
function updateNotificationBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  
  const unread = dojNotifications.filter(n => {
    const isRead = typeof n.read === 'boolean' ? n.read : String(n.read).toUpperCase() === 'TRUE';
    return !isRead;
  }).length;
  
  if (unread > 0) {
    badge.textContent = unread > 9 ? '9+' : unread;
    badge.classList.remove('hidden');
    badge.classList.add('animate-pulse');
    setTimeout(() => badge.classList.remove('animate-pulse'), 2000);
  } else {
    badge.classList.add('hidden');
  }
}

// ============================================================================
// 🔹 RENDER NOTIFICATION DROPDOWN PANEL
// ============================================================================
function renderNotificationPanel() {
  const list = document.getElementById('notifList');
  if (!list) return;
  
  if (dojNotifications.length === 0) {
    list.innerHTML = '<div class="p-3 text-gray-400 text-center">No notifications</div>';
    return;
  }
  
  list.innerHTML = dojNotifications.map(n => {
    const isUnread = !n.read;
    const isExpired = n.expires_at && new Date(n.expires_at) < new Date();
    const isAnnouncement = n.subject === 'ANNOUNCEMENT';
    
    // Use sender_name from metadata (not parsed from text)
    const senderName = n.sender_name || 'Unknown';
    
    // ✅ Build display text with conditional "New"/"From" prefix
    const displayText = buildNotificationDisplayText(n);
    
    // Build thread_id: prefer real thread_id, fallback to msg_+id
    const threadId = n.thread_id || ('msg_' + n.id);
    
    return `
      <div class="p-3 border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer transition relative ${isUnread ? 'bg-[#c9a227]/10' : ''} ${isExpired ? 'opacity-50' : ''}" 
          data-id="${n.id}" 
          data-thread-id="${threadId}"
          data-sender="${senderName}">
        
        ${isUnread ? '<span class="absolute left-2 top-4 w-2 h-2 bg-[#c9a227] rounded-full"></span>' : ''}
        
        <div class="flex justify-between items-start pl-4">
          <p class="text-sm text-white ${isUnread ? 'font-medium' : ''} flex-1 pr-2">
            ${displayText}
          </p>
          
          ${!isAnnouncement && !isExpired ? `
            <div class="flex gap-1 flex-shrink-0" onclick="event.stopPropagation()">
              ${isUnread ? `
                <button onclick="markNotificationRead(${n.id}); event.stopPropagation();" 
                       class="text-[10px] text-[#c9a227] hover:text-[#facc15] px-1 py-0.5 rounded transition"
                       title="Mark as read">✓</button>
              ` : ''}
              <button onclick="deleteNotification(${n.id}); event.stopPropagation();" 
                     class="text-[10px] text-red-400 hover:text-red-300 px-1 py-0.5 rounded transition"
                     title="Delete">✕</button>
            </div>
          ` : ''}
        </div>
        
        <div class="flex justify-between items-center mt-1 text-[10px] text-gray-500 pl-4">
          <span>${new Date(n.created_at || n.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          <div class="flex gap-1">
            ${isExpired ? '<span class="text-red-400">• Expired</span>' : ''}
            ${isAnnouncement ? '<span class="text-purple-400">• Announcement</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Click handler: AUTO-MARK AS READ when clicked + open thread view
  list.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      
      const id = parseInt(el.dataset.id);
      const threadId = el.dataset.threadId;
      const sender = el.dataset.sender;
      
      // ✅ AUTO-MARK AS READ when user clicks to open
      const notif = dojNotifications.find(n => n.id === id);
      if (notif && !notif.read) {
        notif.read = true;  // Update local state instantly
        updateNotificationBadge();  // Update badge instantly
        renderNotificationPanel();  // Re-render panel
        renderDojNotifications();  // Re-render dashboard
        
        // Sync to backend
        apiCall('markNotificationRead', { id }).catch(err => console.error('Failed to sync read status:', err));
      }
      
      // Open thread view for reading
      if (threadId) {
        openThreadView(threadId, sender);
      }
    });
  });
}

// ============================================================================
// 🔹 RENDER NOTIFICATIONS IN DASHBOARD (LATEST 5)
// ============================================================================
function renderDojNotifications() {
  const container = document.getElementById('dojNotificationsContainer');
  if (!container) return;
  
  const notifs = dojNotifications.slice(0, 5);
  
  if (notifs.length === 0) {
    container.innerHTML = '<div class="text-gray-400 text-sm text-center py-4">No recent notifications</div>';
    return;
  }
  
  container.innerHTML = notifs.map(n => {
    const isUnread = !n.read;
    const isExpired = n.expires_at && new Date(n.expires_at) < new Date();
    const isAnnouncement = n.subject === 'ANNOUNCEMENT';
    
    // Use sender_name from metadata
    const senderName = n.sender_name || 'Unknown';
    
    // ✅ Build display text with conditional "New"/"From" prefix
    const displayText = buildNotificationDisplayText(n);
    
    const threadId = n.thread_id || ('msg_' + n.id);
    
    return `
      <div class="flex justify-between items-start py-3 border-b border-gray-700 text-sm ${isUnread ? 'bg-gray-700/30' : ''} ${isExpired ? 'opacity-50' : ''} relative" 
          data-id="${n.id}" 
          data-thread-id="${threadId}"
          data-sender="${senderName}">
        
        ${isUnread ? '<span class="w-2 h-2 bg-[#c9a227] rounded-full mt-1.5 flex-shrink-0"></span>' : ''}
        
        <div class="flex-1 cursor-pointer pl-3" onclick="openThreadView('${threadId}', '${senderName}')">
          ${displayText}
        </div>
        
        <div class="text-xs text-gray-500 text-right flex-shrink-0 ml-2">
          ${new Date(n.created_at || n.timestamp || Date.now()).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
        </div>
        
        ${!isAnnouncement && !isExpired ? `
          <div class="flex gap-1 ml-2 flex-shrink-0" onclick="event.stopPropagation()">
            <button onclick="deleteNotification(${n.id}); event.stopPropagation();" 
                   class="text-[10px] text-red-400 hover:text-red-300 px-1 py-0.5 rounded transition"
                   title="Delete">✕</button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// ============================================================================
// 🔹 MARK NOTIFICATION AS READ
// ============================================================================
async function markNotificationRead(id) {
  try {
    const notif = dojNotifications.find(n => n.id === id);
    if (notif && !notif.read) {
      notif.read = true;
      updateNotificationBadge();
      renderNotificationPanel();
      renderDojNotifications();
    }
    
    await apiCall('markNotificationRead', { id });
  } catch (err) {
    console.error('Failed to mark notification read:', err);
  }
}

// ============================================================================
// 🔹 REPLY TO A NOTIFICATION
// ============================================================================
function replyToNotification(senderName, threadId = '') {
  if (!senderName || senderName === 'Unknown') {
    const notif = dojNotifications.find(n => n.thread_id === threadId || n.id === parseInt(threadId));
    if (notif?.sender_name) {
      senderName = notif.sender_name;
    }
  }
  
  if (!senderName || senderName === 'Unknown') {
    if (threadId) { openThreadView(threadId); return; }
    alert('Cannot identify sender. Opening conversation view.');
    return;
  }
  
  const orig = dojNotifications.find(n => n.thread_id === threadId || n.id === parseInt(threadId));
  const originalSubject = orig?.subject || '';
  const originalMessage = orig?.text || orig?.message || '';
  
  if (typeof closeModal === 'function') closeModal('globalModal');
  
  if (typeof showCommunicationModal === 'function') {
    window.replyContext = { replyTo: senderName, threadId, subject: originalSubject, message: originalMessage };
    showCommunicationModal('any', 'User');
  }
}

// ============================================================================
// 🔹 DELETE A NOTIFICATION - Calls correct backend endpoint
// ============================================================================
async function deleteNotification(id) {
  if (!confirm('Delete this notification?')) return;
  
  try {
    // ✅ FIX: Call deleteMessage endpoint (not markNotificationRead)
    await apiCall('deleteMessage', { 
      message_id: id,
      deleted_by: currentUser.name
    });
    
    // Remove from local array
    const index = dojNotifications.findIndex(n => n.id === id);
    if (index > -1) {
      dojNotifications.splice(index, 1);
    }
    
    updateNotificationBadge();
    renderNotificationPanel();
    renderDojNotifications();
    
  } catch (err) {
    console.error('Failed to delete notification:', err);
    alert('Could not delete notification. Please try again.');
  }
}

// ============================================================================
// 🔹 SEND A NOTIFICATION TO A ROLE
// ============================================================================
async function sendNotificationToRole(role, message) {
  try {
    await apiCall('sendMessage', {
      recipientNames: [role],
      message: message,
      sender: currentUser?.name || 'System'
    });
  } catch (err) {
    console.error('Failed to send notification:', err);
  }
}

// ============================================================================
// 🔹 OPEN THREAD VIEW MODAL - Full conversation with privacy filtering
// ============================================================================
async function openThreadView(threadId, otherUser = '') {
  if (!threadId) return;
  
  showModal(`
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xl font-bold text-white">💬 Loading conversation...</h3>
      <button onclick="closeModal('globalModal')" class="text-gray-400 hover:text-white text-2xl">&times;</button>
    </div>
    <div class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9a227]"></div>
    </div>
  `);
  
  try {
    // ✅ Pass requestingUser for privacy filtering (backend filters to sender/recipient only)
    const result = await apiCall('getMessagesByThread', { 
      thread_id: threadId,
      user_name: currentUser.name
    });
    const messages = result.messages || [];
    
    if (messages.length === 0) {
      const notif = dojNotifications.find(n => n.thread_id === threadId || ('msg_' + n.id) === threadId);
      if (notif) {
        showModal(`
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-white">💬 Message Details</h3>
            <button onclick="closeModal('globalModal')" class="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>
          <div class="p-3 bg-gray-700/50 rounded-lg mb-4">
            <p class="text-sm text-white whitespace-pre-wrap">${notif.text || notif.message}</p>
            ${notif.url ? `<a href="${notif.url}" target="_blank" class="text-blue-400 hover:underline text-xs mt-2 inline-block">🔗 ${notif.url}</a>` : ''}
            ${notif.urls?.length ? notif.urls.map(u => `<br><a href="${u}" target="_blank" class="text-blue-400 hover:underline text-xs">🔗 ${u}</a>`).join('') : ''}
          </div>
          <div class="flex justify-end gap-2">
            <button onclick="replyToNotification('${notif.sender_name || 'Unknown'}', '${threadId}')" class="btn-primary py-2 px-4 rounded-lg">↩ Reply</button>
            <button onclick="closeModal('globalModal')" class="btn-secondary py-2 px-4 rounded-lg">Close</button>
          </div>
        `);
      } else {
        showModal(`
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-white">💬 Conversation</h3>
            <button onclick="closeModal('globalModal')" class="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>
          <div class="text-center text-gray-400 py-8">No messages found in this conversation.</div>
        `);
      }
      return;
    }
    
    const conversationPartner = otherUser || messages.find(m => m.sender_name !== currentUser.name)?.sender_name || 'Unknown';
    const subjectDisplay = messages[0]?.subject ? `<span class="text-gray-400 font-normal">• ${messages[0].subject}</span>` : '';
    
    // ✅ Build conversation HTML - show URLs for ALL messages
    const conversationHtml = messages.map(m => {
      const isCurrentUser = m.sender_name === currentUser.name;
      const timestamp = new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      // Use helper to render message with clickable URLs
      const messageContent = renderMessageWithLinks(m.message, m.urls || m.url);
      
      return `
        <div class="flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3">
          <div class="${isCurrentUser ? 'bg-[#c9a227]/20 border-[#c9a227] rounded-tr-none' : 'bg-gray-700 border-gray-600 rounded-tl-none'} border rounded-lg p-3 max-w-[85%]">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-medium ${isCurrentUser ? 'text-[#c9a227]' : 'text-gray-300'}">${m.sender_name}</span>
              <span class="text-[10px] text-gray-500">${timestamp}</span>
            </div>
            <p class="text-sm text-white whitespace-pre-wrap">${messageContent}</p>
          </div>
        </div>
      `;
    }).join('');
    
    const isAnnouncement = messages[0]?.subject === 'ANNOUNCEMENT';
    
    // ✅ Show modal with reply box at bottom only
    showModal(`
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-white">💬 Conversation with ${conversationPartner} ${subjectDisplay}</h3>
        <button onclick="closeModal('globalModal')" class="text-gray-400 hover:text-white text-2xl">&times;</button>
      </div>
      
      <div id="threadMessages" class="space-y-2 max-h-80 overflow-y-auto mb-4 p-2 bg-gray-900 rounded-lg border border-gray-700">
        ${conversationHtml}
      </div>
      
      ${!isAnnouncement ? `
        <div class="border-t border-gray-700 pt-3">
          <textarea id="threadReply" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#c9a227]" rows="2" placeholder="Type your reply..."></textarea>
          <div class="flex justify-end mt-2">
            <button id="sendThreadReply" class="btn-primary py-1.5 px-4 rounded-lg text-sm">Send Reply</button>
          </div>
        </div>
      ` : `<div class="text-center text-gray-500 text-sm py-2 border-t border-gray-700 bg-gray-800/50 rounded-lg">🔔 Announcement - replies disabled</div>`}
    `);
    
    const messagesContainer = document.getElementById('threadMessages');
    if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    if (!isAnnouncement) {
      document.getElementById('sendThreadReply')?.addEventListener('click', async () => {
        const replyText = document.getElementById('threadReply')?.value?.trim();
        if (!replyText) { alert('Please enter a reply.'); return; }
        
        const sendBtn = document.getElementById('sendThreadReply');
        if (sendBtn) {
          sendBtn.disabled = true;
          sendBtn.innerHTML = '<span class="animate-spin mr-1">⏳</span>Sending...';
        }
        
        try {
          await apiCall('sendMessage', {
            recipientNames: [conversationPartner],
            message: replyText,
            sender: currentUser.name,
            thread_id: threadId,
            subject: '',
            urls: []
          });
          await openThreadView(threadId, conversationPartner);
        } catch (err) {
          alert('❌ Failed to send: ' + (err.message || 'Unknown error'));
          if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = 'Send Reply';
          }
        }
      });
      
      document.getElementById('threadReply')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          document.getElementById('sendThreadReply')?.click();
        }
      });
    }
    
  } catch (err) {
    console.error('Failed to load thread:', err);
    showModal(`
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-white">💬 Error</h3>
        <button onclick="closeModal('globalModal')" class="text-gray-400 hover:text-white text-2xl">&times;</button>
      </div>
      <div class="text-center text-red-400 py-8">Could not load conversation.<br><span class="text-xs text-gray-500">${err.message || 'Unknown error'}</span></div>
    `);
  }
}

// ============================================================================
// 🔹 QUICK REPLY FROM THREAD VIEW
// ============================================================================
function quickReply(recipientName, threadId) {
  const threadMsgs = dojNotifications.filter(n => n.thread_id === threadId);
  const latest = threadMsgs[threadMsgs.length - 1];
  const subject = latest?.subject || '';
  const message = latest?.text || latest?.message || '';
  closeModal('globalModal');
  replyToNotification(recipientName, threadId);
}

// ============================================================================
// 🔹 INITIALIZE NOTIFICATION PANEL - Auto-refresh + Auto-load
// ============================================================================
function initNotificationPanel() {
  const notifBtn = document.getElementById('notifBtn');
  const notifPanel = document.getElementById('notifPanel');
  
  if (!notifBtn || !notifPanel) return;
  
  // ✅ Auto-load notifications on init
  if (currentUser?.name) {
    loadNotifications();
  }
  
  // ✅ AUTO-REFRESH NOTIFICATIONS EVERY 4 MINUTES
  let notifInterval;
  function startAutoRefresh() {
    if (notifInterval) clearInterval(notifInterval);
    notifInterval = setInterval(() => {
      if (currentUser?.name) loadNotifications();
    }, 4 * 60 * 1000);
  }
  function stopAutoRefresh() {
    if (notifInterval) clearInterval(notifInterval);
  }
  if (currentUser?.name) startAutoRefresh();
  
  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = notifPanel.classList.contains('hidden');
    if (isHidden) {
      notifPanel.classList.remove('hidden');
      loadNotifications();
    } else {
      notifPanel.classList.add('hidden');
    }
  });
  
  document.addEventListener('click', (e) => {
    if (!notifBtn.contains(e.target) && !notifPanel.contains(e.target)) {
      notifPanel.classList.add('hidden');
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !notifPanel.classList.contains('hidden')) {
      notifPanel.classList.add('hidden');
    }
  });
}

// ============================================================================
// 🔹 MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================================================
window.loadNotifications = loadNotifications;
window.updateNotificationBadge = updateNotificationBadge;
window.renderNotificationPanel = renderNotificationPanel;
window.renderDojNotifications = renderDojNotifications;
window.markNotificationRead = markNotificationRead;
window.replyToNotification = replyToNotification;
window.deleteNotification = deleteNotification;
window.sendNotificationToRole = sendNotificationToRole;
window.initNotificationPanel = initNotificationPanel;
window.openThreadView = openThreadView;
window.quickReply = quickReply;
window.groupNotificationsByThread = groupNotificationsByThread;
window.buildNotificationDisplayText = buildNotificationDisplayText;
window.renderMessageWithLinks = renderMessageWithLinks;
