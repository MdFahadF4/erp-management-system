import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCategoryLabel } from '../../../js/i18n.js';
import ModuleLedgerLayout from '../components/ModuleLedgerLayout.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import MasterRecordActions, { runMasterDelete } from '../components/MasterRecordActions.jsx';
import { HrEditModal } from '../components/MasterEditModals.jsx';
import { createRecord, fetchHrModuleData } from '../services/dataService.js';
import { buildHrLedgerRow, fmtMoney } from '../lib/hrEngine.js';
import { addMoney, parseMoneyInput, preventNumberWheelScroll, roundMoney } from '../lib/recordHelpers.js';
import { getHrMasterDeleteBlockReason } from '../lib/masterAdminEngine.js';
import { userCanEditModule } from '../utils/userSession.js';

const STATUS_OPTIONS = ['Active', 'Vacation', 'Inactive', 'Released'];

export default function HrManagementPage({ user, onDataChange }) {
  const { t } = useI18n();
  const canEdit = userCanEditModule(user, 'hr');
  const [hrRecords, setHrRecords] = useState([]);
  const [hrTxns, setHrTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [joining, setJoining] = useState('');
  const [salStart, setSalStart] = useState('0');
  const [salInc] = useState('0');
  const [status, setStatus] = useState('Active');
  const [editRecord, setEditRecord] = useState(null);

  const salCurrent = useMemo(
    () => addMoney(parseMoneyInput(salStart), parseMoneyInput(salInc)),
    [salStart, salInc]
  );

  const normalizeSalStartField = () => {
    setSalStart(String(parseMoneyInput(salStart)));
  };
  const salDue = useMemo(() => 0, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHrModuleData();
      setHrRecords(data.hrRecords);
      setHrTxns(data.hrTxns);
    } catch (err) {
      console.error('Failed to load HR records:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const rows = useMemo(
    () => hrRecords.map((rec) => buildHrLedgerRow(rec, hrTxns, canEdit)),
    [hrRecords, hrTxns, canEdit]
  );

  const resetForm = () => {
    setName('');
    setDesignation('');
    setJoining('');
    setSalStart('0');
    setStatus('Active');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      alert(t('alert.noPermission'));
      return;
    }
    setSubmitting(true);
    try {
      const startAmt = parseMoneyInput(salStart);
      const incAmt = parseMoneyInput(salInc);
      const currentAmt = addMoney(startAmt, incAmt);
      const payloadRow = [
        name.trim(),
        designation.trim(),
        joining,
        startAmt,
        incAmt,
        currentAmt,
        0,
        0,
        salDue,
        status,
        user.username
      ];
      const res = await createRecord('HR', payloadRow);
      alert(res.message || (res.success ? 'Record saved.' : 'Failed to save.'));
      if (res.success) {
        resetForm();
        await loadRecords();
        onDataChange?.();
      }
    } catch {
      alert('Error committing staff record.');
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = (
    <form id="form-hr-entry" className="space-y-3 text-xs" onSubmit={handleSubmit}>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">{t('field.employeeName')}</label>
        <input
          type="text"
          id="hr-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">{t('field.designationManual')}</label>
        <input
          type="text"
          id="hr-designation"
          required
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">{t('field.dateOfJoining')}</label>
        <input
          type="date"
          id="hr-joining"
          required
          value={joining}
          onChange={(e) => setJoining(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-bold text-gray-600 mb-0.5">{t('field.salaryStart')}</label>
          <input
            type="number"
            step="0.01"
            min="0"
            id="hr-sal-start"
            required
            value={salStart}
            onChange={(e) => setSalStart(e.target.value)}
            onBlur={normalizeSalStartField}
            onWheel={preventNumberWheelScroll}
            disabled={!canEdit}
            className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-500 mb-0.5">{t('field.incrementAmount')}</label>
          <input
            type="number"
            id="hr-sal-inc"
            value={salInc}
            readOnly
            tabIndex={-1}
            className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 outline-none text-sm font-mono"
          />
        </div>
      </div>
      <div>
        <label className="block font-bold text-gray-500 mb-0.5">{t('field.currentSalary')}</label>
        <input
          type="number"
          id="hr-sal-current"
          value={salCurrent.toFixed(2)}
          readOnly
          className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 font-semibold text-blue-600 outline-none text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-bold text-gray-500 mb-0.5">{t('field.totalEarnEarning')}</label>
          <input type="number" id="hr-earn" value="0" readOnly tabIndex={-1} className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 outline-none text-sm font-mono" />
        </div>
        <div>
          <label className="block font-bold text-gray-500 mb-0.5">{t('field.paidSalary')}</label>
          <input type="number" id="hr-paid" value="0" readOnly tabIndex={-1} className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 outline-none text-sm font-mono" />
        </div>
      </div>
      <div>
        <label className="block font-bold text-gray-500 mb-0.5">{t('field.dueBalanceSalary')}</label>
        <input
          type="number"
          id="hr-due"
          value={salDue.toFixed(2)}
          readOnly
          className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 font-semibold text-red-600 outline-none text-sm"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">{t('field.employmentStatus')}</label>
        <select
          id="hr-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-1.5 bg-white text-sm font-medium outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {getCategoryLabel(opt, t)}
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
          {submitting ? t('common.saving') : t('form.hr.commitStaff')}
        </button>
      )}
    </form>
  );

  const ledgerContent = (
    <div className="erp-ledger-wrap overflow-x-auto border border-gray-200 rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead className="bg-gray-100 font-bold text-gray-600 uppercase border-b border-gray-200 whitespace-nowrap">
          <tr>
            <th className="p-2.5">{t('col.employeeName')}</th>
            <th className="p-2.5">{t('col.designation')}</th>
            <th className="p-2.5">{t('col.joinDate')}</th>
            <th className="p-2.5">{t('col.startSal')}</th>
            <th className="p-2.5">{t('col.increment')}</th>
            <th className="p-2.5">{t('col.currentSal')}</th>
            <th className="p-2.5">{t('col.totalEarn')}</th>
            <th className="p-2.5">{t('col.paid')}</th>
            <th className="p-2.5">{t('col.dueBalance')}</th>
            <th className="p-2.5">{t('col.status')}</th>
            <th className="p-2.5 erp-col-actions">{t('col.actions')}</th>
          </tr>
        </thead>
        <tbody id="table-hr-rows" className="divide-y divide-gray-100 text-gray-600 font-medium">
          {loading ? (
            <tr>
              <td colSpan={11} className="p-3 text-center text-gray-400">
                {t('hr.queryingLedger')}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={11} className="p-3 text-center text-gray-400">
                {t('hr.noEntries')}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const rec = hrRecords.find((r) => r.ID === row.id);
              return (
              <tr key={row.id} className="hover:bg-gray-50 border-b border-gray-100">
                <td className="p-2.5 font-bold text-gray-900 break-words">{row.empName}</td>
                <td className="p-2.5 break-words">{row.designation}</td>
                <td className="p-2.5">{row.joinDate}</td>
                <td className="p-2.5 font-mono erp-cell-nowrap">{fmtMoney(row.baseSalary)}</td>
                <td className="p-2.5 font-mono text-purple-600 erp-cell-nowrap">+{fmtMoney(row.totalInc)}</td>
                <td className="p-2.5 font-mono font-bold text-blue-600 erp-cell-nowrap">{fmtMoney(row.currentSalary)}</td>
                <td className="p-2.5 font-mono text-amber-600 erp-cell-nowrap">{fmtMoney(row.dbEarned)}</td>
                <td className="p-2.5 font-mono text-emerald-600 erp-cell-nowrap">{fmtMoney(row.dbPaid)}</td>
                <td className="p-2.5 font-mono font-bold text-red-600 erp-cell-nowrap">{fmtMoney(row.dbDue)}</td>
                <td className="p-2.5">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${row.badgeClass}`}>
                    {row.status}
                  </span>
                </td>
                <MasterRecordActions
                  user={user}
                  label={`employee "${row.empName}"`}
                  onEdit={() => setEditRecord(rec)}
                  onDelete={() =>
                    runMasterDelete({
                      blockReason: getHrMasterDeleteBlockReason(rec, hrTxns),
                      label: `employee "${row.empName}"`,
                      sheetName: 'HR',
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
      title={t('page.hr.title')}
      formTitle={t('page.hr.newEmployee')}
      ledgerTitle={t('page.hr.personnelRecords')}
      formContent={formContent}
      ledgerContent={ledgerContent}
    />
    <HrEditModal
      open={Boolean(editRecord)}
      record={editRecord}
      hrTxns={hrTxns}
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
