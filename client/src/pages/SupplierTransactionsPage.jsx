import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCategoryLabel } from '../../../js/i18n.js';
import ModuleLedgerLayout from '../components/ModuleLedgerLayout.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { createRecord, fetchSupplierModuleData } from '../services/dataService.js';
import TxnLedgerActions from '../components/TxnLedgerActions.jsx';
import {
  computeSupplierRemainingDue,
  computeSupplierTxnDueValue,
  fmtMoney,
  getCol,
  getSupplierDueBalance,
  getSupplierName,
  getSupplierTxnCategory,
  getSupplierTxnCategoryColor,
  parseSupplierTxnDue
} from '../lib/supplierEngine.js';
import { parseMoneyInput, preventNumberWheelScroll } from '../lib/recordHelpers.js';
import { parseSupplierTxnAmounts } from '../lib/txnParsers.js';
import { defaultDateRange, filterRecordsByDateRange, parseRecordDate } from '../lib/hrEngine.js';
import { userCanEditModule } from '../utils/userSession.js';

const TXN_CATEGORIES = [
  { value: 'Purchase', labelKey: 'category.purchaseIncreases' },
  { value: 'Payment Paid', labelKey: 'category.paymentDecreases' },
  { value: 'Previous Due', labelKey: 'category.previousDue' }
];

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

