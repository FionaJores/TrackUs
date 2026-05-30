// Google Apps Script Web App URL
// SETUP: 
// 1. Go to https://sheets.google.com → create a new spreadsheet
// 2. Go to Extensions → Apps Script
// 3. Paste the script from public/google-apps-script.js
// 4. Click Deploy → New Deployment → Web App → set access to "Anyone"
// 5. Copy the URL and paste it below
export const GOOGLE_CONFIG = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyObtI3yL_k7KAGjKf9Wn1F9_VUYaX0rso55tSObP_r9yZJ3Wsa8Q7s0wHxtcsn6pHP/exec', // Paste your deployed Apps Script URL here
};

export const SHEET_NAMES = {
  INCOME: 'Income',
  EXPENSES: 'Expenses',
  SAVINGS: 'Savings',
  GOALS: 'Goals',
  BUDGETS: 'Budgets',
  RECURRING: 'Recurring',
  SETTINGS: 'Settings',
};

export const SHEET_HEADERS = {
  INCOME: ['ID', 'Date', 'Amount', 'Source', 'Notes', 'CreatedAt'],
  EXPENSES: ['ID', 'Date', 'Amount', 'Category', 'PaymentMethod', 'Notes', 'CreatedAt'],
  SAVINGS: ['ID', 'Date', 'Amount', 'Type', 'Notes', 'CreatedAt'],
  GOALS: ['ID', 'Name', 'TargetAmount', 'CurrentAmount', 'TargetDate', 'Category', 'Notes', 'CreatedAt'],
  BUDGETS: ['ID', 'Month', 'Category', 'BudgetAmount', 'CreatedAt'],
  RECURRING: ['ID', 'Type', 'Category', 'Amount', 'Frequency', 'NextDate', 'Description', 'Active', 'CreatedAt'],
  SETTINGS: ['Key', 'Value'],
};
