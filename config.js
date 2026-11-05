// Settings for expenses.scebrokerage.com. None of these are secrets.
window.SCE_CONFIG = {
  // Entra ID → App registrations → "SCE Expense Reports" → Overview
  clientId: "<APPLICATION_CLIENT_ID>",
  tenantId: "<DIRECTORY_TENANT_ID>",

  // Who receives the reports
  dannaEmail: "dfugon@scebrokerage.com",

  // Shared mailbox copied on every report; the Power Automate flow watches it and files
  // the attachments in SharePoint. Leave "" to skip.
  filingMailbox: "expenses@scebrokerage.com",

  // Receipts larger than this in total are refused before sending (Exchange's default limit is 35 MB).
  maxTotalMB: 25
};
