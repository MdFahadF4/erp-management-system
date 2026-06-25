import { deleteRecord } from '../services/dataService.js';
import { confirmTypedDelete } from '../lib/masterAdminEngine.js';
import { userCanAdminMasterActions } from '../utils/userSession.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

export default function MasterRecordActions({ user, label, onEdit, onDelete }) {
  const { t } = useI18n();

  if (!userCanAdminMasterActions(user)) {
    return (
      <td className="p-2.5 erp-col-actions">
        <span className="text-gray-300 italic text-[10px]">{t('common.locked')}</span>
      </td>
    );
  }

  return (
    <td className="p-2.5 erp-col-actions whitespace-nowrap">
      <button
        type="button"
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-2 py-0.5 rounded text-[10px] mr-1"
        onClick={onEdit}
      >
        {t('common.edit')}
      </button>
      <button
        type="button"
        className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded text-[10px]"
        onClick={onDelete}
      >
        Delete
      </button>
    </td>
  );
}

export async function runMasterDelete({ blockReason, label, sheetName, recordId, onDone }) {
  if (blockReason) {
    alert(blockReason);
    return;
  }
  const ok = await confirmTypedDelete(label);
  if (!ok) return;
  try {
    const res = await deleteRecord(sheetName, recordId);
    alert(res.message || (res.success ? 'Deleted.' : 'Delete failed.'));
    if (res.success) await onDone?.();
  } catch {
    alert('Error deleting record.');
  }
}
