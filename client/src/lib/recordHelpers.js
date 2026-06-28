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

export function toCents(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function fromCents(cents) {
  return cents / 100;
}

export function roundMoney(val) {
  return fromCents(toCents(val));
}

export function addMoney(a, b) {
  return fromCents(toCents(a) + toCents(b));
}

/** Parse form/input money safely (commas stripped, cent-rounded). */
export function parseMoneyInput(val) {
  if (val === undefined || val === null || val === '') return 0;
  const cleaned = String(val).replace(/,/g, '').trim();
  if (!cleaned) return 0;
  return roundMoney(parseFloat(cleaned) || 0);
}

/** Stop mouse-wheel from changing focused number inputs (common 3000 → 2999 accident). */
export function preventNumberWheelScroll(e) {
  e.currentTarget.blur();
}

/** Snap 1-cent float drift on billed/discount/paid ledgers (e.g. paid 300.01 on 300 bill). */
export function reconcileBillDiscPaid(billed, discount, paid) {
  let b = toCents(billed);
  let d = toCents(discount);
  let p = toCents(paid);
  let due = b - d - p;

  if (due < 0 && due >= -1) {
    p = b - d;
    due = 0;
  } else if (p % 100 === 99 && due > 0 && due % 100 === 1) {
    p += 1;
    due -= 1;
  }

  if (due < 0) due = 0;
  return {
    billed: fromCents(b),
    discount: fromCents(d),
    paid: fromCents(p),
    due: fromCents(due)
  };
}

/** Snap complementary .99 paid / .01 due pairs from float accumulation. */
export function reconcileEarnedPaid(earned, paid) {
  let e = toCents(earned);
  let p = toCents(paid);
  let d = e - p;

  if (d < 0) {
    p = e;
    d = 0;
  } else if (p % 100 === 99 && d > 0 && d % 100 === 1) {
    p += 1;
    d -= 1;
  }

  if (d < 0) d = 0;
  return {
    earned: fromCents(e),
    paid: fromCents(p),
    due: fromCents(d)
  };
}

/** Snap drawer balances affected by float drift (e.g. -199.99 → -200.00). */
export function reconcileDrawerBalance(balance) {
  let c = toCents(balance);
  if (Math.abs(c) <= 1) return 0;
  if (c < 0 && c % 100 === -99) c -= 1;
  if (c > 0 && c % 100 === 99) c += 1;
  return fromCents(c);
}

export function gF(obj, names) {
  const v = parseFloat(gV(obj, names));
  return Number.isNaN(v) ? 0 : roundMoney(v);
}

export function fmtMoney(val) {
  return roundMoney(val).toFixed(2);
}
