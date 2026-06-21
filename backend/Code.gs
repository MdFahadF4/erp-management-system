/**
 * FULL APPS SCRIPT — copy ALL of this into script.google.com (replace your Code.gs).
 * Then: Deploy → Manage deployments → Edit → New version → Deploy
 *
 * USERS SHEET — add these column headers in row 1 (after Created Date):
 *   H = Mobile | I = Email | J = Status  (Active / Paused / Removed)
 * Existing users without Status are treated as Active.
 *
 * ADMIN_SETTINGS — optional sheet; cell B1 must be ACTIVE to allow API access.
 * If B1 is empty, login is allowed. Any other non-empty value (e.g. SUSPENDED) blocks all requests.
 *
 * SECURITY — CLIENT_TOKEN in js/config.js (and Vercel env) must match SECRET_TOKEN in doPost below.
 *
 * CUSTOMER_TRANSACTIONS — add column D = Discount (after Sold Amount) if missing.
 * New row order: Date | System Unique ID | Sold | Discount | Received | Method | Txn Due | Remarks | Logged By | Stamp
 *
 * DELIVERY_QUEUE — create sheet with row 1 headers:
 *   ID | System Unique ID | Remarks | Issued Date | Username | Status | Delivery Date | Delivered Remarks | Stamp
 * Status = Pending or Delivered. New customers auto-queue as Pending; run SYNC_DELIVERY_QUEUE for existing customers.
 *
 * HR_Transactions — row order after ID: Date | Employee Name | Amount | Category | Remarks | Username | Timestamp
 * Updating Code.gs alone does not backfill the HR sheet; run SYNC_HR_MASTER (or open HR Management in the app) after deploy.
 *
 * SUPPLIER_TRANSACTIONS — row order (legacy Amount+Category still supported):
 *   ID | Date | Supplier Name | Purchase Amount | Discount | Payment Paid | Transaction Due | Category | Remarks | Logged By | Stamp
 * Category = Purchase | Payment Paid | Previous Due
 * Suppliers master (Total Purchase / Total Payments / Due Balance) is recalculated from all transactions on create, update, delete, and SYNC_SUPPLIER_MASTER.
 *
 * CREDITOR_TRANSACTIONS — add Discount + Transaction Due columns (legacy rows still supported):
 *   ID | Transaction ID | Date | Creditor Parent Head | Sub Head | Received Amount | Discount | Return Amount | Transaction Due | Category | Remarks | Logged By | Stamp
 * Category = Received | Return | Previous Due
 *
 * INCOME_TRANSACTIONS — add Discount + Transaction Due columns:
 *   ID | Transaction ID | Date | Income Parent Head | Sub Head | Receivable Amount | Discount | Received Amount | Transaction Due | Category | Remarks | Logged By | Stamp
 * Category = Receivable | Received | Previous Due
 *
 * CAPITAL_HEADS — create sheet with row 1 headers:
 *   ID | Tracking ID | Capital Parent Head | Sub Head Name | Authorized By | Creation Stamp
 * CAPITAL_TRANSACTIONS — add Discount + Transaction Due columns:
 *   ID | Transaction ID | Date | Capital Parent Head | Sub Head | Capital In Amount | Discount | Capital Out Amount | Transaction Due | Category | Remarks | Logged By | Stamp
 * Category = Capital In | Capital Out | Previous Due
 *
 * EXPENSE_HEADS — create sheet with row 1 headers:
 *   ID | Tracking ID | Expense Parent Head | Sub Head Name | Authorized By | Creation Stamp
 *
 * EXPENSE_TRANSACTIONS — add Discount + Transaction Due + Category columns (legacy Deposit/Paid rows still supported):
 *   ID | Transaction ID | Date | Expense Parent Head | Sub Head | Incurred Amount | Discount | Payment Paid | Transaction Due | Category | Remarks | Logged By | Stamp
 * Category = Incurred | Payment Paid | Previous Due
 */
const SPREADSHEET_ID = '1psluXui-l3VtYL-P-Z7bRtWop4KA9JO5UahnAgmaHwM';

