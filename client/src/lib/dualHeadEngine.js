import { getCol, fmtMoney, roundMoney } from './recordHelpers.js';
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
      prevDue += Math.max(amounts.bill, amounts.pay);
    } else if (!isPrev && tS === s) {
      bill += amounts.bill;
      discount += amounts.discount;
      pay += amounts.pay;
    }
  });
  return roundMoney(Math.max(0, bill + prevDue - discount - pay));
}

export function computeDualTxnDue(bill, discount, pay) {
  return roundMoney((parseFloat(bill) || 0) - (parseFloat(discount) || 0) - (parseFloat(pay) || 0));
}

export function computeRemainingHeadDue(currentDue, bill, discount, pay) {
  return roundMoney(Math.max(0, currentDue + (parseFloat(bill) || 0) - (parseFloat(discount) || 0) - (parseFloat(pay) || 0)));
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
      headTotals[key].prevDue += Math.max(amounts.bill, amounts.pay);
    } else {
      headTotals[key].bill += amounts.bill;
      headTotals[key].pay += amounts.pay;
      headTotals[key].discount += amounts.discount;
    }
  });

  return (heads || []).map((rec) => {
    const trackingId = getCol(rec, ['Tracking ID', 'System Unique ID', 'ID']) || '';
    const mainHead = getCol(rec, mainCols) || '';
    const subHead = getCol(rec, subCols) || '';
    const key = `${String(mainHead).trim().toUpperCase()}|||${String(subHead).trim().toUpperCase()}`;
    const totals = headTotals[key] || { bill: 0, pay: 0, discount: 0, prevDue: 0 };
    let bill = totals.bill + totals.prevDue;
    const pay = totals.pay;
    const discount = totals.discount;
    const due = Math.max(0, bill - discount - pay);
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
  let b = roundMoney(parseFloat(bill) || 0);
  let d = roundMoney(parseFloat(discount) || 0);
  let p = roundMoney(parseFloat(pay) || 0);
  let remarksText = String(remarks || '').trim();
  const cat = String(category || '').trim();
  const catLower = cat.toLowerCase();

  if (catLower.includes('previous due')) {
    d = 0;
    p = 0;
    if (!remarksText.toLowerCase().includes('previous due')) {
      remarksText = remarksText ? `Previous Due - ${remarksText}` : 'Previous Due';
    }
  } else if (catLower.includes('paid') || catLower.includes('payment') || catLower.includes('return') || catLower.includes('out')) {
    b = 0;
    d = 0;
  }

  const txnDue = roundMoney(b - d - p);
  return { bill: b, discount: d, pay: p, txnDue, category: cat, remarksText };
}

export function filterDualTxnsByDate(records, fromStr, toStr) {
  return filterRecordsByDateRange(records, fromStr, toStr, ['Date', 'Transaction Date']);
}

export { fmtMoney, getCol, parseRecordDate, parseTxnDualAmounts };
