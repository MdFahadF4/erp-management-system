import { deleteRecord } from '../services/dataService.js';
import { userCanAdminTxnActions } from '../utils/userSession.js';
import { getRecordId } from '../lib/txnAdminEngine.js';
import { useTxnEdit } from '../context/TxnEditContext.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';

export default function AdminTxnLedgerActions({ user, sheetName, record, onMutate }) {
  const { openTxnEdit } = useTxnEdit();
  const { t } = useI18n();
  const canEdit = userCanAdminTxnActions(user);
  const id = getRecordId(record);

  if (!canEdit) {
    return (
      <td className="p-2.5 erp-col-actions">
        <span className="text-gray-300 italic text-[10px]">{t('common.locked')}</span>
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
    if (!window.confirm(t('common.confirmDelete'))) return;
    if (!window.confirm(t('alert.deleteTxnConfirm2'))) return;
    try {
      const res = await deleteRecord(sheetName, id);
      alert(res.message || (res.success ? t('alert.deleteSuccess') : t('alert.deleteFailed')));
      if (res.success) await onMutate?.();
    } catch {
      alert(t('alert.errorDeletingTxn'));
    }
  };

  return (
    <td className="p-2.5 erp-col-actions whitespace-nowrap">
      <button
        type="button"
        className="btn-txn-edit bg-orange-500 hover:bg-orange-600 text-white font-bold px-2 py-0.5 rounded text-[10px] mr-1"
        onClick={() => openTxnEdit(sheetName, record)}
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
    </td>
  );
}
