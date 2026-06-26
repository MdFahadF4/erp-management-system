import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCategoryLabel } from '../../../js/i18n.js';
import ModuleLedgerLayout from '../components/ModuleLedgerLayout.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import ModalPortal from '../components/ModalPortal.jsx';
import { createRecord, fetchCustomerModuleData } from '../services/dataService.js';
import TxnLedgerActions from '../components/TxnLedgerActions.jsx';
import {
  buildRefundPrefillFromTxn,
  canViewAllCustomers,
  computeCustomerTxnDue,
  computeRemainingCustomerDue,
  filterCustomerTxnsByDate,
  filterCustomersForUser,
  fmtMoney,
  getCol,
  getCustomerDueBalance,
  getCustomerUid,
  getCustomerName,
  getPaymentMethodColor,
  isCustomerTxnRefund,
  parseRecordDate
} from '../lib/customerEngine.js';
import { defaultDateRange } from '../lib/hrEngine.js';
import { userCanEditModule } from '../utils/userSession.js';

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function RefundHelpModal({ open, onClose }) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return undefined;
    document.body.classList.add('erp-refund-help-open');
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('erp-refund-help-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <ModalPortal>
    <div
      className="erp-refund-help-modal fixed inset-0 z-[200]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cust-refund-help-title"
    >
      <div className="erp-refund-help-backdrop absolute inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div className="erp-refund-help-shell absolute inset-0 flex items-end justify-center sm:items-center p-0 sm:p-4 pointer-events-none">
        <div
          className="erp-refund-help-panel pointer-events-auto bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg flex flex-col min-h-0 max-h-[min(88dvh,calc(100dvh-env(safe-area-inset-bottom,0px)-1rem))] sm:max-h-[min(90dvh,calc(100dvh-2rem))]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="erp-refund-help-header flex shrink-0 items-start justify-between gap-3 p-4 border-b border-gray-100">
            <h4 id="cust-refund-help-title" className="text-sm font-bold text-gray-800 uppercase tracking-wide pr-2">
              {t('custTxn.helpTitle')}
            </h4>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 font-bold text-lg leading-none px-1 shrink-0"
              aria-label={t('common.cancel')}
            >
              &times;
            </button>
          </div>
          <div className="erp-refund-help-body flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 text-xs text-gray-700 leading-relaxed">
            <p>{t('custTxn.helpIntro')}</p>
            <div>
              <p className="font-bold text-gray-800 mb-2 uppercase text-[10px] tracking-wider">
                {t('custTxn.helpStepPost')}
              </p>
              <ul className="space-y-1 bg-amber-50 border border-amber-100 rounded-lg p-3 font-mono text-[11px]">
                <li>
                  <span className="text-gray-500">{t('custTxn.helpSold')}</span> <strong>1000</strong>
                </li>
                <li>
                  <span className="text-gray-500">{t('custTxn.helpRefund')}</span> <strong>500</strong>
                </li>
                <li>
                  <span className="text-gray-500">{t('field.paymentMethod')}:</span> <strong>{t('option.cash')}</strong>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-2 uppercase text-[10px] tracking-wider">
                {t('custTxn.helpStepLedger')}
              </p>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-[11px] border-collapse">
                  <thead className="bg-gray-100 font-bold text-gray-600 uppercase">
                    <tr>
                      <th className="p-2 text-left">{t('custTxn.helpColRow')}</th>
                      <th className="p-2 text-right">{t('col.soldAmt')}</th>
                      <th className="p-2 text-right">{t('col.receivedAmt')}</th>
                      <th className="p-2 text-right">{t('col.txnDue')}</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono divide-y divide-gray-100">
                    <tr>
                      <td className="p-2">{t('custTxn.helpOriginal')}</td>
                      <td className="p-2 text-right">1000</td>
                      <td className="p-2 text-right text-emerald-700">500</td>
                      <td className="p-2 text-right text-red-600">500</td>
                    </tr>
                    <tr className="bg-amber-50/50">
                      <td className="p-2">{t('custTxn.helpReversal')}</td>
                      <td className="p-2 text-right text-amber-800">−1000</td>
                      <td className="p-2 text-right text-amber-800">−500</td>
                      <td className="p-2 text-right">0</td>
                    </tr>
                    <tr className="bg-gray-50 font-bold">
                      <td className="p-2">{t('custTxn.helpNet')}</td>
                      <td className="p-2 text-right">0</td>
                      <td className="p-2 text-right">0</td>
                      <td className="p-2 text-right text-emerald-700">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 border-t border-gray-100 pt-3">{t('custTxn.helpTip')}</p>
          </div>
          <div className="erp-refund-help-footer shrink-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-gray-100 flex justify-end bg-white">
            <button
              type="button"
              onClick={onClose}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded text-sm transition min-h-[44px] min-w-[6rem] touch-manipulation"
            >
              {t('custTxn.helpClose')}
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

export default function CustomerTransactionsPage({ user, onDataChange }) {
  const { t } = useI18n();
  const canEdit = userCanEditModule(user, 'customer_transactions');
  const [customers, setCustomers] = useState([]);
  const [customerTxns, setCustomerTxns] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ledgerLoaded, setLedgerLoaded] = useState(false);
  const [refundMode, setRefundMode] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const defaults = defaultDateRange();
  const [txnDate, setTxnDate] = useState(todayIso());
  const [uid, setUid] = useState('');
  const [sell, setSell] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [received, setReceived] = useState('0');
  const [method, setMethod] = useState('Cash');
  const [remarks, setRemarks] = useState('');
  const [filterFrom, setFilterFrom] = useState(defaults.from);
  const [filterTo, setFilterTo] = useState(defaults.to);
  const [currentDue, setCurrentDue] = useState(0);
  const [showDueInfo, setShowDueInfo] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchCustomerModuleData();
      setCustomers(data.customers);
      setCustomerTxns(data.customerTxns);
    } catch (err) {
      console.error('Failed to load customer data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (refundMode && method === 'Previous Due') setMethod('Cash');
  }, [refundMode, method]);

  const visibleCustomers = useMemo(
    () => filterCustomersForUser(customers, user),
    [customers, user]
  );

  const txnDue = useMemo(() => computeCustomerTxnDue(sell, discount, received), [sell, discount, received]);
  const remainingDue = useMemo(
    () => computeRemainingCustomerDue(currentDue, sell, discount, received, refundMode),
    [currentDue, sell, discount, received, refundMode]
  );

  const filteredTxns = useMemo(() => {
    if (!ledgerLoaded) return [];
    const filtered = filterCustomerTxnsByDate(customerTxns, filterFrom, filterTo);
    return filtered ? [...filtered].reverse() : [];
  }, [customerTxns, filterFrom, filterTo, ledgerLoaded]);

  const resetDueInfo = () => {
    setCurrentDue(0);
    setShowDueInfo(false);
  };

  const handleUidChange = (nextUid) => {
    setUid(nextUid);
    if (!nextUid) {
      resetDueInfo();
      return;
    }
    const rec = customers.find((r) => getCustomerUid(r) === nextUid);
    const due = getCustomerDueBalance(rec);
    setCurrentDue(due);
    setShowDueInfo(true);
  };

  const handleRefundFromLedger = (rec) => {
    const prefill = buildRefundPrefillFromTxn(rec);
    setRefundMode(true);
    setUid(prefill.uid);
    setTxnDate(todayIso());
    setSell(prefill.soldAmt.toFixed(2));
    setDiscount(prefill.discAmt.toFixed(2));
    setReceived(prefill.recAmt.toFixed(2));
    setMethod(prefill.method);
    setRemarks(prefill.remarks);
    handleUidChange(prefill.uid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      alert(t('alert.noPermission'));
      return;
    }

    let sellVal = parseFloat(sell) || 0;
    let discountVal = parseFloat(discount) || 0;
    let receivedVal = parseFloat(received) || 0;
    let remarksText = remarks.trim();

    if (refundMode) {
      if (sellVal <= 0 && discountVal <= 0 && receivedVal <= 0) {
        alert(t('custTxn.fullCancelHint'));
        return;
      }
      if (receivedVal > 0 && method !== 'Cash' && method !== 'Card') {
        alert(t('custTxn.refundBanner'));
        return;
      }
      sellVal = -Math.abs(sellVal);
      discountVal = -Math.abs(discountVal);
      receivedVal = -Math.abs(receivedVal);
      if (!remarksText.toUpperCase().includes('[REFUND/CANCELLATION]')) {
        remarksText = `[REFUND/CANCELLATION] ${remarksText}`.trim();
      }
    }

    const dueVal = sellVal - discountVal - receivedVal;
    setSubmitting(true);
    try {
      const rowPayload = [txnDate, uid, sellVal, discountVal, receivedVal, method, dueVal, remarksText, user.username, new Date().toLocaleString()];
      const result = await createRecord('Customer_Transactions', rowPayload);
      alert(result.message || (result.success ? 'Transaction saved.' : 'Failed to save.'));
      if (result.success) {
        setTxnDate(todayIso());
        setUid('');
        setSell('0');
        setDiscount('0');
        setReceived('0');
        setMethod('Cash');
        setRemarks('');
        setRefundMode(false);
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
    <>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex flex-1 rounded-lg border border-gray-200 overflow-hidden text-[11px] font-bold min-w-0">
          <button
            type="button"
            onClick={() => setRefundMode(false)}
            className={`flex-1 px-3 py-2 transition ${!refundMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t('custTxn.modeNormal')}
          </button>
          <button
            type="button"
            onClick={() => setRefundMode(true)}
            className={`flex-1 px-3 py-2 transition ${refundMode ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t('custTxn.modeRefund')}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="shrink-0 w-8 h-8 rounded-full border-2 border-amber-400 bg-amber-50 text-amber-700 font-black text-sm leading-none hover:bg-amber-100"
          title={t('custTxn.helpTitle')}
        >
          i
        </button>
      </div>

      {refundMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-[11px] text-amber-900 leading-relaxed">
          {t('custTxn.refundBanner')}
        </div>
      )}

      <form id="form-cust-txn-entry" className="space-y-4 text-xs" onSubmit={handleSubmit}>
        <div>
          <label className="block font-bold text-gray-600 mb-1">{t('field.transactionDate')}</label>
          <input type="date" id="cust-txn-date" required value={txnDate} onChange={(e) => setTxnDate(e.target.value)} disabled={!canEdit} className="w-full border border-gray-200 rounded p-2 text-sm outline-none" />
        </div>
        <div>
          <label className="block font-bold text-gray-600 mb-1">{t('field.systemUniqueId')}</label>
          <select id="cust-txn-uid" required value={uid} onChange={(e) => handleUidChange(e.target.value)} disabled={!canEdit} className="w-full border border-gray-200 rounded p-2 bg-white text-sm outline-none">
            <option value="">{t('dropdown.chooseAccountUid')}</option>
            {visibleCustomers.length === 0 ? (
              <option value="" disabled>
                {canViewAllCustomers(user) ? t('dropdown.noCustomers') : t('dropdown.noOwnCustomers')}
              </option>
            ) : (
              visibleCustomers.map((c) => {
                const cUid = getCustomerUid(c);
                const cName = getCustomerName(c);
                const due = getCustomerDueBalance(c);
                return (
                  <option key={cUid} value={cUid}>
                    {cUid} ({cName}) — {t('col.dueBalance')}: {fmtMoney(due)}
                  </option>
                );
              })
            )}
          </select>
        </div>

        <div id="cust-txn-due-info" className={`${showDueInfo ? '' : 'hidden'} bg-red-50 border border-red-100 rounded-lg p-3 space-y-1.5`}>
          <div className="flex justify-between items-center gap-2">
            <span className="font-bold text-red-800 text-[11px] uppercase">{t('field.currentCustomerDue')}</span>
            <span className="font-mono font-black text-red-700 text-sm">{fmtMoney(currentDue)}</span>
          </div>
          <div className="flex justify-between items-center gap-2 border-t border-red-100 pt-1.5">
            <span className="font-bold text-gray-600 text-[11px] uppercase">{t('field.remainingDueAfterTxn')}</span>
            <span className="font-mono font-bold text-orange-700 text-sm">{fmtMoney(remainingDue)}</span>
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-600 mb-1">{t('field.soldAmountOptional')}</label>
          <input type="number" step="0.01" id="cust-txn-sell" value={sell} onChange={(e) => setSell(e.target.value)} disabled={!canEdit} className="w-full border border-gray-200 rounded p-2 text-sm outline-none" />
        </div>
        {!refundMode && (
          <p className="text-[10px] text-gray-400 -mt-2">{t('field.soldAmountOptionalHint')}</p>
        )}

        <div>
          <label className="block font-bold text-purple-700 mb-1">{t('field.discountAllowed')}</label>
          <input type="number" step="0.01" id="cust-txn-discount" value={discount} onChange={(e) => setDiscount(e.target.value)} disabled={!canEdit} className="w-full border border-gray-200 rounded p-2 text-sm outline-none font-mono" />
        </div>
        <div>
          <label className="block font-bold text-emerald-700 mb-1">{refundMode ? t('custTxn.refundRecvLabel') : t('field.receivedAmount')}</label>
          <input type="number" step="0.01" id="cust-txn-received" required value={received} onChange={(e) => setReceived(e.target.value)} disabled={!canEdit} className="w-full border border-gray-200 rounded p-2 text-sm outline-none" />
        </div>
        <div>
          <label className="block font-bold text-gray-600 mb-1">{t('field.paymentMethod')}</label>
          <select id="cust-txn-method" required value={method} onChange={(e) => setMethod(e.target.value)} disabled={!canEdit || (refundMode && method === 'Previous Due')} className="w-full border border-gray-200 rounded p-2 bg-white text-sm outline-none">
            <option value="Cash">{t('option.cash')}</option>
            <option value="Card">{t('option.card')}</option>
            {!refundMode && <option value="Previous Due">{getCategoryLabel('Previous Due', t)}</option>}
          </select>
        </div>
        <div>
          <label className="block font-bold text-gray-500 mb-1">{t('field.transactionDueBalance')}</label>
          <input type="number" id="cust-txn-due" readOnly value={txnDue.toFixed(2)} className="w-full border border-gray-200 rounded p-2 text-sm bg-gray-50 font-bold text-red-600 outline-none" />
        </div>
        <div>
          <label className="block font-bold text-gray-600 mb-1">{t('field.remarksReferenceInfo')}</label>
          <textarea id="cust-txn-remarks" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} disabled={!canEdit} placeholder={t('placeholder.invoiceDetails')} className="w-full border border-gray-200 rounded p-2 text-sm outline-none" />
        </div>
        {canEdit && (
          <button
            type="submit"
            id="cust-txn-submit-btn"
            disabled={submitting}
            className={`erp-submit-btn w-full text-white font-bold p-2.5 rounded text-sm transition tracking-wider disabled:opacity-60 ${refundMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {submitting ? t('common.posting') : refundMode ? t('custTxn.postRefund') : t('form.postTransaction')}
          </button>
        )}
      </form>
      <RefundHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );

  const ledgerContent = (
    <>
      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4 flex flex-wrap items-end gap-3 text-xs shadow-inner">
        <div className="flex-1 min-w-[120px]">
          <label className="block text-gray-600 font-bold mb-1">{t('common.fromDate')}</label>
          <input type="date" id="filter-from-cust" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-full border border-gray-200 rounded p-2 outline-none focus:border-blue-500" />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-gray-600 font-bold mb-1">{t('common.toDate')}</label>
          <input type="date" id="filter-to-cust" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-full border border-gray-200 rounded p-2 outline-none focus:border-blue-500" />
        </div>
        <div>
          <button type="button" id="btn-filter-cust" onClick={handleLoadLedger} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition shadow-sm">
            {t('common.expandLoadLedger')}
          </button>
        </div>
      </div>

      <div className="erp-ledger-wrap overflow-x-auto border border-gray-200 rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-gray-100 font-bold text-gray-600 uppercase border-b border-gray-200 whitespace-nowrap">
            <tr>
              <th className="p-2.5">{t('col.date')}</th>
              <th className="p-2.5">{t('col.systemUniqueId')}</th>
              <th className="p-2.5">{t('col.soldAmt')}</th>
              <th className="p-2.5">{t('col.discount')}</th>
              <th className="p-2.5">{t('col.receivedAmt')}</th>
              <th className="p-2.5">{t('col.method')}</th>
              <th className="p-2.5">{t('col.txnDue')}</th>
              <th className="p-2.5">{t('col.remarks')}</th>
              <th className="p-2.5">{t('col.loggedBy')}</th>
              <th className="p-2.5">{t('col.stamp')}</th>
              <th className="p-2.5 erp-col-actions">{t('col.actions')}</th>
            </tr>
          </thead>
          <tbody id="table-cust-txn-rows" className="divide-y divide-gray-100 text-gray-600 font-medium">
            {!ledgerLoaded ? (
              <tr>
                <td colSpan={11} className="p-6 text-center text-gray-500 italic bg-gray-50 border-dashed border-b border-gray-200">
                  {t('ledger.selectDatesPrompt')}
                </td>
              </tr>
            ) : loadingLedger ? (
              <tr>
                <td colSpan={11} className="p-4 text-center text-blue-500 font-bold">{t('ledger.querying')}</td>
              </tr>
            ) : filteredTxns.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-4 text-center text-gray-500 font-bold">{t('ledger.noRecordsInRange')}</td>
              </tr>
            ) : (
              filteredTxns.map((rec) => {
                const cUid = getCustomerUid(rec);
                const soldAmt = parseFloat(getCol(rec, ['Sold Amount', 'Sold Amt', 'SOLDAMT'])) || 0;
                const discAmt = parseFloat(getCol(rec, ['Discount', 'Discount Amount', 'Txn Discount'])) || 0;
                const recAmt = parseFloat(getCol(rec, ['Received Amount', 'Received Amt', 'RECEIVEDAMT'])) || 0;
                const payMethod = getCol(rec, ['Payment Method', 'Method', 'METHOD']) || '';
                const dueAmt = parseFloat(getCol(rec, ['Transaction Due', 'Txn Due', 'Due'])) || 0;
                const remarksVal = getCol(rec, ['Remarks', 'Remarks / Reference']) || '-';
                const loggedBy = getCol(rec, ['Logged By', 'Username']) || '';
                const stamp = getCol(rec, ['Stamp', 'Timestamp']) || '';
                const isRefund = isCustomerTxnRefund(rec);
                const rowClass = isRefund ? 'bg-amber-50/70 hover:bg-amber-50 border-b border-amber-100' : 'hover:bg-gray-50 border-b border-gray-100';
                const amtClass = (n) => (n < 0 ? 'text-amber-700' : '');
                const dateStr = rec.Date ? parseRecordDate(rec.Date)?.toLocaleDateString() || '' : '';

                return (
                  <tr key={rec.ID} className={rowClass}>
                    <td className="p-2.5">
                      {dateStr}
                      {isRefund && (
                        <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 text-amber-900">{t('custTxn.refundBadge')}</span>
                      )}
                    </td>
                    <td className="p-2.5 font-bold font-mono text-[11px]">{cUid}</td>
                    <td className={`p-2.5 font-mono ${amtClass(soldAmt)}`}>{fmtMoney(soldAmt)}</td>
                    <td className={`p-2.5 font-mono text-purple-600 ${amtClass(discAmt)}`}>{fmtMoney(discAmt)}</td>
                    <td className={`p-2.5 font-mono font-bold text-emerald-600 ${amtClass(recAmt)}`}>{fmtMoney(recAmt)}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 font-bold rounded text-[10px] ${getPaymentMethodColor(payMethod)}`}>{getCategoryLabel(payMethod, t)}</span>
                    </td>
                    <td className={`p-2.5 font-mono text-red-600 font-bold ${amtClass(dueAmt)}`}>{fmtMoney(dueAmt)}</td>
                    <td className="p-2.5 break-words">{remarksVal}</td>
                    <td className="p-2.5">{loggedBy}</td>
                    <td className="p-2.5 text-gray-400 text-[10px] font-mono">{stamp}</td>
                    <TxnLedgerActions
                      user={user}
                      sheetName="Customer_Transactions"
                      record={rec}
                      onMutate={handleTxnMutate}
                      extraBefore={
                        !isRefund ? (
                          <button
                            type="button"
                            onClick={() => handleRefundFromLedger(rec)}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10px] mr-1"
                          >
                            {t('custTxn.refundFromLedger')}
                          </button>
                        ) : null
                      }
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
      title={t('page.customerTransactions.title')}
      formTitle={refundMode ? t('custTxn.modeRefund') : t('form.cust.logPayment')}
      ledgerTitle={t('form.cust.historicalLedger')}
      formContent={formContent}
      ledgerContent={ledgerContent}
    />
  );
}
