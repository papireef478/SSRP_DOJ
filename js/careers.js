// ============================================
// CAREERS PAGE - SSRP (GLOBAL FUNCTIONS)
// ============================================

/**
 * Render Careers page - SSRP branded
 */
function renderCareers() {
  const careersDiv = document.getElementById('careersSection');
  if (!careersDiv) return;
  
  careersDiv.innerHTML = `
    <div class="card p-8 max-w-3xl mx-auto">
      <h2 class="text-2xl font-bold text-white mb-4">Join the SSRP Department of Justice</h2>
      <p class="text-gray-300 mb-4">The Silent Struggle RP DOJ is always looking for dedicated individuals to serve as Clerks, Judges, Attorneys, and support staff. Help us create compelling legal stories in a Texas-inspired world.</p>
      
      <div class="bg-gray-700/50 p-4 rounded-lg mb-6">
        <h3 class="text-lg font-semibold text-[#facc15] mb-2">How to Apply</h3>
        <p class="text-gray-300">Submit a <strong class="text-blue-400">DOJ Assistance</strong> ticket in Discord with the subject "Job Application – [Position]". Include:</p>
        <ul class="list-disc pl-5 mt-2 text-gray-300">
          <li>Your character name and Discord ID</li>
          <li>Position you're applying for</li>
          <li>A brief statement of interest and relevant experience (IC or OOC)</li>
          <li>Your availability (days/times you can be active in Central Time)</li>
        </ul>
        <a href="${DISCORD.ticketUrl}" target="_blank" class="inline-block mt-4 btn-primary py-2 px-4 rounded-lg">Open DOJ Ticket on Discord</a>
      </div>
      
      <div class="grid md:grid-cols-2 gap-4 mt-6">
        <div class="card p-4">
          <h4 class="font-semibold text-[#facc15] mb-2">Available Positions</h4>
          <ul class="text-gray-300 text-sm space-y-1">
            <li>• Court Clerk ($2,000/week IC)</li>
            <li>• Master Clerk/Treasurer ($3,000/week + bonus)</li>
            <li>• Justice of the Peace / Judge</li>
            <li>• Chief Justice</li>
            <li>• Private Attorney</li>
            <li>• Public Defender / Deputy DA</li>
            <li>• Court Reporter</li>
            <li>• Bailiff</li>
            <li>• U.S. Marshal ($2,000/week + transport bonus)</li>
          </ul>
        </div>
        <div class="card p-4">
          <h4 class="font-semibold text-[#facc15] mb-2">Requirements</h4>
          <ul class="text-gray-300 text-sm space-y-1">
            <li>• Active Discord account</li>
            <li>• 14+ days in city (Clerks) / 30+ days (Master Clerk, Marshal)</li>
            <li>• Clean disciplinary record</li>
            <li>• Pass Bar Exam (attorneys, judges)</li>
            <li>• Regular availability (Central Time)</li>
            <li>• Professional conduct & SSRP rule adherence</li>
            <li>• Shadow training with senior staff</li>
          </ul>
        </div>
      </div>
      
      <div class="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
        <h4 class="font-semibold text-blue-300 mb-2">💡 Pro Tip</h4>
        <p class="text-gray-300 text-sm">All DOJ personnel are held to high standards of integrity, impartiality, and civility (Manual Section 10.0). If you have multiple characters, remember the "Soul Rule": disclose any conflicts and recuse when needed to maintain impartiality.</p>
      </div>
    </div>
  `;
  
  // Initialize icons
  if (window.lucide) {
    lucide.createIcons();
  }
}