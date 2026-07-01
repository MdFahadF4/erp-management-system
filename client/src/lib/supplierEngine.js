import { parseSupplierTxnAmounts } from './txnParsers.js';
import { addMoney, getCol, fmtMoney, parseMoneyInput, reconcileBillDiscPaid, roundMoney } from './recordHelpers.js';

export function getSupplierName(rec) {
  return String(getCol(rec, ['Supplier Name']) || '').trim();
}

export function rollupSupplierTxnTotals(txns, supplierName) {
  const name = supplierName ? String(supplierName).trim() : '';
  let bill = 0;
  let discount = 0;
  let pay = 0;
  (txns || []).forEach((t) => {
    if (name && getSupplierName(t) !== name) return;
    const p = parseSupplierTxnAmounts(t);
    bill = addMoney(bill, p.bill);
    discount = addMoney(discount, p.discount);
    pay = addMoney(pay, p.pay);
  });
  const reconciled = reconcileBillDiscPaid(bill, discount, pay);
  return {
    bill: reconciled.billed,
    discount: reconciled.discount,
    pay: reconciled.paid,
    due: reconciled.due
  };
}

export function getSupplierDueBalance(supplierRec, txns) {
  if (!supplierRec) return 0;
  return rollupSupplierTxnTotals(txns, getSupplierName(supplierRec)).due;
}

export function parseSupplierTxnDue(purchase, discount, paid) {
  const reconciled = reconcileBillDiscPaid(
    parseMoneyInput(purchase),
    parseMoneyInput(discount),
    parseMoneyInput(paid)
  );
  return reconciled.due;
}

export function computeSupplierTxnDueValue(category, purchase, discount, paid) {
  const cat = String(category || '').trim().toLowerCase();
  const bill = parseMoneyInput(purchase);
  const disc = parseMoneyInput(discount);
  const pay = parseMoneyInput(paid);
  if (cat.includes('previous due') || cat.includes('opening balance')) {
    return bill;
  }
  if (cat.includes('payment paid') || (cat.includes('paid') && !cat.includes('previous'))) {
    return roundMoney(-pay);
  }
  return reconcileBillDiscPaid(bill, disc, pay).due;
}

export function computeSupplierRemainingDue(currentDue, purchase, discount, paid) {
  const delta = reconcileBillDiscPaid(
    parseMoneyInput(purchase),
    parseMoneyInput(discount),
    parseMoneyInput(paid)
  ).due;
  return roundMoney(Math.max(0, parseMoneyInput(currentDue) + delta));
}

export function getSupplierTxnCategory(rec) {
  return parseSupplierTxnAmounts(rec).category;
}

export function getSupplierStatusBadgeClass(status) {
  const value = String(status || 'Active');
  if (value === 'Inactive') return 'bg-amber-100 text-amber-800';
  return 'bg-green-100 text-green-800';
}

export function getSupplierTxnCategoryColor(category) {
  const cat = String(category || '').toLowerCase();
  if (cat.includes('payment paid') || cat.includes('paid')) return 'text-emerald-600 bg-emerald-50';
  if (cat.includes('previous due')) return 'text-slate-700 bg-slate-200';
  return 'text-blue-600 bg-blue-50';
}

export function buildSupplierLedgerRow(rec, txns, canEdit) {
  const supName = getSupplierName(rec);
  const totals = rollupSupplierTxnTotals(txns, supName);
  const status = getCol(rec, ['Status']) || rec['Status'] || 'Active';

  return {
    id: rec.ID,
    supName,
    mobile: getCol(rec, ['Mobile']) || '',
    email: getCol(rec, ['Email']) || '',
    address: getCol(rec, ['Address']) || '',
    totalPurchase: totals.bill,
    totalPaid: totals.pay,
    totalDiscount: totals.discount,
    dbDue: totals.due,
    status,
    badgeClass: getSupplierStatusBadgeClass(status),
    canEdit
  };
}

export { getCol, fmtMoney };
