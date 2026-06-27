import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';
import {
  fetchCustomerModuleData,
  fetchDeliveryQueue,
  fetchSheet,
  updateRecord
} from '../services/dataService.js';
import {
  buildCustomerMemoMap,
  buildCustomerTxnUidSet,
  buildCustomerUidSet,
  buildMarkDeliveredRowData,
  buildTxnRemarksMap,
  formatDisplayDate,
  getRecordId,
  isDeliveryQueueEntryVisible,
  resolveDeliveryRemarks,
  sortDeliveryByDateAsc
} from '../lib/deliveryEngine.js';
import { getCol } from '../lib/dualHeadEngine.js';
import { userCanEditModule } from '../utils/userSession.js';

function PendingStatusCell({ rec, canEdit, onMarkDelivered, marking }) {
  const { t } = useI18n();
  const id = getRecordId(rec);
  const [status, setStatus] = useState('Pending');
  const [remarks, setRemarks] = useState('');

  if (!canEdit) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
        {t('delivery.statusPending')}
      </span>
    );
  }

  return (
    <div className="space-y-2 min-w-[160px]">
      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          if (e.target.value !== 'Delivered') setRemarks('');
        }}
        className="delivery-status-select border border-gray-200 rounded p-1 text-xs bg-white w-full"
      >
        <option value="Pending">{t('delivery.statusPending')}</option>
        <option value="Delivered">{t('delivery.statusDelivered')}</option>
      </select>
      {status === 'Delivered' && (
        <div className="delivery-confirm-wrap space-y-1">
          <label className="block text-[10px] font-bold text-gray-500">{t('delivery.deliveredRemarks')}</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder={t('delivery.deliveredRemarksPlaceholder')}
            className="delivery-delivered-remarks w-full border border-gray-200 rounded p-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="button"
            disabled={marking === id}
            onClick={() => onMarkDelivered(id, remarks)}
            className="btn-mark-delivered bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[10px] disabled:opacity-60"
          >
            {marking === id ? t('common.saving') : t('delivery.markDelivered')}
          </button>
        </div>
      )}
    </div>
  );
}

