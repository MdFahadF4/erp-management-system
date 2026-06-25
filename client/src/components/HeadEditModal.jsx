import { useEffect, useState } from 'react';
import { updateRecord } from '../services/dataService.js';
import { buildHeadUpdateRow, countLinkedHeadTxns, headPairExists } from '../lib/headAdminEngine.js';

export default function HeadEditModal({ open, row, config, heads, txns, user, onClose, onSaved }) {
  const [mainHead, setMainHead] = useState('');
  const [subHead, setSubHead] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !row) return;
    setMainHead(row.mainHead || '');
    setSubHead(row.subHead || '');
  }, [open, row]);

  if (!open || !row) return null;

  const linkedCount = countLinkedHeadTxns(txns, config.fieldMap, row.mainHead, row.subHead);
  const namesChanged =
    String(mainHead).trim().toUpperCase() !== String(row.mainHead || '').trim().toUpperCase() ||
    String(subHead).trim().toUpperCase() !== String(row.subHead || '').trim().toUpperCase();

  const handleSave = async (e) => {
    e.preventDefault();
    const nextMain = mainHead.trim();
    const nextSub = subHead.trim();
    if (!nextMain || !nextSub) {
      alert('Parent head and sub head are required.');
      return;
    }
    if (
      headPairExists(heads, config.mainCols, config.subCols, nextMain, nextSub, row.id)
    ) {
      alert('This parent head and sub head combination already exists.');
      return;
    }
    if (namesChanged && linkedCount > 0) {
      const proceed = window.confirm(
        `${linkedCount} transaction(s) are linked to the old names.\n\n` +
          'Updating the head labels will NOT automatically rename those transactions.\n\n' +
          'Continue saving the new head names?'
      );
      if (!proceed) return;
    }
    setSaving(true);
    try {
      const rowData = buildHeadUpdateRow(row, nextMain, nextSub, user);
      const res = await updateRecord(config.headSheet, row.id, rowData);
      alert(res.message || (res.success ? 'Head updated.' : 'Update failed.'));
      if (res.success) {
        await onSaved?.();
        onClose?.();
      }
    } catch {
      alert('Error updating head structure.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 uppercase text-sm tracking-wide">Edit Head Structure</h3>
          <button type="button" className="text-gray-400 hover:text-gray-700 text-xl leading-none" onClick={onClose}>
            ×
          </button>
        </div>
        <form className="p-4 space-y-3 text-sm" onSubmit={handleSave}>
          <div className="text-xs text-gray-500 font-mono bg-gray-50 rounded p-2">{row.trackingId}</div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Parent Head / Main Category</label>
            <input
              type="text"
              required
              value={mainHead}
              onChange={(e) => setMainHead(e.target.value)}
              className="w-full border border-gray-200 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-600 mb-1">Sub Head</label>
            <input
              type="text"
              required
              value={subHead}
              onChange={(e) => setSubHead(e.target.value)}
              className="w-full border border-gray-200 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          {linkedCount > 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded p-2">
              {linkedCount} linked transaction(s) use the current head names.
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded hover:bg-gray-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
