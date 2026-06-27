import { apiRequest, fetchSessionUser } from './auth.js';
import { userCanEditModule } from './user-session.js';
import { t, applyTranslations } from './i18n.js';

let cachedDeliveryRecords = [];
let txnRemarksByUid = {};
let customerMemoByUid = {};

function getCol(rec, names) {
  for (const name of names) {
    const norm = String(name).toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (const key in rec) {
      if (String(key).toUpperCase().replace(/[^A-Z0-9]/g, '') === norm) return rec[key];
    }
  }
  return undefined;
}

function getRecordId(rec) {
  return getCol(rec, ['ID', 'Id', 'id']);
}

function formatDisplayDate(val) {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString();
}

function buildTxnRemarksMap(txnRecords) {
  const map = {};
  (txnRecords || []).forEach((txn) => {
    const uid = String(getCol(txn, ['System Unique ID', 'Sys UID']) || '').trim();
    const remarks = String(getCol(txn, ['Remarks / Reference', 'Remarks / Reference Info', 'Remarks']) || '').trim();
    if (!uid || !remarks) return;
    const ts = new Date(getCol(txn, ['Date']) || 0).getTime() || 0;
    if (!map[uid] || ts >= map[uid].ts) map[uid] = { remarks, ts };
  });
  return map;
}

function buildCustomerMemoMap(customerRecords) {
  const map = {};
  (customerRecords || []).forEach((rec) => {
    const uid = String(getCol(rec, ['System Unique ID', 'Sys UID']) || '').trim();
    const memo = String(getCol(rec, ['Memo', 'Memo #', 'Invoice / Memo Number', 'Invoice Memo Number']) || '').trim();
    if (uid && memo) map[uid] = memo;
  });
  return map;
}

function resolveRemarks(rec) {
  const uid = String(getCol(rec, ['System Unique ID']) || '').trim();
  const fromTxn = txnRemarksByUid[uid]?.remarks;
  if (fromTxn) return fromTxn;

  const stored = String(getCol(rec, ['Remarks']) || '').trim();
  if (stored && customerMemoByUid[uid] && stored === customerMemoByUid[uid]) return '-';
  if (stored) return stored;
  return '-';
}

function sortByDateAsc(records, fieldNames) {
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
    const sa = String(getCol(a, ['Stamp']) || '');
    const sb = String(getCol(b, ['Stamp']) || '');
    return sa.localeCompare(sb);
  });
}

function renderPendingRow(rec) {
  const id = getRecordId(rec);
  const uid = getCol(rec, ['System Unique ID']) || '-';
  const remarks = resolveRemarks(rec);
  const issued = formatDisplayDate(getCol(rec, ['Issued Date']));
  const username = getCol(rec, ['Username', 'Logged By']) || '-';
  const canEdit = userCanEditModule(fetchSessionUser(), 'delivery_dashboard');

  let statusCell;
  if (canEdit) {
    statusCell = `
      <select class="delivery-status-select border rounded p-1 text-xs bg-white" data-id="${id}">
        <option value="Pending" selected>${t('delivery.statusPending')}</option>
        <option value="Delivered">${t('delivery.statusDelivered')}</option>
      </select>
      <div class="delivery-confirm-wrap hidden mt-2 space-y-1" data-for="${id}">
        <label class="block text-[10px] font-bold text-gray-500">${t('delivery.deliveredRemarks')}</label>
        <textarea class="delivery-delivered-remarks w-full border rounded p-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500" rows="2" placeholder="${t('delivery.deliveredRemarksPlaceholder')}"></textarea>
        <button type="button" class="btn-mark-delivered bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[10px]" data-id="${id}">${t('delivery.markDelivered')}</button>
      </div>`;
  } else {
    statusCell = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">${t('delivery.statusPending')}</span>`;
  }

  return `<tr class="border-b hover:bg-gray-50 align-top" data-pending-id="${id}">
    <td class="p-2.5 font-mono font-bold text-xs text-gray-900">${uid}</td>
    <td class="p-2.5 text-xs max-w-[140px] break-words">${remarks}</td>
    <td class="p-2.5 text-xs whitespace-nowrap">${issued}</td>
    <td class="p-2.5 text-xs">${username}</td>
    <td class="p-2.5 text-xs min-w-[160px]">${statusCell}</td>
  </tr>`;
}

function renderDeliveredRow(rec) {
  const uid = getCol(rec, ['System Unique ID']) || '-';
  const remarks = resolveRemarks(rec);
  const username = getCol(rec, ['Username', 'Logged By']) || '-';
  const deliveryDate = formatDisplayDate(getCol(rec, ['Delivery Date']));
  const deliveredRemarks = getCol(rec, ['Delivered Remarks']) || '-';

  return `<tr class="border-b hover:bg-emerald-50/40 align-top">
    <td class="p-2.5 font-mono font-bold text-xs text-gray-900">${uid}</td>
    <td class="p-2.5 text-xs max-w-[140px] break-words">${remarks}</td>
    <td class="p-2.5 text-xs">${username}</td>
    <td class="p-2.5 text-xs whitespace-nowrap">${deliveryDate}</td>
    <td class="p-2.5 text-xs max-w-[180px] break-words">${deliveredRemarks}</td>
  </tr>`;
}

