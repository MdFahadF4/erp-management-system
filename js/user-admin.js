/**
 * User forgot-password recovery & admin user access control (Edit / Pause / Remove)
 */
import { apiRequest, fetchSessionUser } from './auth.js';
import { t, applyTranslations } from './i18n.js';
import { setupPasswordToggle, resetPasswordToggles } from './password-toggle.js';

const USER_PERM_VALUES = [
  'Dashboard', 'HR', 'HR_Transactions', 'Suppliers', 'Supplier_Transactions',
  'Customers', 'Customer_Transactions', 'Internal_Transfer', 'Expense_Heads',
  'Expense_Transactions', 'Creditors', 'Creditor_Transactions', 'Income_Heads',
  'Income_Transactions', 'All_Transactions', 'Reports'
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

function buildPermCheckboxes(containerId, selectedCsv) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const selected = new Set(String(selectedCsv || '').split(',').map((p) => p.trim()).filter(Boolean));
  container.innerHTML = USER_PERM_VALUES.map((val) => {
    const checked = selected.has(val) ? 'checked' : '';
    return `<label class="flex items-center space-x-2"><input type="checkbox" name="${containerId}-perm" value="${val}" ${checked}> <span>${val.replace(/_/g, ' ')}</span></label>`;
  }).join('');
}

function readPermCheckboxes(containerId) {
  return Array.from(document.querySelectorAll(`#${containerId} input[name="${containerId}-perm"]:checked`)).map((cb) => cb.value).join(',');
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
