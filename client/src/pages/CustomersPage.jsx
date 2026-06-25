import { useCallback, useEffect, useMemo, useState } from 'react';
import ModuleLedgerLayout from '../components/ModuleLedgerLayout.jsx';
import { createRecord, fetchCustomerModuleData } from '../services/dataService.js';
import {
  buildCustomerLedgerRow,
  fmtMoney,
  formatCustomDateString,
  generateCustomerUniqueId
} from '../lib/customerEngine.js';
import { userCanEditModule } from '../utils/userSession.js';

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

export default function CustomersPage({ user, onDataChange }) {
  const canEdit = userCanEditModule(user, 'customers');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
      alert('You do not have permission to edit this module.');
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
      alert('Error committing customer sale.');
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = (
    <form id="form-cust-entry" className="space-y-2.5 text-xs" onSubmit={handleSubmit}>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">Sale / Issue Date</label>
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
        <label className="block font-bold text-gray-600 mb-0.5">Invoice / Memo Number</label>
        <input
          type="text"
          id="cust-memo"
          required
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          disabled={!canEdit}
          placeholder="e.g. INV-5501"
          className="w-full border border-gray-200 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-600 mb-0.5">Customer Name</label>
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
        <label className="block font-bold text-gray-600 mb-0.5">Mobile Contact</label>
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
        <label className="block font-bold text-gray-600 mb-0.5">Email Address</label>
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
        <label className="block font-bold text-gray-600 mb-0.5">Physical Address</label>
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
        <label className="block font-bold text-gray-500 mb-0.5">Total Gross Sell Amount</label>
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
          <label className="block font-bold text-gray-500 mb-0.5">Cash Paid Amt</label>
          <input type="number" id="cust-cash" value={cash.toFixed(2)} readOnly tabIndex={-1} className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 outline-none text-sm font-mono" />
        </div>
        <div>
          <label className="block font-bold text-gray-500 mb-0.5">Card Paid Amt</label>
          <input type="number" id="cust-card" value={card.toFixed(2)} readOnly tabIndex={-1} className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 outline-none text-sm font-mono" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-bold text-gray-500 mb-0.5">Total Received</label>
          <input type="number" id="cust-received" value={received.toFixed(2)} readOnly className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 font-semibold text-gray-700 outline-none text-sm font-mono" />
        </div>
        <div>
          <label className="block font-bold text-gray-500 mb-0.5">Discount Issued</label>
          <input type="number" id="cust-discount" value={discount.toFixed(2)} readOnly tabIndex={-1} className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 outline-none text-sm font-mono" />
        </div>
      </div>
      <div>
        <label className="block font-bold text-red-600 mb-0.5">Outstanding Balance Due</label>
        <input type="number" id="cust-due" value={due.toFixed(2)} readOnly className="w-full border border-gray-200 rounded p-1.5 bg-gray-50 font-bold text-red-600 outline-none text-sm font-mono" />
      </div>
      {canEdit && (
        <button
          type="submit"
          disabled={submitting}
          className="erp-submit-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded text-sm transition tracking-wider disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'COMMIT CUSTOMER SALE'}
        </button>
      )}
    </form>
  );

  const ledgerContent = (
    <div className="erp-ledger-wrap overflow-x-auto border border-gray-200 rounded-lg md:flex-1 md:min-h-0 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead className="bg-gray-100 font-bold text-gray-600 uppercase border-b border-gray-200 whitespace-nowrap">
          <tr>
            <th className="p-2.5">System Unique ID</th>
            <th className="p-2.5">Customer Name</th>
            <th className="p-2.5">Memo #</th>
            <th className="p-2.5">Total Sell</th>
            <th className="p-2.5">Cash Amt</th>
            <th className="p-2.5">Card Amt</th>
            <th className="p-2.5">Received</th>
            <th className="p-2.5">Discount</th>
            <th className="p-2.5">Due Balance</th>
            <th className="p-2.5 erp-col-actions">Actions</th>
          </tr>
        </thead>
        <tbody id="table-cust-rows" className="divide-y divide-gray-100 text-gray-600 font-medium">
          {loading ? (
            <tr>
              <td colSpan={10} className="p-3 text-center text-gray-400">
                Loading customer matrix…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={10} className="p-3 text-center text-gray-400">
                No customer invoices found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 border-b border-gray-100">
                <td className="p-2.5 font-mono text-[11px] text-gray-500">{row.uid}</td>
                <td className="p-2.5 font-bold text-gray-900">{row.name}</td>
                <td className="p-2.5">{row.memo}</td>
                <td className="p-2.5 font-mono text-gray-900">{fmtMoney(row.sell)}</td>
                <td className="p-2.5 font-mono text-emerald-600">{fmtMoney(row.cash)}</td>
                <td className="p-2.5 font-mono text-blue-600">{fmtMoney(row.card)}</td>
                <td className="p-2.5 font-mono font-bold text-gray-700">{fmtMoney(row.received)}</td>
                <td className="p-2.5 font-mono text-purple-600">{fmtMoney(row.discount)}</td>
                <td className={`p-2.5 font-mono font-bold ${row.due > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {fmtMoney(row.due)}
                </td>
                <td className="p-2.5 erp-col-actions">
                  {row.canEdit ? (
                    <span className="text-gray-400 text-[10px] italic">Edit (soon)</span>
                  ) : (
                    <span className="text-gray-300 italic text-[10px]">Locked</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <ModuleLedgerLayout
      title="Customer Accounts Matrix"
      formTitle="New Customer Sales Entry"
      ledgerTitle="Customer Master Invoice Ledger"
      formContent={formContent}
      ledgerContent={ledgerContent}
    />
  );
}
