/**
 * Transaction Edit & Delete (permission-aware)
 */
import { apiRequest, fetchSessionUser } from './auth.js';
import { userCanEditTxnSheet } from './user-session.js';
import { t, applyTranslations } from './i18n.js';

const txnCache = new Map();
let reloadHandlers = {};
let onDrawerRefresh = null;
let onGlobalRefresh = null;

function getCol(rec, possibleNames) {
  for (const name of possibleNames) {
    const normName = String(name).toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (const key in rec) {
      const normKey = String(key).toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (normName === normKey) return rec[key];
    }
  }
  return undefined;
}

export function canAdminEdit(sheetName) {
  return userCanEditTxnSheet(fetchSessionUser(), sheetName);
}

export function getRecordId(rec) {
  return getCol(rec, ['ID', 'Id', 'id']) ?? rec['ID'];
}

export function cacheTxnRecords(sheetName, records) {
  txnCache.set(sheetName, records || []);
}

export function findCachedTxn(sheetName, id) {
  return (txnCache.get(sheetName) || []).find((r) => String(getRecordId(r)) === String(id));
}

export function renderTxnActions(rec, sheetName) {
  if (!canAdminEdit(sheetName)) {
    return `<td class="p-2.5"><span class="text-gray-300 italic text-[10px]">${t('common.locked')}</span></td>`;
  }
  const id = getRecordId(rec);
  if (!id) return `<td class="p-2.5 text-gray-400">-</td>`;
  return `<td class="p-2.5 whitespace-nowrap">
    <button type="button" class="btn-txn-edit bg-orange-500 hover:bg-orange-600 text-white font-bold px-2 py-0.5 rounded text-[10px] mr-1" data-id="${id}" data-sheet="${sheetName}">${t('common.edit')}</button>
    <button type="button" class="btn-txn-delete bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded text-[10px]" data-id="${id}" data-sheet="${sheetName}">${t('common.delete')}</button>
  </td>`;
}

