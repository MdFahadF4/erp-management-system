import { useCallback, useEffect, useMemo, useState } from 'react';
import ModuleLedgerLayout from '../components/ModuleLedgerLayout.jsx';
import MasterRecordActions, { runMasterDelete } from '../components/MasterRecordActions.jsx';
import { SupplierEditModal } from '../components/MasterEditModals.jsx';
import { createRecord, fetchSupplierModuleData } from '../services/dataService.js';
import { buildSupplierLedgerRow, fmtMoney } from '../lib/supplierEngine.js';
import { getSupplierMasterDeleteBlockReason } from '../lib/masterAdminEngine.js';
import { userCanEditModule } from '../utils/userSession.js';

const STATUS_OPTIONS = ['Active', 'Inactive'];

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

export default function SuppliersPage({ user, onDataChange }) {
  const canEdit = userCanEditModule(user, 'suppliers');
  const [supplierRecords, setSupplierRecords] = useState([]);
  const [supplierTxns, setSupplierTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('Active');
  const [editRecord, setEditRecord] = useState(null);

  const purchase = 0;
  const payments = 0;
  const due = 0;

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSupplierModuleData();
      setSupplierRecords(data.supplierRecords);
      setSupplierTxns(data.supplierTxns);
    } catch (err) {
      console.error('Failed to load supplier records:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const rows = useMemo(
    () => supplierRecords.map((rec) => buildSupplierLedgerRow(rec, supplierTxns, canEdit)),
    [supplierRecords, supplierTxns, canEdit]
  );

  const resetForm = () => {
    setName('');
    setMobile('');
    setEmail('');
    setAddress('');
    setStatus('Active');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      alert('You do not have permission to edit this module.');
      return;
    }
    setSubmitting(true);
    try {
      const supName = name.trim();
      const openingPurchase = purchase;
      const openingPayments = payments;
      const openingDue = Math.max(0, openingPurchase - openingPayments);

      const payloadRow = [
        supName,
        mobile.trim(),
        email.trim(),
        address.trim(),
        0,
        0,
        0,
        status,
        user.username,
        new Date().toLocaleString()
      ];

      const res = await createRecord('Suppliers', payloadRow);
      if (res.success && openingDue > 0.009) {
        await createRecord('Supplier_Transactions', [
          todayIso(),
          supName,
          openingDue,
          0,
          0,
          openingDue,
          'Previous Due',
          'Previous Due (opening balance)',
          user.username,
          new Date().toLocaleString()
        ]);
      }

      alert(res.message || (res.success ? 'Supplier saved.' : 'Failed to save.'));
      if (res.success) {
        resetForm();
        await loadRecords();
        onDataChange?.();
      }
    } catch {
      alert('Error committing supplier record.');
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = (
    <form id="form-sup-entry" className="space-y-3 text-xs" onSubmit={handleSubmit}>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">Supplier Name</label>
        <input
          type="text"
          id="sup-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">Mobile</label>
        <input
          type="text"
          id="sup-mobile"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">Email</label>
        <input
          type="email"
          id="sup-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">Address</label>
        <textarea
          id="sup-address"
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-bold text-gray-500 mb-0.5">Total Purchase</label>
          <input
            type="number"
            id="sup-purchase"
            value={purchase.toFixed(2)}
            readOnly
            tabIndex={-1}
            className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-500 mb-0.5">Total Payments</label>
          <input
            type="number"
            id="sup-payments"
            value={payments.toFixed(2)}
            readOnly
            tabIndex={-1}
            className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"
          />
        </div>
      </div>
      <div>
        <label className="block font-bold text-gray-500 mb-0.5">Due Balance</label>
        <input
          type="number"
          id="sup-due"
          value={due.toFixed(2)}
          readOnly
          className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 font-semibold text-red-600 outline-none text-sm"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">Status</label>
        <select
          id="sup-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-1.5 bg-white text-sm font-medium outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      {canEdit && (
        <button
          type="submit"
          disabled={submitting}
          className="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-2 rounded text-sm transition disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'COMMIT SUPPLIER ENTITY'}
        </button>
      )}
    </form>
  );

  const ledgerContent = (
    <div className="erp-ledger-wrap overflow-x-auto border border-gray-200 rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead className="bg-gray-100 font-bold text-gray-600 uppercase border-b border-gray-200 whitespace-nowrap">
          <tr>
            <th className="p-2.5">Supplier Name</th>
            <th className="p-2.5">Mobile</th>
            <th className="p-2.5">Email</th>
            <th className="p-2.5">Address</th>
            <th className="p-2.5">Total Purchase</th>
            <th className="p-2.5">Total Payments</th>
            <th className="p-2.5">Due Balance</th>
            <th className="p-2.5">Status</th>
            <th className="p-2.5 erp-col-actions">Actions</th>
          </tr>
        </thead>
        <tbody id="table-sup-rows" className="divide-y divide-gray-100 text-gray-600 font-medium">
          {loading ? (
            <tr>
              <td colSpan={9} className="p-3 text-center text-gray-400">
                Querying supplier ledger…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="p-3 text-center text-gray-400">
                No suppliers registered.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const rec = supplierRecords.find((r) => r.ID === row.id);
              return (
              <tr key={row.id} className="hover:bg-gray-50 border-b border-gray-100">
                <td className="p-2.5 font-bold text-gray-900 break-words">{row.supName}</td>
                <td className="p-2.5 font-mono break-words">{row.mobile}</td>
                <td className="p-2.5 break-words">{row.email}</td>
                <td className="p-2.5 break-words">{row.address}</td>
                <td className="p-2.5 font-mono erp-cell-nowrap">{fmtMoney(row.totalPurchase)}</td>
                <td className="p-2.5 font-mono text-emerald-600 erp-cell-nowrap">{fmtMoney(row.totalPaid)}</td>
                <td className="p-2.5 font-mono font-bold text-red-600 erp-cell-nowrap">{fmtMoney(row.dbDue)}</td>
                <td className="p-2.5">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${row.badgeClass}`}>
                    {row.status}
                  </span>
                </td>
                <MasterRecordActions
                  user={user}
                  label={`supplier "${row.supName}"`}
                  onEdit={() => setEditRecord(rec)}
                  onDelete={() =>
                    runMasterDelete({
                      blockReason: getSupplierMasterDeleteBlockReason(rec, supplierTxns),
                      label: `supplier "${row.supName}"`,
                      sheetName: 'Suppliers',
                      recordId: row.id,
                      onDone: async () => {
                        await loadRecords();
                        onDataChange?.();
                      }
                    })
                  }
                />
              </tr>
            );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
    <ModuleLedgerLayout
      title="Supplier Ledger & Account Management"
      formTitle="New Supplier Entry"
      ledgerTitle="Supplier Database Records"
      formContent={formContent}
      ledgerContent={ledgerContent}
    />
    <SupplierEditModal
      open={Boolean(editRecord)}
      record={editRecord}
      supplierTxns={supplierTxns}
      user={user}
      onClose={() => setEditRecord(null)}
      onSaved={async () => {
        await loadRecords();
        onDataChange?.();
      }}
    />
    </>
  );
}
