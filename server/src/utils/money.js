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
