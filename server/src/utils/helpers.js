export function findColumnKey(record, names) {
  if (!record || typeof record !== 'object') return undefined;
  const targets = names.map((n) =>
    String(n || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
  );
  for (const key of Object.keys(record)) {
    const h = String(key)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    if (targets.includes(h)) return key;
  }
  return undefined;
}

export function getField(record, names) {
  const key = findColumnKey(record, names);
  return key !== undefined ? record[key] : undefined;
}

export function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

export function normalizeMobile(mobile) {
  return String(mobile || '').replace(/\D/g, '');
}

export function normalizeHrName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function normalizeSupplierName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function successResponse(data) {
  return { ...data, success: true, status: 'success' };
}

export function errorResponse(message) {
  return { success: false, status: 'error', message };
}
