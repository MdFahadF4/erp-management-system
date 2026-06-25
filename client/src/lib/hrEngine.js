import { getCol, fmtMoney } from './recordHelpers.js';

export function normalizeHrEmployeeName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function isHrFactoryDesignation(designation) {
  return String(designation || '')
    .trim()
    .toLowerCase()
    .includes('factory');
}

export function buildHrDetailsDateRange(fromStr, toStr) {
  const fDate = fromStr ? new Date(fromStr) : new Date(0);
  if (fromStr) fDate.setHours(0, 0, 0, 0);
  const tDate = toStr ? new Date(toStr) : new Date();
  if (toStr) tDate.setHours(23, 59, 59, 999);
  return { fDate, tDate };
}

export function computeHrDetailsReport(employeeName, fromStr, toStr, hrTxns) {
  const { fDate, tDate } = buildHrDetailsDateRange(fromStr, toStr);
  const allHrTxns = (hrTxns || []).filter(
    (r) => getCol(r, ['Employee Name', 'Employee', 'Name']) === employeeName
  );

  let globalEarn = 0;
  let globalPaid = 0;
  allHrTxns.forEach((r) => {
    const cat = String(getCol(r, ['Category']) || '')
      .trim()
      .toUpperCase();
    const amt = parseFloat(getCol(r, ['Amount', 'Amt'])) || 0;
    if (cat.includes('EARN') || cat.includes('PREVIOUS DUE') || cat.includes('OPENING BALANCE')) {
      globalEarn += amt;
    } else if (cat.includes('PAID')) {
      globalPaid += amt;
    }
  });
  const globalDue = globalEarn - globalPaid;

  const hrEarns = [];
  const hrPayments = [];
  let hrRangeEarn = 0;
  let hrRangePaid = 0;

  const hrFilteredTxns = allHrTxns.filter((r) => {
    const dStr = getCol(r, ['Date', 'Transaction Date']);
    if (!dStr) return false;
    const d = new Date(dStr);
    return d >= fDate && d <= tDate;
  });

  hrFilteredTxns.forEach((r) => {
    const cat = String(getCol(r, ['Category']) || '')
      .trim()
      .toUpperCase();
    const amt = parseFloat(getCol(r, ['Amount', 'Amt'])) || 0;
    const d = getCol(r, ['Date', 'Transaction Date']);
    const rem = getCol(r, ['Remarks', 'Remarks / Reference']) || '-';
    const usr = getCol(r, ['Username', 'Logged By']) || '';

    if (cat.includes('EARN') || cat.includes('PREVIOUS DUE') || cat.includes('OPENING BALANCE')) {
      hrRangeEarn += amt;
      hrEarns.push({ d, amt, rem, usr, type: getCol(r, ['Category']) || 'Salary Earn' });
    } else if (cat.includes('PAID')) {
      hrRangePaid += amt;
      hrPayments.push({ d, amt, rem, usr });
    }
  });

  hrEarns.sort((a, b) => new Date(b.d) - new Date(a.d));
  hrPayments.sort((a, b) => new Date(b.d) - new Date(a.d));

  return {
    fDate,
    tDate,
    globalEarn,
    globalPaid,
    globalDue,
    hrRangeEarn,
    hrRangePaid,
    hrEarns,
    hrPayments
  };
}

export function getHrStatusBadgeClass(status) {
  const value = String(status || 'Active');
  if (value === 'Inactive') return 'bg-amber-100 text-amber-800';
  if (value === 'Released') return 'bg-red-100 text-red-800';
  if (value === 'Vacation') return 'bg-sky-100 text-sky-800';
  return 'bg-green-100 text-green-800';
}

export function getHrTxnCategory(rec) {
  const cat = String(getCol(rec, ['Category', 'Category Classification', 'Type']) || '').trim();
  if (cat) return cat;
  const rem = String(getCol(rec, ['Remarks', 'Remarks / Reference']) || '').toLowerCase();
  if (rem.includes('previous due') || rem.includes('opening balance')) return 'Previous Due';
  if (rem.includes('increment')) return 'Salary Increment';
  if (rem.includes('paid')) return 'Salary Paid';
  return 'Salary Earn';
}

