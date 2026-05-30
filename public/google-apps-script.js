// ============================================
// GOOGLE APPS SCRIPT - Salary Savings Tracker
// ============================================
// SETUP INSTRUCTIONS:
// 1. Create a new Google Spreadsheet
// 2. Go to Extensions → Apps Script
// 3. Delete any existing code and paste this entire file
// 4. Click "Deploy" → "New deployment"
// 5. Select type: "Web app"
// 6. Set "Execute as": Me
// 7. Set "Who has access": Anyone
// 8. Click Deploy and authorize when prompted
// 9. Copy the Web App URL
// 10. Paste it in src/config/google.js → APPS_SCRIPT_URL
// ============================================

const SHEET_NAMES = ['Income', 'Expenses', 'Savings', 'Goals', 'Budgets', 'Recurring'];

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'load') {
    return loadAllData();
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  switch (action) {
    case 'load':
      return loadAllData();
    case 'sync':
      return syncAllData(data.payload);
    case 'append':
      return appendToSheet(data.sheet, data.row);
    case 'update':
      return updateInSheet(data.sheet, data.id, data.row);
    case 'delete':
      return deleteFromSheet(data.sheet, data.id);
    default:
      return jsonResponse({ error: 'Unknown action' });
  }
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const headers = {
    'Income': ['ID', 'Date', 'Amount', 'Source', 'Notes', 'CreatedAt'],
    'Expenses': ['ID', 'Date', 'Amount', 'Category', 'PaymentMethod', 'Notes', 'CreatedAt'],
    'Savings': ['ID', 'Date', 'Amount', 'Type', 'Notes', 'CreatedAt'],
    'Goals': ['ID', 'Name', 'TargetAmount', 'CurrentAmount', 'TargetDate', 'Category', 'Notes', 'CreatedAt'],
    'Budgets': ['ID', 'Month', 'Category', 'BudgetAmount', 'CreatedAt'],
    'Recurring': ['ID', 'Type', 'Category', 'Amount', 'Frequency', 'NextDate', 'Description', 'Active', 'CreatedAt'],
  };
  
  SHEET_NAMES.forEach(function(name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    // Set headers if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers[name]);
      sheet.getRange(1, 1, 1, headers[name].length).setFontWeight('bold');
    }
  });
}

function loadAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {};
  
  SHEET_NAMES.forEach(function(name) {
    const sheet = ss.getSheetByName(name);
    if (!sheet || sheet.getLastRow() <= 1) {
      result[name.toLowerCase()] = [];
      return;
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(function(h) { 
      return h.charAt(0).toLowerCase() + h.slice(1); 
    });
    
    const rows = [];
    for (var i = 1; i < data.length; i++) {
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = data[i][j];
      }
      if (obj.id) rows.push(obj);
    }
    result[name.toLowerCase()] = rows;
  });
  
  return jsonResponse(result);
}

function syncAllData(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // First run setup if needed
  setupSheets();
  
  Object.keys(payload).forEach(function(key) {
    const sheetName = key.charAt(0).toUpperCase() + key.slice(1);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    
    const items = payload[key];
    if (!items || items.length === 0) return;
    
    // Clear existing data (keep headers)
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clear();
    }
    
    // Get headers
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Write data
    var rows = items.map(function(item) {
      return headers.map(function(h) {
        var key = h.charAt(0).toLowerCase() + h.slice(1);
        return item[key] !== undefined ? item[key] : (item[h] !== undefined ? item[h] : '');
      });
    });
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
  });
  
  return jsonResponse({ status: 'synced', timestamp: new Date().toISOString() });
}

function appendToSheet(sheetName, row) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return jsonResponse({ error: 'Sheet not found' });
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = headers.map(function(h) {
    var key = h.charAt(0).toLowerCase() + h.slice(1);
    return row[key] !== undefined ? row[key] : (row[h] !== undefined ? row[h] : '');
  });
  
  sheet.appendRow(values);
  return jsonResponse({ status: 'added' });
}

function updateInSheet(sheetName, id, row) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return jsonResponse({ error: 'Sheet not found' });
  
  const data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) return jsonResponse({ error: 'Row not found' });
  
  const headers = data[0];
  const values = headers.map(function(h) {
    var key = h.charAt(0).toLowerCase() + h.slice(1);
    return row[key] !== undefined ? row[key] : (row[h] !== undefined ? row[h] : '');
  });
  
  sheet.getRange(rowIndex, 1, 1, values.length).setValues([values]);
  return jsonResponse({ status: 'updated' });
}

function deleteFromSheet(sheetName, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return jsonResponse({ error: 'Sheet not found' });
  
  const data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ status: 'deleted' });
    }
  }
  
  return jsonResponse({ error: 'Row not found' });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run this once manually to create all sheets with headers
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Tracker')
    .addItem('Setup Sheets', 'setupSheets')
    .addToUi();
}
