import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCategoryLabel } from '../../../js/i18n.js';
import ModuleLedgerLayout from '../components/ModuleLedgerLayout.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import MasterRecordActions, { runMasterDelete } from '../components/MasterRecordActions.jsx';
import { CustomerEditModal } from '../components/MasterEditModals.jsx';
import { createRecord, fetchCustomerModuleData } from '../services/dataService.js';
import {
  buildCustomerLedgerRow,
  fmtMoney,
  formatCustomDateString,
  generateCustomerUniqueId
} from '../lib/customerEngine.js';
import { getCustomerMasterDeleteBlockReason } from '../lib/masterAdminEngine.js';
import { userCanEditModule } from '../utils/userSession.js';

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

export default function CustomersPage({ user, onDataChange }) {
  const { t } = useI18n();
  const canEdit = userCanEditModule(user, 'customers');
  const [customers, setCustomers] = useState([]);
  const [customerTxns, setCustomerTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  const [issueDate, setIssueDate] = useState(todayIso());
  const [memo, setMemo] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const sell = 0;
  const cash = 0;
  const card = 0;
  const received = 0;
  const discount = 0;
  const due = 0;

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCustomerModuleData();
      setCustomers(data.customers);
      setCustomerTxns(data.customerTxns);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const rows = useMemo(
    () => customers.map((rec) => buildCustomerLedgerRow(rec, canEdit)),
    [customers, canEdit]
  );

  const resetForm = () => {
    setMemo('');
    setName('');
    setMobile('');
    setEmail('');
    setAddress('');
    setIssueDate(todayIso());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      alert(t('alert.noPermission'));
      return;
    }
    setSubmitting(true);
    try {
      const issueDateObj = issueDate ? new Date(`${issueDate}T12:00:00`) : new Date();
      const generatedUniqueID = generateCustomerUniqueId(memo, name, issueDateObj, user.username);
      const formattedDateString = formatCustomDateString(issueDateObj);

      const payloadRow = [
        generatedUniqueID,
        name.trim(),
        mobile.trim(),
        email.trim(),
        address.trim(),
        memo.trim(),
        sell,
        cash,
        card,
        received,
        discount,
        due,
        user.username,
        formattedDateString
      ];

      const res = await createRecord('Customers', payloadRow);
      alert(res.message || (res.success ? 'Customer saved.' : 'Could not save customer.'));
      if (res.success) {
        resetForm();
        await loadRecords();
        onDataChange?.();
      }
    } catch {
      alert(t('alert.errorCommit'));
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = (
    <form id="form-cust-entry" className="space-y-2.5 text-xs" onSubmit={handleSubmit}>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">{t('field.saleIssueDate')}</label>
        <input
          type="date"
          id="cust-issue-date"
          required
          value={issueDate}
          onChange={(e) => setIssueDate(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">{t('field.invoiceMemoNumber')}</label>
        <input
          type="text"
          id="cust-memo"
          required
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          disabled={!canEdit}
          placeholder={t('placeholder.memoExample')}
          className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">{t('field.customerName')}</label>
        <input
          type="text"
          id="cust-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">{t('field.mobileContact')}</label>
        <input
          type="text"
          id="cust-mobile"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">{t('field.emailAddress')}</label>
        <input
          type="email"
          id="cust-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">{t('field.physicalAddress')}</label>
        <input
          type="text"
          id="cust-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
      <div className="border-t border-gray-100 pt-2 mt-2">
        <label className="block font-bold text-gray-500 mb-0.5">{t('field.totalGrossSell')}</label>
        <input
          type="number"
          id="cust-sell"
          value={sell.toFixed(2)}
          readOnly
          tabIndex={-1}
          className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 outline-none text-sm font-mono font-bold"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-bold text-gray-500 mb-0.5">{t('field.cashPaidAmt')}</label>
          <input type="number" id="cust-cash" value={cash.toFixed(2)} readOnly tabIndex={-1} className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 outline-none text-sm font-mono" />
        </div>
        <div>
          <label className="block font-bold text-gray-500 mb-0.5">{t('field.cardPaidAmt')}</label>
          <input type="number" id="cust-card" value={card.toFixed(2)} readOnly tabIndex={-1} className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 outline-none text-sm font-mono" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-bold text-gray-500 mb-0.5">{t('field.totalReceived')}</label>
          <input type="number" id="cust-received" value={received.toFixed(2)} readOnly className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 font-semibold text-gray-700 outline-none text-sm font-mono" />
        </div>
        <div>
          <label className="block font-bold text-gray-500 mb-0.5">{t('field.discountIssued')}</label>
          <input type="number" id="cust-discount" value={discount.toFixed(2)} readOnly tabIndex={-1} className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 outline-none text-sm font-mono" />
        </div>
      </div>
      <div>
        <label className="block font-bold text-red-600 mb-0.5">{t('field.outstandingBalanceDue')}</label>
        <input type="number" id="cust-due" value={due.toFixed(2)} readOnly className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 font-bold text-red-600 outline-none text-sm font-mono" />
      </div>
      {canEdit && (
        <button
          type="submit"
          disabled={submitting}
          className="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded text-sm transition tracking-wider disabled:opacity-60"
        >
          {submitting ? t('common.saving') : t('form.cust.commitSale')}
        </button>
      )}
    </form>
  );

  const ledgerContent = (
    <div className="erp-ledger-wrap overflow-x-auto border border-gray-200 rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead className="bg-gray-100 font-bold text-gray-600 uppercase border-b border-gray-200 whitespace-nowrap">
          <tr>
            <th className="p-2.5">{t('col.systemUniqueId')}</th>
            <th className="p-2.5">{t('field.customerName')}</th>
            <th className="p-2.5">{t('col.memo')}</th>
            <th className="p-2.5">{t('col.totalSell')}</th>
            <th className="p-2.5">{t('col.cashAmt')}</th>
            <th className="p-2.5">{t('col.cardAmt')}</th>
            <th className="p-2.5">{t('col.received')}</th>
            <th className="p-2.5">{t('col.discount')}</th>
            <th className="p-2.5">{t('col.dueBalance')}</th>
            <th className="p-2.5 erp-col-actions">{t('col.actions')}</th>
          </tr>
        </thead>
        <tbody id="table-cust-rows" className="divide-y divide-gray-100 text-gray-600 font-medium">
          {loading ? (
            <tr>
              <td colSpan={10} className="p-3 text-center text-gray-400">
                {t('cust.loadingMatrix')}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={10} className="p-3 text-center text-gray-400">
                {t('cust.noInvoices')}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const rec = customers.find((r) => r.ID === row.id);
              return (
              <tr key={row.id} className="hover:bg-gray-50 border-b border-gray-100">
                <td className="p-2.5 font-mono text-[11px] text-gray-500 break-all">{row.uid}</td>
                <td className="p-2.5 font-bold text-gray-900 break-words">{row.name}</td>
                <td className="p-2.5 break-words">{row.memo}</td>
                <td className="p-2.5 font-mono text-gray-900 erp-cell-nowrap">{fmtMoney(row.sell)}</td>
                <td className="p-2.5 font-mono text-emerald-600 erp-cell-nowrap">{fmtMoney(row.cash)}</td>
                <td className="p-2.5 font-mono text-blue-600 erp-cell-nowrap">{fmtMoney(row.card)}</td>
                <td className="p-2.5 font-mono font-bold text-gray-700 erp-cell-nowrap">{fmtMoney(row.received)}</td>
                <td className="p-2.5 font-mono text-purple-600 erp-cell-nowrap">{fmtMoney(row.discount)}</td>
                <td className={`p-2.5 font-mono font-bold erp-cell-nowrap ${row.due > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {fmtMoney(row.due)}
                </td>
                <MasterRecordActions
                  user={user}
                  label={`customer "${row.name}"`}
                  onEdit={() => setEditRecord(rec)}
                  onDelete={() =>
                    runMasterDelete({
                      blockReason: getCustomerMasterDeleteBlockReason(rec, customerTxns),
                      label: `customer "${row.name}"`,
                      sheetName: 'Customers',
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
      title={t('page.customers.title')}
      formTitle={t('form.cust.newSalesEntry')}
      ledgerTitle={t('form.cust.masterLedger')}
      formContent={formContent}
      ledgerContent={ledgerContent}
    />
    <CustomerEditModal
      open={Boolean(editRecord)}
      record={editRecord}
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
