// ============================================
// CONFIGURATION - SILENT STRUGGLE RP (SSRP)
// ============================================

// 🎯 Server Identity
const SERVER_NAME = "Silent Struggle RP";
const SERVER_SHORT = "SSRP";
const MOTTO = "Here, every action has weight — and every story truly matters.";
const TIME_ZONE = "America/Chicago";
const STORAGE_PREFIX = "ssrp_";

// 🔗 Google Apps Script Web App URLs
const API_URL = "https://script.google.com/macros/s/AKfycbx3sGw4dmVPMrJG1gELweoxiG8ObFg0KWsGv3Wgec3NmxBHb5p89J7OVtAE_Vlg4sGiiw/exec";
const PENAL_CODE_API_URL = "https://script.google.com/macros/s/AKfycbx3sGw4dmVPMrJG1gELweoxiG8ObFg0KWsGv3Wgec3NmxBHb5p89J7OVtAE_Vlg4sGiiw/exec";

// Google Sheets API Key
const SHEETS_API_KEY = 'AIzaSyAjWST6rOH_rF9Hspvf0j3xI8xdUZ3moYk';

// 📊 Spreadsheet IDs
const DOJ_DB_SPREADSHEET_ID = "1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc";
const PENAL_CODE_SPREADSHEET_ID = "1eTO1TwZYHm-mAoIcynh2rJp2XrqqYMkHTLy0zyJI214";
const ADMIN_OPS_SPREADSHEET_ID = "1eTO1TwZYHm-mAoIcynh2rJp2XrqqYMkHTLy0zyJI214";

// Discord Integration
const discordTicketUrl = "https://discordapp.com/channels/1462229061152538790/1479569841282093106";
const DISCORD_SERVER_INVITE = "https://discord.gg/QPPnmjY7p6";

// Derived Sheet URLs - Use PROPER backticks (no backslash)
const offlineDuesSheetUrl = `https://docs.google.com/spreadsheets/d/${DOJ_DB_SPREADSHEET_ID}/edit?gid=1869397302#gid=1869397302`;
const allFilingsSheetUrl = `https://docs.google.com/spreadsheets/d/${DOJ_DB_SPREADSHEET_ID}/edit?gid=295389032#gid=295389032`;
const usersSheetUrl = `https://docs.google.com/spreadsheets/d/${PENAL_CODE_SPREADSHEET_ID}/edit?gid=0#gid=0`;

// Discord Channel References
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

// Role Mentions
const DISCORD_ROLES = {
  allDoj: "@DOJ-Personnel",
  clerks: "@Clerk",
  attorneys: "@Attorney",
  judges: "@Judge",
};

// Status Filters for Home Page Stats
const ACTIVE_CASE_STATUSES = ["Filed", "Pre-trial", "Pending Payment", "Trial Scheduled", "In Trial", "Awaiting Judgment", "Appealed", "Judgement Issued"];
const ACTIVE_MARRIAGE_STATUSES = ["pending", "active"];