function setupFirstSuperAdmin() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Users');
  const username = "superadmin";
  const rawPassword = "password123";
  const hashedPassword = hashPassword(rawPassword);
  const userId = Utilities.getUuid();
  sheet.appendRow([userId, username, hashedPassword, "Super Admin", "ALL", "System", new Date()]);
  Logger.log("Super Admin created successfully!");
}

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      status: "error",
      message: "Error: No data received."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const SECRET_TOKEN = "MEHRIN-MASTER_TEMPLATE_TOKEN_17062026";

  let request;
  try {
    request = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      status: "error",
      message: "Invalid JSON payload."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const adminSheet = ss.getSheetByName("Admin_Settings");
  if (adminSheet) {
    const accountStatus = String(adminSheet.getRange("B1").getValue() || '').trim().toUpperCase();
    // Only block when explicitly set to a non-ACTIVE value (empty B1 = allow login)
    if (accountStatus && accountStatus !== 'ACTIVE') {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        status: "error",
        message: "CONNECTION SUSPENDED: Please contact support to reactivate your account."
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (request.token !== SECRET_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      status: "error",
      message: "UNAUTHORIZED: Invalid security token."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const action = request.action;
  const payload = request.payload;
  let response = { success: false, message: "Unknown action" };

  try {
    if (action === "LOGIN") {
      response = authenticateUser(payload.username, payload.password);
    } else if (action === "CREATE_USER") {
      response = createUser(payload.newUser, payload.actorUsername, payload.actorRole);
    } else if (action === "CREATE_RECORD") {
      response = createGenericRecord(payload.sheetName, payload.rowData);
    } else if (action === "FETCH_RECORDS") {
      response = fetchGenericRecords(payload.sheetName);
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
      response = changeUserPassword(payload.username, payload.oldPassword, payload.newPassword);
    } else if (action === "RESET_PASSWORD") {
      response = resetForgotPassword(payload);
    } else if (action === "UPDATE_USER") {
      response = updateUserAdmin(payload);
    } else if (action === "SYNC_DELIVERY_QUEUE") {
      response = syncDeliveryQueue();
    } else if (action === "SYNC_HR_MASTER") {
      response = syncHrMaster();
    } else if (action === "SYNC_SUPPLIER_MASTER") {
      response = syncSupplierMaster();
    }
  } catch (error) {
    response = { success: false, message: error.message };
  }

  return ContentService.createTextOutput(JSON.stringify({
    ...response,
    status: response.success ? "success" : "error"
  })).setMimeType(ContentService.MimeType.JSON);
}

function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  let txtHash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let hashVal = rawHash[i];
    if (hashVal < 0) hashVal += 256;
    if (hashVal.toString(16).length == 1) txtHash += '0';
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

function authenticateUser(username, password) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data.length > 0 ? data[0] : [];
  const inputHash = hashPassword(password);
  const targetUser = String(username || '').trim().toLowerCase();

  for (let i = 1; i < data.length; i++) {
    const rowUser = String(data[i][1] || '').trim().toLowerCase();
    if (rowUser === targetUser && data[i][2] === inputHash) {
      var status = getUserStatus_(headers, data[i]);
      var statusKey = String(status || 'Active').trim().toLowerCase();
      if (statusKey === 'paused') {
        return { success: false, message: 'Account paused. Contact your administrator.' };
      }
      if (statusKey === 'removed') {
        return { success: false, message: 'Account removed. Contact your administrator.' };
      }
      return {
        success: true,
        userData: {
          username: data[i][1],
          role: data[i][3],
          permissions: String(data[i][4] || '').split(',').map(function (p) { return String(p).trim(); }).filter(Boolean),
          status: status
        }
      };
    }
  }
  return { success: false, message: "Invalid username or password" };
}

function findColumnIndex_(headers, names) {
  var targets = names.map(function (n) {
    return String(n || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  });
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (var t = 0; t < targets.length; t++) {
      if (h === targets[t]) return c;
    }
  }
  return -1;
}

function getUserStatus_(headers, row) {
  var statusIdx = findColumnIndex_(headers, ['Status', 'Account Status']);
  if (statusIdx === -1) statusIdx = 9; // legacy fallback: column J
  var status = row[statusIdx];
  if (!status || String(status).trim() === '') return 'Active';
  return String(status).trim();
}

function findUserRowIndex_(data, username) {
  var target = String(username || '').trim();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === target) return i;
  }
  return -1;
}

function normalizeEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeMobile_(mobile) {
  return String(mobile || '').replace(/\D/g, '');
}

