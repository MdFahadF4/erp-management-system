import { useCallback, useEffect, useState } from 'react';
import ModuleLedgerLayout from '../components/ModuleLedgerLayout.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { createRecord, fetchInternalTransfers, fetchUsers } from '../services/dataService.js';
import TxnLedgerActions from '../components/TxnLedgerActions.jsx';
import { filterRecordsByDateRange, defaultDateRange } from '../lib/hrEngine.js';
import { fmtMoney, getCol, parseRecordDate } from '../lib/dualHeadEngine.js';
import { userCanEditModule } from '../utils/userSession.js';

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

export default function InternalTransferPage({ user, onDataChange }) {
  const { t } = useI18n();
  const canEdit = userCanEditModule(user, 'internal_transfer');
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [ledgerLoaded, setLedgerLoaded] = useState(false);

  const defaults = defaultDateRange();
  const [txnDate, setTxnDate] = useState(todayIso());
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [toUser, setToUser] = useState('');
  const [filterFrom, setFilterFrom] = useState(defaults.from);
  const [filterTo, setFilterTo] = useState(defaults.to);

  const loadData = useCallback(async () => {
    const [txns, userList] = await Promise.all([fetchInternalTransfers(), fetchUsers()]);
    setRecords(txns);
    setUsers(userList.filter((u) => String(getCol(u, ['Username']) || '').trim().toLowerCase() !== user.username.toLowerCase()));
  }, [user.username]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = ledgerLoaded ? filterRecordsByDateRange(records, filterFrom, filterTo) || [] : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    const norm = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (toUser && norm(toUser) === norm(user.username)) {
      alert(t('alert.cannotTransferToSelf'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await createRecord('Internal_Transfers', [
        txnDate,
        parseFloat(amount) || 0,
        desc.trim(),
        user.username,
        toUser,
        new Date().toLocaleString()
      ]);
      alert(res.message || (res.success ? 'Transfer logged.' : 'Failed.'));
      if (res.success) {
        setTxnDate(todayIso());
        setAmount('');
        setDesc('');
        setToUser('');
        await loadData();
        onDataChange?.();
      }
    } catch {
      alert(t('alert.errorLog'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleTxnMutate = async () => {
    await loadData();
    onDataChange?.();
  };

  const handleLoadLedger = () => {
    if (!filterFrom || !filterTo) {
      alert(t('alert.selectBothDates'));
      return;
    }
    setLedgerLoaded(true);
  };

  const formContent = (
    <form className="space-y-4 text-xs" onSubmit={handleSubmit}>
      <div>
        <label className="block font-bold text-gray-600 mb-1">{t('field.transferDate')}</label>
        <input type="date" required value={txnDate} onChange={(e) => setTxnDate(e.target.value)} disabled={!canEdit} className="w-full border border-gray-200 rounded p-2 text-sm outline-none" />
      </div>
      <div>
        <label className="block font-bold text-emerald-700 mb-1">{t('field.transferCashAmount')}</label>
        <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} disabled={!canEdit} className="w-full border border-gray-200 rounded p-2 text-sm font-mono font-bold outline-none" />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-1">{t('field.transferToUser')}</label>
        <select value={toUser} onChange={(e) => setToUser(e.target.value)} disabled={!canEdit} className="w-full border border-gray-200 rounded p-2 bg-white text-sm outline-none">
          <option value="">{t('placeholder.transferToUserOptional')}</option>
          {users.map((u) => {
            const name = getCol(u, ['Username', 'User Name']) || '';
            return (
              <option key={name} value={name}>
                {name}
              </option>
            );
          })}
        </select>
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-1">{t('field.descriptionNarrative')}</label>
        <textarea rows={3} required value={desc} onChange={(e) => setDesc(e.target.value)} disabled={!canEdit} className="w-full border border-gray-200 rounded p-2 text-sm outline-none" />
      </div>
      {canEdit && (
        <button type="submit" disabled={submitting} className="erp-submit-btn w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded text-sm transition disabled:opacity-60">
          {t('form.int.executeHandover')}
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
      <div className="erp-ledger-wrap overflow-x-auto border border-gray-200 rounded-lg md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-gray-100 font-bold text-gray-600 uppercase border-b border-gray-200 whitespace-nowrap">
            <tr>
              <th className="p-2.5">{t('col.date')}</th>
              <th className="p-2.5">{t('col.transferAmount')}</th>
              <th className="p-2.5">{t('col.descriptionPurpose')}</th>
              <th className="p-2.5">{t('col.transferredBy')}</th>
              <th className="p-2.5">{t('col.transferToUser')}</th>
              <th className="p-2.5">{t('col.systemStamp')}</th>
              <th className="p-2.5 erp-col-actions">{t('col.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!ledgerLoaded ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500 italic">
                  {t('ledger.selectDatesPrompt')}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500 font-bold">
                  {t('ledger.noHandovers')}
                </td>
              </tr>
            ) : (
              [...filtered].reverse().map((rec) => (
                <tr key={rec.ID} className="hover:bg-gray-50 border-b border-gray-100">
                  <td className="p-2.5">{parseRecordDate(getCol(rec, ['Date']))?.toLocaleDateString() || ''}</td>
                  <td className="p-2.5 font-mono font-bold text-emerald-600">SAR {fmtMoney(getCol(rec, ['Amount']) || 0)}</td>
                  <td className="p-2.5 break-words">{getCol(rec, ['Remarks', 'Description']) || '-'}</td>
                  <td className="p-2.5">{getCol(rec, ['Transferred By', 'Username']) || ''}</td>
                  <td className="p-2.5 text-blue-700">{getCol(rec, ['Transfer To User', 'Transfer To']) || '-'}</td>
                  <td className="p-2.5 text-gray-400 text-[10px] font-mono">{getCol(rec, ['Stamp', 'Timestamp']) || ''}</td>
                  <TxnLedgerActions
                    user={user}
                    sheetName="Internal_Transfers"
                    record={rec}
                    onMutate={handleTxnMutate}
                  />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <ModuleLedgerLayout
      title={t('page.internalTransfer.title')}
      formTitle={t('form.int.logTransfer')}
      ledgerTitle={t('form.int.historicalTransfer')}
      formContent={formContent}
      ledgerContent={ledgerContent}
    />
  );
}