export default function SupplierTransactionsPage({ user, onDataChange }) {
  const { t } = useI18n();
  const canEdit = userCanEditModule(user, 'supplier_transactions');
  const [supplierRecords, setSupplierRecords] = useState([]);
  const [supplierTxns, setSupplierTxns] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ledgerLoaded, setLedgerLoaded] = useState(false);

  const defaults = defaultDateRange();
  const [txnDate, setTxnDate] = useState(todayIso());
  const [category, setCategory] = useState('Purchase');
  const [supplier, setSupplier] = useState('');
  const [purchase, setPurchase] = useState('0.00');
  const [discount, setDiscount] = useState('0.00');
  const [paid, setPaid] = useState('0.00');
  const [remarks, setRemarks] = useState('');
  const [filterFrom, setFilterFrom] = useState(defaults.from);
  const [filterTo, setFilterTo] = useState(defaults.to);

  const [currentDue, setCurrentDue] = useState(0);
  const [showDueInfo, setShowDueInfo] = useState(false);

  const isPrev = category === 'Previous Due';
  const isPay = category === 'Payment Paid';

  const loadData = useCallback(async () => {
    try {
      const data = await fetchSupplierModuleData();
      setSupplierRecords(data.supplierRecords);
      setSupplierTxns(data.supplierTxns);
    } catch (err) {
      console.error('Failed to load supplier data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const supplierOptions = useMemo(() => {
    let active = supplierRecords.filter((s) => {
      const st = getCol(s, ['Status']) || s['Status'];
      return st !== 'Inactive';
    });
    if (isPay) {
      active = active.filter((sup) => getSupplierDueBalance(sup, supplierTxns) > 0.009);
    }
    return active.map((sup) => {
      const name = getSupplierName(sup);
      const due = getSupplierDueBalance(sup, supplierTxns);
      return { name, due };
    });
  }, [supplierRecords, supplierTxns, isPay]);

  const txnDue = useMemo(
    () => parseSupplierTxnDue(purchase, discount, paid),
    [purchase, discount, paid]
  );

  const remainingDue = useMemo(
    () => computeSupplierRemainingDue(currentDue, purchase, discount, paid),
    [currentDue, purchase, discount, paid]
  );

  const filteredTxns = useMemo(() => {
    if (!ledgerLoaded) return [];
    const filtered = filterRecordsByDateRange(supplierTxns, filterFrom, filterTo);
    return filtered ? [...filtered].reverse() : [];
  }, [supplierTxns, filterFrom, filterTo, ledgerLoaded]);

  const resetDueInfo = () => {
    setCurrentDue(0);
    setShowDueInfo(false);
  };

  const resetAmountFields = (nextCategory) => {
    if (nextCategory === 'Previous Due') {
      setDiscount('0.00');
      setPaid('0.00');
    } else if (nextCategory === 'Payment Paid') {
      setPurchase('0.00');
      setDiscount('0.00');
    }
  };

  const handleCategoryChange = (nextCat) => {
    setCategory(nextCat);
    setSupplier('');
    resetDueInfo();
    resetAmountFields(nextCat);
  };

  const handleSupplierChange = (name) => {
    setSupplier(name);
    if (!name) {
      resetDueInfo();
      return;
    }
    const rec = supplierRecords.find((r) => getSupplierName(r) === name);
    const due = getSupplierDueBalance(rec, supplierTxns);
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
      let purchaseVal = parseMoneyInput(purchase);
      let discountVal = parseMoneyInput(discount);
      let paidVal = parseMoneyInput(paid);

      if (category === 'Previous Due') {
        discountVal = 0;
        paidVal = 0;
        if (!remarksText.toLowerCase().includes('previous due')) {
          remarksText = remarksText ? `Previous Due - ${remarksText}` : 'Previous Due';
        }
      } else if (category === 'Payment Paid') {
        purchaseVal = 0;
        discountVal = 0;
        paidVal = paidVal || purchaseVal;
      }

      const dueVal = computeSupplierTxnDueValue(category, purchaseVal, discountVal, paidVal);
      const rowPayload = [
        txnDate,
        supplier,
        purchaseVal,
        discountVal,
        paidVal,
        dueVal,
        category,
        remarksText,
        user.username,
        new Date().toLocaleString()
      ];

      const result = await createRecord('Supplier_Transactions', rowPayload);
      alert(result.message || (result.success ? 'Transaction saved.' : 'Failed to save.'));
      if (result.success) {
        setTxnDate(todayIso());
        setCategory('Purchase');
        setSupplier('');
        setPurchase('0.00');
        setDiscount('0.00');
        setPaid('0.00');
        setRemarks('');
        resetDueInfo();
        await loadData();
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
    <form id="form-sup-txn-entry" className="space-y-4 text-xs" onSubmit={handleSubmit}>
      <div>
        <label className="block font-bold text-gray-600 mb-1">{t('field.transactionDate')}</label>
        <input
          type="date"
          id="sup-txn-date"
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
          id="sup-txn-category"
          required
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-2 bg-white text-sm outline-none"
        >
          {TXN_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {t(cat.labelKey)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-1">{t('field.supplierName')}</label>
        <select
          id="sup-txn-supplier"
          required
          value={supplier}
          onChange={(e) => handleSupplierChange(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-2 bg-white text-sm outline-none"
        >
          <option value="">{t('dropdown.chooseSupplier')}</option>
          {supplierOptions.length === 0 ? (
            <option value="" disabled>
              {isPay ? t('dropdown.noSuppliersWithDue') : t('dropdown.noSuppliersRegistry')}
            </option>
          ) : (
            supplierOptions.map((opt) => (
              <option key={opt.name} value={opt.name}>
                {opt.name} — {t('col.dueBalance')}: {fmtMoney(opt.due)}
              </option>
            ))
          )}
        </select>
      </div>

      <div
        id="sup-txn-due-info"
        className={`${showDueInfo ? '' : 'hidden'} bg-red-50 border border-red-100 rounded-lg p-3 space-y-1.5`}
      >
        <div className="flex justify-between items-center gap-2">
          <span className="font-bold text-red-800 text-[11px] uppercase">{t('field.currentAccountDue')}</span>
          <span id="sup-txn-current-due" className="font-mono font-black text-red-700 text-sm">
            {fmtMoney(currentDue)}
          </span>
        </div>
        <div className="flex justify-between items-center gap-2 border-t border-red-100 pt-1.5">
          <span className="font-bold text-gray-600 text-[11px] uppercase">{t('field.remainingDueAfterTxn')}</span>
          <span id="sup-txn-remaining-due" className="font-mono font-bold text-orange-700 text-sm">
            {fmtMoney(remainingDue)}
          </span>
        </div>
      </div>

      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
        <div>
          <label className="block font-bold text-gray-700 mb-1">{t('field.purchaseAmount')}</label>
          <input
            type="number"
            step="0.01"
            id="sup-txn-purchase"
            min="0"
            value={purchase}
            onChange={(e) => setPurchase(e.target.value)}
            onWheel={preventNumberWheelScroll}
            readOnly={isPay}
            disabled={!canEdit}
            className="w-full border border-gray-200 rounded p-2 text-sm font-bold font-mono outline-none"
          />
        </div>
        <div>
          <label className="block font-bold text-purple-700 mb-1">{t('field.discountAllowed')}</label>
          <input
            type="number"
            step="0.01"
            id="sup-txn-discount"
            min="0"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            onWheel={preventNumberWheelScroll}
            readOnly={isPrev || isPay}
            disabled={!canEdit}
            className="w-full border border-gray-200 rounded p-2 text-sm font-mono outline-none"
          />
        </div>
        <div>
          <label className="block font-bold text-emerald-700 mb-1">{t('field.paymentPaidAmount')}</label>
          <input
            type="number"
            step="0.01"
            id="sup-txn-paid"
            min="0"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            onWheel={preventNumberWheelScroll}
            readOnly={isPrev}
            disabled={!canEdit}
            className="w-full border border-gray-200 rounded p-2 text-sm font-bold font-mono outline-none"
          />
        </div>
        <div className="pt-2 border-t border-gray-200">
          <label className="block font-bold text-red-600 mb-1">{t('field.transactionDueBalance')}</label>
          <input
            type="number"
            id="sup-txn-due"
            readOnly
            value={txnDue.toFixed(2)}
            className="w-full border border-gray-200 rounded p-2 text-sm bg-white font-bold text-red-600 outline-none shadow-inner"
          />
        </div>
      </div>

      <div>
        <label className="block font-bold text-gray-600 mb-1">{t('field.remarksReferenceInfo')}</label>
        <textarea
          id="sup-txn-remarks"
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
            id="filter-from-sup"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="w-full border border-gray-200 rounded p-2 outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-gray-600 font-bold mb-1">{t('common.toDate')}</label>
          <input
            type="date"
            id="filter-to-sup"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="w-full border border-gray-200 rounded p-2 outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <button
            id="btn-filter-sup"
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
              <th className="p-2.5">{t('col.supplierName')}</th>
              <th className="p-2.5">{t('field.purchaseAmount')}</th>
              <th className="p-2.5">{t('col.discount')}</th>
              <th className="p-2.5">{t('field.paymentPaidAmount')}</th>
              <th className="p-2.5">{t('col.txnDue')}</th>
              <th className="p-2.5">{t('col.category')}</th>
              <th className="p-2.5">{t('field.remarksReference')}</th>
              <th className="p-2.5">{t('col.loggedBy')}</th>
              <th className="p-2.5">{t('col.systemStamp')}</th>
              <th className="p-2.5 erp-col-actions">{t('col.actions')}</th>
            </tr>
          </thead>
          <tbody id="table-sup-txn-rows" className="divide-y divide-gray-100 text-gray-600 font-medium">
            {!ledgerLoaded ? (
              <tr>
                <td colSpan={11} className="p-6 text-center text-gray-500 italic bg-gray-50 border-dashed border-b border-gray-200">
                  {t('ledger.selectDatesPrompt')}
                </td>
              </tr>
            ) : loadingLedger ? (
              <tr>
                <td colSpan={11} className="p-4 text-center text-blue-500 font-bold">
                  {t('ledger.querying')}
                </td>
              </tr>
            ) : filteredTxns.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-4 text-center text-gray-500 font-bold">
                  {t('ledger.noResultsInRange')}
                </td>
              </tr>
            ) : (
              filteredTxns.map((rec) => {
                const p = parseSupplierTxnAmounts(rec);
                const cat = getSupplierTxnCategory(rec);
                const supName = getSupplierName(rec);
                const txnDateVal = getCol(rec, ['Date', 'Transaction Date']);
                const remarksVal = getCol(rec, ['Remarks', 'Remarks / Reference']) || '-';
                const loggedBy = getCol(rec, ['Username', 'Logged By']) || '';
                const stamp = getCol(rec, ['Timestamp', 'Stamp']) || '';
                const dateStr = txnDateVal ? parseRecordDate(txnDateVal)?.toLocaleDateString() || '' : '';
                const isPrevCat = cat.toLowerCase().includes('previous due');
                const isPayCat = cat.toLowerCase().includes('payment paid');
                const typeLabel = isPrevCat ? 'Previous Due' : isPayCat ? 'Payment Paid' : 'Purchase';
                return (
                  <tr key={rec.ID} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="p-2.5">{dateStr}</td>
                    <td className="p-2.5 font-bold text-gray-900">{supName}</td>
                    <td className="p-2.5 font-mono">{fmtMoney(p.bill)}</td>
                    <td className="p-2.5 font-mono text-purple-600">{fmtMoney(p.discount)}</td>
                    <td className="p-2.5 font-mono font-bold text-emerald-600">{fmtMoney(p.pay)}</td>
                    <td className="p-2.5 font-mono font-bold text-red-600">{fmtMoney(p.txnDue)}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 font-bold rounded text-[10px] ${getSupplierTxnCategoryColor(cat)}`}>
                        {getCategoryLabel(typeLabel, t)}
                      </span>
                    </td>
                    <td className="p-2.5 break-words">
                      {remarksVal}
                    </td>
                    <td className="p-2.5">{loggedBy}</td>
                    <td className="p-2.5 text-gray-400 text-[10px] font-mono">{stamp}</td>
                    <TxnLedgerActions
                      user={user}
                      sheetName="Supplier_Transactions"
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
      title={t('page.supplierTransactions.title')}
      formTitle={t('form.sup.logTransaction')}
      ledgerTitle={t('form.sup.historicalLedger')}
      formContent={formContent}
      ledgerContent={ledgerContent}
    />
  );
}
