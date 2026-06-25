import { getCol, fmtMoney } from './recordHelpers.js';
import { getCustomerDueBalance, getCustomerUid, getCustomerName } from './customerEngine.js';
import { getHrEmployeeName, rollupHrTxnTotals, normalizeHrEmployeeName as normHr } from './hrEngine.js';
import { getSupplierName, getSupplierDueBalance, rollupSupplierTxnTotals } from './supplierEngine.js';

export async function confirmTypedDelete(label) {
  const confirmed = window.confirm(`Permanently delete ${label}?\n\nThis cannot be undone.`);
  if (!confirmed) return false;
  const typed = window.prompt('Type DELETE to confirm removal:');
  if (String(typed || '').trim().toUpperCase() !== 'DELETE') {
    alert('Delete cancelled — confirmation text did not match.');
    return false;
  }
  return true;
}

function countHrTxns(txns, empName) {
  const key = normHr(empName);
  return (txns || []).filter(
    (t) => normHr(getCol(t, ['Employee Name', 'Employee', 'Name'])) === key
  ).length;
}

function countCustomerTxns(txns, uid) {
  const id = String(uid || '').trim();
  return (txns || []).filter(
    (t) => String(getCol(t, ['System Unique ID', 'Sys UID']) || '').trim() === id
  ).length;
}

function countSupplierTxns(txns, name) {
  const n = String(name || '').trim();
  return (txns || []).filter((t) => getSupplierName(t) === n).length;
}

export function getHrMasterDeleteBlockReason(rec, txns) {
  const name = getHrEmployeeName(rec);
  const due = rollupHrTxnTotals(txns, name).due;
  if (due > 0.001) {
    return `Cannot delete: salary due SAR ${fmtMoney(due)} remains for "${name}".`;
  }
  const count = countHrTxns(txns, name);
  if (count > 0) {
    return `Cannot delete: ${count} HR transaction(s) exist for "${name}".`;
  }
  return null;
}

export function getCustomerMasterDeleteBlockReason(rec, txns) {
  const uid = getCustomerUid(rec);
  const due = getCustomerDueBalance(rec);
  if (due > 0.001) {
    return `Cannot delete: due balance SAR ${fmtMoney(due)} remains for "${getCustomerName(rec)}".`;
  }
  const count = countCustomerTxns(txns, uid);
  if (count > 0) {
    return `Cannot delete: ${count} customer transaction(s) exist for UID "${uid}".`;
  }
  return null;
}

export function getSupplierMasterDeleteBlockReason(rec, txns) {
  const name = getSupplierName(rec);
  const due = getSupplierDueBalance(rec, txns);
  if (due > 0.001) {
    return `Cannot delete: due balance SAR ${fmtMoney(due)} remains for "${name}".`;
  }
  const count = countSupplierTxns(txns, name);
  if (count > 0) {
    return `Cannot delete: ${count} supplier transaction(s) exist for "${name}".`;
  }
  return null;
}

export function buildHrMasterUpdateRow(rec, txns, fields, user) {
  const empName = fields.name.trim();
  const totals = rollupHrTxnTotals(txns, getHrEmployeeName(rec));
  const baseSalary = parseFloat(fields.salaryStart) || 0;
  const totalInc = totals.increment;
  const currentSalary = baseSalary + totalInc;
  const dbEarned = parseFloat(fields.totalEarn) || totals.earned;
  const dbPaid = parseFloat(fields.totalPaid) || totals.paid;
  const dbDue = Math.max(0, dbEarned - dbPaid);
  return [
    empName,
    fields.designation.trim(),
    fields.joining,
    baseSalary,
    totalInc,
    currentSalary,
    dbEarned,
    dbPaid,
    dbDue,
    fields.status,
    getCol(rec, ['Username']) || user?.username || ''
  ];
}

export function buildCustomerMasterUpdateRow(rec, fields, user) {
  const cash = parseFloat(fields.cash) || 0;
  const card = parseFloat(fields.card) || 0;
  const sell = parseFloat(fields.sell) || 0;
  const discount = parseFloat(fields.discount) || 0;
  const received = cash + card;
  const due = Math.max(0, sell - received - discount);
  return [
    getCustomerUid(rec),
    fields.name.trim(),
    fields.mobile.trim(),
    fields.email.trim(),
    fields.address.trim(),
    fields.memo.trim(),
    sell,
    cash,
    card,
    received,
    discount,
    due,
    getCol(rec, ['Username', 'Logged By']) || user?.username || '',
    getCol(rec, ['Creation Stamp', 'Stamp']) || new Date().toLocaleString()
  ];
}

export function buildSupplierMasterUpdateRow(rec, txns, fields, user) {
  const totals = rollupSupplierTxnTotals(txns, getSupplierName(rec));
  const purchase = parseFloat(fields.purchase);
  const payments = parseFloat(fields.payments);
  const usePurchase = Number.isFinite(purchase) ? purchase : totals.bill;
  const usePayments = Number.isFinite(payments) ? payments : totals.pay;
  const due = Math.max(0, usePurchase - totals.discount - usePayments);
  return [
    fields.name.trim(),
    fields.mobile.trim(),
    fields.email.trim(),
    fields.address.trim(),
    usePurchase,
    usePayments,
    due,
    fields.status,
    getCol(rec, ['Username']) || user?.username || '',
    getCol(rec, ['Stamp']) || new Date().toLocaleString()
  ];
}