function createUser(newUser, actorUsername, actorRole) {
  if (actorRole !== "Super Admin" && actorRole !== "Admin") return { success: false, message: "Unauthorized." };
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Users');
  var existing = sheet.getDataRange().getValues();
  for (var i = 1; i < existing.length; i++) {
    if (String(existing[i][1]).trim().toLowerCase() === String(newUser.username || '').trim().toLowerCase()) {
      return { success: false, message: 'Username already exists.' };
    }
  }
  sheet.appendRow([
    Utilities.getUuid(),
    newUser.username,
    hashPassword(newUser.password),
    newUser.role,
    newUser.permissions,
    actorUsername,
    new Date(),
    newUser.mobile || '',
    newUser.email || '',
    'Active'
  ]);
  return { success: true, message: "User created successfully!" };
}

function resetForgotPassword(payload) {
  var username = String(payload.username || '').trim();
  var mobile = normalizeMobile_(payload.mobile);
  var email = normalizeEmail_(payload.email);
  var newPassword = payload.newPassword;
  if (!username || !newPassword) {
    return { success: false, message: 'Username and new password are required.' };
  }
  if (newPassword.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' };
  }
  if (!mobile && !email) {
    return { success: false, message: 'Enter the mobile or email registered on your account.' };
  }

  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Users');
  var data = sheet.getDataRange().getValues();
  var idx = findUserRowIndex_(data, username);
  if (idx === -1) return { success: false, message: 'No account found with that username.' };

  var headers = data.length > 0 ? data[0] : [];
  var row = data[idx];
  var status = getUserStatus_(headers, row);
  var statusKey = String(status || 'Active').trim().toLowerCase();
  if (statusKey === 'paused') return { success: false, message: 'Account is paused. Contact your administrator.' };
  if (statusKey === 'removed') return { success: false, message: 'Account was removed. Contact your administrator.' };

  var rowMobile = normalizeMobile_(row[7]);
  var rowEmail = normalizeEmail_(row[8]);
  var mobileOk = mobile && rowMobile && mobile === rowMobile;
  var emailOk = email && rowEmail && email === rowEmail;
  if (!mobileOk && !emailOk) {
    return { success: false, message: 'Mobile or email does not match our records.' };
  }

  sheet.getRange(idx + 1, 3).setValue(hashPassword(newPassword));
  return { success: true, message: 'Password reset successfully. You can sign in now.' };
}

function updateUserAdmin(payload) {
  if (payload.actorRole !== 'Super Admin' && payload.actorRole !== 'Admin') {
    return { success: false, message: 'Unauthorized.' };
  }

  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Users');
  var data = sheet.getDataRange().getValues();
  var idx = findUserRowIndex_(data, payload.username);
  if (idx === -1) return { success: false, message: 'User not found.' };

  var targetRole = String(data[idx][3] || '');
  if (targetRole === 'Super Admin' && payload.actorRole !== 'Super Admin') {
    return { success: false, message: 'Only Super Admin can modify Super Admin accounts.' };
  }

  if (payload.role !== undefined && payload.role !== null) {
    if (payload.role === 'Super Admin' && payload.actorRole !== 'Super Admin') {
      return { success: false, message: 'Only Super Admin can assign Super Admin role.' };
    }
    sheet.getRange(idx + 1, 4).setValue(payload.role);
  }
  if (payload.permissions !== undefined) sheet.getRange(idx + 1, 5).setValue(String(payload.permissions));
  if (payload.mobile !== undefined) sheet.getRange(idx + 1, 8).setValue(payload.mobile);
  if (payload.email !== undefined) sheet.getRange(idx + 1, 9).setValue(payload.email);
  if (payload.status !== undefined) sheet.getRange(idx + 1, 10).setValue(payload.status);
  if (payload.newPassword) {
    if (String(payload.newPassword).length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }
    sheet.getRange(idx + 1, 3).setValue(hashPassword(payload.newPassword));
  }

  return { success: true, message: 'User account updated successfully.' };
}

function getLatestCustomerTxnRemarks_(ss, systemUID) {
  var txnSheet = ss.getSheetByName('Customer_Transactions');
  if (!txnSheet) return '';
  var data = txnSheet.getDataRange().getValues();
  var target = String(systemUID || '').trim();
  if (!target) return '';
  var latest = '';
  var latestTime = 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2] || '').trim() !== target) continue;
    var remarks = String(data[i][8] || '').trim();
    var stamp = new Date(data[i][0] || 0).getTime();
    if (!remarks) continue;
    if (stamp >= latestTime) {
      latestTime = stamp;
      latest = remarks;
    }
  }
  return latest;
}

