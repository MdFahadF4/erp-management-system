import { getCol } from './recordHelpers.js';

function normalizeDeliveryUid(uid) {
  return String(uid || '').trim().toUpperCase();
}

export function getRecordId(rec) {
  return getCol(rec, ['ID', 'Id', 'id']);
}

export function formatDisplayDate(val) {
  if (!val) return '-';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString();
}

export function buildCustomerUidSet(customerRecords) {
  const set = new Set();
  (customerRecords || []).forEach((rec) => {
    const uid = normalizeDeliveryUid(getCol(rec, ['System Unique ID', 'Sys UID']));
    if (uid) set.add(uid);
  });
  return set;
}

export function buildCustomerTxnUidSet(txnRecords) {
  const set = new Set();
  (txnRecords || []).forEach((txn) => {
    const uid = normalizeDeliveryUid(getCol(txn, ['System Unique ID', 'Sys UID']));
    if (uid) set.add(uid);
  });
  return set;
}

export function isDeliveryQueueEntryVisible(rec, customerUids, txnUids) {
  const uid = normalizeDeliveryUid(getCol(rec, ['System Unique ID', 'Sys UID', 'Unique ID']));
  if (!uid || !customerUids.has(uid)) return false;
  const status = String(getCol(rec, ['Status']) || 'Pending').trim();
  if (status === 'Pending' && !txnUids.has(uid)) return false;
  return true;
}

export function buildTxnRemarksMap(txnRecords) {
  const map = {};
  (txnRecords || []).forEach((txn) => {
    const uid = String(getCol(txn, ['System Unique ID', 'Sys UID']) || '').trim();
    const remarks = String(
      getCol(txn, ['Remarks / Reference', 'Remarks / Reference Info', 'Remarks']) || ''
    ).trim();
    if (!uid || !remarks) return;
    const ts = new Date(getCol(txn, ['Date']) || 0).getTime() || 0;
    if (!map[uid] || ts >= map[uid].ts) map[uid] = { remarks, ts };
  });
  return map;
}

export function buildCustomerMemoMap(customerRecords) {
  const map = {};
  (customerRecords || []).forEach((rec) => {
    const uid = String(getCol(rec, ['System Unique ID', 'Sys UID']) || '').trim();
    const memo = String(
      getCol(rec, ['Memo', 'Memo #', 'Invoice / Memo Number', 'Invoice Memo Number']) || ''
    ).trim();
    if (uid && memo) map[uid] = memo;
  });
  return map;
}

export function resolveDeliveryRemarks(rec, txnRemarksByUid, customerMemoByUid) {
  const uid = String(getCol(rec, ['System Unique ID']) || '').trim();
  const fromTxn = txnRemarksByUid[uid]?.remarks;
  if (fromTxn) return fromTxn;

  const stored = String(getCol(rec, ['Remarks']) || '').trim();
  if (stored && customerMemoByUid[uid] && stored === customerMemoByUid[uid]) return '-';
  if (stored) return stored;
  return '-';
}

export function sortDeliveryByDateAsc(records, fieldNames) {
  return [...records].sort((a, b) => {
    let da = 0;
    let db = 0;
    for (const f of fieldNames) {
      const va = getCol(a, [f]);
      const vb = getCol(b, [f]);
      if (va) da = Math.max(da, new Date(va).getTime() || 0);
      if (vb) db = Math.max(db, new Date(vb).getTime() || 0);
    }
    if (da !== db) return da - db;
    return String(getCol(a, ['Stamp']) || '').localeCompare(String(getCol(b, ['Stamp']) || ''));
  });
}

export function buildMarkDeliveredRowData(rec, resolvedRemarks) {
  return [
    String(getCol(rec, ['System Unique ID']) || ''),
    resolvedRemarks === '-' ? '' : resolvedRemarks,
    getCol(rec, ['Issued Date']) || new Date(),
    String(getCol(rec, ['Username', 'Logged By']) || ''),
    'Delivered',
    new Date(),
    '',
    new Date().toLocaleString()
  ];
}
