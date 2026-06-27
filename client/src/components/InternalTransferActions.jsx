import { deleteRecord, updateRecord } from '../services/dataService.js';
import { useTxnEdit } from '../context/TxnEditContext.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { getRecordId } from '../lib/txnAdminEngine.js';
import {
  buildApproveTransferRowData,
  getTransferStatus,
  userCanApproveTransfer
} from '../lib/internalTransferEngine.js';
import { userCanAdminTxnActions } from '../utils/userSession.js';

export default function InternalTransferActions({
  user,
  record,
  onMutate,
  allowAdminEdit = false
}) {
  const { openTxnEdit } = useTxnEdit();
  const { t } = useI18n();
  const id = getRecordId(record);
  const status = getTransferStatus(record);
  const canApprove = userCanApproveTransfer(user, record);
  const canAdmin = allowAdminEdit && userCanAdminTxnActions(user);

  if (!id) {
    return (
      <td className="p-2.5 erp-col-actions text-gray-400">
        -
      </td>
    );
  }

  const handleApprove = async () => {
    if (!window.confirm(t('internalTransfer.confirmApprove'))) return;
    try {
      const rowData = buildApproveTransferRowData(record, user.username);
      const res = await updateRecord('Internal_Transfers', id, rowData);
      alert(res.message || (res.success ? t('internalTransfer.approvedSuccess') : t('alert.updateFailed')));
      if (res.success) await onMutate?.();
    } catch {
      alert(t('alert.updateFailed'));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    if (!window.confirm(t('alert.deleteTxnConfirm2'))) return;
    try {
      const res = await deleteRecord('Internal_Transfers', id);
      alert(res.message || (res.success ? t('alert.deleteSuccess') : t('alert.deleteFailed')));
      if (res.success) await onMutate?.();
    } catch {
      alert(t('alert.errorDeletingTxn'));
    }
  };

  return (
    <td className="p-2.5 erp-col-actions whitespace-nowrap">
      {canApprove && (
        <button
          type="button"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5 rounded text-[10px] mr-1"
          onClick={handleApprove}
        >
          {t('internalTransfer.approve')}
        </button>
      )}
      {canAdmin && (
        <>
          <button
            type="button"
            className="btn-txn-edit bg-orange-500 hover:bg-orange-600 text-white font-bold px-2 py-0.5 rounded text-[10px] mr-1"
            onClick={() => openTxnEdit('Internal_Transfers', record)}
          >
            {t('common.edit')}
          </button>
          <button
            type="button"
            className="btn-txn-delete bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded text-[10px]"
            onClick={handleDelete}
          >
            {t('common.delete')}
          </button>
        </>
      )}
      {!canApprove && !canAdmin && (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
          status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {status === 'Approved' ? t('internalTransfer.statusApproved') : t('internalTransfer.statusPending')}
        </span>
      )}
    </td>
  );
}
