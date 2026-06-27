import { getField, normalizeHrName, normalizeSupplierName } from '../utils/helpers.js';
import {
  findAllRecords,
  insertRecord,
  updateRecordById,
  deleteRecordById
} from '../models/recordModel.js';
import { sheetToCollection } from '../constants/sheets.js';
import { v4 as uuidv4 } from 'uuid';

const HR_COLLECTION = sheetToCollection('HR');
const HR_TXN_COLLECTION = sheetToCollection('HR_Transactions');
const CUSTOMERS_COLLECTION = sheetToCollection('Customers');
const CUSTOMER_TXN_COLLECTION = sheetToCollection('Customer_Transactions');
const SUPPLIERS_COLLECTION = sheetToCollection('Suppliers');
const SUPPLIER_TXN_COLLECTION = sheetToCollection('Supplier_Transactions');
const DELIVERY_COLLECTION = sheetToCollection('Delivery_Queue');

function normalizeUid(systemUID) {
  return String(systemUID || '').trim().toUpperCase();
}

export function inferSupplierTxnCategory(purchase, discount, paymentPaid, remarks) {
  const rem = String(remarks || '').trim().toLowerCase();
  if (rem.includes('previous due') || rem.includes('opening balance')) return 'Previous Due';
  if (paymentPaid > 0 && purchase === 0 && discount === 0) return 'Payment Paid';
  return 'Purchase';
}

export function normalizeSupplierTxnCategory(category, purchase, discount, paymentPaid, remarks) {
  let cat = String(category || '').trim();
  if (!cat) cat = inferSupplierTxnCategory(purchase, discount, paymentPaid, remarks);
  const catKey = cat.toLowerCase();

  if (catKey.includes('previous due') || catKey.includes('opening balance')) {
    purchase = purchase || paymentPaid;
    discount = 0;
    paymentPaid = 0;
  } else if (catKey.includes('payment paid') || catKey === 'paid') {
    paymentPaid = paymentPaid || purchase;
    purchase = 0;
    discount = 0;
  }

  return { purchase, discount, paymentPaid };
}

export function parseSupplierTxnPayload(rowData) {
  let supplierName = String(rowData[1] || '').trim();
  let purchase = 0;
  let discount = 0;
  let paymentPaid = 0;
  let category = '';

  if (rowData.length >= 10) {
    purchase = parseFloat(rowData[2]) || 0;
    discount = parseFloat(rowData[3]) || 0;
    paymentPaid = parseFloat(rowData[4]) || 0;
    category = String(rowData[6] || '').trim();
  } else if (rowData.length >= 9) {
    purchase = parseFloat(rowData[2]) || 0;
    discount = parseFloat(rowData[3]) || 0;
    paymentPaid = parseFloat(rowData[4]) || 0;
    category = inferSupplierTxnCategory(purchase, discount, paymentPaid, rowData[6]);
  } else {
    const amount = parseFloat(rowData[2]) || 0;
    category = String(rowData[3] || '').trim();
    if (category === 'Purchase' || category === 'Previous Due') purchase = amount;
    else if (category === 'Payment Paid') paymentPaid = amount;
    else {
      category = inferSupplierTxnCategory(amount, 0, 0, rowData[4]);
      if (category === 'Payment Paid') paymentPaid = amount;
      else purchase = amount;
    }
  }

  const normalized = normalizeSupplierTxnCategory(category, purchase, discount, paymentPaid, rowData[6] || rowData[4]);
  normalized.supplierName = supplierName;
  return normalized;
}

export function parseSupplierTxnRecord(record) {
  const supplierName = String(getField(record, ['Supplier Name']) || '').trim();
  let purchase = parseFloat(getField(record, ['Purchase Amount']) || 0) || 0;
  let discount = parseFloat(getField(record, ['Discount']) || 0) || 0;
  let paymentPaid = parseFloat(getField(record, ['Payment Paid']) || 0) || 0;
  let category = String(getField(record, ['Category']) || '').trim();
  const remarks = getField(record, ['Remarks']);

  if (!category && !purchase && !paymentPaid) {
    const amount = parseFloat(getField(record, ['Amount']) || 0) || 0;
    category = String(getField(record, ['Category']) || '').trim();
    if (category === 'Purchase' || category === 'Previous Due') purchase = amount;
    else if (category === 'Payment Paid') paymentPaid = amount;
    else {
      category = inferSupplierTxnCategory(amount, 0, 0, remarks);
      if (category === 'Payment Paid') paymentPaid = amount;
      else purchase = amount;
    }
  }

  const normalized = normalizeSupplierTxnCategory(category, purchase, discount, paymentPaid, remarks);
  normalized.supplierName = supplierName;
  return normalized;
}

