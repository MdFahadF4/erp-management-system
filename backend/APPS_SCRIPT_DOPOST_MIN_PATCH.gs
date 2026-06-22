/**
 * MINIMAL PATCH — paste only these changes into your existing Apps Script.
 * Your updateGenericRecord / deleteGenericRecord functions are already correct.
 * Do NOT add handleUpdateRecord_ or handleDeleteRecord_ — you don't need them.
 */

// =============================================================================
// FIX 1 — Inside doPost(e), in the try { ... } block, REPLACE this:
// =============================================================================
//
//    } else if (action === "UPDATE_RECORD") {
//      response = updateGenericRecord(payload.sheetName, payload.id, payload.rowData);
//    } else if (action === "CHANGE_PASSWORD") {
//
// WITH this:
// =============================================================================

    } else if (action === "UPDATE_RECORD") {
      response = updateGenericRecord(
        payload.sheetName,
        payload.recordId || payload.id,
        payload.rowData
      );
    } else if (action === "DELETE_RECORD") {
      response = deleteGenericRecord(
        payload.sheetName,
        payload.recordId || payload.id
      );
    } else if (action === "CHANGE_PASSWORD") {

// =============================================================================
// FIX 2 — DELETE these lines at the bottom of doPost (they never run anyway
//         because they are AFTER return, and the functions don't exist):
// =============================================================================
//
//   if (action === 'UPDATE_RECORD') {
//     return ContentService.createTextOutput(JSON.stringify(handleUpdateRecord_(payload)))
//       .setMimeType(ContentService.MimeType.JSON);
//   }
//   if (action === 'DELETE_RECORD') {
//     return ContentService.createTextOutput(JSON.stringify(handleDeleteRecord_(payload)))
//       .setMimeType(ContentService.MimeType.JSON);
//   }
//
// Your doPost must END like this (you already have this — keep it):
//
//   return ContentService.createTextOutput(JSON.stringify({
//     ...response,
//     status: response.success ? "success" : "error"
//   })).setMimeType(ContentService.MimeType.JSON);
// }
//
// =============================================================================
// FIX 3 — js/config.js on your laptop (and Vercel env vars) must match token:
//         MEHRIN-MASTER_TEMPLATE_TOKEN_17062026
// =============================================================================
