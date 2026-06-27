import { cln, gF, gV } from './recordHelpers.js';
import { parseTxnDualAmounts, parseSupplierTxnAmounts, getDualTxnCategoryForExport as getDualTxnCategory } from './txnParsers.js';
import {
  EXPENSE_TXN_FIELDS,
  CREDITOR_TXN_FIELDS,
  INCOME_TXN_FIELDS,
  CAPITAL_TXN_FIELDS
} from './txnFields.js';
import {
  aggregateCustomerTotalsFromTxns,
  buildCustomerTxnCashByUid,
  CUSTOMER_METH_COLS,
  CUSTOMER_RECV_COLS,
  CUSTOMER_SELL_COLS,
  isCustomerPreviousDueTxn,
  masterInitialCustomerCash,
  readCustomerMasterAmounts
} from './customerFinancials.js';

function emptyFetchResult() {
  return { success: false, records: [] };
}

function isInternalTransferApproved(rec) {
  const status = String(gV(rec, ['status']) || '').trim().toLowerCase();
  return !status || status === 'approved';
}

export function computeDashboardMetrics(data, sessionUser) {
  const rCust = data.customers || emptyFetchResult();
  const rCustT = data.customerTxns || emptyFetchResult();
  const rSupT = data.supplierTxns || emptyFetchResult();
  const rExp = data.expenseTxns || emptyFetchResult();
  const rHrT = data.hrTxns || emptyFetchResult();
  const rIncT = data.incomeTxns || emptyFetchResult();
  const rCrdT = data.creditorTxns || emptyFetchResult();
  const rCapT = data.capitalTxns || emptyFetchResult();
  const rInt = data.internalTransfers || emptyFetchResult();
  const rUsers = data.users || emptyFetchResult();

  let adminUsers = [];
  if (rUsers.success) {
    rUsers.records.forEach((u) => {
      if (cln(gV(u, ['role'])).includes('admin')) {
        adminUsers.push(cln(gV(u, ['username'])));
      }
    });
  }
  const isAdm = (usr) => adminUsers.includes(cln(usr));

  let saleSold = 0,
    saleRecv = 0,
    saleCash = 0,
    saleCard = 0,
    saleDue = 0,
    saleDiscount = 0;
  let incBilled = 0,
    incRecv = 0,
    incDue = 0,
    incDiscount = 0;
  let purPur = 0,
    purPaid = 0,
    purDue = 0,
    purDiscount = 0;
  let expInc = 0,
    expPaid = 0,
    expDue = 0,
    expDiscount = 0;
  let crdRecv = 0,
    crdRet = 0,
    crdDue = 0;
  let capIn = 0,
    capOut = 0,
    capNet = 0;
  let hrEarned = 0,
    hrPaid = 0,
    hrDue = 0;
  let tRecv = 0,
    tPay = 0;

  const userCash = {};
  const addCash = (usr, amt) => {
    if (!usr) return;
    const u = String(usr).trim();
    if (!userCash[u]) userCash[u] = 0;
    userCash[u] += amt;
  };

  const txnTotals = rCustT.success ? buildCustomerTxnCashByUid(rCustT.records) : {};

  if (rCustT.success && rCustT.records.length) {
    const txnAgg = aggregateCustomerTotalsFromTxns(rCustT.records);
    saleSold = txnAgg.sold;
    saleCash = txnAgg.cash;
    saleCard = txnAgg.card;
    saleRecv = txnAgg.recv;
    saleDue = txnAgg.due;
    saleDiscount = txnAgg.discount;
  } else if (rCust.success) {
    rCust.records.forEach((r) => {
      const amounts = readCustomerMasterAmounts(r);
      saleSold += amounts.sell;
      saleCash += amounts.cash;
      saleCard += amounts.card;
      saleRecv += amounts.recv;
      saleDue += amounts.due;
      saleDiscount += amounts.discount;
    });
  }

  if (rCust.success) {
    rCust.records.forEach((r) => {
      const uid = cln(gV(r, ['systemuniqueid', 'sysuid', 'uniqueid']));
      const amounts = readCustomerMasterAmounts(r);
      const initCash = masterInitialCustomerCash(amounts.cash, txnTotals[uid]?.cash);
      const creator = gV(r, ['username', 'loggedby', 'createdby']);
      if (creator) addCash(creator, initCash);
    });
  }

  if (rCustT.success) {
    rCustT.records.forEach((t) => {
      if (isCustomerPreviousDueTxn(t)) return;
      const amt = gF(t, CUSTOMER_RECV_COLS);
      let method = cln(gV(t, CUSTOMER_METH_COLS));
      if (method === '') method = 'cash';
      const logger = gV(t, ['username', 'loggedby']);
      if (method.includes('cash') && logger) addCash(logger, amt);
    });
  }

  if (rIncT.success) {
    rIncT.records.forEach((r) => {
      const amounts = parseTxnDualAmounts(r, INCOME_TXN_FIELDS);
      const check = cln(getDualTxnCategory(r, INCOME_TXN_FIELDS) + ' ' + gV(r, ['remarks', 'parenthead', 'subhead']));
      if (check.includes('previousdue') || check.includes('openingbalance')) {
        const prevAmt = Math.max(amounts.bill, amounts.pay);
        incBilled += prevAmt;
        incDue += prevAmt;
      } else {
        incBilled += amounts.bill;
        incRecv += amounts.pay;
        incDue += amounts.txnDue;
        incDiscount += amounts.discount;
      }
    });
  }

  const supTotals = {};
  if (rSupT.success) {
    rSupT.records.forEach((r) => {
      const name = String(gV(r, ['suppliername']) || '').trim();
      if (!name) return;
      if (!supTotals[name]) supTotals[name] = { bill: 0, discount: 0, pay: 0 };
      const p = parseSupplierTxnAmounts(r);
      supTotals[name].bill += p.bill;
      supTotals[name].discount += p.discount;
      supTotals[name].pay += p.pay;
      const logger = gV(r, ['username', 'loggedby']);
      if (logger && !isAdm(logger) && p.pay > 0) addCash(logger, -p.pay);
    });
  }
  Object.values(supTotals).forEach((s) => {
    purPur += s.bill;
    purPaid += s.pay;
    purDiscount += s.discount;
    purDue += Math.max(0, s.bill - s.discount - s.pay);
  });

  if (rExp.success) {
    rExp.records.forEach((r) => {
      const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
      const check = cln(getDualTxnCategory(r, EXPENSE_TXN_FIELDS) + ' ' + gV(r, ['remarks', 'parenthead', 'subhead']));
      if (check.includes('previousdue') || check.includes('openingbalance')) {
        const prevAmt = Math.max(amounts.bill, amounts.pay);
        expInc += prevAmt;
        expDue += prevAmt;
      } else {
        expInc += amounts.bill;
        expPaid += amounts.pay;
        expDue += amounts.txnDue;
        expDiscount += amounts.discount;
        const logger = gV(r, ['username', 'loggedby']);
        if (logger && !isAdm(logger) && amounts.pay > 0) addCash(logger, -amounts.pay);
      }
    });
  }

  if (rCrdT.success) {
    rCrdT.records.forEach((r) => {
      const amounts = parseTxnDualAmounts(r, CREDITOR_TXN_FIELDS);
      const check = cln(getDualTxnCategory(r, CREDITOR_TXN_FIELDS) + ' ' + gV(r, ['remarks', 'method', 'type']));
      if (check.includes('previousdue') || check.includes('openingbalance')) {
        const prevAmt = Math.max(amounts.bill, amounts.pay);
        crdRecv += prevAmt;
        crdDue += prevAmt;
      } else {
        crdRecv += amounts.bill;
        crdRet += amounts.pay;
        crdDue += amounts.txnDue;
        const logger = gV(r, ['username', 'loggedby']);
        if (logger && !isAdm(logger) && amounts.pay > 0) addCash(logger, -amounts.pay);
      }
    });
  }

  if (rCapT.success) {
    rCapT.records.forEach((r) => {
      const amounts = parseTxnDualAmounts(r, CAPITAL_TXN_FIELDS);
      const check = cln(getDualTxnCategory(r, CAPITAL_TXN_FIELDS) + ' ' + gV(r, ['remarks', 'subhead']));
      if (check.includes('previousdue') || check.includes('openingbalance')) {
        const prevAmt = Math.max(amounts.bill, amounts.pay);
        capIn += prevAmt;
        capNet += prevAmt;
      } else {
        capIn += amounts.bill;
        capOut += amounts.pay;
        capNet += amounts.txnDue;
      }
    });
  }

  if (rHrT.success) {
    rHrT.records.forEach((r) => {
      const amt = Math.abs(gF(r, ['amount']));
      const check = cln(gV(r, ['category', 'remarks']));
      const logger = gV(r, ['username', 'loggedby']);
      if (check.includes('previousdue') || check.includes('openingbalance') || check.includes('earn') || check.includes('bill')) {
        hrEarned += amt;
      } else if (check.includes('paid')) {
        hrPaid += amt;
        if (logger && !isAdm(logger)) addCash(logger, -amt);
      }
    });
  }
  hrDue = hrEarned - hrPaid;

  if (rInt.success) {
    rInt.records.forEach((r) => {
      if (!isInternalTransferApproved(r)) return;
      const amt = Math.abs(gF(r, ['transferamount', 'amount']));
      const sender = gV(r, ['transferredby', 'username', 'loggedby']);
      const recipient = String(gV(r, ['transfertouser', 'transferto', 'receivedby', 'handoverto']) || '').trim();
      if (sender) addCash(sender, -amt);
      if (recipient && cln(recipient) !== cln(sender)) addCash(recipient, amt);
    });
  }

  tRecv = saleDue + incDue;
  tPay = purDue + expDue + crdDue + hrDue;

  let globalBalance = null;
  let globalInflows = 0;
  let globalOutflows = 0;
  if (sessionUser && (sessionUser.role === 'Super Admin' || sessionUser.role === 'Admin')) {
    globalInflows = saleRecv + incRecv + crdRecv + capIn;
    globalOutflows = purPaid + expPaid + crdRet + hrPaid + capOut;
    globalBalance = globalInflows - globalOutflows;
  }

  const drawers = Object.entries(userCash)
    .filter(([, bal]) => Math.abs(bal) > 0.01)
    .map(([username, balance]) => ({ username, balance }));

  const salesLeaderboard = computeMonthlyUserSalesLeaderboard(rCust, rCustT, rUsers);

  return {
    totals: {
      tRecv,
      tPay,
      saleSold,
      saleRecv,
      saleDue,
      saleDiscount,
      saleCash,
      saleCard,
      incBilled,
      incRecv,
      incDue,
      incDiscount,
      purPur,
      purPaid,
      purDue,
      purDiscount,
      expInc,
      expPaid,
      expDue,
      expDiscount,
      hrEarned,
      hrPaid,
      hrDue,
      crdRecv,
      crdRet,
      crdDue,
      capIn,
      capOut,
      capNet
    },
    globalBalance,
    globalInflows,
    globalOutflows,
    drawers,
    salesLeaderboard
  };
}

