import { getCol, fmtMoney, addMoney, parseMoneyInput, reconcileBillDiscPaid, roundMoney } from './recordHelpers.js';
import { parseTxnDualAmounts } from './txnParsers.js';
import { filterRecordsByDateRange, parseRecordDate } from './hrEngine.js';

export function buildModuleTxnTrackingId(prefix, main, sub, dateStr) {
  const m = String(main || 'GEN')
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') || 'GEN';
  const s = String(sub || 'SUB')
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') || 'SUB';
  const d = String(dateStr || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${m}-${s}-${d}-${rnd}`;
}

export function isDualTxnPrevDue(rec, fieldMap) {
  const cat = String(getCol(rec, ['Category']) || '')
    .trim()
    .toLowerCase();
  if (cat.includes('previous due') || cat.includes('opening balance')) return true;
  const rem = String(getCol(rec, fieldMap.remarks) || '')
    .trim()
    .toLowerCase();
  return rem.includes('previous due') || rem.includes('opening balance');
}

export function computeHeadPairDueBalance(main, sub, txns, fieldMap) {
  const m = String(main || '')
    .trim()
    .toUpperCase();
  const s = String(sub || '')
    .trim()
    .toUpperCase();
  let bill = 0;
  let discount = 0;
  let pay = 0;
  let prevDue = 0;
  (txns || []).forEach((t) => {
    const tM = String(getCol(t, fieldMap.main) || '')
      .trim()
      .toUpperCase();
    const tS = String(getCol(t, fieldMap.sub) || '')
      .trim()
      .toUpperCase();
    const amounts = parseTxnDualAmounts(t, fieldMap);
    const isPrev = isDualTxnPrevDue(t, fieldMap);
    if (tM !== m) return;
    if (isPrev && tS === s) {
      prevDue = addMoney(prevDue, Math.max(amounts.bill, amounts.pay));
    } else if (!isPrev && tS === s) {
      bill = addMoney(bill, amounts.bill);
      discount = addMoney(discount, amounts.discount);
      pay = addMoney(pay, amounts.pay);
    }
  });
  const reconciled = reconcileBillDiscPaid(addMoney(bill, prevDue), discount, pay);
  return reconciled.due;
}

export function computeDualTxnDue(bill, discount, pay) {
  return reconcileBillDiscPaid(parseMoneyInput(bill), parseMoneyInput(discount), parseMoneyInput(pay)).due;
}

export function computeRemainingHeadDue(currentDue, bill, discount, pay) {
  const delta = reconcileBillDiscPaid(parseMoneyInput(bill), parseMoneyInput(discount), parseMoneyInput(pay)).due;
  return roundMoney(Math.max(0, parseMoneyInput(currentDue) + delta));
}

export function buildHeadLedgerRows(heads, txns, fieldMap, mainCols, subCols) {
  const headTotals = {};
  (txns || []).forEach((t) => {
    const mHead = String(getCol(t, fieldMap.main) || '')
      .trim()
      .toUpperCase();
    const sHead = String(getCol(t, fieldMap.sub) || '')
      .trim()
      .toUpperCase();
    const amounts = parseTxnDualAmounts(t, fieldMap);
    const key = `${mHead}|||${sHead}`;
    if (!headTotals[key]) headTotals[key] = { bill: 0, pay: 0, discount: 0, prevDue: 0 };
    if (isDualTxnPrevDue(t, fieldMap)) {
      headTotals[key].prevDue = addMoney(headTotals[key].prevDue, Math.max(amounts.bill, amounts.pay));
    } else {
      headTotals[key].bill = addMoney(headTotals[key].bill, amounts.bill);
      headTotals[key].pay = addMoney(headTotals[key].pay, amounts.pay);
      headTotals[key].discount = addMoney(headTotals[key].discount, amounts.discount);
    }
  });

  return (heads || []).map((rec) => {
    const trackingId = getCol(rec, ['Tracking ID', 'System Unique ID', 'ID']) || '';
    const mainHead = getCol(rec, mainCols) || '';
    const subHead = getCol(rec, subCols) || '';
    const key = `${String(mainHead).trim().toUpperCase()}|||${String(subHead).trim().toUpperCase()}`;
    const totals = headTotals[key] || { bill: 0, pay: 0, discount: 0, prevDue: 0 };
    const bill = addMoney(totals.bill, totals.prevDue);
    const pay = totals.pay;
    const discount = totals.discount;
    const due = reconcileBillDiscPaid(bill, discount, pay).due;
    return {
      id: rec.ID,
      trackingId,
      mainHead,
      subHead,
      bill,
      pay,
      due,
      user: getCol(rec, ['Authorized By', 'Username', 'Logged By']) || '',
      stamp: getCol(rec, ['Creation Stamp', 'Timestamp']) || ''
    };
  });
}

export function getUniqueMainHeads(heads, mainCols) {
  return [...new Set((heads || []).map((r) => getCol(r, mainCols)).filter(Boolean))];
}

export function getSubHeadsForMain(heads, main, mainCols, subCols) {
  return (heads || []).filter((r) => getCol(r, mainCols) === main).map((r) => getCol(r, subCols)).filter(Boolean);
}

export function prepareDualTxnSubmit(category, bill, discount, pay, remarks) {
  let b = parseMoneyInput(bill);
  let d = parseMoneyInput(discount);
  let p = parseMoneyInput(pay);
  let remarksText = String(remarks || '').trim();
  const cat = String(category || '').trim();
  const catLower = cat.toLowerCase();

  if (catLower.includes('previous due')) {
    d = 0;
    p = 0;
    if (!remarksText.toLowerCase().includes('previous due')) {
      remarksText = remarksText ? `Previous Due - ${remarksText}` : 'Previous Due';
    }
    return { bill: b, discount: 0, pay: 0, txnDue: b, category: cat, remarksText };
  }
  if (catLower.includes('paid') || catLower.includes('payment') || catLower.includes('return') || catLower.includes('out')) {
    b = 0;
    d = 0;
    p = p || b;
    return { bill: 0, discount: 0, pay: p, txnDue: roundMoney(-p), category: cat, remarksText };
  }

  const reconciled = reconcileBillDiscPaid(b, d, p);
  return {
    bill: reconciled.billed,
    discount: reconciled.discount,
    pay: reconciled.paid,
    txnDue: reconciled.due,
    category: cat,
    remarksText
  };
}

export function filterDualTxnsByDate(records, fromStr, toStr) {
  return filterRecordsByDateRange(records, fromStr, toStr, ['Date', 'Transaction Date']);
}

export { fmtMoney, getCol, parseRecordDate, parseTxnDualAmounts };
