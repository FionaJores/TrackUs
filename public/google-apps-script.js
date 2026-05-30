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

const SHEET_NAMES = ['Income', 'Expenses', 'Savings', 'Goals', 'Budgets', 'Recurring', 'Accounts'];

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
      return loadAllData(data.accountId);
    case 'sync':
      return syncAllData(data.payload, data.accountId);
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
    'Income': ['ID', 'AccountId', 'Date', 'Amount', 'Source', 'Notes', 'CreatedAt'],
    'Expenses': ['ID', 'AccountId', 'Date', 'Amount', 'Category', 'PaymentMethod', 'Notes', 'CreatedAt'],
    'Savings': ['ID', 'AccountId', 'Date', 'Amount', 'Type', 'Notes', 'CreatedAt'],
    'Goals': ['ID', 'AccountId', 'Name', 'TotalAmount', 'EmiAmount', 'TotalMonths', 'StartDate', 'PaidMonths', 'Notes', 'CreatedAt'],
    'Budgets': ['ID', 'AccountId', 'Month', 'Category', 'BudgetAmount', 'CreatedAt'],
    'Recurring': ['ID', 'AccountId', 'Type', 'Category', 'Amount', 'Frequency', 'NextDate', 'Description', 'Active', 'CreatedAt'],
    'Accounts': ['ID', 'Name', 'Emoji', 'Color', 'CreatedAt'],
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

function loadAllData(accountId) {
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
      // Handle 'ID' → 'id' correctly (not 'iD')
      if (h === 'ID') return 'id';
      if (h === 'AccountId') return 'accountId';
      return h.charAt(0).toLowerCase() + h.slice(1); 
    });
    
    // Find accountId column index
    var accountIdCol = headers.indexOf('accountId');
    
    const rows = [];
    for (var i = 1; i < data.length; i++) {
      // Filter by accountId (skip if not matching, unless it's the Accounts sheet)
      if (accountId && accountIdCol >= 0 && name !== 'Accounts') {
        if (data[i][accountIdCol] !== accountId) continue;
      }
      
      var obj = {};
      var hasData = false;
      for (var j = 0; j < headers.length; j++) {
        // Skip accountId from returned data (frontend doesn't need it)
        if (headers[j] === 'accountId') continue;
        var cellVal = data[i][j];
        // Try to parse JSON strings back to arrays/objects
        if (typeof cellVal === 'string' && cellVal.length > 0 && (cellVal.charAt(0) === '[' || cellVal.charAt(0) === '{')) {
          try { cellVal = JSON.parse(cellVal); } catch(e) {}
        }
        obj[headers[j]] = cellVal;
        if (data[i][j] !== '' && headers[j] !== 'id') hasData = true;
      }
      // Generate an ID if missing but row has other data
      if (!obj.id && hasData) {
        obj.id = 'gs_' + Date.now().toString(36) + '_' + i;
      }
      if (obj.id) rows.push(obj);
    }
    result[name.toLowerCase()] = rows;
  });
  
  return jsonResponse(result);
}

function syncAllData(payload, accountId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // First run setup if needed
  setupSheets();
  
  Object.keys(payload).forEach(function(key) {
    const sheetName = key.charAt(0).toUpperCase() + key.slice(1);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    
    const items = payload[key];
    
    // For Accounts sheet, no accountId tagging needed
    if (sheetName === 'Accounts') {
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clear();
      }
      if (!items || items.length === 0) return;
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var rows = items.map(function(item) {
        return headers.map(function(h) {
          var k = (h === 'ID') ? 'id' : h.charAt(0).toLowerCase() + h.slice(1);
          var val = item[k] !== undefined ? item[k] : (item[h] !== undefined ? item[h] : '');
          if (Array.isArray(val) || (typeof val === 'object' && val !== null)) return JSON.stringify(val);
          return val;
        });
      });
      if (rows.length > 0) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      return;
    }
    
    // For data sheets: remove only THIS account's rows, keep other accounts' data
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var accountIdCol = -1;
    for (var h = 0; h < headers.length; h++) {
      if (headers[h] === 'AccountId') { accountIdCol = h; break; }
    }
    
    // Read existing data and keep rows from OTHER accounts
    var otherRows = [];
    if (sheet.getLastRow() > 1) {
      var allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
      for (var r = 0; r < allData.length; r++) {
        if (accountIdCol >= 0 && allData[r][accountIdCol] !== accountId) {
          otherRows.push(allData[r]);
        }
      }
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clear();
    }
    
    // Build new rows for this account
    var newRows = [];
    if (items && items.length > 0) {
      newRows = items.map(function(item) {
        return headers.map(function(h) {
          if (h === 'AccountId') return accountId;
          var k = (h === 'ID') ? 'id' : h.charAt(0).toLowerCase() + h.slice(1);
          var val = item[k] !== undefined ? item[k] : (item[h] !== undefined ? item[h] : '');
          if (Array.isArray(val) || (typeof val === 'object' && val !== null)) return JSON.stringify(val);
          return val;
        });
      });
    }
    
    // Write other accounts' data + this account's data
    var combined = otherRows.concat(newRows);
    if (combined.length > 0) {
      sheet.getRange(2, 1, combined.length, headers.length).setValues(combined);
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
    var key = (h === 'ID') ? 'id' : h.charAt(0).toLowerCase() + h.slice(1);
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
    var key = (h === 'ID') ? 'id' : h.charAt(0).toLowerCase() + h.slice(1);
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
