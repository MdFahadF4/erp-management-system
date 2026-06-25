import { apiRequest } from '../services/auth.js';
import { getCol, gV, gF, cln } from './recordHelpers.js';
import { parseRecordDate } from './hrEngine.js';
import { rollupSupplierTxnTotals } from './supplierEngine.js';
import { isDualTxnPrevDue } from './dualHeadEngine.js';
import {
  parseTxnDualAmounts,
  getDualTxnCategory,
  parseSupplierTxnAmounts,
  getSupplierTxnCategory
} from './txnParsers.js';
import {
  EXPENSE_TXN_FIELDS,
  CREDITOR_TXN_FIELDS,
  INCOME_TXN_FIELDS,
  CAPITAL_TXN_FIELDS
} from './txnFields.js';
import { finalizeReportPrintLayout } from './reportExport.js';
import { t, getCategoryLabel, getReportFlowTypeLabel, getReportSourceLabel } from './reportI18n.js';

const CUSTOMER_TXN_COL = {
  uid: ["System Unique ID", "Sys UID", "UNIQUEID", "Unique ID", "Customer UID", "Customer ID"],
  sold: ["Sold Amount", "Sold Amt", "SOLDAMT", "Sold", "Total Sell"],
  discount: ["Discount", "Discount Amount", "Discount Allowed", "Txn Discount"],
  received: ["Received Amount", "Received Amt", "RECEIVEDAMT", "Received", "Cash Amt", "Cash Amount"],
  method: ["Payment Method", "Method", "METHOD", "Payment Type"],
  due: ["Transaction Due", "Txn Due", "TXNDUE", "Due"],
  remarks: ["Remarks / Reference", "Remarks", "Remarks / Reference Info"],
  loggedBy: ["Logged By", "Username", "User"],
  stamp: ["Stamp", "Timestamp", "System Stamp"]
};

