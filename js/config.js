// ============================================
// CONFIGURATION - GLOBAL VARIABLES (SSRP)
// ============================================

// 🎯 Server Identity
const CONFIG = {
  serverName: "Silent Struggle RP",
  serverShort: "SSRP",
  motto: "Here, every action has weight — and every story truly matters.",
  timeZone: "America/Chicago", // Central Time for Texas-based SSRP
  storagePrefix: "ssrp_", // Replaces 'sjrp_' for localStorage/session keys
};

// 🔗 Google Apps Script Web App URLs (Deployed Endpoints)
const API_URLS = {
  // Main DOJ Database: cases, marriages, property, professionals, forms
  database: "https://script.google.com/macros/s/AKfycbz9qrRPkvAix02KdfH6e2oGjzlgOC7wk3iEBALCWSbYFPyf2L1E4NPtZp4t2AZMWq0llw/exec",
  
  // Admin Ops: users/auth, messaging, reports, penal code, tasks
  adminOps: "https://script.google.com/macros/s/AKfycbwE_uHNWLGQe1RIoxAHlzSd8NYO2Zt4lKrxn5SynabmHgC-wyHxFO4oSb0sqnqb98BKgA/exec",
  
  // Bar Examination: exam codes, results, clerk verification
  barExam: "https://script.google.com/macros/s/AKfycbyLqIR_dNlKTZsJZy1F6GnfwXewE3Flp9LAL78g5kVWs53PaOmQhiAsQXB7ToOOSLMfoQ/exec",
};

// 📊 Spreadsheet IDs (for reference/debugging)
const SPREADSHEET_IDS = {
  database: "1DFdvYns2qQUu8WteOBkKwKuX0FMRmFwhOpEZQqvqBSc",
  barExam: "1C3Ljd2ubP8Tl2f6OB4VPIWNST7jXyJW8-8ANzbx3My4",
  adminOps: "1eTO1TwZYHm-mAoIcynh2rJp2XrqqYMkHTLy0zyJI214",
};

// 🎮 Discord Integration
const DISCORD = {
  serverInvite: "https://discord.gg/QPPnmjY7p6", // Update with actual SSRP invite
  ticketUrl: "https://discordapp.com/channels/1462229061152538790/1479569841282093106",
  
  // Channel references per SSRP Manual Section 84
  channels: {
    docket: "#court-docket",
    attorneyDirectory: "#attorney-directory",
    barAssociation: "#bar-association",
    disciplinary: "#disciplinary-committee",
    clerkAnnouncements: "#clerk-announcements",
    treasuryReports: "#treasury-reports",
    marshalLog: "#marshal-log",
    publicCourtViewing: "#public-court-viewing", // voice channel
    welcomeInfo: "#welcome-info",
  },
  
  // Role mentions for broadcasts
  roles: {
    allDoj: "@DOJ-Personnel",
    clerks: "@Clerk",
    attorneys: "@Attorney",
    judges: "@Judge",
  },
};

// 💰 Fee Schedule (SSRP Manual Section 73.0)
const FEES = {
  // Family Law
  marriageLicense: 2500,
  uncontestedDivorceNoAssets: 7500,
  uncontestedDivorceWithAssets: 12500,
  contestedDivorce: 25000,
  voluntaryPaternity: 1000,
  dnaTestingMotion: 2500,
  dnaTestingLab: 5000,
  adoption: 7500,
  homeStudy: 3000,
  
  // Civil/Criminal Filings
  smallClaimsFiling: 5000,
  superiorCourtFiling: 15000,
  appealFiling: 15000,
  motionFiling: 2500,
  subpoena: 1000,
  
  // Property Transfers
  vehicleTransferFiling: 1000,
  vehicleTransferTaxRate: 0.05, // 5%
  houseTransferFiling: 5000,
  houseTransferTaxRate: 0.02, // 2%
  lienFiling: 2500,
  lienRelease: 500,
  
  // Professional/Business
  businessRegistrationAnnual: 25000,
  attorneyLicenseAnnual: 15000,
  lawFirmRegistration: 5000,
  lawFirmRenewal: 2500,
  trustAccountMaintenanceAnnual: 1000,
  
  // Estate/Other
  willFiling: 2500,
  codicil: 1000,
  barExamination: 5000,
  
  // Optional Services
  expeditedProcessing: 2500,
  certifiedCopies: 500,
  serviceOfProcess: 1000,
  emergencyFiling: 2500,
};

