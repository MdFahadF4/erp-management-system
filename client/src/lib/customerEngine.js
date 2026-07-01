import { getCol, fmtMoney, parseMoneyInput, reconcileBillDiscPaid, roundMoney } from './recordHelpers.js';
import { filterRecordsByDateRange, parseRecordDate } from './hrEngine.js';

export function formatCustomDateString(dateObj) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
}

export function extractUserInitials(fullName) {
  if (!fullName) return 'ST';
  const clean = fullName.replace(/[.]/g, '').trim();
  const segments = clean.split(/\s+/).filter((word) => word.toLowerCase() !== 'md');
  if (segments.length === 0) return 'ST';
  if (segments.length === 1) return segments[0].substring(0, 2).toUpperCase();
  const firstLetter = segments[0].charAt(0).toUpperCase();
  const lastLetter = segments[segments.length - 1].charAt(0).toUpperCase();
  return firstLetter + lastLetter;
}

export function generateCustomerUniqueId(memo, custName, issueDate, username) {
  const formattedDateString = formatCustomDateString(issueDate);
  const initialsToken = extractUserInitials(username);
  return `${memo.trim()}-${custName.trim()}-${formattedDateString}-${initialsToken}`;
}

export function getCustomerUid(rec) {
  return String(getCol(rec, ['System Unique ID', 'Sys UID', 'UNIQUEID']) || '').trim();
}

export function getCustomerName(rec) {
  return String(getCol(rec, ['Customer Name', 'Name']) || '').trim();
}

export function getCustomerDueBalance(rec) {
  if (!rec) return 0;
  const sell = parseFloat(getCol(rec, ['Total Sell', 'Sell Amount', 'Gross Sell'])) || 0;
  const cash = parseFloat(getCol(rec, ['Cash Amt', 'Cash Amount', 'Cash'])) || 0;
  const card = parseFloat(getCol(rec, ['Card Amt', 'Card Amount', 'Card'])) || 0;
  const discount = parseFloat(getCol(rec, ['Discount', 'Discount Allowed'])) || 0;
  let received = cash + card;
  if (received === 0) {
    received = parseFloat(getCol(rec, ['Received Amount', 'Total Received', 'Received'])) || 0;
  }
  let due = roundMoney(sell - received - discount);
  if (due <= 0.009 && sell > 0.009) {
    due = roundMoney(parseFloat(getCol(rec, ['Due Balance', 'Due', 'Outstanding Balance Due'])) || 0);
  }
  return roundMoney(due);
}

export function canViewAllCustomers(user) {
  if (!user) return false;
  const r = String(user.role || '').trim().toLowerCase();
  return r === 'super admin' || r === 'admin';
}

export function filterCustomersForUser(records, user) {
  if (!Array.isArray(records)) return [];
  if (canViewAllCustomers(user)) return records;
  if (!user) return [];
  const cln = (s) => String(s || '').trim().toLowerCase();
  return records.filter(
    (r) => cln(getCol(r, ['Username', 'Logged By', 'Created By'])) === cln(user.username)
  );
}

export function buildCustomerLedgerRow(rec, canEdit) {
  const uid = getCustomerUid(rec);
  const name = getCustomerName(rec);
  const memo = getCol(rec, ['Invoice', 'Memo', 'Invoice / Memo Number']) || '';

  let sell = parseFloat(getCol(rec, ['Total Sell', 'Sell Amount', 'Gross Sell'])) || 0;
  let cash = parseFloat(getCol(rec, ['Cash Amt', 'Cash Amount', 'Cash'])) || 0;
  let card = parseFloat(getCol(rec, ['Card Amt', 'Card Amount', 'Card'])) || 0;
  let discount = parseFloat(getCol(rec, ['Discount', 'Discount Allowed'])) || 0;
  const received = cash + card;
  const due = sell - received - discount;

  return {
    id: rec.ID,
    uid,
    name,
    memo,
    sell,
    cash,
    card,
    received,
    discount,
    due,
    canEdit
  };
}

export function computeCustomerTxnDue(sell, discount, received) {
  return reconcileBillDiscPaid(parseMoneyInput(sell), parseMoneyInput(discount), parseMoneyInput(received)).due;
}

export function computeRemainingCustomerDue(currentDue, sell, discount, received, refundMode) {
  const s = parseMoneyInput(sell);
  const d = parseMoneyInput(discount);
  const r = parseMoneyInput(received);
  const base = parseMoneyInput(currentDue);
  if (refundMode) {
    return roundMoney(Math.max(0, base - s + d + r));
  }
  const delta = reconcileBillDiscPaid(s, d, r).due;
  return roundMoney(base + delta);
}

export function isCustomerTxnRefund(rec) {
  const remarks = String(getCol(rec, ['Remarks', 'Remarks / Reference']) || '');
  const soldAmt = parseFloat(getCol(rec, ['Sold Amount', 'Sold Amt', 'SOLDAMT'])) || 0;
  const recAmt = parseFloat(getCol(rec, ['Received Amount', 'Received Amt', 'RECEIVEDAMT'])) || 0;
  return remarks.toUpperCase().includes('[REFUND/CANCELLATION]') || soldAmt < 0 || recAmt < 0;
}

export function getPaymentMethodColor(method) {
  if (method === 'Cash') return 'text-emerald-600 bg-emerald-50';
  if (method === 'Card') return 'text-blue-600 bg-blue-50';
  return 'text-slate-600 bg-slate-50';
}

export function filterCustomerTxnsByDate(records, fromStr, toStr) {
  return filterRecordsByDateRange(records, fromStr, toStr, ['Date', 'Transaction Date']);
}

export function buildRefundPrefillFromTxn(rec) {
  const uid = getCustomerUid(rec);
  const soldAmt = Math.abs(parseFloat(getCol(rec, ['Sold Amount', 'Sold Amt', 'SOLDAMT'])) || 0);
  const discAmt = Math.abs(parseFloat(getCol(rec, ['Discount', 'Discount Amount', 'Txn Discount'])) || 0);
  const recAmt = Math.abs(parseFloat(getCol(rec, ['Received Amount', 'Received Amt', 'RECEIVEDAMT'])) || 0);
  let method = getCol(rec, ['Payment Method', 'Method', 'METHOD']) || 'Cash';
  if (method === 'Previous Due') method = 'Cash';
  const origDate = rec.Date ? new Date(rec.Date).toLocaleDateString() : '';
  const origRemarks = getCol(rec, ['Remarks', 'Remarks / Reference']) || '';
  const remarks = `Reversal of txn dated ${origDate}${origRemarks && origRemarks !== '-' ? ` — ${origRemarks}` : ''}`;
  return { uid, soldAmt, discAmt, recAmt, method: method === 'Card' ? 'Card' : 'Cash', remarks };
}

export { fmtMoney, getCol, parseRecordDate };
