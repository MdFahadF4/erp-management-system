import { v4 as uuidv4 } from 'uuid';
import {
  findAllRecords,
  findRecordById,
  insertRecord,
  updateRecordById,
  deleteRecordById
} from '../models/recordModel.js';
import { sheetToCollection } from '../constants/sheets.js';
import { getField, errorResponse, successResponse } from '../utils/helpers.js';
import {
  syncHrMasterForEmployee,
  syncSupplierMasterForSupplier,
  syncCustomerMasterForUid,
  ensureDeliveryQueueEntry,
  customerTxnCountForUid,
  removeDeliveryQueueEntriesForUid,
  pruneDeliveryQueue,
  parseSupplierTxnPayload
} from './syncService.js';

/** Known column layouts for transaction sheets (rowData excludes ID) */
const SHEET_LAYOUTS = {
  HR: [
    'Employee Name',
    'Designation',
    'Date of Joining',
    'Salary Start',
    'Increment Amount',
    'Current Salary',
    'Total Earn Earning',
    'Paid Salary',
    'Due Balance Salary',
    'Status',
    'Username'
  ],
  Customers: [
    'System Unique ID',
    'Customer Name',
    'Mobile',
    'Email',
    'Address',
    'Invoice / Memo Number',
    'Total Sell',
    'Cash Amt',
    'Card Amt',
    'Total Received',
    'Discount',
    'Due Balance',
    'Username',
    'Creation Stamp'
  ],
  HR_Transactions: [
    'Date',
    'Employee Name',
    'Amount',
    'Category',
    'Remarks',
    'Username',
    'Timestamp'
  ],
  Suppliers: [
    'Supplier Name',
    'Mobile',
    'Email',
    'Address',
    'Total Purchase',
    'Total Payments',
    'Due Balance',
    'Status',
    'Username',
    'Stamp'
  ],
  Expense_Heads: ['Tracking ID', 'Parent Head', 'Sub Head Name', 'Authorized By', 'Creation Stamp'],
  Creditor_Heads: ['Tracking ID', 'Creditor Parent Head', 'Sub Head', 'Authorized By', 'Creation Stamp'],
  Income_Heads: ['Tracking ID', 'Income Parent Head', 'Sub Head', 'Authorized By', 'Creation Stamp'],
  Capital_Heads: ['Tracking ID', 'Capital Parent Head', 'Sub Head', 'Authorized By', 'Creation Stamp'],
  Supplier_Transactions: [
    'Date',
    'Supplier Name',
    'Purchase Amount',
    'Discount',
    'Payment Paid',
    'Transaction Due',
    'Category',
    'Remarks',
    'Logged By',
    'Stamp'
  ],
  Customer_Transactions: [
    'Date',
    'System Unique ID',
    'Sold Amount',
    'Discount',
    'Received Amount',
    'Payment Method',
    'Transaction Due',
    'Remarks / Reference',
    'Logged By',
    'Stamp'
  ],
  Internal_Transfers: [
    'Date',
    'Amount',
    'Remarks',
    'Transferred By',
    'Transfer To User',
    'Status',
    'Approved By',
    'Approved At',
    'Stamp'
  ],
  Expense_Transactions: [
    'Transaction ID',
    'Date',
    'Expense Parent Head',
    'Sub Head',
    'Incurred Amount',
    'Discount',
    'Payment Paid',
    'Transaction Due',
    'Category',
    'Remarks',
    'Logged By',
    'Stamp'
  ],
  Creditor_Transactions: [
    'Transaction ID',
    'Date',
    'Creditor Parent Head',
    'Sub Head',
    'Received Amount',
    'Discount',
    'Return Amount',
    'Transaction Due',
    'Category',
    'Remarks',
    'Logged By',
    'Stamp'
  ],
  Income_Transactions: [
    'Transaction ID',
    'Date',
    'Income Parent Head',
    'Sub Head',
    'Receivable Amount',
    'Discount',
    'Received Amount',
    'Transaction Due',
    'Category',
    'Remarks',
    'Logged By',
    'Stamp'
  ],
  Capital_Transactions: [
    'Transaction ID',
    'Date',
    'Capital Parent Head',
    'Sub Head',
    'Capital In Amount',
    'Discount',
    'Capital Out Amount',
    'Transaction Due',
    'Category',
    'Remarks',
    'Logged By',
    'Stamp'
  ]
};

