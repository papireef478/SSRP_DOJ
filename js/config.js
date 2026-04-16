// ============================================
// CONFIGURATION - SILENT STRUGGLE RP (SSRP)
// ============================================

// 🎯 Server Identity
const SERVER_NAME = "Silent Struggle RP";
const SERVER_SHORT = "SSRP";
const MOTTO = "Here, every action has weight — and every story truly matters.";
const TIME_ZONE = "America/Chicago"; // Central Time for Texas-based SSRP
const STORAGE_PREFIX = "ssrp_"; // Replaces 'sjrp_' for localStorage/session keys

// 🔗 Google Apps Script Web App URLs (Deployed Endpoints)
const API_URL = "https://script.google.com/macros/s/AKfycbz9qrRPkvAix02KdfH6e2oGjzlgOC7wk3iEBALCWSbYFPyf2L1E4NPtZp4t2AZMWq0llw/exec";
const PENAL_CODE_API_URL = "https://script.google.com/macros/s/AKfycbwE_uHNWLGQe1RIoxAHlzSd8NYO2Zt4lKrxn5SynabmHgC-wyHxFO4oSb0sqnqb98BKgA/exec";
const BAR_EXAM_API_URL = "https://script.google.com/macros/s/AKfycbyLqIR_dNlKTZsJZy1F6GnfwXewE3Flp9LAL78g5kVWs53PaOmQhiAsQXB7ToOOSLMfoQ/exec";

const SHEETS_API_KEY = 1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc

// 📊 Spreadsheet IDs
const DOJ_DB_SPREADSHEET_ID = "1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc";
const PENAL_CODE_SPREADSHEET_ID = "1C3Ljd2ubP8Tl2f6OB4VPIWNST7jXyJW8-8ANzbx3My4";
const ADMIN_OPS_SPREADSHEET_ID = "1eTO1TwZYHm-mAoIcynh2rJp2XrqqYMkHTLy0zyJI214";

// Discord Integration
const discordTicketUrl = "https://discordapp.com/channels/1462229061152538790/1479569841282093106";
const DISCORD_SERVER_INVITE = "https://discord.gg/QPPnmjY7p6";

// Derived Sheet URLs (based on new spreadsheet IDs)
const offlineDuesSheetUrl = `https://docs.google.com/spreadsheets/d/${DOJ_DB_SPREADSHEET_ID}/edit?gid=1869397302#gid=1869397302`;
const allFilingsSheetUrl = `https://docs.google.com/spreadsheets/d/${DOJ_DB_SPREADSHEET_ID}/edit?gid=394849338#gid=394849338`;
const usersSheetUrl = `https://docs.google.com/spreadsheets/d/${PENAL_CODE_SPREADSHEET_ID}/edit?gid=0#gid=0`;

// Discord Channel References (per SSRP Manual Section 84)
const DISCORD_CHANNELS = {
  docket: "#court-docket",
  attorneyDirectory: "#attorney-directory",
  barAssociation: "#bar-association",
  disciplinary: "#disciplinary-committee",
  clerkAnnouncements: "#clerk-announcements",
  treasuryReports: "#treasury-reports",
  marshalLog: "#marshal-log",
  publicCourtViewing: "#public-court-viewing",
  welcomeInfo: "#welcome-info",
};

// Role Mentions for Broadcasts
const DISCORD_ROLES = {
  allDoj: "@DOJ-Personnel",
  clerks: "@Clerk",
  attorneys: "@Attorney",
  judges: "@Judge",
};

// Status Filters for Home Page Stats
const ACTIVE_CASE_STATUSES = ["Filed", "Pre-trial", "Pending Payment", "Trial Scheduled", "In Trial", "Awaiting Judgment", "Appealed", "Judgement Issued"];
const ACTIVE_MARRIAGE_STATUSES = ["pending", "active"];
