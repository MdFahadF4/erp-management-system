import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';
import InternalTransferActions from '../components/InternalTransferActions.jsx';
import { fetchInternalTransfers } from '../services/dataService.js';
import { filterRecordsByDateRange, defaultDateRange } from '../lib/hrEngine.js';
import { fmtMoney, getCol, parseRecordDate } from '../lib/dualHeadEngine.js';
import {
  getTransferSender,
  getTransferStatus,
  resolveTransferRecipientLabel,
  transferStatusBadgeClass
} from '../lib/internalTransferEngine.js';
import { userCanAdminTxnActions } from '../utils/userSession.js';

export default function InternalTransferViewPage({ user, onDataChange }) {
  const { t } = useI18n();
  const isAdmin = userCanAdminTxnActions(user);
  const defaults = defaultDateRange();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await fetchInternalTransfers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    if (!loaded) return [];
    return filterRecordsByDateRange(records, from, to) || [];
  }, [records, from, to, loaded]);

  const handleSearch = () => {
    if (!from || !to) {
      alert(t('alert.selectBothDates'));
      return;
    }
    setLoaded(true);
  };

  const handleMutate = async () => {
    await loadData();
    onDataChange?.();
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-600">
        {t('users.adminAccessRequired')}
      </div>
    );
  }

  return (
    <div className="space-y-4 erp-module-page pb-6">
      <div className="border-b border-gray-200 pb-3">
        <h2 className="text-2xl font-bold text-gray-800">{t('page.internalTransferView.title')}</h2>
        <p className="text-xs text-gray-500 mt-1">{t('page.internalTransferView.subtitle')}</p>
      </div>

      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex flex-wrap items-end gap-3 text-xs shadow-inner">
        <div>
          <label className="block font-bold text-gray-600 mb-1">{t('common.fromDate')}</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-gray-200 rounded p-2" />
        </div>
        <div>
          <label className="block font-bold text-gray-600 mb-1">{t('common.toDate')}</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-gray-200 rounded p-2" />
        </div>
        <button type="button" onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded">
          {t('common.executeQuery')}
        </button>
      </div>

      <div className="erp-ledger-wrap bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800 text-white uppercase whitespace-nowrap">
            <tr>
              <th className="p-2.5">{t('col.date')}</th>
              <th className="p-2.5">{t('col.transferAmount')}</th>
              <th className="p-2.5">{t('col.descriptionPurpose')}</th>
              <th className="p-2.5">{t('col.transferredBy')}</th>
              <th className="p-2.5">{t('col.transferToUser')}</th>
              <th className="p-2.5">{t('col.status')}</th>
              <th className="p-2.5">{t('internalTransfer.approvedBy')}</th>
              <th className="p-2.5">{t('internalTransfer.approvedAt')}</th>
              <th className="p-2.5 erp-col-actions">{t('col.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && !loaded ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-blue-500 animate-pulse">
                  {t('common.loading')}
                </td>
              </tr>
            ) : !loaded ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-gray-500 italic">
                  {t('ledger.selectDatesPrompt')}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-gray-500">
                  {t('ledger.noHandovers')}
                </td>
              </tr>
            ) : (
              [...filtered].reverse().map((rec) => {
                const status = getTransferStatus(rec);
                return (
                  <tr key={rec.ID} className="hover:bg-gray-50">
                    <td className="p-2.5 erp-cell-nowrap">
                      {parseRecordDate(getCol(rec, ['Date']))?.toLocaleDateString() || ''}
                    </td>
                    <td className="p-2.5 font-mono font-bold text-emerald-600">
                      SAR {fmtMoney(getCol(rec, ['Amount']) || 0)}
                    </td>
                    <td className="p-2.5 break-words">{getCol(rec, ['Remarks', 'Description']) || '-'}</td>
                    <td className="p-2.5">{getTransferSender(rec) || '-'}</td>
                    <td className="p-2.5 text-blue-700">{resolveTransferRecipientLabel(rec, t)}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${transferStatusBadgeClass(status)}`}>
                        {status === 'Approved' ? t('internalTransfer.statusApproved') : t('internalTransfer.statusPending')}
                      </span>
                    </td>
                    <td className="p-2.5">{getCol(rec, ['Approved By']) || '-'}</td>
                    <td className="p-2.5 text-gray-400 font-mono text-[10px]">
                      {getCol(rec, ['Approved At']) ? new Date(getCol(rec, ['Approved At'])).toLocaleString() : '-'}
                    </td>
                    <InternalTransferActions user={user} record={rec} onMutate={handleMutate} allowAdminEdit />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
