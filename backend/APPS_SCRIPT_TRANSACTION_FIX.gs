/**
 * =============================================================================
 * PASTE INTO YOUR GOOGLE APPS SCRIPT PROJECT
 * Fixes:
 *   - Edit  → "Record ID allocation mismatch error." (frontend sent recordId, backend expected id)
 *   - Delete → "Unknown action" (DELETE_RECORD was missing from doPost)
 * =============================================================================
 */

/**
 * REPLACE your existing updateGenericRecord with this version.
 */
function updateGenericRecord(sheetName, id, rowData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, message: 'Sheet not found: ' + sheetName };
  if (!id) return { success: false, message: 'Missing record ID.' };
  if (!rowData || !rowData.length) return { success: false, message: 'Missing row data.' };

  const data = sheet.getDataRange().getValues();
  const targetId = String(id);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === targetId) {
      const targetRow = i + 1;
      // Column A = ID (keep unchanged). Columns B+ = rowData
      sheet.getRange(targetRow, 2, 1, rowData.length).setValues([rowData]);
      return { success: true, message: 'Transaction updated successfully.' };
    }
  }
  return { success: false, message: 'Record not found (ID: ' + targetId + ').' };
}

/**
 * ADD this new function (delete was never implemented before).
 */
function deleteGenericRecord(sheetName, id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, message: 'Sheet not found: ' + sheetName };
  if (!id) return { success: false, message: 'Missing record ID.' };

  const data = sheet.getDataRange().getValues();
  const targetId = String(id);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === targetId) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Transaction deleted successfully.' };
    }
  }
  return { success: false, message: 'Record not found (ID: ' + targetId + ').' };
}

/**
 * In doPost(e), inside your try { ... } block, UPDATE these two branches:
 *
 *   } else if (action === "UPDATE_RECORD") {
 *     response = updateGenericRecord(
 *       payload.sheetName,
 *       payload.recordId || payload.id,
 *       payload.rowData
 *     );
 *   } else if (action === "DELETE_RECORD") {
 *     response = deleteGenericRecord(
 *       payload.sheetName,
 *       payload.recordId || payload.id
 *     );
 *   }
 *
 * IMPORTANT: doPost must RETURN the response object, not a generic message:
 *
 *   return ContentService.createTextOutput(JSON.stringify(response))
 *     .setMimeType(ContentService.MimeType.JSON);
 *
 * NOT this (wrong — hides all errors/success messages):
 *   return ContentService.createTextOutput(JSON.stringify({
 *     status: "success",
 *     message: "Data securely processed."
 *   })).setMimeType(ContentService.MimeType.JSON);
 */