function ensureDeliveryQueueEntry_(ss, systemUID, username, issuedDate) {
  var delSheet = ss.getSheetByName('Delivery_Queue');
  if (!delSheet || !systemUID) return;
  var uid = String(systemUID).trim();
  if (!uid) return;
  var delData = delSheet.getDataRange().getValues();
  for (var i = 1; i < delData.length; i++) {
    if (String(delData[i][1]).trim() === uid) return;
  }
  delSheet.appendRow([
    Utilities.getUuid(),
    uid,
    getLatestCustomerTxnRemarks_(ss, uid),
    issuedDate || new Date(),
    String(username || ''),
    'Pending',
    '',
    '',
    new Date().toLocaleString()
  ]);
}

function syncDeliveryQueue() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var custSheet = ss.getSheetByName('Customers');
  var delSheet = ss.getSheetByName('Delivery_Queue');
  if (!custSheet) return { success: false, message: 'Customers sheet not found.' };
  if (!delSheet) return { success: false, message: 'Delivery_Queue sheet not found. Add the sheet with headers: ID, System Unique ID, Remarks, Issued Date, Username, Status, Delivery Date, Delivered Remarks, Stamp' };

  var custData = custSheet.getDataRange().getValues();
  var delData = delSheet.getDataRange().getValues();
  var existing = {};
  for (var i = 1; i < delData.length; i++) {
    existing[String(delData[i][1]).trim()] = true;
  }

  var added = 0;
  for (var j = 1; j < custData.length; j++) {
    var systemUID = String(custData[j][1] || '').trim();
    if (!systemUID || existing[systemUID]) continue;
    var loggedBy = String(custData[j][13] || custData[j][12] || '');
    var issued = custData[j][14] || custData[j][13] || new Date();
    delSheet.appendRow([
      Utilities.getUuid(),
      systemUID,
      getLatestCustomerTxnRemarks_(ss, systemUID),
      issued,
      loggedBy,
      'Pending',
      '',
      '',
      new Date().toLocaleString()
    ]);
    existing[systemUID] = true;
    added++;
  }
  return { success: true, message: added > 0 ? (added + ' delivery record(s) synced.') : 'Delivery queue is up to date.', added: added };
}

function normalizeHrName_(name) {
  return String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Recalculate HR master row (increment, current salary, earn, paid, due) from all HR_Transactions. */
function syncHrMasterForEmployee_(ss, empName) {
  var hrSheet = ss.getSheetByName("HR");
  var txnSheet = ss.getSheetByName("HR_Transactions");
  if (!hrSheet || !txnSheet) return false;

  var targetKey = normalizeHrName_(empName);
  if (!targetKey) return false;

  var hrData = hrSheet.getDataRange().getValues();
  var txnData = txnSheet.getDataRange().getValues();
  var totalInc = 0;
  var totalEarn = 0;
  var totalPaid = 0;

  for (var t = 1; t < txnData.length; t++) {
    if (normalizeHrName_(txnData[t][2]) !== targetKey) continue;
    var amt = parseFloat(txnData[t][3]) || 0;
    var cat = String(txnData[t][4] || "").trim().toLowerCase();

    if (cat.indexOf("increment") !== -1) totalInc += amt;
    if (cat.indexOf("earn") !== -1 || cat.indexOf("previous due") !== -1 || cat.indexOf("opening balance") !== -1) {
      totalEarn += amt;
    } else if (cat.indexOf("paid") !== -1) {
      totalPaid += amt;
    }
  }

  for (var i = 1; i < hrData.length; i++) {
    if (normalizeHrName_(hrData[i][1]) === targetKey) {
      var baseSalary = parseFloat(hrData[i][4]) || 0;
      var targetRow = i + 1;
      hrSheet.getRange(targetRow, 6).setValue(totalInc);
      hrSheet.getRange(targetRow, 7).setValue(baseSalary + totalInc);
      hrSheet.getRange(targetRow, 8).setValue(totalEarn);
      hrSheet.getRange(targetRow, 9).setValue(totalPaid);
      hrSheet.getRange(targetRow, 10).setValue(totalEarn - totalPaid);
      return true;
    }
  }
  return false;
}

/** Backfill every HR master row from HR_Transactions (for records logged before deploy). */
function syncHrMaster() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var hrSheet = ss.getSheetByName("HR");
  if (!hrSheet) return { success: false, message: "HR sheet not found." };

  var hrData = hrSheet.getDataRange().getValues();
  var synced = 0;
  for (var i = 1; i < hrData.length; i++) {
    var empName = String(hrData[i][1] || "").trim();
    if (empName && syncHrMasterForEmployee_(ss, empName)) synced++;
  }
  return {
    success: true,
    message: synced > 0 ? (synced + " employee HR row(s) synced from transactions.") : "No HR employees to sync.",
    synced: synced
  };
}