export default function DeliveryDashboardPage({ user }) {
  const { t } = useI18n();
  const canEdit = userCanEditModule(user, 'delivery_dashboard');
  const [records, setRecords] = useState([]);
  const [txnRemarksByUid, setTxnRemarksByUid] = useState({});
  const [customerMemoByUid, setCustomerMemoByUid] = useState({});
  const [customerUids, setCustomerUids] = useState(() => new Set());
  const [txnUids, setTxnUids] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(null);

  const load = useCallback(async (skipSync = false) => {
    setLoading(true);
    try {
      const custData = await fetchCustomerModuleData();
      setTxnRemarksByUid(buildTxnRemarksMap(custData.customerTxns));
      setCustomerMemoByUid(buildCustomerMemoMap(custData.customers));
      setCustomerUids(buildCustomerUidSet(custData.customers));
      setTxnUids(buildCustomerTxnUidSet(custData.customerTxns));
      if (skipSync) {
        const res = await fetchSheet('Delivery_Queue');
        setRecords(res.success ? res.records : []);
      } else {
        setRecords(await fetchDeliveryQueue());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const visibleRecords = useMemo(
    () => records.filter((r) => isDeliveryQueueEntryVisible(r, customerUids, txnUids)),
    [records, customerUids, txnUids]
  );

  const pending = useMemo(
    () =>
      sortDeliveryByDateAsc(
        visibleRecords.filter((r) => String(getCol(r, ['Status']) || 'Pending').trim() === 'Pending'),
        ['Issued Date', 'Stamp']
      ),
    [visibleRecords]
  );

  const delivered = useMemo(
    () =>
      sortDeliveryByDateAsc(
        visibleRecords.filter((r) => String(getCol(r, ['Status']) || '').trim() === 'Delivered'),
        ['Delivery Date', 'Stamp']
      ),
    [visibleRecords]
  );

  const resolveRemarks = (rec) => resolveDeliveryRemarks(rec, txnRemarksByUid, customerMemoByUid);

  const handleMarkDelivered = async (recordId, deliveredRemarks) => {
    const rec = records.find((r) => String(getRecordId(r)) === String(recordId));
    if (!rec) {
      alert(t('alert.errorLoad'));
      return;
    }
    setMarking(recordId);
    try {
      const resolved = resolveRemarks(rec);
      const rowData = buildMarkDeliveredRowData(rec, resolved);
      rowData[6] = String(deliveredRemarks || '').trim();
      const res = await updateRecord('Delivery_Queue', recordId, rowData);
      alert(res.message || (res.success ? t('delivery.markedDelivered') : t('delivery.updateFailed')));
      if (res.success) await load(true);
    } catch {
      alert(t('delivery.updateFailed'));
    } finally {
      setMarking(null);
    }
  };

  return (
    <div id="delivery-dashboard-root" className="space-y-3 erp-module-page pb-4">
      <div className="border-b border-gray-200 pb-2 mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-gray-800 leading-tight">{t('page.deliveryDashboard.title')}</h2>
        <button
          type="button"
          id="btn-refresh-delivery"
          onClick={() => load(false)}
          className="shrink-0 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-3 py-1.5 rounded text-xs transition shadow-sm"
        >
          {t('common.refresh')}
        </button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white p-3 md:p-4 rounded-xl shadow border border-amber-200 flex flex-col min-h-[480px]">
          <h3 className="text-sm font-bold text-amber-800 mb-2 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {t('delivery.pendingList')}
            <span className="text-[10px] font-normal normal-case text-gray-400">{t('delivery.lifoHint')}</span>
          </h3>
          <div className="overflow-x-auto border border-gray-200 rounded-lg flex-1 min-h-0 max-h-[calc(100vh-11rem)] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-amber-50 font-bold text-amber-900 uppercase border-b border-gray-200 whitespace-nowrap sticky top-0 z-10">
                <tr>
                  <th className="p-2.5">{t('col.systemUniqueId')}</th>
                  <th className="p-2.5">{t('col.remarks')}</th>
                  <th className="p-2.5">{t('delivery.issuedDate')}</th>
                  <th className="p-2.5">{t('field.username')}</th>
                  <th className="p-2.5">{t('col.status')}</th>
                </tr>
              </thead>
              <tbody id="table-delivery-pending" className="divide-y divide-gray-100 text-gray-600 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400 animate-pulse">
                      {t('delivery.loading')}
                    </td>
                  </tr>
                ) : pending.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
                      {t('delivery.noPending')}
                    </td>
                  </tr>
                ) : (
                  pending.map((rec) => (
                    <tr key={rec.ID} className="hover:bg-gray-50 align-top border-b border-gray-100">
                      <td className="p-2.5 font-mono font-bold text-[11px] text-gray-900">
                        {getCol(rec, ['System Unique ID']) || '-'}
                      </td>
                      <td className="p-2.5 text-xs max-w-[140px] break-words">{resolveRemarks(rec)}</td>
                      <td className="p-2.5 text-xs whitespace-nowrap">
                        {formatDisplayDate(getCol(rec, ['Issued Date']))}
                      </td>
                      <td className="p-2.5 text-xs">{getCol(rec, ['Username', 'Logged By']) || '-'}</td>
                      <td className="p-2.5 text-xs">
                        <PendingStatusCell
                          rec={rec}
                          canEdit={canEdit}
                          marking={marking}
                          onMarkDelivered={handleMarkDelivered}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-xl shadow border border-emerald-200 flex flex-col min-h-[480px]">
          <h3 className="text-sm font-bold text-emerald-800 mb-2 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {t('delivery.deliveredList')}
          </h3>
          <div className="overflow-x-auto border border-gray-200 rounded-lg flex-1 min-h-0 max-h-[calc(100vh-11rem)] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-emerald-50 font-bold text-emerald-900 uppercase border-b border-gray-200 whitespace-nowrap sticky top-0 z-10">
                <tr>
                  <th className="p-2.5">{t('col.systemUniqueId')}</th>
                  <th className="p-2.5">{t('col.remarks')}</th>
                  <th className="p-2.5">{t('field.username')}</th>
                  <th className="p-2.5">{t('delivery.deliveryDate')}</th>
                  <th className="p-2.5">{t('delivery.deliveredRemarks')}</th>
                </tr>
              </thead>
              <tbody id="table-delivery-delivered" className="divide-y divide-gray-100 text-gray-600 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400 animate-pulse">
                      {t('delivery.loading')}
                    </td>
                  </tr>
                ) : delivered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
                      {t('delivery.noDelivered')}
                    </td>
                  </tr>
                ) : (
                  delivered.map((rec) => (
                    <tr key={rec.ID} className="hover:bg-emerald-50/40 align-top border-b border-gray-100">
                      <td className="p-2.5 font-mono font-bold text-[11px] text-gray-900">
                        {getCol(rec, ['System Unique ID']) || '-'}
                      </td>
                      <td className="p-2.5 text-xs max-w-[140px] break-words">{resolveRemarks(rec)}</td>
                      <td className="p-2.5 text-xs">{getCol(rec, ['Username', 'Logged By']) || '-'}</td>
                      <td className="p-2.5 text-xs whitespace-nowrap">
                        {formatDisplayDate(getCol(rec, ['Delivery Date']))}
                      </td>
                      <td className="p-2.5 text-xs max-w-[180px] break-words">
                        {getCol(rec, ['Delivered Remarks']) || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
