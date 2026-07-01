import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCategoryLabel } from '../../../js/i18n.js';
import ModuleLedgerLayout from '../components/ModuleLedgerLayout.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { resolveModuleText } from '../i18n/moduleI18n.js';
import { createRecord, fetchHeadModuleData } from '../services/dataService.js';
import TxnLedgerActions from '../components/TxnLedgerActions.jsx';
import {
  buildModuleTxnTrackingId,
  computeDualTxnDue,
  computeHeadPairDueBalance,
  computeRemainingHeadDue,
  filterDualTxnsByDate,
  fmtMoney,
  getCol,
  getSubHeadsForMain,
  getUniqueMainHeads,
  parseRecordDate,
  parseTxnDualAmounts,
  prepareDualTxnSubmit
} from '../lib/dualHeadEngine.js';
import { dueAmountClassName } from '../lib/recordHelpers.js';
import { defaultDateRange } from '../lib/hrEngine.js';
import { userCanEditModule } from '../utils/userSession.js';

const TXN_FIELD_LABELS = {
  expense_transactions: {
    bill: 'field.totalDepositIncurred',
    discount: 'field.discountAllowed',
    pay: 'field.actuallyPaidAmount'
  },
  creditor_transactions: {
    bill: 'field.receivedAmountCashIn',
    discount: 'field.discountAllowed',
    pay: 'field.returnAmountCashOut'
  },
  income_transactions: {
    bill: 'field.receivableAmountBilled',
    discount: 'field.discountAllowed',
    pay: 'field.actuallyReceivedCashIn'
  },
  capital_transactions: {
    bill: 'field.capitalInAmount',
    discount: 'field.discountAllowed',
    pay: 'field.capitalOutAmount'
  }
};

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

