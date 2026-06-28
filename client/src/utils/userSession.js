import { apiRequest, fetchSessionUser, processLogout } from '../services/auth.js';

export const MODULE_LOAD_ORDER = [
  'dashboard',
  'delivery_dashboard',
  'hr',
  'hr_transactions',
  'hr_factory',
  'customers',
  'customer_transactions',
  'internal_transfer',
  'internal_transfer_view',
  'suppliers',
  'supplier_transactions',
  'expense_heads',
  'expense_transactions',
  'creditors',
  'creditor_transactions',
  'income_heads',
  'income_transactions',
  'capital_heads',
  'capital_transactions',
  'all_transactions',
  'reports',
  'users'
];

export function permNameToModuleKey(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

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

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

function isAdminUser(user) {
  if (!user) return false;
  const r = normalizeRole(user.role);
  return r === 'super admin' || r === 'admin';
}

function getModuleAccess(user, moduleTarget) {
  if (!user) return { view: false, edit: false };
  if (isAdminUser(user)) return { view: true, edit: true };
  const target = permNameToModuleKey(moduleTarget);
  if (!target) return { view: false, edit: false };
  if (String(user.permissions || '').toLowerCase().includes('all')) {
    return { view: true, edit: true };
  }
  const perms = parsePermissionMap(user.permissions);
  const access = perms[target] || { view: false, edit: false };
  return { view: access.view || access.edit, edit: access.edit };
}

export function userCanAccessModule(user, moduleTarget) {
  return getModuleAccess(user, moduleTarget).view;
}

export function userCanEditModule(user, moduleTarget) {
  return getModuleAccess(user, moduleTarget).edit;
}

/** Edit/delete head structures — Admin and Super Admin only (not module editors). */
export function userCanAdminHeadActions(user) {
  return isAdminUser(user);
}

/** Edit/delete master records (HR, Customer, Supplier) — Admin and Super Admin only. */
export function userCanAdminMasterActions(user) {
  return isAdminUser(user);
}

/** Edit/delete from All Transaction View — Admin and Super Admin only. */
export function userCanAdminTxnActions(user) {
  return isAdminUser(user);
}

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

export function userCanEditTxnSheet(user, sheetName) {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  if (String(user.permissions || '').toLowerCase().includes('all')) return true;
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

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', group: 'dashboard' },
  { id: 'delivery_dashboard', label: 'Delivery Dashboard', indent: true, group: 'dashboard', accent: 'text-teal-300' },
  { id: 'hr', label: 'HR Management' },
  { id: 'hr_transactions', label: 'HR Transactions' },
  { id: 'hr_factory', label: 'HR Factory', accent: 'text-amber-300' },
  { id: 'customers', label: 'Customers' },
  { id: 'customer_transactions', label: 'Customer Transactions' },
  { id: 'internal_transfer', label: 'Internal Transfer', accent: 'text-emerald-400' },
  { id: 'internal_transfer_view', label: 'Internal Transfer View', accent: 'text-emerald-300', adminOnly: true },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'supplier_transactions', label: 'Supplier Transactions' },
  { id: 'expense_heads', label: 'Expense Heads' },
  { id: 'expense_transactions', label: 'Expense Transactions' },
  { id: 'creditors', label: 'Creditor Heads', accent: 'text-orange-400' },
  { id: 'creditor_transactions', label: 'Creditor Transactions', accent: 'text-orange-400' },
  { id: 'income_heads', label: 'Income Heads', accent: 'text-blue-400' },
  { id: 'income_transactions', label: 'Income Transactions', accent: 'text-blue-400' },
  { id: 'capital_heads', label: 'Capital Heads', accent: 'text-violet-400' },
  { id: 'capital_transactions', label: 'Capital Transactions', accent: 'text-violet-400' },
  { id: 'all_transactions', label: 'All Transaction View', bold: true },
  { id: 'reports', label: 'Reports System' },
  { id: 'users', label: 'User Access Control', accent: 'text-yellow-400', semibold: true, adminOnly: true }
];

export function getVisibleNavItems(user) {
  if (!user) return [];
  if (isAdminUser(user)) return NAV_ITEMS;
  const perms = Array.isArray(user.permissions) ? user.permissions.join(',') : String(user.permissions || '');
  if (perms.toLowerCase().includes('all')) {
    return NAV_ITEMS.filter((item) => !item.adminOnly);
  }

  return NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return false;
    if (item.group === 'dashboard') {
      if (item.id === 'dashboard') return userCanAccessModule(user, 'dashboard');
      if (item.id === 'delivery_dashboard') return userCanAccessModule(user, 'delivery_dashboard');
      return false;
    }
    return userCanAccessModule(user, item.id);
  });
}

function getUserField(rec, names) {
  for (const name of names) {
    const normName = String(name).toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (const key in rec) {
      if (String(key).toUpperCase().replace(/[^A-Z0-9]/g, '') === normName) return rec[key];
    }
  }
  return undefined;
}

export async function refreshSessionUser() {
  const current = fetchSessionUser();
  if (!current?.username) return null;

  try {
    const result = await apiRequest({ action: 'FETCH_RECORDS', payload: { sheetName: 'Users' } });
    if (!result.success || !Array.isArray(result.records)) return current;

    const username = String(current.username).trim().toLowerCase();
    const rec = result.records.find(
      (r) => String(getUserField(r, ['Username']) || '').trim().toLowerCase() === username
    );
    if (!rec) return current;

    const status = String(getUserField(rec, ['Status', 'Account Status']) || 'Active').trim() || 'Active';
    const statusKey = status.toLowerCase();
    if (statusKey === 'paused') {
      alert('Account paused. Contact your administrator.');
      processLogout();
      return null;
    }
    if (statusKey === 'removed') {
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
