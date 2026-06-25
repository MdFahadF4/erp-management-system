import { getCol, cln } from './recordHelpers.js';

export function getDualTxnCategory(rec, fieldMap) {
  const cats = fieldMap.categories || {};
  const cat = String(getCol(rec, ['Category']) || '').trim();
  if (cat) return cat;
  const rem = String(getCol(rec, fieldMap.remarks)).toLowerCase();
  const sub = String(getCol(rec, fieldMap.sub)).toUpperCase();
  const main = String(getCol(rec, fieldMap.main)).toUpperCase();
  if (
    rem.includes('previous due') ||
    rem.includes('opening balance') ||
    sub.includes('PREVIOUS DUE') ||
    main.includes('PREVIOUS DUE')
  ) {
    return cats.prev || 'Previous Due';
  }
  const pay = parseFloat(getCol(rec, fieldMap.pay)) || 0;
  const bill = parseFloat(getCol(rec, fieldMap.bill)) || 0;
  const discount = parseFloat(getCol(rec, fieldMap.discount)) || 0;
  if (pay > 0 && bill === 0 && discount === 0) return cats.pay || 'Payment';
  return cats.bill || 'Bill';
}

function normalizeDualTxnAmountsByCategory(category, bill, discount, pay, fieldMap) {
  const catKey = String(category || '').trim().toLowerCase();
  const cats = fieldMap.categories || {};
  const payKey = String(cats.pay || '').toLowerCase();
  if (catKey.includes('previous due') || catKey.includes('opening balance')) {
    const amt = bill || pay;
    return { bill: amt, discount: 0, pay: 0, txnDue: amt };
  }
  if (payKey && catKey === payKey) {
    const amt = pay || bill;
    return { bill: 0, discount: 0, pay: amt, txnDue: -amt };
  }
  return { bill, discount, pay, txnDue: bill - discount - pay };
}

export function parseTxnDualAmounts(rec, fieldMap) {
  const category = getDualTxnCategory(rec, fieldMap);
  let bill = parseFloat(getCol(rec, fieldMap.bill)) || 0;
  let discount = parseFloat(getCol(rec, fieldMap.discount)) || 0;
  let pay = parseFloat(getCol(rec, fieldMap.pay)) || 0;
  const storedDue = parseFloat(getCol(rec, fieldMap.due));
  const normalized = normalizeDualTxnAmountsByCategory(category, bill, discount, pay, fieldMap);
  bill = normalized.bill;
  discount = normalized.discount;
  pay = normalized.pay;
  let txnDue = normalized.txnDue;
  if (Math.abs(txnDue) < 0.009 && !Number.isNaN(storedDue)) txnDue = storedDue;
  return { bill, discount, pay, txnDue, category };
}

export function getSupplierTxnCategory(rec) {
  const cat = String(getCol(rec, ['Category']) || '').trim();
  if (cat) return cat;
  const rem = String(getCol(rec, ['Remarks', 'Remarks / Reference']) || '').toLowerCase();
  if (rem.includes('previous due') || rem.includes('opening balance')) return 'Previous Due';
  const pay = parseFloat(getCol(rec, ['Payment Paid', 'Paid Amount', 'Payment Paid Amt']));
  const bill = parseFloat(getCol(rec, ['Purchase Amount', 'Purchase Amt', 'Purchase', 'Amount']));
  if (!Number.isNaN(pay) && pay > 0 && (Number.isNaN(bill) || bill === 0)) return 'Payment Paid';
  return 'Purchase';
}

export function parseSupplierTxnAmounts(rec) {
  const category = getSupplierTxnCategory(rec);
  const catKey = category.toLowerCase();
  const isPrev = catKey.includes('previous due') || catKey.includes('opening balance');

  const purchaseRaw = getCol(rec, ['Purchase Amount', 'Purchase Amt', 'Purchase']);
  if (purchaseRaw !== undefined && purchaseRaw !== null && purchaseRaw !== '') {
    let bill = parseFloat(purchaseRaw) || 0;
    let discount = parseFloat(getCol(rec, ['Discount', 'Discount Allowed'])) || 0;
    let pay = parseFloat(getCol(rec, ['Payment Paid', 'Paid Amount', 'Payment Paid Amt'])) || 0;
    const storedDue = parseFloat(getCol(rec, ['Transaction Due', 'Txn Due']));
    if (isPrev) {
      bill = bill || pay;
      return { bill, discount: 0, pay: 0, txnDue: bill, category: 'Previous Due' };
    }
    if (catKey.includes('payment paid') || catKey.includes('paid')) {
      pay = pay || bill;
      return { bill: 0, discount: 0, pay, txnDue: -pay, category: 'Payment Paid' };
    }
    const txnDue = !Number.isNaN(storedDue) ? storedDue : bill - discount - pay;
    return { bill, discount, pay, txnDue, category: category || 'Purchase' };
  }
  const amt = parseFloat(getCol(rec, ['Amount'])) || 0;
  if (isPrev) return { bill: amt, discount: 0, pay: 0, txnDue: amt, category: 'Previous Due' };
  if (catKey.includes('paid')) return { bill: 0, discount: 0, pay: amt, txnDue: -amt, category: 'Payment Paid' };
  return { bill: amt, discount: 0, pay: 0, txnDue: amt, category: 'Purchase' };
}

export { getDualTxnCategory as getDualTxnCategoryForExport };