// 🎓 Bar Exam Settings (SSRP Bar Exam Doc)
const BAR_EXAM = {
  questionBankSize: 250,
  questionsPerExam: 50,
  timeLimitMinutes: 60,
  passingPercent: 75, // 38/50 correct
  retakeWaitDays: 3,
  codeExpirationHours: 24,
  certificatePrefix: "SSRP", // Bar numbers: SSRP-[YEAR]-[###]
};

// ⚖️ SSRP Rule Integrations (Manual Section 34.0)
const RULES = {
  evidenceRequired: true, // Screenshots/video mandatory for all charges
  nvlEnabled: true, // Value of Life rule active
  safeZones: ["hospital", "spawn", "clothing_store", "police_cell"],
  newPlayerProtectionMinutes: 10,
  sceneCooldownMinutes: 15,
  combatLoggingWindow: 5, // minutes to reconnect before staff ticket
  roleplayOverGunplay: true, // Verbal initiation required before hostile action
};

// 🏛️ Court Structure
const COURTS = {
  municipal: {
    name: "Municipal Court",
    jurisdiction: "Traffic, minor misdemeanors, small claims (<$10k), marriages",
    filingFee: FEES.smallClaimsFiling,
  },
  superior: {
    name: "Superior Court",
    jurisdiction: "Felonies, civil >$10k, divorce, paternity, probate",
    filingFee: FEES.superiorCourtFiling,
  },
  supreme: {
    name: "Supreme Court",
    jurisdiction: "Appeals, constitutional questions, attorney discipline",
    filingFee: FEES.appealFiling,
  },
};

// 📋 Status Filters for Home Page Stats
const STATUS_FILTERS = {
  activeCaseStatuses: [
    "Filed", "Pre-trial", "Pending Payment", "Trial Scheduled",
    "In Trial", "Awaiting Judgment", "Appealed", "Judgement Issued"
  ],
  activeMarriageStatuses: ["pending", "active"],
  pendingReportStatuses: ["pending"],
  approvedReportStatuses: ["approved"],
};

// 🔐 Auth Settings
const AUTH = {
  passcodeMinLength: 6,
  sessionTimeoutMinutes: 120, // 2 hours
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
};

// 📦 Form References (Google Sheets tabs)
const FORMS = {
  case: "CASE_FORM",
  marriage: "MARRIAGE_FORM",
  property: "PROPERTY_FORM",
  professional: "PROFESSIONAL_FORM",
  paternity: "PATERNITY_FORM",
  will: "WILL_FORM",
  treasury: "TREASURY_FORM",
};

// 🗂️ Registry Tabs (where form data populates)
const REGISTRIES = {
  cases: "CaseRegistry",
  marriages: "MarriageRegistry",
  properties: "PropertyRegistry",
  professionals: "ProfessionalRegistry",
  transactions: "TransactionLog",
  trust: "TrustLedger",
  offlineDues: "OfflineDues",
};

// 🎨 UI/UX Settings
const UI = {
  primaryColor: "#e94560", // SSRP accent red
  secondaryColor: "#facc15", // SSRP accent gold
  dateFormat: "M/d/yyyy",
  timeFormat: "h:mm a", // 12-hour with AM/PM
  dateTimeFormat: "M/d/yyyy h:mm a",
};

// 🔄 Legacy Compatibility (for gradual migration)
const LEGACY = {
  // Keep old URL variables for any hardcoded references during transition
  API_URL: API_URLS.adminOps, // Default to Admin Ops for backward compat
  PENAL_CODE_API_URL: API_URLS.adminOps,
  DOJ_DB_SPREADSHEET_ID: SPREADSHEET_IDS.database,
  PENAL_CODE_SPREADSHEET_ID: SPREADSHEET_IDS.adminOps,
  // Note: SHEETS_API_KEY not needed for Apps Script Web Apps
};

// ✅ Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    API_URLS,
    SPREADSHEET_IDS,
    DISCORD,
    FEES,
    BAR_EXAM,
    RULES,
    COURTS,
    STATUS_FILTERS,
    AUTH,
    FORMS,
    REGISTRIES,
    UI,
    LEGACY,
  };
}