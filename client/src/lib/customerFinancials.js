import { cln, gF, gV } from './recordHelpers.js';

export const CUSTOMER_SELL_COLS = ['soldamount', 'soldamt', 'totalsell', 'sellamount', 'grosssell', 'sell'];
export const CUSTOMER_RECV_COLS = [
  'receivedamount',
  'receivedamt',
  'received',
  'cashreceived',
  'cashamt',
  'cashamount',
  'paidamount',
  'paidamt',
  'amountpaid'
];
export const CUSTOMER_METH_COLS = ['paymentmethod', 'method', 'paymenttype', 'type'];

export function isCustomerPreviousDueTxn(rec) {
  const remarks = cln(
    gV(rec, ['remarks / reference', 'remarksreference', 'remarks / reference info', 'remarks'])
  );
  const category = cln(gV(rec, ['category', 'method', 'type', 'paymentmethod']));
  const check = remarks || category;
  return check.includes('previousdue') || check.includes('openingbalance');
}

export function readCustomerMasterAmounts(rec) {
  let cash = gF(rec, ['cashamt', 'cashamount', 'cash', 'totalcash']);
  let card = gF(rec, ['cardamt', 'cardamount', 'card', 'totalcard']);
  const sell = gF(rec, CUSTOMER_SELL_COLS);
  const discount = gF(rec, ['discount', 'discountallowed', 'totaldiscount']);
  let recv = cash + card;
  if (recv <= 0) {
    recv = gF(rec, ['totalreceived', 'receivedamount', 'received']);
  }
  if (cash <= 0 && card <= 0 && recv > 0) {
    cash = recv;
  }
  return { sell, cash, card, recv, discount, due: Math.max(0, sell - recv - discount) };
}

export function buildCustomerTxnCashByUid(records) {
  const txnTotals = {};
  (records || []).forEach((t) => {
    const uid = cln(gV(t, ['systemuniqueid', 'sysuid', 'uniqueid']));
    if (!uid || isCustomerPreviousDueTxn(t)) return;
    if (!txnTotals[uid]) txnTotals[uid] = { cash: 0, card: 0, sold: 0, recv: 0, discount: 0 };
    txnTotals[uid].sold += gF(t, CUSTOMER_SELL_COLS);
    txnTotals[uid].discount += gF(t, ['discount', 'discountallowed']);
    const received = gF(t, CUSTOMER_RECV_COLS);
    txnTotals[uid].recv += received;
    let method = cln(gV(t, CUSTOMER_METH_COLS));
    if (method === '') method = 'cash';
    if (method.includes('cash')) txnTotals[uid].cash += received;
    else if (method.includes('card')) txnTotals[uid].card += received;
  });
  return txnTotals;
}

export function masterInitialCustomerCash(masterCash, txnCashTotal) {
  if (masterCash <= 0) return 0;
  return Math.max(0, masterCash - (txnCashTotal || 0));
}

export function aggregateCustomerTotalsFromTxns(records) {
  let sold = 0;
  let cash = 0;
  let card = 0;
  let recv = 0;
  let discount = 0;
  let due = 0;

  (records || []).forEach((t) => {
    const amount = gF(t, CUSTOMER_RECV_COLS);
    const disc = gF(t, ['discount', 'discountallowed']);
    if (isCustomerPreviousDueTxn(t)) {
      sold += amount;
      due += amount;
      recv += amount;
      return;
    }
    const sellAmt = gF(t, CUSTOMER_SELL_COLS);
    let method = cln(gV(t, CUSTOMER_METH_COLS));
    if (method === '') method = 'cash';
    sold += sellAmt;
    discount += disc;
    recv += amount;
    if (method.includes('cash')) cash += amount;
    else if (method.includes('card')) card += amount;
    due += Math.max(0, sellAmt - amount - disc);
  });

  return { sold, cash, card, recv, discount, due };
}