function escapeHtmlAttr(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function parseMoney(val) {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  const n = parseFloat(String(val).replace(/,/g, '').trim());
  return Number.isNaN(n) ? null : n;
}

function normalizeCustMatchKey(val) {
  return String(val ?? '').trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function resolveCustomerReportTarget(secVal, secText, customerRecords) {
  const raw = String(secVal || '').trim();
  const loose = normalizeCustMatchKey(raw);
  const nameHint = String(secText || '').includes(' - ')
    ? secText.split(' - ').slice(1).join(' - ').trim()
    : String(secText || '').trim();

  let masterRec = null;
  for (const r of customerRecords || []) {
    const uid = String(getCol(r, CUSTOMER_TXN_COL.uid) || '').trim();
    const name = String(getCol(r, ['Customer Name', 'Name']) || '').trim();
    if (uid && (uid === raw || normalizeCustMatchKey(uid) === loose)) { masterRec = r; break; }
    if (name && (name === raw || normalizeCustMatchKey(name) === normalizeCustMatchKey(nameHint) || normalizeCustMatchKey(name) === loose)) {
      masterRec = r; break;
    }
  }

  const matchSet = new Set();
  const addMatch = (v) => {
    const s = String(v ?? '').trim();
    if (!s) return;
    matchSet.add(s);
    matchSet.add(normalizeCustMatchKey(s));
  };
  addMatch(raw);
  addMatch(nameHint);
  if (masterRec) {
    addMatch(getCol(masterRec, CUSTOMER_TXN_COL.uid));
    addMatch(getCol(masterRec, ['Customer Name', 'Name']));
  }

  const canonicalUid = String(
    (masterRec && getCol(masterRec, CUSTOMER_TXN_COL.uid)) || raw
  ).trim();

  return { masterRec, matchSet, canonicalUid };
}

function customerTxnBelongsToTarget(txn, target) {
  if (!target || !target.matchSet.size) return false;
  const uid = String(getCol(txn, CUSTOMER_TXN_COL.uid) || '').trim();
  if (uid && (target.matchSet.has(uid) || target.matchSet.has(normalizeCustMatchKey(uid)))) return true;
  if (target.canonicalUid && normalizeCustMatchKey(uid) === normalizeCustMatchKey(target.canonicalUid)) return true;
  for (const key of Object.keys(txn || {})) {
    const v = String(txn[key] ?? '').trim();
    if (!v || v.length < 3) continue;
    if (target.matchSet.has(v) || target.matchSet.has(normalizeCustMatchKey(v))) return true;
  }
  return false;
}

function collectCustomerReportTransactions(allTxns, target) {
  if (!Array.isArray(allTxns) || !target) return [];
  let matched = allTxns.filter((t) => customerTxnBelongsToTarget(t, target));
  if (matched.length === 0 && target.canonicalUid) {
    const needle = normalizeCustMatchKey(target.canonicalUid);
    if (needle.length >= 4) {
      matched = allTxns.filter((t) =>
        normalizeCustMatchKey(JSON.stringify(t)).includes(needle)
      );
    }
  }
  return matched;
}

function readCustomerTxnRowAmounts(txn, gF) {
  const num = (names, fallbacks) => {
    const direct = parseMoney(getCol(txn, names));
    if (direct !== null) return direct;
    const fuzzy = gF(txn, fallbacks);
    return Number.isNaN(fuzzy) ? 0 : fuzzy;
  };
  return {
    sell: num(CUSTOMER_TXN_COL.sold, ['soldamount', 'soldamt', 'sellamount', 'sell', 'totalsell']),
    recv: num(CUSTOMER_TXN_COL.received, ['receivedamount', 'receivedamt', 'received', 'cashamt', 'cashamount']),
    disc: num(CUSTOMER_TXN_COL.discount, ['discount', 'discountallowed', 'txndiscount', 'discountamount'])
  };
}

function parseCustomerTxnDate(rec, gV) {
  const raw = getCol(rec, ['Date', 'Transaction Date']) ?? gV(rec, ['date']);
  if (typeof raw === 'number' && raw > 20000 && raw < 120000) {
    return new Date(Math.round((raw - 25569) * 86400 * 1000));
  }
  return parseRecordDate(raw) || new Date();
}

function buildHrDetailsDateRange(fromStr, toStr) {
  const fDate = fromStr ? new Date(fromStr) : new Date(0);
  if (fromStr) fDate.setHours(0, 0, 0, 0);
  const tDate = toStr ? new Date(toStr) : new Date();
  if (toStr) tDate.setHours(23, 59, 59, 999);
  return { fDate, tDate };
}

function renderHrDetailsReportPanels({ cardsEl, tableContainer, employeeName, fromStr, toStr, hrTxns }) {
  if (!cardsEl || !tableContainer) return;

  const { fDate, tDate } = buildHrDetailsDateRange(fromStr, toStr);
  const secVal = employeeName;
  const allHrTxns = (hrTxns || []).filter((r) => getCol(r, ["Employee Name"]) === secVal);

  let globalEarn = 0;
  let globalPaid = 0;
  allHrTxns.forEach((r) => {
    const cat = String(getCol(r, ["Category"])).trim().toUpperCase();
    const amt = parseFloat(getCol(r, ["Amount"])) || 0;
    if (cat.includes("EARN") || cat.includes("PREVIOUS DUE") || cat.includes("OPENING BALANCE")) {
      globalEarn += amt;
    } else if (cat.includes("PAID")) {
      globalPaid += amt;
    }
  });
  const globalDueHr = globalEarn - globalPaid;

  const hrEarns = [];
  const hrPayments = [];
  let hrRangeEarn = 0;
  let hrRangePaid = 0;

  const hrFilteredTxns = allHrTxns.filter((r) => {
    const dStr = getCol(r, ["Date"]);
    if (!dStr) return false;
    const d = new Date(dStr);
    return d >= fDate && d <= tDate;
  });

  hrFilteredTxns.forEach((r) => {
    const cat = String(getCol(r, ["Category"])).trim().toUpperCase();
    const amt = parseFloat(getCol(r, ["Amount"])) || 0;
    const d = getCol(r, ["Date"]);
    const rem = getCol(r, ["Remarks"]) || '-';
    const usr = getCol(r, ["Username", "Logged By"]) || '';

    if (cat.includes("EARN") || cat.includes("PREVIOUS DUE") || cat.includes("OPENING BALANCE")) {
      hrRangeEarn += amt;
      hrEarns.push({ d, amt, rem, usr, type: getCol(r, ["Category"]) });
    } else if (cat.includes("PAID")) {
      hrRangePaid += amt;
      hrPayments.push({ d, amt, rem, usr });
    }
  });

  cardsEl.innerHTML = `
    <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-6">
      <div class="flex flex-wrap justify-between border-b border-gray-100 pb-4">
        <div class="text-left">
          <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalEarnedDue')}</div>
          <div class="text-2xl font-black text-blue-600 font-mono mt-1">SAR ${globalEarn.toFixed(2)}</div>
        </div>
        <div class="text-center">
          <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeSalaryPaid')}</div>
          <div class="text-2xl font-black text-emerald-600 font-mono mt-1">SAR ${globalPaid.toFixed(2)}</div>
        </div>
        <div class="text-right">
          <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.currentDueBalance')}</div>
          <div class="text-2xl font-black ${(globalDueHr > 0) ? 'text-red-600' : 'text-emerald-600'} font-mono mt-1">SAR ${globalDueHr.toFixed(2)}</div>
        </div>
      </div>
      <div class="flex justify-around bg-gray-50 p-4 rounded-lg">
        <div class="text-center">
          <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeEarnedTo', { from: fDate.toLocaleDateString(), to: tDate.toLocaleDateString() })}</div>
          <div class="text-lg font-bold text-blue-500 font-mono mt-1">SAR ${hrRangeEarn.toFixed(2)}</div>
        </div>
        <div class="text-center">
          <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangePaidTo', { from: fDate.toLocaleDateString(), to: tDate.toLocaleDateString() })}</div>
          <div class="text-lg font-bold text-emerald-500 font-mono mt-1">SAR ${hrRangePaid.toFixed(2)}</div>
        </div>
      </div>
    </div>
  `;
  cardsEl.className = 'grid grid-cols-1 mb-6';
  cardsEl.classList.remove('hidden');

  tableContainer.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start p-3 md:p-4">
      <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
        <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.salaryEarnedLedger')}</div>
        <div class="erp-report-ledger-wrap overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-gray-50 text-gray-500 border-b">
              <tr><th class="p-2.5 font-semibold">${t('report.earnedDate')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${hrEarns.length > 0 ? hrEarns.sort((a, b) => new Date(b.d) - new Date(a.d)).map((s) => `
                <tr class="hover:bg-gray-50">
                  <td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td>
                  <td class="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                    ${Number(s.amt).toFixed(2)}<br><span class="text-[9px] text-gray-400 font-normal leading-none">${getCategoryLabel(s.type, t)}</span>
                  </td>
                  <td class="p-2.5 truncate max-w-[120px]" title="${s.rem}">${s.rem}</td>
                  <td class="p-2.5">${s.usr}</td>
                </tr>
              `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noEarningsInRange')}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
      <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
        <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.salaryPaidLedger')}</div>
        <div class="erp-report-ledger-wrap overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-gray-50 text-gray-500 border-b">
              <tr><th class="p-2.5 font-semibold">${t('report.paymentDate')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${hrPayments.length > 0 ? hrPayments.sort((a, b) => new Date(b.d) - new Date(a.d)).map((p) => `
                <tr class="hover:bg-gray-50">
                  <td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td>
                  <td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td>
                  <td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td>
                  <td class="p-2.5">${p.usr}</td>
                </tr>
              `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noPaymentsInRange')}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function getRemarks(rec) {
  const val = getCol(rec, [
    "Remarks / Vouchers", "Remarks", "Remarks / Reference",
    "Description", "Description / Purpose", "Details"
  ]);
  return (val !== undefined && val !== null && String(val).trim() !== "") ? String(val).trim() : '-';
}

function accumulateExpenseTxnAmounts(txns, mainUpper, subUpper, rangeStart, rangeEnd) {
  let inc = 0;
  let paid = 0;
  let discount = 0;
  if (!Array.isArray(txns)) return { inc, paid, due: 0 };

  txns.forEach((t) => {
    const tMain = String(getCol(t, EXPENSE_TXN_FIELDS.main) || '').trim().toUpperCase();
    const tSub = String(getCol(t, EXPENSE_TXN_FIELDS.sub) || '').trim().toUpperCase();
    if (mainUpper !== null && subUpper !== null && (tMain !== mainUpper || tSub !== subUpper)) return;

    if (rangeStart && rangeEnd) {
      const dStr = getCol(t, ["Date", "Timestamp"]);
      if (!dStr) return;
      const d = new Date(dStr);
      if (d < rangeStart || d > rangeEnd) return;
    }

    const amounts = parseTxnDualAmounts(t, EXPENSE_TXN_FIELDS);
    if (isDualTxnPrevDue(t, EXPENSE_TXN_FIELDS)) {
      inc += Math.max(amounts.bill, amounts.pay);
    } else {
      inc += amounts.bill;
      paid += amounts.pay;
      discount += amounts.discount;
    }
  });

  return { inc, paid, due: Math.max(0, inc - discount - paid) };
}

export function initReportsSystem() {
  const typeSelect = document.getElementById('report-type');
  const secFilterContainer = document.getElementById('report-secondary-filter-container');
  const secFilterLabel = document.getElementById('report-secondary-label');
  const secSelect = document.getElementById('report-secondary-filter');
  const btnGen = document.getElementById('btn-generate-report');
  
  const fDateInput = document.getElementById('report-from');
  const tDateInput = document.getElementById('report-to');
  const dateFilterWrap = document.getElementById('report-date-filter-wrap');
  const useDateFilterInput = document.getElementById('report-use-date-filter');
  const now = new Date();
  const pad = n => (n < 10 ? '0'+n : n);
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  if (fDateInput) fDateInput.value = '2020-01-01';
  if (tDateInput) tDateInput.value = dateStr;

  if (typeSelect) {
    typeSelect.addEventListener('change', async (e) => {
      const val = e.target.value;
      secFilterContainer.classList.add('hidden');
      secSelect.innerHTML = '';
      if (dateFilterWrap) {
        if (val === 'customer_due_balance') {
          dateFilterWrap.classList.remove('hidden');
          if (useDateFilterInput) useDateFilterInput.checked = false;
        } else {
          dateFilterWrap.classList.add('hidden');
        }
      }
      
      const fillFilter = async (sheetName, textCol, valCol, labelKey) => {
        const labelTxt = t(labelKey);
        secFilterLabel.textContent = labelTxt;
        secSelect.innerHTML = `<option value="">${t('report.loading')}</option>`;
        secFilterContainer.classList.remove('hidden');
        try {
          const data = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName } });
          if (data.success && data.records && data.records.length > 0) {
            
            // --- SMART FALLBACK SCANNER ---
            const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const findMatch = (row, names) => {
                for(let k in row) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return row[k]; }
                return null;
            };
            const keys = Object.keys(data.records[0]);

            secSelect.innerHTML = `<option value="">${t('report.selectOption', { label: labelTxt })}</option>` + data.records.map(r => {
              
              // 1. Try to find exactly what we asked for
              let display = findMatch(r, textCol);
              let value = findMatch(r, valCol);
              
              // 2. If it misses, look for any generic "Name" or "Head" column
              if (display === null || display === undefined || display === "") {
                 display = findMatch(r, ["name", "head", "title", "category", "description"]);
                 value = findMatch(r, ["name", "head", "title", "category", "description"]);
              }
              
              // 3. Absolute Fallback: Grab the first column that isn't an ID or Date
              if (display === null || display === undefined || display === "") {
                  let fallback = keys.find(k => !cln(k).includes("id") && !cln(k).includes("date") && !cln(k).includes("stamp")) || keys[0];
                  display = r[fallback]; value = r[fallback];
              }

              if (sheetName === 'Customers' && value !== display) {
                 display = value + " - " + display;
              }
              
              return `<option value="${escapeHtmlAttr(value || 'Unknown')}">${display || t('report.unknown')}</option>`;
            }).join('');
          } else { secSelect.innerHTML = `<option value="">${t('report.noData')}</option>`; }
        } catch(err) { secSelect.innerHTML = `<option value="">${t('report.errorLoading')}</option>`; }
      };

      // Routes the secondary dropdown to fetch the correct lists from your database
      if (val === 'customer_details') await fillFilter('Customers', ["Customer Name", "Name"], ["System Unique ID", "Sys UID", "UNIQUEID"], 'report.selectCustomer');
      else if (val === 'supplier_details') await fillFilter('Suppliers', ["Supplier Name"], ["Supplier Name"], 'report.selectSupplier');
      else if (val === 'hr_details') await fillFilter('HR', ["Employee Name"], ["Employee Name"], 'report.selectEmployee');
      else if (val === 'user_transaction' || val === 'individual_user' || val === 'customer_due_balance') await fillFilter('Users', ["Username"], ["Username"], 'report.selectUser');
      
      // EXTREMELY BROAD DICTIONARY FOR NEW REPORTS:
      else if (val === 'expense_details') {
        secFilterLabel.textContent = t('report.selectExpenseHead');
        secSelect.innerHTML = `<option value="">${t('report.loading')}</option>`;
        secFilterContainer.classList.remove('hidden');
        try {
          const data = await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName: 'Expense_Heads' } });
          if (data.success && data.records && data.records.length > 0) {
            secSelect.innerHTML = `<option value="">${t('report.selectExpenseHeadShort')}</option>` + data.records.map((r) => {
              const mainHead = getCol(r, ["Expense Parent Head", "Parent Head", "Main Head", "Parent Category"]) || '';
              const subHead = getCol(r, ["Sub Head Name", "Sub Head", "SubCategory"]) || '';
              const display = subHead ? `${mainHead} > ${subHead}` : (mainHead || t('report.unknown'));
              const value = `${mainHead}|||${subHead}`;
              return `<option value="${String(value).replace(/"/g, '&quot;')}">${display}</option>`;
            }).join('');
          } else {
            secSelect.innerHTML = `<option value="">${t('report.noExpenseHeads')}</option>`;
          }
        } catch (err) {
          secSelect.innerHTML = `<option value="">${t('report.errorLoading')}</option>`;
        }
      }
      else if (val === 'creditor_details') await fillFilter('Creditor_Heads', ["Creditor Parent Head", "Creditor Name", "Creditor", "Name", "Head"], ["Creditor Parent Head", "Creditor Name", "Creditor", "Name", "Head"], 'report.selectCreditor');
      
      // --- THE MISSING INCOME ROUTE! ---
      else if (val === 'income_details') await fillFilter('Income_Heads', ["Income Parent Head", "Parent Head", "Main Head", "Name"], ["System Unique ID", "Tracking ID", "ID", "Income Parent Head", "Parent Head"], 'report.selectIncomeAccount');
      else if (val === 'capital_details') await fillFilter('Capital_Heads', ["Capital Parent Head", "Capital Name", "Name", "Head"], ["Capital Parent Head", "Capital Name", "Name", "Head"], 'report.selectCapitalAccount');

    });
  }

  if (btnGen) {
    btnGen.addEventListener('click', async () => {
      const repType = typeSelect.value;
      if (!repType) { alert(t('report.alertSelectType')); return; }
      const applyDateRange = repType === 'customer_due_balance'
        ? (useDateFilterInput?.checked === true)
        : true;
      if (applyDateRange && (!fDateInput.value || !tDateInput.value)) { alert(t('report.alertSelectDates')); return; }
      
      if (!secFilterContainer.classList.contains('hidden') && !secSelect.value) {
        alert(t('report.alertSelectTarget'));
        return;
      }

      await executeReportGeneration(repType, fDateInput.value, tDateInput.value, secSelect.value, secSelect.options[secSelect.selectedIndex]?.text, applyDateRange);
      const resultsAnchor = document.getElementById('report-results-anchor');
      if (resultsAnchor) resultsAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

export async function executeReportGeneration(type, fromStr, toStr, secVal, secText, applyDateRange = true) {
  const fDate = fromStr ? new Date(fromStr) : new Date(0);
  if (fromStr) fDate.setHours(0,0,0,0);
  const tDate = toStr ? new Date(toStr) : new Date();
  if (toStr) tDate.setHours(23,59,59,999);
  const useDateFilter = applyDateRange && fromStr && toStr;
  
  const headEl = document.getElementById('report-print-header');
  const titleEl = document.getElementById('report-title-display');
  const dateEl = document.getElementById('report-date-display');
  const tgtEl = document.getElementById('report-target-display');
  const cardsEl = document.getElementById('report-summary-cards');
  
  const tableContainer = document.getElementById('report-table-container');

  tableContainer.innerHTML = `
     <div class="erp-report-scroll erp-report-ledger-wrap overflow-x-auto">
        <table class="erp-report-table w-full text-left border-collapse text-xs">
          <thead id="report-table-head" class="bg-slate-800 text-white sticky top-0 z-10 shadow print:bg-gray-100 print:text-gray-800 print:shadow-none border-b">
          </thead>
          <tbody id="report-table-body" class="divide-y text-gray-600 font-medium">
             <tr><td class="p-6 text-center text-blue-500 font-bold animate-pulse">${t('report.runningQuery')}</td></tr>
          </tbody>
        </table>
     </div>
  `;

  const tHead = document.getElementById('report-table-head');
  const tBody = document.getElementById('report-table-body');

  headEl.classList.remove('hidden');
  cardsEl.classList.remove('hidden');
  dateEl.textContent = useDateFilter
    ? t('report.dateRangeTo', { from: fDate.toLocaleDateString(), to: tDate.toLocaleDateString() })
    : (type === 'customer_due_balance' ? t('report.allOutstandingForUser') : t('report.dateRangeTo', { from: fDate.toLocaleDateString(), to: tDate.toLocaleDateString() }));
  tgtEl.textContent = secText && secVal ? t('report.targetEntity', { name: secText }) : '';
  cardsEl.innerHTML = ''; 

  const drawCard = (title, val, colorClass) => {
    return `<div class="bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm text-center">
              <h4 class="text-xs font-bold uppercase text-gray-500 mb-1">${title}</h4>
              <div class="text-xl font-black font-mono ${colorClass}">SAR ${Number(val).toFixed(2)}</div>
            </div>`;
  };

  try {
    const fetchSheet = async (sheetName) => {
      try {
        return await apiRequest({ action: "FETCH_RECORDS", payload: { sheetName } });
      } catch(e) { return {success: false, records: []}; }
    };

    const [rCust, rCustT, rSup, rSupT, rHr, rHrT, rExp, rExpHeads, rInc, rIncT, rCrd, rCrdT, rCap, rCapT, rInt, rUsr] = await Promise.all([
      fetchSheet("Customers"), fetchSheet("Customer_Transactions"),
      fetchSheet("Suppliers"), fetchSheet("Supplier_Transactions"),
      fetchSheet("HR"), fetchSheet("HR_Transactions"),
      fetchSheet("Expense_Transactions"), fetchSheet("Expense_Heads"),
      fetchSheet("Income_Heads"), fetchSheet("Income_Transactions"),
      fetchSheet("Creditor_Heads"), fetchSheet("Creditor_Transactions"),
      fetchSheet("Capital_Heads"), fetchSheet("Capital_Transactions"),
      fetchSheet("Internal_Transfers"), fetchSheet("Users")
    ]);

    const filterByDate = (arr, dateColNames) => {
      if(!arr) return [];
      return arr.filter(r => {
        let dStr = getCol(r, dateColNames);
        if(!dStr) return false;
        let d = new Date(dStr);
        return d >= fDate && d <= tDate;
      });
    };

    switch (type) {
      
      // ====================================================================
      // 1. ACCOUNTS CASH FLOW REPORT (INTERCEPTOR SHIELD ENABLED)
      // ====================================================================
      case 'daily_monthly':
      case 'daily_cashflow': {
        titleEl.textContent = t('report.titleCashFlow');
        
        let lifeCashIn = 0, lifeCardIn = 0, lifeCashOut = 0;
        let rngCashIn = 0, rngCardIn = 0, rngCashOut = 0;
        let flowRows = [];

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        const gF = (obj, names) => { let v = parseFloat(gV(obj, names)); return isNaN(v)?0:v; };

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        if (rIncT.success) rIncT.records.forEach(r => {
            let amt = gF(r, ["receivedamount", "receivedamt", "amount", "received"]);
            let dStr = gV(r, ["date", "timestamp"]); let d = dStr ? new Date(dStr) : new Date();
            let inRange = !hasDates || (d >= fDate && d <= tDate);
            lifeCashIn += amt;
            if (inRange) { if (hasDates) rngCashIn += amt; if (amt > 0) flowRows.push({ d, type: "Cash IN", src: "Income (Revenue)", amt, rem: getRemarks(r), user: gV(r, ["username", "loggedby"]) || '-' }); }
        });

        if (rCrdT.success) rCrdT.records.forEach(r => {
            let check = cln(gV(r, ["remarks", "category", "method", "type"]));
            if (check.includes("previousdue") || check.includes("openingbalance")) return; // SHIELD

            let amtIn = gF(r, ["receivedamount", "receivedamt", "received"]);
            let amtOut = gF(r, ["returnamount", "returnamt", "returned"]);
            let dStr = gV(r, ["date", "timestamp"]); let d = dStr ? new Date(dStr) : new Date();
            let inRange = !hasDates || (d >= fDate && d <= tDate);
            lifeCashIn += amtIn; lifeCashOut += amtOut;
            if (inRange) {
                if (hasDates) { rngCashIn += amtIn; rngCashOut += amtOut; }
                if (amtIn > 0) flowRows.push({ d, type: "Cash IN", src: "Creditor (Loan Recv)", amt: amtIn, rem: getRemarks(r), user: gV(r, ["username", "loggedby"]) || '-' });
                if (amtOut > 0) flowRows.push({ d, type: "Cash OUT", src: "Creditor Return", amt: amtOut, rem: getRemarks(r), user: gV(r, ["username", "loggedby"]) || '-' });
            }
        });

        if (rCustT.success) rCustT.records.forEach(r => {
            let check = cln(gV(r, ["remarks", "category", "method", "type", "paymentmethod"]));
            if (check.includes("previousdue") || check.includes("openingbalance")) return; // SHIELD

            let amt = gF(r, ["receivedamount", "receivedamt", "received"]);
            let method = cln(gV(r, ["paymentmethod", "method", "type"])) || "cash"; let isCash = method.includes("cash");
            let dStr = gV(r, ["date", "timestamp"]); let d = dStr ? new Date(dStr) : new Date();
            let inRange = !hasDates || (d >= fDate && d <= tDate);
            if (isCash) lifeCashIn += amt; else lifeCardIn += amt;
            if (inRange) {
                if (hasDates) { if (isCash) rngCashIn += amt; else rngCardIn += amt; }
                if (amt > 0) flowRows.push({ d, type: isCash ? "Cash IN" : "Card IN", src: "Customer Sale", amt, rem: getRemarks(r), user: gV(r, ["username", "loggedby"]) || '-' });
            }
        });

        if (rExp.success) rExp.records.forEach(r => {
            if (isDualTxnPrevDue(r, EXPENSE_TXN_FIELDS)) return;
            const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
            let amt = amounts.pay;
            if (amt <= 0) return;
            let dStr = gV(r, ["date", "timestamp"]); let d = dStr ? new Date(dStr) : new Date();
            let inRange = !hasDates || (d >= fDate && d <= tDate);
            lifeCashOut += amt;
            if (inRange) { if (hasDates) rngCashOut += amt; if (amt > 0) flowRows.push({ d, type: "Cash OUT", src: "Operational Expense", amt, rem: getRemarks(r), user: gV(r, ["username", "loggedby"]) || '-' }); }
        });

        if (rHrT.success) rHrT.records.forEach(r => {
            let cat = String(gV(r, ["category", "remarks"])).trim().toLowerCase();
            if (cat.includes("previousdue") || cat.includes("openingbalance")) return; // SHIELD

            if (cat.includes("paid")) {
                let amt = Math.abs(gF(r, ["amount"]));
                let dStr = gV(r, ["date", "timestamp"]); let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);
                lifeCashOut += amt;
                if (inRange) { if (hasDates) rngCashOut += amt; if (amt > 0) flowRows.push({ d, type: "Cash OUT", src: "HR Salary Paid", amt, rem: getRemarks(r), user: gV(r, ["username", "loggedby"]) || '-' }); }
            }
        });

        if (rSupT.success) rSupT.records.forEach(r => {
            let cat = String(gV(r, ["category", "remarks"])).trim().toLowerCase();
            if (cat.includes("previousdue") || cat.includes("openingbalance")) return; // SHIELD

            if (cat.includes("paid")) {
                let amt = Math.abs(gF(r, ["amount"]));
                let dStr = gV(r, ["date", "timestamp"]); let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);
                lifeCashOut += amt;
                if (inRange) { if (hasDates) rngCashOut += amt; if (amt > 0) flowRows.push({ d, type: "Cash OUT", src: "Supplier Payment", amt, rem: getRemarks(r), user: gV(r, ["username", "loggedby"]) || '-' }); }
            }
        });

        let lifeNet = (lifeCashIn + lifeCardIn) - lifeCashOut;
        let rngNet = (rngCashIn + rngCardIn) - rngCashOut;

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-4 md:p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeCashIn')}</div>
                   <div class="text-xl md:text-3xl font-black text-emerald-600 font-mono mt-1 break-all">SAR ${lifeCashIn.toFixed(2)}</div>
                </div>
                <div class="text-left sm:text-center xl:border-l xl:border-gray-100 xl:pl-4">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeCardIn')}</div>
                   <div class="text-xl md:text-3xl font-black text-purple-600 font-mono mt-1 break-all">SAR ${lifeCardIn.toFixed(2)}</div>
                </div>
                <div class="text-left sm:text-center xl:border-l xl:border-gray-100 xl:pl-4">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeCashOut')}</div>
                   <div class="text-xl md:text-3xl font-black text-red-600 font-mono mt-1 break-all">SAR ${lifeCashOut.toFixed(2)}</div>
                </div>
                <div class="text-left sm:text-right xl:border-l xl:border-gray-100 xl:pl-4">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeNetFlow')}</div>
                   <div class="text-xl md:text-3xl font-black ${lifeNet >= 0 ? 'text-blue-600' : 'text-red-600'} font-mono mt-1 break-all">SAR ${lifeNet.toFixed(2)}</div>
                   <div class="text-[9px] text-gray-400 mt-1 uppercase leading-tight">${t('report.lifetimeNetHint')}</div>
                </div>
             </div>
             ${hasDates ? `
             <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-100">
                <div class="text-left sm:text-center"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCashIn')}</div><div class="text-base md:text-lg font-bold text-emerald-700 font-mono mt-1 break-all">SAR ${rngCashIn.toFixed(2)}</div></div>
                <div class="text-left sm:text-center xl:border-l xl:border-blue-200 xl:pl-4"><div class="text-purple-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCardIn')}</div><div class="text-base md:text-lg font-bold text-purple-700 font-mono mt-1 break-all">SAR ${rngCardIn.toFixed(2)}</div></div>
                <div class="text-left sm:text-center xl:border-l xl:border-blue-200 xl:pl-4"><div class="text-red-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCashOut')}</div><div class="text-base md:text-lg font-bold text-red-700 font-mono mt-1 break-all">SAR ${rngCashOut.toFixed(2)}</div></div>
                <div class="text-left sm:text-center xl:border-l xl:border-blue-200 xl:pl-4"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeNetFlow')}</div><div class="text-base md:text-lg font-bold text-blue-700 font-mono mt-1 break-all">SAR ${rngNet.toFixed(2)}</div></div>
             </div>
             ` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
             <div class="bg-slate-800 text-white font-bold p-2.5 md:p-3 uppercase tracking-wide text-[10px] md:text-xs border-b border-slate-900 text-center">${t('report.cashFlowLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
             <div class="erp-report-scroll erp-report-ledger-wrap overflow-x-auto">
               <table class="erp-report-table w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colFlowType')}</th><th class="p-2.5 font-semibold">${t('report.colSourceDest')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                  <tbody class="divide-y divide-gray-100">
                     ${flowRows.length > 0 ? flowRows.sort((a,b)=> b.d - a.d).map(r => {
                        let clr = r.type.includes("IN") ? (r.type.includes("Card") ? "text-purple-600" : "text-emerald-600") : "text-red-600";
                        return `<tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${r.d.toLocaleDateString()}</td><td class="p-2.5 font-bold ${clr}">${getReportFlowTypeLabel(r.type, t)}</td><td class="p-2.5 text-gray-700">${getReportSourceLabel(r.src, t)}</td><td class="p-2.5 font-mono font-bold whitespace-nowrap">SAR ${r.amt.toFixed(2)}</td><td class="p-2.5 truncate max-w-[140px] text-gray-600" title="${r.rem || '-'}">${r.rem || '-'}</td><td class="p-2.5">${r.user}</td></tr>`
                     }).join('') : `<tr><td colspan="6" class="p-6 text-center text-gray-400">${t('report.noCashFlow')}</td></tr>`}
                  </tbody>
               </table>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // 2. MASTER EXECUTIVE DASHBOARD (FINAL HR PREVIOUS DUE FIX)
      // ====================================================================
      case 'master_executive': {
        titleEl.textContent = t('report.titleExecutive');
        
        // This instantly removes spaces so "Previous Due" always matches!
        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); 
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        const gF = (obj, names) => { let v = parseFloat(gV(obj, names)); return isNaN(v)?0:v; };

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        window.aggReportData = {
           sales: { lInc:0, lPaid:0, lDisc:0, rInc:0, rPaid:0, rDisc:0, rows: [] },
           income: { lInc:0, lPaid:0, lDisc:0, rInc:0, rPaid:0, rDisc:0, rows: [] },
           purchase: { lInc:0, lPaid:0, lDisc:0, rInc:0, rPaid:0, rDisc:0, rows: [] },
           expense: { lInc:0, lPaid:0, lDisc:0, rInc:0, rPaid:0, rDisc:0, rows: [] },
           hr: { lInc:0, lPaid:0, lDisc:0, rInc:0, rPaid:0, rDisc:0, rows: [] },
           creditor: { lInc:0, lPaid:0, lDisc:0, rInc:0, rPaid:0, rDisc:0, rows: [] },
           capital: { lInc:0, lPaid:0, lDisc:0, rInc:0, rPaid:0, rDisc:0, rows: [] }
        };

        const addD = (cat, dStr, inc, paid, rem, usr, disc = 0) => {
            let d = dStr ? new Date(dStr) : new Date();
            let inRange = !hasDates || (d >= fDate && d <= tDate);
            window.aggReportData[cat].lInc += inc;
            window.aggReportData[cat].lPaid += paid;
            window.aggReportData[cat].lDisc += disc;
            if (hasDates && inRange) {
              window.aggReportData[cat].rInc += inc;
              window.aggReportData[cat].rPaid += paid;
              window.aggReportData[cat].rDisc += disc;
            }
            if (inc > 0 || paid > 0 || disc > 0) window.aggReportData[cat].rows.push({ d, inc, paid, disc, rem: rem||'-', usr: usr||'-', inRange });
        };

        // --- CUSTOMER SALES LOGIC ---
        const sellCols = ["soldamount", "soldamt", "totalsell", "sellamount", "grosssell", "sell"];
        const recvCols = ["receivedamount", "receivedamt", "received", "cashreceived", "cashamt", "cashamount", "paidamount", "amountpaid"];
        let tSold=0, tPaid=0;
        const custTxnDisc = {};
        
        if (rCustT.success) rCustT.records.forEach(r => {
            let s = gF(r, sellCols); let p = gF(r, recvCols);
            let check = cln(gV(r, ["remarks", "category", "method", "type", "paymentmethod"])); 
            let uid = cln(gV(r, ["systemuniqueid", "sysuid", "uniqueid"]));
            
            if (check.includes("previousdue") || check.includes("openingbalance")) { 
                let prevAmt = Math.max(s, p);
                tSold += prevAmt; 
                addD('sales', gV(r, ["date", "timestamp"]), prevAmt, 0, "📌 Previous Due", gV(r, ["username", "loggedby"]));
            } else {
                let disc = gF(r, ["discount", "discountallowed", "txndiscount", "discountamount"]);
                tSold += s; tPaid += p;
                if (uid) custTxnDisc[uid] = (custTxnDisc[uid] || 0) + disc;
                addD('sales', gV(r, ["date", "timestamp"]), s, p, gV(r, ["remarks"])||"Sale Txn", gV(r, ["username", "loggedby"]), disc);
            }
        });
        if (rCust.success) rCust.records.forEach(r => {
            let sheetS = gF(r, sellCols);
            let sheetP = gF(r, ["cashamt", "cashamount", "cash", "totalpayments"]) + gF(r, ["cardamt", "cardamount", "card"]);
            let sheetDisc = gF(r, ["discount", "discountallowed"]);
            let uid = cln(gV(r, ["systemuniqueid", "sysuid", "uniqueid"]));
            let initS = sheetS - tSold; initS = initS > 0 ? initS : 0; 
            let initP = sheetP - tPaid; initP = initP > 0 ? initP : 0;
            let initDisc = Math.max(0, sheetDisc - (custTxnDisc[uid] || 0));
            if (initS > 0 || initP > 0 || initDisc > 0) addD('sales', gV(r, ["date", "timestamp", "creationstamp"]), initS, initP, "Base Master Record", gV(r, ["username", "loggedby", "createdby"]), initDisc);
        });

        // --- INCOME LOGIC ---
        let tIncS=0, tIncP=0;
        if (rIncT.success) rIncT.records.forEach(r => {
            const amounts = parseTxnDualAmounts(r, INCOME_TXN_FIELDS);
            let check = cln(getDualTxnCategory(r, INCOME_TXN_FIELDS) + " " + gV(r, ["remarks", "parenthead", "subhead"])); 
            
            if (check.includes("previousdue") || check.includes("openingbalance")) { 
                let prevAmt = Math.max(amounts.bill, amounts.pay);
                tIncS += prevAmt;
                addD('income', gV(r, ["date", "timestamp"]), prevAmt, 0, "📌 Previous Due", gV(r, ["username", "loggedby"]));
            } else {
                tIncS += amounts.bill; tIncP += amounts.pay;
                addD('income', gV(r, ["date", "timestamp"]), amounts.bill, amounts.pay, gV(r, ["remarks", "details"])||"Income", gV(r, ["username", "loggedby"]), amounts.discount);
            }
        });
        if (typeof rInc !== 'undefined' && rInc && rInc.success) rInc.records.forEach(r => {
            let sheetS = gF(r, ["totalreceivable", "receivable"]);
            let sheetP = gF(r, ["totalreceived", "received"]);
            let initS = sheetS - tIncS; initS = initS > 0 ? initS : 0;
            let initP = sheetP - tIncP; initP = initP > 0 ? initP : 0;
            if (initS > 0 || initP > 0) addD('income', gV(r, ["date", "creationstamp"]), initS, initP, "Base Master Record", "-");
        });

        // --- SUPPLIER PURCHASES LOGIC ---
        let tPurS=0, tPurP=0;
        if (rSupT.success) rSupT.records.forEach(r => {
            const p = parseSupplierTxnAmounts(r);
            let check = cln(getSupplierTxnCategory(r) + " " + gV(r, ["remarks", "type"]));
            const d = gV(r, ["date", "timestamp"]);
            const usr = gV(r, ["username", "loggedby"]);
            const rem = gV(r, ["remarks"]) || "Supplier Txn";
            
            if(check.includes("previousdue") || check.includes("openingbalance")) { 
                tPurS += Math.max(p.bill, p.pay);
                addD('purchase', d, Math.max(p.bill, p.pay), 0, "📌 Previous Due", usr);
            } else { 
                if (p.bill > 0) { tPurS += p.bill; addD('purchase', d, p.bill, 0, rem, usr, p.discount); }
                if (p.pay > 0) { tPurP += p.pay; addD('purchase', d, 0, p.pay, rem, usr); }
            }
        });
        // --- EXPENSES LOGIC ---
        let tExpS=0, tExpP=0;
        if (rExp.success) rExp.records.forEach(r => {
            const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
            let check = cln(getDualTxnCategory(r, EXPENSE_TXN_FIELDS) + " " + gV(r, ["remarks", "parenthead", "subhead"]));

            if (check.includes("previousdue") || check.includes("openingbalance")) {
                let prevAmt = Math.max(amounts.bill, amounts.pay);
                tExpS += prevAmt;
                addD('expense', gV(r, ["date", "timestamp"]), prevAmt, 0, "📌 Previous Due", gV(r, ["username", "loggedby"]));
            } else {
                tExpS += amounts.bill; tExpP += amounts.pay;
                addD('expense', gV(r, ["date", "timestamp"]), amounts.bill, amounts.pay, gV(r, ["remarks", "description"])||"Expense", gV(r, ["username", "loggedby"]), amounts.discount);
            }
        });

        // --- HR LOGIC ---
        let tHrS=0, tHrP=0;
        if (rHrT.success) rHrT.records.forEach(r => {
            let cat = cln(gV(r, ["category", "remarks"])); 
            let amt = Math.abs(gF(r, ["amount"]));
            
            if (cat.includes("previousdue") || cat.includes("openingbalance")) {
                tHrS += amt;
                addD('hr', gV(r, ["date", "timestamp"]), amt, 0, "📌 Previous Due", gV(r, ["username", "loggedby"]));
            } else if (cat.includes("earn") || cat.includes("bill")) {
                tHrS += amt;
                addD('hr', gV(r, ["date", "timestamp"]), amt, 0, gV(r, ["remarks", "category"])||"HR Earned", gV(r, ["username", "loggedby"]));
            } else if (cat.includes("paid")) {
                tHrP += amt;
                addD('hr', gV(r, ["date", "timestamp"]), 0, amt, gV(r, ["remarks", "category"])||"HR Paid", gV(r, ["username", "loggedby"]));
            }
        });
        if (rHr.success) rHr.records.forEach(r => {
            let sheetS = gF(r, ["totalearn", "totalearnearning", "earned"]);
            let sheetP = gF(r, ["paidsalary", "paid"]);
            let initS = sheetS - tHrS; initS = initS > 0 ? initS : 0;
            let initP = sheetP - tHrP; initP = initP > 0 ? initP : 0;
            if (initS > 0 || initP > 0) addD('hr', gV(r, ["creationstamp", "timestamp", "dateofjoining"]), initS, initP, "Base HR Record", gV(r, ["username", "createdby"]));
        });

        // --- CREDITOR LIABILITIES LOGIC ---
        if (rCrdT.success) rCrdT.records.forEach(r => {
            let rawRecv = Math.abs(gF(r, ["receivedamount", "receivedamt", "received", "amountreceived"]));
            let rawRet = Math.abs(gF(r, ["returnamount", "returnamt", "returned"]));
            let cat = String(gV(r, ["category", "subhead", "method", "type"]) || getRemarks(r)).trim().toUpperCase();
            let usr = getCol(r, ["Logged By", "Username", "User"]) || gV(r, ["username", "loggedby"]) || '-';

            if (cat.includes("PREVIOUS DUE") || cat.includes("OPENING BALANCE")) {
                let prevAmt = Math.max(rawRecv, rawRet);
                addD('creditor', gV(r, ["date", "timestamp"]), prevAmt, 0, "📌 Previous Due", usr);
            } else {
                addD('creditor', gV(r, ["date", "timestamp"]), rawRecv, rawRet, getRemarks(r), usr);
            }
        });

        // --- CAPITAL EQUITY LOGIC ---
        if (typeof rCapT !== 'undefined' && rCapT && rCapT.success) rCapT.records.forEach(r => {
            let rawIn = Math.abs(gF(r, ["capitalinamount", "capitalinamt", "capitalin"]));
            let rawOut = Math.abs(gF(r, ["capitaloutamount", "capitaloutamt", "capitalout"]));
            let cat = String(gV(r, ["category", "subhead", "method", "type"]) || getRemarks(r)).trim().toUpperCase();
            let usr = getCol(r, ["Logged By", "Username", "User"]) || gV(r, ["username", "loggedby"]) || '-';

            if (cat.includes("PREVIOUS DUE") || cat.includes("OPENING BALANCE")) {
                let prevAmt = Math.max(rawIn, rawOut);
                addD('capital', gV(r, ["date", "timestamp"]), prevAmt, 0, "📌 Previous Due", usr);
            } else {
                addD('capital', gV(r, ["date", "timestamp"]), rawIn, rawOut, getRemarks(r), usr);
            }
        });

        const reconcileAggDiscount = (key, lifeDue) => {
          const box = window.aggReportData[key];
          if (!box) return;
          box.lDisc = Math.max(0, box.lInc - box.lPaid - lifeDue);
          if (hasDates) {
            if (Math.abs(box.rInc - box.lInc) < 0.01 && Math.abs(box.rPaid - box.lPaid) < 0.01) {
              box.rDisc = box.lDisc;
            } else if (box.lInc > 0.009) {
              box.rDisc = Math.max(0, (box.lDisc * box.rInc) / box.lInc);
            } else {
              box.rDisc = 0;
            }
            box.rDisc = Math.min(box.rDisc, Math.max(0, box.rInc - box.rPaid));
          }
        };

        let aggSalesDue = 0;
        if (rCust.success) rCust.records.forEach(r => { aggSalesDue += getCustomerDueBalance(r); });

        let aggIncomeDue = 0;
        if (rIncT.success) rIncT.records.forEach(r => {
          const amounts = parseTxnDualAmounts(r, INCOME_TXN_FIELDS);
          const check = cln(getDualTxnCategory(r, INCOME_TXN_FIELDS) + " " + gV(r, ["remarks", "parenthead", "subhead"]));
          if (check.includes("previousdue") || check.includes("openingbalance")) {
            aggIncomeDue += Math.max(amounts.bill, amounts.pay);
          } else {
            aggIncomeDue += amounts.txnDue;
          }
        });

        let aggPurchaseDue = 0;
        if (rSupT.success) {
          const supNames = new Set();
          if (rSup.success) rSup.records.forEach(r => {
            const name = String(getCol(r, ["Supplier Name"]) || "").trim();
            if (name) supNames.add(name);
          });
          rSupT.records.forEach(t => {
            const name = String(getCol(t, ["Supplier Name"]) || "").trim();
            if (name) supNames.add(name);
          });
          supNames.forEach((name) => { aggPurchaseDue += getSupplierDueFromTxns(name, rSupT.records); });
        }

        let aggExpenseDue = 0;
        if (rExp.success) rExp.records.forEach(r => {
          const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
          const check = cln(getDualTxnCategory(r, EXPENSE_TXN_FIELDS) + " " + gV(r, ["remarks", "parenthead", "subhead"]));
          if (check.includes("previousdue") || check.includes("openingbalance")) {
            aggExpenseDue += Math.max(amounts.bill, amounts.pay);
          } else {
            aggExpenseDue += amounts.txnDue;
          }
        });

        reconcileAggDiscount('sales', aggSalesDue);
        reconcileAggDiscount('income', aggIncomeDue);
        reconcileAggDiscount('purchase', aggPurchaseDue);
        reconcileAggDiscount('expense', aggExpenseDue);

        let d = window.aggReportData;
        const netDue = (box, mode) => {
          const inc = mode === 'range' ? box.rInc : box.lInc;
          const paid = mode === 'range' ? box.rPaid : box.lPaid;
          const disc = mode === 'range' ? box.rDisc : box.lDisc;
          return inc - paid - disc;
        };
        let totalReceivable = netDue(d.sales, 'lifetime') + netDue(d.income, 'lifetime');
        let totalPayable = netDue(d.purchase, 'lifetime') + netDue(d.expense, 'lifetime') + netDue(d.hr, 'lifetime') + netDue(d.creditor, 'lifetime');
        let netStatus = totalReceivable - totalPayable;
        
        let rngReceivable = netDue(d.sales, 'range') + netDue(d.income, 'range');
        let rngPayable = netDue(d.purchase, 'range') + netDue(d.expense, 'range') + netDue(d.hr, 'range') + netDue(d.creditor, 'range');
        let rngNetStatus = rngReceivable - rngPayable;

        const buildBox = (title, incL, paidL, discL, l1, l2, key, mode) => {
            const balance = incL - paidL - discL;
            const showDisc = ['sales', 'income', 'purchase', 'expense'].includes(key);
            return `
            <div onclick="window.openAggModal('${key}', '${title}', '${mode}')" class="bg-white border border-gray-200 rounded-xl shadow-sm p-5 cursor-pointer hover:ring-2 hover:${mode === 'lifetime' ? 'ring-blue-400' : 'ring-purple-400'} hover:shadow-md transition duration-200 group relative">
               <div class="absolute top-3 right-3 text-gray-300 group-hover:${mode === 'lifetime' ? 'text-blue-500' : 'text-purple-500'}"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg></div>
               <h3 class="text-sm font-black text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">${title}</h3>
               <div class="flex justify-between ${showDisc ? 'gap-2' : ''}">
                   <div class="${showDisc ? 'w-1/3' : 'w-1/2'} pr-2">
                       <div class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">${l1}</div>
                       <div class="text-lg font-bold text-blue-600 font-mono mt-1">SAR ${incL.toFixed(2)}</div>
                   </div>
                   ${showDisc ? `<div class="w-1/3 border-l pl-2">
                       <div class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">${t('report.totalDiscount')}</div>
                       <div class="text-lg font-bold text-purple-600 font-mono mt-1">SAR ${discL.toFixed(2)}</div>
                   </div>` : ''}
                   <div class="${showDisc ? 'w-1/3' : 'w-1/2'} border-l pl-3">
                       <div class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">${l2}</div>
                       <div class="text-lg font-bold text-emerald-600 font-mono mt-1">SAR ${paidL.toFixed(2)}</div>
                   </div>
               </div>
               <div class="mt-4 pt-3 border-t ${mode === 'lifetime' ? 'bg-gray-50' : 'bg-purple-50'} -mx-5 -mb-5 p-3 rounded-b-xl text-center">
                   <div class="text-[10px] font-bold ${mode === 'lifetime' ? 'text-gray-500' : 'text-purple-700'} uppercase tracking-widest">${mode === 'lifetime' ? t('report.lifetimeBalanceDue') : t('report.rangeBalanceDue')}</div>
                   <div class="text-xl font-black ${balance > 0 ? 'text-red-500' : 'text-emerald-500'} font-mono mt-1">SAR ${balance.toFixed(2)}</div>
               </div>
            </div>`;
        };

        cardsEl.innerHTML = `
          <div class="col-span-full bg-slate-900 rounded-xl shadow-lg p-6 mb-6 flex flex-wrap justify-between items-center text-white border-b-4 border-slate-700">
             <div class="w-full md:w-1/3 text-center md:text-left mb-4 md:mb-0">
                <div class="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">${t('report.totalMarketReceivable')}</div>
                <div class="text-3xl font-bold text-emerald-400 font-mono">SAR ${totalReceivable.toFixed(2)}</div>
             </div>
             <div class="w-full md:w-1/3 text-center mb-4 md:mb-0 border-y md:border-y-0 md:border-x border-slate-700 py-4 md:py-0">
                <div class="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">${t('report.totalCompanyPayable')}</div>
                <div class="text-3xl font-bold text-red-400 font-mono">SAR ${totalPayable.toFixed(2)}</div>
             </div>
             <div class="w-full md:w-1/3 text-center md:text-right">
                <div class="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">${t('report.netEnterprisePosition')}</div>
                <div class="text-4xl font-black ${netStatus >= 0 ? 'text-blue-400' : 'text-orange-400'} font-mono">SAR ${netStatus.toFixed(2)}</div>
                <div class="text-[9px] ${netStatus >= 0 ? 'text-blue-500' : 'text-orange-500'} uppercase font-bold mt-1">${netStatus >= 0 ? t('report.positiveLiquidity') : t('report.negativeLiquidity')}</div>
             </div>
          </div>
          
          <div class="col-span-full mb-2">
             <h2 class="text-xs font-black text-gray-500 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg> ${t('report.lifetimeAggregates')}</h2>
          </div>
          <div class="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
             ${buildBox(t('report.boxCustomerSales'), d.sales.lInc, d.sales.lPaid, d.sales.lDisc, t('report.soldAmount'), t('report.receivedAmount'), "sales", "lifetime")}
             ${buildBox(t('report.boxOtherIncome'), d.income.lInc, d.income.lPaid, d.income.lDisc, t('report.incurredAmount'), t('report.receivedAmount'), "income", "lifetime")}
             ${buildBox(t('report.boxSupplierPurchases'), d.purchase.lInc, d.purchase.lPaid, d.purchase.lDisc, t('report.purchaseAmount'), t('report.paidAmountLabel'), "purchase", "lifetime")}
             ${buildBox(t('report.boxOperationalExpenses'), d.expense.lInc, d.expense.lPaid, d.expense.lDisc, t('report.incurredAmount'), t('report.paidAmountLabel'), "expense", "lifetime")}
             ${buildBox(t('report.boxHrPayroll'), d.hr.lInc, d.hr.lPaid, d.hr.lDisc, t('report.salaryEarned'), t('report.salaryPaidLabel'), "hr", "lifetime")}
             ${buildBox(t('report.boxCreditorLiabilities'), d.creditor.lInc, d.creditor.lPaid, d.creditor.lDisc, t('report.receivedLoaned'), t('report.returnedPaid'), "creditor", "lifetime")}
             ${buildBox(t('report.boxOwnerCapital'), d.capital.lInc, d.capital.lPaid, d.capital.lDisc, t('report.capitalInLabel'), t('report.capitalOutLabel'), "capital", "lifetime")}
          </div>
          
          ${hasDates ? `
          <div class="col-span-full bg-blue-50 border border-blue-200 rounded-xl shadow-sm p-4 mb-6 flex justify-around items-center">
             <div class="text-center"><div class="text-[9px] text-blue-500 uppercase font-bold tracking-widest">${t('report.rangeReceivableGenerated')}</div><div class="text-xl font-bold text-blue-700 font-mono mt-1">SAR ${rngReceivable.toFixed(2)}</div></div>
             <div class="text-center border-l border-blue-200 pl-6"><div class="text-[9px] text-orange-500 uppercase font-bold tracking-widest">${t('report.rangePayableGenerated')}</div><div class="text-xl font-bold text-orange-700 font-mono mt-1">SAR ${rngPayable.toFixed(2)}</div></div>
             <div class="text-center border-l border-blue-200 pl-6"><div class="text-[9px] text-slate-500 uppercase font-bold tracking-widest">${t('report.rangeNetShift')}</div><div class="text-xl font-bold ${rngNetStatus >= 0 ? 'text-emerald-600' : 'text-red-600'} font-mono mt-1">SAR ${rngNetStatus.toFixed(2)}</div></div>
          </div>
          
          <div class="col-span-full mb-2">
             <h2 class="text-xs font-black text-purple-600 uppercase tracking-widest border-b border-purple-200 pb-2 flex items-center gap-2"><svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> ${t('report.selectedRangeAggregates')}</h2>
          </div>
          <div class="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
             ${buildBox(t('report.boxCustomerSales'), d.sales.rInc, d.sales.rPaid, d.sales.rDisc, t('report.soldAmount'), t('report.receivedAmount'), "sales", "range")}
             ${buildBox(t('report.boxOtherIncome'), d.income.rInc, d.income.rPaid, d.income.rDisc, t('report.incurredAmount'), t('report.receivedAmount'), "income", "range")}
             ${buildBox(t('report.boxSupplierPurchases'), d.purchase.rInc, d.purchase.rPaid, d.purchase.rDisc, t('report.purchaseAmount'), t('report.paidAmountLabel'), "purchase", "range")}
             ${buildBox(t('report.boxOperationalExpenses'), d.expense.rInc, d.expense.rPaid, d.expense.rDisc, t('report.incurredAmount'), t('report.paidAmountLabel'), "expense", "range")}
             ${buildBox(t('report.boxHrPayroll'), d.hr.rInc, d.hr.rPaid, d.hr.rDisc, t('report.salaryEarned'), t('report.salaryPaidLabel'), "hr", "range")}
             ${buildBox(t('report.boxCreditorLiabilities'), d.creditor.rInc, d.creditor.rPaid, d.creditor.rDisc, t('report.receivedLoaned'), t('report.returnedPaid'), "creditor", "range")}
             ${buildBox(t('report.boxOwnerCapital'), d.capital.rInc, d.capital.rPaid, d.capital.rDisc, t('report.capitalInLabel'), t('report.capitalOutLabel'), "capital", "range")}
          </div>` : ''}
        `;
        cardsEl.className = "grid grid-cols-1 mb-2";

        tableContainer.innerHTML = `
          <div class="text-center text-gray-400 text-xs font-bold mt-4 animate-pulse">${t('report.clickCardHint')}</div>
          <div id="agg-modal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
             <div class="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200">
                <div class="bg-slate-800 p-4 flex justify-between items-center text-white">
                   <h2 id="agg-modal-title" class="text-lg font-black uppercase tracking-wider text-blue-400">${t('report.ledgerDetails')}</h2>
                   <button onclick="window.closeAggModal()" class="text-slate-400 hover:text-white transition font-bold text-2xl leading-none">&times;</button>
                </div>
                <div class="p-4 bg-gray-50 flex justify-around border-b border-gray-200 text-center">
                   <div><div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest" id="agg-l1">${t('report.colIncurred')}</div><div id="agg-v1" class="text-xl font-bold text-blue-600 font-mono">0.00</div></div>
                   <div id="agg-disc-wrap" class="border-l pl-8 hidden"><div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest" id="agg-l3">${t('report.totalDiscount')}</div><div id="agg-v3" class="text-xl font-bold text-purple-600 font-mono">0.00</div></div>
                   <div class="border-l pl-8"><div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest" id="agg-l2">${t('report.colPaid')}</div><div id="agg-v2" class="text-xl font-bold text-emerald-600 font-mono">0.00</div></div>
                </div>
                <div class="flex-1 overflow-y-auto p-4">
                   <table class="w-full text-left text-xs">
                      <thead class="bg-gray-100 text-gray-600 sticky top-0 border-b">
                         <tr><th class="p-3 font-semibold">${t('col.date')}</th><th class="p-3 font-semibold" id="agg-h1">${t('report.colIncurred')}</th><th class="p-3 font-semibold" id="agg-h3">${t('report.totalDiscount')}</th><th class="p-3 font-semibold" id="agg-h2">${t('report.colPaid')}</th><th class="p-3 font-semibold">${t('col.remarks')}</th><th class="p-3 font-semibold">${t('report.colUser')}</th></tr>
                      </thead>
                      <tbody id="agg-modal-body" class="divide-y divide-gray-100"></tbody>
                   </table>
                </div>
             </div>
          </div>
        `;

        window.openAggModal = function(key, title, mode) {
            const m = document.getElementById('agg-modal'); const data = window.aggReportData[key];
            if (!m || !data) return;

            document.getElementById('agg-modal-title').textContent = title + (mode === 'range' ? ' ' + t('report.rangeFiltered') : ' ' + t('report.lifetimeSuffix'));
            let l1 = t('report.colIncurred'), l2 = t('report.colPaid');
            if(key === 'sales') { l1 = t('report.aggSold'); l2 = t('report.aggReceived'); }
            if(key === 'purchase') { l1 = t('report.aggPurchased'); }
            if(key === 'hr') { l1 = t('report.aggEarned'); }
            if(key === 'creditor') { l1 = t('report.aggReceived'); l2 = t('report.aggReturned'); }
            if(key === 'capital') { l1 = t('report.capitalInLabel'); l2 = t('report.capitalOutLabel'); }
            
            document.getElementById('agg-l1').textContent = l1; document.getElementById('agg-h1').textContent = l1;
            document.getElementById('agg-l2').textContent = l2; document.getElementById('agg-h2').textContent = l2;
            
            let incAmt = mode === 'range' ? data.rInc : data.lInc; let paidAmt = mode === 'range' ? data.rPaid : data.lPaid;
            let discAmt = mode === 'range' ? data.rDisc : data.lDisc;
            const showDisc = ['sales', 'income', 'purchase', 'expense'].includes(key);
            document.getElementById('agg-v1').textContent = "SAR " + incAmt.toFixed(2);
            document.getElementById('agg-v2').textContent = "SAR " + paidAmt.toFixed(2);
            const discWrap = document.getElementById('agg-disc-wrap');
            const discHeader = document.getElementById('agg-h3');
            if (discWrap) discWrap.classList.toggle('hidden', !showDisc);
            if (discHeader) discHeader.classList.toggle('hidden', !showDisc);
            const discVal = document.getElementById('agg-v3');
            if (discVal) discVal.textContent = "SAR " + discAmt.toFixed(2);
            const modalTable = document.querySelector('#agg-modal table thead tr');
            if (modalTable) {
              const discTh = modalTable.querySelector('#agg-h3');
              if (discTh) discTh.style.display = showDisc ? '' : 'none';
            }

            let tBody = document.getElementById('agg-modal-body');
            let rowsToDisplay = mode === 'range' ? data.rows.filter(r => r.inRange) : data.rows;
            let sorted = rowsToDisplay.sort((a,b) => b.d - a.d);
            const colSpan = showDisc ? 6 : 5;
            
            if (sorted.length === 0) { tBody.innerHTML = `<tr><td colspan="${colSpan}" class="p-6 text-center text-gray-400 italic">${t('report.noTransactionsView')}</td></tr>`; } 
            else {
                tBody.innerHTML = sorted.map(r => `
                    <tr class="hover:bg-gray-50">
                        <td class="p-3 whitespace-nowrap">${r.d.toLocaleDateString()}</td>
                        <td class="p-3 font-mono font-bold text-blue-600">${r.inc > 0 ? Number(r.inc).toFixed(2) : '-'}</td>
                        ${showDisc ? `<td class="p-3 font-mono font-bold text-purple-600">${r.disc > 0 ? Number(r.disc).toFixed(2) : '-'}</td>` : ''}
                        <td class="p-3 font-mono font-bold text-emerald-600">${r.paid > 0 ? Number(r.paid).toFixed(2) : '-'}</td>
                        <td class="p-3 text-gray-600 truncate max-w-[150px]" title="${r.rem}">${r.rem}</td>
                        <td class="p-3 text-gray-500">${r.usr}</td>
                    </tr>
                `).join('');
            }
            m.classList.remove('hidden');
        };

        window.closeAggModal = function() { const m = document.getElementById('agg-modal'); if (m) m.classList.add('hidden'); };
        break;
      }

      case 'pnl': {
        titleEl.textContent = t('report.titlePnl');
        let revSales = 0, revSalesDisc = 0;
        let revIncome = 0, revIncomeDisc = 0;
        let expSup = 0, expSupDisc = 0;
        let expOp = 0, expOpDisc = 0;
        let expHR = 0;

        filterByDate(rCust.records, ["Creation Stamp", "Timestamp", "Date", "Created By"]).forEach(r => {
          revSales += parseFloat(getCol(r, ["Total Sell", "Sell Amount"])) || 0;
          revSalesDisc += parseFloat(getCol(r, ["Discount", "Discount Allowed"])) || 0;
        });
        filterByDate(rIncT.records, ["Date"]).forEach(r => {
          const amounts = parseTxnDualAmounts(r, INCOME_TXN_FIELDS);
          const check = String(getDualTxnCategory(r, INCOME_TXN_FIELDS) + ' ' + getRemarks(r)).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (check.includes('previousdue') || check.includes('openingbalance')) return;
          revIncome += amounts.bill;
          revIncomeDisc += amounts.discount;
        });
        
        filterByDate(rSupT.records, ["Date"]).forEach(r => {
          const p = parseSupplierTxnAmounts(r);
          const check = String(getSupplierTxnCategory(r)).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (check.includes('previousdue') || check.includes('openingbalance') || check.includes('paid')) return;
          expSup += p.bill;
          expSupDisc += p.discount;
        });
        filterByDate(rExp.records, ["Date"]).forEach(r => {
          const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
          const check = String(getDualTxnCategory(r, EXPENSE_TXN_FIELDS) + ' ' + getRemarks(r)).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (check.includes('previousdue') || check.includes('openingbalance')) return;
          expOp += amounts.bill;
          expOpDisc += amounts.discount;
        });
        filterByDate(rHrT.records, ["Date"]).forEach(r => {
          const cat = String(getCol(r, ["Category", "Remarks"]) || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (cat.includes('earn') || cat.includes('bill')) expHR += Math.abs(parseFloat(getCol(r, ["Amount"])) || 0);
        });

        let totalRev = (revSales - revSalesDisc) + (revIncome - revIncomeDisc);
        let totalExp = (expSup - expSupDisc) + (expOp - expOpDisc) + expHR;
        let netProfit = totalRev - totalExp;

        cardsEl.innerHTML = 
          drawCard(t('report.grossRevenue'), totalRev, "text-emerald-600") +
          drawCard(t('report.grossExpenses'), totalExp, "text-red-600") +
          drawCard(t('report.netProfitLoss'), netProfit, netProfit >= 0 ? "text-blue-600" : "text-red-600");
        cardsEl.className = "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6";

        tHead.innerHTML = `<tr><th class="p-3">${t('col.category')}</th><th class="p-3">${t('report.colClassification')}</th><th class="p-3 text-right">${t('report.colAmountSar')}</th></tr>`;
        tBody.innerHTML = `
          <tr class="bg-emerald-50"><td class="p-3 font-bold text-emerald-800" colspan="3">${t('report.revenues')}</td></tr>
          <tr class="border-b"><td class="p-3 pl-6">${t('report.customerSalesBilled')}</td><td>${t('report.operatingRevenue')}</td><td class="text-right font-mono">${revSales.toFixed(2)}</td></tr>
          <tr class="border-b"><td class="p-3 pl-6">${t('report.customerSalesDiscount')}</td><td>${t('report.operatingRevenue')}</td><td class="text-right font-mono text-purple-600">-${revSalesDisc.toFixed(2)}</td></tr>
          <tr class="border-b"><td class="p-3 pl-6">${t('report.otherIncomeBilled')}</td><td>${t('report.operatingRevenue')}</td><td class="text-right font-mono">${revIncome.toFixed(2)}</td></tr>
          <tr class="border-b"><td class="p-3 pl-6">${t('report.otherIncomeDiscount')}</td><td>${t('report.operatingRevenue')}</td><td class="text-right font-mono text-purple-600">-${revIncomeDisc.toFixed(2)}</td></tr>
          <tr class="bg-red-50"><td class="p-3 font-bold text-red-800" colspan="3">${t('report.expensesSection')}</td></tr>
          <tr class="border-b"><td class="p-3 pl-6">${t('report.cogsSuppliers')}</td><td>${t('report.directCost')}</td><td class="text-right font-mono">${expSup.toFixed(2)}</td></tr>
          <tr class="border-b"><td class="p-3 pl-6">${t('report.supplierPurchaseDiscount')}</td><td>${t('report.directCost')}</td><td class="text-right font-mono text-purple-600">-${expSupDisc.toFixed(2)}</td></tr>
          <tr class="border-b"><td class="p-3 pl-6">${t('report.operationalExpenses')}</td><td>${t('report.overhead')}</td><td class="text-right font-mono">${expOp.toFixed(2)}</td></tr>
          <tr class="border-b"><td class="p-3 pl-6">${t('report.operationalExpenseDiscount')}</td><td>${t('report.overhead')}</td><td class="text-right font-mono text-purple-600">-${expOpDisc.toFixed(2)}</td></tr>
          <tr class="border-b"><td class="p-3 pl-6">${t('report.hrPayrollEarned')}</td><td>${t('report.overhead')}</td><td class="text-right font-mono">${expHR.toFixed(2)}</td></tr>
          <tr class="bg-slate-100 font-bold text-lg border-t-2 border-slate-300"><td class="p-4 uppercase" colspan="2">${t('report.netProfitSlashLoss')}</td><td class="text-right font-mono ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}">${netProfit.toFixed(2)}</td></tr>
        `;
        break;
      }
      // ====================================================================
      // REDESIGNED RECEIVABLE & PAYABLE REPORT (FIXED DYNAMIC MATH)
      // ====================================================================
      case 'receivable_payable': {
        titleEl.textContent = t('report.titleReceivablePayable');

        let recvCustomers = []; let recvIncome = []; let paySuppliers = []; let payHR = []; let payCreditors = [];
        let tRecvCust = 0; let tRecvInc = 0; let tPaySup = 0; let tPayHR = 0; let tPayCrd = 0;

        // 1. Gather Customers (Receivable)
        if (typeof rCust !== 'undefined' && rCust.success) {
           rCust.records.forEach(r => {
              let due = parseFloat(getCol(r, ["Due Balance", "Due", "Outstanding Balance Due"])) || 0;
              if (due > 0) {
                 tRecvCust += due;
                 recvCustomers.push({ id: getCol(r, ["System Unique ID", "Sys UID", "UNIQUEID"]) || '-', name: getCol(r, ["Customer Name", "Name"]) || 'Unknown', amt: due });
              }
           });
        }

        // 2. Gather Other Income (Receivable) — billed but not yet received
        if (typeof rIncT !== 'undefined' && rIncT.success) {
           let headTotals = {};

           rIncT.records.forEach(t => {
              let mHead = String(getCol(t, ["Income Parent Head", "Parent Head", "Main Head"])).trim().toUpperCase();
              let sHead = String(getCol(t, ["Sub Head", "Sub Head Name", "SubCategory"])).trim().toUpperCase();
              let rem = String(getRemarks(t)).trim().toUpperCase();

              let rawReceivable = Math.abs(parseFloat(getCol(t, ["Receivable Amount", "Receivable"])) || 0);
              let rawReceived = Math.abs(parseFloat(getCol(t, ["Received Amount", "Received Amt", "Received"])) || 0);

              let isPrevDue = mHead.includes("PREVIOUS DUE") || sHead.includes("PREVIOUS DUE") ||
                rem.includes("PREVIOUS DUE") || rem.includes("OPENING BALANCE");

              let key = mHead + "|||" + sHead;
              if (!headTotals[key]) headTotals[key] = { receivable: 0, received: 0, prevDue: 0 };

              if (isPrevDue) {
                 headTotals[key].prevDue += Math.max(rawReceivable, rawReceived);
              } else {
                 headTotals[key].receivable += rawReceivable;
                 headTotals[key].received += rawReceived;
              }
           });

           const addIncomeDue = (mainHead, subHead, key, trackingId) => {
              let h = headTotals[key];
              if (!h) return;
              let rowReceivable = h.receivable + (h.prevDue || 0);
              let due = rowReceivable - h.received;
              if (due > 0) {
                 tRecvInc += due;
                 recvIncome.push({
                    id: trackingId || '-',
                    name: (mainHead && subHead) ? `${mainHead} - ${subHead}` : (mainHead || subHead || 'Unknown'),
                    amt: due
                 });
              }
           };

           let processedIncomeKeys = new Set();

           if (typeof rInc !== 'undefined' && rInc.success && rInc.records.length > 0) {
              rInc.records.forEach(rec => {
                 let mainHead = getCol(rec, ["Income Parent Head", "Parent Head", "Main Head"]) || '';
                 let subHead = getCol(rec, ["Sub Head Name", "Sub Head", "SubCategory"]) || '';
                 let key = String(mainHead).trim().toUpperCase() + "|||" + String(subHead).trim().toUpperCase();
                 processedIncomeKeys.add(key);
                 addIncomeDue(mainHead, subHead, key, getCol(rec, ["Tracking ID", "System Unique ID", "ID"]));
              });
           }

           Object.keys(headTotals).forEach(key => {
              if (processedIncomeKeys.has(key)) return;
              let [mHead, sHead] = key.split("|||");
              addIncomeDue(mHead, sHead, key, '-');
           });
        }

        let tRecv = tRecvCust + tRecvInc;

        // 3. Gather Suppliers (Payable) — transaction totals only (master Due/Balance can be stale)
        const supTxns = (typeof rSupT !== 'undefined' && rSupT.success) ? rSupT.records : [];
        const supNames = new Set();
        if (typeof rSup !== 'undefined' && rSup.success) {
          rSup.records.forEach((r) => {
            const name = String(getCol(r, ["Supplier Name"]) || "").trim();
            if (name) supNames.add(name);
          });
        }
        supTxns.forEach((t) => {
          const name = String(getCol(t, ["Supplier Name"]) || "").trim();
          if (name) supNames.add(name);
        });
        supNames.forEach((name) => {
          const due = getSupplierDueFromTxns(name, supTxns);
          if (due > 0.009) {
            tPaySup += due;
            paySuppliers.push({ name, amt: due });
          }
        });

        // 4. Gather HR (Payable) - DYNAMIC MATH ENGINE (Ignores Increments & Base Salary)
        let hrBalances = {};
        if (typeof rHrT !== 'undefined' && rHrT.success) {
           const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
           rHrT.records.forEach(r => {
              let emp = getCol(r, ["Employee Name"]) || 'Unknown';
              if (!hrBalances[emp]) hrBalances[emp] = { earned: 0, paid: 0 };
              
              let cat = cln(getCol(r, ["Category", "Remarks"]));
              let amt = Math.abs(parseFloat(getCol(r, ["Amount"])) || 0);

              if (cat.includes("previousdue") || cat.includes("openingbalance") || cat.includes("earn") || cat.includes("bill")) {
                 hrBalances[emp].earned += amt;
              } else if (cat.includes("paid")) {
                 hrBalances[emp].paid += amt;
              }
           });

           Object.keys(hrBalances).forEach(emp => {
              let due = hrBalances[emp].earned - hrBalances[emp].paid;
              if (due > 0) {
                 tPayHR += due;
                 payHR.push({ name: emp, amt: due });
              }
           });
        }

        // 5. Gather Creditors (Payable)
        if (typeof rCrd !== 'undefined' && rCrd.success && typeof rCrdT !== 'undefined' && rCrdT.success) {
           rCrd.records.forEach(head => {
              let mHead = String(getCol(head, ["Creditor Parent Head", "Parent Head", "Main Head"])||"").trim();
              let sHead = String(getCol(head, ["Sub Head Name", "Sub Head", "SubCategory"])||"").trim();
              let recAmt = 0; let retAmt = 0;
              rCrdT.records.forEach(t => {
                 let tM = String(getCol(t, ["Creditor Parent Head", "Parent Head", "Main Head"])||"").trim();
                 let tS = String(getCol(t, ["Sub Head Mapping", "Sub Head", "SubCategory"])||"").trim();
                 if (mHead.toUpperCase() === tM.toUpperCase() && sHead.toUpperCase() === tS.toUpperCase()) {
                    recAmt += parseFloat(getCol(t, ["Received Amount", "Received Amt"])) || 0;
                    retAmt += parseFloat(getCol(t, ["Return Amount", "Return Amt"])) || 0;
                 }
              });
              let due = recAmt - retAmt;
              if (due > 0) { tPayCrd += due; payCreditors.push({ name: mHead + " - " + sHead, amt: due }); }
           });
        }

        let tPayTotal = tPaySup + tPayHR + tPayCrd;
        let netBalance = tRecv - tPayTotal;
        let statusText = netBalance < 0 ? t('report.statusImbalance') : t('report.statusBalanceHealthy');
        let statusColor = netBalance < 0 ? "text-red-800 bg-red-200" : "text-emerald-800 bg-emerald-200";

        recvCustomers.sort((a,b) => b.amt - a.amt); recvIncome.sort((a,b) => b.amt - a.amt);
        paySuppliers.sort((a,b) => b.amt - a.amt);
        payHR.sort((a,b) => b.amt - a.amt); payCreditors.sort((a,b) => b.amt - a.amt);

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-6">
             <div class="flex flex-wrap justify-between border-b border-gray-100 pb-4">
                <div class="text-left w-1/3">
                  <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.totalReceivableMarket')}</div>
                  <div class="text-2xl font-black text-emerald-600 font-mono mt-1">SAR ${tRecv.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/3 border-l border-gray-100">
                  <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.totalPayableLiabilities')}</div>
                  <div class="text-2xl font-black text-red-600 font-mono mt-1">SAR ${tPayTotal.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/3 border-l border-gray-100">
                  <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.netPosition')}</div>
                  <div class="text-2xl font-black font-mono mt-1 ${netBalance < 0 ? 'text-red-600' : 'text-blue-600'}">SAR ${netBalance.toFixed(2)}</div>
                  <div class="mt-2"><span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm ${statusColor}">${statusText}</span></div>
                </div>
             </div>
             <div class="flex flex-wrap justify-around bg-gray-50 p-4 rounded-lg gap-4">
                ${tRecvCust > 0 ? `<div class="text-center"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.customerReceivable')}</div><div class="text-lg font-bold text-emerald-500 font-mono mt-1">SAR ${tRecvCust.toFixed(2)}</div></div>` : ''}
                ${tRecvInc > 0 ? `<div class="text-center ${tRecvCust > 0 ? 'border-l pl-8 border-gray-200' : ''}"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.incomeReceivable')}</div><div class="text-lg font-bold text-indigo-500 font-mono mt-1">SAR ${tRecvInc.toFixed(2)}</div></div>` : ''}
                ${tPaySup > 0 ? `<div class="text-center border-l pl-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.supplierPayable')}</div><div class="text-lg font-bold text-red-500 font-mono mt-1">SAR ${tPaySup.toFixed(2)}</div></div>` : ''}
                ${tPayHR > 0 ? `<div class="text-center border-l pl-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.salaryPayable')}</div><div class="text-lg font-bold text-orange-500 font-mono mt-1">SAR ${tPayHR.toFixed(2)}</div></div>` : ''}
                ${tPayCrd > 0 ? `<div class="text-center border-l pl-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.creditorPayable')}</div><div class="text-lg font-bold text-purple-500 font-mono mt-1">SAR ${tPayCrd.toFixed(2)}</div></div>` : ''}
             </div>
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        let listsHtml = '';
        if (recvCustomers.length > 0) {
           listsHtml += `<div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white mb-2"><div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.customerReceivablesList')}</div><div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b sticky top-0"><tr><th class="p-2.5 w-12 text-center">${t('report.colSl')}</th><th class="p-2.5">${t('report.colCustomerNameUid')}</th><th class="p-2.5 text-right pr-6">${t('report.colAmountSar')}</th></tr></thead><tbody class="divide-y divide-gray-100">${recvCustomers.map((c, i) => `<tr class="hover:bg-gray-50"><td class="p-2.5 text-center text-gray-400 font-mono">${i+1}</td><td class="p-2.5 font-bold">${c.name} <br><span class="text-[9px] text-gray-400 font-mono font-normal">${c.id}</span></td><td class="p-2.5 text-right pr-6 font-mono font-bold text-emerald-600">${c.amt.toFixed(2)}</td></tr>`).join('')}</tbody></table></div></div>`;
        }
        if (recvIncome.length > 0) {
           listsHtml += `<div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white mb-2"><div class="bg-indigo-50 text-indigo-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-indigo-100 text-center">${t('report.incomeReceivablesList')}</div><div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b sticky top-0"><tr><th class="p-2.5 w-12 text-center">${t('report.colSl')}</th><th class="p-2.5">${t('report.colIncomeHeadUid')}</th><th class="p-2.5 text-right pr-6">${t('report.colAmountSar')}</th></tr></thead><tbody class="divide-y divide-gray-100">${recvIncome.map((c, i) => `<tr class="hover:bg-gray-50"><td class="p-2.5 text-center text-gray-400 font-mono">${i+1}</td><td class="p-2.5 font-bold">${c.name} <br><span class="text-[9px] text-gray-400 font-mono font-normal">${c.id}</span></td><td class="p-2.5 text-right pr-6 font-mono font-bold text-indigo-600">${c.amt.toFixed(2)}</td></tr>`).join('')}</tbody></table></div></div>`;
        }
        if (paySuppliers.length > 0) {
           listsHtml += `<div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white mb-2"><div class="bg-red-50 text-red-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-red-100 text-center">${t('report.supplierPayablesList')}</div><div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b sticky top-0"><tr><th class="p-2.5 w-12 text-center">${t('report.colSl')}</th><th class="p-2.5">${t('col.supplierName')}</th><th class="p-2.5 text-right pr-6">${t('report.colAmountSar')}</th></tr></thead><tbody class="divide-y divide-gray-100">${paySuppliers.map((c, i) => `<tr class="hover:bg-gray-50"><td class="p-2.5 text-center text-gray-400 font-mono">${i+1}</td><td class="p-2.5 font-bold">${c.name}</td><td class="p-2.5 text-right pr-6 font-mono font-bold text-red-600">${c.amt.toFixed(2)}</td></tr>`).join('')}</tbody></table></div></div>`;
        }
        if (payHR.length > 0) {
           listsHtml += `<div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white mb-2"><div class="bg-orange-50 text-orange-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-orange-100 text-center">${t('report.salaryPayablesList')}</div><div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b sticky top-0"><tr><th class="p-2.5 w-12 text-center">${t('report.colSl')}</th><th class="p-2.5">${t('report.colEmployeeName')}</th><th class="p-2.5 text-right pr-6">${t('report.colAmountSar')}</th></tr></thead><tbody class="divide-y divide-gray-100">${payHR.map((c, i) => `<tr class="hover:bg-gray-50"><td class="p-2.5 text-center text-gray-400 font-mono">${i+1}</td><td class="p-2.5 font-bold">${c.name}</td><td class="p-2.5 text-right pr-6 font-mono font-bold text-orange-600">${c.amt.toFixed(2)}</td></tr>`).join('')}</tbody></table></div></div>`;
        }
        if (payCreditors.length > 0) {
           listsHtml += `<div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white mb-2"><div class="bg-purple-50 text-purple-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-purple-100 text-center">${t('report.creditorPayablesList')}</div><div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b sticky top-0"><tr><th class="p-2.5 w-12 text-center">${t('report.colSl')}</th><th class="p-2.5">${t('report.colCreditorNameHead')}</th><th class="p-2.5 text-right pr-6">${t('report.colAmountSar')}</th></tr></thead><tbody class="divide-y divide-gray-100">${payCreditors.map((c, i) => `<tr class="hover:bg-gray-50"><td class="p-2.5 text-center text-gray-400 font-mono">${i+1}</td><td class="p-2.5 font-bold">${c.name}</td><td class="p-2.5 text-right pr-6 font-mono font-bold text-purple-600">${c.amt.toFixed(2)}</td></tr>`).join('')}</tbody></table></div></div>`;
        }

        if (listsHtml === '') listsHtml = `<div class="col-span-2 p-6 text-center text-gray-500 font-bold border border-gray-200 bg-gray-50 rounded-xl">${t('report.noOutstanding')}</div>`;

        tableContainer.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">${listsHtml}</div>`;
        break;
      }

      // ====================================================================
      // 1. EXPENSE DETAILS REPORT (WITH UNIVERSAL ROW SCANNER)
      // ====================================================================
      case 'expense_details': {
        titleEl.textContent = t('report.titleExpenseStatement');
        
        let cdIncurred = []; let cdPayments = [];
        let lifeInc = 0, lifePaid = 0, lifeDiscount = 0;
        let rngInc = 0, rngPaid = 0, rngDiscount = 0;

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };

        const parseExpSelection = (val) => {
          if (!val) return { main: '', sub: '' };
          if (String(val).includes('|||')) {
            const parts = String(val).split('|||');
            return { main: String(parts[0] || '').trim(), sub: String(parts[1] || '').trim() };
          }
          return { main: String(val).trim(), sub: '' };
        };
        const expSelection = parseExpSelection(secVal);

        const isExpHead = (obj) => {
          const tMain = String(getCol(obj, ["Parent Category", "Expense Parent Head", "Main Head", "Parent Head"]) || '').trim().toUpperCase();
          const tSub = String(getCol(obj, ["Sub Head", "Sub Head Name", "SubCategory"]) || '').trim().toUpperCase();
          if (expSelection.sub) {
            return tMain === expSelection.main.toUpperCase() && tSub === expSelection.sub.toUpperCase();
          }
          if (expSelection.main) {
            return tMain === expSelection.main.toUpperCase() || tSub === expSelection.main.toUpperCase();
          }
          let target = cln(secVal);
          for (let key in obj) { if (cln(obj[key]) === target) return true; }
          return false;
        };

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        if (rExp.success) {
            rExp.records.filter(isExpHead).forEach(r => {
                const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
                let inc = 0; let paid = 0; let typeLabel = EXPENSE_TXN_FIELDS.categories.bill;

                if (isDualTxnPrevDue(r, EXPENSE_TXN_FIELDS)) {
                    inc = Math.max(amounts.bill, amounts.pay);
                    paid = 0;
                    typeLabel = "Previous Due";
                } else {
                    inc = amounts.bill;
                    paid = amounts.pay;
                    typeLabel = getDualTxnCategory(r, EXPENSE_TXN_FIELDS);
                }

                lifeInc += inc;
                lifePaid += paid;
                lifeDiscount += amounts.discount;

                let dStr = gV(r, ["date", "timestamp"]);
                let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);

                if (inRange) {
                    if (hasDates) { rngInc += inc; rngPaid += paid; rngDiscount += amounts.discount; }
                    let remarks = getRemarks(r);
                    let usr = getCol(r, ["Logged By", "Username", "User"]) || gV(r, ["username", "loggedby"]) || '-';
                    
                    if (inc > 0) cdIncurred.push({ d, amt: inc, rem: remarks, usr, type: typeLabel });
                    if (paid > 0) cdPayments.push({ d, amt: paid, rem: remarks, usr });
                }
            });
        }

        let lifeDue = lifeInc - lifePaid - lifeDiscount;

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="flex flex-wrap justify-between border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left w-1/4">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalIncurred')}</div>
                   <div class="text-3xl font-black text-blue-600 font-mono mt-1">SAR ${lifeInc.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/4 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.totalDiscount')}</div>
                   <div class="text-3xl font-black text-purple-600 font-mono mt-1">SAR ${lifeDiscount.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/4 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalPaid')}</div>
                   <div class="text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifePaid.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/4 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeDuePayable')}</div>
                   <div class="text-3xl font-black ${lifeDue > 0 ? 'text-red-600' : 'text-emerald-600'} font-mono mt-1">SAR ${lifeDue.toFixed(2)}</div>
                </div>
             </div>
             ${hasDates ? `
             <div class="flex justify-around bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div class="text-center"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeIncurred')}</div><div class="text-lg font-bold text-blue-700 font-mono mt-1">SAR ${rngInc.toFixed(2)}</div></div>
                <div class="text-center border-l border-blue-200 pl-8"><div class="text-purple-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeDiscount')}</div><div class="text-lg font-bold text-purple-700 font-mono mt-1">SAR ${rngDiscount.toFixed(2)}</div></div>
                <div class="text-center border-l border-blue-200 pl-8"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangePaid')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngPaid.toFixed(2)}</div></div>
             </div>` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.incurredExpenseLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colIncurredAmt')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdIncurred.length > 0 ? cdIncurred.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">${Number(s.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[120px]" title="${s.rem}">${s.rem}</td><td class="p-2.5">${s.usr}</td></tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noExpensesIncurred')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.paymentsMadeLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.paidAmt')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdPayments.length > 0 ? cdPayments.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td><td class="p-2.5">${p.usr}</td></tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noPaymentsMade')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // 2. CREDITOR DETAILS REPORT (WITH UNIVERSAL ROW SCANNER)
      // ====================================================================
      case 'creditor_details': {
        titleEl.textContent = t('report.titleCreditorStatement');
        
        let cdReceived = []; let cdReturned = [];
        let lifeRecv = 0, lifeRet = 0;
        let rngRecv = 0, rngRet = 0;

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        
        // UNIVERSAL SCANNER: Checks if the selected Creditor exists in ANY column of the row!
        const isCrd = (obj) => {
            let target = cln(secVal);
            for(let key in obj) { if (cln(obj[key]) === target) return true; }
            return false;
        };

        const recvCols = ["receivedamount", "receivedamt", "received", "amountreceived"];
        const retCols = ["returnamount", "returnamt", "amount", "returned", "paid", "amountpaid"];

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        if (rCrdT.success) {
            rCrdT.records.filter(isCrd).forEach(r => {
                let recv = Math.abs(parseFloat(gV(r, recvCols))); if(isNaN(recv)) recv = 0;
                let ret = Math.abs(parseFloat(gV(r, retCols))); if(isNaN(ret)) ret = 0;

                lifeRecv += recv;
                lifeRet += ret;

                let dStr = gV(r, ["date", "timestamp"]);
                let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);

                if (inRange) {
                    if (hasDates) { rngRecv += recv; rngRet += ret; }
                    let remarks = getRemarks(r);
                    let usr = gV(r, ["username", "loggedby"]) || '-';
                    let method = gV(r, ["paymentmethod", "method", "type"]) || 'Cash';
                    
                    if (recv > 0) cdReceived.push({ d, amt: recv, meth: method, rem: remarks, usr });
                    if (ret > 0) cdReturned.push({ d, amt: ret, meth: method, rem: remarks, usr });
                }
            });
        }

        let lifeDue = lifeRecv - lifeRet;

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="flex flex-wrap justify-between border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left w-1/3">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReceivedLoaned')}</div>
                   <div class="text-3xl font-black text-blue-600 font-mono mt-1">SAR ${lifeRecv.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReturnedPaid')}</div>
                   <div class="text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifeRet.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeDuePayable')}</div>
                   <div class="text-3xl font-black ${lifeDue > 0 ? 'text-red-600' : 'text-emerald-600'} font-mono mt-1">SAR ${lifeDue.toFixed(2)}</div>
                </div>
             </div>
             ${hasDates ? `
             <div class="flex justify-around bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div class="text-center"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeReceived')}</div><div class="text-lg font-bold text-blue-700 font-mono mt-1">SAR ${rngRecv.toFixed(2)}</div></div>
                <div class="text-center border-l border-blue-200 pl-8"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeReturned')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngRet.toFixed(2)}</div></div>
             </div>` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.fundsReceivedLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colReceivedAmt')}</th><th class="p-2.5 font-semibold">${t('col.method')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdReceived.length > 0 ? cdReceived.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">${Number(s.amt).toFixed(2)}</td><td class="p-2.5 font-bold text-gray-600">${s.meth}</td><td class="p-2.5 truncate max-w-[100px]" title="${s.rem}">${s.rem}</td><td class="p-2.5">${s.usr}</td></tr>
                        `).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noFundsReceived')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.fundsReturnedLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colReturnedAmt')}</th><th class="p-2.5 font-semibold">${t('col.method')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdReturned.length > 0 ? cdReturned.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td><td class="p-2.5 font-bold text-gray-600">${p.meth}</td><td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td><td class="p-2.5">${p.usr}</td></tr>
                        `).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noFundsReturned')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // 2b. CAPITAL DETAILS REPORT
      // ====================================================================
      case 'capital_details': {
        titleEl.textContent = t('report.titleCapitalStatement');

        let cdCapIn = []; let cdCapOut = [];
        let lifeIn = 0, lifeOut = 0;
        let rngIn = 0, rngOut = 0;

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };

        const isCap = (obj) => {
            let target = cln(secVal);
            for(let key in obj) { if (cln(obj[key]) === target) return true; }
            return false;
        };

        const inCols = ["capitalinamount", "capitalinamt", "capitalin"];
        const outCols = ["capitaloutamount", "capitaloutamt", "capitalout"];

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        if (rCapT.success) {
            rCapT.records.filter(isCap).forEach(r => {
                let capIn = Math.abs(parseFloat(gV(r, inCols))); if(isNaN(capIn)) capIn = 0;
                let capOut = Math.abs(parseFloat(gV(r, outCols))); if(isNaN(capOut)) capOut = 0;
                let check = cln(gV(r, ["remarks", "subhead"])) + cln(gV(r, ["subhead"]));
                if (check.includes("previousdue") || check.includes("openingbalance")) {
                    capIn = Math.max(capIn, capOut);
                    capOut = 0;
                }

                lifeIn += capIn;
                lifeOut += capOut;

                let dStr = gV(r, ["date", "timestamp"]);
                let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);

                if (inRange) {
                    if (hasDates) { rngIn += capIn; rngOut += capOut; }
                    let remarks = getRemarks(r);
                    let usr = gV(r, ["username", "loggedby"]) || '-';
                    if (capIn > 0) cdCapIn.push({ d, amt: capIn, rem: remarks, usr });
                    if (capOut > 0) cdCapOut.push({ d, amt: capOut, rem: remarks, usr });
                }
            });
        }

        let lifeNet = lifeIn - lifeOut;

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="flex flex-wrap justify-between border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left w-1/3">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalCapitalIn')}</div>
                   <div class="text-3xl font-black text-violet-600 font-mono mt-1">SAR ${lifeIn.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalCapitalOut')}</div>
                   <div class="text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifeOut.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeNetCapital')}</div>
                   <div class="text-3xl font-black ${lifeNet >= 0 ? 'text-violet-600' : 'text-red-600'} font-mono mt-1">SAR ${lifeNet.toFixed(2)}</div>
                </div>
             </div>
             ${hasDates ? `
             <div class="flex justify-around bg-violet-50 p-4 rounded-lg border border-violet-100">
                <div class="text-center"><div class="text-violet-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCapitalIn')}</div><div class="text-lg font-bold text-violet-700 font-mono mt-1">SAR ${rngIn.toFixed(2)}</div></div>
                <div class="text-center border-l border-violet-200 pl-8"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCapitalOut')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngOut.toFixed(2)}</div></div>
             </div>` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-violet-50 text-violet-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-violet-100 text-center">${t('report.capitalInLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colCapitalInAmt')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdCapIn.length > 0 ? cdCapIn.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-violet-600 whitespace-nowrap">${Number(s.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[100px]" title="${s.rem}">${s.rem}</td><td class="p-2.5">${s.usr}</td></tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noCapitalIn')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.capitalOutLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colCapitalOutAmt')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdCapOut.length > 0 ? cdCapOut.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td><td class="p-2.5">${p.usr}</td></tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noCapitalOut')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // 3. INCOME DETAILS REPORT (WITH ID TRANSLATOR & INTERCEPTOR)
      // ====================================================================
      case 'income_details': {
        titleEl.textContent = t('report.titleIncomeStatement');
        
        let incReceivables = []; let incReceivedLogs = [];
        let lifeReceivable = 0, lifeReceived = 0, lifeDiscount = 0;
        let rngReceivable = 0, rngReceived = 0, rngDiscount = 0;

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        
        // --- THE TRANSLATOR: Convert ID (INC-KHO-SHO) to Actual Names ---
        let targetMain = ""; let targetSub = "";

        if (typeof rInc !== 'undefined' && rInc && rInc.success) {
            let matchedMaster = rInc.records.find(master => {
                let id = cln(gV(master, ["systemuniqueid", "trackingid", "id"]));
                let mName = cln(gV(master, ["incomeparenthead", "parenthead", "mainhead"]));
                let sName = cln(gV(master, ["subheadname", "subhead", "subcategory"]));
                return id === cln(secVal) || mName === cln(secVal) || sName === cln(secVal);
            });

            if (matchedMaster) {
                targetMain = cln(gV(matchedMaster, ["incomeparenthead", "parenthead", "mainhead"]));
                targetSub = cln(gV(matchedMaster, ["subheadname", "subhead", "subcategory"]));
            }
        }

        // --- OMNI-DIRECTIONAL MATCHER ---
        const isInc = (obj) => {
            let m = cln(gV(obj, ["incomeparenthead", "parenthead", "mainhead"]));
            let s = cln(gV(obj, ["subheadname", "subhead", "subcategory"]));
            let id = cln(gV(obj, ["systemuniqueid", "trackingid", "id"]));
            let v = cln(secVal);
            
            if (id !== "" && id === v) return true; // Direct ID match
            if (m !== "" && m === v) return true; // Direct Main name match
            if (s !== "" && s === v) return true; // Direct Sub name match
            if (targetMain !== "" && m === targetMain) return true; // Translated Main match
            if (targetSub !== "" && s === targetSub) return true; // Translated Sub match
            
            return false;
        };

        const recvbleCols = ["receivableamount", "receivable"];
        const recvdCols = ["receivedamount", "receivedamt", "received", "amountreceived"];

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        if (typeof rIncT !== 'undefined' && rIncT && rIncT.success) {
            rIncT.records.filter(isInc).forEach(r => {
                const amounts = parseTxnDualAmounts(r, INCOME_TXN_FIELDS);
                let rawReceivable = Math.abs(amounts.bill);
                let rawReceived = Math.abs(amounts.pay);
                let rawDiscount = Math.abs(amounts.discount);

                let mHead = String(gV(r, ["incomeparenthead", "parenthead", "mainhead"])).trim().toUpperCase();
                let sHead = String(gV(r, ["subheadname", "subhead", "subcategory"])).trim().toUpperCase();
                let rem = String(gV(r, ["remarks", "description", "details"])).trim().toUpperCase();
                
                let receivable = 0; let received = 0; let discount = 0; let typeLabel = "Receivable";

                // INTERCEPTOR FLIPPER: Catch Previous Due and force it to the Due Increasing side!
                let isPrevDue = mHead.includes("PREVIOUS DUE") || sHead.includes("PREVIOUS DUE") || rem.includes("PREVIOUS DUE") || rem.includes("OPENING BALANCE");

                if (isPrevDue) {
                    receivable = Math.max(rawReceivable, rawReceived); 
                    received = 0;
                    typeLabel = "Previous Due";
                } else {
                    receivable = rawReceivable;
                    received = rawReceived;
                    discount = rawDiscount;
                    typeLabel = "Receivable";
                }

                lifeReceivable += receivable;
                lifeReceived += received;
                lifeDiscount += discount;

                let dStr = gV(r, ["date", "timestamp"]);
                let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);

                if (inRange) {
                    if (hasDates) { rngReceivable += receivable; rngReceived += received; rngDiscount += discount; }
                    let remarks = getRemarks(r);
                    let usr = gV(r, ["username", "loggedby"]) || '-';
                    
                    if (receivable > 0) incReceivables.push({ d, amt: receivable, rem: remarks, usr, type: typeLabel });
                    if (received > 0) incReceivedLogs.push({ d, amt: received, rem: remarks, usr });
                }
            });
        }

        let lifeDue = lifeReceivable - lifeReceived - lifeDiscount;

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="flex flex-wrap justify-between border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left w-1/4">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReceivable')}</div>
                   <div class="text-3xl font-black text-blue-600 font-mono mt-1">SAR ${lifeReceivable.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/4 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.totalDiscount')}</div>
                   <div class="text-3xl font-black text-purple-600 font-mono mt-1">SAR ${lifeDiscount.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/4 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReceived')}</div>
                   <div class="text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifeReceived.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/4 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeDueMarketOwes')}</div>
                   <div class="text-3xl font-black ${lifeDue > 0 ? 'text-blue-600' : 'text-gray-600'} font-mono mt-1">SAR ${lifeDue.toFixed(2)}</div>
                </div>
             </div>
             ${hasDates ? `
             <div class="flex justify-around bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div class="text-center"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeReceivable')}</div><div class="text-lg font-bold text-blue-700 font-mono mt-1">SAR ${rngReceivable.toFixed(2)}</div></div>
                <div class="text-center border-l border-blue-200 pl-8"><div class="text-purple-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeDiscount')}</div><div class="text-lg font-bold text-purple-700 font-mono mt-1">SAR ${rngDiscount.toFixed(2)}</div></div>
                <div class="text-center border-l border-blue-200 pl-8"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeReceived')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngReceived.toFixed(2)}</div></div>
             </div>` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.receivableLedger')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${incReceivables.length > 0 ? incReceivables.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50">
                              <td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td>
                              <td class="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                                 ${Number(s.amt).toFixed(2)}
                                 ${s.type === 'Previous Due' ? `<br><span class="text-[9px] text-gray-400 font-normal leading-none bg-gray-100 px-1 rounded border border-gray-200">${t('report.previousDue')}</span>` : ''}
                              </td>
                              <td class="p-2.5 truncate max-w-[120px]" title="${s.rem}">${s.rem}</td>
                              <td class="p-2.5">${s.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noReceivables')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.receivedLedger')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${incReceivedLogs.length > 0 ? incReceivedLogs.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50">
                              <td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td>
                              <td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td>
                              <td class="p-2.5 truncate max-w-[120px]" title="${p.rem}">${p.rem}</td>
                              <td class="p-2.5">${p.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noFundsReceived')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // 2. CREDITOR DETAILS REPORT (WITH UNIVERSAL ROW SCANNER)
      // ====================================================================
      case 'creditor_details': {
        titleEl.textContent = t('report.titleCreditorStatement');
        
        let cdReceived = []; let cdReturned = [];
        let lifeRecv = 0, lifeRet = 0;
        let rngRecv = 0, rngRet = 0;

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        
        // UNIVERSAL SCANNER: Checks if the selected Creditor exists in ANY column of the row!
        const isCrd = (obj) => {
            let target = cln(secVal);
            for(let key in obj) { if (cln(obj[key]) === target) return true; }
            return false;
        };

        const recvCols = ["receivedamount", "receivedamt", "received", "amountreceived"];
        const retCols = ["returnamount", "returnamt", "amount", "returned", "paid", "amountpaid"];

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        if (rCrdT.success) {
            rCrdT.records.filter(isCrd).forEach(r => {
                let recv = Math.abs(parseFloat(gV(r, recvCols))); if(isNaN(recv)) recv = 0;
                let ret = Math.abs(parseFloat(gV(r, retCols))); if(isNaN(ret)) ret = 0;

                lifeRecv += recv;
                lifeRet += ret;

                let dStr = gV(r, ["date", "timestamp"]);
                let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);

                if (inRange) {
                    if (hasDates) { rngRecv += recv; rngRet += ret; }
                    let remarks = getRemarks(r);
                    let usr = gV(r, ["username", "loggedby"]) || '-';
                    let method = gV(r, ["paymentmethod", "method", "type"]) || 'Cash';
                    
                    if (recv > 0) cdReceived.push({ d, amt: recv, meth: method, rem: remarks, usr });
                    if (ret > 0) cdReturned.push({ d, amt: ret, meth: method, rem: remarks, usr });
                }
            });
        }

        let lifeDue = lifeRecv - lifeRet;

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="flex flex-wrap justify-between border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left w-1/3">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReceivedLoaned')}</div>
                   <div class="text-3xl font-black text-blue-600 font-mono mt-1">SAR ${lifeRecv.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReturnedPaid')}</div>
                   <div class="text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifeRet.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeDuePayable')}</div>
                   <div class="text-3xl font-black ${lifeDue > 0 ? 'text-red-600' : 'text-emerald-600'} font-mono mt-1">SAR ${lifeDue.toFixed(2)}</div>
                </div>
             </div>
             ${hasDates ? `
             <div class="flex justify-around bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div class="text-center"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeReceived')}</div><div class="text-lg font-bold text-blue-700 font-mono mt-1">SAR ${rngRecv.toFixed(2)}</div></div>
                <div class="text-center border-l border-blue-200 pl-8"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeReturned')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngRet.toFixed(2)}</div></div>
             </div>` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.fundsReceivedLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colReceivedAmt')}</th><th class="p-2.5 font-semibold">${t('col.method')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdReceived.length > 0 ? cdReceived.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">${Number(s.amt).toFixed(2)}</td><td class="p-2.5 font-bold text-gray-600">${s.meth}</td><td class="p-2.5 truncate max-w-[100px]" title="${s.rem}">${s.rem}</td><td class="p-2.5">${s.usr}</td></tr>
                        `).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noFundsReceived')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.fundsReturnedLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colReturnedAmt')}</th><th class="p-2.5 font-semibold">${t('col.method')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdReturned.length > 0 ? cdReturned.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td><td class="p-2.5 font-bold text-gray-600">${p.meth}</td><td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td><td class="p-2.5">${p.usr}</td></tr>
                        `).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noFundsReturned')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // REDESIGNED CUSTOMER STATEMENT VIEW (LIFETIME + RANGE LOGIC)
      // ====================================================================
      case 'customer_details': {
        titleEl.textContent = t('report.titleCustomerStatement');
        
        let cdSales = []; let cdPayments = []; let cdTxnHistory = [];
        
        // 1. Separate Buckets for Lifetime vs Date Range
        let lifeSold = 0, lifePaid = 0, lifeCash = 0, lifeCard = 0, lifeDiscount = 0;
        let rngSold = 0, rngPaid = 0, rngCash = 0, rngCard = 0, rngDiscount = 0;

        // Super Matchers
        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        const gF = (obj, names) => { let v = parseFloat(gV(obj, names)); return isNaN(v)?0:v; };
        const methCols = ["paymentmethod", "method", "paymenttype", "type"];

        const hasDates = useDateFilter;
        const reportTarget = resolveCustomerReportTarget(secVal, secText, rCust.success ? rCust.records : []);
        const masterRec = reportTarget.masterRec;
        const custTxns = collectCustomerReportTransactions(rCustT.success ? rCustT.records : [], reportTarget);

        let sheetSold = 0, sheetCash = 0, sheetCard = 0;

        // 4. Process Transactions & Populate Ledgers
        let tSold = 0, tCash = 0, tCard = 0, tDisc = 0;
        custTxns.forEach(t => {
                const amounts = readCustomerTxnRowAmounts(t, gF);
                let sell = amounts.sell;
                let recv = amounts.recv;
                let disc = amounts.disc;
                let method = cln(getCol(t, ["Payment Method", "Method", "METHOD"]) || gV(t, methCols));
                if(method === "") method = "cash";
                let check = cln(getCol(t, ["Remarks", "Remarks / Reference"]) || gV(t, ["remarks", "category", "method", "type", "paymentmethod"]));

                // Sum up transactions to subtract from Master later
                tSold += sell;
                tDisc += disc;
                if(method.includes("cash")) tCash += recv; else if (method.includes("card")) tCard += recv;

                let d = parseCustomerTxnDate(t, gV);
                let inRange = !hasDates || (d >= fDate && d <= tDate);

                let remarks = getCol(t, ["Remarks", "Remarks / Reference"]) || gV(t, ["remarks", "remarksreference"]) || '-';
                let usr = getCol(t, ["Logged By", "Username"]) || gV(t, ["username", "loggedby"]) || '-';
                const methLabel = method.includes("card") ? "Card" : (method.includes("previousdue") ? "Previous Due" : "Cash");
                const isRefund = String(remarks).toUpperCase().includes('[REFUND/CANCELLATION]') || sell < -0.001 || recv < -0.001 || disc < -0.001;
                const txnDue = parseMoney(getCol(t, ["Transaction Due", "Txn Due", "TXNDUE", "Due"])) ?? (sell - disc - recv);

                // Always show every matched transaction (sale, payment, refund) in detail tables
                cdTxnHistory.push({ d, sell, disc, recv, meth: methLabel, txnDue, rem: remarks, usr, isRefund, isInitial: false });
                if (Math.abs(sell) > 0.001) cdSales.push({ d, amt: sell, rem: remarks, usr, isRefund });
                if (Math.abs(recv) > 0.001) cdPayments.push({ d, amt: recv, meth: methLabel, rem: remarks, usr, isRefund });

                if (inRange && hasDates) {
                    rngSold += sell;
                    if(method.includes("cash")) rngCash += recv; else if (method.includes("card")) rngCard += recv;
                    if (!check.includes("previousdue") && !check.includes("openingbalance")) rngDiscount += disc;
                }
            });

        // 5. Lifetime totals from Master Sheet (getCol priority — avoids gV picking wrong columns)
        if (masterRec) {
            sheetSold = parseFloat(getCol(masterRec, ["Total Sell", "Sell Amount", "Gross Sell"])) || 0;
            sheetCash = parseFloat(getCol(masterRec, ["Cash Amt", "Cash Amount", "Cash"])) || 0;
            sheetCard = parseFloat(getCol(masterRec, ["Card Amt", "Card Amount", "Card"])) || 0;
            lifeDiscount = parseFloat(getCol(masterRec, ["Discount", "Discount Allowed"])) || 0;
            lifeSold = sheetSold;
            lifeCash = sheetCash;
            lifeCard = sheetCard;
            lifePaid = lifeCash + lifeCard;
            if (lifePaid === 0) {
                lifePaid = parseFloat(getCol(masterRec, ["Received Amount", "Total Received", "Received"])) || 0;
            }
        }
        // Fallback: derive lifetime totals from matched transactions when master is zeroed after refund
        if (masterRec && lifeSold === 0 && lifePaid === 0 && custTxns.length > 0) {
            lifeSold = tSold;
            lifeCash = tCash;
            lifeCard = tCard;
            lifePaid = lifeCash + lifeCard;
            lifeDiscount = Math.max(0, tDisc);
        }
        // Fallback: derive from all transactions when master totals are unavailable
        if (!masterRec || (lifeSold === 0 && lifePaid === 0 && (tSold !== 0 || tCash !== 0 || tCard !== 0))) {
            lifeSold = tSold + (masterRec ? Math.max(0, sheetSold - tSold) : 0);
            lifeCash = tCash + (masterRec ? Math.max(0, sheetCash - tCash) : 0);
            lifeCard = tCard + (masterRec ? Math.max(0, sheetCard - tCard) : 0);
            lifePaid = lifeCash + lifeCard;
            if (lifePaid === 0 && (tCash + tCard) > 0) lifePaid = tCash + tCard;
            if (lifeSold === 0 && tSold > 0) lifeSold = tSold;
        }

        // 6. Extract True Initial Invoice for Table Rows
        if (masterRec) {
            let initialSold = sheetSold - tSold;
            let initialCash = sheetCash - tCash;
            let initialCard = sheetCard - tCard;

            let dStr = getCol(masterRec, ["Creation Stamp", "Timestamp", "Date"]) || gV(masterRec, ["date", "creationstamp", "timestamp"]);
            let d = parseRecordDate(dStr) || new Date();
            let inRange = !hasDates || (d >= fDate && d <= tDate);
            let remarks = getCol(masterRec, ["Invoice", "Memo", "Invoice / Memo Number"]) || gV(masterRec, ["invoice", "memo", "invoicememonumber"]) || 'Initial Invoice';
            let usr = getCol(masterRec, ["Username", "Logged By", "Created By"]) || gV(masterRec, ["username", "loggedby", "createdby"]) || '-';
            let initialDiscount = Math.max(0, (parseFloat(getCol(masterRec, ["Discount", "Discount Allowed"])) || 0) - tDisc);

            if (inRange && hasDates) {
                rngSold += initialSold;
                rngCash += initialCash;
                rngCard += initialCard;
                rngDiscount += initialDiscount;
            }

            if (Math.abs(initialSold) > 0.001) {
                cdTxnHistory.push({ d, sell: initialSold, disc: initialDiscount, recv: 0, meth: '-', txnDue: initialSold - initialDiscount, rem: "Inv: " + remarks, usr, isRefund: false, isInitial: true });
                cdSales.push({ d, amt: initialSold, rem: "Inv: " + remarks, usr, isRefund: false });
            }
            if (Math.abs(initialCash) > 0.001) {
                cdTxnHistory.push({ d, sell: 0, disc: 0, recv: initialCash, meth: "Cash", txnDue: -initialCash, rem: "Inv Deposit: " + remarks, usr, isRefund: false, isInitial: true });
                cdPayments.push({ d, amt: initialCash, meth: "Cash", rem: "Inv Deposit: " + remarks, usr, isRefund: false });
            }
            if (Math.abs(initialCard) > 0.001) {
                cdTxnHistory.push({ d, sell: 0, disc: 0, recv: initialCard, meth: "Card", txnDue: -initialCard, rem: "Inv Deposit: " + remarks, usr, isRefund: false, isInitial: true });
                cdPayments.push({ d, amt: initialCard, meth: "Card", rem: "Inv Deposit: " + remarks, usr, isRefund: false });
            }
        }
        
        rngPaid = rngCash + rngCard;
        let lifeDue = lifeSold - lifePaid - lifeDiscount;
        lifeDiscount = Math.max(0, lifeSold - lifePaid - lifeDue);
        if (hasDates) {
          if (Math.abs(rngSold - lifeSold) < 0.01 && Math.abs(rngPaid - lifePaid) < 0.01) {
            rngDiscount = lifeDiscount;
          } else if (lifeSold > 0.009) {
            rngDiscount = Math.max(rngDiscount, (lifeDiscount * rngSold) / lifeSold);
          }
          rngDiscount = Math.min(rngDiscount, Math.max(0, rngSold - rngPaid));
        }

        // 6. Dynamic UI Rendering
        const resolveCustTxnType = (row) => {
          if (row.isInitial) return t('report.txnTypeInitial');
          if (row.isRefund || row.sell < -0.001 || row.recv < -0.001 || row.disc < -0.001) return t('report.txnTypeRefund');
          if (row.sell > 0.001 && row.recv > 0.001) return t('report.txnTypeSalePayment');
          if (row.sell > 0.001) return t('report.txnTypeSale');
          if (row.recv > 0.001) return t('report.txnTypePayment');
          return '-';
        };
        const fmtAmtClass = (n, pos = 'text-blue-600', neg = 'text-amber-700') => {
          if (n < -0.001) return neg;
          if (n > 0.001) return pos;
          return 'text-gray-400';
        };
        const sortedTxnHistory = cdTxnHistory.sort((a, b) => new Date(b.d) - new Date(a.d));

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="flex flex-wrap justify-between border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left w-1/3">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalSold')}</div>
                   <div class="text-3xl font-black text-blue-600 font-mono mt-1">SAR ${lifeSold.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalPaid')}</div>
                   <div class="text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifePaid.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeDueBalance')}</div>
                   <div class="text-3xl font-black ${lifeDue > 0 ? 'text-red-600' : 'text-emerald-600'} font-mono mt-1">SAR ${lifeDue.toFixed(2)}</div>
                </div>
             </div>
             
             <div class="flex justify-center bg-purple-50 p-3 rounded-lg border border-purple-100">
                <div class="text-center px-6">
                   <div class="text-purple-600 text-[10px] font-bold uppercase tracking-wider">${t('report.totalDiscount')}</div>
                   <div class="text-xl font-bold text-purple-700 font-mono mt-1">SAR ${lifeDiscount.toFixed(2)}</div>
                </div>
             </div>
             
             ${hasDates ? `
             <div class="flex justify-around bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div class="text-center"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeSold')}</div><div class="text-lg font-bold text-blue-700 font-mono mt-1">SAR ${rngSold.toFixed(2)}</div></div>
                <div class="text-center border-l border-r px-8 border-blue-200"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangePaid')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngPaid.toFixed(2)}</div></div>
                <div class="text-center border-r pr-8 border-blue-200"><div class="text-purple-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeDiscount')}</div><div class="text-lg font-bold text-purple-700 font-mono mt-1">SAR ${rngDiscount.toFixed(2)}</div></div>
                <div class="text-center border-r pr-8 border-blue-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCashIn')}</div><div class="text-sm font-bold text-emerald-500 font-mono mt-1">SAR ${rngCash.toFixed(2)}</div></div>
                <div class="text-center"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCardIn')}</div><div class="text-sm font-bold text-purple-500 font-mono mt-1">SAR ${rngCard.toFixed(2)}</div></div>
             </div>
             ` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="space-y-6">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-slate-800 text-white font-bold p-3 uppercase tracking-wider text-xs border-b border-slate-700 text-center">${t('report.customerTxnAuditTrail')} ${t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs">
                     <thead class="bg-gray-50 text-gray-500 border-b whitespace-nowrap">
                        <tr>
                          <th class="p-2.5 font-semibold">${t('col.date')}</th>
                          <th class="p-2.5 font-semibold">${t('report.colType')}</th>
                          <th class="p-2.5 font-semibold">${t('col.soldAmt')}</th>
                          <th class="p-2.5 font-semibold">${t('col.discount')}</th>
                          <th class="p-2.5 font-semibold">${t('col.receivedAmt')}</th>
                          <th class="p-2.5 font-semibold">${t('col.method')}</th>
                          <th class="p-2.5 font-semibold">${t('col.txnDue')}</th>
                          <th class="p-2.5 font-semibold">${t('col.remarks')}</th>
                          <th class="p-2.5 font-semibold">${t('report.colUser')}</th>
                        </tr>
                     </thead>
                     <tbody class="divide-y divide-gray-100">
                        ${sortedTxnHistory.length > 0 ? sortedTxnHistory.map((row) => {
                          const rowClass = row.isRefund ? 'bg-amber-50/60 hover:bg-amber-50' : (row.isInitial ? 'bg-blue-50/40 hover:bg-blue-50' : 'hover:bg-gray-50');
                          const typeLabel = resolveCustTxnType(row);
                          const methKey = row.meth === 'Cash' ? t('option.cash') : row.meth === 'Card' ? t('option.card') : row.meth;
                          return `
                           <tr class="${rowClass}">
                             <td class="p-2.5 whitespace-nowrap">${new Date(row.d).toLocaleDateString()}</td>
                             <td class="p-2.5 font-bold ${row.isRefund ? 'text-amber-800' : 'text-gray-700'} whitespace-nowrap">${typeLabel}</td>
                             <td class="p-2.5 font-mono font-bold ${fmtAmtClass(row.sell, 'text-blue-600', 'text-amber-700')} whitespace-nowrap">${Number(row.sell).toFixed(2)}</td>
                             <td class="p-2.5 font-mono ${fmtAmtClass(row.disc, 'text-purple-600', 'text-amber-700')} whitespace-nowrap">${Number(row.disc).toFixed(2)}</td>
                             <td class="p-2.5 font-mono font-bold ${fmtAmtClass(row.recv, 'text-emerald-600', 'text-amber-700')} whitespace-nowrap">${Number(row.recv).toFixed(2)}</td>
                             <td class="p-2.5 whitespace-nowrap">${methKey}</td>
                             <td class="p-2.5 font-mono font-bold ${fmtAmtClass(row.txnDue, 'text-red-600', 'text-amber-700')} whitespace-nowrap">${Number(row.txnDue).toFixed(2)}</td>
                             <td class="p-2.5 truncate max-w-[160px]" title="${row.rem}">${row.rem}</td>
                             <td class="p-2.5">${row.usr}</td>
                           </tr>`;
                        }).join('') : `<tr><td colspan="9" class="p-6 text-center text-gray-400">${t('report.noCustomerTxnAuditTrail')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.salesBillingLedger')} ${t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs">
                     <thead class="bg-gray-50 text-gray-500 border-b">
                        <tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.soldAmt')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr>
                     </thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdSales.length > 0 ? cdSales.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50 ${s.isRefund ? 'bg-amber-50/60' : ''}">
                             <td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td>
                             <td class="p-2.5 font-mono font-bold ${s.amt < 0 ? 'text-amber-700' : 'text-blue-600'} whitespace-nowrap">${Number(s.amt).toFixed(2)}</td>
                             <td class="p-2.5 truncate max-w-[120px]" title="${s.rem}">${s.rem}</td>
                             <td class="p-2.5">${s.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noSalesGenerated')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.paymentsReceivedLedger')} ${t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs">
                     <thead class="bg-gray-50 text-gray-500 border-b">
                        <tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.paidAmt')}</th><th class="p-2.5 font-semibold">${t('report.colType')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr>
                     </thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdPayments.length > 0 ? cdPayments.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50 ${p.isRefund ? 'bg-amber-50/60' : ''}">
                             <td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td>
                             <td class="p-2.5 font-mono font-bold ${p.amt < 0 ? 'text-amber-700' : 'text-emerald-600'} whitespace-nowrap">${Number(p.amt).toFixed(2)}</td>
                             <td class="p-2.5 font-bold ${p.meth.toUpperCase() === 'CASH' ? 'text-emerald-600' : 'text-blue-600'}">${p.meth.toUpperCase() === 'CASH' ? t('option.cash') : p.meth.toUpperCase() === 'CARD' ? t('option.card') : p.meth}</td>
                             <td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td>
                             <td class="p-2.5">${p.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noPaymentsReceived')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // 1. EXPENSE DETAILS REPORT (LIFETIME + RANGE ARCHITECTURE)
      // ====================================================================
      case 'expense_details': {
        titleEl.textContent = t('report.titleExpenseStatement');
        
        let cdIncurred = []; let cdPayments = [];
        let lifeInc = 0, lifePaid = 0, lifeDiscount = 0;
        let rngInc = 0, rngPaid = 0, rngDiscount = 0;

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        
        // Matches the secondary dropdown selection (The specific Expense Head)
        const isExpHead = (obj) => cln(gV(obj, ["expensehead", "head", "category", "expensename", "name"])) === cln(secVal);

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        if (rExp.success) {
            rExp.records.filter(isExpHead).forEach(r => {
                const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
                let inc = 0; let paid = 0;

                if (isDualTxnPrevDue(r, EXPENSE_TXN_FIELDS)) {
                    inc = Math.max(amounts.bill, amounts.pay);
                    paid = 0;
                } else {
                    inc = amounts.bill;
                    paid = amounts.pay;
                }

                lifeInc += inc;
                lifePaid += paid;
                lifeDiscount += amounts.discount;

                let dStr = gV(r, ["date", "timestamp"]);
                let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);

                if (inRange) {
                    if (hasDates) { rngInc += inc; rngPaid += paid; rngDiscount += amounts.discount; }
                    let remarks = getRemarks(r);
                    let usr = gV(r, ["username", "loggedby"]) || '-';
                    
                    if (inc > 0) cdIncurred.push({ d, amt: inc, rem: remarks, usr });
                    if (paid > 0) cdPayments.push({ d, amt: paid, rem: remarks, usr });
                }
            });
        }

        let lifeDue = lifeInc - lifePaid - lifeDiscount;

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="flex flex-wrap justify-between border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left w-1/4">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalIncurred')}</div>
                   <div class="text-3xl font-black text-blue-600 font-mono mt-1">SAR ${lifeInc.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/4 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.totalDiscount')}</div>
                   <div class="text-3xl font-black text-purple-600 font-mono mt-1">SAR ${lifeDiscount.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/4 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalPaid')}</div>
                   <div class="text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifePaid.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/4 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeDuePayable')}</div>
                   <div class="text-3xl font-black ${lifeDue > 0 ? 'text-red-600' : 'text-emerald-600'} font-mono mt-1">SAR ${lifeDue.toFixed(2)}</div>
                </div>
             </div>
             ${hasDates ? `
             <div class="flex justify-around bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div class="text-center"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeIncurred')}</div><div class="text-lg font-bold text-blue-700 font-mono mt-1">SAR ${rngInc.toFixed(2)}</div></div>
                <div class="text-center border-l border-blue-200 pl-8"><div class="text-purple-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeDiscount')}</div><div class="text-lg font-bold text-purple-700 font-mono mt-1">SAR ${rngDiscount.toFixed(2)}</div></div>
                <div class="text-center border-l border-blue-200 pl-8"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangePaid')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngPaid.toFixed(2)}</div></div>
             </div>` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.incurredExpenseLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colIncurredAmt')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdIncurred.length > 0 ? cdIncurred.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">${Number(s.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[120px]" title="${s.rem}">${s.rem}</td><td class="p-2.5">${s.usr}</td></tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noExpensesIncurred')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.paymentsMadeLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.paidAmt')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdPayments.length > 0 ? cdPayments.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td><td class="p-2.5">${p.usr}</td></tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noPaymentsMade')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // 2. CREDITOR DETAILS REPORT (WITH PREVIOUS DUE INTERCEPTOR)
      // ====================================================================
      case 'creditor_details': {
        titleEl.textContent = t('report.titleCreditorStatement');
        
        let cdReceived = []; let cdReturned = [];
        let lifeRecv = 0, lifeRet = 0;
        let rngRecv = 0, rngRet = 0;

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        
        // Matches the specific Creditor Head
        const isCrd = (obj) => cln(gV(obj, ["creditorname", "creditorhead", "head", "name", "creditor"])) === cln(secVal);

        const recvCols = ["receivedamount", "receivedamt", "received", "amountreceived"];
        const retCols = ["returnamount", "returnamt", "amount", "returned", "paid", "amountpaid"];

        let hasDates = (typeof fDate !== 'undefined' && fDate && typeof tDate !== 'undefined' && tDate && !isNaN(new Date(fDate).getTime()));

        if (rCrdT.success) {
            rCrdT.records.filter(isCrd).forEach(r => {
                let rawRecv = Math.abs(parseFloat(gV(r, recvCols))); if(isNaN(rawRecv)) rawRecv = 0;
                let rawRet = Math.abs(parseFloat(gV(r, retCols))); if(isNaN(rawRet)) rawRet = 0;

                let cat = String(gV(r, ["category", "subhead", "method", "type", "remarks", "details"])).trim().toUpperCase();
                
                let recv = 0; let ret = 0; let typeLabel = "Received";

                // INTERCEPTOR FLIPPER: Catch Previous Due and force it to the Due Increasing side!
                if (cat.includes("PREVIOUS DUE") || cat.includes("OPENING BALANCE")) {
                    recv = Math.max(rawRecv, rawRet); // Grabs the money no matter which box it was typed into
                    ret = 0;
                    typeLabel = "Previous Due";
                } else {
                    recv = rawRecv;
                    ret = rawRet;
                    typeLabel = "Received";
                }

                lifeRecv += recv;
                lifeRet += ret;

                let dStr = gV(r, ["date", "timestamp"]);
                let d = dStr ? new Date(dStr) : new Date();
                let inRange = !hasDates || (d >= fDate && d <= tDate);

                if (inRange) {
                    if (hasDates) { rngRecv += recv; rngRet += ret; }
                    let remarks = getRemarks(r);
                    let usr = gV(r, ["username", "loggedby"]) || '-';
                    let method = gV(r, ["paymentmethod", "method", "type"]) || 'Cash';
                    
                    if (recv > 0) cdReceived.push({ d, amt: recv, meth: method, rem: remarks, usr, type: typeLabel });
                    if (ret > 0) cdReturned.push({ d, amt: ret, meth: method, rem: remarks, usr });
                }
            });
        }

        let lifeDue = lifeRecv - lifeRet;

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="flex flex-wrap justify-between border-gray-100 ${hasDates ? 'border-b pb-4' : ''}">
                <div class="text-left w-1/3">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReceivedLoaned')}</div>
                   <div class="text-3xl font-black text-blue-600 font-mono mt-1">SAR ${lifeRecv.toFixed(2)}</div>
                </div>
                <div class="text-center w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReturnedPaid')}</div>
                   <div class="text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifeRet.toFixed(2)}</div>
                </div>
                <div class="text-right w-1/3 border-l border-gray-100">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeDuePayable')}</div>
                   <div class="text-3xl font-black ${lifeDue > 0 ? 'text-red-600' : 'text-emerald-600'} font-mono mt-1">SAR ${lifeDue.toFixed(2)}</div>
                </div>
             </div>
             ${hasDates ? `
             <div class="flex justify-around bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div class="text-center"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeReceived')}</div><div class="text-lg font-bold text-blue-700 font-mono mt-1">SAR ${rngRecv.toFixed(2)}</div></div>
                <div class="text-center border-l border-blue-200 pl-8"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeReturned')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngRet.toFixed(2)}</div></div>
             </div>` : ''}
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.fundsReceivedLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colReceivedAmt')}</th><th class="p-2.5 font-semibold">${t('col.method')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdReceived.length > 0 ? cdReceived.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50">
                              <td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td>
                              <td class="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                                 ${Number(s.amt).toFixed(2)}
                                 ${s.type === 'Previous Due' ? `<br><span class="text-[9px] text-gray-400 font-normal leading-none bg-gray-100 px-1 rounded border border-gray-200">${t('report.previousDue')}</span>` : ''}
                              </td>
                              <td class="p-2.5 font-bold text-gray-600">${s.meth}</td>
                              <td class="p-2.5 truncate max-w-[100px]" title="${s.rem}">${s.rem}</td>
                              <td class="p-2.5">${s.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noFundsReceived')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.fundsReturnedLedger')} ${hasDates ? t('report.selectedRange') : t('report.allTime')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('report.colReturnedAmt')}</th><th class="p-2.5 font-semibold">${t('col.method')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${cdReturned.length > 0 ? cdReturned.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50">
                              <td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td>
                              <td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td>
                              <td class="p-2.5 font-bold text-gray-600">${p.meth}</td>
                              <td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td>
                              <td class="p-2.5">${p.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noFundsReturned')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ----------------------------------------------------
      // REDESIGNED SUPPLIER STATEMENT VIEW (WITH PREVIOUS DUE INTERCEPTOR)
      // ----------------------------------------------------
      case 'supplier_details': {
        titleEl.textContent = t('report.titleSupplierStatement');
        
        let allSupTxns = rSupT.success ? rSupT.records.filter(r => getCol(r, ["Supplier Name"]) === secVal) : [];
        
        const lifetimeTotals = rollupSupplierTxnTotals(allSupTxns);
        let globalPur = lifetimeTotals.bill;
        let globalPay = lifetimeTotals.pay;
        let globalDisc = lifetimeTotals.discount;
        let globalDue = lifetimeTotals.due;

        // 2. Filtered Range Transactions
        let sdPurchases = [];
        let sdPayments = [];
        let sdRangePur = 0;
        let sdRangePay = 0;
        let sdRangeDisc = 0;

        let sdFilteredTxns = filterByDate(allSupTxns, ["Date"]);

        sdFilteredTxns.forEach(r => {
           const p = parseSupplierTxnAmounts(r);
           const category = getSupplierTxnCategory(r);
           let d = getCol(r, ["Date"]);
           let rem = String(getCol(r, ["Remarks / Reference", "Remarks", "Reference Info"]) || '-');
           let usr = getCol(r, ["Username", "Logged By"]) || '';

           if (p.bill > 0) {
              sdRangePur += p.bill;
              sdRangeDisc += p.discount;
              const displayType = category === "Previous Due" ? "Previous Due" : "Purchase";
              sdPurchases.push({ d, amt: p.bill, disc: p.discount, rem, usr, type: displayType });
           }
           if (p.pay > 0) {
              sdRangePay += p.pay;
              sdPayments.push({ d, amt: p.pay, rem, usr });
           }
        });

        // Custom Layout: Summary Block at the top
        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-6">
             
             <div class="flex flex-wrap justify-between border-b border-gray-100 pb-4">
                <div class="text-left">
                  <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalPurchaseDue')}</div>
                  <div class="text-2xl font-black text-red-600 font-mono mt-1">SAR ${globalPur.toFixed(2)}</div>
                </div>
                <div class="text-center">
                  <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.totalDiscount')}</div>
                  <div class="text-2xl font-black text-purple-600 font-mono mt-1">SAR ${globalDisc.toFixed(2)}</div>
                </div>
                <div class="text-center">
                  <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimePaymentsMade')}</div>
                  <div class="text-2xl font-black text-emerald-600 font-mono mt-1">SAR ${globalPay.toFixed(2)}</div>
                </div>
                <div class="text-right">
                  <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.currentDueBalance')}</div>
                  <div class="text-2xl font-black text-orange-600 font-mono mt-1">SAR ${globalDue.toFixed(2)}</div>
                </div>
             </div>

             <div class="flex justify-around bg-gray-50 p-4 rounded-lg">
                <div class="text-center">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangePurchasesTo', { from: fDate.toLocaleDateString(), to: tDate.toLocaleDateString() })}</div>
                   <div class="text-lg font-bold text-red-500 font-mono mt-1">SAR ${sdRangePur.toFixed(2)}</div>
                </div>
                <div class="text-center">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeDiscount')}</div>
                   <div class="text-lg font-bold text-purple-500 font-mono mt-1">SAR ${sdRangeDisc.toFixed(2)}</div>
                </div>
                <div class="text-center">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangePaymentsTo', { from: fDate.toLocaleDateString(), to: tDate.toLocaleDateString() })}</div>
                   <div class="text-lg font-bold text-emerald-500 font-mono mt-1">SAR ${sdRangePay.toFixed(2)}</div>
                </div>
             </div>
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        // Custom Layout: Replace the standard table wrapper with the 2-Column Grid
        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-red-50 text-red-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-red-100 text-center">${t('report.purchasesLedgerDueInc')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs">
                     <thead class="bg-gray-50 text-gray-500 border-b">
                        <tr><th class="p-2.5 font-semibold">${t('report.purchaseDate')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr>
                     </thead>
                     <tbody class="divide-y divide-gray-100">
                        ${sdPurchases.length > 0 ? sdPurchases.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `
                           <tr class="hover:bg-gray-50">
                             <td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td>
                             <td class="p-2.5 font-mono font-bold text-red-600 whitespace-nowrap">
                                ${Number(s.amt).toFixed(2)}<br><span class="text-[9px] text-gray-400 font-normal leading-none">${s.type === 'Previous Due' ? t('report.previousDue') : t('report.purchaseType')}</span>
                             </td>
                             <td class="p-2.5 truncate max-w-[120px]" title="${s.rem}">${s.rem}</td>
                             <td class="p-2.5">${s.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noPurchasesInRange')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>

             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-emerald-50 text-emerald-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-emerald-100 text-center">${t('report.paymentsLedgerDueDec')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto">
                  <table class="w-full text-left text-xs">
                     <thead class="bg-gray-50 text-gray-500 border-b">
                        <tr><th class="p-2.5 font-semibold">${t('report.paymentDate')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr>
                     </thead>
                     <tbody class="divide-y divide-gray-100">
                        ${sdPayments.length > 0 ? sdPayments.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `
                           <tr class="hover:bg-gray-50">
                             <td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td>
                             <td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td>
                             <td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td>
                             <td class="p-2.5">${p.usr}</td>
                           </tr>
                        `).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noPaymentsInRange')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // REDESIGNED USER SELLS PERFORMANCE REPORT (BUG FIXED)
      // ====================================================================
      case 'user_transaction': {
        titleEl.textContent = t('report.titleUserPerformance');

        let pLifeSold = 0, pLifeRecv = 0, pLifeCash = 0, pLifeCard = 0;
        let monthlyData = {};

        const initMonth = (d) => { 
           const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
           let sKey = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,'0'); 
           if(!monthlyData[sKey]) monthlyData[sKey] = { label: months[d.getMonth()] + " " + d.getFullYear(), sold: 0, recv: 0 };
           return sKey;
        };

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        const gF = (obj, names) => { let v = parseFloat(gV(obj, names)); return isNaN(v)?0:v; };
        const isU = (obj) => cln(gV(obj, ["username", "loggedby", "createdby", "user", "transferredby"])) === cln(secVal);

        const sellCols = ["soldamount", "soldamt", "totalsell", "sellamount", "grosssell", "sell"];
        const recvCols = ["receivedamount", "receivedamt", "received", "cashreceived", "cashamt", "cashamount", "paidamount", "paidamt", "amountpaid"];
        const methCols = ["paymentmethod", "method", "paymenttype", "type"];

        // FAST ADMIN CHECK: Uses the already-loaded Users database
        let isSecValAdmin = false;
        if (typeof rUsr !== 'undefined' && rUsr.success) {
            let uMatch = rUsr.records.find(u => cln(gV(u, ["username"])) === cln(secVal));
            if (uMatch && cln(gV(uMatch, ["role"])).includes("admin")) isSecValAdmin = true;
        }

        let txnTotals = {};
        if (rCustT.success) {
           rCustT.records.forEach(t => {
              let uid = cln(gV(t, ["systemuniqueid", "sysuid", "uniqueid"]));
              if(!uid) return;
              if(!txnTotals[uid]) txnTotals[uid] = { sold: 0, cash: 0, card: 0 };
              txnTotals[uid].sold += gF(t, sellCols);
              let recv = gF(t, recvCols);
              let method = cln(gV(t, methCols));
              if (method === "") method = "cash"; 
              if (method.includes("cash")) txnTotals[uid].cash += recv; else txnTotals[uid].card += recv;
           });
        }

        if (rCust.success) {
           rCust.records.forEach(r => {
              if (isU(r)) {
                 let uid = cln(gV(r, ["systemuniqueid", "sysuid", "uniqueid"]));
                 let d = new Date(gV(r, ["date", "creationstamp", "timestamp"]) || new Date());
                 let mKey = initMonth(d);

                 let trueSold = gF(r, sellCols) - (txnTotals[uid] ? txnTotals[uid].sold : 0);
                 let trueCash = gF(r, ["cashamt", "cashamount", "cash"]) - (txnTotals[uid] ? txnTotals[uid].cash : 0);
                 let trueCard = gF(r, ["cardamt", "cardamount", "card"]) - (txnTotals[uid] ? txnTotals[uid].card : 0);
                 let trueRecv = trueCash + trueCard;

                 pLifeSold += trueSold; pLifeRecv += trueRecv; pLifeCash += trueCash; pLifeCard += trueCard;
                 monthlyData[mKey].sold += trueSold; monthlyData[mKey].recv += trueRecv;
              }
           });
        }

        if (rCustT.success) {
           rCustT.records.forEach(r => {
              if (isU(r)) {
                 let d = new Date(gV(r, ["date", "timestamp"]) || new Date());
                 let mKey = initMonth(d);

                 let tSell = gF(r, sellCols);
                 let recv = gF(r, recvCols);
                 let method = cln(gV(r, methCols));
                 if (method === "") method = "cash";
                 
                 pLifeSold += tSell; pLifeRecv += recv;
                 if (method.includes("cash")) pLifeCash += recv; else pLifeCard += recv;
                 
                 monthlyData[mKey].sold += tSell; monthlyData[mKey].recv += recv;
              }
           });
        }

        let pLifeDue = pLifeSold - pLifeRecv;

        // WALLET LOGIC
        let uCashIn = pLifeCash; 
        let uCashOut = 0;
        
        if (isSecValAdmin) {
            // VIP Admin Rule
            if(rInt.success) rInt.records.forEach(r=> { if(isU(r)) uCashOut += Math.abs(gF(r, ["transferamount", "amount"])); });
        } else {
            // Standard User Rule (TYPO FIXED: rCrdT instead of rCred)
            if(rInt.success) rInt.records.forEach(r=> { if(isU(r)) uCashOut += Math.abs(gF(r, ["transferamount", "amount"])); });
            if(rCrdT.success) rCrdT.records.forEach(r=> { if(isU(r)) uCashOut += Math.abs(gF(r, ["returnamount", "returnamt", "amount"])); });
            if(rHrT.success) rHrT.records.forEach(r=> { if(isU(r) && cln(gV(r,["category"])).includes("paid")) uCashOut += Math.abs(gF(r, ["amount"])); });
            if(rSupT.success) rSupT.records.forEach(r=> { if(isU(r)) { const p = parseSupplierTxnAmounts(r); if (p.pay > 0) uCashOut += p.pay; } });
            if(rExp.success) rExp.records.forEach(r=> { 
               if(isU(r)) {
                  const amounts = parseTxnDualAmounts(r, EXPENSE_TXN_FIELDS);
                  if (amounts.pay > 0) uCashOut += amounts.pay;
               }
            });
        }
        
        let pLiveDrawer = uCashIn - uCashOut;
        let drawerColor = pLiveDrawer >= 0 ? "text-emerald-600" : "text-red-600";

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-4 md:p-6 rounded-xl shadow-sm mb-2 gap-4 md:gap-6">
             <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 border-gray-100">
                <div class="text-left"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeSoldAmount')}</div><div class="text-lg md:text-2xl font-black text-blue-600 font-mono mt-1 break-all">SAR ${pLifeSold.toFixed(2)}</div></div>
                <div class="text-left xl:border-l xl:pl-4 xl:border-gray-100"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalReceived')}</div><div class="text-lg md:text-2xl font-black text-emerald-600 font-mono mt-1 break-all">SAR ${pLifeRecv.toFixed(2)}</div><div class="text-[10px] font-bold text-gray-500 mt-2">${t('report.cashLabel')} <span class="text-emerald-500 text-sm ml-1">${pLifeCash.toFixed(2)}</span></div><div class="text-[10px] font-bold text-gray-500 mt-1">${t('report.cardLabel')} <span class="text-purple-500 text-sm ml-1">${pLifeCard.toFixed(2)}</span></div></div>
                <div class="text-left xl:border-l xl:pl-4 xl:border-gray-100"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeDueSlashBalance')}</div><div class="text-lg md:text-2xl font-black text-red-600 font-mono mt-1 break-all">SAR ${pLifeDue.toFixed(2)}</div></div>
                <div class="text-left xl:border-l xl:pl-4 xl:border-gray-100 bg-gray-50 rounded-xl p-3 shadow-inner"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.currentLiveCashDrawer')}</div><div class="text-xl md:text-3xl font-black ${drawerColor} font-mono mt-2 break-all">SAR ${pLiveDrawer.toFixed(2)}</div><div class="text-[9px] text-gray-400 mt-1 uppercase leading-tight">(${isSecValAdmin ? t('report.drawerHintAdmin') : t('report.drawerHintUser')})</div></div>
             </div>
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-slate-800 text-white font-bold p-2.5 md:p-3 uppercase tracking-wide text-[10px] md:text-xs border-b border-slate-900 text-center">${t('report.monthWisePerformance')}</div>
                <div class="erp-report-scroll erp-report-ledger-wrap overflow-x-auto">
                  <table class="erp-report-table w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-3 font-semibold">${t('report.colMonthYear')}</th><th class="p-3 font-semibold text-right">${t('report.soldAmount')}</th><th class="p-3 font-semibold text-right">${t('report.receivedAmount')}</th><th class="p-3 font-semibold text-right">${t('report.colDueBalanceGen')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${Object.keys(monthlyData).length > 0 ? Object.keys(monthlyData).sort().reverse().map(m => {
                           let d = monthlyData[m]; let monthDue = d.sold - d.recv;
                           return `<tr class="hover:bg-gray-50"><td class="p-3 font-bold text-gray-800 uppercase tracking-wider">${d.label}</td><td class="p-3 text-right font-mono font-bold text-blue-600">SAR ${d.sold.toFixed(2)}</td><td class="p-3 text-right font-mono font-bold text-emerald-600">SAR ${d.recv.toFixed(2)}</td><td class="p-3 text-right font-mono font-bold ${monthDue > 0 ? 'text-red-600' : 'text-emerald-600'}">SAR ${monthDue.toFixed(2)}</td></tr>`;
                        }).join('') : `<tr><td colspan="4" class="p-6 text-center text-gray-400">${t('report.noSalesPerformanceData')}</td></tr>`}
                     </tbody>
                  </table>
                </div>
             </div>
        `;
        break;
      }

      // ====================================================================
      // 2. INDIVIDUAL USER AUDIT VIEW
      // ====================================================================
      case 'individual_user': {
        titleEl.textContent = t('report.titleIndividualUser');
        
        let uLifeSold = 0, uLifeCardIn = 0, uLifeCashIn = 0, uLifeCashOut = 0, uLifeTransfer = 0;
        let uRangeSold = 0, uRangeCardIn = 0, uRangeCashIn = 0, uRangeCashOut = 0, uRangeTransfer = 0;
        let leftTable = []; let rightTable = []; 

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        const gF = (obj, names) => { let v = parseFloat(gV(obj, names)); return isNaN(v)?0:v; };
        const iU = (obj) => cln(gV(obj, ["username", "loggedby", "createdby", "user", "transferredby"])) === cln(secVal);

        if (rCust.success) rCust.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date", "creationstamp", "timestamp"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let sell = gF(r, ["totalsell", "sellamount", "grosssell"]);
              uLifeSold += sell; if (inRange) uRangeSold += sell;
           }
        });

        if (rCustT.success) rCustT.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let tSell = gF(r, ["soldamount", "soldamt"]);
              uLifeSold += tSell; if (inRange) uRangeSold += tSell;

              let recv = gF(r, ["receivedamount", "receivedamt", "cashreceived"]);
              let method = cln(gV(r, ["paymentmethod", "method"]));
              
              if (method.includes("cash")) uLifeCashIn += recv; else uLifeCardIn += recv;
              if (inRange && recv !== 0) {
                 if (method.includes("cash")) uRangeCashIn += recv; else uRangeCardIn += recv;
                 leftTable.push({ d, amt: recv, rem: getRemarks(r), cat: gV(r, ["systemuniqueid", "sysuid"])||'Customer', usr: secVal });
              }
           }
        });

        if (rIncT.success) rIncT.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let recv = gF(r, ["receivedamount", "receivedamt"]);
              uLifeCashIn += recv;
              if(inRange && recv !== 0) { uRangeCashIn += recv; leftTable.push({ d, amt: recv, rem: getRemarks(r), cat: 'Income Log', usr: secVal }); }
           }
        });

        if (rCrdT.success) rCrdT.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let recv = gF(r, ["receivedamount", "receivedamt"]);
              let ret = Math.abs(gF(r, ["returnamount", "returnamt"])); 
              
              uLifeCashIn += recv; uLifeCashOut += ret;
              if(inRange && recv !== 0) { uRangeCashIn += recv; leftTable.push({ d, amt: recv, rem: getRemarks(r), cat: 'Creditor Loan', usr: secVal }); }
              if(inRange && ret !== 0) { uRangeCashOut += ret; rightTable.push({ d, amt: ret, rem: getRemarks(r), cat: 'Creditor Return', usr: secVal }); }
           }
        });

        if (rExp.success) rExp.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let paid = Math.abs(gF(r, ["paidamt", "paidamount", "amount", "deposit"]));
              uLifeCashOut += paid;
              if(inRange && paid !== 0) { uRangeCashOut += paid; rightTable.push({ d, amt: paid, rem: getRemarks(r), cat: 'Expense Txn', usr: secVal }); }
           }
        });

        if (rHrT.success) rHrT.records.forEach(r => {
           if (iU(r) && cln(gV(r, ["category"])).includes("paid")) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let paid = Math.abs(gF(r, ["amount"]));
              uLifeCashOut += paid;
              if(inRange && paid !== 0) { uRangeCashOut += paid; rightTable.push({ d, amt: paid, rem: getRemarks(r), cat: 'HR Salary Txn', usr: secVal }); }
           }
        });

        if (rSupT.success) rSupT.records.forEach(r => {
           if (iU(r) && cln(gV(r, ["category"])).includes("paid")) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let paid = Math.abs(gF(r, ["amount"]));
              uLifeCashOut += paid;
              if(inRange && paid !== 0) { uRangeCashOut += paid; rightTable.push({ d, amt: paid, rem: getRemarks(r), cat: 'Supplier Payment', usr: secVal }); }
           }
        });

        if (rInt.success) rInt.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let amt = Math.abs(gF(r, ["transferamount", "amount"]));
              uLifeCashOut += amt; uLifeTransfer += amt;
              if(inRange && amt !== 0) { uRangeCashOut += amt; uRangeTransfer += amt; rightTable.push({ d, amt, rem: getRemarks(r), cat: 'Internal Transfer', usr: secVal }); }
           }
        });

        let uLiveCashBalance = uLifeCashIn - uLifeCashOut;
        let uBColor = uLiveCashBalance >= 0 ? "text-emerald-600" : "text-red-600";

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-6">
             <div class="flex flex-wrap justify-between border-b border-gray-100 pb-4">
                <div class="text-left w-1/4"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeSold')}</div><div class="text-2xl font-black text-blue-600 font-mono mt-1">SAR ${uLifeSold.toFixed(2)}</div></div>
                <div class="text-left w-1/4 border-l pl-4 border-gray-100"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeCollections')}</div><div class="text-[10px] font-bold text-gray-500 mt-2">${t('report.cashInLabel')} <span class="text-emerald-500 text-sm ml-1">${uLifeCashIn.toFixed(2)}</span></div><div class="text-[10px] font-bold text-gray-500 mt-1">${t('report.cardInLabel')} <span class="text-purple-500 text-sm ml-1">${uLifeCardIn.toFixed(2)}</span></div></div>
                <div class="text-left w-1/4 border-l pl-4 border-gray-100"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.transferredToAdmin')}</div><div class="text-2xl font-black text-teal-600 font-mono mt-1">SAR ${uLifeTransfer.toFixed(2)}</div></div>
                <div class="text-right w-1/4 border-l pl-4 border-gray-100"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.currentUserCashBalance')}</div><div class="text-3xl font-black ${uBColor} font-mono mt-1">SAR ${uLiveCashBalance.toFixed(2)}</div><div class="text-[9px] text-gray-400 mt-1 uppercase leading-tight">${t('report.autoAdjustHint')}</div></div>
             </div>
             <div class="flex justify-around bg-gray-50 p-4 rounded-lg">
                <div class="text-center"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeSold')}</div><div class="text-lg font-bold text-blue-500 font-mono mt-1">SAR ${uRangeSold.toFixed(2)}</div></div>
                <div class="text-center border-l border-r px-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCashIn')}</div><div class="text-lg font-bold text-emerald-500 font-mono mt-1">SAR ${uRangeCashIn.toFixed(2)}</div></div>
                <div class="text-center border-r pr-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCardIn')}</div><div class="text-lg font-bold text-purple-500 font-mono mt-1">SAR ${uRangeCardIn.toFixed(2)}</div></div>
                <div class="text-center border-r pr-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeOutSpent')}</div><div class="text-lg font-bold text-red-500 font-mono mt-1">SAR ${uRangeCashOut.toFixed(2)}</div></div>
                <div class="text-center"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeTransferredAdmin')}</div><div class="text-lg font-bold text-teal-500 font-mono mt-1">SAR ${uRangeTransfer.toFixed(2)}</div></div>
             </div>
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.userCollectionsLedger')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colCategoryUid')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${leftTable.length > 0 ? leftTable.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `<tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(s.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[100px]" title="${s.rem}">${s.rem}</td><td class="p-2.5 font-mono text-[10px] text-gray-500">${s.cat}</td><td class="p-2.5">${s.usr}</td></tr>`).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noCollectionsInRange')}</td></tr>`}
                     </tbody>
                  </table></div></div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-red-50 text-red-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-red-100 text-center">${t('report.userExpendituresLedger')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colCategory')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${rightTable.length > 0 ? rightTable.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `<tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-red-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td><td class="p-2.5 font-bold text-[10px] ${p.cat === 'Internal Transfer' ? 'text-teal-600' : 'text-gray-700'}">${p.cat}</td><td class="p-2.5">${p.usr}</td></tr>`).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noSpendsTransfers')}</td></tr>`}
                     </tbody>
                  </table></div></div>
          </div>
        `;
        break;
      }

      // ----------------------------------------------------
      // REDESIGNED HR STATEMENT VIEW (WITH PREVIOUS DUE INTERCEPTOR)
      // ----------------------------------------------------
      case 'hr_details': {
        titleEl.textContent = t('report.titleHrPayroll');
        renderHrDetailsReportPanels({
          cardsEl,
          tableContainer,
          employeeName: secVal,
          fromStr,
          toStr,
          hrTxns: rHrT.success ? rHrT.records : []
        });
        break;
      }

      // ====================================================================
      // 2. INDIVIDUAL USER AUDIT VIEW
      // ====================================================================
      case 'individual_user': {
        titleEl.textContent = t('report.titleIndividualUser');
        
        let uLifeSold = 0, uLifeCardIn = 0, uLifeCashIn = 0, uLifeCashOut = 0, uLifeTransfer = 0;
        let uRangeSold = 0, uRangeCardIn = 0, uRangeCashIn = 0, uRangeCashOut = 0, uRangeTransfer = 0;
        let leftTable = []; let rightTable = []; 

        const cln = (s) => String(s||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const gV = (obj, names) => { for(let k in obj) { let cK = cln(k); for(let n of names) if(cK === cln(n)) return obj[k]; } return null; };
        const gF = (obj, names) => { let v = parseFloat(gV(obj, names)); return isNaN(v)?0:v; };
        const iU = (obj) => cln(gV(obj, ["username", "loggedby", "createdby", "user", "transferredby"])) === cln(secVal);

        if (rCust.success) rCust.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date", "creationstamp", "timestamp"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let sell = gF(r, ["totalsell", "sellamount", "grosssell"]);
              uLifeSold += sell; if (inRange) uRangeSold += sell;
           }
        });

        if (rCustT.success) rCustT.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let tSell = gF(r, ["soldamount", "soldamt"]);
              uLifeSold += tSell; if (inRange) uRangeSold += tSell;

              let recv = gF(r, ["receivedamount", "receivedamt", "cashreceived"]);
              let method = cln(gV(r, ["paymentmethod", "method"]));
              
              if (method.includes("cash")) uLifeCashIn += recv; else uLifeCardIn += recv;
              if (inRange && recv !== 0) {
                 if (method.includes("cash")) uRangeCashIn += recv; else uRangeCardIn += recv;
                 leftTable.push({ d, amt: recv, rem: getRemarks(r), cat: gV(r, ["systemuniqueid", "sysuid"])||'Customer', usr: secVal });
              }
           }
        });

        if (rIncT.success) rIncT.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let recv = gF(r, ["receivedamount", "receivedamt"]);
              uLifeCashIn += recv;
              if(inRange && recv !== 0) { uRangeCashIn += recv; leftTable.push({ d, amt: recv, rem: getRemarks(r), cat: 'Income Log', usr: secVal }); }
           }
        });

        if (rCrdT.success) rCrdT.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let recv = gF(r, ["receivedamount", "receivedamt"]);
              let ret = Math.abs(gF(r, ["returnamount", "returnamt"])); 
              
              uLifeCashIn += recv; uLifeCashOut += ret;
              if(inRange && recv !== 0) { uRangeCashIn += recv; leftTable.push({ d, amt: recv, rem: getRemarks(r), cat: 'Creditor Loan', usr: secVal }); }
              if(inRange && ret !== 0) { uRangeCashOut += ret; rightTable.push({ d, amt: ret, rem: getRemarks(r), cat: 'Creditor Return', usr: secVal }); }
           }
        });

        if (rExp.success) rExp.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let paid = Math.abs(gF(r, ["paidamt", "paidamount", "amount", "deposit"]));
              uLifeCashOut += paid;
              if(inRange && paid !== 0) { uRangeCashOut += paid; rightTable.push({ d, amt: paid, rem: getRemarks(r), cat: 'Expense Txn', usr: secVal }); }
           }
        });

        if (rHrT.success) rHrT.records.forEach(r => {
           if (iU(r) && cln(gV(r, ["category"])).includes("paid")) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let paid = Math.abs(gF(r, ["amount"]));
              uLifeCashOut += paid;
              if(inRange && paid !== 0) { uRangeCashOut += paid; rightTable.push({ d, amt: paid, rem: getRemarks(r), cat: 'HR Salary Txn', usr: secVal }); }
           }
        });

        if (rSupT.success) rSupT.records.forEach(r => {
           if (iU(r) && cln(gV(r, ["category"])).includes("paid")) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let paid = Math.abs(gF(r, ["amount"]));
              uLifeCashOut += paid;
              if(inRange && paid !== 0) { uRangeCashOut += paid; rightTable.push({ d, amt: paid, rem: getRemarks(r), cat: 'Supplier Payment', usr: secVal }); }
           }
        });

        if (rInt.success) rInt.records.forEach(r => {
           if (iU(r)) {
              let dStr = gV(r, ["date"]); if(!dStr) return; 
              let d = new Date(dStr); let inRange = (d >= fDate && d <= tDate);
              let amt = Math.abs(gF(r, ["transferamount", "amount"]));
              uLifeCashOut += amt; uLifeTransfer += amt;
              if(inRange && amt !== 0) { uRangeCashOut += amt; uRangeTransfer += amt; rightTable.push({ d, amt, rem: getRemarks(r), cat: 'Internal Transfer', usr: secVal }); }
           }
        });

        let uLiveCashBalance = uLifeCashIn - uLifeCashOut;
        let uBColor = uLiveCashBalance >= 0 ? "text-emerald-600" : "text-red-600";

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-6">
             <div class="flex flex-wrap justify-between border-b border-gray-100 pb-4">
                <div class="text-left w-1/4"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeSold')}</div><div class="text-2xl font-black text-blue-600 font-mono mt-1">SAR ${uLifeSold.toFixed(2)}</div></div>
                <div class="text-left w-1/4 border-l pl-4 border-gray-100"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeCollections')}</div><div class="text-[10px] font-bold text-gray-500 mt-2">${t('report.cashInLabel')} <span class="text-emerald-500 text-sm ml-1">${uLifeCashIn.toFixed(2)}</span></div><div class="text-[10px] font-bold text-gray-500 mt-1">${t('report.cardInLabel')} <span class="text-purple-500 text-sm ml-1">${uLifeCardIn.toFixed(2)}</span></div></div>
                <div class="text-left w-1/4 border-l pl-4 border-gray-100"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.transferredToAdmin')}</div><div class="text-2xl font-black text-teal-600 font-mono mt-1">SAR ${uLifeTransfer.toFixed(2)}</div></div>
                <div class="text-right w-1/4 border-l pl-4 border-gray-100"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.currentUserCashBalance')}</div><div class="text-3xl font-black ${uBColor} font-mono mt-1">SAR ${uLiveCashBalance.toFixed(2)}</div><div class="text-[9px] text-gray-400 mt-1 uppercase leading-tight">${t('report.autoAdjustHint')}</div></div>
             </div>
             <div class="flex justify-around bg-gray-50 p-4 rounded-lg">
                <div class="text-center"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeSold')}</div><div class="text-lg font-bold text-blue-500 font-mono mt-1">SAR ${uRangeSold.toFixed(2)}</div></div>
                <div class="text-center border-l border-r px-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCashIn')}</div><div class="text-lg font-bold text-emerald-500 font-mono mt-1">SAR ${uRangeCashIn.toFixed(2)}</div></div>
                <div class="text-center border-r pr-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeCardIn')}</div><div class="text-lg font-bold text-purple-500 font-mono mt-1">SAR ${uRangeCardIn.toFixed(2)}</div></div>
                <div class="text-center border-r pr-8 border-gray-200"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeOutSpent')}</div><div class="text-lg font-bold text-red-500 font-mono mt-1">SAR ${uRangeCashOut.toFixed(2)}</div></div>
                <div class="text-center"><div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeTransferredAdmin')}</div><div class="text-lg font-bold text-teal-500 font-mono mt-1">SAR ${uRangeTransfer.toFixed(2)}</div></div>
             </div>
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        tableContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-blue-50 text-blue-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-blue-100 text-center">${t('report.userCollectionsLedger')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colCategoryUid')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${leftTable.length > 0 ? leftTable.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(s => `<tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(s.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-emerald-600 whitespace-nowrap">${Number(s.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[100px]" title="${s.rem}">${s.rem}</td><td class="p-2.5 font-mono text-[10px] text-gray-500">${s.cat}</td><td class="p-2.5">${s.usr}</td></tr>`).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noCollectionsInRange')}</td></tr>`}
                     </tbody>
                  </table></div></div>
             <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <div class="bg-red-50 text-red-800 font-bold p-3 uppercase tracking-wider text-xs border-b border-red-100 text-center">${t('report.userExpendituresLedger')}</div>
                <div class="erp-report-ledger-wrap overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-gray-50 text-gray-500 border-b"><tr><th class="p-2.5 font-semibold">${t('col.date')}</th><th class="p-2.5 font-semibold">${t('col.amount')}</th><th class="p-2.5 font-semibold">${t('col.remarks')}</th><th class="p-2.5 font-semibold">${t('report.colCategory')}</th><th class="p-2.5 font-semibold">${t('report.colUser')}</th></tr></thead>
                     <tbody class="divide-y divide-gray-100">
                        ${rightTable.length > 0 ? rightTable.sort((a,b)=> new Date(b.d) - new Date(a.d)).map(p => `<tr class="hover:bg-gray-50"><td class="p-2.5 whitespace-nowrap">${new Date(p.d).toLocaleDateString()}</td><td class="p-2.5 font-mono font-bold text-red-600 whitespace-nowrap">${Number(p.amt).toFixed(2)}</td><td class="p-2.5 truncate max-w-[100px]" title="${p.rem}">${p.rem}</td><td class="p-2.5 font-bold text-[10px] ${p.cat === 'Internal Transfer' ? 'text-teal-600' : 'text-gray-700'}">${p.cat}</td><td class="p-2.5">${p.usr}</td></tr>`).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('report.noSpendsTransfers')}</td></tr>`}
                     </tbody>
                  </table></div></div>
          </div>
        `;
        break;
      }

      // ----------------------------------------------------
      case 'expense_report': {
        titleEl.textContent = t('report.titleExpenseReport');
        tgtEl.textContent = t('report.allExpenseHeadsTarget');

        const txns = rExp.success && Array.isArray(rExp.records) ? rExp.records : [];
        const heads = rExpHeads.success && Array.isArray(rExpHeads.records) ? rExpHeads.records : [];

        const lifeTotals = accumulateExpenseTxnAmounts(txns, null, null, null, null);
        const rngTotals = accumulateExpenseTxnAmounts(txns, null, null, fDate, tDate);

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 flex flex-col bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-2 gap-4">
             <div class="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">${t('report.lifetimeSummary')}</div>
             <div class="flex flex-wrap justify-between border-b border-gray-100 pb-4">
                <div class="text-left w-full sm:w-1/3 mb-3 sm:mb-0">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.totalIncurredDeposit')}</div>
                   <div class="text-2xl md:text-3xl font-black text-blue-600 font-mono mt-1">SAR ${lifeTotals.inc.toFixed(2)}</div>
                </div>
                <div class="text-left sm:text-center w-full sm:w-1/3 mb-3 sm:mb-0 sm:border-l sm:border-gray-100 sm:pl-4">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.lifetimeTotalPaid')}</div>
                   <div class="text-2xl md:text-3xl font-black text-emerald-600 font-mono mt-1">SAR ${lifeTotals.paid.toFixed(2)}</div>
                </div>
                <div class="text-left sm:text-right w-full sm:w-1/3 sm:border-l sm:border-gray-100 sm:pl-4">
                   <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.colBalance')}</div>
                   <div class="text-2xl md:text-3xl font-black ${lifeTotals.due > 0 ? 'text-red-600' : 'text-emerald-600'} font-mono mt-1">SAR ${lifeTotals.due.toFixed(2)}</div>
                </div>
             </div>
             <div class="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 pt-1">${t('report.selectedDateRangeSummary')}</div>
             <div class="flex flex-wrap justify-around bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div class="text-center px-2"><div class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeIncurred')}</div><div class="text-lg font-bold text-blue-700 font-mono mt-1">SAR ${rngTotals.inc.toFixed(2)}</div></div>
                <div class="text-center px-2 border-l border-blue-200"><div class="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangePaid')}</div><div class="text-lg font-bold text-emerald-700 font-mono mt-1">SAR ${rngTotals.paid.toFixed(2)}</div></div>
                <div class="text-center px-2 border-l border-blue-200"><div class="text-red-600 text-[10px] font-bold uppercase tracking-wider">${t('report.rangeDue')}</div><div class="text-lg font-bold ${rngTotals.due > 0 ? 'text-red-700' : 'text-emerald-700'} font-mono mt-1">SAR ${rngTotals.due.toFixed(2)}</div></div>
             </div>
          </div>
        `;
        cardsEl.className = "grid grid-cols-1 mb-6";

        const listRows = heads.map((rec) => {
          const mainHead = getCol(rec, ["Expense Parent Head", "Parent Head", "Main Head", "Parent Category"]) || '';
          const subHead = getCol(rec, ["Sub Head Name", "Sub Head", "SubCategory"]) || '';
          const totals = accumulateExpenseTxnAmounts(
            txns,
            mainHead.trim().toUpperCase(),
            subHead.trim().toUpperCase(),
            fDate,
            tDate
          );
          return { mainHead, subHead, ...totals };
        }).filter((row) => row.inc > 0 || row.paid > 0).sort((a, b) => {
          const cmp = String(a.mainHead).localeCompare(String(b.mainHead));
          return cmp !== 0 ? cmp : String(a.subHead).localeCompare(String(b.subHead));
        });

        tableContainer.innerHTML = `
          <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <div class="bg-slate-800 text-white font-bold p-3 uppercase tracking-wider text-xs text-center">${t('report.expenseHeadSummary')}</div>
            <div class="erp-report-scroll overflow-x-auto">
              <table class="erp-report-table w-full text-left border-collapse text-xs">
                <thead class="bg-gray-100 text-gray-600 uppercase border-b whitespace-nowrap">
                  <tr>
                    <th class="p-2.5 w-12 text-center">${t('report.colSl')}</th>
                    <th class="p-2.5">${t('report.colParentHead')}</th>
                    <th class="p-2.5">${t('report.colSubHead')}</th>
                    <th class="p-2.5 text-right">${t('report.colTotalIncurred')}</th>
                    <th class="p-2.5 text-right">${t('report.colTotalPaid')}</th>
                    <th class="p-2.5 text-right">${t('report.colBalance')}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 text-gray-700">
                  ${listRows.length > 0 ? listRows.map((row, i) => `
                    <tr class="hover:bg-gray-50">
                      <td class="p-2.5 text-center text-gray-400 font-mono">${i + 1}</td>
                      <td class="p-2.5 font-bold text-gray-900">${row.mainHead || '-'}</td>
                      <td class="p-2.5 text-blue-600 font-medium">${row.subHead || '-'}</td>
                      <td class="p-2.5 text-right font-mono font-bold text-blue-600">${row.inc.toFixed(2)}</td>
                      <td class="p-2.5 text-right font-mono font-bold text-emerald-600">${row.paid.toFixed(2)}</td>
                      <td class="p-2.5 text-right font-mono font-bold ${row.due > 0 ? 'text-red-600' : 'text-emerald-600'}">${row.due.toFixed(2)}</td>
                    </tr>
                  `).join('') : `<tr><td colspan="6" class="p-6 text-center text-gray-400 font-bold">${heads.length > 0 ? t('report.noExpenseActivity') : t('report.noExpenseHeadsConfigured')}</td></tr>`}
                </tbody>
                ${listRows.length > 0 ? `
                <tfoot class="bg-gray-50 border-t-2 border-gray-200 font-bold">
                  <tr>
                    <td class="p-2.5 text-right uppercase text-[10px] text-gray-500" colspan="3">${t('report.grandTotalRange')}</td>
                    <td class="p-2.5 text-right font-mono text-blue-700">${rngTotals.inc.toFixed(2)}</td>
                    <td class="p-2.5 text-right font-mono text-emerald-700">${rngTotals.paid.toFixed(2)}</td>
                    <td class="p-2.5 text-right font-mono ${rngTotals.due > 0 ? 'text-red-700' : 'text-emerald-700'}">${rngTotals.due.toFixed(2)}</td>
                  </tr>
                </tfoot>` : ''}
              </table>
            </div>
          </div>
        `;
        break;
      }

      // ====================================================================
      // CUSTOMER DUE / BALANCE REPORT (BY USER, OUTSTANDING INVOICES ONLY)
      // ====================================================================
      case 'customer_due_balance': {
        titleEl.textContent = t('report.titleCustomerDueBalance');
        tgtEl.textContent = secText && secVal ? t('report.targetUserSales', { name: secText }) : '';

        const clnUser = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const isUserMatch = (rec) => clnUser(getCol(rec, ["Username", "Logged By", "Created By"])) === clnUser(secVal);

        const rows = [];
        if (rCust.success && Array.isArray(rCust.records)) {
          rCust.records.filter(isUserMatch).forEach((rec) => {
            const uid = getCol(rec, ["System Unique ID", "Sys UID", "UNIQUEID"]) || '-';
            const name = getCol(rec, ["Customer Name", "Name"]) || '-';
            const memo = getCol(rec, ["Invoice", "Memo", "Invoice / Memo Number"]) || '-';
            const user = getCol(rec, ["Username", "Logged By", "Created By"]) || secText || '-';
            const dateStr = getCol(rec, ["Creation Stamp", "Timestamp", "Date"]);
            const d = dateStr ? new Date(dateStr) : new Date();

            if (useDateFilter && (d < fDate || d > tDate)) return;

            const sell = parseFloat(getCol(rec, ["Total Sell", "Sell Amount", "Gross Sell"])) || 0;
            const cash = parseFloat(getCol(rec, ["Cash Amt", "Cash Amount", "Cash"])) || 0;
            const card = parseFloat(getCol(rec, ["Card Amt", "Card Amount", "Card"])) || 0;
            const discount = parseFloat(getCol(rec, ["Discount", "Discount Allowed"])) || 0;
            let received = cash + card;
            if (received === 0) {
              received = parseFloat(getCol(rec, ["Received Amount", "Total Received", "Received"])) || 0;
            }
            let due = sell - received - discount;
            if (due <= 0.009) {
              due = parseFloat(getCol(rec, ["Due Balance", "Due", "Outstanding Balance Due"])) || 0;
            }
            if (due <= 0.009) return;

            rows.push({
              d,
              uid,
              name,
              memo,
              user,
              sell,
              received,
              cash,
              card,
              due,
              idLabel: `${uid} | ${name} | Inv: ${memo} | ${d.toLocaleDateString()} | ${user}`
            });
          });
        }

        rows.sort((a, b) => b.d - a.d);

        const sum = rows.reduce((acc, r) => {
          acc.count += 1;
          acc.billed += r.sell;
          acc.received += r.received;
          acc.cash += r.cash;
          acc.card += r.card;
          acc.due += r.due;
          return acc;
        }, { count: 0, billed: 0, received: 0, cash: 0, card: 0, due: 0 });

        cardsEl.innerHTML = `
          <div class="col-span-1 md:col-span-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 bg-white border border-gray-200 p-4 md:p-5 rounded-xl shadow-sm mb-2">
            <div class="text-center md:text-left">
              <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.summaryInvoicesDue')}</div>
              <div class="text-2xl font-black text-slate-800 font-mono mt-1">${sum.count}</div>
            </div>
            <div class="text-center md:text-left border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-3">
              <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.summaryTotalBilled')}</div>
              <div class="text-xl font-black text-blue-600 font-mono mt-1 break-all">SAR ${sum.billed.toFixed(2)}</div>
            </div>
            <div class="text-center md:text-left border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-3">
              <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.summaryTotalReceived')}</div>
              <div class="text-xl font-black text-emerald-600 font-mono mt-1 break-all">SAR ${sum.received.toFixed(2)}</div>
            </div>
            <div class="text-center md:text-left border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-3">
              <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.summaryCashReceived')}</div>
              <div class="text-xl font-black text-emerald-700 font-mono mt-1 break-all">SAR ${sum.cash.toFixed(2)}</div>
            </div>
            <div class="text-center md:text-left border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-3">
              <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.summaryCardReceived')}</div>
              <div class="text-xl font-black text-purple-600 font-mono mt-1 break-all">SAR ${sum.card.toFixed(2)}</div>
            </div>
            <div class="text-center md:text-left border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-3">
              <div class="text-gray-500 text-[10px] font-bold uppercase tracking-wider">${t('report.summaryTotalDue')}</div>
              <div class="text-xl font-black text-red-600 font-mono mt-1 break-all">SAR ${sum.due.toFixed(2)}</div>
            </div>
          </div>
        `;
        cardsEl.className = 'grid grid-cols-1 mb-6';

        tableContainer.innerHTML = `
          <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <div class="bg-red-50 text-red-900 font-bold p-3 uppercase tracking-wider text-xs border-b border-red-100 text-center">
              ${t('report.customerDueLedger')} ${useDateFilter ? t('report.selectedRange') : t('report.allTime')}
            </div>
            <div class="erp-report-scroll erp-report-ledger-wrap overflow-x-auto">
              <table class="erp-report-table w-full text-left border-collapse text-xs">
                <thead class="bg-slate-800 text-white uppercase whitespace-nowrap">
                  <tr>
                    <th class="p-2.5 w-12 text-center">${t('report.colSl')}</th>
                    <th class="p-2.5 min-w-[220px]">${t('report.colCustomerIdName')}</th>
                    <th class="p-2.5 text-right">${t('report.colBilledAmount')}</th>
                    <th class="p-2.5 text-right">${t('report.colReceivedAmount')}</th>
                    <th class="p-2.5 text-right">${t('report.colCashReceived')}</th>
                    <th class="p-2.5 text-right">${t('report.colCardReceived')}</th>
                    <th class="p-2.5 text-right">${t('report.colIndividualDue')}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 text-gray-700">
                  ${rows.length > 0 ? rows.map((row, i) => `
                    <tr class="hover:bg-gray-50">
                      <td class="p-2.5 text-center text-gray-400 font-mono">${i + 1}</td>
                      <td class="p-2.5 font-medium leading-snug">
                        <div class="font-mono text-[10px] text-gray-500 break-all">${row.uid}</div>
                        <div class="font-bold text-gray-900">${row.name}</div>
                        <div class="text-[10px] text-gray-600">${t('col.memo')}: ${row.memo} · ${row.d.toLocaleDateString()} · ${row.user}</div>
                      </td>
                      <td class="p-2.5 text-right font-mono font-bold text-blue-600">${row.sell.toFixed(2)}</td>
                      <td class="p-2.5 text-right font-mono font-bold text-emerald-600">${row.received.toFixed(2)}</td>
                      <td class="p-2.5 text-right font-mono text-emerald-700">${row.cash.toFixed(2)}</td>
                      <td class="p-2.5 text-right font-mono text-purple-600">${row.card.toFixed(2)}</td>
                      <td class="p-2.5 text-right font-mono font-bold text-red-600">${row.due.toFixed(2)}</td>
                    </tr>
                  `).join('') : `<tr><td colspan="7" class="p-8 text-center text-gray-400 font-bold">${t('report.noCustomerDueForUser')}</td></tr>`}
                </tbody>
                ${rows.length > 0 ? `
                <tfoot class="bg-gray-50 border-t-2 border-gray-200 font-bold">
                  <tr>
                    <td class="p-2.5 text-right uppercase text-[10px] text-gray-500" colspan="2">${t('report.grandTotal')}</td>
                    <td class="p-2.5 text-right font-mono text-blue-700">${sum.billed.toFixed(2)}</td>
                    <td class="p-2.5 text-right font-mono text-emerald-700">${sum.received.toFixed(2)}</td>
                    <td class="p-2.5 text-right font-mono text-emerald-800">${sum.cash.toFixed(2)}</td>
                    <td class="p-2.5 text-right font-mono text-purple-700">${sum.card.toFixed(2)}</td>
                    <td class="p-2.5 text-right font-mono text-red-700">${sum.due.toFixed(2)}</td>
                  </tr>
                </tfoot>` : ''}
              </table>
            </div>
          </div>
        `;
        break;
      }

      default:
        tBody.innerHTML = `<tr><td class="p-6 text-center text-red-500 font-bold">${t('report.underConstruction')}</td></tr>`;
    }

    await finalizeReportPrintLayout({
      title: titleEl?.textContent || t('report.reportName'),
      dateRange: dateEl?.textContent || '',
      target: tgtEl?.textContent || ''
    });

  } catch (err) {
    console.error(err);
    tBody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-red-500 font-bold">${t('alert.errorGenerate')}</td></tr>`;
  }
}