function inferSupplierTxnCategory_(purchase, discount, paymentPaid, remarks) {
  var rem = String(remarks || '').trim().toLowerCase();
  if (rem.indexOf('previous due') !== -1 || rem.indexOf('opening balance') !== -1) return 'Previous Due';
  if (paymentPaid > 0 && purchase === 0 && discount === 0) return 'Payment Paid';
  return 'Purchase';
}

function normalizeSupplierName_(name) {
  return String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeSupplierTxnCategory_(category, purchase, discount, paymentPaid, remarks) {
  var cat = String(category || "").trim();
  if (!cat) cat = inferSupplierTxnCategory_(purchase, discount, paymentPaid, remarks);
  var catKey = cat.toLowerCase();

  if (catKey.indexOf("previous due") !== -1 || catKey.indexOf("opening balance") !== -1) {
    purchase = purchase || paymentPaid;
    discount = 0;
    paymentPaid = 0;
  } else if (catKey.indexOf("payment paid") !== -1 || catKey === "paid") {
    paymentPaid = paymentPaid || purchase;
    purchase = 0;
    discount = 0;
  }

  return { purchase: purchase, discount: discount, paymentPaid: paymentPaid };
}

/** Parse Supplier_Transactions rowData payload (without ID column). */
function parseSupplierTxnPayload_(rowData) {
  var supplierName = String(rowData[1] || "").trim();
  var purchase = 0;
  var discount = 0;
  var paymentPaid = 0;
  var category = "";

  if (rowData.length >= 10) {
    purchase = parseFloat(rowData[2]) || 0;
    discount = parseFloat(rowData[3]) || 0;
    paymentPaid = parseFloat(rowData[4]) || 0;
    category = String(rowData[6] || "").trim();
  } else if (rowData.length >= 9) {
    purchase = parseFloat(rowData[2]) || 0;
    discount = parseFloat(rowData[3]) || 0;
    paymentPaid = parseFloat(rowData[4]) || 0;
    category = inferSupplierTxnCategory_(purchase, discount, paymentPaid, rowData[6]);
  } else {
    var amount = parseFloat(rowData[2]) || 0;
    category = String(rowData[3] || "").trim();
    if (category === "Purchase" || category === "Previous Due") purchase = amount;
    else if (category === "Payment Paid") paymentPaid = amount;
    else {
      category = inferSupplierTxnCategory_(amount, 0, 0, rowData[4]);
      if (category === "Payment Paid") paymentPaid = amount;
      else purchase = amount;
    }
  }

  var normalized = normalizeSupplierTxnCategory_(category, purchase, discount, paymentPaid, rowData[6] || rowData[4]);
  normalized.supplierName = supplierName;
  return normalized;
}

/** Parse Supplier_Transactions sheet row (includes ID in column A). */
function parseSupplierTxnSheetRow_(row) {
  var supplierName = String(row[2] || "").trim();
  var purchase = 0;
  var discount = 0;
  var paymentPaid = 0;
  var category = "";
  var remarks = "";

  var colCategory = String(row[7] || "").trim();
  var colCategoryKey = colCategory.toLowerCase();
  var looksNew = row.length >= 8 && (
    colCategoryKey.indexOf("purchase") !== -1 ||
    colCategoryKey.indexOf("payment paid") !== -1 ||
    colCategoryKey.indexOf("previous due") !== -1 ||
    colCategoryKey.indexOf("opening balance") !== -1
  );

  if (looksNew) {
    purchase = parseFloat(row[3]) || 0;
    discount = parseFloat(row[4]) || 0;
    paymentPaid = parseFloat(row[5]) || 0;
    category = colCategory;
    remarks = row[8];
  } else {
    var amount = parseFloat(row[3]) || 0;
    category = String(row[4] || "").trim();
    remarks = row[5];
    if (category === "Purchase" || category === "Previous Due") purchase = amount;
    else if (category === "Payment Paid") paymentPaid = amount;
    else {
      category = inferSupplierTxnCategory_(amount, 0, 0, remarks);
      if (category === "Payment Paid") paymentPaid = amount;
      else purchase = amount;
    }
  }

  var normalized = normalizeSupplierTxnCategory_(category, purchase, discount, paymentPaid, remarks);
  normalized.supplierName = supplierName;
  return normalized;
}

/** Recalculate Suppliers master row from all Supplier_Transactions for one supplier. */
function syncSupplierMasterForSupplier_(ss, supplierName) {
  var supSheet = ss.getSheetByName("Suppliers");
  var txnSheet = ss.getSheetByName("Supplier_Transactions");
  if (!supSheet || !txnSheet) return false;

  var targetKey = normalizeSupplierName_(supplierName);
  if (!targetKey) return false;

  var txnData = txnSheet.getDataRange().getValues();
  var totalPurchase = 0;
  var totalPayments = 0;
  var totalDiscount = 0;

  for (var t = 1; t < txnData.length; t++) {
    var parsed = parseSupplierTxnSheetRow_(txnData[t]);
    if (normalizeSupplierName_(parsed.supplierName) !== targetKey) continue;
    totalPurchase += parsed.purchase;
    totalDiscount += parsed.discount;
    totalPayments += parsed.paymentPaid;
  }

  var dueBalance = totalPurchase - totalPayments - totalDiscount;
  if (dueBalance < 0) dueBalance = 0;

  var supData = supSheet.getDataRange().getValues();
  for (var i = 1; i < supData.length; i++) {
    if (normalizeSupplierName_(supData[i][1]) === targetKey) {
      var targetRow = i + 1;
      supSheet.getRange(targetRow, 6).setValue(totalPurchase);
      supSheet.getRange(targetRow, 7).setValue(totalPayments);
      supSheet.getRange(targetRow, 8).setValue(dueBalance);
      return true;
    }
  }
  return false;
}

/** Backfill every Suppliers master row from Supplier_Transactions. */
function syncSupplierMaster() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var supSheet = ss.getSheetByName("Suppliers");
  if (!supSheet) return { success: false, message: "Suppliers sheet not found." };

  var supData = supSheet.getDataRange().getValues();
  var synced = 0;
  for (var i = 1; i < supData.length; i++) {
    var supplierName = String(supData[i][1] || "").trim();
    if (supplierName && syncSupplierMasterForSupplier_(ss, supplierName)) synced++;
  }
  return {
    success: true,
    message: synced > 0 ? (synced + " supplier row(s) synced from transactions.") : "No suppliers to sync.",
    synced: synced
  };
}

