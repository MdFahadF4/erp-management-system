/**
 * User forgot-password recovery & admin user access control (Edit / Pause / Remove)
 */
import { apiRequest, fetchSessionUser } from './auth.js';
import { t, applyTranslations } from './i18n.js';
import { setupPasswordToggle, resetPasswordToggles } from './password-toggle.js';
import { parsePermissionMap, permNameToModuleKey } from './user-session.js';

export const USER_PERM_MODULES = [
  { perm: 'Dashboard', labelKey: 'users.permDashboard' },
  { perm: 'HR', labelKey: 'users.permHR' },
  { perm: 'HR_Transactions', labelKey: 'users.permHRTransactions' },
  { perm: 'Suppliers', labelKey: 'users.permSuppliers' },
  { perm: 'Supplier_Transactions', labelKey: 'users.permSupplierTransactions' },
  { perm: 'Customers', labelKey: 'users.permCustomers' },
  { perm: 'Customer_Transactions', labelKey: 'users.permCustomerTransactions' },
  { perm: 'Delivery_Dashboard', labelKey: 'users.permDeliveryDashboard' },
  { perm: 'Internal_Transfer', labelKey: 'users.permInternalTransfer' },
  { perm: 'Expense_Heads', labelKey: 'users.permExpenseHeads' },
  { perm: 'Expense_Transactions', labelKey: 'users.permExpenseLedger' },
  { perm: 'Creditors', labelKey: 'users.permCreditors' },
  { perm: 'Creditor_Transactions', labelKey: 'users.permCreditorTxns' },
  { perm: 'Income_Heads', labelKey: 'users.permIncomeHeads' },
  { perm: 'Income_Transactions', labelKey: 'users.permIncomeTxns' },
  { perm: 'All_Transactions', labelKey: 'users.permAllTransactions' },
  { perm: 'Reports', labelKey: 'users.permReports' }
];

let cachedUserRecords = [];
let onUserReload = null;

function getUserCol(rec, names) {
  for (const name of names) {
    const norm = String(name).toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (const key in rec) {
      if (String(key).toUpperCase().replace(/[^A-Z0-9]/g, '') === norm) return rec[key];
    }
  }
  return undefined;
}

function getUsername(rec) {
  return String(getUserCol(rec, ['Username']) || '').trim();
}

function getUserRole(rec) {
  return String(getUserCol(rec, ['Role']) || 'User').trim();
}

function getUserStatus(rec) {
  const s = String(getUserCol(rec, ['Status', 'Account Status']) || 'Active').trim();
  return s || 'Active';
}

function canManageUsers() {
  const u = fetchSessionUser();
  return !!(u && (u.role === 'Super Admin' || u.role === 'Admin'));
}

function canManageTarget(rec) {
  const actor = fetchSessionUser();
  if (!actor) return false;
  const targetRole = getUserRole(rec);
  if (targetRole === 'Super Admin' && actor.role !== 'Super Admin') return false;
  return true;
}

export function cacheUserRecords(records) {
  cachedUserRecords = records || [];
}

export function findCachedUser(username) {
  return cachedUserRecords.find((r) => getUsername(r).toLowerCase() === String(username).toLowerCase());
}

function statusBadge(status) {
  if (status === 'Paused') return `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">${t('users.statusPaused')}</span>`;
  if (status === 'Removed') return `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-200 text-gray-600">${t('users.statusRemoved')}</span>`;
  return `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-800">${t('users.statusActive')}</span>`;
}

