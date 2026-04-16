// ============================================
// CAREERS PAGE - GLOBAL FUNCTIONS
// ============================================

/**
 * Render Careers page
 */
function renderCareers() {
  const careersDiv = document.getElementById('careersSection');
  if (!careersDiv) return;
  
  careersDiv.innerHTML = `
    <div class="card p-8 max-w-3xl mx-auto">
      <h2 class="text-2xl font-bold text-white mb-4">Join the Department of Justice</h2>
      <p class="text-gray-300 mb-4">The Silent Struggle DOJ is always looking for dedicated individuals to serve as Clerks, Judges, Attorneys, and support staff.</p>
      
      <div class="bg-gray-700/50 p-4 rounded-lg mb-6">
        <h3 class="text-lg font-semibold text-[#facc15] mb-2">How to Apply</h3>
        <p class="text-gray-300">Submit a <strong class="text-blue-400">DOJ Assistance</strong> ticket in Discord with the subject "Job Application – [Position]". Include:</p>
        <ul class="list-disc pl-5 mt-2 text-gray-300">
          <li>Your character name and Discord ID</li>
          <li>Position you're applying for</li>
          <li>A brief statement of interest and relevant experience (IC or OOC)</li>
          <li>Your availability (days/times you can be active)</li>
        </ul>
        <a href="${discordTicketUrl}" target="_blank" class="inline-block mt-4 btn-primary py-2 px-4 rounded-lg">Open DOJ Ticket on Discord</a>
      </div>
      
      <div class="grid md:grid-cols-2 gap-4 mt-6">
        <div class="card p-4">
          <h4 class="font-semibold text-[#facc15] mb-2">Available Positions</h4>
          <ul class="text-gray-300 text-sm space-y-1">
            <li>• Court Clerk</li>
            <li>• Judge</li>
            <li>• Attorney</li>
            <li>• Public Defender</li>
            <li>• District Attorney</li>
            <li>• Court Reporter</li>
            <li>• Bailiff</li>
            <li>• U.S. Marshal</li>
          </ul>
        </div>
        <div class="card p-4">
          <h4 class="font-semibold text-[#facc15] mb-2">Requirements</h4>
          <ul class="text-gray-300 text-sm space-y-1">
            <li>• Active Discord account</li>
            <li>• Complete DOJ training</li>
            <li>• Pass Bar Exam (attorneys)</li>
            <li>• Regular availability</li>
            <li>• Professional conduct</li>
          </ul>
        </div>
      </div>
    </div>
  `;
  
  // Initialize icons
  if (window.lucide) {
    lucide.createIcons();
  }
}