function rowDataToRecord(sheetName, rowData, existingId) {
  const headers = SHEET_LAYOUTS[sheetName];
  const record = { ID: existingId || uuidv4() };

  if (headers) {
    headers.forEach((header, i) => {
      if (rowData[i] !== undefined) record[header] = rowData[i];
    });
    return record;
  }

  rowData.forEach((val, i) => {
    record[`Column_${i + 1}`] = val;
  });
  return record;
}

export async function createGenericRecord(sheetName, rowData) {
  const collection = sheetToCollection(sheetName);
  let record;
  if (sheetName === 'Internal_Transfers') {
    record = {
      ID: uuidv4(),
      Date: rowData[0],
      Amount: rowData[1],
      Remarks: rowData[2],
      'Transferred By': rowData[3],
      'Transfer To User': rowData[4] ?? '',
      Status: 'Pending',
      'Approved By': '',
      'Approved At': '',
      Stamp: rowData[5] || new Date().toLocaleString()
    };
  } else {
    record = rowDataToRecord(sheetName, rowData);
  }
  await insertRecord(collection, record);

  if (sheetName === 'HR_Transactions') {
    await syncHrMasterForEmployee(rowData[1]);
  }
  if (sheetName === 'Supplier_Transactions') {
    const parsed = parseSupplierTxnPayload(rowData);
    await syncSupplierMasterForSupplier(parsed.supplierName);
  }
  if (sheetName === 'Customer_Transactions') {
    const uid = String(rowData[1] || '').trim();
    await syncCustomerMasterForUid(uid);
    if (uid) {
      await ensureDeliveryQueueEntry(uid, String(rowData[8] || '').trim(), rowData[0] || new Date());
    }
  }

  return successResponse({ message: 'Record saved successfully.' });
}

export async function fetchGenericRecords(sheetName) {
  const collection = sheetToCollection(sheetName);
  const records = await findAllRecords(collection);
  return successResponse({ records });
}

export async function updateGenericRecord(sheetName, id, rowData) {
  if (!id) return errorResponse('Missing record ID.');
  if (!rowData || !rowData.length) return errorResponse('Missing row data.');

  const collection = sheetToCollection(sheetName);
  const existing = await findRecordById(collection, id);
  if (!existing) return errorResponse(`Record not found (ID: ${id}).`);

  const updated = rowDataToRecord(sheetName, rowData, String(id));
  await updateRecordById(collection, id, updated);

  if (sheetName === 'HR_Transactions') {
    const prevEmp = String(existing['Employee Name'] || '').trim();
    await syncHrMasterForEmployee(prevEmp);
    const newEmp = String(rowData[1] || '').trim();
    if (newEmp && newEmp !== prevEmp) await syncHrMasterForEmployee(newEmp);
  }
  if (sheetName === 'Supplier_Transactions') {
    const prev = String(existing['Supplier Name'] || '').trim();
    await syncSupplierMasterForSupplier(prev);
    const newName = String(rowData[1] || '').trim();
    if (newName && newName !== prev) await syncSupplierMasterForSupplier(newName);
  }
  if (sheetName === 'Customer_Transactions') {
    const prevUid = String(existing['System Unique ID'] || '').trim();
    await syncCustomerMasterForUid(prevUid);
    const newUid = String(rowData[1] || '').trim();
    if (newUid && newUid !== prevUid) await syncCustomerMasterForUid(newUid);
  }

  return successResponse({ message: 'Transaction updated successfully.' });
}

export async function deleteGenericRecord(sheetName, id) {
  if (!id) return errorResponse('Missing record ID.');

  const collection = sheetToCollection(sheetName);
  const existing = await findRecordById(collection, id);
  if (!existing) return errorResponse(`Record not found (ID: ${id}).`);

  await deleteRecordById(collection, id);

  if (sheetName === 'HR_Transactions') {
    await syncHrMasterForEmployee(String(existing['Employee Name'] || '').trim());
  }
  if (sheetName === 'Supplier_Transactions') {
    await syncSupplierMasterForSupplier(String(existing['Supplier Name'] || '').trim());
  }
  if (sheetName === 'Customer_Transactions') {
    const uid = String(getField(existing, ['System Unique ID', 'Sys UID']) || '').trim();
    await syncCustomerMasterForUid(uid);
    if (uid && (await customerTxnCountForUid(uid)) === 0) {
      await removeDeliveryQueueEntriesForUid(uid, { pendingOnly: true });
    }
    await pruneDeliveryQueue();
  }
  if (sheetName === 'Customers') {
    const uid = String(getField(existing, ['System Unique ID']) || '').trim();
    if (uid) await removeDeliveryQueueEntriesForUid(uid);
    await pruneDeliveryQueue();
  }

  return successResponse({ message: 'Record deleted successfully.' });
}