function roleBadge(role) {
  const roleColor = role === 'Super Admin' ? 'bg-red-100 text-red-800' : (role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800');
  return `<span class="px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${roleColor}">${role}</span>`;
}

export function renderUserDirectoryRow(rec) {
  const username = getUsername(rec);
  const role = getUserRole(rec);
  const status = getUserStatus(rec);
  const mobile = getUserCol(rec, ['Mobile', 'Mobile Contact']) || '';
  const email = getUserCol(rec, ['Email', 'Email Address']) || '';
  const perms = getUserCol(rec, ['Permissions']) || t('users.noPermissions');
  const contact = [mobile, email].filter(Boolean).join(' · ') || '-';

  let actions = `<td class="p-3 text-gray-300 italic text-[10px]">${t('common.locked')}</td>`;
  if (canManageUsers() && canManageTarget(rec)) {
    const pauseBtn = status === 'Paused'
      ? `<button type="button" class="btn-user-resume bg-green-600 hover:bg-green-700 text-white font-bold px-2 py-0.5 rounded text-[10px] mr-1" data-username="${username}">${t('users.resume')}</button>`
      : `<button type="button" class="btn-user-pause bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10px] mr-1" data-username="${username}">${t('users.pause')}</button>`;
    actions = `<td class="p-3 whitespace-nowrap">
      <button type="button" class="btn-user-edit bg-orange-500 hover:bg-orange-600 text-white font-bold px-2 py-0.5 rounded text-[10px] mr-1" data-username="${username}">${t('common.edit')}</button>
      ${status !== 'Removed' ? pauseBtn : ''}
      ${status !== 'Removed' ? `<button type="button" class="btn-user-remove bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded text-[10px]" data-username="${username}">${t('users.remove')}</button>` : `<button type="button" class="btn-user-resume bg-green-600 hover:bg-green-700 text-white font-bold px-2 py-0.5 rounded text-[10px]" data-username="${username}">${t('users.reactivate')}</button>`}
    </td>`;
  }

  return `<tr class="hover:bg-gray-50 border-b">
    <td class="p-3 font-bold text-gray-900">${username}</td>
    <td class="p-3">${roleBadge(role)}</td>
    <td class="p-3">${statusBadge(status)}</td>
    <td class="p-3 text-[10px] text-gray-600 max-w-[140px] truncate" title="${contact}">${contact}</td>
    <td class="p-3 text-[10px] text-gray-500 leading-tight max-w-xs truncate break-words whitespace-normal font-mono">${perms}</td>
    ${actions}
  </tr>`;
}

export function buildPermCheckboxes(containerId, selectedCsv) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const selected = parsePermissionMap(selectedCsv);
  const header = `
    <div class="grid grid-cols-[1fr_auto_auto] gap-2 text-[10px] font-bold uppercase text-gray-500 border-b border-gray-200 pb-1 mb-1">
      <span data-i18n="users.menuScopes">Menu</span>
      <span class="text-center w-12" data-i18n="users.permView">View</span>
      <span class="text-center w-12" data-i18n="users.permEdit">Edit</span>
    </div>`;
  const rows = USER_PERM_MODULES.map(({ perm, labelKey }) => {
    const mod = permNameToModuleKey(perm);
    const access = selected[mod] || { view: false, edit: false };
    return `<div class="grid grid-cols-[1fr_auto_auto] gap-2 items-center py-0.5">
      <span class="leading-tight" data-i18n="${labelKey}">${t(labelKey)}</span>
      <label class="flex justify-center w-12"><input type="checkbox" name="${containerId}-view" value="${perm}" ${access.view ? 'checked' : ''}></label>
      <label class="flex justify-center w-12"><input type="checkbox" name="${containerId}-edit" value="${perm}" ${access.edit ? 'checked' : ''}></label>
    </div>`;
  }).join('');
  container.innerHTML = header + rows;
  applyTranslations(container);
}

export function readPermCheckboxes(containerId) {
  const views = Array.from(document.querySelectorAll(`#${containerId} input[name="${containerId}-view"]:checked`))
    .map((cb) => `${cb.value}:view`);
  const edits = Array.from(document.querySelectorAll(`#${containerId} input[name="${containerId}-edit"]:checked`))
    .map((cb) => `${cb.value}:edit`);
  return [...views, ...edits].join(',');
}

function openEditUserModal(rec) {
  const modal = document.getElementById('modal-user-edit');
  if (!modal || !canManageTarget(rec)) return;

  const username = getUsername(rec);
  document.getElementById('edit-user-username').value = username;
  document.getElementById('edit-user-mobile').value = getUserCol(rec, ['Mobile']) || '';
  document.getElementById('edit-user-email').value = getUserCol(rec, ['Email']) || '';
  document.getElementById('edit-user-role').value = getUserRole(rec) === 'Super Admin' ? 'Admin' : getUserRole(rec);
  document.getElementById('edit-user-role').disabled = getUserRole(rec) === 'Super Admin';
  document.getElementById('edit-user-status').value = getUserStatus(rec);
  document.getElementById('edit-user-password').value = '';
  buildPermCheckboxes('edit-user-perms', getUserCol(rec, ['Permissions']) || '');

  modal.classList.remove('hidden');
  applyTranslations(modal);
}

function closeEditUserModal() {
  document.getElementById('modal-user-edit')?.classList.add('hidden');
  resetPasswordToggles([
    ['toggle-edit-user-password', 'edit-user-password']
  ]);
}

