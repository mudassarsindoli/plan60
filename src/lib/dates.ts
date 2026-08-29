export interface YearMonth {
  year: number;
  month: number;
}

export interface YMD {
  year: number;
  month: number;
  day: number;
}

const KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toKey(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function keyToYMD(key: string): YMD | null {
  const m = KEY_RE.exec(key);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) {
    return null; // rejects impossible calendar days like Feb 30
  }
  return { year, month, day };
}

export function keyToDate(key: string): Date | null {
  const p = keyToYMD(key);
  if (!p) return null;
  return new Date(p.year, p.month, p.day);
}

/** Calendar-day difference from `a` to `b` (0 if the same day). */
export function daysBetween(a: string, b: string): number {
  const da = keyToDate(a);
  const db = keyToDate(b);
  if (!da || !db) return NaN;
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export function dateToKey(date: Date): string {
  return toKey(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isValidKey(key: string): boolean {
  const p = keyToYMD(key);
  if (!p) return false;
  const d = new Date(p.year, p.month, p.day);
  return d.getFullYear() === p.year && d.getMonth() === p.month && d.getDate() === p.day;
}

/** Add `delta` calendar days to a date key, handling month/year rollover. */
export function addDays(key: string, delta: number): string {
  const d = keyToDate(key);
  if (!d) return key;
  d.setDate(d.getDate() + delta);
  return dateToKey(d);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function addMonths(year: number, month: number, delta: number): YearMonth {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function isWeekend(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month, day).getDay();
  return dow === 0 || dow === 6;
}

/** Sort helper for date keys. */
export function compareKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthTitle(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month].slice(0, 3)} ${year}`;
}

/** "24 Aug" */
export function shortDate(key: string): string {
  const p = keyToYMD(key);
  if (!p) return key;
  return `${p.day} ${MONTH_NAMES[p.month].slice(0, 3)}`;
}

/** "Mon, 24 Aug" */
export function weekdayDate(key: string): string {
  const p = keyToYMD(key);
  if (!p) return key;
  const dow = new Date(p.year, p.month, p.day).getDay();
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${names[dow]}, ${p.day} ${MONTH_NAMES[p.month].slice(0, 3)}`;
}

/** "24 Aug 2026" */
export function fullDate(key: string): string {
  const p = keyToYMD(key);
  if (!p) return key;
  return `${p.day} ${MONTH_NAMES[p.month].slice(0, 3)} ${p.year}`;
}