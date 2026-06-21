import { apiRequest, fetchSessionUser, processLogout } from './auth.js';

function getUserField(rec, names) {
  for (const name of names) {
    const normName = String(name).toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (const key in rec) {
      if (String(key).toUpperCase().replace(/[^A-Z0-9]/g, '') === normName) return rec[key];
    }
  }
  return undefined;
}

export function normalizeUserPermissions(permissions) {
  if (!permissions) return [];
  const list = Array.isArray(permissions) ? permissions : String(permissions).split(',');
  return list.map((p) => String(p).trim().toLowerCase().replace(/\s+/g, '_')).filter(Boolean);
}

export function userCanAccessModule(user, moduleTarget) {
  if (!user) return false;
  if (user.role === 'Super Admin' || user.role === 'Admin') return true;
  const target = String(moduleTarget || '').trim().toLowerCase();
  if (!target) return false;
  const perms = normalizeUserPermissions(user.permissions);
  if (perms.includes('all')) return true;
  return perms.includes(target);
}

const MODULE_LOAD_ORDER = [
  'dashboard', 'hr', 'hr_transactions', 'customers', 'customer_transactions',
  'internal_transfer', 'suppliers', 'supplier_transactions', 'expense_heads',
  'expense_transactions', 'creditors', 'creditor_transactions', 'income_heads',
  'income_transactions', 'all_transactions', 'reports', 'users'
];

export function getDefaultModuleForUser(user) {
  if (!user) return null;
  for (const mod of MODULE_LOAD_ORDER) {
    if (userCanAccessModule(user, mod)) return mod;
  }
  return null;
}

export async function refreshSessionUser() {
  const current = fetchSessionUser();
  if (!current?.username) return null;

  try {
    const result = await apiRequest({ action: 'FETCH_RECORDS', payload: { sheetName: 'Users' } });
    if (!result.success || !Array.isArray(result.records)) return current;

    const username = String(current.username).trim().toLowerCase();
    const rec = result.records.find((r) => String(getUserField(r, ['Username']) || '').trim().toLowerCase() === username);
    if (!rec) return current;

    const status = String(getUserField(rec, ['Status', 'Account Status']) || 'Active').trim() || 'Active';
    if (status === 'Paused') {
      alert('Account paused. Contact your administrator.');
      processLogout();
      return null;
    }
    if (status === 'Removed') {
      alert('Account removed. Contact your administrator.');
      processLogout();
      return null;
    }

    const permsRaw = getUserField(rec, ['Permissions']);
    const permissions = String(permsRaw || '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const updated = {
      ...current,
      role: String(getUserField(rec, ['Role']) || current.role).trim(),
      permissions,
      status
    };
    localStorage.setItem('currentUser', JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Session refresh failed:', err);
    return current;
  }
}
