import { addMoney, cln, gF, gV, reconcileDrawerBalance, roundMoney } from './recordHelpers.js';
import { parseHrTxnAmounts } from './hrEngine.js';
import { parseSupplierTxnAmounts, parseTxnDualAmounts } from './txnParsers.js';
import { EXPENSE_TXN_FIELDS } from './txnFields.js';
import {
  buildCustomerTxnCashByUid,
  CUSTOMER_METH_COLS,
  CUSTOMER_RECV_COLS,
  isCustomerPreviousDueTxn,
  masterInitialCustomerCash,
  readCustomerMasterAmounts
} from './customerFinancials.js';

function isInternalTransferApproved(rec) {
  const status = String(gV(rec, ['status']) || '').trim().toLowerCase();
  return !status || status === 'approved';
}

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

  const txnTotals = resCustTxn.success ? buildCustomerTxnCashByUid(resCustTxn.records) : {};

  if (resCust.success) {
    resCust.records.forEach((r) => {
      if (!isU(r)) return;
      const uid = cln(gV(r, ['systemuniqueid', 'sysuid', 'uniqueid']));
      const amounts = readCustomerMasterAmounts(r);
      uCashIn = addMoney(
        uCashIn,
        masterInitialCustomerCash(amounts.cash, txnTotals[uid]?.cash, amounts.sell)
      );
    });
  }

  if (resCustTxn.success) {
    resCustTxn.records.forEach((r) => {
      if (isCustomerPreviousDueTxn(r)) return;
      if (!isU(r)) return;
      let method = cln(gV(r, CUSTOMER_METH_COLS));
      if (method === '') method = 'cash';
      if (method.includes('cash')) {
        uCashIn = addMoney(uCashIn, gF(r, CUSTOMER_RECV_COLS));
      }
    });
  }

  const applyInternalTransferDrawer = (r) => {
    if (!isInternalTransferApproved(r)) return;
    const amt = Math.abs(gF(r, ['transferamount', 'amount']));
    const sender = String(gV(r, ['transferredby', 'username', 'loggedby']) || '').trim();
    const recipient = String(gV(r, ['transfertouser', 'transferto', 'receivedby', 'handoverto']) || '').trim();
    const me = cln(user.username);
    if (sender && cln(sender) === me) uCashOut = addMoney(uCashOut, amt);
    if (recipient && cln(recipient) === me && cln(recipient) !== cln(sender)) {
      uCashIn = addMoney(uCashIn, amt);
    }
  };
  if (resInt.success) resInt.records.forEach(applyInternalTransferDrawer);

  if (!isAdmin) {
    if (resCred.success) {
      resCred.records.forEach((r) => {
        if (isU(r)) uCashOut = addMoney(uCashOut, Math.abs(gF(r, ['returnamount', 'returnamt', 'amount'])));
      });
    }
    if (resHr.success) {
      resHr.records.forEach((r) => {
        if (!isU(r)) return;
        const parsed = parseHrTxnAmounts(r);
        if (parsed.paid > 0) uCashOut = addMoney(uCashOut, parsed.paid);
      });
    }
    if (resSup.success) {
      resSup.records.forEach((r) => {
        if (isU(r)) {
          const p = parseSupplierTxnAmounts(r);
          if (p.pay > 0) uCashOut = addMoney(uCashOut, p.pay);
        }
      });
    }
    if (resExp.success) {
      resExp.records.forEach((r) => {
        if (isU(r)) {
          const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
          if (amounts.pay > 0) uCashOut = addMoney(uCashOut, amounts.pay);
        }
      });
    }
  }

  return reconcileDrawerBalance(roundMoney(uCashIn - uCashOut));
}