export default function DualTxnPage({ user, config, onDataChange }) {
  const { t } = useI18n();
  const canEdit = userCanEditModule(user, config.moduleId);
  const fieldLabels = TXN_FIELD_LABELS[config.moduleId] || TXN_FIELD_LABELS.expense_transactions;
  const [heads, setHeads] = useState([]);
  const [txns, setTxns] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [ledgerLoaded, setLedgerLoaded] = useState(false);

  const defaults = defaultDateRange();
  const [txnDate, setTxnDate] = useState(todayIso());
  const [main, setMain] = useState('');
  const [sub, setSub] = useState('');
  const [category, setCategory] = useState(config.categories[0]?.value || '');
  const [bill, setBill] = useState('0.00');
  const [discount, setDiscount] = useState('0.00');
  const [pay, setPay] = useState('0.00');
  const [remarks, setRemarks] = useState('');
  const [filterFrom, setFilterFrom] = useState(defaults.from);
  const [filterTo, setFilterTo] = useState(defaults.to);
  const [currentDue, setCurrentDue] = useState(0);
  const [showDueInfo, setShowDueInfo] = useState(false);

  const loadData = useCallback(async () => {
    const data = await fetchHeadModuleData(config.headSheet, config.txnSheet);
    setHeads(data.heads);
    setTxns(data.txns);
  }, [config.headSheet, config.txnSheet]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const mainOptions = useMemo(() => getUniqueMainHeads(heads, config.fieldMap.main), [heads, config.fieldMap.main]);
  const subOptions = useMemo(
    () => (main ? getSubHeadsForMain(heads, main, config.fieldMap.main, config.fieldMap.sub) : []),
    [heads, main, config.fieldMap]
  );

  const txnDue = useMemo(() => computeDualTxnDue(bill, discount, pay), [bill, discount, pay]);
  const remainingDue = useMemo(
    () => computeRemainingHeadDue(currentDue, bill, discount, pay),
    [currentDue, bill, discount, pay]
  );

  const filteredTxns = useMemo(() => {
    if (!ledgerLoaded) return [];
    const filtered = filterDualTxnsByDate(txns, filterFrom, filterTo);
    return filtered ? [...filtered].reverse() : [];
  }, [txns, filterFrom, filterTo, ledgerLoaded]);

  const catLower = category.toLowerCase();
  const isPrev = catLower.includes('previous due');
  const isPayOnly =
    catLower.includes('paid') || catLower.includes('payment') || catLower.includes('return') || catLower.includes('out');

  const refreshDue = (nextMain, nextSub) => {
    if (!nextMain || !nextSub) {
      setCurrentDue(0);
      setShowDueInfo(false);
      return;
    }
    const due = computeHeadPairDueBalance(nextMain, nextSub, txns, config.fieldMap);
    setCurrentDue(due);
    setShowDueInfo(true);
  };

  const handleMainChange = (value) => {
    setMain(value);
    setSub('');
    setShowDueInfo(false);
    setCurrentDue(0);
  };

  const handleSubChange = (value) => {
    setSub(value);
    refreshDue(main, value);
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    if (value.toLowerCase().includes('previous due')) {
      setDiscount('0');
      setPay('0');
    } else if (
      value.toLowerCase().includes('paid') ||
      value.toLowerCase().includes('payment') ||
      value.toLowerCase().includes('return') ||
      value.toLowerCase().includes('out')
    ) {
      setBill('0');
      setDiscount('0');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      alert(t('alert.noPermission'));
      return;
    }
    const prepared = prepareDualTxnSubmit(category, bill, discount, pay, remarks);
    setSubmitting(true);
    try {
      const txnId = buildModuleTxnTrackingId(config.txnIdPrefix, main, sub, txnDate);
      const rowPayload = [
        txnId,
        txnDate,
        main,
        sub,
        prepared.bill,
        prepared.discount,
        prepared.pay,
        prepared.txnDue,
        prepared.category,
        prepared.remarksText,
        user.username,
        new Date().toLocaleString()
      ];
      const result = await createRecord(config.txnSheet, rowPayload);
      alert(result.message || (result.success ? 'Transaction saved.' : 'Failed.'));
      if (result.success) {
        setTxnDate(todayIso());
        setBill('0.00');
        setDiscount('0.00');
        setPay('0.00');
        setRemarks('');
        setShowDueInfo(false);
        setCurrentDue(0);
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
    setLedgerLoaded(true);
  };

  const handleTxnMutate = async () => {
    await loadData();
    onDataChange?.();
  };

  const formContent = (
    <form className="space-y-4 text-xs" onSubmit={handleSubmit}>
      <div>
        <label className="block font-bold text-gray-600 mb-1">{t('field.transactionDate')}</label>
        <input type="date" required value={txnDate} onChange={(e) => setTxnDate(e.target.value)} disabled={!canEdit} className="w-full border border-gray-200 rounded p-2 text-sm outline-none" />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-1">{t('col.category')}</label>
        <select required value={category} onChange={(e) => handleCategoryChange(e.target.value)} disabled={!canEdit} className="w-full border border-gray-200 rounded p-2 bg-white text-sm outline-none">
          {config.categories.map((c) => (
            <option key={c.value} value={c.value}>
              {getCategoryLabel(c.value, t) || c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-1">{t('col.parentCategory')}</label>
        <select required value={main} onChange={(e) => handleMainChange(e.target.value)} disabled={!canEdit} className="w-full border border-gray-200 rounded p-2 bg-white text-sm outline-none">
          <option value="">{t('dropdown.chooseCategory')}</option>
          {mainOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-1">{t('col.subHead')}</label>
        <select required value={sub} onChange={(e) => handleSubChange(e.target.value)} disabled={!canEdit || !main} className="w-full border border-gray-200 rounded p-2 bg-white text-sm outline-none">
          <option value="">{t('dropdown.chooseSubHead')}</option>
          {subOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className={`${showDueInfo ? '' : 'hidden'} bg-red-50 border border-red-100 rounded-lg p-3 space-y-1.5`}>
        <div className="flex justify-between items-center gap-2">
          <span className="font-bold text-red-800 text-[11px] uppercase">{t('field.currentAccountDue')}</span>
          <span className={`font-mono font-black text-sm ${dueAmountClassName(currentDue)}`}>{fmtMoney(currentDue)}</span>
        </div>
        <div className="flex justify-between items-center gap-2 border-t border-red-100 pt-1.5">
          <span className="font-bold text-gray-600 text-[11px] uppercase">{t('field.remainingDueAfterTxn')}</span>
          <span className={`font-mono font-bold text-sm ${dueAmountClassName(remainingDue)}`}>{fmtMoney(remainingDue)}</span>
        </div>
      </div>

      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
        <div>
          <label className="block font-bold text-gray-700 mb-1">{t(fieldLabels.bill)}</label>
          <input type="number" step="0.01" min="0" value={bill} onChange={(e) => setBill(e.target.value)} readOnly={isPayOnly} disabled={!canEdit} className="w-full border border-gray-200 rounded p-2 text-sm font-bold font-mono outline-none" />
        </div>
        <div>
          <label className="block font-bold text-purple-700 mb-1">{t(fieldLabels.discount)}</label>
          <input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} readOnly={isPrev || isPayOnly} disabled={!canEdit} className="w-full border border-gray-200 rounded p-2 text-sm font-mono outline-none" />
        </div>
        <div>
          <label className="block font-bold text-emerald-700 mb-1">{t(fieldLabels.pay)}</label>
          <input type="number" step="0.01" min="0" value={pay} onChange={(e) => setPay(e.target.value)} readOnly={isPrev} disabled={!canEdit} className="w-full border border-gray-200 rounded p-2 text-sm font-mono outline-none" />
        </div>
        <div className="pt-2 border-t border-gray-200">
          <label className="block font-bold text-red-600 mb-1">{t('field.transactionDueBalance')}</label>
          <input type="number" readOnly value={txnDue.toFixed(2)} className={`w-full border border-gray-200 rounded p-2 text-sm bg-white font-bold outline-none ${dueAmountClassName(txnDue)}`} />
        </div>
      </div>

      <div>
        <label className="block font-bold text-gray-600 mb-1">{t('field.remarksReference')}</label>
        <textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} disabled={!canEdit} className="w-full border border-gray-200 rounded p-2 text-sm outline-none" />
      </div>

      {canEdit && (
        <button type="submit" disabled={submitting} className="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded text-sm transition disabled:opacity-60">
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
          <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-full border border-gray-200 rounded p-2 outline-none" />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-gray-600 font-bold mb-1">{t('common.toDate')}</label>
          <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-full border border-gray-200 rounded p-2 outline-none" />
        </div>
        <div>
          <button type="button" onClick={handleLoadLedger} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm">
            {t('common.expandLoadLedger')}
          </button>
        </div>
      </div>

      <div className="erp-ledger-wrap overflow-x-auto border border-gray-200 rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-gray-100 font-bold text-gray-600 uppercase border-b border-gray-200 whitespace-nowrap">
            <tr>
              <th className="p-2.5">{t('col.date')}</th>
              <th className="p-2.5">{t('col.trackingId')}</th>
              <th className="p-2.5">{t('col.parentCategory')}</th>
              <th className="p-2.5">{t('col.subHead')}</th>
              <th className="p-2.5">{t('col.deposit')}</th>
              <th className="p-2.5">{t('col.discount')}</th>
              <th className="p-2.5">{t('col.paidAmt')}</th>
              <th className="p-2.5">{t('col.txnDue')}</th>
              <th className="p-2.5">{t('col.category')}</th>
              <th className="p-2.5">{t('col.remarksVouchers')}</th>
              <th className="p-2.5">{t('col.loggedBy')}</th>
              <th className="p-2.5 erp-col-actions">{t('col.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
            {!ledgerLoaded ? (
              <tr>
                <td colSpan={12} className="p-6 text-center text-gray-500 italic bg-gray-50 border-dashed border-b border-gray-200">
                  {t('ledger.selectDatesPrompt')}
                </td>
              </tr>
            ) : filteredTxns.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-4 text-center text-gray-500 font-bold">
                  {t('ledger.noRecordsInRange')}
                </td>
              </tr>
            ) : (
              filteredTxns.map((rec) => {
                const amounts = parseTxnDualAmounts(rec, config.fieldMap);
                const dateStr = parseRecordDate(getCol(rec, ['Date']))?.toLocaleDateString() || '';
                return (
                  <tr key={rec.ID} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="p-2.5">{dateStr}</td>
                    <td className="p-2.5 font-mono text-[10px]">{getCol(rec, ['Transaction ID']) || rec.ID}</td>
                    <td className="p-2.5">{getCol(rec, config.fieldMap.main)}</td>
                    <td className="p-2.5">{getCol(rec, config.fieldMap.sub)}</td>
                    <td className="p-2.5 font-mono">{fmtMoney(amounts.bill)}</td>
                    <td className="p-2.5 font-mono text-purple-600">{fmtMoney(amounts.discount)}</td>
                    <td className="p-2.5 font-mono text-emerald-600">{fmtMoney(amounts.pay)}</td>
                    <td className={`p-2.5 font-mono ${dueAmountClassName(amounts.txnDue)}`}>{fmtMoney(amounts.txnDue)}</td>
                    <td className="p-2.5">{getCategoryLabel(amounts.category, t)}</td>
                    <td className="p-2.5 break-words">{getCol(rec, config.fieldMap.remarks) || '-'}</td>
                    <td className="p-2.5">{getCol(rec, ['Logged By', 'Username']) || ''}</td>
                    <TxnLedgerActions
                      user={user}
                      sheetName={config.txnSheet}
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
      title={resolveModuleText(t, config, 'titleKey')}
      formTitle={resolveModuleText(t, config, 'formTitleKey')}
      ledgerTitle={resolveModuleText(t, config, 'ledgerTitleKey')}
      formContent={formContent}
      ledgerContent={ledgerContent}
    />
  );
}