export function parseCustomerTxnRecord(record) {
  const rawMethod = String(getField(record, ['Payment Method', 'Method']) || '').trim();
  const methodLower = rawMethod.toLowerCase();
  let method = 'Cash';
  if (methodLower.includes('card')) method = 'Card';
  else if (methodLower.includes('cash') || methodLower === '') method = 'Cash';

  return {
    uid: String(getField(record, ['System Unique ID', 'Sys UID']) || '').trim(),
    sold: parseFloat(getField(record, ['Sold Amount', 'Sold']) || 0) || 0,
    discount: parseFloat(getField(record, ['Discount']) || 0) || 0,
    received: parseFloat(getField(record, ['Received Amount', 'Received']) || 0) || 0,
    method
  };
}

export async function syncHrMasterForEmployee(empName) {
  const targetKey = normalizeHrName(empName);
  if (!targetKey) return false;

  const hrRecords = await findAllRecords(HR_COLLECTION);
  const txnRecords = await findAllRecords(HR_TXN_COLLECTION);
  let totalInc = 0;
  let totalEarn = 0;
  let totalPaid = 0;

  for (const txn of txnRecords) {
    if (normalizeHrName(getField(txn, ['Employee Name'])) !== targetKey) continue;
    const amt = parseFloat(getField(txn, ['Amount']) || 0) || 0;
    const cat = String(getField(txn, ['Category']) || '')
      .trim()
      .toLowerCase();

    if (cat.includes('increment')) totalInc += amt;
    if (cat.includes('earn') || cat.includes('previous due') || cat.includes('opening balance')) {
      totalEarn += amt;
    } else if (cat.includes('paid')) {
      totalPaid += amt;
    }
  }

  for (const hr of hrRecords) {
    if (normalizeHrName(getField(hr, ['Employee Name'])) !== targetKey) continue;
    const baseSalary =
      parseFloat(getField(hr, ['Salary Start', 'Base Salary']) || 0) || 0;
    const updated = {
      ...hr,
      'Increment Amount': totalInc,
      'Current Salary': baseSalary + totalInc,
      'Total Earn Earning': totalEarn,
      'Paid Salary': totalPaid,
      'Due Balance Salary': totalEarn - totalPaid
    };
    await updateRecordById(HR_COLLECTION, hr.ID, updated);
    return true;
  }
  return false;
}

export async function syncHrMaster() {
  const hrRecords = await findAllRecords(HR_COLLECTION);
  let synced = 0;
  for (const hr of hrRecords) {
    const empName = String(getField(hr, ['Employee Name']) || '').trim();
    if (empName && (await syncHrMasterForEmployee(empName))) synced++;
  }
  return {
    success: true,
    message:
      synced > 0
        ? `${synced} employee HR row(s) synced from transactions.`
        : 'No HR employees to sync.',
    synced
  };
}

export async function syncCustomerMasterForUid(systemUID) {
  const target = String(systemUID || '').trim();
  if (!target) return false;

  const txnRecords = await findAllRecords(CUSTOMER_TXN_COLLECTION);
  let totalSell = 0;
  let totalCash = 0;
  let totalCard = 0;
  let totalReceived = 0;
  let totalDiscount = 0;

  for (const txn of txnRecords) {
    const p = parseCustomerTxnRecord(txn);
    if (p.uid !== target) continue;
    totalSell += p.sold;
    totalDiscount += p.discount;
    if (p.method === 'Cash') {
      totalCash += p.received;
      totalReceived += p.received;
    } else if (p.method === 'Card') {
      totalCard += p.received;
      totalReceived += p.received;
    }
  }

  let dueBalance = totalSell - totalReceived - totalDiscount;
  if (dueBalance < 0) dueBalance = 0;

  const custRecords = await findAllRecords(CUSTOMERS_COLLECTION);
  for (const cust of custRecords) {
    const uid = String(getField(cust, ['System Unique ID']) || '').trim();
    if (uid !== target) continue;
    const updated = {
      ...cust,
      'Total Sell': totalSell,
      'Cash Amt': totalCash,
      'Card Amt': totalCard,
      'Total Received': totalReceived,
      Discount: totalDiscount,
      'Due Balance': dueBalance
    };
    await updateRecordById(CUSTOMERS_COLLECTION, cust.ID, updated);
    return true;
  }
  return false;
}

