import { deleteRecord } from '../services/dataService.js';
import { userCanEditTxnSheet } from '../utils/userSession.js';
import { getRecordId } from '../lib/txnAdminEngine.js';
import { useTxnEdit } from '../context/TxnEditContext.jsx';

export default function TxnLedgerActions({ user, sheetName, record, onMutate, extraBefore }) {
  const { openTxnEdit } = useTxnEdit();
  const canEdit = userCanEditTxnSheet(user, sheetName);
  const id = getRecordId(record);

  if (!canEdit) {
    return (
      <td className="p-2.5 erp-col-actions">
        <span className="text-gray-300 italic text-[10px]">Locked</span>
      </td>
    );
  }

  if (!id) {
    return (
      <td className="p-2.5 erp-col-actions text-gray-400">
        -
      </td>
    );
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      const res = await deleteRecord(sheetName, id);
      alert(res.message || (res.success ? 'Deleted.' : 'Delete failed.'));
      if (res.success) await onMutate?.();
    } catch {
      alert('Error deleting transaction.');
    }
  };

  return (
    <td className="p-2.5 erp-col-actions whitespace-nowrap">
      {extraBefore}
      <button
        type="button"
        className="btn-txn-edit bg-orange-500 hover:bg-orange-600 text-white font-bold px-2 py-0.5 rounded text-[10px] mr-1"
        onClick={() => openTxnEdit(sheetName, record)}
      >
        Edit
      </button>
      <button
        type="button"
        className="btn-txn-delete bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded text-[10px]"
        onClick={handleDelete}
      >
        Delete
      </button>
    </td>
  );
}
