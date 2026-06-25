import { useEffect, useMemo, useState } from 'react';
import { updateRecord } from '../services/dataService.js';
import { userCanEditTxnSheet } from '../utils/userSession.js';
import {
  buildUpdateRowData,
  computeTxnDue,
  getRecordId,
  getTxnEditForm,
  TXN_DUAL_DUE_SYNC
} from '../lib/txnAdminEngine.js';
import { useTxnEdit } from '../context/TxnEditContext.jsx';

function EditField({ field, value, onChange }) {
  const { key, label, type, options, readOnly } = field;
  const commonClass = 'w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-orange-300';

  if (type === 'textarea') {
    return (
      <div>
        <label className="block font-bold text-gray-600 mb-1">{label}</label>
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(key, e.target.value)}
          rows={2}
          readOnly={readOnly}
          className={commonClass}
        />
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div>
        <label className="block font-bold text-gray-600 mb-1">{label}</label>
        <select
          value={value ?? ''}
          onChange={(e) => onChange(key, e.target.value)}
          disabled={readOnly}
          className={`${commonClass} bg-white`}
        >
          {(options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="block font-bold text-gray-600 mb-1">{label}</label>
      <input
        type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
        step={type === 'number' ? 'any' : undefined}
        value={value ?? ''}
        onChange={(e) => onChange(key, e.target.value)}
        readOnly={readOnly}
        className={commonClass}
      />
    </div>
  );
}

export default function TxnEditModal() {
  const { user, open, sheetName, record, closeTxnEdit, onGlobalMutate } = useTxnEdit();
  const [values, setValues] = useState({});
  const [fields, setFields] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const formConfig = useMemo(() => {
    if (!open || !sheetName || !record) return null;
    return getTxnEditForm(sheetName, record);
  }, [open, sheetName, record]);

  useEffect(() => {
    if (!formConfig) {
      setValues({});
      setFields([]);
      return;
    }
    setValues(formConfig.values);
    setFields(formConfig.fields);
  }, [formConfig]);

  const dueSync = sheetName ? TXN_DUAL_DUE_SYNC[sheetName] : null;

  const handleChange = (key, val) => {
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      if (dueSync) {
        const { bill, pay, discount, due } = dueSync;
        if (key === bill || key === pay || key === discount) {
          next[due] = computeTxnDue(next[bill], next[discount], next[pay]);
        }
      }
      return next;
    });
  };

  const handleClose = () => {
    if (submitting) return;
    closeTxnEdit();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sheetName || !record) return;
    if (!userCanEditTxnSheet(user, sheetName)) {
      alert('View-only module — you cannot edit transactions here.');
      return;
    }

    const recordId = getRecordId(record);
    if (!recordId) {
      alert('Could not resolve record ID.');
      return;
    }

    setSubmitting(true);
    try {
      const rowData = buildUpdateRowData(sheetName, record, values, user);
      const res = await updateRecord(sheetName, recordId, rowData);
      alert(res.message || (res.success ? 'Transaction updated.' : 'Update failed.'));
      if (res.success) {
        closeTxnEdit();
        await onGlobalMutate?.();
      }
    } catch (err) {
      console.error(err);
      alert('Error saving transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !sheetName || !record) return null;

  return (
    <div
      id="modal-txn-edit"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border border-gray-100">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-bold text-gray-800">Edit Transaction</h3>
          <button
            type="button"
            id="close-txn-modal"
            onClick={handleClose}
            className="text-2xl font-bold text-gray-400 hover:text-gray-700 focus:outline-none"
          >
            &times;
          </button>
        </div>
        <form id="form-txn-edit" className="space-y-3 text-xs" onSubmit={handleSubmit}>
          <div id="edit-txn-fields" className="space-y-3">
            {fields.map((field) => (
              <EditField key={field.key} field={field} value={values[field.key]} onChange={handleChange} />
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              id="btn-cancel-txn-edit"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold rounded text-sm shadow-md"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