function createGenericRecord(sheetName, rowData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, message: "Sheet not found: " + sheetName };

  const fullRow = [Utilities.getUuid(), ...rowData];
  sheet.appendRow(fullRow);

  if (sheetName === "HR_Transactions") {
    syncHrMasterForEmployee_(ss, rowData[1]);
  }

  if (sheetName === "Supplier_Transactions") {
    var parsedSupplierTxn = parseSupplierTxnPayload_(rowData);
    syncSupplierMasterForSupplier_(ss, parsedSupplierTxn.supplierName);
  }

  if (sheetName === "Customer_Transactions") {
    const systemUID = rowData[1];
    let soldAmount = 0;
    let discountAmount = 0;
    let receivedAmount = 0;
    let paymentMethod = '';

    // New format: Date, UID, Sold, Discount, Received, Method, TxnDue, Remarks, User, Stamp
    if (rowData.length >= 10) {
      soldAmount = parseFloat(rowData[2]) || 0;
      discountAmount = parseFloat(rowData[3]) || 0;
      receivedAmount = parseFloat(rowData[4]) || 0;
      paymentMethod = rowData[5];
    } else {
      // Legacy format without discount column
      soldAmount = parseFloat(rowData[2]) || 0;
      receivedAmount = parseFloat(rowData[3]) || 0;
      paymentMethod = rowData[4];
    }

    const custSheet = ss.getSheetByName("Customers");
    if (custSheet) {
      const custData = custSheet.getDataRange().getValues();
      for (let i = 1; i < custData.length; i++) {
        if (custData[i][1] === systemUID) {

          let currentSell = parseFloat(custData[i][7]) || 0;
          let currentCash = parseFloat(custData[i][8]) || 0;
          let currentCard = parseFloat(custData[i][9]) || 0;
          let currentReceived = parseFloat(custData[i][10]) || 0;
          let currentDiscount = parseFloat(custData[i][11]) || 0;

          currentSell += soldAmount;
          currentDiscount += discountAmount;
          if (paymentMethod === "Cash") {
            currentCash += receivedAmount;
          } else if (paymentMethod === "Card") {
            currentCard += receivedAmount;
          }
          if (paymentMethod === "Cash" || paymentMethod === "Card") {
            currentReceived += receivedAmount;
          }

          let updatedDueBalance = currentSell - currentReceived - currentDiscount;
          const targetRow = i + 1;

          custSheet.getRange(targetRow, 8).setValue(currentSell);
          custSheet.getRange(targetRow, 9).setValue(currentCash);
          custSheet.getRange(targetRow, 10).setValue(currentCard);
          custSheet.getRange(targetRow, 11).setValue(currentReceived);
          custSheet.getRange(targetRow, 12).setValue(currentDiscount);
          custSheet.getRange(targetRow, 13).setValue(updatedDueBalance);
          break;
        }
      }
    }
  }

  if (sheetName === "Customers") {
    ensureDeliveryQueueEntry_(ss, rowData[0], rowData[12], rowData[13] || new Date());
  }

  return { success: true, message: "Record saved successfully!" };
}