function formatDateInput(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val).slice(0, 10);
  const pad = (n) => (n < 10 ? '0' + n : n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fieldHtml(key, labelKey, type, value, extra = '') {
  const v = value ?? '';
  if (type === 'textarea') {
    return `<div><label class="block font-bold text-gray-600 mb-1" data-i18n="${labelKey}">${t(labelKey)}</label><textarea data-field="${key}" rows="2" class="w-full border rounded p-2 text-sm outline-none">${v}</textarea></div>`;
  }
  if (type === 'select-categories-hr') {
    const opts = ['Salary Earn', 'Salary Paid', 'Salary Increment', 'Previous Due'];
    return `<div><label class="block font-bold text-gray-600 mb-1" data-i18n="${labelKey}">${t(labelKey)}</label><select data-field="${key}" class="w-full border rounded p-2 bg-white text-sm outline-none">${opts.map((o) => `<option value="${o}" ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
  }
  if (type === 'select-sup-cat') {
    const opts = ['Purchase', 'Payment Paid', 'Previous Due'];
    return `<div><label class="block font-bold text-gray-600 mb-1" data-i18n="${labelKey}">${t(labelKey)}</label><select data-field="${key}" class="w-full border rounded p-2 bg-white text-sm outline-none">${opts.map((o) => `<option value="${o}" ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
  }
  if (type === 'select-pay') {
    return `<div><label class="block font-bold text-gray-600 mb-1" data-i18n="${labelKey}">${t(labelKey)}</label><select data-field="${key}" class="w-full border rounded p-2 bg-white text-sm outline-none"><option value="Cash" ${v === 'Cash' ? 'selected' : ''}>Cash</option><option value="Card" ${v === 'Card' ? 'selected' : ''}>Card</option></select></div>`;
  }
  return `<div><label class="block font-bold text-gray-600 mb-1" data-i18n="${labelKey}">${t(labelKey)}</label><input data-field="${key}" type="${type}" step="any" class="w-full border rounded p-2 text-sm outline-none" value="${v}" ${extra}></div>`;
}

const TXN_FORMS = {
  HR_Transactions(rec) {
    return [
      fieldHtml('date', 'field.transactionDate', 'date', formatDateInput(getCol(rec, ['Date']))),
      fieldHtml('employee', 'field.employeeName', 'text', getCol(rec, ['Employee Name'])),
      fieldHtml('amount', 'field.amount', 'number', getCol(rec, ['Amount'])),
      fieldHtml('category', 'field.categoryClassification', 'select-categories-hr', getCol(rec, ['Category'])),
      fieldHtml('remarks', 'field.remarksReference', 'textarea', getCol(rec, ['Remarks']))
    ].join('');
  },
  Supplier_Transactions(rec) {
    const p = typeof parseSupplierTxnAmounts === 'function' ? parseSupplierTxnAmounts(rec) : { bill: getCol(rec, ['Amount']), discount: 0, pay: 0, txnDue: getCol(rec, ['Amount']) };
    return [
      fieldHtml('date', 'field.transactionDate', 'date', formatDateInput(getCol(rec, ['Date']))),
      fieldHtml('supplier', 'field.supplierName', 'text', getCol(rec, ['Supplier Name'])),
      fieldHtml('purchase', 'field.purchaseAmount', 'number', p.bill),
      fieldHtml('discount', 'field.discountAllowed', 'number', p.discount),
      fieldHtml('paid', 'field.paymentPaidAmount', 'number', p.pay),
      fieldHtml('due', 'field.transactionDueBalance', 'number', p.txnDue, 'readonly'),
      fieldHtml('remarks', 'field.remarksReference', 'textarea', getCol(rec, ['Remarks / Reference', 'Remarks']))
    ].join('');
  },
  Customer_Transactions(rec) {
    return [
      fieldHtml('date', 'field.transactionDate', 'date', formatDateInput(getCol(rec, ['Date']))),
      fieldHtml('uid', 'field.systemUniqueId', 'text', getCol(rec, ['System Unique ID', 'Sys UID']), 'readonly'),
      fieldHtml('sold', 'field.soldAmount', 'number', getCol(rec, ['Sold Amount', 'Sold Amt'])),
      fieldHtml('discount', 'field.discountAllowed', 'number', getCol(rec, ['Discount', 'Discount Amount', 'Txn Discount'])),
      fieldHtml('received', 'field.receivedAmount', 'number', getCol(rec, ['Received Amount', 'Received Amt'])),
      fieldHtml('method', 'field.paymentMethod', 'select-pay', getCol(rec, ['Payment Method', 'Method'])),
      fieldHtml('due', 'field.transactionDueBalance', 'number', getCol(rec, ['Transaction Due', 'Txn Due', 'Due']), 'readonly'),
      fieldHtml('remarks', 'field.remarksReference', 'textarea', getCol(rec, ['Remarks', 'Remarks / Reference']))
    ].join('');
  },
  Internal_Transfers(rec) {
    return [
      fieldHtml('date', 'field.transferDate', 'date', formatDateInput(getCol(rec, ['Date']))),
      fieldHtml('amount', 'field.transferCashAmount', 'number', getCol(rec, ['Transfer Amount', 'Amount'])),
      fieldHtml('desc', 'field.descriptionNarrative', 'textarea', getCol(rec, ['Description', 'Description / Purpose']))
    ].join('');
  },
  Expense_Transactions(rec) {
    return [
      fieldHtml('date', 'field.transactionDate', 'date', formatDateInput(getCol(rec, ['Date']))),
      fieldHtml('main', 'field.expenseParentHead', 'text', getCol(rec, ['Expense Parent Head', 'Parent Category', 'Main Head'])),
      fieldHtml('sub', 'field.subHeadMapping', 'text', getCol(rec, ['Sub Head', 'SubCategory'])),
      fieldHtml('deposit', 'field.totalDepositIncurred', 'number', getCol(rec, ['Deposit', 'Total Deposit', 'Amount'])),
      fieldHtml('paid', 'field.actuallyPaidAmount', 'number', getCol(rec, ['Paid Amt', 'Paid Amount', 'Amount Paid'])),
      fieldHtml('remarks', 'field.remarksNarrative', 'textarea', getCol(rec, ['Remarks / Vouchers', 'Remarks']))
    ].join('');
  },
  Creditor_Transactions(rec) {
    return [
      fieldHtml('date', 'field.transactionDate', 'date', formatDateInput(getCol(rec, ['Date']))),
      fieldHtml('main', 'field.creditorParentHead', 'text', getCol(rec, ['Creditor Parent Head', 'Parent Head', 'Main Head'])),
      fieldHtml('sub', 'field.subHeadMapping', 'text', getCol(rec, ['Sub Head', 'SubCategory'])),
      fieldHtml('received', 'field.receivedAmountCashIn', 'number', getCol(rec, ['Received Amount', 'Received Amt'])),
      fieldHtml('discount', 'field.discountAllowed', 'number', getCol(rec, ['Discount', 'Discount Allowed'])),
      fieldHtml('returned', 'field.returnAmountCashOut', 'number', getCol(rec, ['Return Amount', 'Return Amt'])),
      fieldHtml('due', 'field.transactionDueBalance', 'number', getCol(rec, ['Transaction Due', 'Txn Due']), 'readonly'),
      fieldHtml('remarks', 'field.remarksNarrative', 'textarea', getCol(rec, ['Remarks / Vouchers', 'Remarks']))
    ].join('');
  },
  Income_Transactions(rec) {
    return [
      fieldHtml('date', 'field.transactionDate', 'date', formatDateInput(getCol(rec, ['Date']))),
      fieldHtml('main', 'field.incomeParentHead', 'text', getCol(rec, ['Income Parent Head', 'Parent Head', 'Main Head'])),
      fieldHtml('sub', 'field.subHeadMapping', 'text', getCol(rec, ['Sub Head', 'SubCategory'])),
      fieldHtml('receivable', 'field.receivableAmountBilled', 'number', getCol(rec, ['Receivable Amount', 'Receivable'])),
      fieldHtml('discount', 'field.discountAllowed', 'number', getCol(rec, ['Discount', 'Discount Allowed'])),
      fieldHtml('received', 'field.actuallyReceivedCashIn', 'number', getCol(rec, ['Received Amount', 'Received Amt'])),
      fieldHtml('due', 'field.transactionDueBalance', 'number', getCol(rec, ['Transaction Due', 'Txn Due']), 'readonly'),
      fieldHtml('remarks', 'field.remarksNarrative', 'textarea', getCol(rec, ['Remarks / Vouchers', 'Remarks']))
    ].join('');
  },
  Capital_Transactions(rec) {
    return [
      fieldHtml('date', 'field.transactionDate', 'date', formatDateInput(getCol(rec, ['Date']))),
      fieldHtml('main', 'field.capitalParentHead', 'text', getCol(rec, ['Capital Parent Head', 'Parent Head', 'Main Head'])),
      fieldHtml('sub', 'field.subHeadMapping', 'text', getCol(rec, ['Sub Head', 'SubCategory'])),
      fieldHtml('capin', 'field.capitalInAmount', 'number', getCol(rec, ['Capital In Amount', 'Capital In Amt', 'Capital In'])),
      fieldHtml('discount', 'field.discountAllowed', 'number', getCol(rec, ['Discount', 'Discount Allowed'])),
      fieldHtml('capout', 'field.capitalOutAmount', 'number', getCol(rec, ['Capital Out Amount', 'Capital Out Amt', 'Capital Out'])),
      fieldHtml('due', 'field.transactionDueBalance', 'number', getCol(rec, ['Transaction Due', 'Txn Due', 'Transaction Net']), 'readonly'),
      fieldHtml('remarks', 'field.remarksNarrative', 'textarea', getCol(rec, ['Remarks / Vouchers', 'Remarks']))
    ].join('');
  }
};

function readField(key) {
  const el = document.querySelector(`#edit-txn-fields [data-field="${key}"]`);
  return el ? el.value : '';
}

function buildRowData(sheetName, original) {
  const user = fetchSessionUser();
  const stamp = new Date().toLocaleString();
  const loggedBy = getCol(original, ['Username', 'Logged By', 'Transferred By']) || user?.username || '';
  const date = readField('date');

  switch (sheetName) {
    case 'HR_Transactions':
      return [date, readField('employee'), parseFloat(readField('amount')) || 0, readField('category'), readField('remarks').trim(), loggedBy, stamp];
    case 'Supplier_Transactions': {
      const purchase = parseFloat(readField('purchase')) || 0;
      const discount = parseFloat(readField('discount')) || 0;
      const paid = parseFloat(readField('paid')) || 0;
      return [date, readField('supplier'), purchase, discount, paid, purchase - discount - paid, readField('remarks').trim(), loggedBy, stamp];
    }
    case 'Customer_Transactions': {
      const sold = parseFloat(readField('sold')) || 0;
      const discount = parseFloat(readField('discount')) || 0;
      const recv = parseFloat(readField('received')) || 0;
      return [date, readField('uid'), sold, discount, recv, readField('method'), sold - discount - recv, readField('remarks').trim(), loggedBy, stamp];
    }
    case 'Internal_Transfers':
      return [date, parseFloat(readField('amount')) || 0, readField('desc').trim(), loggedBy, stamp];
    case 'Expense_Transactions':
      return [date, readField('main'), readField('sub'), parseFloat(readField('deposit')) || 0, parseFloat(readField('paid')) || 0, readField('remarks').trim(), loggedBy, stamp];
    case 'Creditor_Transactions': {
      const received = parseFloat(readField('received')) || 0;
      const discount = parseFloat(readField('discount')) || 0;
      const returned = parseFloat(readField('returned')) || 0;
      return [date, readField('main'), readField('sub'), received, discount, returned, received - discount - returned, readField('remarks').trim(), loggedBy, stamp];
    }
    case 'Income_Transactions': {
      const receivable = parseFloat(readField('receivable')) || 0;
      const discount = parseFloat(readField('discount')) || 0;
      const received = parseFloat(readField('received')) || 0;
      return [date, readField('main'), readField('sub'), receivable, discount, received, receivable - discount - received, readField('remarks').trim(), loggedBy, stamp];
    }
    case 'Capital_Transactions': {
      const capin = parseFloat(readField('capin')) || 0;
      const discount = parseFloat(readField('discount')) || 0;
      const capout = parseFloat(readField('capout')) || 0;
      return [date, readField('main'), readField('sub'), capin, discount, capout, capin - discount - capout, readField('remarks').trim(), loggedBy, stamp];
    }
    default:
      return [];
  }
}

async function mutateRecord(action, sheetName, recordId, rowData) {
  const user = fetchSessionUser();
  if (!canAdminEdit(sheetName)) {
    alert(t('alert.unauthorized'));
    return { success: false };
  }
  return apiRequest({
    action,
    payload: {
      sheetName,
      recordId,
      id: recordId,
      rowData,
      actorUsername: user.username,
      actorRole: user.role
    }
  });
}

function openEditModal(sheetName, record) {
  const modal = document.getElementById('modal-txn-edit');
  const fields = document.getElementById('edit-txn-fields');
  if (!modal || !fields || !TXN_FORMS[sheetName]) return;

  fields.innerHTML = TXN_FORMS[sheetName](record);
  document.getElementById('edit-txn-id').value = getRecordId(record);
  document.getElementById('edit-txn-sheet').value = sheetName;
  modal.classList.remove('hidden');
  applyTranslations(fields);

  if (sheetName === 'Customer_Transactions') {
    bindDualDueSync(fields, ['sold', 'received'], 'due', 'discount');
  }
  if (sheetName === 'Supplier_Transactions') {
    bindDualDueSync(fields, ['purchase', 'paid'], 'due', 'discount');
  }
  if (sheetName === 'Creditor_Transactions') {
    bindDualDueSync(fields, ['received', 'returned'], 'due', 'discount');
  }
  if (sheetName === 'Income_Transactions') {
    bindDualDueSync(fields, ['receivable', 'received'], 'due', 'discount');
  }
  if (sheetName === 'Capital_Transactions') {
    bindDualDueSync(fields, ['capin', 'capout'], 'due', 'discount');
  }
}

function bindDualDueSync(fields, amountKeys, dueKey, discountKey) {
  const billEl = fields.querySelector(`[data-field="${amountKeys[0]}"]`);
  const payEl = fields.querySelector(`[data-field="${amountKeys[1]}"]`);
  const discEl = fields.querySelector(`[data-field="${discountKey}"]`);
  const dueEl = fields.querySelector(`[data-field="${dueKey}"]`);
  const syncDue = () => {
    if (dueEl) dueEl.value = ((parseFloat(billEl?.value) || 0) - (parseFloat(discEl?.value) || 0) - (parseFloat(payEl?.value) || 0)).toFixed(2);
  };
  billEl?.addEventListener('input', syncDue);
  payEl?.addEventListener('input', syncDue);
  discEl?.addEventListener('input', syncDue);
  syncDue();
}

function closeEditModal() {
  document.getElementById('modal-txn-edit')?.classList.add('hidden');
}

async function afterMutate(sheetName) {
  if (typeof reloadHandlers[sheetName] === 'function') await reloadHandlers[sheetName]();
  if (typeof onGlobalRefresh === 'function') await onGlobalRefresh();
  if (typeof onDrawerRefresh === 'function') await onDrawerRefresh();
}

async function handleEditSubmit(e) {
  e.preventDefault();
  const sheetName = document.getElementById('edit-txn-sheet').value;
  if (!canAdminEdit(sheetName)) return alert(t('alert.viewOnlyModule'));
  const recordId = document.getElementById('edit-txn-id').value;
  const original = findCachedTxn(sheetName, recordId);
  if (!original) return alert(t('alert.errorLoad'));

  const rowData = buildRowData(sheetName, original);
  try {
    const res = await mutateRecord('UPDATE_RECORD', sheetName, recordId, rowData);
    alert(res.message || (res.success ? t('alert.updateSuccess') : t('alert.errorLog')));
    if (res.success) {
      closeEditModal();
      await afterMutate(sheetName);
    }
  } catch (err) {
    console.error(err);
    alert(t('alert.errorLog'));
  }
}

async function handleDelete(sheetName, recordId) {
  if (!canAdminEdit(sheetName)) return alert(t('alert.viewOnlyModule'));
  if (!confirm(t('common.confirmDelete'))) return;

  try {
    const res = await mutateRecord('DELETE_RECORD', sheetName, recordId, null);
    alert(res.message || (res.success ? t('alert.deleteSuccess') : t('alert.deleteFailed')));
    if (res.success) await afterMutate(sheetName);
  } catch (err) {
    console.error(err);
    alert(t('alert.deleteFailed'));
  }
}

export function initTxnAdminSystem(options = {}) {
  reloadHandlers = options.reloadHandlers || {};
  onDrawerRefresh = options.onDrawerRefresh || null;
  onGlobalRefresh = options.onGlobalRefresh || null;

  if (document.body.dataset.txnAdminBound === 'true') return;
  document.body.dataset.txnAdminBound = 'true';

  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-txn-edit');
    if (editBtn) {
      const sheet = editBtn.dataset.sheet;
      const id = editBtn.dataset.id;
      const rec = findCachedTxn(sheet, id);
      if (rec) openEditModal(sheet, rec);
      return;
    }
    const delBtn = e.target.closest('.btn-txn-delete');
    if (delBtn) {
      handleDelete(delBtn.dataset.sheet, delBtn.dataset.id);
    }
  });

  document.getElementById('form-txn-edit')?.addEventListener('submit', handleEditSubmit);
  document.getElementById('close-txn-modal')?.addEventListener('click', closeEditModal);
  document.getElementById('btn-cancel-txn-edit')?.addEventListener('click', closeEditModal);
}