export function parseHrTxnAmounts(rec) {
  const category = getHrTxnCategory(rec);
  const catKey = category.toLowerCase();
  const amt = parseFloat(getCol(rec, ['Amount', 'Amt', 'Transaction Amount'])) || 0;
  const isIncrement = catKey.includes('increment');
  const isPrev = catKey.includes('previous due') || catKey.includes('opening balance');
  const isPaid = catKey.includes('paid') && !isIncrement;

  if (isIncrement) {
    return { earned: 0, paid: 0, txnDelta: 0, category: 'Salary Increment', isIncrement: true };
  }
  if (isPrev) {
    return { earned: amt, paid: 0, txnDelta: amt, category: 'Previous Due', isIncrement: false };
  }
  if (isPaid) {
    return { earned: 0, paid: amt, txnDelta: -amt, category: 'Salary Paid', isIncrement: false };
  }
  return { earned: amt, paid: 0, txnDelta: amt, category: category || 'Salary Earn', isIncrement: false };
}

export function rollupHrTxnTotals(txns, employeeName) {
  const nameKey = employeeName ? normalizeHrEmployeeName(employeeName) : '';
  let earned = 0;
  let paid = 0;
  let increment = 0;
  (txns || []).forEach((t) => {
    if (nameKey && normalizeHrEmployeeName(getCol(t, ['Employee Name', 'Employee', 'Name'])) !== nameKey) {
      return;
    }
    const p = parseHrTxnAmounts(t);
    if (p.isIncrement) {
      increment += parseFloat(getCol(t, ['Amount', 'Amt', 'Transaction Amount'])) || 0;
    } else {
      earned += p.earned;
      paid += p.paid;
    }
  });
  return { earned, paid, increment, due: Math.max(0, earned - paid) };
}

export function getHrDueBalance(hrRec, txns) {
  if (!hrRec) return 0;
  const name = getCol(hrRec, ['Employee Name', 'Employee', 'Name']);
  return rollupHrTxnTotals(txns, name).due;
}

export function getHrEmployeeName(rec) {
  return String(getCol(rec, ['Employee Name', 'Employee', 'Name']) || '').trim();
}

export function buildHrLedgerRow(rec, txns, canEdit) {
  const empName = getHrEmployeeName(rec);
  const baseSalary = parseFloat(getCol(rec, ['Salary Start']) ?? rec['Salary Start']) || 0;
  const totals = rollupHrTxnTotals(txns, empName);
  const totalInc = totals.increment;
  const currentSalary = baseSalary + totalInc;
  const joinRaw = getCol(rec, ['Date of Joining', 'Join Date']);
  const joinDate = joinRaw ? new Date(joinRaw).toLocaleDateString() : '';
  const status = getCol(rec, ['Status', 'Employment Status']) || rec['Status'] || 'Active';

  return {
    id: rec.ID,
    empName,
    designation: getCol(rec, ['Designation']) || rec['Designation'] || '',
    joinDate,
    baseSalary,
    totalInc,
    currentSalary,
    dbEarned: totals.earned,
    dbPaid: totals.paid,
    dbDue: totals.due,
    status,
    badgeClass: getHrStatusBadgeClass(status),
    canEdit
  };
}

export function getHrTxnDelta(amount, category) {
  const amt = parseFloat(amount) || 0;
  const cat = String(category || '').toLowerCase();
  if (cat.includes('increment')) return 0;
  if (cat.includes('paid')) return -amt;
  return amt;
}

export function parseRecordDate(val) {
  if (val === undefined || val === null || val === '') return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function filterRecordsByDateRange(records, fromStr, toStr, dateCols = ['Date', 'Transaction Date']) {
  if (!fromStr || !toStr) return null;
  const fDate = parseRecordDate(fromStr);
  const tDate = parseRecordDate(toStr);
  if (!fDate || !tDate) return [];
  fDate.setHours(0, 0, 0, 0);
  tDate.setHours(23, 59, 59, 999);
  return (records || []).filter((rec) => {
    const rDate = parseRecordDate(getCol(rec, dateCols));
    if (!rDate) return false;
    return rDate >= fDate && rDate <= tDate;
  });
}

export function defaultDateRange() {
  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return { from: '2020-01-01', to: todayStr };
}

/** Today only — used by All Transaction View default filter. */
export function todayDateRange() {
  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return { from: todayStr, to: todayStr };
}

export function getHrTxnCategoryColor(category) {
  if (category === 'Salary Paid') return 'text-emerald-600 bg-emerald-50';
  if (category === 'Salary Increment') return 'text-purple-600 bg-purple-50';
  if (category === 'Previous Due') return 'text-slate-700 bg-slate-100';
  return 'text-blue-600 bg-blue-50';
}

export { getCol, fmtMoney };