function fetchGenericRecords(sheetName) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) return { success: false, message: "Sheet not found" };
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, records: [] };
  const headers = data[0];
  const records = [];
  for (let i = 1; i < data.length; i++) {
    let record = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = data[i][j];
    }
    records.push(record);
  }
  return { success: true, records: records };
}

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
      let prevEmpName = null;
      let prevSupplierName = null;
      if (sheetName === "HR_Transactions") {
        prevEmpName = String(data[i][2] || "").trim();
      }
      if (sheetName === "Supplier_Transactions") {
        prevSupplierName = String(data[i][2] || "").trim();
      }
      sheet.getRange(targetRow, 2, 1, rowData.length).setValues([rowData]);
      if (sheetName === "HR_Transactions") {
        syncHrMasterForEmployee_(ss, prevEmpName);
        const newEmpName = String(rowData[1] || "").trim();
        if (newEmpName && newEmpName !== prevEmpName) {
          syncHrMasterForEmployee_(ss, newEmpName);
        }
      }
      if (sheetName === "Supplier_Transactions") {
        syncSupplierMasterForSupplier_(ss, prevSupplierName);
        var newSupplierName = String(rowData[1] || "").trim();
        if (newSupplierName && newSupplierName !== prevSupplierName) {
          syncSupplierMasterForSupplier_(ss, newSupplierName);
        }
      }
      return { success: true, message: 'Transaction updated successfully.' };
    }
  }
  return { success: false, message: 'Record not found (ID: ' + targetId + ').' };
}

function deleteGenericRecord(sheetName, id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, message: 'Sheet not found: ' + sheetName };
  if (!id) return { success: false, message: 'Missing record ID.' };

  const data = sheet.getDataRange().getValues();
  const targetId = String(id);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === targetId) {
      let empName = null;
      let supplierName = null;
      if (sheetName === "HR_Transactions") {
        empName = String(data[i][2] || "").trim();
      }
      if (sheetName === "Supplier_Transactions") {
        supplierName = String(data[i][2] || "").trim();
      }
      sheet.deleteRow(i + 1);
      if (sheetName === "HR_Transactions" && empName) {
        syncHrMasterForEmployee_(ss, empName);
      }
      if (sheetName === "Supplier_Transactions" && supplierName) {
        syncSupplierMasterForSupplier_(ss, supplierName);
      }
      return { success: true, message: 'Transaction deleted successfully.' };
    }
  }
  return { success: false, message: 'Record not found (ID: ' + targetId + ').' };
}

function changeUserPassword(username, oldPassword, newPassword) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Users');
  const data = sheet.getDataRange().getValues();

  const oldHash = hashPassword(oldPassword);
  const newHash = hashPassword(newPassword);

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === username) {
      if (data[i][2] !== oldHash) {
        return { success: false, message: "Access Denied: Incorrect current password." };
      }
      sheet.getRange(i + 1, 3).setValue(newHash);
      return { success: true, message: "Security Update: Password changed successfully!" };
    }
  }
  return { success: false, message: "Error: User registry mismatch." };
}