async function updateUser(payload) {
  const actor = fetchSessionUser();
  if (!canManageUsers()) return alert(t('alert.unauthorized'));
  try {
    const res = await apiRequest({
      action: 'UPDATE_USER',
      payload: { ...payload, actorUsername: actor.username, actorRole: actor.role }
    });
    alert(res.message || (res.success ? t('users.updateSuccess') : t('users.updateFailed')));
    if (res.success) {
      closeEditUserModal();
      if (typeof onUserReload === 'function') await onUserReload();
    }
  } catch (err) {
    console.error('UPDATE_USER failed:', err);
    alert(t('users.updateFailed'));
  }
}

async function setUserStatus(username, status) {
  await updateUser({ username, status });
}

async function handleEditSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('edit-user-username').value;
  const payload = {
    username,
    role: document.getElementById('edit-user-role').value,
    permissions: readPermCheckboxes('edit-user-perms'),
    mobile: document.getElementById('edit-user-mobile').value.trim(),
    email: document.getElementById('edit-user-email').value.trim(),
    status: document.getElementById('edit-user-status').value
  };
  const newPwd = document.getElementById('edit-user-password').value;
  if (newPwd) payload.newPassword = newPwd;
  await updateUser(payload);
}

export function initUserAdminSystem(options = {}) {
  onUserReload = options.onReload || null;
  if (document.body.dataset.userAdminBound === 'true') return;
  document.body.dataset.userAdminBound = 'true';

  document.addEventListener('click', (e) => {
    if (e.target.id === 'close-user-modal' || e.target.id === 'btn-cancel-user-edit') {
      closeEditUserModal();
      return;
    }
    const editBtn = e.target.closest('.btn-user-edit');
    if (editBtn) {
      const rec = findCachedUser(editBtn.dataset.username);
      if (rec) openEditUserModal(rec);
      return;
    }
    const pauseBtn = e.target.closest('.btn-user-pause');
    if (pauseBtn) {
      if (!confirm(t('users.confirmPause'))) return;
      setUserStatus(pauseBtn.dataset.username, 'Paused');
      return;
    }
    const resumeBtn = e.target.closest('.btn-user-resume');
    if (resumeBtn) {
      setUserStatus(resumeBtn.dataset.username, 'Active');
      return;
    }
    const removeBtn = e.target.closest('.btn-user-remove');
    if (removeBtn) {
      if (!confirm(t('users.confirmRemove'))) return;
      setUserStatus(removeBtn.dataset.username, 'Removed');
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target?.id === 'form-edit-user') handleEditSubmit(e);
  });
}

export function initForgotPasswordSystem() {
  const link = document.getElementById('btn-forgot-password');
  const modal = document.getElementById('modal-forgot-password');
  const form = document.getElementById('form-forgot-password');
  if (!link || !modal || !form || form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  setupPasswordToggle('toggle-forgot-new', 'forgot-new-password');
  setupPasswordToggle('toggle-forgot-confirm', 'forgot-confirm-password');

  const closeForgotModal = () => {
    modal.classList.add('hidden');
    resetPasswordToggles([
      ['toggle-forgot-new', 'forgot-new-password'],
      ['toggle-forgot-confirm', 'forgot-confirm-password']
    ]);
  };

  link.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.remove('hidden');
    applyTranslations(modal);
  });

  document.getElementById('close-forgot-modal')?.addEventListener('click', closeForgotModal);
  document.getElementById('btn-cancel-forgot')?.addEventListener('click', closeForgotModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('forgot-username').value.trim();
    const mobile = document.getElementById('forgot-mobile').value.trim();
    const email = document.getElementById('forgot-email').value.trim();
    const newPwd = document.getElementById('forgot-new-password').value;
    const confirmPwd = document.getElementById('forgot-confirm-password').value;

    if (newPwd !== confirmPwd) return alert(t('users.passwordMismatch'));
    if (newPwd.length < 6) return alert(t('users.passwordMinLength'));

    try {
      const res = await apiRequest({
        action: 'RESET_PASSWORD',
        payload: { username, mobile, email, newPassword: newPwd }
      });
      alert(res.message || (res.success ? t('users.resetSuccess') : t('users.resetFailed')));
      if (res.success) {
        closeForgotModal();
        form.reset();
      }
    } catch (err) {
      console.error(err);
      alert(t('users.resetFailed'));
    }
  });
}
