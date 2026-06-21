/**
 * FULL APPS SCRIPT — copy ALL of this into script.google.com (replace your Code.gs).
 * Then: Deploy → Manage deployments → Edit → New version → Deploy
 *
 * USERS SHEET — add these column headers in row 1 (after Created Date):
 *   H = Mobile | I = Email | J = Status  (Active / Paused / Removed)
 * Existing users without Status are treated as Active.
 *
 * CUSTOMER_TRANSACTIONS — add column D = Discount (after Sold Amount) if missing.
 * New row order: Date | System Unique ID | Sold | Discount | Received | Method | Txn Due | Remarks | Logged By | Stamp
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
    const accountStatus = adminSheet.getRange("B1").getValue();
    if (accountStatus !== "ACTIVE") {
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
  const inputHash = hashPassword(password);

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === username && data[i][2] === inputHash) {
      var status = getUserStatus_(data[i]);
      if (status === 'Paused') {
        return { success: false, message: 'Account paused. Contact your administrator.' };
      }
      if (status === 'Removed') {
        return { success: false, message: 'Account removed. Contact your administrator.' };
      }
      return {
        success: true,
        userData: {
          username: data[i][1],
          role: data[i][3],
          permissions: String(data[i][4] || 'ALL').split(',').filter(function (p) { return String(p).trim(); }),
          status: status
        }
      };
    }
  }
  return { success: false, message: "Invalid username or password" };
}

function getUserStatus_(row) {
  var status = row[9];
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

  var row = data[idx];
  var status = getUserStatus_(row);
  if (status === 'Paused') return { success: false, message: 'Account is paused. Contact your administrator.' };
  if (status === 'Removed') return { success: false, message: 'Account was removed. Contact your administrator.' };

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
  if (payload.permissions !== undefined) sheet.getRange(idx + 1, 5).setValue(payload.permissions);
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

function createGenericRecord(sheetName, rowData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, message: "Sheet not found: " + sheetName };

  const fullRow = [Utilities.getUuid(), ...rowData];
  sheet.appendRow(fullRow);

  if (sheetName === "HR_Transactions") {
    const empName = rowData[1];
    const amount = parseFloat(rowData[2]) || 0;
    const category = rowData[3];
    const hrSheet = ss.getSheetByName("HR");
    if (hrSheet) {
      const hrData = hrSheet.getDataRange().getValues();
      for (let i = 1; i < hrData.length; i++) {
        if (hrData[i][1] === empName) {
          let currentTotalEarn = parseFloat(hrData[i][7]) || 0;
          let currentPaidSalary = parseFloat(hrData[i][8]) || 0;
          if (category === "Salary Earn") currentTotalEarn += amount;
          else if (category === "Salary Paid") currentPaidSalary += amount;
          let updatedDueBalance = currentTotalEarn - currentPaidSalary;
          const targetRow = i + 1;
          hrSheet.getRange(targetRow, 8).setValue(currentTotalEarn);
          hrSheet.getRange(targetRow, 9).setValue(currentPaidSalary);
          hrSheet.getRange(targetRow, 10).setValue(updatedDueBalance);
          break;
        }
      }
    }
  }

  if (sheetName === "Supplier_Transactions") {
    const supplierName = rowData[1];
    const amount = parseFloat(rowData[2]) || 0;
    const category = rowData[3];

    const supSheet = ss.getSheetByName("Suppliers");
    if (supSheet) {
      const supData = supSheet.getDataRange().getValues();
      for (let i = 1; i < supData.length; i++) {
        if (supData[i][1] === supplierName) {
          let totalPurchase = parseFloat(supData[i][5]) || 0;
          let totalPayments = parseFloat(supData[i][6]) || 0;

          if (category === "Purchase") {
            totalPurchase += amount;
          } else if (category === "Payment Paid") {
            totalPayments += amount;
          }

          let updatedDueBalance = totalPurchase - totalPayments;
          const targetRow = i + 1;

          supSheet.getRange(targetRow, 6).setValue(totalPurchase);
          supSheet.getRange(targetRow, 7).setValue(totalPayments);
          supSheet.getRange(targetRow, 8).setValue(updatedDueBalance);
          break;
        }
      }
    }
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
      sheet.getRange(targetRow, 2, 1, rowData.length).setValues([rowData]);
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
      sheet.deleteRow(i + 1);
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
