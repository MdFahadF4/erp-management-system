import { useCallback, useEffect, useMemo, useState } from 'react';
import ModuleLedgerLayout from '../components/ModuleLedgerLayout.jsx';
import HeadEditModal from '../components/HeadEditModal.jsx';
import { createRecord, deleteRecord, fetchHeadModuleData } from '../services/dataService.js';
import { buildHeadLedgerRows, fmtMoney } from '../lib/dualHeadEngine.js';
import { getHeadDeleteBlockReason } from '../lib/headAdminEngine.js';
import { userCanAdminHeadActions, userCanEditModule } from '../utils/userSession.js';

export default function HeadManagementPage({ user, config, onDataChange }) {
  const canEdit = userCanEditModule(user, config.moduleId);
  const canAdminHead = userCanAdminHeadActions(user);
  const [heads, setHeads] = useState([]);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mainHead, setMainHead] = useState('');
  const [subHead, setSubHead] = useState('');
  const [editRow, setEditRow] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHeadModuleData(config.headSheet, config.txnSheet);
      setHeads(data.heads);
      setTxns(data.txns);
    } catch (err) {
      console.error('Failed to load head data:', err);
    } finally {
      setLoading(false);
    }
  }, [config.headSheet, config.txnSheet]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rows = useMemo(
    () => buildHeadLedgerRows(heads, txns, config.fieldMap, config.mainCols, config.subCols),
    [heads, txns, config]
  );

  const colSpan = canAdminHead ? 9 : 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      alert('You do not have permission to edit this module.');
      return;
    }
    setSubmitting(true);
    try {
      const trackingUID = `${config.trackingPrefix}-${mainHead.substring(0, 3).toUpperCase()}-${subHead.substring(0, 3).toUpperCase()}`;
      const payloadRow = [trackingUID, mainHead.trim(), subHead.trim(), user.username, new Date().toLocaleString()];
      const res = await createRecord(config.headSheet, payloadRow);
      alert(res.message || (res.success ? 'Saved.' : 'Failed.'));
      if (res.success) {
        setMainHead('');
        setSubHead('');
        await loadData();
        onDataChange?.();
      }
    } catch {
      alert('Error saving head entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (!canAdminHead) return;
    const blockReason = getHeadDeleteBlockReason(row, txns, config.fieldMap);
    if (blockReason) {
      alert(blockReason);
      return;
    }
    const confirmed = window.confirm(
      `Permanently delete this head structure?\n\n` +
        `Parent: ${row.mainHead}\n` +
        `Sub: ${row.subHead}\n\n` +
        `Tracking ID: ${row.trackingId}\n\n` +
        `This cannot be undone.`
    );
    if (!confirmed) return;
    const typed = window.prompt('Type DELETE to confirm removal:');
    if (String(typed || '').trim().toUpperCase() !== 'DELETE') {
      alert('Delete cancelled — confirmation text did not match.');
      return;
    }
    try {
      const res = await deleteRecord(config.headSheet, row.id);
      alert(res.message || (res.success ? 'Head deleted.' : 'Delete failed.'));
      if (res.success) {
        await loadData();
        onDataChange?.();
      }
    } catch {
      alert('Error deleting head structure.');
    }
  };

  const formContent = (
    <form className="space-y-3 text-xs" onSubmit={handleSubmit}>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">Parent Head / Main Category</label>
        <input
          type="text"
          required
          value={mainHead}
          onChange={(e) => setMainHead(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">Sub Head</label>
        <input
          type="text"
          required
          value={subHead}
          onChange={(e) => setSubHead(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
      {canEdit && (
        <button
          type="submit"
          disabled={submitting}
          className="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-2 rounded text-sm transition disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'COMMIT HEAD STRUCTURE'}
        </button>
      )}
    </form>
  );

  const ledgerContent = (
    <div className="erp-ledger-wrap overflow-x-auto border border-gray-200 rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead className="bg-gray-100 font-bold text-gray-600 uppercase border-b border-gray-200 whitespace-nowrap">
          <tr>
            <th className="p-2.5">Tracking ID</th>
            <th className="p-2.5">Parent Head</th>
            <th className="p-2.5">Sub Head</th>
            <th className="p-2.5">{config.billLabel}</th>
            <th className="p-2.5">{config.payLabel}</th>
            <th className="p-2.5">Due/Balance</th>
            <th className="p-2.5">User</th>
            <th className="p-2.5">Stamp</th>
            {canAdminHead && <th className="p-2.5 erp-col-actions">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
          {loading ? (
            <tr>
              <td colSpan={colSpan} className="p-3 text-center text-gray-400">
                Loading structures…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="p-3 text-center text-gray-400">
                No head structures found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 border-b border-gray-100">
                <td className="p-2.5 font-mono text-gray-400 text-[11px] break-all">{row.trackingId}</td>
                <td className="p-2.5 font-bold text-gray-800 break-words">{row.mainHead}</td>
                <td className="p-2.5 text-blue-600 font-medium break-words">{row.subHead}</td>
                <td className="p-2.5 font-mono font-bold text-gray-700 erp-cell-nowrap">SAR {fmtMoney(row.bill)}</td>
                <td className="p-2.5 font-mono font-bold text-emerald-600 erp-cell-nowrap">SAR {fmtMoney(row.pay)}</td>
                <td className="p-2.5 font-mono font-bold text-red-600 erp-cell-nowrap">SAR {fmtMoney(row.due)}</td>
                <td className="p-2.5 break-words">{row.user}</td>
                <td className="p-2.5 text-gray-400 font-mono text-[10px] break-words">{row.stamp}</td>
                {canAdminHead && (
                  <td className="p-2.5 erp-col-actions whitespace-nowrap">
                    <button
                      type="button"
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-2 py-0.5 rounded text-[10px] mr-1"
                      onClick={() => setEditRow(row)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded text-[10px]"
                      onClick={() => handleDelete(row)}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <ModuleLedgerLayout
        title={config.title}
        formTitle={config.formTitle}
        ledgerTitle={config.ledgerTitle}
        formContent={formContent}
        ledgerContent={ledgerContent}
      />
      <HeadEditModal
        open={Boolean(editRow)}
        row={editRow}
        config={config}
        heads={heads}
        txns={txns}
        user={user}
        onClose={() => setEditRow(null)}
        onSaved={async () => {
          await loadData();
          onDataChange?.();
        }}
      />
    </>
  );
}
