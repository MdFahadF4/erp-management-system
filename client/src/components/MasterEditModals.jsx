import { useEffect, useMemo, useState } from 'react';
import { updateRecord } from '../services/dataService.js';
import { getCol } from '../lib/dualHeadEngine.js';
import { buildCustomerMasterUpdateRow, buildHrMasterUpdateRow, buildSupplierMasterUpdateRow } from '../lib/masterAdminEngine.js';
import { rollupHrTxnTotals, getHrEmployeeName } from '../lib/hrEngine.js';
import { addMoney, parseMoneyInput, preventNumberWheelScroll, reconcileEarnedPaid, roundMoney } from '../lib/recordHelpers.js';

const STATUS_OPTIONS = ['Active', 'Vacation', 'Inactive', 'Released'];

export function HrEditModal({ open, record, hrTxns, user, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [joining, setJoining] = useState('');
  const [salaryStart, setSalaryStart] = useState('0');
  const [totalEarn, setTotalEarn] = useState('0');
  const [totalPaid, setTotalPaid] = useState('0');
  const [status, setStatus] = useState('Active');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !record) return;
    const emp = getHrEmployeeName(record);
    const totals = rollupHrTxnTotals(hrTxns, emp);
    setName(emp);
    setDesignation(getCol(record, ['Designation']) || '');
    const joinRaw = getCol(record, ['Date of Joining', 'Join Date']);
    setJoining(joinRaw ? String(joinRaw).slice(0, 10) : '');
    setSalaryStart(String(parseFloat(getCol(record, ['Salary Start'])) || 0));
    setTotalEarn(String(totals.earned));
    setTotalPaid(String(totals.paid));
    setStatus(getCol(record, ['Status', 'Employment Status']) || 'Active');
  }, [open, record, hrTxns]);

  const duePreview = useMemo(() => {
    const e = parseFloat(totalEarn) || 0;
    const p = parseFloat(totalPaid) || 0;
    return reconcileEarnedPaid(e, p).due;
  }, [totalEarn, totalPaid]);

  const currentSalaryPreview = useMemo(() => {
    const base = parseMoneyInput(salaryStart);
    const totals = rollupHrTxnTotals(hrTxns, getHrEmployeeName(record || {}));
    return addMoney(base, totals.increment);
  }, [salaryStart, hrTxns, record]);

  if (!open || !record) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const rowData = buildHrMasterUpdateRow(record, hrTxns, {
        name,
        designation,
        joining,
        salaryStart,
        totalEarn,
        totalPaid,
        status
      }, user);
      const res = await updateRecord('HR', record.ID, rowData);
      alert(res.message || (res.success ? 'HR record updated.' : 'Update failed.'));
      if (res.success) {
        await onSaved?.();
        onClose?.();
      }
    } catch {
      alert('Error updating HR record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 border border-gray-100">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-bold text-gray-800">Modify Employee Record</h3>
          <button type="button" className="text-2xl font-bold text-gray-400 hover:text-gray-700" onClick={onClose}>×</button>
        </div>
        <form className="grid grid-cols-2 gap-3 text-xs" onSubmit={handleSubmit}>
          <div className="col-span-2">
            <label className="block font-bold text-gray-600 mb-1">Employee Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Designation</label>
            <input required value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Date of Joining</label>
            <input type="date" required value={joining} onChange={(e) => setJoining(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Salary Start</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={salaryStart}
              onChange={(e) => setSalaryStart(e.target.value)}
              onBlur={() => setSalaryStart(String(parseMoneyInput(salaryStart)))}
              onWheel={preventNumberWheelScroll}
              className="w-full border rounded p-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-500 mb-1">Current Salary</label>
            <input readOnly value={currentSalaryPreview.toFixed(2)} className="w-full border rounded p-2 text-sm bg-gray-50 text-blue-600 font-bold" />
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded p-2 bg-white text-sm outline-none">
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Total Earn Earning</label>
            <input type="number" step="any" value={totalEarn} onChange={(e) => setTotalEarn(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Paid Salary</label>
            <input type="number" step="any" value={totalPaid} onChange={(e) => setTotalPaid(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block font-bold text-gray-500 mb-1">Due Balance (preview)</label>
            <input readOnly value={duePreview.toFixed(2)} className="w-full border rounded p-2 text-sm bg-gray-50 text-red-600 font-bold" />
          </div>
          <div className="col-span-2 flex justify-end gap-2 pt-2 border-t">
            <button type="button" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded text-sm" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded text-sm disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CustomerEditModal({ open, record, user, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [memo, setMemo] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [sell, setSell] = useState('0');
  const [cash, setCash] = useState('0');
  const [card, setCard] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !record) return;
    setName(getCol(record, ['Customer Name', 'Name']) || '');
    setMemo(getCol(record, ['Invoice / Memo Number', 'Invoice', 'Memo']) || '');
    setMobile(getCol(record, ['Mobile']) || '');
    setEmail(getCol(record, ['Email']) || '');
    setAddress(getCol(record, ['Address']) || '');
    setSell(String(parseFloat(getCol(record, ['Total Sell', 'Sell Amount'])) || 0));
    setCash(String(parseFloat(getCol(record, ['Cash Amt', 'Cash Amount'])) || 0));
    setCard(String(parseFloat(getCol(record, ['Card Amt', 'Card Amount'])) || 0));
    setDiscount(String(parseFloat(getCol(record, ['Discount'])) || 0));
  }, [open, record]);

  const received = (parseFloat(cash) || 0) + (parseFloat(card) || 0);
  const duePreview = Math.max(0, (parseFloat(sell) || 0) - received - (parseFloat(discount) || 0));

  if (!open || !record) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const rowData = buildCustomerMasterUpdateRow(record, { name, memo, mobile, email, address, sell, cash, card, discount }, user);
      const res = await updateRecord('Customers', record.ID, rowData);
      alert(res.message || (res.success ? 'Customer updated.' : 'Update failed.'));
      if (res.success) {
        await onSaved?.();
        onClose?.();
      }
    } catch {
      alert('Error updating customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 border border-gray-100">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-bold text-gray-800">Modify Customer Record</h3>
          <button type="button" className="text-2xl font-bold text-gray-400 hover:text-gray-700" onClick={onClose}>×</button>
        </div>
        <form className="grid grid-cols-2 gap-3 text-xs" onSubmit={handleSubmit}>
          <div className="col-span-2">
            <label className="block font-bold text-gray-600 mb-1">System Unique ID</label>
            <input readOnly value={getCol(record, ['System Unique ID']) || ''} className="w-full border rounded p-2 text-sm bg-gray-50 font-mono" />
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Customer Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Invoice / Memo #</label>
            <input required value={memo} onChange={(e) => setMemo(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Mobile</label>
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block font-bold text-gray-600 mb-1">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border rounded p-2 text-sm outline-none break-words" />
          </div>
          <div className="col-span-2">
            <label className="block font-bold text-gray-600 mb-1">Gross Sell Amount</label>
            <input type="number" step="any" value={sell} onChange={(e) => setSell(e.target.value)} className="w-full border rounded p-2 text-sm font-mono outline-none" />
          </div>
          <div>
            <label className="block font-bold text-emerald-700 mb-1">Cash Paid</label>
            <input type="number" step="any" value={cash} onChange={(e) => setCash(e.target.value)} className="w-full border rounded p-2 text-sm font-mono outline-none" />
          </div>
          <div>
            <label className="block font-bold text-blue-700 mb-1">Card Paid</label>
            <input type="number" step="any" value={card} onChange={(e) => setCard(e.target.value)} className="w-full border rounded p-2 text-sm font-mono outline-none" />
          </div>
          <div>
            <label className="block font-bold text-gray-500 mb-1">Total Received</label>
            <input readOnly value={received.toFixed(2)} className="w-full border rounded p-2 text-sm bg-gray-50 font-mono" />
          </div>
          <div>
            <label className="block font-bold text-purple-700 mb-1">Discount</label>
            <input type="number" step="any" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full border rounded p-2 text-sm font-mono outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block font-bold text-red-600 mb-1">Due Balance</label>
            <input readOnly value={duePreview.toFixed(2)} className="w-full border rounded p-2 text-sm bg-gray-50 text-red-600 font-bold font-mono" />
          </div>
          <div className="col-span-2 flex justify-end gap-2 pt-2 border-t">
            <button type="button" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded text-sm" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded text-sm disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SupplierEditModal({ open, record, supplierTxns, user, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [purchase, setPurchase] = useState('0');
  const [payments, setPayments] = useState('0');
  const [status, setStatus] = useState('Active');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !record) return;
    setName(getCol(record, ['Supplier Name']) || '');
    setMobile(getCol(record, ['Mobile']) || '');
    setEmail(getCol(record, ['Email']) || '');
    setAddress(getCol(record, ['Address']) || '');
    setPurchase(String(parseFloat(getCol(record, ['Total Purchase'])) || 0));
    setPayments(String(parseFloat(getCol(record, ['Total Payments'])) || 0));
    setStatus(getCol(record, ['Status']) || 'Active');
  }, [open, record]);

  const duePreview = Math.max(0, (parseFloat(purchase) || 0) - (parseFloat(payments) || 0));

  if (!open || !record) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const rowData = buildSupplierMasterUpdateRow(record, supplierTxns, { name, mobile, email, address, purchase, payments, status }, user);
      const res = await updateRecord('Suppliers', record.ID, rowData);
      alert(res.message || (res.success ? 'Supplier updated.' : 'Update failed.'));
      if (res.success) {
        await onSaved?.();
        onClose?.();
      }
    } catch {
      alert('Error updating supplier.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 border border-gray-100">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-bold text-gray-800">Modify Supplier Record</h3>
          <button type="button" className="text-2xl font-bold text-gray-400 hover:text-gray-700" onClick={onClose}>×</button>
        </div>
        <form className="grid grid-cols-2 gap-3 text-xs" onSubmit={handleSubmit}>
          <div className="col-span-2">
            <label className="block font-bold text-gray-600 mb-1">Supplier Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Mobile</label>
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block font-bold text-gray-600 mb-1">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Total Purchase</label>
            <input type="number" step="any" value={purchase} onChange={(e) => setPurchase(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Total Payments</label>
            <input type="number" step="any" value={payments} onChange={(e) => setPayments(e.target.value)} className="w-full border rounded p-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block font-bold text-gray-500 mb-1">Due Balance</label>
            <input readOnly value={duePreview.toFixed(2)} className="w-full border rounded p-2 text-sm bg-gray-50 text-red-600 font-bold" />
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded p-2 bg-white text-sm outline-none">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="col-span-2 flex justify-end gap-2 pt-2 border-t">
            <button type="button" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded text-sm" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded text-sm disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
