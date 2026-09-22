const KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function toKey(year, month, day) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function keyToYMD(key) {
  const m = KEY_RE.exec(key);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) {
    return null;
  }
  return { year, month, day };
}

export function keyToDate(key) {
  const p = keyToYMD(key);
  if (!p) return null;
  return new Date(p.year, p.month, p.day);
}

export function daysBetween(a, b) {
  const da = keyToDate(a);
  const db = keyToDate(b);
  if (!da || !db) return NaN;
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export function dateToKey(date) {
  return toKey(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(key, delta) {
  const d = keyToDate(key);
  if (!d) return key;
  d.setDate(d.getDate() + delta);
  return dateToKey(d);
}

export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function addMonths(year, month, delta) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function isWeekend(year, month, day) {
  const dow = new Date(year, month, day).getDay();
  return dow === 0 || dow === 6;
}

export function monthTitle(year, month) {
  return `${MONTH_NAMES[month]} ${year}`;
}

/** "24 Aug" */
export function shortDate(key) {
  const p = keyToYMD(key);
  if (!p) return key;
  return `${p.day} ${MONTH_NAMES[p.month].slice(0, 3)}`;
}
