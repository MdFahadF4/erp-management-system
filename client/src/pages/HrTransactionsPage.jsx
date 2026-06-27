import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCategoryLabel } from '../../../js/i18n.js';
import ModuleLedgerLayout from '../components/ModuleLedgerLayout.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { createRecord, fetchHrModuleData } from '../services/dataService.js';
import TxnLedgerActions from '../components/TxnLedgerActions.jsx';
import {
  defaultDateRange,
  filterRecordsByDateRange,
  fmtMoney,
  getCol,
  getHrDueBalance,
  getHrEmployeeName,
  getHrTxnCategory,
  getHrTxnCategoryColor,
  getHrTxnDelta,
  parseRecordDate
} from '../lib/hrEngine.js';
import { roundMoney } from '../lib/recordHelpers.js';
import { userCanEditModule } from '../utils/userSession.js';

const TXN_CATEGORIES = ['Salary Earn', 'Salary Paid', 'Salary Increment', 'Previous Due'];

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

export default function HrTransactionsPage({ user, onDataChange }) {
  const { t } = useI18n();
  const canEdit = userCanEditModule(user, 'hr_transactions');
  const [hrRecords, setHrRecords] = useState([]);
  const [hrTxns, setHrTxns] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ledgerLoaded, setLedgerLoaded] = useState(false);

  const defaults = defaultDateRange();
  const [txnDate, setTxnDate] = useState(todayIso());
  const [category, setCategory] = useState('Salary Earn');
  const [employee, setEmployee] = useState('');
  const [amount, setAmount] = useState('0.00');
  const [remarks, setRemarks] = useState('');
  const [filterFrom, setFilterFrom] = useState(defaults.from);
  const [filterTo, setFilterTo] = useState(defaults.to);

  const [currentDue, setCurrentDue] = useState(0);
  const [showDueInfo, setShowDueInfo] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchHrModuleData();
      setHrRecords(data.hrRecords);
      setHrTxns(data.hrTxns);
    } catch (err) {
      console.error('Failed to load HR data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const employeeOptions = useMemo(() => {
    let active = hrRecords.filter((e) => {
      const st = getCol(e, ['Status']) || e['Status'];
      return st !== 'Inactive' && st !== 'Released';
    });
    if (category === 'Salary Paid') {
      active = active.filter((emp) => getHrDueBalance(emp, hrTxns) > 0.009);
    }
    return active.map((emp) => {
      const name = getHrEmployeeName(emp);
      const designation = getCol(emp, ['Designation']) || '-';
      const due = getHrDueBalance(emp, hrTxns);
      return { name, designation, due };
    });
  }, [hrRecords, hrTxns, category]);

  const txnDelta = useMemo(() => getHrTxnDelta(amount, category), [amount, category]);
  const remainingDue = useMemo(
    () => Math.max(0, currentDue + txnDelta),
    [currentDue, txnDelta]
  );

  const filteredTxns = useMemo(() => {
    if (!ledgerLoaded) return [];
    const filtered = filterRecordsByDateRange(hrTxns, filterFrom, filterTo);
    return filtered ? [...filtered].reverse() : [];
  }, [hrTxns, filterFrom, filterTo, ledgerLoaded]);

  const resetDueInfo = () => {
    setCurrentDue(0);
    setShowDueInfo(false);
  };

  const handleCategoryChange = (nextCat) => {
    setCategory(nextCat);
    setEmployee('');
    resetDueInfo();
  };

  const handleEmployeeChange = (name) => {
    setEmployee(name);
    if (!name || category === 'Salary Increment') {
      resetDueInfo();
      return;
    }
    const rec = hrRecords.find(
      (r) => getHrEmployeeName(r).toLowerCase() === name.toLowerCase()
    );
    const due = getHrDueBalance(rec, hrTxns);
    setCurrentDue(due);
    setShowDueInfo(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      alert(t('alert.noPermission'));
      return;
    }
    setSubmitting(true);
    try {
      let remarksText = remarks.trim();
      if (category === 'Previous Due') {
        if (!remarksText.toLowerCase().includes('previous due')) {
          remarksText = remarksText ? `Previous Due - ${remarksText}` : 'Previous Due';
        }
      }
      const rowPayload = [
        txnDate,
        employee,
        roundMoney(parseFloat(amount) || 0),
        category,
        remarksText,
        user.username,
        new Date().toLocaleString()
      ];
      const result = await createRecord('HR_Transactions', rowPayload);
      alert(result.message || (result.success ? 'Transaction saved.' : 'Failed to save.'));
      if (result.success) {
        setTxnDate(todayIso());
        setCategory('Salary Earn');
        setEmployee('');
        setAmount('0.00');
        setRemarks('');
        resetDueInfo();
        await loadData();
        if (ledgerLoaded) setLedgerLoaded(true);
        onDataChange?.();
      }
    } catch {
      alert(t('alert.errorLog'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadLedger = () => {
    if (!filterFrom || !filterTo) {
      alert(t('alert.selectBothDates'));
      return;
    }
    setLoadingLedger(true);
    setLedgerLoaded(true);
    setLoadingLedger(false);
  };

  const handleTxnMutate = async () => {
    await loadData();
    onDataChange?.();
  };

  const formContent = (
    <form id="form-txn-entry" className="space-y-4 text-xs" onSubmit={handleSubmit}>
      <div>
        <label className="block font-bold text-gray-600 mb-1">{t('field.transactionDate')}</label>
        <input
          type="date"
          id="txn-date"
          required
          value={txnDate}
          onChange={(e) => setTxnDate(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-2 text-sm outline-none"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-1">{t('field.categoryClassification')}</label>
        <select
          id="txn-category"
          required
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-2 bg-white text-sm outline-none"
        >
          {TXN_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {getCategoryLabel(cat, t)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-1">{t('field.employeeName')}</label>
        <select
          id="txn-employee"
          required
          value={employee}
          onChange={(e) => handleEmployeeChange(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-2 bg-white text-sm outline-none"
        >
          <option value="">{t('dropdown.chooseEmployee')}</option>
          {employeeOptions.length === 0 ? (
            <option value="" disabled>
              {category === 'Salary Paid' ? t('dropdown.noEmployeesWithDue') : t('dropdown.noEmployees')}
            </option>
          ) : (
            employeeOptions.map((opt) => (
              <option key={opt.name} value={opt.name}>
                {opt.name} ({opt.designation}) — {t('col.dueBalance')}: {fmtMoney(opt.due)}
              </option>
            ))
          )}
        </select>
      </div>

      <div
        id="txn-due-info"
        className={`${showDueInfo ? '' : 'hidden'} bg-red-50 border border-red-100 rounded-lg p-3 space-y-1.5`}
      >
        <div className="flex justify-between items-center gap-2">
          <span className="font-bold text-red-800 text-[11px] uppercase">{t('field.currentAccountDue')}</span>
          <span id="txn-current-due" className="font-mono font-black text-red-700 text-sm">
            {fmtMoney(currentDue)}
          </span>
        </div>
        <div className="flex justify-between items-center gap-2 border-t border-red-100 pt-1.5">
          <span className="font-bold text-gray-600 text-[11px] uppercase">{t('field.remainingDueAfterTxn')}</span>
          <span id="txn-remaining-due" className="font-mono font-bold text-orange-700 text-sm">
            {fmtMoney(remainingDue)}
          </span>
        </div>
      </div>

      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
        <div>
          <label className="block font-bold text-gray-700 mb-1">{t('field.amount')}</label>
          <input
            type="number"
            step="0.01"
            id="txn-amount"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!canEdit}
            className="w-full border border-gray-200 rounded p-2 text-sm font-bold font-mono outline-none"
          />
        </div>
        <p className="text-[10px] text-gray-400 -mt-1">{t('field.hrAmountHint')}</p>
        <div className="pt-2 border-t border-gray-200">
          <label className="block font-bold text-red-600 mb-1">{t('field.transactionDueBalance')}</label>
          <input
            type="number"
            id="txn-delta"
            readOnly
            value={txnDelta.toFixed(2)}
            className="w-full border border-gray-200 rounded p-2 text-sm bg-white font-bold text-red-600 outline-none shadow-inner"
          />
        </div>
      </div>

      <div>
        <label className="block font-bold text-gray-600 mb-1">{t('field.remarksReference')}</label>
        <textarea
          id="txn-remarks"
          rows={2}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          disabled={!canEdit}
          placeholder={t('placeholder.optionalNotes')}
          className="w-full border border-gray-200 rounded p-2 text-sm outline-none"
        />
      </div>

      {canEdit && (
        <button
          type="submit"
          disabled={submitting}
          className="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded text-sm transition disabled:opacity-60"
        >
          {submitting ? t('common.posting') : t('form.postTransaction')}
        </button>
      )}
    </form>
  );

  const ledgerContent = (
    <>
      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 flex flex-wrap items-end gap-3 text-xs shadow-inner">
        <div className="flex-1 min-w-[120px]">
          <label className="block text-gray-600 font-bold mb-1">{t('common.fromDate')}</label>
          <input
            type="date"
            id="filter-from-hr"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="w-full border border-gray-200 rounded p-2 outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-gray-600 font-bold mb-1">{t('common.toDate')}</label>
          <input
            type="date"
            id="filter-to-hr"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="w-full border border-gray-200 rounded p-2 outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <button
            id="btn-filter-hr"
            type="button"
            onClick={handleLoadLedger}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm"
          >
            {t('common.expandLoadLedger')}
          </button>
        </div>
      </div>

      <div className="erp-ledger-wrap overflow-x-auto border border-gray-200 rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-gray-100 font-bold text-gray-600 uppercase border-b border-gray-200 whitespace-nowrap">
            <tr>
              <th className="p-2.5">{t('col.date')}</th>
              <th className="p-2.5">{t('col.employeeName')}</th>
              <th className="p-2.5">{t('col.amount')}</th>
              <th className="p-2.5">{t('col.category')}</th>
              <th className="p-2.5">{t('col.remarks')}</th>
              <th className="p-2.5">{t('col.loggedBy')}</th>
              <th className="p-2.5">{t('col.systemStamp')}</th>
              <th className="p-2.5 erp-col-actions">{t('col.actions')}</th>
            </tr>
          </thead>
          <tbody id="table-txn-rows" className="divide-y divide-gray-100 text-gray-600 font-medium">
            {!ledgerLoaded ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500 italic bg-gray-50 border-dashed border-b border-gray-200">
                  {t('ledger.selectDatesPrompt')}
                </td>
              </tr>
            ) : loadingLedger ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-blue-500 font-bold">
                  {t('ledger.querying')}
                </td>
              </tr>
            ) : filteredTxns.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500 font-bold">
                  {t('ledger.noResultsInRange')}
                </td>
              </tr>
            ) : (
              filteredTxns.map((rec) => {
                const cat = getHrTxnCategory(rec);
                const empName = getCol(rec, ['Employee Name', 'Employee', 'Name']) || '';
                const txnDateVal = getCol(rec, ['Date', 'Transaction Date']);
                const remarksVal = getCol(rec, ['Remarks', 'Remarks / Reference']) || '-';
                const loggedBy = getCol(rec, ['Username', 'Logged By']) || '';
                const stamp = getCol(rec, ['Timestamp', 'Stamp']) || '';
                const amt = parseFloat(getCol(rec, ['Amount', 'Amt', 'Transaction Amount'])) || 0;
                const dateStr = txnDateVal ? parseRecordDate(txnDateVal)?.toLocaleDateString() || '' : '';
                return (
                  <tr key={rec.ID} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="p-2.5">{dateStr}</td>
                    <td className="p-2.5 font-bold text-gray-900">{empName}</td>
                    <td className="p-2.5 font-mono font-bold">{fmtMoney(amt)}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 font-bold rounded ${getHrTxnCategoryColor(cat)}`}>{getCategoryLabel(cat, t)}</span>
                    </td>
                    <td className="p-2.5 break-words">
                      {remarksVal}
                    </td>
                    <td className="p-2.5">{loggedBy}</td>
                    <td className="p-2.5 text-gray-400 text-[10px] font-mono">{stamp}</td>
                    <TxnLedgerActions
                      user={user}
                      sheetName="HR_Transactions"
                      record={rec}
                      onMutate={handleTxnMutate}
                    />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <ModuleLedgerLayout
      title={t('page.hrTransactions.title')}
      formTitle={t('form.logTransaction')}
      ledgerTitle={t('form.txnHistoryLog')}
      formContent={formContent}
      ledgerContent={ledgerContent}
    />
  );
}