export async function syncCustomerMaster() {
  const custRecords = await findAllRecords(CUSTOMERS_COLLECTION);
  let synced = 0;
  for (const cust of custRecords) {
    const systemUID = String(getField(cust, ['System Unique ID']) || '').trim();
    if (systemUID && (await syncCustomerMasterForUid(systemUID))) synced++;
  }
  return {
    success: true,
    message:
      synced > 0
        ? `${synced} customer row(s) synced from transactions.`
        : 'No customers to sync.',
    synced
  };
}

export async function syncSupplierMasterForSupplier(supplierName) {
  const targetKey = normalizeSupplierName(supplierName);
  if (!targetKey) return false;

  const txnRecords = await findAllRecords(SUPPLIER_TXN_COLLECTION);
  let totalPurchase = 0;
  let totalPayments = 0;
  let totalDiscount = 0;

  for (const txn of txnRecords) {
    const parsed = parseSupplierTxnRecord(txn);
    if (normalizeSupplierName(parsed.supplierName) !== targetKey) continue;
    totalPurchase += parsed.purchase;
    totalDiscount += parsed.discount;
    totalPayments += parsed.paymentPaid;
  }

  let dueBalance = totalPurchase - totalPayments - totalDiscount;
  if (dueBalance < 0) dueBalance = 0;

  const supRecords = await findAllRecords(SUPPLIERS_COLLECTION);
  for (const sup of supRecords) {
    if (normalizeSupplierName(getField(sup, ['Supplier Name'])) !== targetKey) continue;
    const updated = {
      ...sup,
      'Total Purchase': totalPurchase,
      'Total Payments': totalPayments,
      'Due Balance': dueBalance
    };
    await updateRecordById(SUPPLIERS_COLLECTION, sup.ID, updated);
    return true;
  }
  return false;
}

export async function syncSupplierMaster() {
  const supRecords = await findAllRecords(SUPPLIERS_COLLECTION);
  let synced = 0;
  for (const sup of supRecords) {
    const supplierName = String(getField(sup, ['Supplier Name']) || '').trim();
    if (supplierName && (await syncSupplierMasterForSupplier(supplierName))) synced++;
  }
  return {
    success: true,
    message:
      synced > 0
        ? `${synced} supplier row(s) synced from transactions.`
        : 'No suppliers to sync.',
    synced
  };
}

async function getLatestCustomerTxnRemarks(systemUID) {
  const target = String(systemUID || '').trim();
  if (!target) return '';
  const txnRecords = await findAllRecords(CUSTOMER_TXN_COLLECTION);
  let latest = '';
  let latestTime = 0;
  for (const txn of txnRecords) {
    if (String(getField(txn, ['System Unique ID']) || '').trim() !== target) continue;
    const remarks = String(getField(txn, ['Remarks / Reference', 'Remarks']) || '').trim();
    const stamp = new Date(getField(txn, ['Date']) || 0).getTime();
    if (!remarks) continue;
    if (stamp >= latestTime) {
      latestTime = stamp;
      latest = remarks;
    }
  }
  return latest;
}

export async function customerTxnCountForUid(systemUID) {
  const target = normalizeUid(systemUID);
  if (!target) return 0;
  const txns = await findAllRecords(CUSTOMER_TXN_COLLECTION);
  return txns.filter(
    (txn) => normalizeUid(getField(txn, ['System Unique ID', 'Sys UID'])) === target
  ).length;
}