function getCurrentMonthWindow() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n) => String(n).padStart(2, '0');
  const label = `${months[now.getMonth()]} ${now.getFullYear()} (${pad(start.getDate())} – ${pad(end.getDate())})`;
  return { start, end, label };
}

function parseDashboardRowDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isDateInDashboardRange(d, start, end) {
  return d && d >= start && d <= end;
}

function computeMonthlyUserSalesLeaderboard(rCust, rCustT, rUsers) {
  const { start, end, label } = getCurrentMonthWindow();
  const userStats = {};
  const roleByUser = {};

  if (rUsers?.success) {
    rUsers.records.forEach((u) => {
      const name = String(gV(u, ['username']) || '').trim();
      if (!name) return;
      roleByUser[cln(name)] = String(gV(u, ['role']) || '');
    });
  }
  const isSuperAdminUser = (name) => cln(roleByUser[cln(name)] || '').includes('superadmin');

  const ensureUser = (name) => {
    const u = String(name || '').trim();
    if (!u || isSuperAdminUser(u)) return null;
    if (!userStats[u]) userStats[u] = { sold: 0, recv: 0 };
    return u;
  };

  if (rUsers?.success) {
    rUsers.records.forEach((u) => ensureUser(gV(u, ['username'])));
  }

  const txnTotals = {};
  if (rCustT?.success) {
    rCustT.records.forEach((row) => {
      const uid = cln(gV(row, ['systemuniqueid', 'sysuid', 'uniqueid']));
      if (!uid) return;
      if (!txnTotals[uid]) txnTotals[uid] = { sold: 0, cash: 0, card: 0 };
      txnTotals[uid].sold += gF(row, CUSTOMER_SELL_COLS);
      const recv = gF(row, CUSTOMER_RECV_COLS);
      let method = cln(gV(row, CUSTOMER_METH_COLS));
      if (method === '') method = 'cash';
      if (method.includes('cash')) txnTotals[uid].cash += recv;
      else txnTotals[uid].card += recv;
    });
  }

  if (rCust?.success) {
    rCust.records.forEach((r) => {
      const d = parseDashboardRowDate(gV(r, ['date', 'creationstamp', 'timestamp']));
      if (!isDateInDashboardRange(d, start, end)) return;
      const creator = ensureUser(gV(r, ['username', 'loggedby', 'createdby']));
      if (!creator) return;
      const uid = cln(gV(r, ['systemuniqueid', 'sysuid', 'uniqueid']));
      const tt = txnTotals[uid] || { sold: 0, cash: 0, card: 0 };
      const amounts = readCustomerMasterAmounts(r);
      userStats[creator].sold += amounts.sell - tt.sold;
      userStats[creator].recv += amounts.recv - tt.cash - tt.card;
    });
  }

  if (rCustT?.success) {
    rCustT.records.forEach((row) => {
      const d = parseDashboardRowDate(gV(row, ['date', 'timestamp']));
      if (!isDateInDashboardRange(d, start, end)) return;
      const usr = ensureUser(gV(row, ['username', 'loggedby']));
      if (!usr) return;
      if (isCustomerPreviousDueTxn(row)) {
        userStats[usr].sold += gF(row, CUSTOMER_RECV_COLS);
        userStats[usr].recv += gF(row, CUSTOMER_RECV_COLS);
        return;
      }
      userStats[usr].sold += gF(row, CUSTOMER_SELL_COLS);
      userStats[usr].recv += gF(row, CUSTOMER_RECV_COLS);
    });
  }

  const ranked = Object.entries(userStats)
    .filter(([name, stats]) => !isSuperAdminUser(name) && Math.abs(stats.sold) > 0.001)
    .map(([name, stats]) => ({ name, sold: stats.sold, recv: stats.recv }))
    .sort((a, b) => b.sold - a.sold || b.recv - a.recv || a.name.localeCompare(b.name));

  return { label, ranked };
}
