/**
 * Paste these handlers into your Google Apps Script doPost() router.
 * Requires an "ID" column (column A) on every transaction sheet.
 *
 * Frontend sends:
 *   UPDATE_RECORD: { sheetName, recordId, rowData, actorUsername, actorRole }
 *   DELETE_RECORD: { sheetName, recordId, actorUsername, actorRole }
 */

function isAdminRole(role) {
  var r = String(role || '').trim();
  return r === 'Super Admin' || r === 'Admin';
}

function findRowById_(sheet, recordId) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return -1;
  var headers = data[0];
  var idCol = -1;
  for (var c = 0; c < headers.length; c++) {
    if (String(headers[c]).trim().toUpperCase() === 'ID') {
      idCol = c;
      break;
    }
  }
  if (idCol === -1) idCol = 0;
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(recordId)) return r + 1;
  }
  return -1;
}

function handleUpdateRecord_(payload) {
  if (!isAdminRole(payload.actorRole)) {
    return { success: false, message: 'Unauthorized. Only Super Admin or Admin can edit transactions.' };
  }
  var sheetName = payload.sheetName;
  var recordId = payload.recordId;
  var rowData = payload.rowData;
  if (!sheetName || recordId === undefined || recordId === null || !rowData) {
    return { success: false, message: 'Missing sheetName, recordId, or rowData.' };
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return { success: false, message: 'Sheet not found: ' + sheetName };

  var rowIndex = findRowById_(sheet, recordId);
  if (rowIndex === -1) return { success: false, message: 'Record not found (ID: ' + recordId + ').' };

  var startCol = 2;
  sheet.getRange(rowIndex, startCol, 1, rowData.length).setValues([rowData]);
  return { success: true, message: 'Transaction updated successfully.' };
}

function handleDeleteRecord_(payload) {
  if (!isAdminRole(payload.actorRole)) {
    return { success: false, message: 'Unauthorized. Only Super Admin or Admin can delete transactions.' };
  }
  var sheetName = payload.sheetName;
  var recordId = payload.recordId;
  if (!sheetName || recordId === undefined || recordId === null) {
    return { success: false, message: 'Missing sheetName or recordId.' };
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return { success: false, message: 'Sheet not found: ' + sheetName };

  var rowIndex = findRowById_(sheet, recordId);
  if (rowIndex === -1) return { success: false, message: 'Record not found (ID: ' + recordId + ').' };

  sheet.deleteRow(rowIndex);
  return { success: true, message: 'Transaction deleted successfully.' };
}

/*
 * In your existing doPost(e), after token validation, add:
 *
 *   var body = JSON.parse(e.postData.contents);
 *   var action = body.action;
 *   var payload = body.payload || {};
 *
 *   if (action === 'UPDATE_RECORD') {
 *     return ContentService.createTextOutput(JSON.stringify(handleUpdateRecord_(payload)))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 *   if (action === 'DELETE_RECORD') {
 *     return ContentService.createTextOutput(JSON.stringify(handleDeleteRecord_(payload)))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 */