export async function removeDeliveryQueueEntriesForUid(systemUID, { pendingOnly = false } = {}) {
  const target = normalizeUid(systemUID);
  if (!target) return 0;

  const delRecords = await findAllRecords(DELIVERY_COLLECTION);
  let removed = 0;
  for (const rec of delRecords) {
    if (normalizeUid(getField(rec, ['System Unique ID', 'Sys UID'])) !== target) continue;
    const status = String(getField(rec, ['Status']) || 'Pending').trim();
    if (pendingOnly && status !== 'Pending') continue;
    await deleteRecordById(DELIVERY_COLLECTION, rec.ID);
    removed++;
  }
  return removed;
}

export async function pruneDeliveryQueue() {
  const custRecords = await findAllRecords(CUSTOMERS_COLLECTION);
  const txnRecords = await findAllRecords(CUSTOMER_TXN_COLLECTION);
  const customerUids = new Set(
    custRecords
      .map((cust) => normalizeUid(getField(cust, ['System Unique ID'])))
      .filter(Boolean)
  );
  const txnUids = new Set(
    txnRecords
      .map((txn) => normalizeUid(getField(txn, ['System Unique ID', 'Sys UID'])))
      .filter(Boolean)
  );

  const delRecords = await findAllRecords(DELIVERY_COLLECTION);
  let removed = 0;
  for (const rec of delRecords) {
    const uid = normalizeUid(getField(rec, ['System Unique ID', 'Sys UID']));
    const status = String(getField(rec, ['Status']) || 'Pending').trim();

    if (!uid || !customerUids.has(uid)) {
      await deleteRecordById(DELIVERY_COLLECTION, rec.ID);
      removed++;
      continue;
    }

    if (status === 'Pending' && !txnUids.has(uid)) {
      await deleteRecordById(DELIVERY_COLLECTION, rec.ID);
      removed++;
    }
  }
  return removed;
}

export async function ensureDeliveryQueueEntry(systemUID, username, issuedDate) {
  const uid = String(systemUID || '').trim();
  if (!uid) return;

  const delRecords = await findAllRecords(DELIVERY_COLLECTION);
  const target = normalizeUid(uid);
  const exists = delRecords.some(
    (r) => normalizeUid(getField(r, ['System Unique ID', 'Sys UID'])) === target
  );
  if (exists) return;

  const remarks = await getLatestCustomerTxnRemarks(uid);
  await insertRecord(DELIVERY_COLLECTION, {
    ID: uuidv4(),
    'System Unique ID': uid,
    Remarks: remarks,
    'Issued Date': issuedDate || new Date(),
    Username: String(username || ''),
    Status: 'Pending',
    'Delivery Date': '',
    'Delivered Remarks': '',
    Stamp: new Date().toLocaleString()
  });
}

export async function syncDeliveryQueue() {
  const removed = await pruneDeliveryQueue();

  const custRecords = await findAllRecords(CUSTOMERS_COLLECTION);
  const txnRecords = await findAllRecords(CUSTOMER_TXN_COLLECTION);
  const txnUids = new Set(
    txnRecords
      .map((txn) => normalizeUid(getField(txn, ['System Unique ID', 'Sys UID'])))
      .filter(Boolean)
  );
  const delRecords = await findAllRecords(DELIVERY_COLLECTION);
  const existing = new Set(
    delRecords.map((r) => normalizeUid(getField(r, ['System Unique ID', 'Sys UID']))).filter(Boolean)
  );

  let added = 0;
  for (const cust of custRecords) {
    const systemUID = String(getField(cust, ['System Unique ID']) || '').trim();
    const uidKey = normalizeUid(systemUID);
    if (!uidKey || existing.has(uidKey) || !txnUids.has(uidKey)) continue;
    const loggedBy = String(getField(cust, ['Logged By']) || '');
    const issued = getField(cust, ['Creation Stamp']) || new Date();
    await ensureDeliveryQueueEntry(systemUID, loggedBy, issued);
    existing.add(uidKey);
    added++;
  }

  const parts = [];
  if (removed > 0) parts.push(`${removed} stale record(s) removed`);
  if (added > 0) parts.push(`${added} delivery record(s) synced`);

  return {
    success: true,
    message: parts.length ? parts.join('; ') + '.' : 'Delivery queue is up to date.',
    added,
    removed
  };
}
