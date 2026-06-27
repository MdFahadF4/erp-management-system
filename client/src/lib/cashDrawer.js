import { cln, gV, gF } from './recordHelpers.js';
import { parseSupplierTxnAmounts } from './txnParsers.js';
import { parseTxnDualAmounts } from './txnParsers.js';
import { EXPENSE_TXN_FIELDS } from './txnFields.js';

const recvCols = [
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
const methCols = ['paymentmethod', 'method', 'paymenttype', 'type'];

export function computeLiveCashDrawer(user, data) {
  if (!user?.username) return 0;

  const resCust = data.customers || { success: false, records: [] };
  const resCustTxn = data.customerTxns || { success: false, records: [] };
  const resExp = data.expenseTxns || { success: false, records: [] };
  const resHr = data.hrTxns || { success: false, records: [] };
  const resSup = data.supplierTxns || { success: false, records: [] };
  const resInt = data.internalTransfers || { success: false, records: [] };
  const resCred = data.creditorTxns || { success: false, records: [] };

  const isU = (obj) =>
    cln(gV(obj, ['username', 'loggedby', 'createdby', 'user', 'transferredby'])) === cln(user.username);
  const isAdmin = user.role === 'Super Admin' || user.role === 'Admin';

  let uCashIn = 0;
  let uCashOut = 0;

  const txnTotals = {};
  if (resCustTxn.success) {
    resCustTxn.records.forEach((t) => {
      const uid = cln(gV(t, ['systemuniqueid', 'sysuid', 'uniqueid']));
      if (!uid) return;
      const check = cln(gV(t, ['remarks', 'category', 'method', 'type', 'paymentmethod']));
      if (check.includes('previousdue') || check.includes('openingbalance')) return;
      if (!txnTotals[uid]) txnTotals[uid] = { cash: 0 };
      let method = cln(gV(t, methCols));
      if (method === '') method = 'cash';
      if (method.includes('cash')) txnTotals[uid].cash += gF(t, recvCols);
    });
  }

  if (resCust.success) {
    resCust.records.forEach((r) => {
      if (isU(r)) {
        uCashIn +=
          gF(r, ['cashamt', 'cashamount', 'cash']) -
          (txnTotals[cln(gV(r, ['systemuniqueid', 'sysuid']))]?.cash || 0);
      }
    });
  }

  if (resCustTxn.success) {
    resCustTxn.records.forEach((r) => {
      const check = cln(gV(r, ['remarks', 'category', 'method', 'type', 'paymentmethod']));
      if (check.includes('previousdue') || check.includes('openingbalance')) return;
      if (isU(r) && cln(gV(r, methCols) || 'cash').includes('cash')) {
        uCashIn += gF(r, recvCols);
      }
    });
  }

  const applyInternalTransferDrawer = (r) => {
    const status = String(gV(r, ['status']) || '').trim();
    if (status && status.toLowerCase() !== 'approved') return;
    const amt = Math.abs(gF(r, ['transferamount', 'amount']));
    const sender = String(gV(r, ['transferredby', 'username', 'loggedby']) || '').trim();
    const recipient = String(gV(r, ['transfertouser', 'transferto', 'receivedby', 'handoverto']) || '').trim();
    const me = cln(user.username);
    if (sender && cln(sender) === me) uCashOut += amt;
    if (recipient && cln(recipient) === me && cln(recipient) !== cln(sender)) uCashIn += amt;
  };
  if (resInt.success) resInt.records.forEach(applyInternalTransferDrawer);

  if (!isAdmin) {
    if (resCred.success) {
      resCred.records.forEach((r) => {
        if (isU(r)) uCashOut += Math.abs(gF(r, ['returnamount', 'returnamt', 'amount']));
      });
    }
    if (resHr.success) {
      resHr.records.forEach((r) => {
        if (isU(r) && cln(gV(r, ['category'])).includes('paid')) {
          uCashOut += Math.abs(gF(r, ['amount']));
        }
      });
    }
    if (resSup.success) {
      resSup.records.forEach((r) => {
        if (isU(r)) {
          const p = parseSupplierTxnAmounts(r);
          if (p.pay > 0) uCashOut += p.pay;
        }
      });
    }
    if (resExp.success) {
      resExp.records.forEach((r) => {
        if (isU(r)) {
          const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
          if (amounts.pay > 0) uCashOut += amounts.pay;
        }
      });
    }
  }

  return uCashIn - uCashOut;
}
