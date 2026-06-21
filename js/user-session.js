import { apiRequest, fetchSessionUser, processLogout } from './auth.js';

export const MODULE_LOAD_ORDER = [
  'dashboard', 'delivery_dashboard', 'hr', 'hr_transactions', 'customers', 'customer_transactions',
  'internal_transfer', 'suppliers', 'supplier_transactions', 'expense_heads',
  'expense_transactions', 'creditors', 'creditor_transactions', 'income_heads',
  'income_transactions', 'capital_heads', 'capital_transactions', 'all_transactions', 'reports', 'users'
];

export const SHEET_TO_MODULE = {
  HR_Transactions: 'hr_transactions',
  Supplier_Transactions: 'supplier_transactions',
  Customer_Transactions: 'customer_transactions',
  Internal_Transfers: 'internal_transfer',
  Expense_Transactions: 'expense_transactions',
  Creditor_Transactions: 'creditor_transactions',
  Income_Transactions: 'income_transactions',
  Capital_Transactions: 'capital_transactions'
};

function getUserField(rec, names) {
  for (const name of names) {
    const normName = String(name).toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (const key in rec) {
      if (String(key).toUpperCase().replace(/[^A-Z0-9]/g, '') === normName) return rec[key];
    }
  }
  return undefined;
}

export function permNameToModuleKey(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, '_');
}

/** @returns {Record<string, { view: boolean, edit: boolean }>} */
export function parsePermissionMap(permissions) {
  const map = {};
  const list = Array.isArray(permissions) ? permissions : String(permissions || '').split(',');
  for (const entry of list) {
    const raw = String(entry).trim();
    if (!raw) continue;
    const colonIdx = raw.indexOf(':');
    if (colonIdx === -1) {
      const mod = permNameToModuleKey(raw);
      if (!mod || mod === 'all') continue;
      if (!map[mod]) map[mod] = { view: false, edit: false };
      map[mod].view = true;
      map[mod].edit = true;
      continue;
    }
    const mod = permNameToModuleKey(raw.slice(0, colonIdx));
    const level = raw.slice(colonIdx + 1).trim().toLowerCase();
    if (!mod) continue;
    if (!map[mod]) map[mod] = { view: false, edit: false };
    if (level === 'view') map[mod].view = true;
    else if (level === 'edit') map[mod].edit = true;
  }
  return map;
}

export function normalizeUserPermissions(permissions) {
  const map = parsePermissionMap(permissions);
  const tokens = [];
  for (const [mod, access] of Object.entries(map)) {
    if (access.view) tokens.push(`${mod}:view`);
    if (access.edit) tokens.push(`${mod}:edit`);
  }
  return tokens;
}

function isAdminUser(user) {
  return !!(user && (user.role === 'Super Admin' || user.role === 'Admin'));
}

function getModuleAccess(user, moduleTarget) {
  if (!user) return { view: false, edit: false };
  if (isAdminUser(user)) return { view: true, edit: true };
  const target = permNameToModuleKey(moduleTarget);
  if (!target) return { view: false, edit: false };
  const perms = parsePermissionMap(user.permissions);
  if (String(user.permissions || '').toLowerCase().includes('all')) {
    return { view: true, edit: true };
  }
  const access = perms[target] || { view: false, edit: false };
  return {
    view: access.view || access.edit,
    edit: access.edit
  };
}

export function userCanViewModule(user, moduleTarget) {
  return getModuleAccess(user, moduleTarget).view;
}

export function userCanEditModule(user, moduleTarget) {
  return getModuleAccess(user, moduleTarget).edit;
}

export function userCanAccessModule(user, moduleTarget) {
  return userCanViewModule(user, moduleTarget);
}

export function userCanEditTxnSheet(user, sheetName) {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  const mod = SHEET_TO_MODULE[sheetName];
  return mod ? userCanEditModule(user, mod) : false;
}

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
