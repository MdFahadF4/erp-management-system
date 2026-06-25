import { getCol, fmtMoney } from './recordHelpers.js';

export function countLinkedHeadTxns(txns, fieldMap, mainHead, subHead) {
  const m = String(mainHead || '')
    .trim()
    .toUpperCase();
  const s = String(subHead || '')
    .trim()
    .toUpperCase();
  return (txns || []).filter((t) => {
    const tm = String(getCol(t, fieldMap.main) || '')
      .trim()
      .toUpperCase();
    const ts = String(getCol(t, fieldMap.sub) || '')
      .trim()
      .toUpperCase();
    return tm === m && ts === s;
  }).length;
}

export function headPairExists(heads, mainCols, subCols, mainHead, subHead, excludeId) {
  const m = String(mainHead || '')
    .trim()
    .toUpperCase();
  const s = String(subHead || '')
    .trim()
    .toUpperCase();
  return (heads || []).some((rec) => {
    const id = rec.ID || rec.id;
    if (excludeId && id === excludeId) return false;
    const hm = String(getCol(rec, mainCols) || '')
      .trim()
      .toUpperCase();
    const hs = String(getCol(rec, subCols) || '')
      .trim()
      .toUpperCase();
    return hm === m && hs === s;
  });
}

export function getHeadDeleteBlockReason(row, txns, fieldMap) {
  if (!row) return 'Invalid head record.';
  if (Number(row.due) > 0.001) {
    return `Cannot delete: due balance SAR ${fmtMoney(row.due)} remains on this head pair.`;
  }
  const count = countLinkedHeadTxns(txns, fieldMap, row.mainHead, row.subHead);
  if (count > 0) {
    return `Cannot delete: ${count} linked transaction(s) exist for "${row.mainHead} > ${row.subHead}".`;
  }
  return null;
}

export function buildHeadUpdateRow(row, mainHead, subHead, user) {
  return [
    row.trackingId,
    mainHead.trim(),
    subHead.trim(),
    user?.username || row.user || '',
    row.stamp
  ];
}