function findCachedDelivery(id) {
  return cachedDeliveryRecords.find((r) => String(getRecordId(r)) === String(id));
}

async function markDelivered(recordId, deliveredRemarks) {
  const rec = findCachedDelivery(recordId);
  if (!rec) return alert(t('alert.errorLoad'));

  const resolvedRemarks = resolveRemarks(rec);

  const rowData = [
    String(getCol(rec, ['System Unique ID']) || ''),
    resolvedRemarks === '-' ? '' : resolvedRemarks,
    getCol(rec, ['Issued Date']) || new Date(),
    String(getCol(rec, ['Username', 'Logged By']) || ''),
    'Delivered',
    new Date(),
    String(deliveredRemarks || '').trim(),
    new Date().toLocaleString()
  ];

  try {
    const res = await apiRequest({
      action: 'UPDATE_RECORD',
      payload: { sheetName: 'Delivery_Queue', recordId, id: recordId, rowData }
    });
    alert(res.message || (res.success ? t('delivery.markedDelivered') : t('delivery.updateFailed')));
    if (res.success) await loadDeliveryDashboard(true);
  } catch (err) {
    console.error(err);
    alert(t('delivery.updateFailed'));
  }
}

async function loadRemarkContext() {
  const [txnRes, custRes] = await Promise.all([
    apiRequest({ action: 'FETCH_RECORDS', payload: { sheetName: 'Customer_Transactions' } }),
    apiRequest({ action: 'FETCH_RECORDS', payload: { sheetName: 'Customers' } })
  ]);
  txnRemarksByUid = buildTxnRemarksMap(txnRes.success ? txnRes.records : []);
  customerMemoByUid = buildCustomerMemoMap(custRes.success ? custRes.records : []);
}

export async function loadDeliveryDashboard(skipSync = false) {
  const pendingBody = document.getElementById('table-delivery-pending');
  const deliveredBody = document.getElementById('table-delivery-delivered');
  if (!pendingBody || !deliveredBody) return;

  pendingBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400 animate-pulse">${t('delivery.loading')}</td></tr>`;
  deliveredBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400 animate-pulse">${t('delivery.loading')}</td></tr>`;

  try {
    if (!skipSync) {
      await apiRequest({ action: 'SYNC_DELIVERY_QUEUE' });
    }
    await loadRemarkContext();

    const result = await apiRequest({ action: 'FETCH_RECORDS', payload: { sheetName: 'Delivery_Queue' } });
    if (!result.success) {
      pendingBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500 font-bold">${result.message || t('delivery.loadFailed')}</td></tr>`;
      deliveredBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500 font-bold">${result.message || t('delivery.loadFailed')}</td></tr>`;
      return;
    }

    cachedDeliveryRecords = result.records || [];
    const pending = sortByDateAsc(
      cachedDeliveryRecords.filter((r) => String(getCol(r, ['Status']) || 'Pending').trim() === 'Pending'),
      ['Issued Date', 'Stamp']
    );
    const delivered = sortByDateAsc(
      cachedDeliveryRecords.filter((r) => String(getCol(r, ['Status']) || '').trim() === 'Delivered'),
      ['Delivery Date', 'Stamp']
    );

    pendingBody.innerHTML = pending.length
      ? pending.map(renderPendingRow).join('')
      : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('delivery.noPending')}</td></tr>`;

    deliveredBody.innerHTML = delivered.length
      ? delivered.map(renderDeliveredRow).join('')
      : `<tr><td colspan="5" class="p-6 text-center text-gray-400">${t('delivery.noDelivered')}</td></tr>`;

    applyTranslations(document.getElementById('delivery-dashboard-root') || document);
  } catch (err) {
    console.error(err);
    pendingBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500 font-bold">${t('delivery.loadFailed')}</td></tr>`;
    deliveredBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500 font-bold">${t('delivery.loadFailed')}</td></tr>`;
  }
}

function bindDeliveryDashboardOnce() {
  if (document.body.dataset.deliveryDashBound === 'true') return;
  document.body.dataset.deliveryDashBound = 'true';

  document.addEventListener('change', (e) => {
    if (!e.target.classList.contains('delivery-status-select')) return;
    const id = e.target.dataset.id;
    const wrap = document.querySelector(`.delivery-confirm-wrap[data-for="${id}"]`);
    if (!wrap) return;
    if (e.target.value === 'Delivered') {
      wrap.classList.remove('hidden');
    } else {
      wrap.classList.add('hidden');
      const ta = wrap.querySelector('.delivery-delivered-remarks');
      if (ta) ta.value = '';
    }
  });

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-mark-delivered');
    if (!btn) return;
    if (!userCanEditModule(fetchSessionUser(), 'delivery_dashboard')) {
      alert(t('alert.viewOnlyModule'));
      return;
    }
    const id = btn.dataset.id;
    const wrap = document.querySelector(`.delivery-confirm-wrap[data-for="${id}"]`);
    const remarks = wrap?.querySelector('.delivery-delivered-remarks')?.value || '';
    await markDelivered(id, remarks);
  });
}

export async function initDeliveryDashboard() {
  bindDeliveryDashboardOnce();
  document.getElementById('btn-refresh-delivery')?.addEventListener('click', () => loadDeliveryDashboard(true));
  await loadDeliveryDashboard(false);
}
