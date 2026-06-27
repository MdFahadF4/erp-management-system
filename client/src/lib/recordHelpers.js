export function cln(s) {
  return String(s || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

export function getCol(rec, possibleNames) {
  if (!rec || typeof rec !== 'object') return undefined;
  for (const name of possibleNames) {
    const normName = String(name).toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (const key of Object.keys(rec)) {
      const normKey = String(key).toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (normName === normKey) return rec[key];
    }
  }
  return undefined;
}

export function gV(obj, names) {
  for (const k in obj) {
    const cK = cln(k);
    for (const n of names) if (cK === cln(n)) return obj[k];
  }
  return null;
}

export function roundMoney(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function gF(obj, names) {
  const v = parseFloat(gV(obj, names));
  return Number.isNaN(v) ? 0 : roundMoney(v);
}

export function fmtMoney(val) {
  return roundMoney(val).toFixed(2);
}
